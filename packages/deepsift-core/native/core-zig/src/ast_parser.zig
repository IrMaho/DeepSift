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
    merkle_hash: []const u8,
    is_state_mutator: bool,
};

pub const CalltreeResult = struct {
    file_path: []const u8,
    line: u32,
    snippet: []const u8,
    role: []const u8,
};

const BlockType = enum {
    import,
    function,
    class,
    constant,
    unknown,
};

pub fn parseNative(allocator: std.mem.Allocator, content: []const u8, file_path: []const u8, language: []const u8) ![]ParsedChunk {
    if (!std.mem.eql(u8, language, "ts") and !std.mem.eql(u8, language, "tsx") and !std.mem.eql(u8, language, "js") and !std.mem.eql(u8, language, "jsx") and !std.mem.eql(u8, language, "typescript") and !std.mem.eql(u8, language, "javascript")) {
        return parseRawChunks(allocator, content, file_path, language);
    }
    const ast_treesitter = @import("ast_treesitter.zig");
    const chunks = try ast_treesitter.parseWithTreeSitter(allocator, content, file_path, language);
    if (chunks.len == 0) {
        return parseRawChunks(allocator, content, file_path, language);
    }
    return chunks;
}

fn parseRawChunks(allocator: std.mem.Allocator, content: []const u8, file_path: []const u8, language: []const u8) ![]ParsedChunk {
    var chunks = std.ArrayList(ParsedChunk).empty;
    defer chunks.deinit(allocator);

    var lines = std.ArrayList([]const u8).empty;
    defer lines.deinit(allocator);

    var it = std.mem.splitSequence(u8, content, "\n");
    while (it.next()) |line| {
        try lines.append(allocator, line);
    }

    if (lines.items.len == 0) return try chunks.toOwnedSlice(allocator);

    const chunk_size: usize = 50;
    const overlap: usize = 10;
    
    var i: usize = 0;
    while (i < lines.items.len) {
        const end = @min(i + chunk_size, lines.items.len);
        
        var chunk_content = std.ArrayList(u8).empty;
        defer chunk_content.deinit(allocator);
        for (lines.items[i..end]) |l| {
            try chunk_content.appendSlice(allocator, l);
            try chunk_content.appendSlice(allocator, "\n");
        }
        
        const chunk_text = try chunk_content.toOwnedSlice(allocator);
        
        const hash = std.hash.Wyhash.hash(0, chunk_text);
        const hash_str = try std.fmt.allocPrint(allocator, "{x}", .{hash});
        
        const basename = std.fs.path.basename(file_path);
        const id = try std.fmt.allocPrint(allocator, "{s}_{d}", .{basename, i + 1});

        try chunks.append(allocator, .{
            .id = id,
            .file_path = try allocator.dupe(u8, file_path),
            .content = chunk_text,
            .start_line = @intCast(i + 1),
            .end_line = @intCast(end),
            .type = "text",
            .family = "raw",
            .language = try allocator.dupe(u8, language),
            .merkle_hash = hash_str,
            .is_state_mutator = false,
        });
        
        if (i + chunk_size >= lines.items.len) break;
        i += chunk_size - overlap;
    }

    return try chunks.toOwnedSlice(allocator);
}

const BulkWorkerContext = struct {
    allocator: std.mem.Allocator,
    io: std.Io,
    file_paths: [][]const u8,
    results: std.ArrayList(ParsedChunk),
    mutex: *std.Io.Mutex,
};

fn parseBulkWorker(ctx: *BulkWorkerContext) void {
    for (ctx.file_paths) |file_path| {
        const file = std.Io.Dir.cwd().openFile(ctx.io, file_path, .{}) catch continue;
        defer file.close(ctx.io);
        
        const stat = file.stat(ctx.io) catch continue;
        if (stat.size > 5 * 1024 * 1024) continue; // Skip files > 5MB
        
        var temp_arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
        defer temp_arena.deinit();
        const temp_allocator = temp_arena.allocator();
        
        const in_buf = temp_allocator.alloc(u8, 65536) catch continue;
        var file_reader = file.reader(ctx.io, in_buf);
        
        const content = file_reader.interface.readAlloc(temp_allocator, stat.size) catch continue;
        
        var ext: []const u8 = "text";
        if (std.mem.lastIndexOf(u8, file_path, ".")) |ext_idx| {
            ext = file_path[ext_idx + 1..];
        }
        
        const chunks = parseNative(temp_allocator, content, file_path, ext) catch continue;
        
        ctx.mutex.lockUncancelable(ctx.io);
        defer ctx.mutex.unlock(ctx.io);
        for (chunks) |chunk| {
            var duplicated_chunk = chunk;
            duplicated_chunk.id = ctx.allocator.dupe(u8, chunk.id) catch continue;
            duplicated_chunk.file_path = ctx.allocator.dupe(u8, chunk.file_path) catch continue;
            duplicated_chunk.content = ctx.allocator.dupe(u8, chunk.content) catch continue;
            duplicated_chunk.language = ctx.allocator.dupe(u8, chunk.language) catch continue;
            duplicated_chunk.merkle_hash = ctx.allocator.dupe(u8, chunk.merkle_hash) catch continue;
            duplicated_chunk.is_state_mutator = chunk.is_state_mutator;
            ctx.results.append(ctx.allocator, duplicated_chunk) catch {};
        }
    }
}

