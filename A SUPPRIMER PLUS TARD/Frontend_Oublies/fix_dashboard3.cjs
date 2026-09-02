const fs = require('fs');
const path = require('path');
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');

let code = fs.readFileSync(dashboardPath, 'utf8');

const propsPassed = [
    'siteData', 'datesList', 'period', 'activeSiteId', 'isArchiveMode', 'isVerificationMode',
    'searchTerm', 'filterShiftType', 'filterFunction', 'filterShowOnlyAbsences', 'zoneSortOrder',
    'agentSortOrder', 'agentSpacingMode', 'agentTableMode', 'costumeModes', 'setCostumeModes',
    'functionModes', 'setFunctionModes', 'leaves', 'functions', 'selectionStart', 'selectionEnd',
    'isSelecting', 'setIsSelecting', 'setSelectionStart', 'setSelectionEnd', 'selectedCell', 'setSelectedCell',
    'handleCellClick', 'setContextMenu', 'setCellContextMenu', 'setSupplModal', 'setReposMenu',
    'setSelectedKpiAgent', 'setShowKPICards', 'handleMouseEnterCell', 'handleMouseLeaveCell', 'isDraggingRef',
    'cellContextMenu', 'isEditMode', 'lockedAbsences', 'setLockedAbsences', 'lockedMaps', 'setLockedMaps',
    'lockedPermissions', 'setLockedPermissions', 'setCpAgentId', 'setCpAgentName', 'setCpStartDate', 'setCpEndDate',
    'setShowCpModal', 'setScheduleModalAgent', 'handleUpdateAgentField', 'handleClearAgentMutations',
    'handleDeleteAgent', 'setFunctionModalAgent', 'setShiftModalAgent', 'setShiftModalType', 'setShowCustomRotation',
    'setStatusChangeInfoModal', 'handleValidationSelect', 'openDeployExtraModal', 'openDeployReleveModal',
    'requireEditMode', 'getDayLabel', 'formatDateKey', 'getPeriodLabel', 'sites', 'subsite',
    'setZoneConfigModalData', 'handleRenameSubsite', 'handleDeleteSubsite', 'activeSiteName',
    'setTransferModal', 'setReleveSupplModal', 'setPermissionDetailsModal', 'isSaving', 'paintModeActive',
    'paintStatus', 'siteTableModes', 'isModernTheme', 'lockedSp', 'setLockedSp', 'savingCells', 'openMutateModal',
    'setShowShiftChangeMenu', 'setShiftChangeDate', 'setShiftChangeNewType', 'setMapAgentId', 'setMapAgentName',
    'setMapStartDate', 'setMapEndDate', 'setMapNavOffset', 'setMapManualDuration', 'setShowMapModal'
];

// Extract code BEFORE the DashboardTable invocation
const tableIndex = code.indexOf('<DashboardTable');
if (tableIndex === -1) {
    console.log("Could not find <DashboardTable in Dashboard.jsx");
    process.exit(1);
}

const beforeTable = code.substring(0, tableIndex);

const validProps = propsPassed.filter(prop => {
    // Check if the variable is defined using a regex
    const regex = new RegExp(`\\b${prop}\\b`);
    return regex.test(beforeTable);
});

console.log("Valid props: ", validProps.length);

let newTag = '          <DashboardTable\n';
validProps.forEach(prop => {
    newTag += `            ${prop}={${prop}}\n`;
});
newTag += '          />';

const startTag = '<DashboardTable';
const endTag = '/>';
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag, startIndex) + endTag.length;

code = code.substring(0, startIndex) + newTag + code.substring(endIndex);

fs.writeFileSync(dashboardPath, code, 'utf8');
console.log("Dashboard.jsx props cleaned up successfully!");
