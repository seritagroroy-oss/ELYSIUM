const fs = require('fs');
const path = require('path');

const dashFile = path.join(__dirname, 'Dashboard.jsx');
const compFile = path.join(__dirname, 'dashboard', 'DashboardModals.jsx');

let dashContent = fs.readFileSync(dashFile, 'utf8');
let dashLines = dashContent.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < dashLines.length; i++) {
  if (dashLines[i].includes('{/* ============ MODAL RELÈVE SUPPLÉMENTAIRE ============ */}')) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && dashLines[i].includes('</PointageCalendarModal>')) {
    endIdx = i + 2; // include the closing brace of the condition
    break;
  }
}

if (startIdx !== -1 && endIdx === -1) {
  for (let i = startIdx; i < dashLines.length; i++) {
    if (dashLines[i].includes('PointageCalendarModal') && dashLines[i+4]?.includes('/>') && dashLines[i+5]?.includes(')}')) {
      endIdx = i + 6;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const block = dashLines.slice(startIdx, endIdx);

  const componentCode = `import React, { Suspense } from 'react';
import { Edit2 } from 'lucide-react';
import ReleveScheduleModal from '../modals/ReleveScheduleModal';
import ReleveSupplModal from '../modals/ReleveSupplModal';
import ExternalSuppModal from '../modals/ExternalSuppModal';
import TransferModal from '../modals/TransferModal';
import ZoneConfigModal from '../modals/ZoneConfigModal';
import MoveAgentZoneModal from '../modals/MoveAgentZoneModal';
import ClosedMonthModal from '../modals/ClosedMonthModal';
import CpInfoModal from '../modals/CpInfoModal';
import PermissionDetailsModal from '../modals/PermissionDetailsModal';
import ExternalSuppDetailsModal from '../modals/ExternalSuppDetailsModal';
import TransferDetailsModal from '../modals/TransferDetailsModal';
import VerificationModal from '../modals/VerificationModal';
import PointageCalendarModal from '../modals/PointageCalendarModal';
import { apiCall } from '../../api'; // Make sure apiCall is imported

export default function DashboardModals({ state, actions }) {
  const {
    scheduleModalAgent, sites, period, releveSupplModal, externalSuppModal, siteData, activeSiteId,
    transferModal, zoneConfigModalData, functions, moveZoneAgent, showRenameAgentModal, renameAgentNewName,
    renameAgentTarget, showReadOnlyAlert, showClosedMonthModal, cpInfoModal, permissionDetailsModal,
    externalSuppDetailsModal, showTransferModal, transferModalData, showTransferDetailsModal, transferDetailsData,
    showVerificationModal, cycleStart, showCalendar
  } = state;

  const {
    setScheduleModalAgent, loadSiteData, setReleveSupplModal, handleCellClick, setExternalSuppModal,
    setTransferModal, setZoneConfigModalData, setShowManageFunctionsModal, handleUpdateSubsiteConfig,
    setMoveZoneAgent, loadDashboardData, setShowRenameAgentModal, setRenameAgentNewName, setShowReadOnlyAlert,
    setShowClosedMonthModal, setCpInfoModal, setPermissionDetailsModal, setExternalSuppDetailsModal,
    setShowTransferModal, setTransferModalData, setShowTransferDetailsModal, setTransferDetailsData,
    setShowVerificationModal, setShowCalendar
  } = actions;

  return (
    <>
${block.join('\n')}
    </>
  );
}
`;
  
  if (!fs.existsSync(path.dirname(compFile))) {
    fs.mkdirSync(path.dirname(compFile), { recursive: true });
  }
  fs.writeFileSync(compFile, componentCode);

  const replacement = `              <DashboardModals 
                state={{
                  scheduleModalAgent, sites, period, releveSupplModal, externalSuppModal, siteData, activeSiteId,
                  transferModal, zoneConfigModalData, functions, moveZoneAgent, showRenameAgentModal, renameAgentNewName,
                  renameAgentTarget, showReadOnlyAlert, showClosedMonthModal, cpInfoModal, permissionDetailsModal,
                  externalSuppDetailsModal, showTransferModal, transferModalData, showTransferDetailsModal, transferDetailsData,
                  showVerificationModal, cycleStart, showCalendar
                }}
                actions={{
                  setScheduleModalAgent, loadSiteData, setReleveSupplModal, handleCellClick, setExternalSuppModal,
                  setTransferModal, setZoneConfigModalData, setShowManageFunctionsModal, handleUpdateSubsiteConfig,
                  setMoveZoneAgent, loadDashboardData, setShowRenameAgentModal, setRenameAgentNewName, setShowReadOnlyAlert,
                  setShowClosedMonthModal, setCpInfoModal, setPermissionDetailsModal, setExternalSuppDetailsModal,
                  setShowTransferModal, setTransferModalData, setShowTransferDetailsModal, setTransferDetailsData,
                  setShowVerificationModal, setShowCalendar
                }}
              />`;

  dashLines.splice(startIdx, endIdx - startIdx, replacement);
  
  // Add import to Dashboard.jsx
  for (let i = 0; i < dashLines.length; i++) {
    if (dashLines[i].includes('export default function Dashboard')) {
      dashLines.splice(i, 0, "import DashboardModals from './dashboard/DashboardModals';");
      break;
    }
  }

  fs.writeFileSync(dashFile, dashLines.join('\n'));
  console.log('Successfully created DashboardModals!');
} else {
  console.error('Could not find boundaries for DashboardModals', { startIdx, endIdx });
}
