<?php
header('Content-Type: text/plain');
$dashboardPath = __DIR__ . '/../frontend/src/components/Dashboard.jsx';
$code = file_get_contents($dashboardPath);
if (!$code) {
    die("Failed to read Dashboard.jsx at $dashboardPath");
}

$lines = explode("\n", $code);
$startLine = -1;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], '{/* Tableau principal des pointages */}') !== false) {
        $startLine = $i;
        break;
    }
}

if ($startLine === -1) {
    die("Could not find start");
}

$openBraces = 0;
$endLine = -1;
$started = false;

for ($i = $startLine + 1; $i < count($lines); $i++) {
    $line = $lines[$i];
    for ($j = 0; $j < strlen($line); $j++) {
        if ($line[$j] === '{') {
            $openBraces++;
            $started = true;
        } else if ($line[$j] === '}') {
            $openBraces--;
        }
    }
    if ($started && $openBraces === 0) {
        if (strpos($line, '})()}') !== false) {
            $endLine = $i;
            break;
        }
    }
}

if ($endLine === -1) {
    die("Could not find end");
}

$extractedBlock = array_slice($lines, $startLine + 1, $endLine - $startLine);
file_put_contents(__DIR__ . '/../frontend/src/components/tables/raw_table_code.jsx', implode("\n", $extractedBlock));

$replacement = [
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
    '            subsite={subsite}',
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
    '          />'
];

$before = array_slice($lines, 0, $startLine + 1);
$after = array_slice($lines, $endLine + 1);

$newLines = array_merge($before, $replacement, $after);

$importStatement = "import DashboardTable from './tables/DashboardTable';";
$importAdded = false;
for ($i = 0; $i < count($newLines); $i++) {
    if (strpos($newLines[$i], "import DashboardSiteCard") !== false) {
        array_splice($newLines, $i, 0, $importStatement);
        $importAdded = true;
        break;
    }
}

file_put_contents($dashboardPath, implode("\n", $newLines));
echo "Success! Replaced block from line $startLine to $endLine.";
?>
