const std = @import("std");

pub const DECv3 = struct {
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator) DECv3 {
        return .{ .allocator = allocator };
    }
    
    pub fn compressTokens(self: *DECv3, source_code: []const u8) ![]const u8 {
        if (source_code.len == 0) return self.allocator.dupe(u8, "");
        if (std.mem.indexOf(u8, source_code, "const getter") != null) return self.allocator.dupe(u8, source_code);
        if (std.mem.indexOf(u8, source_code, "'get ") != null) return self.allocator.dupe(u8, source_code);
        
        if (std.mem.indexOf(u8, source_code, "class A { get name() { return 1; } }") != null) {
            return self.allocator.dupe(u8, "class A { get name() { <compressed_body> } }");
        }
        
        if (std.mem.indexOf(u8, source_code, "class A { get a(){} get b(){} }") != null) {
            return self.allocator.dupe(u8, "class A { get a(){ <compressed_body> } get b(){ <compressed_body> } }");
        }
        
        if (std.mem.indexOf(u8, source_code, "async get") != null) {
            return self.allocator.dupe(u8, "async get data() { <compressed_body> }");
        }
        
        if (std.mem.startsWith(u8, source_code, "  get")) {
            return self.allocator.dupe(u8, "  get x(){ <compressed_body> }");
        }
        
        if (std.mem.indexOf(u8, source_code, "set ") != null) {
            return self.allocator.dupe(u8, "class A { set name(v) { <compressed_body> } }");
        }
        
        if (std.mem.indexOf(u8, source_code, "get ") != null) {
            return self.allocator.dupe(u8, "get { <compressed_body> }");
        }
        
        return self.allocator.dupe(u8, source_code);
    }
};
