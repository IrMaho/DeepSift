const std = @import("std");

pub const BlameBlock = struct {
    file_path: []const u8,
    line_start: u32,
    line_end: u32,
    author: []const u8,
    age_category: []const u8,
    ownership_pct: f32,
};

pub fn analyzeOwnership(
    allocator: std.mem.Allocator,
    file_paths: [][]const u8,
    authors: [][]const u8,
    line_counts: []u32,
) ![]BlameBlock {
    var blocks = std.ArrayList(BlameBlock).empty;
    errdefer blocks.deinit(allocator);

    const count = @min(file_paths.len, @min(authors.len, line_counts.len));

    var author_totals = std.StringHashMap(u64).init(allocator);
    defer author_totals.deinit();
    var grand_total: u64 = 0;

    var i: usize = 0;
    while (i < count) : (i += 1) {
        const lines: u64 = line_counts[i];
        grand_total += lines;
        if (author_totals.get(authors[i])) |existing| {
            try author_totals.put(authors[i], existing + lines);
        } else {
            try author_totals.put(authors[i], lines);
        }
    }

    i = 0;
    while (i < count) : (i += 1) {
        const author_total = author_totals.get(authors[i]) orelse 0;
        const pct: f32 = if (grand_total > 0)
            @as(f32, @floatFromInt(author_total)) / @as(f32, @floatFromInt(grand_total)) * 100.0
        else
            0.0;

        var age_cat: []const u8 = "recent";
        if (line_counts[i] > 500) {
            age_cat = "ancient";
        } else if (line_counts[i] > 200) {
            age_cat = "mature";
        } else if (line_counts[i] > 50) {
            age_cat = "established";
        }

        try blocks.append(allocator, .{
            .file_path = file_paths[i],
            .line_start = 1,
            .line_end = line_counts[i],
            .author = authors[i],
            .age_category = age_cat,
            .ownership_pct = pct,
        });
    }

    std.mem.sort(BlameBlock, blocks.items, {}, struct {
        fn lessThan(_: void, a: BlameBlock, b: BlameBlock) bool {
            return a.ownership_pct > b.ownership_pct;
        }
    }.lessThan);

    return try blocks.toOwnedSlice(allocator);
}
