import { NativeStore } from '../../storage/native-store.js';
import { printSuccess, printError, printInfo } from '../cli-output.js';
import path from 'path';

export async function taintCommand(symbol: string, projectPath: string) {
  const store = new NativeStore(projectPath);
  try {
    const sinks = await store.extractTaintNative(symbol);
    if (sinks && sinks.length > 0) {
        printError(`Taint sinks found for '${symbol}':`);
        sinks.forEach((s: string) => console.log(' -> ' + s));
    } else {
        printSuccess('No sinks found. Symbol is secure.');
    }
  } catch (err: any) {
    printError('Error: ' + err.message);
  } finally {
    store.close();
  }
}
