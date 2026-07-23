const std = @import("std");

pub const FileWalkInfo = struct {
    file_path: []const u8,
    file_hash: []const u8,
    file_size: u64,
};

pub fn isIgnoredDir(dir_name: []const u8) bool {
    const ignored = [_][]const u8{
        "node_modules",
        ".git",
        ".deepsift",
        "dist",
        "build",
        ".agents",
        "coverage",
        "bin",
    };
    for (ignored) |ig| {
        if (std.mem.eql(u8, dir_name, ig)) return true;
    }
    return false;
}

pub fn computeSha256Hex(allocator: std.mem.Allocator, content: []const u8) ![]const u8 {
    var hash: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(content, &hash, .{});

    var hex = try allocator.alloc(u8, 64);
    const hex_chars = "0123456789abcdef";
    for (hash, 0..) |byte, i| {
        hex[i * 2] = hex_chars[byte >> 4];
        hex[i * 2 + 1] = hex_chars[byte & 0x0F];
    }
    return hex;
}

pub fn walkDirectoryNative(allocator: std.mem.Allocator, io: anytype, root_path: []const u8) ![]FileWalkInfo {
    var file_list = std.ArrayList(FileWalkInfo).empty;
    defer file_list.deinit(allocator);

    var dir = std.Io.Dir.cwd().openDir(io, root_path, .{ .iterate = true }) catch return &[_]FileWalkInfo{};
    defer dir.close(io);

    var walker = dir.walk(allocator) catch return &[_]FileWalkInfo{};
    defer walker.deinit();

    while (walker.next(io) catch null) |entry| {
        if (entry.kind == .file) {
            var skip = false;
            var path_it = std.mem.splitAny(u8, entry.path, "/\\");
            while (path_it.next()) |part| {
                if (isIgnoredDir(part)) {
                    skip = true;
                    break;
                }
            }
            if (skip) continue;

            const file = dir.openFile(io, entry.path, .{}) catch continue;
            defer file.close(io);

            const stat = file.stat(io) catch continue;
            if (stat.size > 10 * 1024 * 1024) continue;

            const content = allocator.alloc(u8, stat.size) catch continue;
            defer allocator.free(content);

            var file_reader = file.reader(io, content);
            _ = file_reader.interface.readSliceAll(content) catch continue;

            const hash_hex = computeSha256Hex(allocator, content) catch continue;

            try file_list.append(allocator, .{
                .file_path = try allocator.dupe(u8, entry.path),
                .file_hash = hash_hex,
                .file_size = stat.size,
            });
        }
    }

    const result = try allocator.alloc(FileWalkInfo, file_list.items.len);
    @memcpy(result, file_list.items);
    return result;
}
