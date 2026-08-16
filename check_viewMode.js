const fs = require('fs');
const content = fs.readFileSync('c:\\laragon\\www\\pontage\\frontend\\src\\components\\PayrollView.jsx', 'utf8');
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('viewMode') && lines[i].includes('useState')) {
    results.push((i + 1) + ': ' + lines[i].trim());
  }
}
fs.writeFileSync('c:\\laragon\\www\\pontage\\get_viewMode.js', results.join('\n'));
console.log(results.join('\n'));
