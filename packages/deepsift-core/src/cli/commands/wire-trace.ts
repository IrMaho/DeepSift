import { WireTracer } from '../../analyzers/wire-tracer.js';
import { printInfo, printSuccess } from '../cli-output.js';

export async function wireTraceCommand(projectPath: string, targetDir?: string, format = 'markdown') {
    const tracer = new WireTracer(projectPath);
    const result = tracer.analyze(targetDir);

    if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    console.log(`\n\x1b[36m⚡ DeepSift IPC & Event Wire Tracer\x1b[0m`);
    console.log(`========================================`);
    console.log(`Senders: ${result.sendersCount} | Receivers: ${result.receiversCount} | Matched Wire Connections: ${result.messages.length}\n`);

    if (result.messages.length === 0) {
        printInfo('No matched event message channels found.');
    } else {
        result.messages.forEach((msg, idx) => {
            console.log(`${idx + 1}. \x1b[33m[${msg.channel?.toUpperCase()}]\x1b[0m Event Type: \x1b[32m'${msg.type}'\x1b[0m`);
            console.log(`   📤 Sender: ${msg.senderFile}:${msg.senderLine}`);
            console.log(`   📥 Receiver: ${msg.receiverFile}:${msg.receiverLine}`);
        });
    }

    if (result.orphanSenders.length > 0) {
        console.log(`\n⚠️  \x1b[31mOrphan Senders (No Listener Found):\x1b[0m ${result.orphanSenders.length}`);
        result.orphanSenders.slice(0, 5).forEach(s => {
            console.log(`  - '${s.type}' @ ${s.senderFile}:${s.senderLine}`);
        });
    }

    if (result.orphanReceivers.length > 0) {
        console.log(`\n⚠️  \x1b[31mOrphan Receivers (No Sender Found):\x1b[0m ${result.orphanReceivers.length}`);
        result.orphanReceivers.slice(0, 5).forEach(r => {
            console.log(`  - '${r.type}' @ ${r.receiverFile}:${r.receiverLine}`);
        });
    }
}
