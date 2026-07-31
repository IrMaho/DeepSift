const std = @import("std");

pub const CFGBranch = struct {
    branch_type: []const u8,
    condition: []const u8,
    line: u32,
    nesting_depth: u32,
    complexity_penalty: u32,
};

pub fn extractControlFlowNative(allocator: std.mem.Allocator, content: []const u8) ![]CFGBranch {
    var branches = std.ArrayList(CFGBranch).empty;
    defer branches.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');
    var current_depth: u32 = 0;

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Feature #7: Cognitive Load tracking via nesting depth
        for (trimmed) |char| {
            if (char == '{') current_depth += 1;
            if (char == '}' and current_depth > 0) current_depth -= 1;
        }

        var branch_type: ?[]const u8 = null;

        if (std.mem.startsWith(u8, trimmed, "if ") or std.mem.startsWith(u8, trimmed, "if(")) {
            branch_type = "if_branch";
        } else if (std.mem.startsWith(u8, trimmed, "else if") or std.mem.startsWith(u8, trimmed, "} else if")) {
            branch_type = "else_if_branch";
        } else if (std.mem.startsWith(u8, trimmed, "switch") or std.mem.startsWith(u8, trimmed, "switch(")) {
            branch_type = "switch_branch";
        } else if (std.mem.startsWith(u8, trimmed, "catch") or std.mem.startsWith(u8, trimmed, "} catch")) {
            branch_type = "catch_branch";
        }

        if (branch_type) |bt| {
            const penalty = if (current_depth > 2) current_depth * 2 else current_depth;
            try branches.append(allocator, .{
                .branch_type = bt,
                .condition = try allocator.dupe(u8, trimmed),
                .line = line_num,
                .nesting_depth = current_depth,
                .complexity_penalty = penalty,
            });
        }
    }

    const result = try allocator.alloc(CFGBranch, branches.items.len);
    @memcpy(result, branches.items);
    return result;
}
