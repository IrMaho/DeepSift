const std = @import("std");

pub const EmbeddingConfig = struct {
    model_name: []const u8,
    dimension: u32,
    normalize: bool,
    quantize: bool,
};

pub const HotSwapStatus = struct {
    current_model: []const u8,
    target_model: []const u8,
    dimension: u32,
    requires_reindex: bool,
    compatibility: []const u8,
};

pub fn checkModelCompatibility(
    current_dim: u32,
    target_dim: u32,
    current_name: []const u8,
    target_name: []const u8,
) HotSwapStatus {
    var requires_reindex = false;
    var compatibility: []const u8 = "full";

    if (current_dim != target_dim) {
        requires_reindex = true;
        compatibility = "dimension_mismatch";
    } else if (!std.mem.eql(u8, current_name, target_name)) {
        requires_reindex = true;
        compatibility = "model_changed";
    }

    return .{
        .current_model = current_name,
        .target_model = target_name,
        .dimension = target_dim,
        .requires_reindex = requires_reindex,
        .compatibility = compatibility,
    };
}

pub fn computeDimensionMapping(
    allocator: std.mem.Allocator,
    source_dim: u32,
    target_dim: u32,
) ![]f32 {
    const out_dim = @min(source_dim, target_dim);
    var mapping = try allocator.alloc(f32, out_dim);

    var i: usize = 0;
    while (i < out_dim) : (i += 1) {
        mapping[i] = if (source_dim == target_dim)
            1.0
        else
            @as(f32, @floatFromInt(i)) / @as(f32, @floatFromInt(out_dim));
    }

    return mapping;
}
