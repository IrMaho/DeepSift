const std = @import("std");
const db = @import("db.zig");

pub const IndexShard = struct {
    shard_id: u32,
    chunk_count: u32,
    start_index: u32,
    end_index: u32,
};

pub fn computeShards(
    allocator: std.mem.Allocator,
    total_chunks: u32,
    num_shards: u32,
) ![]IndexShard {
    var shards = std.ArrayList(IndexShard).empty;
    errdefer shards.deinit(allocator);

    if (total_chunks == 0 or num_shards == 0) return try shards.toOwnedSlice(allocator);

    const effective_shards = @min(num_shards, total_chunks);
    const base_size = total_chunks / effective_shards;
    const remainder = total_chunks % effective_shards;

    var current: u32 = 0;
    var shard_id: u32 = 0;
    while (shard_id < effective_shards) : (shard_id += 1) {
        var size = base_size;
        if (shard_id < remainder) size += 1;

        try shards.append(allocator, .{
            .shard_id = shard_id,
            .chunk_count = size,
            .start_index = current,
            .end_index = current + size,
        });

        current += size;
    }

    return try shards.toOwnedSlice(allocator);
}

pub fn searchShard(
    chunks: []const db.Chunk,
    shard: IndexShard,
    query_embedding: db.SiftEmbedding,
    top_k: usize,
    allocator: std.mem.Allocator,
) ![]ShardResult {
    var results = std.ArrayList(ShardResult).empty;
    errdefer results.deinit(allocator);

    const start = @min(shard.start_index, @as(u32, @intCast(chunks.len)));
    const end = @min(shard.end_index, @as(u32, @intCast(chunks.len)));

    var i: u32 = start;
    while (i < end) : (i += 1) {
        const chunk = chunks[i];
        var score: f32 = 0.0;
        var j: usize = 0;
        while (j < db.EMBEDDING_DIM) : (j += 1) {
            score += query_embedding[j] * chunk.embedding[j];
        }
        try results.append(allocator, .{
            .chunk_index = i,
            .score = score,
        });
    }

    std.mem.sort(ShardResult, results.items, {}, struct {
        fn lessThan(_: void, a: ShardResult, b: ShardResult) bool {
            return a.score > b.score;
        }
    }.lessThan);

    const final_count = @min(top_k, results.items.len);
    if (final_count < results.items.len) {
        results.shrinkRetainingCapacity(final_count);
    }

    return try results.toOwnedSlice(allocator);
}

pub const ShardResult = struct {
    chunk_index: u32,
    score: f32,
};
