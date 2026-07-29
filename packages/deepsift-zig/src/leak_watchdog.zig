const std = @import("std");

pub const LeakWatchdog = struct {
    pub fn scanReactFile(source_code: []const u8) bool {
        // Fixes Bug 11, 12, 13, 29
        var add_count: u32 = 0;
        var remove_count: u32 = 0;
        
        var idx: usize = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "addEventListener('scroll')")) |pos| {
            idx = pos + 1;
            if (!isComment(source_code, pos)) add_count += 1;
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "removeEventListener('scroll')")) |pos| {
            idx = pos + 1;
            if (!isComment(source_code, pos)) remove_count += 1;
        }
        
        return add_count > remove_count;
    }
    
    fn isComment(code: []const u8, idx: usize) bool {
        var in_comment = false;
        for (code[0..idx], 0..) |c, i| {
            if (i > 0 and code[i-1] == '/' and c == '/') in_comment = true;
            if (c == '\n') in_comment = false;
        }
        return in_comment;
    }
};

test "leak watchdog patterns" {
    const safe_code = 
        \\ useEffect(() => {
        \\   window.addEventListener('resize', handle);
        \\   return () => window.removeEventListener('resize', handle);
        \\ }, []);
    ;
    try std.testing.expect(LeakWatchdog.scanReactFile(safe_code) == false);
}
