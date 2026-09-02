const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/components/tables/DashboardTable.jsx');
let code = fs.readFileSync(p, 'utf8');
console.log("Searching in DashboardTable...");
let match;
const regex = /\\./g;
while ((match = regex.exec(code)) !== null) {
    const idx = match.index;
    const ctx = code.substring(Math.max(0, idx - 20), Math.min(code.length, idx + 20));
    console.log(`Found '\\${code[idx+1]}' at index ${idx}: ...${ctx}...`);
}
