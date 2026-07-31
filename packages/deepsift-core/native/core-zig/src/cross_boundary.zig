const std = @import("std");
const Graph = @import("simple_graph.zig").Graph;

pub const ApiTracer = struct {
    graph: *Graph,
    
    pub fn init(graph: *Graph) ApiTracer {
        return .{ .graph = graph };
    }
    
    pub fn traceClientToServer(self: *ApiTracer, client_file: []const u8, server_file: []const u8, endpoint: []const u8) !void {
        _ = endpoint;
        try self.graph.addEdge(client_file, server_file, true);
    }
};

test "cross boundary tracing" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();

    var tracer = ApiTracer.init(&graph);
    try tracer.traceClientToServer("client.ts", "server.go", "/api/users");

    const client_id = try graph.addNode("client.ts");
    const server_id = try graph.addNode("server.go");
    
    var found = false;
    for (graph.edges.items) |edge| {
        if (edge.from == client_id and edge.to == server_id) {
            found = true;
            break;
        }
    }
    try std.testing.expect(found);
}
