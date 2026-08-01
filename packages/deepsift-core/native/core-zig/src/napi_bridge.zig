const std = @import("std");

// این فایل به عنوان پل ارتباطی بین C++ N-API و کدهای اصلی Zig عمل می‌کند.
// توابعی که اینجا با `export` تعریف می‌شوند، مستقیماً از C++ قابل فراخوانی هستند.

export fn deepsift_native_init() i32 {
    std.log.info("[Zig] Engine initialized successfully.", .{});
    return 1;
}

// در فاز دوم، توابع mmap و Hashing به اینجا اضافه می‌شوند...
