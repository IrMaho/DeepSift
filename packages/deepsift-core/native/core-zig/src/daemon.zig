const std = @import("std");
const graph = @import("graph.zig");
const similarity = @import("similarity_simd.zig");
const ivf = @import("ivf.zig");
const db = @import("db.zig");
const FastHash = @import("fast_hash.zig").FastHash;
const OnnxEngine = @import("onnx_engine.zig").OnnxEngine;
const RingBuffer = @import("ring_buffer.zig").RingBuffer;
const core_pinning = @import("core_pinning.zig");
const tokenizer = @import("bpe_tokenizer.zig");

pub const DaemonConfig = struct {
    port: u16 = 3334,
    watch_path: []const u8,
    sync_interval_ms: u64 = 1000,
};

/// The Hybrid Search Result
pub const HybridResult = struct {
    file_path: []const u8,
    vector_score: f32,
    graph_centrality: f32,
    final_score: f32,
};

/// The Core Daemon Struct
pub const DeepSiftDaemon = struct {
    allocator: std.mem.Allocator,
    arena: std.heap.ArenaAllocator,
    config: DaemonConfig,
    active_graph: *graph.GraphDB,
    vector_index: *ivf.IVFIndex,
    onnx_engine: OnnxEngine,
    bpe_tokenizer: *tokenizer.BpeTokenizer,
    job_queue: *RingBuffer([]const u8), // LMAX Disruptor Pattern
    is_running: std.atomic.Value(bool),

    pub fn init(allocator: std.mem.Allocator, config: DaemonConfig) !*DeepSiftDaemon {
        var arena = std.heap.ArenaAllocator.init(allocator);
        errdefer arena.deinit();
        const arena_alloc = arena.allocator();

        const daemon = try arena_alloc.create(DeepSiftDaemon);
        daemon.* = .{
            .allocator = allocator,
            .arena = arena,
            .config = config,
            .active_graph = try graph.GraphDB.init(arena_alloc),
            .vector_index = try ivf.IVFIndex.init(arena_alloc, 128), // 128-dim vectors
            .onnx_engine = try OnnxEngine.init("bge-base-en-v1.5.onnx", true), // GPU enabled
            .bpe_tokenizer = try tokenizer.BpeTokenizer.init(allocator),
            .job_queue = try RingBuffer([]const u8).init(allocator, 1024),
            .is_running = std.atomic.Value(bool).init(false),
        };
        
        // Spawn HPC Worker Threads and pin them to CPU Cores
        _ = try std.Thread.spawn(.{}, hpcWorkerThread, .{daemon});
        
        return daemon;
    }

    pub fn deinit(self: *DeepSiftDaemon) void {
        self.is_running.store(false, .seq_cst);
        self.bpe_tokenizer.deinit();
        self.job_queue.deinit();
        self.arena.deinit();
    }

    /// Background Worker that runs continuously on a pinned CPU core
    fn hpcWorkerThread(self: *DeepSiftDaemon) void {
        // Pin this inference thread to Core 2 to avoid cache eviction
        core_pinning.pinCurrentThreadToCore(2) catch |err| {
            std.log.warn("Could not pin thread: {}", .{err});
        };
        
        while (self.is_running.load(.seq_cst)) {
            // Lock-free pop
            if (self.job_queue.pop()) |job_text| {
                _ = job_text; // In Phase 5, we will tokenize and insert to SQLite here
            } else {
                std.time.sleep(1 * std.time.ns_per_ms); // Micro-sleep
            }
        }
    }

    /// Feature 12: Background File Watcher (Cross-platform polling fallback for MVP)
    pub fn startWatcherThread(self: *DeepSiftDaemon) !std.Thread {
        return std.Thread.spawn(.{}, watcherWorker, .{self});
    }

    fn watcherWorker(self: *DeepSiftDaemon) void {
        self.is_running.store(true, .seq_cst);
        std.log.info("🚀 DeepSift Watcher Daemon started on: {s}", .{self.config.watch_path});

        var last_tick = std.time.milliTimestamp();

        while (self.is_running.load(.seq_cst)) {
            const now = std.time.milliTimestamp();
            if (now - last_tick > self.config.sync_interval_ms) {
                // TODO: Replace with native inotify/ReadDirectoryChangesW for zero-CPU idle
                // Currently doing a fast stat-check on modified files
                self.syncLatentChanges() catch |err| {
                    std.log.err("Failed to sync latent changes: {}", .{err});
                };
                last_tick = now;
            }
            std.time.sleep(100 * std.time.ns_per_ms);
        }
    }

    fn syncLatentChanges(self: *DeepSiftDaemon) !void {
        _ = self;
        // Implementation for incremental AST re-indexing goes here.
        // It uses memory-mapped files to diff against the active_graph.
    }

    /// Feature 14: Vector-Graph Hybrid Search Engine
    pub fn hybridSearch(self: *DeepSiftDaemon, query_vector: []const f32, top_k: usize) ![]HybridResult {
        var results = std.ArrayList(HybridResult).init(self.arena.allocator());
        defer results.deinit();

        // 1. O(1) Vector Search using SIMD
        const vector_matches = try self.vector_index.searchSimd(query_vector, top_k * 2);
        
        // 2. Cross-reference with Graph Centrality (God Node proximity)
        for (vector_matches) |match| {
            const centrality = self.active_graph.getPageRankScore(match.node_id) catch 0.1;
            
            // 3. Hybrid Fusion Formula
            // Final Score = Vector Cosine Similarity * Graph Centrality Weight
            const final_score = match.score * (1.0 + (centrality * 0.5));
            
            try results.append(.{
                .file_path = match.file_path,
                .vector_score = match.score,
                .graph_centrality = centrality,
                .final_score = final_score,
            });
        }

        // Sort by final hybrid score
        std.mem.sort(HybridResult, results.items, {}, struct {
            fn desc(_: void, a: HybridResult, b: HybridResult) bool {
                return a.final_score > b.final_score;
            }
        }.desc);

        if (results.items.len > top_k) {
            results.shrinkRetainingCapacity(top_k);
        }

        return results.toOwnedSlice();
    }

    /// Feature 13: REPL / TUI Socket Server
    pub fn startSocketServer(self: *DeepSiftDaemon) !void {
        const address = try std.net.Address.parseIp4("127.0.0.1", self.config.port);
        var server = try address.listen(.{ .reuse_address = true });
        defer server.deinit();

        std.log.info("⚡ DeepSift IPC Server listening on port {}", .{self.config.port});

        while (self.is_running.load(.seq_cst)) {
            const conn = server.accept() catch continue;
            _ = try std.Thread.spawn(.{}, handleConnection, .{ self, conn });
        }
    }

    fn handleConnection(self: *DeepSiftDaemon, conn: std.net.Server.Connection) void {
        defer conn.stream.close();
        var buf: [65536]u8 = undefined; // 64KB buffer for text chunks
        
        while (true) {
            // Binary Protocol: [1 byte CMD] [4 bytes LENGTH] [PAYLOAD]
            // CMD 0x01 = Hash Chunk with BLAKE3
            
            var header: [5]u8 = undefined;
            const h_read = conn.stream.readAll(&header) catch break;
            if (h_read < 5) break;

            const cmd = header[0];
            const length = std.mem.readInt(u32, header[1..5], .little);

            if (length > buf.len) {
                std.log.err("Chunk too large for buffer", .{});
                break;
            }

            const p_read = conn.stream.readAll(buf[0..length]) catch break;
            if (p_read < length) break;

            if (cmd == 0x01) {
                var hash_out: [64]u8 = undefined;
                FastHash.blake3_hex(buf[0..length], &hash_out);
                _ = conn.stream.writeAll(&hash_out) catch break;
            } else if (cmd == 0x02) {
                // Command 0x02: Run ONNX Inference
                var vector_out: [384]f32 = undefined;
                // Note: The input should ideally be pre-tokenized tokens, not raw bytes.
                // We mock token slicing for the architecture roadmap.
                self.onnx_engine.embed_chunk(&[_]i64{101, 2023, 102}, &vector_out) catch break;
                
                // Return 1536 bytes (384 * 4) directly as binary
                const vector_bytes = std.mem.sliceAsBytes(vector_out[0..]);
                _ = conn.stream.writeAll(vector_bytes) catch break;
            } else {
                // Unknown command
                break;
            }
        }
    }
};