const std = @import("std");
const db = @import("db.zig");
const similarity_simd = @import("similarity_simd.zig");

pub const BM25Config = struct {
    k1: f32 = 1.5,
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

pub fn computeVectorScore(a: db.SiftEmbedding, b: db.SiftEmbedding) f32 {
    const qa = a.toQuantizedVector();
    const qb = b.toQuantizedVector();
    return similarity_simd.computeQuantizedDotProduct(&qa, &qb);
}

fn containsInsensitive(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0 or haystack.len < needle.len) return false;
    var i: usize = 0;
    while (i + needle.len <= haystack.len) : (i += 1) {
        var match = true;
        for (0..needle.len) |j| {
            if (std.ascii.toLower(haystack[i + j]) != std.ascii.toLower(needle[j])) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }
    return false;
}

fn containsNormalized(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return false;
    var norm_haystack: [256]u8 = undefined;
    var norm_needle: [256]u8 = undefined;
    
    var h_len: usize = 0;
    for (haystack) |c| {
        if (c != '-' and c != '_' and c != '.') {
            if (h_len < 256) {
                norm_haystack[h_len] = std.ascii.toLower(c);
                h_len += 1;
            }
        }
    }
    
    var n_len: usize = 0;
    for (needle) |c| {
        if (c != '-' and c != '_' and c != '.') {
            if (n_len < 256) {
                norm_needle[n_len] = std.ascii.toLower(c);
                n_len += 1;
            }
        }
    }
    
    if (n_len == 0 or h_len < n_len) return false;
    
    var i: usize = 0;
    while (i + n_len <= h_len) : (i += 1) {
        var match = true;
        for (0..n_len) |j| {
            if (norm_haystack[i + j] != norm_needle[j]) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }
    return false;
}

fn countMatchedTerms(content: []const u8, file_path: []const u8, terms: []const []const u8) u32 {
    var matched: u32 = 0;
    for (terms) |term| {
        if (countTermFrequency(content, term) > 0 or countTermFrequency(file_path, term) > 0) {
            matched += 1;
        }
    }
    return matched;
}

fn isDefinitionChunk(content: []const u8) bool {
    const markers = [_][]const u8{
        "function ",  "function(",
        "class ",     "class{",
        "interface ", "interface{",
        "export ",    "export{",
        "const ",     "let ",
        "var ",       "type ",
        "enum ",      "struct ",
        "pub fn ",    "fn ",
        "def ",       "async ",
        "=>",         "module.",
    };
    for (markers) |marker| {
        if (std.mem.indexOf(u8, content, marker) != null) return true;
    }
    return false;
}

fn extractBasename(file_path: []const u8) []const u8 {
    var last_sep: usize = 0;
    for (file_path, 0..) |c, i| {
        if (c == '/' or c == '\\') last_sep = i + 1;
    }
    const basename = file_path[last_sep..];
    for (basename, 0..) |c, i| {
        if (c == '.') return basename[0..i];
    }
    return basename;
}

pub fn searchHybridNative(
    allocator: std.mem.Allocator,
    chunks: []const db.Chunk,
    query: []const u8,
    query_vector: ?db.SiftEmbedding,
    top_k: usize,
    bm25_cfg: BM25Config,
    rrf_cfg: RRFConfig,
    graph_db: ?*db.GraphDatabase,
    ivf_idx: ?*@import("ivf.zig").IVFIndex,
    filter_path: ?[]const u8,
) ![]SearchMatch {
    if (chunks.len == 0 or query.len == 0) return &[_]SearchMatch{};

    var terms_list = std.ArrayList([]const u8).empty;
    defer terms_list.deinit(allocator);

    var raw_tokens = std.ArrayList([]const u8).empty;
    defer raw_tokens.deinit(allocator);

    var it = std.mem.tokenizeAny(u8, query, " \t\n\r,-_./:;()[]{}\"'`");
    while (it.next()) |token| {
        if (token.len >= 2) {
            try raw_tokens.append(allocator, token);
        }
    }

    for (raw_tokens.items) |token| {
        try terms_list.append(allocator, token);

        var last_split: usize = 0;
        var i: usize = 1;
        while (i < token.len) : (i += 1) {
            const cur = token[i];
            const prev = token[i - 1];
            const is_boundary =
                (std.ascii.isLower(prev) and std.ascii.isUpper(cur)) or
                (i + 1 < token.len and std.ascii.isUpper(prev) and std.ascii.isUpper(cur) and std.ascii.isLower(token[i + 1]));

            if (is_boundary) {
                const sub = token[last_split..i];
                if (sub.len >= 2) {
                    try terms_list.append(allocator, sub);
                }
                last_split = i;
            }
        }
        if (last_split > 0) {
            const tail = token[last_split..];
            if (tail.len >= 2) {
                try terms_list.append(allocator, tail);
            }
        }
    }

    const term_count = terms_list.items.len;
    if (term_count == 0) return &[_]SearchMatch{};

    var candidate_set = std.AutoHashMap(usize, void).init(allocator);
    defer candidate_set.deinit();

    const use_ivf = false;

    if (ivf_idx) |idx| {
        if (query_vector != null and idx.is_built and idx.centroids.items.len > 0) {
            const q_vec = query_vector.?.toQuantizedVector();
            const n_centroids = idx.centroids.items.len;
            const nprobe = @min(n_centroids, @max(@as(usize, 20), n_centroids / 4));

            const top_clusters = try idx.searchNearestClusters(allocator, &q_vec, nprobe);
            defer allocator.free(top_clusters);

            for (top_clusters) |cluster_score| {
                if (cluster_score.centroid_idx < idx.centroids.items.len) {
                    const centroid = idx.centroids.items[cluster_score.centroid_idx];
                    for (centroid.chunk_indices.items) |ci| {
                        if (ci < chunks.len) {
                            try candidate_set.put(ci, {});
                        }
                    }
                }
            }

            if (candidate_set.count() > 0) {
                // use_ivf = true;
            }
        }
    }

    var candidate_indices = std.ArrayList(usize).empty;
    defer candidate_indices.deinit(allocator);

    if (use_ivf) {
        try candidate_indices.ensureTotalCapacity(allocator, candidate_set.count());
        var set_it = candidate_set.keyIterator();
        while (set_it.next()) |key| {
            if (filter_path) |fp| {
                if (std.mem.indexOf(u8, chunks[key.*].file_path, fp) == null) continue;
            }
            candidate_indices.appendAssumeCapacity(key.*);
        }
    } else {
        try candidate_indices.ensureTotalCapacity(allocator, chunks.len);
        for (0..chunks.len) |ci| {
            if (filter_path) |fp| {
                if (std.mem.indexOf(u8, chunks[ci].file_path, fp) == null) continue;
            }
            candidate_indices.appendAssumeCapacity(ci);
        }
    }

    if (candidate_indices.items.len == 0) return &[_]SearchMatch{};

    const num_candidates = candidate_indices.items.len;

    var total_doc_len: usize = 0;
    for (candidate_indices.items) |ci| {
        total_doc_len += chunks[ci].content.len;
    }
    const avgdl: f32 = if (num_candidates > 0)
        @as(f32, @floatFromInt(total_doc_len)) / @as(f32, @floatFromInt(num_candidates))
    else
        1.0;

    const dfs = try allocator.alloc(usize, term_count);
    defer allocator.free(dfs);
    @memset(dfs, 0);

    for (terms_list.items, 0..) |term, ti| {
        for (candidate_indices.items) |ci| {
            const chunk = chunks[ci];
            if (countTermFrequency(chunk.content, term) > 0 or countTermFrequency(chunk.file_path, term) > 0) {
                dfs[ti] += 1;
            }
        }
    }

    const N = @as(f32, @floatFromInt(num_candidates));
    var matches = try std.ArrayList(SearchMatch).initCapacity(allocator, num_candidates);
    defer matches.deinit(allocator);

    for (candidate_indices.items) |ci| {
        const chunk = chunks[ci];
        var bm25_score: f32 = 0.0;
        const doc_len = @as(f32, @floatFromInt(chunk.content.len));

        for (terms_list.items, 0..) |term, ti| {
            const n_q = @as(f32, @floatFromInt(dfs[ti]));
            if (n_q == 0) continue;
            const idf = std.math.log(f32, std.math.e, 1.0 + (N - n_q + 0.5) / (n_q + 0.5));

            const tf_content = @as(f32, @floatFromInt(countTermFrequency(chunk.content, term)));
            const tf_path = @as(f32, @floatFromInt(countTermFrequency(chunk.file_path, term))) * 5.0;
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

        if (std.mem.eql(u8, chunk.chunk_type, "class") or
            std.mem.eql(u8, chunk.chunk_type, "function") or
            std.mem.eql(u8, chunk.chunk_type, "interface") or
            std.mem.eql(u8, chunk.chunk_type, "type") or
            std.mem.eql(u8, chunk.chunk_type, "component")) {
            bm25_score *= 1.5;
            vec_score *= 1.2;
        }

        try matches.append(allocator, .{
            .chunk_index = ci,
            .bm25_score = bm25_score,
            .vector_score = vec_score,
            .rrf_score = 0.0,
        });
    }

    if (matches.items.len == 0) return &[_]SearchMatch{};

    const match_count = matches.items.len;

    std.mem.sort(SearchMatch, matches.items, {}, compareBM25);
    const bm25_ranks = try allocator.alloc(usize, match_count);
    defer allocator.free(bm25_ranks);
    for (0..match_count) |rank| {
        bm25_ranks[rank] = rank + 1;
    }

    const bm25_order = try allocator.alloc(usize, match_count);
    defer allocator.free(bm25_order);
    for (0..match_count) |rank| {
        bm25_order[rank] = matches.items[rank].chunk_index;
    }

    std.mem.sort(SearchMatch, matches.items, {}, compareVector);
    const vec_ranks = try allocator.alloc(usize, match_count);
    defer allocator.free(vec_ranks);
    for (0..match_count) |rank| {
        vec_ranks[rank] = rank + 1;
    }

    const vec_order = try allocator.alloc(usize, match_count);
    defer allocator.free(vec_order);
    for (0..match_count) |rank| {
        vec_order[rank] = matches.items[rank].chunk_index;
    }

    var bm25_rank_map = std.AutoHashMap(usize, usize).init(allocator);
    defer bm25_rank_map.deinit();
    for (0..match_count) |rank| {
        try bm25_rank_map.put(bm25_order[rank], bm25_ranks[rank]);
    }

    var vec_rank_map = std.AutoHashMap(usize, usize).init(allocator);
    defer vec_rank_map.deinit();
    for (0..match_count) |rank| {
        try vec_rank_map.put(vec_order[rank], vec_ranks[rank]);
    }

    var pr_map: ?std.StringHashMap(f32) = null;
    if (graph_db) |gdb| {
        if (gdb.nodes.items.len > 0) {
            var map = std.StringHashMap(f32).init(allocator);
            for (gdb.nodes.items) |node| {
                if (map.get(node.source_file)) |existing| {
                    if (node.page_rank > existing) {
                        try map.put(node.source_file, node.page_rank);
                    }
                } else {
                    try map.put(node.source_file, node.page_rank);
                }
            }
            pr_map = map;
        }
    }
    defer if (pr_map) |*m| m.deinit();

    var w_bm25 = rrf_cfg.bm25_weight;
    var w_vec = rrf_cfg.vector_weight;

    if (term_count == 1) {
        w_bm25 = 0.70;
        w_vec = 0.30;
    } else if (term_count == 2) {
        w_bm25 = 0.55;
        w_vec = 0.45;
    } else if (term_count >= 5) {
        w_bm25 = 0.30;
        w_vec = 0.70;
    } else {
        w_bm25 = 0.45;
        w_vec = 0.55;
    }

    var max_raw_score: f32 = 0.0;

    for (matches.items) |*m| {
        const r_bm25_val = bm25_rank_map.get(m.chunk_index) orelse match_count;
        const r_vec_val = vec_rank_map.get(m.chunk_index) orelse match_count;

        const r_bm25 = @as(f32, @floatFromInt(r_bm25_val));
        const r_vec = @as(f32, @floatFromInt(r_vec_val));

        const score_bm25 = w_bm25 / (rrf_cfg.k + r_bm25);
        const score_vec = w_vec / (rrf_cfg.k + r_vec);

        var raw_score = score_bm25 + score_vec;

        if (pr_map) |map| {
            const chunk_fp = chunks[m.chunk_index].file_path;
            if (map.get(chunk_fp)) |pr| {
                raw_score *= (1.0 + pr * 5.0);
            }
        }

        const chunk_content = chunks[m.chunk_index].content;
        const chunk_file = chunks[m.chunk_index].file_path;

        const matched_terms = countMatchedTerms(chunk_content, chunk_file, terms_list.items);
        if (term_count > 1 and matched_terms > 0) {
            const coverage = @as(f32, @floatFromInt(matched_terms)) / @as(f32, @floatFromInt(term_count));
            if (coverage >= 1.0) {
                raw_score *= 2.5;
            } else if (coverage >= 0.5) {
                raw_score *= (1.0 + coverage);
            }
        }

        const basename = extractBasename(chunk_file);
        if (basename.len > 0 and containsNormalized(basename, query)) {
            raw_score *= 4.0; // Huge boost for file path normalized exact match!
        }

        if (containsInsensitive(chunk_content, query)) {
            raw_score *= 3.0; // Increase exact chunk match boost to dominate embeddings
        }

        if (isDefinitionChunk(chunk_content)) {
            raw_score *= 1.3;
        }

        const c_type = chunks[m.chunk_index].chunk_type;
        const is_logic_chunk = std.mem.eql(u8, c_type, "function") or std.mem.eql(u8, c_type, "class") or std.mem.eql(u8, c_type, "method");
        const is_import = std.mem.eql(u8, c_type, "import");

        const is_type_file = std.mem.endsWith(u8, chunk_file, ".types.ts") or std.mem.endsWith(u8, chunk_file, ".d.ts") or std.mem.indexOf(u8, chunk_file, "/types/") != null;
        const is_json = std.mem.endsWith(u8, chunk_file, ".json") or std.mem.endsWith(u8, chunk_file, ".arb") or std.mem.indexOf(u8, chunk_file, "i18n") != null or std.mem.endsWith(u8, chunk_file, ".yaml") or std.mem.endsWith(u8, chunk_file, ".md");
        
        if (is_json) {
            raw_score *= 0.05;
        } else if (is_type_file) {
            raw_score *= 0.35;
        } else if (is_logic_chunk) {
            raw_score *= 1.6;
        }

        if (is_import) {
            raw_score *= 0.1;
        }

        const content_len = chunk_content.len;
        if (content_len > 200) {
            raw_score *= 1.15;
        } else if (content_len < 20) {
            raw_score *= 0.5;
        }

        m.rrf_score = raw_score;
        if (raw_score > max_raw_score) {
            max_raw_score = raw_score;
        }
    }

    // Removed normalization to 1.0 to allow cross-realm score comparison

    std.mem.sort(SearchMatch, matches.items, {}, compareRRF);

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
