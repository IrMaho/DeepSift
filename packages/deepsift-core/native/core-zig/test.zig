const std = @import("std");

pub fn main(init: std.process.Init) !void {
    var args = try std.process.Args.Iterator.initAllocator(init.minimal.args, std.heap.page_allocator);
    defer args.deinit();
    _ = args.next();
    if (args.next()) |cmd| {
        std.debug.print("cmd: {s}\n", .{cmd});
    }
}
