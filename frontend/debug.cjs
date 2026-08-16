const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');
console.log("First 50 chars:");
for (let i = 0; i < 50; i++) {
    const c = code[i];
    console.log(`[${i}] '${c}' (${code.charCodeAt(i)})`);
}
