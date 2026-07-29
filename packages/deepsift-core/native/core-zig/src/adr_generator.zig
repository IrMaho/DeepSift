const std = @import("std");

pub const ADRGenerator = struct {
    pub fn generateADR(allocator: std.mem.Allocator, title: []const u8, decision: []const u8) ![]const u8 {
        return try std.fmt.allocPrint(allocator, 
            \\# Architecture Decision Record
            \\
            \\## Title: {s}
            \\## Decision
            \\{s}
            \\## Status: Accepted
            , .{title, decision});
    }
};
