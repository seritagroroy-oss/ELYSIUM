const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

console.log("Searching for backslashes...");
let match;
const regex = /\\./g;
while ((match = regex.exec(code)) !== null) {
    const idx = match.index;
    const ctx = code.substring(Math.max(0, idx - 20), Math.min(code.length, idx + 20));
    console.log(`Found '\\${code[idx+1]}' at index ${idx}: ...${ctx}...`);
}
