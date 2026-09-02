const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'PayrollView.jsx');
const destPath = path.join(__dirname, 'extracted_modal.txt');

const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split('\n');
const extracted = lines.slice(535, 935).join('\n');

fs.writeFileSync(destPath, extracted, 'utf8');
console.log('Extraction complete! Lines 536 to 936.');