pub fn extractChunksBulkNative(allocator: std.mem.Allocator, file_paths: [][]const u8, io: std.Io) ![]ParsedChunk {
    // CPU cores (default to 4 if we can't detect)
    const cpu_count = std.Thread.getCpuCount() catch 4;
    const threads_count = @max(1, cpu_count);
    const chunk_size = (file_paths.len + threads_count - 1) / threads_count;
    
    var threads = std.ArrayList(std.Thread).empty;
    defer threads.deinit(allocator);
    
    var contexts = std.ArrayList(*BulkWorkerContext).empty;
    defer {
        for (contexts.items) |ctx| {
            ctx.results.deinit(allocator);
            allocator.destroy(ctx);
        }
        contexts.deinit(allocator);
    }
    
    const shared_mutex = try allocator.create(std.Io.Mutex);
    shared_mutex.* = std.Io.Mutex.init;
    defer allocator.destroy(shared_mutex);
    
    var i: usize = 0;
    while (i < file_paths.len) : (i += chunk_size) {
        const end = @min(i + chunk_size, file_paths.len);
        const slice = file_paths[i..end];
        
        const ctx = try allocator.create(BulkWorkerContext);
        ctx.* = BulkWorkerContext{
            .allocator = allocator,
            .io = io,
            .file_paths = slice,
            .results = std.ArrayList(ParsedChunk).empty,
            .mutex = shared_mutex,
        };
        
        const thread = std.Thread.spawn(.{}, parseBulkWorker, .{ctx}) catch continue;
        threads.append(allocator, thread) catch {};
        contexts.append(allocator, ctx) catch {};
    }
    
    for (threads.items) |thread| {
        thread.join();
    }
    
    var final_results = std.ArrayList(ParsedChunk).empty;
    for (contexts.items) |ctx| {
        try final_results.appendSlice(allocator, ctx.results.items);
    }
    
    return try final_results.toOwnedSlice(allocator);
}

const CalltreeWorkerContext = struct {
    allocator: std.mem.Allocator,
    io: std.Io,
    file_paths: [][]const u8,
    symbol: []const u8,
    results: std.ArrayList(CalltreeResult),
    mutex: *std.Io.Mutex,
};

fn calltreeBulkWorker(ctx: *CalltreeWorkerContext) void {
    const ast_treesitter = @import("ast_treesitter.zig");
    for (ctx.file_paths) |file_path| {
        const file = std.Io.Dir.cwd().openFile(ctx.io, file_path, .{}) catch continue;
        defer file.close(ctx.io);
        
        const stat = file.stat(ctx.io) catch continue;
        if (stat.size > 5 * 1024 * 1024) continue;
        
        var temp_arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
        defer temp_arena.deinit();
        const temp_allocator = temp_arena.allocator();
        
        const in_buf = temp_allocator.alloc(u8, 65536) catch continue;
        var file_reader = file.reader(ctx.io, in_buf);
        const content = file_reader.interface.readAlloc(temp_allocator, stat.size) catch continue;
        
        if (std.mem.indexOf(u8, content, ctx.symbol) == null) continue;
        
        var ext: []const u8 = "text";
        if (std.mem.lastIndexOf(u8, file_path, ".")) |ext_idx| {
            ext = file_path[ext_idx + 1..];
        }
        
        const tree_results = ast_treesitter.extractCalltreeWithTreeSitter(temp_allocator, content, file_path, ext, ctx.symbol) catch continue;
        
        ctx.mutex.lockUncancelable(ctx.io);
        defer ctx.mutex.unlock(ctx.io);
        for (tree_results) |tr| {
            var duplicated = tr;
            duplicated.file_path = ctx.allocator.dupe(u8, tr.file_path) catch continue;
            duplicated.snippet = ctx.allocator.dupe(u8, tr.snippet) catch continue;
            duplicated.role = ctx.allocator.dupe(u8, tr.role) catch continue;
            ctx.results.append(ctx.allocator, duplicated) catch {};
        }
    }
}

pub fn extractCalltreeBulkNative(allocator: std.mem.Allocator, file_paths: [][]const u8, symbol: []const u8, io: std.Io) ![]CalltreeResult {
    const cpu_count = std.Thread.getCpuCount() catch 4;
    const threads_count = @max(1, cpu_count);
    const chunk_size = (file_paths.len + threads_count - 1) / threads_count;
    
    var threads = std.ArrayList(std.Thread).empty;
    defer threads.deinit(allocator);
    
    var contexts = std.ArrayList(*CalltreeWorkerContext).empty;
    defer {
        for (contexts.items) |ctx| {
            ctx.results.deinit(allocator);
            allocator.destroy(ctx);
        }
        contexts.deinit(allocator);
    }
    
    const shared_mutex = try allocator.create(std.Io.Mutex);
    shared_mutex.* = std.Io.Mutex.init;
    defer allocator.destroy(shared_mutex);
    
    var i: usize = 0;
    while (i < file_paths.len) : (i += chunk_size) {
        const end = @min(i + chunk_size, file_paths.len);
        const slice = file_paths[i..end];
        
        const ctx = try allocator.create(CalltreeWorkerContext);
        ctx.* = CalltreeWorkerContext{
            .allocator = allocator,
            .io = io,
            .file_paths = slice,
            .symbol = symbol,
            .results = std.ArrayList(CalltreeResult).empty,
            .mutex = shared_mutex,
        };
        
        const thread = std.Thread.spawn(.{}, calltreeBulkWorker, .{ctx}) catch continue;
        threads.append(allocator, thread) catch {};
        contexts.append(allocator, ctx) catch {};
    }
    
    for (threads.items) |thread| {
        thread.join();
    }
    
    var final_results = std.ArrayList(CalltreeResult).empty;
    for (contexts.items) |ctx| {
        try final_results.appendSlice(allocator, ctx.results.items);
    }
    
    return try final_results.toOwnedSlice(allocator);
}