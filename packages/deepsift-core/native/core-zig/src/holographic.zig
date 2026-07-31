const std = @import("std");
const db = @import("db.zig");

pub const DepNode3D = struct {
    id: []const u8,
    label: []const u8,
    x: f32,
    y: f32,
    z: f32,
    layer: []const u8,
    size: f32,
};

pub fn computeLayout3D(
    allocator: std.mem.Allocator,
    nodes: []const db.GraphNode,
    edges: []const db.GraphEdge,
) ![]DepNode3D {
    var layout = std.ArrayList(DepNode3D).empty;
    errdefer layout.deinit(allocator);

    if (nodes.len == 0) return try layout.toOwnedSlice(allocator);

    const layer_map = [_]struct { pattern: []const u8, z: f32, layer: []const u8 }{
        .{ .pattern = "ui", .z = 0.0, .layer = "presentation" },
        .{ .pattern = "component", .z = 0.0, .layer = "presentation" },
        .{ .pattern = "page", .z = 0.0, .layer = "presentation" },
        .{ .pattern = "view", .z = 0.0, .layer = "presentation" },
        .{ .pattern = "feature", .z = 1.0, .layer = "feature" },
        .{ .pattern = "hook", .z = 1.5, .layer = "feature" },
        .{ .pattern = "store", .z = 2.0, .layer = "state" },
        .{ .pattern = "reducer", .z = 2.0, .layer = "state" },
        .{ .pattern = "bloc", .z = 2.0, .layer = "state" },
        .{ .pattern = "service", .z = 3.0, .layer = "domain" },
        .{ .pattern = "domain", .z = 3.0, .layer = "domain" },
        .{ .pattern = "model", .z = 3.5, .layer = "domain" },
        .{ .pattern = "repository", .z = 4.0, .layer = "data" },
        .{ .pattern = "api", .z = 4.0, .layer = "data" },
        .{ .pattern = "data", .z = 4.0, .layer = "data" },
        .{ .pattern = "util", .z = 5.0, .layer = "infrastructure" },
        .{ .pattern = "core", .z = 5.0, .layer = "infrastructure" },
        .{ .pattern = "config", .z = 5.0, .layer = "infrastructure" },
    };

    for (nodes, 0..) |node, idx| {
        var z_val: f32 = 2.5;
        var layer: []const u8 = "unknown";

        for (layer_map) |lm| {
            if (containsIgnoreCase(node.label, lm.pattern)) {
                z_val = lm.z;
                layer = lm.layer;
                break;
            }
        }

        var edge_count: u32 = 0;
        const idx32: u32 = @intCast(idx);
        for (edges) |edge| {
            if (edge.source == idx32 or edge.target == idx32) edge_count += 1;
        }

        const angle = @as(f32, @floatFromInt(idx)) * 2.39996;
        const radius = 2.0 + @as(f32, @floatFromInt(idx % 5));

        try layout.append(allocator, .{
            .id = node.id,
            .label = node.label,
            .x = radius * @cos(angle),
            .y = radius * @sin(angle),
            .z = z_val,
            .layer = layer,
            .size = 0.5 + @as(f32, @floatFromInt(@min(edge_count, 20))) * 0.15,
        });
    }

    return try layout.toOwnedSlice(allocator);
}

fn containsIgnoreCase(haystack: []const u8, needle: []const u8) bool {
    if (haystack.len < needle.len) return false;
    var i: usize = 0;
    while (i + needle.len <= haystack.len) : (i += 1) {
        var match = true;
        for (needle, 0..) |nc, j| {
            if (std.ascii.toLower(haystack[i + j]) != std.ascii.toLower(nc)) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }
    return false;
}
