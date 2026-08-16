const fs = require('fs');
fs.copyFileSync('src/components/Salaries.jsx', '../../sauvegard/Salaries.jsx');
console.log('Backup successful');
