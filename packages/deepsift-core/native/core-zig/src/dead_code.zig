const std = @import("std");

pub const DeadSymbol = struct {
    symbol_name: []const u8,
    file_path: []const u8,
    line: u32,
};

pub const SymbolUsage = struct {
    name: []const u8,
    file_path: []const u8,
    line: u32,
    usage_count: u32,
};

pub fn findDeadCodeNative(
    allocator: std.mem.Allocator,
    exported_symbols: []const SymbolUsage,
    all_contents: []const []const u8,
) ![]DeadSymbol {
    var dead_list = std.ArrayList(DeadSymbol).empty;
    defer dead_list.deinit(allocator);

    for (exported_symbols) |sym| {
        var total_uses: u32 = 0;

        for (all_contents) |cnt| {
            if (cnt.len == 0) continue;
            var pos: usize = 0;
            while (pos + sym.name.len <= cnt.len) {
                if (std.mem.indexOf(u8, cnt[pos..], sym.name)) |found_rel| {
                    total_uses += 1;
                    pos += found_rel + sym.name.len;
                } else {
                    break;
                }
            }
        }

        // Exclude entry points from dead code logic
        var is_entry_point = false;
        if (std.mem.endsWith(u8, sym.file_path, "App.tsx") or
            std.mem.endsWith(u8, sym.file_path, "index.ts") or
            std.mem.endsWith(u8, sym.file_path, "index.tsx") or
            std.mem.endsWith(u8, sym.file_path, "main.tsx") or
            std.mem.endsWith(u8, sym.file_path, "code.ts") or
            std.mem.endsWith(u8, sym.file_path, "ui.html")) {
            is_entry_point = true;
        }

        // If only defined once (usage count == 1) or zero external references
        if (total_uses <= 1 and !is_entry_point) {
            try dead_list.append(allocator, .{
                .symbol_name = try allocator.dupe(u8, sym.name),
                .file_path = try allocator.dupe(u8, sym.file_path),
                .line = sym.line,
            });
        }
    }

    const result = try allocator.alloc(DeadSymbol, dead_list.items.len);
    @memcpy(result, dead_list.items);
    return result;
}
