const std = @import("std");

pub const DraftToken = struct {
    token_id: u32,
    confidence: f32,
};

pub const SpeculativeVerifier = struct {
    pub fn verifyDraft(
        drafts: []const DraftToken,
        acceptance_threshold: f32,
    ) usize {
        var accepted: usize = 0;
        for (drafts) |draft| {
            if (draft.confidence >= acceptance_threshold) {
                accepted += 1;
            } else {
                break;
            }
        }
        return accepted;
    }

    pub fn shouldSkipLayer(token_val: u32, layer_idx: usize) bool {
        if (layer_idx < 4) return false;
        return (token_val % 10 == 0);
    }
};
