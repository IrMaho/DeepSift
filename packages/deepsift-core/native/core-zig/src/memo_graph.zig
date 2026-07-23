const std = @import("std");

pub const NoteInfo = struct {
    id: []const u8,
    tag: []const u8,
    title: []const u8,
    content: []const u8,
    status: []const u8,
};

pub const NoteEdge = struct {
    source_id: []const u8,
    target_id: []const u8,
    weight: f32,
};

pub fn buildInsightGraphNative(
    allocator: std.mem.Allocator,
    notes: []const NoteInfo,
    min_weight: f32,
) ![]NoteEdge {
    if (notes.len < 2) return &[_]NoteEdge{};

    var edges = std.ArrayList(NoteEdge).empty;
    defer edges.deinit(allocator);

    for (0..notes.len) |i| {
        for (i + 1..notes.len) |j| {
            const na = notes[i];
            const nb = notes[j];

            var weight: f32 = 0.0;

            // Tag match bonus
            if (std.mem.eql(u8, na.tag, nb.tag)) {
                weight += 0.5;
            }

            // Status match bonus
            if (std.mem.eql(u8, na.status, nb.status)) {
                weight += 0.2;
            }

            // Word overlap in titles
            var it_a = std.mem.tokenizeAny(u8, na.title, " \t\n\r");
            while (it_a.next()) |word_a| {
                if (word_a.len < 3) continue;
                if (std.mem.indexOf(u8, nb.title, word_a) != null or std.mem.indexOf(u8, nb.content, word_a) != null) {
                    weight += 0.3;
                }
            }

            if (weight >= min_weight) {
                try edges.append(allocator, .{
                    .source_id = try allocator.dupe(u8, na.id),
                    .target_id = try allocator.dupe(u8, nb.id),
                    .weight = weight,
                });
            }
        }
    }

    const result = try allocator.alloc(NoteEdge, edges.items.len);
    @memcpy(result, edges.items);
    return result;
}
