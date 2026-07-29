const std = @import("std");
const db = @import("db.zig");

pub const RealmFusionResult = struct {
    chunk_id: []const u8,
    file_path: []const u8,
    content: []const u8,
    primary_score: f32,
    realm_score: f32,
    fused_score: f32,
};

pub fn fuseRealmSearch(
    allocator: std.mem.Allocator,
    primary_chunks: []const db.Chunk,
    realm_chunks: []const db.Chunk,
    query_embedding: db.SiftEmbedding,
    top_k: usize,
    realm_weight: f32,
) ![]RealmFusionResult {
    var results = std.ArrayList(RealmFusionResult).empty;
    errdefer results.deinit(allocator);

    const primary_weight = 1.0 - realm_weight;

    for (primary_chunks) |chunk| {
        var score: f32 = 0.0;
        var j: usize = 0;
        while (j < db.EMBEDDING_DIM) : (j += 1) {
            score += query_embedding[j] * chunk.embedding[j];
        }

        var best_realm_score: f32 = 0.0;
        for (realm_chunks) |rc| {
            var rs: f32 = 0.0;
            var k: usize = 0;
            while (k < db.EMBEDDING_DIM) : (k += 1) {
                rs += chunk.embedding[k] * rc.embedding[k];
            }
            if (rs > best_realm_score) best_realm_score = rs;
        }

        const fused = (score * primary_weight) + (best_realm_score * realm_weight * 0.3);

        try results.append(allocator, .{
            .chunk_id = chunk.id,
            .file_path = chunk.file_path,
            .content = chunk.content,
            .primary_score = score,
            .realm_score = best_realm_score,
            .fused_score = fused,
        });
    }

    std.mem.sort(RealmFusionResult, results.items, {}, struct {
        fn lessThan(_: void, a: RealmFusionResult, b: RealmFusionResult) bool {
            return a.fused_score > b.fused_score;
        }
    }.lessThan);

    const final_count = @min(top_k, results.items.len);
    if (final_count < results.items.len) {
        results.shrinkRetainingCapacity(final_count);
    }

    return try results.toOwnedSlice(allocator);
}
