const std = @import("std");

// Contextual Token Tree-Shaking (Feature #11)
// Minifies code by stripping line comments, block comments, and collapsing multiple empty lines.
// Zero-allocation where possible; returns a newly allocated optimized string.
pub fn minifyCodeNative(allocator: std.mem.Allocator, source: []const u8) ![]const u8 {
    var out = std.ArrayList(u8).empty;
    errdefer out.deinit(allocator);

    var in_line_comment = false;
    var in_block_comment = false;
    var in_string = false;
    var string_char: u8 = 0;
    var last_char_was_newline = false;

    var i: usize = 0;
    while (i < source.len) {
        const c = source[i];

        if (in_block_comment) {
            if (c == '*' and i + 1 < source.len and source[i + 1] == '/') {
                in_block_comment = false;
                i += 2;
                continue;
            }
            i += 1;
            continue;
        }

        if (in_line_comment) {
            if (c == '\n') {
                in_line_comment = false;
            } else {
                i += 1;
                continue;
            }
        }

        if (in_string) {
            try out.append(allocator, c);
            if (c == '\\' and i + 1 < source.len) {
                try out.append(allocator, source[i + 1]);
                i += 2;
                continue;
            }
            if (c == string_char) {
                in_string = false;
            }
            i += 1;
            last_char_was_newline = false;
            continue;
        }

        // Check for string start
        if (c == '"' or c == '\'' or c == '`') {
            in_string = true;
            string_char = c;
            try out.append(allocator, c);
            i += 1;
            last_char_was_newline = false;
            continue;
        }

        // Check for comments
        if (c == '/' and i + 1 < source.len) {
            if (source[i + 1] == '/') {
                in_line_comment = true;
                i += 2;
                continue;
            } else if (source[i + 1] == '*') {
                in_block_comment = true;
                i += 2;
                continue;
            }
        }

        // Collapse multiple newlines/spaces
        if (c == '\n' or c == '\r') {
            if (!last_char_was_newline) {
                try out.append(allocator, '\n');
                last_char_was_newline = true;
            }
            i += 1;
            continue;
        }
        
        // General whitespace minification (collapse multiple spaces)
        if (c == ' ' or c == '\t') {
            // Keep one space if not after a newline
            if (!last_char_was_newline and out.items.len > 0 and out.items[out.items.len - 1] != ' ') {
                try out.append(allocator, ' ');
            }
            i += 1;
            continue;
        }

        last_char_was_newline = false;
        try out.append(allocator, c);
        i += 1;
    }

    return try out.toOwnedSlice(allocator);
}
