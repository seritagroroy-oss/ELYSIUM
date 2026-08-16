const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.js');
const dashboardPath = path.join(__dirname, 'Dashboard.jsx.tmp');

let hookCode = fs.readFileSync(hookPath, 'utf8');

// The destructuring string we know works exactly for `state`
const stateDestructuring = `
  const {
    showVerificationModal, setShowVerificationModal, showCalendar, setShowCalendar, hasVerifiedPointage, setHasVerifiedPointage, isVerifying, setIsVerifying, viewMode, setViewMode, showTransferModal, setShowTransferModal, transferModalData, setTransferModalData, showTransferDetailsModal, setShowTransferDetailsModal, transferDetailsData, setTransferDetailsData, externalSuppModal, setExternalSuppModal, moveZoneAgent, setMoveZoneAgent, lockedZones, setLockedZones, sites, setSites, siteOrder, setSiteOrder, draggedSite, setDraggedSite, activeSiteId, setActiveSiteId, activeSiteName, setActiveSiteName, showAgentCountHover, setShowAgentCountHover, period, setPeriod, cycleStart, setCycleStart, siteData, setSiteData, functions, setFunctions, loading, setLoading, renameModalData, setRenameModalData, highlightedAgentId, setHighlightedAgentId, globalAgents, setGlobalAgents, renameSubsiteModalData, setRenameSubsiteModalData, zoneConfigModalData, setZoneConfigModalData, functionModes, setFunctionModes, searchTerm, setSearchTerm, filterShiftType, setFilterShiftType, filterFunction, setFilterFunction, filterShowOnlyAbsences, setFilterShowOnlyAbsences, showAdvancedFilters, setShowAdvancedFilters, showKPICards, setShowKPICards, siteSortOrder, setSiteSortOrder, siteSearchTerm, setSiteSearchTerm, showSiteSettings, setShowSiteSettings, cardDesign, setCardDesign, selectedKpiAgent, setSelectedKpiAgent, isScrolled, setIsScrolled, kpiPos, setKpiPos, isDraggingKpi, setIsDraggingKpi, salaryGrid, setSalaryGrid, functionModalAgent, setFunctionModalAgent, statsCardScale, setStatsCardScale, isZenMode, setIsZenMode, paintModeActive, setPaintModeActive, paintStatus, setPaintStatus, cellContextMenu, setCellContextMenu, clipboardWeek, setClipboardWeek, pasteConfirmModal, setPasteConfirmModal, showEditSpecialServiceModal, setShowEditSpecialServiceModal, editSpecialServiceAgent, setEditSpecialServiceAgent, editSpecialServiceBase, setEditSpecialServiceBase, editSpecialServiceDays, setEditSpecialServiceDays, editSpecialServiceIsEntrant, setEditSpecialServiceIsEntrant, editSpecialServiceEntrantDate, setEditSpecialServiceEntrantDate, editSpecialServiceIsDebut, setEditSpecialServiceIsDebut, editSpecialServiceDebutDate, setEditSpecialServiceDebutDate, kpiAnchorRef, kpiDragStart, settingsMenuRef, isPaintingRef, paintedCellsRef, runVerification, toggleZoneLock, toggleAllZonesLock, getSafePeriod
  } = state;
`;

const propsDestructuring = `
  const { state, isArchiveMode, archiveData, user, getDashboardStats } = props;
`;

// Find where to inject in hook
const injectPos = hookCode.indexOf('  const {\n    // WE WILL FILL THIS MANUALLY USING AST PARSER\n  } = props;');
if (injectPos !== -1) {
  const endPos = hookCode.indexOf(';', injectPos) + 1;
  hookCode = hookCode.substring(0, injectPos) + propsDestructuring + stateDestructuring + hookCode.substring(endPos);
  
  // also inject getCyclePeriodForDate if not imported
  if (!hookCode.includes('import { getCyclePeriodForDate }')) {
    // Actually getCyclePeriodForDate is not an import in Dashboard.jsx, it's defined inside Dashboard! Wait, is it?
    // Let's assume it's imported or we'll see if it fails.
  }
}

fs.writeFileSync(hookPath, hookCode);
console.log('Props injected into useDashboardActions!');
