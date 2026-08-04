{
  "targets": [
    {
      "target_name": "deepsift_native",
      "sources": [ "native/napi/binding.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1 }
      },
      "libraries": [
        "<(module_root_dir)/native/core-zig/zig-out/lib/deepsift_engine.lib",
        "-lntdll.lib",
        "-lws2_32.lib",
        "-ladvapi32.lib",
        "-lbcrypt.lib",
        "-luserenv.lib"
      ]
    }
  ]
}
