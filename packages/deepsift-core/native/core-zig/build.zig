const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // 1. HPC Engine Executable
    const exe = b.addExecutable(.{
        .name = "deepsift-math",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = target,
            .optimize = optimize,
            .link_libc = true,
        }),
    });

    // Tree-sitter core
    exe.root_module.addIncludePath(b.path("vendor/tree-sitter/lib/include"));
    exe.root_module.addIncludePath(b.path("vendor/tree-sitter/lib/src"));
    exe.root_module.addCSourceFile(.{
        .file = b.path("vendor/tree-sitter/lib/src/lib.c"),
        .flags = &[_][]const u8{ "-std=c11", "-O3" },
    });

    // Tree-sitter TypeScript
    exe.root_module.addIncludePath(b.path("vendor/tree-sitter-typescript/typescript/src"));
    exe.root_module.addCSourceFile(.{
        .file = b.path("vendor/tree-sitter-typescript/typescript/src/parser.c"),
        .flags = &[_][]const u8{ "-O3" },
    });
    exe.root_module.addCSourceFile(.{
        .file = b.path("vendor/tree-sitter-typescript/typescript/src/scanner.c"),
        .flags = &[_][]const u8{ "-O3" },
    });

    b.installArtifact(exe);
}
