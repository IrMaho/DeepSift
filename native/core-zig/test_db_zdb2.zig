const std = @import("std");
const db = @import("src/db.zig");

pub fn main() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var database = db.Database.init(allocator);
    defer database.deinit();

    // Add metadata
    try database.addMetadata(.{
        .file_path = "src/main.zig",
        .file_hash = "12345",
        .last_indexed = 1000,
        .chunk_count = 1,
    });

    // Add chunk
    var embed: [12]u32 = undefined;
    @memset(&embed, 1);
    try database.addChunk(.{
        .id = "chunk1",
        .file_path = "src/main.zig",
        .content = "hello world",
        .start_line = 1,
        .end_line = 2,
        .chunk_type = "function",
        .language = "zig",
        .embedding = embed,
    });

    var threaded_io = std.Io.Threaded.init(allocator, .{});
    defer threaded_io.deinit();
    const io = threaded_io.io();

    std.debug.print("Saving to test.zdb...\n", .{});
    try database.saveToFile(io, "test.zdb");
    
    std.debug.print("Loading from test.zdb...\n", .{});
    var database2 = db.Database.init(allocator);
    defer database2.deinit();
    try database2.loadFromFile(io, "test.zdb");

    var g = db.GraphDatabase.init(allocator);
    defer g.deinit();
    try g.nodes.append(allocator, .{
        .id = "node1",
        .label = "Node1",
        .source_file = "src/main.zig",
        .source_location = "line 1",
        .community = 1,
        .in_degree = 0,
        .out_degree = 0,
        .page_rank = 1.0,
    });
    try g.edges.append(allocator, .{
        .source = 0,
        .target = 0,
        .relation = "calls",
        .confidence = "high",
    });

    std.debug.print("Saving Graph...\n", .{});
    try g.saveToFile(io, "test.grf");
    std.debug.print("Loading Graph...\n", .{});
    try g.loadFromFile(io, "test.grf");

    std.debug.print("Done!\n", .{});
}
