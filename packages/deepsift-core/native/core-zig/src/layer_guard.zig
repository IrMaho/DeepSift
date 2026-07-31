const std = @import("std");
const db = @import("db.zig");

pub const LayerViolation = struct {
    source_file: []const u8,
    target_file: []const u8,
    source_layer: []const u8,
    target_layer: []const u8,
    violation_type: []const u8,
};

const layer_order = [_][]const u8{ "ui", "feature", "domain", "data", "core" };

fn classifyLayer(file_path: []const u8) []const u8 {
    if (std.mem.indexOf(u8, file_path, "/ui/") != null or std.mem.indexOf(u8, file_path, "\\ui\\") != null or
        std.mem.indexOf(u8, file_path, "/components/") != null or std.mem.indexOf(u8, file_path, "\\components\\") != null or
        std.mem.indexOf(u8, file_path, "/pages/") != null or std.mem.indexOf(u8, file_path, "\\pages\\") != null or
        std.mem.indexOf(u8, file_path, "/views/") != null or std.mem.indexOf(u8, file_path, "\\views\\") != null or
        std.mem.indexOf(u8, file_path, "/widgets/") != null or std.mem.indexOf(u8, file_path, "\\widgets\\") != null)
        return "ui";

    if (std.mem.indexOf(u8, file_path, "/features/") != null or std.mem.indexOf(u8, file_path, "\\features\\") != null or
        std.mem.indexOf(u8, file_path, "/feature/") != null or std.mem.indexOf(u8, file_path, "\\feature\\") != null)
        return "feature";

    if (std.mem.indexOf(u8, file_path, "/domain/") != null or std.mem.indexOf(u8, file_path, "\\domain\\") != null or
        std.mem.indexOf(u8, file_path, "/models/") != null or std.mem.indexOf(u8, file_path, "\\models\\") != null or
        std.mem.indexOf(u8, file_path, "/entities/") != null or std.mem.indexOf(u8, file_path, "\\entities\\") != null)
        return "domain";

    if (std.mem.indexOf(u8, file_path, "/data/") != null or std.mem.indexOf(u8, file_path, "\\data\\") != null or
        std.mem.indexOf(u8, file_path, "/repository/") != null or std.mem.indexOf(u8, file_path, "\\repository\\") != null or
        std.mem.indexOf(u8, file_path, "/api/") != null or std.mem.indexOf(u8, file_path, "\\api\\") != null or
        std.mem.indexOf(u8, file_path, "/services/") != null or std.mem.indexOf(u8, file_path, "\\services\\") != null)
        return "data";

    if (std.mem.indexOf(u8, file_path, "/core/") != null or std.mem.indexOf(u8, file_path, "\\core\\") != null or
        std.mem.indexOf(u8, file_path, "/utils/") != null or std.mem.indexOf(u8, file_path, "\\utils\\") != null or
        std.mem.indexOf(u8, file_path, "/shared/") != null or std.mem.indexOf(u8, file_path, "\\shared\\") != null)
        return "core";

    return "unknown";
}

fn layerIndex(layer: []const u8) ?usize {
    for (layer_order, 0..) |l, i| {
        if (std.mem.eql(u8, l, layer)) return i;
    }
    return null;
}

pub fn detectLayerViolations(
    allocator: std.mem.Allocator,
    edges: []const db.GraphEdge,
    nodes: []const db.GraphNode,
) ![]LayerViolation {
    var violations = std.ArrayList(LayerViolation).empty;
    errdefer violations.deinit(allocator);

    for (edges) |edge| {
        var source_path: ?[]const u8 = null;
        var target_path: ?[]const u8 = null;

        if (edge.source < nodes.len) source_path = nodes[edge.source].label;
        if (edge.target < nodes.len) target_path = nodes[edge.target].label;

        if (source_path == null or target_path == null) continue;

        const src_layer = classifyLayer(source_path.?);
        const tgt_layer = classifyLayer(target_path.?);

        if (std.mem.eql(u8, src_layer, "unknown") or std.mem.eql(u8, tgt_layer, "unknown")) continue;
        if (std.mem.eql(u8, src_layer, tgt_layer)) continue;

        const src_idx = layerIndex(src_layer) orelse continue;
        const tgt_idx = layerIndex(tgt_layer) orelse continue;

        if (src_idx > tgt_idx) {
            try violations.append(allocator, .{
                .source_file = source_path.?,
                .target_file = target_path.?,
                .source_layer = src_layer,
                .target_layer = tgt_layer,
                .violation_type = "upward_dependency",
            });
        }
    }

    return try violations.toOwnedSlice(allocator);
}
