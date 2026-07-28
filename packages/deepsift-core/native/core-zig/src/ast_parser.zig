const std = @import("std");
const mem = std.mem;
const db = @import("db.zig");
const sift_vector = @import("sift_vector.zig"); // if needed for imports

pub const ParsedChunk = struct {
    id: []const u8,
    file_path: []const u8,
    content: []const u8,
    start_line: u32,
    end_line: u32,
    type: []const u8,
    family: []const u8,
    language: []const u8,
};

const BlockType = enum {
    import,
    function,
    class,
    constant,
    unknown,
};

pub fn parseNative(allocator: std.mem.Allocator, content: []const u8, file_path: []const u8, language: []const u8) ![]ParsedChunk {
    var chunks = std.ArrayList(ParsedChunk).empty;
    defer chunks.deinit(allocator);

    var current_block_type: ?BlockType = null;
    var block_start_line: u32 = 0;
    var brace_depth: i32 = 0;
    
    var line_it = mem.splitSequence(u8, content, "\n");
    var line_num: u32 = 1;
    
    // We don't save the block content here, we can just slice it from the original content using offsets.
    var block_start_offset: usize = 0;
    var current_offset: usize = 0;
    
    while (line_it.next()) |line| {
        const trimmed = mem.trim(u8, line, " \t\r");
        
        const open_braces = mem.count(u8, trimmed, "{");
        const close_braces = mem.count(u8, trimmed, "}");
        
        if (current_block_type == .import) {
            if (trimmed.len == 0 or mem.startsWith(u8, trimmed, "//") or mem.startsWith(u8, trimmed, "/*")) {
                // keep going
            } else if (!isImportStart(trimmed) and !mem.startsWith(u8, trimmed, "}")) {
                // End of imports
                try addChunk(allocator, &chunks, content, file_path, language, .import, block_start_line, line_num - 1, block_start_offset, current_offset);
                current_block_type = null;
            }
        }
        
        if (current_block_type == null) {
            if (isImportStart(trimmed)) {
                current_block_type = .import;
                block_start_line = line_num;
                block_start_offset = current_offset;
            } else if (isClassStart(trimmed)) {
                current_block_type = .class;
                block_start_line = line_num;
                block_start_offset = current_offset;
            } else if (isFunctionStart(trimmed)) {
                current_block_type = .function;
                block_start_line = line_num;
                block_start_offset = current_offset;
            } else if (isConstantStart(trimmed)) {
                current_block_type = .constant;
                block_start_line = line_num;
                block_start_offset = current_offset;
            } else if (trimmed.len > 0) {
                current_block_type = .unknown;
                block_start_line = line_num;
                block_start_offset = current_offset;
            }
        }
        
        if (current_block_type) |bt| {
            brace_depth += @as(i32, @intCast(open_braces)) - @as(i32, @intCast(close_braces));
            
            if (bt != .import and brace_depth <= 0 and close_braces > 0) {
                try addChunk(allocator, &chunks, content, file_path, language, bt, block_start_line, line_num, block_start_offset, current_offset + line.len);
                current_block_type = null;
                brace_depth = 0;
            } else if (bt == .unknown and trimmed.len == 0) {
                try addChunk(allocator, &chunks, content, file_path, language, bt, block_start_line, line_num, block_start_offset, current_offset + line.len);
                current_block_type = null;
                brace_depth = 0;
            }
        }
        
        current_offset += line.len + 1; // +1 for newline
        line_num += 1;
    }
    
    if (current_block_type) |bt| {
        try addChunk(allocator, &chunks, content, file_path, language, bt, block_start_line, line_num - 1, block_start_offset, content.len);
    }
    
    return try chunks.toOwnedSlice(allocator);
}

fn addChunk(
    allocator: std.mem.Allocator,
    chunks: *std.ArrayList(ParsedChunk),
    full_content: []const u8,
    file_path: []const u8,
    language: []const u8,
    bt: BlockType,
    start_line: u32,
    end_line: u32,
    start_offset: usize,
    end_offset: usize,
) !void {
    if (start_line >= end_line) return;
    
    const block_content = if (end_offset <= full_content.len) full_content[start_offset..end_offset] else full_content[start_offset..];
    const trimmed = mem.trim(u8, block_content, " \t\r\n");
    if (trimmed.len == 0) return;
    
    const type_str = switch (bt) {
        .import => "import",
        .class => "class",
        .function => "function",
        .constant => "block",
        .unknown => "block",
    };
    
    const family_str = switch (bt) {
        .import => "dependency",
        .class => "structure",
        .function => "logic",
        .constant => "data",
        .unknown => "unknown",
    };
    
    // id formatting: path_startline_hash
    // We can just omit id for now, Node.js will generate it. Or generate a dummy.
    const id = try std.fmt.allocPrint(allocator, "{s}_{d}", .{std.fs.path.basename(file_path), start_line});
    
    try chunks.append(allocator, .{
        .id = id,
        .file_path = try allocator.dupe(u8, file_path),
        .content = try allocator.dupe(u8, trimmed),
        .start_line = start_line,
        .end_line = end_line,
        .type = type_str,
        .family = family_str,
        .language = try allocator.dupe(u8, language),
    });
}

fn isImportStart(line: []const u8) bool {
    const tokens = [_][]const u8{"import ", "export ", "from ", "require(", "include ", "use "};
    for (tokens) |t| {
        if (mem.startsWith(u8, line, t)) return true;
    }
    return false;
}

fn isClassStart(line: []const u8) bool {
    var it = mem.tokenizeAny(u8, line, " \t\r");
    while (it.next()) |token| {
        if (mem.eql(u8, token, "class") or mem.eql(u8, token, "struct") or mem.eql(u8, token, "interface") or mem.eql(u8, token, "enum") or mem.eql(u8, token, "trait")) {
            return true;
        }
    }
    return false;
}

fn isFunctionStart(line: []const u8) bool {
    var it = mem.tokenizeAny(u8, line, " \t\r(");
    while (it.next()) |token| {
        if (mem.eql(u8, token, "function") or mem.eql(u8, token, "func") or mem.eql(u8, token, "fn") or mem.eql(u8, token, "def") or mem.eql(u8, token, "fun")) {
            return true;
        }
    }
    return false;
}

fn isConstantStart(line: []const u8) bool {
    var it = mem.tokenizeAny(u8, line, " \t\r");
    while (it.next()) |token| {
        if (mem.eql(u8, token, "const") or mem.eql(u8, token, "final") or mem.eql(u8, token, "val")) {
            return true;
        }
    }
    return false;
}
