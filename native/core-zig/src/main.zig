const std = @import("std");
const mem = std.mem;

const posix = if (@hasDecl(std, "posix")) std.posix else std.os;

const VECTOR_DIM_BITS: usize = 384;
const VECTOR_U32_COUNT: usize = 12; // 12 * 32 = 384 bits
const VECTOR_SIZE_BYTES: usize = VECTOR_U32_COUNT * @sizeOf(u32); // 48 bytes

const ChunkRecord = struct {
    id: u32,
    score: f32,
};

fn calculateHammingDistance(v1: *const [VECTOR_U32_COUNT]u32, v2: *const [VECTOR_U32_COUNT]u32) u32 {
    var dist: u32 = 0;
    // Unroll loop for maximum speed using popCount
    inline for (0..VECTOR_U32_COUNT) |i| {
        dist += @popCount(v1[i] ^ v2[i]);
    }
    return dist;
}

fn hammingToSimilarity(distance: u32) f32 {
    const float_dist: f32 = @floatFromInt(distance);
    const float_dim: f32 = @floatFromInt(VECTOR_DIM_BITS);
    return 1.0 - (float_dist / float_dim);
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

    // 2. Read query vector (48 bytes for 384 bits BQ)
    var query_vec: [VECTOR_U32_COUNT]u32 = undefined;
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
    var chunk_vec: [VECTOR_U32_COUNT]u32 = undefined;

    // 4. Stream and process each chunk
    var i: u32 = 0;
    while (i < num_chunks) : (i += 1) {
        var chunk_id: u32 = 0;
        try readAll(stdin_fd, mem.asBytes(&chunk_id));
        try readAll(stdin_fd, mem.sliceAsBytes(&chunk_vec));

        const distance = calculateHammingDistance(&query_vec, &chunk_vec);
        const score = hammingToSimilarity(distance);
        chunks[i] = ChunkRecord{
            .id = chunk_id,
            .score = score,
        };
    }

    // 5. Sort results
    std.sort.pdq(ChunkRecord, chunks, {}, compareChunks);

    // 6. Output sorted results (binary format)
    const write_count = @min(top_k, num_chunks);
    std.debug.print("Writing {d} chunks\n", .{write_count});

    try writeAll(stdout_fd, mem.asBytes(&write_count));

    var j: u32 = 0;
    while (j < write_count) : (j += 1) {
        try writeAll(stdout_fd, mem.asBytes(&chunks[j].id));
        try writeAll(stdout_fd, mem.asBytes(&chunks[j].score));
    }
    std.debug.print("Done writing\n", .{});
}
