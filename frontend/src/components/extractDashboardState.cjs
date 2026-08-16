const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'Dashboard.jsx');
const hookFile = path.join(__dirname, '..', 'hooks', 'useDashboardState.js');

let content = fs.readFileSync(srcFile, 'utf8');
let lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;

// Find start of state declarations
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [showVerificationModal, setShowVerificationModal] = useState(false);')) {
    startIdx = i;
    break;
  }
}

let endStateIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('const [editSpecialServiceDebutDate, setEditSpecialServiceDebutDate] = useState(')) {
    // We want to also grab the simple useEffects right after, let's stop before loadGlobalAgents
    endStateIdx = i;
  }
  if (lines[i].includes('const loadGlobalAgents =')) {
    endStateIdx = i - 1;
    break;
  }
}

if (startIdx === -1 || endStateIdx === -1) {
  console.error("Could not find boundaries.");
  process.exit(1);
}

const stateLines = lines.slice(startIdx, endStateIdx + 1);

// Parse all variables declared with const [var, setVar]
const exportedVars = new Set();
const regexState = /const \[\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\] = useState/g;
const regexRef = /const ([a-zA-Z0-9_]+) = useRef/g;
const regexFunc = /const ([a-zA-Z0-9_]+) = \(/g;
const regexConst = /const ([a-zA-Z0-9_]+) = /g;

const codeBlock = stateLines.join('\n');

let match;
while ((match = regexState.exec(codeBlock)) !== null) {
  exportedVars.add(match[1]);
  exportedVars.add(match[2]);
}
while ((match = regexRef.exec(codeBlock)) !== null) {
  exportedVars.add(match[1]);
}
// For basic functions like `runVerification`, `toggleZoneLock`
while ((match = regexFunc.exec(codeBlock)) !== null) {
  // Ignore React hooks inside
  if (!match[1].startsWith('use') && match[1] !== 'useEffect') {
    exportedVars.add(match[1]);
  }
}

const varsArray = Array.from(exportedVars);
const returnStatement = `
  return {
    ${varsArray.join(',\n    ')}
  };
`;

const hookCode = `import { useState, useRef, useEffect } from 'react';

export function useDashboardState(archiveData, siteData) {
  const isArchiveMode = !!archiveData;

${stateLines.join('\n')}

${returnStatement}
}
`;

if (!fs.existsSync(path.dirname(hookFile))) {
  fs.mkdirSync(path.dirname(hookFile), { recursive: true });
}
fs.writeFileSync(hookFile, hookCode);

const destructuring = `
  const {
    ${varsArray.join(', ')}
  } = useDashboardState(archiveData, siteData);
`;

lines.splice(startIdx, endStateIdx - startIdx + 1, destructuring);

// Add import
for (let i = 0; i < 60; i++) {
  if (lines[i].includes('export default function Dashboard')) {
    lines.splice(i, 0, "import { useDashboardState } from '../hooks/useDashboardState';");
    break;
  }
}

fs.writeFileSync(srcFile, lines.join('\n'));
console.log('Successfully extracted useDashboardState!');
