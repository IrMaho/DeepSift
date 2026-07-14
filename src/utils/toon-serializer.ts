/**
 * Token-Oriented Object Notation (TOON) Serializer
 * Lossless text-based serialization designed specifically to reduce LLM token count.
 */

export function jsonToToon(val: any, indent: number = 0): string {
    const spacing = ' '.repeat(indent);

    if (val === null) return 'null';
    if (val === undefined) return 'undefined';

    if (typeof val === 'string') {
        // Escape special characters if needed
        if (val.includes(',') || val.includes(':') || val.includes('\n') || val.includes('"') || val.trim() === '') {
            return JSON.stringify(val);
        }
        return val;
    }

    if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
    }

    if (Array.isArray(val)) {
        if (val.length === 0) return '[]';

        // Check if uniform array of objects (tabular data)
        const allObjects = val.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (allObjects && val.length > 0) {
            // Tabular format
            // Collect all unique keys
            const keysSet = new Set<string>();
            val.forEach(item => Object.keys(item).forEach(k => keysSet.add(k)));
            const keys = Array.from(keysSet);

            let result = `${spacing}[${val.length}]{${keys.join(',')}}:\n`;
            for (const item of val) {
                const row = keys.map(k => {
                    const v = item[k];
                    if (v === undefined || v === null) return '';
                    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
                    // escape comma
                    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                        return JSON.stringify(str);
                    }
                    return str;
                });
                result += `${spacing}  ${row.join(',')}\n`;
            }
            return result.trimEnd();
        } else {
            // Standard array
            let result = `${spacing}[${val.length}]:\n`;
            for (const item of val) {
                const serializedItem = jsonToToon(item, indent + 2);
                if (serializedItem.includes('\n')) {
                    result += `${spacing}  -\n${spacing}    ${serializedItem.replace(/\n/g, '\n' + spacing + '    ')}\n`;
                } else {
                    result += `${spacing}  - ${serializedItem}\n`;
                }
            }
            return result.trimEnd();
        }
    }

    if (typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) return '{}';

        let result = '';
        for (const key of keys) {
            const v = val[key];
            const serializedValue = jsonToToon(v, indent + 2);
            if (serializedValue.includes('\n')) {
                result += `${spacing}${key}:\n${serializedValue}\n`;
            } else {
                result += `${spacing}${key}: ${serializedValue}\n`;
            }
        }
        return result.trimEnd();
    }

    return String(val);
}

export function toonToJson(toonText: string): any {
    const lines = toonText.split(/\r?\n/);
    let lineIdx = 0;

    function parseValue(currentIndent: number): any {
        if (lineIdx >= lines.length) return null;
        let line = lines[lineIdx];

        // Skip empty lines
        while (lineIdx < lines.length && line.trim() === '') {
            lineIdx++;
            if (lineIdx >= lines.length) return null;
            line = lines[lineIdx];
        }

        const indent = line.length - line.trimStart().length;
        if (indent < currentIndent) return null;

        const trimmed = line.trim();

        // Primitives
        if (trimmed === 'null') { lineIdx++; return null; }
        if (trimmed === 'undefined') { lineIdx++; return undefined; }
        if (trimmed === 'true') { lineIdx++; return true; }
        if (trimmed === 'false') { lineIdx++; return false; }
        if (trimmed === '[]') { lineIdx++; return []; }
        if (trimmed === '{}') { lineIdx++; return {}; }

        // Quoted strings
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            lineIdx++;
            try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
        }

        // Tabular Array: key[size]{k1,k2}:
        const tabArrayMatch = trimmed.match(/^([^\[]+)?\[(\d+)\]\{([^\}]+)\}:$/);
        if (tabArrayMatch) {
            const size = parseInt(tabArrayMatch[2], 10);
            const keys = tabArrayMatch[3].split(',');
            lineIdx++;

            const arr: any[] = [];
            for (let i = 0; i < size; i++) {
                if (lineIdx >= lines.length) break;
                const rowLine = lines[lineIdx].trim();
                if (rowLine === '') {
                    lineIdx++;
                    i--;
                    continue;
                }
                
                // Parse CSV row respecting quotes
                const rowValues = parseCsvRow(rowLine);
                const obj: any = {};
                keys.forEach((k, idx) => {
                    const rawVal = rowValues[idx] || '';
                    obj[k] = parsePrimitive(rawVal);
                });
                arr.push(obj);
                lineIdx++;
            }
            return arr;
        }

        // Standard Array: key[size]:
        const stdArrayMatch = trimmed.match(/^([^\[]+)?\[(\d+)\]:$/);
        if (stdArrayMatch) {
            const size = parseInt(stdArrayMatch[2], 10);
            lineIdx++;
            const arr: any[] = [];
            
            while (lineIdx < lines.length) {
                const nextLine = lines[lineIdx];
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                if (nextLine.trim() === '') {
                    lineIdx++;
                    continue;
                }
                if (nextIndent <= currentIndent) break;

                const itemLine = nextLine.trim();
                if (itemLine.startsWith('-')) {
                    const content = itemLine.slice(1).trim();
                    if (content === '') {
                        // Nested multi-line item
                        lineIdx++;
                        arr.push(parseValue(nextIndent + 2));
                    } else {
                        arr.push(parsePrimitive(content));
                        lineIdx++;
                    }
                } else {
                    break;
                }
            }
            return arr;
        }

        // Object property or nested object: key: value or key:
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx !== -1) {
            const obj: any = {};
            
            while (lineIdx < lines.length) {
                const currLine = lines[lineIdx];
                if (currLine.trim() === '') {
                    lineIdx++;
                    continue;
                }
                const currIndent = currLine.length - currLine.trimStart().length;
                if (currIndent < currentIndent) break;

                const currTrimmed = currLine.trim();
                const cIdx = currTrimmed.indexOf(':');
                if (cIdx === -1) {
                    // Not a key-value pair, stop object parsing
                    break;
                }

                const key = currTrimmed.slice(0, cIdx).trim();
                const valStr = currTrimmed.slice(cIdx + 1).trim();

                if (valStr === '') {
                    // Nested structure
                    lineIdx++;
                    obj[key] = parseValue(currIndent + 2);
                } else {
                    obj[key] = parsePrimitive(valStr);
                    lineIdx++;
                }
            }
            return obj;
        }

        // Default primitive
        lineIdx++;
        return parsePrimitive(trimmed);
    }

    return parseValue(0);
}

function parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result.map(v => {
        if (v.startsWith('"') && v.endsWith('"')) {
            try { return JSON.parse(v); } catch { return v.slice(1, -1); }
        }
        return v;
    });
}

function parsePrimitive(val: string): any {
    const trimmed = val.trim();
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Number check
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }
    
    // JSON quoted string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
    }
    return trimmed;
}
