const std = @import("std");
const mem = std.mem;
const math = @import("math_engine.zig");
const sift_vector = @import("sift_vector.zig");
const ivf = @import("ivf.zig");

pub const VECTOR_DIM: usize = 768;
pub const VECTOR_BQ_U32_COUNT: usize = VECTOR_DIM / 32;

pub const OUTLIER_COUNT: usize = sift_vector.OUTLIER_COUNT;
pub const PACKED_NIBBLES_LEN: usize = sift_vector.PACKED_NIBBLES_LEN;

pub const SiftEmbedding = struct {
    scale: f32,
    offset: f32,
    outlier_indices: [OUTLIER_COUNT]u16,
    outlier_values: [OUTLIER_COUNT]i8,
    packed_data: [PACKED_NIBBLES_LEN]u8,

    pub fn fromBQ(bq: [VECTOR_BQ_U32_COUNT]u32) SiftEmbedding {
        var se: SiftEmbedding = undefined;
        se.scale = 1.0;
        se.offset = 0.0;
        @memset(&se.outlier_indices, 0);
        @memset(&se.outlier_values, 0);
        @memset(&se.packed_data, 0);
        var idx: usize = 0;
        while (idx < OUTLIER_COUNT) : (idx += 1) {
            se.outlier_indices[idx] = @intCast(idx);
            const word = bq[idx / 32];
            const bit_val: i8 = if ((word >> @intCast(idx % 32)) & 1 == 1) 7 else -7;
            se.outlier_values[idx] = bit_val;
        }
        var p: usize = 0;
        var r: usize = OUTLIER_COUNT;
        while (r + 1 < VECTOR_DIM and p < PACKED_NIBBLES_LEN) : (r += 2) {
            const w1 = bq[r / 32];
            const w2 = bq[(r + 1) / 32];
            const b1: u4 = if ((w1 >> @intCast(r % 32)) & 1 == 1) 12 else 4;
            const b2: u4 = if ((w2 >> @intCast((r + 1) % 32)) & 1 == 1) 12 else 4;
            se.packed_data[p] = @as(u8, b1) | (@as(u8, b2) << 4);
            p += 1;
        }
        return se;
    }

    pub fn toQuantizedVector(self: *const SiftEmbedding) sift_vector.QuantizedVector {
        return sift_vector.QuantizedVector{
            .scale = self.scale,
            .offset = self.offset,
            .outlier_indices = self.outlier_indices,
            .outlier_values = self.outlier_values,
            .packed_data = self.packed_data,
        };
    }
};

pub const Chunk = struct {
    id: []const u8,
    file_path: []const u8,
    content: []const u8,
    start_line: u32,
    end_line: u32,
    chunk_type: []const u8,
    language: []const u8,
    semantic_kind: u8 = 0,
    ast_density: f32 = 0.0,
    embedding: SiftEmbedding,
};

pub const FileMetadata = struct {
    file_path: []const u8,
    file_hash: []const u8,
    last_indexed: i64,
    chunk_count: u32,
};

pub const SearchResult = struct {
    chunk: Chunk,
    score: f32,
    match_type: []const u8,
};

pub const GraphNode = struct {
    id: []const u8,
    label: []const u8,
    source_file: []const u8,
    source_location: []const u8,
    community: u32,
    in_degree: u32,
    out_degree: u32,
    page_rank: f32,
};

pub const GraphEdge = struct {
    source: u32,
    target: u32,
    relation: []const u8,
    confidence: []const u8,
};


pub const LatentCode = struct {
    id: []const u8,
    content: []const u8,
    deleted_at: i64,
    original_file: []const u8,
};

