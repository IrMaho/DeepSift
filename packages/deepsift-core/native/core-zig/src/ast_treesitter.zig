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

pub fn extractCalltreeWithTreeSitter(
    allocator: std.mem.Allocator,
    content: []const u8,
    file_path: []const u8,
    language: []const u8,
    symbol: []const u8,
) ![]ast_parser.CalltreeResult {
    var results = std.ArrayList(ast_parser.CalltreeResult).empty;
    defer results.deinit(allocator);

    const parser = c.ts_parser_new();
    defer c.ts_parser_delete(parser);
    
    const ts_lang = tree_sitter_typescript();
    _ = c.ts_parser_set_language(parser, ts_lang);
    
    const tree = c.ts_parser_parse_string(parser, null, content.ptr, @intCast(content.len));
    if (tree == null) {
        return try results.toOwnedSlice(allocator);
    }
    defer c.ts_tree_delete(tree);
    
    const root_node = c.ts_tree_root_node(tree);
    try walkCalltreeNode(allocator, &results, root_node, content, file_path, language, symbol);
    
    return try results.toOwnedSlice(allocator);
}

fn walkCalltreeNode(
    allocator: std.mem.Allocator,
    results: *std.ArrayList(ast_parser.CalltreeResult),
    node: c.TSNode,
    content: []const u8,
    file_path: []const u8,
    language: []const u8,
    symbol: []const u8,
) !void {
    const node_type_ptr = c.ts_node_type(node);
    if (node_type_ptr == null) return;
    const node_type = std.mem.span(node_type_ptr);
    
    var role: ?[]const u8 = null;
    
    if (std.mem.eql(u8, node_type, "call_expression")) {
        // Get the function being called
        const func_node = c.ts_node_child_by_field_name(node, "function", 8);
        if (c.ts_node_is_null(func_node)) {
            // some tree sitter grammars don't use 'function' field name, fallback to first child
            const first_child = c.ts_node_child(node, 0);
            if (!c.ts_node_is_null(first_child)) {
                role = try evaluateCallNode(first_child, content, symbol);
            }
        } else {
            role = try evaluateCallNode(func_node, content, symbol);
        }
    } else if (std.mem.eql(u8, node_type, "new_expression")) {
        const constructor_node = c.ts_node_child_by_field_name(node, "constructor", 11);
        if (!c.ts_node_is_null(constructor_node)) {
            role = try evaluateCallNode(constructor_node, content, symbol);
        } else {
            const first_child = c.ts_node_child(node, 1); // skip 'new' keyword
            if (!c.ts_node_is_null(first_child)) {
                role = try evaluateCallNode(first_child, content, symbol);
            }
        }
    } else if (std.mem.eql(u8, node_type, "function_declaration") or std.mem.eql(u8, node_type, "method_definition") or std.mem.eql(u8, node_type, "class_declaration") or std.mem.eql(u8, node_type, "type_alias_declaration") or std.mem.eql(u8, node_type, "interface_declaration")) {
        const name_node = c.ts_node_child_by_field_name(node, "name", 4);
        if (!c.ts_node_is_null(name_node)) {
            const start = c.ts_node_start_byte(name_node);
            const end = c.ts_node_end_byte(name_node);
            if (start < end and end <= content.len) {
                const name_str = content[start..end];
                if (std.mem.eql(u8, name_str, symbol)) {
                    role = "callee";
                }
            }
        }
    } else if (std.mem.eql(u8, node_type, "variable_declarator")) {
        const name_node = c.ts_node_child_by_field_name(node, "name", 4);
        if (!c.ts_node_is_null(name_node)) {
            const start = c.ts_node_start_byte(name_node);
            const end = c.ts_node_end_byte(name_node);
            if (start < end and end <= content.len) {
                const name_str = content[start..end];
                if (std.mem.eql(u8, name_str, symbol)) {
                    // Whether it's an arrow function or a call_expression (like Zustand create), it's the callee definition.
                    role = "callee";
                }
            }
        }
    } else if (std.mem.eql(u8, node_type, "identifier") or std.mem.eql(u8, node_type, "type_identifier")) {
        // Fallback for simple reference or type reference
        const start = c.ts_node_start_byte(node);
        const end = c.ts_node_end_byte(node);
        if (start < end and end <= content.len) {
            const name_str = content[start..end];
            if (std.mem.eql(u8, name_str, symbol)) {
                // If it's just an identifier, check its parent to see if it's already handled
                const parent = c.ts_node_parent(node);
                if (!c.ts_node_is_null(parent)) {
                    const p_type_ptr = c.ts_node_type(parent);
                    if (p_type_ptr != null) {
                        const p_type = std.mem.span(p_type_ptr);
                        if (!std.mem.eql(u8, p_type, "function_declaration") and 
                            !std.mem.eql(u8, p_type, "method_definition") and 
                            !std.mem.eql(u8, p_type, "class_declaration") and
                            !std.mem.eql(u8, p_type, "call_expression") and
                            !std.mem.eql(u8, p_type, "new_expression")) {
                            role = "caller"; // Generic usage reference
                        }
                    }
                } else {
                    role = "caller";
                }
            }
        }
    }
    
    if (role) |r| {
        const start_point = c.ts_node_start_point(node);
        const start_byte = c.ts_node_start_byte(node);
        const end_byte = c.ts_node_end_byte(node);
        
        if (start_byte < end_byte and end_byte <= content.len) {
            var snippet_end = end_byte;
            // Limit snippet length
            if (snippet_end - start_byte > 150) {
                snippet_end = start_byte + 150;
            }
            const snippet = content[start_byte..snippet_end];
            const trimmed = std.mem.trim(u8, snippet, " \t\r\n");
            
            try results.append(allocator, .{
                .file_path = try allocator.dupe(u8, file_path),
                .line = start_point.row + 1,
                .snippet = try allocator.dupe(u8, trimmed),
                .role = try allocator.dupe(u8, r),
            });
        }
    }
    
    const child_count = c.ts_node_child_count(node);
    var i: u32 = 0;
    while (i < child_count) : (i += 1) {
        const child = c.ts_node_child(node, i);
        try walkCalltreeNode(allocator, results, child, content, file_path, language, symbol);
    }
}

