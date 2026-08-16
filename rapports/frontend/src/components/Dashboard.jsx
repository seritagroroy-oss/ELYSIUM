
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
import Archives from './Archives';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import ContextMenu from './ui/ContextMenu';
import TopBar from './ui/TopBar';
import ZenModeButton from './ui/ZenModeButton';
import WelcomeToast from './modals/WelcomeToast';
import PointageCalendarModal from './modals/PointageCalendarModal';
const VerificationModal = React.lazy(() => import('./modals/VerificationModal'));

import DeployReleveModal from './modals/DeployReleveModal';
import DeleteAgentModal from './modals/DeleteAgentModal';
import DeleteSiteModal from './modals/DeleteSiteModal';
import AddAgentModal from './modals/AddAgentModal';
import MutateModal from './modals/MutateModal';
import PublishReportModal from './modals/PublishReportModal';
import SpecialServiceModal from './modals/SpecialServiceModal';
import PublishSuccessModal from './modals/PublishSuccessModal';
import EntrantModal from './modals/EntrantModal';
import SortantModal from './modals/SortantModal';
import CpModal from './modals/CpModal';
import CpInfoModal from './modals/CpInfoModal';
import PermissionModal from './modals/PermissionModal';
import PermissionDetailsModal from './modals/PermissionDetailsModal';
import OverlapWarningModal from './modals/OverlapWarningModal';
import MapModal from './modals/MapModal';
import ExternalSuppDetailsModal from './modals/ExternalSuppDetailsModal';
import DeployExtraModal from './modals/DeployExtraModal';
import ManageFunctionsModal from './modals/ManageFunctionsModal';
import RenameSiteModal from './modals/RenameSiteModal';
import RenameSubsiteModal from './modals/RenameSubsiteModal';
import ChgtStatutModal from './modals/ChgtStatutModal';
import ReleveSupplModal from './modals/ReleveSupplModal';
import TransferModal from './modals/TransferModal';
import TransferDetailsModal from './modals/TransferDetailsModal';
import ReleveScheduleModal from './modals/ReleveScheduleModal';
import ClosedMonthModal from './modals/ClosedMonthModal';
import ZoneConfigModal from './modals/ZoneConfigModal';
import ExternalSuppModal from './modals/ExternalSuppModal';
import MoveAgentZoneModal from './modals/MoveAgentZoneModal';

