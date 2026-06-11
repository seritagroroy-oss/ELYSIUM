const fs = require('fs');
const file = 'e:\\Pontage - VRAI - Copie\\frontend\\src\\components\\Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// exact match from the dump: "                                      // Case vide" (note: 6 spaces then 38 spaces total)
const OLD_MARKER = "} else if (!status || status === '') {\r\n                                      // Case vide";
const MAP_BLOCK = "} else if (status === 'MAP') {\r\n" +
    "                                       bgStyle = 'rgba(220, 38, 38, 0.22)';\r\n" +
    "                                       textStyle = '#f87171';\r\n" +
    "                                       cursorStyle = 'not-allowed';\r\n" +
    "                                       content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;\r\n" +
    "                                     } else if (!status || status === '') {\r\n" +
    "                                      // Case vide";

if (content.includes(OLD_MARKER)) {
  content = content.replace(OLD_MARKER, MAP_BLOCK);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS - MAP block inserted');
} else {
  const idx = content.indexOf('// Case vide');
  console.log('Still not found. Raw bytes:');
  console.log(JSON.stringify(content.substring(idx - 80, idx + 20)));
}
