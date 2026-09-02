const fs = require('fs');

const code = fs.readFileSync('C:/laragon/www/pontage/backend/modules/sites_v2.php', 'utf8');
const lines = code.split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '{') {
            stack.push({ line: i + 1, col: j + 1 });
        } else if (char === '}') {
            if (stack.length === 0) {
                console.log(`Unmatched } at line ${i + 1}:${j + 1}`);
            } else {
                stack.pop();
            }
        } else if (char === 'c' && lines[i].substring(j, j + 4) === 'case') {
            if (lines[i].includes("case 'add_agent':")) {
                console.log(`Reached case add_agent at line ${i + 1}. Stack depth: ${stack.length}`);
                if (stack.length > 0) {
                    console.log(`Open braces:`, stack);
                }
            }
        }
    }
}
console.log('Final stack depth:', stack.length);
if (stack.length > 0) {
    console.log('Unclosed braces:', stack);
}
