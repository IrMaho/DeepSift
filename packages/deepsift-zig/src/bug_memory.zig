const std = @import("std");

pub const BugPattern = struct {
    pattern_hash: u64,
    description: []const u8,
};

pub const BugMemoryRealm = struct {
    allocator: std.mem.Allocator,
    known_bugs: std.ArrayList(BugPattern),
    
    pub fn init(allocator: std.mem.Allocator) BugMemoryRealm {
        return .{ .allocator = allocator, .known_bugs = .empty };
    }
    
    pub fn deinit(self: *BugMemoryRealm) void {
        self.known_bugs.deinit(self.allocator);
    }
    
    pub fn learnBug(self: *BugMemoryRealm, hash: u64, desc: []const u8) !void {
        try self.known_bugs.append(self.allocator, .{ .pattern_hash = hash, .description = desc });
    }
    
    pub fn checkPattern(self: *BugMemoryRealm, hash: u64) ?[]const u8 {
        for (self.known_bugs.items) |bug| {
            if (bug.pattern_hash == hash) return bug.description;
        }
        return null;
    }
};

test "bug memory realm" {
    var realm = BugMemoryRealm.init(std.testing.allocator);
    defer realm.deinit();
    
    try realm.learnBug(12345, "Null pointer exception pattern");
    try std.testing.expect(realm.checkPattern(12345) != null);
    try std.testing.expect(realm.checkPattern(9999) == null);
}
