import React from 'react';
import { useLeaveManagement } from './useLeaveManagement';
import { useAgentPointage } from './useAgentPointage';
import { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';

// You might need other imports like getSafePeriod if it's not passed

export function useDashboardActions(props) {
  const { state, isArchiveMode, archiveData, user, isVerificationMode } = props;
  const {
    showVerificationModal, setShowVerificationModal, showCalendar, setShowCalendar, hasVerifiedPointage, setHasVerifiedPointage, isVerifying, setIsVerifying, viewMode, setViewMode, showTransferModal, setShowTransferModal, transferModalData, setTransferModalData, showTransferDetailsModal, setShowTransferDetailsModal, transferDetailsData, setTransferDetailsData, externalSuppModal, setExternalSuppModal, moveZoneAgent, setMoveZoneAgent, lockedZones, setLockedZones, sites, setSites, siteOrder, setSiteOrder, draggedSite, setDraggedSite, activeSiteId, setActiveSiteId, activeSiteName, setActiveSiteName, showAgentCountHover, setShowAgentCountHover, period, setPeriod, cycleStart, setCycleStart, siteData, setSiteData, functions, setFunctions, loading, setLoading, renameModalData, setRenameModalData, highlightedAgentId, setHighlightedAgentId, globalAgents, setGlobalAgents, renameSubsiteModalData, setRenameSubsiteModalData, zoneConfigModalData, setZoneConfigModalData, functionModes, setFunctionModes, searchTerm, setSearchTerm, filterShiftType, setFilterShiftType, filterFunction, setFilterFunction, filterShowOnlyAbsences, setFilterShowOnlyAbsences, showAdvancedFilters, setShowAdvancedFilters, showKPICards, setShowKPICards, siteSortOrder, setSiteSortOrder, siteSearchTerm, setSiteSearchTerm, showSiteSettings, setShowSiteSettings, cardDesign, setCardDesign, selectedKpiAgent, setSelectedKpiAgent, isScrolled, setIsScrolled, kpiPos, setKpiPos, isDraggingKpi, setIsDraggingKpi, salaryGrid, setSalaryGrid, functionModalAgent, setFunctionModalAgent, statsCardScale, setStatsCardScale, isZenMode, setIsZenMode, paintModeActive, setPaintModeActive, paintStatus, setPaintStatus, cellContextMenu, setCellContextMenu, clipboardWeek, setClipboardWeek, pasteConfirmModal, setPasteConfirmModal, showEditSpecialServiceModal, setShowEditSpecialServiceModal, editSpecialServiceAgent, setEditSpecialServiceAgent, editSpecialServiceBase, setEditSpecialServiceBase, editSpecialServiceDays, setEditSpecialServiceDays, editSpecialServiceIsEntrant, setEditSpecialServiceIsEntrant, editSpecialServiceEntrantDate, setEditSpecialServiceEntrantDate, editSpecialServiceIsDebut, setEditSpecialServiceIsDebut, editSpecialServiceDebutDate, setEditSpecialServiceDebutDate, kpiAnchorRef, kpiDragStart, settingsMenuRef, isPaintingRef, paintedCellsRef, runVerification, toggleZoneLock, toggleAllZonesLock, getSafePeriod,
    showEditAdminScheduleModal, setShowEditAdminScheduleModal, editAdminScheduleAgent, setEditAdminScheduleAgent, editAdminScheduleDays, setEditAdminScheduleDays
  } = state;

  const [showAddSite, setShowAddSite] = useState(false);
  const [showAddSubsite, setShowAddSubsite] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showDeleteAgent, setShowDeleteAgent] = useState(false);
  const [deleteSiteData, setDeleteSiteData] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [showRenameAgentModal, setShowRenameAgentModal] = useState(false);
  const [renameAgentTarget, setRenameAgentTarget] = useState(null);
  const [renameAgentNewName, setRenameAgentNewName] = useState('');
  const [showDeployExtra, setShowDeployExtra] = useState(false);
  const [extraAgents, setExtraAgents] = useState([]);
  const [showClosedMonthModal, setShowClosedMonthModal] = useState(false);
  const [showManageFunctionsModal, setShowManageFunctionsModal] = useState(false);
  const [showDeployReleve, setShowDeployReleve] = useState(false);
  const [releveAgents, setReleveAgents] = useState([]);
  const [deployReleveDefaultAgentId, setDeployReleveDefaultAgentId] = useState('');
  const [deployReleveDefaultDate, setDeployReleveDefaultDate] = useState('');
  const [enableAnimations, setEnableAnimations] = useState(() => {
    return localStorage.getItem('pontage_enable_animations') === 'true';
  });
  const [cpInfoModal, setCpInfoModal] = useState(null);
  const [externalSuppDetailsModal, setExternalSuppDetailsModal] = useState(null);
  const [agentTableMode, setAgentTableMode] = useState(() => localStorage.getItem('pontage_agent_table_mode') || 'grouped');
  const [showTableModeMenu, setShowTableModeMenu] = useState(false);
  const [supplModal, setSupplModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const getRobustBehavior = () => {
    let val = localStorage.getItem('pontage_edit_mode_behavior');
    if (!val || val === 'null') {
      const match = document.cookie.match(new RegExp('(^| )pontage_edit_mode_behavior=([^;]+)'));
      if (match) val = match[2];
    }
    return val || 'remember_session';
  };

  const setRobustBehavior = (val) => {
    try { localStorage.setItem('pontage_edit_mode_behavior', val); } catch (e) { }
    document.cookie = `pontage_edit_mode_behavior=${val};path=/;max-age=31536000`;
  };

  const [isEditMode, setIsEditMode] = useState(() => {
    const behavior = getRobustBehavior();
    if (behavior === 'default_unlocked' || behavior === 'unlock_always') return true;
    return false;
  });
  const [showReadOnlyAlert, setShowReadOnlyAlert] = useState(false);
  const [editModeBehavior, setEditModeBehavior] = useState(() => getRobustBehavior());

  useEffect(() => {
    const timer = setInterval(() => {
      const current = getRobustBehavior();
      if (current && current !== editModeBehavior && current !== 'null') {
        setEditModeBehavior(current);
        if (current === 'default_unlocked' || current === 'unlock_always') setIsEditMode(true);
        if (current === 'default_locked' || current === 'lock_always') setIsEditMode(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [editModeBehavior]);

  useEffect(() => {
    if (activeSiteId) {
      if (editModeBehavior === 'lock_always') {
        setIsEditMode(false);
      } else if (editModeBehavior === 'unlock_always') {
        setIsEditMode(true);
      }
    }
  }, [activeSiteId, editModeBehavior]);


  const getCyclePeriodForDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    let pM = d.getMonth() + 1;
    let pY = d.getFullYear();
    if (d.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
    return `${pY}-${String(pM).padStart(2, '0')}`;
  };

  const [releveSupplModal, setReleveSupplModal] = useState(null);
  const [scheduleModalAgent, setScheduleModalAgent] = useState(null);
  const setAndSaveAgentTableMode = async (mode) => {
    setAgentTableMode(mode);
    localStorage.setItem('pontage_agent_table_mode', mode);
    setShowTableModeMenu(false);
    // Sauvegarder en base de données
    try {
      await apiCall('save_ui_prefs', { key: 'agent_table_mode', value: mode });
    } catch (e) {
      console.warn('Could not save ui pref to DB:', e);
    }
  };

  const [agentSpacingMode, setAgentSpacingMode] = useState(() => localStorage.getItem('pontage_agent_spacing_mode') || 'compact');
  const setAndSaveAgentSpacingMode = (mode) => {
    setAgentSpacingMode(mode);
    localStorage.setItem('pontage_agent_spacing_mode', mode);
  };

  const [siteTableModes, setSiteTableModes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_site_table_modes')) || {}; } catch (e) { return {}; }
  });
  const setAndSaveSiteTableMode = async (siteId, mode) => {
    const newModes = { ...siteTableModes, [siteId]: mode };
    setSiteTableModes(newModes);
    localStorage.setItem('pontage_site_table_modes', JSON.stringify(newModes));
    try {
      await apiCall('save_ui_prefs', { key: `site_table_mode_${siteId}`, value: mode });
    } catch (e) {
      console.warn('Could not save ui pref to DB:', e);
    }
  };

  const [agentSortOrder, setAgentSortOrder] = useState(() => localStorage.getItem('pontage_agent_sort_order') || 'none');
  const setAndSaveAgentSortOrder = (order) => {
    setAgentSortOrder(order);
    localStorage.setItem('pontage_agent_sort_order', order);
  };

  const [zoneSortOrder, setZoneSortOrder] = useState(() => localStorage.getItem('pontage_zone_sort_order') || 'none');
  const setAndSaveZoneSortOrder = (order) => {
    setZoneSortOrder(order);
    localStorage.setItem('pontage_zone_sort_order', order);
  };

  // Context Menu pour les sites
  const [siteContextMenu, setSiteContextMenu] = useState({ visible: false, x: 0, y: 0, siteId: null, siteName: '' });
  const [showRenameSiteModal, setShowRenameSiteModal] = useState(false);
  const [renameSiteName, setRenameSiteName] = useState('');
  const [showDeleteSiteModal, setShowDeleteSiteModal] = useState(false);

  useEffect(() => {
    const closeMenu = (e) => {
      setSiteContextMenu(prev => {
        if (prev.visible) return { ...prev, visible: false };
        return prev;
      });
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Modal: Changement de vacation historisé
  const [showShiftChangeMenu, setShowShiftChangeMenu] = useState(null);
  const [shiftChangeDate, setShiftChangeDate] = useState('');
  const [shiftChangeNewType, setShiftChangeNewType] = useState('Jour');

  // Modal: Agent Sortant
  const [showSortantModal, setShowSortantModal] = useState(false);
  const [sortantAgentId, setSortantAgentId] = useState('');
  const [sortantAgentName, setSortantAgentName] = useState('');
  const [sortantDate, setSortantDate] = useState('');
  const [sortantType, setSortantType] = useState('ABANDON');
  const [sortantCustomReason, setSortantCustomReason] = useState('');

  // Modal: Agent Entrant
  const [showEntrantModal, setShowEntrantModal] = useState(false);
  const [entrantAgentId, setEntrantAgentId] = useState('');
  const [deleteZoneConfirmId, setDeleteZoneConfirmId] = useState(null);
  const [entrantAgentName, setEntrantAgentName] = useState('');
  const [entrantDate, setEntrantDate] = useState('');
  const [entrantFunction, setEntrantFunction] = useState('');

  // Excel-like cell selection (especially useful in archive mode)
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null); // { r, c }
  const [selectionEnd, setSelectionEnd] = useState(null); // { r, c }
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsSelecting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input-premium');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [showMutate, setShowMutate] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // Mode Costume
  const [costumeModes, setCostumeModes] = useState({});

  const handleConfirmEntrant = async () => {
    if (!entrantAgentId || !entrantDate) {
      alert('Veuillez sélectionner la date de début.');
      return;
    }
    const entrantEndPeriod = getCyclePeriodForDate(entrantDate);
    if (entrantEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }

    setShowEntrantModal(false);
    setTimeout(() => {
      setSiteData(prevData => {
        return prevData.map(subsite => {
          return {
            ...subsite,
            agents: subsite.agents.map(agent => {
              if (String(agent.id) === String(entrantAgentId)) {
                let updatedAttendance = [...(agent.attendance || [])];
                const targetShift = (agent.shift_type === 'Nuit' || agent.shift_type === 'N') ? 'N' : 'J';
                datesList.forEach(d => {
                  const dk = formatDateKey(d);
                  if (dk < entrantDate) {
                    updatedAttendance = updatedAttendance.filter(a => a.date !== dk);
                    updatedAttendance.push({ date: dk, shift_code: targetShift, status: 'ENTRANT' });
                  }
                });
                return { ...agent, hire_date: entrantDate, function: entrantFunction, attendance: updatedAttendance };
              }
              return agent;
            })
          };
        });
      });
    }, 10);

    try {
      const res = await apiCall('mark_agent_entrant', {
        agent_id: entrantAgentId,
        start_date: entrantDate,
        function: entrantFunction,
        period
      });
      if (!res || !res.success) {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const handleConfirmSortant = async (e) => {
    e.preventDefault();
    if (!sortantAgentId || !sortantDate) {
      alert('Veuillez sélectionner la date.');
      return;
    }
    const sortantEndPeriod = getCyclePeriodForDate(sortantDate);
    if (sortantEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }

    let finalType = sortantType;
    if (sortantType === 'AUTRE') {
      if (!sortantCustomReason.trim()) {
        alert('Veuillez saisir le motif.');
        return;
      }
      finalType = 'SORTANT_' + sortantCustomReason.trim();
    }

    setShowSortantModal(false);
    setTimeout(() => {
      setSiteData(prevData => {
        return prevData.map(subsite => {
          return {
            ...subsite,
            agents: subsite.agents.map(agent => {
              if (String(agent.id) === String(sortantAgentId)) {
                let updatedAttendance = [...(agent.attendance || [])];
                const targetShift = (agent.shift_type === 'Nuit' || agent.shift_type === 'N') ? 'N' : 'J';
                datesList.forEach(d => {
                  const dk = formatDateKey(d);
                  if (dk >= sortantDate) {
                    updatedAttendance = updatedAttendance.filter(a => a.date !== dk);
                    updatedAttendance.push({ date: dk, shift_code: targetShift, status: finalType });
                  }
                });
                return { ...agent, exit_date: sortantDate, exit_reason: finalType, attendance: updatedAttendance };
              }
              return agent;
            })
          };
        });
      });
    }, 10);

    try {
      const res = await apiCall('mark_agent_sortant', {
        agent_id: sortantAgentId,
        departure_date: sortantDate,
        type: finalType,
        period
      });
      if (!res || !res.success) {
        if (res?.period_locked) {
          showPeriodLockedToast(getPeriodLabel());
        } else {
          alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
        }
      }
    } catch (err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [leaves, setLeaves] = useState([]);

  const {
    mapState, mapActions,
    absenceState, absenceActions,
    permissionState, permissionActions,
    cpState, cpActions,
    maladieState, maladieActions,
    overlapWarning, setOverlapWarning,
    handleDeleteLeave
  } = useLeaveManagement({
    siteData, setSiteData, leaves, setLeaves, cycleStart, period, setShowClosedMonthModal
  });



  const { showMapModal, mapAgentId, mapAgentName, mapStartDate, mapEndDate, mapNavOffset, mapManualDuration, editingMapLeaveId } = mapState;
  const { setShowMapModal, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setEditingMapLeaveId, handleMapSubmit } = mapActions;

  const { showAbsenceModal, absenceAgentId, absenceAgentName, absenceStartDate, absenceEndDate, absenceNavOffset, absenceManualDuration, editingAbsenceLeaveId } = absenceState;
  const { setShowAbsenceModal, setAbsenceAgentId, setAbsenceAgentName, setAbsenceStartDate, setAbsenceEndDate, setAbsenceNavOffset, setAbsenceManualDuration, setEditingAbsenceLeaveId, handleAbsenceSubmit } = absenceActions;

  const { showMaladieModal, maladieAgentId, maladieAgentName, maladieStartDate, maladieEndDate, maladieNavOffset, maladieManualDuration, editingMaladieLeaveId } = maladieState;
  const { setShowMaladieModal, setMaladieAgentId, setMaladieAgentName, setMaladieStartDate, setMaladieEndDate, setMaladieNavOffset, setMaladieManualDuration, setEditingMaladieLeaveId, handleMaladieSubmit } = maladieActions;

  const { showPermissionModal, permissionAgentId, permissionAgentName, permissionStartDate, permissionEndDate, permissionNavOffset, permissionManualDuration, editingPermissionLeaveId } = permissionState;
  const { setShowPermissionModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setPermissionNavOffset, setPermissionManualDuration, setEditingPermissionLeaveId, handlePermissionSubmit } = permissionActions;

  const { showCpModal, cpAgentId, cpAgentName, cpStartDate, cpEndDate, cpNavOffset, cpManualDuration, createNewCpMode, editingCpLeaveId } = cpState;
  const { setShowCpModal, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setCpNavOffset, setCpManualDuration, setCreateNewCpMode, setEditingCpLeaveId, handleCpSubmit } = cpActions;

  const [lockedPermissions, setLockedPermissions] = useState({});
  const [lockedAbsences, setLockedAbsences] = useState({});
  const [cpWarningModal, setCpWarningModal] = useState(null);
  const [permissionDetailsModal, setPermissionDetailsModal] = useState(null);
  const [lockedMaps, setLockedMaps] = useState({});

  const [showChgtStatutModal, setShowChgtStatutModal] = useState(false);
  const [chgtStatutAgent, setChgtStatutAgent] = useState(null);
  const [chgtStatutDate, setChgtStatutDate] = useState('');
  const [chgtStatutNewFunction, setChgtStatutNewFunction] = useState('');
  const [chgtStatutReason, setChgtStatutReason] = useState('');
  const [chgtStatutColorNew, setChgtStatutColorNew] = useState(true);
  const [chgtStatutColorHex, setChgtStatutColorHex] = useState('#10b981');
  const [statusChangeInfoModal, setStatusChangeInfoModal] = useState(null);

  const handleChgtStatutSubmit = async () => {
    if (!chgtStatutAgent || !chgtStatutDate || !chgtStatutNewFunction) return;
    try {
      const statusChange = JSON.stringify({
        date: chgtStatutDate,
        old_function: chgtStatutAgent.function,
        new_function: chgtStatutNewFunction,
        reason: chgtStatutReason,
        color_new: chgtStatutColorNew,
        color_hex: chgtStatutColorHex
      });
      const res = await apiCall('update_agent_info', {
        agent_id: chgtStatutAgent.id,
        field: 'status_change',
        value: statusChange,
        period: period
      });
      if (res && res.success) {
        setSiteData(prev => prev.map(site => ({
          ...site,
          agents: site.agents.map(a =>
            a.id === chgtStatutAgent.id
              ? { ...a, status_change: statusChange }
              : a
          )
        })));
        setShowChgtStatutModal(false);
      } else {
        alert('Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors du changement de statut');
    }
  };

  const [shiftModalAgent, setShiftModalAgent] = useState(null);
  const [shiftModalType, setShiftModalType] = useState('Jour');
  const [showCustomRotation, setShowCustomRotation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRotationType, setCustomRotationType] = useState('Travail');
  const [customRotationDate, setCustomRotationDate] = useState(0);
  const [iconPickerSiteId, setIconPickerSiteId] = useState(null);
  const [showVerificationSites, setShowVerificationSites] = useState(false);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [maxInitializedPeriod, setMaxInitializedPeriod] = useState(
    () => new Date().toISOString().slice(0, 7)
  );
  const [showNextMonthModal, setShowNextMonthModal] = useState(false);
  const [showPublishReport, setShowPublishReport] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [initializing, setInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [sitesToKeepHS, setSitesToKeepHS] = useState([]);
  const [showKeepHSModal, setShowKeepHSModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [welcomeMonthName, setWelcomeMonthName] = useState('');
  const [hasAutoSnapped, setHasAutoSnapped] = useState(false);
  const [manuallyAdvancedToFuture, setManuallyAdvancedToFuture] = useState(false);
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);

  // ─── Notification : Période Verrouillée ────────────────────────────────────
  // Affiche un toast rouge non-bloquant en bas de l'écran pendant 5 secondes
  const showPeriodLockedToast = (periodLabel) => {
    const id = 'period-locked-toast';
    if (document.getElementById(id)) return; // Anti-spam
    const el = document.createElement('div');
    el.id = id;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px">
        <span style="font-size:1.6rem">🔒</span>
        <div>
          <div style="font-weight:700;font-size:0.95rem;color:#fff">Période verrouillée</div>
          <div style="font-size:0.82rem;color:rgba(255,255,255,0.72);margin-top:2px">
            Le pointage de <strong>${periodLabel}</strong> a déjà été publié. Aucune modification n'est autorisée.<br/>
            <span style="opacity:0.6">→ Dépubliez la période si une correction est nécessaire.</span>
          </div>
        </div>
      </div>`;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'linear-gradient(135deg,#7f1d1d,#991b1b)',
      border: '1px solid rgba(248,113,113,0.4)',
      borderRadius: '14px',
      padding: '16px 24px',
      zIndex: '99999',
      minWidth: '360px',
      maxWidth: '560px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      opacity: '0',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      cursor: 'pointer',
    });
    el.addEventListener('click', () => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => el.remove(), 300);
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      if (document.getElementById(id)) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => el.remove(), 300);
      }
    }, 6000);
  };
  // ────────────────────────────────────────────────────────────────────
  const [showStats, setShowStats] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);

  // Form states
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [isSpecialSite, setIsSpecialSite] = useState(false);
  const [specialSiteType, setSpecialSiteType] = useState('extras');
  const [customBehavior, setCustomBehavior] = useState('auto_individual');
  const [newSubsiteName, setNewSubsiteName] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSubsiteId, setNewAgentSubsiteId] = useState('');
  const [newAgentFunction, setNewAgentFunction] = useState('');
  const [newAgentShiftType, setNewAgentShiftType] = useState('Jour');
  const [newAgentContractEnd, setNewAgentContractEnd] = useState('');
  const [isNewAgentEntrant, setIsNewAgentEntrant] = useState(false);
  const [newAgentEntrantDate, setNewAgentEntrantDate] = useState('');
  const [mutateAgentId, setMutateAgentId] = useState('');
  const [mutateAgentName, setMutateAgentName] = useState('');
  const [mutateStart, setMutateStart] = useState('');
  const [mutateNewShiftType, setMutateNewShiftType] = useState('CONSERVER');
  const [mutateNewFunction, setMutateNewFunction] = useState('CONSERVER');
  const [searchMutationText, setSearchMutationText] = useState('');
  const [showMutationDropdown, setShowMutationDropdown] = useState(false);
  const [mutateDestSubsiteId, setMutateDestSubsiteId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteAgentConfirm, setDeleteAgentConfirm] = useState(null);

  // Mutation palettes
  const mutationPalettes = {
    indigo: {
      border: 'rgba(99,102,241,0.3)',
      iconBg: 'rgba(99,102,241,0.2)',
      iconColor: '#818cf8',
      agentName: '#a5b4fc',
      dropdownBorder: 'rgba(99,102,241,0.3)',
      hoverBg: 'rgba(99,102,241,0.15)',
      containerBorder: 'rgba(99,102,241,0.2)',
      selectedBorder: '#6366f1',
      selectedBg: 'rgba(99,102,241,0.35)',
      selectedText: '#a5b4fc',
      btnBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      btnShadow: 'rgba(99,102,241,0.4)',
    },
    ocean: {
      border: 'rgba(2,132,199,0.3)',
      iconBg: 'rgba(2,132,199,0.2)',
      iconColor: '#38bdf8',
      agentName: '#7dd3fc',
      dropdownBorder: 'rgba(2,132,199,0.3)',
      hoverBg: 'rgba(2,132,199,0.15)',
      containerBorder: 'rgba(2,132,199,0.2)',
      selectedBorder: '#0284c7',
      selectedBg: 'rgba(2,132,199,0.35)',
      selectedText: '#7dd3fc',
      btnBg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      btnShadow: 'rgba(2,132,199,0.4)',
    },
    emerald: {
      border: 'rgba(16,185,129,0.3)',
      iconBg: 'rgba(16,185,129,0.2)',
      iconColor: '#34d399',
      agentName: '#6ee7b7',
      dropdownBorder: 'rgba(16,185,129,0.3)',
      hoverBg: 'rgba(16,185,129,0.15)',
      containerBorder: 'rgba(16,185,129,0.2)',
      selectedBorder: '#10b981',
      selectedBg: 'rgba(16,185,129,0.35)',
      selectedText: '#6ee7b7',
      btnBg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
      btnShadow: 'rgba(16,185,129,0.4)',
    },
    amber: {
      border: 'rgba(245,158,11,0.3)',
      iconBg: 'rgba(245,158,11,0.2)',
      iconColor: '#fbbf24',
      agentName: '#fde68a',
      dropdownBorder: 'rgba(245,158,11,0.3)',
      hoverBg: 'rgba(245,158,11,0.15)',
      containerBorder: 'rgba(245,158,11,0.2)',
      selectedBorder: '#d97706',
      selectedBg: 'rgba(245,158,11,0.35)',
      selectedText: '#fde68a',
      btnBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      btnShadow: 'rgba(245,158,11,0.4)',
    },
    rose: {
      border: 'rgba(244,63,94,0.3)',
      iconBg: 'rgba(244,63,94,0.2)',
      iconColor: '#fb7185',
      agentName: '#fecdd3',
      dropdownBorder: 'rgba(244,63,94,0.3)',
      hoverBg: 'rgba(244,63,94,0.15)',
      containerBorder: 'rgba(244,63,94,0.2)',
      selectedBorder: '#e11d48',
      selectedBg: 'rgba(244,63,94,0.35)',
      selectedText: '#fecdd3',
      btnBg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
      btnShadow: 'rgba(244,63,94,0.4)',
    }
  };

  const currentMutationPalette = mutationPalettes[localStorage.getItem('pontage_mutation_theme') || 'amber'] || mutationPalettes.amber;
  // Charger les paramètres de cycle
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiCall('get_settings', {}, 'GET');
        if (res && res.cycle_start) {
          setCycleStart(res.cycle_start);
        }
        const funcRes = await apiCall('get_functions', {}, 'GET');
        if (funcRes && funcRes.success && Array.isArray(funcRes.functions)) {
          // Use the function's id (code) and full name as the display label
          const mappedFuncs = funcRes.functions.map(f => ({ ...f, name: f.id, fullName: `${f.id} - ${f.name}` }));
          setFunctions(mappedFuncs);
        }
        try {
          const salRes = await apiCall('get_salary_config', {}, 'GET');
          if (salRes && salRes.success && salRes.config) {
            setSalaryGrid(salRes.config);
          } else if (salRes && typeof salRes === 'object' && !Array.isArray(salRes) && !salRes.success) {
            setSalaryGrid(salRes); // fallback for the raw object format
          }
        } catch (ce) { console.error('Erreur chargement grille salariale:', ce); }
      } catch (e) {
        console.error("Erreur de chargement des paramètres:", e);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (isArchiveMode) return;
    localStorage.setItem('pontage_period', period);
    if (activeSiteId) {
      localStorage.setItem('pontage_activeSiteId', activeSiteId);
      localStorage.setItem('pontage_activeSiteName', activeSiteName);
      sessionStorage.setItem('pontage_fallback_activeSiteId', activeSiteId);
      sessionStorage.setItem('pontage_fallback_activeSiteName', activeSiteName);
      if (editModeBehavior === 'lock_always') {
        setIsEditMode(false);
      }
    }
  }, [period, activeSiteId, activeSiteName, editModeBehavior]);

  const loadDashboardData = async () => {
    if (isArchiveMode) {
      setSites(archiveData.sites || []);
      setGlobalAgents(archiveData.globalAgents || []);
      setLeaves(archiveData.leaves || []);
      setPublishedPeriods([]);
      if (activeSiteId) {
        setSiteData(archiveData.sites?.find(s => String(s.id) === String(activeSiteId))?.subsites || []);
      } else {
        setSiteData([]);
      }
      setLoading(false); // Stop le spinner en mode archive
      return;
    }
    setLoading(true);
    try {
      const params = { period };
      if (activeSiteId) {
        params.site_id = activeSiteId;
      }
      const [res, leavesRes, uiPrefsRes, pubPeriodsRes] = await Promise.all([
        apiCall('get_dashboard_init', params, 'GET'),
        apiCall('get_leaves', {}, 'GET'),
        apiCall('get_ui_prefs', {}, 'GET'),
        apiCall('get_published_periods', { scope: 'company' }, 'GET')
      ]);
      if (uiPrefsRes && uiPrefsRes.success && uiPrefsRes.prefs) {
        const savedMode = uiPrefsRes.prefs['agent_table_mode'];
        if (savedMode && savedMode !== agentTableMode) {
          setAgentTableMode(savedMode);
          localStorage.setItem('pontage_agent_table_mode', savedMode);
        }
      }
      if (leavesRes && leavesRes.success) {
        setLeaves(leavesRes.leaves || []);
      }
      // ── Mettre à jour max_initialized_period depuis le backend (source de vérité) ──
      let periodSnapped = false;
      if (pubPeriodsRes && pubPeriodsRes.max_initialized_period) {
        setMaxInitializedPeriod(pubPeriodsRes.max_initialized_period);
        if (!hasAutoSnapped && !isVerificationMode) {
          if (period !== pubPeriodsRes.max_initialized_period) {
            setPeriod(pubPeriodsRes.max_initialized_period);
            periodSnapped = true;
          }
          setHasAutoSnapped(true);
        }
      } else if (pubPeriodsRes && Array.isArray(pubPeriodsRes.published_periods) && pubPeriodsRes.published_periods.length > 0) {
        // Fallback : si max_initialized_period est null (jamais défini ou après reset),
        // on considère que le mois courant publié est le dernier initialisé
        const sortedPubs = [...pubPeriodsRes.published_periods].sort().reverse();
        const latestPub = sortedPubs[0];
        setMaxInitializedPeriod(latestPub);
        if (!hasAutoSnapped && !isVerificationMode) {
          if (period !== latestPub) {
            setPeriod(latestPub);
            periodSnapped = true;
          }
          setHasAutoSnapped(true);
        }
      }

      // Détecter la "première visite" dans le module
      // isFirstVisit = vrai SEULEMENT si :
      //   - aucune période publiée
      //   - max_initialized_period jamais défini (null, vide ou "null")
      //   - on n'a pas déjà répondu à la popup dans cette session
      const isFirstVisit =
        pubPeriodsRes &&
        (!pubPeriodsRes.published_periods ||
          (Array.isArray(pubPeriodsRes.published_periods) ? pubPeriodsRes.published_periods.length === 0 : Object.keys(pubPeriodsRes.published_periods).length === 0)) &&
        (!pubPeriodsRes.max_initialized_period || pubPeriodsRes.max_initialized_period === 'null' || pubPeriodsRes.max_initialized_period === null);

      const today = new Date();
      const currentRealMonthLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const isCurrentRealMonth = period === currentRealMonthLocal;

      // La popup ne s'affiche qu'une seule fois : mois courant réel, première visite, pas de site sélectionné
      // ET l'utilisateur n'a pas encore répondu (showFirstVisitModal pas déjà résolu)
      if (isFirstVisit && isCurrentRealMonth && !activeSiteId) {
        setShowFirstVisitModal(true);
      } else {
        // Si l'utilisateur a déjà répondu (max_initialized_period défini), on s'assure que la popup est fermée
        setShowFirstVisitModal(false);
      }

      if (res && res.success) {
        if (res.is_from_archive && res.archive_data) {
          // LECTURE DIRECTE DE LA PHOTO FIGEE (Court-circuit du mode temps réel)
          setSites(res.archive_data.sites || []);
          setGlobalAgents(res.archive_data.globalAgents || []);
          setLeaves(res.archive_data.leaves || []);
          if (activeSiteId) {
            setSiteData(res.archive_data.sites?.find(s => String(s.id) === String(activeSiteId))?.subsites || []);
          } else {
            setSiteData([]);
          }
          if (res.published_periods) {
            setPublishedPeriods(res.published_periods);
          }
        } else {
          // LOGIQUE NORMALE (TEMPS REEL)
          if (Array.isArray(res.sites)) {
            setSites(res.sites);
            localStorage.setItem('pontage_sites_cache', JSON.stringify(res.sites));
          }
          if (Array.isArray(res.global_agents)) {
            setGlobalAgents(res.global_agents);
          }
          if (res.published_periods) {
            setPublishedPeriods(res.published_periods);
  
            // Auto-snap en mode vérification pour toujours afficher le pointage actif
            if (isVerificationMode && !hasAutoSnapped && res.published_periods.length > 0) {
              const sortedPeriods = [...res.published_periods].sort().reverse();
              const latest = sortedPeriods[0];
              if (period !== latest) {
                setPeriod(latest);
                periodSnapped = true;
                setHasAutoSnapped(true);
              }
            }
          }
          if (activeSiteId) {
            // Si on vient de corriger la période (periodSnapped = true), 
            // on NE met PAS à jour siteData car il contient les données de l'ancienne période !
            // Cela évitera le flash où les pointages "1" disparaissent.
            if (!periodSnapped && Array.isArray(res.site_data)) {
              setSiteData(res.site_data);
            }
          } else {
            setSiteData([]);
          }
        }
      }
    } catch (e) {
      console.error("Erreur de chargement du tableau de bord:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeSiteId, period, archiveData]);

  // Polling en mode vérification : vérifie toutes les 10s si un pointage a été publié
  useEffect(() => {
    if (!isVerificationMode) return;
    const interval = setInterval(() => {
      loadPublishedPeriods();
    }, 10000);
    return () => clearInterval(interval);
  }, [isVerificationMode, period]);

  const loadPublishedPeriods = async () => {
    try {
      const res = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
      if (res && res.published_periods) {
        setPublishedPeriods(res.published_periods);
        // Charger le dernier mois initialisé depuis le backend (source de vérité unique)
        if (res.max_initialized_period) {
          setMaxInitializedPeriod(res.max_initialized_period);
        }

        // Auto-snap en mode vérification pour toujours afficher le pointage actif
        if (isVerificationMode && !hasAutoSnapped && res.published_periods.length > 0) {
          const sortedPeriods = [...res.published_periods].sort().reverse();
          const latest = sortedPeriods[0];
          if (latest && period !== latest) {
            setPeriod(latest);
            localStorage.setItem('pontage_period', latest);
          }
          setHasAutoSnapped(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishPeriod = async () => {
    setPublishing(true);
    setPublishProgress(0);

    // Simulate a 10-second progression before calling API
    for (let i = 0; i <= 100; i++) {
      setPublishProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      const res = await apiCall('publish_period', { period });
      if (res.success) {
        setPublishedPeriods([period]);
        // Archiver l'ordre des sites (opération technique annexe)
        await apiCall('archive_all_sites', { period, siteOrder: [] });
        
        // ✅ Photo figée : utiliser get_pointage_for_archive qui retourne les agents
        // AVEC leurs pointages complets (contrairement à archive_all_sites)
        try {
            const [snapshotRes, leavesRes] = await Promise.all([
                apiCall('get_pointage_for_archive', { period }, 'GET'),
                apiCall('get_leaves', {}, 'GET')
            ]);

            if (!snapshotRes.success) {
                throw new Error(snapshotRes.message || "Impossible de récupérer les données complètes du pointage.");
            }

            const pointageData = { 
                sites: snapshotRes.sites || [],
                leaves: leavesRes.success ? (leavesRes.leaves || []) : leaves,
                globalAgents: snapshotRes.global_agents || []
            };

            const archiveRes = await apiCall('archive_pointage', {
                period: period,
                data: JSON.stringify(pointageData)
            });
            
            if (archiveRes && archiveRes.success === false) {
                throw new Error(archiveRes.message || "La base de données n'a pas pu créer l'archive.");
            }
            console.log('✅ Photo figée enregistrée avec succès (agents + pointages complets)');
            
            // Activer la modale de succès AVANT de fermer la modale de publication
            setShowPublishSuccess(true);
            setShowPublishModal(false);
            // Recharger pour confirmer
            await loadPublishedPeriods();
        } catch (err) {
            console.error('Erreur lors de la sauvegarde dans archives_pointage', err);
            alert("Publication incomplète : Erreur lors de la création de la photo figée (archive_pointage). " + (err.message || err));
            // Ne pas fermer la modale de publication ou afficher le succès
        }
      }
    } catch (e) {
      console.error("Erreur publish_period", e);
      alert("Erreur lors de la publication : " + (e.message || e));
    } finally {
      setPublishing(false);
      setPublishProgress(0);
    }
  };

  const handleCancelNextMonth = () => {
    window._abortNextMonth = true;
    setInitializing(false);
    setShowNextMonthModal(false);
  };

  const handleNextMonth = async () => {
    window._abortNextMonth = false;
    setInitializing(true);
    setInitProgress(0);
    const duration = 10000;
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const intervalId = setInterval(() => {
      if (window._abortNextMonth) {
        clearInterval(intervalId);
        return;
      }
      currentStep++;
      setInitProgress(Math.min(100, Math.round((currentStep / steps) * 100)));
    }, intervalTime);

    let [year, month] = getSafePeriod(period).split('-').map(Number);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    const nextPeriodStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const nextMonthLabel = `${monthNames[month - 1]} ${year}`;

    try {
      const timerResult = await new Promise(resolve => {
        const checkAbort = setInterval(() => {
          if (window._abortNextMonth) {
            clearInterval(checkAbort);
            clearTimeout(timerId);
            resolve('ABORTED');
          }
        }, 100);
        const timerId = setTimeout(() => {
          clearInterval(checkAbort);
          resolve('DONE');
        }, duration);
      });

      if (timerResult === 'ABORTED' || window._abortNextMonth) {
        clearInterval(intervalId);
        console.log('[handleNextMonth] Processus annulé avant la création en base.');
        return;
      }

      await apiCall('init_next_period', { current_period: period, next_period: nextPeriodStr, sites_to_keep_hs: sitesToKeepHS });
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(intervalId);
      if (window._abortNextMonth) {
        console.log('[handleNextMonth] Processus annulé par l\'utilisateur.');
        return;
      }
      setInitProgress(100);
      console.log('[handleNextMonth] finally block reached, nextMonthLabel=', nextMonthLabel);
      setInitializing(false);
      setShowNextMonthModal(false);
      // Le backend sauvegarde max_initialized_period, on met à jour le state immédiatement
      setMaxInitializedPeriod(nextPeriodStr);
      // Naviguer directement vers le mois suivant SANS passer par changePeriod
      // (pour éviter que changePeriod réinitialise des flags ou effectue des actions indésirables)
      setHasAutoSnapped(true);
      setPeriod(nextPeriodStr);
      localStorage.setItem('pontage_period', nextPeriodStr);
      // ── Backdrop flou ─────────────────────────────────────────
      const backdrop = document.createElement('div');
      backdrop.id = 'welcome-month-backdrop';
      Object.assign(backdrop.style, {
        position: 'fixed', inset: '0',
        zIndex: '2147483646',
        background: 'rgba(2,8,20,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: '0', transition: 'opacity 0.45s ease'
      });
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => { backdrop.style.opacity = '1'; });

      // Fonction de fermeture partagée
      window._closeWelcomeToast = () => {
        const t = document.getElementById('welcome-month-toast');
        const b = document.getElementById('welcome-month-backdrop');
        if (t) { t.style.opacity = '0'; t.style.transform = 'translate(-50%,-50%) scale(0.94)'; setTimeout(() => t.remove(), 450); }
        if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 450); }
        delete window._closeWelcomeToast;
      };

      // ── Toast ──────────────────────────────────────────────────
      const toast = document.createElement('div');
      toast.id = 'welcome-month-toast';
      toast.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;position:relative">
          <div style="position:absolute;top:-50px;left:50%;transform:translateX(-50%);width:250px;height:150px;background:rgba(34,197,94,0.15);filter:blur(70px);z-index:-1;border-radius:50%"></div>
          <h2 className="toast-header-title" style="margin:0 0 8px 0;font-weight:900;font-size:2rem;letter-spacing:-0.03em;background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Bienvenue en ${nextMonthLabel} !</h2>
          <div className="toast-header-subtitle" style="color:#94a3b8;font-size:1rem;font-weight:600;letter-spacing:0.05em">Nouveau cycle de pointage initialisé avec succès</div>
        </div>
        
        <div style="display:grid;gap:12px;margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:12px 20px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:44px;height:44px;border-radius:14px;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 0 20px rgba(34,197,94,0.15)">✅</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Structure conservée</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Les sites, zones et agents ont été migrés vers la nouvelle période.</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:12px 20px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:44px;height:44px;border-radius:14px;background:rgba(56,189,248,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 0 20px rgba(56,189,248,0.15)">📅</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Prêt à la saisie</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Vous pouvez commencer à enregistrer les présences pour ce mois.</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:12px 20px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:44px;height:44px;border-radius:14px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 0 20px rgba(245,158,11,0.15)">🔔</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Service : ${user?.service || 'Opérations'}</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Connecté en tant que <strong style="color:#cbd5e1">${user?.name || user?.email || 'Admin'}</strong></div>
            </div>
          </div>
        </div>
        
        <div class="welcome-toast-buttons-row" style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;margin-top:auto">
          <div style="display:flex;align-items:center;gap:8px;color:#64748b;font-size:0.95rem;font-weight:600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Fermeture automatique dans 20s
          </div>
          <button onclick="window._closeWelcomeToast && window._closeWelcomeToast()" style="background:linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));border:1px solid rgba(255,255,255,0.2);color:#f8fafc;border-radius:12px;padding:12px 32px;cursor:pointer;font-size:1rem;font-weight:700;letter-spacing:0.02em;transition:all 0.2s;box-shadow:0 4px 15px rgba(0,0,0,0.2)" onmouseover="this.style.background='linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';this.style.transform='translateY(0)'">Fermer ✕</button>
        </div>
        <div id="welcome-toast-bar" style="position:absolute;bottom:0;left:0;height:6px;width:100%;background:linear-gradient(90deg, #4ade80, #06b6d4);border-radius:0 0 24px 24px;transition:width 20s linear;box-shadow:0 -2px 15px rgba(74,222,128,0.4)"></div>
      `;
      toast.className = 'welcome-month-toast-container';

      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => { const bar = document.getElementById('welcome-toast-bar'); if (bar) bar.style.width = '0%'; }, 100);
      });
      setTimeout(() => {
        if (window._closeWelcomeToast) window._closeWelcomeToast();
      }, 20000);

    }
  };





  const resetSiteContextState = () => {
    setShowAddSubsite(false);
    setShowAddAgent(false);
    setShowMutate(false);
    setContextMenu(null);
    setReposMenu(null);
    setShiftModalAgent(null);
    setNewSubsiteName('');
    setNewAgentName('');
    setNewAgentSubsiteId('');
    setMutateAgentId('');
    setMutateAgentName('');
    setMutateStart('');
    setMutateNewShiftType('CONSERVER');
    setMutateNewFunction('CONSERVER');
    setSearchMutationText('');
    setMutateDestSubsiteId('');
    setSearchTerm('');
    setErrorMsg('');
  };

  const selectSite = (id, name) => {
    resetSiteContextState();
    setLoading(true);
    setSiteData([]);
    setActiveSiteId(id);
    setActiveSiteName(name);
  };

  const backToSites = () => {
    resetSiteContextState();
    setActiveSiteId(null);
    setActiveSiteName('');
    setSiteData([]);
    localStorage.removeItem('pontage_activeSiteId');
    localStorage.removeItem('pontage_activeSiteName');
    sessionStorage.removeItem('pontage_fallback_activeSiteId');
    sessionStorage.removeItem('pontage_fallback_activeSiteName');
  };

  const changePeriod = (dir) => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    const d = new Date(year, month - 1 + dir, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setHasAutoSnapped(true); // Empêche le retour automatique au mois publié après un changement manuel
  };

  const handleFirstVisitOui = async () => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    const d = new Date(year, month, 1);
    const nextPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setPeriod(nextPeriod);
    localStorage.setItem('pontage_period', nextPeriod);
    setMaxInitializedPeriod(nextPeriod);
    setHasAutoSnapped(true);
    setShowFirstVisitModal(false);
    await apiCall('set_first_visit_period', { period: nextPeriod });
  };

  const handleFirstVisitNon = async () => {
    setShowFirstVisitModal(false);
    setMaxInitializedPeriod(period);
    await apiCall('set_first_visit_period', { period });
  };

  const handleFirstVisitIgnore = () => {
    setShowFirstVisitModal(false);
  };


  const getPeriodLabel = () => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isPastMonth = period < currentMonthStr && publishedPeriods.includes(period);
  const isEmptyPastMonth = !isArchiveMode && (maxInitializedPeriod ? (period < maxInitializedPeriod && !publishedPeriods.includes(period)) : (period < currentMonthStr && !publishedPeriods.includes(period)));
  // Un mois est "futur vide" seulement s'il dépasse le dernier mois initialisé
  const isEmptyFutureMonth = !isArchiveMode && (maxInitializedPeriod ? period > maxInitializedPeriod : false);
  const isEmptyMonth = !isArchiveMode && (isEmptyPastMonth || isEmptyFutureMonth) && !manuallyAdvancedToFuture;


  const SITE_EMOJIS = ['🏢', '🏗', '🏭', '🏬', '🏪', '🏦', '🏥', '🏨', '🏫', '🏛', '🗼', '🗽', '⛪', '🕌', '🕍', '🛕', '🏠', '🏡', '🏚', '🏰', '🏯', '⚓', '🚒', '🚑', '🚔', '🧱', '🔒', '🛡', '⚙️', '🔧', '🔑', '📡', '💡', '🌍', '🌿', '⭐', '🔥', '💎', '🎯', '📊'];

  const handleUpdateSiteIcon = async (siteId, icon) => {
    setIconPickerSiteId(null);
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, icon } : s));
    try {
      await apiCall('update_site_icon', { site_id: siteId, icon });
    } catch (e) {
      console.error(e);
    }
  };

  // Charger les données du site sélectionné
  const loadSiteData = async (silent = false) => {
    if (!activeSiteId) return;
    if (isArchiveMode) {
      setSiteData(archiveData.sites?.find(s => String(s.id) === String(activeSiteId))?.subsites || []);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('get_site_data', { site_id: activeSiteId, period }, 'GET');
      if (Array.isArray(res)) {
        setSiteData(res);
      }
    } catch (e) {
      console.error("Erreur get_site_data:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // loadSiteData is now handled by loadDashboardData upon activeSiteId/period changes

  const openAddAgentModal = () => {
    if (!isEditMode) {
      setShowReadOnlyAlert(true);
      return;
    }
    setShowAddAgent(true);
  };

  const requireEditMode = (callback) => {
    return (...args) => {
      if (!isEditMode) {
        setShowReadOnlyAlert(true);
        return;
      }
      return callback(...args);
    };
  };

  const openDeployExtraModal = async () => {
    try {
      // Charger TOUS les agents de tous les sites sauf administration via l'endpoint dédié
      const res = await apiCall('get_agents_for_deploy', {}, 'GET');
      if (res && res.success && res.agents) {
        // Filtrer pour exclure les agents déjà sur le site actif
        const currentSiteAgentIds = siteData.flatMap(sub => sub.agents || []).map(a => String(a.id));
        const filtered = res.agents.filter(a => !currentSiteAgentIds.includes(String(a.id)));
        setExtraAgents(filtered);
      } else {
        setExtraAgents([]);
      }
      setShowDeployExtra(true);
    } catch (e) {
      console.error("Failed to load agents", e);
    }
  };

  const handleDeployExtraSubmit = async (data) => {
    const { agentId, date, shift: manualShift } = data;
    const agent = extraAgents.find(a => String(a.id) === String(agentId));
    let shift = 'J';
    let displayShift = agent ? (agent.shift_type || 'J') : 'J';
    if (manualShift && manualShift !== 'AUTO') {
      shift = manualShift;
      displayShift = manualShift;
    } else {
      shift = agent ? agent.shift_type : 'J';
    }
    if (['24h', '48h', '72h'].includes(shift)) shift = 'J';

    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';

    if (date) {
      try {
        const updates = [{ agent_id: agentId, date: date, shift_code: shift, status: 'EXT|' + siteTitle, period }];
        const res = await apiCall('bulk_update_attendance', { updates });
        if (res && res.success) {
          // Si vacation forcée différente, mettre à jour le shift_type de l'agent
          if (manualShift && manualShift !== 'AUTO' && agent && manualShift !== agent.shift_type) {
            await apiCall('update_agent_info', { agent_id: agentId, field: 'shift_type', value: manualShift });
          }
          setShowDeployExtra(false);
          loadSiteData();
        } else {
          alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue du serveur'));
        }
      } catch (err) {
        console.error('[DeployExtra] Error:', err);
        alert('❌ Erreur réseau: ' + err.message);
      }
    } else {
      setSiteData(prevData => {
        const makeAgent = () => ({ ...agent, is_extra: true, original_site: 'EXTRA BUREAU', attendance: [], shift_type: displayShift });
        if (prevData.length === 0) {
          return [{ id: 'default_' + activeSiteId, name: 'Zone Principale', agents: [makeAgent()] }];
        }
        return prevData.map((subsite, index) => {
          const isTarget = String(subsite.id) === 'default_' + activeSiteId || (prevData.findIndex(s => String(s.id) === 'default_' + activeSiteId) === -1 && index === 0);
          if (isTarget && agent) {
            const exists = subsite.agents?.find(a => String(a.id) === String(agent.id));
            if (!exists) {
              return { ...subsite, agents: [...(subsite.agents || []), makeAgent()] };
            }
          }
          return subsite;
        });
      });
      setShowDeployExtra(false);
    }
  };

  const handleUpdateSubsiteConfig = async (subsiteId, enabled, enabledFunctionsArray = []) => {
    try {
      const res = await apiCall('update_subsite_config', { subsite_id: subsiteId, costume_enabled: enabled, enabled_functions: enabledFunctionsArray });
      if (res && res.success) {
        setSiteData(prevData => prevData.map(subsite => {
          if (subsite.id === subsiteId) {
            return { ...subsite, costume_enabled: enabled ? 1 : 0, enabled_functions: enabledFunctionsArray };
          }
          return subsite;
        }));
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Impossible de mettre à jour la configuration'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau: ' + e.message);
    }
  };

  const openDeployReleveModal = async () => {
    try {
      const res = await apiCall('get_site_data', { site_id: 'site_releves', period }, 'GET');
      if (res && res.length > 0 && res[0].agents) {
        setReleveAgents(res[0].agents);
      } else {
        setReleveAgents([]);
      }
      setShowDeployReleve(true);
    } catch (e) {
      console.error("Failed to load releves", e);
    }
  };

  const handleDeployReleveSubmit = async (data) => {
    const { agentId, date, shift: manualShift } = data;
    const agent = releveAgents.find(a => String(a.id) === String(agentId));
    let shift = 'J';
    let displayShift = agent ? (agent.shift_type || 'J') : 'J';
    if (manualShift && manualShift !== 'AUTO') {
      shift = manualShift;
      displayShift = manualShift;
    } else {
      shift = agent ? agent.shift_type : 'J';
    }
    if (['24h', '48h', '72h'].includes(shift)) shift = 'J';

    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';

    if (date) {
      try {
        const updates = [{ agent_id: agentId, date: date, shift_code: shift, status: 'REL_1|' + siteTitle, period }];

        if (data.replacedAgentId && data.replacedAgentStatus) {
          const replAgent = siteData.flatMap(s => s.agents).find(a => String(a.id) === String(data.replacedAgentId));
          const replShift = replAgent ? (replAgent.shift_type === 'Nuit' ? 'N' : 'J') : 'J';
          updates.push({ agent_id: data.replacedAgentId, date: date, shift_code: replShift, status: data.replacedAgentStatus, period });
        }

        const res = await apiCall('bulk_update_attendance', { updates });
        if (res && res.success) {
          if (manualShift && manualShift !== 'AUTO' && agent && manualShift !== agent.shift_type) {
            await apiCall('update_agent_info', { agent_id: agentId, field: 'shift_type', value: manualShift });
          }
          setShowDeployReleve(false);
          loadSiteData();
        } else {
          alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue du serveur'));
        }
      } catch (err) {
        console.error('[DeployReleve] Error:', err);
        alert('❌ Erreur réseau: ' + err.message);
      }
    } else {
      setSiteData(prevData => {
        const makeAgent = () => ({ ...agent, is_releve: true, original_site: 'Vivier des Relèves', attendance: [], shift_type: displayShift });
        if (prevData.length === 0) {
          return [{ id: 'default_' + activeSiteId, name: 'Zone Principale', agents: [makeAgent()] }];
        }
        return prevData.map((subsite, index) => {
          const isTarget = String(subsite.id) === 'default_' + activeSiteId || (prevData.findIndex(s => String(s.id) === 'default_' + activeSiteId) === -1 && index === 0);
          if (isTarget && agent) {
            const exists = subsite.agents?.find(a => String(a.id) === String(agent.id));
            if (!exists) {
              return { ...subsite, agents: [...(subsite.agents || []), makeAgent()] };
            }
          }
          return subsite;
        });
      });
      setShowDeployReleve(false);
    }
  };

  // Générer la liste des périodes (mois)
  const getPeriodsList = () => {
    const list = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = d.toISOString().slice(0, 7);
      list.push({
        value: val,
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      });
    }
    return list;
  };

  // Générer les dates de la période de paie
  const getDates = () => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    const startDate = new Date(year, month - 2, cycleStart);
    const endDate = new Date(year, month - 1, cycleStart - 1);

    const list = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      list.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  };

  const datesList = getDates();

  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
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
      executeAssignRepos,
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
  // Actions d'administration de site
  const handleCreateSite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newSiteName.trim()) return;
    if (!newSiteLocation) {
      setErrorMsg('Veuillez préciser si le site est à Abidjan ou à l\'Intérieur.');
      return;
    }

    try {
      const endpoint = isSpecialSite ? 'add_special_site' : 'add_site';
      const payload = isSpecialSite ? { name: newSiteName, type: specialSiteType, location: newSiteLocation } : { name: newSiteName, location: newSiteLocation };
      const res = await apiCall(endpoint, payload);
      if (res.success) {
        if (isSpecialSite && specialSiteType === 'definir' && res.site_id) {
          localStorage.setItem('pontage_display_mode_' + res.site_id, customBehavior);
        }
        setNewSiteName('');
        setNewSiteLocation('');
        setIsSpecialSite(false);
        setShowAddSite(false);
        await loadDashboardData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleRenameSite = async (e) => {
    e.preventDefault();
    if (!renameSiteName.trim() || !siteContextMenu.siteId) return;
    try {
      const res = await apiCall('rename_site', { site_id: siteContextMenu.siteId, name: renameSiteName });
      if (res.success) {
        setShowRenameSiteModal(false);
        setSiteContextMenu({ ...siteContextMenu, visible: false });
        await loadDashboardData();
        if (activeSiteId === siteContextMenu.siteId) {
          setActiveSiteName(renameSiteName);
        }
      } else {
        alert(res.message || "Erreur lors du renommage");
      }
    } catch (err) {
      alert("Erreur réseau");
    }
  };

  const handleDeleteSite = async () => {
    if (!siteContextMenu.siteId) return;
    try {
      const res = await apiCall('delete_site', { site_id: siteContextMenu.siteId });
      if (res.success) {
        setShowDeleteSiteModal(false);
        setSiteContextMenu({ ...siteContextMenu, visible: false });
        if (activeSiteId === siteContextMenu.siteId) {
          setActiveSiteId(null);
          setActiveSiteName('');
        }
        await loadDashboardData();
      } else {
        alert(res.message || "Impossible de supprimer ce site");
        setShowDeleteSiteModal(false);
      }
    } catch (err) {
      alert("Erreur réseau");
    }
  };

  const handleCreateSubsite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newSubsiteName.trim() || !activeSiteId) return;

    try {
      const res = await apiCall('add_subsite', { site_id: activeSiteId, name: newSubsiteName });
      if (res.success) {
        setNewSubsiteName('');
        setShowAddSubsite(false);
        loadSiteData();
        loadDashboardData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleEditAdminScheduleClick = (agentId) => {
    const allAgents = siteData.flatMap(s => s.agents || []);
    const agent = allAgents.find(a => String(a.id) === String(agentId));
    if (!agent) return;
    
    let adminDays = [6, 7]; // default
    if (agent.profile_data) {
      try {
        const pd = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : agent.profile_data;
        if (pd.admin_schedule_days && Array.isArray(pd.admin_schedule_days)) {
          adminDays = pd.admin_schedule_days;
        } else if (pd.admin_schedule) {
          adminDays = [6, 7];
        } else {
          adminDays = [];
        }
      } catch (e) {
        console.error("Erreur parsing profile_data", e);
      }
    }
    
    setEditAdminScheduleAgent(agent);
    setEditAdminScheduleDays(adminDays);
    setShowEditAdminScheduleModal(true);
    setReposMenu({ visible: false, agentId: null, x: 0, y: 0 });
  };

  const handleSaveAdminSchedule = async () => {
    if (!editAdminScheduleAgent) return;
    try {
      setLoading(true);
      const res = await apiCall('update_agent_admin_schedule', {
        agent_id: editAdminScheduleAgent.id,
        admin_schedule_days: editAdminScheduleDays,
        period: period
      });
      if (res.success) {
        await loadSiteData(true);
        setShowEditAdminScheduleModal(false);
        setEditAdminScheduleAgent(null);
      } else {
        alert(res.message || 'Erreur lors de la mise à jour des jours de repos.');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSpecialServiceClick = (agent) => {
    setEditSpecialServiceAgent(agent);
    
    // Charger les données du profil
    const profile = agent.profile_data || {};
    setEditSpecialServiceBase(profile.special_service_base || 12);
    setEditSpecialServiceDays(profile.special_service_days || []);
    
    // Déterminer s'il est Entrant ou avec Date de début
    const hireDate = agent.hire_date || '';
    
    // Analyser les présences pour savoir s'il y a des cellules ENTRANT ou NON_PRESENT
    let hasEntrantDays = false;
    if (agent.attendance) {
      Object.values(agent.attendance).forEach(days => {
        Object.values(days).forEach(status => {
          if (status === 'ENTRANT') hasEntrantDays = true;
        });
      });
    }

    if (hireDate) {
      if (hasEntrantDays) {
        setEditSpecialServiceIsEntrant(true);
        setEditSpecialServiceEntrantDate(hireDate);
        setEditSpecialServiceIsDebut(false);
        setEditSpecialServiceDebutDate('');
      } else {
        setEditSpecialServiceIsEntrant(false);
        setEditSpecialServiceEntrantDate('');
        setEditSpecialServiceIsDebut(true);
        setEditSpecialServiceDebutDate(hireDate);
      }
    } else {
      setEditSpecialServiceIsEntrant(false);
      setEditSpecialServiceEntrantDate('');
      setEditSpecialServiceIsDebut(false);
      setEditSpecialServiceDebutDate('');
    }
    
    setShowEditSpecialServiceModal(true);
  };

  const handleSaveSpecialService = async () => {
    if (!editSpecialServiceAgent) return;
    
    try {
      const res = await apiCall('update_agent_special_service', {
        agent_id: editSpecialServiceAgent.id,
        specialServiceBase: editSpecialServiceBase,
        specialServiceDays: editSpecialServiceDays,
        isEntrant: editSpecialServiceIsEntrant,
        entrantDate: editSpecialServiceEntrantDate,
        isDebut: editSpecialServiceIsDebut,
        debutDate: editSpecialServiceDebutDate,
        period
      });
      
      if (res.success) {
        setShowEditSpecialServiceModal(false);
        setEditSpecialServiceAgent(null);
        loadSiteData(true); // Recharger silencieusement les données
      } else {
        alert("Erreur lors de la sauvegarde : " + (res.message || "Erreur inconnue"));
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  const handleCreateAgentFromModal = async (agentData) => {
    setErrorMsg('');
    try {
      const res = await apiCall('add_agent', {
        site_id: activeSiteId,
        subsite_id: agentData.subsiteId,
        name: agentData.name,
        function: agentData.agentFunction || '',
        shift_type: agentData.shiftType,
        contract_end_date: agentData.contractEnd || null,
        schedule: agentData.schedule,
        adminSchedule: agentData.adminSchedule,
        adminScheduleDays: agentData.adminScheduleDays,
        specialService: agentData.specialService,
        specialServiceBase: agentData.specialServiceBase,
        specialServiceDays: agentData.specialServiceDays,
        disableDefaultRepos: agentData.disableDefaultRepos,
        isEntrant: agentData.isEntrant,
        entrantDate: agentData.entrantDate,
        entrantMotif: agentData.entrantMotif,
        reposDay: agentData.reposDay,
        shiftPattern: agentData.shiftPattern,
        // Pour les agents TP avec "Définir une date" : la date de début est traitée directement
        // côté serveur dans add_agent (marque les jours avant comme ENTRANT)
        debutDate: (agentData.specialService && agentData.isDebut && agentData.debutDate) ? agentData.debutDate : undefined,
        period
      });
      if (res.success) {
        console.log('[DEBUG] add_agent response:', res);
        if (agentData.isEntrant && agentData.entrantDate && res.agent_id) {
          await apiCall('mark_agent_entrant', {
            agent_id: res.agent_id,
            start_date: agentData.entrantDate,
            entrant_motif: agentData.entrantMotif,
            function: agentData.agentFunction || '',
            period
          });
        }
        // Pour les agents non-TP avec isDebut (vraie migration depuis un autre site)
        if (agentData.isDebut && agentData.debutDate && !agentData.specialService) {
          if (!res.agent_id) {
            alert('Erreur: agent_id non retourné par le backend lors de la création.');
          } else {
            // Pour une vraie migration depuis un autre site, on utilise mark_agent_debut
            const resDebut = await apiCall('mark_agent_debut', {
              agent_id: res.agent_id,
              start_date: agentData.debutDate,
              ancien_site: agentData.ancienSite || '',
              period
            });
            if (!resDebut.success) {
              alert("Échec de la migration du pointage : " + (resDebut.message || "Erreur inconnue"));
            }
          }
        }
        // Fermer le modal IMMÉDIATEMENT (avant le rechargement)
        // siteData existant reste visible — aucun flash possible
        setShowAddAgent(false);
        // Rechargement silencieux : met à jour les données complètes depuis le serveur
        // sans déclencher l'indicateur de chargement (évite le flash "Aucune zone ou agent")
        loadSiteData(true);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleDeleteAgent = (agentId) => {
    // Bloquer si la zone est verrouillée
    let agentSubsiteId = null;
    for (let sub of siteData) {
      if (sub.agents?.some(a => String(a.id) === String(agentId))) {
        agentSubsiteId = sub.id;
        break;
      }
    }
    if (agentSubsiteId && lockedZones.includes(agentSubsiteId)) {
      return;
    }

    setDeleteAgentConfirm(agentId);
  };

  const confirmDeleteAgent = async () => {
    if (!deleteAgentConfirm) return;
    try {
      const res = await apiCall('delete_agent', { agent_id: deleteAgentConfirm });
      if (res.success) {
        setDeleteAgentConfirm(null);
        loadSiteData(true); // Rechargement silencieux
      } else {
        alert(res.message || "Erreur lors de la suppression");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAgentMutations = async (agentId) => {
    // Bloquer si la zone est verrouillée
    let agentSubsiteId = null;
    for (let sub of siteData) {
      if (sub.agents?.some(a => String(a.id) === String(agentId))) {
        agentSubsiteId = sub.id;
        break;
      }
    }
    if (agentSubsiteId && lockedZones.includes(agentSubsiteId)) {
      return;
    }

    if (!window.confirm("Voulez-vous retirer cet agent de ce site de passage ? (Cela n'affectera pas son historique sur son site d'origine)")) return;
    try {
      const activeSiteName = sites.find(s => String(s.id) === String(activeSiteId))?.name || '';
      const res = await apiCall('clear_agent_site_mutations', { agent_id: agentId, site_name: activeSiteName, period });
      if (res.success) {
        loadSiteData(true); // Rechargement silencieux
      } else {
        alert(res.message || "Erreur lors du retrait de l'agent");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubsite = (subsiteId) => {
    setDeleteZoneConfirmId(subsiteId);
  };

  const executeDeleteSubsite = async () => {
    if (!deleteZoneConfirmId) return;
    try {
      const res = await apiCall('delete_subsite', { subsite_id: deleteZoneConfirmId });
      if (res.success) {
        loadSiteData(true); // Rechargement silencieux
        loadDashboardData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteZoneConfirmId(null);
    }
  };

  const handleInitPeriodRotation = async () => {
    if (!activeSiteId) return;
    if (!window.confirm("Cette action va pré-remplir le calendrier de ce site selon les roulements définis de chaque agent. Continuer ?")) return;
    setLoading(true);
    try {
      const res = await apiCall('init_site_period', { site_id: activeSiteId, period });
      if (res.success) {
        loadSiteData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleArchivePeriod = async () => {
    if (!window.confirm(`Voulez-vous figer et archiver les pointages pour la période ${period} ?`)) return;
    try {
      const res = await apiCall('archive_all_sites', { period });
      if (res.success) {
        alert("Période archivée avec succès !");
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetYear = async () => {
    if (!activeSiteId) return;
    const year = period.substring(0, 4);
    if (!window.confirm(`ATTENTION DANGER !\n\nÊtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT tous les pointages, zones et agents de l'année ${year} pour ce site ?\n\nLe site sera entièrement vidé.`)) return;
    try {
      const res = await apiCall('reset_year_attendance', { site_id: activeSiteId, year });
      if (res.success) {
        alert("L'année a été réinitialisée avec succès. Le site a été vidé.");
        loadSiteData();
      } else {
        alert(res.message || "Erreur lors de la réinitialisation");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    }
  };

  const handleClearMutations = async () => {
    if (!activeSiteId) return;
    if (!window.confirm("Supprimer toutes les mutations de ce site pour cette période ?")) return;
    try {
      const res = await apiCall('clear_site_mutations', { site_id: activeSiteId, period });
      if (res.success) {
        loadSiteData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAgentField = async (agentId, field, value) => {
    // Bloquer si la zone est verrouillée
    let agentSubsiteId = null;
    for (let sub of siteData) {
      if (sub.agents?.some(a => String(a.id) === String(agentId))) {
        agentSubsiteId = sub.id;
        break;
      }
    }
    if (agentSubsiteId && lockedZones.includes(agentSubsiteId)) {
      return;
    }

    // Optimistic Update
    setSiteData(prev => prev.map(sub => ({
      ...sub,
      agents: sub.agents?.map(ag => {
        if (String(ag.id) === String(agentId)) {
          return { ...ag, [field]: value };
        }
        return ag;
      })
    })));

    try {
      const res = await apiCall('update_agent_info', {
        agent_id: agentId,
        site_id: activeSiteId,
        field,
        value,
        period
      });
      if (!res.success) {
        loadSiteData(); // Rollback on error
      }
    } catch (e) {
      console.error(e);
      loadSiteData(); // Rollback on error
    }
  };


  const getDayLabel = (date) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[date.getDay()];
  };

  const handleShiftChangeSubmit = async (e) => {
    e.preventDefault();
    if (!showShiftChangeMenu) return;

    setLoading(true);
    try {
      const res = await apiCall('change_agent_shift', {
        agent_id: showShiftChangeMenu.id,
        site_id: activeSiteId,
        date: shiftChangeDate,
        new_shift: shiftChangeNewType,
        period: period
      });
      if (res.success) {
        setShowShiftChangeMenu(null);
        await loadSiteData();
      } else {
        alert(res.message || "Erreur lors du changement de vacation");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion");
      setLoading(false);
    }
  };

  const handleApplyPattern = async (cycleLen, workDays, offset, shiftType) => {
    if (!shiftModalAgent) return;
    setIsGenerating(true);
    try {
      const res = await apiCall('apply_batch_rotation', {
        agent_id: shiftModalAgent.id,
        site_id: activeSiteId,
        period: period,
        cycle: cycleLen,
        work: workDays,
        offset: offset,
        shift_type: shiftType
      });
      if (res.success) {
        setShiftModalAgent(null);
        await loadSiteData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenameSubsite = (subsiteId, currentName) => {
    setRenameSubsiteModalData({ subsiteId, currentName });
  };

  const executeRenameSubsite = async (newName) => {
    if (!newName || !renameSubsiteModalData) return;
    const { subsiteId, currentName } = renameSubsiteModalData;
    if (newName === currentName) {
      setRenameSubsiteModalData(null);
      return;
    }
    try {
      const res = await apiCall('rename_subsite', { subsite_id: subsiteId, name: newName.trim() });
      if (res.success) {
        loadSiteData();
        loadDashboardData();
        setRenameSubsiteModalData(null);
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  const renderPatternOptions = () => {
    let cycleLen, workDays, shiftDescription;
    if (shiftModalType === '24h') { cycleLen = 2; workDays = 1; shiftDescription = "1 jour de service (J/N) et 1 jour de repos"; }
    else if (shiftModalType === '48h') { cycleLen = 4; workDays = 2; shiftDescription = "2 jours de service (J/N) et 2 jours de repos"; }
    else if (shiftModalType === '72h') { cycleLen = 6; workDays = 3; shiftDescription = "3 jours de service (J/N) et 3 jours de repos"; }
    else { cycleLen = 1; workDays = 1; shiftDescription = `Sa ligne s'affiche en ${shiftModalType.toLowerCase()}`; }

    const startDay = 21; // Par défaut
    const nextDay = 22;
    const thirdDay = 23;

    const renderHeader = () => (
      <div style={{ padding: '10px', marginBottom: '15px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
        Logique appliquée : {shiftDescription}
      </div>
    );

    if (shiftModalType === 'Jour' || shiftModalType === 'Nuit') {
      const firstDayOfWeek = datesList && datesList.length > 0 ? new Date(datesList[0]).getDay() : 0;
      const days = [
        { label: 'Dimanche', value: 0 },
        { label: 'Lundi', value: 1 },
        { label: 'Mardi', value: 2 },
        { label: 'Mercredi', value: 3 },
        { label: 'Jeudi', value: 4 },
        { label: 'Vendredi', value: 5 },
        { label: 'Samedi', value: 6 }
      ];

      return (
        <>
          {renderHeader()}
          <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%', textAlign: 'left', marginBottom: '8px' }}
            onClick={async () => {
              await handleUpdateAgentField(shiftModalAgent.id, 'shift_type', shiftModalType);
              await handleApplyPattern(1, 1, 0, shiftModalType);
            }}>
            <span style={{ fontFamily: 'Segoe UI Emoji' }}>🟢🟢🟢🟢🟢🟢</span>
            <span style={{ fontSize: '0.85rem', marginLeft: '10px' }}>Tout remplir en Présence (Sans repos)</span>
          </button>

          <div style={{ marginTop: '15px', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
            Ou générer avec un jour de Repos Automatique :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {days.map(d => {
              const offset = (d.value + 1 - firstDayOfWeek + 7) % 7;
              return (
                <button key={d.value} className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'left', padding: '8px 12px' }}
                  onClick={async () => {
                    await handleUpdateAgentField(shiftModalAgent.id, 'shift_type', shiftModalType);
                    await handleApplyPattern(7, 6, offset, shiftModalType);
                  }}>
                  <span style={{ fontSize: '0.85rem' }}>Repos le {d.label}</span>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    let allowed = [0, 1, workDays, workDays + 1].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);
    if (shiftModalType === '72h') {
      allowed = [0, 1, 2, workDays, workDays + 1, workDays + 2].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);
    }

    return (
      <>
        {renderHeader()}
        {allowed.map(offset => {
          let preview = "";
          for (let i = 0; i < 6; i++) {
            let pos = (i - offset) % cycleLen;
            if (pos < 0) pos += cycleLen;
            preview += (pos < workDays) ? "🟢" : "⚪";
          }
          let desc = "";
          if (shiftModalType === '48h') {
            if (offset === 0) desc = `Commencer Travail le ${startDay} / Repos le ${thirdDay}`;
            else if (offset === 1) desc = `Commencer Travail le ${nextDay} / Repos le ${thirdDay + 1}`;
            else if (offset === workDays) desc = `Commencer Travail le ${thirdDay} / Repos le ${startDay}`;
            else if (offset === workDays + 1) desc = `Commencer Travail le ${thirdDay + 1} / Repos le ${nextDay}`;
          } else {
            if (offset === 0) desc = `Commencer Travail le ${startDay}`;
            else if (offset === 1) desc = `Commencer Travail le ${nextDay}`;
            else if (offset === 2) desc = `Commencer Travail le ${thirdDay}`;
            else if (offset === workDays) desc = `Commencer Repos le ${startDay}`;
            else if (offset === workDays + 1) desc = `Commencer Repos le ${nextDay}`;
            else if (offset === workDays + 2) desc = `Commencer Repos le ${thirdDay}`;
          }

          return (
            <button key={offset} className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%', textAlign: 'left', marginBottom: '8px' }}
              onClick={async () => {
                await handleUpdateAgentField(shiftModalAgent.id, 'shift_type', shiftModalType);
                await handleApplyPattern(cycleLen, workDays, offset, shiftModalType);
              }}>
              <span style={{ fontFamily: 'Segoe UI Emoji' }}>{preview}</span>
              <span style={{ fontSize: '0.85rem', marginLeft: '10px' }}>{desc}</span>
            </button>
          );
        })}

        <div style={{ marginTop: '15px' }}>
          {!showCustomRotation ? (
            <button className="btn" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px dashed rgba(56, 189, 248, 0.3)', width: '100%', padding: '10px', borderRadius: '8px' }} onClick={() => setShowCustomRotation(true)}>
              ⚙️ Configurer...
            </button>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Date de début personnalisée</div>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <select className="form-control" value={customRotationType} onChange={e => setCustomRotationType(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <option value="Travail">Commencer le Travail le...</option>
                  <option value="Repos">Commencer le Repos le...</option>
                </select>
                <select className="form-control" value={customRotationDate} onChange={e => setCustomRotationDate(Number(e.target.value))} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '6px' }}>
                  {datesList && datesList.map((dt, idx) => (
                    <option key={dt} value={idx}>{new Date(dt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowCustomRotation(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={async () => {
                  let customOffset = 0;
                  if (customRotationType === 'Travail') {
                    customOffset = customRotationDate % cycleLen;
                  } else {
                    customOffset = (customRotationDate - workDays) % cycleLen;
                    if (customOffset < 0) customOffset += cycleLen;
                  }
                  await handleUpdateAgentField(shiftModalAgent.id, 'shift_type', shiftModalType);
                  await handleApplyPattern(cycleLen, workDays, customOffset, shiftModalType);
                  setShowCustomRotation(false);
                }}>Générer</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const handleMutateSubmit = async (e) => {
    e.preventDefault();
    setIsMutating(true);
    setErrorMsg('');
    if (!mutateAgentId || !mutateStart || !mutateDestSubsiteId) {
      setErrorMsg("Veuillez sélectionner une zone de destination valide depuis la liste.");
      setIsMutating(false);
      return;
    }

    // Timeout de sécurité : débloque le bouton après 45s si pas de réponse serveur
    const mutationTimeout = setTimeout(() => {
      setIsMutating(false);
      setErrorMsg("La mutation a pris trop de temps. Vérifiez votre connexion et réessayez.");
    }, 45000);

    try {
      const res = await apiCall('apply_mutation', {
        agent_id: mutateAgentId,
        start_date: mutateStart,
        destination_subsite_id: mutateDestSubsiteId,
        destination_name: searchMutationText,
        new_shift_type: mutateNewShiftType,
        new_function: mutateNewFunction,
        merge_mode: localStorage.getItem('pontage_mutation_merge_mode') || 'smart',
        period
      });
      clearTimeout(mutationTimeout);
      if (res.success) {
        setShowMutate(false);
        loadDashboardData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      clearTimeout(mutationTimeout);
      setErrorMsg("Erreur réseau");
    } finally {
      setIsMutating(false);
    }
  };

  const openMutateModal = (agent) => {
    setMutateAgentId(agent.id);
    setMutateAgentName(agent.name);
    // Pré-remplir les dates de la période par défaut
    const startStr = formatDateKey(datesList[0]);
    const endStr = formatDateKey(datesList[datesList.length - 1]);
    setMutateStart(startStr);
    setSearchMutationText('');
    setMutateDestSubsiteId('');
    setMutateNewShiftType('CONSERVER');
    setMutateNewFunction('CONSERVER');
    setShowMutate(true);
  };

  // Utilitaires de calculs pour les stats
  const getDashboardStats = () => {
    let totalZones = siteData.length;
    let totalAgents = 0;
    let totalSup = 0;
    let totalAbsences = 0;
    let totalPermissions = 0;
    let totalConges = 0;

    siteData.forEach(sub => {
      // Ne pas compter le dossier des mutés temporaires
      if (!sub || !sub.id || String(sub.id).startsWith('mutated_')) return;

      (sub.agents || []).forEach(agent => {
        if (!agent) return;

        // Ne pas compter les agents de passage (relèves distantes)
        if (!(agent.is_releve && activeSiteId !== 'site_releves')) {
          totalAgents++;
        }

        // Trouver les congés et permissions pour cet agent
        const agentLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id));

        let hasConges = false;

        // Pour éviter de compter un congé plusieurs fois sur la même journée (si multi-lignes J/N),
        // on va isoler les dates uniques de présence de cet agent.
        const uniqueDates = [...new Set((agent.attendance || []).map(a => a.date))].filter(Boolean);

        uniqueDates.forEach(dk => {
          // Vérifier s'il y a un congé ou permission sur cette date
          const activeCp = agentLeaves.find(l => l.start_date <= dk && l.end_date >= dk && (l.type === 'CP' || l.type === 'CSS'));
          if (activeCp) {
            hasConges = true;
          } else {
            const activePerm = agentLeaves.find(l => l.start_date <= dk && l.end_date >= dk && l.type === 'P');
            if (activePerm) {
              totalPermissions++;
            }
          }
        });

        (agent.attendance || []).forEach(att => {
          const sc = att.shift_code ?? '';
          const st = att.status ?? '';
          const dk = att.date;

          if (!dk) return;

          // Lignes supplémentaires classiques (codes S, SJ, SN)
          const isSupplRow = sc === 'S' || sc === 'SJ' || sc === 'SN' || sc === 'SP';
          const hasValue = st === '1' || Number(st) > 0 || (typeof st === 'string' && st.startsWith('Suppl')) ||
            (typeof st === 'string' && (st.startsWith('EXT_1|') || st.startsWith('REL_1|') || st.startsWith('M_1|')));
          if (isSupplRow && hasValue) {
            totalSup++;
          }
          // Cas où le status lui-même encode un supplément (ligne J/N/24h normale avec valeur Suppl)
          if (!isSupplRow && typeof st === 'string' && st.startsWith('Suppl')) {
            totalSup++;
          }

          // Ne pas compter les absences si on est dans un CP (le CP l'emporte)
          const isCp = agentLeaves.some(l => l.start_date <= dk && l.end_date >= dk && (l.type === 'CP' || l.type === 'CSS'));
          if (!isCp) {
            const isExitStatus = ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || (typeof st === 'string' && st.startsWith('SORTANT_'));
            if (st === 'A' || st === 'M' || isExitStatus) totalAbsences++;
            if (st === 'P') {
              // Au cas où une permission a été enregistrée en dur dans la cellule (legacy)
              const isAlreadyCounted = agentLeaves.some(l => l.start_date <= dk && l.end_date >= dk && l.type === 'P');
              if (!isAlreadyCounted) totalPermissions++;
            }
          }
        });

        if (hasConges) totalConges++;
      });
    });

    return { totalZones, totalAgents, totalSup, totalAbsences, totalPermissions, totalConges };
  };


  return {
    showAddSite,
    setShowAddSite,
    showAddSubsite,
    setShowAddSubsite,
    showAddAgent,
    setShowAddAgent,
    showDeleteAgent,
    setShowDeleteAgent,
    deleteSiteData,
    setDeleteSiteData,
    showFaqModal,
    setShowFaqModal,
    expandedFaq,
    setExpandedFaq,
    showRenameAgentModal,
    setShowRenameAgentModal,
    renameAgentTarget,
    setRenameAgentTarget,
    renameAgentNewName,
    setRenameAgentNewName,
    showDeployExtra,
    setShowDeployExtra,
    extraAgents,
    setExtraAgents,
    showClosedMonthModal,
    setShowClosedMonthModal,
    showManageFunctionsModal,
    setShowManageFunctionsModal,
    showDeployReleve,
    setShowDeployReleve,
    releveAgents,
    setReleveAgents,
    deployReleveDefaultAgentId,
    setDeployReleveDefaultAgentId,
    deployReleveDefaultDate,
    setDeployReleveDefaultDate,
    enableAnimations,
    setEnableAnimations,
    cpInfoModal,
    setCpInfoModal,
    externalSuppDetailsModal,
    setExternalSuppDetailsModal,
    agentTableMode,
    setAgentTableMode,
    showTableModeMenu,
    setShowTableModeMenu,
    supplModal,
    setSupplModal,
    transferModal,
    setTransferModal,
    getRobustBehavior,
    setRobustBehavior,
    isEditMode,
    setIsEditMode,
    showReadOnlyAlert,
    setShowReadOnlyAlert,
    editModeBehavior,
    setEditModeBehavior,
    getCyclePeriodForDate,
    releveSupplModal,
    setReleveSupplModal,
    scheduleModalAgent,
    setScheduleModalAgent,
    setAndSaveAgentTableMode,
    agentSpacingMode,
    setAgentSpacingMode,
    setAndSaveAgentSpacingMode,
    siteTableModes,
    setSiteTableModes,
    setAndSaveSiteTableMode,
    agentSortOrder,
    setAgentSortOrder,
    setAndSaveAgentSortOrder,
    zoneSortOrder,
    setZoneSortOrder,
    setAndSaveZoneSortOrder,
    siteContextMenu,
    setSiteContextMenu,
    showRenameSiteModal,
    setShowRenameSiteModal,
    renameSiteName,
    setRenameSiteName,
    showDeleteSiteModal,
    setShowDeleteSiteModal,
    showShiftChangeMenu,
    setShowShiftChangeMenu,
    shiftChangeDate,
    setShiftChangeDate,
    shiftChangeNewType,
    setShiftChangeNewType,
    showSortantModal,
    setShowSortantModal,
    sortantAgentId,
    setSortantAgentId,
    sortantAgentName,
    setSortantAgentName,
    sortantDate,
    setSortantDate,
    sortantType,
    setSortantType,
    sortantCustomReason,
    setSortantCustomReason,
    showEntrantModal,
    setShowEntrantModal,
    entrantAgentId,
    setEntrantAgentId,
    entrantAgentName,
    setEntrantAgentName,
    entrantDate,
    setEntrantDate,
    entrantFunction,
    setEntrantFunction,
    selectedCell,
    setSelectedCell,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    isSelecting,
    setIsSelecting,
    showMutate,
    setShowMutate,
    isMutating,
    setIsMutating,
    costumeModes,
    setCostumeModes,
    handleConfirmEntrant,
    handleConfirmSortant,
    contextMenu,
    setContextMenu,
    leaves,
    setLeaves,
    showMapModal,
    mapAgentId,
    mapAgentName,
    mapStartDate,
    mapEndDate,
    mapNavOffset,
    mapManualDuration,
    editingMapLeaveId,
    setShowMapModal,
    setMapAgentId,
    setMapAgentName,
    setMapStartDate,
    setMapEndDate,
    setMapNavOffset,
    setMapManualDuration,
    setEditingMapLeaveId,
    handleMapSubmit,
    showAbsenceModal,
    absenceAgentId,
    absenceAgentName,
    absenceStartDate,
    absenceEndDate,
    absenceNavOffset,
    absenceManualDuration,
    editingAbsenceLeaveId,
    setShowAbsenceModal,
    setAbsenceAgentId,
    setAbsenceAgentName,
    setAbsenceStartDate,
    setAbsenceEndDate,
    setAbsenceNavOffset,
    setAbsenceManualDuration,
    setEditingAbsenceLeaveId,
    handleAbsenceSubmit,
    showPermissionModal,
    permissionAgentId,
    permissionAgentName,
    permissionStartDate,
    permissionEndDate,
    permissionNavOffset,
    permissionManualDuration,
    editingPermissionLeaveId,
    setShowPermissionModal,
    setPermissionAgentId,
    setPermissionAgentName,
    setPermissionStartDate,
    setPermissionEndDate,
    setPermissionNavOffset,
    setPermissionManualDuration,
    setEditingPermissionLeaveId,
    handlePermissionSubmit,
    showCpModal,
    cpAgentId,
    cpAgentName,
    cpStartDate,
    cpEndDate,
    cpNavOffset,
    cpManualDuration,
    createNewCpMode,
    editingCpLeaveId,
    setShowCpModal,
    setCpAgentId,
    setCpAgentName,
    setCpStartDate,
    setCpEndDate,
    setCpNavOffset,
    setCpManualDuration,
    setCreateNewCpMode,
    setEditingCpLeaveId,
    handleCpSubmit,
    lockedPermissions,
    setLockedPermissions,
    lockedAbsences,
    setLockedAbsences,
    cpWarningModal,
    setCpWarningModal,
    permissionDetailsModal,
    setPermissionDetailsModal,
    lockedMaps,
    setLockedMaps,
    showChgtStatutModal,
    setShowChgtStatutModal,
    chgtStatutAgent,
    setChgtStatutAgent,
    chgtStatutDate,
    setChgtStatutDate,
    chgtStatutNewFunction,
    setChgtStatutNewFunction,
    chgtStatutReason,
    setChgtStatutReason,
    chgtStatutColorNew,
    setChgtStatutColorNew,
    chgtStatutColorHex,
    setChgtStatutColorHex,
    statusChangeInfoModal,
    setStatusChangeInfoModal,
    handleChgtStatutSubmit,
    shiftModalAgent,
    setShiftModalAgent,
    shiftModalType,
    setShiftModalType,
    showCustomRotation,
    setShowCustomRotation,
    isGenerating,
    setIsGenerating,
    customRotationType,
    setCustomRotationType,
    customRotationDate,
    setCustomRotationDate,
    iconPickerSiteId,
    setIconPickerSiteId,
    showVerificationSites,
    setShowVerificationSites,
    publishedPeriods,
    setPublishedPeriods,
    maxInitializedPeriod,
    setMaxInitializedPeriod,
    showNextMonthModal,
    setShowNextMonthModal,
    showPublishReport,
    setShowPublishReport,
    showPublishSuccess,
    setShowPublishSuccess,
    showPublishModal,
    setShowPublishModal,
    publishing,
    setPublishing,
    publishProgress,
    setPublishProgress,
    initializing,
    setInitializing,
    initProgress,
    setInitProgress,
    sitesToKeepHS,
    setSitesToKeepHS,
    showKeepHSModal,
    setShowKeepHSModal,
    showWelcomeToast,
    setShowWelcomeToast,
    welcomeMonthName,
    setWelcomeMonthName,
    hasAutoSnapped,
    setHasAutoSnapped,
    manuallyAdvancedToFuture,
    setManuallyAdvancedToFuture,
    showFirstVisitModal,
    setShowFirstVisitModal,
    showPeriodLockedToast,
    showStats,
    setShowStats,
    showBlacklist,
    setShowBlacklist,
    newSiteName,
    setNewSiteName,
    newSiteLocation,
    setNewSiteLocation,
    isSpecialSite,
    setIsSpecialSite,
    specialSiteType,
    setSpecialSiteType,
    customBehavior,
    setCustomBehavior,
    newSubsiteName,
    setNewSubsiteName,
    newAgentName,
    setNewAgentName,
    newAgentSubsiteId,
    setNewAgentSubsiteId,
    newAgentFunction,
    setNewAgentFunction,
    newAgentShiftType,
    setNewAgentShiftType,
    newAgentContractEnd,
    setNewAgentContractEnd,
    isNewAgentEntrant,
    setIsNewAgentEntrant,
    newAgentEntrantDate,
    setNewAgentEntrantDate,
    mutateAgentId,
    setMutateAgentId,
    mutateAgentName,
    setMutateAgentName,
    mutateStart,
    setMutateStart,
    mutateNewShiftType,
    setMutateNewShiftType,
    mutateNewFunction,
    setMutateNewFunction,
    searchMutationText,
    setSearchMutationText,
    showMutationDropdown,
    setShowMutationDropdown,
    mutateDestSubsiteId,
    setMutateDestSubsiteId,
    errorMsg,
    setErrorMsg,
    deleteAgentConfirm,
    setDeleteAgentConfirm,
    mutationPalettes,
    currentMutationPalette,
    loadDashboardData,
    loadPublishedPeriods,
    handlePublishPeriod,
    handleNextMonth,
    handleCancelNextMonth,
    resetSiteContextState,
    selectSite,
    backToSites,
    changePeriod,
    handleFirstVisitOui,
    handleFirstVisitNon,
    handleFirstVisitIgnore,
    getPeriodLabel,
    currentMonthStr,
    isPastMonth,
    isEmptyPastMonth,
    isEmptyFutureMonth,
    isEmptyMonth,
    SITE_EMOJIS,
    handleUpdateSiteIcon,
    loadSiteData,
    openAddAgentModal,
    requireEditMode,
    openDeployExtraModal,
    handleDeployExtraSubmit,
    handleUpdateSubsiteConfig,
    openDeployReleveModal,
    handleDeployReleveSubmit,
    getPeriodsList,
    getDates,
    datesList,
    formatDateKey,
    handleCreateSite,
    handleRenameSite,
    handleDeleteSite,
    handleCreateSubsite,
    handleEditSpecialServiceClick,
    handleSaveSpecialService,
    handleEditAdminScheduleClick,
    handleSaveAdminSchedule,
    showEditAdminScheduleModal,
    setShowEditAdminScheduleModal,
    editAdminScheduleAgent,
    setEditAdminScheduleAgent,
    editAdminScheduleDays,
    setEditAdminScheduleDays,
    handleCreateAgentFromModal,
    handleDeleteAgent,
    confirmDeleteAgent,
    handleClearAgentMutations,
    handleDeleteSubsite,
    deleteZoneConfirmId,
    setDeleteZoneConfirmId,
    executeDeleteSubsite,
    handleInitPeriodRotation,
    handleArchivePeriod,
    handleResetYear,
    handleClearMutations,
    handleUpdateAgentField,
    getDayLabel,
    handleShiftChangeSubmit,
    handleApplyPattern,
    handleRenameSubsite,
    executeRenameSubsite,
    renderPatternOptions,
    handleMutateSubmit,
    openMutateModal,
    getDashboardStats,
    savingCells,
    reposMenu,
    reposSegmentSelection,
    reposConfirmData,
    setReposMenu,
    setReposSegmentSelection,
    setReposConfirmData,
    handleCellClick,
    handleAssignRepos,
    executeSegmentRepos,
    executeAssignRepos,
    showMaladieModal,
    maladieAgentId,
    maladieAgentName,
    maladieStartDate,
    maladieEndDate,
    maladieNavOffset,
    maladieManualDuration,
    editingMaladieLeaveId,
    setShowMaladieModal,
    setMaladieAgentId,
    setMaladieAgentName,
    setMaladieStartDate,
    setMaladieEndDate,
    setMaladieNavOffset,
    setMaladieManualDuration,
    setEditingMaladieLeaveId,
    handleMaladieSubmit
  };
}
