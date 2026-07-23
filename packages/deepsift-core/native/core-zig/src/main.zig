const std = @import("std");
const db = @import("db.zig");
const graph = @import("graph.zig");
const realm_mod = @import("realm.zig");
const search_engine = @import("search_engine.zig");
const tokenizer = @import("tokenizer.zig");
const walker = @import("walker.zig");
const similarity = @import("similarity.zig");
const property_miner = @import("property_miner.zig");
const test_analyzer = @import("test_analyzer.zig");
const calltree = @import("calltree.zig");
const cfg = @import("cfg.zig");
const outline = @import("outline.zig");
const memo_graph = @import("memo_graph.zig");
const l10n = @import("l10n.zig");
const resource_mapper = @import("resource_mapper.zig");
const dead_code = @import("dead_code.zig");
const toon = @import("toon.zig");
const dec_renderer = @import("dec_renderer.zig");

const BatchOperation = struct {
    action: []const u8,
    metadata: ?db.FileMetadata = null,
    filePath: ?[]const u8 = null,
    chunks: ?[]db.Chunk = null,
};

const Request = struct {
    id: ?usize = null,
    action: []const u8,
    dbPath: []const u8,
    graphDbPath: ?[]const u8 = null,
    realmId: ?[]const u8 = null,
    projectPath: ?[]const u8 = null,
    metadata: ?db.FileMetadata = null,
    filePath: ?[]const u8 = null,
    chunks: ?[]db.Chunk = null,
    ids: ?[][]const u8 = null,
    query: ?[]const u8 = null,
    content: ?[]const u8 = null,
    symbol: ?[]const u8 = null,
    key: ?[]const u8 = null,
    value: ?[]const u8 = null,
    topK: ?usize = null,
    minLines: ?u32 = null,
    threshold: ?f32 = null,
    width: ?u32 = null,
    height: ?u32 = null,
    queryEmbedding: ?[db.VECTOR_BQ_U32_COUNT]u32 = null,
    batch: ?[]BatchOperation = null,
    
    notes: ?[]memo_graph.NoteInfo = null,
    symbols: ?[]dead_code.SymbolUsage = null,
    contents: ?[][]const u8 = null,
    headers: ?[][]const u8 = null,
    rows: ?[][][]const u8 = null,

    graphNodes: ?[]db.GraphNode = null,
    graphEdges: ?[]db.GraphEdge = null,
    startNodes: ?[]u32 = null,
    depth: ?u32 = null,
    hubThreshold: ?u32 = null,
};

const ResponseOk = struct {
    id: ?usize = null,
    success: bool = true,
};

const ResponseError = struct {
    id: ?usize = null,
    success: bool = false,
    message: []const u8,
};

const MetadataResponse = struct {
    success: bool = true,
    data: ?db.FileMetadata,
};

const AllMetadataResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const db.FileMetadata,
};

const ChunksResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const db.Chunk,
};

pub const ChunkEmbedding = struct { id: []const u8, embedding: [db.VECTOR_BQ_U32_COUNT]u32 };
const ChunkEmbeddingsResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const ChunkEmbedding,
};

const StatusResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: struct {
        totalFiles: u32,
        totalChunks: u32,
        lastUpdated: i64,
        isIndexing: bool,
    },
};

const SearchMatch = struct {
    id: []const u8,
    filePath: []const u8,
    content: []const u8,
    startLine: u32,
    endLine: u32,
    type: []const u8,
    language: []const u8,
    score: f32,
    matchType: []const u8,
};

const SearchResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const SearchMatch,
};

const SymbolsResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const tokenizer.SymbolInfo,
};

const ClonesResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const tokenizer.CloneBlock,
};

const WalkResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const walker.FileWalkInfo,
};

const SimilarityResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const similarity.SimilarityPair,
};

const ColorTokensResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const property_miner.ColorToken,
};

const ConventionsResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: property_miner.NamingConventionStats,
};

const CoverageResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const test_analyzer.CoverageInfo,
};

const CallTreeResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const calltree.CallLink,
};

const CFGResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const cfg.CFGBranch,
};

const OutlineResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: outline.FileCategoryInfo,
};

const NoteEdgesResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const memo_graph.NoteEdge,
};

const L10nKeysResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const l10n.L10nKey,
};

const ResourcesResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const resource_mapper.ResourceRef,
};

const DeadCodeResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const dead_code.DeadSymbol,
};

const ToonResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const u8,
};

const BitmapResponse = struct {
    id: ?usize = null,
    success: bool = true,
    data: []const u8,
};

fn countKeywordMatches(content: []const u8, file_path: []const u8, query: []const u8) f32 {
    if (query.len == 0) return 0.0;

    var k_score: f32 = 0.0;
    var it = std.mem.tokenizeAny(u8, query, " \t\n\r");
    
    var token_count: f32 = 0.0;
    while (it.next()) |token| {
        if (token.len < 2) continue; // skip very short tokens
        token_count += 1.0;
        
        var token_score: f32 = 0.0;
        
        if (file_path.len >= token.len) {
            var i: usize = 0;
            while (i + token.len <= file_path.len) {
                var match = true;
                for (0..token.len) |j| {
                    if (std.ascii.toLower(file_path[i + j]) != std.ascii.toLower(token[j])) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    token_score += 2.0;
                    break;
                }
                i += 1;
            }
        }

        if (content.len >= token.len) {
            var matches: u32 = 0;
            var i: usize = 0;
            while (i + token.len <= content.len) {
                var match = true;
                for (0..token.len) |j| {
                    if (std.ascii.toLower(content[i + j]) != std.ascii.toLower(token[j])) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    matches += 1;
                    i += token.len;
                } else {
                    i += 1;
                }
            }
            token_score += @as(f32, @floatFromInt(matches)) * 0.1;
        }
        
        k_score += token_score;
    }
    
    // Exact phrase bonus
    if (content.len >= query.len and query.len > 0) {
        var exact_matches: u32 = 0;
        var i: usize = 0;
        while (i + query.len <= content.len) {
            var match = true;
            for (0..query.len) |j| {
                if (std.ascii.toLower(content[i + j]) != std.ascii.toLower(query[j])) {
                    match = false;
                    break;
                }
            }
            if (match) {
                exact_matches += 1;
                i += query.len;
            } else {
                i += 1;
            }
        }
        k_score += @as(f32, @floatFromInt(exact_matches)) * 0.5;
    }

    return k_score;
}

const RankedChunk = struct {
    chunk_index: usize,
    keyword_score: f32,
};

fn compareRankedChunks(_: void, a: RankedChunk, b: RankedChunk) bool {
    return a.keyword_score > b.keyword_score;
}

fn hammingSimilarity(a: [db.VECTOR_BQ_U32_COUNT]u32, b: [db.VECTOR_BQ_U32_COUNT]u32) f32 {
    var distance: u32 = 0;
    for (0..db.VECTOR_BQ_U32_COUNT) |i| {
        distance += @popCount(a[i] ^ b[i]);
    }
    return 1.0 - @as(f32, @floatFromInt(distance)) / @as(f32, @floatFromInt(db.VECTOR_DIM));
}

fn writeResponse(allocator: std.mem.Allocator, writer: *std.Io.Writer, value: anytype) !void {
    const str = try std.json.Stringify.valueAlloc(allocator, value, .{});
    defer allocator.free(str);
    try writer.writeAll(str);
    try writer.writeAll("\n"); // Add newline to ensure flushed stream
}

