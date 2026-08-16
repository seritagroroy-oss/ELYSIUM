const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. Insert import
let importInserted = false;
for (let i = 0; i < 60; i++) {
  if (lines[i].includes('export default function Dashboard')) {
    lines.splice(i, 0, "import { useLeaveManagement } from '../hooks/useLeaveManagement';");
    importInserted = true;
    break;
  }
}

// 2. Remove the old code
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Modal: Mise À Pied (MAP)') && startIdx === -1) {
    startIdx = i;
  }
  if (lines[i].includes('const handleConfirmEntrant = async () => {') && startIdx !== -1 && endIdx === -1) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx);
  console.log('Removed old code lines:', endIdx - startIdx);
} else {
  console.error('Could not find code boundaries', startIdx, endIdx);
  process.exit(1);
}

// 3. Insert hook instantiation after `const [leaves, setLeaves]`
let hookInserted = false;
const hookCode = `
  const {
    mapState, mapActions,
    permissionState, permissionActions,
    cpState, cpActions,
    overlapWarning, setOverlapWarning,
    handleDeleteLeave
  } = useLeaveManagement({
    siteData, setSiteData, leaves, setLeaves, cycleStart, period, setShowClosedMonthModal
  });

  const { showMapModal, mapAgentId, mapAgentName, mapStartDate, mapEndDate, mapNavOffset, mapManualDuration } = mapState;
  const { setShowMapModal, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, handleMapSubmit } = mapActions;

  const { showPermissionModal, permissionAgentId, permissionAgentName, permissionStartDate, permissionEndDate, permissionNavOffset, permissionManualDuration } = permissionState;
  const { setShowPermissionModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setPermissionNavOffset, setPermissionManualDuration, handlePermissionSubmit } = permissionActions;

  const { showCpModal, cpAgentId, cpAgentName, cpStartDate, cpEndDate, cpNavOffset, cpManualDuration, createNewCpMode } = cpState;
  const { setShowCpModal, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setCpNavOffset, setCpManualDuration, setCreateNewCpMode, handleCpSubmit } = cpActions;
`;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [leaves, setLeaves] = useState([]);')) {
    lines.splice(i + 1, 0, hookCode);
    hookInserted = true;
    break;
  }
}

if (importInserted && hookInserted) {
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Successfully refactored Dashboard.jsx!');
} else {
  console.error('Failed to insert import or hook', {importInserted, hookInserted});
}
