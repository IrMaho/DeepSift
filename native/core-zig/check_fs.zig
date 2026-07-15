const std = @import("std");

pub fn main() !void {
    const alloc = std.heap.page_allocator;
    var threaded_io = std.Io.Threaded.init(alloc, .{});
    defer threaded_io.deinit();
    const io = threaded_io.io();

    const file = try std.Io.Dir.cwd().openFile(io, "cache.db", .{});
    defer file.close(io);

    const stat = try file.stat(io);
    std.debug.print("File size: {d}\n", .{stat.size});

    var in_buf: [4096]u8 = undefined;
    var file_reader = file.reader(io, &in_buf);
    
    var decompress_buf: [std.compress.flate.max_window_len]u8 = undefined;
    var decompressor = std.compress.flate.Decompress.init(&file_reader.interface, .raw, &decompress_buf);

    var uncompressed = std.Io.Writer.Allocating.init(alloc);
    defer uncompressed.deinit();

    std.debug.print("Decompressing...\n", .{});
    _ = decompressor.reader.streamRemaining(&uncompressed.writer) catch |err| {
        std.debug.print("Read error: {any}\n", .{err});
        return err;
    };
    
    std.debug.print("Decompressed size: {d}\n", .{uncompressed.written().len});
}
