const std = @import("std");

pub const ChurnRisk = struct {
    file_path: []const u8,
    complexity: f32,
    churn_count: u32,
    risk_score: f32,
};

// Calculates a bug risk score based on cognitive complexity and git churn
// Formula: Risk = (Complexity * 0.4) + (Churn * 0.6) + (Complexity * Churn * 0.1)
pub fn calculateGitChurnRisk(
    allocator: std.mem.Allocator,
    file_paths: [][]const u8,
    complexities: []const f32,
    churn_counts: []const u32,
) ![]ChurnRisk {
    var risks = std.ArrayList(ChurnRisk).empty;
    errdefer risks.deinit(allocator);

    const count = @min(file_paths.len, @min(complexities.len, churn_counts.len));

    var i: usize = 0;
    while (i < count) : (i += 1) {
        const c = complexities[i];
        const churn = @as(f32, @floatFromInt(churn_counts[i]));
        
        // Non-linear risk scaling: high complexity AND high churn is exponential risk
        const base_risk = (c * 0.4) + (churn * 0.6);
        const synergistic_risk = (c * churn * 0.1);
        const total_risk = base_risk + synergistic_risk;

        try risks.append(allocator, .{
            .file_path = try allocator.dupe(u8, file_paths[i]),
            .complexity = c,
            .churn_count = churn_counts[i],
            .risk_score = total_risk,
        });
    }

    // Sort by highest risk score first
    std.mem.sort(ChurnRisk, risks.items, {}, struct {
        fn lessThan(_: void, a: ChurnRisk, b: ChurnRisk) bool {
            return a.risk_score > b.risk_score;
        }
    }.lessThan);

    return try risks.toOwnedSlice(allocator);
}
