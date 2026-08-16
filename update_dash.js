const fs = require('fs');
const path = 'c:\\\\laragon\\\\www\\\\pontage\\\\frontend\\\\src\\\\components\\\\Dashboard.jsx';
let code = fs.readFileSync(path, 'utf8');

const importsToAdd = `
import CancelEntrantModal from './modals/CancelEntrantModal';
import CpInfoModal from './modals/CpInfoModal';
import PermissionDetailsModal from './modals/PermissionDetailsModal';
import OverlapWarningModal from './modals/OverlapWarningModal';
`;

code = code.replace(/import MutateModal from '\.\/modals\/MutateModal';/, match => importsToAdd + match);

const startString = '{cancelEntrantModalData && (';
const endString = '{/* ============ MODAL MISE À PIED (MAP) ============ */}';

const startIndex = code.indexOf(startString);
const endIndex = code.indexOf(endString);

if (startIndex === -1 || endIndex === -1) {
    console.log('Error: Could not find start or end string');
    process.exit(1);
}

const replacementComponent = `
      <CancelEntrantModal 
        cancelEntrantModalData={cancelEntrantModalData}
        setCancelEntrantModalData={setCancelEntrantModalData}
        period={period}
        loadSiteData={loadSiteData}
      />

      <CpInfoModal 
        cpInfoModal={cpInfoModal}
        setCpInfoModal={setCpInfoModal}
        deleteCpConfirm={deleteCpConfirm}
        setDeleteCpConfirm={setDeleteCpConfirm}
        isDeletingCp={isDeletingCp}
        setIsDeletingCp={setIsDeletingCp}
        cpWarningModal={cpWarningModal}
        setCpWarningModal={setCpWarningModal}
        setCreateNewCpMode={setCreateNewCpMode}
        setEditingCpLeaveId={setEditingCpLeaveId}
        setCpAgentId={setCpAgentId}
        setCpAgentName={setCpAgentName}
        setCpStartDate={setCpStartDate}
        setCpEndDate={setCpEndDate}
        setShowCpModal={setShowCpModal}
        setLeaves={setLeaves}
        loadSiteData={loadSiteData}
      />

      <PermissionDetailsModal 
        permissionDetailsModal={permissionDetailsModal}
        setPermissionDetailsModal={setPermissionDetailsModal}
        setEditingMapLeaveId={setEditingMapLeaveId}
        setMapAgentId={setMapAgentId}
        setMapAgentName={setMapAgentName}
        setMapStartDate={setMapStartDate}
        setMapEndDate={setMapEndDate}
        setMapNavOffset={setMapNavOffset}
        setMapManualDuration={setMapManualDuration}
        setShowMapModal={setShowMapModal}
        setEditingMaladieLeaveId={setEditingMaladieLeaveId}
        setMaladieAgentId={setMaladieAgentId}
        setMaladieAgentName={setMaladieAgentName}
        setMaladieStartDate={setMaladieStartDate}
        setMaladieEndDate={setMaladieEndDate}
        setShowMaladieModal={setShowMaladieModal}
        setEditingPermLeaveId={setEditingPermLeaveId}
        setPermissionAgentId={setPermissionAgentId}
        setPermissionAgentName={setPermissionAgentName}
        setPermissionStartDate={setPermissionStartDate}
        setPermissionEndDate={setPermissionEndDate}
        setShowPermissionModal={setShowPermissionModal}
        deletePermissionConfirm={deletePermissionConfirm}
        setDeletePermissionConfirm={setDeletePermissionConfirm}
        isDeletingPermission={isDeletingPermission}
        setIsDeletingPermission={setIsDeletingPermission}
        handleDeleteLeave={handleDeleteLeave}
        cycleStart={cycleStart}
        loadSiteData={loadSiteData}
      />

      <OverlapWarningModal 
        overlapWarning={overlapWarning}
        setOverlapWarning={setOverlapWarning}
      />

      `;

const newCode = code.substring(0, startIndex) + replacementComponent + code.substring(endIndex);
fs.writeFileSync(path, newCode);
console.log('Successfully replaced modal chunk in Dashboard.jsx');
