const std = @import("std");

pub const CommitIntent = struct {
    message: []const u8,
    intent: []const u8,
    confidence: f32,
    category: []const u8,
};

pub fn classifyCommits(
    allocator: std.mem.Allocator,
    messages: [][]const u8,
) ![]CommitIntent {
    var results = std.ArrayList(CommitIntent).empty;
    errdefer results.deinit(allocator);

    for (messages) |msg| {
        const lower_buf = try allocator.alloc(u8, msg.len);
        defer allocator.free(lower_buf);
        for (msg, 0..) |c, i| lower_buf[i] = std.ascii.toLower(c);
        const lower = lower_buf[0..msg.len];

        var intent: []const u8 = "unknown";
        var confidence: f32 = 0.3;
        var category: []const u8 = "other";

        if (startsWith(lower, "fix") or std.mem.indexOf(u8, lower, "bugfix") != null or std.mem.indexOf(u8, lower, "hotfix") != null or std.mem.indexOf(u8, lower, "patch") != null) {
            intent = "bug_fix";
            confidence = 0.9;
            category = "maintenance";
        } else if (startsWith(lower, "feat") or startsWith(lower, "add") or std.mem.indexOf(u8, lower, "implement") != null or std.mem.indexOf(u8, lower, "introduce") != null) {
            intent = "feature";
            confidence = 0.9;
            category = "enhancement";
        } else if (startsWith(lower, "refactor") or std.mem.indexOf(u8, lower, "restructure") != null or std.mem.indexOf(u8, lower, "reorganize") != null or std.mem.indexOf(u8, lower, "clean") != null) {
            intent = "refactor";
            confidence = 0.85;
            category = "maintenance";
        } else if (startsWith(lower, "doc") or std.mem.indexOf(u8, lower, "readme") != null or std.mem.indexOf(u8, lower, "comment") != null) {
            intent = "documentation";
            confidence = 0.9;
            category = "documentation";
        } else if (startsWith(lower, "test") or std.mem.indexOf(u8, lower, "spec") != null or std.mem.indexOf(u8, lower, "coverage") != null) {
            intent = "testing";
            confidence = 0.85;
            category = "quality";
        } else if (startsWith(lower, "perf") or std.mem.indexOf(u8, lower, "optimi") != null or std.mem.indexOf(u8, lower, "speed") != null or std.mem.indexOf(u8, lower, "cache") != null) {
            intent = "performance";
            confidence = 0.85;
            category = "optimization";
        } else if (startsWith(lower, "ci") or startsWith(lower, "build") or std.mem.indexOf(u8, lower, "deploy") != null or std.mem.indexOf(u8, lower, "pipeline") != null) {
            intent = "ci_cd";
            confidence = 0.8;
            category = "infrastructure";
        } else if (startsWith(lower, "style") or std.mem.indexOf(u8, lower, "format") != null or std.mem.indexOf(u8, lower, "lint") != null or std.mem.indexOf(u8, lower, "prettier") != null) {
            intent = "style";
            confidence = 0.85;
            category = "maintenance";
        } else if (startsWith(lower, "chore") or std.mem.indexOf(u8, lower, "bump") != null or std.mem.indexOf(u8, lower, "upgrade") != null or std.mem.indexOf(u8, lower, "update dep") != null) {
            intent = "chore";
            confidence = 0.8;
            category = "maintenance";
        } else if (std.mem.indexOf(u8, lower, "security") != null or std.mem.indexOf(u8, lower, "vuln") != null or std.mem.indexOf(u8, lower, "cve") != null) {
            intent = "security";
            confidence = 0.9;
            category = "security";
        } else if (startsWith(lower, "revert") or std.mem.indexOf(u8, lower, "rollback") != null) {
            intent = "revert";
            confidence = 0.9;
            category = "maintenance";
        } else if (startsWith(lower, "wip") or startsWith(lower, "tmp") or startsWith(lower, "todo")) {
            intent = "work_in_progress";
            confidence = 0.7;
            category = "development";
        }

        try results.append(allocator, .{
            .message = msg,
            .intent = intent,
            .confidence = confidence,
            .category = category,
        });
    }

    return try results.toOwnedSlice(allocator);
}

fn startsWith(haystack: []const u8, needle: []const u8) bool {
    if (haystack.len < needle.len) return false;
    return std.mem.eql(u8, haystack[0..needle.len], needle);
}
