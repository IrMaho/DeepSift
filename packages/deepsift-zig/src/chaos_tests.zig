const std = @import("std");
const Graph = @import("graph.zig").Graph;
const VirtualRouter = @import("virtual_router.zig").VirtualRouter;
const FFITracker = @import("ffi_tracker.zig").FFITracker;
const CleanArchLinter = @import("clean_arch_linter.zig").CleanArchLinter;
const LeakWatchdog = @import("leak_watchdog.zig").LeakWatchdog;
const StateMutationChecker = @import("state_mutation.zig").StateMutationChecker;
const ChaosChecker = @import("chaos_check.zig").ChaosChecker;
const CloneDetector = @import("clone_detect.zig").CloneDetector;
const CostEstimator = @import("refactor_cost.zig").CostEstimator;
const RefactorCost = @import("refactor_cost.zig").RefactorCost;
const TPRReporter = @import("tpr_reporter.zig").TPRReporter;
const LiveArchExporter = @import("live_arch.zig").LiveArchExporter;
const ModuleImpactSimulator = @import("module_impact.zig").ModuleImpactSimulator;
const AutoHealMachine = @import("auto_heal.zig").AutoHealMachine;
const HealStrategy = @import("auto_heal.zig").HealStrategy;
const ContextPrefetcher = @import("context_prefetch.zig").ContextPrefetcher;

// --- GRAPH MODULE BUGS ---
test "Bug 1: Isolated Cycle is dead" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("A", "B", false);
    try graph.addEdge("B", "A", false); // cycle
    const a = try graph.addNode("A");
    
    // A is not connected to any entry point, so it SHOULD be dead code.
    try std.testing.expect(graph.isDead(a) == true);
}

test "Bug 2: Self-loop is dead" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("X", "X", false);
    const x = try graph.addNode("X");
    try std.testing.expect(graph.isDead(x) == true);
}

test "Bug 3: Duplicate edges not deduplicated" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("1", "2", false);
    try graph.addEdge("1", "2", false);
    try std.testing.expectEqual(@as(usize, 1), graph.edges.items.len);
}

test "Bug 4: isDead out of bounds" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    // Asking for a node ID that doesn't exist should ideally fail or be handled, 
    // but the current code just returns true. We want to ensure it handles it safely.
    try std.testing.expect(graph.isDead(9999) == true); 
}

// --- VIRTUAL ROUTER BUGS ---
test "Bug 5: Virtual router in string literal" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    var vr = VirtualRouter.init(&graph);
    
    const code = "const x = \"createBrowserRouter\";";
    try vr.inferRoutes(code, "test.ts");
    try std.testing.expectEqual(@as(usize, 0), graph.edges.items.len);
}

test "Bug 6: Virtual router in comment" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    var vr = VirtualRouter.init(&graph);
    try vr.inferRoutes("// <Route", "test.ts");
    try std.testing.expectEqual(@as(usize, 0), graph.edges.items.len);
}

test "Bug 7: Hardcoded route edges" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    var vr = VirtualRouter.init(&graph);
    try vr.inferRoutes("createBrowserRouter", "router.ts");
    // Should NOT just add App.tsx arbitrarily
    try std.testing.expect(graph.node_names.items.len == 0); 
}

// --- FFI TRACKER BUGS ---
test "Bug 8: Relative path normalization" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    var tracker = FFITracker.init(&graph);
    try tracker.linkCGO("src/main.go", "./lib.h");
    const h_id = try graph.addNode("src/lib.h"); // Should normalize to src/lib.h
    try std.testing.expect(graph.edges.items[0].to == h_id);
}

// --- CLEAN ARCH BUGS ---
test "Bug 9: Prefix matching for layers" {
    try std.testing.expect(!CleanArchLinter.checkImport("domain", "ui/components/Button"));
}

test "Bug 10: Infrastructure prefix matching" {
    try std.testing.expect(!CleanArchLinter.checkImport("domain", "infrastructure/db/postgres"));
}

// --- LEAK WATCHDOG BUGS ---
test "Bug 11: Mismatched event types" {
    const code = "window.addEventListener('scroll'); window.removeEventListener('resize');";
    try std.testing.expect(LeakWatchdog.scanReactFile(code) == true); // It IS a leak
}

test "Bug 12: Multiple adds single remove" {
    const code = "window.addEventListener('scroll'); window.addEventListener('scroll'); window.removeEventListener('scroll');";
    try std.testing.expect(LeakWatchdog.scanReactFile(code) == true);
}

test "Bug 13: Remove in comment" {
    const code = "window.addEventListener('scroll'); // window.removeEventListener('scroll');";
    try std.testing.expect(LeakWatchdog.scanReactFile(code) == true);
}

// --- STATE MUTATION BUGS ---
test "Bug 14: Substring state mutation" {
    const code = "const statement = 1;";
    try std.testing.expect(!StateMutationChecker.detectUnsafeZustandMutation(code));
}

test "Bug 15: Equality operator not mutation" {
    const code = "if (state.user == null) {}";
    try std.testing.expect(!StateMutationChecker.detectUnsafeZustandMutation(code));
}

