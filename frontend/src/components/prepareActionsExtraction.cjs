const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'Dashboard.jsx');
const hookPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.js');

let lines = fs.readFileSync(dashboardPath, 'utf8').split('\n');

let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [releveSupplModal, setReleveSupplModal] = useState(null);')) {
    startIdx = i;
    break;
  }
}

let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('const stats = getDashboardStats();')) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error("Boundaries not found!");
  process.exit(1);
}

const extractedLines = lines.slice(startIdx, endIdx);

// Parse defined variables (top level only)
const definedVars = new Set();
const regexPatterns = [
  /^  const \[([a-zA-Z0-9_]+), ([a-zA-Z0-9_]+)\] = useState/m,
  /^  const ([a-zA-Z0-9_]+) = /m,
  /^  let ([a-zA-Z0-9_]+) = /m,
  /^  function ([a-zA-Z0-9_]+)/m
];

extractedLines.forEach(line => {
  for (let regex of regexPatterns) {
    const match = regex.exec(line);
    if (match) {
      definedVars.add(match[1]);
      if (match[2]) definedVars.add(match[2]);
    }
  }
});

const varsArray = Array.from(definedVars);

const hookContent = `import { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { getCyclePeriodForDate } from '../utils/dateUtils'; // Ensure this exists or mock it if needed
// You might need other imports like getSafePeriod if it's not passed

export function useDashboardActions(props) {
  const {
    // WE WILL FILL THIS MANUALLY USING AST PARSER
  } = props;

${extractedLines.join('\n')}

  return {
    ${varsArray.join(',\n    ')}
  };
}
`;

fs.writeFileSync(hookPath, hookContent);
console.log("Extracted to useDashboardActions.js!");
console.log("Defined variables count:", varsArray.length);

// Now write a temporary Dashboard logic to avoid ReferenceError while we analyze
const dashboardDestructuring = `  const dashboardActions = useDashboardActions({ /* PROPS */ });\n  const { ${varsArray.join(', ')} } = dashboardActions;\n`;
lines.splice(startIdx, endIdx - startIdx, dashboardDestructuring);
fs.writeFileSync(dashboardPath + '.tmp', lines.join('\n'));

