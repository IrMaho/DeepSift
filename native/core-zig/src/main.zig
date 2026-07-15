const std = @import("std");
const db = @import("db.zig");

const BatchOperation = struct {
    action: []const u8,
    metadata: ?db.FileMetadata = null,
    filePath: ?[]const u8 = null,
    chunks: ?[]db.Chunk = null,
};

const Request = struct {
    action: []const u8,
    dbPath: []const u8,
    metadata: ?db.FileMetadata = null,
    filePath: ?[]const u8 = null,
    chunks: ?[]db.Chunk = null,
    ids: ?[][]const u8 = null,
    query: ?[]const u8 = null,
    topK: ?usize = null,
    queryEmbedding: ?[db.VECTOR_BQ_U32_COUNT]u32 = null,
    batch: ?[]BatchOperation = null,
};

const ResponseOk = struct {
    success: bool = true,
};

const ResponseError = struct {
    success: bool = false,
    message: []const u8,
};

const MetadataResponse = struct {
    success: bool = true,
    data: ?db.FileMetadata,
};

const AllMetadataResponse = struct {
    success: bool = true,
    data: []const db.FileMetadata,
};

const ChunksResponse = struct {
    success: bool = true,
    data: []const db.Chunk,
};

pub const ChunkEmbedding = struct { id: []const u8, embedding: [db.VECTOR_BQ_U32_COUNT]u32 };
const ChunkEmbeddingsResponse = struct {
    success: bool = true,
    data: []const ChunkEmbedding,
};

const StatusResponse = struct {
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
    success: bool = true,
    data: []const SearchMatch,
};

