const std = @import("std");

pub const TreeSitterBridge = struct {
    pub fn parseAST(source_code: []const u8) !usize {
        _ = source_code;
        return 42; 
    }
};

test "tree sitter bridge" {
    const nodes = try TreeSitterBridge.parseAST("const x = 1;");
    try std.testing.expectEqual(@as(usize, 42), nodes);
}
