const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'Dashboard.jsx.tmp');
const dest = path.join(__dirname, 'Dashboard.jsx');

fs.copyFileSync(src, dest);
console.log('Successfully replaced Dashboard.jsx with Dashboard.jsx.tmp!');
