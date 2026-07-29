const std = @import("std");

pub const TypeBound = struct {
    symbol: []const u8,
    file_path: []const u8,
    line: u32,
    bound_type: []const u8,
    constraint: []const u8,
};

pub fn extractTypeBounds(
    allocator: std.mem.Allocator,
    content: []const u8,
    file_path: []const u8,
) ![]TypeBound {
    var bounds = std.ArrayList(TypeBound).empty;
    errdefer bounds.deinit(allocator);

    var line_num: u32 = 1;
    var lines = std.mem.splitScalar(u8, content, '\n');

    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");

        if (std.mem.indexOf(u8, trimmed, "extends") != null and std.mem.indexOf(u8, trimmed, "<") != null) {
            const sym = extractSymbolName(trimmed) orelse "anonymous";
            const constraint = extractConstraint(trimmed, "extends") orelse "unknown";

            try bounds.append(allocator, .{
                .symbol = try allocator.dupe(u8, sym),
                .file_path = try allocator.dupe(u8, file_path),
                .line = line_num,
                .bound_type = "extends",
                .constraint = try allocator.dupe(u8, constraint),
            });
        }

        if (std.mem.indexOf(u8, trimmed, "implements") != null) {
            const sym = extractSymbolName(trimmed) orelse "anonymous";
            const constraint = extractConstraint(trimmed, "implements") orelse "unknown";

            try bounds.append(allocator, .{
                .symbol = try allocator.dupe(u8, sym),
                .file_path = try allocator.dupe(u8, file_path),
                .line = line_num,
                .bound_type = "implements",
                .constraint = try allocator.dupe(u8, constraint),
            });
        }

        if (std.mem.indexOf(u8, trimmed, "keyof") != null or std.mem.indexOf(u8, trimmed, "infer") != null) {
            const sym = extractSymbolName(trimmed) orelse "conditional";
            try bounds.append(allocator, .{
                .symbol = try allocator.dupe(u8, sym),
                .file_path = try allocator.dupe(u8, file_path),
                .line = line_num,
                .bound_type = "conditional_type",
                .constraint = try allocator.dupe(u8, trimmed),
            });
        }

        line_num += 1;
    }

    return try bounds.toOwnedSlice(allocator);
}

fn extractSymbolName(line: []const u8) ?[]const u8 {
    const keywords = [_][]const u8{ "interface ", "type ", "class ", "function " };
    for (keywords) |kw| {
        if (std.mem.indexOf(u8, line, kw)) |idx| {
            const after = line[idx + kw.len ..];
            const trimmed = std.mem.trim(u8, after, " \t");
            var end: usize = 0;
            while (end < trimmed.len and trimmed[end] != ' ' and trimmed[end] != '<' and trimmed[end] != '(' and trimmed[end] != '{') {
                end += 1;
            }
            if (end > 0) return trimmed[0..end];
        }
    }
    return null;
}

fn extractConstraint(line: []const u8, keyword: []const u8) ?[]const u8 {
    if (std.mem.indexOf(u8, line, keyword)) |idx| {
        const after = line[idx + keyword.len ..];
        const trimmed = std.mem.trim(u8, after, " \t");
        var end: usize = 0;
        while (end < trimmed.len and trimmed[end] != '{' and trimmed[end] != ',' and trimmed[end] != '>') {
            end += 1;
        }
        if (end > 0) return trimmed[0..end];
    }
    return null;
}
