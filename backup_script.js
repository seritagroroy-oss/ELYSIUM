const fs = require('fs');
fs.copyFileSync('frontend/src/components/tables/DashboardTable.jsx', 'sauvegard/DashboardTable.jsx');
console.log('Backup done');
fs.unlinkSync(__filename);
