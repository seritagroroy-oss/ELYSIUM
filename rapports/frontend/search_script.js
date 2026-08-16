const fs = require('fs');
const lines = fs.readFileSync('c:/Users/HP/Desktop/Pontage - VRAI 03 07 2026/frontend/src/components/Dashboard.jsx', 'utf-8').split('\n');
const results = lines.map((line, i) => {
  if (line.includes('setShowReadOnlyAlert')) return (i + 1) + ': ' + line;
  return null;
}).filter(Boolean);
fs.writeFileSync('c:/Users/HP/Desktop/Pontage - VRAI 03 07 2026/frontend/search_results.txt', results.join('\n'));
