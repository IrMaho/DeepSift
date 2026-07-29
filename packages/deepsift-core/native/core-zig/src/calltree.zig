const std = @import("std");

pub const CallLink = struct {
    caller: []const u8,
    callee: []const u8,
    line: u32,
    kind: []const u8,
};

pub fn analyzeCallTreeNative(allocator: std.mem.Allocator, content: []const u8, target_symbol: []const u8) ![]CallLink {
    var links = std.ArrayList(CallLink).empty;
    defer links.deinit(allocator);

    var current_function: []const u8 = "global";
    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Track function scope
        if (std.mem.indexOf(u8, trimmed, "function ") != null or std.mem.indexOf(u8, trimmed, "class ") != null) {
            var tokens = std.mem.tokenizeAny(u8, trimmed, " \t(){}:");
            while (tokens.next()) |token| {
                if (std.mem.eql(u8, token, "function") or std.mem.eql(u8, token, "class")) {
                    if (tokens.next()) |name| {
                        current_function = try allocator.dupe(u8, name);
                    }
                }
            }
        }

        // Check if line references target symbol directly
        var is_direct_match = std.mem.indexOf(u8, trimmed, target_symbol) != null;
        var is_ipc_message = false;
        
        // Feature #2: Cross-Language Event Message Tracer (Heuristic)
        // Check if this line is emitting an event (e.g. type: 'target_symbol')
        if (!is_direct_match) {
             if (std.mem.indexOf(u8, trimmed, "type: '") != null or std.mem.indexOf(u8, trimmed, "type: \"") != null) {
                 if (std.mem.indexOf(u8, trimmed, target_symbol) != null) {
                     is_ipc_message = true;
                     is_direct_match = true;
                 }
             }
        }

        if (is_direct_match) {
            var kind: []const u8 = "call";
            if (is_ipc_message or std.mem.indexOf(u8, trimmed, "postMessage") != null or std.mem.indexOf(u8, trimmed, "onmessage") != null) {
                kind = "event_message";
            } else if (std.mem.indexOf(u8, trimmed, "dispatch") != null) {
                kind = "state_dispatch";
            }

            try links.append(allocator, .{
                .caller = try allocator.dupe(u8, current_function),
                .callee = try allocator.dupe(u8, target_symbol),
                .line = line_num,
                .kind = kind,
            });
        }
    }

    const result = try allocator.alloc(CallLink, links.items.len);
    @memcpy(result, links.items);
    return result;
}
