const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(srcDir);

for (const file of files) {
  if (file.endsWith('.jsx')) {
    const fullPath = path.join(srcDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remplacement intelligent : on essaye de capter (item, i) => ... <div key={i}
    // C'est un peu complexe avec RegExp, faisons des remplacements ciblés sur les fichiers courants

    if (content.includes('key={index}')) {
      content = content.replace(/key=\{index\}/g, "key={index}"); // just marking, we will manually fix or use a smarter regex
    }
  }
}
console.log('Done');
