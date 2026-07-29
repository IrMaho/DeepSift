const std = @import("std");
const Graph = @import("graph.zig").Graph;

pub const RefactorCost = enum { S, M, L, XL };

pub const CostEstimator = struct {
    graph: *Graph,
    
    pub fn init(graph: *Graph) CostEstimator {
        return .{ .graph = graph };
    }
    
    pub fn estimate(self: *CostEstimator, target_id: u32) !RefactorCost {
        if (target_id >= self.graph.node_names.items.len) return error.NodeNotFound;
        
        var visited = std.AutoHashMap(u32, void).init(self.graph.allocator);
        defer visited.deinit();
        
        var queue: std.ArrayList(u32) = .empty;
        defer queue.deinit(self.graph.allocator);
        
        try queue.append(self.graph.allocator, target_id);
        
        var head: usize = 0;
        while (head < queue.items.len) : (head += 1) {
            const current = queue.items[head];
            for (self.graph.edges.items) |edge| {
                if (edge.to == current and edge.from != target_id) {
                    if (!visited.contains(edge.from)) {
                        try visited.put(edge.from, {});
                        try queue.append(self.graph.allocator, edge.from);
                    }
                }
            }
        }
        
        const count = visited.count();
        if (count >= 10) return .XL;
        if (count >= 6) return .L;
        if (count >= 3) return .M;
        return .S;
    }
};
