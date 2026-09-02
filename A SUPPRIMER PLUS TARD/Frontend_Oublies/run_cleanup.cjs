const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

const startTag = '<DashboardTable';
const endTag = '/>';
const startIndex = code.indexOf(startTag);
if (startIndex === -1) {
    console.error("Could not find <DashboardTable in Dashboard.jsx");
    process.exit(1);
}
const endIndex = code.indexOf(endTag, startIndex) + endTag.length;

const beforeTable = code.substring(0, startIndex);
const tableBlock = code.substring(startIndex, endIndex);

const propMatches = [...tableBlock.matchAll(/([a-zA-Z0-9_]+)=\{([a-zA-Z0-9_]+)\}/g)];
let newTag = '          <DashboardTable\n';

propMatches.forEach(match => {
    const propName = match[1];
    const varName = match[2];
    
    const regex = new RegExp(`\\b${varName}\\b`);
    const count = (beforeTable.match(regex) || []).length;
    
    if (count > 0) {
        newTag += `            ${propName}={${varName}}\n`;
    } else {
        console.log(`Removing undefined prop: ${varName}`);
    }
});

newTag += '          />';
code = code.substring(0, startIndex) + newTag + code.substring(endIndex);

fs.writeFileSync(dashboardPath, code, 'utf8');
console.log("Cleanup complete!");
