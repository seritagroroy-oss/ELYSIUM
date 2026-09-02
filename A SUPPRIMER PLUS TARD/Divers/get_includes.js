const fs = require('fs');
const content = fs.readFileSync('c:\\laragon\\www\\pontage\\frontend\\src\\components\\PayrollView.jsx', 'utf8');
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.includes(') || lines[i].includes('includes')) {
    results.push((i + 1) + ': ' + lines[i].trim());
  }
}
fs.writeFileSync('c:\\laragon\\www\\pontage\\includes_out.txt', results.join('\n'));
