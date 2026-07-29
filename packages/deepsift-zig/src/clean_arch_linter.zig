const std = @import("std");

pub const CleanArchLinter = struct {
    pub fn checkImport(from_layer: []const u8, to_layer: []const u8) bool {
        if (std.mem.eql(u8, from_layer, "domain")) {
            // Fixes Bug 9, 10
            if (std.mem.startsWith(u8, to_layer, "ui") or std.mem.startsWith(u8, to_layer, "infrastructure")) {
                return false;
            }
        }
        return true;
    }
};

test "clean arch linter basics" {
    try std.testing.expect(CleanArchLinter.checkImport("domain", "utils") == true);
    try std.testing.expect(CleanArchLinter.checkImport("domain", "ui") == false);
}
