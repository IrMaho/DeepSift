import { getProjectArchitecture } from './dist/utils/architecture.js';

const projectPath = 'c:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\temp\\lib';
const arch = getProjectArchitecture(projectPath, 5);
console.log(arch);
