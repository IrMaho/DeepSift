const std = @import("std");
const ast_parser = @import("ast_parser.zig");

const c = @cImport({
    @cInclude("tree_sitter/api.h");
});

extern fn tree_sitter_typescript() *c.TSLanguage;

pub fn parseWithTreeSitter(
    allocator: std.mem.Allocator,
    content: []const u8,
    file_path: []const u8,
    language: []const u8,
) ![]ast_parser.ParsedChunk {
    var chunks = std.ArrayList(ast_parser.ParsedChunk).empty;
    defer chunks.deinit(allocator);

    const parser = c.ts_parser_new();
    defer c.ts_parser_delete(parser);
    
    const ts_lang = tree_sitter_typescript();
    _ = c.ts_parser_set_language(parser, ts_lang);
    
    const tree = c.ts_parser_parse_string(parser, null, content.ptr, @intCast(content.len));
    if (tree == null) {
        return try chunks.toOwnedSlice(allocator);
    }
    defer c.ts_tree_delete(tree);
    
    const root_node = c.ts_tree_root_node(tree);
    try walkNode(allocator, &chunks, root_node, content, file_path, language);
    
    return try chunks.toOwnedSlice(allocator);
}

fn walkNode(
    allocator: std.mem.Allocator,
    chunks: *std.ArrayList(ast_parser.ParsedChunk),
    node: c.TSNode,
    content: []const u8,
    file_path: []const u8,
    language: []const u8,
) !void {
    const node_type_ptr = c.ts_node_type(node);
    if (node_type_ptr == null) return;
    const node_type = std.mem.span(node_type_ptr);
    
    var is_target = false;
    var type_str: []const u8 = "block";
    var family_str: []const u8 = "unknown";
    
    if (std.mem.eql(u8, node_type, "function_declaration") or std.mem.eql(u8, node_type, "method_definition") or std.mem.eql(u8, node_type, "arrow_function")) {
        is_target = true;
        type_str = "function";
        family_str = "logic";
    } else if (std.mem.eql(u8, node_type, "class_declaration") or std.mem.eql(u8, node_type, "interface_declaration") or std.mem.eql(u8, node_type, "type_alias_declaration")) {
        is_target = true;
        type_str = "class";
        family_str = "structure";
    } else if (std.mem.eql(u8, node_type, "import_statement")) {
        is_target = true;
        type_str = "import";
        family_str = "dependency";
    }
    
    if (is_target) {
        const start_point = c.ts_node_start_point(node);
        const end_point = c.ts_node_end_point(node);
        const start_byte = c.ts_node_start_byte(node);
        const end_byte = c.ts_node_end_byte(node);
        
        if (start_byte < end_byte and end_byte <= content.len) {
            const block_content = content[start_byte..end_byte];
            const trimmed = std.mem.trim(u8, block_content, " \t\r\n");
            
            if (trimmed.len > 0) {
                const id = try std.fmt.allocPrint(allocator, "{s}_{d}", .{std.fs.path.basename(file_path), start_point.row + 1});
                
                try chunks.append(allocator, .{
                    .id = id,
                    .file_path = try allocator.dupe(u8, file_path),
                    .content = try allocator.dupe(u8, trimmed),
                    .start_line = start_point.row + 1,
                    .end_line = end_point.row + 1,
                    .type = type_str,
                    .family = family_str,
                    .language = try allocator.dupe(u8, language),
                });
            }
        }
    }
    
    // Always traverse children because target nodes might be nested (e.g. methods inside a class, arrow functions inside variables)
    const child_count = c.ts_node_child_count(node);
    var i: u32 = 0;
    while (i < child_count) : (i += 1) {
        const child = c.ts_node_child(node, i);
        try walkNode(allocator, chunks, child, content, file_path, language);
    }
}
