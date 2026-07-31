const std = @import("std");

pub const DataFlowNode = struct {
    id: u32,
    variable_name: []const u8,
    is_sensitive: bool,
};

pub const DataFlowGraph = struct {
    allocator: std.mem.Allocator,
    nodes: std.ArrayList(DataFlowNode),

    pub fn init(allocator: std.mem.Allocator) DataFlowGraph {
        return .{
            .allocator = allocator,
            .nodes = .empty,
        };
    }
    
    pub fn deinit(self: *DataFlowGraph) void {
        self.nodes.deinit(self.allocator);
    }
    
    pub fn trackVariable(self: *DataFlowGraph, name: []const u8, is_sensitive: bool) !u32 {
        const id = @as(u32, @intCast(self.nodes.items.len));
        try self.nodes.append(self.allocator, .{
            .id = id,
            .variable_name = name,
            .is_sensitive = is_sensitive,
        });
        return id;
    }
};

test "data flow graph basic" {
    var dfg = DataFlowGraph.init(std.testing.allocator);
    defer dfg.deinit();

    const id = try dfg.trackVariable("password", true);
    try std.testing.expect(dfg.nodes.items[id].is_sensitive);
}
