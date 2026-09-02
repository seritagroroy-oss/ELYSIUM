const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/scratch.txt', 'utf16le');
fs.writeFileSync('frontend/src/components/scratch_utf8.txt', content, 'utf8');
console.log('Converted scratch.txt to UTF-8');
