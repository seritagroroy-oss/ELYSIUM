
import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { 
  Plus, CalendarDays, RefreshCw, Archive, UserPlus, 
  Trash, Edit, Check, X, AlertTriangle, ArrowLeftRight, Clock, HelpCircle, Save, Loader2, ChevronLeft, ChevronRight, Star, TrendingUp, Shield
} from 'lucide-react';
import StatsPanel from './StatsPanel';
import QRPointage from './QRPointage';

export default function Dashboard({ isVerificationMode = false }) {
  const { user } = useAuth();
  
  // Navigation states
  const [sites, setSites] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState(() => localStorage.getItem('pontage_activeSiteId') || null);
  const [activeSiteName, setActiveSiteName] = useState(() => localStorage.getItem('pontage_activeSiteName') || '');
  const [period, setPeriod] = useState(() => localStorage.getItem('pontage_period') || new Date().toISOString().slice(0, 7)); // YYYY-MM
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

  // Modal: Changement de vacation historisé
  const [showShiftChangeMenu, setShowShiftChangeMenu] = useState(null);
  const [shiftChangeDate, setShiftChangeDate] = useState('');
  const [shiftChangeNewType, setShiftChangeNewType] = useState('Jour');

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
    if (!deployExtraAgentId || !deployExtraDate) return;
    const agent = extraAgents.find(a => a.id === deployExtraAgentId);
    const shift = agent ? agent.shift_type : 'J';
    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';
    
    try {
      await apiCall('bulk_update_attendance', {
        updates: [{ agent_id: deployExtraAgentId, date: deployExtraDate, shift_code: shift, status: 'EXT|' + siteTitle, period }]
      });
      setShowDeployExtra(false);
      loadSiteData();
    } catch (err) {
      console.error(err);
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
    if (!deployReleveAgentId || !deployReleveDate) return;
    const agent = releveAgents.find(a => a.id === deployReleveAgentId);
    const shift = agent ? agent.shift_type : 'J';
    const siteObj = sites.find(s => String(s.id) === String(activeSiteId));
    const siteTitle = siteObj ? siteObj.name : 'Site';
    
    try {
      await apiCall('bulk_update_attendance', {
        updates: [{ agent_id: deployReleveAgentId, date: deployReleveDate, shift_code: shift, status: 'REL|' + siteTitle, period }]
      });
      setShowDeployReleve(false);
      loadSiteData();
    } catch (err) {
      console.error(err);
    }
  };

  const [showMutate, setShowMutate] = useState(false);
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
  const [mutateAgentId, setMutateAgentId] = useState('');
  const [mutateAgentName, setMutateAgentName] = useState('');
  const [mutateStart, setMutateStart] = useState('');
  const [mutateEnd, setMutateEnd] = useState('');
  const [mutateDest, setMutateDest] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Charger les paramètres de cycle
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiCall('get_settings', {}, 'GET');
        if (res && res.cycle_start) {
          setCycleStart(res.cycle_start);
        }
        const funcRes = await apiCall('get_functions', {}, 'GET');
        if (Array.isArray(funcRes)) {
          setFunctions(funcRes);
        }
      } catch (e) {
        console.error("Erreur de chargement des paramètres:", e);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
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
  }, [activeSiteId, period]);

  const loadPublishedPeriods = async () => {
    try {
      const res = await apiCall('get_published_periods', {}, 'GET');
      if (res && res.published_periods) {
        setPublishedPeriods(res.published_periods);
        
        // Auto-snap en mode vérification pour toujours afficher le pointage actif
        if (isVerificationMode && !hasAutoSnapped && res.published_periods.length > 0) {
          const latest = res.published_periods[0];
          if (period !== latest) setPeriod(latest);
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
        await apiCall('archive_all_sites', { period });
        setShowPublishModal(false);
      }
    } catch(e) {
      console.error("Erreur publish_period", e);
    } finally {
      setPublishing(false);
    }
  };

  const handleNextMonth = async () => {
    setInitializing(true);
    let [year, month] = period.split('-').map(Number);
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
    setMutateEnd('');
    setMutateDest('');
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
    const [year, month] = period.split('-').map(Number);
    const d = new Date(year, month - 1 + dir, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const getPeriodLabel = () => {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^./, c => c.toUpperCase());
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isPastMonth = period < currentMonthStr;

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
    const [year, month] = period.split('-').map(Number);
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

    if (currentStatus !== '' && currentStatus.startsWith('M|')) return; // Mutation protégée

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
        period
      });
      if (res.success) {
        setNewAgentName('');
        setShowAddAgent(false);
        loadSiteData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg("Erreur réseau");
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet agent de la base ?")) return;
    try {
      const res = await apiCall('delete_agent', { agent_id: agentId });
      if (res.success) {
        loadSiteData();
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

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    csvContent += "Zone,Agent,Poste,Vacation";
    datesList.forEach(d => {
      csvContent += "," + d.getDate() + "/" + (d.getMonth() + 1);
    });
    csvContent += "\r\n";

    siteData.forEach(sub => {
      if (!sub || !sub.agents) return;
      sub.agents.forEach(agent => {
        const isRotative = ['24h', '48h', '72h'].includes(agent.shift_type);
        const primaryShift = agent.shift_type === 'Nuit' ? 'N' : 'J';
        let shiftRows = isRotative ? ['J', 'N'] : [primaryShift];
        const hasSP = agent.has_sp || (agent.attendance && agent.attendance.some(a => ['S', 'SJ', 'SN'].includes(a.shift_code) && a.status && a.status.trim() !== ''));
        if (hasSP) {
          if (isRotative) {
            shiftRows.push('SJ', 'SN');
          } else {
            shiftRows.push('S');
          }
        }

        const attMap = {};
        (agent.attendance || []).forEach(att => {
          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
          attMap[att.shift_code][att.date] = att.status;
        });

        shiftRows.forEach((sc, scIdx) => {
          let row = [];
          if (scIdx === 0) {
            row.push(`"${sub.name}"`, `"${agent.name}"`, `"${agent.function || 'AS'}"`);
          } else {
            row.push("", "", "");
          }
          row.push(`"${sc}"`);
          
          datesList.forEach(d => {
            const dk = formatDateKey(d);
            const status = attMap[sc]?.[dk] || '';
            row.push(`"${status}"`);
          });
          csvContent += row.join(",") + "\r\n";
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const siteTitle = sites.find(s => s.id === activeSiteId)?.name || 'Site';
    link.setAttribute("download", `Pointage_${siteTitle}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!mutateAgentId || !mutateStart || !mutateEnd || !mutateDest.trim()) return;

    try {
      const res = await apiCall('apply_mutation', {
        agent_id: mutateAgentId,
        start_date: mutateStart,
        end_date: mutateEnd,
        destination: mutateDest,
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
    setMutateEnd(endStr);
    setMutateDest('');
    setShowMutate(true);
  };

  // Utilitaires de calculs pour les stats
  const getDashboardStats = () => {
    let totalZones = siteData.length;
    let totalAgents = 0;
    let presentToday = 0;
    
    const todayStr = formatDateKey(new Date());

    siteData.forEach(sub => {
      // Ne pas compter le dossier des mutés temporaires
      if (!sub || !sub.id || String(sub.id).startsWith('mutated_')) return;
      totalAgents += (sub.agents || []).length;
      
      (sub.agents || []).forEach(agent => {
        if (!agent) return;
        const isPresent = (agent.attendance || []).some(att => 
          att.date === todayStr && 
          (att.shift_code === 'J' || att.shift_code === 'N') && 
          att.status === '1'
        );
        if (isPresent) presentToday++;
      });
    });

    return { totalZones, totalAgents, presentToday };
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

  // ─── Page de sélection de site ("Mes Sites") ───────────────────────
  if (!activeSiteId) {
    return (
      <div>
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
            {/* Navigation Période pour l'écran principal */}
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

            {!isVerificationMode && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className={`btn ${publishedPeriods.includes(period) ? 'btn-secondary' : 'btn-success'}`} 
                  onClick={() => setShowPublishModal(true)}
                  disabled={publishedPeriods.includes(period)}
                >
                  <Check size={16} /> 
                  {publishedPeriods.includes(period) ? `Pointage publié ✅` : `Publier le pointage du mois`}
                </button>
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
                    disabled={isPastMonth}
                    style={{ 
                      background: isPastMonth ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f59e0b, #ef4444)', 
                      color: isPastMonth ? 'var(--muted)' : 'white', 
                      fontWeight: 'bold', 
                      border: isPastMonth ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                      boxShadow: isPastMonth ? 'none' : '0 4px 15px rgba(245,158,11,0.4)',
                      cursor: isPastMonth ? 'not-allowed' : 'pointer',
                      opacity: isPastMonth ? 0.6 : 1
                    }}
                    title={isPastMonth ? "Action désactivée pour les mois passés" : ""}
                  >
                    <CalendarDays size={16} /> Mois Suivant ➔
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

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

        {(!isVerificationMode || (isVerificationMode && publishedPeriods.includes(period) && showVerificationSites)) && (
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
                }).map((site, idx) => {
              const glowColors = ['var(--b)', 'var(--a)', 'var(--c)', '#a78bfa', '#f472b6'];
              const glow = glowColors[idx % glowColors.length];
              const siteIcon = site.icon || '🏢';
              return (
                <div
                  key={site.id}
                  className="site-card"
                  style={{ '--card-glow': glow }}
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
          const [yr, mn] = period.split('-').map(Number);
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
          let [y, m] = period.split('-').map(Number);
          m += 1; if (m > 12) { m = 1; y += 1; }
          const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          const currentMonthName = monthNames[Number(period.split('-')[1]) - 1];
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

      </div>
    );
  }

  // ─── Vue tableau de pointage (site sélectionné) ─────────────────────
  return (
    <div onClick={() => { setContextMenu(null); setReposMenu(null); }}>
      {contextMenu && (
        <div style={{
          position: 'fixed', 
          top: Math.min(contextMenu.y, window.innerHeight - 240), 
          left: contextMenu.x, background: '#1e293b', 
          border: '1px solid var(--border)', borderRadius: '8px', zIndex: 1000, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          {[
            { code: 'CHGT_VAC', label: 'Changement de vacation', color: 'var(--c)', type: 'agent' },
            { code: 'MUT', label: 'Muter cet agent', color: '#f59e0b', type: 'agent' },
            { code: 'A', label: 'Absence Injustifiée', color: 'var(--danger)', type: 'cell' },
            { code: 'R', label: 'Repos (R)', color: 'gray', type: 'cell' },
            { code: 'M', label: 'Maladie (M)', color: '#f59e0b', type: 'cell' },
            { code: 'CP', label: 'Congé Payé (CP)', color: '#3b82f6', type: 'cell' },
            { code: 'AT', label: 'Accident Travail (AT)', color: '#8b5cf6', type: 'cell' },
            { code: '', label: 'Effacer (Repos)', color: 'var(--muted)', type: 'cell' }
          ].filter(opt => contextMenu.dateKey ? true : opt.type === 'agent').map(opt => (
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
          position: 'fixed', top: reposMenu.y, left: reposMenu.x, background: '#1e293b', 
          border: '1px solid var(--border)', borderRadius: '8px', zIndex: 1000, 
          boxShadow: '0 -4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: 'translateY(calc(-100% - 10px))'
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
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>

        {/* GAUCHE : Retour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={backToSites} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <ChevronLeft size={16} /> Mes Sites
          </button>
        </div>

        {/* CENTRE : Recherche + actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <input
            type="text"
            className="form-input search-input-premium"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '180px', background: 'rgba(0,0,0,0.3)', flex: '1' }}
          />
          {activeSiteId && (
            <>
              {!isVerificationMode && (
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
                  {activeSiteId !== 'site_extras' && activeSiteId !== 'site_releves' && activeSiteId !== 'site_administration' && (
                    <>
                      <button className="btn btn-secondary" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px dashed #3b82f6' }} onClick={openDeployExtraModal} title="Déployer un Extra">
                        👁 Extra
                      </button>
                      <button className="btn btn-secondary" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px dashed #3b82f6', marginLeft: '5px' }} onClick={openDeployReleveModal} title="Déployer une Relève">
                        👁 Relève
                      </button>
                    </>
                  )}

                  <button className="btn btn-success" onClick={handleInitPeriodRotation} title="Auto-Roulement">
                    <RefreshCw size={14} /> Roulement
                  </button>
                  <button className="btn btn-secondary" onClick={handleClearMutations} title="Reset mutations">
                    <ArrowLeftRight size={14} />
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
              <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={exportToCSV} title="Exporter CSV">
                CSV
              </button>
              {!isVerificationMode && (
                <button className="btn btn-danger" onClick={handleArchivePeriod} title="Archiver la période">
                  <Archive size={14} />
                </button>
              )}
            </>
          )}
        </div>

        {/* DROITE : Navigation période style ancien ← Janvier 2026 → */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
          <button
            onClick={() => changePeriod(-1)}
            style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Période précédente"
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
            title="Période suivante"
          >
            <ChevronRight size={16} />
          </button>
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

          {/* Card 3: Taux de Présence */}
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
              <Check size={Math.round(14 * statsCardScale)} />
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Présence aujourd'hui</p>
              <h4 style={{ fontSize: `${1.1 * statsCardScale}rem`, fontWeight: 800, margin: '1px 0 0 0', color: 'white' }}>
                {stats.presentToday} <span style={{ fontSize: `${0.68 * statsCardScale}rem`, fontWeight: 500, color: 'var(--muted)' }}>({stats.totalAgents > 0 ? Math.round((stats.presentToday / stats.totalAgents) * 100) : 0}%)</span>
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
          transition: 'opacity 0.2s ease-in-out' 
        }}>
          {/* Tableau principal des pointages */}
          {siteData.map(subsite => {
          if (!subsite) return null;
          const isMutatedGroup = subsite.id ? String(subsite.id).startsWith('mutated_') : false;
          const filteredAgents = (subsite.agents || []).filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
          const isExtrasSite = activeSiteId === 'site_extras';
          const isRelevesSite = activeSiteId === 'site_releves';
          const isAdminSite = activeSiteId === 'site_administration';

          const renderTableHeader = () => (
                    <thead>
                      <tr>
                        <th style={{ minWidth: '260px', position: 'sticky', left: 0, background: '#0b1220', zIndex: 10 }}>Agent / Poste</th>
                        <th style={{ width: '65px', minWidth: '65px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>PST</th>
                        {!isVerificationMode && <th style={{ width: '55px', minWidth: '55px', maxWidth: '55px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>VAC</th>}
                        <th style={{ width: '20px', minWidth: '20px', maxWidth: '20px', position: 'sticky', left: '260px', background: '#0b1220', zIndex: 10, padding: '4px 0', fontSize: '0.6rem' }}>Type</th>
                        {datesList.map((d, i) => {
                          const isToday = formatDateKey(d) === formatDateKey(new Date());
                          return (
                            <th 
                              key={i} 
                              style={{ 
                                textAlign: 'center', 
                                padding: '4px 6px',
                                minWidth: '32px',
                                color: isToday ? 'var(--b)' : 'var(--muted)',
                                borderBottom: isToday ? '2px solid var(--b)' : '1px solid var(--border)'
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
                        
                        datesList.forEach(d => {
                          const dk = formatDateKey(d);
                          ['J', 'N'].forEach(s => {
                            const st = attMap[s]?.[dk];
                            if (st === 'A') totalA++;
                          });
                          ['S', 'SJ', 'SN'].forEach(s => {
                            const sp = attMap[s]?.[dk];
                            if (sp === '1' || Number(sp) > 0) totalSP++;
                          });
                        });
                        
                        let totalP = 30 - totalA;
                        
                        return shiftRows.map((sc, scIdx) => {
                          return (
                            <tr key={`${agent.id}-${sc}`} className={scIdx === shiftRows.length - 1 ? 'agent-last-row' : ''} style={{ 
                              background: sc === 'S' ? 'rgba(255,255,255,0.01)' : 'transparent' 
                            }}>
                              {scIdx === 0 ? (
                                <td rowSpan={shiftRows.length} className="agent-rowspan-cell"
                                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, agentId: agent.id }); }}
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
                                            <span style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title="Jours Effectués (Forfait 30)">✓ {totalP}</span>
                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Total Absences">✗ {totalA}</span>
                                            {totalSP > 0 && (
                                              <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--b)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} title="Total Supplémentaires">+ {totalSP}</span>
                                            )}
                                          </div>
                                          {!isVerificationMode && !agent.is_mutated && (
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
                                          {!isVerificationMode && !agent.is_mutated && (
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
                                    value={agent.function || 'AS'}
                                    onChange={(e) => handleUpdateAgentField(agent.id, 'function', e.target.value)}
                                    disabled={agent.is_mutated}
                                    title="Modifier la fonction"
                                  >
                                    {functions.map(f => (
                                      <option key={f.id} value={f.id} style={{color: 'black'}}>{f.name}</option>
                                    ))}
                                  </select>
                                </td>
                              ) : null}

                              {!isVerificationMode && scIdx === 0 ? (
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

                              {datesList.map((d, dIdx) => {
                                const dk = formatDateKey(d);
                                
                                const getActiveShiftType = (dateStr) => {
                                  if (!agent.shift_history || agent.shift_history.length === 0) return agent.shift_type || 'Jour';
                                  for (let i = agent.shift_history.length - 1; i >= 0; i--) {
                                    if (dateStr >= agent.shift_history[i].from) {
                                      return agent.shift_history[i].type;
                                    }
                                  }
                                  return agent.shift_history[0].type;
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

                                const status = attMap[sc]?.[dk] ?? '';
                                const isMutated = typeof status === 'string' && status.startsWith('M|');
                                const isToday = dk === formatDateKey(new Date());

                                // Calcul de l'esthétique du pointage
                                let bgStyle = agent.is_extra ? (localStorage.getItem('pontage_extra_cell_bg') || 'rgba(15, 23, 42, 0.4)') : (agent.is_releve ? (localStorage.getItem('pontage_releve_cell_bg') || 'rgba(225, 29, 72, 0.08)') : 'rgba(255,255,255,0.92)');
                                let textStyle = '#ccc';
                                let content = '';
                                let cursorStyle = 'pointer';

                                if (!isValidRow && (!status || status === '')) {
                                  bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                                  textStyle = 'transparent';
                                  content = '';
                                  cursorStyle = 'not-allowed';
                                } else if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                  if (status && status !== '') {
                                    // Filled SP cell → solid blue
                                    bgStyle = 'rgba(56, 189, 248, 0.55)';
                                    textStyle = '#fff';
                                    content = status;
                                  } else {
                                    // Empty SP cell → subtle blue tint (like before)
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
                                    bgStyle = '#ffffff';
                                    textStyle = '#000000';
                                    content = 'R';
                                  } else if (status === 'A') {
                                    bgStyle = 'rgba(239, 68, 68, 0.2)';
                                    textStyle = 'var(--danger)';
                                    content = 'A';
                                  } else if (['M', 'CP', 'AT'].includes(status)) {
                                    bgStyle = 'rgba(245, 158, 11, 0.2)';
                                    textStyle = '#f59e0b';
                                    content = status;
                                  } else if (status && status.startsWith('EXT|')) {
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
                                    content = '🔄';
                                    cursorStyle = 'default';
                                  }
                                }

                                const cellKey = `${agent.id}-${dk}-${sc}`;
                                const isSaving = savingCells[cellKey];
                                
                                const currentTheme = localStorage.getItem('pontage_theme') || 'modern';
                                const modernCellThemes = ['modern', 'cyberpunk', 'dark-amoled', 'dark-forest'];
                                const isModernTheme = modernCellThemes.includes(currentTheme);

                                let pulseClass = '';
                                if (isModernTheme) {
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

                                return (
                                  <td
                                    key={dIdx}
                                    onClick={() => {
                                      if (!isValidRow && (!status || status === '')) return;
                                      if (agent.is_mutated && !agent.is_extra && !agent.is_releve) return;
                                      if (isMutated) {
                                        if (window.confirm("Voulez-vous supprimer cette mutation ?")) {
                                          handleCellClick(agent.id, dk, sc, status, '');
                                        }
                                      } else if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                        // Supplémentaires : toggle au clic
                                        if (status && status !== '') {
                                          // Déjà rempli → effacer
                                          handleCellClick(agent.id, dk, sc, status, '');
                                        } else {
                                          // Vide → mettre 1 par défaut (clic droit pour personnaliser)
                                          handleCellClick(agent.id, dk, sc, status, '1');
                                        }
                                      } else {
                                        handleCellClick(agent.id, dk, sc, status);
                                      }
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      if ((agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated) return;
                                      
                                      if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                                        // Clic droit sur SP → forcer saisie même si déjà rempli
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
                                      background: bgStyle,
                                      color: textStyle,
                                      cursor: (agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated ? 'default' : cursorStyle,
                                      borderRight: (sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.02)'),
                                      borderBottom: (sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border)'),
                                      fontWeight: status !== '' ? 'bold' : 'normal',
                                      opacity: isSaving ? 0.5 : 1
                                    }}
                                    title={isMutated ? `Muté vers ${status.substring(2)}` : `${agent.name} - ${sc} - ${dk}`}
                                  >
                                    {isSaving ? (
                                      <div style={{ width: '12px', height: '12px', border: '2px solid var(--b)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'rotate-bg 1s linear infinite', margin: '0 auto' }}></div>
                                    ) : (
                                      isModernTheme ? (
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
                                          <span style={{ fontSize: '0.8rem' }}>{content}</span>
                                        </div>
                                      )
                                    )}
                                  </td>
                                );
                              })}
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
              <div key={subsite.id} style={{ marginTop: '24px' }}>
                <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📍 {subsite.name}
                    <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '8px' }}>
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
                      <div key={agent.id} className="glass-panel" style={{ marginBottom: '24px', padding: '10px 10px', overflow: 'hidden' }}>
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
            <div key={subsite.id} className="glass-panel" style={{ marginTop: '24px', padding: '10px 10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: isMutatedGroup ? 'var(--c)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMutatedGroup ? '🔄' : '📍'} {subsite.name}
                  <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '8px' }}>
                    ({filteredAgents.length} agent(s))
                  </span>
                </h3>
                {!isMutatedGroup && (
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
                    <tbody>
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
          })}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAgent(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer l'agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal : Mutation Temporaire */}
      {showMutate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '8px' }}>Mutation Temporaire</h3>
            <p className="subtitle" style={{ marginBottom: '16px' }}>
              Muter l'agent <strong>{mutateAgentName}</strong> sur un autre site.
            </p>
            
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
            
            <form onSubmit={handleMutateSubmit}>
              <div className="form-group">
                <label className="form-label">Site de Destination</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: Agence Principale"
                  value={mutateDest}
                  onChange={(e) => setMutateDest(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Date Début</label>
                  <input
                    type="date"
                    className="form-input"
                    value={mutateStart}
                    onChange={(e) => setMutateStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={mutateEnd}
                    onChange={(e) => setMutateEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMutate(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider Mutation</button>
              </div>
            </form>
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
        let [y, m] = period.split('-').map(Number);
        m += 1; if (m > 12) { m = 1; y += 1; }
        const nextPeriod = `${y}-${String(m).padStart(2, '0')}`;
        const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        const currentMonthName = monthNames[Number(period.split('-')[1]) - 1];
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

      {showStats && <StatsPanel companyId={user?.company_id} onClose={() => setShowStats(false)} />}
      {showQR && <QRPointage onClose={() => setShowQR(false)} />}

    </div>
  );
}
