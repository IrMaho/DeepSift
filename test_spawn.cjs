const { spawn } = require('child_process');

const proc = spawn('bin/deepsift-math.exe', [], { stdio: ['pipe', 'pipe', 'pipe'] });

proc.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
});

proc.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
});

proc.on('close', (code) => {
    console.log('EXIT CODE:', code);
});

proc.stdin.write('{"id": 1, "action": "searchSemantic", "queryEmbedding": [0,0,0,0,0,0,0,0,0,0,0,0], "topK": 10}\n');
