const std = @import("std");
const db = @import("db.zig");

pub const GodNodeSplit = struct {
    node_label: []const u8,
    current_edges: u32,
    suggested_splits: u32,
    split_reason: []const u8,
    risk_level: []const u8,
};

pub fn analyzeGodNodes(
    allocator: std.mem.Allocator,
    nodes: []const db.GraphNode,
    edges: []const db.GraphEdge,
    hub_threshold: u32,
) ![]GodNodeSplit {
    var results = std.ArrayList(GodNodeSplit).empty;
    errdefer results.deinit(allocator);

    for (nodes, 0..) |node, node_idx| {
        var in_count: u32 = 0;
        var out_count: u32 = 0;
        const idx32: u32 = @intCast(node_idx);

        for (edges) |edge| {
            if (edge.source == idx32) out_count += 1;
            if (edge.target == idx32) in_count += 1;
        }

        const total = in_count + out_count;
        if (total < hub_threshold) continue;

        var reason: []const u8 = "high_connectivity";
        var risk: []const u8 = "medium";
        var splits: u32 = 2;

        if (total > hub_threshold * 3) {
            reason = "extreme_god_node";
            risk = "critical";
            splits = @min(total / hub_threshold, 8);
        } else if (total > hub_threshold * 2) {
            reason = "heavy_god_node";
            risk = "high";
            splits = @min(total / hub_threshold, 5);
        } else if (out_count > in_count * 3) {
            reason = "fan_out_explosion";
            risk = "high";
            splits = 3;
        } else if (in_count > out_count * 3) {
            reason = "dependency_magnet";
            risk = "medium";
            splits = 2;
        }

        try results.append(allocator, .{
            .node_label = node.label,
            .current_edges = total,
            .suggested_splits = splits,
            .split_reason = reason,
            .risk_level = risk,
        });
    }

    std.mem.sort(GodNodeSplit, results.items, {}, struct {
        fn lessThan(_: void, a: GodNodeSplit, b: GodNodeSplit) bool {
            return a.current_edges > b.current_edges;
        }
    }.lessThan);

    return try results.toOwnedSlice(allocator);
}
