const fs = require('fs');
const content = fs.readFileSync('c:\\laragon\\www\\pontage\\frontend\\src\\components\\Dashboard.jsx', 'utf8');
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('handleReturnToPayroll')) {
    results.push((i + 1) + ': ' + lines[i].trim());
  }
}
fs.writeFileSync('c:\\laragon\\www\\pontage\\handle_out.txt', results.join('\n'));
