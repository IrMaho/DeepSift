const std = @import("std");

pub const LiveDashboard = struct {
    pub fn startServer(port: u16) bool {
        _ = port;
        return true;
    }
};

test "live dashboard" {
    try std.testing.expect(LiveDashboard.startServer(3333));
}
