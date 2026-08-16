const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

if (code.includes('\\n')) {
    code = code.split('\\n').join('\n');
    fs.writeFileSync(dashboardPath, code, 'utf8');
    console.log("Fichier Dashboard.jsx réparé avec succès !");
} else {
    console.log("Aucune anomalie détectée.");
}
