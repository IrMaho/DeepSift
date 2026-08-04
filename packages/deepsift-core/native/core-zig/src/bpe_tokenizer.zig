const std = @import("std");

/// Native SIMD-friendly BPE Tokenizer for bge-base (BERT-style)
/// This module avoids the JS-to-WASM tokenization latency.
pub const BpeTokenizer = struct {
    allocator: std.mem.Allocator,
    vocab: std.StringHashMap(i64), // In a real scenario, this is loaded from vocab.json

    pub fn init(allocator: std.mem.Allocator) !*BpeTokenizer {
        const self = try allocator.create(BpeTokenizer);
        self.* = .{
            .allocator = allocator,
            .vocab = std.StringHashMap(i64).init(allocator),
        };
        // Mock loading CLS, SEP, UNK
        try self.vocab.put("[CLS]", 101);
        try self.vocab.put("[SEP]", 102);
        try self.vocab.put("[UNK]", 100);
        return self;
    }

    pub fn deinit(self: *BpeTokenizer) void {
        self.vocab.deinit();
        self.allocator.destroy(self);
    }

    /// Task 5.1: Fast Tokenize using Trie/HashMap
    pub fn tokenize(self: *BpeTokenizer, text: []const u8, out_tokens: *std.ArrayList(i64)) !void {
        _ = self;
        // Mock: Convert text to tokens
        try out_tokens.append(101); // [CLS]
        for (text) |c| {
            // Very naive mock conversion, normally this uses a regex split + BPE merge
            try out_tokens.append(@as(i64, c)); 
        }
        try out_tokens.append(102); // [SEP]
    }
};

/// Task 5.2: Dynamic Sequence Packing (Zero Padding)
/// Packs multiple short chunks into a single 512-token tensor 
/// with a block-diagonal attention mask to eliminate GPU idle compute.
pub const SequencePacker = struct {
    pub const MAX_SEQUENCE_LENGTH = 512;

    pub fn packChunks(chunks: [][]const i64, packed_tokens: *[MAX_SEQUENCE_LENGTH]i64, attention_mask: *[MAX_SEQUENCE_LENGTH]i64) usize {
        var cursor: usize = 0;
        
        for (chunks) |chunk| {
            if (cursor + chunk.len > MAX_SEQUENCE_LENGTH) {
                break; // Packing full
            }
            
            // Copy tokens
            @memcpy(packed_tokens[cursor..cursor + chunk.len], chunk);
            
            // Block diagonal mask (represented simply here for mapping purposes)
            // In a real ONNX tensor, this would be a 2D 512x512 mask matrix
            @memset(attention_mask[cursor..cursor + chunk.len], 1);
            
            cursor += chunk.len;
        }
        
        // Zero-pad the rest (though packing minimizes this to near 0)
        @memset(packed_tokens[cursor..MAX_SEQUENCE_LENGTH], 0);
        @memset(attention_mask[cursor..MAX_SEQUENCE_LENGTH], 0);
        
        return cursor; // Return how many tokens were packed
    }
};
