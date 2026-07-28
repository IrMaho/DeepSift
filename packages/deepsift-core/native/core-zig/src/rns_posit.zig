const std = @import("std");

pub const RnsEngine = struct {
    moduli: [4]u32 = [_]u32{ 251, 253, 255, 256 },

    pub fn toRns(self: RnsEngine, val: u64) [4]u32 {
        return [4]u32{
            @truncate(val % self.moduli[0]),
            @truncate(val % self.moduli[1]),
            @truncate(val % self.moduli[2]),
            @truncate(val % self.moduli[3]),
        };
    }

    pub fn addRns(self: RnsEngine, a: [4]u32, b: [4]u32) [4]u32 {
        return [4]u32{
            (a[0] + b[0]) % self.moduli[0],
            (a[1] + b[1]) % self.moduli[1],
            (a[2] + b[2]) % self.moduli[2],
            (a[3] + b[3]) % self.moduli[3],
        };
    }

    pub fn mulRns(self: RnsEngine, a: [4]u32, b: [4]u32) [4]u32 {
        return [4]u32{
            @truncate((@as(u64, a[0]) * b[0]) % self.moduli[0]),
            @truncate((@as(u64, a[1]) * b[1]) % self.moduli[1]),
            @truncate((@as(u64, a[2]) * b[2]) % self.moduli[2]),
            @truncate((@as(u64, a[3]) * b[3]) % self.moduli[3]),
        };
    }
};

pub inline fn tropicalAdd(a: f32, b: f32) f32 {
    return @min(a, b);
}

pub inline fn tropicalMultiply(a: f32, b: f32) f32 {
    return a + b;
}

pub fn tropicalDotProduct(a: []const f32, b: []const f32) f32 {
    if (a.len == 0 or b.len == 0) return 0.0;
    const len = @min(a.len, b.len);
    var result: f32 = tropicalMultiply(a[0], b[0]);
    var i: usize = 1;
    while (i < len) : (i += 1) {
        const prod = tropicalMultiply(a[i], b[i]);
        result = tropicalAdd(result, prod);
    }
    return result;
}
