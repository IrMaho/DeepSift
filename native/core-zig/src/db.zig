const std = @import("std");
const mem = std.mem;

pub const VECTOR_F32_COUNT: usize = 384;

pub const Chunk = struct {
    id: []const u8,
    file_path: []const u8,
    content: []const u8,
    start_line: u32,
    end_line: u32,
    chunk_type: []const u8,
    language: []const u8,
    embedding: [VECTOR_F32_COUNT]f32,
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

    pub fn saveToFile(self: *Self, io: anytype, file_path: []const u8) !void {
        var uncompressed_data = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed_data.deinit();
        const writer = &uncompressed_data.writer;

        // Write Magic
        try writer.writeAll("ZDB1");

        // Write Metadata
        try writer.writeInt(u32, @intCast(self.metadata.count()), .little);
        var meta_it = self.metadata.iterator();
        while (meta_it.next()) |entry| {
            try writeString(writer, entry.value_ptr.file_path);
            try writeString(writer, entry.value_ptr.file_hash);
            try writer.writeInt(i64, entry.value_ptr.last_indexed, .little);
            try writer.writeInt(u32, entry.value_ptr.chunk_count, .little);
        }

        // Write Chunks
        try writer.writeInt(u32, @intCast(self.chunks.items.len), .little);
        for (self.chunks.items) |chunk| {
            try writeString(writer, chunk.id);
            try writeString(writer, chunk.file_path);
            try writeString(writer, chunk.content);
            try writer.writeInt(u32, chunk.start_line, .little);
            try writer.writeInt(u32, chunk.end_line, .little);
            try writeString(writer, chunk.chunk_type);
            try writeString(writer, chunk.language);
            for (chunk.embedding) |val| {
                try writer.writeInt(u32, @bitCast(val), .little);
            }
        }

        // Write to file with Flate Compression
        const file = try std.Io.Dir.cwd().createFile(io, file_path, .{});
        defer file.close(io);
        
        var out_buf: [4096]u8 = undefined;
        var file_writer = file.writer(io, &out_buf);

        var compress_buf: [std.compress.flate.max_window_len]u8 = undefined;
        var compressor = try std.compress.flate.Compress.init(&file_writer.interface, &compress_buf, .raw, std.compress.flate.Compress.Options.default);

        try compressor.writer.writeAll(uncompressed_data.written());
        try compressor.finish();
        try file_writer.flush();
    }

    pub fn loadFromFile(self: *Self, io: anytype, file_path: []const u8) !void {
        const file = std.Io.Dir.cwd().openFile(io, file_path, .{}) catch |err| {
            if (err == error.FileNotFound) return;
            return err;
        };
        defer file.close(io);

        const stat = try file.stat(io);
        if (stat.size < 4) { // "ZDB1" magic size
            return error.InvalidFormat;
        }

        var in_buf: [4096]u8 = undefined;
        var file_reader = file.reader(io, &in_buf);

        var decompress_buf: [std.compress.flate.max_window_len]u8 = undefined;
        var decompressor = std.compress.flate.Decompress.init(&file_reader.interface, .raw, &decompress_buf);

        var uncompressed = std.Io.Writer.Allocating.init(self.allocator);
        defer uncompressed.deinit();

        _ = try decompressor.reader.streamRemaining(&uncompressed.writer);

        var data_reader: std.Io.Reader = .fixed(uncompressed.written());

        // Read Magic
        var magic: [4]u8 = undefined;
        try data_reader.readSliceAll(&magic);
        if (!mem.eql(u8, &magic, "ZDB1")) return error.InvalidFormat;

        self.reset();
        const arena_alloc = self.arena.allocator();

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
            
            var embedding: [VECTOR_F32_COUNT]f32 = undefined;
            for (&embedding) |*val| {
                const int_val = try data_reader.takeInt(u32, .little);
                val.* = @bitCast(int_val);
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
