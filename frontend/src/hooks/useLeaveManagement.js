import { useState } from 'react';
import { apiCall } from '../api';

export function useLeaveManagement({
  siteData,
  setSiteData,
  leaves,
  setLeaves,
  cycleStart,
  period,
  setShowClosedMonthModal
}) {
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // --- Modal: Mise À Pied (MAP) ---
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapAgentId, setMapAgentId] = useState('');
  const [mapAgentName, setMapAgentName] = useState('');
  const [mapStartDate, setMapStartDate] = useState('');
  const [mapEndDate, setMapEndDate] = useState('');
  const [mapNavOffset, setMapNavOffset] = useState(0);
  const [mapManualDuration, setMapManualDuration] = useState('');
  const [editingMapLeaveId, setEditingMapLeaveId] = useState(null);

  // --- Modal: Maladie (M) ---
  const [showMaladieModal, setShowMaladieModal] = useState(false);
  const [maladieAgentId, setMaladieAgentId] = useState('');
  const [maladieAgentName, setMaladieAgentName] = useState('');
  const [maladieStartDate, setMaladieStartDate] = useState('');
  const [maladieEndDate, setMaladieEndDate] = useState('');
  const [maladieNavOffset, setMaladieNavOffset] = useState(0);
  const [maladieManualDuration, setMaladieManualDuration] = useState('');
  const [editingMaladieLeaveId, setEditingMaladieLeaveId] = useState(null);

  // --- Modal: Absence Injustifiée (A) ---
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceAgentId, setAbsenceAgentId] = useState('');
  const [absenceAgentName, setAbsenceAgentName] = useState('');
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceNavOffset, setAbsenceNavOffset] = useState(0);
  const [absenceManualDuration, setAbsenceManualDuration] = useState('');
  const [editingAbsenceLeaveId, setEditingAbsenceLeaveId] = useState(null);

  // --- Modal: Permission (P) ---
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionAgentId, setPermissionAgentId] = useState('');
  const [permissionAgentName, setPermissionAgentName] = useState('');
  const [permissionStartDate, setPermissionStartDate] = useState('');
  const [permissionEndDate, setPermissionEndDate] = useState('');
  const [permissionNavOffset, setPermissionNavOffset] = useState(0);
  const [permissionManualDuration, setPermissionManualDuration] = useState('');
  const [editingPermissionLeaveId, setEditingPermissionLeaveId] = useState(null);

  // --- Modal: Congés Payés (CP) ---
  const [showCpModal, setShowCpModal] = useState(false);
  const [cpAgentId, setCpAgentId] = useState('');
  const [cpAgentName, setCpAgentName] = useState('');
  const [cpStartDate, setCpStartDate] = useState('');
  const [cpEndDate, setCpEndDate] = useState('');
  const [cpNavOffset, setCpNavOffset] = useState(0);
  const [cpManualDuration, setCpManualDuration] = useState('');
  const [createNewCpMode, setCreateNewCpMode] = useState(false);
  const [editingCpLeaveId, setEditingCpLeaveId] = useState(null);

  // --- Modal: Avertissement de chevauchement ---
  const [overlapWarning, setOverlapWarning] = useState(null);

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

    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(mapAgentId));
    const shiftCodes = [];
    if (agent) {
      const stLow = agent.shift_type?.toLowerCase() || '';
      if (['jour', '12 j', '12h j'].includes(stLow)) shiftCodes.push('J');
      else if (['nuit', '12 n', '12h n'].includes(stLow)) shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = editingMapLeaveId
      ? leaves.find(l => l.id === editingMapLeaveId)
      : leaves.find(l => String(l.agent_id) === String(mapAgentId) && l.type === 'MAP' && l.start_date <= mapEndDate && l.end_date >= mapStartDate);

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
      let reposDayOfWeek = -1;
      const stypeLow = agent?.shift_type?.toLowerCase() || '';
      let cyclePattern = [];
      if (stypeLow === '24h') cyclePattern = ['1', 'R'];
      else if (stypeLow === '48h') cyclePattern = ['1', '1', 'R', 'R'];
      else if (stypeLow === '72h') cyclePattern = ['1', '1', '1', 'R', 'R', 'R'];

      let anchorDate = null;
      let anchorOffset = 0;

      if (agent && agent.attendance) {
        if (cyclePattern.length > 0) {
          const validAtts = agent.attendance.filter(a => {
            if (a.date >= existingLeave.start_date && a.date <= existingLeave.end_date) return false;
            return a.status === '1' || a.status === 'R';
          });
          
          const uniqueAttsMap = {};
          validAtts.forEach(a => { uniqueAttsMap[a.date] = a.status; });
          const sortedDates = Object.keys(uniqueAttsMap).sort();
          
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const dStr1 = sortedDates[i];
            const dStr2 = sortedDates[i+1];
            if (uniqueAttsMap[dStr1] === 'R' && uniqueAttsMap[dStr2] === '1') {
              const d1 = new Date(dStr1);
              const d2 = new Date(dStr2);
              if (Math.round((d2 - d1) / 86400000) === 1) {
                anchorDate = dStr2;
                anchorOffset = 0;
                break;
              }
            }
          }
          
          if (!anchorDate) {
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const dStr1 = sortedDates[i];
              const dStr2 = sortedDates[i+1];
              if (uniqueAttsMap[dStr1] === '1' && uniqueAttsMap[dStr2] === 'R') {
                const d1 = new Date(dStr1);
                const d2 = new Date(dStr2);
                if (Math.round((d2 - d1) / 86400000) === 1) {
                  anchorDate = dStr2;
                  anchorOffset = cyclePattern.indexOf('R');
                  break;
                }
              }
            }
          }
          
          if (!anchorDate && sortedDates.length > 0) {
            anchorDate = sortedDates[0];
            anchorOffset = cyclePattern.indexOf(uniqueAttsMap[anchorDate]);
          }
        } else {
          for (const att of agent.attendance) {
            if (att.status === 'R' && (att.date < existingLeave.start_date || att.date > existingLeave.end_date)) {
              reposDayOfWeek = new Date(att.date).getDay();
              break;
            }
          }
        }
      }

      let cursorStr = existingLeave.start_date;
      while (cursorStr <= existingLeave.end_date) {
        const [y, m, d] = cursorStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        let pMonth = m;
        let pYear = y;
        if (d >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          let restoreStatus = '1';
          if (anchorDate) {
             const aDate = new Date(anchorDate);
             const diffDays = Math.round((dateObj - aDate) / 86400000);
             let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
             if (newOffset < 0) newOffset += cyclePattern.length;
             restoreStatus = cyclePattern[newOffset];
          } else if (reposDayOfWeek !== -1 && dateObj.getDay() === reposDayOfWeek) {
            restoreStatus = 'R';
          }
          
          const existing = agent?.attendance?.find(a => a.date === cursorStr && a.shift_code === sc);
          if (existing && existing.status === 'MAP') {
            updates.push({ agent_id: mapAgentId, date: cursorStr, shift_code: sc, status: restoreStatus, period: properPeriod });
          }
        });
        
        dateObj.setDate(dateObj.getDate() + 1);
        cursorStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
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

      const isRotativeAgent = ['24h', '48h', '72h', '12h', '12h jour', '12h nuit', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
      shiftCodes.forEach(sc => {
        if (isRotativeAgent) {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus !== 'R') {
            updates.push({ agent_id: mapAgentId, date: dk, shift_code: sc, status: 'MAP', period: properPeriod });
          }
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
        setEditingMapLeaveId(null);
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(mapAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) {
                  if (upd.status === '') att.splice(idx, 1);
                  else att[idx].status = upd.status;
                } else if (upd.status !== '') {
                  att.push(upd);
                }
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

  const handleMaladieSubmit = async (forceOverride = false) => {
    if (!maladieStartDate || !maladieEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      return;
    }
    if (maladieStartDate > maladieEndDate) {
      alert('La date de début doit être avant la date de fin.');
      return;
    }
    const maladieEndPeriod = getCyclePeriodForDate(maladieEndDate);
    if (maladieEndPeriod < period) {
      setShowClosedMonthModal(true);
      return;
    }

    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(maladieAgentId));
    const shiftCodes = [];
    if (agent) {
      const stLow = agent.shift_type?.toLowerCase() || '';
      if (['jour', '12 j', '12h j'].includes(stLow)) shiftCodes.push('J');
      else if (['nuit', '12 n', '12h n'].includes(stLow)) shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = editingMaladieLeaveId
      ? leaves.find(l => l.id === editingMaladieLeaveId)
      : leaves.find(l => String(l.agent_id) === String(maladieAgentId) && l.type === 'M' && l.start_date <= maladieEndDate && l.end_date >= maladieStartDate);

    const overlaps = leaves.filter(l =>
      String(l.agent_id) === String(maladieAgentId) &&
      l.id !== existingLeave?.id &&
      l.start_date <= maladieEndDate && l.end_date >= maladieStartDate
    );

    if (!forceOverride && overlaps.length > 0) {
      const types = [...new Set(overlaps.map(l => l.type === 'CP' ? 'Congé Payé' : (l.type === 'MAP' ? 'Mise à Pied' : (l.type === 'M' ? 'Maladie' : 'Permission'))))].join(', ');
      setOverlapWarning({
        message: `Cette période chevauche déjà un(e) ou plusieurs ${types} pour cet agent.`,
        onConfirm: () => { setOverlapWarning(null); handleMaladieSubmit(true); }
      });
      return;
    }

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
            if (existing && ['P', 'MAP', 'M', 'CP', 'A'].includes(existing.status)) {
              oUpdates.push({ agent_id: ol.agent_id, date: dk, shift_code: sc, status: '', period: `${pY}-${String(pM).padStart(2, '0')}` });
            }
          });
          oCursor.setDate(oCursor.getDate() + 1);
        }
        if (oUpdates.length > 0) await apiCall('bulk_update_attendance', { updates: oUpdates });
      }
    }

    if (existingLeave) {
      let reposDayOfWeek = -1;
      const stypeLow = agent?.shift_type?.toLowerCase() || '';
      let cyclePattern = [];
      if (stypeLow === '24h') cyclePattern = ['1', 'R'];
      else if (stypeLow === '48h') cyclePattern = ['1', '1', 'R', 'R'];
      else if (stypeLow === '72h') cyclePattern = ['1', '1', '1', 'R', 'R', 'R'];

      let anchorDate = null;
      let anchorOffset = 0;

      if (agent && agent.attendance) {
        if (cyclePattern.length > 0) {
          const validAtts = agent.attendance.filter(a => {
            if (a.date >= existingLeave.start_date && a.date <= existingLeave.end_date) return false;
            return a.status === '1' || a.status === 'R';
          });
          
          const uniqueAttsMap = {};
          validAtts.forEach(a => { uniqueAttsMap[a.date] = a.status; });
          const sortedDates = Object.keys(uniqueAttsMap).sort();
          
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const dStr1 = sortedDates[i];
            const dStr2 = sortedDates[i+1];
            if (uniqueAttsMap[dStr1] === 'R' && uniqueAttsMap[dStr2] === '1') {
              const d1 = new Date(dStr1);
              const d2 = new Date(dStr2);
              if (Math.round((d2 - d1) / 86400000) === 1) {
                anchorDate = dStr2;
                anchorOffset = 0;
                break;
              }
            }
          }
          
          if (!anchorDate) {
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const dStr1 = sortedDates[i];
              const dStr2 = sortedDates[i+1];
              if (uniqueAttsMap[dStr1] === '1' && uniqueAttsMap[dStr2] === 'R') {
                const d1 = new Date(dStr1);
                const d2 = new Date(dStr2);
                if (Math.round((d2 - d1) / 86400000) === 1) {
                  anchorDate = dStr2;
                  anchorOffset = cyclePattern.indexOf('R');
                  break;
                }
              }
            }
          }
          
          if (!anchorDate && sortedDates.length > 0) {
            anchorDate = sortedDates[0];
            anchorOffset = cyclePattern.indexOf(uniqueAttsMap[anchorDate]);
          }
        } else {
          for (const att of agent.attendance) {
            if (att.status === 'R' && (att.date < existingLeave.start_date || att.date > existingLeave.end_date)) {
              reposDayOfWeek = new Date(att.date).getDay();
              break;
            }
          }
        }
      }

      let cursorStr = existingLeave.start_date;
      while (cursorStr <= existingLeave.end_date) {
        const [y, m, d] = cursorStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        let pMonth = m;
        let pYear = y;
        if (d >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          let restoreStatus = '1';
          if (anchorDate) {
             const aDate = new Date(anchorDate);
             const diffDays = Math.round((dateObj - aDate) / 86400000);
             let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
             if (newOffset < 0) newOffset += cyclePattern.length;
             restoreStatus = cyclePattern[newOffset];
          } else if (reposDayOfWeek !== -1 && dateObj.getDay() === reposDayOfWeek) {
            restoreStatus = 'R';
          }
          
          const existing = agent?.attendance?.find(a => a.date === cursorStr && a.shift_code === sc);
          if (existing && existing.status === 'M') {
            updates.push({ agent_id: maladieAgentId, date: cursorStr, shift_code: sc, status: restoreStatus, period: properPeriod });
          }
        });
        
        dateObj.setDate(dateObj.getDate() + 1);
        cursorStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      }
    }

    let cursor = new Date(maladieStartDate);
    const end = new Date(maladieEndDate);
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

      const isRotativeAgent = ['24h', '48h', '72h', '12h', '12h jour', '12h nuit', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
      shiftCodes.forEach(sc => {
        if (isRotativeAgent) {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus !== 'R') {
            updates.push({ agent_id: maladieAgentId, date: dk, shift_code: sc, status: 'M', period: properPeriod });
          }
        } else {
          updates.push({ agent_id: maladieAgentId, date: dk, shift_code: sc, status: 'M', period: properPeriod });
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
        agent_id: maladieAgentId,
        start_date: maladieStartDate,
        end_date: maladieEndDate,
        type: 'M',
        status: 'approved'
      };
      await apiCall('save_leave', { leave });

      const res = await apiCall('bulk_update_attendance', { updates: finalUpdates });
      if (res && res.success) {
        setShowMaladieModal(false);
        setEditingMaladieLeaveId(null);
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(maladieAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) {
                  if (upd.status === '') att.splice(idx, 1);
                  else att[idx].status = upd.status;
                } else if (upd.status !== '') {
                  att.push(upd);
                }
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

  const handleAbsenceSubmit = async (forceOverride = false) => {
    setIsSubmittingLeave(true);
    if (!absenceStartDate || !absenceEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      setIsSubmittingLeave(false);
      return;
    }
    if (absenceStartDate > absenceEndDate) {
      alert('La date de début doit être avant la date de fin.');
      setIsSubmittingLeave(false);
      return;
    }
    const absEndPeriod = getCyclePeriodForDate(absenceEndDate);
    if (absEndPeriod < period) {
      setShowClosedMonthModal(true);
      setIsSubmittingLeave(false);
      return;
    }

    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(absenceAgentId));
    const shiftCodes = [];
    if (agent) {
      const stLow = agent.shift_type?.toLowerCase() || '';
      if (['jour', '12 j', '12h j'].includes(stLow)) shiftCodes.push('J');
      else if (['nuit', '12 n', '12h n'].includes(stLow)) shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = editingAbsenceLeaveId
      ? leaves.find(l => l.id === editingAbsenceLeaveId)
      : null;

    const overlaps = leaves.filter(l =>
      String(l.agent_id) === String(absenceAgentId) &&
      l.id !== existingLeave?.id &&
      l.start_date <= absenceEndDate && l.end_date >= absenceStartDate
    );

    if (!forceOverride && overlaps.length > 0) {
      const types = [...new Set(overlaps.map(l => l.type === 'CP' ? 'Congé Payé' : (l.type === 'MAP' ? 'Mise à Pied' : (l.type === 'A' ? 'Absence Injustifiée' : 'Permission'))))].join(', ');
      setOverlapWarning({
        message: `Cette période chevauche déjà un(e) ou plusieurs ${types} pour cet agent.`,
        onConfirm: () => { handleAbsenceSubmit(true); }
      });
      setIsSubmittingLeave(false);
      return;
    }

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
            if (existing && ['P', 'MAP', 'M', 'CP', 'A'].includes(existing.status)) {
              oUpdates.push({ agent_id: ol.agent_id, date: dk, shift_code: sc, status: '', period: `${pY}-${String(pM).padStart(2, '0')}` });
            }
          });
          oCursor.setDate(oCursor.getDate() + 1);
        }
        if (oUpdates.length > 0) await apiCall('bulk_update_attendance', { updates: oUpdates });
      }
    }

    if (existingLeave) {
      let reposDayOfWeek = -1;
      const stypeLow = agent?.shift_type?.toLowerCase() || '';
      let cyclePattern = [];
      if (stypeLow === '24h') cyclePattern = ['1', 'R'];
      else if (stypeLow === '48h') cyclePattern = ['1', '1', 'R', 'R'];
      else if (stypeLow === '72h') cyclePattern = ['1', '1', '1', 'R', 'R', 'R'];

      let anchorDate = null;
      let anchorOffset = 0;

      if (agent && agent.attendance) {
        if (cyclePattern.length > 0) {
          const validAtts = agent.attendance.filter(a => {
            if (a.date >= existingLeave.start_date && a.date <= existingLeave.end_date) return false;
            return a.status === '1' || a.status === 'R';
          });
          
          const uniqueAttsMap = {};
          validAtts.forEach(a => { uniqueAttsMap[a.date] = a.status; });
          const sortedDates = Object.keys(uniqueAttsMap).sort();
          
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const dStr1 = sortedDates[i];
            const dStr2 = sortedDates[i+1];
            if (uniqueAttsMap[dStr1] === 'R' && uniqueAttsMap[dStr2] === '1') {
              const d1 = new Date(dStr1);
              const d2 = new Date(dStr2);
              if (Math.round((d2 - d1) / 86400000) === 1) {
                anchorDate = dStr2;
                anchorOffset = 0;
                break;
              }
            }
          }
          
          if (!anchorDate) {
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const dStr1 = sortedDates[i];
              const dStr2 = sortedDates[i+1];
              if (uniqueAttsMap[dStr1] === '1' && uniqueAttsMap[dStr2] === 'R') {
                const d1 = new Date(dStr1);
                const d2 = new Date(dStr2);
                if (Math.round((d2 - d1) / 86400000) === 1) {
                  anchorDate = dStr2;
                  anchorOffset = cyclePattern.indexOf('R');
                  break;
                }
              }
            }
          }
          
          if (!anchorDate && sortedDates.length > 0) {
            anchorDate = sortedDates[0];
            anchorOffset = cyclePattern.indexOf(uniqueAttsMap[anchorDate]);
          }
        } else {
          for (const att of agent.attendance) {
            if (att.status === 'R' && (att.date < existingLeave.start_date || att.date > existingLeave.end_date)) {
              reposDayOfWeek = new Date(att.date).getDay();
              break;
            }
          }
        }
      }

      let cursorStr = existingLeave.start_date;
      while (cursorStr <= existingLeave.end_date) {
        const [y, m, d] = cursorStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        let pMonth = m;
        let pYear = y;
        if (d >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          let restoreStatus = '1';
          if (anchorDate) {
             const aDate = new Date(anchorDate);
             const diffDays = Math.round((dateObj - aDate) / 86400000);
             let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
             if (newOffset < 0) newOffset += cyclePattern.length;
             restoreStatus = cyclePattern[newOffset];
          } else if (reposDayOfWeek !== -1 && dateObj.getDay() === reposDayOfWeek) {
            restoreStatus = 'R';
          }
          
          const existing = agent?.attendance?.find(a => a.date === cursorStr && a.shift_code === sc);
          if (existing && existing.status === 'A') {
            updates.push({ agent_id: absenceAgentId, date: cursorStr, shift_code: sc, status: restoreStatus, period: properPeriod });
          }
        });
        
        dateObj.setDate(dateObj.getDate() + 1);
        cursorStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      }
    }

    let cursor = new Date(absenceStartDate);
    const end = new Date(absenceEndDate);
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

      const isAbsRotative = ['24h', '48h', '72h', '12h', '12h jour', '12h nuit', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
      shiftCodes.forEach(sc => {
        if (isAbsRotative) {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus !== 'R') {
            updates.push({ agent_id: absenceAgentId, date: dk, shift_code: sc, status: 'A', period: properPeriod });
          }
        } else {
          updates.push({ agent_id: absenceAgentId, date: dk, shift_code: sc, status: 'A', period: properPeriod });
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
        agent_id: absenceAgentId,
        start_date: absenceStartDate,
        end_date: absenceEndDate,
        type: 'A',
        status: 'approved'
      };
      await apiCall('save_leave', { leave });

      const res = await apiCall('bulk_update_attendance', { updates: finalUpdates });
      if (res && res.success) {
        setShowAbsenceModal(false);
        setEditingAbsenceLeaveId(null);
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(absenceAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) {
                  if (upd.status === '') att.splice(idx, 1);
                  else att[idx].status = upd.status;
                } else if (upd.status !== '') {
                  att.push(upd);
                }
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
      console.error(e);
      alert("Erreur lors de l'enregistrement : " + e.message);
    } finally {
      setIsSubmittingLeave(false);
      setOverlapWarning(null);
    }
  };

  const handlePermissionSubmit = async (forceOverride = false) => {
    setIsSubmittingLeave(true);
    if (!permissionStartDate || !permissionEndDate) {
      alert('Veuillez sélectionner la date de début et la date de fin.');
      setIsSubmittingLeave(false);
      return;
    }
    if (permissionStartDate > permissionEndDate) {
      alert('La date de début doit être avant la date de fin.');
      setIsSubmittingLeave(false);
      return;
    }
    const permEndPeriod = getCyclePeriodForDate(permissionEndDate);
    if (permEndPeriod < period) {
      setShowClosedMonthModal(true);
      setIsSubmittingLeave(false);
      return;
    }
    const agent = siteData.flatMap(s => s.agents || []).find(a => a && String(a.id) === String(permissionAgentId));
    const shiftCodes = [];
    if (agent) {
      const stLow = agent.shift_type?.toLowerCase() || '';
      if (['jour', '12 j', '12h j'].includes(stLow)) shiftCodes.push('J');
      else if (['nuit', '12 n', '12h n'].includes(stLow)) shiftCodes.push('N');
      else { shiftCodes.push('J'); shiftCodes.push('N'); }
    } else {
      shiftCodes.push('J');
    }

    const updates = [];
    const existingLeave = editingPermissionLeaveId
      ? leaves.find(l => l.id === editingPermissionLeaveId)
      : leaves.find(l => String(l.agent_id) === String(permissionAgentId) && l.type === 'P' && l.start_date <= permissionEndDate && l.end_date >= permissionStartDate);

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
      setIsSubmittingLeave(false);
      return;
    }

    if (forceOverride && overlaps.length > 0) {
      for (const ol of overlaps) {
        await apiCall('delete_leave', { leave_id: ol.id });
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

    if (existingLeave) {
      let reposDayOfWeek = -1;
      const stypeLow = agent?.shift_type?.toLowerCase() || '';
      let cyclePattern = [];
      if (stypeLow === '24h') cyclePattern = ['1', 'R'];
      else if (stypeLow === '48h') cyclePattern = ['1', '1', 'R', 'R'];
      else if (stypeLow === '72h') cyclePattern = ['1', '1', '1', 'R', 'R', 'R'];

      let anchorDate = null;
      let anchorOffset = 0;

      if (agent && agent.attendance) {
        if (cyclePattern.length > 0) {
          const validAtts = agent.attendance.filter(a => {
            if (a.date >= existingLeave.start_date && a.date <= existingLeave.end_date) return false;
            return a.status === '1' || a.status === 'R';
          });
          
          const uniqueAttsMap = {};
          validAtts.forEach(a => { uniqueAttsMap[a.date] = a.status; });
          const sortedDates = Object.keys(uniqueAttsMap).sort();
          
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const dStr1 = sortedDates[i];
            const dStr2 = sortedDates[i+1];
            if (uniqueAttsMap[dStr1] === 'R' && uniqueAttsMap[dStr2] === '1') {
              const d1 = new Date(dStr1);
              const d2 = new Date(dStr2);
              if (Math.round((d2 - d1) / 86400000) === 1) {
                anchorDate = dStr2;
                anchorOffset = 0;
                break;
              }
            }
          }
          
          if (!anchorDate) {
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const dStr1 = sortedDates[i];
              const dStr2 = sortedDates[i+1];
              if (uniqueAttsMap[dStr1] === '1' && uniqueAttsMap[dStr2] === 'R') {
                const d1 = new Date(dStr1);
                const d2 = new Date(dStr2);
                if (Math.round((d2 - d1) / 86400000) === 1) {
                  anchorDate = dStr2;
                  anchorOffset = cyclePattern.indexOf('R');
                  break;
                }
              }
            }
          }
          
          if (!anchorDate && sortedDates.length > 0) {
            anchorDate = sortedDates[0];
            anchorOffset = cyclePattern.indexOf(uniqueAttsMap[anchorDate]);
          }
        } else {
          for (const att of agent.attendance) {
            if (att.status === 'R' && (att.date < existingLeave.start_date || att.date > existingLeave.end_date)) {
              reposDayOfWeek = new Date(att.date).getDay();
              break;
            }
          }
        }
      }

      let cursorStr = existingLeave.start_date;
      while (cursorStr <= existingLeave.end_date) {
        const [y, m, d] = cursorStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        let pMonth = m;
        let pYear = y;
        if (d >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          let restoreStatus = '1';
          if (anchorDate) {
             const aDate = new Date(anchorDate);
             const diffDays = Math.round((dateObj - aDate) / 86400000);
             let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
             if (newOffset < 0) newOffset += cyclePattern.length;
             restoreStatus = cyclePattern[newOffset];
          } else if (reposDayOfWeek !== -1 && dateObj.getDay() === reposDayOfWeek) {
            restoreStatus = 'R';
          }
          
          const existing = agent?.attendance?.find(a => a.date === cursorStr && a.shift_code === sc);
          if (existing && existing.status === 'P') {
            updates.push({ agent_id: permissionAgentId, date: cursorStr, shift_code: sc, status: restoreStatus, period: properPeriod });
          }
        });
        
        dateObj.setDate(dateObj.getDate() + 1);
        cursorStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
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

      const isPermRotative = ['24h', '48h', '72h', '12h', '12h jour', '12h nuit', 'jour', 'nuit'].includes(agent?.shift_type?.toLowerCase());
      shiftCodes.forEach(sc => {
        if (isPermRotative) {
          const existing = agent?.attendance?.find(a => a.date === dk && a.shift_code === sc);
          const currentStatus = existing ? existing.status : '';
          if (currentStatus !== 'R') {
            updates.push({ agent_id: permissionAgentId, date: dk, shift_code: sc, status: 'P', period: properPeriod });
          }
        } else {
          updates.push({ agent_id: permissionAgentId, date: dk, shift_code: sc, status: 'P', period: properPeriod });
        }
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const finalUpdatesMap = {};
    updates.forEach(u => {
      finalUpdatesMap[`${u.date}_${u.shift_code}`] = u;
    });
    const finalUpdates = Object.values(finalUpdatesMap);

    if (finalUpdates.length === 0) {
      alert('Erreur: Aucun jour à mettre à jour. (Dates inversées ou bug?)');
      setIsSubmittingLeave(false);
      return;
    }
    try {
      const leave = {
        id: existingLeave ? existingLeave.id : ('leave_' + Date.now()),
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
        setEditingPermissionLeaveId(null);
        setIsSubmittingLeave(false); // On arrête le spinner immédiatement
        
        // Yield to browser event loop pour laisser le modal se fermer avant le lourd re-render du tableau
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setSiteData(prev => prev.map(sub => ({
          ...sub,
          agents: sub.agents?.map(ag => {
            if (String(ag.id) === String(permissionAgentId)) {
              const att = [...(ag.attendance || [])];
              finalUpdates.forEach(upd => {
                const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
                if (idx >= 0) {
                  if (upd.status === '') att.splice(idx, 1);
                  else att[idx].status = upd.status;
                } else if (upd.status !== '') {
                  att.push(upd);
                }
              });
              return { ...ag, attendance: att };
            }
            return ag;
          })
        })));
        // Optimisation: Mise à jour locale sans appel réseau
        setLeaves(prev => {
          const newLeaves = prev.filter(l => l.id !== leave.id);
          newLeaves.push(leave);
          return newLeaves;
        });
      } else {
        alert('❌ Erreur: ' + (res?.message || 'Réponse inattendue'));
      }
    } catch (e) {
      alert('❌ Erreur réseau ou serveur');
    } finally {
      setIsSubmittingLeave(false);
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
      const existingLeave = editingCpLeaveId
        ? leaves.find(l => l.id === editingCpLeaveId)
        : leaves.find(l => String(l.agent_id) === String(cpAgentId) && l.type === 'CP');

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
        setEditingCpLeaveId(null);
        
        // Fetch full data to sync
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

  const handleDeleteLeave = async (leave) => {
    if (!leave) return;
    try {
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

      let reposDayOfWeek = -1;
      const stypeLow = agent?.shift_type?.toLowerCase() || '';
      let cyclePattern = [];
      if (stypeLow === '24h') cyclePattern = ['1', 'R'];
      else if (stypeLow === '48h') cyclePattern = ['1', '1', 'R', 'R'];
      else if (stypeLow === '72h') cyclePattern = ['1', '1', '1', 'R', 'R', 'R'];

      let anchorDate = null;
      let anchorOffset = 0;

      if (agent && agent.attendance) {
        const leaveStart = leave.start_date;
        const leaveEnd = leave.end_date;
        
        if (cyclePattern.length > 0) {
          const validAtts = agent.attendance.filter(a => {
            if (a.date >= leaveStart && a.date <= leaveEnd) return false;
            return a.status === '1' || a.status === 'R';
          });
          
          const uniqueAttsMap = {};
          validAtts.forEach(a => { uniqueAttsMap[a.date] = a.status; });
          const sortedDates = Object.keys(uniqueAttsMap).sort();
          
          for (let i = 0; i < sortedDates.length - 1; i++) {
            const dStr1 = sortedDates[i];
            const dStr2 = sortedDates[i+1];
            if (uniqueAttsMap[dStr1] === 'R' && uniqueAttsMap[dStr2] === '1') {
              const d1 = new Date(dStr1);
              const d2 = new Date(dStr2);
              if (Math.round((d2 - d1) / 86400000) === 1) {
                anchorDate = dStr2;
                anchorOffset = 0;
                break;
              }
            }
          }
          
          if (!anchorDate) {
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const dStr1 = sortedDates[i];
              const dStr2 = sortedDates[i+1];
              if (uniqueAttsMap[dStr1] === '1' && uniqueAttsMap[dStr2] === 'R') {
                const d1 = new Date(dStr1);
                const d2 = new Date(dStr2);
                if (Math.round((d2 - d1) / 86400000) === 1) {
                  anchorDate = dStr2;
                  anchorOffset = cyclePattern.indexOf('R');
                  break;
                }
              }
            }
          }
          
          if (!anchorDate && sortedDates.length > 0) {
            anchorDate = sortedDates[0];
            anchorOffset = cyclePattern.indexOf(uniqueAttsMap[anchorDate]);
          }
        } else {
          // Standard weekly rest day logic
          for (const att of agent.attendance) {
            if (att.status === 'R' && (att.date < leaveStart || att.date > leaveEnd)) {
              const d = new Date(att.date);
              reposDayOfWeek = d.getDay(); 
              break;
            }
          }
        }
      }

      const updates = [];
      let cursorStr = leave.start_date;
      while (cursorStr <= leave.end_date) {
        const [y, m, d] = cursorStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        let pMonth = m;
        let pYear = y;
        if (d >= cycleStart) {
          pMonth += 1;
          if (pMonth > 12) {
            pMonth = 1;
            pYear += 1;
          }
        }
        const properPeriod = `${pYear}-${String(pMonth).padStart(2, '0')}`;

        shiftCodes.forEach(sc => {
          let restoreStatus = '1';
          if (anchorDate) {
             const aDate = new Date(anchorDate);
             const diffDays = Math.round((dateObj - aDate) / 86400000);
             let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
             if (newOffset < 0) newOffset += cyclePattern.length;
             restoreStatus = cyclePattern[newOffset];
          } else if (reposDayOfWeek !== -1 && dateObj.getDay() === reposDayOfWeek) {
            restoreStatus = 'R';
          }
          
          const existing = agent?.attendance?.find(a => a.date === cursorStr && a.shift_code === sc);
          if (existing && existing.status === 'R') {
            restoreStatus = 'R';
          }
          
          updates.push({ agent_id: leave.agent_id, date: cursorStr, shift_code: sc, status: restoreStatus, period: properPeriod });
        });
        
        dateObj.setDate(dateObj.getDate() + 1);
        cursorStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      }

      await apiCall('delete_leave', { leave_id: leave.id });
      if (updates.length > 0) {
        await apiCall('bulk_update_attendance', { updates });
      }

      setLeaves(prev => prev.filter(l => l.id !== leave.id));
      setSiteData(prev => prev.map(sub => ({
        ...sub,
        agents: sub.agents?.map(ag => {
          if (String(ag.id) === String(leave.agent_id)) {
            const att = [...(ag.attendance || [])];
            updates.forEach(upd => {
              const idx = att.findIndex(a => a.date === upd.date && a.shift_code === upd.shift_code);
              if (idx >= 0) {
                att[idx].status = upd.status;
              } else {
                att.push({ ...upd });
              }
            });
            
            // Safety net: force clear any lingering statuses for this leave range
            att.forEach(a => {
              if (a.date >= leave.start_date && a.date <= leave.end_date && ['P', 'MAP', 'M', 'CP', 'AT'].includes(a.status)) {
                 const [y, m, d] = a.date.split('-').map(Number);
                 const dObj = new Date(y, m - 1, d);
                 
                 let safeRestore = '1';
                 if (anchorDate) {
                    const aDate = new Date(anchorDate);
                    const diffDays = Math.round((dObj - aDate) / 86400000);
                    let newOffset = (anchorOffset + diffDays) % cyclePattern.length;
                    if (newOffset < 0) newOffset += cyclePattern.length;
                    safeRestore = cyclePattern[newOffset];
                 } else if (reposDayOfWeek !== -1 && dObj.getDay() === reposDayOfWeek) {
                    safeRestore = 'R';
                 }
                 a.status = safeRestore;
                 
                 // Also ensure this makes it to updates so the DB matches the safety net
                 const [pY, pM] = a.date.split('-');
                 const period = `${pY}-${pM}`;
                 if (!updates.some(u => u.date === a.date && u.shift_code === a.shift_code)) {
                   updates.push({ agent_id: leave.agent_id, date: a.date, shift_code: a.shift_code, status: a.status, period: period });
                 }
              }
            });
            
            return { ...ag, attendance: att };
          }
          return ag;
        })
      })));
    } catch (e) {
      alert("Erreur lors de la suppression : " + e.message);
    }
  };

  return {
    mapState: {
      showMapModal, mapAgentId, mapAgentName, mapStartDate, mapEndDate, mapNavOffset, mapManualDuration, editingMapLeaveId
    },
    mapActions: {
      setShowMapModal, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setEditingMapLeaveId, handleMapSubmit
    },
    maladieState: {
      showMaladieModal, maladieAgentId, maladieAgentName, maladieStartDate, maladieEndDate, maladieNavOffset, maladieManualDuration, editingMaladieLeaveId
    },
    maladieActions: {
      setShowMaladieModal, setMaladieAgentId, setMaladieAgentName, setMaladieStartDate, setMaladieEndDate, setMaladieNavOffset, setMaladieManualDuration, setEditingMaladieLeaveId, handleMaladieSubmit
    },
    absenceState: {
      showAbsenceModal, absenceAgentId, absenceAgentName, absenceStartDate, absenceEndDate, absenceNavOffset, absenceManualDuration, editingAbsenceLeaveId, isSubmittingLeave
    },
    absenceActions: {
      setShowAbsenceModal, setAbsenceAgentId, setAbsenceAgentName, setAbsenceStartDate, setAbsenceEndDate, setAbsenceNavOffset, setAbsenceManualDuration, setEditingAbsenceLeaveId, handleAbsenceSubmit
    },
    permissionState: {
      showPermissionModal, permissionAgentId, permissionAgentName, permissionStartDate, permissionEndDate, permissionNavOffset, permissionManualDuration, editingPermissionLeaveId
    },
    permissionActions: {
      setShowPermissionModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setPermissionNavOffset, setPermissionManualDuration, setEditingPermissionLeaveId, handlePermissionSubmit
    },
    cpState: {
      showCpModal, cpAgentId, cpAgentName, cpStartDate, cpEndDate, cpNavOffset, cpManualDuration, createNewCpMode, editingCpLeaveId
    },
    cpActions: {
      setShowCpModal, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setCpNavOffset, setCpManualDuration, setCreateNewCpMode, setEditingCpLeaveId, handleCpSubmit
    },
    overlapWarning,
    setOverlapWarning,
    handleDeleteLeave
  };
}
