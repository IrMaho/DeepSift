const std = @import("std");

pub const HealStrategy = enum {
    LSPFix,
    AI_Rewrite,
    Rollback,
    Failure,
    Success,
};

pub const AutoHealMachine = struct {
    attempts: u32 = 0,
    max_retries: u32 = 3,
    current_strategy: HealStrategy = .LSPFix,
    history_len: u32 = 0,
    
    pub fn reset(self: *AutoHealMachine) void {
        self.attempts = 0;
    }
    
    pub fn forceStrategy(self: *AutoHealMachine, st: HealStrategy) void {
        self.current_strategy = st;
    }
    
    pub fn nextStrategy(self: *AutoHealMachine, error_code: u32) HealStrategy {
        if (error_code == 0) return .Success;
        if (error_code == 500) return .Rollback;
        
        if (self.attempts < std.math.maxInt(u32)) {
            self.attempts += 1;
        }
        
        if (self.max_retries == 0) return .Failure;
        if (self.attempts > self.max_retries) return .Failure;
        
        if (self.attempts == 1) return .LSPFix;
        if (self.attempts == 2) return .AI_Rewrite;
        return .Rollback;
    }
};
