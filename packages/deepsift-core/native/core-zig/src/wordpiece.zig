const std = @import("std");

pub const Tokenizer = struct {
    vocab: std.StringHashMap(i64),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) !*Tokenizer {
        var self = try allocator.create(Tokenizer);
        self.allocator = allocator;
        self.vocab = std.StringHashMap(i64).init(allocator);

        const vocab_data = @embedFile("vocab.txt");
        var it = std.mem.splitScalar(u8, vocab_data, '\n');
        var token_id: i64 = 0;
        while (it.next()) |line| {
            var token_str = line;
            if (token_str.len > 0 and token_str[token_str.len - 1] == '\r') {
                token_str = token_str[0 .. token_str.len - 1];
            }
            if (token_str.len == 0) continue;
            const dup = try allocator.dupe(u8, token_str);
            try self.vocab.put(dup, token_id);
            token_id += 1;
        }

        return self;
    }

    pub fn deinit(self: *Tokenizer) void {
        var it = self.vocab.iterator();
        while (it.next()) |entry| {
            self.allocator.free(entry.key_ptr.*);
        }
        self.vocab.deinit();
        self.allocator.destroy(self);
    }

    pub fn tokenize(self: *Tokenizer, text: []const u8, max_length: usize, output_tokens: []i64) usize {
        var num_tokens: usize = 0;
        
        if (num_tokens < max_length) {
            output_tokens[num_tokens] = 101; // [CLS]
            num_tokens += 1;
        }

        var i: usize = 0;
        while (i < text.len and num_tokens < max_length - 1) {
            if (std.ascii.isWhitespace(text[i])) {
                i += 1;
                continue;
            }

            const start = i;
            if (isPunctuation(text[i])) {
                i += 1;
            } else {
                while (i < text.len and !std.ascii.isWhitespace(text[i]) and !isPunctuation(text[i])) {
                    i += 1;
                }
            }
            const word = text[start..i];

            var word_start: usize = 0;
            var is_bad = false;
            var sub_tokens: [256]i64 = undefined;
            var sub_count: usize = 0;

            while (word_start < word.len) {
                var end = word.len;
                var cur_substr: []const u8 = undefined;
                var found_id: ?i64 = null;

                while (word_start < end) {
                    var search_buf: [512]u8 = undefined;
                    var search_len: usize = 0;

                    if (word_start > 0) {
                        std.mem.copyForwards(u8, &search_buf, "##");
                        search_len += 2;
                    }
                    
                    const chunk = word[word_start..end];
                    for (chunk) |c| {
                        search_buf[search_len] = std.ascii.toLower(c);
                        search_len += 1;
                    }

                    if (self.vocab.get(search_buf[0..search_len])) |id| {
                        found_id = id;
                        cur_substr = chunk;
                        break;
                    }
                    end -= 1;
                }

                if (found_id) |id| {
                    if (sub_count < 256) {
                        sub_tokens[sub_count] = id;
                        sub_count += 1;
                    }
                    word_start += cur_substr.len;
                } else {
                    is_bad = true;
                    break;
                }
            }

            if (is_bad) {
                if (num_tokens < max_length - 1) {
                    output_tokens[num_tokens] = 100; // [UNK]
                    num_tokens += 1;
                }
            } else {
                for (sub_tokens[0..sub_count]) |id| {
                    if (num_tokens < max_length - 1) {
                        output_tokens[num_tokens] = id;
                        num_tokens += 1;
                    }
                }
            }
        }

        if (num_tokens < max_length) {
            output_tokens[num_tokens] = 102; // [SEP]
            num_tokens += 1;
        }

        while (num_tokens < max_length) {
            output_tokens[num_tokens] = 0; // [PAD]
            num_tokens += 1;
        }

        return max_length;
    }
    
    fn isPunctuation(c: u8) bool {
        return (c >= 33 and c <= 47) or (c >= 58 and c <= 64) or (c >= 91 and c <= 96) or (c >= 123 and c <= 126);
    }
};
