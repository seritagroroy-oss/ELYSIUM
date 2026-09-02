const fs = require('fs');
const files = [
  'frontend/src/components/Dashboard.jsx',
  'frontend/src/components/tables/DashboardTable.jsx',
  'frontend/src/components/modals/ExternalSuppModal.jsx'
];
let output = '';
files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('.find(')) {
      output += `${f}:${i+1}: ${line.trim()}\n`;
    }
  });
});
fs.writeFileSync('find_results.txt', output);
console.log('done');
