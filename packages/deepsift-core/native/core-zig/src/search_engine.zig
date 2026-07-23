const std = @import("std");
const db = @import("db.zig");

pub const BM25Config = struct {
    k1: f32 = 1.2,
    b: f32 = 0.75,
};

pub const RRFConfig = struct {
    k: f32 = 60.0,
    bm25_weight: f32 = 0.5,
    vector_weight: f32 = 0.5,
};

pub const SearchMatch = struct {
    chunk_index: usize,
    bm25_score: f32,
    vector_score: f32,
    rrf_score: f32,
};

pub fn countTermFrequency(text: []const u8, term: []const u8) u32 {
    if (text.len == 0 or term.len == 0 or text.len < term.len) return 0;
    var count: u32 = 0;
    var i: usize = 0;
    while (i + term.len <= text.len) {
        var match = true;
        for (0..term.len) |j| {
            if (std.ascii.toLower(text[i + j]) != std.ascii.toLower(term[j])) {
                match = false;
                break;
            }
        }
        if (match) {
            count += 1;
            i += term.len;
        } else {
            i += 1;
        }
    }
    return count;
}

pub fn hammingDistanceSIMD(a: [db.VECTOR_BQ_U32_COUNT]u32, b: [db.VECTOR_BQ_U32_COUNT]u32) u32 {
    var dist: u32 = 0;
    inline for (0..db.VECTOR_BQ_U32_COUNT) |i| {
        dist += @popCount(a[i] ^ b[i]);
    }
    return dist;
}

pub fn computeVectorScore(a: [db.VECTOR_BQ_U32_COUNT]u32, b: [db.VECTOR_BQ_U32_COUNT]u32) f32 {
    const dist = hammingDistanceSIMD(a, b);
    const max_dim: f32 = @floatFromInt(db.VECTOR_DIM);
    return 1.0 - (@as(f32, @floatFromInt(dist)) / max_dim);
}

pub fn searchHybridNative(
    allocator: std.mem.Allocator,
    chunks: []const db.Chunk,
    query: []const u8,
    query_vector: ?[db.VECTOR_BQ_U32_COUNT]u32,
    top_k: usize,
    bm25_cfg: BM25Config,
    rrf_cfg: RRFConfig,
) ![]SearchMatch {
    if (chunks.len == 0 or query.len == 0) return &[_]SearchMatch{};

    var terms_list = std.ArrayList([]const u8).empty;
    defer terms_list.deinit(allocator);

    var it = std.mem.tokenizeAny(u8, query, " \t\n\r,-_./:;()[]{}");
    while (it.next()) |token| {
        if (token.len >= 2) {
            try terms_list.append(allocator, token);
        }
    }

    const term_count = terms_list.items.len;
    if (term_count == 0) return &[_]SearchMatch{};

    // 1. Calculate Average Document Length (avgdl)
    var total_doc_len: usize = 0;
    for (chunks) |chunk| {
        total_doc_len += chunk.content.len;
    }
    const avgdl = @as(f32, @floatFromInt(total_doc_len)) / @as(f32, @floatFromInt(chunks.len));

    // 2. Calculate Document Frequency (df) for each term
    const dfs = try allocator.alloc(usize, term_count);
    defer allocator.free(dfs);
    @memset(dfs, 0);

    for (terms_list.items, 0..) |term, ti| {
        for (chunks) |chunk| {
            if (countTermFrequency(chunk.content, term) > 0 or countTermFrequency(chunk.file_path, term) > 0) {
                dfs[ti] += 1;
            }
        }
    }

    // 3. Compute BM25 & Vector Scores for each chunk
    const N = @as(f32, @floatFromInt(chunks.len));
    var matches = try std.ArrayList(SearchMatch).initCapacity(allocator, chunks.len);
    defer matches.deinit(allocator);

    for (chunks, 0..) |chunk, ci| {
        var bm25_score: f32 = 0.0;
        const doc_len = @as(f32, @floatFromInt(chunk.content.len));

        for (terms_list.items, 0..) |term, ti| {
            const n_q = @as(f32, @floatFromInt(dfs[ti]));
            const idf = std.math.log(f32, std.math.e, 1.0 + (N - n_q + 0.5) / (n_q + 0.5));
            
            const tf_content = @as(f32, @floatFromInt(countTermFrequency(chunk.content, term)));
            const tf_path = @as(f32, @floatFromInt(countTermFrequency(chunk.file_path, term))) * 3.0; // Path bonus
            const f_q = tf_content + tf_path;

            if (f_q > 0) {
                const num = f_q * (bm25_cfg.k1 + 1.0);
                const denom = f_q + bm25_cfg.k1 * (1.0 - bm25_cfg.b + bm25_cfg.b * (doc_len / avgdl));
                bm25_score += idf * (num / denom);
            }
        }

        var vec_score: f32 = 0.0;
        if (query_vector) |q_vec| {
            vec_score = computeVectorScore(q_vec, chunk.embedding);
        }

        try matches.append(allocator, .{
            .chunk_index = ci,
            .bm25_score = bm25_score,
            .vector_score = vec_score,
            .rrf_score = 0.0,
        });
    }

    // 4. Sort by BM25 to get BM25 ranks
    std.mem.sort(SearchMatch, matches.items, {}, compareBM25);
    const bm25_ranks = try allocator.alloc(usize, matches.items.len);
    defer allocator.free(bm25_ranks);

    for (matches.items, 0..) |m, rank| {
        bm25_ranks[m.chunk_index] = rank + 1;
    }

    // 5. Sort by Vector Score to get Vector ranks
    std.mem.sort(SearchMatch, matches.items, {}, compareVector);
    const vec_ranks = try allocator.alloc(usize, matches.items.len);
    defer allocator.free(vec_ranks);

    for (matches.items, 0..) |m, rank| {
        vec_ranks[m.chunk_index] = rank + 1;
    }

    // 6. Calculate RRF Score
    for (matches.items) |*m| {
        const r_bm25 = @as(f32, @floatFromInt(bm25_ranks[m.chunk_index]));
        const r_vec = @as(f32, @floatFromInt(vec_ranks[m.chunk_index]));

        const score_bm25 = rrf_cfg.bm25_weight / (rrf_cfg.k + r_bm25);
        const score_vec = rrf_cfg.vector_weight / (rrf_cfg.k + r_vec);

        m.rrf_score = score_bm25 + score_vec;
    }

    // 7. Sort by final RRF score
    std.mem.sort(SearchMatch, matches.items, {}, compareRRF);

    // Return top_k
    const return_count = @min(top_k, matches.items.len);
    const result = try allocator.alloc(SearchMatch, return_count);
    @memcpy(result, matches.items[0..return_count]);
    return result;
}

fn compareBM25(_: void, a: SearchMatch, b: SearchMatch) bool {
    return a.bm25_score > b.bm25_score;
}

fn compareVector(_: void, a: SearchMatch, b: SearchMatch) bool {
    return a.vector_score > b.vector_score;
}

fn compareRRF(_: void, a: SearchMatch, b: SearchMatch) bool {
    return a.rrf_score > b.rrf_score;
}
