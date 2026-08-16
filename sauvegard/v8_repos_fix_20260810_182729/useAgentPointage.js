import { useState, useRef, useEffect } from 'react';
import { apiCall } from '../api';

export function useAgentPointage({
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
}) {
  const [savingCells, setSavingCells] = useState({});
  const actionHistory = useRef([]);
  const historyIndex = useRef(-1);
  // AbortControllers pour annuler les requêtes en cours si un nouveau clic arrive
  const abortControllers = useRef({});

  const [reposMenu, setReposMenu] = useState(null);
  const [reposSegmentSelection, setReposSegmentSelection] = useState(null);
  const [reposConfirmData, setReposConfirmData] = useState(null);

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
              updatedAttendance.push({ date: action.dateKey, shift_code: action.shiftCode, status: targetStatus });
            }
            return { ...agent, attendance: updatedAttendance };
          })
        };
      });
    });

    try {
      await apiCall('update_attendance', {
        agent_id: action.agentId,
        date: action.dateKey,
        shift_code: action.shiftCode,
        status: targetStatus,
        period
      });
    } catch (e) {
      loadSiteData();
    }
  };

  const handleUndo = async () => {
    if (historyIndex.current < 0) return;
    const action = actionHistory.current[historyIndex.current];
    historyIndex.current--;
    await applyHistoryAction(action, action.oldStatus);
  };

  const handleRedo = async () => {
    if (historyIndex.current >= actionHistory.current.length - 1) return;
    historyIndex.current++;
    const action = actionHistory.current[historyIndex.current];
    await applyHistoryAction(action, action.newStatus);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
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
    // Si une sauvegarde est déjà en cours sur cette cellule,
    // on annule la requête précédente et on continue immédiatement
    const cellKeyEarly = `${agentId}-${dateKey}-${shiftCode}`;
    if (abortControllers.current[cellKeyEarly]) {
      abortControllers.current[cellKeyEarly].abort();
      delete abortControllers.current[cellKeyEarly];
      setSavingCells(prev => {
        const next = { ...prev };
        delete next[cellKeyEarly];
        return next;
      });
    }

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
    // Créer un nouveau AbortController pour cette requête
    const controller = new AbortController();
    abortControllers.current[cellKey] = controller;
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
      }, 'POST', controller.signal);
      // Si la requête a été annulée (nouveau clic arrivé), on ignore le résultat
      if (res.aborted) return;
      if (!res.success) {
        if (res.period_locked) {
          // La période est verrouillée : annuler la modification optimiste et notifier
          showPeriodLockedToast(getPeriodLabel());
        }
        // En cas d'échec (lock ou autre), recharger les données réelles
        loadSiteData();
      }
    } catch (e) {
      if (e.name !== 'AbortError') loadSiteData();
    } finally {
      // Nettoyer le controller et le flag de sauvegarde
      delete abortControllers.current[cellKey];
      setSavingCells(prev => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
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


  return {
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
  };
}
