const std = @import("std");
const db = @import("db.zig");
const similarity_simd = @import("similarity_simd.zig");

pub const SimilarityPair = struct {
    chunk_a_id: []const u8,
    chunk_b_id: []const u8,
    similarity: f32,
};

pub fn computeSimilarityMatrixNative(
    allocator: std.mem.Allocator,
    chunks: []const db.Chunk,
    threshold: f32,
    limit: usize,
) ![]SimilarityPair {
    if (chunks.len < 2) return &[_]SimilarityPair{};

    var pairs = std.ArrayList(SimilarityPair).empty;
    defer pairs.deinit(allocator);

    for (0..chunks.len) |i| {
        for (i + 1..chunks.len) |j| {
            const ca = chunks[i];
            const cb = chunks[j];

            // Skip if same file
            if (std.mem.eql(u8, ca.file_path, cb.file_path)) continue;

            const qa = ca.embedding.toQuantizedVector();
            const qb = cb.embedding.toQuantizedVector();
            const sim = similarity_simd.computeQuantizedDotProduct(&qa, &qb);

            if (sim >= threshold) {
                try pairs.append(allocator, .{
                    .chunk_a_id = try allocator.dupe(u8, ca.id),
                    .chunk_b_id = try allocator.dupe(u8, cb.id),
                    .similarity = sim,
                });
            }
        }
    }

    std.mem.sort(SimilarityPair, pairs.items, {}, compareSimilarity);

    const return_count = @min(limit, pairs.items.len);
    const result = try allocator.alloc(SimilarityPair, return_count);
    @memcpy(result, pairs.items[0..return_count]);
    return result;
}

fn compareSimilarity(_: void, a: SimilarityPair, b: SimilarityPair) bool {
    return a.similarity > b.similarity;
}
