const std = @import("std");
const db = @import("db.zig");

pub const TarjanSCC = struct {
    allocator: std.mem.Allocator,
    graph: *db.GraphDatabase,
    index: u32,
    indices: std.AutoHashMap(u32, u32),
    lowlinks: std.AutoHashMap(u32, u32),
    on_stack: std.AutoHashMap(u32, bool),
    stack: std.ArrayList(u32),
    sccs: std.ArrayList(std.ArrayList(u32)),

    pub fn init(allocator: std.mem.Allocator, graph: *db.GraphDatabase) TarjanSCC {
        return .{
            .allocator = allocator,
            .graph = graph,
            .index = 0,
            .indices = std.AutoHashMap(u32, u32).init(allocator),
            .lowlinks = std.AutoHashMap(u32, u32).init(allocator),
            .on_stack = std.AutoHashMap(u32, bool).init(allocator),
            .stack = std.ArrayList(u32).empty,
            .sccs = std.ArrayList(std.ArrayList(u32)).empty,
        };
    }

    pub fn deinit(self: *TarjanSCC) void {
        self.indices.deinit();
        self.lowlinks.deinit();
        self.on_stack.deinit();
        self.stack.deinit(self.allocator);
        for (self.sccs.items) |*scc| {
            scc.deinit(self.allocator);
        }
        self.sccs.deinit(self.allocator);
    }

    pub fn findCycles(self: *TarjanSCC) !void {
        for (self.graph.nodes.items, 0..) |_, i| {
            const v: u32 = @intCast(i);
            if (!self.indices.contains(v)) {
                try self.strongconnect(v);
            }
        }
    }

    fn strongconnect(self: *TarjanSCC, v: u32) !void {
        try self.indices.put(v, self.index);
        try self.lowlinks.put(v, self.index);
        self.index += 1;
        try self.stack.append(self.allocator, v);
        try self.on_stack.put(v, true);

        for (self.graph.edges.items) |edge| {
            if (edge.source == v) {
                const w = edge.target;
                if (!self.indices.contains(w)) {
                    try self.strongconnect(w);
                    const v_lowlink = self.lowlinks.get(v).?;
                    const w_lowlink = self.lowlinks.get(w).?;
                    try self.lowlinks.put(v, @min(v_lowlink, w_lowlink));
                } else if (self.on_stack.get(w) != null and self.on_stack.get(w).?) {
                    const v_lowlink = self.lowlinks.get(v).?;
                    const w_index = self.indices.get(w).?;
                    try self.lowlinks.put(v, @min(v_lowlink, w_index));
                }
            }
        }

        if (self.lowlinks.get(v).? == self.indices.get(v).?) {
            var scc = std.ArrayList(u32).empty;
            var w: u32 = undefined;
            while (true) {
                w = self.stack.pop();
                try self.on_stack.put(w, false);
                try scc.append(self.allocator, w);
                if (w == v) break;
            }
            if (scc.items.len > 1) {
                try self.sccs.append(self.allocator, scc);
            } else {
                scc.deinit(self.allocator);
            }
        }
    }
};