export default function Dashboard({ isVerificationMode = false, archiveData = null, onBack = null }) {
  const isArchiveMode = !!archiveData;
  const { user } = useAuth();

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [hasVerifiedPointage, setHasVerifiedPointage] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const runVerification = () => {
    setIsVerifying(true);
    setHasVerifiedPointage(true);
    setShowVerificationModal(true);
    setIsVerifying(false);
  };

  const [viewMode, setViewMode] = useState('current');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferModalData, setTransferModalData] = useState(null);
  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(false);
  const [transferDetailsData, setTransferDetailsData] = useState(null); // 'current' ou 'archives'
  const [externalSuppModal, setExternalSuppModal] = useState(null);
  const [moveZoneAgent, setMoveZoneAgent] = useState(null);
  const [lockedZones, setLockedZones] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pontage_locked_zones')) || [];
    } catch (e) {
      return [];
    }
  });

  const toggleZoneLock = (zoneId) => {
    setLockedZones(prev => {
      const next = prev.includes(zoneId) ? prev.filter(id => id !== zoneId) : [...prev, zoneId];
      localStorage.setItem('pontage_locked_zones', JSON.stringify(next));
      return next;
    });
  };

  const toggleAllZonesLock = () => {
    const currentZoneIds = (siteData || []).map(sub => sub.id);
    if (currentZoneIds.length === 0) return;
    
    const allAreLocked = currentZoneIds.every(id => lockedZones.includes(id));
    setLockedZones(prev => {
      let next;
      if (allAreLocked) {
        next = prev.filter(id => !currentZoneIds.includes(id));
      } else {
        const union = new Set([...prev, ...currentZoneIds]);
        next = Array.from(union);
      }
      localStorage.setItem('pontage_locked_zones', JSON.stringify(next));
      return next;
    });
  };

  const [sites, setSites] = useState(() => {
    try {
      const saved = localStorage.getItem('pontage_sites_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) { }
    return [];
  });
  const [siteOrder, setSiteOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_site_order')) || []; } catch (e) { return []; }
  });
  const [draggedSite, setDraggedSite] = useState(null);
  const [activeSiteId, setActiveSiteId] = useState(() => {
    let saved = localStorage.getItem('pontage_activeSiteId');
    if (!saved || saved === 'null' || saved === 'undefined') {
      saved = sessionStorage.getItem('pontage_fallback_activeSiteId');
    }
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });
  const [activeSiteName, setActiveSiteName] = useState(() => {
    let saved = localStorage.getItem('pontage_activeSiteName');
    if (!saved || saved === 'null' || saved === 'undefined') {
      saved = sessionStorage.getItem('pontage_fallback_activeSiteName');
    }
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : '';
  });
  const [showAgentCountHover, setShowAgentCountHover] = useState(() => {
    const saved = localStorage.getItem('pontage_show_agent_count_hover');
    return saved !== null ? saved === 'true' : true;
  });
  const getSafePeriod = (p) => (typeof p === 'string' && /^\d{4}-\d{2}$/.test(p) ? p : new Date().toISOString().slice(0, 7));
  const [period, setPeriod] = useState(() => {
    if (archiveData && archiveData.period) return archiveData.period;
    return getSafePeriod(new Date().toISOString().slice(0, 7));
  }); // YYYY-MM
  const [cycleStart, setCycleStart] = useState(21);
  const [siteData, setSiteData] = useState([]); // Subsites and agents
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renameModalData, setRenameModalData] = useState(null);
  const [highlightedAgentId, setHighlightedAgentId] = useState(null);
  const [globalAgents, setGlobalAgents] = useState([]);
  const [renameSubsiteModalData, setRenameSubsiteModalData] = useState(null);
  const [zoneConfigModalData, setZoneConfigModalData] = useState(null);
  const [functionModes, setFunctionModes] = useState({});
  const [savingCells, setSavingCells] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShiftType, setFilterShiftType] = useState('ALL');
  const [filterFunction, setFilterFunction] = useState('ALL');
  const [filterShowOnlyAbsences, setFilterShowOnlyAbsences] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showKPICards, setShowKPICards] = useState(false);
  const [siteSortOrder, setSiteSortOrder] = useState('alpha_asc');
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [cardDesign, setCardDesign] = useState(() => localStorage.getItem('pontage_card_design') || 'neon');
  const [selectedKpiAgent, setSelectedKpiAgent] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const kpiAnchorRef = useRef(null);
  const [kpiPos, setKpiPos] = useState({ x: 0, y: 0 });
  const [isDraggingKpi, setIsDraggingKpi] = useState(false);
  const kpiDragStart = useRef({ x: 0, y: 0 });
  const settingsMenuRef = useRef(null);
  const [salaryGrid, setSalaryGrid] = useState({});
  const [functionModalAgent, setFunctionModalAgent] = useState(null);
  const [statsCardScale, setStatsCardScale] = useState(() => parseFloat(localStorage.getItem('pontage_stats_card_size') || '1'));

  // Historique Undo / Redo
  const actionHistory = useRef([]);
  const historyIndex = useRef(-1);

  // Nouvelles fonctionnalités Premium
  const [isZenMode, setIsZenMode] = useState(false);

  const [paintModeActive, setPaintModeActive] = useState(false);
  const [paintStatus, setPaintStatus] = useState('1'); // Par défaut: Présent
  const isPaintingRef = useRef(false);
  const paintedCellsRef = useRef([]);

  const [cellContextMenu, setCellContextMenu] = useState({ visible: false, x: 0, y: 0, agentId: null, dateKey: null, shiftCode: null, currentStatus: null, agentName: '' });
  const [clipboardWeek, setClipboardWeek] = useState(null); // { agentId, dates: [d1, d2...], attendances: [...] }
  const [pasteConfirmModal, setPasteConfirmModal] = useState(null);

  // Édition de la configuration Temps Partiel depuis le dashboard
  const [showEditSpecialServiceModal, setShowEditSpecialServiceModal] = useState(false);
  const [editSpecialServiceAgent, setEditSpecialServiceAgent] = useState(null);
  const [editSpecialServiceBase, setEditSpecialServiceBase] = useState(12);
  const [editSpecialServiceDays, setEditSpecialServiceDays] = useState([]);
  const [editSpecialServiceIsEntrant, setEditSpecialServiceIsEntrant] = useState(false);
  const [editSpecialServiceEntrantDate, setEditSpecialServiceEntrantDate] = useState('');
  const [editSpecialServiceIsDebut, setEditSpecialServiceIsDebut] = useState(false);
  const [editSpecialServiceDebutDate, setEditSpecialServiceDebutDate] = useState('');
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

  // Modal: Mise À Pied (MAP)

  const [showMapModal, setShowMapModal] = useState(false);
  const [mapAgentId, setMapAgentId] = useState('');
  const [mapAgentName, setMapAgentName] = useState('');
  const [mapStartDate, setMapStartDate] = useState('');
  const [mapEndDate, setMapEndDate] = useState('');
  const [mapNavOffset, setMapNavOffset] = useState(0);
  const [mapManualDuration, setMapManualDuration] = useState('');

  const getCyclePeriodForDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    let pM = d.getMonth() + 1;
    let pY = d.getFullYear();
    if (d.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
    return `${pY}-${String(pM).padStart(2, '0')}`;
  };

  const handleMapSubmit = async (forceOverride = false) => {
    if (!mapStartDate || !mapEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      return;
    }
    if (mapStartDate > mapEndDate) {
      alert('La date de début doit être avant la date de fin.');
      return;
    }
    const mapEndPeriod = getCyclePeriodForDate(mapEndDate);
    if (mapEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }

    // Find the agent to get their shift type
    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(mapAgentId));
    const shiftCodes = [];
    if (agent) {
      if (agent.shift_type?.toLowerCase() === 'jour') shiftCodes.push('J');
      else if (agent.shift_type?.toLowerCase() === 'nuit') shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = leaves.find(l => String(l.agent_id) === String(mapAgentId) && l.type === 'MAP');

    const overlaps = leaves.filter(l =>
      String(l.agent_id) === String(mapAgentId) &&
      l.id !== existingLeave?.id &&
      l.start_date <= mapEndDate && l.end_date >= mapStartDate
    );

    if (!forceOverride && overlaps.length > 0) {
      const types = [...new Set(overlaps.map(l => l.type === 'CP' ? 'Congé Payé' : (l.type === 'MAP' ? 'Mise à Pied' : 'Permission')))].join(', ');
      setOverlapWarning({
        message: `Cette période chevauche déjà un(e) ou plusieurs ${types} pour cet agent.`,
        onConfirm: () => { setOverlapWarning(null); handleMapSubmit(true); }
      });
      return;
    }

    // Si forceOverride, supprimer les leaves chevauchants (autres types)
    if (forceOverride && overlaps.length > 0) {
      for (const ol of overlaps) {
        await apiCall('delete_leave', { leave_id: ol.id });
        let oCursor = new Date(ol.start_date);
        const oEnd = new Date(ol.end_date);
        const oUpdates = [];
        while (oCursor <= oEnd) {
          const yyyy = oCursor.getFullYear(); const mm = String(oCursor.getMonth() + 1).padStart(2, '0'); const dd = String(oCursor.getDate()).padStart(2, '0');
          const dk = `${yyyy}-${mm}-${dd}`;
          let pM = oCursor.getMonth() + 1; let pY = yyyy;
          if (oCursor.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
          shiftCodes.forEach(sc => {
            const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
            if (existing && ['P', 'MAP', 'M', 'CP'].includes(existing.status)) {
              oUpdates.push({ agent_id: ol.agent_id, date: dk, shift_code: sc, status: '', period: `${pY}-${String(pM).padStart(2, '0')}` });
            }
          });
          oCursor.setDate(oCursor.getDate() + 1);
        }
        if (oUpdates.length > 0) await apiCall('bulk_update_attendance', { updates: oUpdates });
      }
    }

    if (existingLeave) {
      let oldCursor = new Date(existingLeave.start_date);
      const oldEnd = new Date(existingLeave.end_date);
      while (oldCursor <= oldEnd) {
        const yyyy = oldCursor.getFullYear();
        const mm = String(oldCursor.getMonth() + 1).padStart(2, '0');
        const dd = String(oldCursor.getDate()).padStart(2, '0');
        const dk = `${yyyy}-${mm}-${dd}`;

        let pMonth = oldCursor.getMonth() + 1;
        let pYear = yyyy;
        if (oldCursor.getDate() >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          if (existing && existing.status === 'MAP') {
            updates.push({ agent_id: mapAgentId, date: dk, shift_code: sc, status: '', period: properPeriod });
          }
        });
        oldCursor.setDate(oldCursor.getDate() + 1);
      }
    }

    let cursor = new Date(mapStartDate);
    const end = new Date(mapEndDate);
    while (cursor <= end) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const dk = `${yyyy}-${mm}-${dd}`;

      let pMonth = cursor.getMonth() + 1;
      let pYear = yyyy;
      if (cursor.getDate() >= cycleStart) {
        pMonth += 1;
        if (pMonth > 12) {
          pMonth = 1;
          pYear += 1;
        }
      }
      const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

      const isRotativeAgent = ['24h', '48h', '72h', '12 j', '12 n', '12h j', '12h n', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
      shiftCodes.forEach(sc => {
        if (isRotativeAgent) {
          // Pour les agents rotatifs : ne mettre MAP QUE sur les cellules qui sont à '1' (montée) ou vides
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus === '1' || currentStatus === '') {
            updates.push({ agent_id: mapAgentId, date: dk, shift_code: sc, status: 'MAP', period: properPeriod });
          }
          // Si currentStatus === 'R', on ne pousse rien (le repos reste R)
        } else {
          updates.push({ agent_id: mapAgentId, date: dk, shift_code: sc, status: 'MAP', period: properPeriod });
        }
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const finalUpdatesMap = {};
    updates.forEach(u => {
      finalUpdatesMap[`${u.date}_${u.shift_code}`] = u;
    });
    const finalUpdates = Object.values(finalUpdatesMap);

    try {
      const leave = {
        id: existingLeave ? existingLeave.id : ('leave_' + Date.now()),
        agent_id: mapAgentId,
        start_date: mapStartDate,
        end_date: mapEndDate,
        type: 'MAP',
        status: 'approved'
      };
      await apiCall('save_leave', { leave });

      const res = await apiCall('bulk_update_attendance', { updates: finalUpdates });
      if (res && res.success) {
        setShowMapModal(false);
        // Optimistic UI Update for MAP
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(mapAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) att[idx].status = upd.status;
                else att.push(upd);
              });
              return { ...ag, attendance: att };
            }
            return ag;
          })
        })));
        const leavesRes = await apiCall('get_leaves', {}, 'GET');
        if (leavesRes && leavesRes.success) {
          setLeaves(leavesRes.leaves || []);
        }
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const handlePermissionSubmit = async (forceOverride = false) => {
    if (!permissionStartDate || !permissionEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      return;
    }
    if (permissionStartDate > permissionEndDate) {
      alert('La date de début doit être avant la date de fin.');
      return;
    }
    const permEndPeriod = getCyclePeriodForDate(permissionEndDate);
    if (permEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }
    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(permissionAgentId));
    const isPermRotative = ['24h', '48h', '72h', '12 j', '12 n', '12h j', '12h n', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
    const shiftCodes = [];
    if (agent) {
      if (agent.shift_type?.toLowerCase() === 'jour') shiftCodes.push('J');
      else if (agent.shift_type?.toLowerCase() === 'nuit') shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = leaves.find(l => String(l.agent_id) === String(permissionAgentId) && l.type === 'P');

    const overlaps = leaves.filter(l =>
      String(l.agent_id) === String(permissionAgentId) &&
      l.id !== existingLeave?.id &&
      l.start_date <= permissionEndDate && l.end_date >= permissionStartDate
    );

    if (!forceOverride && overlaps.length > 0) {
      const types = [...new Set(overlaps.map(l => l.type === 'CP' ? 'Congé Payé' : (l.type === 'MAP' ? 'Mise à Pied' : 'Permission')))].join(', ');
      setOverlapWarning({
        message: `Cette période chevauche déjà un(e) ou plusieurs ${types} pour cet agent.`,
        onConfirm: () => { setOverlapWarning(null); handlePermissionSubmit(true); }
      });
      return;
    }

    // Si forceOverride, supprimer les leaves chevauchants (autres types)
    if (forceOverride && overlaps.length > 0) {
      for (const ol of overlaps) {
        await apiCall('delete_leave', { leave_id: ol.id });
        // Effacer aussi leur attendance
        let oCursor = new Date(ol.start_date);
        const oEnd = new Date(ol.end_date);
        const oUpdates = [];
        while (oCursor <= oEnd) {
          const yyyy = oCursor.getFullYear();
          const mm = String(oCursor.getMonth() + 1).padStart(2, '0');
          const dd = String(oCursor.getDate()).padStart(2, '0');
          const dk = `${yyyy}-${mm}-${dd}`;
          let pM = oCursor.getMonth() + 1; let pY = yyyy;
          if (oCursor.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
          shiftCodes.forEach(sc => {
            const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
            if (existing && ['P', 'MAP', 'M', 'CP'].includes(existing.status)) {
              oUpdates.push({ agent_id: ol.agent_id, date: dk, shift_code: sc, status: '', period: `${pY}-${String(pM).padStart(2, '0')}` });
            }
          });
          oCursor.setDate(oCursor.getDate() + 1);
        }
        if (oUpdates.length > 0) await apiCall('bulk_update_attendance', { updates: oUpdates });
      }
    }

    // First, if there's an existing leave (same type), clear its entire old range
    if (existingLeave) {
      let oldCursor = new Date(existingLeave.start_date);
      const oldEnd = new Date(existingLeave.end_date);
      while (oldCursor <= oldEnd) {
        const yyyy = oldCursor.getFullYear();
        const mm = String(oldCursor.getMonth() + 1).padStart(2, '0');
        const dd = String(oldCursor.getDate()).padStart(2, '0');
        const dk = `${yyyy}-${mm}-${dd}`;

        let pMonth = oldCursor.getMonth() + 1;
        let pYear = yyyy;
        if (oldCursor.getDate() >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          if (existing && existing.status === 'P') {
            updates.push({ agent_id: permissionAgentId, date: dk, shift_code: sc, status: '', period: properPeriod });
          }
        });
        oldCursor.setDate(oldCursor.getDate() + 1);
      }
    }

    let cursor = new Date(permissionStartDate);
    const end = new Date(permissionEndDate);
    while (cursor <= end) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const dk = `${yyyy}-${mm}-${dd}`;

      let pMonth = cursor.getMonth() + 1;
      let pYear = yyyy;
      if (cursor.getDate() >= cycleStart) {
        pMonth += 1;
        if (pMonth > 12) {
          pMonth = 1;
          pYear += 1;
        }
      }
      const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

      shiftCodes.forEach(sc => {
        if (isPermRotative) {
          // Pour les agents rotatifs : ne mettre P QUE sur les cellules qui sont à '1' (montée) ou vides
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus === '1' || currentStatus === '') {
            updates.push({ agent_id: permissionAgentId, date: dk, shift_code: sc, status: 'P', period: properPeriod });
          }
          // Si currentStatus === 'R', on ne pousse rien
        } else {
          updates.push({ agent_id: permissionAgentId, date: dk, shift_code: sc, status: 'P', period: properPeriod });
        }
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Deduplicate updates: later updates (the new 'P's) overwrite earlier ones (the old '')
    const finalUpdatesMap = {};
    updates.forEach(u => {
      finalUpdatesMap[`${u.date}_${u.shift_code}`] = u;
    });
    const finalUpdates = Object.values(finalUpdatesMap);

    if (finalUpdates.length === 0) {
      alert('Erreur: Aucun jour à mettre à jour. (Dates inversées ou bug?)');
      return;
    }
    try {
      const existingLeave2 = leaves.find(l => String(l.agent_id) === String(permissionAgentId) && l.type === 'P');
      const leave = {
        id: existingLeave2 ? existingLeave2.id : ('leave_' + Date.now()),
        agent_id: permissionAgentId,
        start_date: permissionStartDate,
        end_date: permissionEndDate,
        type: 'P',
        status: 'approved'
      };
      await apiCall('save_leave', { leave });

      const res = await apiCall('bulk_update_attendance', { updates: finalUpdates });
      if (res && res.success) {
        setShowPermissionModal(false);
        // Optimistic UI Update for Permission
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(permissionAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) att[idx].status = upd.status;
                else att.push(upd);
              });
              return { ...ag, attendance: att };
            }
            return ag;
          })
        })));
        const leavesRes = await apiCall('get_leaves', {}, 'GET');
        if (leavesRes && leavesRes.success) {
          setLeaves(leavesRes.leaves || []);
        }
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (e) {
      alert('❌ Erreur réseau ou serveur');
    }
  };

  const handleCpSubmit = async (forceOverride = false) => {
    if (!cpStartDate || !cpEndDate) {
      alert('Veuillez sélectionner les dates de début et de fin du congé.');
      return;
    }
    const cpEndPeriod = getCyclePeriodForDate(cpEndDate);
    if (cpEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }
    try {
      const existingLeave = leaves.find(l => String(l.agent_id) === String(cpAgentId) && l.type === 'CP');

      const overlaps = leaves.filter(l =>
        String(l.agent_id) === String(cpAgentId) &&
        l.id !== existingLeave?.id &&
        l.start_date <= cpEndDate && l.end_date >= cpStartDate
      );

      const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(cpAgentId));
      let hasConflictingAttendance = false;
      let conflictTypes = new Set();
      let oUpdates = [];

      if (agent && agent.attendance) {
        let dCursor = new Date(cpStartDate);
        const eDate = new Date(cpEndDate);
        const sCodes = ['J', 'N', 'S', 'SJ', 'SN'];

        while (dCursor <= eDate) {
          const yyyy = dCursor.getFullYear(); const mm = String(dCursor.getMonth() + 1).padStart(2, '0'); const dd = String(dCursor.getDate()).padStart(2, '0');
          const dk = `${yyyy}-${mm}-${dd}`;

          let pM = dCursor.getMonth() + 1; let pY = yyyy;
          if (dCursor.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
          const periodStr = `${pY}-${String(pM).padStart(2, '0')}`;

          sCodes.forEach(sc => {
            const att = agent.attendance.find(a => a.date === dk && a.shift_code === sc);
            const st = att ? String(att.status) : '';
            if (st === 'A' || st === 'MAP' || st === 'P' || ['ABANDON', 'DEMISSION'].includes(st)) {
              hasConflictingAttendance = true;
              if (st === 'A') conflictTypes.add('Absence');
              else conflictTypes.add(st);
            }
            if (['S', 'SJ', 'SN'].includes(sc) && (st === '1' || st.startsWith('Suppl') || Number(st) > 0)) {
              hasConflictingAttendance = true;
              conflictTypes.add('Heures Supplémentaires');
            }
            if (st === 'A' || st === 'MAP' || st === 'P' || ['ABANDON', 'DEMISSION'].includes(st) || (['S', 'SJ', 'SN'].includes(sc) && (st === '1' || st.startsWith('Suppl') || Number(st) > 0))) {
              oUpdates.push({ agent_id: cpAgentId, date: dk, shift_code: sc, status: '', period: periodStr });
            }
          });
          dCursor.setDate(dCursor.getDate() + 1);
        }
      }

      if (!forceOverride && (overlaps.length > 0 || hasConflictingAttendance)) {
        let msg = "";
        if (overlaps.length > 0) {
          const types = [...new Set(overlaps.map(l => l.type === 'CP' ? 'Congé Payé' : (l.type === 'MAP' ? 'Mise à Pied' : 'Permission')))].join(', ');
          msg += `Cette période chevauche déjà un(e) ou plusieurs ${types}. `;
        }
        if (hasConflictingAttendance) {
          msg += `La période sélectionnée contient déjà des pointages (${[...conflictTypes].join(', ')}). `;
        }
        msg += "Voulez-vous écraser ces données (elles seront effacées) pour appliquer le congé qui devient prioritaire ?";

        setOverlapWarning({
          message: msg,
          onConfirm: () => { setOverlapWarning(null); handleCpSubmit(true); }
        });
        return;
      }

      if (forceOverride) {
        if (overlaps.length > 0) {
          for (const ol of overlaps) {
            await apiCall('delete_leave', { leave_id: ol.id });
          }
        }
        if (oUpdates.length > 0) {
          await apiCall('bulk_update_attendance', { updates: oUpdates });
        }
      }

      const leave = {
        id: (existingLeave && !createNewCpMode) ? existingLeave.id : ('leave_' + Date.now()),
        agent_id: cpAgentId,
        start_date: cpStartDate,
        end_date: cpEndDate,
        type: 'CP',
        status: 'approved'
      };
      const res = await apiCall('save_leave', { leave });
      if (res && res.success) {
        setShowCpModal(false);
        setCreateNewCpMode(false);
        // Refresh leaves
        const leavesRes = await apiCall('get_leaves', {}, 'GET');
        if (leavesRes && leavesRes.success) {
          setLeaves(leavesRes.leaves || []);
        }
        loadSiteData();
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const handleDeleteLeave = async (leave) => {
    if (!leave) return;
    try {
      // Find the agent's shift codes
      const allAgents = siteData.flatMap(s => s.agents || []);
      const agent = allAgents.find(a => String(a.id) === String(leave.agent_id));
      const shiftCodes = [];
      if (agent) {
        if (agent.shift_type?.toLowerCase() === 'jour') shiftCodes.push('J');
        else if (agent.shift_type?.toLowerCase() === 'nuit') shiftCodes.push('N');
        else { shiftCodes.push('J'); shiftCodes.push('N'); }
      } else {
        shiftCodes.push('J');
      }

      // Detect the agent's repos day of week by looking at attendance OUTSIDE the leave period
      // We look for dates with status 'R' outside the leave range
      let reposDayOfWeek = -1; // -1 = unknown
      if (agent && agent.attendance) {
        const leaveStart = leave.start_date;
        const leaveEnd = leave.end_date;
        for (const att of agent.attendance) {
          if (att.status === 'R' && (att.date < leaveStart || att.date > leaveEnd)) {
            const d = new Date(att.date);
            reposDayOfWeek = d.getDay(); // 0=Sun...6=Sat
            break;
          }
        }
      }

      // Build restore updates for the leave's date range
      const updates = [];
      let cursor = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      while (cursor <= end) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, '0');
        const dd = String(cursor.getDate()).padStart(2, '0');
        const dk = `${yyyy}-${mm}-${dd}`;
        let pMonth = cursor.getMonth() + 1;
        let pYear = yyyy;
        if (cursor.getDate() >= cycleStart) { pMonth += 1; if (pMonth > 12) { pMonth = 1; pYear += 1; } }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        // Determine restored status: R for repos day, 1 for normal day, '' if unknown
        const dayOfWeek = cursor.getDay();
        const restoredStatus = reposDayOfWeek >= 0
          ? (dayOfWeek === reposDayOfWeek ? 'R' : '1')
          : '1'; // default to '1' if repos day unknown

        shiftCodes.forEach(sc => {
          updates.push({ agent_id: leave.agent_id, date: dk, shift_code: sc, status: restoredStatus, period: properPeriod });
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      // Delete the leave record
      await apiCall('delete_leave', { leave_id: leave.id });
      // Restore attendance cells
      if (updates.length > 0) await apiCall('bulk_update_attendance', { updates });

      setPermissionDetailsModal(null);
      const leavesRes = await apiCall('get_leaves', {}, 'GET');
      if (leavesRes?.success) setLeaves(leavesRes.leaves || []);
      loadSiteData();
    } catch (err) {
      alert('❌ Erreur lors de la suppression : ' + err.message);
    }
  };

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

    try {
      const res = await apiCall('mark_agent_entrant', {
        agent_id: entrantAgentId,
        start_date: entrantDate,
        function: entrantFunction,
        period
      });
      if (res && res.success) {
        setShowEntrantModal(false);
        loadSiteData();
      } else {
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

    try {
      const res = await apiCall('mark_agent_sortant', {
        agent_id: sortantAgentId,
        departure_date: sortantDate,
        type: finalType,
        period
      });
      if (res && res.success) {
        setShowSortantModal(false);
        loadSiteData();
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [lockedPermissions, setLockedPermissions] = useState({});
  const [lockedAbsences, setLockedAbsences] = useState({});
  const [showCpModal, setShowCpModal] = useState(false);
  const [cpWarningModal, setCpWarningModal] = useState(null);
  const [createNewCpMode, setCreateNewCpMode] = useState(false);
  const [cpAgentId, setCpAgentId] = useState('');
  const [cpAgentName, setCpAgentName] = useState('');
  const [cpStartDate, setCpStartDate] = useState('');
  const [cpEndDate, setCpEndDate] = useState('');

  // Modal: Permission (P)
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionAgentId, setPermissionAgentId] = useState('');
  const [permissionAgentName, setPermissionAgentName] = useState('');
  const [permissionStartDate, setPermissionStartDate] = useState('');
  const [permissionEndDate, setPermissionEndDate] = useState('');
  const [permissionDetailsModal, setPermissionDetailsModal] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState(null); // { message, onConfirm }
  const [lockedMaps, setLockedMaps] = useState({});

  const [showChgtStatutModal, setShowChgtStatutModal] = useState(false);
  const [chgtStatutAgent, setChgtStatutAgent] = useState(null);
  const [chgtStatutDate, setChgtStatutDate] = useState('');
  const [chgtStatutNewFunction, setChgtStatutNewFunction] = useState('');
  const [chgtStatutReason, setChgtStatutReason] = useState('');
  const [chgtStatutColorNew, setChgtStatutColorNew] = useState(false);
  const [chgtStatutColorHex, setChgtStatutColorHex] = useState('#f97316');
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

  const [reposMenu, setReposMenu] = useState(null);
  const [reposSegmentSelection, setReposSegmentSelection] = useState(null);
  const [shiftModalAgent, setShiftModalAgent] = useState(null);
  const [shiftModalType, setShiftModalType] = useState('Jour');
  const [showCustomRotation, setShowCustomRotation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRotationType, setCustomRotationType] = useState('Travail');
  const [customRotationDate, setCustomRotationDate] = useState(0);
  const [iconPickerSiteId, setIconPickerSiteId] = useState(null);
  const [reposConfirmData, setReposConfirmData] = useState(null);
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

  const currentMutationPalette = mutationPalettes[localStorage.getItem('pontage_mutation_theme') || 'ocean'] || mutationPalettes.ocean;
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
      setPublishedPeriods([]);
      if (activeSiteId) {
        setSiteData(archiveData.sites?.find(s => String(s.id) === String(activeSiteId))?.subsites || []);
      } else {
        setSiteData([]);
      }
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
        if (!hasAutoSnapped) {
          if (period !== pubPeriodsRes.max_initialized_period) {
            setPeriod(pubPeriodsRes.max_initialized_period);
            periodSnapped = true;
          }
          setHasAutoSnapped(true);
        }
      } else if (pubPeriodsRes && Array.isArray(pubPeriodsRes.published_periods) && pubPeriodsRes.published_periods.length > 0) {
        // Fallback : si max_initialized_period est null (jamais défini ou après reset),
        // on considère que le mois courant publié est le dernier initialisé
        const latestPub = pubPeriodsRes.published_periods[0];
        setMaxInitializedPeriod(latestPub);
        if (!hasAutoSnapped) {
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
            const latest = res.published_periods[0];
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
          const latest = res.published_periods[0];
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
        const archRes = await apiCall('archive_all_sites', { period, siteOrder });
        console.log('Archive result:', archRes);
        setShowPublishModal(false);
        setShowPublishSuccess(true); // ← Affiche le modal de succès
        // Recharger pour confirmer
        await loadPublishedPeriods();
      }
    } catch (e) {
      console.error("Erreur publish_period", e);
    } finally {
      setPublishing(false);
      setPublishProgress(0);
    }
  };

  const handleNextMonth = async () => {
    setInitializing(true);
    setInitProgress(0);
    const duration = 10000;
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const intervalId = setInterval(() => {
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
      await Promise.all([
        apiCall('init_next_period', { current_period: period, next_period: nextPeriodStr, sites_to_keep_hs: sitesToKeepHS }),
        new Promise(resolve => setTimeout(resolve, duration))
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(intervalId);
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
        <div style="text-align:center;margin-bottom:32px;position:relative">
          <div style="position:absolute;top:-50px;left:50%;transform:translateX(-50%);width:250px;height:150px;background:rgba(34,197,94,0.15);filter:blur(70px);z-index:-1;border-radius:50%"></div>
          <h2 className="toast-header-title" style="margin:0 0 8px 0;font-weight:900;font-size:2.4rem;letter-spacing:-0.03em;background:linear-gradient(135deg,#4ade80,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Bienvenue en ${nextMonthLabel} !</h2>
          <div className="toast-header-subtitle" style="color:#94a3b8;font-size:1rem;font-weight:600;letter-spacing:0.05em">Nouveau cycle de pointage initialisé avec succès</div>
        </div>
        
        <div style="display:grid;gap:16px;margin-bottom:36px">
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px 24px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:52px;height:52px;border-radius:14px;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 0 20px rgba(34,197,94,0.15)">✅</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Structure conservée</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Les sites, zones et agents ont été migrés vers la nouvelle période.</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px 24px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:52px;height:52px;border-radius:14px;background:rgba(56,189,248,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 0 20px rgba(56,189,248,0.15)">📅</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Prêt à la saisie</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Vous pouvez commencer à enregistrer les présences pour ce mois.</div>
            </div>
          </div>
          
          <div style="display:flex;align-items:center;gap:20px;background:linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px 24px;box-shadow:0 10px 30px rgba(0,0,0,0.2);transition:transform 0.2s, background 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'" onmouseout="this.style.transform='translateY(0)';this.style.background='linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'">
            <div style="width:52px;height:52px;border-radius:14px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 0 20px rgba(245,158,11,0.15)">🔔</div>
            <div>
              <div style="color:#f8fafc;font-weight:700;font-size:1.1rem;margin-bottom:4px">Service : ${user?.service || 'Opérations'}</div>
              <div style="color:#94a3b8;font-size:0.9rem;line-height:1.4">Connecté en tant que <strong style="color:#cbd5e1">${user?.name || user?.email || 'Admin'}</strong></div>
            </div>
          </div>
        </div>
        
        <div class="welcome-toast-buttons-row" style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;margin-top:auto">
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

  const getPeriodLabel = () => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isPastMonth = period < currentMonthStr && publishedPeriods.includes(period);
  const isEmptyPastMonth = maxInitializedPeriod ? (period < maxInitializedPeriod && !publishedPeriods.includes(period)) : (period < currentMonthStr && !publishedPeriods.includes(period));
  // Un mois est "futur vide" seulement s'il dépasse le dernier mois initialisé
  const isEmptyFutureMonth = maxInitializedPeriod ? period > maxInitializedPeriod : false;
  const isEmptyMonth = (isEmptyPastMonth || isEmptyFutureMonth) && !manuallyAdvancedToFuture;


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

  const getDayLabel = (date) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[date.getDay()];
  };

  // --- Gestion Undo / Redo ---
  const applyHistoryAction = async (action, targetStatus) => {
    setSiteData(prevData => {
      return prevData.map(subsite => {
        return {
          ...subsite,
          agents: subsite.agents.map(agent => {
            if (String(agent.id) !== String(action.agentId)) return agent;

            let updatedAttendance = [...(agent.attendance || [])];
            const idx = updatedAttendance.findIndex(a => a.date === action.dateKey && a.shift_code === action.shiftCode);

            if (idx > -1) {
              if (targetStatus === '') {
                updatedAttendance.splice(idx, 1);
              } else {
                updatedAttendance[idx].status = targetStatus;
              }
            } else if (targetStatus !== '') {
              updatedAttendance.push({
                date: action.dateKey,
                shift_code: action.shiftCode,
                status: targetStatus
              });
            }
            return { ...agent, attendance: updatedAttendance };
          })
        };
      });
    });

    try {
      const res = await apiCall('update_attendance', {
        agent_id: action.agentId,
        date: action.dateKey,
        shift_code: action.shiftCode,
        status: targetStatus,
        period // utilise la variable d'état courante de la closure
      });
      if (!res.success) {
        if (res.period_locked) {
          showPeriodLockedToast && showPeriodLockedToast(getPeriodLabel());
        }
        loadSiteData();
      }
    } catch (e) {
      loadSiteData();
    }
  };

  const handleUndo = async () => {
    if (historyIndex.current < 0) return;
    const action = actionHistory.current[historyIndex.current];
    if (action.type === 'ATTENDANCE_CHANGE') {
      historyIndex.current -= 1;
      await applyHistoryAction(action, action.oldStatus);
    }
  };

  const handleRedo = async () => {
    if (historyIndex.current >= actionHistory.current.length - 1) return;
    historyIndex.current += 1;
    const action = actionHistory.current[historyIndex.current];
    if (action.type === 'ATTENDANCE_CHANGE') {
      await applyHistoryAction(action, action.newStatus);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer si on est dans un champ de saisie
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (isArchiveMode || isVerificationMode) return;

      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [period, isArchiveMode, isVerificationMode]);

  // Traitement de l'édition d'une cellule de pointage
  const handleCellClick = async (agentId, dateKey, shiftCode, currentStatus, forcedStatus = null, agentObj = null) => {
    if (isArchiveMode) return;
    if (isVerificationMode) return;
    if (savingCells[`${agentId}-${dateKey}-${shiftCode}`]) return;

    // Bloquer les modifications si la zone de l'agent est verrouillée
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

    let isExtra = false;
    let isReleve = false;
    if (agentObj) {
      isExtra = !!agentObj.is_extra;
      isReleve = !!agentObj.is_releve;
    } else {
      for (let sub of siteData) {
        let ag = sub.agents?.find(a => String(a.id) === String(agentId));
        if (ag && ag.is_extra) { isExtra = true; break; }
        if (ag && ag.is_releve) { isReleve = true; break; }
      }
    }
    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : '';

    let newStatus = '';
    if (forcedStatus !== null) {
      if (isExtra && forcedStatus === '1') newStatus = 'EXT|' + siteTitle;
      else if (isExtra && forcedStatus === 'A') newStatus = 'EXT_A|' + siteTitle;
      else if (isExtra && forcedStatus === 'R') newStatus = 'EXT_R|' + siteTitle;
      else if (isExtra && forcedStatus === 'S') newStatus = 'EXT_1|' + siteTitle;
      else if (isReleve && forcedStatus === '1') newStatus = 'REL|' + siteTitle;
      else if (isReleve && forcedStatus === 'A') newStatus = 'REL_A|' + siteTitle;
      else if (isReleve && forcedStatus === 'R') newStatus = 'REL_R|' + siteTitle;
      else if (isReleve && forcedStatus === 'S') newStatus = 'REL_1|' + siteTitle;
      else newStatus = forcedStatus;
    } else if ((shiftCode === 'S' || shiftCode === 'SJ' || shiftCode === 'SN') && !isExtra && !isReleve) {
      if (currentStatus === '') newStatus = '1';
      else newStatus = '';
    } else {
      if (isExtra) {
        let dest = siteTitle;
        let suffix = '';
        if (currentStatus && currentStatus.startsWith('EXT_')) {
          const parts = currentStatus.split('|');
          if (parts.length > 1) {
            dest = parts[1];
            if (parts.length > 2) suffix = '|' + parts.slice(2).join('|');
          }
        }

        if (currentStatus === '' || currentStatus === 'EXT|' + siteTitle) newStatus = 'EXT_1|' + siteTitle;
        else if (currentStatus.startsWith('EXT_1|')) newStatus = 'EXT_A|' + dest + suffix;
        else if (currentStatus.startsWith('EXT_A|')) newStatus = 'EXT_MAP|' + dest + suffix;
        else if (currentStatus.startsWith('EXT_MAP|')) newStatus = 'EXT_P|' + dest + suffix;
        else if (currentStatus.startsWith('EXT_P|')) newStatus = 'EXT_R|' + dest + suffix;
        else if (currentStatus.startsWith('EXT_R|')) newStatus = 'EXT_1|' + dest + suffix;
        else newStatus = 'EXT_1|' + siteTitle;
      } else if (isReleve) {
        let dest = siteTitle;
        let suffix = '';
        if (currentStatus && currentStatus.startsWith('REL_')) {
          const parts = currentStatus.split('|');
          if (parts.length > 1) {
            dest = parts[1];
            if (parts.length > 2) suffix = '|' + parts.slice(2).join('|');
          }
        }

        if (currentStatus === '' || currentStatus === 'REL|' + siteTitle) newStatus = 'REL_1|' + siteTitle;
        else if (currentStatus.startsWith('REL_1|')) newStatus = 'REL_A|' + dest + suffix;
        else if (currentStatus.startsWith('REL_A|')) newStatus = 'REL_MAP|' + dest + suffix;
        else if (currentStatus.startsWith('REL_MAP|')) newStatus = 'REL_P|' + dest + suffix;
        else if (currentStatus.startsWith('REL_P|')) newStatus = 'REL_R|' + dest + suffix;
        else if (currentStatus.startsWith('REL_R|')) newStatus = 'REL_1|' + dest + suffix;
        else newStatus = 'REL_1|' + siteTitle;
      } else {
        if (functionModes[agentId]) {
          const fStatus = 'F_' + functionModes[agentId];
          if (currentStatus === fStatus) newStatus = '';
          else newStatus = fStatus;
        } else if (costumeModes[agentId]) {
          if (currentStatus === 'COST') newStatus = '';
          else newStatus = 'COST';
        } else {
          // Détecter si l'agent est rotatif (24h/48h/72h)
          let agentShiftType = null;
          let agentScheduledDays = null;
          for (let sub of siteData) {
            const ag = sub.agents?.find(a => String(a.id) === String(agentId));
            if (ag) { 
              agentShiftType = ag.shift_type; 
              agentScheduledDays = ag.scheduled_days;
              break; 
            }
          }
          const isRotative = ['24h', '48h', '72h', '12 j', '12 n', '12h j', '12h n', 'jour', 'nuit'].includes(agentShiftType?.toLowerCase());

          if (isRotative && (shiftCode === 'J' || shiftCode === 'N')) {
            // Vérifier le statut de l'autre ligne pour détecter si c'est un jour de repos explicite (R)
            const otherSc = shiftCode === 'J' ? 'N' : 'J';
            let otherStatus = '';
            for (let sub of siteData) {
              const ag = sub.agents?.find(a => String(a.id) === String(agentId));
              if (ag) {
                const entry = ag.attendance?.find(a => a.date === dateKey && a.shift_code === otherSc);
                otherStatus = entry ? entry.status : '';
                break;
              }
            }

            // Vérifier si c'est un jour de repos implicite via le planning (non rotatifs avec scheduled_days)
            const dObj = new Date(dateKey);
            const jsDay = dObj.getDay() || 7;
            let isUnscheduled = false;
            if (agentScheduledDays && Array.isArray(agentScheduledDays)) {
              const isScheduled = agentScheduledDays.includes(String(jsDay)) || agentScheduledDays.includes(jsDay);
              if (!isScheduled) isUnscheduled = true;
            }

            let isReposDay = false;
            let reposState = 'R';
            if (currentStatus === 'R' || otherStatus === 'R') {
              isReposDay = true;
              reposState = 'R';
            } else if (isUnscheduled) {
              isReposDay = true;
              reposState = '';
            }

            if (isReposDay) {
              newStatus = (currentStatus === reposState) ? '1' : reposState;
            } else {
              // Jour de montée : cycle complet 1 → A → P → MAP → R
              if (currentStatus === '' || currentStatus === 'R') newStatus = '1';
              else if (currentStatus === '1') newStatus = 'A';
              else if (currentStatus === 'A') newStatus = 'P';
              else if (currentStatus === 'P') newStatus = 'MAP';
              else if (['MAP', 'M', 'CP', 'AT'].includes(currentStatus)) newStatus = 'R';
              else newStatus = '1';
            }
          } else {
            // Agents non-rotatifs ou lignes SP : cycle normal
            if (currentStatus === '' || currentStatus === 'R') newStatus = '1';
            else if (currentStatus === '1') newStatus = 'A';
            else if (currentStatus === 'A') newStatus = 'P';
            else if (currentStatus === 'P') newStatus = 'MAP';
            else if (['MAP', 'M', 'CP', 'AT'].includes(currentStatus)) newStatus = 'R';
            else newStatus = '1';
          }
        }
      }
    }

    if (currentStatus !== '' && (currentStatus.startsWith('M|') || currentStatus.startsWith('PM|'))) return; // Mutation protégée

    const cellKey = `${agentId}-${dateKey}-${shiftCode}`;
    setSavingCells(prev => ({ ...prev, [cellKey]: true }));

    // Ajout à l'historique pour Undo/Redo
    const action = {
      type: 'ATTENDANCE_CHANGE',
      agentId,
      dateKey,
      shiftCode,
      oldStatus: currentStatus,
      newStatus
    };
    const currentIndex = historyIndex.current;
    actionHistory.current = actionHistory.current.slice(0, currentIndex + 1);
    actionHistory.current.push(action);
    historyIndex.current = actionHistory.current.length - 1;

    // Mise à jour optimiste locale
    setSiteData(prevData => {
      return prevData.map(subsite => {
        return {
          ...subsite,
          agents: subsite.agents.map(agent => {
            if (String(agent.id) !== String(agentId)) return agent;

            // Trouver et modifier ou ajouter l'attendance
            let updatedAttendance = [...(agent.attendance || [])];
            const idx = updatedAttendance.findIndex(a => a.date === dateKey && a.shift_code === shiftCode);

            if (idx > -1) {
              if (newStatus === '') {
                updatedAttendance.splice(idx, 1);
              } else {
                updatedAttendance[idx].status = newStatus;
              }
            } else if (newStatus !== '') {
              updatedAttendance.push({
                date: dateKey,
                shift_code: shiftCode,
                status: newStatus
              });
            }
            return { ...agent, attendance: updatedAttendance };
          })
        };
      });
    });

    try {
      const res = await apiCall('update_attendance', {
        agent_id: agentId,
        date: dateKey,
        shift_code: shiftCode,
        status: newStatus,
        period
      });
      if (!res.success) {
        if (res.period_locked) {
          // La période est verrouillée : annuler la modification optimiste et notifier
          showPeriodLockedToast(getPeriodLabel());
        }
        // En cas d'échec (lock ou autre), recharger les données réelles
        loadSiteData();
      }
    } catch (e) {
      loadSiteData();
    } finally {
      setSavingCells(prev => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
    }
  };

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
        specialService: agentData.specialService,
        specialServiceBase: agentData.specialServiceBase,
        specialServiceDays: agentData.specialServiceDays,
        disableDefaultRepos: agentData.disableDefaultRepos,
        isEntrant: agentData.isEntrant,
        entrantDate: agentData.entrantDate,
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

  const handleDeleteSubsite = async (subsiteId) => {
    if (!window.confirm("Attention: supprimer cette zone supprimera également tous les agents qu'elle contient. Continuer ?")) return;
    try {
      const res = await apiCall('delete_subsite', { subsite_id: subsiteId });
      if (res.success) {
        loadSiteData(true); // Rechargement silencieux
        loadDashboardData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
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

  const handleAssignRepos = async (agentId, daysOfWeek) => {
    if (!Array.isArray(daysOfWeek)) daysOfWeek = [daysOfWeek];
    const agent = siteData.flatMap(s => s.agents).find(a => a && a.id === agentId);
    if (!agent) return;

    const history = agent.shift_history || [{ from: '1970-01-01', type: agent.shift_type || 'Jour' }];
    const segments = [];
    const periodStart = formatDateKey(datesList[0]);
    const periodEnd = formatDateKey(datesList[datesList.length - 1]);

    for (let i = 0; i < history.length; i++) {
      const from = history[i].from;
      const type = history[i].type;
      const to = i + 1 < history.length ? history[i + 1].from : '9999-12-31';

      if (to <= periodStart || from > periodEnd) continue;

      segments.push({ from, to, type });
    }

    if (segments.length > 1) {
      setReposSegmentSelection({ agent, daysOfWeek, segments });
      setReposMenu(null);
      return;
    }

    executeSegmentRepos(agent, daysOfWeek, segments[0] || { from: '1970-01-01', to: '9999-12-31', type: agent.shift_type || 'Jour' });
  };

  const executeSegmentRepos = (agent, daysOfWeek, segment) => {
    if (!Array.isArray(daysOfWeek)) daysOfWeek = [daysOfWeek];
    let hasExisting = false;
    const updates = [];

    const isRotative = ['24h', '48h', '72h', '12 j', '12 n', '12h j', '12h n', 'jour', 'nuit'].includes(segment.type?.toLowerCase());
    const scList = isRotative ? ['J', 'N'] : (segment.type === 'Nuit' ? ['N'] : ['J']);

    datesList.forEach(d => {
      const dk = formatDateKey(d);

      // Restreindre à la période du segment
      if (dk < segment.from || dk >= segment.to) return;

      // Protéger les jours avant embauche (ENTRANT) et après départ (SORTANT)
      if (agent.hire_date && dk < agent.hire_date) return;
      if (agent.exit_date && dk > agent.exit_date) return;

      const isNewRestDay = daysOfWeek.includes(d.getDay());

      scList.forEach(sc => {
        const existingStatus = agent.attendance?.find(a => a.date === dk && a.shift_code === sc)?.status;

        if (isNewRestDay) {
          if (existingStatus && existingStatus !== '' && existingStatus !== 'R') {
            hasExisting = true;
          }
          updates.push({ agent_id: agent.id, date: dk, shift_code: sc, status: 'R', period });
        } else {
          if (existingStatus === 'R') {
            const isSingleLine = !['24h', '48h', '72h'].includes(segment.type?.toLowerCase());
            const primaryShift = ['12 n', '12h n', 'nuit'].includes(segment.type?.toLowerCase()) ? 'N' : 'J';
            const isPhantomLine = isSingleLine && sc !== primaryShift;
            
            updates.push({ agent_id: agent.id, date: dk, shift_code: sc, status: isPhantomLine ? '' : '1', period });
          }
        }
      });
    });

    if (updates.length === 0) {
      setReposSegmentSelection(null);
      return;
    }

    const dayName = daysOfWeek.length === 0
      ? 'Aucun'
      : (daysOfWeek.length === 2 && daysOfWeek.includes(6) && daysOfWeek.includes(0)
        ? 'Week-ends'
        : ['Dimanches', 'Lundis', 'Mardis', 'Mercredis', 'Jeudis', 'Vendredis', 'Samedis'][daysOfWeek[0]]);

    let message = "";
    if (daysOfWeek.length === 0) {
      message = "Voulez-vous vraiment désactiver tous les jours de repos (R) par défaut sur cette période ? Tous les 'R' seront remplacés par des présences (1).";
    } else if (hasExisting) {
      message = `Cet agent a déjà des présences ou absences sur des ${dayName} dans cette période. Voulez-vous vraiment les écraser avec le repos (R) ?`;
    } else {
      message = `Confirmez-vous l'attribution du Repos pour tous les ${dayName} de la période sélectionnée ?`;
    }

    setReposConfirmData({ updates, message, dayName });
    setReposSegmentSelection(null);
    setReposMenu(null);
  };

  const executeAssignRepos = async () => {
    if (!reposConfirmData) return;
    const { updates } = reposConfirmData;
    setReposConfirmData(null);
    setLoading(true);
    try {
      const res = await apiCall('bulk_update_attendance', { updates });
      if (res.success) {
        loadSiteData();
      } else {
        if (res.period_locked) {
          showPeriodLockedToast(getPeriodLabel());
          loadSiteData();
        } else {
          alert(res.message);
        }
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
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
      if (res.success) {
        setShowMutate(false);
        loadSiteData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
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

  const stats = getDashboardStats();

  if (loading && sites.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--b)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  // ─── Vue Archives ───────────────────────────────────────────────
  if (!isArchiveMode && viewMode === 'archives') {
    return (
      <div style={{ paddingBottom: '40px' }}>
        <Archives onSwitchToCurrent={() => setViewMode('current')} />
      </div>
    );
  }

  const handleRenameSiteInline = (e, siteId, currentName) => {
    e.stopPropagation();
    setRenameModalData({ siteId, currentName });
  };

  const executeRenameSite = async (newName) => {
    if (!newName || !renameModalData) return;
    const { siteId, currentName } = renameModalData;
    if (newName === currentName) {
      setRenameModalData(null);
      return;
    }

    try {
      const res = await apiCall('rename_site', { site_id: siteId, name: newName });
      if (res.success) {
        const updatedSites = sites.map(s => s.id === siteId ? { ...s, name: newName } : s);
        setSites(updatedSites);
        localStorage.setItem('pontage_sites_cache', JSON.stringify(updatedSites));
        setRenameModalData(null);
      } else {
        alert("Erreur lors du renommage : " + (res.message || "Erreur inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion avec le serveur.");
    }
  };

  // ─── Page de sélection de site ("Mes Sites") ───────────────────────
  if (!activeSiteId) {
    return (
      <>
        {!isArchiveMode && (
          <div
            className="sites-header"
            style={isPastMonth ? {
              background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.3)',
              margin: '0 0 24px 0'
            } : {
              position: 'sticky',
              top: '-24px',
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '12px 24px 16px 24px',
              margin: '-24px -24px 24px -24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="sites-header-left">
              <div className="sites-title-row">
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                  {isVerificationMode ? '✅ Traitement du pointage' : '📍 Mes Sites'}
                  {!isVerificationMode && <span style={{ fontSize: '1rem', color: '#ef4444', marginLeft: '12px', fontWeight: 900 }}>({sites.length})</span>}
                </h2>
                {isPastMonth && (
                  <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Historique
                  </span>
                )}
                {!isVerificationMode && !isArchiveMode && (
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '4px', marginLeft: '12px' }}>
                    <button
                      className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`}
                      onClick={() => setViewMode('current')}
                      style={{
                        padding: '8px 16px', fontSize: '0.9rem',
                        background: viewMode === 'current' ? 'var(--a)' : 'transparent',
                        color: viewMode === 'current' ? 'white' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: viewMode === 'current' ? '700' : '500',
                      }}
                    >
                      Actuel
                    </button>
                    <button
                      className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`}
                      onClick={() => setViewMode('archives')}
                      style={{
                        padding: '8px 16px', fontSize: '0.9rem',
                        background: viewMode === 'archives' ? 'var(--a)' : 'transparent',
                        color: viewMode === 'archives' ? 'white' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: viewMode === 'archives' ? '700' : '500',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Archive size={14} /> Archives
                    </button>
                    <div ref={settingsMenuRef} style={{ position: 'relative', marginLeft: '4px' }}>
                      <button
                        onClick={() => setShowSiteSettings(!showSiteSettings)}
                        style={{
                          padding: '8px', fontSize: '0.9rem',
                          background: showSiteSettings ? 'var(--a)' : 'transparent',
                          color: showSiteSettings ? 'white' : 'var(--muted)',
                          border: 'none',
                          borderRadius: '4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        title="Paramètres d'affichage"
                      >
                        <Settings size={16} />
                      </button>
                      {showSiteSettings && (
                        <div style={{
                          position: 'absolute', top: '100%', marginTop: '8px', left: 0, zIndex: 200,
                          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px', padding: '16px', minWidth: '750px',
                          maxHeight: '85vh', overflowY: 'auto',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '20px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Trier les sites :</label>
                            <select
                              value={siteSortOrder}
                              onChange={(e) => setSiteSortOrder(e.target.value)}
                              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <option value="alpha_asc" style={{ background: '#0f172a' }}>A → Z</option>
                              <option value="alpha_desc" style={{ background: '#0f172a' }}>Z → A</option>
                              <option value="created" style={{ background: '#0f172a' }}>Date création</option>
                              <option value="zone" style={{ background: '#0f172a' }}>Par Zone</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Design des cartes :</label>
                            <select
                              value={cardDesign}
                              onChange={(e) => setCardDesign(e.target.value)}
                              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <option value="neon" style={{ background: '#0f172a' }}>Néon Minimal</option>
                              <option value="glass" style={{ background: '#0f172a' }}>Verre Premium</option>
                              <option value="gradient" style={{ background: '#0f172a' }}>3D Dégradé</option>
                              <option value="holographic" style={{ background: '#0f172a' }}>Holographique</option>
                              <option value="aurora" style={{ background: '#0f172a' }}>Aurore Boréale</option>
                              <option value="cyberpunk" style={{ background: '#0f172a' }}>Cyberpunk</option>
                              <option value="neumorphism" style={{ background: '#0f172a' }}>Neumorphism</option>
                              <option value="brutalist" style={{ background: '#0f172a' }}>Brutalist Tech</option>
                              <option value="pulse" style={{ background: '#0f172a' }}>Glow Pulse</option>
                              <option value="skeuomorph" style={{ background: '#0f172a' }}>Skeuomorphisme 3D</option>
                              <option value="blob" style={{ background: '#0f172a' }}>Liquid Blob</option>
                              <option value="matrix" style={{ background: '#0f172a' }}>Hacker Matrix</option>
                              <option value="retro" style={{ background: '#0f172a' }}>Retro Brutalism</option>
                              <option value="classic" style={{ background: '#0f172a' }}>Classique</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Options des cartes :</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <input
                                type="checkbox"
                                checked={showAgentCountHover}
                                onChange={e => setShowAgentCountHover(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                              />
                              Afficher le nombre d'agents au survol
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <input
                                type="checkbox"
                                checked={enableAnimations}
                                onChange={e => {
                                  setEnableAnimations(e.target.checked);
                                  localStorage.setItem('pontage_enable_animations', e.target.checked ? 'true' : 'false');
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              Activer les animations du tableau
                            </label>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
                              Sécurité & Édition du pointage :
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {[
                                { id: 'remember_session', label: '🔓 Garder mon choix (Session)', desc: 'Le cadenas garde sa position (ouvert ou fermé) quand vous changez de site' },
                                { id: 'lock_always', label: '🔒 Verrouiller automatiquement', desc: 'Se reverrouille automatiquement à chaque fois que vous changez de site/zone' },
                                { id: 'unlock_always', label: '🔓 Déverrouiller automatiquement', desc: 'Se déverrouille automatiquement à chaque fois que vous changez de site/zone ou actualisez la page' },
                                { id: 'default_locked', label: '🔒 Verrouillage par défaut', desc: 'Verrouillé au démarrage, puis garde votre choix (Session)' },
                                { id: 'default_unlocked', label: '🔓 Déverrouillage par défaut', desc: 'Déverrouillé au démarrage, puis garde votre choix (Session)' }
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setEditModeBehavior(opt.id);
                                    setRobustBehavior(opt.id);
                                    if (window.forceSyncSettings) window.forceSyncSettings();
                                    if (opt.id === 'unlock_always' || opt.id === 'default_unlocked') setIsEditMode(true);
                                    if (opt.id === 'lock_always' || opt.id === 'default_locked') setIsEditMode(false);
                                  }}
                                  style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    background: editModeBehavior === opt.id ? 'rgba(52,211,153,0.15)' : 'rgba(0,0,0,0.2)',
                                    border: editModeBehavior === opt.id ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.05)',
                                    color: editModeBehavior === opt.id ? '#34d399' : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                                  }}
                                >
                                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px', color: editModeBehavior === opt.id ? '#34d399' : 'white' }}>{opt.label}</span>
                                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Mode d'affichage ⚙️ Tableau :</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {[
                                { id: 'grouped', label: '📊 Tableau groupé', desc: 'Tous les agents dans un seul tableau par zone' },
                                { id: 'individual', label: '🃏 Tableau individuel', desc: 'Un tableau dédié par agent' }
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => setAndSaveAgentTableMode(opt.id)}
                                  style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    background: agentTableMode === opt.id ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.2)',
                                    border: agentTableMode === opt.id ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.05)',
                                    color: 'white', cursor: 'pointer',
                                    transition: 'all 0.2s', textAlign: 'left'
                                  }}
                                >
                                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{opt.label}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--muted)', marginTop: '4px', marginBottom: '12px', fontSize: '0.9rem' }}>Sélectionnez un site pour accéder au tableau de pointage.</p>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFaqModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#c084fc',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  marginTop: '8px',
                  width: 'fit-content'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(168,85,247,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <HelpCircle size={15} />
                Foire aux questions (FAQ)
              </button>

              {/* ============ MODAL FAQ (INLINED) ============ */}
              {showFaqModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }} onClick={() => setShowFaqModal(false)}>
                  <div onClick={e => e.stopPropagation()} style={{
                    width: '98vw', maxWidth: '100%', height: '96vh', maxHeight: '96vh',
                    background: 'linear-gradient(135deg, #110c22 0%, #1a103c 100%)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                    borderRadius: '20px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168,85,247,0.2)', paddingBottom: '16px' }}>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🔮</span> Foire aux questions (FAQ)
                      </h3>
                      <button onClick={() => setShowFaqModal(false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', transition: 'all 0.2s' }}>Fermer</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Accordion Item 1 */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'costume' ? null : 'costume')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'costume' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'costume' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'costume' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>👔</span> Comment est calculé le bonus pour les jours en Costume (COST) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'costume' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'costume' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'costume' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>Lorsqu'un agent effectue des jours en "Costume", il bénéficie d'un supplément calculé de manière différentielle.</p>
                              <div style={{ background: 'rgba(168,85,247,0.1)', borderLeft: '4px solid #c084fc', padding: '16px 20px', borderRadius: '6px' }}>
                                <strong>Principe :</strong> Le bonus correspond à la différence entre le salaire de base de la fonction Costume et le salaire de base habituel de l'agent, ramené à la journée.
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple de calcul concret :</strong>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <li>Salaire Tenue (habituel) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                                  <li>Salaire Costume (A-C) = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                                  <li><strong>Différence journalière</strong> = 3 000 - 2 500 = <strong style={{ color: '#c084fc' }}>+500 CFA</strong> par jour</li>
                                </ul>
                                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                                  Si l'agent fait <strong>5 jours</strong> en Costume :<br />
                                  <span style={{ display: 'inline-block', marginTop: '10px' }}><strong>Bonus final généré</strong> = 5 jours × 500 CFA = <strong style={{ color: '#c084fc', fontSize: '1.4rem' }}>+2 500 CFA</strong></span>
                                </div>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> Ce montant s'ajoute automatiquement au <strong>Salaire net (Aperçu)</strong> dans la section "Bonus et Supp.".
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vous pourrez ajouter d'autres éléments ici à l'avenir */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'prorata' ? null : 'prorata')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'prorata' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'prorata' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'prorata' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>🛡️</span> Comment est calculé le prorata pour les autres fonctions (GA, CP, MC, etc.) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'prorata' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'prorata' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'prorata' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>La logique est exactement la même que pour le Costume, et s'applique automatiquement à <strong>toutes les fonctions et postes existants ou que vous créerez plus tard</strong>.</p>
                              <div style={{ background: 'rgba(168,85,247,0.1)', borderLeft: '4px solid #c084fc', padding: '16px 20px', borderRadius: '6px' }}>
                                <strong>Principe :</strong> Le système calcule la différence entre le salaire de la fonction assignée pour la journée et le salaire de base de l'agent.
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple (Agent AS qui effectue des jours en tant que CP) :</strong>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <li>Salaire de base de l'agent (AS) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                                  <li>Salaire de la fonction (CP) = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                                  <li><strong>Différence journalière</strong> = 3 000 - 2 500 = <strong style={{ color: '#c084fc' }}>+500 CFA</strong> par jour</li>
                                </ul>
                                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                                  Si l'agent fait <strong>3 jours</strong> en tant que CP :<br />
                                  <span style={{ display: 'inline-block', marginTop: '10px' }}><strong>Bonus final généré</strong> = 3 jours × 500 CFA = <strong style={{ color: '#c084fc', fontSize: '1.4rem' }}>+1 500 CFA</strong></span>
                                </div>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> Note : Si la fonction assignée a le <strong>même salaire</strong> que la fonction de base de l'agent (ex: AS en GA = 75 000), le bonus généré sera logiquement de +0 CFA.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accordion Item Raccourcis Clavier */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'shortcuts' ? null : 'shortcuts')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'shortcuts' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'shortcuts' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'shortcuts' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>⌨️</span> Quels sont les raccourcis clavier pour le pointage ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'shortcuts' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'shortcuts' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'shortcuts' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>Vous pouvez utiliser votre clavier pour corriger plus rapidement vos erreurs de saisie :</p>

                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Z</strong>
                                    <span style={{ marginLeft: '12px' }}><strong>Annuler</strong> la dernière modification de présence. Si vous cliquez sur une case par erreur, ce raccourci la remet dans son état précédent.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Y</strong> <em style={{ opacity: 0.6, fontSize: '0.9rem' }}>(ou CTRL + MAJ + Z)</em>
                                    <span style={{ marginLeft: '12px' }}><strong>Rétablir</strong> une modification que vous venez d'annuler.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + F</strong>
                                    <span style={{ marginLeft: '12px' }}>Place directement le curseur dans la barre de <strong>recherche d'un agent</strong>.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Flèches (Haut, Bas, Gauche, Droite)</strong>
                                    <span style={{ marginLeft: '12px' }}>Permet de se déplacer rapidement de cellule en cellule au clavier.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Entrée</strong>
                                    <span style={{ marginLeft: '12px' }}>Ouvre la fenêtre de modification ou valide le pointage sur la cellule sélectionnée.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Suppr / Backspace</strong>
                                    <span style={{ marginLeft: '12px' }}>Efface instantanément le pointage de la cellule sélectionnée.</span>
                                  </li>
                                </ul>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> <em>Note : L'historique des annulations est propre à votre session sur la page. Si vous quittez ou actualisez la page, l'historique repart à zéro.</em>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* NOUVELLE SECTION FAQ PREMIUM */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'premium' ? null : 'premium')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'premium' ? 'rgba(56,189,248,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'premium' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'premium' ? 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' : 'none' }}>🚀</span> Comment utiliser les Fonctionnalités Premium (Mode Zen, Pinceau, Copier/Coller) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'premium' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'premium' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'premium' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(56,189,248,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Mode Zen 👁️ / 🔍</strong> : En bas à droite de l'écran, cliquez sur l'icône de l'œil pour masquer l'interface supérieure et passer en plein écran.
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Mode Pinceau 🖌️</strong> : En bas au centre, activez cette case pour saisir très rapidement des pointages. Choisissez le statut (Présent, Absent, etc.), puis cliquez et glissez sur les cellules sans relâcher la souris.
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Menu Contextuel 🖱️</strong> : Un clic-droit sur n'importe quelle cellule du tableau ouvre un menu rapide sous votre curseur (pour muter l'agent, changer de vacation, etc.).
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Copier / Coller de semaine 📋</strong> : Dans le menu du clic-droit, vous pouvez "Copier la semaine" d'un agent puis "Coller la semaine" sur un autre agent pour dupliquer tout le mois instantanément !
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>,
                document.body
              )}

            </div>

            <div className="sites-actions-bar">

              {/* Navigateur de mois et Toggle d'édition */}
              {viewMode === 'current' && (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div className="month-navigator" style={{ background: isPastMonth ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: isPastMonth ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)' }}>
                    <button
                      onClick={() => changePeriod(-1)}
                      style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Mois précédent"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '6px 14px', fontWeight: 700, fontSize: '0.95rem', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {getPeriodLabel()}
                    </span>
                    <button
                      onClick={() => changePeriod(1)}
                      style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Mois suivant"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '8px',
                      background: isEditMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: isEditMode ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border)',
                      color: isEditMode ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                    title={isEditMode ? "Le pointage est modifiable (Clic pour verrouiller)" : "Sécurité activée. Clic-gauche et modifications désactivés (Clic pour déverrouiller)"}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{isEditMode ? '🔓' : '🔒'}</span>
                    {isEditMode ? 'Mode Édition' : 'Mode Lecture'}
                  </button>
                </div>
              )}

              {!isVerificationMode && viewMode === 'current' && !isEmptyMonth && (
                <div className="sites-action-buttons" style={{ position: 'relative' }}>
                  <button
                    className={`btn ${publishedPeriods.includes(period) ? 'btn-secondary' : ''}`}
                    onClick={() => setShowPublishModal(true)}
                    disabled={publishedPeriods.includes(period)}
                    style={publishedPeriods.includes(period) ? { padding: '8px 16px', fontSize: '0.9rem' } : {
                      padding: '8px 16px', fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      border: '1px solid rgba(16, 185, 129, 0.6)',
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      if (!publishedPeriods.includes(period)) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!publishedPeriods.includes(period)) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                  >
                    <Check size={18} style={{ strokeWidth: 3 }} />
                    {publishedPeriods.includes(period) ? `Pointage publié ✅` : `PUBLIER LE POINTAGE`}
                  </button>
                  {publishedPeriods.includes(period) && (
                    <button
                      onClick={() => setShowPublishReport(true)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none', color: '#fff',
                        borderRadius: '6px', padding: '6px 12px',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                      }}
                    >📋 Voir le Rapport</button>
                  )}
                  {!publishedPeriods.includes(period) ? (
                    <>
                      <button className="btn btn-primary" onClick={() => setShowStats(true)} style={{ background: '#6366f1', padding: '8px 16px', fontSize: '0.9rem' }}>
                        <TrendingUp size={16} /> Stats
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowBlacklist(true)} style={{ background: '#ef4444', padding: '8px 16px', fontSize: '0.9rem' }}>
                        <ShieldAlert size={16} /> Liste Noire
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowAddSite(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        <Plus size={16} /> Nouveau Site
                      </button>
                      <div style={{ 
                        position: 'absolute',
                        top: 'calc(100% + 20px)',
                        right: 0,
                        display: 'flex',
                        gap: '10px',
                        zIndex: 50
                      }}>
                        <button 
                          className="btn hover-scale" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setShowCalendar(true); 
                          }} 
                          style={{ 
                            padding: '8px 16px', fontSize: '0.85rem', width: 'max-content', 
                            background: 'linear-gradient(135deg, #0d9488, #0f766e)', 
                            border: '1px solid #14b8a6', color: 'white', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(13, 148, 136, 0.4)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 148, 136, 0.7)';
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #0d9488, #0f766e)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.4)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          }}
                        >
                          📅 Suivi Pointage
                        </button>
                        <button 
                          className="btn hover-scale" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            runVerification(); 
                          }} 
                          style={{ 
                            padding: '8px 16px', fontSize: '0.85rem', width: 'max-content', 
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', 
                            border: '1px solid #8b5cf6', color: 'white', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: isVerifying ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (isVerifying) return;
                            e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(124, 58, 237, 0.7)';
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                          }}
                          onMouseLeave={(e) => {
                            if (isVerifying) return;
                            e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.4)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          }}
                        >
                          {isVerifying ? '🛡️ Analyse en cours...' : '🛡️ Vérification'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowNextMonthModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                        cursor: 'pointer',
                        opacity: 1
                      }}
                    >
                      <CalendarDays size={14} /> Mois Suivant ➔
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isEmptyMonth && (
              <div style={{ flexBasis: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '-12px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <Search size={20} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Rechercher un site par son nom..."
                    value={siteSearchTerm}
                    onChange={(e) => setSiteSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#0f172a', outline: 'none', width: '100%', fontSize: '0.95rem', fontWeight: 600 }}
                  />
                  {siteSearchTerm && (
                    <button
                      onClick={() => setSiteSearchTerm('')}
                      style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isVerificationMode && !publishedPeriods.includes(period) && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>⏳</div>
            <h3>Aucun pointage n'est encore publié pour ce mois de {getPeriodLabel()}</h3>
            <p className="subtitle" style={{ marginTop: '8px' }}>Veuillez attendre que le service planning publie le pointage pour y accéder.</p>
          </div>
        )}

        {isVerificationMode && publishedPeriods.includes(period) && datesList.length > 0 && (
          <div className="glass-panel"
            onClick={() => setShowVerificationSites(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(34,197,94,0.1) 100%)',
              border: showVerificationSites ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(56,189,248,0.6)',
              padding: '24px',
              marginBottom: '32px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: showVerificationSites ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: showVerificationSites ? 'none' : '0 10px 30px -10px rgba(56,189,248,0.3)',
              transform: showVerificationSites ? 'none' : 'translateY(0)'
            }}
            onMouseEnter={e => { if (!showVerificationSites) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!showVerificationSites) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(56,189,248,0.2)', padding: '16px', borderRadius: '50%', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={36} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>Période à traiter</h3>
                <p style={{ fontSize: '1.05rem', color: 'var(--muted)', margin: 0 }}>
                  Traitement des pointages du <strong style={{ color: '#fff' }}>{datesList[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong> au <strong style={{ color: '#fff' }}>{datesList[datesList.length - 1].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
                </p>
              </div>
            </div>
            {!showVerificationSites && (
              <div style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 0 15px rgba(56,189,248,0.5)',
                transition: 'all 0.2s ease'
              }}>
                Démarrer le traitement ➔
              </div>
            )}
          </div>
        )}

        {((!isVerificationMode && !isArchiveMode) || isArchiveMode || (isVerificationMode && publishedPeriods.includes(period) && showVerificationSites)) && (
          <>
            {(isEmptyMonth && !loading) ? (
              /* ── Mois sans données (passé vide ou futur) ── */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 24px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.35 }}>
                  {isEmptyFutureMonth ? '🔒' : '📭'}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
                  Aucun pointage disponible
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.6 }}>
                  {isEmptyFutureMonth ? (
                    <>Le pointage de <strong style={{ color: 'var(--text)' }}>{getPeriodLabel()}</strong> n'est pas encore disponible.<br />Publiez d'abord le mois en cours avant de passer au suivant.</>
                  ) : (
                    <>Aucune donnée de pointage n'a été enregistrée pour <strong style={{ color: 'var(--text)' }}>{getPeriodLabel()}</strong>.<br />Ce mois précède la période d'utilisation de l'application.</>
                  )}
                </p>
                <button
                  onClick={() => changePeriod(isEmptyFutureMonth ? -1 : 1)}
                  style={{
                    marginTop: '28px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--a)', color: 'white', border: 'none', borderRadius: '10px',
                    padding: '10px 22px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(56,189,248,0.3)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {isEmptyFutureMonth ? <><ChevronLeft size={16} /> Revenir au mois précédent</> : <><ChevronRight size={16} /> Revenir au mois suivant</>}
                </button>
              </div>
            ) : sites.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>🏢</div>
                <h3>Aucun site enregistré</h3>
                <p className="subtitle" style={{ marginTop: '8px' }}>Commencez par créer un site pour gérer vos agents.</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowAddSite(true)}>
                  <Plus size={16} /> Créer mon premier site
                </button>
              </div>
            ) : (
              <div className="sites-grid">
                {sites.filter(site => {
                  if (site.id === 'site_extras' && localStorage.getItem('pontage_active_extras') === 'false') return false;
                  if (site.id === 'site_releves' && localStorage.getItem('pontage_active_releves') === 'false') return false;
                  if (site.id === 'site_administration' && localStorage.getItem('pontage_active_admin') === 'false') return false;
                  if (siteSearchTerm && site.name) {
                    const matchSite = site.name.toLowerCase().includes(siteSearchTerm.toLowerCase());
                    const matchAgents = globalAgents.filter(a => a.site_id === site.id && a.name.toLowerCase().includes(siteSearchTerm.toLowerCase()));
                    if (!matchSite && matchAgents.length === 0) {
                      return false;
                    }
                  }
                  return true;
                }).sort((a, b) => {
                  if (isArchiveMode) return 0;
                  const cleanStr = (s) => (s || '').replace(/[^a-zA-Z0-9À-ÿ]/g, '').toLowerCase();
                  if (siteSortOrder === 'alpha_asc') {
                    return cleanStr(a.name).localeCompare(cleanStr(b.name));
                  } else if (siteSortOrder === 'alpha_desc') {
                    return cleanStr(b.name).localeCompare(cleanStr(a.name));
                  } else if (siteSortOrder === 'zone') {
                    const zoneA = a.zone || 'Autre';
                    const zoneB = b.zone || 'Autre';
                    if (zoneA !== zoneB) return cleanStr(zoneA).localeCompare(cleanStr(zoneB));
                    return cleanStr(a.name).localeCompare(cleanStr(b.name));
                  } else if (siteSortOrder === 'created') {
                    const idxA = siteOrder.indexOf(a.id);
                    const idxB = siteOrder.indexOf(b.id);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                  }
                  return 0;
                }).map((site, idx) => {
                  const glowColors = ['var(--b)', 'var(--a)', 'var(--c)', '#a78bfa', '#f472b6'];
                  const glow = glowColors[idx % glowColors.length];
                  const matchedAgents = siteSearchTerm ? globalAgents.filter(a => a.site_id === site.id && a.name.toLowerCase().includes(siteSearchTerm.toLowerCase())) : [];
                  const siteIcon = site.icon || '🏢';
                  return (
                    <div
                      key={site.id}
                      className={`site-card design-${cardDesign}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, site.id)}
                      onDragOver={(e) => handleDragOver(e, site.id)}
                      onDragEnd={handleDragEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSiteContextMenu({ visible: true, x: e.clientX, y: e.clientY, siteId: site.id, siteName: site.name });
                      }}
                      style={{
                        '--card-glow': glow,
                        cursor: 'grab',
                        opacity: draggedSite === site.id ? 0.4 : 1,
                        transform: draggedSite === site.id ? 'scale(0.98)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onClick={() => selectSite(site.id, site.name)}
                    >
                      <div className="site-card-inner">
                        {/* Icône modifiable */}
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                          <button
                            title="Changer l'icône"
                            onClick={e => { e.stopPropagation(); setIconPickerSiteId(iconPickerSiteId === site.id ? null : site.id); }}
                            style={{ width: '52px', height: '52px', background: 'rgba(56,189,248,0.08)', borderRadius: '12px', border: '1px dashed rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', padding: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.22)'; e.currentTarget.style.borderColor = 'var(--b)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
                          >
                            {siteIcon.startsWith('data:') ? (
                              <img src={siteIcon} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} />
                            ) : (
                              siteIcon
                            )}
                          </button>

                          {/* Picker popup */}
                          {iconPickerSiteId === site.id && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{ position: 'absolute', top: '58px', left: 0, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', width: '272px' }}
                            >
                              {/* Upload image button */}
                              <label
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.35)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--b)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.22)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                              >
                                🖼️ Importer une image
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    if (file.size > 300 * 1024) { alert('Image trop grande (max 300 Ko)'); return; }
                                    const reader = new FileReader();
                                    reader.onload = ev => handleUpdateSiteIcon(site.id, ev.target.result);
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                              {/* Separator */}
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>ou choisir un emoji</div>
                              {/* Emoji grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                                {SITE_EMOJIS.map(em => (
                                  <button
                                    key={em}
                                    onClick={() => handleUpdateSiteIcon(site.id, em)}
                                    style={{ background: em === siteIcon ? 'rgba(56,189,248,0.25)' : 'transparent', border: em === siteIcon ? '1px solid var(--b)' : '1px solid transparent', borderRadius: '6px', fontSize: '1.2rem', padding: '4px', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = em === siteIcon ? 'rgba(56,189,248,0.25)' : 'transparent'}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>
                            {site.name} {site.location === 'interieur' && <img src="https://flagcdn.com/w20/ci.png" srcSet="https://flagcdn.com/w40/ci.png 2x" width="16" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px' }} />}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              title="Renommer le site"
                              onClick={(e) => handleRenameSiteInline(e, site.id, site.name)}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--muted)',
                                cursor: 'pointer', padding: '4px', borderRadius: '4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'color 0.2s, background 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--b)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span style={{ fontSize: '14px' }}>✏️</span>
                            </button>
                            {!['site_extras', 'site_releves', 'site_administration'].includes(site.id) && (
                              <button
                                title="Supprimer le site"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteSiteData(site);
                                  setShowDeleteSiteModal(true);
                                }}
                                style={{
                                  background: 'transparent', border: 'none', color: 'var(--muted)',
                                  cursor: 'pointer', padding: '4px', borderRadius: '4px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'color 0.2s, background 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Gestion du Pointage</p>
                        {matchedAgents.length > 0 && (
                          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--b)', fontWeight: 'bold', marginBottom: '6px' }}>AGENTS TROUVÉS :</div>
                            {matchedAgents.map(a => (
                              <div
                                key={a.id}
                                style={{
                                  padding: '6px',
                                  fontSize: '0.85rem',
                                  color: '#e2e8f0',
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  transition: 'background 0.2s',
                                  display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSiteSearchTerm('');
                                  setHighlightedAgentId(a.id);
                                  selectSite(site.id, site.name);
                                }}
                              >
                                <span style={{ color: 'var(--a)' }}>👤</span> {a.name}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: glow, fontSize: '0.85rem', fontWeight: 700 }}>
                          <span>Ouvrir le tableau</span>
                          <span style={{ fontSize: '1rem' }}>→</span>
                        </div>

                        {/* ZONE & AGENT COUNT ON HOVER */}
                        {showAgentCountHover && (
                          <div className="zone-count-hover" style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '8px', color: 'var(--b)', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', opacity: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'translateY(-10px)', pointerEvents: 'none', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📍</span> {site.subsites ? site.subsites.length : 0} zone{site.subsites && site.subsites.length > 1 ? 's' : ''}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                              <Users size={14} color="#f59e0b" /> {site.agents_count || 0} agent{site.agents_count > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============ MODAL RENOMMER SITE ============ */}
        <RenameSiteModal
          isOpen={!!renameModalData}
          currentName={renameModalData?.currentName}
          onClose={() => setRenameModalData(null)}
          onConfirm={executeRenameSite}
        />

        {/* Modal Première Connexion */}
        {showFirstVisitModal && (() => {
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const [y, m] = getSafePeriod(period).split('-').map(Number);
          const currentMonthName = monthNames[m - 1];
          const nextD = new Date(y, m, 1);
          const nextMonthName = monthNames[nextD.getMonth()];
          const nextYear = nextD.getFullYear();
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
              <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px', padding: '32px',
                maxWidth: '520px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗓️</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Première connexion — Pointage</h2>
                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '16px' }}>
                  Avez-vous déjà <strong>traité et publié</strong> le pointage du mois de{' '}
                  <strong style={{ color: '#38bdf8' }}>{currentMonthName} {y}</strong> ?
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  Si oui, nous basculons directement sur <strong style={{ color: 'white' }}>{nextMonthName} {nextYear}</strong> pour le nouveau cycle.<br />
                  Si non, vous travaillerez sur <strong style={{ color: 'white' }}>{currentMonthName} {y}</strong> normalement.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleFirstVisitNon} className="btn btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
                    ❌ Non, commencer {currentMonthName}
                  </button>
                  <button onClick={handleFirstVisitOui} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
                    ✅ Oui, passer à {nextMonthName}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal Ajout Site */}
        {showAddSite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '420px' }}>
              <h3 style={{ marginBottom: '16px' }}>Nouveau Site</h3>
              {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
              <input className="form-input" style={{ width: '100%', marginBottom: '16px' }} placeholder="Nom du site..." value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />

              <div style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="siteLocation" value="abidjan" checked={newSiteLocation === 'abidjan'} onChange={e => setNewSiteLocation(e.target.value)} />
                  Abidjan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="siteLocation" value="interieur" checked={newSiteLocation === 'interieur'} onChange={e => setNewSiteLocation(e.target.value)} />
                  Intérieur
                </label>
              </div>

              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: isSpecialSite ? '8px' : '0' }}>
                  <input type="checkbox" checked={isSpecialSite} onChange={e => setIsSpecialSite(e.target.checked)} />
                  <span style={{ fontWeight: 'bold' }}>Ceci est un Vivier Spécial</span>
                </label>
                {isSpecialSite && (
                  <>
                    <select
                      className="form-input"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', marginBottom: specialSiteType === 'definir' ? '12px' : '0' }}
                      value={specialSiteType}
                      onChange={e => setSpecialSiteType(e.target.value)}
                    >
                      <option value="extras">Comportement : Extras (Réserve)</option>
                      <option value="releves">Comportement : Relèves (Remplaçants)</option>
                      <option value="admin">Comportement : Administration</option>
                      <option value="custom">Autre / Libre</option>
                      <option value="definir">Définir le comportement</option>
                    </select>

                    {specialSiteType === 'definir' && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Choisissez l'affichage :</label>
                        <select
                          className="form-input"
                          style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--b)', color: 'white' }}
                          value={customBehavior}
                          onChange={e => setCustomBehavior(e.target.value)}
                        >
                          <option value="grouped">Classique (Tableau unique)</option>
                          <option value="manual_zones">Option A : Création de Zones</option>
                          <option value="auto_individual">Option B : 1 Tableau par Agent</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddSite(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleCreateSite}>Créer</button>
              </div>
            </div>
          </div>
        )}

        {/* ============ MODAL PUBLIER POINTAGE ============ */}
        {showPublishModal && (() => {
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const [yr, mn] = getSafePeriod(period).split('-').map(Number);
          const monthName = monthNames[mn - 1];
          const startD = new Date(yr, mn - 2, 21);
          const endD = new Date(yr, mn - 1, 20);
          const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div onClick={() => !publishing && setShowPublishModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
              {publishing ? (
                <div style={{
                  position: 'relative', zIndex: 1,
                  background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
                  border: '1px solid rgba(239,68,68,0.5)', borderRadius: '24px', padding: '40px',
                  maxWidth: '500px', width: '100%',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '20px', animation: 'pulse 2s infinite' }}>📡</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fef2f2', margin: '0 0 10px 0' }}>Publication en cours...</h2>
                  <p style={{ color: 'rgba(254,226,226,0.7)', fontSize: '1rem', marginBottom: '30px' }}>Transmission sécurisée des données vers le serveur de traitement centralisé.</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700 }}>
                    <span>Progression</span>
                    <span>{publishProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${publishProgress}%`, height: '100%', background: '#ef4444', transition: 'width 0.1s linear' }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative', zIndex: 1,
                  background: 'linear-gradient(145deg, #0a1628 0%, #111827 50%, #0f1a2e 100%)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: '24px', padding: '28px 32px',
                  maxWidth: '500px', width: '100%',
                  maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(56,189,248,0.15))', border: '2px solid rgba(34,197,94,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 25px rgba(34,197,94,0.2)' }}>🚀</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Publier le pointage</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>
                      Mois de <span style={{ color: '#22c55e', fontWeight: 700 }}>{monthName} {yr}</span>
                    </p>
                  </div>

                  {/* Période card */}
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <CalendarDays size={28} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Période concernée</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{fmtD(startD)} → {fmtD(endD)}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{sites.length}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Site(s)</div>
                    </div>
                    <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>{stats.totalAgents}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Agent(s)</div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>En publiant :</p>
                    {[
                      { icon: '📤', text: 'Le pointage sera visible pour le service de traitement' },
                      { icon: '📦', text: 'Une archive automatique sera créée' },
                      { icon: '🔒', text: 'Le bouton "Mois Suivant" sera débloqué' },
                    ].map((item, i) => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowPublishModal(false)} disabled={publishing}
                      style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >Annuler</button>
                    <button onClick={handlePublishPeriod} disabled={publishing}
                      style={{ flex: 2, padding: '14px', borderRadius: '12px', background: publishing ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', border: 'none', cursor: publishing ? 'wait' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onMouseEnter={e => { if (!publishing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(34,197,94,0.5)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,197,94,0.4)'; }}
                    >
                      {publishing ? (
                        <><Loader2 size={18} className="animate-spin" /> Publication en cours...</>
                      ) : (
                        <><Check size={18} /> Confirmer la publication</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============ MODAL MOIS SUIVANT ============ */}
        {showNextMonthModal && (() => {
          let [y, m] = getSafePeriod(period).split('-').map(Number);
          m += 1; if (m > 12) { m = 1; y += 1; }
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const currentMonthName = monthNames[Number(getSafePeriod(period).split('-')[1]) - 1];
          const nextMonthName = monthNames[m - 1];

          const start = new Date(y, m - 2, 21);
          const end = new Date(y, m - 1, 20);
          const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div onClick={() => setShowNextMonthModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
              <div className="next-month-modal-container">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 25px rgba(245,158,11,0.2)' }}>📅</div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Passage au mois suivant</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>{currentMonthName} → <span style={{ color: '#f59e0b', fontWeight: 700 }}>{nextMonthName} {y}</span></p>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <CalendarDays size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Nouvelle période de pointage</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{fmtDate(start)} → {fmtDate(end)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Ce qui va se passer :</p>
                  {[
                    { icon: '✅', color: '#22c55e', text: 'La structure de vos sites et agents est conservée' },
                    { icon: '✅', color: '#22c55e', text: 'Les vacations et fonctions sont maintenues' },
                    { icon: '🗑️', color: '#ef4444', text: 'Les absences sont remises à zéro' },
                    { icon: '🗑️', color: '#ef4444', text: 'Les heures supplémentaires sont effacées', hasEdit: true },
                    { icon: '🔄', color: '#38bdf8', text: 'Le calendrier est recalculé pour la nouvelle période' }
                  ].map((item, i) => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.text}</span>
                      {item.hasEdit && (
                        <button onClick={() => setShowKeepHSModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} title="Sélectionner les sites pour lesquels conserver les HS">
                          <Edit size={16} />
                          {sitesToKeepHS.length > 0 && <span style={{ fontSize: '0.75rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{sitesToKeepHS.length} site(s)</span>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="next-month-buttons" style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowNextMonthModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Annuler</button>
                  <button onClick={handleNextMonth} disabled={initializing} style={{ flex: 2, padding: initializing ? '10px 14px' : '14px', borderRadius: '12px', background: initializing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: initializing ? 'rgba(255,255,255,0.8)' : '#fff', border: 'none', cursor: initializing ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: initializing ? 'none' : '0 4px 20px rgba(245,158,11,0.4)', display: 'flex', flexDirection: initializing ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5)'; } }} onMouseLeave={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)'; } }}>
                    {initializing ? (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <span>Initialisation en cours... {initProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${initProgress}%`, height: '100%', background: '#fff', transition: 'width 0.1s linear' }} />
                        </div>
                      </div>
                    ) : (
                      <><CalendarDays size={18} /> Confirmer — Passer à {nextMonthName}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {showStats && <StatsPanel companyId={user?.company_id} onClose={() => setShowStats(false)} />}
        {showBlacklist && <BlacklistModal onClose={() => setShowBlacklist(false)} />}

        {/* MENU CONTEXTUEL SITE */}
        {siteContextMenu.visible && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: siteContextMenu.y,
              left: siteContextMenu.x,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 9999,
              padding: '4px',
              minWidth: '180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <div style={{ padding: '8px', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
              Site: {siteContextMenu.siteName}
            </div>
            <button
              className="btn"
              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setRenameSiteName(siteContextMenu.siteName);
                setShowRenameSiteModal(true);
                setSiteContextMenu({ ...siteContextMenu, visible: false });
              }}
            >
              <Edit size={14} /> Renommer
            </button>
            <button
              className="btn"
              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setShowDeleteSiteModal(true);
                setSiteContextMenu({ ...siteContextMenu, visible: false });
              }}
            >
              <Trash size={14} /> Supprimer
            </button>
          </div>
        )}

        {/* MODALE RENOMMER SITE */}
        {showRenameSiteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '400px' }}>
              <h3 style={{ marginBottom: '16px' }}>Renommer le site</h3>
              <form onSubmit={handleRenameSite}>
                <input
                  className="form-input"
                  style={{ width: '100%', marginBottom: '20px' }}
                  value={renameSiteName}
                  onChange={e => setRenameSiteName(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowRenameSiteModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Renommer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE CONFIRMATION COLLAGE */}
        {pasteConfirmModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.3rem', color: '#f8fafc' }}>Confirmer le collage</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '24px', lineHeight: '1.5' }}>
                Êtes-vous sûr de vouloir coller les pointages de <br />
                <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.sourceAgent.name}</strong> vers <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.targetAgent.name}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px' }}
                  onClick={() => setPasteConfirmModal(null)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={async () => {
                    const { sourceAgent, targetAgent } = pasteConfirmModal;
                    const updates = [];
                    const newAttendance = [...(targetAgent.attendance || [])];

                    const year = parseInt(period.split('-')[0], 10);
                    const month = parseInt(period.split('-')[1], 10) - 1;
                    const startD = new Date(year, month - 1, cycleStart);
                    const endD = new Date(year, month, cycleStart - 1);
                    const tempDatesList = [];
                    let cur = new Date(startD);
                    while (cur <= endD) {
                      tempDatesList.push(new Date(cur));
                      cur.setDate(cur.getDate() + 1);
                    }

                    tempDatesList.forEach(d => {
                      const dk = formatDateKey(d);
                      ['J', 'N', 'S', 'SJ', 'SN'].forEach(sc => {
                        const srcCell = (sourceAgent.attendance || []).find(a => a.date === dk && a.shift_code === sc);
                        if (srcCell && srcCell.status) {
                          updates.push(apiCall('update_attendance', {
                            agent_id: targetAgent.id, date: dk, shift_code: sc, status: srcCell.status, period
                          }));

                          const idx = newAttendance.findIndex(a => a.date === dk && a.shift_code === sc);
                          if (idx >= 0) {
                            newAttendance[idx] = { ...newAttendance[idx], status: srcCell.status };
                          } else {
                            newAttendance.push({ date: dk, shift_code: sc, status: srcCell.status });
                          }
                        }
                      });
                    });

                    setSiteData(prev => prev.map(sub => ({
                      ...sub,
                      agents: sub.agents?.map(ag => {
                        if (ag.id === targetAgent.id) return { ...ag, attendance: newAttendance };
                        return ag;
                      })
                    })));

                    setPasteConfirmModal(null);
                    setClipboardWeek(null);
                    await Promise.all(updates);
                  }}
                >
                  <Check size={18} /> Coller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ MODAL CONSERVATION HS ============ */}
        {showKeepHSModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={() => setShowKeepHSModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
            <div style={{
              position: 'relative', zIndex: 1,
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
              maxWidth: '1400px', width: '95vw',
              height: '95vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(234,179,8,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}><Edit size={28} /></div>
                <div>
                  <h3 style={{ color: '#fff', margin: '0', fontSize: '1.4rem', fontWeight: 800 }}>Conserver les Heures Suppl.</h3>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
                Cochez les sites pour lesquels vous souhaitez que les lignes supplémentaires (SP) du mois précédent soient automatiquement copiées pour ce nouveau mois.
              </p>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', paddingRight: '8px', alignContent: 'start' }}>
                {sites.filter(s => s && s.name && !s.name.includes('Administration') && !s.name.includes('Relevé')).map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: sitesToKeepHS.includes(s.id) ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)', border: sitesToKeepHS.includes(s.id) ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                    <input
                      type="checkbox"
                      checked={sitesToKeepHS.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSitesToKeepHS([...sitesToKeepHS, s.id]);
                        else setSitesToKeepHS(sitesToKeepHS.filter(id => id !== s.id));
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#eab308' }}
                    />
                    <span style={{ color: sitesToKeepHS.includes(s.id) ? '#fff' : 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: sitesToKeepHS.includes(s.id) ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Annuler
                </button>
                <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #eab308 0%, #d97706 100%)', color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(234,179,8,0.4)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  Valider la sélection ({sitesToKeepHS.length})
                </button>
              </div>
            </div>
          </div>
      )}

      {/* MODALE SUPPRIMER SITE */}
      {showDeleteSiteModal && deleteSiteData && (
        <DeleteSiteModal
          siteName={deleteSiteData.name}
          onClose={() => {
            setShowDeleteSiteModal(false);
            setDeleteSiteData(null);
          }}
          onConfirm={async () => {
            try {
              const res = await apiCall('delete_site', { site_id: deleteSiteData.id, motif: 'Suppression depuis dashboard' });
              if (res.success) {
                const newSites = sites.filter(s => s.id !== deleteSiteData.id);
                setSites(newSites);
                localStorage.setItem('pontage_sites_cache', JSON.stringify(newSites));
                if (activeSiteId === deleteSiteData.id) setActiveSiteId(null);
                setShowDeleteSiteModal(false);
                setDeleteSiteData(null);
              } else {
                alert(res.message || "Erreur de suppression");
              }
            } catch (e) {
              alert("Erreur serveur.");
            }
          }}
        />
      )}

              {/* ============ MODAL SUCCÈS PUBLICATION ============ */}
              {showPublishSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: 36, width: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.7)', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                    {/* Icône succès animée */}
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>✅</div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '1.3rem', fontWeight: 800 }}>Pointage Publié !</h2>
                    <p style={{ margin: '0 0 6px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      Le pointage de <strong style={{ color: '#e2e8f0' }}>{(() => { const [y, m] = period.split('-'); return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][parseInt(m) - 1] + ' ' + y; })()}</strong> a été publié avec succès.
                    </p>
                    <p style={{ margin: '0 0 28px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Les agents du service vérification peuvent maintenant le consulter.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        onClick={() => { setShowPublishSuccess(false); setShowPublishReport(true); }}
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >📋 Voir le Rapport de Pointage</button>
                      <button
                        onClick={() => setShowPublishSuccess(false)}
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem' }}
                      >Fermer</button>
                    </div>
                  </div>
                </div>
              )}

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

              {/* ============ MODAL VERIFICATION STRICTE ============ */}
              {showVerificationModal && (
                <Suspense fallback={null}>
                  <VerificationModal 
                    sites={sites}
                    period={period}
                    cycleStart={cycleStart}
                    onClose={() => setShowVerificationModal(false)} 
                  />
                </Suspense>
              )}
              
              {showCalendar && (
                <PointageCalendarModal 
                  isOpen={showCalendar} 
                  onClose={() => setShowCalendar(false)} 
                  period={period} 
                />
              )}
            </>
            );
  }

            // ─── Vue tableau de pointage (site sélectionné) ─────────────────────
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
                        setMapAgentId(agent.id);
                        setMapAgentName(agent.name);
                        setMapStartDate(ctx.dateKey || formatDateKey(datesList[0]));
                        setMapEndDate(ctx.dateKey || formatDateKey(datesList[0]));
                        setMapNavOffset(0);
                        setMapManualDuration('');
                        setShowMapModal(true);
                      }
                    } else if (code === 'CP') {
                      if (agent) {
                        const dk = ctx.dateKey || formatDateKey(datesList[0]);
                        const existingLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'CP');
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
                    } else if (code === 'ENTRANT') {
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
                        handleAssignRepos(reposMenu.agentId, [6, 0]);
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
                        <span>Repos Weekend</span>
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

              {/* ─── BANDEAU VERROUILLAGE : Période publiée → Pointage en Lecture Seule ── */}
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
              {/* ─────────────────────────────────────────────────────────────────────────── */}

              {/* Bandeau Salaire Agent - KPI */}
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
                    // Codes qui représentent des jours non travaillés / déductions (selon api.php)
                    const ABSENCE_CODES = ['AB', 'A', 'M', 'P', 'MAP', 'ENTRANT', 'SORTANT', 'DEMISSION', 'ABANDON'];

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

                      // Supplémentaires (gains)
                      if (att.shift_code === 'S' || att.shift_code === 'SJ' || att.shift_code === 'SN') {
                        if (att.status !== 'A' && att.status !== 'R') {
                          overtimes++;
                          
                          let agentBaseForSp = baseSalary;
                          if (scObj) {
                            agentBaseForSp = (att.date < scObj.date) ? baseSalaryOld : baseSalaryNew;
                          }
                          
                          let gainSp = agentBaseForSp / specialBase; // Scénario C par défaut

                          if (st.startsWith('Suppl|') || st === 'Suppl_Dest') {
                            const parts = st.split('|');
                            let repFunc = parts[4]; // Suppl|dest|agent|motif|rep_func

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

                            if (repFunc && salaryGrid[repFunc]) {
                              const replacedBase = salaryGrid[repFunc];
                              const agentDaily = agentBaseForSp / specialBase;
                              const replacedDaily = replacedBase / specialBase;

                              if (replacedDaily > agentDaily) {
                                // Scénario A : Poste supérieur -> Gagne la différence (bonus)
                                gainSp = replacedDaily - agentDaily;
                              } else {
                                // Scénario B : Poste inférieur -> S'adapte au taux remplacé
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
                      } else if (att.status && ABSENCE_CODES.some(c => att.status === c || st.startsWith(c + '|'))) {
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

                    let activeDays = specialBase;
                    let realActive = datesList.length;
                    let activeDaysOld = 0;
                    let activeDaysNew = 0;

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
                        activeDaysNew = activeDays - activeDaysOld; // pour garder le total exact
                      } else {
                        // Si pas d'activité, on fait au prorata du nombre de jours calendaires
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
                      prorataBase = Math.round(baseSalaryOld * (activeDaysOld / specialBase)) + Math.round(baseSalaryNew * (activeDaysNew / specialBase));
                      deductions = Math.round((baseSalaryOld / specialBase) * absenceDaysOld) + Math.round((baseSalaryNew / specialBase) * absenceDaysNew);
                      gains = Math.round(overtimesGainsOld) + Math.round(overtimesGainsNew);
                      costBonus = Math.round(cost_countOld * ((costBase / specialBase) - (baseSalaryOld / specialBase))) + Math.round(cost_countNew * ((costBase / specialBase) - (baseSalaryNew / specialBase)));

                      Object.keys(dynamicFuncCounts).forEach(fcode => {
                        const fBase = salaryGrid[fcode] || 75000;
                        const cOld = dynamicFuncCountsOld[fcode] || 0;
                        const cNew = dynamicFuncCountsNew[fcode] || 0;
                        dynamicBonus += Math.round(cOld * ((fBase / specialBase) - (baseSalaryOld / specialBase))) + Math.round(cNew * ((fBase / specialBase) - (baseSalaryNew / specialBase)));
                      });
                    } else {
                      prorataBase = Math.round(baseSalary * (activeDays / specialBase));
                      const dailyRate = baseSalary / specialBase;
                      deductions = Math.round(dailyRate * absenceDays);
                      gains = Math.round(overtimesGains);
                      costBonus = Math.round(cost_count * ((costBase / specialBase) - dailyRate));

                      Object.keys(dynamicFuncCounts).forEach(fcode => {
                        const fBase = salaryGrid[fcode] || 75000;
                        const cCount = dynamicFuncCounts[fcode] || 0;
                        dynamicBonus += Math.round(cCount * ((fBase / specialBase) - dailyRate));
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
                        {/* Card: Salaire de Base */}
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


              {/* Chargement */}
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
                  {/* Tableau principal des pointages */}
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

              {/* Modal : Ajouter Site */}
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

              {/* Modal : Ajouter Zone / Sous-site */}
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


              {/* ============ MODAL AGENT ENTRANT ============ */}
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

              {/* ============ MODAL AGENT SORTANT ============ */}
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

              {/* ============ MODAL CONGÉ PAYÉ (CP) ============ */}
              {showCpModal && (
                <CpModal
                  agentName={cpAgentName}
                  startDate={cpStartDate}
                  endDate={cpEndDate}
                  onStartDateChange={setCpStartDate}
                  onEndDateChange={setCpEndDate}
                  onClose={() => setShowCpModal(false)}
                  onSubmit={handleCpSubmit}
                />
              )}

              {/* ============ MODAL PERMISSION (P) ============ */}
              {showPermissionModal && (
                <PermissionModal
                  agentName={permissionAgentName}
                  startDate={permissionStartDate}
                  endDate={permissionEndDate}
                  onStartDateChange={setPermissionStartDate}
                  onEndDateChange={setPermissionEndDate}
                  onClose={() => setShowPermissionModal(false)}
                  onSubmit={handlePermissionSubmit}
                />
              )}

              {/* ============ MODAL DETAILS PERMISSION ============ */}
              {permissionDetailsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: permissionDetailsModal.type === 'CP' ? '#14b8a6' : (permissionDetailsModal.type === 'MAP' ? '#f87171' : '#ef4444'), display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{permissionDetailsModal.type === 'CP' ? '🏖️' : (permissionDetailsModal.type === 'MAP' ? '⚖️' : '🎟️')}</span> Détails {permissionDetailsModal.type === 'CP' ? 'du Congé Payé' : (permissionDetailsModal.type === 'MAP' ? 'de la Mise à Pied' : 'de la Permission')}
                    </h3>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Agent: <strong style={{ color: 'var(--text)' }}>{permissionDetailsModal.agent_name || 'Inconnu'}</strong>
                      </p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Date de début: <strong style={{ color: 'var(--text)' }}>{permissionDetailsModal.start_date.split('-').reverse().join('/')}</strong>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Date de fin: <strong style={{ color: 'var(--text)' }}>{permissionDetailsModal.end_date.split('-').reverse().join('/')}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button onClick={() => {
                        // Pre-fill the edit modal
                        if (permissionDetailsModal.type === 'CP') {
                          setCpAgentId(permissionDetailsModal.agent_id);
                          setCpAgentName(permissionDetailsModal.agent_name || '');
                          setCpStartDate(permissionDetailsModal.start_date);
                          setCpEndDate(permissionDetailsModal.end_date);
                          setPermissionDetailsModal(null);
                          setShowCpModal(true);
                        } else if (permissionDetailsModal.type === 'MAP') {
                          setMapAgentId(permissionDetailsModal.agent_id);
                          setMapAgentName(permissionDetailsModal.agent_name || '');
                          setMapStartDate(permissionDetailsModal.start_date);
                          setMapEndDate(permissionDetailsModal.end_date);
                          setPermissionDetailsModal(null);
                          setShowMapModal(true);
                        } else {
                          setPermissionAgentId(permissionDetailsModal.agent_id);
                          setPermissionAgentName(permissionDetailsModal.agent_name || '');
                          setPermissionStartDate(permissionDetailsModal.start_date);
                          setPermissionEndDate(permissionDetailsModal.end_date);
                          setPermissionDetailsModal(null);
                          setShowPermissionModal(true);
                        }
                      }} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Modifier</button>
                      <button
                        onClick={() => {
                          // Use id directly if available (from foundLeave spread), otherwise search by agent+type+date
                          const leave = permissionDetailsModal.id
                            ? permissionDetailsModal
                            : leaves.find(l =>
                              String(l.agent_id) === String(permissionDetailsModal.agent_id) &&
                              l.type === permissionDetailsModal.type &&
                              l.start_date <= permissionDetailsModal.start_date &&
                              l.end_date >= permissionDetailsModal.start_date
                            );
                          if (leave) handleDeleteLeave(leave);
                          else setPermissionDetailsModal(null);
                        }}
                        style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >🗑️ Effacer</button>
                      <button onClick={() => setPermissionDetailsModal(null)} style={{ background: 'var(--b)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Fermer</button>
                    </div>
                  </div>
                </div>
              )}

              <OverlapWarningModal
                overlapWarning={overlapWarning}
                setOverlapWarning={setOverlapWarning}
              />

              {/* ============ MODAL MISE À PIED (MAP) ============ */}
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
                  onClose={() => setShowMapModal(false)}
                  onSubmit={handleMapSubmit}
                  getSafePeriod={getSafePeriod}
                  formatDateKey={formatDateKey}
                  getDayLabel={getDayLabel}
                />
              )}

              {/* Modal : Deploy Extra */}
              {showDeployExtra && (
                <DeployExtraModal
                  extraAgents={extraAgents}
                  onClose={() => setShowDeployExtra(false)}
                  onSubmit={handleDeployExtraSubmit}
                />
              )}

              {/* Modal : Deploy Releve */}
              {showDeployReleve && (
                <DeployReleveModal
                  releveAgents={releveAgents}
                  currentSiteAgents={siteData.flatMap(s => s.agents || [])}
                  onClose={() => setShowDeployReleve(false)}
                  onSubmit={handleDeployReleveSubmit}
                />
              )}

              {/* Modal : Ajouter Agent */}
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

              {/* Modal : Modifier Temps Partiel */}
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
                <div className="modal-overlay" onClick={() => setShowShiftChangeMenu(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                  <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Changement de Vacation</h3>
                    <form onSubmit={handleShiftChangeSubmit}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>À partir de quelle date ?</label>
                        <select
                          value={shiftChangeDate}
                          onChange={e => setShiftChangeDate(e.target.value)}
                          className="form-input"
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                          required
                        >
                          <option value="" disabled style={{ color: 'black' }}>Sélectionnez une date...</option>
                          {datesList.map(d => {
                            const dk = formatDateKey(d);
                            return <option key={dk} value={dk} style={{ color: 'black' }}>{d.toLocaleDateString('fr-FR')} ({getDayLabel(d)})</option>;
                          })}
                        </select>
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Nouvelle vacation</label>
                        <select
                          value={shiftChangeNewType}
                          onChange={e => setShiftChangeNewType(e.target.value)}
                          className="form-input"
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                        >
                          <option value="Jour" style={{ color: 'black' }}>Jour (J)</option>
                          <option value="Nuit" style={{ color: 'black' }}>Nuit (N)</option>
                          <option value="24h" style={{ color: 'black' }}>24h (J, N)</option>
                          <option value="48h" style={{ color: 'black' }}>48h (J, N)</option>
                          <option value="72h" style={{ color: 'black' }}>72h (J, N)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => setShowShiftChangeMenu(null)} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'En cours...' : 'Valider'}</button>
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

              {/* ============ MODAL RELÈVE SUPPLÉMENTAIRE ============ */}
              {scheduleModalAgent && (
                <ReleveScheduleModal
                  agent={scheduleModalAgent}
                  sites={sites}
                  period={period}
                  onClose={() => setScheduleModalAgent(null)}
                  onSuccess={() => {
                    setScheduleModalAgent(null);
                    loadSiteData();
                  }}
                />
              )}

              {releveSupplModal && (
                <ReleveSupplModal
                  data={releveSupplModal}
                  sites={sites}
                  period={period}
                  onClose={() => setReleveSupplModal(null)}
                  onSubmit={(replacedAgentId, motif) => {
                    const newStatus = `REL_1|${releveSupplModal.destSite}|${replacedAgentId}|${motif}`;
                    handleCellClick(releveSupplModal.agentId, releveSupplModal.dateKey, releveSupplModal.shiftCode, releveSupplModal.status, newStatus);
                    setReleveSupplModal(null);
                  }}
                />
              )}

              {/* Modal : External Supp */}
              {externalSuppModal && (
                <ExternalSuppModal
                  period={period}
                  agents={siteData.flatMap(sub => sub.agents || [])} 
                  sites={sites}
                  currentSiteId={activeSiteId}
                  onClose={() => setExternalSuppModal(null)}
                  onSubmit={async (data) => {
                    const payload = {
                      ...data,
                      period,
                      site_origine_id: activeSiteId
                    };
                    const res = await apiCall('add_external_supp', payload);
                    if (res.success) {
                      setExternalSuppModal(null);
                      loadSiteData(true);
                    } else {
                      alert(res.message || "Erreur lors de l'ajout du supplémentaire externe.");
                    }
                  }}
                />
              )}

              {transferModal && (
                <TransferModal
                  data={transferModal}
                  sites={sites}
                  onClose={() => setTransferModal(null)}
                  onSubmit={(destSiteId) => {
                    const siteObj = sites.find(s => String(s.id) === String(destSiteId));
                    const destName = siteObj ? siteObj.name : destSiteId;
                    // 1. Save the T on the original site
                    handleCellClick(transferModal.agentId, transferModal.dateKey, transferModal.shiftCode, transferModal.currentStatus, 'T');
                    // 2. We also need to send REL_T| to the destination site.
                    apiCall('update_attendance', {
                      agent_id: transferModal.agentId,
                      date: transferModal.dateKey,
                      shift_code: transferModal.shiftCode,
                      status: 'REL_T|' + destName,
                      period: period
                    });
                    setTransferModal(null);
                  }}
                />
              )}

              {zoneConfigModalData && (
                <ZoneConfigModal
                  zoneConfigModalData={zoneConfigModalData}
                  setZoneConfigModalData={setZoneConfigModalData}
                  functions={functions}
                  setShowManageFunctionsModal={setShowManageFunctionsModal}
                  handleUpdateSubsiteConfig={handleUpdateSubsiteConfig}
                />
              )}

              {moveZoneAgent && (
                <MoveAgentZoneModal
                  isOpen={!!moveZoneAgent}
                  onClose={() => setMoveZoneAgent(null)}
                  agent={moveZoneAgent}
                  siteId={activeSiteId}
                  subsites={siteData}
                  onSuccess={() => {
                    setMoveZoneAgent(null);
                    loadSiteData(true);
                  }}
                  onZoneCreated={loadDashboardData}
                />
              )}

              {/* Modal Rename Agent */}
              {showRenameAgentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '16px', padding: '30px', width: '450px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                    <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Edit2 size={24} color="#38bdf8" /> Modifier le nom de l'agent
                    </h3>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Nouveau nom complet</label>
                      <input
                        type="text"
                        value={renameAgentNewName}
                        onChange={e => setRenameAgentNewName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #475569', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                      <button className="btn btn-secondary" onClick={() => setShowRenameAgentModal(false)} style={{ padding: '10px 20px' }}>Annuler</button>
                      <button className="btn btn-primary" onClick={async () => {
                        if (!renameAgentNewName.trim()) { alert("Le nom ne peut pas être vide"); return; }
                        try {
                          const res = await apiCall('update_agent_info', {
                            agent_id: renameAgentTarget.id, field: 'name', value: renameAgentNewName.trim(), period: period
                          });
                          if (res.success) { loadDashboardData(); setShowRenameAgentModal(false); }
                          else { alert("Erreur lors de la modification du nom : " + (res.message || res.error || 'Erreur inconnue')); }
                        } catch (e) { console.error(e); alert("Erreur de connexion"); }
                      }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none' }}>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Read-Only Alert */}
              {showReadOnlyAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '30px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
                    <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.4rem' }}>Mode Lecture activé</h3>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
                      Le pointage est actuellement verrouillé contre les modifications.<br /><br />
                      Veuillez cliquer sur le bouton <strong>🔒 Mode Lecture</strong> (en haut de l'écran à côté du mois) pour le déverrouiller et pouvoir ajouter un agent.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowReadOnlyAlert(false)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', width: '100%', fontSize: '1.05rem', fontWeight: 'bold' }}>
                      J'ai compris
                    </button>
                  </div>
                </div>
              )}

              {showClosedMonthModal && (
                <ClosedMonthModal
                  onClose={() => setShowClosedMonthModal(false)}
                />
              )}

              {cpInfoModal && (
                <CpInfoModal
                  cpInfoModal={cpInfoModal}
                  setCpInfoModal={setCpInfoModal}
                />
              )}

              {permissionDetailsModal && (
                <PermissionDetailsModal
                  permissionDetailsModal={permissionDetailsModal}
                  setPermissionDetailsModal={setPermissionDetailsModal}
                />
              )}

              {externalSuppDetailsModal && (
                <ExternalSuppDetailsModal
                  data={externalSuppDetailsModal}
                  agents={siteData.flatMap(sub => sub.agents || [])}
                  onClose={() => setExternalSuppDetailsModal(null)}
                />
              )}


              {showTransferModal && (
                <TransferModal
                  data={transferModalData}
                  onClose={() => { setShowTransferModal(false); setTransferModalData(null); }}
                  onSave={async (mutation) => {
                    const { agentId, dateKey, shiftCode, targetSite, replacedAgent, motif } = mutation;
                    const newStatus = `T|${targetSite}|${replacedAgent}|${motif}`;
                    await handleCellClick(agentId, dateKey, shiftCode, '', newStatus);
                    setShowTransferModal(false);
                    setTransferModalData(null);
                  }}
                />
              )}

              {showTransferDetailsModal && (
                <TransferDetailsModal
                  data={transferDetailsData}
                  onClose={() => { setShowTransferDetailsModal(false); setTransferDetailsData(null); }}
                  onDelete={async (data) => {
                    await handleCellClick(data.agentId, data.dateKey, data.shiftCode, 'T', '1');
                    setShowTransferDetailsModal(false);
                    setTransferDetailsData(null);
                  }}
                />
              )}

              {/* ============ MODAL VERIFICATION STRICTE ============ */}
              {showVerificationModal && (
                <Suspense fallback={null}>
                  <VerificationModal 
                    sites={sites}
                    period={period}
                    cycleStart={cycleStart}
                    onClose={() => setShowVerificationModal(false)} 
                  />
                </Suspense>
              )}
              
              {showCalendar && (
                <PointageCalendarModal 
                  isOpen={showCalendar} 
                  onClose={() => setShowCalendar(false)} 
                  period={period} 
                />
              )}
            </div>
            );
}