const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'Dashboard.jsx');
const hookFile = path.join(__dirname, '..', 'hooks', 'useAgentPointage.js');

let content = fs.readFileSync(srcFile, 'utf8');
let lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// --- Gestion Undo / Redo ---') && startIdx === -1) {
    startIdx = i;
  }
  if (lines[i].includes('const handleShiftChangeSubmit = async (e) => {') && startIdx !== -1 && endIdx === -1) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find bounds');
  process.exit(1);
}

const functionLines = lines.slice(startIdx, endIdx);

// Now, we need to handle the states.
const stateVariablesToRemove = [
  "const [savingCells, setSavingCells] = useState({});",
  "const actionHistory = useRef([]);",
  "const historyIndex = useRef(-1);",
  "const [reposMenu, setReposMenu] = useState(null);",
  "const [reposSegmentSelection, setReposSegmentSelection] = useState(null);",
  "const [reposConfirmData, setReposConfirmData] = useState(null);"
];

for (let i = lines.length - 1; i >= 0; i--) {
  if (stateVariablesToRemove.some(v => lines[i].includes(v))) {
    lines.splice(i, 1);
  }
}

// Adjust indices because we removed lines before the bounds
startIdx = -1;
endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// --- Gestion Undo / Redo ---') && startIdx === -1) {
    startIdx = i;
  }
  if (lines[i].includes('const handleShiftChangeSubmit = async (e) => {') && startIdx !== -1 && endIdx === -1) {
    endIdx = i;
    break;
  }
}

lines.splice(startIdx, endIdx - startIdx);

const hookCode = `import { useState, useRef, useEffect } from 'react';
import { apiCall } from '../api';

export function useAgentPointage({
  siteData,
  setSiteData,
  period,
  activeSiteId,
  cycleStart,
  isArchiveMode,
  isVerificationMode,
  lockedZones,
  lockedMaps,
  lockedPermissions,
  lockedAbsences,
  showPeriodLockedToast,
  getPeriodLabel,
  setLoading,
  loadSiteData,
  datesList,
  formatDateKey,
  functionModes,
  costumeModes,
  sites
}) {
  const [savingCells, setSavingCells] = useState({});
  const actionHistory = useRef([]);
  const historyIndex = useRef(-1);

  const [reposMenu, setReposMenu] = useState(null);
  const [reposSegmentSelection, setReposSegmentSelection] = useState(null);
  const [reposConfirmData, setReposConfirmData] = useState(null);

${functionLines.join('\n')}

  return {
    pointageState: {
      savingCells,
      reposMenu,
      reposSegmentSelection,
      reposConfirmData
    },
    pointageActions: {
      setReposMenu,
      setReposSegmentSelection,
      setReposConfirmData,
      handleCellClick,
      handleAssignRepos,
      executeSegmentRepos,
      executeAssignRepos
    }
  };
}
`;

fs.writeFileSync(hookFile, hookCode);

// Insert import at top
for (let i = 0; i < 60; i++) {
  if (lines[i].includes('export default function Dashboard')) {
    lines.splice(i, 0, "import { useAgentPointage } from '../hooks/useAgentPointage';");
    break;
  }
}

// Insert hook instantiation
const instantiationCode = `
  const {
    pointageState: {
      savingCells,
      reposMenu,
      reposSegmentSelection,
      reposConfirmData
    },
    pointageActions: {
      setReposMenu,
      setReposSegmentSelection,
      setReposConfirmData,
      handleCellClick,
      handleAssignRepos,
      executeSegmentRepos,
      executeAssignRepos
    }
  } = useAgentPointage({
    siteData,
    setSiteData,
    period,
    activeSiteId,
    cycleStart,
    isArchiveMode,
    isVerificationMode,
    lockedZones,
    lockedMaps,
    lockedPermissions,
    lockedAbsences,
    showPeriodLockedToast,
    getPeriodLabel,
    setLoading,
    loadSiteData,
    datesList,
    formatDateKey,
    functionModes,
    costumeModes,
    sites
  });
`;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const { showMapModal')) {
    lines.splice(i, 0, instantiationCode);
    break;
  }
}

fs.writeFileSync(srcFile, lines.join('\n'));
console.log('Successfully extracted useAgentPointage!');
