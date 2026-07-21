const std = @import("std");
const mem = std.mem;

pub const RealmManager = struct {
    allocator: mem.Allocator,
    base_path: []const u8,

    const Self = @This();

    pub fn init(allocator: mem.Allocator, base_path: []const u8) Self {
        return Self{
            .allocator = allocator,
            .base_path = base_path,
        };
    }

    pub fn getRealmDbPath(self: *const Self, realm_id: []const u8) ![]const u8 {
        const segments = [_][]const u8{ self.base_path, ".deepsift", "realms", realm_id, "cache.db" };
        return try std.fs.path.join(self.allocator, &segments);
    }

    pub fn getRealmGraphPath(self: *const Self, realm_id: []const u8) ![]const u8 {
        const segments = [_][]const u8{ self.base_path, ".deepsift", "realms", realm_id, "graph.db" };
        return try std.fs.path.join(self.allocator, &segments);
    }

    pub fn resolveDbPath(self: *const Self, realm_id: ?[]const u8, legacy_db_path: []const u8) ![]const u8 {
        if (realm_id) |rid| {
            if (rid.len > 0) {
                return try self.getRealmDbPath(rid);
            }
        }
        return try self.allocator.dupe(u8, legacy_db_path);
    }

    pub fn resolveGraphPath(self: *const Self, realm_id: ?[]const u8, legacy_graph_path: ?[]const u8) !?[]const u8 {
        if (realm_id) |rid| {
            if (rid.len > 0) {
                return try self.getRealmGraphPath(rid);
            }
        }
        if (legacy_graph_path) |lgp| {
            return try self.allocator.dupe(u8, lgp);
        }
        return null;
    }
};
