const std = @import("std");

pub fn main() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    var threaded_io = std.Io.Threaded.init(allocator, .{});
    defer threaded_io.deinit();
    const io = threaded_io.io();

    var out_buf: [65536]u8 = undefined;
    const stdout = std.Io.File.stdout();
    var writer = stdout.writer(io, &out_buf);

    try writer.interface.writeAll("{\"success\":true}\n");
    try writer.flush();
}
