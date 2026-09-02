const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const original = content;
      // Using split and join to safely replace substrings
      // A literal backslash followed by a backtick
      content = content.split('\\`').join('`');
      // A literal backslash followed by a dollar sign
      content = content.split('\\$').join('$');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}
processDir(path.join(__dirname, 'src'));
console.log('Done');
