
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  Plus, CalendarDays, RefreshCw, Archive, UserPlus,
  Trash, Trash2, Check, X, AlertTriangle, ArrowLeftRight, Clock, HelpCircle, Save, Loader2, ChevronLeft, ChevronRight, Star, TrendingUp, Shield, ShieldAlert, Users, ChevronDown, Printer, RotateCcw, Briefcase, Search, Settings, Edit, Edit2
} from 'lucide-react';
import DashboardTable from './tables/DashboardTable';
import StatsPanel from './StatsPanel';
import BlacklistModal from './BlacklistModal';
import ArchivesPointage from './ArchivesPointage';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import ContextMenu from './ui/ContextMenu';
import TopBar from './ui/TopBar';
import ZenModeButton from './ui/ZenModeButton';
import WelcomeToast from './modals/WelcomeToast';
import PointageCalendarModal from './modals/PointageCalendarModal';
const VerificationModal = React.lazy(() => import('./modals/VerificationModal'));

import DeployReleveModal from './modals/DeployReleveModal';
import DeleteAgentModal from './modals/DeleteAgentModal';
import ConfirmDeleteZoneModal from './modals/ConfirmDeleteZoneModal';
import DeleteSiteModal from './modals/DeleteSiteModal';
import AddAgentModal from './modals/AddAgentModal';
import MutateModal from './modals/MutateModal';
import PublishReportModal from './modals/PublishReportModal';
import SpecialServiceModal from './modals/SpecialServiceModal';
import AdminScheduleModal from './modals/AdminScheduleModal';
import PublishSuccessModal from './modals/PublishSuccessModal';
import EntrantModal from './modals/EntrantModal';
import SortantModal from './modals/SortantModal';
import CpModal from './modals/CpModal';
import CpInfoModal from './modals/CpInfoModal';
import PermissionModal from './modals/PermissionModal';
import PermissionDetailsModal from './modals/PermissionDetailsModal';
import OverlapWarningModal from './modals/OverlapWarningModal';
import MapModal from './modals/MapModal';
import MaladieModal from './modals/MaladieModal';
import AbsenceModal from './modals/AbsenceModal';
import ExternalSuppDetailsModal from './modals/ExternalSuppDetailsModal';
import DeployExtraModal from './modals/DeployExtraModal';
import ManageFunctionsModal from './modals/ManageFunctionsModal';
import RenameSiteModal from './modals/RenameSiteModal';
import RenameSubsiteModal from './modals/RenameSubsiteModal';
import ChgtStatutModal from './modals/ChgtStatutModal';
import ReleveSupplModal from './modals/ReleveSupplModal';
import TransferModal from './modals/TransferModal';
import TransferDetailsModal from './modals/TransferDetailsModal';
import PermanentSupplementsModal from './modals/PermanentSupplementsModal';
import ReleveScheduleModal from './modals/ReleveScheduleModal';
import ClosedMonthModal from './modals/ClosedMonthModal';
import ZoneConfigModal from './modals/ZoneConfigModal';
import ExternalSuppModal from './modals/ExternalSuppModal';
import MoveAgentZoneModal from './modals/MoveAgentZoneModal';


