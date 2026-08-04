const std = @import("std");
const builtin = @import("builtin");

/// Binds the current thread to a specific CPU core to preserve L1/L2 Cache warmth.
/// This prevents OS thread schedulers from constantly shifting heavy Inference threads 
/// across cores, which ruins Matrix Multiplication (MatMul) speed.
pub fn pinCurrentThreadToCore(core_id: usize) !void {
    if (builtin.os.tag == .windows) {
        const windows = std.os.windows;
        
        // Ensure kernel32 is linked and SetThreadAffinityMask is available
        const kernel32 = std.DynLib.open("kernel32.dll") catch return error.Kernel32NotFound;
        const setAffinity = kernel32.lookup(
            *const fn (windows.HANDLE, usize) callconv(windows.WINAPI) usize,
            "SetThreadAffinityMask"
        ) orelse return error.AffinityFunctionNotFound;
        
        const current_thread = windows.kernel32.GetCurrentThread();
        
        // Core Mask is a bitmask (1 << core_id)
        const mask: usize = @as(usize, 1) << @as(std.math.Log2Int(usize), @intCast(core_id));
        
        const result = setAffinity(current_thread, mask);
        if (result == 0) {
            return error.SetAffinityFailed;
        }
        
        std.log.info("🔥 [Thread Affinity] Pinned thread to CPU Core {d}", .{core_id});
    } else if (builtin.os.tag == .linux) {
        // Fallback for Linux (sched_setaffinity)
        // Note: For full cross-platform this would use libc's sched_setaffinity.
        std.log.info("🔥 [Thread Affinity] Pinning not yet implemented for Linux", .{});
    } else {
        std.log.info("🔥 [Thread Affinity] Pinning not supported on this OS", .{});
    }
}
