const std = @import("std");
const Graph = @import("graph.zig").Graph;

pub const LiveArchExporter = struct {
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator) LiveArchExporter {
        return .{ .allocator = allocator };
    }
    
    pub fn exportToReactFlow(self: *LiveArchExporter, graph: *Graph) ![]const u8 {
        var buf: std.ArrayList(u8) = .empty;
        defer buf.deinit(self.allocator);
        
        try buf.appendSlice(self.allocator, "{\"nodes\":[");
        for (graph.node_names.items, 0..) |name, i| {
            if (i > 0) try buf.append(self.allocator, ',');
            try buf.appendSlice(self.allocator, "{\"id\":\"");
            for (name) |c| {
                if (c == '"') {
                    try buf.appendSlice(self.allocator, "\\\"");
                } else {
                    try buf.append(self.allocator, c);
                }
            }
            try buf.appendSlice(self.allocator, "\"}");
        }
        try buf.appendSlice(self.allocator, "],\"edges\":[]}");
        
        return self.allocator.dupe(u8, buf.items);
    }
};

test "live arch exporter" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    
    var exporter = LiveArchExporter.init(std.testing.allocator);
    const json = try exporter.exportToReactFlow(&graph);
    defer std.testing.allocator.free(json);
    try std.testing.expect(json.len > 0);
}
