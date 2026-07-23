const std = @import("std");

pub const ResourceRef = struct {
    asset_path: []const u8,
    asset_type: []const u8,
    line: u32,
};

pub fn isAssetExt(ext: []const u8) bool {
    const asset_exts = [_][]const u8{
        ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico",
        ".woff", ".woff2", ".ttf", ".eot",
        ".wasm", ".db", ".sqldb", ".bin",
    };
    for (asset_exts) |a_ext| {
        if (std.mem.endsWith(u8, ext, a_ext)) return true;
    }
    return false;
}

pub fn mapResourceRefsNative(allocator: std.mem.Allocator, content: []const u8) ![]ResourceRef {
    var refs = std.ArrayList(ResourceRef).empty;
    defer refs.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        var token_it = std.mem.tokenizeAny(u8, line, " \t\r\"'()=<>;");

        while (token_it.next()) |token| {
            if (token.len > 4) {
                const ext = std.fs.path.extension(token);
                if (isAssetExt(ext)) {
                    var a_type: []const u8 = "image";
                    if (std.mem.eql(u8, ext, ".wasm")) {
                        a_type = "wasm";
                    } else if (std.mem.eql(u8, ext, ".woff") or std.mem.eql(u8, ext, ".ttf")) {
                        a_type = "font";
                    } else if (std.mem.eql(u8, ext, ".db") or std.mem.eql(u8, ext, ".bin")) {
                        a_type = "binary_data";
                    }

                    try refs.append(allocator, .{
                        .asset_path = try allocator.dupe(u8, token),
                        .asset_type = a_type,
                        .line = line_num,
                    });
                }
            }
        }
    }

    const result = try allocator.alloc(ResourceRef, refs.items.len);
    @memcpy(result, refs.items);
    return result;
}
