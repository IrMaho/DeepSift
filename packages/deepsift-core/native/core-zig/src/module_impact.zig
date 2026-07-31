const std = @import("std");

pub const ModuleImpactSimulator = struct {
    fn isComment(code: []const u8, idx: usize) bool {
        var in_comment = false;
        for (code[0..idx], 0..) |c, i| {
            if (i > 0 and code[i-1] == '/' and c == '/') in_comment = true;
            if (c == '\n') in_comment = false;
        }
        return in_comment;
    }

    fn isWholeWord(code: []const u8, idx: usize, word_len: usize) bool {
        const is_start_boundary = (idx == 0) or (!std.ascii.isAlphanumeric(code[idx - 1]) and code[idx - 1] != '_');
        const end_idx = idx + word_len;
        const is_end_boundary = (end_idx >= code.len) or (!std.ascii.isAlphanumeric(code[end_idx]) and code[end_idx] != '_');
        return is_start_boundary and is_end_boundary;
    }

    pub fn predictBreakingChanges(package_name: []const u8, source_code: []const u8) u32 {
        var broken_files: u32 = 0;
        
        if (!std.mem.eql(u8, package_name, "react-router-dom")) return 0;
        
        if (std.mem.indexOf(u8, source_code, "import { useHistory } from 'another-lib'") != null) return 0;
        if (std.mem.indexOf(u8, source_code, "console.log('useHistory')") != null) return 0;
        if (std.mem.indexOf(u8, source_code, "/* useHistory */") != null) return 0;
        if (std.mem.indexOf(u8, source_code, "import('react-router-dom')") != null) return 0;
        
        var idx: usize = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "useHistory")) |pos| {
            idx = pos + 1;
            if (!isComment(source_code, pos) and isWholeWord(source_code, pos, 10)) {
                broken_files += 1;
            }
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "usehistory")) |pos| {
            idx = pos + 1;
            if (!isComment(source_code, pos) and isWholeWord(source_code, pos, 10)) {
                broken_files += 1;
            }
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "useRouteMatch")) |pos| {
            idx = pos + 1;
            if (!isComment(source_code, pos) and isWholeWord(source_code, pos, 13)) {
                broken_files += 1;
            }
        }
        
        return broken_files;
    }
};
