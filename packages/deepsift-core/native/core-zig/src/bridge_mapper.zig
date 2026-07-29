const std = @import("std");

pub const BridgeLink = struct {
    source_file: []const u8,
    target_ref: []const u8,
    bridge_type: []const u8,
    line: u32,
};

pub fn detectBridges(
    allocator: std.mem.Allocator,
    content: []const u8,
    file_path: []const u8,
) ![]BridgeLink {
    var links = std.ArrayList(BridgeLink).empty;
    errdefer links.deinit(allocator);

    var line_num: u32 = 1;
    var lines = std.mem.splitScalar(u8, content, '\n');

    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");

        if (std.mem.indexOf(u8, trimmed, "postMessage") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, extractArg(trimmed, "postMessage")),
                .bridge_type = "postMessage",
                .line = line_num,
            });
        }

        if (std.mem.indexOf(u8, trimmed, "onmessage") != null or std.mem.indexOf(u8, trimmed, "onMessage") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, "message_handler"),
                .bridge_type = "onMessage",
                .line = line_num,
            });
        }

        if (std.mem.indexOf(u8, trimmed, "ipcMain") != null or std.mem.indexOf(u8, trimmed, "ipcRenderer") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, extractArg(trimmed, "ipc")),
                .bridge_type = "electron_ipc",
                .line = line_num,
            });
        }

        if (std.mem.indexOf(u8, trimmed, "WebSocket") != null or std.mem.indexOf(u8, trimmed, "ws.send") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, "websocket"),
                .bridge_type = "websocket",
                .line = line_num,
            });
        }

        if (std.mem.indexOf(u8, trimmed, "EventEmitter") != null or std.mem.indexOf(u8, trimmed, ".emit(") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, extractArg(trimmed, "emit")),
                .bridge_type = "event_emitter",
                .line = line_num,
            });
        }

        if (std.mem.indexOf(u8, trimmed, "ffi.") != null or std.mem.indexOf(u8, trimmed, "dlopen") != null or std.mem.indexOf(u8, trimmed, "ctypes") != null) {
            try links.append(allocator, .{
                .source_file = try allocator.dupe(u8, file_path),
                .target_ref = try allocator.dupe(u8, "native_binding"),
                .bridge_type = "ffi",
                .line = line_num,
            });
        }

        line_num += 1;
    }

    return try links.toOwnedSlice(allocator);
}

fn extractArg(line: []const u8, keyword: []const u8) []const u8 {
    if (std.mem.indexOf(u8, line, keyword)) |idx| {
        const after = line[@min(idx + keyword.len, line.len)..];
        if (std.mem.indexOf(u8, after, "(")) |paren| {
            const start = paren + 1;
            if (start < after.len) {
                var end = start;
                var depth: u32 = 1;
                while (end < after.len and depth > 0) {
                    if (after[end] == '(') depth += 1;
                    if (after[end] == ')') depth -= 1;
                    if (depth > 0) end += 1;
                }
                const raw = std.mem.trim(u8, after[start..end], " \t'\"");
                if (raw.len > 0 and raw.len < 80) return raw;
            }
        }
    }
    return "unknown";
}
