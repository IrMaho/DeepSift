const std = @import("std");

pub const Watcher = struct {
    allocator: std.mem.Allocator,
    files_changed: std.ArrayList([]const u8),

    pub fn init(allocator: std.mem.Allocator) Watcher {
        return .{
            .allocator = allocator,
            .files_changed = .empty,
        };
    }
    
    pub fn deinit(self: *Watcher) void {
        self.files_changed.deinit(self.allocator);
    }
    
    pub fn triggerFileChange(self: *Watcher, file_path: []const u8) !void {
        try self.files_changed.append(self.allocator, file_path);
    }
    
    pub fn getPendingChanges(self: *Watcher) []const []const u8 {
        return self.files_changed.items;
    }
};

test "fsnotify basic test" {
    var watcher = Watcher.init(std.testing.allocator);
    defer watcher.deinit();

    try watcher.triggerFileChange("src/main.ts");
    try std.testing.expectEqual(@as(usize, 1), watcher.getPendingChanges().len);
    try std.testing.expectEqualStrings("src/main.ts", watcher.getPendingChanges()[0]);
}