pub fn main() !void {
    const allocator = std.heap.page_allocator;

    var threaded_io = std.Io.Threaded.init(allocator, .{});
    defer threaded_io.deinit();
    const io = threaded_io.io();

    var in_buf: [65536]u8 = undefined;
    const stdin = std.Io.File.stdin();
    var reader = stdin.reader(io, &in_buf);
    
    var out_buf: [65536]u8 = undefined;
    const stdout = std.Io.File.stdout();
    var writer = stdout.writer(io, &out_buf);

    var database = db.Database.init(allocator);
    defer database.deinit();

    var graph_db = db.GraphDatabase.init(allocator);
    defer graph_db.deinit();

    var req_arena = std.heap.ArenaAllocator.init(allocator);
    defer req_arena.deinit();
    const req_allocator = req_arena.allocator();

    while (true) {
        _ = req_arena.reset(.retain_capacity);
        var input_array = std.ArrayList(u8).empty;

        while (true) {
            var byte: [1]u8 = undefined;
            const bytes_read = reader.interface.readSliceShort(&byte) catch {
                break;
            };
            if (bytes_read == 0) {
                if (input_array.items.len == 0) return; // EOF
                break;
            }
            if (byte[0] == '\n') break;
            try input_array.append(req_allocator, byte[0]);
            if (input_array.items.len > 1024 * 1024 * 200) return error.FileTooBig;
        }

        const input_data = input_array.items;
        if (input_data.len == 0) continue;

        const parsed = std.json.parseFromSlice(Request, req_allocator, input_data, .{ .ignore_unknown_fields = true }) catch {
            try writeResponse(allocator, &writer.interface, ResponseError{ .id = null, .message = "Invalid JSON" });
            try writer.flush();
            continue;
        };

        const req = parsed.value;
        const req_id = req.id;

        const resolved_db_path: []const u8 = req.dbPath;
        const resolved_graph_path: ?[]const u8 = req.graphDbPath;

        database.loadFromFile(io, resolved_db_path) catch {};

        var graph_modified = false;
        if (resolved_graph_path) |graphPath| {
            graph_db.loadFromFile(io, graphPath) catch {};
        }

        var modified = false;

        if (std.mem.eql(u8, req.action, "saveGraph")) {
            if (req.graphNodes) |nodes| {
                graph_db.reset();
                try graph_db.nodes.appendSlice(allocator, nodes);
            }
            if (req.graphEdges) |edges| {
                try graph_db.edges.appendSlice(allocator, edges);
            }
            graph_modified = true;
            try writeResponse(allocator, &writer.interface, ResponseOk{ .id = req_id });
        } else if (std.mem.eql(u8, req.action, "saveMetadata")) {
            if (req.metadata) |m| {
                try database.addMetadata(m);
                modified = true;
                try writeResponse(allocator, &writer.interface, ResponseOk{ .id = req_id });
            }
        } else if (std.mem.eql(u8, req.action, "getMetadata")) {
            var found: ?db.FileMetadata = null;
            if (req.filePath) |fp| {
                if (database.metadata.get(fp)) |m| found = m;
            }
            try writeResponse(allocator, &writer.interface, MetadataResponse{ .data = found });
        } else if (std.mem.eql(u8, req.action, "getAllMetadata")) {
            var results = std.ArrayList(db.FileMetadata).empty;
            defer results.deinit(allocator);
            var it = database.metadata.iterator();
            while (it.next()) |entry| {
                try results.append(allocator, entry.value_ptr.*);
            }
            try writeResponse(allocator, &writer.interface, AllMetadataResponse{ .id = req_id, .data = results.items });
        } else if (std.mem.eql(u8, req.action, "deleteFileChunks")) {
            if (req.filePath) |fp| {
                database.deleteFileChunks(fp);
                modified = true;
                try writeResponse(allocator, &writer.interface, ResponseOk{ .id = req_id });
            }
        } else if (std.mem.eql(u8, req.action, "saveChunks")) {
            if (req.chunks) |chunks| {
                for (chunks) |c| {
                    try database.addChunk(c);
                }
                modified = true;
                try writeResponse(allocator, &writer.interface, ResponseOk{ .id = req_id });
            }
        } else if (std.mem.eql(u8, req.action, "batchExecute")) {
            if (req.batch) |batch| {
                for (batch) |op| {
                    if (std.mem.eql(u8, op.action, "saveMetadata")) {
                        if (op.metadata) |m| {
                            try database.addMetadata(m);
                            modified = true;
                        }
                    } else if (std.mem.eql(u8, op.action, "deleteFileChunks")) {
                        if (op.filePath) |fp| {
                            database.deleteFileChunks(fp);
                            modified = true;
                        }
                    } else if (std.mem.eql(u8, op.action, "saveChunks")) {
                        if (op.chunks) |chunks| {
                            for (chunks) |c| {
                                try database.addChunk(c);
                            }
                            modified = true;
                        }
                    }
                }
                try writeResponse(allocator, &writer.interface, ResponseOk{ .id = req_id });
            } else {
                try writeResponse(allocator, &writer.interface, ResponseError{ .id = req_id, .message = "Missing batch operations array" });
            }
        } else if (std.mem.eql(u8, req.action, "getAllChunks")) {
            try writeResponse(allocator, &writer.interface, ChunksResponse{ .id = req_id, .data = database.chunks.items });
        } else if (std.mem.eql(u8, req.action, "getChunkEmbeddings")) {
            var results = std.ArrayList(ChunkEmbedding).empty;
            defer results.deinit(allocator);
            for (database.chunks.items) |c| {
                try results.append(allocator, .{ .id = c.id, .embedding = c.embedding });
            }
            try writeResponse(allocator, &writer.interface, ChunkEmbeddingsResponse{ .id = req_id, .data = results.items });
        } else if (std.mem.eql(u8, req.action, "getStatus")) {
            var last_updated: i64 = 0;
            var it = database.metadata.iterator();
            while (it.next()) |entry| {
                if (entry.value_ptr.last_indexed > last_updated) {
                    last_updated = entry.value_ptr.last_indexed;
                }
            }
            try writeResponse(allocator, &writer.interface, StatusResponse{ .id = req_id, .data = .{
                    .totalFiles = @intCast(database.metadata.count()),
                    .totalChunks = @intCast(database.chunks.items.len),
                    .lastUpdated = last_updated,
                    .isIndexing = false,
                }
            });
        } else if (std.mem.eql(u8, req.action, "searchKeyword")) {
            const top_k = req.topK orelse 20;
            var results = std.ArrayList(RankedChunk).empty;
            defer results.deinit(allocator);

            for (database.chunks.items, 0..) |chunk, i| {
                var k_score: f32 = 0.0;
                if (req.query) |q| {
                    k_score = countKeywordMatches(chunk.content, chunk.file_path, q);
                }

                if (k_score > 0.0) {
                    try results.append(allocator, .{
                        .chunk_index = i,
                        .keyword_score = k_score,
                    });
                }
            }

            std.sort.pdq(RankedChunk, results.items, {}, compareRankedChunks);

            const count = @min(top_k, results.items.len);
            var final_matches = try allocator.alloc(SearchMatch, count);
            defer allocator.free(final_matches);

            for (0..count) |i| {
                const rc = results.items[i];
                const c = database.chunks.items[rc.chunk_index];
                final_matches[i] = .{
                    .id = c.id,
                    .filePath = c.file_path,
                    .content = c.content,
                    .startLine = c.start_line,
                    .endLine = c.end_line,
                    .type = c.chunk_type,
                    .language = c.language,
                    .score = rc.keyword_score,
                    .matchType = "keyword",
                };
            }
            try writeResponse(allocator, &writer.interface, SearchResponse{ .id = req_id, .data = final_matches });
        } else if (std.mem.eql(u8, req.action, "searchSemantic")) {
            const top_k = req.topK orelse 20;
            if (req.queryEmbedding) |qe| {
                var results = std.ArrayList(RankedChunk).empty;
                defer results.deinit(allocator);

                for (database.chunks.items, 0..) |chunk, ci| {
                    const score = hammingSimilarity(qe, chunk.embedding);
                    try results.append(allocator, .{ .chunk_index = ci, .keyword_score = score });
                }

                std.sort.pdq(RankedChunk, results.items, {}, compareRankedChunks);

                const count = @min(top_k, results.items.len);
                var final_matches = try allocator.alloc(SearchMatch, count);
                defer allocator.free(final_matches);

                for (0..count) |si| {
                    const rc = results.items[si];
                    const c = database.chunks.items[rc.chunk_index];
                    final_matches[si] = .{
                        .id = c.id,
                        .filePath = c.file_path,
                        .content = c.content,
                        .startLine = c.start_line,
                        .endLine = c.end_line,
                        .type = c.chunk_type,
                        .language = c.language,
                        .score = rc.keyword_score,
                        .matchType = "semantic",
                    };
                }
                try writeResponse(allocator, &writer.interface, SearchResponse{ .id = req_id, .data = final_matches });
            }
        } else if (std.mem.eql(u8, req.action, "searchHybridNative")) {
            const top_k = req.topK orelse 20;
            if (req.query) |q| {
                const native_matches = try search_engine.searchHybridNative(
                    allocator,
                    database.chunks.items,
                    q,
                    req.queryEmbedding,
                    top_k,
                    .{},
                    .{},
                );
                defer allocator.free(native_matches);

                var final_matches = try allocator.alloc(SearchMatch, native_matches.len);
                defer allocator.free(final_matches);

                for (native_matches, 0..) |m, i| {
                    const c = database.chunks.items[m.chunk_index];
                    final_matches[i] = .{
                        .id = c.id,
                        .filePath = c.file_path,
                        .content = c.content,
                        .startLine = c.start_line,
                        .endLine = c.end_line,
                        .type = c.chunk_type,
                        .language = c.language,
                        .score = m.rrf_score,
                        .matchType = "hybrid-native",
                    };
                }
                try writeResponse(allocator, &writer.interface, SearchResponse{ .id = req_id, .data = final_matches });
            }
        } else if (std.mem.eql(u8, req.action, "extractSymbolsNative")) {
            if (req.content) |cnt| {
                const syms = try tokenizer.extractSymbolsNative(allocator, cnt);
                defer allocator.free(syms);
                try writeResponse(allocator, &writer.interface, SymbolsResponse{ .id = req_id, .data = syms });
            }
        } else if (std.mem.eql(u8, req.action, "computeCloneHashesNative")) {
            if (req.content) |cnt| {
                const min_l = req.minLines orelse 5;
                const clones = try tokenizer.computeCloneHashesNative(allocator, cnt, min_l);
                defer allocator.free(clones);
                try writeResponse(allocator, &writer.interface, ClonesResponse{ .id = req_id, .data = clones });
            }
        } else if (std.mem.eql(u8, req.action, "walkDirectoryNative")) {
            if (req.projectPath) |proj_p| {
                const walked = try walker.walkDirectoryNative(allocator, io, proj_p);
                defer allocator.free(walked);
                try writeResponse(allocator, &writer.interface, WalkResponse{ .id = req_id, .data = walked });
            }
        } else if (std.mem.eql(u8, req.action, "computeSimilarityMatrixNative")) {
            const thresh = req.threshold orelse 0.70;
            const top_k = req.topK orelse 50;
            const pairs = try similarity.computeSimilarityMatrixNative(allocator, database.chunks.items, thresh, top_k);
            defer allocator.free(pairs);
            try writeResponse(allocator, &writer.interface, SimilarityResponse{ .id = req_id, .data = pairs });
        } else if (std.mem.eql(u8, req.action, "mineColorTokensNative")) {
            if (req.content) |cnt| {
                const col_toks = try property_miner.mineColorTokensNative(allocator, cnt);
                defer allocator.free(col_toks);
                try writeResponse(allocator, &writer.interface, ColorTokensResponse{ .id = req_id, .data = col_toks });
            }
        } else if (std.mem.eql(u8, req.action, "analyzeNamingConventionsNative")) {
            if (req.content) |cnt| {
                const conv_stats = property_miner.analyzeNamingConventionsNative(cnt);
                try writeResponse(allocator, &writer.interface, ConventionsResponse{ .id = req_id, .data = conv_stats });
            }
        } else if (std.mem.eql(u8, req.action, "parseLcovNative")) {
            if (req.content) |cnt| {
                const cov_info = try test_analyzer.parseLcovNative(allocator, cnt);
                defer allocator.free(cov_info);
                try writeResponse(allocator, &writer.interface, CoverageResponse{ .id = req_id, .data = cov_info });
            }
        } else if (std.mem.eql(u8, req.action, "analyzeCallTreeNative")) {
            if (req.content) |cnt| {
                const symb = req.symbol orelse "";
                const links = try calltree.analyzeCallTreeNative(allocator, cnt, symb);
                defer allocator.free(links);
                try writeResponse(allocator, &writer.interface, CallTreeResponse{ .id = req_id, .data = links });
            }
        } else if (std.mem.eql(u8, req.action, "extractControlFlowNative")) {
            if (req.content) |cnt| {
                const branches = try cfg.extractControlFlowNative(allocator, cnt);
                defer allocator.free(branches);
                try writeResponse(allocator, &writer.interface, CFGResponse{ .id = req_id, .data = branches });
            }
        } else if (std.mem.eql(u8, req.action, "classifyFileNative")) {
            if (req.filePath) |fp| {
                const cnt_len = if (req.content) |c| c.len else 0;
                const info = outline.calculateFileWeightNative(fp, cnt_len);
                try writeResponse(allocator, &writer.interface, OutlineResponse{ .id = req_id, .data = info });
            }
        } else if (std.mem.eql(u8, req.action, "buildInsightGraphNative")) {
            if (req.notes) |nts| {
                const min_w = req.threshold orelse 0.30;
                const edges = try memo_graph.buildInsightGraphNative(allocator, nts, min_w);
                defer allocator.free(edges);
                try writeResponse(allocator, &writer.interface, NoteEdgesResponse{ .id = req_id, .data = edges });
            }
        } else if (std.mem.eql(u8, req.action, "extractL10nKeysNative")) {
            if (req.content) |cnt| {
                const l_keys = try l10n.extractL10nKeysNative(allocator, cnt);
                defer allocator.free(l_keys);
                try writeResponse(allocator, &writer.interface, L10nKeysResponse{ .id = req_id, .data = l_keys });
            }
        } else if (std.mem.eql(u8, req.action, "mapResourceRefsNative")) {
            if (req.content) |cnt| {
                const r_refs = try resource_mapper.mapResourceRefsNative(allocator, cnt);
                defer allocator.free(r_refs);
                try writeResponse(allocator, &writer.interface, ResourcesResponse{ .id = req_id, .data = r_refs });
            }
        } else if (std.mem.eql(u8, req.action, "findDeadCodeNative")) {
            if (req.symbols) |syms| {
                const cnts = req.contents orelse &[_][]const u8{};
                const dead_syms = try dead_code.findDeadCodeNative(allocator, syms, cnts);
                defer allocator.free(dead_syms);
                try writeResponse(allocator, &writer.interface, DeadCodeResponse{ .id = req_id, .data = dead_syms });
            }
        } else if (std.mem.eql(u8, req.action, "serializeToonTabularNative")) {
            if (req.headers) |hdrs| {
                const rws = req.rows orelse &[_][][]const u8{};
                const toon_res = try toon.serializeToonTabularNative(allocator, hdrs, rws);
                defer allocator.free(toon_res);
                try writeResponse(allocator, &writer.interface, ToonResponse{ .id = req_id, .data = toon_res });
            }
        } else if (std.mem.eql(u8, req.action, "renderTextBitmapNative")) {
            if (req.content) |cnt| {
                const w = req.width orelse 640;
                const h = req.height orelse 480;
                const bmp = try dec_renderer.renderTextBitmapNative(allocator, cnt, w, h);
                defer allocator.free(bmp);
                try writeResponse(allocator, &writer.interface, BitmapResponse{ .id = req_id, .data = bmp });
            }
        } else {
            try writeResponse(allocator, &writer.interface, ResponseError{ .id = req_id, .message = "Unknown action" });
        }

        try writer.flush();

        if (modified) {
            database.saveToFile(io, resolved_db_path) catch {};
        }
        
        if (graph_modified) {
            if (resolved_graph_path) |graphPath| {
                graph_db.saveToFile(io, graphPath) catch {};
            }
        }
    }
}
