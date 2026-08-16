const fs = require('fs');
const path = require('path');

const desktopPath = 'C:\\\\Users\\\\HP\\\\Desktop\\\\Dashboard.jsx';
const dashboardPath = path.join(__dirname, 'src', 'components', 'Dashboard.jsx');
const tablePath = path.join(__dirname, 'src', 'components', 'tables', 'DashboardTable.jsx');

if (!fs.existsSync(desktopPath)) {
    console.error("Le fichier Dashboard.jsx n'existe pas sur le bureau !");
    process.exit(1);
}

let code = fs.readFileSync(desktopPath, 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{/* Tableau principal des pointages */}'));
if (startIndex === -1) {
    console.error("Impossible de trouver le début du tableau dans le fichier du bureau.");
    process.exit(1);
}

let openBraces = 0;
let endIndex = -1;
let started = false;

for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') {
            openBraces++;
            started = true;
        } else if (line[j] === '}') {
            openBraces--;
        }
    }
    if (started && openBraces === 0) {
        if (line.includes('})()}')) {
            endIndex = i;
            break;
        }
    }
}

if (endIndex === -1) {
    console.error("Impossible de trouver la fin du tableau.");
    process.exit(1);
}

const extractedLines = lines.slice(startIndex + 1, endIndex);

// Note: since this is the very latest version, it has ALL the props we need to pass!
// We will pass down everything that seems relevant. We can use a generic spread or just list them.
const importsAndProps = `import React from 'react';
import { Trash, Edit, Check, X, AlertTriangle, ArrowLeftRight, Clock, HelpCircle, Save, Loader2, ChevronLeft, ChevronRight, Star, TrendingUp, Shield, ShieldAlert, Users, ChevronDown, Printer, RotateCcw, Briefcase, Search, Settings, Edit2 } from 'lucide-react';
import ContextMenu from '../ui/ContextMenu';

export default function DashboardTable({
  siteData, datesList, period, activeSiteId, isArchiveMode, isVerificationMode, searchTerm, filterShiftType, filterFunction, filterShowOnlyAbsences, zoneSortOrder, agentSortOrder, agentSpacingMode, agentTableMode, costumeModes, setCostumeModes, functionModes, setFunctionModes, leaves, functions, selectionStart, selectionEnd, isSelecting, setIsSelecting, setSelectionStart, setSelectionEnd, selectedCell, setSelectedCell, handleCellClick, setContextMenu, setCellContextMenu, setSupplModal, setReposMenu, setSelectedKpiAgent, setShowKPICards, handleMouseEnterCell, handleMouseLeaveCell, isDraggingRef, cellContextMenu, isEditMode, lockedAbsences, setLockedAbsences, lockedMaps, setLockedMaps, lockedPermissions, setLockedPermissions, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setShowCpModal, setScheduleModalAgent, handleUpdateAgentField, handleClearAgentMutations, handleDeleteAgent, setFunctionModalAgent, setShiftModalAgent, setShiftModalType, setShowCustomRotation, setStatusChangeInfoModal, handleValidationSelect, openDeployExtraModal, openDeployReleveModal, requireEditMode, getDayLabel, formatDateKey, getPeriodLabel, sites, subsite, setZoneConfigModalData, handleRenameSubsite, handleDeleteSubsite, activeSiteName, setTransferModal, setReleveSupplModal, setPermissionDetailsModal, isSaving, paintModeActive, paintStatus, siteTableModes, isModernTheme, lockedSp, setLockedSp, savingCells, openMutateModal, setShowShiftChangeMenu, setShiftChangeDate, setShiftChangeNewType, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setShowMapModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setShowPermissionModal, setEntrantAgentId, setEntrantAgentName, setEntrantDate, setShowEntrantModal, setSortantAgentId, setSortantAgentName, setSortantDate, setShowSortantModal, handleContextMenuAction
}) {
  return (
    <>
`;

const newComponentCode = importsAndProps + extractedLines.join('\n') + `\n    </>\n  );\n}\n`;

fs.mkdirSync(path.dirname(tablePath), { recursive: true });
fs.writeFileSync(tablePath, newComponentCode, 'utf8');

