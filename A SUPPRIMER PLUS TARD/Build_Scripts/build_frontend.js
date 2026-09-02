const { execSync } = require('child_process');
const path = require('path');

console.log("=== COMPILATION DE FRONTEND VIA NODE ===");
try {
  const output = execSync('npx vite build', {
    cwd: 'c:\\laragon\\www\\pontage\\frontend',
    encoding: 'utf8',
    windowsHide: true
  });
  console.log(output);
  console.log("=== COMPILATION DU FRONTEND REUSSIE ===");
} catch (err) {
  console.error("Erreur de compilation:", err.message);
  if (err.stdout) console.log("STDOUT:", err.stdout);
  if (err.stderr) console.log("STDERR:", err.stderr);
}
