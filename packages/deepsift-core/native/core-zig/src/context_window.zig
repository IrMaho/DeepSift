const std = @import("std");

pub const TokenBudget = struct {
    file_path: []const u8,
    original_tokens: u32,
    budgeted_tokens: u32,
    priority: f32,
};

pub fn computeTokenBudgets(
    allocator: std.mem.Allocator,
    file_paths: [][]const u8,
    contents: [][]const u8,
    max_total_tokens: u32,
) ![]TokenBudget {
    var budgets = std.ArrayList(TokenBudget).empty;
    errdefer budgets.deinit(allocator);

    if (file_paths.len == 0 or contents.len == 0) return try budgets.toOwnedSlice(allocator);

    const count = @min(file_paths.len, contents.len);
    var total_raw: u64 = 0;

    var raw_tokens = try allocator.alloc(u32, count);
    defer allocator.free(raw_tokens);
    var priorities = try allocator.alloc(f32, count);
    defer allocator.free(priorities);

    var i: usize = 0;
    while (i < count) : (i += 1) {
        const est = estimateTokens(contents[i]);
        raw_tokens[i] = est;
        total_raw += est;
        priorities[i] = computePriority(file_paths[i], contents[i]);
    }

    var total_priority: f32 = 0.0;
    for (priorities[0..count]) |p| total_priority += p;
    if (total_priority == 0.0) total_priority = 1.0;

    i = 0;
    while (i < count) : (i += 1) {
        const share = priorities[i] / total_priority;
        const budget: u32 = @intFromFloat(@min(
            @as(f32, @floatFromInt(raw_tokens[i])),
            share * @as(f32, @floatFromInt(max_total_tokens)),
        ));

        try budgets.append(allocator, .{
            .file_path = file_paths[i],
            .original_tokens = raw_tokens[i],
            .budgeted_tokens = budget,
            .priority = priorities[i],
        });
    }

    std.mem.sort(TokenBudget, budgets.items, {}, struct {
        fn lessThan(_: void, a: TokenBudget, b: TokenBudget) bool {
            return a.priority > b.priority;
        }
    }.lessThan);

    return try budgets.toOwnedSlice(allocator);
}

fn estimateTokens(content: []const u8) u32 {
    if (content.len == 0) return 0;
    var count: u32 = 1;
    var in_word = false;
    for (content) |c| {
        if (c == ' ' or c == '\t' or c == '\n' or c == '\r' or c == '{' or c == '}' or c == '(' or c == ')' or c == ';' or c == ',') {
            if (in_word) {
                count += 1;
                in_word = false;
            }
        } else {
            in_word = true;
        }
    }
    return count;
}

fn computePriority(file_path: []const u8, content: []const u8) f32 {
    var score: f32 = 1.0;

    if (std.mem.indexOf(u8, file_path, "store") != null or
        std.mem.indexOf(u8, file_path, "reducer") != null or
        std.mem.indexOf(u8, file_path, "bloc") != null)
        score += 3.0;

    if (std.mem.indexOf(u8, file_path, "handler") != null or
        std.mem.indexOf(u8, file_path, "controller") != null or
        std.mem.indexOf(u8, file_path, "service") != null)
        score += 2.5;

    if (std.mem.indexOf(u8, file_path, "model") != null or
        std.mem.indexOf(u8, file_path, "entity") != null or
        std.mem.indexOf(u8, file_path, "type") != null)
        score += 2.0;

    if (std.mem.indexOf(u8, file_path, ".test.") != null or
        std.mem.indexOf(u8, file_path, ".spec.") != null or
        std.mem.indexOf(u8, file_path, "_test.") != null)
        score *= 0.3;

    if (std.mem.indexOf(u8, content, "export") != null) score += 0.5;
    if (std.mem.indexOf(u8, content, "interface") != null) score += 0.5;

    return score;
}
