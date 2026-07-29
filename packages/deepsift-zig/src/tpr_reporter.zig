const std = @import("std");

pub const TPRReporter = struct {
    pub fn calculateRatio(prod_file_count: u32, test_file_count: u32) f32 {
        if (prod_file_count == 0) {
            return 0.0;
        }
        const ratio = @as(f32, @floatFromInt(test_file_count)) / @as(f32, @floatFromInt(prod_file_count));
        if (ratio > 1.0) return 1.0;
        return ratio;
    }
    
    pub fn isHealthy(ratio: f32) bool {
        if (std.math.isNan(ratio)) return false;
        if (std.math.isInf(ratio)) return false;
        if (ratio < 0.0) return false;
        return ratio >= 0.8;
    }
};
