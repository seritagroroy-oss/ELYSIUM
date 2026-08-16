const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const {') && lines[i+1]?.includes('pointageState: {') && lines[i+2]?.includes('savingCells,')) {
    startIdx = i;
  }
  if (startIdx !== -1 && lines[i].includes('sites') && lines[i+1]?.includes('});')) {
    endIdx = i + 1;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const instantiationLines = lines.splice(startIdx, endIdx - startIdx + 1);
  
  // Find formatDateKey
  let targetIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const formatDateKey = (date) => {')) {
      // Find the end of formatDateKey
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('return `${yyyy}-${mm}-${dd}`;')) {
          targetIdx = j + 2; // after the closing brace
          break;
        }
      }
      break;
    }
  }

  if (targetIdx !== -1) {
    lines.splice(targetIdx, 0, ...instantiationLines);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('Fixed instantiation order!');
  } else {
    console.error('Could not find formatDateKey');
  }
} else {
  console.error('Could not find useAgentPointage instantiation');
}
