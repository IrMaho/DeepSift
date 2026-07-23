const std = @import("std");

pub const L10nKey = struct {
    key: []const u8,
    value: []const u8,
    line: u32,
};

pub fn extractL10nKeysNative(allocator: std.mem.Allocator, content: []const u8) ![]L10nKey {
    var keys = std.ArrayList(L10nKey).empty;
    defer keys.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Simple JSON / ARB / YAML key-value match: "key": "value" or key: value
        if (std.mem.indexOf(u8, trimmed, ":") != null) {
            var col_it = std.mem.splitScalar(u8, trimmed, ':');
            const raw_key = col_it.next() orelse "";
            const raw_val = col_it.rest();

            const k = std.mem.trim(u8, raw_key, " \t\r\"'");
            const v = std.mem.trim(u8, raw_val, " \t\r,\"'");

            if (k.len > 0 and v.len > 0 and !std.mem.startsWith(u8, k, "//")) {
                try keys.append(allocator, .{
                    .key = try allocator.dupe(u8, k),
                    .value = try allocator.dupe(u8, v),
                    .line = line_num,
                });
            }
        }
    }

    const result = try allocator.alloc(L10nKey, keys.items.len);
    @memcpy(result, keys.items);
    return result;
}
