const std = @import("std");
pub fn main() void {
    var alloc = std.heap.page_allocator;
    var uncompressed = std.Io.Writer.Allocating.init(alloc);
    defer uncompressed.deinit();

    _ = uncompressed.writer();
    // _ = &uncompressed.writer; // Let's see if this compiles too
    std.debug.print("Compiled!\n", .{});
}
