const std = @import("std");

/// A Lock-Free Single-Producer Single-Consumer (SPSC) Ring Buffer.
/// Modeled after the LMAX Disruptor pattern for ultra-low latency IPC.
/// Size must be a power of 2 for fast modulo arithmetic using bitwise AND.
pub fn RingBuffer(comptime T: type) type {
    return struct {
        const Self = @This();
        
        buffer: []T,
        mask: usize,
        
        // Cache-line padding to prevent false sharing between producer and consumer cores.
        // Assuming 64-byte cache lines.
        head: std.atomic.Value(usize) align(64),
        tail: std.atomic.Value(usize) align(64),

        allocator: std.mem.Allocator,

        pub fn init(allocator: std.mem.Allocator, capacity: usize) !*Self {
            // Ensure capacity is a power of 2
            if (!std.math.isPowerOfTwo(capacity)) {
                return error.CapacityNotPowerOfTwo;
            }

            const self = try allocator.create(Self);
            self.* = .{
                .buffer = try allocator.alloc(T, capacity),
                .mask = capacity - 1,
                .head = std.atomic.Value(usize).init(0),
                .tail = std.atomic.Value(usize).init(0),
                .allocator = allocator,
            };
            return self;
        }

        pub fn deinit(self: *Self) void {
            self.allocator.free(self.buffer);
            self.allocator.destroy(self);
        }

        /// Pushes an item to the buffer without any locks.
        /// Returns true if successful, false if the buffer is full.
        pub fn push(self: *Self, item: T) bool {
            const current_head = self.head.load(.seq_cst);
            const current_tail = self.tail.load(.seq_cst);
            
            // Check if buffer is full
            if (current_head -% current_tail >= self.buffer.len) {
                return false;
            }

            const index = current_head & self.mask;
            self.buffer[index] = item;
            
            // Memory barrier ensures item is written before head is updated
            self.head.store(current_head +% 1, .seq_cst);
            return true;
        }

        /// Pops an item from the buffer without any locks.
        /// Returns the item if successful, or null if the buffer is empty.
        pub fn pop(self: *Self) ?T {
            const current_tail = self.tail.load(.seq_cst);
            const current_head = self.head.load(.seq_cst);

            // Check if buffer is empty
            if (current_tail == current_head) {
                return null;
            }

            const index = current_tail & self.mask;
            const item = self.buffer[index];
            
            // Memory barrier ensures item is read before tail is updated
            self.tail.store(current_tail +% 1, .seq_cst);
            return item;
        }
    };
}

test "RingBuffer SPSC Lock-Free" {
    const allocator = std.testing.allocator;
    const Queue = RingBuffer(u32);
    
    var queue = try Queue.init(allocator, 1024);
    defer queue.deinit();

    try std.testing.expect(queue.push(42) == true);
    try std.testing.expect(queue.push(100) == true);

    try std.testing.expect(queue.pop().? == 42);
    try std.testing.expect(queue.pop().? == 100);
    try std.testing.expect(queue.pop() == null);
}
