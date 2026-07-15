const cp = require('child_process');
const req = { action: 'saveMetadata', dbPath: 'c:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\test.db', metadata: { file_path: 'foo', file_hash: 'bar', last_indexed: 123, chunk_count: 5 } };
const res = cp.spawnSync('bin/deepsift-math.exe', [], { input: JSON.stringify(req), encoding: 'utf8' });
console.log('Status:', res.status);
console.log('Stdout:', res.stdout);
console.log('Stderr:', res.stderr);
