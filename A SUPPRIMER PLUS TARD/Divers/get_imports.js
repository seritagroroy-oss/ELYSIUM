const fs = require('fs');
const lines = fs.readFileSync('c:\\laragon\\www\\pontage\\frontend\\src\\components\\PayrollView.jsx', 'utf-8').split('\n');
let out = '';
for(let i=0; i<150; i++) {
  if (lines[i].includes('import')) {
    out += lines[i] + '\n';
  }
}
fs.writeFileSync('c:\\laragon\\www\\pontage\\imports_out.txt', out);
