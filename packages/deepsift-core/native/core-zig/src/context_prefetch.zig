const std = @import("std");
const Graph = @import("simple_graph.zig").Graph;

pub const ContextPrefetcher = struct {
    graph: *Graph,
    
    pub fn init(graph: *Graph) ContextPrefetcher {
        return .{ .graph = graph };
    }
    
    pub fn getRelatedInterfaces(self: *ContextPrefetcher, target_id: u32, out_list: *std.ArrayList(u32), allocator: std.mem.Allocator) !void {
        if (target_id >= self.graph.node_names.items.len) {
            return error.NodeNotFound; // Fixes Bug 27
        }
        for (self.graph.edges.items) |edge| {
            if (edge.from == target_id) {
                try out_list.append(allocator, edge.to);
            }
        }
    }
};

test "context pre-fetcher" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("auth.ts", "IAuth.ts", false);
    
    const auth_id = try graph.addNode("auth.ts");
    const iauth_id = try graph.addNode("IAuth.ts");
    
    var prefetch = ContextPrefetcher.init(&graph);
    var related: std.ArrayList(u32) = .empty;
    defer related.deinit(std.testing.allocator);
    
    try prefetch.getRelatedInterfaces(auth_id, &related, std.testing.allocator);
    try std.testing.expectEqual(@as(usize, 1), related.items.len);
    try std.testing.expectEqual(iauth_id, related.items[0]);
}
