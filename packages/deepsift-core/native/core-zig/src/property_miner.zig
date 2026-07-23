const std = @import("std");

pub const ColorToken = struct {
    value: []const u8,
    line: u32,
};

pub const NamingConventionStats = struct {
    camel_case: u32 = 0,
    pascal_case: u32 = 0,
    snake_case: u32 = 0,
    kebab_case: u32 = 0,
};

pub fn isHexChar(c: u8) bool {
    return (c >= '0' and c <= '9') or (c >= 'a' and c <= 'f') or (c >= 'A' and c <= 'F');
}

pub fn mineColorTokensNative(allocator: std.mem.Allocator, content: []const u8) ![]ColorToken {
    var tokens = std.ArrayList(ColorToken).empty;
    defer tokens.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        
        // Scan for #HEX colors (#FFF, #FFFF, #FFFFFF, #FFFFFFFF)
        var i: usize = 0;
        while (i < line.len) {
            if (line[i] == '#') {
                var len: usize = 1;
                while (i + len < line.len and isHexChar(line[i + len]) and len <= 9) {
                    len += 1;
                }
                if (len == 4 or len == 5 or len == 7 or len == 9) {
                    const color_hex = line[i .. i + len];
                    try tokens.append(allocator, .{
                        .value = try allocator.dupe(u8, color_hex),
                        .line = line_num,
                    });
                    i += len;
                    continue;
                }
            }
            i += 1;
        }
    }

    const result = try allocator.alloc(ColorToken, tokens.items.len);
    @memcpy(result, tokens.items);
    return result;
}

pub fn analyzeNamingConventionsNative(content: []const u8) NamingConventionStats {
    var stats = NamingConventionStats{};
    var it = std.mem.tokenizeAny(u8, content, " \t\n\r(){}[];:=+-><,.!&|^~\"'");

    while (it.next()) |token| {
        if (token.len < 3) continue;

        var has_lower = false;
        var has_upper = false;
        var has_underscore = false;
        var has_hyphen = false;

        for (token) |c| {
            if (c >= 'a' and c <= 'z') has_lower = true;
            if (c >= 'A' and c <= 'Z') has_upper = true;
            if (c == '_') has_underscore = true;
            if (c == '-') has_hyphen = true;
        }

        if (has_underscore and !has_hyphen) {
            stats.snake_case += 1;
        } else if (has_hyphen and !has_underscore) {
            stats.kebab_case += 1;
        } else if (has_lower and has_upper and !(token[0] >= 'A' and token[0] <= 'Z')) {
            stats.camel_case += 1;
        } else if (has_lower and has_upper and (token[0] >= 'A' and token[0] <= 'Z')) {
            stats.pascal_case += 1;
        }
    }

    return stats;
}