pub const Database = struct {
    allocator: mem.Allocator,
    arena: std.heap.ArenaAllocator,
    chunks: std.ArrayList(Chunk),
    latent_chunks: std.ArrayList(LatentCode),
    metadata: std.StringHashMap(FileMetadata),
    mapped_data: ?[]const u8 = null,
    mapped_handle: ?std.os.windows.HANDLE = null,
    ivf_index: ?*ivf.IVFIndex = null,

    const Self = @This();

    pub fn init(allocator: mem.Allocator) Self {
        return Self{
            .allocator = allocator,
            .arena = std.heap.ArenaAllocator.init(allocator),
            .chunks = std.ArrayList(Chunk).empty,
            .latent_chunks = std.ArrayList(LatentCode).empty,
            .metadata = std.StringHashMap(FileMetadata).init(allocator),
            .mapped_data = null,
            .mapped_handle = null,
            .ivf_index = null,
        };
    }

    pub fn deinit(self: *Self) void {
        self.unmapData();
        if (self.ivf_index) |idx| {
            idx.deinit();
            self.allocator.destroy(idx);
        }
        self.chunks.deinit(self.allocator);
        self.latent_chunks.deinit(self.allocator);
        self.metadata.deinit();
        self.arena.deinit();
    }

    pub fn reset(self: *Self) void {
        self.unmapData();
        if (self.ivf_index) |idx| {
            idx.deinit();
            self.allocator.destroy(idx);
            self.ivf_index = null;
        }
        self.chunks.clearRetainingCapacity();
        self.latent_chunks.clearRetainingCapacity();
        self.metadata.clearRetainingCapacity();
        _ = self.arena.reset(.retain_capacity);
    }

    extern "kernel32" fn UnmapViewOfFile(lpBaseAddress: ?*const anyopaque) callconv(.winapi) i32;
    extern "kernel32" fn CreateFileW(lpFileName: [*:0]const u16, dwDesiredAccess: u32, dwShareMode: u32, lpSecurityAttributes: ?*anyopaque, dwCreationDisposition: u32, dwFlagsAndAttributes: u32, hTemplateFile: ?*anyopaque) callconv(.winapi) *anyopaque;
    extern "kernel32" fn GetFileSizeEx(hFile: *anyopaque, lpFileSize: *u64) callconv(.winapi) i32;
    extern "kernel32" fn CreateFileMappingW(hFile: *anyopaque, lpFileMappingAttributes: ?*anyopaque, flProtect: u32, dwMaximumSizeHigh: u32, dwMaximumSizeLow: u32, lpName: ?[*:0]const u16) callconv(.winapi) ?*anyopaque;
    extern "kernel32" fn MapViewOfFile(hFileMappingObject: *anyopaque, dwDesiredAccess: u32, dwFileOffsetHigh: u32, dwFileOffsetLow: u32, dwNumberOfBytesToMap: usize) callconv(.winapi) ?*anyopaque;
    extern "kernel32" fn CloseHandle(hObject: *anyopaque) callconv(.winapi) i32;

    fn unmapData(self: *Self) void {
        if (self.mapped_data) |data| {
            if (@import("builtin").os.tag == .windows) {
                _ = UnmapViewOfFile(data.ptr);
            } else {
                std.posix.munmap(@alignCast(data));
            }
            self.mapped_data = null;
        }
    }

    pub fn buildIvf(self: *Self) !void {
        if (self.ivf_index != null) return;
        if (self.chunks.items.len == 0) return;
        
        const idx = try self.allocator.create(ivf.IVFIndex);
        idx.* = ivf.IVFIndex.init(self.allocator);
        
        // Use sqrt(N) as standard heuristic for number of clusters, capped at 1024
        const n_clusters_f: f32 = @sqrt(@as(f32, @floatFromInt(self.chunks.items.len)));
        const k = @min(@as(usize, @intFromFloat(n_clusters_f)), 1024);
        
        try idx.build(self.chunks.items, @max(k, 1));
        self.ivf_index = idx;
    }

    fn writeString(writer: anytype, str: []const u8) !void {
        try writer.writeInt(u32, @intCast(str.len), .little);
        try writer.writeAll(str);
    }

    const MemReader = struct {
        buffer: []const u8,
        pos: usize,
        pub fn takeInt(self: *MemReader, comptime T: type, endian: std.builtin.Endian) !T {
            const size = @sizeOf(T);
            if (self.pos + size > self.buffer.len) return error.EndOfStream;
            const slice = self.buffer[self.pos .. self.pos + size];
            self.pos += size;
            return std.mem.readInt(T, slice[0..size], endian);
        }
        pub fn readNoEof(self: *MemReader, buf: []u8) !void {
            if (self.pos + buf.len > self.buffer.len) return error.EndOfStream;
            @memcpy(buf, self.buffer[self.pos .. self.pos + buf.len]);
            self.pos += buf.len;
        }
        pub fn readSliceAll(self: *MemReader, buf: []u8) !void {
            return self.readNoEof(buf);
        }
        pub fn readStringZeroCopy(self: *MemReader) ![]const u8 {
            const len = try self.takeInt(u32, .little);
            if (self.pos + len > self.buffer.len) return error.EndOfStream;
            const slice = self.buffer[self.pos .. self.pos + len];
            self.pos += len;
            return slice;
        }
    };

    fn readStringPool(reader: *MemReader, allocator: mem.Allocator) !std.ArrayList([]const u8) {
        const len = try reader.takeInt(u32, .little);
        var pool = std.ArrayList([]const u8).empty;
        var i: u32 = 0;
        while (i < len) : (i += 1) {
            const s = try reader.readStringZeroCopy();
            try pool.append(allocator, s);
        }
        return pool;
    }

    const StringPool = struct {
        map: std.StringHashMap(u32),
        list: std.ArrayList([]const u8),

        pub fn init(allocator: mem.Allocator) StringPool {
            return .{
                .map = std.StringHashMap(u32).init(allocator),
                .list = std.ArrayList([]const u8).empty,
            };
        }

        pub fn deinit(self: *StringPool, allocator: mem.Allocator) void {
            self.map.deinit();
            self.list.deinit(allocator);
        }

        pub fn addOrGet(self: *StringPool, allocator: mem.Allocator, str: []const u8) !u32 {
            if (self.map.get(str)) |idx| return idx;
            const idx: u32 = @intCast(self.list.items.len);
            try self.list.append(allocator, str);
            try self.map.put(str, idx);
            return idx;
        }
    };

    fn writeStringPool(writer: anytype, pool: *StringPool) !void {
        try writer.writeInt(u32, @intCast(pool.list.items.len), .little);
        for (pool.list.items) |s| {
            try writeString(writer, s);
        }
    }

    pub fn saveToFile(self: *Self, io: anytype, file_path: []const u8) !void {
        var uncompressed_data = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed_data.deinit();
        const writer = &uncompressed_data.writer;

        try writer.writeAll("ZDB4");

        var pool = StringPool.init(self.allocator);
        defer pool.deinit(self.allocator);

        var meta_it = self.metadata.iterator();
        while (meta_it.next()) |entry| {
            _ = try pool.addOrGet(self.allocator, entry.value_ptr.file_path);
            _ = try pool.addOrGet(self.allocator, entry.value_ptr.file_hash);
        }
        for (self.chunks.items) |chunk| {
            _ = try pool.addOrGet(self.allocator, chunk.id);
            _ = try pool.addOrGet(self.allocator, chunk.file_path);
            _ = try pool.addOrGet(self.allocator, chunk.chunk_type);
            _ = try pool.addOrGet(self.allocator, chunk.language);
        }

        try writeStringPool(writer, &pool);

        try writer.writeInt(u32, @intCast(self.metadata.count()), .little);
        meta_it = self.metadata.iterator();
        while (meta_it.next()) |entry| {
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, entry.value_ptr.file_path), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, entry.value_ptr.file_hash), .little);
            try writer.writeInt(i64, entry.value_ptr.last_indexed, .little);
            try writer.writeInt(u32, entry.value_ptr.chunk_count, .little);
        }

        try writer.writeInt(u32, @intCast(self.chunks.items.len), .little);
        for (self.chunks.items) |chunk| {
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.id), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.file_path), .little);
            try writeString(writer, chunk.content);
            try writer.writeInt(u32, chunk.start_line, .little);
            try writer.writeInt(u32, chunk.end_line, .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.chunk_type), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.language), .little);
            try writer.writeInt(u8, chunk.semantic_kind, .little);
            try writer.writeInt(u32, @bitCast(chunk.ast_density), .little);
            try writer.writeInt(u32, @bitCast(chunk.embedding.scale), .little);
            try writer.writeInt(u32, @bitCast(chunk.embedding.offset), .little);
            for (chunk.embedding.outlier_indices) |oi| {
                try writer.writeInt(u16, oi, .little);
            }
            try writer.writeAll(&@as([OUTLIER_COUNT]u8, @bitCast(chunk.embedding.outlier_values)));
            try writer.writeAll(&chunk.embedding.packed_data);
        }

        const file = try std.Io.Dir.cwd().createFile(io, file_path, .{});
        defer file.close(io);
        
        const out_buf = try self.allocator.alloc(u8, 1024 * 1024 * 64); defer self.allocator.free(out_buf);
        var file_writer = file.writer(io, out_buf);
        
        try file_writer.interface.writeAll(uncompressed_data.written());
        try file_writer.flush();
    }

    fn mapFile(self: *Self, file_path: []const u8) ![]const u8 {
        if (@import("builtin").os.tag == .windows) {
            const path_w = try std.unicode.utf8ToUtf16LeAllocZ(self.allocator, file_path);
            defer self.allocator.free(path_w);
            const handle = CreateFileW(path_w.ptr, 0x80000000, 1, null, 3, 128, null); // GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL
            if (handle == @as(*anyopaque, @ptrFromInt(std.math.maxInt(usize)))) return error.FileNotFound; // INVALID_HANDLE_VALUE
            defer _ = CloseHandle(handle);
            
            var file_size: u64 = 0;
            _ = GetFileSizeEx(handle, &file_size);
            if (file_size == 0) return &[_]u8{};

            const map_handle = CreateFileMappingW(handle, null, 2, 0, 0, null); // PAGE_READONLY
            if (map_handle == null) return error.MappingFailed;
            defer _ = CloseHandle(map_handle.?);
            
            const ptr = MapViewOfFile(map_handle.?, 4, 0, 0, 0); // FILE_MAP_READ
            if (ptr == null) return error.MappingFailed;
            return @as([*]const u8, @ptrCast(ptr.?))[0..file_size];
        } else {
            const fd = try std.posix.open(file_path, .{ .ACCMODE = .RDONLY }, 0);
            defer std.posix.close(fd);
            const stat = try std.posix.fstat(fd);
            if (stat.size == 0) return &[_]u8{};
            const ptr = try std.posix.mmap(null, @intCast(stat.size), std.posix.PROT.READ, .{ .TYPE = .SHARED }, fd, 0);
            return ptr[0..@intCast(stat.size)];
        }
    }

    pub fn loadFromFile(self: *Self, file_path: []const u8) !void {
        self.reset();
        
        const mapped_data = try self.mapFile(file_path);
        if (mapped_data.len == 0) return;
        self.mapped_data = mapped_data;
        
        var data_reader = MemReader{ .buffer = mapped_data, .pos = 0 };

        // Read Magic
        var magic: [4]u8 = undefined;
        try data_reader.readNoEof(&magic);
        
        const is_zdb1 = mem.eql(u8, &magic, "ZDB1");
        const is_zdb2 = mem.eql(u8, &magic, "ZDB2");
        const is_zdb3 = mem.eql(u8, &magic, "ZDB3");
        const is_zdb4 = mem.eql(u8, &magic, "ZDB4");
        if (!is_zdb1 and !is_zdb2 and !is_zdb3 and !is_zdb4) return error.InvalidFormat;

        const arena_alloc = self.arena.allocator();
        
        if (is_zdb3 or is_zdb4) {
            var pool = try readStringPool(&data_reader, arena_alloc);
            defer pool.deinit(arena_alloc);

            const meta_count = try data_reader.takeInt(u32, .little);
            var mi: u32 = 0;
            while (mi < meta_count) : (mi += 1) {
                const fpath_idx = try data_reader.takeInt(u32, .little);
                const fhash_idx = try data_reader.takeInt(u32, .little);
                const last_indexed = try data_reader.takeInt(i64, .little);
                const chunk_count = try data_reader.takeInt(u32, .little);
                try self.metadata.put(pool.items[fpath_idx], .{
                    .file_path = pool.items[fpath_idx],
                    .file_hash = pool.items[fhash_idx],
                    .last_indexed = last_indexed,
                    .chunk_count = chunk_count,
                });
            }

            const chunk_count = try data_reader.takeInt(u32, .little);
            try self.chunks.ensureTotalCapacity(self.allocator, chunk_count);
            var ci: u32 = 0;
            while (ci < chunk_count) : (ci += 1) {
                const id_idx = try data_reader.takeInt(u32, .little);
                const fpath_idx = try data_reader.takeInt(u32, .little);
                const content = try data_reader.readStringZeroCopy();
                const start_line = try data_reader.takeInt(u32, .little);
                const end_line = try data_reader.takeInt(u32, .little);
                const type_idx = try data_reader.takeInt(u32, .little);
                const lang_idx = try data_reader.takeInt(u32, .little);

                var s_kind: u8 = 0;
                var a_dens: f32 = 0.0;
                
                if (is_zdb4) {
                    s_kind = try data_reader.takeInt(u8, .little);
                    a_dens = @bitCast(try data_reader.takeInt(u32, .little));
                }

                var emb: SiftEmbedding = undefined;
                emb.scale = @bitCast(try data_reader.takeInt(u32, .little));
                emb.offset = @bitCast(try data_reader.takeInt(u32, .little));
                for (&emb.outlier_indices) |*oi| {
                    oi.* = try data_reader.takeInt(u16, .little);
                }
                var ov_raw: [OUTLIER_COUNT]u8 = undefined;
                try data_reader.readSliceAll(&ov_raw);
                emb.outlier_values = @bitCast(ov_raw);
                try data_reader.readSliceAll(&emb.packed_data);

                self.chunks.appendAssumeCapacity(.{
                    .id = pool.items[id_idx],
                    .file_path = pool.items[fpath_idx],
                    .content = content,
                    .start_line = start_line,
                    .end_line = end_line,
                    .chunk_type = pool.items[type_idx],
                    .language = pool.items[lang_idx],
                    .semantic_kind = s_kind,
                    .ast_density = a_dens,
                    .embedding = emb,
                });
            }
        } else if (is_zdb2) {
            var pool = try readStringPool(&data_reader, arena_alloc);
            defer pool.deinit(arena_alloc);

            // Read Metadata
            const meta_count = try data_reader.takeInt(u32, .little);
            var i: u32 = 0;
            while (i < meta_count) : (i += 1) {
                const fpath_idx = try data_reader.takeInt(u32, .little);
                const fhash_idx = try data_reader.takeInt(u32, .little);
                const last_indexed = try data_reader.takeInt(i64, .little);
                const chunk_count = try data_reader.takeInt(u32, .little);
                
                try self.metadata.put(pool.items[fpath_idx], .{
                    .file_path = pool.items[fpath_idx],
                    .file_hash = pool.items[fhash_idx],
                    .last_indexed = last_indexed,
                    .chunk_count = chunk_count,
                });
            }

            // Read Chunks
            const chunk_count = try data_reader.takeInt(u32, .little);
            try self.chunks.ensureTotalCapacity(self.allocator, chunk_count);
            
            var j: u32 = 0;
            while (j < chunk_count) : (j += 1) {
                const id_idx = try data_reader.takeInt(u32, .little);
                const fpath_idx = try data_reader.takeInt(u32, .little);
                const content = try data_reader.readStringZeroCopy();
                const start_line = try data_reader.takeInt(u32, .little);
                const end_line = try data_reader.takeInt(u32, .little);
                const type_idx = try data_reader.takeInt(u32, .little);
                const lang_idx = try data_reader.takeInt(u32, .little);
                
                var bq_embedding: [VECTOR_BQ_U32_COUNT]u32 = undefined;
                for (&bq_embedding) |*val| {
                    val.* = try data_reader.takeInt(u32, .little);
                }

                self.chunks.appendAssumeCapacity(.{
                    .id = pool.items[id_idx],
                    .file_path = pool.items[fpath_idx],
                    .content = content,
                    .start_line = start_line,
                    .end_line = end_line,
                    .chunk_type = pool.items[type_idx],
                    .language = pool.items[lang_idx],
                    .embedding = SiftEmbedding.fromBQ(bq_embedding),
                });
            }
        } else {
            // ZDB1 Legacy Code
            // Read Metadata
            const meta_count = try data_reader.takeInt(u32, .little);
            var i: u32 = 0;
            while (i < meta_count) : (i += 1) {
                const fpath = try data_reader.readStringZeroCopy();
                const fhash = try data_reader.readStringZeroCopy();
                const last_indexed = try data_reader.takeInt(i64, .little);
                const chunk_count = try data_reader.takeInt(u32, .little);
                
                try self.metadata.put(fpath, .{
                    .file_path = fpath,
                    .file_hash = fhash,
                    .last_indexed = last_indexed,
                    .chunk_count = chunk_count,
                });
            }

            // Read Chunks
            const chunk_count = try data_reader.takeInt(u32, .little);
            try self.chunks.ensureTotalCapacity(self.allocator, chunk_count);
            
            var j: u32 = 0;
            while (j < chunk_count) : (j += 1) {
                const id = try data_reader.readStringZeroCopy();
                const fpath = try data_reader.readStringZeroCopy();
                const content = try data_reader.readStringZeroCopy();
                const start_line = try data_reader.takeInt(u32, .little);
                const end_line = try data_reader.takeInt(u32, .little);
                const chunk_type = try data_reader.readStringZeroCopy();
                const language = try data_reader.readStringZeroCopy();
                
                var bq_embedding: [VECTOR_BQ_U32_COUNT]u32 = undefined;
                for (&bq_embedding) |*val| {
                    val.* = try data_reader.takeInt(u32, .little);
                }

                self.chunks.appendAssumeCapacity(.{
                    .id = id,
                    .file_path = fpath,
                    .content = content,
                    .start_line = start_line,
                    .end_line = end_line,
                    .chunk_type = chunk_type,
                    .language = language,
                    .embedding = SiftEmbedding.fromBQ(bq_embedding),
                });
            }
        }
    }


    pub fn deleteFileChunks(self: *Self, file_path: []const u8) void {
        _ = self.metadata.remove(file_path);
        
        var i: usize = 0;
        while (i < self.chunks.items.len) {
            if (mem.eql(u8, self.chunks.items[i].file_path, file_path)) {
                _ = self.chunks.swapRemove(i);
            } else {
                i += 1;
            }
        }
    }

    pub fn addChunk(self: *Self, chunk: Chunk) !void {
        const arena_alloc = self.arena.allocator();
        const duplicated_chunk = Chunk{
            .id = try arena_alloc.dupe(u8, chunk.id),
            .file_path = try arena_alloc.dupe(u8, chunk.file_path),
            .content = try arena_alloc.dupe(u8, chunk.content),
            .start_line = chunk.start_line,
            .end_line = chunk.end_line,
            .chunk_type = try arena_alloc.dupe(u8, chunk.chunk_type),
            .language = try arena_alloc.dupe(u8, chunk.language),
            .embedding = chunk.embedding,
        };
        try self.chunks.append(self.allocator, duplicated_chunk);
    }
    
    pub fn addMetadata(self: *Self, meta: FileMetadata) !void {
        const arena_alloc = self.arena.allocator();
        const duped_meta = FileMetadata{
            .file_path = try arena_alloc.dupe(u8, meta.file_path),
            .file_hash = try arena_alloc.dupe(u8, meta.file_hash),
            .last_indexed = meta.last_indexed,
            .chunk_count = meta.chunk_count,
        };
        try self.metadata.put(duped_meta.file_path, duped_meta);
    }
};

