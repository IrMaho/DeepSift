const std = @import("std");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    var threaded_io = std.Io.Threaded.init(allocator, .{});
    defer threaded_io.deinit();
    const io = threaded_io.io();

    const cwd = std.Io.Dir.cwd();
    const file = try cwd.openFile(io, "test-zig.zig", .{});
    defer file.close();
    _ = file;
}
