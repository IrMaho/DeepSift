const std = @import("std");
const db = @import("db.zig");

pub const GraphAlgorithms = struct {
    allocator: std.mem.Allocator,
    graph_db: *db.GraphDatabase,

    const Self = @This();

    pub fn init(allocator: std.mem.Allocator, graph_db: *db.GraphDatabase) Self {
        return Self{
            .allocator = allocator,
            .graph_db = graph_db,
        };
    }

    pub fn deinit(self: *Self) void {
        _ = self;
    }

    /// Native PageRank Computation for Graph Topology
    pub fn computePageRank(self: *Self, damping_factor: f32, max_iterations: usize) !void {
        const num_nodes = self.graph_db.nodes.items.len;
        if (num_nodes == 0) return;

        var ranks = try self.allocator.alloc(f32, num_nodes);
        defer self.allocator.free(ranks);
        var new_ranks = try self.allocator.alloc(f32, num_nodes);
        defer self.allocator.free(new_ranks);

        const initial_rank = 1.0 / @as(f32, @floatFromInt(num_nodes));
        for (0..num_nodes) |i| {
            ranks[i] = initial_rank;
        }

        var iter: usize = 0;
        while (iter < max_iterations) : (iter += 1) {
            const base_rank = (1.0 - damping_factor) / @as(f32, @floatFromInt(num_nodes));
            for (0..num_nodes) |i| {
                new_ranks[i] = base_rank;
            }

            for (self.graph_db.edges.items) |edge| {
                if (edge.source < num_nodes and edge.target < num_nodes) {
                    const src_node = &self.graph_db.nodes.items[edge.source];
                    const out_deg = @max(1, src_node.out_degree);
                    new_ranks[edge.target] += damping_factor * (ranks[edge.source] / @as(f32, @floatFromInt(out_deg)));
                }
            }

            for (0..num_nodes) |i| {
                ranks[i] = new_ranks[i];
            }
        }

        for (0..num_nodes) |i| {
            self.graph_db.nodes.items[i].page_rank = ranks[i];
        }
    }

    /// Native Label Propagation Community Detection (O(V+E))
    pub fn computeCommunities(self: *Self) !u32 {
        const num_nodes = self.graph_db.nodes.items.len;
        if (num_nodes == 0) return 0;

        for (0..num_nodes) |i| {
            self.graph_db.nodes.items[i].community = @intCast(i);
        }

        var adj = try self.allocator.alloc(std.ArrayList(u32), num_nodes);
        defer {
            for (adj) |*list| list.deinit(self.allocator);
            self.allocator.free(adj);
        }
        for (0..num_nodes) |i| {
            adj[i] = std.ArrayList(u32).empty;
        }

        for (self.graph_db.edges.items) |edge| {
            if (edge.source < num_nodes and edge.target < num_nodes) {
                try adj[edge.source].append(self.allocator, edge.target);
                try adj[edge.target].append(self.allocator, edge.source);
            }
        }

        var changed = true;
        var iter: usize = 0;
        const max_iter = 10;
        
        var rng = std.Random.DefaultPrng.init(0);
        const random = rng.random();
        
        var order = try self.allocator.alloc(u32, num_nodes);
        defer self.allocator.free(order);
        for (0..num_nodes) |i| order[i] = @intCast(i);

        var freq_map = std.AutoHashMap(u32, u32).init(self.allocator);
        defer freq_map.deinit();

        while (changed and iter < max_iter) : (iter += 1) {
            changed = false;
            random.shuffle(u32, order);

            for (order) |i| {
                const node_idx = i;
                if (adj[node_idx].items.len == 0) continue;

                freq_map.clearRetainingCapacity();
                var max_freq: u32 = 0;
                var best_comm = self.graph_db.nodes.items[node_idx].community;

                for (adj[node_idx].items) |neighbor| {
                    const comm = self.graph_db.nodes.items[neighbor].community;
                    const res = try freq_map.getOrPutValue(comm, 0);
                    res.value_ptr.* += 1;
                    
                    if (res.value_ptr.* > max_freq) {
                        max_freq = res.value_ptr.*;
                        best_comm = comm;
                    } else if (res.value_ptr.* == max_freq) {
                        if (random.boolean()) {
                            best_comm = comm;
                        }
                    }
                }

                if (self.graph_db.nodes.items[node_idx].community != best_comm) {
                    self.graph_db.nodes.items[node_idx].community = best_comm;
                    changed = true;
                }
            }
        }

        var unique_comms = std.AutoHashMap(u32, void).init(self.allocator);
        defer unique_comms.deinit();
        for (0..num_nodes) |i| {
            try unique_comms.put(self.graph_db.nodes.items[i].community, {});
        }

        return @intCast(unique_comms.count());
    }

    /// BFS from start nodes up to depth, skipping nodes with degree >= hub_threshold (unless it's a start node)
    pub fn bfs(self: *Self, start_nodes: []const u32, depth: u32, hub_threshold: u32) !std.ArrayList(u32) {
        var visited = std.AutoHashMap(u32, void).init(self.allocator);
        defer visited.deinit();

        var result = std.ArrayList(u32).empty;
        
        var frontier = std.ArrayList(u32).empty;
        defer frontier.deinit(self.allocator);

        for (start_nodes) |node| {
            try visited.put(node, {});
            try frontier.append(self.allocator, node);
            try result.append(self.allocator, node);
        }

        var current_depth: u32 = 0;
        while (current_depth < depth and frontier.items.len > 0) : (current_depth += 1) {
            var next_frontier = std.ArrayList(u32).empty;
            
            for (frontier.items) |node_idx| {
                const is_start_node = for (start_nodes) |sn| {
                    if (sn == node_idx) break true;
                } else false;

                const node = &self.graph_db.nodes.items[node_idx];
                const degree = node.in_degree + node.out_degree;

                if (!is_start_node and degree >= hub_threshold) {
                    continue;
                }

                for (self.graph_db.edges.items) |edge| {
                    if (edge.source == node_idx or edge.target == node_idx) {
                        const neighbor = if (edge.source == node_idx) edge.target else edge.source;
                        
                        if (!visited.contains(neighbor)) {
                            try visited.put(neighbor, {});
                            try next_frontier.append(self.allocator, neighbor);
                            try result.append(self.allocator, neighbor);
                        }
                    }
                }
            }
            
            frontier.deinit(self.allocator);
            frontier = next_frontier;
        }

        return result;
    }

    pub const BlastImpact = struct {
        node_idx: u32,
        risk_score: f32,
        depth: u32,
    };

    /// Feature #12: Predictive Impact Radar (Calculate blast radius of breaking changes)
    pub fn calculateBlastRadius(self: *Self, target_node_idx: u32, max_depth: u32) !std.ArrayList(BlastImpact) {
        var visited = std.AutoHashMap(u32, void).init(self.allocator);
        defer visited.deinit();

        var impacts = std.ArrayList(BlastImpact).empty;
        
        var frontier = std.ArrayList(u32).empty;
        defer frontier.deinit(self.allocator);

        try visited.put(target_node_idx, {});
        try frontier.append(self.allocator, target_node_idx);

        var current_depth: u32 = 1;
        while (current_depth <= max_depth and frontier.items.len > 0) : (current_depth += 1) {
            var next_frontier = std.ArrayList(u32).empty;
            
            for (frontier.items) |node_idx| {
                // Find all INBOUND edges to node_idx (edges where target == node_idx)
                for (self.graph_db.edges.items) |edge| {
                    if (edge.target == node_idx) {
                        const caller = edge.source;
                        if (!visited.contains(caller)) {
                            try visited.put(caller, {});
                            try next_frontier.append(self.allocator, caller);
                            
                            const pr = self.graph_db.nodes.items[caller].page_rank;
                            const risk = pr * (1.0 / @as(f32, @floatFromInt(current_depth)));
                            try impacts.append(self.allocator, .{
                                .node_idx = caller,
                                .risk_score = risk,
                                .depth = current_depth,
                            });
                        }
                    }
                }
            }
            
            frontier.deinit(self.allocator);
            frontier = next_frontier;
        }

        return impacts;
    }

    /// Trigram index implementation
    pub const TrigramIndex = struct {
        allocator: std.mem.Allocator,
        postings: std.StringHashMap(std.ArrayList(u32)),

        pub fn init(allocator: std.mem.Allocator) TrigramIndex {
            return TrigramIndex{
                .allocator = allocator,
                .postings = std.StringHashMap(std.ArrayList(u32)).init(allocator),
            };
        }

        pub fn deinit(self: *TrigramIndex) void {
            var it = self.postings.iterator();
            while (it.next()) |entry| {
                entry.value_ptr.deinit();
                self.allocator.free(entry.key_ptr.*);
            }
            self.postings.deinit();
        }

        fn getTrigrams(allocator: std.mem.Allocator, text: []const u8) !std.ArrayList([]const u8) {
            var result = std.ArrayList([]const u8).init(allocator);
            
            if (text.len < 3) {
                if (text.len > 0) {
                    try result.append(try allocator.dupe(u8, text));
                }
                return result;
            }

            var i: usize = 0;
            while (i < text.len - 2) : (i += 1) {
                const tg = text[i .. i + 3];
                var lower_tg = try allocator.alloc(u8, 3);
                for (0..3) |j| {
                    lower_tg[j] = std.ascii.toLower(tg[j]);
                }
                
                var is_dup = false;
                for (result.items) |existing| {
                    if (std.mem.eql(u8, existing, lower_tg)) {
                        is_dup = true;
                        break;
                    }
                }
                
                if (!is_dup) {
                    try result.append(lower_tg);
                } else {
                    allocator.free(lower_tg);
                }
            }

            return result;
        }

        pub fn build(self: *TrigramIndex, db_ref: *db.GraphDatabase) !void {
            for (db_ref.nodes.items, 0..) |node, i| {
                var text_to_index = std.ArrayList(u8).init(self.allocator);
                defer text_to_index.deinit();

                try text_to_index.writer().print("{s}\x00{s}\x00{s}", .{node.label, node.id, node.source_file});
                
                var trigrams = try getTrigrams(self.allocator, text_to_index.items);
                defer {
                    for (trigrams.items) |tg| self.allocator.free(tg);
                    trigrams.deinit();
                }

                for (trigrams.items) |tg| {
                    var list = self.postings.getPtr(tg);
                    if (list == null) {
                        var new_list = std.ArrayList(u32).init(self.allocator);
                        try new_list.append(@intCast(i));
                        const key = try self.allocator.dupe(u8, tg);
                        try self.postings.put(key, new_list);
                    } else {
                        try list.?.append(@intCast(i));
                    }
                }
            }
        }
    };
};
