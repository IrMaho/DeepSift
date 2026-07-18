const std = @import("std");
const mem = std.mem;

pub const VECTOR_DIM: usize = 384;
pub const VECTOR_BQ_U32_COUNT: usize = VECTOR_DIM / 32;

pub const Chunk = struct {
    id: []const u8,
    file_path: []const u8,
    content: []const u8,
    start_line: u32,
    end_line: u32,
    chunk_type: []const u8,
    language: []const u8,
    embedding: [VECTOR_BQ_U32_COUNT]u32,
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


pub const Database = struct {
    allocator: mem.Allocator,
    arena: std.heap.ArenaAllocator,
    chunks: std.ArrayList(Chunk),
    metadata: std.StringHashMap(FileMetadata),

    const Self = @This();

    pub fn init(allocator: mem.Allocator) Self {
        return Self{
            .allocator = allocator,
            .arena = std.heap.ArenaAllocator.init(allocator),
            .chunks = std.ArrayList(Chunk).empty,
            .metadata = std.StringHashMap(FileMetadata).init(allocator),
        };
    }

    pub fn deinit(self: *Self) void {
        self.chunks.deinit(self.allocator);
        self.metadata.deinit();
        self.arena.deinit();
    }

    pub fn reset(self: *Self) void {
        self.chunks.clearRetainingCapacity();
        self.metadata.clearRetainingCapacity();
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

        // Write Magic
        try writer.writeAll("ZDB2");

        var pool = StringPool.init(self.allocator);
        defer pool.deinit(self.allocator);

        // Pre-fill pool
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

        // Write Metadata
        try writer.writeInt(u32, @intCast(self.metadata.count()), .little);
        meta_it = self.metadata.iterator();
        while (meta_it.next()) |entry| {
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, entry.value_ptr.file_path), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, entry.value_ptr.file_hash), .little);
            try writer.writeInt(i64, entry.value_ptr.last_indexed, .little);
            try writer.writeInt(u32, entry.value_ptr.chunk_count, .little);
        }

        // Write Chunks
        try writer.writeInt(u32, @intCast(self.chunks.items.len), .little);
        for (self.chunks.items) |chunk| {
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.id), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.file_path), .little);
            try writeString(writer, chunk.content);
            try writer.writeInt(u32, chunk.start_line, .little);
            try writer.writeInt(u32, chunk.end_line, .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.chunk_type), .little);
            try writer.writeInt(u32, try pool.addOrGet(self.allocator, chunk.language), .little);
            for (chunk.embedding) |val| {
                try writer.writeInt(u32, val, .little);
            }
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

        std.debug.print("db: Opened file.\n", .{});
        const stat = try file.stat(io);
        if (stat.size == 0) return;
        std.debug.print("db: File size {d}\n", .{stat.size});

        const in_buf = try self.allocator.alloc(u8, 1024 * 1024 * 64); defer self.allocator.free(in_buf);
        var file_reader = file.reader(io, in_buf);

        var uncompressed = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed.deinit();

        _ = file_reader.interface.streamRemaining(&uncompressed.writer) catch |err| {
            std.debug.print("db: Read error: {any}\n", .{err});
        };

        var data_reader: std.Io.Reader = .fixed(uncompressed.written());

        // Read Magic
        var magic: [4]u8 = undefined;
        try data_reader.readSliceAll(&magic);
        
        const is_zdb1 = mem.eql(u8, &magic, "ZDB1");
        const is_zdb2 = mem.eql(u8, &magic, "ZDB2");
        if (!is_zdb1 and !is_zdb2) return error.InvalidFormat;

        self.reset();
        const arena_alloc = self.arena.allocator();
        
        if (is_zdb2) {
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
                const content = try readString(&data_reader, arena_alloc);
                const start_line = try data_reader.takeInt(u32, .little);
                const end_line = try data_reader.takeInt(u32, .little);
                const type_idx = try data_reader.takeInt(u32, .little);
                const lang_idx = try data_reader.takeInt(u32, .little);
                
                var embedding: [VECTOR_BQ_U32_COUNT]u32 = undefined;
                for (&embedding) |*val| {
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
                    .embedding = embedding,
                });
            }
        } else {
            // ZDB1 Legacy Code
            // Read Metadata
            const meta_count = try data_reader.takeInt(u32, .little);
            var i: u32 = 0;
            while (i < meta_count) : (i += 1) {
                const fpath = try readString(&data_reader, arena_alloc);
                const fhash = try readString(&data_reader, arena_alloc);
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
                const id = try readString(&data_reader, arena_alloc);
                const fpath = try readString(&data_reader, arena_alloc);
                const content = try readString(&data_reader, arena_alloc);
                const start_line = try data_reader.takeInt(u32, .little);
                const end_line = try data_reader.takeInt(u32, .little);
                const chunk_type = try readString(&data_reader, arena_alloc);
                const language = try readString(&data_reader, arena_alloc);
                
                var embedding: [VECTOR_BQ_U32_COUNT]u32 = undefined;
                for (&embedding) |*val| {
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
                    .embedding = embedding,
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
