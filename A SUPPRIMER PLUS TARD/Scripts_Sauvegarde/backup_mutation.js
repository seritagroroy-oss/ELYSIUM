const fs = require('fs');
const path = require('path');

const filesToBackup = [
    'frontend/src/components/tables/DashboardTable.jsx',
    'backend/modules/pointage.php',
    'backend/core/functions.php'
];

const backupDir = 'sauvegard';
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

filesToBackup.forEach(file => {
    const fileName = path.basename(file);
    const dest = path.join(backupDir, fileName);
    fs.copyFileSync(file, dest);
    console.log(`Backed up ${file} to ${dest}`);
});

fs.unlinkSync(__filename);
