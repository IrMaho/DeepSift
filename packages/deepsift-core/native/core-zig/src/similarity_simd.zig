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

    const V = @Vector(16, i8);
    const V16 = @Vector(16, i16);
    const V32 = @Vector(16, i32);

    var j: usize = 0;
    while (j < nibbles_a.len) : (j += 16) {
        const va: V = nibbles_a[j..][0..16].*;
        const vb: V = nibbles_b[j..][0..16].*;

        const va16: V16 = va;
        const vb16: V16 = vb;
        const vprod: V16 = va16 * vb16;
        
        const vprod32: V32 = vprod;
        int_acc += @reduce(.Add, vprod32);
    }

    const float_result = @as(f32, @floatFromInt(int_acc)) * a.scale * b.scale;
    const raw_score = float_result + (a.offset * b.offset);
    return std.math.clamp(raw_score, -1.0, 1.0);
}
