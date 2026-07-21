const std = @import("std");

pub fn main() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var uncompressed = std.Io.Writer.Allocating.init(allocator);
    defer uncompressed.deinit();

    try uncompressed.writer.writeAll("Hello world! Hello world! Hello world!");

    var compressed = std.Io.Writer.Allocating.init(allocator);
    defer compressed.deinit();

    var compressor = try std.compress.flate.Compress.init(allocator, .raw, .{});
    defer compressor.deinit();
    
    // Not exactly sure of the API, let's look at compiler errors.
    try compressor.compress(&compressed.writer, uncompressed.written(), .{});

    std.debug.print("Compressed size: {d}\n", .{compressed.written().len});
}
