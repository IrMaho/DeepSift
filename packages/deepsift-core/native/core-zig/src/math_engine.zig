const std = @import("std");

pub const LutTable = struct {
    table_i4: [16][16]i16,
    table_i8: [256][256]i32,

    pub fn init() LutTable {
        @setEvalBranchQuota(200000);
        var lut: LutTable = undefined;
        var i: usize = 0;
        while (i < 16) : (i += 1) {
            var j: usize = 0;
            while (j < 16) : (j += 1) {
                const vi: i16 = @as(i16, @intCast(i)) - 8;
                const vj: i16 = @as(i16, @intCast(j)) - 8;
                lut.table_i4[i][j] = vi * vj;
            }
        }
        i = 0;
        while (i < 256) : (i += 1) {
            var j: usize = 0;
            while (j < 256) : (j += 1) {
                const vi: i32 = @as(i32, @intCast(i)) - 128;
                const vj: i32 = @as(i32, @intCast(j)) - 128;
                lut.table_i8[i][j] = vi * vj;
            }
        }
        return lut;
    }

    pub inline fn multiplyI4(self: *const LutTable, a: u4, b: u4) i16 {
        return self.table_i4[a][b];
    }

    pub inline fn multiplyI8(self: *const LutTable, a: u8, b: u8) i32 {
        return self.table_i8[a][b];
    }
};

pub const GLOBAL_LUT = LutTable.init();

pub fn ternaryDotProduct(a: []const i8, b: []const i8) i32 {
    var sum: i32 = 0;
    const len = @min(a.len, b.len);
    var i: usize = 0;
    while (i < len) : (i += 1) {
        const val_a = a[i];
        const val_b = b[i];
        if (val_a == 0 or val_b == 0) continue;
        if ((val_a > 0 and val_b > 0) or (val_a < 0 and val_b < 0)) {
            sum += 1;
        } else {
            sum -= 1;
        }
    }
    return sum;
}

pub fn unpackNibbles(packed_bytes: []const u8, out_nibbles: []i8) void {
    var i: usize = 0;
    while (i < packed_bytes.len and (i * 2 + 1) < out_nibbles.len) : (i += 1) {
        const b = packed_bytes[i];
        const low: u4 = @truncate(b);
        const high: u4 = @truncate(b >> 4);
        out_nibbles[i * 2] = @as(i8, @intCast(low)) - 8;
        out_nibbles[i * 2 + 1] = @as(i8, @intCast(high)) - 8;
    }
}

pub fn fusedMultiplyAddF32(a: []const f32, b: []const f32, c: f32) f32 {
    var sum: f32 = c;
    const len = @min(a.len, b.len);
    var i: usize = 0;
    while (i < len) : (i += 1) {
        sum = @mulAdd(f32, a[i], b[i], sum);
    }
    return sum;
}
