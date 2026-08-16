const { execSync } = require('child_process');
try {
  const output = execSync('php -l c:/laragon/www/pontage/backend/database.php', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.error("Syntax Error:", e.stdout.toString(), e.stderr.toString());
}
