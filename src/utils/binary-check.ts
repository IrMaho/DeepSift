import fs from 'fs';

/**
 * Checks if a file is likely a binary file by reading the first few chunks
 * and looking for null bytes.
 * 
 * @param filePath The absolute path to the file
 * @returns boolean True if binary, false if likely text
 */
export async function isBinaryFile(filePath: string): Promise<boolean> {
    try {
        const fd = await fs.promises.open(filePath, 'r');
        const buffer = Buffer.alloc(4096);
        const { bytesRead } = await fd.read(buffer, 0, 4096, 0);
        await fd.close();

        // A simple and effective heuristic: if a file contains a null byte in the first 4KB,
        // it is almost certainly a binary file (e.g. Git uses this same heuristic).
        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) {
                return true;
            }
        }
        return false;
    } catch (e) {
        // If we can't read it (e.g. permission error), we can't index it safely, 
        // but we'll return false so the main flow catches the read error naturally.
        return false;
    }
}
