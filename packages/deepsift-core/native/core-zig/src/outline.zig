const std = @import("std");

pub const FileCategoryInfo = struct {
    file_name: []const u8,
    category: []const u8,
    weight: f32,
};

pub fn classifyFileNative(file_name: []const u8) []const u8 {
    if (std.mem.endsWith(u8, file_name, ".test.ts") or std.mem.endsWith(u8, file_name, "_test.go") or std.mem.endsWith(u8, file_name, "_test.dart")) {
        return "Test";
    }
    if (std.mem.endsWith(u8, file_name, ".tsx") or std.mem.endsWith(u8, file_name, ".jsx") or std.mem.indexOf(u8, file_name, "component") != null) {
        return "UI";
    }
    if (std.mem.indexOf(u8, file_name, "service") != null or std.mem.indexOf(u8, file_name, "domain") != null or std.mem.indexOf(u8, file_name, "handler") != null) {
        return "Domain";
    }
    if (std.mem.indexOf(u8, file_name, "store") != null or std.mem.indexOf(u8, file_name, "repo") != null or std.mem.indexOf(u8, file_name, "db") != null) {
        return "Data";
    }
    if (std.mem.endsWith(u8, file_name, ".json") or std.mem.endsWith(u8, file_name, ".yaml") or std.mem.endsWith(u8, file_name, ".toml")) {
        return "Config";
    }
    return "Core";
}

pub fn calculateFileWeightNative(file_name: []const u8, content_len: usize) FileCategoryInfo {
    const cat = classifyFileNative(file_name);
    var weight: f32 = 1.0;

    if (std.mem.eql(u8, cat, "Domain")) {
        weight = 1.5;
    } else if (std.mem.eql(u8, cat, "Data")) {
        weight = 1.4;
    } else if (std.mem.eql(u8, cat, "UI")) {
        weight = 1.2;
    } else if (std.mem.eql(u8, cat, "Test")) {
        weight = 0.8;
    }

    if (content_len > 10000) {
        weight += 0.3; // God node candidate
    }

    return FileCategoryInfo{
        .file_name = file_name,
        .category = cat,
        .weight = weight,
    };
}
