const fs = require('fs');
const path = require('path');

const hookFile = path.join(__dirname, '..', 'hooks', 'useAgentPointage.js');
const dashFile = path.join(__dirname, 'Dashboard.jsx');

let hookContent = fs.readFileSync(hookFile, 'utf8');
let hookLines = hookContent.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < hookLines.length; i++) {
  if (hookLines[i].includes('// Actions d\'administration de site') && startIdx === -1) {
    startIdx = i;
  }
  if (hookLines[i].includes('const handleAssignRepos = async (agentId, daysOfWeek) => {') && startIdx !== -1 && endIdx === -1) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error("Couldn't find bounds in hook");
  process.exit(1);
}

// Extract the lines
const logicLines = hookLines.splice(startIdx, endIdx - startIdx);

// Also remove handleResetYear from the returned object
for (let i = 0; i < hookLines.length; i++) {
  if (hookLines[i].includes('handleResetYear')) {
    hookLines.splice(i, 1);
    break;
  }
}

fs.writeFileSync(hookFile, hookLines.join('\n'));

// Now inject into Dashboard.jsx
let dashContent = fs.readFileSync(dashFile, 'utf8');
let dashLines = dashContent.split('\n');

let targetIdx = -1;
for (let i = 0; i < dashLines.length; i++) {
  // We should place them right after the hook instantiation.
  if (dashLines[i].includes('const {') && dashLines[i+1]?.includes('pointageState: {')) {
    // Find the end of this instantiation
    for (let j = i; j < dashLines.length; j++) {
      if (dashLines[j].includes('sites') && dashLines[j+1]?.includes('});')) {
        targetIdx = j + 2;
        break;
      }
    }
    break;
  }
}

if (targetIdx !== -1) {
  dashLines.splice(targetIdx, 0, ...logicLines);
  
  for (let i = 0; i < dashLines.length; i++) {
    if (dashLines[i].includes('handleResetYear') && i < targetIdx) {
      dashLines.splice(i, 1);
      targetIdx--; // adjust targetIdx since we removed a line before it
      break;
    }
  }

  fs.writeFileSync(dashFile, dashLines.join('\n'));
  console.log('Restored logic back to Dashboard.jsx');
} else {
  console.error("Couldn't find target in Dashboard.jsx");
}
