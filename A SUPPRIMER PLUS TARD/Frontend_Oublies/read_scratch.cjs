const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/scratch.txt', 'utf16le');
console.log(content.substring(0, 500));
