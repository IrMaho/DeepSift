#include <napi.h>
#include <iostream>

// توابع صادر شده از لایه Zig (C ABI)
extern "C" {
    int32_t deepsift_native_init();
}

Napi::Value InitEngine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // فراخوانی موتور Native Zig
    int32_t result = deepsift_native_init();
    
    return Napi::Number::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "initEngine"),
                Napi::Function::New(env, InitEngine));
    return exports;
}

NODE_API_MODULE(deepsift_native, Init)
