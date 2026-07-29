const { parseWithAst } = require('c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/dist/parsers/ast-chunker.js');
const fs = require('fs');
async function test() {
    const content = fs.readFileSync('c:/Users/ASUS/Desktop/flutter_project/plugin_figma/color/my-color-test/src/components/checkbox.tsx', 'utf8');
    const chunks = await parseWithAst(content, 'checkbox.tsx', 'tsx');
    console.log('Found ' + chunks.length + ' chunks');
    chunks.forEach((c, i) => {
        console.log('[' + i + '] Type: ' + c.type + ' Lines: ' + c.startLine + '-' + c.endLine);
    });
}
test().catch(console.error);