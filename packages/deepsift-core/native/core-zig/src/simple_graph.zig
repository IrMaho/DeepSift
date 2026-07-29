const std = @import("std");

pub const Edge = struct {
    from: u32,
    to: u32,
    weight: u32 = 1,
    is_virtual: bool = false,
};

pub const Graph = struct {
    allocator: std.mem.Allocator,
    nodes: std.StringHashMap(u32),
    node_names: std.ArrayList([]const u8),
    edges: std.ArrayList(Edge),

    pub fn init(allocator: std.mem.Allocator) Graph {
        return .{
            .allocator = allocator,
            .nodes = std.StringHashMap(u32).init(allocator),
            .node_names = .empty,
            .edges = .empty,
        };
    }

    pub fn deinit(self: *Graph) void {
        self.nodes.deinit();
        self.node_names.deinit(self.allocator);
        self.edges.deinit(self.allocator);
    }

    pub fn addNode(self: *Graph, name: []const u8) !u32 {
        if (self.nodes.get(name)) |id| {
            return id;
        }
        const id = @as(u32, @intCast(self.node_names.items.len));
        try self.node_names.append(self.allocator, name);
        try self.nodes.put(name, id);
        return id;
    }

    pub fn addEdge(self: *Graph, from_name: []const u8, to_name: []const u8, is_virtual: bool) !void {
        const from_id = try self.addNode(from_name);
        const to_id = try self.addNode(to_name);
        
        // Deduplicate edges (Fixes Bug 3)
        for (self.edges.items) |edge| {
            if (edge.from == from_id and edge.to == to_id) {
                return;
            }
        }
        
        try self.edges.append(self.allocator, .{
            .from = from_id,
            .to = to_id,
            .is_virtual = is_virtual,
        });
    }

    // Fixes Bug 1, 2, 4, 30: Reachability from root nodes
    pub fn isDead(self: *Graph, target_id: u32) bool {
        if (target_id >= self.node_names.items.len) return true; // Fix Bug 4

        var in_degrees = self.allocator.alloc(u32, self.node_names.items.len) catch return false;
        defer self.allocator.free(in_degrees);
        @memset(in_degrees, 0);

        for (self.edges.items) |edge| {
            in_degrees[edge.to] += 1;
        }

        var reachable = self.allocator.alloc(bool, self.node_names.items.len) catch return false;
        defer self.allocator.free(reachable);
        @memset(reachable, false);

        var queue: std.ArrayList(u32) = .empty;
        defer queue.deinit(self.allocator);

        // Fixes Bug 1, 2, 30: Roots are main.ts or index.ts
        for (self.node_names.items, 0..) |name, i| {
            if (std.mem.indexOf(u8, name, "main.ts") != null or std.mem.indexOf(u8, name, "index.ts") != null) {
                queue.append(self.allocator, @as(u32, @intCast(i))) catch return false;
                reachable[i] = true;
            }
        }

        // Also treat isolated cycles as roots? No, if it's isolated it's dead code!
        // So we only start BFS from true roots.
        var head: usize = 0;
        while (head < queue.items.len) : (head += 1) {
            const current = queue.items[head];
            for (self.edges.items) |edge| {
                if (edge.from == current and !reachable[edge.to]) {
                    reachable[edge.to] = true;
                    queue.append(self.allocator, edge.to) catch continue;
                }
            }
        }

        return !reachable[target_id];
    }
};

test "Graph dead code detection" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();

    try graph.addEdge("main.ts", "utils.ts", false);
    const main_id = try graph.addNode("main.ts");
    const utils_id = try graph.addNode("utils.ts");
    const dead_id = try graph.addNode("dead.ts");

    try std.testing.expect(graph.isDead(main_id) == false);
    try std.testing.expect(graph.isDead(utils_id) == false);
    try std.testing.expect(graph.isDead(dead_id) == true);
}
