const std = @import("std");

pub const SpectralClone = struct {
    file_a: []const u8,
    file_b: []const u8,
    similarity: f32,
    shared_tokens: u32,
    clone_type: []const u8,
};

pub fn detectSpectralClones(
    allocator: std.mem.Allocator,
    file_paths: [][]const u8,
    contents: [][]const u8,
    threshold: f32,
) ![]SpectralClone {
    var clones = std.ArrayList(SpectralClone).empty;
    errdefer clones.deinit(allocator);

    const count = @min(file_paths.len, contents.len);
    if (count < 2) return try clones.toOwnedSlice(allocator);

    var i: usize = 0;
    while (i < count) : (i += 1) {
        var j: usize = i + 1;
        while (j < count) : (j += 1) {
            const sim = computeJaccardSimilarity(contents[i], contents[j]);

            if (sim >= threshold) {
                const shared = countSharedTokens(contents[i], contents[j]);
                var clone_type: []const u8 = "type_3_semantic";

                if (sim > 0.95) {
                    clone_type = "type_1_exact";
                } else if (sim > 0.80) {
                    clone_type = "type_2_renamed";
                }

                try clones.append(allocator, .{
                    .file_a = file_paths[i],
                    .file_b = file_paths[j],
                    .similarity = sim,
                    .shared_tokens = shared,
                    .clone_type = clone_type,
                });
            }
        }
    }

    std.mem.sort(SpectralClone, clones.items, {}, struct {
        fn lessThan(_: void, a: SpectralClone, b: SpectralClone) bool {
            return a.similarity > b.similarity;
        }
    }.lessThan);

    return try clones.toOwnedSlice(allocator);
}

fn computeJaccardSimilarity(a: []const u8, b: []const u8) f32 {
    if (a.len == 0 and b.len == 0) return 1.0;
    if (a.len == 0 or b.len == 0) return 0.0;

    var ngrams_a: u64 = 0;
    var ngrams_b: u64 = 0;
    var shared: u64 = 0;

    const N = 4;

    if (a.len >= N) {
        var i: usize = 0;
        while (i + N <= a.len) : (i += 1) {
            const hash_a = std.hash.Wyhash.hash(0, a[i .. i + N]);
            ngrams_a += 1;

            if (b.len >= N) {
                var k: usize = 0;
                while (k + N <= b.len) : (k += 1) {
                    const hash_b = std.hash.Wyhash.hash(0, b[k .. k + N]);
                    if (hash_a == hash_b) {
                        shared += 1;
                        break;
                    }
                }
            }
        }
    }

    if (b.len >= N) {
        var i: usize = 0;
        while (i + N <= b.len) : (i += 1) {
            ngrams_b += 1;
        }
    }

    const union_size = ngrams_a + ngrams_b - shared;
    if (union_size == 0) return 0.0;
    return @as(f32, @floatFromInt(shared)) / @as(f32, @floatFromInt(union_size));
}

fn countSharedTokens(a: []const u8, b: []const u8) u32 {
    var count: u32 = 0;
    var it_a = std.mem.tokenizeAny(u8, a, " \t\n\r{}();,");
    while (it_a.next()) |token_a| {
        if (token_a.len < 3) continue;
        if (std.mem.indexOf(u8, b, token_a) != null) count += 1;
    }
    return count;
}
