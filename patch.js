const fs = require('fs');
const file = 'packages/deepsift-core/native/core-zig/src/search_engine.zig';
let code = fs.readFileSync(file, 'utf8');

const target =         if (isDefinitionChunk(chunk_content)) {\n            raw_score *= 1.3;\n        };
const replacement =         if (isDefinitionChunk(chunk_content)) {\n            raw_score *= 1.3;\n        }\n\n        const c_type = chunks[m.chunk_index].chunk_type;\n        if (std.mem.eql(u8, c_type, "function") or std.mem.eql(u8, c_type, "class") or std.mem.eql(u8, c_type, "interface") or std.mem.eql(u8, c_type, "type")) {\n            raw_score *= 1.5;\n        } else if (std.mem.eql(u8, c_type, "import")) {\n            raw_score *= 0.1;\n        };

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
console.log('Zig patch applied successfully!');