const std = @import("std");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    var vocab = std.StringHashMap(i64).init(allocator);

    const vocab_data = @embedFile("bin/vocab.txt");

    var it = std.mem.splitScalar(u8, vocab_data, '\n');
    var token_id: i64 = 0;
    while (it.next()) |line| {
        var token_str = line;
        if (token_str.len > 0 and token_str[token_str.len - 1] == '\r') {
            token_str = token_str[0 .. token_str.len - 1];
        }
        if (token_str.len == 0) continue;
        const dup = try allocator.dupe(u8, token_str);
        try vocab.put(dup, token_id);
        token_id += 1;
    }

    std.debug.print("Loaded {} tokens. [PAD]={d}, [UNK]={d}, [CLS]={d}, [SEP]={d}\n", .{vocab.count(), vocab.get("[PAD]").?, vocab.get("[UNK]").?, vocab.get("[CLS]").?, vocab.get("[SEP]").?});
}
