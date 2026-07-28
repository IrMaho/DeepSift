const std = @import("std");

pub const VECTOR_DIM: usize = 384;
pub const OUTLIER_COUNT: usize = 16;
pub const PACKED_NIBBLES_LEN: usize = (VECTOR_DIM - OUTLIER_COUNT) / 2;

pub const QuantizedVector = struct {
    scale: f32,
    offset: f32,
    outlier_indices: [OUTLIER_COUNT]u16,
    outlier_values: [OUTLIER_COUNT]i8,
    packed_data: [PACKED_NIBBLES_LEN]u8,

    pub fn quantize(raw: []const f32) QuantizedVector {
        var qv: QuantizedVector = undefined;
        var min_val: f32 = std.math.inf(f32);
        var max_val: f32 = -std.math.inf(f32);

        for (raw) |v| {
            if (v < min_val) min_val = v;
            if (v > max_val) max_val = v;
        }

        const range = max_val - min_val;
        qv.scale = if (range == 0.0) 1.0 else range / 15.0;
        qv.offset = min_val;

        var i: usize = 0;
        while (i < OUTLIER_COUNT) : (i += 1) {
            qv.outlier_indices[i] = @intCast(i);
            const norm = (raw[i] - min_val) / qv.scale;
            qv.outlier_values[i] = @intCast(std.math.clamp(@as(i32, @intFromFloat(norm)), -128, 127));
        }

        var p: usize = 0;
        var r: usize = OUTLIER_COUNT;
        while (r + 1 < raw.len and p < PACKED_NIBBLES_LEN) : (r += 2) {
            const n1 = std.math.clamp(@as(u32, @intFromFloat((raw[r] - min_val) / qv.scale)), 0, 15);
            const n2 = std.math.clamp(@as(u32, @intFromFloat((raw[r + 1] - min_val) / qv.scale)), 0, 15);
            qv.packed_data[p] = @as(u8, @intCast(n1)) | (@as(u8, @intCast(n2)) << 4);
            p += 1;
        }

        return qv;
    }
};
