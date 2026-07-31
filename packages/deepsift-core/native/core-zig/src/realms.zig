const std = @import("std");
const db = @import("db.zig");

pub const MultiRealmManager = struct {
    allocator: std.mem.Allocator,
    realms: std.StringHashMap(*db.GraphDatabase),

    pub fn init(allocator: std.mem.Allocator) MultiRealmManager {
        return .{
            .allocator = allocator,
            .realms = std.StringHashMap(*db.GraphDatabase).init(allocator),
        };
    }

    pub fn mountRealm(self: *MultiRealmManager, realm_id: []const u8, graph: *db.GraphDatabase) !void {
        try self.realms.put(realm_id, graph);
    }
};