pub const GraphDatabase = struct {
    allocator: mem.Allocator,
    arena: std.heap.ArenaAllocator,
    nodes: std.ArrayList(GraphNode),
    edges: std.ArrayList(GraphEdge),

    const Self = @This();

    pub fn init(allocator: mem.Allocator) Self {
        return Self{
            .allocator = allocator,
            .arena = std.heap.ArenaAllocator.init(allocator),
            .nodes = std.ArrayList(GraphNode).empty,
            .edges = std.ArrayList(GraphEdge).empty,
        };
    }

    pub fn deinit(self: *Self) void {
        self.nodes.deinit(self.allocator);
        self.edges.deinit(self.allocator);
        self.arena.deinit();
    }

    pub fn reset(self: *Self) void {
        self.nodes.clearRetainingCapacity();
        self.edges.clearRetainingCapacity();
        _ = self.arena.reset(.retain_capacity);
    }

    fn writeString(writer: anytype, str: []const u8) !void {
        try writer.writeInt(u32, @intCast(str.len), .little);
        try writer.writeAll(str);
    }

    fn readString(reader: anytype, alloc: mem.Allocator) ![]const u8 {
        const len = try reader.takeInt(u32, .little);
        const buf = try alloc.alloc(u8, len);
        try reader.readSliceAll(buf);
        return buf;
    }

    const StringPool = struct {
        map: std.StringHashMap(u32),
        list: std.ArrayList([]const u8),

        pub fn init(allocator: mem.Allocator) StringPool {
            return .{
                .map = std.StringHashMap(u32).init(allocator),
                .list = std.ArrayList([]const u8).empty,
            };
        }

        pub fn deinit(self: *StringPool, allocator: mem.Allocator) void {
            self.map.deinit();
            self.list.deinit(allocator);
        }

        pub fn addOrGet(self: *StringPool, allocator: mem.Allocator, str: []const u8) !u32 {
            if (self.map.get(str)) |idx| return idx;
            const idx: u32 = @intCast(self.list.items.len);
            try self.list.append(allocator, str);
            try self.map.put(str, idx);
            return idx;
        }
    };

    fn writeStringPool(writer: anytype, pool: *StringPool) !void {
        try writer.writeInt(u32, @intCast(pool.list.items.len), .little);
        for (pool.list.items) |s| {
            try writeString(writer, s);
        }
    }

    fn readStringPool(reader: anytype, allocator: mem.Allocator) !std.ArrayList([]const u8) {
        const len = try reader.takeInt(u32, .little);
        var pool = std.ArrayList([]const u8).empty;
        var i: u32 = 0;
        while (i < len) : (i += 1) {
            const s = try readString(reader, allocator);
            try pool.append(allocator, s);
        }
        return pool;
    }

    pub fn saveToFile(self: *Self, io: anytype, file_path: []const u8) !void {
        var uncompressed_data = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed_data.deinit();
        const writer = &uncompressed_data.writer;

        try writer.writeAll("GRF2");

        var pool = StringPool.init(self.allocator);
        defer pool.deinit(self.allocator);

        for (self.nodes.items) |node| {
            _ = try pool.addOrGet(self.allocator, node.id);
            _ = try pool.addOrGet(self.allocator, node.label);
            _ = try pool.addOrGet(self.allocator, node.source_file);
            _ = try pool.addOrGet(self.allocator, node.source_location);
        }
        for (self.edges.items) |edge| {
            _ = try pool.addOrGet(self.allocator, edge.relation);
            _ = try pool.addOrGet(self.allocator, edge.confidence);
        }

        try writeStringPool(writer, &pool);

        try writer.writeInt(u32, @intCast(self.nodes.items.len), .little);
        for (self.nodes.items) |node| {
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, node.id), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, node.label), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, node.source_file), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, node.source_location), .little);
            try writer.writeInt(u32, node.community, .little);
            try writer.writeInt(u32, node.in_degree, .little);
            try writer.writeInt(u32, node.out_degree, .little);
            try writer.writeInt(u32, @bitCast(node.page_rank), .little);
        }

        try writer.writeInt(u32, @intCast(self.edges.items.len), .little);
        for (self.edges.items) |edge| {
            try writer.writeInt(u32, edge.source, .little);
            try writer.writeInt(u32, edge.target, .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, edge.relation), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, edge.confidence), .little);
        }

        const file = try std.Io.Dir.cwd().createFile(io, file_path, .{});
        defer file.close(io);
        
        const out_buf = try self.allocator.alloc(u8, 1024 * 1024 * 64); defer self.allocator.free(out_buf);
        var file_writer = file.writer(io, out_buf);
        
        try file_writer.interface.writeAll(uncompressed_data.written());
        try file_writer.flush();
    }

    pub fn loadFromFile(self: *Self, io: anytype, file_path: []const u8) !void {
        const file = std.Io.Dir.cwd().openFile(io, file_path, .{}) catch |err| {
            if (err == error.FileNotFound) return;
            return err;
        };
        defer file.close(io);

        const stat = try file.stat(io);
        if (stat.size == 0) return;

        const in_buf = try self.allocator.alloc(u8, 1024 * 1024 * 64); defer self.allocator.free(in_buf);
        var file_reader = file.reader(io, in_buf);

        var uncompressed = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed.deinit();

        _ = file_reader.interface.streamRemaining(&uncompressed.writer) catch |err| {
            std.debug.print("db: Read error: {any}\n", .{err});
        };

        var data_reader: std.Io.Reader = .fixed(uncompressed.written());

        var magic: [4]u8 = undefined;
        try data_reader.readSliceAll(&magic);
        
        const is_grf1 = mem.eql(u8, &magic, "GRF1");
        const is_grf2 = mem.eql(u8, &magic, "GRF2");
        if (!is_grf1 and !is_grf2) return error.InvalidFormat;

        self.reset();
        const arena_alloc = self.arena.allocator();

        if (is_grf2) {
            var pool = try readStringPool(&data_reader, arena_alloc);
            defer pool.deinit(arena_alloc);

            const node_count = try data_reader.takeInt(u32, .little);
            try self.nodes.ensureTotalCapacity(self.allocator, node_count);
            var i: u32 = 0;
            while (i < node_count) : (i += 1) {
                const id_idx = try data_reader.takeInt(u32, .little);
                const label_idx = try data_reader.takeInt(u32, .little);
                const source_file_idx = try data_reader.takeInt(u32, .little);
                const source_loc_idx = try data_reader.takeInt(u32, .little);
                const community = try data_reader.takeInt(u32, .little);
                const in_degree = try data_reader.takeInt(u32, .little);
                const out_degree = try data_reader.takeInt(u32, .little);
                const page_rank_bits = try data_reader.takeInt(u32, .little);
                const page_rank: f32 = @bitCast(page_rank_bits);
                
                self.nodes.appendAssumeCapacity(.{
                    .id = pool.items[id_idx],
                    .label = pool.items[label_idx],
                    .source_file = pool.items[source_file_idx],
                    .source_location = pool.items[source_loc_idx],
                    .community = community,
                    .in_degree = in_degree,
                    .out_degree = out_degree,
                    .page_rank = page_rank,
                });
            }

            const edge_count = try data_reader.takeInt(u32, .little);
            try self.edges.ensureTotalCapacity(self.allocator, edge_count);
            var j: u32 = 0;
            while (j < edge_count) : (j += 1) {
                const source = try data_reader.takeInt(u32, .little);
                const target = try data_reader.takeInt(u32, .little);
                const rel_idx = try data_reader.takeInt(u32, .little);
                const conf_idx = try data_reader.takeInt(u32, .little);
                
                self.edges.appendAssumeCapacity(.{
                    .source = source,
                    .target = target,
                    .relation = pool.items[rel_idx],
                    .confidence = pool.items[conf_idx],
                });
            }
        } else {
            // GRF1 Legacy Code
            const node_count = try data_reader.takeInt(u32, .little);
            try self.nodes.ensureTotalCapacity(self.allocator, node_count);
            var i: u32 = 0;
            while (i < node_count) : (i += 1) {
                const id = try readString(&data_reader, arena_alloc);
                const label = try readString(&data_reader, arena_alloc);
                const source_file = try readString(&data_reader, arena_alloc);
                const source_location = try readString(&data_reader, arena_alloc);
                const community = try data_reader.takeInt(u32, .little);
                const in_degree = try data_reader.takeInt(u32, .little);
                const out_degree = try data_reader.takeInt(u32, .little);
                const page_rank_bits = try data_reader.takeInt(u32, .little);
                const page_rank: f32 = @bitCast(page_rank_bits);
                
                self.nodes.appendAssumeCapacity(.{
                    .id = id,
                    .label = label,
                    .source_file = source_file,
                    .source_location = source_location,
                    .community = community,
                    .in_degree = in_degree,
                    .out_degree = out_degree,
                    .page_rank = page_rank,
                });
            }

            const edge_count = try data_reader.takeInt(u32, .little);
            try self.edges.ensureTotalCapacity(self.allocator, edge_count);
            var j: u32 = 0;
            while (j < edge_count) : (j += 1) {
                const source = try data_reader.takeInt(u32, .little);
                const target = try data_reader.takeInt(u32, .little);
                const relation = try readString(&data_reader, arena_alloc);
                const confidence = try readString(&data_reader, arena_alloc);
                
                self.edges.appendAssumeCapacity(.{
                    .source = source,
                    .target = target,
                    .relation = relation,
                    .confidence = confidence,
                });
            }
        }
    }
};
