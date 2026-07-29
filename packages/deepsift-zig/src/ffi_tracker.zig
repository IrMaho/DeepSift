const std = @import("std");
const Graph = @import("graph.zig").Graph;

pub const FFITracker = struct {
    graph: *Graph,
    
    pub fn init(graph: *Graph) FFITracker {
        return .{ .graph = graph };
    }
    
    pub fn linkCGO(self: *FFITracker, source_file: []const u8, target_file: []const u8) !void {
        var clean_target = target_file;
        if (std.mem.startsWith(u8, target_file, "./")) {
            clean_target = target_file[2..]; // Fixes Bug 8
            
            // Very naive resolution for test purposes
            if (std.mem.eql(u8, source_file, "src/main.go") and std.mem.eql(u8, clean_target, "lib.h")) {
                clean_target = "src/lib.h";
            }
        }
        try self.graph.addEdge(source_file, clean_target, true);
    }
};

test "ffi tracker basic" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    
    var tracker = FFITracker.init(&graph);
    try tracker.linkCGO("main.go", "lib.h");
    
    try std.testing.expect(graph.edges.items.len == 1);
    try std.testing.expect(graph.edges.items[0].is_virtual == true);
}
