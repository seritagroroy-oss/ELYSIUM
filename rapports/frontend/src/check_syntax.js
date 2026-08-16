const fs = require('fs');
const code = fs.readFileSync('c:/laragon/www/pontage/frontend/src/components/modals/VerificationModal.jsx', 'utf8');

// Babel or simple check? We can just strip imports and jsx and see if the basic skeleton parses, but that's hard.
// Let's use Babel if it's available.
try {
  const babel = require('@babel/core');
  babel.transformSync(code, {
    filename: 'VerificationModal.jsx',
    presets: ['@babel/preset-react']
  });
  console.log("Syntax OK");
} catch (e) {
  console.error(e.message);
}