const replacementLines = [
    '          <DashboardTable ',
    '            siteData={siteData}',
    '            datesList={datesList}',
    '            period={period}',
    '            activeSiteId={activeSiteId}',
    '            isArchiveMode={isArchiveMode}',
    '            isVerificationMode={isVerificationMode}',
    '            searchTerm={searchTerm}',
    '            filterShiftType={filterShiftType}',
    '            filterFunction={filterFunction}',
    '            filterShowOnlyAbsences={filterShowOnlyAbsences}',
    '            zoneSortOrder={zoneSortOrder}',
    '            agentSortOrder={agentSortOrder}',
    '            agentSpacingMode={agentSpacingMode}',
    '            agentTableMode={agentTableMode}',
    '            costumeModes={costumeModes}',
    '            setCostumeModes={setCostumeModes}',
    '            functionModes={functionModes}',
    '            setFunctionModes={setFunctionModes}',
    '            leaves={leaves}',
    '            functions={functions}',
    '            selectionStart={selectionStart}',
    '            selectionEnd={selectionEnd}',
    '            isSelecting={isSelecting}',
    '            setIsSelecting={setIsSelecting}',
    '            setSelectionStart={setSelectionStart}',
    '            setSelectionEnd={setSelectionEnd}',
    '            selectedCell={selectedCell}',
    '            setSelectedCell={setSelectedCell}',
    '            handleCellClick={handleCellClick}',
    '            setContextMenu={setContextMenu}',
    '            setCellContextMenu={setCellContextMenu}',
    '            setSupplModal={setSupplModal}',
    '            setReposMenu={setReposMenu}',
    '            setSelectedKpiAgent={setSelectedKpiAgent}',
    '            setShowKPICards={setShowKPICards}',
    '            handleMouseEnterCell={handleMouseEnterCell}',
    '            handleMouseLeaveCell={handleMouseLeaveCell}',
    '            isDraggingRef={isDraggingRef}',
    '            cellContextMenu={cellContextMenu}',
    '            isEditMode={isEditMode}',
    '            lockedAbsences={lockedAbsences}',
    '            setLockedAbsences={setLockedAbsences}',
    '            lockedMaps={lockedMaps}',
    '            setLockedMaps={setLockedMaps}',
    '            lockedPermissions={lockedPermissions}',
    '            setLockedPermissions={setLockedPermissions}',
    '            setCpAgentId={setCpAgentId}',
    '            setCpAgentName={setCpAgentName}',
    '            setCpStartDate={setCpStartDate}',
    '            setCpEndDate={setCpEndDate}',
    '            setShowCpModal={setShowCpModal}',
    '            setScheduleModalAgent={setScheduleModalAgent}',
    '            handleUpdateAgentField={handleUpdateAgentField}',
    '            handleClearAgentMutations={handleClearAgentMutations}',
    '            handleDeleteAgent={handleDeleteAgent}',
    '            setFunctionModalAgent={setFunctionModalAgent}',
    '            setShiftModalAgent={setShiftModalAgent}',
    '            setShiftModalType={setShiftModalType}',
    '            setShowCustomRotation={setShowCustomRotation}',
    '            setStatusChangeInfoModal={setStatusChangeInfoModal}',
    '            handleValidationSelect={handleValidationSelect}',
    '            openDeployExtraModal={openDeployExtraModal}',
    '            openDeployReleveModal={openDeployReleveModal}',
    '            requireEditMode={requireEditMode}',
    '            getDayLabel={getDayLabel}',
    '            formatDateKey={formatDateKey}',
    '            getPeriodLabel={getPeriodLabel}',
    '            sites={sites}',
    '            setZoneConfigModalData={setZoneConfigModalData}',
    '            handleRenameSubsite={handleRenameSubsite}',
    '            handleDeleteSubsite={handleDeleteSubsite}',
    '            activeSiteName={activeSiteName}',
    '            setTransferModal={setTransferModal}',
    '            setReleveSupplModal={setReleveSupplModal}',
    '            setPermissionDetailsModal={setPermissionDetailsModal}',
    '            isSaving={isSaving}',
    '            paintModeActive={paintModeActive}',
    '            paintStatus={paintStatus}',
    '            siteTableModes={siteTableModes}',
    '            isModernTheme={isModernTheme}',
    '            lockedSp={lockedSp}',
    '            setLockedSp={setLockedSp}',
    '            savingCells={savingCells}',
    '            openMutateModal={openMutateModal}',
    '            setShowShiftChangeMenu={setShowShiftChangeMenu}',
    '            setShiftChangeDate={setShiftChangeDate}',
    '            setShiftChangeNewType={setShiftChangeNewType}',
    '            setMapAgentId={setMapAgentId}',
    '            setMapAgentName={setMapAgentName}',
    '            setMapStartDate={setMapStartDate}',
    '            setMapEndDate={setMapEndDate}',
    '            setMapNavOffset={setMapNavOffset}',
    '            setMapManualDuration={setMapManualDuration}',
    '            setShowMapModal={setShowMapModal}',
    '            setPermissionAgentId={setPermissionAgentId}',
    '            setPermissionAgentName={setPermissionAgentName}',
    '            setPermissionStartDate={setPermissionStartDate}',
    '            setPermissionEndDate={setPermissionEndDate}',
    '            setShowPermissionModal={setShowPermissionModal}',
    '            setEntrantAgentId={setEntrantAgentId}',
    '            setEntrantAgentName={setEntrantAgentName}',
    '            setEntrantDate={setEntrantDate}',
    '            setShowEntrantModal={setShowEntrantModal}',
    '            setSortantAgentId={setSortantAgentId}',
    '            setSortantAgentName={setSortantAgentName}',
    '            setSortantDate={setSortantDate}',
    '            setShowSortantModal={setShowSortantModal}',
    '            handleContextMenuAction={handleContextMenuAction}',
    '          />'
];

let newDashboardLines = [
    ...lines.slice(0, startIndex + 1),
    ...replacementLines,
    ...lines.slice(endIndex + 1)
];

const importStatement = "import DashboardTable from './tables/DashboardTable';";
let hasImport = false;
for (let i = 0; i < newDashboardLines.length; i++) {
    if (newDashboardLines[i].includes('import DashboardTable')) {
        hasImport = true;
        break;
    }
}
if (!hasImport) {
    for (let i = 0; i < newDashboardLines.length; i++) {
        if (newDashboardLines[i].includes("import StatsPanel")) {
            newDashboardLines.splice(i, 0, importStatement);
            break;
        }
    }
}

fs.writeFileSync(dashboardPath, newDashboardLines.join('\n'), 'utf8');
console.log("Extraction depuis le bureau réussie ! Le VRAI Dashboard est en place !");