fn countKeywordMatches(content: []const u8, query: []const u8) f32 {
    if (query.len == 0 or content.len == 0) return 0.0;

    var matches: u32 = 0;
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
            matches += 1;
            i += query.len;
        } else {
            i += 1;
        }
    }

    if (matches > 0) {
        return @as(f32, @floatFromInt(matches)) * 0.1;
    }
    return 0.0;
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

    var in_buf: [4096]u8 = undefined;
    const stdin = std.Io.File.stdin();
    var reader = stdin.reader(io, &in_buf);
    
    var out_buf: [4096]u8 = undefined;
    const stdout = std.Io.File.stdout();
    var writer = stdout.writer(io, &out_buf);

    var database = db.Database.init(allocator);
    defer database.deinit();

    // Read all from stdin
    var input_array = std.ArrayList(u8).empty;
    defer input_array.deinit(allocator);

    var read_buf: [4096]u8 = undefined;
    while (true) {
        const n = try reader.interface.readSliceShort(&read_buf);
        if (n == 0) break;
        try input_array.appendSlice(allocator, read_buf[0..n]);
        if (input_array.items.len > 1024 * 1024 * 100) return error.FileTooBig;
    }
    const input_data = input_array.items;

    std.debug.print("Read {d} bytes from stdin\n", .{input_data.len});

    if (input_data.len == 0) return;

    var parsed = std.json.parseFromSlice(Request, allocator, input_data, .{
        .ignore_unknown_fields = true,
    }) catch |err| {
        std.debug.print("Failed to parse JSON: {any}\n", .{err});
        try writeResponse(allocator, &writer.interface, ResponseError{ .message = "Invalid JSON" });
        return;
    };
    defer parsed.deinit();

    const req = parsed.value;

    // Load Database
    std.debug.print("Loading database...\n", .{});
    database.loadFromFile(io, req.dbPath) catch |err| {
        std.debug.print("Failed to load database: {any}\n", .{err});
    };
    std.debug.print("Database loaded.\n", .{});


    var modified = false;

    if (std.mem.eql(u8, req.action, "saveMetadata")) {
        std.debug.print("Processing saveMetadata...\n", .{});
        if (req.metadata) |m| {
            try database.addMetadata(m);
            modified = true;
            try writeResponse(allocator, &writer.interface, ResponseOk{});
        }

    } else if (std.mem.eql(u8, req.action, "getMetadata")) {
        std.debug.print("Processing getMetadata...\n", .{});
        var found: ?db.FileMetadata = null;
        if (req.filePath) |fp| {
            std.debug.print("Looking up: {s}\n", .{fp});
            if (database.metadata.get(fp)) |m| found = m;
        }
        try writeResponse(allocator, &writer.interface, MetadataResponse{ .data = found });

    } else if (std.mem.eql(u8, req.action, "getAllMetadata")) {
        std.debug.print("Processing getAllMetadata...\n", .{});
        var results = std.ArrayList(db.FileMetadata).empty;
        defer results.deinit(allocator);
        var it = database.metadata.iterator();
        while (it.next()) |entry| {
            try results.append(allocator, entry.value_ptr.*);
        }
        try writeResponse(allocator, &writer.interface, AllMetadataResponse{ .data = results.items });

    } else if (std.mem.eql(u8, req.action, "deleteFileChunks")) {
        if (req.filePath) |fp| {
            database.deleteFileChunks(fp);
            modified = true;
            try writeResponse(allocator, &writer.interface, ResponseOk{});
        }
    } else if (std.mem.eql(u8, req.action, "saveChunks")) {
        if (req.chunks) |chunks| {
            for (chunks) |c| {
                try database.addChunk(c);
            }
            modified = true;
            try writeResponse(allocator, &writer.interface, ResponseOk{});
        }
    } else if (std.mem.eql(u8, req.action, "batchExecute")) {
        std.debug.print("Processing batchExecute...\n", .{});
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
            try writeResponse(allocator, &writer.interface, ResponseOk{});
        } else {
            try writeResponse(allocator, &writer.interface, ResponseError{ .message = "Missing batch operations array" });
        }
    } else if (std.mem.eql(u8, req.action, "getAllChunks")) {
        try writeResponse(allocator, &writer.interface, ChunksResponse{ .data = database.chunks.items });
    } else if (std.mem.eql(u8, req.action, "getChunkEmbeddings")) {
        var results = std.ArrayList(ChunkEmbedding).empty;
        defer results.deinit(allocator);
        for (database.chunks.items) |c| {
            try results.append(allocator, .{ .id = c.id, .embedding = c.embedding });
        }
        try writeResponse(allocator, &writer.interface, ChunkEmbeddingsResponse{ .data = results.items });
    } else if (std.mem.eql(u8, req.action, "getChunksByIds")) {
        var results = std.ArrayList(db.Chunk).empty;
        defer results.deinit(allocator);
        if (req.ids) |ids| {
            for (database.chunks.items) |c| {
                for (ids) |id| {
                    if (std.mem.eql(u8, c.id, id)) {
                        try results.append(allocator, c);
                        break;
                    }
                }
            }
        }
        try writeResponse(allocator, &writer.interface, ChunksResponse{ .data = results.items });
    } else if (std.mem.eql(u8, req.action, "getStatus")) {
        std.debug.print("Processing getStatus...\n", .{});
        var last_updated: i64 = 0;
        var it = database.metadata.iterator();
        while (it.next()) |entry| {
            if (entry.value_ptr.last_indexed > last_updated) {
                last_updated = entry.value_ptr.last_indexed;
            }
        }
        try writeResponse(allocator, &writer.interface, StatusResponse{
            .data = .{
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
                k_score = countKeywordMatches(chunk.content, q);
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
        try writeResponse(allocator, &writer.interface, SearchResponse{ .data = final_matches });
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
            try writeResponse(allocator, &writer.interface, SearchResponse{ .data = final_matches });
        }
    } else {
        try writeResponse(allocator, &writer.interface, ResponseError{ .message = "Unknown action" });
    }

    try writer.flush();

    if (modified) {
        database.saveToFile(io, req.dbPath) catch |err| {
            std.debug.print("Failed to save database: {any}\n", .{err});
        };
    }
}
