const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.js');
const dashboardPath = path.join(__dirname, 'Dashboard.jsx.tmp');

let dashboardLines = fs.readFileSync(dashboardPath, 'utf8').split('\n');
let hookLines = fs.readFileSync(hookPath, 'utf8').split('\n');

// 1. Find lines 193-263 (approx) in Dashboard.jsx.tmp
let startIdx = dashboardLines.findIndex(l => l.includes('const [showAddSite, setShowAddSite] = useState(false);'));
let endIdx = dashboardLines.findIndex(l => l.includes('const dashboardActions = useDashboardActions'));

if (startIdx === -1 || endIdx === -1) {
    console.error("Boundaries not found in Dashboard.jsx.tmp!");
    process.exit(1);
}

const statesToMove = dashboardLines.slice(startIdx, endIdx);

// 2. Remove them from Dashboard.jsx.tmp
dashboardLines.splice(startIdx, endIdx - startIdx);

// 3. Insert them into useDashboardActions.js just after the state destructuring
let insertPos = hookLines.findIndex(l => l.includes('const getCyclePeriodForDate')) - 1;
hookLines.splice(insertPos, 0, ...statesToMove, '');

// Also import useLeaveManagement
if (!hookLines.some(l => l.includes('import { useLeaveManagement }'))) {
    hookLines.unshift("import { useLeaveManagement } from './useLeaveManagement';");
}

// 4. Re-scan all variables in useDashboardActions.js
const definedVars = new Set();
const regexPatterns = [
  /^  const \[([a-zA-Z0-9_]+), ([a-zA-Z0-9_]+)\] = useState/m,
  /^  const ([a-zA-Z0-9_]+) = /m,
  /^  let ([a-zA-Z0-9_]+) = /m,
  /^  function ([a-zA-Z0-9_]+)/m,
  /^\s*const { ([a-zA-Z0-9_,\s]+) } = (?:mapState|mapActions|permissionState|permissionActions|cpState|cpActions)/m
];

hookLines.forEach(line => {
  for (let i = 0; i < regexPatterns.length; i++) {
    const match = regexPatterns[i].exec(line);
    if (match) {
        if (i === 4) { // destructuring
            match[1].split(',').forEach(v => definedVars.add(v.trim()));
        } else {
            definedVars.add(match[1]);
            if (match[2]) definedVars.add(match[2]);
        }
    }
  }
});
definedVars.delete('');

// 5. Update the return in useDashboardActions.js
const returnStart = hookLines.findIndex(l => l.trim() === 'return {');
const returnEnd = hookLines.findIndex((l, idx) => idx > returnStart && l.trim() === '};');

if (returnStart !== -1 && returnEnd !== -1) {
    const varsArray = Array.from(definedVars);
    hookLines.splice(returnStart + 1, returnEnd - returnStart - 1, '    ' + varsArray.join(',\n    '));
}

// 6. Update Dashboard.jsx.tmp
const destructuringIdx = dashboardLines.findIndex(l => l.includes('const { releveSupplModal,'));
if (destructuringIdx !== -1) {
    const varsArray = Array.from(definedVars);
    dashboardLines[destructuringIdx] = `  const { ${varsArray.join(', ')} } = dashboardActions;`;
}

fs.writeFileSync(hookPath, hookLines.join('\n'));
fs.writeFileSync(dashboardPath, dashboardLines.join('\n'));
console.log('Finalized extraction successfully!');
