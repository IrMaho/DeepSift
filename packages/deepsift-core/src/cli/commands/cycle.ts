import { NativeStore } from '../../storage/native-store.js';
import { printSuccess, printError } from '../cli-output.js';
import path from 'path';

export async function cycleCommand(projectPath: string) {
  const store = new NativeStore(projectPath);
  try {
    const cycles = await store.extractCycleNative();
    if (cycles.length > 0) {
        printError('Cycles detected:');
        cycles.forEach((c: string) => console.log(' - ' + c));
    } else {
        printSuccess('No cycles detected!');
    }
  } catch (err: any) {
    printError('Error: ' + err.message);
  } finally {
    store.close();
  }
}
