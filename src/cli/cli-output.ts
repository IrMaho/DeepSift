export type OutputFormat = 'markdown' | 'json' | 'plain';

export function formatOutput(data: any, format: OutputFormat): string {
    switch (format) {
        case 'json':
            return JSON.stringify(data, null, 2);
        case 'plain':
            return stripMarkdown(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        case 'markdown':
        default:
            return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
}

function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ''))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/---/g, '')
        .replace(/>/g, '')
        .trim();
}

export function printResult(text: string, format: OutputFormat) {
    process.stdout.write(formatOutput(text, format) + '\n');
}

export function printError(message: string) {
    process.stderr.write(`\x1b[31m✖ Error:\x1b[0m ${message}\n`);
}

export function printSuccess(message: string) {
    process.stderr.write(`\x1b[32m✔\x1b[0m ${message}\n`);
}

export function printInfo(message: string) {
    process.stderr.write(`\x1b[36mℹ\x1b[0m ${message}\n`);
}

export function parseGlobalFlags(args: string[]): { format: OutputFormat; cleanArgs: string[] } {
    let format: OutputFormat = 'markdown';
    const cleanArgs: string[] = [];

    for (const arg of args) {
        if (arg === '--json') {
            format = 'json';
        } else if (arg === '--plain') {
            format = 'plain';
        } else {
            cleanArgs.push(arg);
        }
    }

    return { format, cleanArgs };
}
