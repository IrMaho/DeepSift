const std = @import("std");
const db = @import("db.zig");
const similarity_simd = @import("similarity_simd.zig");

pub const Centroid = struct {
    embedding: db.SiftEmbedding,
    chunk_indices: std.ArrayList(usize),
};

pub const IVFIndex = struct {
    allocator: std.mem.Allocator,
    centroids: std.ArrayList(Centroid),
    is_built: bool,

    pub fn init(allocator: std.mem.Allocator) IVFIndex {
        return .{
            .allocator = allocator,
            .centroids = std.ArrayList(Centroid).empty,
            .is_built = false,
        };
    }

    pub fn deinit(self: *IVFIndex) void {
        for (self.centroids.items) |*c| {
            c.chunk_indices.deinit(self.allocator);
        }
        self.centroids.deinit(self.allocator);
    }

    pub fn build(self: *IVFIndex, chunks: []const db.Chunk, k: usize) !void {
        if (self.is_built) return;
        if (chunks.len == 0) return;

        var prng = std.Random.DefaultPrng.init(42);
        const rand = prng.random();

        const num_centroids = @min(k, chunks.len);
        try self.centroids.ensureTotalCapacity(self.allocator, num_centroids);

        // 1. Initialize centroids randomly from actual chunks
        var i: usize = 0;
        while (i < num_centroids) : (i += 1) {
            const random_idx = rand.intRangeLessThan(usize, 0, chunks.len);
            const centroid = Centroid{
                .embedding = chunks[random_idx].embedding,
                .chunk_indices = std.ArrayList(usize).empty,
            };
            self.centroids.appendAssumeCapacity(centroid);
        }

        // 2. Assign chunks to nearest centroid
        for (chunks, 0..) |chunk, ci| {
            var best_idx: usize = 0;
            var best_score: f32 = -std.math.floatMax(f32);

            const q_vec = chunk.embedding.toQuantizedVector();

            for (self.centroids.items, 0..) |*centroid, centroid_idx| {
                const c_vec = centroid.embedding.toQuantizedVector();
                const score = similarity_simd.computeQuantizedDotProduct(&q_vec, &c_vec);
                if (score > best_score) {
                    best_score = score;
                    best_idx = centroid_idx;
                }
            }

            try self.centroids.items[best_idx].chunk_indices.append(self.allocator, ci);
        }

        self.is_built = true;
    }
    
    pub const ClusterScore = struct {
        centroid_idx: usize,
        score: f32,
    };
    
    fn compareClusterScore(_: void, a: ClusterScore, b: ClusterScore) bool {
        return a.score > b.score;
    }
    
    pub fn searchNearestClusters(self: *IVFIndex, req_alloc: std.mem.Allocator, query_vec: *const @import("sift_vector.zig").QuantizedVector, nprobe: usize) ![]ClusterScore {
        var scores = try std.ArrayList(ClusterScore).initCapacity(req_alloc, self.centroids.items.len);
        defer scores.deinit(req_alloc);
        
        for (self.centroids.items, 0..) |*centroid, idx| {
            const c_vec = centroid.embedding.toQuantizedVector();
            const score = similarity_simd.computeQuantizedDotProduct(query_vec, &c_vec);
            try scores.append(req_alloc, .{ .centroid_idx = idx, .score = score });
        }
        
        std.mem.sort(ClusterScore, scores.items, {}, compareClusterScore);
        
        const return_count = @min(nprobe, scores.items.len);
        const result = try req_alloc.alloc(ClusterScore, return_count);
        @memcpy(result, scores.items[0..return_count]);
        return result;
    }
};
