const std = @import("std");

pub const ParallelProcessor = struct {
    pub fn processNodes(node_count: usize) usize {
        return node_count * 2;
    }
};

test "parallel graph processing" {
    const result = ParallelProcessor.processNodes(100);
    try std.testing.expectEqual(@as(usize, 200), result);
}
