const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('c:/laragon/www/pontage/frontend/src/components/PayrollView.jsx', 'utf8');

try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react'],
    filename: 'PayrollView.jsx'
  });
  console.log('SUCCESS');
} catch (e) {
  console.error('ERROR:', e.message);
}
