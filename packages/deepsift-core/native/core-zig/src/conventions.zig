const std = @import("std");

pub const NamingEnforcer = struct {
    pub fn enforceConventions(allocator: std.mem.Allocator, symbols: [][]const u8, lang: []const u8) ![][]const u8 {
        var violations = std.ArrayList([]const u8).empty;
        defer violations.deinit(allocator);

        for (symbols) |sym| {
            var valid = true;
            if (std.mem.eql(u8, lang, "typescript") or std.mem.eql(u8, lang, "javascript")) {
                // Must be camelCase or PascalCase. Simple heuristic: shouldn't have '_' unless uppercase constant
                if (std.mem.indexOf(u8, sym, "_") != null and !isUpper(sym)) {
                    valid = false;
                }
            } else if (std.mem.eql(u8, lang, "python")) {
                // Must be snake_case
                if (std.mem.indexOf(u8, sym, "_") == null and isMixedCase(sym)) {
                    valid = false;
                }
            }
            
            if (!valid) {
                try violations.append(allocator, try allocator.dupe(u8, sym));
            }
        }

        const result = try allocator.alloc([]const u8, violations.items.len);
        for (violations.items, 0..) |itm, i| {
            result[i] = itm;
        }
        return result;
    }

    fn isUpper(str: []const u8) bool {
        for (str) |c| {
            if (c >= 'a' and c <= 'z') return false;
        }
        return true;
    }

    fn isMixedCase(str: []const u8) bool {
        var has_lower = false;
        var has_upper = false;
        for (str) |c| {
            if (c >= 'a' and c <= 'z') has_lower = true;
            if (c >= 'A' and c <= 'Z') has_upper = true;
        }
        return has_lower and has_upper;
    }
};
