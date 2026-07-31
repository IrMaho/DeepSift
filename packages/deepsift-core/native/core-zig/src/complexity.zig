const std = @import("std");

pub const ComplexityMetrics = struct {
    file_path: []const u8,
    cyclomatic: u32,
    cognitive: u32,
    recommend_split: bool,
};

pub const ComplexityAnalyzer = struct {
    pub fn analyzeCode(allocator: std.mem.Allocator, content: []const u8, file_path: []const u8) !ComplexityMetrics {
        var cyclomatic: u32 = 1;
        var cognitive: u32 = 0;
        var nesting: u32 = 0;

        var line_it = std.mem.splitScalar(u8, content, '\n');
        while (line_it.next()) |line| {
            const trimmed = std.mem.trim(u8, line, " \t\r");
            if (std.mem.startsWith(u8, trimmed, "if") or std.mem.startsWith(u8, trimmed, "while") or std.mem.startsWith(u8, trimmed, "for") or std.mem.startsWith(u8, trimmed, "catch") or std.mem.startsWith(u8, trimmed, "switch")) {
                cyclomatic += 1;
                cognitive += 1 + nesting;
            }
            if (std.mem.indexOf(u8, trimmed, "{") != null) {
                nesting += 1;
            }
            if (std.mem.indexOf(u8, trimmed, "}") != null) {
                if (nesting > 0) {
                    nesting -= 1;
                }
            }
        }

        return ComplexityMetrics{
            .file_path = try allocator.dupe(u8, file_path),
            .cyclomatic = cyclomatic,
            .cognitive = cognitive,
            .recommend_split = cognitive > 15, // Threshold for splitting
        };
    }
};
