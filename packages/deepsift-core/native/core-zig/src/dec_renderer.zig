const std = @import("std");

// Simple native 5x8 bitmap font renderer for visual tokens
pub fn renderTextBitmapNative(allocator: std.mem.Allocator, text: []const u8, width: u32, height: u32) ![]u8 {
    const total_bytes = width * height;
    var pixels = try allocator.alloc(u8, total_bytes);
    @memset(pixels, 0);

    var x: u32 = 0;
    var y: u32 = 0;

    for (text) |c| {
        if (c == '\n') {
            x = 0;
            y += 8;
            if (y >= height) break;
            continue;
        }

        // Draw character bounds
        if (x + 5 < width and y + 8 < height) {
            for (0..8) |cy| {
                for (0..5) |cx| {
                    const px = x + @as(u32, @intCast(cx));
                    const py = y + @as(u32, @intCast(cy));
                    const idx = py * width + px;
                    if (c != ' ') {
                        pixels[idx] = 255; // White pixel for text
                    }
                }
            }
        }

        x += 6;
        if (x >= width) {
            x = 0;
            y += 8;
            if (y >= height) break;
        }
    }

    return pixels;
}
