import { NativeStore } from 'c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/dist/storage/native-store.js';

const s = new NativeStore('c:/Users/ASUS/Desktop/flutter_project/plugin_figma/color/my-color-test/.deepsift/deepsift.db');
const all = s.db.prepare(`SELECT filePath, type, startLine, endLine, SUBSTR(content, 1, 100) as preview FROM chunks WHERE filePath LIKE '%checkbox%'`).all();
console.log('Total checkbox chunks:', all.length);
console.log(JSON.stringify(all, null, 2));