// --- CHAOS CHECKER BUGS ---
test "Bug 16: db query in string" {
    const code = "console.log('Running db.Query');";
    try std.testing.expect(ChaosChecker.hasErrorHandling(code)); // No actual query
}

test "Bug 17: try block not wrapping query" {
    _ = "try { something() } catch {} ; db.Query();";
    // This is hard to do without AST, but a naive check would fail it.
    // Let's assume we want our checker to at least handle line-by-line or fail if try is far away.
    // For now, let's test if it handles comments.
    const code2 = "// try { \n db.Query(); \n // catch";
    try std.testing.expect(!ChaosChecker.hasErrorHandling(code2));
}

// --- CLONE DETECTOR BUGS ---
test "Bug 18: Ignore string literals in hash" {
    const code1 = "function A() { return 1; }";
    const code2 = "function A() { return '{'; }"; // different structural hash because of { in string?
    try std.testing.expect(CloneDetector.isFuzzyClone(code1, code2)); 
}

test "Bug 19: Ignore comments in hash" {
    const code1 = "function A() { }";
    const code2 = "function A() { // } \n }"; 
    try std.testing.expect(CloneDetector.isFuzzyClone(code1, code2));
}

// --- REFACTOR COST BUGS ---
test "Bug 20: Transitive dependencies" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("A", "B", false);
    try graph.addEdge("B", "Target", false);
    try graph.addEdge("C", "Target", false);
    
    var estimator = CostEstimator.init(&graph);
    const target = try graph.addNode("Target");
    // Target has 2 direct, 1 indirect. Total impact = 3.
    // 3 means .M cost (3...5)
    try std.testing.expectEqual(RefactorCost.M, estimator.estimate(target));
}

test "Bug 21: Self loops in refactor cost" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("Target", "Target", false);
    var estimator = CostEstimator.init(&graph);
    const target = try graph.addNode("Target");
    try std.testing.expectEqual(RefactorCost.S, estimator.estimate(target)); // Should be S, not counting self
}

// --- TPR REPORTER BUGS ---
test "Bug 22: Negative or zero inputs" {
    try std.testing.expectEqual(@as(f32, 1.0), TPRReporter.calculateRatio(0, 5));
}

// --- LIVE ARCH BUGS ---
test "Bug 23: JSON escaping" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    _ = try graph.addNode("file\"name.ts");
    var exporter = LiveArchExporter.init(std.testing.allocator);
    const json = try exporter.exportToReactFlow(&graph);
    defer std.testing.allocator.free(json);
    // Should contain escaped \"
    try std.testing.expect(std.mem.indexOf(u8, json, "file\\\"name.ts") != null);
}

// --- MODULE IMPACT BUGS ---
test "Bug 24: Variable name substring" {
    const code = "const my_useHistory_var = 1;";
    try std.testing.expectEqual(@as(u32, 0), ModuleImpactSimulator.predictBreakingChanges("react-router-dom", code));
}

test "Bug 25: useHistory in comment" {
    const code = "// import { useHistory }";
    try std.testing.expectEqual(@as(u32, 0), ModuleImpactSimulator.predictBreakingChanges("react-router-dom", code));
}

// --- AUTO HEAL BUGS ---
test "Bug 26: Infinite loop protection" {
    var machine = AutoHealMachine{};
    _ = machine.nextStrategy(1);
    _ = machine.nextStrategy(1);
    _ = machine.nextStrategy(1);
    const out_of_bounds = machine.nextStrategy(1); // 4th attempt
    try std.testing.expectEqual(HealStrategy.Failure, out_of_bounds); // Should cap at Failure
}

// --- CONTEXT PREFETCH BUGS ---
test "Bug 27: Prefetch out of bounds" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    var prefetch = ContextPrefetcher.init(&graph);
    var related: std.ArrayList(u32) = .empty;
    defer related.deinit(std.testing.allocator);
    
    // Node 999 doesn't exist
    prefetch.getRelatedInterfaces(999, &related, std.testing.allocator) catch |err| {
        try std.testing.expectEqual(error.NodeNotFound, err);
        return;
    };
    return error.ExpectedError; // Should have returned error.NodeNotFound
}

// --- GENERAL PARSING BUGS ---
test "Bug 28: Empty string processing DFG" {
    var dfg = @import("dfg.zig").DataFlowGraph.init(std.testing.allocator);
    defer dfg.deinit();
    const id = try dfg.trackVariable("", true);
    try std.testing.expect(id == 0);
}

test "Bug 29: Case insensitivity in Leak Watchdog" {
    const code = "window.ADDEVENTLISTENER('scroll');";
    // Since JS is case sensitive, this is NOT a valid listener, so it shouldn't flag
    try std.testing.expect(!LeakWatchdog.scanReactFile(code));
}

test "Bug 30: Deep cycle in graph isDead" {
    var graph = Graph.init(std.testing.allocator);
    defer graph.deinit();
    try graph.addEdge("A", "B", false);
    try graph.addEdge("B", "C", false);
    try graph.addEdge("C", "A", false);
    const b = try graph.addNode("B");
    try std.testing.expect(graph.isDead(b) == true);
}
