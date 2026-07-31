const std = @import("std");

pub const TestMapping = struct {
    source_file: []const u8,
    test_file: []const u8,
    confidence: u8, // 0-100
};

pub fn discoverTestMappings(allocator: std.mem.Allocator, file_paths: [][]const u8) ![]TestMapping {
    var mappings = std.ArrayList(TestMapping).empty;
    defer mappings.deinit(allocator);

    for (file_paths) |fp| {
        // Simple heuristic: if it ends with .test.ts or .spec.ts or _test.go
        if (std.mem.endsWith(u8, fp, ".test.ts") or std.mem.endsWith(u8, fp, ".spec.ts") or std.mem.endsWith(u8, fp, "_test.go")) {
            // Predict the source file name
            var src = std.ArrayList(u8).empty;
            defer src.deinit(allocator);
            
            if (std.mem.endsWith(u8, fp, ".test.ts")) {
                const base = fp[0..fp.len - 8];
                try src.appendSlice(allocator, base);
                try src.appendSlice(allocator, ".ts");
            } else if (std.mem.endsWith(u8, fp, ".spec.ts")) {
                const base = fp[0..fp.len - 8];
                try src.appendSlice(allocator, base);
                try src.appendSlice(allocator, ".ts");
            } else if (std.mem.endsWith(u8, fp, "_test.go")) {
                const base = fp[0..fp.len - 8];
                try src.appendSlice(allocator, base);
                try src.appendSlice(allocator, ".go");
            }
            
            // Output mapping
            try mappings.append(allocator, .{
                .source_file = try allocator.dupe(u8, src.items),
                .test_file = try allocator.dupe(u8, fp),
                .confidence = 90,
            });
        }
    }

    const result = try allocator.alloc(TestMapping, mappings.items.len);
    for (mappings.items, 0..) |itm, i| {
        result[i] = itm;
    }
    return result;
}
