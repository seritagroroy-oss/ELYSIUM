
import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { 
  Plus, CalendarDays, RefreshCw, Archive, UserPlus, 
  Trash, Trash2, Edit, Check, X, AlertTriangle, ArrowLeftRight, Clock, HelpCircle, Save, Loader2, ChevronLeft, ChevronRight, Star, TrendingUp, Shield, Users, ChevronDown
} from 'lucide-react';
import StatsPanel from './StatsPanel';
import QRPointage from './QRPointage';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Archives from './Archives';

export default function Dashboard({ isVerificationMode = false, archiveData = null, onBack = null }) {
  const isArchiveMode = !!archiveData;
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  
  const [sites, setSites] = useState([]);
  const [siteOrder, setSiteOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_site_order')) || []; } catch(e) { return []; }
  });
  const [draggedSite, setDraggedSite] = useState(null);
  const [activeSiteId, setActiveSiteId] = useState(() => localStorage.getItem('pontage_activeSiteId') || null);
  const [activeSiteName, setActiveSiteName] = useState(() => localStorage.getItem('pontage_activeSiteName') || '');
  const getSafePeriod = (p) => (typeof p === 'string' && /^\d{4}-\d{2}$/.test(p) ? p : new Date().toISOString().slice(0, 7));
  const [period, setPeriod] = useState(() => {
    if (archiveData && archiveData.period) return archiveData.period;
    const p = localStorage.getItem('pontage_period');
    const safeP = getSafePeriod(p);
    if (!archiveData && p !== safeP) localStorage.setItem('pontage_period', safeP);
    return safeP;
  }); // YYYY-MM
  const [cycleStart, setCycleStart] = useState(21);
  const [siteData, setSiteData] = useState([]); // Subsites and agents
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingCells, setSavingCells] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statsCardScale, setStatsCardScale] = useState(() => parseFloat(localStorage.getItem('pontage_stats_card_size') || '1'));

  useEffect(() => {
    const handler = () => setStatsCardScale(parseFloat(localStorage.getItem('pontage_stats_card_size') || '1'));
    window.addEventListener('pontage_stats_size_changed', handler);
    return () => window.removeEventListener('pontage_stats_size_changed', handler);
  }, []);


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

  const [showDeployExtra, setShowDeployExtra] = useState(false);
  const [extraAgents, setExtraAgents] = useState([]);
  const [deployExtraAgentId, setDeployExtraAgentId] = useState('');
  const [deployExtraDate, setDeployExtraDate] = useState('');
  const [searchExtraText, setSearchExtraText] = useState('');
  const [showExtraDropdown, setShowExtraDropdown] = useState(false);

  const [showDeployReleve, setShowDeployReleve] = useState(false);
  const [releveAgents, setReleveAgents] = useState([]);
  const [deployReleveAgentId, setDeployReleveAgentId] = useState('');
  const [deployReleveDate, setDeployReleveDate] = useState('');
  const [searchReleveText, setSearchReleveText] = useState('');
  const [showReleveDropdown, setShowReleveDropdown] = useState(false);

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

  const openDeployExtraModal = async () => {
    try {
      const res = await apiCall('get_site_data', { site_id: 'site_extras', period }, 'GET');
      if (res && res.length > 0 && res[0].agents) {
        setExtraAgents(res[0].agents);
      } else {
        setExtraAgents([]);
      }
      setDeployExtraDate(`${period}-01`);
      setDeployExtraAgentId('');
      setSearchExtraText('');
      setShowExtraDropdown(false);
      setShowDeployExtra(true);
    } catch (e) {
      console.error("Failed to load extras", e);
    }
  };

  const handleDeployExtra = async (e) => {
    e.preventDefault();
    if (!deployExtraAgentId) {
      alert("Veuillez sélectionner un agent dans la liste déroulante.");
      return;
    }
    if (!deployExtraDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    const agent = extraAgents.find(a => a.id === deployExtraAgentId);
    let shift = agent ? agent.shift_type : 'J';
    if (['24h', '48h', '72h'].includes(shift)) shift = 'J';

    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';
    
    const payload = {
      updates: [{ agent_id: deployExtraAgentId, date: deployExtraDate, shift_code: shift, status: 'EXT|' + siteTitle, period }]
    };
    console.log('[DeployExtra] Sending payload:', JSON.stringify(payload));
    
    try {
      const res = await apiCall('bulk_update_attendance', payload);
      console.log('[DeployExtra] API response:', res);
      if (res && res.success) {
        alert(`✅ Extra "${agent?.name || 'Agent'}" déployé avec succès sur ${siteTitle} pour le ${deployExtraDate}`);
        setShowDeployExtra(false);
        loadSiteData();
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue du serveur'));
      }
    } catch (err) {
      console.error('[DeployExtra] Error:', err);
      alert('❌ Erreur réseau: ' + err.message);
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
      setDeployReleveDate(`${period}-01`);
      setDeployReleveAgentId('');
      setSearchReleveText('');
      setShowReleveDropdown(false);
      setShowDeployReleve(true);
    } catch (e) {
      console.error("Failed to load releves", e);
    }
  };

  const handleDeployReleve = async (e) => {
    e.preventDefault();
    if (!deployReleveAgentId) {
      alert("Veuillez sélectionner un agent dans la liste déroulante.");
      return;
    }
    if (!deployReleveDate) {
      alert("Veuillez choisir une date.");
      return;
    }
    const agent = releveAgents.find(a => a.id === deployReleveAgentId);
    let shift = agent ? agent.shift_type : 'J';
    if (['24h', '48h', '72h'].includes(shift)) shift = 'J';

    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';
    
    try {
      const res = await apiCall('bulk_update_attendance', {
        updates: [{ agent_id: deployReleveAgentId, date: deployReleveDate, shift_code: shift, status: 'REL|' + siteTitle, period }]
      });
      if (res && res.success) {
        alert(`✅ Relève "${agent?.name || 'Agent'}" déployée avec succès sur ${siteTitle} pour le ${deployReleveDate}`);
        setShowDeployReleve(false);
        loadSiteData();
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue du serveur'));
      }
    } catch (err) {
      console.error('[DeployReleve] Error:', err);
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const [showMutate, setShowMutate] = useState(false);

  // Modal: Mise À Pied (MAP)
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapAgentId, setMapAgentId] = useState('');
  const [mapAgentName, setMapAgentName] = useState('');
  const [mapStartDate, setMapStartDate] = useState('');
  const [mapEndDate, setMapEndDate] = useState('');
  const [mapNavOffset, setMapNavOffset] = useState(0);
  const [mapManualDuration, setMapManualDuration] = useState('');

  const handleMapSubmit = async () => {
    if (!mapStartDate || !mapEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      return;
    }
    if (mapStartDate > mapEndDate) {
      alert('La date de début doit être avant la date de fin.');
      return;
    }
    // Construire la liste de toutes les dates dans la plage
    const updates = [];
    let cursor = new Date(mapStartDate);
    const end = new Date(mapEndDate);
    while (cursor <= end) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const dk = `${yyyy}-${mm}-${dd}`;
      
      let pMonth = cursor.getMonth() + 1;
      let pYear = yyyy;
      if (cursor.getDate() >= 21) {
        pMonth += 1;
        if (pMonth > 12) {
          pMonth = 1;
          pYear += 1;
        }
      }
      const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;
      
      updates.push({ agent_id: mapAgentId, date: dk, shift_code: 'J', status: 'MAP', period: properPeriod });
      cursor.setDate(cursor.getDate() + 1);
    }
    try {
      const res = await apiCall('bulk_update_attendance', { updates });
      if (res && res.success) {
        setShowMapModal(false);
        loadSiteData();
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch(err) {
      alert('❌ Erreur réseau: ' + err.message);
    }
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [reposMenu, setReposMenu] = useState(null);
  const [reposSegmentSelection, setReposSegmentSelection] = useState(null);
  const [shiftModalAgent, setShiftModalAgent] = useState(null);
  const [shiftModalType, setShiftModalType] = useState('Jour');
  const [iconPickerSiteId, setIconPickerSiteId] = useState(null);
  const [reposConfirmData, setReposConfirmData] = useState(null);
  const [showVerificationSites, setShowVerificationSites] = useState(false);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [showNextMonthModal, setShowNextMonthModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [hasAutoSnapped, setHasAutoSnapped] = useState(false);
  
  const [showStats, setShowStats] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Form states
  const [newSiteName, setNewSiteName] = useState('');
  const [isSpecialSite, setIsSpecialSite] = useState(false);
  const [specialSiteType, setSpecialSiteType] = useState('extras');
  const [customBehavior, setCustomBehavior] = useState('auto_individual');
  const [newSubsiteName, setNewSubsiteName] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSubsiteId, setNewAgentSubsiteId] = useState('');
  const [newAgentFunction, setNewAgentFunction] = useState('');
  const [newAgentShiftType, setNewAgentShiftType] = useState('Jour');
  const [mutateAgentId, setMutateAgentId] = useState('');
  const [mutateAgentName, setMutateAgentName] = useState('');
  const [mutateStart, setMutateStart] = useState('');
  const [mutateNewShiftType, setMutateNewShiftType] = useState('CONSERVER');
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
          const mappedFuncs = funcRes.functions.map(f => ({ ...f, name: `${f.id} - ${f.name}` }));
          setFunctions(mappedFuncs);
        }
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
    } else {
      localStorage.removeItem('pontage_activeSiteId');
      localStorage.removeItem('pontage_activeSiteName');
    }
  }, [period, activeSiteId, activeSiteName]);

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
      const res = await apiCall('get_dashboard_init', params, 'GET');
      if (res && res.success) {
        if (Array.isArray(res.sites)) {
          setSites(res.sites);
        }
        if (res.published_periods) {
          setPublishedPeriods(res.published_periods);
          
          // Auto-snap en mode vérification pour toujours afficher le pointage actif
          if (isVerificationMode && !hasAutoSnapped && res.published_periods.length > 0) {
            const latest = res.published_periods[0];
            if (period !== latest) {
              setPeriod(latest);
              setHasAutoSnapped(true);
            }
          }
        }
        if (activeSiteId) {
          if (Array.isArray(res.site_data)) {
            setSiteData(res.site_data);
          } else {
            setSiteData([]);
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
    try {
      const res = await apiCall('publish_period', { period });
      if (res.success) {
        setPublishedPeriods([period]);
        const archRes = await apiCall('archive_all_sites', { period, siteOrder });
        console.log('Archive result:', archRes);
        setShowPublishModal(false);
        // Recharger pour confirmer
        await loadPublishedPeriods();
      }
    } catch(e) {
      console.error("Erreur publish_period", e);
    } finally {
      setPublishing(false);
    }
  };

  const handleNextMonth = async () => {
    setInitializing(true);
    let [year, month] = getSafePeriod(period).split('-').map(Number);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    const nextPeriodStr = `${year}-${String(month).padStart(2, '0')}`;
    try {
      const res = await apiCall('init_next_period', { current_period: period, next_period: nextPeriodStr });
      if (res.success) {
        setShowNextMonthModal(false);
        changePeriod(1);
      } else {
        alert("Erreur lors de l'initialisation du mois suivant.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setInitializing(false);
    }
  };

  const loadSites = async () => {
    try {
      const res = await apiCall('get_sites', {}, 'GET');
      if (Array.isArray(res)) {
        setSites(res);
      }
    } catch (e) {
      console.error(e);
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
    setSearchMutationText('');
    setMutateDestSubsiteId('');
    setSearchTerm('');
    setErrorMsg('');
  };

  const selectSite = (id, name) => {
    resetSiteContextState();
    setSiteData([]);
    setActiveSiteId(id);
    setActiveSiteName(name);
  };

  const backToSites = () => {
    resetSiteContextState();
    setActiveSiteId(null);
    setActiveSiteName('');
    setSiteData([]);
    loadSites();
  };

  const changePeriod = (dir) => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    const d = new Date(year, month - 1 + dir, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const getPeriodLabel = () => {
    const [year, month] = getSafePeriod(period).split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isPastMonth = period < currentMonthStr && publishedPeriods.includes(period);

  const SITE_EMOJIS = ['🏢','🏗','🏭','🏬','🏪','🏦','🏥','🏨','🏫','🏛','🗼','🗽','⛪','🕌','🕍','🛕','🏠','🏡','🏚','🏰','🏯','⚓','🚒','🚑','🚔','🧱','🔒','🛡','⚙️','🔧','🔑','📡','💡','🌍','🌿','⭐','🔥','💎','🎯','📊'];

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
  const loadSiteData = async () => {
    if (!activeSiteId) return;
    if (isArchiveMode) {
      setSiteData(archiveData.sites?.find(s => String(s.id) === String(activeSiteId))?.subsites || []);
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('get_site_data', { site_id: activeSiteId, period }, 'GET');
      if (Array.isArray(res)) {
        setSiteData(res);
      }
    } catch (e) {
      console.error("Erreur get_site_data:", e);
    } finally {
      setLoading(false);
    }
  };

  // loadSiteData is now handled by loadDashboardData upon activeSiteId/period changes

  const openAddAgentModal = () => {
    const availableSubsites = siteData.filter(sub => !String(sub.id).startsWith('mutated_'));
    setNewAgentSubsiteId(availableSubsites[0]?.id || '');
    setNewAgentName('');
    setErrorMsg('');
    setShowAddAgent(true);
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

  // Traitement de l'édition d'une cellule de pointage
  const handleCellClick = async (agentId, dateKey, shiftCode, currentStatus, forcedStatus = null) => {
    if (isArchiveMode) return;
    if (isVerificationMode) return;
    if (savingCells[`${agentId}-${dateKey}-${shiftCode}`]) return;
    
    
    let isExtra = false;
    let isReleve = false;
    for (let sub of siteData) {
      let ag = sub.agents?.find(a => String(a.id) === String(agentId));
      if (ag && ag.is_extra) { isExtra = true; break; }
      if (ag && ag.is_releve) { isReleve = true; break; }
    }
    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : '';

    let newStatus = '';
    if (forcedStatus !== null) {
      if (isExtra && forcedStatus === '1') newStatus = 'EXT|' + siteTitle;
      else if (isExtra && forcedStatus === 'A') newStatus = 'EXT_A|' + siteTitle;
      else if (isExtra && forcedStatus === 'R') newStatus = 'EXT_R|' + siteTitle;
      else if (isReleve && forcedStatus === '1') newStatus = 'REL|' + siteTitle;
      else if (isReleve && forcedStatus === 'A') newStatus = 'REL_A|' + siteTitle;
      else if (isReleve && forcedStatus === 'R') newStatus = 'REL_R|' + siteTitle;
      else newStatus = forcedStatus;
    } else if (shiftCode === 'S' || shiftCode === 'SJ' || shiftCode === 'SN') {
      if (currentStatus === '') newStatus = isExtra ? 'EXT|' + siteTitle : (isReleve ? 'REL|' + siteTitle : '1');
      else newStatus = '';
    } else {
      if (isExtra) {
        if (currentStatus === '' || currentStatus.startsWith('EXT_R|')) newStatus = 'EXT|' + siteTitle;
        else if (currentStatus.startsWith('EXT|')) newStatus = 'EXT_A|' + siteTitle;
        else if (currentStatus.startsWith('EXT_A|')) newStatus = 'EXT_R|' + siteTitle;
        else newStatus = 'EXT|' + siteTitle;
      } else if (isReleve) {
        if (currentStatus === '' || currentStatus.startsWith('REL_R|')) newStatus = 'REL|' + siteTitle;
        else if (currentStatus.startsWith('REL|')) newStatus = 'REL_A|' + siteTitle;
        else if (currentStatus.startsWith('REL_A|')) newStatus = 'REL_R|' + siteTitle;
        else newStatus = 'REL|' + siteTitle;
      } else {
        if (currentStatus === '' || currentStatus === 'R') newStatus = '1';
        else if (currentStatus === '1') newStatus = 'A';
        else if (['A', 'M', 'CP', 'AT'].includes(currentStatus)) newStatus = 'R';
        else newStatus = '1';
      }
    }

    if (currentStatus !== '' && (currentStatus.startsWith('M|') || currentStatus.startsWith('PM|'))) return; // Mutation protégée

    const cellKey = `${agentId}-${dateKey}-${shiftCode}`;
    setSavingCells(prev => ({ ...prev, [cellKey]: true }));

    // Mise à jour optimiste locale
    setSiteData(prevData => {
      return prevData.map(subsite => {
        return {
          ...subsite,
          agents: subsite.agents.map(agent => {
            if (agent.id !== agentId) return agent;
            
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
        // En cas d'échec, recharger les données réelles
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

    try {
      const endpoint = isSpecialSite ? 'add_special_site' : 'add_site';
      const payload = isSpecialSite ? { name: newSiteName, type: specialSiteType } : { name: newSiteName };
      const res = await apiCall(endpoint, payload);
      if (res.success) {
        if (isSpecialSite && specialSiteType === 'definir' && res.site_id) {
          localStorage.setItem('pontage_display_mode_' + res.site_id, customBehavior);
        }
        setNewSiteName('');
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
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newAgentName.trim() || !newAgentSubsiteId) return;

    try {
      const res = await apiCall('add_agent', {
        site_id: activeSiteId,
        subsite_id: newAgentSubsiteId,
        name: newAgentName,
        function: newAgentFunction || '',
        shift_type: newAgentShiftType,
        period
      });
      if (res.success) {
        setNewAgentName('');
        setNewAgentFunction('');
        setNewAgentShiftType('Jour');
        setShowAddAgent(false);
        loadSiteData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleDeleteAgent = (agentId) => {
    setDeleteAgentConfirm(agentId);
  };

  const confirmDeleteAgent = async () => {
    if (!deleteAgentConfirm) return;
    try {
      const res = await apiCall('delete_agent', { agent_id: deleteAgentConfirm });
      if (res.success) {
        setDeleteAgentConfirm(null);
        loadSiteData();
      } else {
        alert(res.message || "Erreur lors de la suppression");
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
        loadSiteData();
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
    try {
      const res = await apiCall('update_agent_info', {
        agent_id: agentId,
        site_id: activeSiteId,
        field,
        value,
        period
      });
      if (res.success) {
        loadSiteData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignRepos = async (agentId, dayOfWeekIndex) => {
    const agent = siteData.flatMap(s => s.agents).find(a => a && a.id === agentId);
    if (!agent) return;

    const history = agent.shift_history || [{ from: '1970-01-01', type: agent.shift_type || 'Jour' }];
    const segments = [];
    const periodStart = formatDateKey(datesList[0]);
    const periodEnd = formatDateKey(datesList[datesList.length - 1]);
    
    for (let i = 0; i < history.length; i++) {
        const from = history[i].from;
        const type = history[i].type;
        const to = i + 1 < history.length ? history[i+1].from : '9999-12-31';
        
        if (to <= periodStart || from > periodEnd) continue;
        
        segments.push({ from, to, type });
    }

    if (segments.length > 1) {
        setReposSegmentSelection({ agent, dayOfWeekIndex, segments });
        setReposMenu(null);
        return;
    }

    executeSegmentRepos(agent, dayOfWeekIndex, segments[0] || { from: '1970-01-01', to: '9999-12-31', type: agent.shift_type || 'Jour' });
  };

  const executeSegmentRepos = (agent, dayOfWeekIndex, segment) => {
    let hasExisting = false;
    const updates = [];

    const scList = segment.type === 'Nuit' ? ['N'] : ['J'];
    if (['24h', '48h', '72h'].includes(segment.type)) {
       scList.push('N');
    }

    datesList.forEach(d => {
      const dk = formatDateKey(d);
      
      // Restreindre à la période du segment
      if (dk < segment.from || dk >= segment.to) return;

      const isNewRestDay = d.getDay() === dayOfWeekIndex;

      scList.forEach(sc => {
          const existingStatus = agent.attendance?.find(a => a.date === dk && a.shift_code === sc)?.status;
          
          if (isNewRestDay) {
              if (existingStatus && existingStatus !== '' && existingStatus !== 'R') {
                  hasExisting = true;
              }
              updates.push({ agent_id: agent.id, date: dk, shift_code: sc, status: 'R', period });
          } else {
              if (existingStatus === 'R') {
                  updates.push({ agent_id: agent.id, date: dk, shift_code: sc, status: '1', period });
              }
          }
      });
    });

    if (updates.length === 0) {
        setReposSegmentSelection(null);
        return;
    }

    const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeekIndex];

    let message = "";
    if (hasExisting) {
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
        alert(res.message);
        setLoading(false);
      }
    } catch(e) {
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
        loadSiteData();
      } else {
        alert(res.message);
      }
    } catch(e) {
      alert("Erreur réseau");
    }
  };

  const handleRenameSubsite = async (subsiteId, currentName) => {
    const newName = window.prompt("Nouveau nom pour la zone :", currentName);
    if (!newName || newName.trim() === '' || newName === currentName) return;
    try {
      const res = await apiCall('rename_subsite', { subsite_id: subsiteId, name: newName.trim() });
      if (res.success) {
        loadSiteData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ELYSIUM';
    workbook.created = new Date();

    const siteTitle = sites.find(s => s.id === activeSiteId)?.name || 'Site';
    const sheet = workbook.addWorksheet(siteTitle.slice(0, 31));

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const THICK = { style: 'medium', color: { argb: 'FF000000' } };
    const THIN  = { style: 'thin',   color: { argb: 'FF000000' } };
    const allBorderThick = { top: THICK, left: THICK, bottom: THICK, right: THICK };
    const allBorderThin  = { top: THIN,  left: THIN,  bottom: THIN,  right: THIN  };

    const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
    const centerBold = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const centerNormal = { horizontal: 'center', vertical: 'middle' };

    // ─── Layout constants ──────────────────────────────────────────────────────
    const COL_VAC   = 1;
    const COL_NAME  = 2;
    const COL_FUNC  = 3;
    const COL_DAYS_START = 4;
    const numDays = datesList.length;
    const COL_TOTAL = COL_DAYS_START + numDays;   // S/T column

    sheet.getColumn(COL_VAC).width  = 6;
    sheet.getColumn(COL_NAME).width = 28;
    sheet.getColumn(COL_FUNC).width = 8;
    datesList.forEach((_, i) => { sheet.getColumn(COL_DAYS_START + i).width = 5; });
    sheet.getColumn(COL_TOTAL).width = 5;

    // ─── Group agents by subsite then by vacation type ─────────────────────────
    const vacGroupOrder = ['Jour', 'Nuit', '24h', '48h', '72h'];
    const vacLabel = { 'Jour': 'JOUR', 'Nuit': 'NUIT', '24h': 'H24', '48h': 'H48', '72h': 'H72' };

    const subsections = siteData
      .filter(sub => sub && sub.agents && sub.agents.length > 0)
      .map(sub => {
        const groups = {};
        sub.agents.forEach(agent => {
          const vt = agent.shift_type || 'Jour';
          if (!groups[vt]) groups[vt] = [];
          groups[vt].push(agent);
        });
        return { subName: sub.name, groups };
      });

    // ─── Banner ────────────────────────────────────────────────────────────────
    const bannerRow = sheet.getRow(1);
    bannerRow.height = 25;
    sheet.mergeCells(1, 1, 1, COL_TOTAL);
    const bannerCell = bannerRow.getCell(1);
    bannerCell.value = `POINTAGE - ${siteTitle.toUpperCase()} - Période ${period}`;
    bannerCell.fill  = fill('FF1F2937');
    bannerCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    bannerCell.alignment = centerBold;
    bannerCell.border = allBorderThick;

    let currentRow = 3;

    // ─── Helper: write a formatted group block onto the sheet ─────────────────
    const writeGroupBlock = (startRow, agentList, shiftType, subName, isFirstGroupInSub) => {
      const isRotative = ['24h', '48h', '72h'].includes(shiftType);
      const label = vacLabel[shiftType] || shiftType.toUpperCase();

      if (isFirstGroupInSub) {
        const titleRow = sheet.getRow(startRow);
        titleRow.height = 20;
        sheet.mergeCells(startRow, COL_DAYS_START, startRow, COL_TOTAL);
        const titleCell = titleRow.getCell(COL_DAYS_START);
        titleCell.value = subName.toUpperCase();
        titleCell.fill  = fill('FF00B0F0');
        titleCell.font  = { bold: true, size: 12, color: { argb: 'FF000000' } };
        titleCell.alignment = centerBold;
        titleCell.border = allBorderThick;
        
        ['A','B','C'].forEach((_, ci) => {
          const c = titleRow.getCell(ci + 1);
          c.fill = fill('FF00B0F0');
          c.border = allBorderThick;
        });
        startRow++;
      }

      const h1 = sheet.getRow(startRow);
      h1.height = 18;

      const h1Name = h1.getCell(COL_NAME);
      h1Name.value = 'NOMS & PRENOMS';
      h1Name.fill  = fill('FFFFFF00');
      h1Name.font  = { bold: true, size: 9 };
      h1Name.alignment = centerBold;
      h1Name.border = allBorderThick;

      const h1Func = h1.getCell(COL_FUNC);
      h1Func.value = 'FONCTION';
      h1Func.fill  = fill('FFFFFF00');
      h1Func.font  = { bold: true, size: 9 };
      h1Func.alignment = centerBold;
      h1Func.border = allBorderThick;

      datesList.forEach((d, i) => {
        const cell = h1.getCell(COL_DAYS_START + i);
        cell.value = DAY_LETTERS[d.getDay()];
        cell.fill  = fill('FFFFFF00');
        cell.font  = { bold: true, size: 9 };
        cell.alignment = centerBold;
        cell.border = allBorderThin;
      });

      const h1Total = h1.getCell(COL_TOTAL);
      h1Total.value = 'S/T';
      h1Total.fill  = fill('FF92D050');
      h1Total.font  = { bold: true, color: { argb: 'FF000000' } };
      h1Total.alignment = centerBold;
      h1Total.border = allBorderThick;

      h1.getCell(COL_VAC).fill = fill('FFFFFF00');
      h1.getCell(COL_VAC).border = allBorderThick;

      const h2 = sheet.getRow(startRow + 1);
      h2.height = 15;

      datesList.forEach((d, i) => {
        const cell = h2.getCell(COL_DAYS_START + i);
        cell.value = d.getDate();
        cell.fill  = fill('FFFFFF00');
        cell.font  = { bold: true, size: 9 };
        cell.alignment = centerBold;
        cell.border = allBorderThin;
      });
      h2.getCell(COL_NAME).fill = fill('FFFFFF00');
      h2.getCell(COL_NAME).border = allBorderThick;
      h2.getCell(COL_FUNC).fill = fill('FFFFFF00');
      h2.getCell(COL_FUNC).border = allBorderThick;
      h2.getCell(COL_VAC).fill = fill('FFFFFF00');
      h2.getCell(COL_VAC).border = allBorderThick;
      h2.getCell(COL_TOTAL).fill = fill('FF92D050');
      h2.getCell(COL_TOTAL).border = allBorderThick;

      sheet.mergeCells(startRow, COL_NAME, startRow + 1, COL_NAME);
      sheet.mergeCells(startRow, COL_FUNC, startRow + 1, COL_FUNC);
      sheet.mergeCells(startRow, COL_TOTAL, startRow + 1, COL_TOTAL);

      let dataRowStart = startRow + 2; 
      const vacLabelStartRow = dataRowStart;
      let agentRowCount = 0;

      agentList.forEach(agent => {
        const attMap = {};
        (agent.attendance || []).forEach(att => {
          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
          attMap[att.shift_code][att.date] = att.status;
        });

        const shiftCodes = isRotative ? ['J', 'N'] : [shiftType === 'Nuit' ? 'N' : 'J'];
        const hasSP = agent.has_sp || (agent.attendance && agent.attendance.some(a =>
          ['S','SJ','SN'].includes(a.shift_code) && a.status && a.status.trim() !== ''));
        if (hasSP) {
          isRotative ? shiftCodes.push('SJ','SN') : shiftCodes.push('S');
        }

        let funcName = agent.function || '';
        const fl = funcName.toLowerCase();
        if (fl.includes('simple') || fl === 'as') funcName = 'AS';
        else if (fl.includes('chien') || fl === 'mc') funcName = 'M-C';
        else if (fl.includes('chef') || fl === 'cp') funcName = 'CP';
        else if (fl.includes('costume')) funcName = 'A-C';
        else if (fl.includes('armé') || fl === 'ga') funcName = 'GA';

        shiftCodes.forEach((sc, scIdx) => {
          const r = sheet.getRow(dataRowStart);
          r.height = 16;

          if (scIdx === 0) {
            const nameCell = r.getCell(COL_NAME);
            nameCell.value = agent.name;
            nameCell.font  = { bold: true, size: 9 };
            nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
            nameCell.border = allBorderThin;

            const funcCell = r.getCell(COL_FUNC);
            funcCell.value = funcName;
            funcCell.font  = { bold: true, size: 8 };
            funcCell.fill  = fill('FFD9D9D9');
            funcCell.alignment = centerBold;
            funcCell.border = allBorderThin;
          } else {
            r.getCell(COL_NAME).border = allBorderThin;
            r.getCell(COL_FUNC).border = allBorderThin;
          }

          let presenceCount = 0;
          datesList.forEach((d, i) => {
            const dk  = formatDateKey(d);
            const val = attMap[sc]?.[dk] || '';
            const cell = r.getCell(COL_DAYS_START + i);
            cell.alignment = centerNormal;
            cell.border = allBorderThin;

            const isWeekend = (d.getDay() === 0 || d.getDay() === 6);

            if (val === '1' || val === 1) {
              cell.value = 1;
              cell.fill  = fill('FF00B050');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 9 };
              presenceCount++;
            } else if (val === '0.5' || val === 0.5) {
              cell.value = 0.5;
              cell.fill  = fill('FF92D050'); 
              cell.font  = { bold: true, size: 9 };
              presenceCount += 0.5;
            } else if (val === 'R') {
              cell.value = 'R';
              cell.fill  = fill('FF0070C0');
              cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            } else if (['A','AN','ABO','AM','AP'].includes(val)) {
              cell.value = val;
              cell.fill  = fill('FFFF0000'); 
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 9 };
            } else if (typeof val === 'string' && val.startsWith('M|')) {
              const dest = val.split('|')[1] || '';
              cell.value = dest ? `M→${dest}` : 'M';
              cell.fill  = fill('FFFF0000');
              cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
            } else if (typeof val === 'string' && val.startsWith('PM|')) {
              const dest = val.split('|')[1] || '';
              cell.value = dest ? `PM→${dest}` : 'PM';
              cell.fill  = fill('FFFFC000');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 8 };
            } else if (typeof val === 'string' && val.startsWith('M_TEMP|')) {
              cell.value = 'RMPL';
              cell.fill  = fill('FFFF66FF');
              cell.font  = { bold: true, color: { argb: 'FF000000' }, size: 8 };
            } else {
              cell.value = '';
              if (isWeekend) cell.fill = fill('FFF2F2F2');
              else if (sc === 'N' || sc === 'SN') cell.fill = fill('FFE7E6E6');
            }
          });

          const totalCell = r.getCell(COL_TOTAL);
          totalCell.value = presenceCount > 0 ? presenceCount : '';
          totalCell.fill  = fill('FFE2EFDA');
          totalCell.font  = { bold: true, size: 9 };
          totalCell.alignment = centerNormal;
          totalCell.border = allBorderThin;

          dataRowStart++;
          agentRowCount++;
        });

        const blankRow = sheet.getRow(dataRowStart);
        blankRow.height = 12;
        blankRow.getCell(COL_NAME).border = allBorderThin;
        blankRow.getCell(COL_FUNC).border = allBorderThin;
        datesList.forEach((_, i) => { blankRow.getCell(COL_DAYS_START + i).border = allBorderThin; });
        blankRow.getCell(COL_TOTAL).border = allBorderThin;
        dataRowStart++;
        agentRowCount++;
      });

      if (agentRowCount > 1) {
        sheet.mergeCells(vacLabelStartRow, COL_VAC, dataRowStart - 1, COL_VAC);
      }
      const vacLabelCell = sheet.getCell(vacLabelStartRow, COL_VAC);
      vacLabelCell.value = label;
      vacLabelCell.font  = { bold: true, size: 12, color: { argb: 'FF000000' } };
      vacLabelCell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
      vacLabelCell.fill  = fill('FFD9D9D9');
      vacLabelCell.border = allBorderThick;

      dataRowStart++;
      return dataRowStart;
    };

    subsections.forEach(({ subName, groups }) => {
      let isFirstGroup = true;
      vacGroupOrder.forEach(vt => {
        if (!groups[vt] || groups[vt].length === 0) return;
        currentRow = writeGroupBlock(currentRow, groups[vt], vt, subName, isFirstGroup);
        isFirstGroup = false;
      });
      currentRow += 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Pointage_${siteTitle}_${period}.xlsx`);
  };

  const renderPatternOptions = () => {
    let cycleLen, workDays;
    if (shiftModalType === '24h') { cycleLen = 2; workDays = 1; }
    else if (shiftModalType === '48h') { cycleLen = 4; workDays = 2; }
    else if (shiftModalType === '72h') { cycleLen = 6; workDays = 3; }
    else { cycleLen = 1; workDays = 1; }

    const startDay = 21; // Par défaut
    const nextDay = 22;

    if (shiftModalType === 'Jour' || shiftModalType === 'Nuit') {
      return (
        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%', textAlign: 'left', marginBottom: '8px' }}
          onClick={async () => {
            await handleUpdateAgentField(shiftModalAgent.id, 'shift_type', shiftModalType);
            await handleApplyPattern(1, 1, 0, shiftModalType);
          }}>
          <span style={{ fontFamily: 'Segoe UI Emoji' }}>🟢🟢🟢🟢🟢🟢</span>
          <span style={{ fontSize: '0.85rem', marginLeft: '10px' }}>Tout remplir en Présence</span>
        </button>
      );
    }

    const allowed = [0, 1, workDays, workDays + 1].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);

    return allowed.map(offset => {
      let preview = "";
      for (let i = 0; i < 6; i++) {
          let pos = (i - offset) % cycleLen;
          if (pos < 0) pos += cycleLen;
          preview += (pos < workDays) ? "🟢" : "⚪";
      }
      let desc = "";
      if (offset === 0) desc = `Commencer Travail le ${startDay}`;
      else if (offset === 1) desc = `Commencer Travail le ${nextDay}`;
      else if (offset === workDays) desc = `Commencer Repos le ${startDay}`;
      else if (offset === workDays + 1) desc = `Commencer Repos le ${nextDay}`;

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
    });
  };

  const handleMutateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!mutateAgentId || !mutateStart || !mutateDestSubsiteId) {
      setErrorMsg("Veuillez sélectionner une zone de destination valide depuis la liste.");
      return;
    }

    try {
      const res = await apiCall('apply_mutation', {
        agent_id: mutateAgentId,
        start_date: mutateStart,
        destination_subsite_id: mutateDestSubsiteId,
        destination_name: searchMutationText,
        new_shift_type: mutateNewShiftType,
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
    setShowMutate(true);
  };

  // Utilitaires de calculs pour les stats
  const getDashboardStats = () => {
    let totalZones = siteData.length;
    let totalAgents = 0;
    let totalSup = 0;
    
    siteData.forEach(sub => {
      // Ne pas compter le dossier des mutés temporaires
      if (!sub || !sub.id || String(sub.id).startsWith('mutated_')) return;
      totalAgents += (sub.agents || []).length;
      
      (sub.agents || []).forEach(agent => {
        if (!agent) return;
        (agent.attendance || []).forEach(att => {
          if ((att.shift_code === 'S' || att.shift_code === 'SJ' || att.shift_code === 'SN') && 
              (att.status === '1' || Number(att.status) > 0)) {
            totalSup++;
          }
        });
      });
    });

    return { totalZones, totalAgents, totalSup };
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

  // ─── Page de sélection de site ("Mes Sites") ───────────────────────
  if (!activeSiteId) {
    return (
      <div>
        {!isArchiveMode && (
          <div style={{ 
            display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', 
            marginBottom: '24px', gap: '16px',
            background: isPastMonth ? 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)' : 'transparent',
            padding: isPastMonth ? '16px 20px' : '0',
            borderRadius: isPastMonth ? '12px' : '0',
            border: isPastMonth ? '1px solid rgba(245,158,11,0.3)' : 'none'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{isVerificationMode ? '✅ Traitement du pointage' : '📍 Mes Sites'}</h2>
                {isPastMonth && (
                  <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Historique
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--muted)', marginTop: '4px', fontSize: '0.9rem' }}>Sélectionnez un site pour accéder au tableau de pointage.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {!isVerificationMode && !isArchiveMode && (
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
                  <button
                    className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`}
                    onClick={() => setViewMode('current')}
                    style={{ 
                      padding: '6px 16px', 
                      background: viewMode === 'current' ? 'var(--a)' : 'transparent',
                      color: viewMode === 'current' ? 'white' : 'var(--muted)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: viewMode === 'current' ? '700' : '500',
                    }}
                  >
                    Actuel
                  </button>
                  <button
                    className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`}
                    onClick={() => setViewMode('archives')}
                    style={{ 
                      padding: '6px 16px', 
                      background: viewMode === 'archives' ? 'var(--a)' : 'transparent',
                      color: viewMode === 'archives' ? 'white' : 'var(--muted)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: viewMode === 'archives' ? '700' : '500',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Archive size={14} /> Archives
                  </button>
                </div>
              )}

              {viewMode === 'current' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: isPastMonth ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: isPastMonth ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => changePeriod(-1)}
                  style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  title="Mois précédent"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ padding: '8px 14px', fontWeight: 700, fontSize: '0.92rem', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {getPeriodLabel()}
                </span>
                <button
                  onClick={() => changePeriod(1)}
                  style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  title="Mois suivant"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              )}

              {!isVerificationMode && viewMode === 'current' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className={`btn ${publishedPeriods.includes(period) ? 'btn-secondary' : ''}`} 
                    onClick={() => setShowPublishModal(true)}
                    disabled={publishedPeriods.includes(period)}
                    style={publishedPeriods.includes(period) ? {} : {
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
                      title="[MODE TEST] Réinitialiser la publication et les archives pour retester"
                      onClick={async () => {
                        if (!window.confirm('⚠️ MODE TEST — Réinitialiser la publication du pointage et effacer les archives ?\n\nCela permettra de republier à nouveau.')) return;
                        try {
                          const res = await apiCall('unpublish_period', { period });
                          if (res?.success) {
                            setPublishedPeriods([]);
                            localStorage.removeItem('pontage_payroll_statuses');
                          }
                        } catch(e) { console.error(e); }
                      }}
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        color: '#f87171',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                    >
                      🔁 Reset Test
                    </button>
                  )}
                  {!publishedPeriods.includes(period) ? (
                    <>
                      <button className="btn btn-primary" onClick={() => setShowStats(true)} style={{ background: '#6366f1' }}>
                        <TrendingUp size={16} /> Stats
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowQR(true)} style={{ background: '#10b981' }}>
                        <Shield size={16} /> QR Code
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowAddSite(true)}>
                        <Plus size={16} /> Nouveau Site
                      </button>
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
                        boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                        cursor: 'pointer',
                        opacity: 1
                      }}
                    >
                      <CalendarDays size={16} /> Mois Suivant ➔
                    </button>
                  )}
                </div>
              )}
            </div>
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
            {sites.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>🏢</div>
                <h3>Aucun site enregistré</h3>
                <p className="subtitle" style={{ marginTop: '8px' }}>Commencez par créer un site pour gérer vos agents.</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowAddSite(true)}>
                  <Plus size={16} /> Créer mon premier site
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                  {sites.filter(site => {
                     if (site.id === 'site_extras' && localStorage.getItem('pontage_active_extras') === 'false') return false;
                     if (site.id === 'site_releves' && localStorage.getItem('pontage_active_releves') === 'false') return false;
                     if (site.id === 'site_administration' && localStorage.getItem('pontage_active_admin') === 'false') return false;
                     return true;
                  }).sort((a, b) => {
                     if (isArchiveMode) return 0;
                     const idxA = siteOrder.indexOf(a.id);
                     const idxB = siteOrder.indexOf(b.id);
                     if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                     if (idxA !== -1) return -1;
                     if (idxB !== -1) return 1;
                     return 0;
                  }).map((site, idx) => {
                const glowColors = ['var(--b)', 'var(--a)', 'var(--c)', '#a78bfa', '#f472b6'];
                const glow = glowColors[idx % glowColors.length];
                const siteIcon = site.icon || '🏢';
                return (
                  <div
                    key={site.id}
                    className="site-card"
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>{site.name}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Gestion du Pointage</p>
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: glow, fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>Ouvrir le tableau</span>
                        <span style={{ fontSize: '1rem' }}>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
        )}
          </>
        )}

        {/* Modal Ajout Site */}
        {showAddSite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '420px' }}>
              <h3 style={{ marginBottom: '16px' }}>Nouveau Site</h3>
              {errorMsg && <div className="alert alert-danger" style={{marginBottom: '16px'}}>{errorMsg}</div>}
              <input className="form-input" style={{ width: '100%', marginBottom: '16px' }} placeholder="Nom du site..." value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
              
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
          const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          const [yr, mn] = getSafePeriod(period).split('-').map(Number);
          const monthName = monthNames[mn - 1];
          const startD = new Date(yr, mn - 2, 21);
          const endD = new Date(yr, mn - 1, 20);
          const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div onClick={() => !publishing && setShowPublishModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
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
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
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
            </div>
          );
        })()}

        {/* ============ MODAL MOIS SUIVANT ============ */}
        {showNextMonthModal && (() => {
          let [y, m] = getSafePeriod(period).split('-').map(Number);
          m += 1; if (m > 12) { m = 1; y += 1; }
          const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          const currentMonthName = monthNames[Number(getSafePeriod(period).split('-')[1]) - 1];
          const nextMonthName = monthNames[m - 1];
          const start = new Date(y, m - 2, 21);
          const end = new Date(y, m - 1, 20);
          const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div onClick={() => setShowNextMonthModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
              <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(145deg, #0f1a2e 0%, #111827 50%, #0a1628 100%)',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: '24px', padding: '28px 32px',
                maxWidth: '500px', width: '100%',
                maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 25px rgba(245,158,11,0.2)' }}>📅</div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Passage au mois suivant</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>
                    {currentMonthName} → <span style={{ color: '#f59e0b', fontWeight: 700 }}>{nextMonthName} {y}</span>
                  </p>
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
                    { icon: '✅', text: 'La structure de vos sites et agents est conservée' },
                    { icon: '✅', text: 'Les vacations et fonctions sont maintenues' },
                    { icon: '🗑️', text: 'Les absences sont remises à zéro' },
                    { icon: '🗑️', text: 'Les heures supplémentaires sont effacées' },
                    { icon: '🔄', text: 'Le calendrier est recalculé pour la nouvelle période' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowNextMonthModal(false)}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >Annuler</button>
                  <button onClick={handleNextMonth} disabled={initializing}
                    style={{ flex: 2, padding: '14px', borderRadius: '12px', background: initializing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: initializing ? 'rgba(255,255,255,0.5)' : '#fff', border: 'none', cursor: initializing ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: initializing ? 'none' : '0 4px 20px rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onMouseEnter={e => { if(!initializing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5)'; } }}
                    onMouseLeave={e => { if(!initializing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)'; } }}
                  >
                    {initializing ? (
                      <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <CalendarDays size={18} /> 
                    )}
                    {initializing ? 'Initialisation...' : `Confirmer — Passer à ${nextMonthName}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {showStats && <StatsPanel companyId={user?.company_id} onClose={() => setShowStats(false)} />}
      {showQR && <QRPointage onClose={() => setShowQR(false)} />}

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

      {/* MODALE SUPPRIMER SITE */}
      {showDeleteSiteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', border: '1px solid rgba(239,68,68,0.4)' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} /> Suppression de site
            </h3>
            <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.8)' }}>
              Êtes-vous sûr de vouloir supprimer définitivement le site <strong>{siteContextMenu.siteName}</strong> ?<br/><br/>
              Cette action supprimera également <strong>tous les agents et sous-sites</strong> rattachés à ce site. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowDeleteSiteModal(false)}>Annuler</button>
              <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleDeleteSite}>
                <Trash size={16} /> Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  }

  // ─── Vue tableau de pointage (site sélectionné) ─────────────────────
  return (
    <div onClick={() => { setContextMenu(null); setReposMenu(null); }}>
      {contextMenu && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 100vmax rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '240px', padding: '8px'
        }}>
          {(() => {
            const defaultOpts = [
              { code: 'CHGT_VAC', label: 'Changement de vacation', color: 'var(--c)', type: 'agent', active: true, readonlyCode: true },
              { code: 'MUT', label: 'Muter cet agent', color: 'white', type: 'agent', active: true, readonlyCode: true },
              { code: 'PROFILE', label: 'Consulter le profil complet', color: '#10b981', type: 'agent', active: true, readonlyCode: false },
              { code: 'WARN', label: 'Avertissement', color: '#f59e0b', type: 'agent', active: true, readonlyCode: false },
              { code: 'A', label: 'Absence Injustifiée', color: 'var(--danger)', type: 'cell', active: true, readonlyCode: true },
              { code: 'R', label: 'Repos (R)', color: 'white', type: 'cell', active: true, readonlyCode: true },
              { code: 'M', label: 'Maladie (M)', color: '#ef4444', type: 'cell', active: true, readonlyCode: true },
              { code: 'CP', label: 'Congé Payé (CP)', color: '#3b82f6', type: 'cell', active: true, readonlyCode: true },
              { code: 'AT', label: 'Accident Travail (AT)', color: '#8b5cf6', type: 'cell', active: true, readonlyCode: true },
              { code: 'MAP', label: 'Mise à pied (MAP) / Sanction', color: '#ef4444', type: 'cell', active: true, readonlyCode: false },
              { code: 'CSS', label: 'Congé Sans Solde (CSS)', color: '#64748b', type: 'cell', active: true, readonlyCode: false },
              { code: 'RET', label: 'Retard (RET)', color: '#eab308', type: 'cell', active: true, readonlyCode: false },
              { code: '', label: 'Effacer (Repos)', color: 'var(--muted)', type: 'cell', active: true, readonlyCode: true }
            ];
            let activeOpts = defaultOpts;
            try {
              const saved = localStorage.getItem('pontage_context_menu_opts');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const activeMap = {};
                  parsed.forEach(p => activeMap[p.code] = p);
                  activeOpts = defaultOpts.map(d => activeMap[d.code] ? { ...d, ...activeMap[d.code] } : d);
                }
              }
            } catch(e) {}
            
            return activeOpts
              .filter(opt => opt.active !== false)
              .filter(opt => contextMenu.dateKey ? true : opt.type === 'agent')
              .sort((a, b) => (a.label || '').localeCompare(b.label || '', 'fr'));
          })().map(opt => (
            <button key={opt.code} style={{
              padding: '10px 15px', background: 'transparent', border: 'none', color: 'white',
              textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }} onClick={(e) => {
              const agent = siteData.flatMap(s => s.agents).find(a => a && a.id === contextMenu.agentId);
              if (opt.code === 'MUT') {
                if (agent) openMutateModal(agent);
              } else if (opt.code === 'CHGT_VAC') {
                if (agent) {
                  setShowShiftChangeMenu(agent);
                  setShiftChangeDate(`${period}-01`);
                  setShiftChangeNewType(agent.shift_type || 'Jour');
                }
              } else if (opt.code === 'PROFILE') {
                alert(`Ouverture du profil complet pour ${agent?.name} (Bientôt disponible)`);
              } else if (opt.code === 'WARN') {
                alert(`Avertissement enregistré pour ${agent?.name}`);
              } else if (opt.code === 'MAP') {
                if (agent) {
                  setMapAgentId(agent.id);
                  setMapAgentName(agent.name);
                  setMapStartDate(contextMenu.dateKey || formatDateKey(datesList[0]));
                  setMapEndDate(contextMenu.dateKey || formatDateKey(datesList[0]));
                  setMapNavOffset(0);
                  setMapManualDuration('');
                  setShowMapModal(true);
                }
              } else {
                handleCellClick(contextMenu.agentId, contextMenu.dateKey, contextMenu.shiftCode, '', opt.code);
              }
              setContextMenu(null);
            }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} 
               onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: opt.color }}></span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
      
      {reposMenu && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 100vmax rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '240px', padding: '8px'
        }}>
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            Choisir le jour de repos
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                padding: '10px 15px', background: 'transparent', border: 'none', color: 'white',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
              }} onClick={() => {
                handleAssignRepos(reposMenu.agentId, opt.day);
              }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} 
                 onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Barre d'action supérieure */}
      <div className="top-bar glass-panel" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* GAUCHE : Retour */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => onBack ? onBack() : backToSites()} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <ChevronLeft size={16} /> Mes Sites
          </button>
        </div>

        {/* CENTRE : Recherche */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input search-input-premium"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', minWidth: '220px', maxWidth: '400px', background: 'rgba(0,0,0,0.3)', transition: 'all 0.3s' }}
          />
        </div>

        {/* DROITE : Actions */}
        <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          {activeSiteId && (
            <>
              {!isVerificationMode && !isArchiveMode && (
                <>
                  {(() => {
                    let canAddZone = true;
                    const activeSiteObj = sites.find(s => s.id === activeSiteId);
                    if (activeSiteObj?.is_special) {
                       const mode = localStorage.getItem('pontage_display_mode_' + activeSiteId) || 'auto_individual';
                       if (mode !== 'manual_zones') canAddZone = false;
                    } else {
                       const modeExtras = localStorage.getItem('pontage_display_mode_extras') || 'auto_individual';
                       const modeReleves = localStorage.getItem('pontage_display_mode_releves') || 'auto_individual';
                       const modeAdmin = localStorage.getItem('pontage_display_mode_admin') || 'auto_individual';
                       if (activeSiteId === 'site_extras' && modeExtras !== 'manual_zones') canAddZone = false;
                       if (activeSiteId === 'site_releves' && modeReleves !== 'manual_zones') canAddZone = false;
                       if (activeSiteId === 'site_administration' && modeAdmin !== 'manual_zones') canAddZone = false;
                    }
                    return canAddZone && (
                      <button className="btn btn-secondary" onClick={() => setShowAddSubsite(true)} title="Nouvelle zone">
                        <Plus size={14} /> Zone
                      </button>
                    );
                  })()}
                  <button className="btn btn-primary" onClick={openAddAgentModal} title="Nouvel agent">
                    <UserPlus size={14} /> Agent
                  </button>
                  <button className="btn" style={{ background: '#f59e0b', color: 'white', fontWeight: 'bold' }} onClick={openDeployExtraModal} title="Déployer un Extra sur ce site">
                    ➕ EXTRAS
                  </button>
                  <button className="btn" style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold', marginLeft: '5px' }} onClick={openDeployReleveModal} title="Déployer une Relève sur ce site">
                    ➕ RELÈVES
                  </button>
                </>
              )}
              {isVerificationMode && (
                <>
                  <button className="btn" style={{ background: '#38bdf8', color: 'white' }} onClick={() => window.print()} title="Imprimer le pointage">
                    🖨️ Imprimer
                  </button>
                  <button className="btn btn-success" onClick={() => alert("Pointage validé avec succès pour le traitement de la paie.")} title="Valider le pointage">
                    ✅ Valider
                  </button>
                </>
              )}
              <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={exportToExcel} title="Exporter au format Excel">
                Excel
              </button>
              <button className="btn" style={{ background: '#6366f1', color: 'white' }} onClick={() => {
                const siteTitle = sites.find(s => s.id === activeSiteId)?.name || 'Site';
                let csv = "\uFEFF";
                csv += "Vacation,Nom,Fonction," + datesList.map(d => `${d.getDate()}`).join(',') + ",Total\n";
                siteData.forEach(sub => {
                  if (!sub.agents || sub.agents.length === 0) return;
                  csv += `\n--- ${sub.name} ---\n`;
                  sub.agents.forEach(agent => {
                    const shifts = agent.shift_type === 'Nuit' ? ['N'] : agent.shift_type === '24h' || agent.shift_type === '48h' || agent.shift_type === '72h' ? ['S'] : ['J'];
                    shifts.forEach(sh => {
                      let total = 0;
                      const cells = datesList.map(d => {
                        const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const att = (agent.attendance || []).find(a => a.date === dk && a.shift_code === sh);
                        const st = att?.status || '';
                        if (st === '1' || st.startsWith('EXT|') || st.startsWith('REL|')) total++;
                        return st || '';
                      });
                      const funcName = functions.find(f => f.id === agent.function_id)?.name || '';
                      csv += `"${agent.shift_type || 'Jour'}","${agent.name}","${funcName}",${cells.join(',')},${total}\n`;
                    });
                  });
                });
                const link = document.createElement("a");
                link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                link.download = `pointage_${siteTitle}_${period}.csv`.replace(/ /g, '_');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }} title="Exporter au format CSV">
                CSV
              </button>
              {!isVerificationMode && !isArchiveMode && (
                <>
                  <button className="btn btn-danger" style={{background: '#e11d48', fontWeight: 'bold'}} onClick={handleResetYear} title="Réinitialiser tous les pointages de l'année en cours">
                    Réinitialiser Année
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bandeau de Statistiques KPI Premium */}
      {siteData.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px', 
          marginTop: '24px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* Card 1: Total Zones */}
          <div className="glass-panel" style={{ 
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: `${6 * statsCardScale}px`,
            padding: `${8 * statsCardScale}px`
          }}>
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.15)',
              borderRadius: '8px', 
              padding: `${6 * statsCardScale}px`, 
              color: 'var(--a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarDays size={Math.round(14 * statsCardScale)} />
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Secteurs / Zones</p>
              <h4 style={{ fontSize: `${1.1 * statsCardScale}rem`, fontWeight: 800, margin: '1px 0 0 0', color: 'white' }}>{stats.totalZones}</h4>
            </div>
          </div>

          {/* Card 2: Total Agents */}
          <div className="glass-panel" style={{ 
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(167, 139, 250, 0.03) 100%)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: `${6 * statsCardScale}px`,
            padding: `${8 * statsCardScale}px`
          }}>
            <div style={{ 
              background: 'rgba(167, 139, 250, 0.15)', 
              borderRadius: '8px', 
              padding: `${6 * statsCardScale}px`, 
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={Math.round(14 * statsCardScale)} />
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Effectif Total</p>
              <h4 style={{ fontSize: `${1.1 * statsCardScale}rem`, fontWeight: 800, margin: '1px 0 0 0', color: 'white' }}>{stats.totalAgents} <span style={{ fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 500, color: 'var(--muted)' }}>agents</span></h4>
            </div>
          </div>

          {/* Card 3: Nombre de Supplémentaires */}
          <div className="glass-panel" style={{ 
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: `${6 * statsCardScale}px`,
            padding: `${8 * statsCardScale}px`
          }}>
            <div style={{ 
              background: 'rgba(56, 189, 248, 0.15)', 
              borderRadius: '8px', 
              padding: `${6 * statsCardScale}px`, 
              color: 'var(--b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={Math.round(14 * statsCardScale)} />
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Nbr de supplémentaires</p>
              <h4 style={{ fontSize: `${1.1 * statsCardScale}rem`, fontWeight: 800, margin: '1px 0 0 0', color: 'white' }}>
                {stats.totalSup} <span style={{ fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 500, color: 'var(--muted)' }}>ce mois</span>
              </h4>
            </div>
          </div>

          {/* Card 4: Extras Actifs */}
          <div className="glass-panel" style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: `${6 * statsCardScale}px`,
            padding: `${8 * statsCardScale}px`
          }}>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.15)', 
              borderRadius: '8px', 
              padding: `${6 * statsCardScale}px`, 
              color: 'var(--c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={Math.round(14 * statsCardScale)} />
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Extras Déployés</p>
              <h4 style={{ fontSize: `${1.1 * statsCardScale}rem`, fontWeight: 800, margin: '1px 0 0 0', color: 'white' }}>
                {siteData.reduce((acc, sub) => acc + (sub.agents || []).filter(a => a.is_extra).length, 0)} <span style={{ fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 500, color: 'var(--muted)' }}>actifs</span>
              </h4>
            </div>
          </div>
        </div>
      )}


      {/* Chargement */}
      {(loading && siteData.length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
        </div>
      ) : siteData.length === 0 ? (
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
          {(() => {
            let globalRowIdx = 0;
            return siteData.map(subsite => {
              if (!subsite) return null;
          const isMutatedGroup = subsite.id ? String(subsite.id).startsWith('mutated_') : false;
          const filteredAgents = (subsite.agents || []).filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
          const isExtrasSite = activeSiteId === 'site_extras';
          const isRelevesSite = activeSiteId === 'site_releves';
          const isAdminSite = activeSiteId === 'site_administration';

          const renderTableHeader = () => (
                    <thead>
                      <tr>
                        <th style={{ minWidth: '260px', position: 'sticky', left: 0, background: '#0b1220', zIndex: 10, textAlign: 'center' }}>Noms & Prénoms</th>
                        <th style={{ width: '65px', minWidth: '65px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>Fonction</th>
                        {!isVerificationMode && !isArchiveMode && <th style={{ width: '55px', minWidth: '55px', maxWidth: '55px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>VAC</th>}
                        <th style={{ width: '20px', minWidth: '20px', maxWidth: '20px', position: 'sticky', left: '260px', background: '#0b1220', zIndex: 10, padding: '4px 0', fontSize: '0.6rem' }}>Type</th>
                        {datesList.map((d, i) => {
                          const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                          const isDragSelectingCol = selectionStart && selectionEnd && i >= Math.min(selectionStart.c, selectionEnd.c) && i <= Math.max(selectionStart.c, selectionEnd.c);
                          const isColumnHeaderSelected = (selectedCell && selectedCell.dateKey === dk && selectedCell.agentId === null) || isDragSelectingCol;
                          const isToday = formatDateKey(d) === formatDateKey(new Date());
                          return (
                            <th 
                              key={i} 
                              onMouseDown={() => {
                                setIsSelecting(true);
                                setSelectionStart({ r: 0, c: i });
                                setSelectionEnd({ r: 9999, c: i });
                                if (isArchiveMode) {
                                  setSelectedCell({ agentId: null, dateKey: dk, shiftCode: null });
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelecting) {
                                  setSelectionEnd({ r: 9999, c: i });
                                }
                              }}
                              onMouseUp={() => {
                                setIsSelecting(false);
                              }}
                              style={{ 
                                textAlign: 'center', 
                                padding: '4px 6px',
                                minWidth: '32px',
                                cursor: isArchiveMode ? 'pointer' : 'default',
                                background: isColumnHeaderSelected ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                                color: isColumnHeaderSelected ? '#c7d2fe' : (isToday ? 'var(--b)' : 'var(--muted)'),
                                borderBottom: isColumnHeaderSelected ? '2px solid #818cf8' : (isToday ? '2px solid var(--b)' : '1px solid var(--border)'),
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontSize: '0.72rem' }}>{getDayLabel(d)}</div>
                              <div style={{ fontWeight: 'bold' }}>{d.getDate()}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

          );

          const renderAgentRows = (agent) => {
                        if (!agent) return null;
                        // Construire la map d'attendance
                        const attMap = {};
                        (agent.attendance || []).forEach(att => {
                          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
                          attMap[att.shift_code][att.date] = att.status;
                        });

                        const isRotative = ['24h', '48h', '72h'].includes(agent.shift_type);
                        const primaryShift = agent.shift_type === 'Nuit' ? 'N' : 'J';
                        let shiftRows = isRotative ? ['J', 'N'] : [primaryShift];
                        
                        // 1. Forcer l'affichage de toute ligne ayant déjà des pointages
                        if (agent.attendance) {
                          ['J', 'N', 'S', 'SJ', 'SN'].forEach(code => {
                            if (agent.attendance.some(a => a.shift_code === code && a.status && a.status.trim() !== '')) {
                              if (!shiftRows.includes(code)) shiftRows.push(code);
                            }
                          });
                        }
                        
                        // 2. Ajouter les lignes supplémentaires par défaut si autorisé
                        const hasSP = agent.has_sp || shiftRows.some(r => ['S', 'SJ', 'SN'].includes(r));
                        if (hasSP) {
                          if (isRotative) {
                            if (!shiftRows.includes('SJ')) shiftRows.push('SJ');
                            if (!shiftRows.includes('SN')) shiftRows.push('SN');
                          } else {
                            if (!shiftRows.includes('S')) shiftRows.push('S');
                          }
                        }

                        // 3. Trier les lignes dans le bon ordre d'affichage
                        const order = { 'J': 1, 'N': 2, 'S': 3, 'SJ': 4, 'SN': 5 };
                        shiftRows.sort((a, b) => order[a] - order[b]);

                        let totalA = 0;
                        let totalSP = 0;
                        let totalMAP = 0;
                        
                        datesList.forEach(d => {
                          const dk = formatDateKey(d);
                          ['J', 'N'].forEach(s => {
                            const st = attMap[s]?.[dk];
                            if (st === 'A') totalA++;
                            if (st === 'MAP') totalMAP++;
                          });
                          ['S', 'SJ', 'SN'].forEach(s => {
                            const sp = attMap[s]?.[dk];
                            if (sp === '1' || Number(sp) > 0) totalSP++;
                          });
                        });
                        
                        let totalP = 30 - totalA - totalMAP;
                        
                        return shiftRows.map((sc, scIdx) => {
                          const myRowIdx = globalRowIdx++;
                          return (
                            <tr key={`${agent.id}-${sc}`} className={scIdx === shiftRows.length - 1 ? 'agent-last-row' : ''} style={{ 
                              background: sc === 'S' ? 'rgba(255,255,255,0.01)' : 'transparent' 
                            }}>
                              {scIdx === 0 ? (
                                <td rowSpan={shiftRows.length} className="agent-rowspan-cell"
                                  onContextMenu={(e) => { e.preventDefault(); if (!isArchiveMode) setContextMenu({ x: e.clientX, y: e.clientY, agentId: agent.id }); }}
                                  style={{ 
                                  fontWeight: '600', 
                                  position: 'sticky', 
                                  left: 0, 
                                  background: agent.is_extra ? (localStorage.getItem('pontage_extra_name_bg') || '#2a121a') : (agent.is_releve ? (localStorage.getItem('pontage_releve_name_bg') || '#2a121a') : '#0b1220'), 
                                  zIndex: 9,
                                  borderRight: '1px solid var(--border)',
                                  minWidth: '260px',
                                  padding: '8px 12px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: agent.is_extra ? '#f59e0b' : 'inherit' }}>{agent.name}</span>
                                      {agent.is_extra && (
                                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 'bold' }}>Extra</span>
                                      )}
                                      {agent.is_releve && (
                                        <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 'bold' }}>Relève</span>
                                      )}
                                      {agent.is_mutated && !agent.is_extra && !agent.is_releve && (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--c)' }}>
                                          Muté de {agent.original_site}
                                        </span>
                                      )}
                                      {(!agent.is_extra && !agent.is_releve) ? (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'nowrap', alignItems: 'center', marginLeft: '-4px' }}>
                                          <div style={{ display: 'flex', gap: '4px' }}>
                                            <span style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title={`Jours Effectués (Forfait 30${totalMAP > 0 ? ` - ${totalMAP} MAP` : ''})`}>✓ {totalP}</span>
                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Total Absences">✗ {totalA}</span>
                                            {totalMAP > 0 && (
                                              <span style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#f87171', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Jours de Mise À Pied">⚖️ {totalMAP}</span>
                                            )}
                                            {totalSP > 0 && (
                                              <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--b)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Total Supplémentaires">+ {totalSP}</span>
                                            )}
                                          </div>
                                          {!isVerificationMode && !isArchiveMode && !agent.is_mutated && (
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                              <button 
                                                className="btn" 
                                                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', height: 'fit-content' }}
                                                onClick={(e) => { e.stopPropagation(); setReposMenu({ agentId: agent.id, x: e.clientX, y: e.clientY }); }}
                                                title="Configurer le jour de repos"
                                              >
                                                Repos
                                              </button>

                                              <button
                                                onClick={() => handleUpdateAgentField(agent.id, 'has_sp', !agent.has_sp)}
                                                className="btn"
                                                style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', height: 'fit-content' }}
                                                title={agent.has_sp ? "Masquer la ligne Supplémentaire" : "Afficher la ligne Supplémentaire"}
                                              >
                                                SP
                                              </button>

                                              <button
                                                onClick={() => handleDeleteAgent(agent.id)}
                                                className="btn btn-logout"
                                                style={{ padding: '2px 6px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6, height: 'fit-content' }}
                                                title="Supprimer l'agent"
                                              >
                                                <Trash size={14} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <>
                                          {!isVerificationMode && !isArchiveMode && !agent.is_mutated && (
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', marginLeft: '-4px' }}>
                                              <button
                                                onClick={() => handleUpdateAgentField(agent.id, 'has_sp', !agent.has_sp)}
                                                className="btn"
                                                style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                                                title={agent.has_sp ? "Masquer la ligne Supplémentaire" : "Afficher la ligne Supplémentaire"}
                                              >
                                                SP
                                              </button>

                                              <button
                                                onClick={() => handleDeleteAgent(agent.id)}
                                                className="btn btn-logout"
                                                style={{ padding: '2px 6px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}
                                                title="Supprimer l'agent"
                                              >
                                                <Trash size={14} />
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              ) : null}

                              {scIdx === 0 ? (
                                <td rowSpan={shiftRows.length} className="agent-rowspan-cell" style={{ verticalAlign: 'middle', padding: '0 4px', width: '65px', minWidth: '65px', maxWidth: '65px' }}>
                                  <select
                                    className="form-input"
                                    style={{ padding: '4px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', width: '100%', cursor: 'pointer', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    value={agent.function || ''}
                                    onChange={(e) => handleUpdateAgentField(agent.id, 'function', e.target.value)}
                                    disabled={agent.is_mutated || isArchiveMode}
                                    title="Modifier la fonction"
                                  >
                                    <option value="" style={{color: 'gray'}}>Aucun / Vide</option>
                                    {functions.map(f => (
                                      <option key={f.id} value={f.id} style={{color: 'black'}}>{f.name}</option>
                                    ))}
                                  </select>
                                </td>
                              ) : null}

                              {!isVerificationMode && !isArchiveMode && scIdx === 0 ? (
                                <td rowSpan={shiftRows.length} className="agent-rowspan-cell" style={{ verticalAlign: 'middle', padding: '0 4px', width: '55px', minWidth: '55px', maxWidth: '55px' }}>
                                  <div
                                    className="form-input"
                                    style={{ padding: '4px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', width: '100%', cursor: agent.is_mutated ? 'not-allowed' : 'pointer', color: 'white', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    onClick={() => {
                                      if (!agent.is_mutated) {
                                        setShiftModalAgent(agent);
                                        setShiftModalType(agent.shift_type || 'Jour');
                                      }
                                    }}
                                    title="Modifier la vacation et générer le planning"
                                  >
                                    {agent.shift_type || 'Jour'} <Edit size={12} style={{opacity: 0.5, marginLeft: '4px'}} />
                                  </div>
                                </td>
                              ) : null}

                              <td style={{ width: '20px', minWidth: '20px', maxWidth: '20px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', left: '260px', zIndex: 9, background: sc.startsWith('S') ? '#0f172a' : '#1e293b', color: sc.startsWith('S') ? 'var(--primary)' : 'var(--text-muted)', borderRight: '1px solid var(--border)', fontSize: '0.65rem', padding: '0 1px' }}>
                                {sc === 'S' ? 'SP' : sc === 'SJ' ? 'SP-J' : sc === 'SN' ? 'SP-N' : sc}
                              </td>

                              {(() => {
                                // Pré-calcul du nombre de cellules PM| consécutives depuis le début
                                let pmCount = 0;
                                for (let pi = 0; pi < datesList.length; pi++) {
                                  const pdk = formatDateKey(datesList[pi]);
                                  const pStatus = String(attMap[sc]?.[pdk] ?? '');
                                  if (pStatus.startsWith('PM|')) {
                                    pmCount++;
                                  } else {
                                    break;
                                  }
                                }

                                const cells = [];
                                let pmRendered = false;
                                for (let dIdx = 0; dIdx < datesList.length; dIdx++) {
                                  const d = datesList[dIdx];
                                  const dk = formatDateKey(d);
                                  
                                  const getActiveShiftType = (dateStr) => {
                                     if (!agent.shift_history || agent.shift_history.length === 0) return agent.shift_type || 'Jour';
                                     
                                     // Si on a un historique (même avec une seule entrée bizarre), on regarde de la plus récente à la plus ancienne
                                     let activeType = agent.shift_history[0].type;
                                     for (let i = agent.shift_history.length - 1; i >= 0; i--) {
                                       if (dateStr >= agent.shift_history[i].from) {
                                         return agent.shift_history[i].type;
                                       }
                                     }
                                     return activeType; // Par défaut, on retourne le plus ancien connu
                                   };
                                  
                                  const activeShiftType = getActiveShiftType(dk);
                                  let isValidRow = true;
                                  if (activeShiftType === 'Jour') {
                                    isValidRow = (sc === 'J' || sc === 'S' || sc === 'SJ');
                                  } else if (activeShiftType === 'Nuit') {
                                    isValidRow = (sc === 'N' || sc === 'S' || sc === 'SN');
                                  } else {
                                    isValidRow = true;
                                  }

                                  const rawStatus = attMap[sc]?.[dk] ?? '';
                                  const status = rawStatus === '' ? '' : String(rawStatus);
                                  const isMutated = status.startsWith('M|');
                                  const isPrevMutated = status.startsWith('PM|');

                                  // Sauter les cellules PM| après la première (elles sont fusionnées)
                                  if (isPrevMutated && pmRendered) {
                                    continue;
                                  }
                                  if (isPrevMutated) {
                                    pmRendered = true;
                                  }

                                  const isNonPresent = status === 'NON_PRESENT';
                                  const isToday = dk === formatDateKey(new Date());

                                  const enableReposBg = localStorage.getItem('pontage_enable_repos_bg') !== 'false';
                                  const reposCellBg = enableReposBg ? (localStorage.getItem('pontage_repos_cell_bg') || '#ebebeb') : 'rgba(255,255,255,0.92)';
                                  let bgStyle = agent.is_extra ? (localStorage.getItem('pontage_extra_cell_bg') || 'rgba(15, 23, 42, 0.4)') : (agent.is_releve ? (localStorage.getItem('pontage_releve_cell_bg') || 'rgba(225, 29, 72, 0.08)') : 'rgba(255,255,255,0.92)');
                                  let textStyle = '#ccc';
                                  let content = '';
                                  let cursorStyle = 'pointer';

                                  if (isNonPresent) {
                                    bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                                    textStyle = 'transparent';
                                    content = '';
                                    cursorStyle = 'not-allowed';
                                  } else if (!isValidRow && (!status || status === '')) {
                                    bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                                    textStyle = 'transparent';
                                    content = '';
                                    cursorStyle = 'not-allowed';
                                  } else if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                    if (status && status !== '') {
                                      bgStyle = 'rgba(56, 189, 248, 0.55)';
                                      textStyle = '#fff';
                                      content = status;
                                    } else {
                                      bgStyle = 'rgba(56, 189, 248, 0.08)';
                                      textStyle = 'rgba(56,189,248,0.4)';
                                      content = '';
                                    }
                                  } else {
                                    if (status === '1') {
                                      bgStyle = 'rgba(34, 197, 94, 0.2)';
                                      textStyle = 'var(--a)';
                                      content = '1';
                                    } else if (status === 'R') {
                                      bgStyle = (!agent.is_extra && !agent.is_releve) ? reposCellBg : 'transparent';
                                      textStyle = '#555';
                                      content = <span style={{fontWeight: 'bold'}}>R</span>;
                                    } else if (status === 'A') {
                                      bgStyle = 'rgba(239, 68, 68, 0.2)';
                                      textStyle = 'var(--danger)';
                                      content = 'A';
                                    } else if (['M', 'CP', 'AT'].includes(status)) {
                                      bgStyle = 'rgba(245, 158, 11, 0.2)';
                                      textStyle = '#f59e0b';
                                      content = status;
                                    } else if (status && status.startsWith('EXT|')) {
                                      // (Code omis pour brièveté, géré plus bas si besoin, mais on va le remettre)
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_extras') {
                                        bgStyle = 'rgba(34, 197, 94, 0.2)';
                                        textStyle = 'var(--a)';
                                        content = <span title={`Déployé sur : ${dest}`}>1 <span style={{fontSize:'0.6rem', color:'var(--primary)'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'rgba(34, 197, 94, 0.35)';
                                        textStyle = localStorage.getItem('pontage_ext_text_color') || '#ffffff';
                                        content = <span style={{fontWeight: 'bold'}}>EXT</span>;
                                      }
                                    } else if (status && status.startsWith('EXT_A|')) {
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_extras') {
                                        bgStyle = 'rgba(239, 68, 68, 0.2)';
                                        textStyle = 'var(--danger)';
                                        content = <span title={`Absent sur : ${dest}`}>A <span style={{fontSize:'0.6rem', color:'var(--danger)'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'rgba(239, 68, 68, 0.2)';
                                        textStyle = 'var(--danger)';
                                        content = 'A';
                                      }
                                    } else if (status && status.startsWith('EXT_R|')) {
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_extras') {
                                        bgStyle = '#ffffff';
                                        textStyle = '#000000';
                                        content = <span title={`Repos sur : ${dest}`}>R <span style={{fontSize:'0.6rem', color:'#000'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'transparent';
                                        textStyle = 'gray';
                                        content = <span style={{fontWeight: 'bold'}}>R</span>;
                                      }
                                    } else if (status && status.startsWith('REL|')) {
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_releves') {
                                        bgStyle = 'rgba(34, 197, 94, 0.2)';
                                        textStyle = 'var(--a)';
                                        content = <span title={`Déployé sur : ${dest}`}>1 <span style={{fontSize:'0.6rem', color:'var(--primary)'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'rgba(34, 197, 94, 0.35)';
                                        textStyle = localStorage.getItem('pontage_rel_text_color') || '#ffffff';
                                        content = <span style={{fontWeight: 'bold'}}>REL</span>;
                                      }
                                    } else if (status && status.startsWith('REL_A|')) {
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_releves') {
                                        bgStyle = 'rgba(239, 68, 68, 0.2)';
                                        textStyle = 'var(--danger)';
                                        content = <span title={`Absent sur : ${dest}`}>A <span style={{fontSize:'0.6rem', color:'var(--danger)'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'rgba(239, 68, 68, 0.2)';
                                        textStyle = 'var(--danger)';
                                        content = 'A';
                                      }
                                    } else if (status && status.startsWith('REL_R|')) {
                                      const dest = status.split('|')[1];
                                      if (activeSiteId === 'site_releves') {
                                        bgStyle = '#ffffff';
                                        textStyle = '#000000';
                                        content = <span title={`Repos sur : ${dest}`}>R <span style={{fontSize:'0.6rem', color:'#000'}}>i</span></span>;
                                      } else {
                                        bgStyle = 'transparent';
                                        textStyle = 'gray';
                                        content = <span style={{fontWeight: 'bold'}}>R</span>;
                                      }
                                    } else if (isMutated) {
                                      bgStyle = 'rgba(245, 158, 11, 0.15)';
                                      textStyle = 'var(--c)';
                                      content = `MUTÉ VERS : ${status.substring(2)}`;
                                      cursorStyle = 'default';
                                    } else if (isPrevMutated) {
                                      bgStyle = 'rgba(245, 158, 11, 0.15)';
                                      textStyle = 'var(--c)';
                                      content = status.substring(3);
                                      cursorStyle = 'default';
                                    } else if (status === 'MAP') {
                                       bgStyle = 'rgba(220, 38, 38, 0.22)';
                                       textStyle = '#f87171';
                                       cursorStyle = 'not-allowed';
                                       content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;
                                     } else if (!status || status === '') {
                                      // Case vide — pour les agents normaux : couleur de repos, pour extras/relèves : fond sombre discret
                                      if (!agent.is_extra && !agent.is_releve) {
                                        bgStyle = reposCellBg; // Couleur repos configurable (ou blanc par défaut si désactivé)
                                        textStyle = enableReposBg ? 'rgba(150,150,150,0.4)' : 'rgba(200,200,200,0.5)';
                                      } else {
                                        bgStyle = 'rgba(255,255,255,0.03)'; // Sombre pour extras/relèves
                                        textStyle = 'rgba(255,255,255,0.2)';
                                      }
                                      content = '';
                                    }
                                  }

                                  const cellKey = `${agent.id}-${dk}-${sc}`;
                                  const isSaving = savingCells[cellKey];
                                  
                                  const currentTheme = localStorage.getItem('pontage_theme') || 'modern';
                                  const modernCellThemes = ['modern', 'cyberpunk', 'dark-amoled', 'dark-forest'];
                                  const isModernTheme = modernCellThemes.includes(currentTheme);

                                  let pulseClass = '';
                                  if (isModernTheme && !isMutated && !isPrevMutated && !isNonPresent) {
                                    if (isSaving) {
                                      pulseClass = 'pulse-blue';
                                    } else if (status === '1' || (status && typeof status === 'string' && status.startsWith('EXT|') && activeSiteId === 'site_extras') || (status && typeof status === 'string' && status.startsWith('REL|') && activeSiteId === 'site_releves') || (status && typeof status === 'string' && status.startsWith('ADM|') && activeSiteId === 'site_administration')) {
                                      pulseClass = 'pulse-green';
                                    } else if (status === 'A' || (status && typeof status === 'string' && (status.startsWith('EXT_A|') || status.startsWith('REL_A|')))) {
                                      pulseClass = 'pulse-red';
                                    } else if (['M', 'CP', 'AT'].includes(status)) {
                                      pulseClass = 'pulse-amber';
                                    } else if ((sc === 'S' || sc === 'SJ' || sc === 'SN') && status !== '') {
                                      pulseClass = 'pulse-blue';
                                    } else if (status && typeof status === 'string' && (status.startsWith('EXT|') || status.startsWith('EXT_R|') || status.startsWith('REL|') || status.startsWith('REL_R|'))) {
                                      pulseClass = 'pulse-blue';
                                    }
                                  }

                                  const colSpan = isMutated ? (datesList.length - dIdx) : (isPrevMutated ? pmCount : 1);

                                  const isMutOrPm = isMutated || isPrevMutated;
                                  const showModernPulse = isModernTheme && !isMutOrPm && !isNonPresent;
                                  const isCellSelected = selectionStart && selectionEnd && 
                                    myRowIdx >= Math.min(selectionStart.r, selectionEnd.r) && 
                                    myRowIdx <= Math.max(selectionStart.r, selectionEnd.r) && 
                                    dIdx >= Math.min(selectionStart.c, selectionEnd.c) && 
                                    dIdx <= Math.max(selectionStart.c, selectionEnd.c);
                                  const isColumnSelected = (selectedCell && selectedCell.dateKey === dk && selectedCell.agentId === null) || 
                                    (selectionStart && selectionEnd && dIdx >= Math.min(selectionStart.c, selectionEnd.c) && dIdx <= Math.max(selectionStart.c, selectionEnd.c));
                                  cells.push(
                                    <td
                                      key={dIdx}
                                      colSpan={colSpan}
                                      onMouseDown={() => {
                                        if (isArchiveMode) {
                                          setIsSelecting(true);
                                          setSelectedCell(null); // Clear column selection
                                          setSelectionStart({ r: myRowIdx, c: dIdx });
                                          setSelectionEnd({ r: myRowIdx, c: dIdx });
                                        }
                                      }}
                                      onMouseEnter={() => {
                                        if (isArchiveMode && isSelecting) {
                                          setSelectionEnd({ r: myRowIdx, c: dIdx });
                                        }
                                      }}
                                      onClick={() => {
                                        // Keep original onClick if we want but drag selection overrides it visually
                                        if (isArchiveMode) {
                                          return;
                                        }
                                        if (isNonPresent || isPrevMutated) return;
                                        if (!isValidRow && (!status || status === '')) return;
                                        if (agent.is_mutated && !agent.is_extra && !agent.is_releve) return;
                                        if (isMutated) {
                                          if (window.confirm("Voulez-vous supprimer cette mutation ? (Cela restaurera la ligne d'origine)")) {
                                            handleCellClick(agent.id, dk, sc, status, '');
                                          }
                                        } else if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                          if (status && status !== '') {
                                            handleCellClick(agent.id, dk, sc, status, '');
                                          } else {
                                            handleCellClick(agent.id, dk, sc, status, '1');
                                          }
                                        } else {
                                          handleCellClick(agent.id, dk, sc, status);
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (isArchiveMode) return;
                                        if (isNonPresent || isPrevMutated) return;
                                        if ((agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated) return;
                                        
                                        if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                          const hours = prompt("Modifier les heures supplémentaires (ex: 2, 4) ou laissez vide pour effacer:");
                                          if (hours !== null) {
                                            handleCellClick(agent.id, dk, sc, status, hours.trim());
                                          }
                                        } else {
                                          setContextMenu({ x: e.clientX, y: e.clientY, agentId: agent.id, dateKey: dk, shiftCode: sc });
                                        }
                                      }}
                                      style={{
                                        textAlign: 'center',
                                        padding: '8px 4px',
                                        background: isCellSelected ? 'rgba(129, 140, 248, 0.25)' : (isColumnSelected ? 'rgba(129, 140, 248, 0.08)' : ((isMutated || isPrevMutated) ? 'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.1) 10px, rgba(245, 158, 11, 0.05) 10px, rgba(245, 158, 11, 0.05) 20px)' : bgStyle)),
                                        color: textStyle,
                                        cursor: isArchiveMode ? 'cell' : ((agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated || isPrevMutated || isNonPresent ? 'not-allowed' : cursorStyle),
                                        borderRight: (sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.02)'),
                                        borderBottom: (sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border)'),
                                        outline: isCellSelected ? '2px solid #818cf8' : 'none',
                                        outlineOffset: '-2px',
                                        zIndex: isCellSelected ? 1 : 'auto',
                                        position: isCellSelected ? 'relative' : 'static',
                                        transition: 'background 0.2s, outline 0.2s',
                                        fontWeight: status !== '' ? 'bold' : 'normal',
                                        opacity: isSaving ? 0.5 : 1,
                                        letterSpacing: (isMutated || isPrevMutated) ? '1px' : 'normal'
                                      }}
                                      title={isMutated ? `Muté vers ${status.substring(2)}` : (isPrevMutated ? status.substring(3) : (isNonPresent ? "Pas encore affecté" : `${agent.name} - ${sc} - ${dk}`))}
                                    >
                                      {isSaving ? (
                                        <div style={{ width: '12px', height: '12px', border: '2px solid var(--b)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'rotate-bg 1s linear infinite', margin: '0 auto' }}></div>
                                      ) : (
                                        showModernPulse ? (
                                          <div className={pulseClass} style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            margin: '0 auto',
                                            transition: 'all 0.2s ease-in-out'
                                          }}>
                                            {content}
                                          </div>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: (isMutated || isPrevMutated) ? '0.9rem' : '0.8rem', color: (isMutated || isPrevMutated) ? 'var(--c)' : 'inherit', textTransform: (isMutated || isPrevMutated) ? 'uppercase' : 'none' }}>{content}</span>
                                          </div>
                                        )
                                      )}
                                    </td>
                                  );
                                  
                                  if (isMutated) {
                                    break;
                                  }
                                }
                                return cells;
                              })()}
                            </tr>
                          );
                        });

          };

          let forceIndividual = false;
          const activeSiteObj = sites.find(s => s.id === activeSiteId);
          if (activeSiteObj?.is_special) {
             const mode = localStorage.getItem('pontage_display_mode_' + activeSiteId) || 'auto_individual';
             if (mode === 'auto_individual') forceIndividual = true;
          } else {
             const modeExtras = localStorage.getItem('pontage_display_mode_extras') || 'auto_individual';
             const modeReleves = localStorage.getItem('pontage_display_mode_releves') || 'auto_individual';
             const modeAdmin = localStorage.getItem('pontage_display_mode_admin') || 'auto_individual';
             if (activeSiteId === 'site_extras' && modeExtras === 'auto_individual') forceIndividual = true;
             if (activeSiteId === 'site_releves' && modeReleves === 'auto_individual') forceIndividual = true;
             if (activeSiteId === 'site_administration' && modeAdmin === 'auto_individual') forceIndividual = true;
          }

          if (forceIndividual) {
            return (
              <div key={subsite.id} style={{ marginTop: '16px' }}>
                <div className="glass-panel" style={{ padding: '10px 14px', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 {subsite.name}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '6px' }}>
                      ({filteredAgents.length} agent(s))
                    </span>
                  </h3>
                </div>

                {filteredAgents.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
                    Aucun agent dans cette zone.
                  </div>
                ) : (
                  filteredAgents.map(agent => {
                    if (!agent) return null;
                    return (
                      <div key={agent.id} className="glass-panel" style={{ marginBottom: '24px', padding: '10px 10px', overflowX: 'auto' }}>
                        <div className="table-container" style={{ margin: 0 }}>
                          <table className="custom-table" style={{ fontSize: '0.88rem', borderSpacing: 0 }}>
                            {renderTableHeader()}
                            <tbody>
                              {renderAgentRows(agent)}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          }

          return (
            <div key={subsite.id} className="glass-panel" style={{ marginTop: '16px', padding: '8px 10px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, color: isMutatedGroup ? 'var(--c)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isMutatedGroup ? '🔄' : '📍'} {subsite.name}
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '6px' }}>
                    ({filteredAgents.length} agent(s))
                  </span>
                </h3>
                {!isMutatedGroup && !isArchiveMode && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleRenameSubsite(subsite.id, subsite.name)}
                      className="btn btn-secondary" 
                      style={{ padding: '4px', background: 'transparent', border: 'none' }}
                      title="Renommer la zone"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSubsite(subsite.id)}
                      className="btn btn-logout" 
                      style={{ padding: '4px', color: 'var(--muted)' }}
                      title="Supprimer la zone"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                )}
              </div>

              {!(subsite.agents && subsite.agents.length > 0) ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
                  Aucun agent dans cette zone. Cliquez sur "Agent" ci-dessus pour en rajouter.
                </div>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="custom-table" style={{ fontSize: '0.88rem', borderSpacing: 0 }}>
                    {renderTableHeader()}
                    <tbody onMouseUp={() => setIsSelecting(false)}>
                      {filteredAgents.map(agent => {
                        if (!agent) return null;
                        return renderAgentRows(agent);
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
          });
          })()}
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
            <h3 style={{ marginBottom: '16px' }}>Ajouter une nouvelle Zone</h3>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
            <form onSubmit={handleCreateSubsite}>
              <div className="form-group">
                <label className="form-label">Nom de la Zone / Secteur</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Zone Sud"
                  value={newSubsiteName}
                  onChange={(e) => setNewSubsiteName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubsite(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer la zone</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ============ MODAL MAP / MISE À PIED ============ */}
      {showMapModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setShowMapModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(145deg, #1a0a0a 0%, #1e0f0f 50%, #120808 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '20px', padding: '36px',
            maxWidth: '480px', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.2))',
                border: '1.5px solid rgba(239,68,68,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(239,68,68,0.15)'
              }}>⚖️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Mise À Pied (MAP)</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                  Agent : <span style={{ color: '#f87171', fontWeight: 700 }}>{mapAgentName}</span>
                </p>
              </div>
            </div>

            {/* Alerte info */}
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                La mention <strong style={{ color: '#f87171' }}>MAP</strong> sera affichée sur toutes les cases de la période sélectionnée.
              </span>
            </div>

            {/* Sélecteurs de dates - Calendrier Cliquable */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                {(() => {
                  const mode = localStorage.getItem('map_selection_mode') || 'nav';
                  if (mode === 'manual') return "Sélectionnez le début et saisissez la durée";
                  return "Sélectionnez la période (cliquez le début puis la fin)";
                })()}
              </label>

              {/* Navigation controls if in 'nav' mode */}
              {(localStorage.getItem('map_selection_mode') || 'nav') === 'nav' && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <button type="button" onClick={() => setMapNavOffset(o => o - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>⬅️</button>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', minWidth: '150px', textAlign: 'center' }}>
                    {(() => {
                      const [y, m] = getSafePeriod(period).split('-').map(Number);
                      let start = new Date(y, m - 2 + mapNavOffset, cycleStart);
                      let end = new Date(y, m - 1 + mapNavOffset, cycleStart - 1);
                      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                    })()}
                  </span>
                  <button type="button" onClick={() => setMapNavOffset(o => o + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>➡️</button>
                  <button type="button" onClick={() => setMapNavOffset(0)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '4px' }}>Aujourd'hui</button>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {(() => {
                  const mode = localStorage.getItem('map_selection_mode') || 'nav';
                  const [year, month] = getSafePeriod(period).split('-').map(Number);
                  let startDate = new Date(year, month - 2, cycleStart);
                  let endDate = new Date(year, month - 1, cycleStart - 1);

                  if (mode === 'nav') {
                    startDate.setMonth(startDate.getMonth() + mapNavOffset);
                    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, cycleStart - 1);
                  } else if (mode === 'extended') {
                    endDate.setDate(endDate.getDate() + 15);
                  }
                  
                  const list = [];
                  let curr = new Date(startDate);
                  while (curr <= endDate) {
                    list.push(new Date(curr));
                    curr.setDate(curr.getDate() + 1);
                  }
                  return list;
                })().map(d => {
                  const dk = formatDateKey(d);
                  
                  let isSelected = false;
                  let isBetween = false;
                  
                  if (mapStartDate && mapEndDate) {
                    if (dk === mapStartDate || dk === mapEndDate) isSelected = true;
                    if (mapStartDate < mapEndDate && dk > mapStartDate && dk < mapEndDate) isBetween = true;
                    if (mapEndDate < mapStartDate && dk > mapEndDate && dk < mapStartDate) isBetween = true;
                  } else if (mapStartDate && dk === mapStartDate) {
                    isSelected = true;
                  }

                  const getBg = () => {
                    if (isSelected) return 'rgba(239, 68, 68, 0.9)'; // bright red
                    if (isBetween) return 'rgba(239, 68, 68, 0.25)';  // light red
                    return 'rgba(255, 255, 255, 0.05)';
                  };

                  const getColor = () => {
                    if (isSelected) return '#fff';
                    if (isBetween) return '#fca5a5';
                    return 'rgba(255, 255, 255, 0.5)';
                  };

                  return (
                    <div
                      key={dk}
                      onClick={() => {
                        const mode = localStorage.getItem('map_selection_mode') || 'nav';
                        if (mode === 'manual') {
                           setMapStartDate(dk);
                           if (mapManualDuration && parseInt(mapManualDuration) > 0) {
                              let ed = new Date(dk);
                              ed.setDate(ed.getDate() + parseInt(mapManualDuration) - 1);
                              setMapEndDate(formatDateKey(ed));
                           } else {
                              setMapEndDate('');
                           }
                           return;
                        }

                        if (!mapStartDate || (mapStartDate && mapEndDate)) {
                          // start new selection
                          setMapStartDate(dk);
                          setMapEndDate('');
                        } else {
                          // complete selection
                          if (dk < mapStartDate) {
                            setMapEndDate(mapStartDate);
                            setMapStartDate(dk);
                          } else {
                            setMapEndDate(dk);
                          }
                        }
                      }}
                      style={{
                        width: '38px', height: '38px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: getBg(),
                        color: getColor(),
                        border: isSelected ? '1px solid rgba(255,255,255,0.8)' : (isBetween ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)'),
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected || isBetween ? 'bold' : 'normal',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                         if (!isSelected && !isBetween) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                         if (!isSelected && !isBetween) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }}
                      title={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}`}
                    >
                      <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', marginBottom: '-2px', opacity: 0.8, color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                        {getDayLabel(d).charAt(0)}
                      </span>
                      <span>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Saisie Manuelle de la Durée (si mode manual et date de début sélectionnée) */}
              {(localStorage.getItem('map_selection_mode') || 'nav') === 'manual' && mapStartDate && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Nombre de jours :</label>
                  <input type="number" min="1" value={mapManualDuration} onChange={e => {
                    const val = e.target.value;
                    setMapManualDuration(val);
                    if (val && parseInt(val) > 0) {
                      let ed = new Date(mapStartDate);
                      ed.setDate(ed.getDate() + parseInt(val) - 1);
                      setMapEndDate(formatDateKey(ed));
                    } else {
                      setMapEndDate('');
                    }
                  }} style={{ width: '80px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', padding: '8px 10px', fontSize: '1rem', textAlign: 'center', outline: 'none' }} placeholder="Ex: 5" />
                </div>
              )}
            </div>

            {/* Résumé de la sélection */}
            {mapStartDate && mapEndDate && mapStartDate <= mapEndDate && (() => {
              let count = 0;
              let c = new Date(mapStartDate);
              const e = new Date(mapEndDate);
              while(c <= e) { count++; c.setDate(c.getDate() + 1); }
              return (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                  🔴 <strong style={{ color: '#f87171' }}>{count} jour{count > 1 ? 's' : ''}</strong> de mise à pied seront enregistrés
                </div>
              );
            })()}

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowMapModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >Annuler</button>
              <button
                onClick={handleMapSubmit}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 4px 18px rgba(220,38,38,0.35)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(220,38,38,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(220,38,38,0.35)'; }}
              >⚖️ Appliquer la MAP</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Deploy Extra */}
      {showDeployExtra && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '20px' }}>
                👁
              </div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Déployer un Extra</h3>
            </div>
            <form onSubmit={handleDeployExtra}>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Rechercher l'Agent Extra</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Tapez le nom de l'agent..."
                  value={searchExtraText} 
                  onChange={e => {
                    setSearchExtraText(e.target.value);
                    setShowExtraDropdown(true);
                    if (e.target.value === '') setDeployExtraAgentId('');
                  }}
                  onFocus={() => setShowExtraDropdown(true)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
                  required={!deployExtraAgentId}
                />
                
                {showExtraDropdown && searchExtraText.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                    {extraAgents.filter(ag => ag.name.toLowerCase().includes(searchExtraText.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>Aucun agent trouvé</div>
                    ) : (
                      extraAgents.filter(ag => ag.name.toLowerCase().includes(searchExtraText.toLowerCase())).map(ag => (
                        <div 
                          key={ag.id}
                          style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            setDeployExtraAgentId(ag.id);
                            setSearchExtraText(`${ag.name} (${ag.function})`);
                            setShowExtraDropdown(false);
                          }}
                        >
                          <div style={{ color: 'white', fontWeight: '500' }}>{ag.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{ag.function} • Vacation: {ag.shift_type}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>À partir du</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={deployExtraDate} 
                  onChange={e => setDeployExtraDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeployExtra(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>Confirmer l'ajout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Deploy Releve */}
      {showDeployReleve && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '20px' }}>
                👁
              </div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Déployer une Relève</h3>
            </div>
            <form onSubmit={handleDeployReleve}>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Rechercher l'Agent Relève</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Tapez le nom de l'agent..."
                  value={searchReleveText} 
                  onChange={e => {
                    setSearchReleveText(e.target.value);
                    setShowReleveDropdown(true);
                    if (e.target.value === '') setDeployReleveAgentId('');
                  }}
                  onFocus={() => setShowReleveDropdown(true)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
                  required={!deployReleveAgentId}
                />
                
                {showReleveDropdown && searchReleveText.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                    {releveAgents.filter(ag => ag.name.toLowerCase().includes(searchReleveText.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>Aucun agent trouvé</div>
                    ) : (
                      releveAgents.filter(ag => ag.name.toLowerCase().includes(searchReleveText.toLowerCase())).map(ag => (
                        <div 
                          key={ag.id}
                          style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            setDeployReleveAgentId(ag.id);
                            setSearchReleveText(`${ag.name} (${ag.function})`);
                            setShowReleveDropdown(false);
                          }}
                        >
                          <div style={{ color: 'white', fontWeight: '500' }}>{ag.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{ag.function} • Vacation: {ag.shift_type}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>À partir du</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={deployReleveDate} 
                  onChange={e => setDeployReleveDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeployReleve(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>Confirmer l'ajout</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal : Ajouter Agent */}
      {showAddAgent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Ajouter un Agent de sécurité</h3>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label className="form-label">Nom Complet</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Mamadou Diallo"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zone de travail</label>
                <select
                  className="form-input"
                  value={newAgentSubsiteId}
                  onChange={(e) => setNewAgentSubsiteId(e.target.value)}
                  required
                >
                  <option value="">Sélectionnez la zone...</option>
                  {siteData.filter(s => !String(s.id).startsWith('mutated_')).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fonction / Poste (Vacation)</label>
                <select
                  className="form-input"
                  value={newAgentFunction}
                  onChange={(e) => setNewAgentFunction(e.target.value)}
                  required
                >
                  <option value="">Sélectionnez une fonction...</option>
                  {functions.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type de vacation</label>
                <select
                  className="form-input"
                  value={newAgentShiftType}
                  onChange={(e) => setNewAgentShiftType(e.target.value)}
                  required
                >
                  <option value="Jour">Jour (12h)</option>
                  <option value="Nuit">Nuit (12h)</option>
                  <option value="24h">24h</option>
                  <option value="48h">48h</option>
                  <option value="72h">72h</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAgent(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer l'agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Suppression Agent */}
      {deleteAgentConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Supprimer l'agent ?</h3>
            <p className="subtitle" style={{ marginBottom: '24px' }}>
              Cette action est définitive. L'agent ainsi que tout son historique de pointage seront effacés de la base de données.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteAgentConfirm(null)} style={{ flex: 1 }}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={confirmDeleteAgent} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Mutation Temporaire */}
      {showMutate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(12px)', padding: '20px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', border: `1px solid ${currentMutationPalette.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)', overflow: 'visible', animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: currentMutationPalette.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${currentMutationPalette.iconBg.replace('0.2)', '0.1)')}` }}>
                  <Users size={20} style={{ color: currentMutationPalette.iconColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-0.02em' }}>Mutation Temporaire</h3>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Agent: <span style={{ color: currentMutationPalette.agentName, fontWeight: '700', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px' }}>{mutateAgentName}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMutate(false)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px' }}>
                
                {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '20px', borderRadius: '10px', fontSize: '0.9rem' }}>{errorMsg}</div>}

                {/* Sélection de la zone de destination */}
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
                    Zone de Destination
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      placeholder="Chercher ou choisir une zone..."
                      value={searchMutationText}
                      onChange={(e) => {
                        setSearchMutationText(e.target.value);
                        setMutateDestSubsiteId(''); // Reset id if user is typing
                        setShowMutationDropdown(true);
                      }}
                      onFocus={() => setShowMutationDropdown(true)}
                      onBlur={() => setTimeout(() => setShowMutationDropdown(false), 200)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', padding: '12px 34px 12px 14px', color: '#f8fafc', outline: 'none', fontSize: '0.95rem', transition: 'all 0.2s', fontWeight: mutateDestSubsiteId ? '600' : '400' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = currentMutationPalette.selectedBorder}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = currentMutationPalette.dropdownBorder}
                    />
                    <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: currentMutationPalette.iconColor, transition: 'transform 0.3s', pointerEvents: 'none', transform: showMutationDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0)' }} />
                  </div>
                  
                  {showMutationDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#1e293b', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
                      {sites.flatMap(s => (s.subsites || []).map(sub => ({ ...sub, siteName: s.name })))
                        .filter(sub => (sub.siteName + ' ' + sub.name).toLowerCase().includes(searchMutationText.toLowerCase()))
                        .map(sub => (
                          <div 
                            key={sub.id}
                            style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = currentMutationPalette.hoverBg}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setMutateDestSubsiteId(sub.id);
                              setSearchMutationText(`${sub.siteName} - ${sub.name}`);
                              setShowMutationDropdown(false);
                            }}
                          >
                            <div style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem', marginBottom: '2px' }}>{sub.siteName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Zone : <span style={{ color: 'rgba(255,255,255,0.8)' }}>{sub.name}</span></div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Sélection de la date — chips cliquables */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
                    Date de Mutation (Début)
                  </label>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.containerBorder}`, borderRadius: '12px', padding: '12px', maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px' }}>
                    {datesList.map(date => {
                      const dk = formatDateKey(date);
                      const isSelected = mutateStart === dk;
                      const dayNum = date.getDate();
                      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
                      return (
                        <button
                          key={dk}
                          type="button"
                          onClick={() => setMutateStart(dk)}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '8px',
                            border: isSelected ? `2px solid ${currentMutationPalette.selectedBorder}` : '1px solid rgba(255,255,255,0.08)',
                            background: isSelected ? currentMutationPalette.selectedBg : 'rgba(255,255,255,0.03)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 12px ${currentMutationPalette.selectedBg.replace('0.35)', '0.5)')}` : 'none',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: isSelected ? currentMutationPalette.selectedText : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{dayName}</span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)', margin: '2px 0' }}>{dayNum}</span>
                          <span style={{ fontSize: '0.7rem', color: isSelected ? currentMutationPalette.selectedText : 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vacation à appliquer */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
                    Vacation de Remplacement
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={mutateNewShiftType}
                      onChange={(e) => setMutateNewShiftType(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}
                    >
                      <option value="CONSERVER" style={{ background: '#1e293b' }}>-- Conserver les vacations actuelles --</option>
                      <option value="Jour" style={{ background: '#1e293b' }}>Jour</option>
                      <option value="Nuit" style={{ background: '#1e293b' }}>Nuit</option>
                      <option value="24H" style={{ background: '#1e293b' }}>24H</option>
                      <option value="48H" style={{ background: '#1e293b' }}>48H</option>
                      <option value="72H" style={{ background: '#1e293b' }}>72H</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setShowMutate(false)}
                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleMutateSubmit}
                    style={{ flex: 2, padding: '12px', background: currentMutationPalette.btnBg, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', boxShadow: `0 6px 15px ${currentMutationPalette.btnShadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 20px ${currentMutationPalette.btnShadow}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 15px ${currentMutationPalette.btnShadow}`; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  >
                    Valider la Mutation
                  </button>
                </div>

              </div>
            </div>
        </div>
      )}
      {/* Shift/Vacation Modal */}
      {shiftModalAgent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', position: 'relative', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', borderRadius: '16px' }}>
            <button 
              onClick={() => setShiftModalAgent(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              title="Fermer"
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '24px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', paddingRight: '30px' }}>Type de Service & Planning</h3>
            
            <div style={{ marginBottom: '25px' }}>
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

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500' }}>2. Générer le planning (Rotation)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '40vh', overflowY: 'auto', paddingRight: '10px' }}>
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
                    key={idx} 
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
                  <option value="" disabled style={{color: 'black'}}>Sélectionnez une date...</option>
                  {datesList.map(d => {
                    const dk = formatDateKey(d);
                    return <option key={dk} value={dk} style={{color: 'black'}}>{d.toLocaleDateString('fr-FR')} ({getDayLabel(d)})</option>;
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
                  <option value="Jour" style={{color: 'black'}}>Jour (J)</option>
                  <option value="Nuit" style={{color: 'black'}}>Nuit (N)</option>
                  <option value="24h" style={{color: 'black'}}>24h (J, N)</option>
                  <option value="48h" style={{color: 'black'}}>48h (J, N)</option>
                  <option value="72h" style={{color: 'black'}}>72h (J, N)</option>
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

      {showNextMonthModal && (() => {
        let [y, m] = getSafePeriod(period).split('-').map(Number);
        m += 1; if (m > 12) { m = 1; y += 1; }
        const nextPeriod = `${y}-${String(m).padStart(2, '0')}`;
        const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        const currentMonthName = monthNames[Number(getSafePeriod(period).split('-')[1]) - 1];
        const nextMonthName = monthNames[m - 1];

        // Calcul des dates de la prochaine période
        const start = new Date(y, m - 2, 21);
        const end = new Date(y, m - 1, 20);
        const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {/* Backdrop */}
            <div
              onClick={() => setShowNextMonthModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            />

            {/* Modal Card */}
            <div style={{
              position: 'relative', zIndex: 1,
              background: 'linear-gradient(145deg, #0f1a2e 0%, #111827 50%, #0a1628 100%)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              animation: 'fadeInUp 0.3s ease'
            }}>
              {/* Header Icon */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '72px', height: '72px', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))',
                  border: '2px solid rgba(245,158,11,0.4)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem',
                  boxShadow: '0 8px 25px rgba(245,158,11,0.2)'
                }}>
                  📅
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Passage au mois suivant
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>
                  {currentMonthName} → <span style={{ color: '#f59e0b', fontWeight: 700 }}>{nextMonthName} {y}</span>
                </p>
              </div>

              {/* Période card */}
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <CalendarDays size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Nouvelle période de pointage</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {fmtDate(start)} → {fmtDate(end)}
                  </div>
                </div>
              </div>

              {/* Checklist de ce qui va se passer */}
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Ce qui va se passer :</p>
                {[
                  { icon: '✅', color: '#22c55e', text: 'La structure de vos sites et agents est conservée' },
                  { icon: '✅', color: '#22c55e', text: 'Les vacations et fonctions sont maintenues' },
                  { icon: '🗑️', color: '#ef4444', text: 'Les absences sont remises à zéro' },
                  { icon: '🗑️', color: '#ef4444', text: 'Les heures supplémentaires sont effacées' },
                  { icon: '🔄', color: '#38bdf8', text: 'Le calendrier est recalculé pour la nouvelle période' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowNextMonthModal(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Annuler
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)'; }}
                >
                  <CalendarDays size={18} /> Confirmer — Passer à {nextMonthName}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
