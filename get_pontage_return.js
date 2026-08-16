const fs = require('fs');
const content = fs.readFileSync('c:\\laragon\\www\\pontage\\frontend\\src\\components\\Salaries.jsx', 'utf8');
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('pontage_return')) {
    results.push((i + 1) + ': ' + lines[i].trim());
  }
}
fs.writeFileSync('c:\\laragon\\www\\pontage\\get_pontage_return.js', results.join('\n'));
