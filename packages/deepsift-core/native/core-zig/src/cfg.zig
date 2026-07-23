const std = @import("std");

pub const CFGBranch = struct {
    branch_type: []const u8,
    condition: []const u8,
    line: u32,
};

pub fn extractControlFlowNative(allocator: std.mem.Allocator, content: []const u8) ![]CFGBranch {
    var branches = std.ArrayList(CFGBranch).empty;
    defer branches.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        if (std.mem.startsWith(u8, trimmed, "if ") or std.mem.startsWith(u8, trimmed, "if(")) {
            try branches.append(allocator, .{
                .branch_type = "if_branch",
                .condition = try allocator.dupe(u8, trimmed),
                .line = line_num,
            });
        } else if (std.mem.startsWith(u8, trimmed, "else if") or std.mem.startsWith(u8, trimmed, "} else if")) {
            try branches.append(allocator, .{
                .branch_type = "else_if_branch",
                .condition = try allocator.dupe(u8, trimmed),
                .line = line_num,
            });
        } else if (std.mem.startsWith(u8, trimmed, "switch") or std.mem.startsWith(u8, trimmed, "switch(")) {
            try branches.append(allocator, .{
                .branch_type = "switch_branch",
                .condition = try allocator.dupe(u8, trimmed),
                .line = line_num,
            });
        } else if (std.mem.startsWith(u8, trimmed, "catch") or std.mem.startsWith(u8, trimmed, "} catch")) {
            try branches.append(allocator, .{
                .branch_type = "catch_branch",
                .condition = try allocator.dupe(u8, trimmed),
                .line = line_num,
            });
        }
    }

    const result = try allocator.alloc(CFGBranch, branches.items.len);
    @memcpy(result, branches.items);
    return result;
}
