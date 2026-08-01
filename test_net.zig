const std = @import("std");
pub fn main() !void {
    std.debug.print("{any}\n", .{@hasDecl(std, "net")});
}
