const std = @import("std");

pub const SmartPagination = struct {
    pub const PageResult = struct {
        items_json: []const u8,
        next_command: []const u8,
        has_more: bool,
    };

    pub fn paginate(allocator: std.mem.Allocator, items_len: usize, limit: usize, offset: usize, base_command: []const u8) !PageResult {
        const has_more = offset + limit < items_len;
        var next_cmd: []const u8 = "";
        
        if (has_more) {
            next_cmd = try std.fmt.allocPrint(allocator, "{s} --limit {d} --offset {d}", .{base_command, limit, offset + limit});
        } else {
            next_cmd = try allocator.dupe(u8, "none");
        }

        return PageResult{
            .items_json = "[]",
            .next_command = next_cmd,
            .has_more = has_more,
        };
    }
};