import { useLeaveManagement } from '../hooks/useLeaveManagement';
import { useAgentPointage } from '../hooks/useAgentPointage';
import SiteSelector from './dashboard/SiteSelector';
import DashboardModals from './dashboard/DashboardModals';
import { useDashboardState } from '../hooks/useDashboardState';
import { useDashboardActions } from '../hooks/useDashboardActions';
export default function Dashboard({ isVerificationMode = false, archiveData = null, onBack = null, onSwitchToCurrent = null, setView, navState = null }) {
  const isArchiveMode = !!archiveData;
  const { user } = useAuth();

  const [returnToPayrollId] = useState(() => navState ? navState.agentId : null);
  const [returnSource] = useState(() => navState ? navState.source : 'payroll');
  const handleReturnToPayroll = async () => {
    // SPA state (très fiable car pas de rechargement complet)
    window.pontage_return_source = returnSource;
    if (returnToPayrollId) window.pontage_return_agent_id = returnToPayrollId;
    if (navState && navState.agentData) window.pontage_return_agent_data = navState.agentData;

    // Restauration de l'état pour que Salaries/PayrollView sachent où retourner (fallback)
    try {
      localStorage.setItem('pontage_return_source', returnSource);
      if (returnToPayrollId) localStorage.setItem('pontage_return_to_payroll_agent_id', returnToPayrollId);
      if (navState && navState.agentData) localStorage.setItem('pontage_return_to_payroll_agent_data', JSON.stringify(navState.agentData));
      // Forcer l'onglet "Actuel" dans PayrollView (évite d'atterrir sur Archives)
      if (returnSource === 'payroll') {
        localStorage.setItem('pontage_payroll_viewMode', 'current');
      }
    } catch (e) {}

    // ⚠️  NE PAS appeler clear_nav_state ici !
    // L'état backend (session PHP) doit rester intact pour que PayrollView puisse le lire
    // au montage (cas ngrok / changement d'origine). PayrollView se chargera lui-même
    // de nettoyer via clear_nav_state après lecture.

    if (typeof setView === 'function') {
      setView(returnSource);
    }
  };



  const state = useDashboardState(archiveData);
  const {
    showVerificationModal, setShowVerificationModal, showCalendar, setShowCalendar, hasVerifiedPointage, setHasVerifiedPointage, isVerifying, setIsVerifying, viewMode, setViewMode, showTransferModal, setShowTransferModal, transferModalData, setTransferModalData, showTransferDetailsModal, setShowTransferDetailsModal, transferDetailsData, setTransferDetailsData, externalSuppModal, setExternalSuppModal, moveZoneAgent, setMoveZoneAgent, lockedZones, setLockedZones, sites, setSites, siteOrder, setSiteOrder, draggedSite, setDraggedSite, activeSiteId, setActiveSiteId, activeSiteName, setActiveSiteName, showAgentCountHover, setShowAgentCountHover, period, setPeriod, cycleStart, setCycleStart, siteData, setSiteData, functions, setFunctions, loading, setLoading, renameModalData, setRenameModalData, highlightedAgentId, setHighlightedAgentId, globalAgents, setGlobalAgents, renameSubsiteModalData, setRenameSubsiteModalData, zoneConfigModalData, setZoneConfigModalData, functionModes, setFunctionModes, searchTerm, setSearchTerm, filterShiftType, setFilterShiftType, filterFunction, setFilterFunction, filterShowOnlyAbsences, setFilterShowOnlyAbsences, showAdvancedFilters, setShowAdvancedFilters, showKPICards, setShowKPICards, siteSortOrder, setSiteSortOrder, siteSearchTerm, setSiteSearchTerm, showSiteSettings, setShowSiteSettings, cardDesign, setCardDesign, selectedKpiAgent, setSelectedKpiAgent, isScrolled, setIsScrolled, kpiPos, setKpiPos, isDraggingKpi, setIsDraggingKpi, salaryGrid, setSalaryGrid, functionModalAgent, setFunctionModalAgent, statsCardScale, setStatsCardScale, isZenMode, setIsZenMode, paintModeActive, setPaintModeActive, paintStatus, setPaintStatus, cellContextMenu, setCellContextMenu, clipboardWeek, setClipboardWeek, pasteConfirmModal, setPasteConfirmModal, showEditSpecialServiceModal, setShowEditSpecialServiceModal, editSpecialServiceAgent, setEditSpecialServiceAgent, editSpecialServiceBase, setEditSpecialServiceBase, editSpecialServiceDays, setEditSpecialServiceDays, editSpecialServiceIsEntrant, setEditSpecialServiceIsEntrant, editSpecialServiceEntrantDate, setEditSpecialServiceEntrantDate, editSpecialServiceIsDebut, setEditSpecialServiceIsDebut, editSpecialServiceDebutDate, setEditSpecialServiceDebutDate, kpiAnchorRef, kpiDragStart, settingsMenuRef, isPaintingRef, paintedCellsRef, runVerification, toggleZoneLock, toggleAllZonesLock, getSafePeriod
  } = state;

  useEffect(() => {
    if (navState && !loading) {
      try {
        if (isArchiveMode && archiveData && archiveData.period === navState.period) {
          if (navState.agentName) {
            setSiteSearchTerm(navState.agentName);
            setHighlightedAgentId(navState.agentId || navState.agentName);
            if (navState.siteName && sites && sites.length > 0) {
              const matchedSite = sites.find(s => s.name === navState.siteName || s.nom === navState.siteName);
              if (matchedSite) {
                setActiveSiteId(matchedSite.id);
                setActiveSiteName(matchedSite.name || matchedSite.nom);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error handling navState auto_search:', e);
      } finally {
        // Dispatch event to hide the loading overlay in ArchivesPointage
        setTimeout(() => {
          window.dispatchEvent(new Event('auto_search_complete'));
        }, 300);
      }
    }
  }, [isArchiveMode, archiveData, loading, sites, setSiteSearchTerm, setHighlightedAgentId, setActiveSiteId, setActiveSiteName, navState]);

  useEffect(() => {
    localStorage.setItem('pontage_card_design', cardDesign);
  }, [cardDesign]);

  useEffect(() => {
    localStorage.setItem('pontage_show_agent_count_hover', showAgentCountHover);
  }, [showAgentCountHover]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSiteSettings(false);
      }
    };
    if (showSiteSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSiteSettings]);

  // Sync selectedKpiAgent quand les données changent (ex: changement de fonction ou de pointage)
  useEffect(() => {
    if (selectedKpiAgent && siteData.length > 0) {
      let found = null;
      siteData.some(subsite => {
        if (!subsite) return false;
        const match = (subsite.agents || []).find(a => a.id === selectedKpiAgent.id);
        if (match) { found = match; return true; }
        return false;
      });
      if (found && (found.function !== selectedKpiAgent.function || JSON.stringify(found.attendance) !== JSON.stringify(selectedKpiAgent.attendance))) {
        setSelectedKpiAgent(found);
      }
    }
  }, [siteData]);

  useEffect(() => {
    const handler = () => setStatsCardScale(parseFloat(localStorage.getItem('pontage_stats_card_size') || '1'));
    window.addEventListener('pontage_stats_size_changed', handler);
    return () => window.removeEventListener('pontage_stats_size_changed', handler);
  }, []);

  useEffect(() => {
    const handleKpiMouseMove = (e) => {
      if (!isDraggingKpi) return;
      setKpiPos({
        x: e.clientX - kpiDragStart.current.x,
        y: e.clientY - kpiDragStart.current.y
      });
    };
    const handleKpiMouseUp = () => {
      if (isDraggingKpi) setIsDraggingKpi(false);
    };

    if (isDraggingKpi) {
      window.addEventListener('mousemove', handleKpiMouseMove);
      window.addEventListener('mouseup', handleKpiMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleKpiMouseMove);
      window.removeEventListener('mouseup', handleKpiMouseUp);
    };
  }, [isDraggingKpi]);

  useEffect(() => {
    const handleScroll = () => {
      if (!kpiAnchorRef.current) return;
      const rect = kpiAnchorRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once to initialize
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKpiMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
    setIsDraggingKpi(true);
    kpiDragStart.current = {
      x: e.clientX - kpiPos.x,
      y: e.clientY - kpiPos.y
    };
  };


  // Modals visibility
  const handleDragStart = (e, siteId) => {
    e.stopPropagation();
    setDraggedSite(siteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', siteId);
  };

  const handleDragOver = (e, targetSiteId) => {
    e.preventDefault();
    if (!draggedSite || draggedSite === targetSiteId) return;

    let order = [...siteOrder];
    if (order.length === 0) {
      order = sites.map(s => s.id);
    } else {
      sites.forEach(s => { if (!order.includes(s.id)) order.push(s.id); });
    }

    const draggedIdx = order.indexOf(draggedSite);
    const targetIdx = order.indexOf(targetSiteId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      order.splice(draggedIdx, 1);
      order.splice(targetIdx, 0, draggedSite);
      setSiteOrder(order);
    }
  };

  const handleDragEnd = () => {
    setDraggedSite(null);
    localStorage.setItem('pontage_site_order', JSON.stringify(siteOrder));
  };

  const dashboardActions = useDashboardActions({ state, isArchiveMode, archiveData, user, isVerificationMode });
  const { overlapWarning, setOverlapWarning, handleDeleteLeave, savingCells, reposMenu, reposSegmentSelection, reposConfirmData, setReposMenu, setReposSegmentSelection, setReposConfirmData, handleCellClick, handleAssignRepos, executeSegmentRepos, executeAssignRepos, showAddSite, setShowAddSite, showAddSubsite, setShowAddSubsite, showAddAgent, setShowAddAgent, showDeleteAgent, setShowDeleteAgent, deleteSiteData, setDeleteSiteData, showFaqModal, setShowFaqModal, expandedFaq, setExpandedFaq, showRenameAgentModal, setShowRenameAgentModal, renameAgentTarget, setRenameAgentTarget, renameAgentNewName, setRenameAgentNewName, showDeployExtra, setShowDeployExtra, extraAgents, setExtraAgents, showClosedMonthModal, setShowClosedMonthModal, showManageFunctionsModal, setShowManageFunctionsModal, showDeployReleve, setShowDeployReleve, releveAgents, setReleveAgents, deployReleveDefaultAgentId, setDeployReleveDefaultAgentId, deployReleveDefaultDate, setDeployReleveDefaultDate, enableAnimations, setEnableAnimations, cpInfoModal, setCpInfoModal, externalSuppDetailsModal, setExternalSuppDetailsModal, agentTableMode, setAgentTableMode, showTableModeMenu, setShowTableModeMenu, supplModal, setSupplModal, transferModal, setTransferModal, getRobustBehavior, setRobustBehavior, isEditMode, setIsEditMode, showReadOnlyAlert, setShowReadOnlyAlert, editModeBehavior, setEditModeBehavior, getCyclePeriodForDate, releveSupplModal, setReleveSupplModal, scheduleModalAgent, setScheduleModalAgent, setAndSaveAgentTableMode, agentSpacingMode, setAgentSpacingMode, setAndSaveAgentSpacingMode, siteTableModes, setSiteTableModes, setAndSaveSiteTableMode, agentSortOrder, setAgentSortOrder, setAndSaveAgentSortOrder, zoneSortOrder, setZoneSortOrder, setAndSaveZoneSortOrder, siteContextMenu, setSiteContextMenu, showRenameSiteModal, setShowRenameSiteModal, renameSiteName, setRenameSiteName, showDeleteSiteModal, setShowDeleteSiteModal, showShiftChangeMenu, setShowShiftChangeMenu, shiftChangeDate, setShiftChangeDate, shiftChangeNewType, setShiftChangeNewType, showSortantModal, setShowSortantModal, sortantAgentId, setSortantAgentId, sortantAgentName, setSortantAgentName, sortantDate, setSortantDate, sortantType, setSortantType, sortantCustomReason, setSortantCustomReason, showEntrantModal, setShowEntrantModal, entrantAgentId, setEntrantAgentId, entrantAgentName, setEntrantAgentName, entrantDate, setEntrantDate, entrantFunction, setEntrantFunction, selectedCell, setSelectedCell, selectionStart, setSelectionStart, selectionEnd, setSelectionEnd, isSelecting, setIsSelecting, showMutate, setShowMutate, isMutating, setIsMutating, costumeModes, setCostumeModes, handleConfirmEntrant, handleConfirmSortant, contextMenu, setContextMenu, leaves, setLeaves, showMapModal, mapAgentId, mapAgentName, mapStartDate, mapEndDate, mapNavOffset, mapManualDuration, editingMapLeaveId, setShowMapModal, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setEditingMapLeaveId, handleMapSubmit, showPermissionModal, permissionAgentId, permissionAgentName, permissionStartDate, permissionEndDate, permissionNavOffset, permissionManualDuration, editingPermissionLeaveId, setShowPermissionModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setPermissionNavOffset, setPermissionManualDuration, setEditingPermissionLeaveId, handlePermissionSubmit, showCpModal, cpAgentId, cpAgentName, cpStartDate, cpEndDate, cpNavOffset, cpManualDuration, createNewCpMode, editingCpLeaveId, setShowCpModal, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setCpNavOffset, setCpManualDuration, setCreateNewCpMode, setEditingCpLeaveId, handleCpSubmit, lockedPermissions, setLockedPermissions, lockedAbsences, setLockedAbsences, cpWarningModal, setCpWarningModal, permissionDetailsModal, setPermissionDetailsModal, lockedMaps, setLockedMaps, showChgtStatutModal, setShowChgtStatutModal, chgtStatutAgent, setChgtStatutAgent, chgtStatutDate, setChgtStatutDate, chgtStatutNewFunction, setChgtStatutNewFunction, chgtStatutReason, setChgtStatutReason, chgtStatutColorNew, setChgtStatutColorNew, chgtStatutColorHex, setChgtStatutColorHex, statusChangeInfoModal, setStatusChangeInfoModal, handleChgtStatutSubmit, shiftModalAgent, setShiftModalAgent, shiftModalType, setShiftModalType, showCustomRotation, setShowCustomRotation, isGenerating, setIsGenerating, customRotationType, setCustomRotationType, customRotationDate, setCustomRotationDate, iconPickerSiteId, setIconPickerSiteId, showVerificationSites, setShowVerificationSites, publishedPeriods, setPublishedPeriods, maxInitializedPeriod, setMaxInitializedPeriod, showNextMonthModal, setShowNextMonthModal, showPublishReport, setShowPublishReport, showPublishSuccess, setShowPublishSuccess, showPublishModal, setShowPublishModal, publishing, setPublishing, publishProgress, setPublishProgress, initializing, setInitializing, initProgress, setInitProgress, sitesToKeepHS, setSitesToKeepHS, showKeepHSModal, setShowKeepHSModal, showWelcomeToast, setShowWelcomeToast, welcomeMonthName, setWelcomeMonthName, hasAutoSnapped, setHasAutoSnapped, manuallyAdvancedToFuture, setManuallyAdvancedToFuture, showFirstVisitModal, setShowFirstVisitModal, showPeriodLockedToast, showStats, setShowStats, showBlacklist, setShowBlacklist, newSiteName, setNewSiteName, newSiteLocation, setNewSiteLocation, isSpecialSite, setIsSpecialSite, specialSiteType, setSpecialSiteType, customBehavior, setCustomBehavior, newSubsiteName, setNewSubsiteName, newAgentName, setNewAgentName, newAgentSubsiteId, setNewAgentSubsiteId, newAgentFunction, setNewAgentFunction, newAgentShiftType, setNewAgentShiftType, newAgentContractEnd, setNewAgentContractEnd, isNewAgentEntrant, setIsNewAgentEntrant, newAgentEntrantDate, setNewAgentEntrantDate, mutateAgentId, setMutateAgentId, mutateAgentName, setMutateAgentName, mutateStart, setMutateStart, mutateNewShiftType, setMutateNewShiftType, mutateNewFunction, setMutateNewFunction, searchMutationText, setSearchMutationText, showMutationDropdown, setShowMutationDropdown, mutateDestSubsiteId, setMutateDestSubsiteId, errorMsg, setErrorMsg, deleteAgentConfirm, setDeleteAgentConfirm, mutationPalettes, currentMutationPalette, loadDashboardData, loadPublishedPeriods, handlePublishPeriod, handleNextMonth, handleCancelNextMonth, resetSiteContextState, selectSite, backToSites, changePeriod, handleFirstVisitOui, handleFirstVisitNon, handleFirstVisitIgnore, getPeriodLabel, currentMonthStr, isPastMonth, isEmptyPastMonth, isEmptyFutureMonth, isEmptyMonth, SITE_EMOJIS, handleUpdateSiteIcon, loadSiteData, openAddAgentModal, requireEditMode, openDeployExtraModal, handleDeployExtraSubmit, handleUpdateSubsiteConfig, openDeployReleveModal, handleDeployReleveSubmit, getPeriodsList, getDates, datesList, formatDateKey, handleCreateSite, handleRenameSite, handleDeleteSite, handleCreateSubsite, handleEditSpecialServiceClick, handleSaveSpecialService, handleEditAdminScheduleClick, handleSaveAdminSchedule, showEditAdminScheduleModal, setShowEditAdminScheduleModal, editAdminScheduleAgent, setEditAdminScheduleAgent, editAdminScheduleDays, setEditAdminScheduleDays, handleCreateAgentFromModal, handleDeleteAgent, confirmDeleteAgent, handleClearAgentMutations, handleDeleteSubsite, deleteZoneConfirmId, setDeleteZoneConfirmId, executeDeleteSubsite, handleInitPeriodRotation, handleArchivePeriod, handleResetYear, handleClearMutations, handleUpdateAgentField, getDayLabel, handleShiftChangeSubmit, handleApplyPattern, handleRenameSubsite, executeRenameSite, executeRenameSubsite, renderPatternOptions, handleMutateSubmit, openMutateModal, getDashboardStats, showAbsenceModal, absenceAgentId, absenceAgentName, absenceStartDate, absenceEndDate, absenceNavOffset, absenceManualDuration, editingAbsenceLeaveId, setShowAbsenceModal, setAbsenceAgentId, setAbsenceAgentName, setAbsenceStartDate, setAbsenceEndDate, setAbsenceNavOffset, setAbsenceManualDuration, setEditingAbsenceLeaveId, handleAbsenceSubmit, showMaladieModal, maladieAgentId, maladieAgentName, maladieStartDate, maladieEndDate, maladieNavOffset, maladieManualDuration, editingMaladieLeaveId, setShowMaladieModal, setMaladieAgentId, setMaladieAgentName, setMaladieStartDate, setMaladieEndDate, setMaladieNavOffset, setMaladieManualDuration, setEditingMaladieLeaveId, handleMaladieSubmit, permanentSuppModal, setPermanentSuppModal, handleSavePermanentSupps } = dashboardActions;

  const stats = getDashboardStats();

  if (loading && sites.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--b)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (!isArchiveMode && viewMode === 'archives') {
    return (
      <div style={{ paddingBottom: '40px' }}>
        <ArchivesPointage onSwitchToCurrent={() => setViewMode('current')} setView={setView} />
      </div>
    );
  }

  const handleRenameSiteInline = (e, siteId, currentName) => {
    e.stopPropagation();
    setRenameModalData({ siteId, currentName });
  };

  if (!activeSiteId) {
    return (
      <SiteSelector
        state={{
          isArchiveMode, isPastMonth, isVerificationMode, sites, viewMode, showSiteSettings, siteSortOrder, cardDesign,
          searchTerm, activeSiteId, period, settingsMenuRef, getSafePeriod,
          showRenameModalData: renameModalData, showFirstVisitModal, showAddSite, errorMsg, newSiteName, newSiteLocation, isSpecialSite, specialSiteType, customBehavior,
          showPublishModal, user, publishProgress, showFaqModal,
          showNextMonthModal, initializing, initProgress, sitesToKeepHS, showKeepHSModal,
          siteContextMenu, loading, showStats, showBlacklist, showDeleteSiteModal, deleteSiteData,
          lockedZones, getPeriodLabel, isEditMode, isEmptyMonth, isEmptyFutureMonth,
          publishedPeriods, datesList, showVerificationSites, showVerificationModal, showCalendar,
          showPublishReport, showPublishSuccess, leaves, cycleStart,
          expandedFaq, siteSearchTerm, enableAnimations, editModeBehavior, agentTableMode, showRenameSiteModal,
          isVerifying, publishing, draggedSite, iconPickerSiteId, highlightedAgentId, showAgentCountHover,
          renameModalData, pasteConfirmModal, globalAgents, siteOrder, siteData, renameSiteName, clipboardWeek,
          stats
        }}
        actions={{
          setViewMode, setShowSiteSettings, setSiteSortOrder, setCardDesign, setSearchTerm, setActiveSiteId, setActiveSiteName,
          setRenameModalData, executeRenameSite, handleFirstVisitNon, handleFirstVisitOui, handleFirstVisitIgnore,
          setShowAddSite, setNewSiteName, setNewSiteLocation, setIsSpecialSite, setSpecialSiteType, setCustomBehavior, handleCreateSite,
          setShowPublishModal, setShowFaqModal, setShowStats, setShowBlacklist, setShowDeleteSiteModal, setDeleteSiteData, setSites,
          setShowNextMonthModal, setShowKeepHSModal, handleNextMonth, handleCancelNextMonth, setIsEditMode, changePeriod,
          setShowVerificationSites, setShowVerificationModal, setShowCalendar, setShowPublishReport, setShowPublishSuccess,
          setExpandedFaq, setSiteSearchTerm, setEnableAnimations, setEditModeBehavior, setRobustBehavior,
          setAndSaveAgentTableMode, setSiteContextMenu, setShowRenameSiteModal,
          handleDragStart, handleDragOver, handleDragEnd, handleUpdateSiteIcon,
          handleRenameSiteInline, handlePublishPeriod, handleRenameSite,
          setIconPickerSiteId, setHighlightedAgentId, setShowAgentCountHover, setPasteConfirmModal,
          setSiteData, setClipboardWeek, setSitesToKeepHS, setRenameSiteName, setSiteOrder, setGlobalAgents,
          setContextMenu, selectSite, toggleAllZonesLock, setShowVerificationModal, setShowCalendar
        }}
      />
    );
  }

  return (
    <div onClick={() => { setContextMenu(null); setReposMenu(null); }}>
      {supplModal && (
        <div
          style={{
            position: 'fixed', top: supplModal.y, left: supplModal.x,
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '12px 16px', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            color: 'var(--text)', fontSize: '0.85rem'
          }}
          onMouseLeave={() => setSupplModal(null)}
          onClick={() => setSupplModal(null)}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#60a5fa' }}>Info Supplémentaire</div>
          <div>Ce pointage a été effectué sur : <br /><strong style={{ color: '#fff' }}>{supplModal.dest}</strong></div>
          {supplModal.type === 'releve' && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              <div>Remplaçant : <strong style={{ color: '#fff' }}>{supplModal.replacedAgentId || 'Aucun'}</strong></div>
              <div>Motif : <strong style={{ color: '#fff' }}>{supplModal.motif || 'Non précisé'}</strong></div>
            </div>
          )}
        </div>
      )}

      {(contextMenu || cellContextMenu.visible) && (
        <ContextMenu
          contextMenu={contextMenu || cellContextMenu}
          onClose={() => { setContextMenu(null); setCellContextMenu({ visible: false }); }}
          onAction={async (code, ctx) => {
            const agent = siteData.flatMap(s => s.agents).find(a => a && String(a.id) === String(ctx.agentId));
            if (code === 'T') {
              if (agent) {
                setTransferModalData({ agentId: ctx.agentId, dateKey: ctx.dateKey, shiftCode: ctx.shiftCode, agentName: agent.name });
                setShowTransferModal(true);
              }
            } else if (code === 'RENAME_AGENT') {
              if (agent) {
                setRenameAgentTarget(agent);
                setRenameAgentNewName(agent.name);
                setShowRenameAgentModal(true);
              }
            } else if (code === 'SUPPR') {
              setDeleteConfirmModal({ agentId: ctx.agentId, dateKey: ctx.dateKey, shiftCode: ctx.shiftCode });
            } else if (code === 'MUT') {
              if (agent) openMutateModal(agent);
            } else if (code === 'CHGT_VAC') {
              if (agent) {
                setShowShiftChangeMenu(agent);
                setShiftChangeDate(`${period}-01`);
                setShiftChangeNewType(agent.shift_type || 'Jour');
              }
            } else if (code === 'ADMIN_SCHEDULE') {
              if (agent) handleEditAdminScheduleClick(agent);
            } else if (code === 'PROFILE') {
              alert(`Ouverture du profil complet pour ${agent?.name} (Bientôt disponible)`);
            } else if (code === 'COPY_WEEK') {
              if (agent) {
                setClipboardWeek({ id: agent.id, name: agent.name, attendance: agent.attendance });
              }
            } else if (code === 'PASTE_WEEK') {
              if (!clipboardWeek) {
                alert("Erreur: Vous devez d'abord 'Copier la semaine' d'un agent !");
                return;
              }
              if (!agent) {
                alert("Erreur: Agent cible introuvable.");
                return;
              }
              const sourceAgent = typeof clipboardWeek === 'object' ? clipboardWeek : siteData.flatMap(s => s.agents).find(a => String(a.id) === String(clipboardWeek));
              if (!sourceAgent) {
                alert("Erreur: Agent source introuvable dans le presse-papiers.");
                return;
              }
              if (!sourceAgent.attendance || sourceAgent.attendance.length === 0) {
                alert("Erreur: L'agent source n'a aucun pointage à copier !");
                return;
              }
              setPasteConfirmModal({ sourceAgent, targetAgent: agent });
            } else if (code === 'WARN') {
              alert(`Avertissement enregistré pour ${agent?.name}`);
            } else if (code === 'MAP') {
              if (agent) {
                const dk = ctx.dateKey || formatDateKey(datesList[0]);
                const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'MAP' && l.start_date <= dk && l.end_date >= dk);
                setMapAgentId(agent.id);
                setMapAgentName(agent.name);
                setMapStartDate(existingLeave ? existingLeave.start_date : dk);
                setMapEndDate(existingLeave ? existingLeave.end_date : dk);
                setMapNavOffset(0);
                setMapManualDuration('');
                setShowMapModal(true);
              }
            } else if (code === 'M') {
              if (agent) {
                const dk = ctx.dateKey || formatDateKey(datesList[0]);
                const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'M' && l.start_date <= dk && l.end_date >= dk);
                setMaladieAgentId(agent.id);
                setMaladieAgentName(agent.name);
                setMaladieStartDate(existingLeave ? existingLeave.start_date : dk);
                setMaladieEndDate(existingLeave ? existingLeave.end_date : dk);
                setMaladieNavOffset(0);
                setMaladieManualDuration('');
                setShowMaladieModal(true);
              }
            } else if (code === 'A') {
              if (agent) {
                const dk = ctx.dateKey || formatDateKey(datesList[0]);
                const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'A' && l.start_date <= dk && l.end_date >= dk);
                setAbsenceAgentId(agent.id);
                setAbsenceAgentName(agent.name);
                setAbsenceStartDate(existingLeave ? existingLeave.start_date : dk);
                setAbsenceEndDate(existingLeave ? existingLeave.end_date : dk);
                setAbsenceNavOffset(0);
                setAbsenceManualDuration('');
                setShowAbsenceModal(true);
              }
            } else if (code === 'CP') {
              if (agent) {
                const dk = ctx.dateKey || formatDateKey(datesList[0]);
                const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'CP' && l.end_date >= dk);
                const overlapsClickedDate = existingLeave && existingLeave.start_date <= dk && existingLeave.end_date >= dk;

                if (existingLeave && !overlapsClickedDate) {
                  setCpWarningModal({ agent, existingLeave, dateKey: dk });
                } else {
                  setCpAgentId(agent.id);
                  setCpAgentName(agent.name);
                  setCpStartDate(existingLeave ? existingLeave.start_date : dk);
                  setCpEndDate(existingLeave ? existingLeave.end_date : dk);
                  setShowCpModal(true);
                }
              }
            } else if (code === 'P') {
              if (agent) {
                const dk = ctx.dateKey || formatDateKey(datesList[0]);
                const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'P' && l.start_date <= dk && l.end_date >= dk);
                setPermissionAgentId(agent.id);
                setPermissionAgentName(agent.name);
                setPermissionStartDate(existingLeave ? existingLeave.start_date : dk);
                setPermissionEndDate(existingLeave ? existingLeave.end_date : dk);
                setShowPermissionModal(true);
              }
            } else if (code === 'ENTRANT' || code === 'REINTEGRATION') {
              if (agent) {
                setEntrantAgentId(agent.id);
                setEntrantAgentName(agent.name);
                setEntrantDate(ctx.dateKey || formatDateKey(datesList[0]));
                setEntrantFunction(agent.function || '');
                setShowEntrantModal(true);
              }
            } else if (code === 'SORTANT') {
              if (agent) {
                setSortantAgentId(agent.id);
                setSortantAgentName(agent.name);
                setSortantDate(ctx.dateKey || formatDateKey(datesList[0]));
                setSortantType('ABANDON');
                setShowSortantModal(true);
              }
            } else if (code === 'CHGT_STATUT') {
              if (agent) {
                setChgtStatutAgent(agent);
                setChgtStatutDate(ctx.dateKey || formatDateKey(datesList[0]));
                setChgtStatutNewFunction('');
                setChgtStatutReason('');
                setChgtStatutColorNew(false);
                setShowChgtStatutModal(true);
              }
            } else if (code === 'DEPLOY_RELEVE') {
              if (agent) {
                setDeployReleveDefaultAgentId(agent.id);
                setDeployReleveDefaultDate(ctx.dateKey || formatDateKey(datesList[0]));
                setShowDeployReleve(true);
              }
            } else if (code === 'SUPPL_REMPLACANT') {
              setExternalSuppModal(true);
            } else {
              handleCellClick(ctx.agentId, ctx.dateKey, ctx.shiftCode, '', code);
            }
          }}
        />
      )}

      {reposMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setReposMenu(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '360px', padding: '16px', animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📅 Choisir le jour de repos
              </h3>
              <button
                onClick={() => setReposMenu(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button style={{
                padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', color: '#f1f5f9',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', marginBottom: '8px'
              }} onClick={() => {
                handleEditAdminScheduleClick(reposMenu.agentId);
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateX(4px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = '#f1f5f9';
                e.currentTarget.style.transform = 'none';
              }}>
                <span>Repos Personnalisé</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>→</span>
              </button>

              <button style={{
                padding: '12px 16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', color: '#22c55e',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', marginBottom: '8px'
              }} onClick={() => {
                handleAssignRepos(reposMenu.agentId, []);
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.transform = 'none';
              }}>
                <span>Désactiver repos par défaut</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>→</span>
              </button>

              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', marginTop: '4px' }}>Ou choisir un jour unique :</div>
              {[
                { day: 1, label: 'Lundi' },
                { day: 2, label: 'Mardi' },
                { day: 3, label: 'Mercredi' },
                { day: 4, label: 'Jeudi' },
                { day: 5, label: 'Vendredi' },
                { day: 6, label: 'Samedi' },
                { day: 0, label: 'Dimanche' }
              ].map(opt => (
                <button key={opt.day} style={{
                  padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', color: '#f1f5f9',
                  textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease'
                }} onClick={() => {
                  handleAssignRepos(reposMenu.agentId, opt.day);
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#f1f5f9';
                  e.currentTarget.style.transform = 'none';
                }}>
                  <span>{opt.label}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ZenModeButton isZenMode={isZenMode} setIsZenMode={setIsZenMode} />

      {!isZenMode && (
        <TopBar
          onBack={onBack}
          backToSites={backToSites}
          onSwitchToCurrent={onSwitchToCurrent}
          archivePeriod={archiveData ? archiveData.period : ''}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          filterShiftType={filterShiftType}
          setFilterShiftType={setFilterShiftType}
          filterFunction={filterFunction}
          setFilterFunction={setFilterFunction}
          functions={functions}
          filterShowOnlyAbsences={filterShowOnlyAbsences}
          setFilterShowOnlyAbsences={setFilterShowOnlyAbsences}
          paintModeActive={paintModeActive}
          setPaintModeActive={setPaintModeActive}
          paintStatus={paintStatus}
          setPaintStatus={setPaintStatus}
          activeSiteId={activeSiteId}
          isVerificationMode={isVerificationMode}
          isArchiveMode={isArchiveMode}
          sites={sites}
          setShowAddSubsite={requireEditMode(setShowAddSubsite)}
          openAddAgentModal={openAddAgentModal}
          openDeployExtraModal={requireEditMode(openDeployExtraModal)}
          openDeployReleveModal={requireEditMode(openDeployReleveModal)}
          isReturnToPayroll={!!returnToPayrollId}
          returnSource={returnSource}
          onReturnToPayroll={handleReturnToPayroll}
          currentSiteAgents={siteData.flatMap(s => s.agents || [])}
          datesList={datesList}
          period={period}
          siteData={siteData}
          lockedZones={lockedZones}
          toggleAllZonesLock={toggleAllZonesLock}
          showKPICards={showKPICards}
          setShowKPICards={setShowKPICards}
          handleResetYear={requireEditMode(handleResetYear)}
          stats={stats}
          openManageFunctionsModal={requireEditMode(() => setShowManageFunctionsModal(true))}
          siteTableModes={siteTableModes}
          setAndSaveSiteTableMode={requireEditMode(setAndSaveSiteTableMode)}
          agentSpacingMode={agentSpacingMode}
          setAndSaveAgentSpacingMode={requireEditMode(setAndSaveAgentSpacingMode)}
          agentTableMode={agentTableMode}
          agentSortOrder={agentSortOrder}
          setAndSaveAgentSortOrder={requireEditMode(setAndSaveAgentSortOrder)}
          zoneSortOrder={zoneSortOrder}
          setAndSaveZoneSortOrder={requireEditMode(setAndSaveZoneSortOrder)}
        />
      )}

      {showManageFunctionsModal && (
        <ManageFunctionsModal
          onClose={() => setShowManageFunctionsModal(false)}
          functions={functions}
          setFunctions={setFunctions}
        />
      )}

      {!isArchiveMode && publishedPeriods.includes(period) && activeSiteId && (
        <div className="locked-period-alert" style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: '12px', padding: '12px 20px',
          marginTop: '16px', marginBottom: '4px',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
              Pointage verrouillé — Période publiée
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
              Le pointage de <strong style={{ color: '#fcd34d' }}>{getPeriodLabel()}</strong> a été publié et transmis à la Comptabilité.
              Toute tentative de modification sera bloquée par le système.
            </div>
          </div>
          <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, border: '1px solid rgba(245,158,11,0.3)' }}>
            LECTURE SEULE
          </span>
        </div>
      )}

      <div ref={kpiAnchorRef} style={{ width: '100%', height: '1px' }}></div>
      {siteData.length > 0 && showKPICards && activeSiteId !== 'site_administration' && (
        <div
          onMouseDown={selectedKpiAgent && isScrolled ? handleKpiMouseDown : undefined}
          style={selectedKpiAgent && isScrolled ? {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: `translate(calc(-50% + ${kpiPos.x}px), ${kpiPos.y}px)`,
            cursor: isDraggingKpi ? 'grabbing' : 'grab',
            width: 'calc(100% - 48px)',
            maxWidth: '1400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            padding: '20px',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
          } : {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            margin: '0 0 24px 0',
            padding: '16px 0',
            position: 'relative',
            animation: 'fadeIn 0.5s ease-out'
          }}>
          {selectedKpiAgent && (
            <button
              onClick={() => { setSelectedKpiAgent(null); setKpiPos({ x: 0, y: 0 }); }}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                zIndex: 10
              }}
            >
              ✕
            </button>
          )}
          {!selectedKpiAgent ? (
            <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.15)' }}>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>👆 Cliquez sur le <strong style={{ color: 'white' }}>nom d'un agent</strong> dans le tableau pour afficher son aperçu salarial.</p>
            </div>
          ) : (() => {
            const agentFunc = selectedKpiAgent.function || '';
            let baseSalary = 0;
            let scObj = null;
            if (selectedKpiAgent.status_change) {
              try { scObj = JSON.parse(selectedKpiAgent.status_change); } catch (e) { }
            }

            let baseSalaryOld = salaryGrid[scObj ? scObj.old_function : agentFunc] || 0;
            let baseSalaryNew = salaryGrid[scObj ? scObj.new_function : agentFunc] || 0;

            if (selectedKpiAgent.salary && parseInt(selectedKpiAgent.salary) > 0) {
              baseSalaryOld = parseInt(selectedKpiAgent.salary);
              baseSalaryNew = parseInt(selectedKpiAgent.salary);
            }

            if (!scObj) {
              baseSalary = baseSalaryOld;
            }

            let overtimes = 0;
            let overtimesGains = 0;
            let overtimesGainsOld = 0;
            let overtimesGainsNew = 0;
            let absenceDays = 0;
            let absenceDaysOld = 0;
            let absenceDaysNew = 0;
            let cost_count = 0;
            let cost_countOld = 0;
            let cost_countNew = 0;
            let dynamicFuncCounts = {};
            let dynamicFuncCountsOld = {};
            let dynamicFuncCountsNew = {};
            const mutatedDates = new Set();
            const ABSENCE_CODES = ['AB', 'A', 'M', 'P', 'MAP', 'ENTRANT', 'REINTEGRATION', 'SORTANT', 'DEMISSION', 'ABANDON'];

            const dkSet = new Set(datesList.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`));

            const activeDatesSet = new Set();
            const activeDatesOldSet = new Set();
            const activeDatesNewSet = new Set();

            const specialBase = (selectedKpiAgent.profile_data && selectedKpiAgent.profile_data.special_service)
              ? (selectedKpiAgent.profile_data.special_service_base || 12)
              : 30;

            (selectedKpiAgent.attendance || []).forEach(att => {
              if (!dkSet.has(att.date)) return;

              const st = String(att.status);
              if (st.startsWith('M|') || st.startsWith('PM|')) {
                mutatedDates.add(att.date);
              } else if (st !== '') {
                activeDatesSet.add(att.date);
                if (scObj && att.date < scObj.date) {
                  activeDatesOldSet.add(att.date);
                } else if (scObj && att.date >= scObj.date) {
                  activeDatesNewSet.add(att.date);
                }
              }

              if (att.shift_code === 'S' || att.shift_code === 'SJ' || att.shift_code === 'SN') {
                if (att.status !== 'A' && att.status !== 'R') {
                  overtimes++;

                  let agentBaseForSp = baseSalary;
                  if (scObj) {
                    agentBaseForSp = (att.date < scObj.date) ? baseSalaryOld : baseSalaryNew;
                  }

                  let gainSp = agentBaseForSp / specialBase;

                  if (st.startsWith('Suppl|') || st === 'Suppl_Dest') {
                    const parts = st.split('|');
                    let repFunc = parts[4]; 

                    if (!repFunc && selectedKpiAgent.replaced_functions && selectedKpiAgent.replaced_functions.length > 0) {
                      let maxS = -1;
                      selectedKpiAgent.replaced_functions.forEach(f => {
                        const s = salaryGrid[f] || 75000;
                        if (s > maxS) {
                          maxS = s;
                          repFunc = f;
                        }
                      });
                    }

                    // On cherche la base de l'agent remplacé (soit directement, soit via functions array)
                    let replacedBase = null;
                    if (repFunc) {
                      if (salaryGrid[repFunc]) {
                        replacedBase = salaryGrid[repFunc];
                      } else if (functions && functions.length > 0) {
                        const fMatch = functions.find(f => f.short_name === repFunc || f.name === repFunc);
                        if (fMatch && salaryGrid[fMatch.id]) {
                          replacedBase = salaryGrid[fMatch.id];
                        }
                      }
                    }

                    if (replacedBase) {
                      const agentDaily = agentBaseForSp / specialBase;
                      const replacedDaily = replacedBase / specialBase;

                      if (replacedDaily > agentDaily) {
                        gainSp = replacedDaily - agentDaily;
                      } else {
                        gainSp = replacedDaily;
                      }
                    }
                  }

                  if (scObj && att.date < scObj.date) {
                    overtimesGainsOld += gainSp;
                  } else if (scObj && att.date >= scObj.date) {
                    overtimesGainsNew += gainSp;
                  } else {
                    overtimesGains += gainSp;
                  }
                }
              } else if (att.status && !st.startsWith('M|') && !st.startsWith('PM|') && ABSENCE_CODES.some(c => att.status === c || st.startsWith(c + '|'))) {
                absenceDays++;
                if (scObj && att.date < scObj.date) absenceDaysOld++;
                else if (scObj && att.date >= scObj.date) absenceDaysNew++;
              }

              if (st === 'COST' || st.startsWith('COST|')) {
                cost_count++;
                if (scObj && att.date < scObj.date) cost_countOld++;
                else if (scObj && att.date >= scObj.date) cost_countNew++;
              } else if (st.startsWith('F_')) {
                const fcode = st.substring(2);
                dynamicFuncCounts[fcode] = (dynamicFuncCounts[fcode] || 0) + 1;
                if (scObj && att.date < scObj.date) {
                  dynamicFuncCountsOld[fcode] = (dynamicFuncCountsOld[fcode] || 0) + 1;
                } else if (scObj && att.date >= scObj.date) {
                  dynamicFuncCountsNew[fcode] = (dynamicFuncCountsNew[fcode] || 0) + 1;
                }
              }
            });

            if (datesList.length > 30) {
              const surplus = datesList.length - 30;
              let entrantSortantCount = 0;
              (selectedKpiAgent.attendance || []).forEach(att => {
                if (!dkSet.has(att.date)) return;
                const st = String(att.status);
                if (st === 'ENTRANT' || st === 'REINTEGRATION' || ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || st.startsWith('SORTANT_')) {
                  entrantSortantCount++;
                }
              });
              
              if (entrantSortantCount > 0) {
                const adjust = Math.min(entrantSortantCount, surplus);
                absenceDays = Math.max(0, absenceDays - adjust);
                if (scObj) {
                  if (absenceDaysNew > 0) absenceDaysNew = Math.max(0, absenceDaysNew - adjust);
                  else if (absenceDaysOld > 0) absenceDaysOld = Math.max(0, absenceDaysOld - adjust);
                }
              }
            }

            let activeDays = specialBase;
            let realActive = datesList.length;
            let activeDaysOld = 0;
            let activeDaysNew = 0;

            const is244872 = ['24h', '48h', '72h'].includes(String(selectedKpiAgent.shift_type).toLowerCase());
            let totalRuptureKpi = 0;
            (selectedKpiAgent.attendance || []).forEach(att => {
              if (!dkSet.has(att.date)) return;
              const st = String(att.status);
              if (st === 'ENTRANT' || st === 'REINTEGRATION' || ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || st.startsWith('SORTANT_') || st.startsWith('M|')) {
                totalRuptureKpi++;
              }
            });

            if (is244872 && totalRuptureKpi > 0) {
              let totalRealWorkedUnits = 0;
              (selectedKpiAgent.attendance || []).forEach(att => {
                if (dkSet.has(att.date) && att.status === '1') {
                   totalRealWorkedUnits++;
                }
              });
              absenceDays = Math.max(0, specialBase - totalRealWorkedUnits);
              
              if (scObj) {
                  absenceDaysOld = 0;
                  absenceDaysNew = absenceDays;
              }
            }

            if (selectedKpiAgent.is_mutated && !selectedKpiAgent.is_extra && !selectedKpiAgent.is_releve) {
              realActive = activeDatesSet.size;
              activeDays = realActive === 0 ? 0 : Math.round(realActive * specialBase / datesList.length);
            } else {
              const mutatedDays = mutatedDates.size;
              realActive = datesList.length - mutatedDays;
              activeDays = mutatedDays === 0 ? specialBase : Math.round(realActive * specialBase / datesList.length);
            }

            if (scObj) {
              const totalActive = activeDatesOldSet.size + activeDatesNewSet.size;
              if (totalActive > 0) {
                activeDaysOld = Math.round((activeDatesOldSet.size / totalActive) * activeDays);
                activeDaysNew = activeDays - activeDaysOld;
              } else {
                let countOld = 0;
                let countNew = 0;
                datesList.forEach(d => {
                  const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  if (dk < scObj.date) countOld++;
                  else countNew++;
                });
                const totalD = countOld + countNew;
                if (totalD > 0) {
                  activeDaysOld = Math.round((countOld / totalD) * activeDays);
                  activeDaysNew = activeDays - activeDaysOld;
                }
              }
            }

            let prorataBase = 0;
            let deductions = 0;
            let gains = 0;

            let costBase = salaryGrid['Costume'] || salaryGrid['A-C'] || 90000;
            let costBonus = 0;
            let dynamicBonus = 0;

            if (scObj) {
              prorataBase = Math.round(baseSalaryOld * (activeDaysOld / 30)) + Math.round(baseSalaryNew * (activeDaysNew / 30));
              deductions = Math.round((baseSalaryOld / 30) * absenceDaysOld) + Math.round((baseSalaryNew / 30) * absenceDaysNew);
              gains = Math.round(overtimesGainsOld) + Math.round(overtimesGainsNew);
              costBonus = Math.round(cost_countOld * ((costBase / 30) - (baseSalaryOld / 30))) + Math.round(cost_countNew * ((costBase / 30) - (baseSalaryNew / 30)));

              Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cOld = dynamicFuncCountsOld[fcode] || 0;
                const cNew = dynamicFuncCountsNew[fcode] || 0;
                dynamicBonus += Math.round(cOld * ((fBase / 30) - (baseSalaryOld / 30))) + Math.round(cNew * ((fBase / 30) - (baseSalaryNew / 30)));
              });
            } else {
              prorataBase = Math.round(baseSalary * (activeDays / 30));
              const dailyRate = baseSalary / 30;
              deductions = Math.round(dailyRate * absenceDays);
              gains = Math.round(overtimesGains);
              costBonus = Math.round(cost_count * ((costBase / 30) - dailyRate));

              Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cCount = dynamicFuncCounts[fcode] || 0;
                dynamicBonus += Math.round(cCount * ((fBase / 30) - dailyRate));
              });
            }

            if (selectedKpiAgent.is_mutated) {
              prorataBase = 0;
            }

            if (costBonus > 0) {
              gains += costBonus;
            }
            if (dynamicBonus > 0) {
              gains += dynamicBonus;
            }

            const netSalary = Math.max(0, prorataBase + gains - deductions);
            return (
              <>
                <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.4rem' }}>💰</span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                      Salaire de base — <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: 'normal' }}>{selectedKpiAgent.name}</span>
                    </p>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                      {scObj ?
                        `${baseSalaryOld.toLocaleString('fr-FR')} / ${baseSalaryNew.toLocaleString('fr-FR')}` :
                        (baseSalary > 0 ? baseSalary.toLocaleString('fr-FR') : '—')
                      } <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>CFA</span>
                    </h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>
                      Fonction: {scObj ? `${scObj.old_function || '-'} / ${scObj.new_function || '-'}` : (agentFunc || 'Non définie')}
                    </p>
                  </div>
                </div>

                <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.4rem' }}>⏱️</span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Bonus et Supp.</p>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                      {overtimes > 0 && <span>{overtimes} vac(s)</span>}
                      {overtimes > 0 && cost_count > 0 && <span> • </span>}
                      {cost_count > 0 && <span>{cost_count} COST (+{costBonus.toLocaleString('fr-FR')})</span>}
                      {(overtimes > 0 || cost_count > 0) && Object.keys(dynamicFuncCounts).length > 0 && <span> • </span>}
                      {Object.keys(dynamicFuncCounts).map((fcode, i) => (
                        <span key={fcode}>
                          {i > 0 && ' • '}
                          {dynamicFuncCounts[fcode]} {fcode}
                        </span>
                      ))}
                      {dynamicBonus > 0 && <span> (+{dynamicBonus.toLocaleString('fr-FR')})</span>}
                      {overtimes === 0 && cost_count === 0 && Object.keys(dynamicFuncCounts).length === 0 && <span>0</span>}
                    </h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>Absences déduites: {absenceDays} jour(s)</p>
                  </div>
                </div>

                <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.4rem' }}>💵</span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Salaire net (Aperçu)</p>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                      {netSalary > 0 ? netSalary.toLocaleString('fr-FR') : '—'} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>CFA</span>
                    </h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>
                      {selectedKpiAgent.is_mutated ? 'Supp. uniquement (Déplacement) − Absences' : `${realActive < datesList.length ? `Prorata (${realActive}j)` : 'Base'} + Supp. − Absences (${absenceDays}j)`}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {(loading && siteData.length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
        </div>
      ) : (!loading && siteData.length === 0) ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '24px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--c)', marginBottom: '16px' }} />
          <h3>Aucune zone ou agent sur ce site</h3>
          <p className="subtitle" style={{ marginTop: '8px' }}>Commencez par ajouter une zone, puis des agents.</p>
        </div>
      ) : (
        <div style={{
          opacity: loading ? 0.65 : 1,
          pointerEvents: loading ? 'none' : 'auto',
          transition: 'opacity 0.2s ease-in-out',
          userSelect: isSelecting ? 'none' : 'auto'
        }}>
          <DashboardTable
            siteData={siteData}
            datesList={datesList}
            period={period}
            activeSiteId={activeSiteId}
            isArchiveMode={isArchiveMode}
            isVerificationMode={isVerificationMode}
            searchTerm={searchTerm}
            filterShiftType={filterShiftType}
            filterFunction={filterFunction}
            filterShowOnlyAbsences={filterShowOnlyAbsences}
            zoneSortOrder={zoneSortOrder}
            agentSortOrder={agentSortOrder}
            agentSpacingMode={agentSpacingMode}
            agentTableMode={agentTableMode}
            costumeModes={costumeModes}
            setCostumeModes={setCostumeModes}
            functionModes={functionModes}
            setFunctionModes={setFunctionModes}
            leaves={leaves}
            functions={functions}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            isSelecting={isSelecting}
            setIsSelecting={setIsSelecting}
            setSelectionStart={setSelectionStart}
            setSelectionEnd={setSelectionEnd}
            selectedCell={selectedCell}
            setSelectedCell={setSelectedCell}
            handleCellClick={handleCellClick}
            setContextMenu={setContextMenu}
            setCellContextMenu={setCellContextMenu}
            setSupplModal={setSupplModal}
            setPermanentSuppModal={setPermanentSuppModal}
            setReposMenu={setReposMenu}
            setSelectedKpiAgent={setSelectedKpiAgent}
            setShowKPICards={setShowKPICards}
            cellContextMenu={cellContextMenu}
            isEditMode={isEditMode}
            lockedAbsences={lockedAbsences}
            setLockedAbsences={setLockedAbsences}
            lockedMaps={lockedMaps}
            setLockedMaps={setLockedMaps}
            lockedPermissions={lockedPermissions}
            setLockedPermissions={setLockedPermissions}
            setCpAgentId={setCpAgentId}
            setCpAgentName={setCpAgentName}
            setCpStartDate={setCpStartDate}
            setCpEndDate={setCpEndDate}
            setShowCpModal={setShowCpModal}
            setCpInfoModal={setCpInfoModal}
            setExternalSuppModal={setExternalSuppModal}
            setExternalSuppDetailsModal={setExternalSuppDetailsModal}
            setMoveZoneAgent={setMoveZoneAgent}
            loadSiteData={loadSiteData}
            onEditSpecialService={handleEditSpecialServiceClick}
            lockedZones={lockedZones}
            toggleZoneLock={toggleZoneLock}
            setScheduleModalAgent={setScheduleModalAgent}
            handleUpdateAgentField={handleUpdateAgentField}
            deleteZoneConfirmId={deleteZoneConfirmId}
            setDeleteZoneConfirmId={setDeleteZoneConfirmId}
            executeDeleteSubsite={executeDeleteSubsite}
            handleClearAgentMutations={handleClearAgentMutations}
            handleDeleteAgent={handleDeleteAgent}
            setFunctionModalAgent={setFunctionModalAgent}
            setShiftModalAgent={setShiftModalAgent}
            setShiftModalType={setShiftModalType}
            setShowCustomRotation={setShowCustomRotation}
            setStatusChangeInfoModal={setStatusChangeInfoModal}
            openDeployExtraModal={openDeployExtraModal}
            openDeployReleveModal={openDeployReleveModal}
            requireEditMode={requireEditMode}
            getDayLabel={getDayLabel}
            formatDateKey={formatDateKey}
            getPeriodLabel={getPeriodLabel}
            sites={sites}
            setZoneConfigModalData={setZoneConfigModalData}
            handleRenameSubsite={handleRenameSubsite}
            handleDeleteSubsite={handleDeleteSubsite}
            activeSiteName={activeSiteName}
            setTransferModal={setTransferModal}
            setReleveSupplModal={setReleveSupplModal}
            setPermissionDetailsModal={setPermissionDetailsModal}
            paintModeActive={paintModeActive}
            paintStatus={paintStatus}
            siteTableModes={siteTableModes}
            savingCells={savingCells}
            openMutateModal={openMutateModal}
            setShowShiftChangeMenu={setShowShiftChangeMenu}
            setShiftChangeDate={setShiftChangeDate}
            setShiftChangeNewType={setShiftChangeNewType}
            setMapAgentId={setMapAgentId}
            setMapAgentName={setMapAgentName}
            setMapStartDate={setMapStartDate}
            setMapEndDate={setMapEndDate}
            setMapNavOffset={setMapNavOffset}
            setMapManualDuration={setMapManualDuration}
            setShowMapModal={setShowMapModal}
            setPermissionAgentId={setPermissionAgentId}
            setPermissionAgentName={setPermissionAgentName}
            setPermissionStartDate={setPermissionStartDate}
            setPermissionEndDate={setPermissionEndDate}
            setShowPermissionModal={setShowPermissionModal}
            setEntrantAgentId={setEntrantAgentId}
            setEntrantAgentName={setEntrantAgentName}
            setEntrantDate={setEntrantDate}
            setShowEntrantModal={setShowEntrantModal}
            setSortantAgentId={setSortantAgentId}
            setSortantAgentName={setSortantAgentName}
            setSortantDate={setSortantDate}
            setShowSortantModal={setShowSortantModal}
            enableAnimations={enableAnimations}
            setEnableAnimations={setEnableAnimations}
            clipboardWeek={clipboardWeek}
            setClipboardWeek={setClipboardWeek}
            pasteConfirmModal={pasteConfirmModal}
            setPasteConfirmModal={setPasteConfirmModal}
            isZenMode={isZenMode}
            setIsZenMode={setIsZenMode}
            statsCardScale={statsCardScale}
            setStatsCardScale={setStatsCardScale}
            showAgentCountHover={showAgentCountHover}
            setShowTransferDetailsModal={setShowTransferDetailsModal}
            setTransferDetailsData={setTransferDetailsData}
            highlightedAgentId={highlightedAgentId}
            setHighlightedAgentId={setHighlightedAgentId}
          />
        </div>
      )}

      {showAddSite && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Ajouter un nouveau site</h3>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
            <form onSubmit={handleCreateSite}>
              <div className="form-group">
                <label className="form-label">Nom du site</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Site A"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSite(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSubsite && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>{activeSiteId === 'site_administration' ? 'Ajouter un nouveau Département' : 'Ajouter une nouvelle Zone'}</h3>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
            <form onSubmit={handleCreateSubsite}>
              <div className="form-group">
                <label className="form-label">{activeSiteId === 'site_administration' ? 'Nom du Département' : 'Nom de la Zone / Secteur'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={activeSiteId === 'site_administration' ? 'ex: Comptabilité' : 'ex: Zone Sud'}
                  value={newSubsiteName}
                  onChange={(e) => setNewSubsiteName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubsite(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{activeSiteId === 'site_administration' ? 'Créer le département' : 'Créer la zone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEntrantModal && (
        <EntrantModal
          agentName={entrantAgentName}
          startDate={entrantDate}
          onStartDateChange={setEntrantDate}
          functionName={entrantFunction}
          onFunctionChange={setEntrantFunction}
          onClose={() => setShowEntrantModal(false)}
          onSubmit={handleConfirmEntrant}
        />
      )}

      {showSortantModal && (
        <SortantModal
          agentName={sortantAgentName}
          sortantType={sortantType}
          onSortantTypeChange={setSortantType}
          customReason={sortantCustomReason}
          onCustomReasonChange={setSortantCustomReason}
          startDate={sortantDate}
          onStartDateChange={setSortantDate}
          onClose={() => setShowSortantModal(false)}
          onSubmit={handleConfirmSortant}
        />
      )}

      {cpWarningModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setCpWarningModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, background: '#1e293b', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '20px', padding: '30px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#60a5fa', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span> Congé déjà existant
            </h3>
            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
              L'agent <strong style={{ color: '#fff' }}>{cpWarningModal.agent.name}</strong> a déjà un Congé Payé enregistré du <strong style={{ color: '#fff' }}>{cpWarningModal.existingLeave.start_date.split('-').reverse().join('/')}</strong> au <strong style={{ color: '#fff' }}>{cpWarningModal.existingLeave.end_date.split('-').reverse().join('/')}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="hover-bg-light"
                style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: 600 }}
                onClick={() => {
                  setCreateNewCpMode(false);
                  setCpAgentId(cpWarningModal.agent.id);
                  setCpAgentName(cpWarningModal.agent.name);
                  setCpStartDate(cpWarningModal.existingLeave.start_date);
                  setCpEndDate(cpWarningModal.existingLeave.end_date);
                  setCpWarningModal(null);
                  setShowCpModal(true);
                }}
              >
                ✏️ Modifier l'ancien congé
              </button>
              <button
                style={{ padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                onClick={() => {
                  setCreateNewCpMode(true);
                  setCpAgentId(cpWarningModal.agent.id);
                  setCpAgentName(cpWarningModal.agent.name);
                  setCpStartDate(cpWarningModal.dateKey);
                  setCpEndDate(cpWarningModal.dateKey);
                  setCpWarningModal(null);
                  setShowCpModal(true);
                }}
              >
                ➕ Créer un nouveau à cette date
              </button>
              <button
                style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginTop: '4px', fontWeight: 600 }}
                onClick={() => setCpWarningModal(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showCpModal && (
        <CpModal
          agentName={cpAgentName}
          startDate={cpStartDate}
          endDate={cpEndDate}
          onStartDateChange={setCpStartDate}
          onEndDateChange={setCpEndDate}
          onClose={() => { setShowCpModal(false); setEditingCpLeaveId(null); }}
          onSubmit={handleCpSubmit}
        />
      )}

      {showPermissionModal && (
        <PermissionModal
          agentName={permissionAgentName}
          startDate={permissionStartDate}
          endDate={permissionEndDate}
          onStartDateChange={setPermissionStartDate}
          onEndDateChange={setPermissionEndDate}
          onClose={() => { setShowPermissionModal(false); setEditingPermissionLeaveId(null); }}
          onSubmit={handlePermissionSubmit}
        />
      )}

      <OverlapWarningModal
        overlapWarning={overlapWarning}
        setOverlapWarning={setOverlapWarning}
      />

      {showAbsenceModal && (
        <AbsenceModal
          agentName={absenceAgentName}
          period={period}
          cycleStart={cycleStart}
          absenceNavOffset={absenceNavOffset}
          setAbsenceNavOffset={setAbsenceNavOffset}
          startDate={absenceStartDate}
          endDate={absenceEndDate}
          onStartDateChange={setAbsenceStartDate}
          onEndDateChange={setAbsenceEndDate}
          manualDuration={absenceManualDuration}
          onManualDurationChange={setAbsenceManualDuration}
          onClose={() => { setShowAbsenceModal(false); setEditingAbsenceLeaveId(null); }}
          onSubmit={handleAbsenceSubmit}
          getSafePeriod={getSafePeriod}
          formatDateKey={formatDateKey}
          getDayLabel={getDayLabel}
        />
      )}

      {showMaladieModal && (
        <MaladieModal
          agentName={maladieAgentName}
          period={period}
          cycleStart={cycleStart}
          maladieNavOffset={maladieNavOffset}
          setMaladieNavOffset={setMaladieNavOffset}
          startDate={maladieStartDate}
          endDate={maladieEndDate}
          onStartDateChange={setMaladieStartDate}
          onEndDateChange={setMaladieEndDate}
          manualDuration={maladieManualDuration}
          onManualDurationChange={setMaladieManualDuration}
          onClose={() => { setShowMaladieModal(false); setEditingMaladieLeaveId(null); }}
          onSubmit={handleMaladieSubmit}
          getSafePeriod={getSafePeriod}
          formatDateKey={formatDateKey}
          getDayLabel={getDayLabel}
        />
      )}

      {showMapModal && (
        <MapModal
          agentName={mapAgentName}
          period={period}
          cycleStart={cycleStart}
          mapNavOffset={mapNavOffset}
          setMapNavOffset={setMapNavOffset}
          startDate={mapStartDate}
          endDate={mapEndDate}
          onStartDateChange={setMapStartDate}
          onEndDateChange={setMapEndDate}
          manualDuration={mapManualDuration}
          onManualDurationChange={setMapManualDuration}
          onClose={() => { setShowMapModal(false); setEditingMapLeaveId(null); }}
          onSubmit={handleMapSubmit}
          getSafePeriod={getSafePeriod}
          formatDateKey={formatDateKey}
          getDayLabel={getDayLabel}
        />
      )}

      {showEditAdminScheduleModal && editAdminScheduleAgent && (
        <AdminScheduleModal
          isOpen={showEditAdminScheduleModal}
          onClose={() => {
            setShowEditAdminScheduleModal(false);
            setEditAdminScheduleAgent(null);
          }}
          adminScheduleDays={editAdminScheduleDays}
          setAdminScheduleDays={setEditAdminScheduleDays}
          onValidate={handleSaveAdminSchedule}
        />
      )}

      {showDeployExtra && (
        <DeployExtraModal
          extraAgents={extraAgents}
          onClose={() => setShowDeployExtra(false)}
          onSubmit={handleDeployExtraSubmit}
        />
      )}

      {showDeployReleve && (
        <DeployReleveModal
          releveAgents={releveAgents}
          currentSiteAgents={siteData.flatMap(s => s.agents || [])}
          onClose={() => setShowDeployReleve(false)}
          onSubmit={handleDeployReleveSubmit}
        />
      )}

      {showAddAgent && (
        <AddAgentModal
          siteData={siteData}
          allSites={sites}
          globalAgents={globalAgents}
          activeSiteId={activeSiteId}
          functions={functions}
          onClose={() => setShowAddAgent(false)}
          onSubmit={handleCreateAgentFromModal}
          errorMsg={errorMsg}
          period={period}
          datesList={datesList}
        />
      )}

      {showEditSpecialServiceModal && editSpecialServiceAgent && (
        <SpecialServiceModal
          isOpen={showEditSpecialServiceModal}
          onClose={() => {
            setShowEditSpecialServiceModal(false);
            setEditSpecialServiceAgent(null);
          }}
          specialServiceBase={editSpecialServiceBase}
          setSpecialServiceBase={setEditSpecialServiceBase}
          specialServiceDays={editSpecialServiceDays}
          setSpecialServiceDays={setEditSpecialServiceDays}
          isEntrant={editSpecialServiceIsEntrant}
          setIsEntrant={setEditSpecialServiceIsEntrant}
          entrantDate={editSpecialServiceEntrantDate}
          setEntrantDate={setEditSpecialServiceEntrantDate}
          isDebut={editSpecialServiceIsDebut}
          setIsDebut={setEditSpecialServiceIsDebut}
          debutDate={editSpecialServiceDebutDate}
          setDebutDate={setEditSpecialServiceDebutDate}
          minDate={datesList && datesList.length > 0 ? datesList[0].toISOString().slice(0, 10) : ''}
          maxDate={datesList && datesList.length > 0 ? datesList[datesList.length - 1].toISOString().slice(0, 10) : ''}
          datesList={datesList}
          onValidate={handleSaveSpecialService}
        />
      )}

      {/* Modal : Suppression Agent */}
      {deleteAgentConfirm && (
        <DeleteAgentModal
          onClose={() => setDeleteAgentConfirm(null)}
          onConfirm={confirmDeleteAgent}
        />
      )}

      {/* Modal : Suppression Zone */}
      <ConfirmDeleteZoneModal
        isOpen={!!deleteZoneConfirmId}
        onClose={() => setDeleteZoneConfirmId(null)}
        onConfirm={executeDeleteSubsite}
      />

      {/* Modal : Mutation Temporaire */}
      {showMutate && (
        <MutateModal
          currentMutationPalette={currentMutationPalette}
          mutateAgentName={mutateAgentName}
          errorMsg={errorMsg}
          searchMutationText={searchMutationText}
          setSearchMutationText={setSearchMutationText}
          setMutateDestSubsiteId={setMutateDestSubsiteId}
          mutateDestSubsiteId={mutateDestSubsiteId}
          showMutationDropdown={showMutationDropdown}
          setShowMutationDropdown={setShowMutationDropdown}
          sites={sites}
          datesList={datesList}
          formatDateKey={formatDateKey}
          mutateStart={mutateStart}
          setMutateStart={setMutateStart}
          mutateNewShiftType={mutateNewShiftType}
          setMutateNewShiftType={setMutateNewShiftType}
          mutateNewFunction={mutateNewFunction}
          setMutateNewFunction={setMutateNewFunction}
          activeSiteId={activeSiteId}
          functions={functions}
          onClose={() => setShowMutate(false)}
          onSubmit={handleMutateSubmit}
          isMutating={isMutating}
        />
      )}
      {/* Shift/Vacation Modal */}
      {shiftModalAgent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', position: 'relative', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', borderRadius: '16px', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isGenerating && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                <Loader2 className="animate-spin" size={48} style={{ color: '#38bdf8', marginBottom: '16px' }} />
                <h3 style={{ color: 'white', margin: 0 }}>Génération en cours...</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>Veuillez patienter.</p>
              </div>
            )}
            <button
              onClick={() => setShiftModalAgent(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', zIndex: 10 }}
              title="Fermer"
              disabled={isGenerating}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '24px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', paddingRight: '30px', flexShrink: 0 }}>Type de Service & Planning</h3>

            <div style={{ marginBottom: '25px', flexShrink: 0 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500' }}>1. Sélectionner le Type</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['Jour', 'Nuit', '24h', '48h', '72h'].map(t => (
                  <button key={t} className="btn"
                    style={{ background: shiftModalType === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', border: shiftModalType === t ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: shiftModalType === t ? 'bold' : 'normal', flex: '1 1 auto' }}
                    onClick={() => {
                      setShiftModalType(t);
                      handleUpdateAgentField(shiftModalAgent.id, 'shift_type', t); // Optimistic update
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500', flexShrink: 0 }}>2. Générer le planning (Rotation)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '10px' }}>
                {renderPatternOptions()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="btn" onClick={() => setShiftModalAgent(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal : Sélection Segment Repos */}
      {reposSegmentSelection && (
        <div className="modal-overlay" onClick={() => setReposSegmentSelection(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '2.5rem', borderRadius: '16px', maxWidth: '500px', width: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Sur quelle période définir ce repos ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Cet agent a changé de vacation au cours du mois. Choisissez la période sur laquelle vous souhaitez appliquer ce jour de repos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {reposSegmentSelection.segments.map((seg, idx) => {
                const isOngoing = seg.to === '9999-12-31';
                const periodStartStr = formatDateKey(datesList[0]);

                let periodDescription = "";
                if (seg.from <= periodStartStr && isOngoing) {
                  periodDescription = "Sur tout le mois";
                } else if (seg.from <= periodStartStr) {
                  periodDescription = `Depuis le début du mois jusqu'au ${new Date(seg.to).toLocaleDateString('fr-FR')}`;
                } else if (isOngoing) {
                  periodDescription = `À partir du ${new Date(seg.from).toLocaleDateString('fr-FR')} jusqu'à la fin du mois`;
                } else {
                  periodDescription = `Du ${new Date(seg.from).toLocaleDateString('fr-FR')} au ${new Date(seg.to).toLocaleDateString('fr-FR')}`;
                }

                const isLast = idx === reposSegmentSelection.segments.length - 1;

                const emerald = '#10b981';
                const emeraldRgb = '16, 185, 129';

                const baseBg = isLast ? `rgba(${emeraldRgb}, 0.08)` : 'rgba(255,255,255,0.05)';
                const baseBorder = isLast ? `1px solid ${emerald}` : '1px solid rgba(255,255,255,0.2)';
                const hoverBg = isLast ? `rgba(${emeraldRgb}, 0.15)` : 'rgba(56, 189, 248, 0.1)';
                const hoverBorder = isLast ? emerald : 'var(--primary)';
                const boxShadow = isLast ? `0 0 15px rgba(${emeraldRgb}, 0.2)` : 'none';

                return (
                  <button
                    key={seg.type || `seg-${idx}`}
                    className="btn"
                    style={{ background: baseBg, color: 'white', border: baseBorder, padding: '15px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: boxShadow }}
                    onMouseOver={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = hoverBorder; }}
                    onMouseOut={e => { e.currentTarget.style.background = baseBg; e.currentTarget.style.borderColor = baseBorder; }}
                    onClick={() => executeSegmentRepos(reposSegmentSelection.agent, reposSegmentSelection.dayOfWeekIndex, seg)}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                        Vacation: {seg.type}
                        {isLast && (
                          <span style={{ fontSize: '0.7rem', background: emerald, color: '#ffffff', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Actuelle
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: isLast ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>{periodDescription}</div>
                    </div>
                    <span style={{ fontSize: '1.5rem', color: isLast ? emerald : 'var(--primary)' }}>→</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReposSegmentSelection(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Confirmation Repos */}
      {reposConfirmData && (
        <div className="modal-overlay" onClick={() => setReposConfirmData(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', padding: '2.5rem', borderRadius: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,193,7,0.2) 0%, rgba(255,193,7,0.05) 100%)', color: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '1px solid rgba(255,193,7,0.2)', boxShadow: '0 0 20px rgba(255,193,7,0.1)' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Confirmation Requise</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: '400' }}>
              {reposConfirmData.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setReposConfirmData(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '600', fontSize: '0.95rem' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>Annuler</button>
              <button onClick={executeAssignRepos} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)', color: '#000', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(255,193,7,0.3)' }} onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(255,193,7,0.4)'; }} onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(255,193,7,0.3)'; }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Changement de Statut */}
      {showChgtStatutModal && chgtStatutAgent && (
        <ChgtStatutModal
          agentName={chgtStatutAgent.name}
          date={chgtStatutDate}
          onDateChange={setChgtStatutDate}
          newFunction={chgtStatutNewFunction}
          onNewFunctionChange={setChgtStatutNewFunction}
          reason={chgtStatutReason}
          onReasonChange={setChgtStatutReason}
          colorNewFunction={chgtStatutColorNew}
          onColorNewFunctionChange={setChgtStatutColorNew}
          colorValue={chgtStatutColorHex}
          onColorValueChange={setChgtStatutColorHex}
          functions={functions}
          datesList={datesList}
          formatDateKey={formatDateKey}
          getDayLabel={getDayLabel}
          onClose={() => setShowChgtStatutModal(false)}
          onSubmit={handleChgtStatutSubmit}
        />
      )}

      {/* ============ MODAL INFO CHANGEMENT STATUT ============ */}
      {statusChangeInfoModal && (() => {
        let scObj = {};
        try {
          scObj = JSON.parse(statusChangeInfoModal.status_change);
        } catch (e) { }

        let assigned_days_old = 0;
        let assigned_days_new = 0;
        let abs_old = 0;
        let abs_new = 0;
        let mutated_away_days = 0;
        let assigned_days = 0;

        const currentAgent = siteData.flatMap(s => s.agents || []).find(a => a.id === statusChangeInfoModal.id) || statusChangeInfoModal;
        const attMap = {};
        (currentAgent.attendance || []).forEach(att => {
          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
          attMap[att.shift_code][att.date] = att.status;
        });

        if (scObj && scObj.date) {
          datesList.forEach(d => {
            const dk = formatDateKey(d);
            const sJ = attMap['J']?.[dk] || '';
            const sN = attMap['N']?.[dk] || '';
            if (sJ !== '' || sN !== '') {
              assigned_days++;
              if (sJ.startsWith('M|') || sJ.startsWith('PM|') || sN.startsWith('M|') || sN.startsWith('PM|')) {
                mutated_away_days++;
              } else {
                if (dk < scObj.date) {
                  assigned_days_old++;
                  if (['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sJ) || ['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sN)) abs_old++;
                } else {
                  assigned_days_new++;
                  if (['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sJ) || ['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sN)) abs_new++;
                }
              }
            }
          });
        }

        const real_active = assigned_days - mutated_away_days;
        const total_assigned = assigned_days_old + assigned_days_new;
        let active_days_old = 0;
        let active_days_new = 0;
        let active_days_total = 0;

        if (datesList.length > 0) {
          active_days_total = Math.round((real_active * 30) / datesList.length);
          if (total_assigned > 0) {
            active_days_old = Math.round((assigned_days_old / total_assigned) * active_days_total);
            active_days_new = active_days_total - active_days_old;
          } else {
            let countOld = 0, countNew = 0;
            datesList.forEach(d => {
              if (formatDateKey(d) < scObj.date) countOld++;
              else countNew++;
            });
            active_days_old = Math.round((countOld / datesList.length) * active_days_total);
            active_days_new = active_days_total - active_days_old;
          }
        }

        const oldSalary = currentAgent.salary ? parseInt(currentAgent.salary) : (parseInt(salaryGrid[scObj.old_function]) || 75000);
        const newSalary = parseInt(salaryGrid[scObj.new_function]) || 75000;

        return (
          <div className="modal-overlay" onClick={() => setStatusChangeInfoModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '480px', width: '90%', border: '1px solid rgba(234,179,8,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#facc15', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Détails Changement Statut</h3>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Agent :</strong> {currentAgent.name}</p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Ancienne Fonction :</strong> <span style={{ color: '#ef4444' }}>{scObj.old_function || '-'}</span> <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>(Salaire de base : {oldSalary.toLocaleString('fr-FR')} FCFA)</span></p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Nouvelle Fonction :</strong> <span style={{ color: '#22c55e' }}>{scObj.new_function || '-'}</span> <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>(Salaire de base : {newSalary.toLocaleString('fr-FR')} FCFA)</span></p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Date d'effet :</strong> {scObj.date ? scObj.date.split('-').reverse().join('/') : '-'}</p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Motif :</strong> {scObj.reason || 'Non spécifié'}</p>

              <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize: '0.95rem' }}>Démonstration du calcul de salaire (Prorata)</h4>
                <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Le système répartit le salaire sur une base de 30 jours, en se basant sur les <strong>jours assignés</strong>. Les absences ne diminuent pas cette base de prorata, elles seront déduites lors du calcul final sur la fiche de paie.
                </p>
                <ul style={{ margin: '10px 0', paddingLeft: '20px', color: 'white', fontSize: '0.85rem' }}>
                  <li><strong>Jours assignés ({scObj.old_function || 'Ancienne'}) :</strong> {assigned_days_old} jour(s) {abs_old > 0 ? <span style={{ color: '#f87171' }}>(dont {abs_old} non travaillés/absents)</span> : ''}</li>
                  <li><strong>Jours assignés ({scObj.new_function || 'Nouvelle'}) :</strong> {assigned_days_new} jour(s) {abs_new > 0 ? <span style={{ color: '#f87171' }}>(dont {abs_new} non travaillés/absents)</span> : ''}</li>
                  <li style={{ marginTop: '8px' }}><strong>Base Prorata ({scObj.old_function || 'Ancienne'}) :</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{active_days_old} jour(s) de salaire</span></li>
                  <li><strong>Base Prorata ({scObj.new_function || 'Nouvelle'}) :</strong> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{active_days_new} jour(s) de salaire</span></li>
                </ul>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setStatusChangeInfoModal(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ MODAL MOIS SUIVANT ============ */}
      {/* Modal : Changement de Vacation */}
      {showShiftChangeMenu && (
        <div className="modal-overlay" onClick={() => setShowShiftChangeMenu(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '20px', padding: '36px',
            maxWidth: '480px', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(126, 34, 206, 0.2))',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a855f7', boxShadow: '0 6px 20px rgba(168, 85, 247, 0.15)'
              }}>
                <Clock size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Changement de Vacation</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Modifiez la vacation de l'agent</p>
              </div>
            </div>

            <form onSubmit={handleShiftChangeSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>À partir de quelle date ?</label>
                <select
                  value={shiftChangeDate}
                  onChange={e => setShiftChangeDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}
                  required
                >
                  <option value="" disabled style={{ background: '#1e293b', color: 'rgba(255,255,255,0.5)' }}>Sélectionnez une date...</option>
                  {datesList.map(d => {
                    const dk = formatDateKey(d);
                    return <option key={dk} value={dk} style={{ background: '#1e293b', color: 'white' }}>{d.toLocaleDateString('fr-FR')} ({getDayLabel(d)})</option>;
                  })}
                </select>
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Nouvelle vacation</label>
                <select
                  value={shiftChangeNewType}
                  onChange={e => setShiftChangeNewType(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}
                >
                  <option value="Jour" style={{ background: '#1e293b', color: 'white' }}>Jour (J)</option>
                  <option value="Nuit" style={{ background: '#1e293b', color: 'white' }}>Nuit (N)</option>
                  <option value="24h" style={{ background: '#1e293b', color: 'white' }}>24h (J, N)</option>
                  <option value="48h" style={{ background: '#1e293b', color: 'white' }}>48h (J, N)</option>
                  <option value="72h" style={{ background: '#1e293b', color: 'white' }}>72h (J, N)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowShiftChangeMenu(null)} 
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  Annuler
                </button>
                <button type="submit" 
                  disabled={loading}
                  style={{ 
                    flex: 2, padding: '12px', 
                    background: loading ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', 
                    border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 800, 
                    cursor: loading ? 'not-allowed' : 'pointer', 
                    boxShadow: loading ? 'none' : '0 6px 15px rgba(168, 85, 247, 0.3)', 
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                  onMouseOver={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4)'; } }}
                  onMouseOut={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(168, 85, 247, 0.3)'; } }}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <PublishSuccessModal
        showPublishSuccess={showPublishSuccess}
        setShowPublishSuccess={setShowPublishSuccess}
        setShowPublishReport={setShowPublishReport}
        period={period}
      />

      {/* ============ MODAL RAPPORT DE POINTAGE ============ */}
      {showPublishReport && (
        <PublishReportModal
          period={period}
          cycleStart={cycleStart}
          siteData={siteData}
          leaves={leaves}
          user={user}
          sites={sites}
          onClose={() => setShowPublishReport(false)}
        />
      )}


      {/* ============ MODAL RENOMMER SITE ============ */}
      <RenameSiteModal
        isOpen={!!renameModalData}
        currentName={renameModalData?.currentName}
        onClose={() => setRenameModalData(null)}
        onConfirm={executeRenameSite}
      />

      {/* ============ MODAL RENOMMER ZONE ============ */}
      <RenameSubsiteModal
        isOpen={!!renameSubsiteModalData}
        currentName={renameSubsiteModalData?.currentName}
        onClose={() => setRenameSubsiteModalData(null)}
        onConfirm={executeRenameSubsite}
      />


      <WelcomeToast
        showWelcomeToast={showWelcomeToast}
        welcomeMonthName={welcomeMonthName}
        onClose={() => setShowWelcomeToast(false)}
      />

      {/* ========== MODAL SELECTION FONCTION ========== */}
      {functionModalAgent && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setFunctionModalAgent(null)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
          <div
            style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #0f1a2e 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '1200px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 800 }}>Modifier la Fonction</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--muted)', fontSize: '1rem' }}>
              Agent : <strong style={{ color: 'white' }}>{functionModalAgent.name}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {/* Option Aucun */}
              <button
                onClick={() => { handleUpdateAgentField(functionModalAgent.id, 'function', ''); setFunctionModalAgent(null); }}
                style={{
                  padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  background: !functionModalAgent.function ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  color: !functionModalAgent.function ? '#818cf8' : 'var(--muted)',
                  cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.15s'
                }}
              >
                — Aucune / Vide
              </button>

              {functions.map(f => (
                <button
                  key={f.id}
                  onClick={() => { handleUpdateAgentField(functionModalAgent.id, 'function', f.id); setFunctionModalAgent(null); }}
                  style={{
                    padding: '16px 20px', borderRadius: '12px', border: `1px solid ${functionModalAgent.function === f.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: functionModalAgent.function === f.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = functionModalAgent.function === f.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)'}
                >
                  <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 800, fontSize: '0.9rem', padding: '6px 10px', borderRadius: '8px', minWidth: '40px', textAlign: 'center' }}>{f.id}</span>
                  <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>{f.fullName || f.id}</span>
                  {functionModalAgent.function === f.id && <span style={{ marginLeft: 'auto', color: '#818cf8', fontSize: '1.2rem' }}>✓</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFunctionModalAgent(null)}
              style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {permanentSuppModal && (
        <PermanentSupplementsModal
          isOpen={!!permanentSuppModal}
          onClose={() => setPermanentSuppModal(null)}
          agent={permanentSuppModal.agent}
          supps={permanentSuppModal.supps}
          onSave={handleSavePermanentSupps}
        />
      )}

      <DashboardModals
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
          setShowVerificationModal, setShowCalendar,
          setCreateNewCpMode, setEditingCpLeaveId, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setShowCpModal, setLeaves,
          cpWarningModal, setCpWarningModal,
          handleDeleteLeave,
          setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setShowMapModal, setEditingMapLeaveId,
          setMaladieAgentId, setMaladieAgentName, setMaladieStartDate, setMaladieEndDate, setShowMaladieModal, setEditingMaladieLeaveId,
          setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setShowPermissionModal, setEditingPermissionLeaveId,
          setEditingAbsenceLeaveId
        }}
      />
    </div>
  );
}