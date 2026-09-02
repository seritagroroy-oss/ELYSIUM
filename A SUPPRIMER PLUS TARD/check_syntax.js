const fs = require('fs');
const content = fs.readFileSync('c:/laragon/www/pontage/frontend/src/components/PayrollView.jsx', 'utf8');

let openBrackets = 0;
let openParens = 0;
let openBraces = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
}

console.log('Brackets:', openBrackets);
console.log('Parens:', openParens);
console.log('Braces:', openBraces);
