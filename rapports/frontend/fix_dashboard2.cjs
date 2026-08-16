const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

// Nettoyer les sauts de lignes et espaces initiaux
code = code.replace(/^\s+/, '');

// Convertir tout CRLF en LF pur
code = code.replace(/\r\n/g, '\n');

fs.writeFileSync(dashboardPath, code, 'utf8');
console.log("Dashboard.jsx nettoyé (LF pur, sans espaces initiaux).");

const viteCache = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, { recursive: true, force: true });
    console.log("Cache Vite supprimé !");
} else {
    console.log("Aucun cache Vite trouvé.");
}
