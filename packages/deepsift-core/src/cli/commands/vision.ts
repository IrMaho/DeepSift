import { loadConfig } from '../../utils/config.js';
import { VisionDaemonController } from '../../core/vision-daemon.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';

export async function visionCommand(projectPath: string, args: string[]) {
    const config = loadConfig(projectPath);
    const visionConfig = config.vision || {
        enabled: true,
        autoRender: false,
        daemonPort: 8264,
        maxTileResolution: 1024,
        tokenCompression: 'dec_v2',
        cacheDir: '.deepsift/vision_cache'
    };

    const daemon = VisionDaemonController.getInstance(projectPath, visionConfig);
    const subCmd = args[0]?.toLowerCase();

    if (!subCmd || subCmd === 'help') {
        printInfo('DeepSift Vision (PixelRAG) Commands:');
        printInfo('  deepsift vision status              - Check vision daemon status');
        printInfo('  deepsift vision render <url|file>   - Render page/doc to visual tiles');
        printInfo('  deepsift vision search <query>      - Search visual indices');
        return;
    }

    if (subCmd === 'status') {
        printInfo('Checking DeepSift Vision Daemon status...');
        const status = await daemon.status();
        if (status.daemonRunning) {
            printSuccess(`Vision Daemon is RUNNING on http://127.0.0.1:${status.port} (PID: ${status.pid || 'Active'})`);
        } else {
            printInfo(`Vision Daemon is STOPPED (Opt-in daemon on port ${status.port})`);
        }
        return;
    }

    if (subCmd === 'render') {
        const target = args[1];
        if (!target) {
            printError('Target URL or file path is required. Usage: deepsift vision render <url|file>');
            return;
        }

        printInfo(`Rendering target to visual screenshot tiles: ${target}`);
        const res = await daemon.render(target);
        if (res.status === 'success') {
            printSuccess(`Successfully rendered ${target}`);
            printInfo(`Generated ${res.tileCount} visual tiles with hash: ${res.visualHash}`);
            res.tiles.forEach(tile => printInfo(`  - ${tile}`));
        } else {
            printError(`Render failed: ${res.error}`);
        }
        return;
    }

    if (subCmd === 'search') {
        const query = args.slice(1).join(' ');
        if (!query) {
            printError('Search query is required. Usage: deepsift vision search <query>');
            return;
        }

        printInfo(`Executing Visual Search (PixelRAG) for: "${query}"`);
        const results = await daemon.search(query, 5);

        if (results.length === 0) {
            printInfo('No matching visual results found.');
            return;
        }

        printSuccess(`Found ${results.length} visual matches:`);
        results.forEach((item, idx) => {
            printInfo(` [${idx + 1}] ${item.title} (Score: ${item.score})`);
            if (item.snippet) {
                printInfo(`     ${item.snippet}`);
            }
        });
        return;
    }

    printError(`Unknown vision subcommand: ${subCmd}. Run 'deepsift vision' for usage.`);
}
