const std = @import("std");

pub const FigmaMapper = struct {
    pub fn mapToComponent(allocator: std.mem.Allocator, figma_id: []const u8, components: [][]const u8) ![]const u8 {
        // Dummy mapping heuristic
        for (components) |comp| {
            if (std.mem.indexOf(u8, comp, figma_id) != null) {
                return try allocator.dupe(u8, comp);
            }
        }
        return try allocator.dupe(u8, "unmapped");
    }
};
