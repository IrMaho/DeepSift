const std = @import("std");
const db = @import("db.zig");

pub const TaintAnalysis = struct {
    allocator: std.mem.Allocator,
    graph: *db.GraphDatabase,

    pub fn traceTaint(self: *TaintAnalysis, source_node_id: []const u8) ![][]const u8 {
        var visited = std.StringHashMap(bool).init(self.allocator);
        defer visited.deinit();

        var sinks_found = std.ArrayList([]const u8).empty;
        defer sinks_found.deinit(self.allocator);

        // Simple BFS/DFS to trace taint from source_node_id
        // In real world, we'd check AST data flow. Here we trace edges in graph.
        
        var queue = std.ArrayList(u32).empty;
        defer queue.deinit(self.allocator);
        var visited_nodes = std.AutoHashMap(u32, bool).init(self.allocator);
        defer visited_nodes.deinit();

        for (self.graph.nodes.items, 0..) |node, i| {
            if (std.mem.eql(u8, node.id, source_node_id) or std.mem.indexOf(u8, node.id, source_node_id) != null) {
                try queue.append(self.allocator, @intCast(i));
                try visited_nodes.put(@intCast(i), true);
            }
        }

        var head: usize = 0;
        while (head < queue.items.len) : (head += 1) {
            const curr = queue.items[head];
            const curr_node = self.graph.nodes.items[curr];
            
            if (std.mem.indexOf(u8, curr_node.id, "eval") != null or 
                std.mem.indexOf(u8, curr_node.id, "exec") != null or 
                std.mem.indexOf(u8, curr_node.id, "innerHTML") != null or
                std.mem.indexOf(u8, curr_node.id, "dangerouslySetInnerHTML") != null) {
                try sinks_found.append(self.allocator, try self.allocator.dupe(u8, curr_node.id));
            }

            for (self.graph.edges.items) |edge| {
                if (edge.source == curr) {
                    if (!visited_nodes.contains(edge.target)) {
                        try visited_nodes.put(edge.target, true);
                        try queue.append(self.allocator, edge.target);
                    }
                }
            }
        }

        const result = try self.allocator.alloc([]const u8, sinks_found.items.len);
        for (sinks_found.items, 0..) |itm, i| {
            result[i] = itm;
        }
        return result;
    }
};
