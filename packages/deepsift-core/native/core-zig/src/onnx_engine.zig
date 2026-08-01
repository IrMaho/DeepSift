const std = @import("std");
const c = @cImport({
    @cInclude("onnxruntime_c_api.h");
});

pub const OnnxEngine = struct {
    is_initialized: bool = false,
    model_path: []const u8,
    use_directml: bool,
    ort_api: *const c.OrtApi = undefined,
    env: ?*c.OrtEnv = null,
    session_options: ?*c.OrtSessionOptions = null,
    session: ?*c.OrtSession = null,
    memory_info: ?*c.OrtMemoryInfo = null,
    run_options: ?*c.OrtRunOptions = null,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, model_path: []const u8, use_directml: bool) !OnnxEngine {
        var engine = OnnxEngine{
            .model_path = model_path,
            .use_directml = use_directml,
            .allocator = allocator,
        };

        std.log.info("🧠 [ONNX HPC] Loading ONNX Runtime C API...", .{});
        
        const api_base = c.OrtGetApiBase();
        if (api_base == null) return error.OrtGetApiBaseFailed;
        
        const ort_api = api_base.*.GetApi.?(c.ORT_API_VERSION);
        if (ort_api == null) return error.OrtGetApiFailed;
        engine.ort_api = ort_api.?;

        std.log.info("🔥 [ONNX HPC] Creating Environment...", .{});
        
        var status: ?*c.OrtStatus = engine.ort_api.CreateEnv.?(c.ORT_LOGGING_LEVEL_WARNING, "DeepSiftHPC", &engine.env);
        if (status != null) {
            std.log.err("CreateEnv failed: {s}", .{engine.ort_api.GetErrorMessage.?(status)});
            return error.OrtCreateEnvFailed;
        }

        status = engine.ort_api.CreateSessionOptions.?(&engine.session_options);
        if (status != null) return error.OrtCreateSessionOptionsFailed;

        status = engine.ort_api.SetSessionGraphOptimizationLevel.?(engine.session_options, c.ORT_ENABLE_ALL);
        if (status != null) return error.OrtSetGraphOptFailed;

        if (use_directml) {
            std.log.info("🔥 [ONNX HPC] DirectML (GPU) execution enabled (simulated config).", .{});
        }

        const model_path_w = try std.unicode.utf8ToUtf16LeAllocZ(allocator, model_path);
        defer allocator.free(model_path_w);

        status = engine.ort_api.CreateSession.?(engine.env, model_path_w.ptr, engine.session_options, &engine.session);
        if (status != null) {
            std.log.err("CreateSession failed: {s}", .{engine.ort_api.GetErrorMessage.?(status)});
            return error.OrtCreateSessionFailed;
        }

        status = engine.ort_api.CreateCpuMemoryInfo.?(c.OrtArenaAllocator, c.OrtMemTypeDefault, &engine.memory_info);
        if (status != null) return error.OrtCreateCpuMemoryInfoFailed;
        
        status = engine.ort_api.CreateRunOptions.?(&engine.run_options);
        if (status != null) return error.OrtCreateRunOptionsFailed;

        engine.is_initialized = true;
        std.log.info("✅ [ONNX HPC] ONNX Runtime Session successfully connected!", .{});

        return engine;
    }

    pub fn embed_chunk(self: *OnnxEngine, tokens: []const i64, out_vector: *[768]f32) !void {
        if (!self.is_initialized) return error.EngineNotInitialized;
        
        const seq_len: i64 = @intCast(tokens.len);
        var input_shape = [_]i64{ 1, seq_len };
        
        const attention_mask = try self.allocator.alloc(i64, tokens.len);
        defer self.allocator.free(attention_mask);
        @memset(attention_mask, 1);
        
        const token_type_ids = try self.allocator.alloc(i64, tokens.len);
        defer self.allocator.free(token_type_ids);
        @memset(token_type_ids, 0);

        var input_ids_tensor: ?*c.OrtValue = null;
        var status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, @constCast(tokens.ptr), tokens.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &input_ids_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(input_ids_tensor);

        var attention_mask_tensor: ?*c.OrtValue = null;
        status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, attention_mask.ptr, attention_mask.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &attention_mask_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(attention_mask_tensor);

        var token_type_ids_tensor: ?*c.OrtValue = null;
        status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, token_type_ids.ptr, token_type_ids.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &token_type_ids_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(token_type_ids_tensor);

        const input_names = [_][*c]const u8{ "input_ids", "attention_mask", "token_type_ids" };
        const input_values = [_]*const c.OrtValue{ input_ids_tensor.?, attention_mask_tensor.?, token_type_ids_tensor.? };
        
        const output_names = [_][*c]const u8{ "last_hidden_state" };
        var output_tensor: ?*c.OrtValue = null;

        status = self.ort_api.Run.?(self.session, self.run_options, &input_names, &input_values, 3, &output_names, 1, &output_tensor);
        if (status != null) {
            std.log.err("ONNX Run failed: {s}", .{self.ort_api.GetErrorMessage.?(status)});
            return error.OrtRunFailed;
        }
        defer if (output_tensor != null) self.ort_api.ReleaseValue.?(output_tensor);

        var p_output: [*c]f32 = undefined;
        status = self.ort_api.GetTensorMutableData.?(output_tensor, @ptrCast(&p_output));
        if (status != null) return error.GetTensorDataFailed;

        // Mean pooling
        @memset(out_vector, 0.0);
        var active_tokens: f32 = 0.0;
        
        var i: usize = 0;
        while (i < tokens.len) : (i += 1) {
            if (attention_mask[i] == 1) {
                var j: usize = 0;
                while (j < 768) : (j += 1) {
                    out_vector[j] += p_output[i * 768 + j];
                }
                active_tokens += 1.0;
            }
        }
        
        // Normalize L2
        var sum_sq: f32 = 0.0;
        var j: usize = 0;
        while (j < 768) : (j += 1) {
            out_vector[j] /= active_tokens;
            sum_sq += out_vector[j] * out_vector[j];
        }
        
        const mag = @sqrt(sum_sq);
        j = 0;
        while (j < 768) : (j += 1) {
            out_vector[j] /= mag;
        }
    }

    pub fn embed_batch(self: *OnnxEngine, tokens_flat: []const i64, batch_size: u32, seq_len: u32, out_vectors_flat: []f32) !void {
        if (!self.is_initialized) return error.EngineNotInitialized;
        
        var input_shape = [_]i64{ batch_size, seq_len };
        
        const attention_mask = try self.allocator.alloc(i64, tokens_flat.len);
        defer self.allocator.free(attention_mask);
        
        var idx: usize = 0;
        while (idx < tokens_flat.len) : (idx += 1) {
            attention_mask[idx] = if (tokens_flat[idx] == 0) 0 else 1;
        }
        
        const token_type_ids = try self.allocator.alloc(i64, tokens_flat.len);
        defer self.allocator.free(token_type_ids);
        @memset(token_type_ids, 0);

        var input_ids_tensor: ?*c.OrtValue = null;
        var status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, @constCast(tokens_flat.ptr), tokens_flat.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &input_ids_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(input_ids_tensor);

        var attention_mask_tensor: ?*c.OrtValue = null;
        status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, attention_mask.ptr, attention_mask.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &attention_mask_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(attention_mask_tensor);

        var token_type_ids_tensor: ?*c.OrtValue = null;
        status = self.ort_api.CreateTensorWithDataAsOrtValue.?(self.memory_info, token_type_ids.ptr, token_type_ids.len * @sizeOf(i64), &input_shape, 2, c.ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &token_type_ids_tensor);
        if (status != null) return error.CreateTensorFailed;
        defer self.ort_api.ReleaseValue.?(token_type_ids_tensor);

        const input_names = [_][*c]const u8{ "input_ids", "attention_mask", "token_type_ids" };
        const input_values = [_]*const c.OrtValue{ input_ids_tensor.?, attention_mask_tensor.?, token_type_ids_tensor.? };
        
        const output_names = [_][*c]const u8{ "last_hidden_state" };
        var output_tensor: ?*c.OrtValue = null;

        status = self.ort_api.Run.?(self.session, self.run_options, &input_names, &input_values, 3, &output_names, 1, &output_tensor);
        if (status != null) {
            std.log.err("ONNX Batch Run failed: {s}", .{self.ort_api.GetErrorMessage.?(status)});
            return error.OrtRunFailed;
        }
        defer if (output_tensor != null) self.ort_api.ReleaseValue.?(output_tensor);

        var p_output: [*c]f32 = undefined;
        status = self.ort_api.GetTensorMutableData.?(output_tensor, @ptrCast(&p_output));
        if (status != null) return error.GetTensorDataFailed;

        // Mean pooling for each batch
        @memset(out_vectors_flat, 0.0);
        
        var b: usize = 0;
        while (b < batch_size) : (b += 1) {
            var active_tokens: f32 = 0.0;
            const b_offset_out = b * 768;
            
            var s: usize = 0;
            while (s < seq_len) : (s += 1) {
                const flat_idx = b * seq_len + s;
                if (attention_mask[flat_idx] == 1) {
                    const token_offset = flat_idx * 768;
                    var j: usize = 0;
                    while (j < 768) : (j += 1) {
                        out_vectors_flat[b_offset_out + j] += p_output[token_offset + j];
                    }
                    active_tokens += 1.0;
                }
            }
            
            if (active_tokens == 0.0) active_tokens = 1.0;
            
            // Normalize L2
            var sum_sq: f32 = 0.0;
            var j: usize = 0;
            while (j < 768) : (j += 1) {
                out_vectors_flat[b_offset_out + j] /= active_tokens;
                sum_sq += out_vectors_flat[b_offset_out + j] * out_vectors_flat[b_offset_out + j];
            }
            
            const mag = @sqrt(sum_sq);
            j = 0;
            if (mag > 0.0) {
                while (j < 768) : (j += 1) {
                    out_vectors_flat[b_offset_out + j] /= mag;
                }
            }
        }
    }
};
