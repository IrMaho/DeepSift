const std = @import("std");
const math = @import("math_engine.zig");
const sift_vector = @import("sift_vector.zig");

pub fn computeQuantizedDotProduct(
    a: *const sift_vector.QuantizedVector,
    b: *const sift_vector.QuantizedVector,
) f32 {
    var int_acc: i32 = 0;

    var i: usize = 0;
    while (i < sift_vector.OUTLIER_COUNT) : (i += 1) {
        const val_a = a.outlier_values[i];
        const val_b = b.outlier_values[i];
        int_acc += @as(i32, val_a) * val_b;
    }

    var nibbles_a: [sift_vector.VECTOR_DIM - sift_vector.OUTLIER_COUNT]i8 = undefined;
    var nibbles_b: [sift_vector.VECTOR_DIM - sift_vector.OUTLIER_COUNT]i8 = undefined;

    math.unpackNibbles(&a.packed_data, &nibbles_a);
    math.unpackNibbles(&b.packed_data, &nibbles_b);

    var j: usize = 0;
    while (j < nibbles_a.len) : (j += 1) {
        const idx_a: u4 = @intCast(std.math.clamp(nibbles_a[j] + 8, 0, 15));
        const idx_b: u4 = @intCast(std.math.clamp(nibbles_b[j] + 8, 0, 15));
        int_acc += math.GLOBAL_LUT.multiplyI4(idx_a, idx_b);
    }

    const float_result = @as(f32, @floatFromInt(int_acc)) * a.scale * b.scale;
    return float_result + (a.offset * b.offset);
}
