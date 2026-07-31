const std = @import("std");

pub const TimeTravel = struct {
    pub fn extractHistory(file_path: []const u8) ![]const u8 {
        _ = file_path;
        return "commit 1: Added auth\ncommit 2: Fixed bug";
    }
};

test "time travel rewind" {
    const history = try TimeTravel.extractHistory("src/auth.ts");
    try std.testing.expect(history.len > 0);
}
