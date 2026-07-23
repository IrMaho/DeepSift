const std = @import("std");

pub const SymbolKind = enum {
    Function,
    Class,
    Interface,
    Enum,
    Variable,
    Import,
    Export,
    Unknown,
};

pub const SymbolInfo = struct {
    name: []const u8,
    kind: SymbolKind,
    line: u32,
};

pub const CloneBlock = struct {
    hash: u64,
    start_line: u32,
    end_line: u32,
    line_count: u32,
};

pub fn fnv1a64(data: []const u8) u64 {
    var hash: u64 = 0xcbf29ce484222325;
    for (data) |byte| {
        hash ^= byte;
        hash = hash *% 0x100000001b3;
    }
    return hash;
}

pub fn extractSymbolsNative(allocator: std.mem.Allocator, content: []const u8) ![]SymbolInfo {
    var symbols = std.ArrayList(SymbolInfo).empty;
    defer symbols.deinit(allocator);

    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        if (std.mem.startsWith(u8, trimmed, "export function ") or std.mem.startsWith(u8, trimmed, "function ")) {
            const name = parseIdentifierAfter(trimmed, "function ");
            if (name.len > 0) {
                try symbols.append(allocator, .{ .name = try allocator.dupe(u8, name), .kind = .Function, .line = line_num });
            }
        } else if (std.mem.startsWith(u8, trimmed, "export class ") or std.mem.startsWith(u8, trimmed, "class ")) {
            const name = parseIdentifierAfter(trimmed, "class ");
            if (name.len > 0) {
                try symbols.append(allocator, .{ .name = try allocator.dupe(u8, name), .kind = .Class, .line = line_num });
            }
        } else if (std.mem.startsWith(u8, trimmed, "export interface ") or std.mem.startsWith(u8, trimmed, "interface ")) {
            const name = parseIdentifierAfter(trimmed, "interface ");
            if (name.len > 0) {
                try symbols.append(allocator, .{ .name = try allocator.dupe(u8, name), .kind = .Interface, .line = line_num });
            }
        } else if (std.mem.startsWith(u8, trimmed, "export const ") or std.mem.startsWith(u8, trimmed, "const ")) {
            const prefix = if (std.mem.startsWith(u8, trimmed, "export const ")) "export const " else "const ";
            const name = parseIdentifierAfter(trimmed, prefix);
            if (name.len > 0) {
                try symbols.append(allocator, .{ .name = try allocator.dupe(u8, name), .kind = .Variable, .line = line_num });
            }
        }
    }

    const result = try allocator.alloc(SymbolInfo, symbols.items.len);
    @memcpy(result, symbols.items);
    return result;
}

pub fn computeCloneHashesNative(allocator: std.mem.Allocator, content: []const u8, min_lines: u32) ![]CloneBlock {
    var lines = std.ArrayList([]const u8).empty;
    defer lines.deinit(allocator);

    var line_it = std.mem.splitScalar(u8, content, '\n');
    while (line_it.next()) |line| {
        try lines.append(allocator, std.mem.trim(u8, line, " \t\r"));
    }

    if (lines.items.len < min_lines) return &[_]CloneBlock{};

    var blocks = std.ArrayList(CloneBlock).empty;
    defer blocks.deinit(allocator);

    const window_size = min_lines;
    var i: usize = 0;
    while (i + window_size <= lines.items.len) : (i += 1) {
        var buf = std.ArrayList(u8).empty;
        defer buf.deinit(allocator);

        for (0..window_size) |j| {
            const l = lines.items[i + j];
            if (l.len > 0 and !std.mem.startsWith(u8, l, "//") and !std.mem.startsWith(u8, l, "*")) {
                try buf.appendSlice(allocator, l);
            }
        }

        if (buf.items.len > 20) { // minimum meaningful content
            const hash = fnv1a64(buf.items);
            try blocks.append(allocator, .{
                .hash = hash,
                .start_line = @intCast(i + 1),
                .end_line = @intCast(i + window_size),
                .line_count = window_size,
            });
        }
    }

    const result = try allocator.alloc(CloneBlock, blocks.items.len);
    @memcpy(result, blocks.items);
    return result;
}

fn parseIdentifierAfter(text: []const u8, prefix: []const u8) []const u8 {
    const idx = std.mem.indexOf(u8, text, prefix) orelse return "";
    const start = idx + prefix.len;
    var end = start;
    while (end < text.len) : (end += 1) {
        const c = text[end];
        const is_ident = (c >= 'a' and c <= 'z') or (c >= 'A' and c <= 'Z') or (c >= '0' and c <= '9') or c == '_';
        if (!is_ident) break;
    }
    return text[start..end];
}
