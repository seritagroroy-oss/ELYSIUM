import { useState, useRef, useEffect } from 'react';

export function useDashboardState(archiveData) {
  const isArchiveMode = !!archiveData;

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
  const [showEditAdminScheduleModal, setShowEditAdminScheduleModal] = useState(false);
  const [editAdminScheduleAgent, setEditAdminScheduleAgent] = useState(null);
  const [editAdminScheduleDays, setEditAdminScheduleDays] = useState([]);
  const [editSpecialServiceAgent, setEditSpecialServiceAgent] = useState(null);
  const [editSpecialServiceBase, setEditSpecialServiceBase] = useState(12);
  const [editSpecialServiceDays, setEditSpecialServiceDays] = useState([]);
  const [editSpecialServiceIsEntrant, setEditSpecialServiceIsEntrant] = useState(false);
  const [editSpecialServiceEntrantDate, setEditSpecialServiceEntrantDate] = useState('');
  const [editSpecialServiceIsDebut, setEditSpecialServiceIsDebut] = useState(false);
  const [editSpecialServiceDebutDate, setEditSpecialServiceDebutDate] = useState('');


  return {
    showVerificationModal,
    setShowVerificationModal,
    showCalendar,
    setShowCalendar,
    hasVerifiedPointage,
    setHasVerifiedPointage,
    isVerifying,
    setIsVerifying,
    viewMode,
    setViewMode,
    showTransferModal,
    setShowTransferModal,
    transferModalData,
    setTransferModalData,
    showTransferDetailsModal,
    setShowTransferDetailsModal,
    transferDetailsData,
    setTransferDetailsData,
    externalSuppModal,
    setExternalSuppModal,
    moveZoneAgent,
    setMoveZoneAgent,
    lockedZones,
    setLockedZones,
    sites,
    setSites,
    siteOrder,
    setSiteOrder,
    draggedSite,
    setDraggedSite,
    activeSiteId,
    setActiveSiteId,
    activeSiteName,
    setActiveSiteName,
    showAgentCountHover,
    setShowAgentCountHover,
    period,
    setPeriod,
    cycleStart,
    setCycleStart,
    siteData,
    setSiteData,
    functions,
    setFunctions,
    loading,
    setLoading,
    renameModalData,
    setRenameModalData,
    highlightedAgentId,
    setHighlightedAgentId,
    globalAgents,
    setGlobalAgents,
    renameSubsiteModalData,
    setRenameSubsiteModalData,
    zoneConfigModalData,
    setZoneConfigModalData,
    functionModes,
    setFunctionModes,
    searchTerm,
    setSearchTerm,
    filterShiftType,
    setFilterShiftType,
    filterFunction,
    setFilterFunction,
    filterShowOnlyAbsences,
    setFilterShowOnlyAbsences,
    showAdvancedFilters,
    setShowAdvancedFilters,
    showKPICards,
    setShowKPICards,
    siteSortOrder,
    setSiteSortOrder,
    siteSearchTerm,
    setSiteSearchTerm,
    showSiteSettings,
    setShowSiteSettings,
    cardDesign,
    setCardDesign,
    selectedKpiAgent,
    setSelectedKpiAgent,
    isScrolled,
    setIsScrolled,
    kpiPos,
    setKpiPos,
    isDraggingKpi,
    setIsDraggingKpi,
    salaryGrid,
    setSalaryGrid,
    functionModalAgent,
    setFunctionModalAgent,
    statsCardScale,
    setStatsCardScale,
    isZenMode,
    setIsZenMode,
    paintModeActive,
    setPaintModeActive,
    paintStatus,
    setPaintStatus,
    cellContextMenu,
    setCellContextMenu,
    clipboardWeek,
    setClipboardWeek,
    pasteConfirmModal,
    setPasteConfirmModal,
    showEditSpecialServiceModal,
    setShowEditSpecialServiceModal,
    showEditAdminScheduleModal,
    setShowEditAdminScheduleModal,
    editAdminScheduleAgent,
    setEditAdminScheduleAgent,
    editAdminScheduleDays,
    setEditAdminScheduleDays,
    editSpecialServiceAgent,
    setEditSpecialServiceAgent,
    editSpecialServiceBase,
    setEditSpecialServiceBase,
    editSpecialServiceDays,
    setEditSpecialServiceDays,
    editSpecialServiceIsEntrant,
    setEditSpecialServiceIsEntrant,
    editSpecialServiceEntrantDate,
    setEditSpecialServiceEntrantDate,
    editSpecialServiceIsDebut,
    setEditSpecialServiceIsDebut,
    editSpecialServiceDebutDate,
    setEditSpecialServiceDebutDate,
    kpiAnchorRef,
    kpiDragStart,
    settingsMenuRef,
    isPaintingRef,
    paintedCellsRef,
    runVerification,
    toggleZoneLock,
    toggleAllZonesLock,

    getSafePeriod
  };

}