fn evaluateCallNode(func_node: c.TSNode, content: []const u8, symbol: []const u8) !?[]const u8 {
    const start = c.ts_node_start_byte(func_node);
    const end = c.ts_node_end_byte(func_node);
    if (start >= end or end > content.len) return null;
    
    const func_name = content[start..end];
    
    // std.debug.print("evaluateCallNode: '{s}' == '{s}'?\n", .{func_name, symbol});
    
    if (std.mem.eql(u8, func_name, symbol)) {
        return "caller"; // Generic caller
    }
    
    // State Mutation Matrix Logic
    // If the symbol is e.g. "useStore"
    // Does func_name equal symbol? Then it's typically a selector: useStore((state) => state.x)
    // Does func_name equal symbol + ".setState"? Mutator
    // Does func_name equal "dispatch"? Mutator (if in Redux context)
    
    // Check property access (member_expression)
    const node_type_ptr = c.ts_node_type(func_node);
    if (node_type_ptr != null) {
        const node_type = std.mem.span(node_type_ptr);
        if (std.mem.eql(u8, node_type, "member_expression")) {
            const object_node = c.ts_node_child_by_field_name(func_node, "object", 6);
            const prop_node = c.ts_node_child_by_field_name(func_node, "property", 8);
            
            if (!c.ts_node_is_null(object_node) and !c.ts_node_is_null(prop_node)) {
                const obj_start = c.ts_node_start_byte(object_node);
                const obj_end = c.ts_node_end_byte(object_node);
                const prop_start = c.ts_node_start_byte(prop_node);
                const prop_end = c.ts_node_end_byte(prop_node);
                
                if (obj_start < obj_end and obj_end <= content.len and prop_start < prop_end and prop_end <= content.len) {
                    const obj_name = content[obj_start..obj_end];
                    const prop_name = content[prop_start..prop_end];
                    
                    if (std.mem.eql(u8, obj_name, symbol)) {
                        if (std.mem.eql(u8, prop_name, "setState") or std.mem.eql(u8, prop_name, "mutate") or std.mem.eql(u8, prop_name, "set")) {
                            return "mutator";
                        } else if (std.mem.eql(u8, prop_name, "getState")) {
                            return "selector";
                        }
                        return "caller";
                    }
                }
            }
        }
    }
    
    if (std.mem.eql(u8, func_name, symbol)) {
        // If it's a direct call to the symbol, we can inspect its arguments to be smarter.
        // A direct call to a Zustand store typically indicates a Selector.
        // e.g. useColorStore(state => state.activeColor)
        return "selector";
    }
    
    return null;
}

