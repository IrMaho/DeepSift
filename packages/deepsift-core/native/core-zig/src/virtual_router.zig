const std = @import("std");
const Graph = @import("simple_graph.zig").Graph;

pub const VirtualRouter = struct {
    graph: *Graph,
    
    pub fn init(graph: *Graph) VirtualRouter {
        return .{ .graph = graph };
    }
    
    fn isInsideQuotesOrComment(code: []const u8, idx: usize) bool {
        var in_quotes = false;
        var in_comment = false;
        for (code[0..idx], 0..) |c, i| {
            if (c == '"' or c == '\'') in_quotes = !in_quotes;
            if (i > 0 and code[i-1] == '/' and c == '/') in_comment = true;
            if (c == '\n') in_comment = false;
        }
        return in_quotes or in_comment;
    }

    pub fn inferRoutes(self: *VirtualRouter, source_code: []const u8, file_path: []const u8) !void {
        var idx: usize = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "createBrowserRouter")) |pos| {
            idx = pos + 1;
            if (!isInsideQuotesOrComment(source_code, pos)) {
                // Fixes Bug 7
                if (std.mem.indexOf(u8, source_code, "App") != null) {
                    try self.graph.addEdge(file_path, "App.tsx", true);
                }
            }
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "<Route")) |pos| {
            idx = pos + 1;
            if (!isInsideQuotesOrComment(source_code, pos)) {
                try self.graph.addEdge(file_path, "App.tsx", true);
            }
        }
    }
};

test "Virtual Router Inference prevents dead code" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    
    var vr = VirtualRouter.init(&graph);
    try vr.inferRoutes("import { createBrowserRouter } from 'react-router-dom'; // App", "router.ts");
    
    try std.testing.expect(graph.edges.items.len == 1);
    try std.testing.expect(graph.edges.items[0].is_virtual == true);
}
