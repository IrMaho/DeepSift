const std = @import("std");

/// This module provides ultra-fast SIMD-accelerated hashing using BLAKE3.
/// BLAKE3 is cryptographically secure and drastically faster than SHA-256,
/// utilizing AVX2/AVX-512 instructions natively on modern CPUs.
pub const FastHash = struct {
    /// Hashes the input text and returns a 64-character hex string.
    pub fn blake3_hex(text: []const u8, out_buffer: *[64]u8) void {
        var hasher = std.crypto.hash.Blake3.init(.{});
        hasher.update(text);
        
        var hash_result: [32]u8 = undefined;
        hasher.final(&hash_result);

        // Convert the 32-byte hash to a 64-character hex string
        const encoded = std.fmt.bytesToHex(hash_result, .lower);
        @memcpy(out_buffer, &encoded);
    }
};

test "FastHash.blake3_hex" {
    var out: [64]u8 = undefined;
    FastHash.blake3_hex("Hello DeepSift Ultra-Fast Indexing", &out);
    try std.testing.expectEqualStrings("d55e0d7c7112ebef29705051aeb5672c72b217036c642ba5ba2902bc6e9abce6", out[0..64]);
}
