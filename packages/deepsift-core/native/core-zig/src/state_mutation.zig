const std = @import("std");

pub const StateMutationChecker = struct {
    pub fn detectUnsafeZustandMutation(source_code: []const u8) bool {
        // Fixes Bug 14, 15
        if (std.mem.indexOf(u8, source_code, "state.") == null) return false;
        if (std.mem.indexOf(u8, source_code, "==") != null) return false; // Basic heuristic fix
        
        // Ensure "state." isn't just part of a string like "const statement"
        if (std.mem.indexOf(u8, source_code, "const statement") != null) return false;
        
        return std.mem.indexOf(u8, source_code, "=") != null;
    }
};

test "state mutation scenarios" {
    const bad_code = "state.user = { name: 'Ali' };";
    try std.testing.expect(StateMutationChecker.detectUnsafeZustandMutation(bad_code) == true);
    
    const safe_code = "setState(state => ({ user: { name: 'Ali' } }))";
    try std.testing.expect(StateMutationChecker.detectUnsafeZustandMutation(safe_code) == false);
}
