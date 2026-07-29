const std = @import("std");

pub const CallLink = struct {
    caller: []const u8,
    callee: []const u8,
    line: u32,
    kind: []const u8,
};

// Advanced Calltree engine integrating Context-Aware Class Expansion & State Mutation
pub fn analyzeCallTreeNative(allocator: std.mem.Allocator, content: []const u8, target_symbol: []const u8) ![]CallLink {
    var links = std.ArrayList(CallLink).empty;
    defer links.deinit(allocator);

    var current_function: []const u8 = "global";
    var line_num: u32 = 1;
    var line_it = std.mem.splitScalar(u8, content, '\n');
    
    // Feature 1: Context-Aware Tracking (OOP Classes)
    var instance_names = std.ArrayList([]const u8).empty;
    defer instance_names.deinit(allocator);
    
    // State Mutation Lineage Tracker
    const is_state_store = std.mem.indexOf(u8, target_symbol, "use") != null and std.mem.indexOf(u8, target_symbol, "Store") != null;

    while (line_it.next()) |line| {
        defer line_num += 1;
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Scope Tracker
        if (std.mem.indexOf(u8, trimmed, "function ") != null or std.mem.indexOf(u8, trimmed, "class ") != null) {
            var tokens = std.mem.tokenizeAny(u8, trimmed, " \t(){}:");
            while (tokens.next()) |token| {
                if (std.mem.eql(u8, token, "function") or std.mem.eql(u8, token, "class")) {
                    if (tokens.next()) |name| {
                        current_function = try allocator.dupe(u8, name);
                    }
                }
            }
        }

        // Feature 1: Detect OOP Class Instantiation (e.g. const srv = new ColorService())
        if (std.mem.indexOf(u8, trimmed, "new ") != null and std.mem.indexOf(u8, trimmed, target_symbol) != null) {
            // Very basic heuristic for JS/TS: const [name] = new [Target]
            var tokens = std.mem.tokenizeAny(u8, trimmed, " \t=:");
            var maybe_var: ?[]const u8 = null;
            while (tokens.next()) |token| {
                if (std.mem.eql(u8, token, "const") or std.mem.eql(u8, token, "let") or std.mem.eql(u8, token, "var")) {
                    if (tokens.next()) |v| {
                        maybe_var = v;
                    }
                }
            }
            if (maybe_var) |v| {
                try instance_names.append(allocator, try allocator.dupe(u8, v));
            }
        }

        var is_direct_match = std.mem.indexOf(u8, trimmed, target_symbol) != null;
        var kind: []const u8 = "call";
        
        // Feature 1: Check if an instance method is called
        if (!is_direct_match) {
            for (instance_names.items) |inst| {
                if (std.mem.indexOf(u8, trimmed, inst) != null and std.mem.indexOf(u8, trimmed, ".") != null) {
                    is_direct_match = true;
                    kind = "oop_method_call";
                    break;
                }
            }
        }
        
        // Feature 2: State Mutation Lineage
        if (is_state_store and is_direct_match) {
            // In Zustand/Redux, mutators often pass arguments or use set/dispatch
            if (std.mem.indexOf(u8, trimmed, "set(") != null or std.mem.indexOf(u8, trimmed, "dispatch(") != null or std.mem.indexOf(u8, trimmed, "=> state.") != null) {
                 kind = "[Mutator]";
            } else {
                 kind = "[Selector]";
            }
        } else if (std.mem.indexOf(u8, trimmed, "postMessage") != null or std.mem.indexOf(u8, trimmed, "onmessage") != null) {
            kind = "event_message";
        }

        if (is_direct_match) {
            try links.append(allocator, .{
                .caller = try allocator.dupe(u8, current_function),
                .callee = try allocator.dupe(u8, target_symbol),
                .line = line_num,
                .kind = kind,
            });
        }
    }

    const result = try allocator.alloc(CallLink, links.items.len);
    for (links.items, 0..) |itm, i| {
        result[i] = itm;
    }
    return result;
}
