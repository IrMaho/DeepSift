const std = @import("std");

pub fn serializeToonKVNative(allocator: std.mem.Allocator, key: []const u8, value: []const u8, indent_level: u32) ![]const u8 {
    var buf = std.ArrayList(u8).empty;
    defer buf.deinit(allocator);

    for (0..indent_level) |_| {
        try buf.appendSlice(allocator, "  ");
    }
    try buf.appendSlice(allocator, key);
    try buf.appendSlice(allocator, ": ");
    try buf.appendSlice(allocator, value);
    try buf.append(allocator, '\n');

    return try allocator.dupe(u8, buf.items);
}

pub fn serializeToonTabularNative(
    allocator: std.mem.Allocator,
    headers: []const []const u8,
    rows: []const []const []const u8,
) ![]const u8 {
    var buf = std.ArrayList(u8).empty;
    defer buf.deinit(allocator);

    try buf.append(allocator, '[');
    var count_str: [16]u8 = undefined;
    const formatted = std.fmt.bufPrint(&count_str, "{d}", .{rows.len}) catch "0";
    try buf.appendSlice(allocator, formatted);
    try buf.append(allocator, ']');

    try buf.append(allocator, '{');
    for (headers, 0..) |h, i| {
        if (i > 0) try buf.append(allocator, ',');
        try buf.appendSlice(allocator, h);
    }
    try buf.appendSlice(allocator, "}:\n");

    for (rows) |row| {
        try buf.appendSlice(allocator, "  ");
        for (row, 0..) |cell, ci| {
            if (ci > 0) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, cell);
        }
        try buf.append(allocator, '\n');
    }

    return try allocator.dupe(u8, buf.items);
}
