const std = @import("std");
const mem = std.mem;
const math = std.math;

const posix = if (@hasDecl(std, "posix")) std.posix else std.os;

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

const builtin = @import("builtin");
const is_windows = builtin.os.tag == .windows;

// Windows API declarations to bypass standard library version mismatches
extern "kernel32" fn ReadFile(
    hFile: *anyopaque,
    lpBuffer: [*]u8,
    nNumberOfBytesToRead: u32,
    lpNumberOfBytesRead: *u32,
    lpOverlapped: ?*anyopaque,
) callconv(.c) i32;

extern "kernel32" fn WriteFile(
    hFile: *anyopaque,
    lpBuffer: [*]const u8,
    nNumberOfBytesToWrite: u32,
    lpNumberOfBytesWritten: *u32,
    lpOverlapped: ?*anyopaque,
) callconv(.c) i32;

fn readAll(fd: anytype, buf: []u8) !void {
    if (is_windows) {
        var bytes_read: u32 = 0;
        var offset: usize = 0;
        while (offset < buf.len) {
            const chunk_size = @min(buf.len - offset, std.math.maxInt(u32));
            const success = ReadFile(
                fd,
                buf.ptr + offset,
                @intCast(chunk_size),
                &bytes_read,
                null,
            );
            if (success == 0) return error.ReadFailed;
            if (bytes_read == 0) return error.EndOfStream;
            offset += bytes_read;
        }
    } else {
        var offset: usize = 0;
        while (offset < buf.len) {
            const bytes_read = try posix.read(fd, buf[offset..]);
            if (bytes_read == 0) return error.EndOfStream;
            offset += bytes_read;
        }
    }
}

fn writeAll(fd: anytype, buf: []const u8) !void {
    if (is_windows) {
        var bytes_written: u32 = 0;
        var offset: usize = 0;
        while (offset < buf.len) {
            const chunk_size = @min(buf.len - offset, std.math.maxInt(u32));
            const success = WriteFile(
                fd,
                buf.ptr + offset,
                @intCast(chunk_size),
                &bytes_written,
                null,
            );
            if (success == 0) return error.WriteFailed;
            offset += bytes_written;
        }
    } else {
        var offset: usize = 0;
        while (offset < buf.len) {
            const bytes_written = try posix.write(fd, buf[offset..]);
            if (bytes_written == 0) return error.WriteFailed;
            offset += bytes_written;
        }
    }
}

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    const stdin_fd = if (@hasDecl(std, "Io"))
        std.Io.File.stdin().handle
    else
        std.io.getStdIn().handle;

    const stdout_fd = if (@hasDecl(std, "Io"))
        std.Io.File.stdout().handle
    else
        std.io.getStdOut().handle;

    // 1. Read topK (4 bytes)
    var top_k: u32 = 0;
    try readAll(stdin_fd, mem.asBytes(&top_k));

    // 2. Read query vector (1536 bytes)
    var query_vec: [VECTOR_DIM]f32 = undefined;
    try readAll(stdin_fd, mem.sliceAsBytes(&query_vec));

    // 3. Read number of chunks N (4 bytes)
    var num_chunks: u32 = 0;
    try readAll(stdin_fd, mem.asBytes(&num_chunks));

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
        try readAll(stdin_fd, mem.asBytes(&chunk_id));
        try readAll(stdin_fd, mem.sliceAsBytes(&chunk_vec));

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
    try writeAll(stdout_fd, mem.asBytes(&write_count));

    var j: u32 = 0;
    while (j < write_count) : (j += 1) {
        try writeAll(stdout_fd, mem.asBytes(&chunks[j].id));
        try writeAll(stdout_fd, mem.asBytes(&chunks[j].score));
    }
}
