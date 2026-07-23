const std = @import("std");

pub const CoverageInfo = struct {
    file_path: []const u8,
    lines_found: u32,
    lines_hit: u32,
    coverage_ratio: f32,
};

pub fn parseLcovNative(allocator: std.mem.Allocator, lcov_content: []const u8) ![]CoverageInfo {
    var coverage_list = std.ArrayList(CoverageInfo).empty;
    defer coverage_list.deinit(allocator);

    var current_file: ?[]const u8 = null;
    var current_found: u32 = 0;
    var current_hit: u32 = 0;

    var line_it = std.mem.splitScalar(u8, lcov_content, '\n');

    while (line_it.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");

        if (std.mem.startsWith(u8, trimmed, "SF:")) {
            current_file = trimmed[3..];
            current_found = 0;
            current_hit = 0;
        } else if (std.mem.startsWith(u8, trimmed, "LF:")) {
            current_found = std.fmt.parseInt(u32, trimmed[3..], 10) catch 0;
        } else if (std.mem.startsWith(u8, trimmed, "LH:")) {
            current_hit = std.fmt.parseInt(u32, trimmed[3..], 10) catch 0;
        } else if (std.mem.eql(u8, trimmed, "end_of_record")) {
            if (current_file) |fpath| {
                const ratio = if (current_found > 0)
                    @as(f32, @floatFromInt(current_hit)) / @as(f32, @floatFromInt(current_found))
                else
                    0.0;

                try coverage_list.append(allocator, .{
                    .file_path = try allocator.dupe(u8, fpath),
                    .lines_found = current_found,
                    .lines_hit = current_hit,
                    .coverage_ratio = ratio,
                });
                current_file = null;
            }
        }
    }

    const result = try allocator.alloc(CoverageInfo, coverage_list.items.len);
    @memcpy(result, coverage_list.items);
    return result;
}
