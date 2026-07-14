const std = @import("std");
const io = std.io;
const mem = std.mem;
const math = std.math;

const VECTOR_DIM: usize = 384;
const VECTOR_SIZE_BYTES: usize = VECTOR_DIM * @sizeOf(f32);

const ChunkRecord = struct {
    id: u32,
    score: f32,
};

fn calculateCosineSimilarity(v1: []const f32, v2: []const f32) f32 {
    var dot_product: f32 = 0.0;
    var norm_a: f32 = 0.0;
    var norm_b: f32 = 0.0;
    
    // Zig compiler can easily vectorize this loop using SIMD
    var i: usize = 0;
    while (i < VECTOR_DIM) : (i += 1) {
        const a = v1[i];
        const b = v2[i];
        dot_product += a * b;
        norm_a += a * a;
        norm_b += b * b;
    }
    
    if (norm_a == 0.0 or norm_b == 0.0) return 0.0;
    return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b));
}

fn compareChunks(context: void, a: ChunkRecord, b: ChunkRecord) bool {
    _ = context;
    return a.score > b.score; // Descending order
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdin = io.getStdIn().reader();
    const stdout = io.getStdOut().writer();

    // 1. Read topK (4 bytes)
    var top_k: u32 = 0;
    _ = try stdin.readAll(mem.asBytes(&top_k));

    // 2. Read query vector (1536 bytes)
    var query_vec: [VECTOR_DIM]f32 = undefined;
    _ = try stdin.readAll(mem.sliceAsBytes(&query_vec));

    // 3. Read number of chunks N (4 bytes)
    var num_chunks: u32 = 0;
    _ = try stdin.readAll(mem.asBytes(&num_chunks));

    if (num_chunks == 0) {
        return;
    }

    // Allocate array to store results
    const chunks = try allocator.alloc(ChunkRecord, num_chunks);
    defer allocator.free(chunks);

    // Temp buffer for chunk vector
    var chunk_vec: [VECTOR_DIM]f32 = undefined;

    // 4. Stream and process each chunk
    var i: u32 = 0;
    while (i < num_chunks) : (i += 1) {
        var chunk_id: u32 = 0;
        _ = try stdin.readAll(mem.asBytes(&chunk_id));
        _ = try stdin.readAll(mem.sliceAsBytes(&chunk_vec));

        const score = calculateCosineSimilarity(&query_vec, &chunk_vec);
        chunks[i] = ChunkRecord{
            .id = chunk_id,
            .score = score,
        };
    }

    // 5. Sort results
    std.sort.pdq(ChunkRecord, chunks, {}, compareChunks);

    // 6. Output sorted results (binary format)
    const write_count = @min(top_k, num_chunks);
    try stdout.writeAll(mem.asBytes(&write_count));

    var j: u32 = 0;
    while (j < write_count) : (j += 1) {
        try stdout.writeAll(mem.asBytes(&chunks[j].id));
        try stdout.writeAll(mem.asBytes(&chunks[j].score));
    }
}
