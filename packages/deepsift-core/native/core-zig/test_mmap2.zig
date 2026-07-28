const std = @import("std");

pub fn main() !void {
    const file = try std.fs.cwd().openFile("test.zdb", .{});
    defer file.close();
    const stat = try file.stat();
    if (stat.size == 0) return;
    
    const ptr = try std.posix.mmap(null, @intCast(stat.size), std.posix.PROT.READ, .{ .TYPE = .SHARED }, file.handle, 0);
    defer std.posix.munmap(ptr);
    
    std.debug.print("mmap size: {}\n", .{ptr.len});
}
