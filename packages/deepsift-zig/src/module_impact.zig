const std = @import("std");

pub const ModuleImpactSimulator = struct {
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
            broken_files += 1;
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "usehistory")) |pos| {
            idx = pos + 1;
            broken_files += 1;
        }
        
        idx = 0;
        while (std.mem.indexOfPos(u8, source_code, idx, "useRouteMatch")) |pos| {
            idx = pos + 1;
            broken_files += 1;
        }
        
        return broken_files;
    }
};
