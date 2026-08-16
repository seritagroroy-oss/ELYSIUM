import React from 'react';
import { apiCall } from '../../api';
import { Trash, Edit, Check, X, AlertTriangle, ArrowLeftRight, Clock, HelpCircle, Save, Loader2, ChevronLeft, ChevronRight, Star, TrendingUp, Shield, ShieldAlert, Users, ChevronDown, Printer, RotateCcw, Briefcase, Search, Settings, Edit2, ExternalLink, CalendarDays } from 'lucide-react';
import ContextMenu from '../ui/ContextMenu';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DroppableZone = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ border: isOver ? '2px dashed rgba(56, 189, 248, 0.6)' : '2px solid transparent', borderRadius: '12px', transition: 'all 0.2s', margin: '-2px' }}>
      {children}
    </div>
  );
};

const DraggableAgentRow = ({ agent, subsiteId, scIdx, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: scIdx === 0 ? agent.id : `${agent.id}-sub-${scIdx}`,
    data: { agent, subsiteId },
    disabled: scIdx !== 0, // Only the main row is draggable
  });

  const style = scIdx === 0 && transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 9999 : undefined,
  } : undefined;

  return children({
    setNodeRef: scIdx === 0 ? setNodeRef : undefined,
    listeners: scIdx === 0 ? listeners : undefined,
    attributes: scIdx === 0 ? attributes : undefined,
    style
  });
};

export default function DashboardTable({
  highlightedAgentId, setHighlightedAgentId,
  siteData, datesList, period, activeSiteId, isArchiveMode, isVerificationMode, searchTerm, filterShiftType, filterFunction, filterShowOnlyAbsences, zoneSortOrder, agentSortOrder, agentSpacingMode, agentTableMode, costumeModes, setCostumeModes, functionModes, setFunctionModes, leaves, functions, selectionStart, selectionEnd, isSelecting, setIsSelecting, setSelectionStart, setSelectionEnd, selectedCell, setSelectedCell, handleCellClick, setContextMenu, setCellContextMenu, setSupplModal, setReposMenu, setSelectedKpiAgent, setShowKPICards, handleMouseEnterCell, handleMouseLeaveCell, isDraggingRef, cellContextMenu, isEditMode, lockedAbsences, setLockedAbsences, lockedMaps, setLockedMaps, lockedPermissions, setLockedPermissions, setCpAgentId, setCpAgentName, setCpStartDate, setCpEndDate, setShowCpModal, setCpInfoModal, setScheduleModalAgent, handleUpdateAgentField, handleClearAgentMutations, handleDeleteAgent, setFunctionModalAgent, setShiftModalAgent, setShiftModalType, setShowCustomRotation, setStatusChangeInfoModal, handleValidationSelect, openDeployExtraModal, openDeployReleveModal, requireEditMode, getDayLabel, formatDateKey, getPeriodLabel, sites, subsite, setZoneConfigModalData, handleRenameSubsite, handleDeleteSubsite, activeSiteName, setTransferModal, setReleveSupplModal, setPermissionDetailsModal, isSaving, paintModeActive, paintStatus, siteTableModes, isModernTheme, lockedSp, setLockedSp, savingCells, openMutateModal, setShowShiftChangeMenu, setShiftChangeDate, setShiftChangeNewType, setMapAgentId, setMapAgentName, setMapStartDate, setMapEndDate, setMapNavOffset, setMapManualDuration, setShowMapModal, setPermissionAgentId, setPermissionAgentName, setPermissionStartDate, setPermissionEndDate, setShowPermissionModal, setEntrantAgentId, setEntrantAgentName, setEntrantDate, setShowEntrantModal, setSortantAgentId, setSortantAgentName, setSortantDate, setShowSortantModal, handleContextMenuAction
  , enableAnimations, setEnableAnimations, clipboardWeek, setClipboardWeek, pasteConfirmModal, setPasteConfirmModal, handleCopyWeek, handlePasteWeek, handleConfirmPaste, cancelPaste, isZenMode, setIsZenMode, statsCardScale, setStatsCardScale, showAgentCountHover
  , setShowTransferDetailsModal, setTransferDetailsData, setExternalSuppModal, setExternalSuppDetailsModal, setMoveZoneAgent, setShiftChangeInfoModal
}) {
  // Helper to resolve site/subsite names
  const resolveSiteName = (destId) => {
    if (!destId) return '';
    let destLabel = destId;
    if (sites) {
      sites.forEach(s => {
        const sId = String(s.id).toLowerCase();
        const searchId = String(destId).toLowerCase();
        if (sId === searchId || searchId === `default_${sId}` || searchId === `default_${sId}_1`) {
          destLabel = s.name;
        }
        if (s.subsites) {
          s.subsites.forEach(sub => {
            if (String(sub.id).toLowerCase() === searchId) {
              destLabel = sub.name === 'Zone Principale' ? s.name : `${s.name} / ${sub.name}`;
            }
          });
        }
      });
    }
    return destLabel;
  };

  const [visibleCounts, setVisibleCounts] = React.useState({});
  const [treatedAgents, setTreatedAgents] = React.useState({});
  const [toggledRelvCells, setToggledRelvCells] = React.useState({});

  const isInitialTreatedMount = React.useRef(true);
  const currentTreatedKey = React.useRef("");

  React.useEffect(() => {
    if (activeSiteId && period) {
      const newKey = `pontage_treated_${period}_${activeSiteId}`;
      currentTreatedKey.current = newKey;
      try {
        const stored = localStorage.getItem(newKey);
        if (stored) {
          setTreatedAgents(JSON.parse(stored));
        } else {
          setTreatedAgents({});
        }
      } catch (e) {
        setTreatedAgents({});
      }

      apiCall('get_treated_agents', { site_id: activeSiteId, period }, 'GET')
        .then(res => {
          if (res && res.success && res.treated_agents) {
            setTreatedAgents(res.treated_agents);
            try {
              localStorage.setItem(newKey, JSON.stringify(res.treated_agents));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, [period, activeSiteId]);

  const [cellTextSize, setCellTextSize] = React.useState(() => localStorage.getItem('pontage_cell_text_size') || 'medium');
  const [tableHeaderBg, setTableHeaderBg] = React.useState(() => localStorage.getItem('pontage_table_header_bg') || '#0b1220');

  React.useEffect(() => {
    // Inject pulse highlight CSS
    if (!document.getElementById('pulse-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-highlight-style';
      style.innerHTML = `
        @keyframes pulseHighlight { 
          0% { background-color: rgba(56, 189, 248, 0.4); } 
          50% { background-color: rgba(56, 189, 248, 0); } 
          100% { background-color: rgba(56, 189, 248, 0.4); } 
        } 
        .pulse-highlight { 
          animation: pulseHighlight 1s ease-in-out 3; 
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  React.useEffect(() => {
    const handleSizeChange = () => {
      setCellTextSize(localStorage.getItem('pontage_cell_text_size') || 'medium');
    };
    const handleBgChange = () => {
      setTableHeaderBg(localStorage.getItem('pontage_table_header_bg') || '#0b1220');
    };
    window.addEventListener('pontage_cell_text_size_changed', handleSizeChange);
    window.addEventListener('pontage_table_header_bg_changed', handleBgChange);
    return () => {
      window.removeEventListener('pontage_cell_text_size_changed', handleSizeChange);
      window.removeEventListener('pontage_table_header_bg_changed', handleBgChange);
    };
  }, []);

  React.useEffect(() => {
    if (highlightedAgentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`agent-row-${highlightedAgentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Forcer le redéclenchement de l'animation CSS
          el.classList.remove('pulse-highlight');
          void el.offsetWidth; // trigger reflow
          el.classList.add('pulse-highlight');
          
          setTimeout(() => {
            if (el) el.classList.remove('pulse-highlight');
          }, 3000);
          
          setHighlightedAgentId(null);
        }
      }, 150); // Petit délai pour laisser React faire le rendu
      return () => clearTimeout(timer);
    }
  }, [highlightedAgentId, setHighlightedAgentId, siteData]);
  

  React.useEffect(() => {
    setVisibleCounts({});
  }, [searchTerm, filterShiftType, filterFunction, filterShowOnlyAbsences]);

  React.useEffect(() => {
    let timeout;
    const processChunks = () => {
       setVisibleCounts(prev => {
          const next = { ...prev };
          let changed = false;
          (siteData || []).filter(Boolean).forEach(site => {
             const total = site.agents ? site.agents.length : 0;
             const current = next[site.id] || 30;
             if (current < total) {
                next[site.id] = current + 50;
                changed = true;
             }
          });
          if (changed) {
             timeout = setTimeout(processChunks, 100);
             return next;
          }
          return prev;
       });
    };
    timeout = setTimeout(processChunks, 100);
    return () => clearTimeout(timeout);
  }, [siteData, searchTerm, filterShiftType, filterFunction, filterShowOnlyAbsences]);

  return (
    <>
      {(() => {
        let globalRowIdx = 0;

        let processedSiteData = siteData.filter(Boolean);

        const sortedSiteData = [...processedSiteData].sort((a, b) => {
          if (searchTerm && searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            const hasMatchA = (a.agents || []).some(ag => ag.name.toLowerCase().includes(searchLower));
            const hasMatchB = (b.agents || []).some(ag => ag.name.toLowerCase().includes(searchLower));
            
            if (hasMatchA && !hasMatchB) return -1;
            if (!hasMatchA && hasMatchB) return 1;
          }

          if (zoneSortOrder === 'none') return 0;
          if (zoneSortOrder === 'alpha_asc') return (a.name || '').localeCompare(b.name || '');
          if (zoneSortOrder === 'alpha_desc') return (b.name || '').localeCompare(a.name || '');
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          if (zoneSortOrder === 'created_desc') return idB - idA;
          return idA - idB; // 'created_asc'
        });

        return sortedSiteData.map(subsite => {
          if (!subsite) return null;
          const isMutatedGroup = subsite.id ? String(subsite.id).startsWith('mutated_') : false;
          const allFilteredAgents = (subsite.agents || []).filter(a => {
            const matchName = a.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchShift = filterShiftType === 'ALL' || a.shift_type === filterShiftType;
            const matchFunc = filterFunction === 'ALL' || String(a.function_id) === String(filterFunction);
            let matchAbsence = true;
            if (filterShowOnlyAbsences) {
              const hasAbsence = (a.attendance || []).some(att => att.status === 'A');
              matchAbsence = hasAbsence;
            }
            return matchName && matchShift && matchFunc && matchAbsence;
          }).sort((a, b) => {
            // Group by type first so headers don't break during sorting
            const getRank = (ag) => {
              if (ag.is_releve) return 4;
              if (ag.is_extra) return 3;
              if (ag.is_mutated) return 2;
              return 1;
            };
            const rankA = getRank(a);
            const rankB = getRank(b);
            if (rankA !== rankB) return rankA - rankB;

            if (agentSortOrder === 'none') return String(a.id).localeCompare(String(b.id)); // Tri stable par ID (évite le saut de ligne lors des mises à jour)
            if (agentSortOrder === 'alpha_asc') return a.name.localeCompare(b.name);
            if (agentSortOrder === 'alpha_desc') return b.name.localeCompare(a.name);
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            if (agentSortOrder === 'created_desc') return idB - idA;
            return idA - idB; // 'created_asc'
          });
          
          const currentLimit = visibleCounts[subsite.id] || 30;
          const filteredAgents = allFilteredAgents.slice(0, currentLimit);
          const baseTextSize = cellTextSize === 'small' ? '0.8rem' : (cellTextSize === 'large' ? '1.1rem' : '0.95rem');

          const isExtrasSite = activeSiteId === 'site_extras';
          const isRelevesSite = activeSiteId === 'site_releves';
          const isAdminSite = activeSiteId === 'site_administration';

          const tableWidthPx = (!isVerificationMode && !isArchiveMode ? 380 : 335) + (datesList.length * 32);

          const renderTableHeader = () => (
            <thead>
              <tr>
                <th style={{ width: '250px', minWidth: '250px', maxWidth: '250px', position: 'sticky', left: 0, background: tableHeaderBg, zIndex: 50, textAlign: 'center' }}>Noms & Prénoms</th>
                <th style={{ width: '65px', minWidth: '65px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', position: 'sticky', left: '250px', background: tableHeaderBg, zIndex: 50 }}>Fonction</th>
                {!isVerificationMode && !isArchiveMode && <th style={{ width: '45px', minWidth: '45px', maxWidth: '45px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', position: 'sticky', left: '315px', background: tableHeaderBg, zIndex: 50 }}>VAC</th>}
                <th style={{ width: '20px', minWidth: '20px', maxWidth: '20px', position: 'sticky', left: (!isVerificationMode && !isArchiveMode) ? '360px' : '315px', background: tableHeaderBg, zIndex: 50, padding: '4px 0', fontSize: '0.6rem' }}>Type</th>
                {datesList.map((d, i) => {
                  const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const isDragSelectingCol = selectionStart && selectionEnd && i >= Math.min(selectionStart.c, selectionEnd.c) && i <= Math.max(selectionStart.c, selectionEnd.c);
                  const isColumnHeaderSelected = (selectedCell && selectedCell.dateKey === dk && selectedCell.agentId === null) || isDragSelectingCol;
                  const isToday = formatDateKey(d) === formatDateKey(new Date());
                  return (
                    <th
                      key={dk}
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
                        background: isColumnHeaderSelected ? '#1e2b4d' : tableHeaderBg,
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

          const renderAgentRows = (agent, agentIdx) => {
            if (!agent) return null;
            // Construire la map d'attendance
            const attMap = {};
            (agent.attendance || []).forEach(att => {
              if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
              attMap[att.shift_code][att.date] = att.status;
            });

            const isRotative = ['24h', '48h', '72h'].includes(agent.shift_type);
            const isNight = agent.shift_type && ['nuit', '12 n', '12h n'].includes(agent.shift_type.toLowerCase());
            const primaryShift = isNight ? 'N' : 'J';
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
              const spMode = Number(agent.has_sp);
              if (spMode === 2) {
                if (!shiftRows.includes('SJ')) shiftRows.push('SJ');
                if (!shiftRows.includes('SN')) shiftRows.push('SN');
              } else if (spMode === 1 || agent.has_sp === true || agent.has_sp === '1') {
                if (!shiftRows.includes('S')) shiftRows.push('S');
              }
            }

            if (agent.is_mutated || agent.is_extra || agent.is_releve) {
              shiftRows = shiftRows.filter(r => {
                return agent.attendance?.some(a => a.shift_code === r && a.status && a.status.trim() !== '');
              });
            }

            // 3. Trier les lignes dans le bon ordre d'affichage
            const order = { 'J': 1, 'N': 2, 'S': 3, 'SJ': 4, 'SN': 5 };
            shiftRows.sort((a, b) => order[a] - order[b]);

            let totalA = 0;
            let totalSP = 0;
            let totalMAP = 0;
            let totalEntrant = 0;
            let totalCost = 0;
            let totalDynamicFunc = 0;
            let funcCounts = {};
            let totalSpecialExtra = 0; // Jours hors planning TP avec présence manuelle ajoutée
            
            const agentCpLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id) && l.type === 'CP');
            const sortedCpLeaves = [...agentCpLeaves].sort((a, b) => a.start_date.localeCompare(b.start_date));
            const agentCpLeaveInPeriod = sortedCpLeaves.find(l => {
              if (!datesList || datesList.length === 0) return false;
              const firstDate = formatDateKey(datesList[0]);
              return l.end_date >= firstDate; // Afficher le congé s'il est en cours ou dans le futur
            });
            
            const agentPermLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id) && l.type === 'P');
            const sortedPermLeaves = [...agentPermLeaves].sort((a, b) => a.start_date.localeCompare(b.start_date));
            const agentPermLeaveInPeriod = sortedPermLeaves.find(l => {
              if (!datesList || datesList.length === 0) return false;
              const firstDate = formatDateKey(datesList[0]);
              return l.end_date >= firstDate; // Afficher la permission si elle est en cours ou dans le futur
            }) || (() => {
              // Fallback: Si un 'P' existe dans le calendrier mais a été perdu dans la DB
              if (!datesList || datesList.length === 0) return null;
              const firstDate = formatDateKey(datesList[0]);
              const lastDate = formatDateKey(datesList[datesList.length - 1]);
              const pAtts = (agent.attendance || []).filter(a => a.status === 'P' && a.date >= firstDate && a.date <= lastDate).sort((a, b) => a.date.localeCompare(b.date));
              if (pAtts.length > 0) {
                return {
                  id: 'fake_perm_' + agent.id,
                  agent_id: agent.id,
                  type: 'P',
                  start_date: pAtts[0].date,
                  end_date: pAtts[pAtts.length - 1].date,
                  status: 'approved'
                };
              }
              return null;
            })();
            
            const agentMapLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id) && l.type === 'MAP');
            const sortedMapLeaves = [...agentMapLeaves].sort((a, b) => a.start_date.localeCompare(b.start_date));
            const agentMapLeaveInPeriod = sortedMapLeaves.find(l => {
              if (!datesList || datesList.length === 0) return false;
              const firstDate = formatDateKey(datesList[0]);
              return l.end_date >= firstDate; // Afficher la MAP si elle est en cours ou dans le futur
            }) || (() => {
              // Fallback: Si un 'MAP' existe dans le calendrier mais a été perdu dans la DB
              if (!datesList || datesList.length === 0) return null;
              const firstDate = formatDateKey(datesList[0]);
              const lastDate = formatDateKey(datesList[datesList.length - 1]);
              const mAtts = (agent.attendance || []).filter(a => a.status === 'MAP' && a.date >= firstDate && a.date <= lastDate).sort((a, b) => a.date.localeCompare(b.date));
              if (mAtts.length > 0) {
                return {
                  id: 'fake_map_' + agent.id,
                  agent_id: agent.id,
                  type: 'MAP',
                  start_date: mAtts[0].date,
                  end_date: mAtts[mAtts.length - 1].date,
                  status: 'approved'
                };
              }
              return null;
            })();

            const agentMaladieLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id) && l.type === 'M');
            const sortedMaladieLeaves = [...agentMaladieLeaves].sort((a, b) => a.start_date.localeCompare(b.start_date));
            const agentMaladieLeaveInPeriod = sortedMaladieLeaves.find(l => {
              if (!datesList || datesList.length === 0) return false;
              const firstDate = formatDateKey(datesList[0]);
              return l.end_date >= firstDate; // Afficher la Maladie si elle est en cours ou dans le futur
            }) || (() => {
              // Fallback: Si un 'M' existe dans le calendrier mais a été perdu dans la DB
              if (!datesList || datesList.length === 0) return null;
              const firstDate = formatDateKey(datesList[0]);
              const lastDate = formatDateKey(datesList[datesList.length - 1]);
              const mAtts = (agent.attendance || []).filter(a => a.status === 'M' && a.date >= firstDate && a.date <= lastDate).sort((a, b) => a.date.localeCompare(b.date));
              if (mAtts.length > 0) {
                return {
                  id: 'fake_maladie_' + agent.id,
                  agent_id: agent.id,
                  type: 'M',
                  start_date: mAtts[0].date,
                  end_date: mAtts[mAtts.length - 1].date,
                  status: 'approved'
                };
              }
              return null;
            })();
            
            let totalPermission = 0;
            let isOriginMutationForAgent = false;

            datesList.forEach(d => {
              const dk = formatDateKey(d);
              const isCpDay = agentCpLeaves.some(l => dk >= l.start_date && dk <= l.end_date);

              let hasAbandon = false;
              let hasEntrant = false;
              let hasMutation = false;
              ['J', 'N'].forEach(sc => {
                const st = String(attMap[sc]?.[dk] ?? '');
                if (['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || st.startsWith('SORTANT_')) hasAbandon = true;
                if (st === 'ENTRANT') hasEntrant = true;
                if (st.startsWith('M|')) {
                    hasMutation = true;
                    isOriginMutationForAgent = true;
                }
                if (st.startsWith('PM|')) hasMutation = true;
                if (st === 'COST' || st.startsWith('COST|')) totalCost++;
                if (st.startsWith('F_')) {
                  const fcode = st.split('|')[0].substring(2);
                  funcCounts[fcode] = (funcCounts[fcode] || 0) + 1;
                  totalDynamicFunc++;
                }
              });

              if (!isCpDay) {
                if (hasAbandon) totalA++;
                if (hasEntrant) totalEntrant++;
                if (hasMutation) totalEntrant++; // Deduct mutation days like entrant days to prorate totalP
                ['J', 'N'].forEach(s => {
                  const st = attMap[s]?.[dk];
                  if (st === 'A' || st === 'M') totalA++;
                  if (st === 'MAP') totalMAP++;
                  if (st === 'P') totalPermission++;
                });
                ['S', 'SJ', 'SN'].forEach(s => {
                  const sp = attMap[s]?.[dk];
                  if (sp === '1' || Number(sp) > 0 || (sp && sp.startsWith('Suppl'))) totalSP++;
                });
                ['J', 'N'].forEach(s => {
                  const sp = attMap[s]?.[dk];
                  if (sp && sp.startsWith('Suppl')) totalSP++;
                });

                // Compter les jours hors planning TP avec présence manuelle
                const isSpecial = agent.profile_data?.special_service;
                const specialDays = agent.profile_data?.special_service_days || [];
                if (isSpecial) {
                  const jsDay = d.getDay() || 7;
                  const isSpecialRestDay = !specialDays.includes(String(jsDay)) && !specialDays.includes(jsDay);
                  if (isSpecialRestDay) {
                    ['J', 'N'].forEach(s => {
                      const st = attMap[s]?.[dk];
                      if (st === '1') totalSpecialExtra++;
                    });
                  }
                }
              }
            });

            // --- DEBUT CORRECTION MOIS DE 31 JOURS (ORIGINE) ---
            // L'agent sur son site d'origine ne doit pas perdre 1 jour à cause des 31 jours
            // Le surplus est absorbé dans les jours inactifs (totalEntrant/mutation)
            if (datesList.length > 30 && isOriginMutationForAgent && totalEntrant > 0) {
              const surplus = datesList.length - 30;
              const entrantAdjust = Math.min(totalEntrant, surplus);
              totalEntrant = Math.max(0, totalEntrant - entrantAdjust);
            }
            // --- FIN CORRECTION ---

            let bottomCellClass = '';
            if (agentSpacingMode === 'border') bottomCellClass = 'border-mode-border';
            else if (agentSpacingMode === 'dashed') bottomCellClass = 'border-mode-dashed';
            else if (agentSpacingMode === 'colored_border') bottomCellClass = 'border-mode-colored';

            let baseStickyBg = agent.is_extra ? (localStorage.getItem('pontage_extra_name_bg') || '#2a121a') : (agent.is_releve ? (localStorage.getItem('pontage_releve_name_bg') || '#2a121a') : '#0b1220');
            if (agentSpacingMode === 'zebra' && agentIdx % 2 === 1) {
              if (baseStickyBg === '#0b1220') baseStickyBg = '#141c2c';
              else baseStickyBg = '#3b1c26';
            }
            const isTreated = !!treatedAgents[agent.id];
            if (isTreated) {
              baseStickyBg = '#064e3b'; // Un vert nettement plus visible (Emerald 900)
            }

            const specialBase = (agent.profile_data && agent.profile_data.special_service) ? (agent.profile_data.special_service_base || 12) : 30;
            
            // Le prorata a été désactivé pour tous les agents afin d'afficher les absences brutes réelles.
            // Aucune mise à l'échelle n'est effectuée, 1 absence ratée = 1 absence déduite.

            // Règle différentielle: on ne soustrait plus totalCost et totalDynamicFunc de la base des jours effectués (totalP)
            // On ajoute les jours hors planning TP avec présence manuelle (totalSpecialExtra)
            let totalP = Math.max(0, specialBase - totalA - totalMAP - totalEntrant - totalPermission) + totalSpecialExtra;
            const rows = shiftRows.map((sc, scIdx) => {
              const myRowIdx = globalRowIdx++;

              let trBg = sc === 'S' ? 'rgba(255,255,255,0.01)' : 'transparent';
              if (agentSpacingMode === 'zebra' && agentIdx % 2 === 1) {
                trBg = sc === 'S' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)';
              }
              if (isTreated) {
                trBg = 'rgba(34, 197, 94, 0.2)'; // Vert beaucoup plus prononcé
              }
              const trColorVar = agent.is_extra ? '#f59e0b' : (agent.is_releve ? '#f97316' : '#38bdf8');

              const isLastRow = scIdx === shiftRows.length - 1;
              const cellClassSuffix = isLastRow ? ` ${bottomCellClass}` : '';

              return (
                <DraggableAgentRow key={`${agent.id}-${sc}`} agent={agent} subsiteId={subsite.id} scIdx={scIdx}>
                  {({ setNodeRef, listeners, attributes, style: dragStyle }) => (
                    <tr ref={setNodeRef} id={scIdx === 0 ? `agent-row-${agent.id}` : undefined} style={{
                      background: trBg,
                      '--c': trColorVar,
                      ...dragStyle
                    }}>
                      {scIdx === 0 ? (
                        <td rowSpan={shiftRows.length} className={`agent-rowspan-cell ${bottomCellClass}`}
                          onContextMenu={(e) => {
                            if (isTransfere) {
                              e.preventDefault();
                              setTransferDetailsData({ agentId: agent.id, agentName: agent.name, dateKey: dk, shiftCode: sc, targetSite: transferTarget, replacedAgent: transferReplaced, motif: transferMotif });
                              setShowTransferDetailsModal(true);
                              return;
                            } e.preventDefault(); if (!isArchiveMode) setContextMenu({ x: e.clientX, y: e.clientY, agentId: agent.id, isMutated: agent.is_mutated, isExtra: agent.is_extra, isReleve: agent.is_releve });
                          }}
                          style={{
                            fontWeight: '600',
                            position: 'sticky',
                            left: 0,
                            background: baseStickyBg,
                            zIndex: 40,
                            borderRight: '1px solid var(--border)',
                            width: '250px',
                            minWidth: '250px',
                            maxWidth: '250px',
                            padding: '8px 12px'
                          }}>
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {scIdx === 0 && !isArchiveMode && (
                                  <span
                                    {...listeners}
                                    {...attributes}
                                    style={{
                                      cursor: 'grab',
                                      marginRight: '6px',
                                      opacity: 0.4,
                                      fontSize: '1.2rem',
                                      lineHeight: '1',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    title="Glisser pour déplacer l'agent"
                                  >
                                    ⋮⋮
                                  </span>
                                )}
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextVal = !treatedAgents[agent.id];
                                      setTreatedAgents(prev => {
                                        const next = { ...prev, [agent.id]: nextVal };
                                        if (!nextVal) delete next[agent.id];
                                        if (currentTreatedKey.current) {
                                          try { localStorage.setItem(currentTreatedKey.current, JSON.stringify(next)); } catch (e) {}
                                        }
                                        return next;
                                      });
                                      apiCall('toggle_treated_agent', { site_id: activeSiteId, period, agent_id: agent.id, treated: nextVal });
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      marginRight: '6px',
                                      fontSize: '1rem',
                                      opacity: treatedAgents[agent.id] ? 1 : 0.2,
                                      transition: 'opacity 0.2s'
                                    }}
                                    title={treatedAgents[agent.id] ? "Marqué comme traité (cliquez pour annuler)" : "Marquer comme traité"}
                                  >
                                    ✅
                                  </span>
                                  <span
                                style={{
                                  color: agent.is_extra ? '#f59e0b' : 'inherit',
                                  cursor: activeSiteId === 'site_administration' ? 'default' : 'pointer',
                                  textDecoration: treatedAgents[agent.id] ? 'line-through' : 'none',
                                  opacity: treatedAgents[agent.id] ? 0.6 : 1
                                }}
                                onClick={() => { if (activeSiteId !== 'site_administration') { setSelectedKpiAgent(agent); setShowKPICards(true); } }}
                                title={activeSiteId === 'site_administration' ? "" : `Voir aperçu salarial de ${agent.name}`}
                              >
                                {agent.name}
                              </span>
                            {(totalCost > 0 || (subsite && subsite.costume_enabled === 1)) && (
                              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', gap: '4px' }}>

                                {totalCost > 0 && (
                                  <span style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#c084fc', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title={`${totalCost} jour(s) Costume`}>{totalCost} 👔</span>
                                )}
                                {(subsite && subsite.costume_enabled === 1) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCostumeModes(prev => ({ ...prev, [agent.id]: !prev[agent.id] }));
                                      setFunctionModes(prev => ({ ...prev, [agent.id]: null })); // Désactiver la fonction si costume activé
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      background: costumeModes[agent.id] ? 'var(--c)' : 'transparent',
                                      border: costumeModes[agent.id] ? '1px solid var(--c)' : '1px solid var(--border)',
                                      color: costumeModes[agent.id] ? 'white' : 'var(--text)',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Mode Costume"
                                  >
                                    👔 Costume
                                  </button>
                                )}
                              </div>
                            )}
                            {(() => {
                              const funcIdsToRender = new Set(subsite && Array.isArray(subsite.enabled_functions) ? subsite.enabled_functions : []);
                              Object.keys(funcCounts).forEach(fId => { if (funcCounts[fId] > 0) funcIdsToRender.add(fId); });
                              
                              const getFunctionIcon = (fObj) => {
                                if (fObj && fObj.icon !== undefined) return fObj.icon;
                                const map = { 'AS': '👤', 'GA': '🔫', 'MC': '🐕', 'CP': '⭐', 'Q': '⏱️', 'D': '👟', 'VT': '🚘' };
                                return map[fObj ? fObj.id : ''] || '';
                              };
                              
                              return Array.from(funcIdsToRender).map(funcId => {
                                const funcObj = functions.find(f => f.id === funcId);
                                if (!funcObj) return null;
                                const isActive = functionModes[agent.id] === funcId;
                                const tCount = funcCounts[funcId] || 0;
                                const isEnabledInSubsite = subsite && Array.isArray(subsite.enabled_functions) && subsite.enabled_functions.includes(funcId);
                                const icon = getFunctionIcon(funcObj);
                                
                                return (
                                  <div key={funcId} style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', gap: '4px' }}>
                                    {tCount > 0 && (
                                      <span style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#c084fc', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title={`${tCount} jour(s) ${funcObj.name || funcObj.id}`}>{tCount}{icon ? ` ${icon}` : ''}</span>
                                    )}
                                    {isEnabledInSubsite && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFunctionModes(prev => ({ ...prev, [agent.id]: prev[agent.id] === funcId ? null : funcId }));
                                          setCostumeModes(prev => ({ ...prev, [agent.id]: false })); // Désactiver costume si fonction activée
                                        }}
                                        style={{
                                          cursor: 'pointer',
                                          background: isActive ? 'var(--c)' : 'transparent',
                                          border: isActive ? '1px solid var(--c)' : '1px solid var(--border)',
                                          color: isActive ? 'white' : 'var(--text)',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          fontSize: '0.75rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title={`Mode ${funcObj.name || funcObj.id}`}
                                      >
                                        {icon ? `${icon} ` : ''}{funcObj.id}
                                      </button>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                            {(() => {
                              if (!agent.contract_end_date) return null;
                              const endD = new Date(agent.contract_end_date);
                              const now = new Date();
                              const diffTime = endD - now;
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              if (diffDays < 0) {
                                return <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1px 5px', borderRadius: '4px', border: '1px solid #ef4444' }} title={`Contrat expiré le ${agent.contract_end_date}`}>Expiré</span>;
                              } else if (diffDays <= 15) {
                                return <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: '4px', border: '1px solid #f59e0b' }} title={`Expire dans ${diffDays} jours`}>J-{diffDays}</span>;
                              }
                              return null;
                            })()}

                            {agentCpLeaveInPeriod && (
                              <span
                                style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
                                title="Modifier le Congé Payé"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCpInfoModal({ agent, leave: agentCpLeaveInPeriod });
                                }}
                              >
                                🏖️
                              </span>
                            )}

                            {agentPermLeaveInPeriod && (
                              <span
                                style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
                                title="Voir la Permission"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPermissionDetailsModal({ ...agentPermLeaveInPeriod, agent_name: agent.name });
                                }}
                              >
                                🎟️
                              </span>
                            )}

                            {agentMapLeaveInPeriod && (
                              <span
                                style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
                                title="Voir la Mise à Pied"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPermissionDetailsModal({ ...agentMapLeaveInPeriod, agent_name: agent.name });
                                }}
                              >
                                ⚖️
                              </span>
                            )}

                            {agentMaladieLeaveInPeriod && (
                              <span
                                style={{ marginLeft: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
                                title="Voir la Maladie"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPermissionDetailsModal({ ...agentMaladieLeaveInPeriod, agent_name: agent.name });
                                }}
                              >
                                🩺
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                            {agent.is_extra && (
                              <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 'bold' }}>Extra</span>
                            )}
                            {agent.is_releve && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 'bold' }}>Relève</span>
                              </div>
                            )}
                            {activeSiteId === 'site_releves' && (
                              <button
                                onClick={requireEditMode((e) => {
                                  e.stopPropagation();
                                  setScheduleModalAgent(agent);
                                })}
                                style={{
                                  cursor: 'pointer',
                                  background: 'rgba(249, 115, 22, 0.15)',
                                  border: '1px solid rgba(249, 115, 22, 0.4)',
                                  color: '#fb923c',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s',
                                  marginLeft: agent.is_releve ? '6px' : '0'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'}
                                title="Gérer le programme de semaine"
                              >
                                <CalendarDays size={10} /> PROG
                              </button>
                            )}
                            {(!agent.is_extra && !agent.is_releve && !agent.is_mutated) ? (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'nowrap', alignItems: 'center', marginLeft: '-4px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title={`Jours Effectués (Forfait ${specialBase}${totalMAP > 0 ? ` - ${totalMAP} MAP` : ''}${totalEntrant > 0 ? ` - ${totalEntrant} ENTRANT` : ''}${totalPermission > 0 ? ` - ${totalPermission} PERM` : ''}${totalCost > 0 ? ` - ${totalCost} COST` : ''}${totalDynamicFunc > 0 ? ` - ${totalDynamicFunc} FUNC` : ''})`}>✓ {totalP}</span>
                                  <span
                                    onClick={requireEditMode((e) => {
                                      e.stopPropagation();
                                      setLockedAbsences(prev => ({ ...prev, [agent.id]: !prev[agent.id] }));
                                    })}
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: !lockedAbsences[agent.id] ? 1 : 0.7, whiteSpace: 'nowrap' }}
                                    title={!lockedAbsences[agent.id] ? "Absences déverrouillées (cliquez pour verrouiller)" : "Total Absences (cliquez pour déverrouiller)"}
                                  >
                                    ✗ {totalA} {!lockedAbsences[agent.id] ? '🔓' : '🔒'}
                                  </span>
                                  {totalMAP > 0 && (
                                    <span
                                      onClick={requireEditMode((e) => {
                                        e.stopPropagation();
                                        setLockedMaps(prev => ({ ...prev, [agent.id]: !prev[agent.id] }));
                                      })}
                                      style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#f87171', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: !lockedMaps[agent.id] ? 1 : 0.7, whiteSpace: 'nowrap' }}
                                      title={!lockedMaps[agent.id] ? "Mise à Pied déverrouillée (cliquez pour verrouiller)" : "Jours de Mise À Pied (cliquez pour déverrouiller)"}
                                    >
                                      ⚖️ {totalMAP} {!lockedMaps[agent.id] ? '🔓' : '🔒'}
                                    </span>
                                  )}
                                  {totalPermission > 0 && (
                                    <span
                                      onClick={requireEditMode((e) => {
                                        e.stopPropagation();
                                        setLockedPermissions(prev => ({ ...prev, [agent.id]: !prev[agent.id] }));
                                      })}
                                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: !lockedPermissions[agent.id] ? 1 : 0.7, whiteSpace: 'nowrap' }}
                                      title={!lockedPermissions[agent.id] ? "Permissions déverrouillées (cliquez pour verrouiller)" : "Jours de Permission (cliquez pour déverrouiller)"}
                                    >
                                      🎟️ {totalPermission} {!lockedPermissions[agent.id] ? '🔓' : '🔒'}
                                    </span>
                                  )}
                                  {totalSP > 0 && (
                                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: 'var(--b)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} title="Total Supplémentaires">+ {totalSP}</span>
                                  )}

                                </div>
                                {!isVerificationMode && !isArchiveMode && (
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {(!agent.is_mutated && !agent.is_extra && !agent.is_releve) && (
                                      <>
                                        <button
                                          className="btn"
                                          style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', height: 'fit-content' }}
                                          onClick={requireEditMode((e) => { e.stopPropagation(); setReposMenu({ agentId: agent.id, x: e.clientX, y: e.clientY }); })}
                                          title="Configurer le jour de repos"
                                        >
                                          Repos
                                        </button>

                                        <button
                                          onClick={requireEditMode((e) => { e.preventDefault(); handleUpdateAgentField(agent.id, 'has_sp', Number(agent.has_sp) === 1 ? 0 : 1); })}
                                          onContextMenu={requireEditMode((e) => { e.preventDefault(); handleUpdateAgentField(agent.id, 'has_sp', Number(agent.has_sp) === 2 ? 0 : 2); })}
                                          className="btn"
                                          style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', height: 'fit-content' }}
                                          title={agent.has_sp ? "Masquer la ligne Supplémentaire\nClic Gauche : 1 ligne\nClic Droit : 2 lignes (J/N)" : "Afficher la ligne Supplémentaire\nClic Gauche : 1 ligne\nClic Droit : 2 lignes (J/N)"}
                                        >
                                          SP
                                        </button>
                                      </>
                                    )}

                                    <button
                                      onClick={requireEditMode(() => (agent.is_mutated || agent.is_extra || agent.is_releve) ? handleClearAgentMutations(agent.id) : handleDeleteAgent(agent.id))}
                                      className="btn btn-logout"
                                      style={{ padding: '2px 6px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6, height: 'fit-content' }}
                                      title={(agent.is_mutated || agent.is_extra || agent.is_releve) ? "Retirer l'agent du site" : "Supprimer l'agent"}
                                    >
                                      <Trash size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {!isVerificationMode && !isArchiveMode && (
                                  <>
                                    {(!agent.is_mutated && !agent.is_extra && !agent.is_releve) && (
                                      <>
                                        <button
                                          onClick={requireEditMode((e) => { e.preventDefault(); handleUpdateAgentField(agent.id, 'has_sp', Number(agent.has_sp) === 1 ? 0 : 1); })}
                                          onContextMenu={requireEditMode((e) => { e.preventDefault(); handleUpdateAgentField(agent.id, 'has_sp', Number(agent.has_sp) === 2 ? 0 : 2); })}
                                          className="btn"
                                          style={{ padding: '2px 4px', borderRadius: '4px', fontSize: '0.65rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                                          title={agent.has_sp ? "Masquer la ligne Supplémentaire\nClic Gauche : 1 ligne\nClic Droit : 2 lignes (J/N)" : "Afficher la ligne Supplémentaire\nClic Gauche : 1 ligne\nClic Droit : 2 lignes (J/N)"}
                                        >
                                          SP
                                        </button>
                                      </>
                                    )}

                                    {(agent.is_mutated || agent.is_extra || agent.is_releve) && agent.replaced_functions && agent.replaced_functions.length > 0 && (
                                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.65rem', textAlign: 'center', marginBottom: '2px' }} title="Fonction de l'agent remplacé">
                                        {agent.replaced_functions.join(', ')}
                                      </span>
                                    )}

                                    <button
                                      onClick={requireEditMode(() => (agent.is_mutated || agent.is_extra || agent.is_releve) ? handleClearAgentMutations(agent.id) : handleDeleteAgent(agent.id))}
                                      className="btn btn-logout"
                                      style={{ padding: '2px 4px', borderRadius: '4px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}
                                      title={(agent.is_mutated || agent.is_extra || agent.is_releve) ? "Retirer l'agent du site" : "Supprimer l'agent"}
                                    >
                                      <Trash size={12} />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : null}

                  {scIdx === 0 ? (
                    <td rowSpan={shiftRows.length} className={`agent-rowspan-cell ${bottomCellClass}`} style={{ verticalAlign: 'middle', padding: '0 4px', width: '65px', minWidth: '65px', maxWidth: '65px', position: 'sticky', left: '250px', background: agent.is_extra ? (localStorage.getItem('pontage_extra_name_bg') || '#2a121a') : (agent.is_releve ? (localStorage.getItem('pontage_releve_name_bg') || '#2a121a') : '#0b1220'), zIndex: 40, borderRight: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: (agent.profile_data && typeof agent.profile_data.mutated_from_function !== 'undefined' && agent.profile_data.mutated_from_function !== agent.function) ? '#f87171' : 'white',
                            fontSize: '0.85rem'
                          }}
                          title={(agent.profile_data && typeof agent.profile_data.mutated_from_function !== 'undefined' && agent.profile_data.mutated_from_function !== agent.function) ? `Fonction changée suite à la mutation (Ancienne: ${agent.profile_data.mutated_from_function || 'Aucune'})` : ''}
                        >
                          {(() => {
                            if (agent.status_change) {
                              try {
                                const scObj = JSON.parse(agent.status_change);
                                return (
                                  <span
                                    style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.4)', paddingBottom: '2px' }}
                                    onClick={(e) => { e.stopPropagation(); setStatusChangeInfoModal(agent); }}
                                    title="Voir les détails du changement de statut"
                                  >
                                    <span style={{ color: '#ef4444' }}>{scObj.old_function || '-'}</span>
                                    <span style={{ color: 'var(--muted)', margin: '0 2px' }}>/</span>
                                    <span style={{ color: '#ffffff' }}>{scObj.new_function || '-'}</span>
                                  </span>
                                );
                              } catch (e) {
                                return agent.function || '-';
                              }
                            }
                            return agent.function || '-';
                          })()}
                        </span>
                        {!agent.is_mutated && !isArchiveMode && !agent.is_releve && (
                          <button
                            onClick={requireEditMode(() => setFunctionModalAgent(agent))}
                            style={{ padding: '2px 4px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', width: '100%', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
                            title="Modifier la fonction"
                          >✏️</button>
                        )}
                      </div>
                    </td>
                  ) : null}

                  {!isVerificationMode && !isArchiveMode && scIdx === 0 ? (
                    <td rowSpan={shiftRows.length} className={`agent-rowspan-cell ${bottomCellClass}`} style={{ verticalAlign: 'middle', padding: '0 4px', width: '45px', minWidth: '45px', maxWidth: '45px', position: 'sticky', left: '315px', background: agent.is_extra ? (localStorage.getItem('pontage_extra_name_bg') || '#2a121a') : (agent.is_releve ? (localStorage.getItem('pontage_releve_name_bg') || '#2a121a') : '#0b1220'), zIndex: 40, borderRight: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
                        <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>{agent.shift_type || 'Jour'}</span>
                        <div
                          className="form-input"
                          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', width: '100%', cursor: (agent.is_mutated) ? 'not-allowed' : 'pointer', color: 'white' }}
                          onClick={requireEditMode((e) => {
                            e.stopPropagation();
                            if (!agent.is_mutated) {
                              setShiftModalAgent(agent);
                              setShiftModalType(agent.shift_type || 'Jour');
                              setShowCustomRotation(false);
                            }
                          })}
                          title="Modifier la vacation"
                        >
                          {!agent.is_mutated && <Edit size={14} style={{ opacity: 0.8 }} />}
                        </div>
                        {(() => {
                          // Check if there are shift history changes within the current period
                          let shiftHistory = agent.shift_history;
                          if (typeof shiftHistory === 'string') {
                            try { shiftHistory = JSON.parse(shiftHistory); } catch (e) { shiftHistory = []; }
                          }
                          if (!Array.isArray(shiftHistory) || shiftHistory.length <= 1) return null;
                          const periodChanges = shiftHistory.filter(sh => {
                            if (!sh.from || sh.from === '1970-01-01' || sh.from === '2000-01-01') return false;
                            const firstDate = formatDateKey(datesList[0]);
                            const lastDate = formatDateKey(datesList[datesList.length - 1]);
                            return sh.from >= firstDate && sh.from <= lastDate;
                          });
                          if (periodChanges.length === 0) return null;
                          return (
                            <div
                              onClick={(e) => { e.stopPropagation(); setShiftChangeInfoModal({ agent, changes: periodChanges }); }}
                              title={`${periodChanges.length} changement(s) de vacation — Cliquez pour voir`}
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.5)', borderRadius: '4px', width: '100%', cursor: 'pointer', color: '#38bdf8', fontSize: '0.6rem', fontWeight: 'bold', gap: '2px' }}
                            >
                              🔄 {periodChanges.length}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  ) : null}

                  <td className={cellClassSuffix} style={{ width: '20px', minWidth: '20px', maxWidth: '20px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', left: (!isVerificationMode && !isArchiveMode) ? '360px' : '315px', zIndex: 40, background: sc.startsWith('S') ? '#0f172a' : '#1e293b', color: sc.startsWith('S') ? 'var(--primary)' : 'var(--text-muted)', borderRight: '1px solid var(--border)', fontSize: '0.65rem', padding: '0 1px' }}>
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
                    let cpRendered = false;
                    let currentCpLeave = null;
                    let cpSpanCount = 0;
                    let sortantRendered = false;
                    let sortantSpanCount = 0;
                    let currentSortantType = null;
                    let entrantRendered = false;
                    let entrantSpanCount = 0;
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
                        isValidRow = (sc === 'J' || sc.startsWith('S'));
                      } else if (activeShiftType === 'Nuit') {
                        isValidRow = (sc === 'N' || sc.startsWith('S'));
                      } else {
                        isValidRow = true;
                      }

                      const rawStatus = attMap[sc]?.[dk] ?? '';
                      let status = rawStatus === '' ? '' : String(rawStatus);

                      const activeCpLeave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.start_date <= dk && l.end_date >= dk && l.type === 'CP');
                      if (activeCpLeave) {
                        // Force empty status for any attendance during CP, so we don't show old SP or A
                        status = '';
                      }

                      const isSPRow = ['S', 'SJ', 'SN'].includes(sc);

                      // Astuce visuelle pour le vivier : si la ligne AS a un REL_1 (1 bleu du cycle),
                      // on l'affiche artificiellement comme Suppl sur la ligne SP
                      if (isSPRow && status === '' && activeSiteId === 'site_releves') {
                        const hasSJ = shiftRows.includes('SJ');
                        const hasSN = shiftRows.includes('SN');

                        let shouldMap = false;
                        let asSc = null;

                        if (sc === 'SJ') {
                          shouldMap = true;
                          asSc = 'J';
                        } else if (sc === 'SN') {
                          shouldMap = true;
                          asSc = 'N';
                        } else if (sc === 'S') {
                          if (activeShiftType === 'Jour' && !hasSJ) {
                            shouldMap = true;
                            asSc = 'J';
                          } else if (activeShiftType === 'Nuit' && !hasSN) {
                            shouldMap = true;
                            asSc = 'N';
                          }
                        }

                        if (shouldMap && asSc) {
                          const asStatus = String(attMap[asSc]?.[dk] ?? '');
                          if (asStatus.startsWith('REL_1|')) {
                            status = asStatus;
                          }
                        }
                      }

                      const isMutated = status.startsWith('M|');
                      const isPrevMutated = status.startsWith('PM|');
                      const isSortant = ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(status) || status.startsWith('SORTANT_');
                      
                      const isMainRow = !sc.startsWith('S');
                      const isEntrant = isMainRow && (status === 'ENTRANT' || attMap['J']?.[dk] === 'ENTRANT' || attMap['N']?.[dk] === 'ENTRANT');

                      const leave = leaves.find(l => String(l.agent_id) === String(agent.id) && l.start_date <= dk && l.end_date >= dk && (l.type === 'CP' || l.type === 'P') && !isSPRow);

                      const isCp = !!leave && leave.type === 'CP' && (!cpRendered || currentCpLeave?.id !== leave.id);
                      const isPermission = !!leave && leave.type === 'P';
                      const isPrevCp = !!leave && leave.type === 'CP' && !isCp;

                      if (!leave) {
                        cpRendered = false;
                        currentCpLeave = null;
                      }

                      // Sauter les cellules fusionnées
                      if ((isPrevMutated && pmRendered) || isPrevCp || (isSortant && sortantRendered) || (isEntrant && entrantRendered)) {
                        continue;
                      }
                      
                      // Fusion verticale pour ENTRANT et CP : on ne rend la cellule que sur la première ligne principale (scIdx === 0)
                      if ((isEntrant || isCp) && scIdx > 0 && isMainRow) {
                        continue;
                      }

                      if (isPrevMutated) {
                        pmRendered = true;
                      }
                      if (isEntrant) {
                        entrantRendered = true;
                        let count = 0;
                        for (let j = dIdx; j < datesList.length; j++) {
                          const tDk = formatDateKey(datesList[j]);
                          const tStatus = String(attMap['J']?.[tDk] || attMap['N']?.[tDk] || '');
                          if (tStatus === 'ENTRANT') count++;
                          else break;
                        }
                        entrantSpanCount = count;
                      }
                      if (isSortant) {
                        sortantRendered = true;
                        currentSortantType = status;
                        let count = 0;
                        for (let j = dIdx; j < datesList.length; j++) {
                          const tDk = formatDateKey(datesList[j]);
                          const tStatus = String(attMap[sc]?.[tDk] ?? '');
                          if (['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(tStatus) || tStatus.startsWith('SORTANT_')) count++;
                          else break;
                        }
                        sortantSpanCount = count;
                      }
                      if (isCp) {
                        cpRendered = true;
                        currentCpLeave = leave;
                        let count = 0;
                        for (let j = dIdx; j < datesList.length; j++) {
                          const tDk = formatDateKey(datesList[j]);
                          if (leave.start_date <= tDk && leave.end_date >= tDk) count++;
                          else break;
                        }
                        cpSpanCount = count;
                      }

                      const isNonPresent = status === 'NON_PRESENT';
                      const isToday = dk === formatDateKey(new Date());

                      const isSpecial = agent.profile_data?.special_service;
                      const specialDays = agent.profile_data?.special_service_days || [];
                      const jsDay = d.getDay() || 7;
                      const isSpecialRest = isSpecial && !specialDays.includes(String(jsDay)) && !specialDays.includes(jsDay);


                      const enableReposBg = localStorage.getItem('pontage_enable_repos_bg') !== 'false';
                      const reposCellBg = enableReposBg ? (localStorage.getItem('pontage_repos_cell_bg') || '#ebebeb') : 'rgba(255,255,255,0.92)';
                      let bgStyle = agent.is_extra ? (localStorage.getItem('pontage_extra_cell_bg') || 'rgba(15, 23, 42, 0.4)') : (agent.is_releve ? (localStorage.getItem('pontage_releve_cell_bg') || 'rgba(225, 29, 72, 0.08)') : 'rgba(255,255,255,0.92)');
                      let textStyle = '#ccc';
                      let content = '';
                      let cursorStyle = 'pointer';

                      if (isEntrant) {
                        bgStyle = localStorage.getItem('pontage_entrant_bg_v5') || 'linear-gradient(135deg, rgba(130, 196, 108, 0.15), rgba(164, 219, 149, 0.25))';
                        textStyle = localStorage.getItem('pontage_entrant_text_v5') || '#82c46c';
                        content = 'ENTRANT';
                        cursorStyle = 'not-allowed';
                      } else if (isNonPresent) {
                        bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                        textStyle = 'transparent';
                        content = '';
                        cursorStyle = 'not-allowed';
                      } else if (isSpecialRest) {
                        if (status === '1') {
                          // Jour hors planning mais présence manuelle ajoutée
                          bgStyle = 'rgba(34, 197, 94, 0.2)';
                          textStyle = 'var(--a)';
                          content = <span className="text-present">1</span>;
                          cursorStyle = 'pointer';
                        } else {
                          // Jour hors planning - grisé mais cliquable
                          bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                          textStyle = 'transparent';
                          content = '';
                          cursorStyle = 'pointer';
                        }
                      } else if (isCp || status === 'CP') {
                        bgStyle = localStorage.getItem('pontage_cp_bg') || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
                        textStyle = localStorage.getItem('pontage_cp_text') || '#ffffff';
                        const shortStart = currentCpLeave ? currentCpLeave.start_date.split('-').reverse().join('/') : '';
                        const shortEnd = currentCpLeave ? currentCpLeave.end_date.split('-').reverse().join('/') : '';
                        const shortStartOnly = shortStart.substring(0, 5); // ex: 25/09
                        const shortEndOnly = shortEnd.substring(0, 5); // ex: 20/10
                        const cpText = cpSpanCount > 12 ? `Congé du ${shortStart} au ${shortEnd}` : (cpSpanCount > 7 ? `Congé (${shortStartOnly} - ${shortEndOnly})` : (cpSpanCount > 3 ? `CP ${shortStartOnly}-${shortEndOnly}` : 'CP'));
                        const dynamicFontSize = cpSpanCount > 12 ? '0.95rem' : (cpSpanCount > 7 ? '0.85rem' : '0.8rem');
                        content = <span style={{ fontWeight: 'bold', fontSize: dynamicFontSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', display: 'inline-block', textAlign: 'center', padding: '0 4px' }}>{cpText}</span>;
                        cursorStyle = 'pointer';
                      } else if (!isValidRow && (!status || status === '')) {
                        bgStyle = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, transparent 10px, transparent 20px)';
                        textStyle = 'transparent';
                        content = '';
                        cursorStyle = 'not-allowed';
                      } else if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                        if (status && status !== '') {
                          bgStyle = 'rgba(56, 189, 248, 0.55)';
                          textStyle = '#fff';
                          if (typeof status === 'string' && status === 'Suppl_Dest') {
                            bgStyle = '#3b82f6';
                            textStyle = '#ffffff';
                            content = <span title="Supplémentaire (Détaché ici)" style={{ fontWeight: 'bold' }}>1</span>;
                          } else if (typeof status === 'string' && status.startsWith('Suppl|')) {
                            const destId = status.split('|')[1] || '';
                            let destLabel = destId;
                            if (sites) {
                              sites.forEach(s => {
                                if (String(s.id) === String(destId)) destLabel = s.name;
                                if (s.subsites) {
                                  s.subsites.forEach(sub => {
                                    if (String(sub.id) === String(destId)) {
                                      destLabel = `${s.name} / ${sub.name}`;
                                    }
                                  });
                                }
                              });
                            }
                            content = <span title={`Heure supplémentaire effectuée sur : ${destLabel}`} style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Suppl</span>;
                          } else if (typeof status === 'string' && (status.startsWith('EXT_1|') || status.startsWith('REL_1|') || status.startsWith('M_1|'))) {
                            const dest = status.split('|')[1];
                            const isCurrentExtraSite = activeSiteId === 'site_extras' && status.startsWith('EXT_1|');
                            const isCurrentReleveSite = activeSiteId === 'site_releves' && status.startsWith('REL_1|');
                            const isOriginalSiteForMutation = status.startsWith('M_1|') && !isMutated;

                            // Pour les lignes supplémentaires dans le vivier, on affiche "Suppl" au lieu du "1 i" vert
                            if (isCurrentExtraSite || isCurrentReleveSite) {
                              bgStyle = 'rgba(56, 189, 248, 0.55)';
                              textStyle = '#fff';
                              content = <span title={`Supplémentaire sur : ${dest}`} style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Suppl</span>;
                            } else if (isMutated || isPrevMutated || isOriginalSiteForMutation) {
                              bgStyle = 'rgba(34, 197, 94, 0.2)';
                              textStyle = 'var(--a)';
                              content = <span title={`Déployé sur : ${dest}`}>1 <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>i</span></span>;
                            } else {
                              // Deployed site view
                              bgStyle = '#3b82f6'; // Blue background for supplementary
                              textStyle = '#ffffff';
                              content = <span title={`Supplémentaire (Détaché)`} style={{ fontWeight: 'bold' }}>1</span>;
                            }
                          } else {
                            content = status === '1' ? <span className="text-present">1</span> : status;
                          }
                        } else {
                          bgStyle = 'rgba(56, 189, 248, 0.08)';
                          textStyle = 'rgba(56,189,248,0.4)';
                          content = '';
                        }
                      } else {
                        const isSiteReleves = activeSiteId === 'site_releves';
                        const isSiteExtras = activeSiteId === 'site_extras';

                        if (['1', 'R', 'A', 'MAP', 'P'].includes(status) && ((agent.is_extra && !isSiteExtras) || (agent.is_releve && !isSiteReleves))) {
                          // Si on est sur un site distant (pas le vivier), on masque les pointages par défaut de l'extra/relève
                          bgStyle = 'rgba(255,255,255,0.03)';
                          textStyle = 'rgba(255,255,255,0.2)';
                          content = '';

                          // Indicateur "RELV" ou sanction pour les jours programmés d'une relève
                          const jsDay = d.getDay() || 7;
                          const subsiteId = subsite.id || 'default';
                          const daysForSubsite = agent.scheduled_days_by_subsite && agent.scheduled_days_by_subsite[subsiteId] ? agent.scheduled_days_by_subsite[subsiteId] : [];
                          const isScheduledHere = agent.is_scheduled_releve && (daysForSubsite.includes(String(jsDay)) || daysForSubsite.includes(jsDay) || (agent.scheduled_days && !agent.scheduled_days_by_subsite && (agent.scheduled_days.includes(String(jsDay)) || agent.scheduled_days.includes(jsDay))));

                          if (isScheduledHere) {
                            if (status === 'A') {
                              bgStyle = 'rgba(239, 68, 68, 0.2)';
                              textStyle = 'var(--danger)';
                              content = 'A';
                            } else if (status === 'MAP') {
                              bgStyle = 'rgba(220, 38, 38, 0.22)';
                              textStyle = '#f87171';
                              content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;
                            } else if (status === 'P') {
                              bgStyle = 'rgba(239, 68, 68, 0.2)';
                              textStyle = '#ef4444';
                              content = <span style={{ fontWeight: 'bold' }}>P</span>;
                            } else {
                              const cellKey = `${agent.id}-${dk}-${sc}`;
                              if (toggledRelvCells[cellKey]) {
                                bgStyle = 'rgba(249, 115, 22, 0.2)'; // orange
                                textStyle = '#f97316';
                                cursorStyle = 'pointer';
                                content = <span title="Urgence : muté ailleurs" style={{ fontWeight: 'bold' }}>T</span>;
                              } else {
                                bgStyle = 'rgba(16, 185, 129, 0.1)';
                                textStyle = '#10b981';
                                cursorStyle = 'pointer';
                                content = <span style={{ fontWeight: 'bold' }}>RELV</span>;
                              }
                            }
                          }
                        } else if (status && status.startsWith('T')) {
                          if (isSiteReleves) {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span className="text-present">1</span>;
                          } else {
                            bgStyle = 'rgba(249, 115, 22, 0.2)'; // orange
                            textStyle = '#f97316';
                            cursorStyle = 'not-allowed';
                            content = <span style={{ fontWeight: 'bold' }}>1</span>;
                          }
                        } else if (status === '1') {
                          // If we are on the Vivier site, and the agent is scheduled to work ELSEWHERE today, show it in orange!
                          let isScheduledElsewhere = false;
                          if (isSiteReleves && agent.is_scheduled_releve) {
                            const jsDay = d.getDay() || 7;
                            // Check ALL subsites and default to see if they are scheduled ANYWHERE
                            const allScheduledDays = [];
                            if (agent.scheduled_days) allScheduledDays.push(...agent.scheduled_days);
                            if (agent.scheduled_days_by_subsite) {
                              Object.values(agent.scheduled_days_by_subsite).forEach(days => allScheduledDays.push(...days));
                            }
                            if (allScheduledDays.includes(String(jsDay)) || allScheduledDays.includes(jsDay)) {
                                isScheduledElsewhere = true;
                            }
                          }

                          if (isScheduledElsewhere) {
                            bgStyle = 'rgba(249, 115, 22, 0.2)'; // orange
                            textStyle = '#f97316';
                            cursorStyle = 'not-allowed';
                            content = <span title="Transféré vers un autre site" style={{ fontWeight: 'bold' }}>1</span>;
                          } else {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span className="text-present">1</span>;
                          }
                        } else if (status === 'R') {
                          bgStyle = (!agent.is_extra && !agent.is_releve) ? reposCellBg : 'transparent';
                          textStyle = '#888';
                          content = <span>R</span>;
                        } else if (status === 'A') {
                          bgStyle = 'rgba(239, 68, 68, 0.2)';
                          textStyle = 'var(--danger)';
                          cursorStyle = !lockedAbsences[agent.id] ? 'pointer' : 'not-allowed';
                          content = 'A';
                        } else if (isSortant) {
                          bgStyle = 'linear-gradient(135deg, rgba(244, 63, 94, 0.4), rgba(225, 29, 72, 0.6))';
                          textStyle = '#ffffff';
                          let sortantText = currentSortantType;
                          if (currentSortantType === 'ABANDON') sortantText = sortantSpanCount <= 4 ? 'ABANDON' : 'ABANDON DE SERVICE';
                          else if (currentSortantType === 'DEMISSION') sortantText = 'DÉMISSION';
                          else if (currentSortantType === 'RETIRE') sortantText = sortantSpanCount <= 4 ? 'RETIRÉ' : "RETIRÉ DE L'EFFECTIF";
                          else if (currentSortantType === 'LICENCIE') sortantText = 'LICENCIÉ';
                          else if (currentSortantType === 'LICENCIE_ADMIN') sortantText = sortantSpanCount <= 4 ? 'LICENCIÉ' : "LICENCIÉ PAR L'ADMINISTRATEUR";
                          else if (currentSortantType === 'FIN_CONTRAT') sortantText = sortantSpanCount <= 4 ? 'FIN CONTRAT' : 'FIN DE STAGE/CONTRAT';
                          else if (currentSortantType.startsWith('SORTANT_')) sortantText = currentSortantType.substring(8).toUpperCase();

                          let dynamicFontSize = '0.85rem';
                          if (sortantSpanCount === 1) dynamicFontSize = '0.55rem';
                          else if (sortantSpanCount === 2) dynamicFontSize = '0.65rem';
                          else if (sortantSpanCount === 3) dynamicFontSize = '0.75rem';

                          content = (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: sortantSpanCount <= 2 ? 'flex-start' : 'center', overflow: 'hidden', padding: '0 2px' }}>
                              <span style={{ fontSize: dynamicFontSize, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: sortantSpanCount <= 2 ? 'left' : 'center', fontWeight: 'bold' }}>
                                {sortantText}
                              </span>
                            </div>
                          );
                          cursorStyle = 'default';
                        } else if (status === 'M') {
                          bgStyle = 'rgba(239, 68, 68, 0.2)';
                          textStyle = 'var(--danger)';
                          cursorStyle = 'pointer';
                          content = 'M';
                        } else if (['CP', 'AT'].includes(status)) {
                          bgStyle = 'rgba(245, 158, 11, 0.2)';
                          textStyle = '#f59e0b';
                          content = status;
                        } else if (status === 'COST') {
                          bgStyle = 'rgba(168, 85, 247, 0.2)';
                          textStyle = '#a855f7';
                          content = 'COST';
                        } else if (status && status.startsWith('F_')) {
                          bgStyle = 'rgba(56, 189, 248, 0.2)';
                          textStyle = '#38bdf8';
                          content = status.substring(2);
                        } else if (status === 'T' || (status && status.startsWith('T|')) || status === 'VISUAL_T') {
                          bgStyle = 'rgba(249, 115, 22, 0.2)';
                          textStyle = '#f97316';
                          content = <span className="text-present">1</span>;
                          cursorStyle = 'not-allowed';
                        } else if (status && status.startsWith('EXT|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_extras') {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span title={`Déployé sur : ${dest}`}>1 <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>i</span></span>;
                          } else {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = 'EXT';
                          }
                        } else if (status && status.startsWith('EXT_MAP|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_extras') {
                            bgStyle = 'rgba(220, 38, 38, 0.22)';
                            textStyle = '#f87171';
                            content = <span title={`MAP sur : ${dest}`}><span style={{ fontSize: '0.52rem', fontWeight: '900' }}>MAP</span> <span style={{ fontSize: '0.6rem', color: '#f87171' }}>i</span></span>;
                          } else {
                            bgStyle = 'rgba(220, 38, 38, 0.22)';
                            textStyle = '#f87171';
                            content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;
                          }
                        } else if (status && status.startsWith('EXT_P|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_extras') {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = '#ef4444';
                            content = <span title={`Permission sur : ${dest}`}>P <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>i</span></span>;
                          } else {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = '#ef4444';
                            content = <span style={{ fontWeight: 'bold' }}>P</span>;
                          }
                        } else if (status && status.startsWith('EXT_A|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_extras') {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = 'var(--danger)';
                            content = <span title={`Absent sur : ${dest}`}>A <span style={{ fontSize: '0.6rem', color: 'var(--danger)' }}>i</span></span>;
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
                            content = <span title={`Repos sur : ${dest}`}>R <span style={{ fontSize: '0.6rem', color: '#000' }}>i</span></span>;
                          } else {
                            bgStyle = 'transparent';
                            textStyle = '#888';
                            content = <span>R</span>;
                          }
                        } else if (status && status.startsWith('REL|')) {
                          const dest = status.split('|')[1];
                          const currentSiteName = sites.find(s => String(s.id) === String(activeSiteId))?.name;
                          if (activeSiteId === 'site_releves') {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span title={`Déployé sur : ${dest}`}>1 <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>i</span></span>;
                          } else if (currentSiteName === dest) {
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span className="text-present">1</span>;
                          } else {
                            bgStyle = 'rgba(255,255,255,0.03)';
                            textStyle = 'rgba(255,255,255,0.2)';
                            content = '';
                          }
                        } else if (status && status.startsWith('REL_A|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_releves') {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = 'var(--danger)';
                            content = <span title={`Absent sur : ${dest}`}>A <span style={{ fontSize: '0.6rem', color: 'var(--danger)' }}>i</span></span>;
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
                            content = <span title={`Repos sur : ${dest}`}>R <span style={{ fontSize: '0.6rem', color: '#000' }}>i</span></span>;
                          } else {
                            bgStyle = 'transparent';
                            textStyle = '#888';
                            content = <span>R</span>;
                          }
                        } else if (status && status.startsWith('REL_MAP|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_releves') {
                            bgStyle = 'rgba(220, 38, 38, 0.22)';
                            textStyle = '#f87171';
                            content = <span title={`MAP sur : ${dest}`}><span style={{ fontSize: '0.52rem', fontWeight: '900' }}>MAP</span> <span style={{ fontSize: '0.6rem', color: '#f87171' }}>i</span></span>;
                          } else {
                            bgStyle = 'rgba(220, 38, 38, 0.22)';
                            textStyle = '#f87171';
                            content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;
                          }
                        } else if (status && status.startsWith('REL_P|')) {
                          const dest = status.split('|')[1];
                          if (activeSiteId === 'site_releves') {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = '#ef4444';
                            content = <span title={`Permission sur : ${dest}`}>P <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>i</span></span>;
                          } else {
                            bgStyle = 'rgba(239, 68, 68, 0.2)';
                            textStyle = '#ef4444';
                            content = <span style={{ fontWeight: 'bold' }}>P</span>;
                          }
                        } else if (status && status.startsWith('REL_T|')) {
                          const dest = status.split('|')[1];
                          const currentSiteName = sites.find(s => String(s.id) === String(activeSiteId))?.name;

                          if (currentSiteName === dest) {
                            bgStyle = 'rgba(16, 185, 129, 0.1)';
                            textStyle = '#10b981';
                            content = <span title={`Provient de : vivier/autre site`} style={{ fontWeight: 'bold' }}>RELV</span>;
                          } else if (activeSiteId === 'site_releves') {
                            // Règle du vivier : on ne modifie pas le pointage AS visuellement
                            bgStyle = 'rgba(34, 197, 94, 0.2)';
                            textStyle = 'var(--a)';
                            content = <span className="text-present">1</span>;
                          } else {
                            const jsDay = d.getDay() || 7;
                            const subsiteId = subsite.id || 'default';
                            const daysForSubsite = agent.scheduled_days_by_subsite && agent.scheduled_days_by_subsite[subsiteId] ? agent.scheduled_days_by_subsite[subsiteId] : [];
                            const isScheduledHere = agent.is_scheduled_releve && (daysForSubsite.includes(String(jsDay)) || daysForSubsite.includes(jsDay) || (agent.scheduled_days && !agent.scheduled_days_by_subsite && (agent.scheduled_days.includes(String(jsDay)) || agent.scheduled_days.includes(jsDay))));
                            if (isScheduledHere) {
                              bgStyle = 'rgba(249, 115, 22, 0.2)'; // orange
                              textStyle = '#f97316';
                              cursorStyle = 'not-allowed';
                              content = <span title={`Transféré vers : ${dest}`} style={{ fontWeight: 'bold' }}>1</span>;
                            } else {
                              bgStyle = 'rgba(255,255,255,0.03)';
                              textStyle = 'rgba(255,255,255,0.2)';
                              content = '';
                            }
                          }
                        } else if (status && (status.startsWith('EXT_1|') || status.startsWith('REL_1|') || status.startsWith('M_1|'))) {
                          const rawDest = status.split('|')[1];
                          const dest = resolveSiteName(rawDest);
                          const isCurrentExtraSite = activeSiteId === 'site_extras' && status.startsWith('EXT_1|');
                          const isCurrentReleveSite = activeSiteId === 'site_releves' && status.startsWith('REL_1|');
                          const isOriginalSiteForMutation = status.startsWith('M_1|') && !isMutated;
                          if (isCurrentExtraSite || isCurrentReleveSite || isMutated || isPrevMutated || isOriginalSiteForMutation) {
                            // Original site view for these: display just like a normal deployment
                            if (isCurrentReleveSite && status.startsWith('REL_1|')) {
                              // Règle du vivier : on extrait l'ancien pointage
                              const oldStatus = status.split('|')[4] || '1';
                              if (oldStatus === 'R') {
                                bgStyle = (!agent.is_extra && !agent.is_releve) ? reposCellBg : 'transparent';
                                textStyle = '#888';
                                content = <span>R</span>;
                              } else if (oldStatus === 'A') {
                                bgStyle = 'rgba(239, 68, 68, 0.2)';
                                textStyle = 'var(--danger)';
                                content = 'A';
                              } else {
                                bgStyle = 'rgba(34, 197, 94, 0.2)';
                                textStyle = 'var(--a)';
                                content = <span className="text-present">1</span>;
                              }
                            } else {
                              bgStyle = 'rgba(34, 197, 94, 0.2)';
                              textStyle = 'var(--a)';
                              content = <span title={`Déployé sur : ${dest}`}>1 <span style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>i</span></span>;
                            }
                          } else {
                            const currentSiteName = sites.find(s => String(s.id) === String(activeSiteId))?.name;
                            if (currentSiteName === dest || currentSiteName === rawDest) {
                              // Deployed site view (Supplémentaire)
                              bgStyle = '#3b82f6'; // Blue background for supplementary
                              textStyle = '#ffffff';
                              content = <span title={`Supplémentaire (Détaché)`} style={{ fontWeight: 'bold' }}>1</span>;
                            } else {
                              bgStyle = 'rgba(255,255,255,0.03)';
                              textStyle = 'rgba(255,255,255,0.2)';
                              content = '';
                            }
                          }
                        } else if (status === 'Suppl_Dest') {
                          bgStyle = '#3b82f6'; // Blue background for destination supplementary
                          textStyle = '#ffffff';
                          content = <span title="Supplémentaire Externe" style={{ fontWeight: 'bold' }}>1</span>;
                        } else if (status && status.startsWith('Suppl')) {
                          bgStyle = 'rgba(59, 130, 246, 0.1)';
                          textStyle = '#60a5fa'; // lighter blue
                          cursorStyle = 'pointer';
                          content = <span title="Heure supplémentaire effectuée sur un autre site" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Suppl</span>;
                        } else if (isMutated || isPrevMutated) {
                          const destId = isMutated ? status.substring(2) : status.substring(3);
                          let destLabel = resolveSiteName(destId);
                          bgStyle = 'rgba(245, 158, 11, 0.15)';
                          textStyle = 'var(--c)';
                          content = isMutated ? `MUTÉ VERS : ${destLabel}` : destLabel;
                          cursorStyle = 'default';
                        } else if (isPermission || status === 'P') {
                          bgStyle = 'rgba(239, 68, 68, 0.2)';
                          textStyle = '#ef4444';
                          cursorStyle = !lockedPermissions[agent.id] ? 'pointer' : 'not-allowed';
                          content = <span style={{ fontWeight: 'bold' }}>P</span>;
                        } else if (status === 'MAP') {
                          bgStyle = 'rgba(220, 38, 38, 0.22)';
                          textStyle = '#f87171';
                          cursorStyle = 'not-allowed';
                          content = <span style={{ fontSize: '0.52rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase' }}>MAP</span>;
                        } else if (!status || status === '') {
                          // Dynamic rendering for RELV
                          const jsDay = d.getDay() || 7;
                          const subsiteId = subsite.id || 'default';
                          const daysForSubsite = agent.scheduled_days_by_subsite && agent.scheduled_days_by_subsite[subsiteId] ? agent.scheduled_days_by_subsite[subsiteId] : [];
                          const isScheduledHere = agent.is_scheduled_releve && (daysForSubsite.includes(String(jsDay)) || daysForSubsite.includes(jsDay) || (agent.scheduled_days && !agent.scheduled_days_by_subsite && (agent.scheduled_days.includes(String(jsDay)) || agent.scheduled_days.includes(jsDay))));

                          if (isScheduledHere && activeSiteId !== 'site_releves') {
                            const cellKey = `${agent.id}-${dk}-${sc}`;
                            if (toggledRelvCells[cellKey]) {
                              bgStyle = 'rgba(249, 115, 22, 0.2)'; // orange
                              textStyle = '#f97316';
                              cursorStyle = 'pointer';
                              content = <span title="Urgence : muté ailleurs" style={{ fontWeight: 'bold' }}>T</span>;
                            } else {
                              bgStyle = 'rgba(16, 185, 129, 0.1)';
                              textStyle = '#10b981';
                              cursorStyle = 'pointer';
                              content = <span title={`Provient du vivier ou de relève`} style={{ fontWeight: 'bold' }}>RELV</span>;
                            }
                          } else if (!agent.is_extra && !agent.is_releve && activeSiteId !== 'site_extras' && activeSiteId !== 'site_releves') {
                            bgStyle = reposCellBg; // Couleur repos configurable (ou blanc par défaut si désactivé)
                            textStyle = enableReposBg ? 'rgba(150,150,150,0.4)' : 'rgba(200,200,200,0.5)';
                            content = '';
                          } else {
                            bgStyle = 'rgba(255,255,255,0.03)'; // Sombre pour extras/relèves
                            textStyle = 'rgba(255,255,255,0.2)';
                            content = '';
                          }
                        }
                      }

                      if (agent.status_change && !isMutated && !isPrevMutated && !isSortant && !isEntrant && !isCp && !isPermission && !['A', 'MAP', 'M', 'AT', 'CP', 'R'].includes(status)) {
                        try {
                          const scObj = JSON.parse(agent.status_change);
                          if (scObj.color_new && dk >= scObj.date) {
                            bgStyle = (scObj.color_hex || '#f97316') + '40'; // Custom color with ~25% opacity
                            if (status === '1') textStyle = scObj.color_hex || '#f97316';
                          }
                        } catch (e) { }
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
                        } else if (enableAnimations) {
                          const isDetached = (agent.is_extra && activeSiteId !== 'site_extras') || (agent.is_releve && activeSiteId !== 'site_releves');
                          if ((status === '1' && !isDetached) || (status && typeof status === 'string' && status.startsWith('EXT|') && activeSiteId === 'site_extras') || (status && typeof status === 'string' && status.startsWith('REL|') && activeSiteId === 'site_releves') || (status && typeof status === 'string' && status.startsWith('ADM|') && activeSiteId === 'site_administration')) {
                            pulseClass = 'pulse-green';
                          } else if ((status === 'A' && !isDetached) || (status && typeof status === 'string' && (status.startsWith('EXT_A|') || status.startsWith('REL_A|')))) {
                            pulseClass = 'pulse-red';
                          } else if (['M', 'CP', 'AT', 'MAP', 'P'].includes(status) || isCp || isPermission) {
                            pulseClass = 'pulse-amber';
                          } else if ((sc === 'S' || sc === 'SJ' || sc === 'SN') && status !== '') {
                            pulseClass = 'pulse-blue';
                          } else if (status && typeof status === 'string' && (status.startsWith('EXT|') || status.startsWith('EXT_R|') || status.startsWith('REL|') || status.startsWith('REL_R|'))) {
                            pulseClass = 'pulse-blue';
                          } else if (status && typeof status === 'string' && (status.startsWith('EXT_1|') || status.startsWith('REL_1|') || status.startsWith('M_1|'))) {
                            pulseClass = 'pulse-blue';
                          }
                        }
                      }

                      const colSpan = isEntrant ? entrantSpanCount : (isSortant ? sortantSpanCount : (isCp ? cpSpanCount : (isMutated ? (datesList.length - dIdx) : (isPrevMutated ? pmCount : 1))));

                      const isMutOrPm = isMutated || isPrevMutated;
                      const showModernPulse = isModernTheme && !isMutOrPm && !isNonPresent && !isSortant && !isEntrant && !isCp;
                      const isCellSelected = selectionStart && selectionEnd &&
                        myRowIdx >= Math.min(selectionStart.r, selectionEnd.r) &&
                        myRowIdx <= Math.max(selectionStart.r, selectionEnd.r) &&
                        dIdx >= Math.min(selectionStart.c, selectionEnd.c) &&
                        dIdx <= Math.max(selectionStart.c, selectionEnd.c);
                      const isColumnSelected = (selectedCell && selectedCell.dateKey === dk && selectedCell.agentId === null) ||
                        (selectionStart && selectionEnd && dIdx >= Math.min(selectionStart.c, selectionEnd.c) && dIdx <= Math.max(selectionStart.c, selectionEnd.c));
                      cells.push(
                        <td
                          id={`cell-${agent.id}-${dk}-${sc}`}
                          key={dIdx}
                          className={cellClassSuffix}
                          data-r={myRowIdx}
                          data-c={dIdx}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowRight') {
                              e.preventDefault();
                              const next = document.querySelector(`td[data-r="${myRowIdx}"][data-c="${dIdx + 1}"]`);
                              if (next) next.focus();
                            } else if (e.key === 'ArrowLeft') {
                              e.preventDefault();
                              const prev = document.querySelector(`td[data-r="${myRowIdx}"][data-c="${dIdx - 1}"]`);
                              if (prev) prev.focus();
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const down = document.querySelector(`td[data-r="${myRowIdx + 1}"][data-c="${dIdx}"]`);
                              if (down) down.focus();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const up = document.querySelector(`td[data-r="${myRowIdx - 1}"][data-c="${dIdx}"]`);
                              if (up) up.focus();
                            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                              e.preventDefault();
                              if (!isArchiveMode && isEditMode) handleCellClick(agent.id, dk, sc, status, '');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.click();
                            }
                          }}
                          onFocus={() => {
                            // La sélection ne se déclenche plus au focus d'une cellule unique
                          }}
                          colSpan={colSpan}
                          rowSpan={(isEntrant || isCp) && scIdx === 0 ? shiftRows.filter(r => !r.startsWith('S')).length : 1}
                          onMouseDown={(e) => {
                            if (paintModeActive) {
                              if (!isArchiveMode && isEditMode) handleCellClick(agent.id, dk, sc, status, paintStatus);
                            } else if (isArchiveMode) {
                              setIsSelecting(true);
                              setSelectedCell(null); // Clear column selection
                              setSelectionStart({ r: myRowIdx, c: dIdx });
                              setSelectionEnd({ r: myRowIdx, c: dIdx });
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (paintModeActive && e.buttons === 1) {
                              if (!isArchiveMode && isEditMode) handleCellClick(agent.id, dk, sc, status, paintStatus);
                            } else if (isArchiveMode && isSelecting) {
                              setSelectionEnd({ r: myRowIdx, c: dIdx });
                            }
                          }}
                          onClick={() => {
                            // Keep original onClick if we want but drag selection overrides it visually
                            if (isArchiveMode) {
                              return;
                            }
                            if (!isEditMode) {
                              // Allowed to select column in read-only mode, but no state modification
                              return;
                            }
                            const isDistantReleve = agent.is_releve && activeSiteId !== 'site_releves';
                            if (activeSiteId === 'site_releves' && agent.is_releve && (sc === 'SJ' || sc === 'SN')) return;
                            if (isNonPresent || isPrevMutated || isCp || isSortant || isEntrant) return;
                            // Temps partiel : clic sur jour hors planning -> toggle 1 / vide
                            if (isSpecialRest) {
                              handleCellClick(agent.id, dk, sc, status, status === '1' ? '' : '1');
                              return;
                            }
                            if (status === 'P' && lockedPermissions[agent.id]) return;
                            if (status && status.startsWith('Suppl')) return;
                            if (status === 'T' || (status && status.startsWith('T|'))) return;
                            if (!isValidRow && (!status || status === '')) return;
                            if (agent.is_mutated && !agent.is_extra) return;

                            if (isDistantReleve) {
                              const jsDay = d.getDay() || 7;
                              const subsiteId = subsite.id || 'default';
                              const daysForSubsite = agent.scheduled_days_by_subsite && agent.scheduled_days_by_subsite[subsiteId] ? agent.scheduled_days_by_subsite[subsiteId] : [];
                              const isScheduledHere = agent.is_scheduled_releve && (daysForSubsite.includes(String(jsDay)) || daysForSubsite.includes(jsDay) || (agent.scheduled_days && !agent.scheduled_days_by_subsite && (agent.scheduled_days.includes(String(jsDay)) || agent.scheduled_days.includes(jsDay))));

                              if (isScheduledHere && (!status || status === '' || status === '1' || status === 'R')) {
                                // Purely visual toggle RELV <-> T
                                const cKey = `${agent.id}-${dk}-${sc}`;
                                setToggledRelvCells(prev => ({
                                  ...prev,
                                  [cKey]: !prev[cKey]
                                }));
                                return;
                              } else if (!isScheduledHere) {
                                const currentSiteName = sites.find(s => String(s.id) === String(activeSiteId))?.name || '';
                                if (!status || status === '' || (status && (status.startsWith('REL|') || status.startsWith('REL_T|')))) {
                                  // Click on empty day -> Supplementary (S => REL_1)
                                  handleCellClick(agent.id, dk, sc, status, 'S', agent);
                                } else if (status && status.startsWith('REL_1|')) {
                                  const dest = status.split('|')[1];
                                  if (dest === currentSiteName) {
                                    // Click again on SAME site -> Restore to Vivier
                                    const vivierName = sites.find(s => String(s.id) === 'site_releves')?.name || 'Vivier des relèves';
                                    handleCellClick(agent.id, dk, sc, status, 'REL|' + vivierName, agent);
                                  } else {
                                    // Click on ANOTHER site while already supplementary elsewhere -> Overwrite to THIS site
                                    if (window.confirm(`Cet agent effectue déjà un supplémentaire sur le site "${dest}". Voulez-vous l'annuler et l'assigner à ce site (${currentSiteName}) à la place ?`)) {
                                      handleCellClick(agent.id, dk, sc, status, 'S', agent);
                                    }
                                  }
                                }
                                return;
                              }
                            }

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
                            
                            if (isSortant) {
                              e.stopPropagation();
                              setCellContextMenu({
                                visible: true, x: e.clientX, y: e.clientY,
                                agentId: agent.id, dateKey: dk, shiftCode: sc, currentStatus: status
                              });
                              return;
                            } else if (isEntrant) {
                              e.stopPropagation();
                              setCellContextMenu({
                                visible: true, x: e.clientX, y: e.clientY,
                                agentId: agent.id, dateKey: dk, shiftCode: sc, currentStatus: status, isEntrant: true, entrantDate: agent.hire_date || agent.entry_date
                              });
                              return;
                            }

                            // Permissions, MAP and CP details are readable even in Read-Only Mode
                            if (isCp) {
                              const foundLeave = currentCpLeave || leave || leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'CP' && l.start_date <= dk && l.end_date >= dk);
                              if (foundLeave) {
                                setCpInfoModal({ agent, leave: foundLeave });
                              }
                              return;
                            }

                            if (status === 'P') {
                              const foundLeave = leave || leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'P' && l.start_date <= dk && l.end_date >= dk);
                              if (foundLeave) {
                                setPermissionDetailsModal({ ...foundLeave, agent_name: agent.name });
                              } else {
                                setPermissionDetailsModal({ agent_id: agent.id, agent_name: agent.name, type: 'P', start_date: dk, end_date: dk });
                              }
                              return;
                            }

                            if (status === 'MAP') {
                              const foundLeave = leave || leaves.find(l => String(l.agent_id) === String(agent.id) && l.type === 'MAP' && l.start_date <= dk && l.end_date >= dk);
                              if (foundLeave) {
                                setPermissionDetailsModal({ ...foundLeave, agent_name: agent.name });
                              } else {
                                setPermissionDetailsModal({ agent_id: agent.id, agent_name: agent.name, type: 'MAP', start_date: dk, end_date: dk });
                              }
                              return;
                            }

                            if (status && status.startsWith('Suppl')) {
                              if (setExternalSuppDetailsModal) {
                                setExternalSuppDetailsModal({ agent_id: agent.id, date: dk });
                              }
                              return;
                            }

                            // Block everything else if not in Edit Mode
                            if (!isEditMode) return;

                            if (isNonPresent || isPrevMutated || isEntrant) return;
                            if ((agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated || isSortant) return;

                            if (status === 'T') {
                              setTransferModal({ agentId: agent.id, dateKey: dk, shiftCode: sc, currentStatus: status, agentName: agent.name });
                              return;
                            }
                            if ((status && status.startsWith('T|')) || (status && status.startsWith('REL_T|'))) {
                              const parts = status.split('|');
                              setTransferDetailsData({ agentId: agent.id, agentName: agent.name, dateKey: dk, shiftCode: sc, targetSite: parts[1], replacedAgent: parts[2], motif: parts[3] });
                              setShowTransferDetailsModal(true);
                              return;
                            }

                            if (status && status.startsWith('Suppl')) {
                              const parts = status.split('|');
                              const destSite = parts[1];
                              const replacedAgentId = parts[2] || '';
                              const motif = parts[3] || '';
                              setReleveSupplModal({ destSite, replacedAgentId, motif, agentId: agent.id, dateKey: dk, shiftCode: sc, status });
                              return;
                            }

                            if (status && status.startsWith('REL_1|')) {
                              const parts = status.split('|');
                              const destSite = parts[1];
                              const replacedAgentId = parts[2] || '';
                              const motif = parts[3] || '';
                              setReleveSupplModal({ destSite, replacedAgentId, motif, agentId: agent.id, dateKey: dk, shiftCode: sc, status });
                              return;
                            }

                            if (status === 'A' && lockedAbsences[agent.id]) return;

                            if (sc === 'S' || sc === 'SJ' || sc === 'SN') {
                              if (agent.is_releve) {
                                let destSite = activeSiteName;
                                let replacedAgentId = '';
                                let motif = '';
                                if (status && status.startsWith('REL_1|')) {
                                  const parts = status.split('|');
                                  destSite = parts[1] || destSite;
                                  replacedAgentId = parts[2] || '';
                                  motif = parts[3] || '';
                                }
                                setReleveSupplModal({ destSite, replacedAgentId, motif, agentId: agent.id, dateKey: dk, shiftCode: sc, status });
                              } else {
                                const hours = prompt("Modifier les heures supplémentaires (ex: 2, 4) ou laissez vide pour effacer:");
                                if (hours !== null) {
                                  handleCellClick(agent.id, dk, sc, status, hours.trim());
                                }
                              }
                            } else {
                              setContextMenu({ x: e.clientX, y: e.clientY, agentId: agent.id, dateKey: dk, shiftCode: sc, isAdminSchedule: !!agent?.profile_data?.admin_schedule });
                            }
                          }}
                          style={{
                            textAlign: 'center',
                            padding: '8px 4px',
                            minWidth: '32px',
                            background: isCp ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.85), rgba(51, 65, 85, 0.95))' : ((isMutated || isPrevMutated) ? 'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.1) 10px, rgba(245, 158, 11, 0.05) 10px, rgba(245, 158, 11, 0.05) 20px)' : bgStyle),
                            color: isCp || isSortant || isEntrant ? '#f8fafc' : textStyle,
                            cursor: isArchiveMode || !isEditMode ? 'default' : ((agent.is_mutated && !agent.is_extra && !agent.is_releve) || isMutated || isPrevMutated || isNonPresent || isCp || isSortant || isEntrant ? 'not-allowed' : cursorStyle),
                            borderRight: isCp || isSortant || isEntrant ? '1px solid rgba(148, 163, 184, 0.4)' : ((sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.02)')),
                            borderBottom: isCp || isSortant ? '1px solid rgba(148, 163, 184, 0.4)' : ((sc === 'S' || sc === 'SJ' || sc === 'SN') ? '1px solid rgba(56,189,248,0.25)' : (status === '' ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border)')),
                            outline: isColumnSelected ? '2px solid rgba(129, 140, 248, 0.5)' : (isCellSelected ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'),
                            outlineOffset: '-2px',
                            zIndex: isColumnSelected || isCellSelected ? 1 : 'auto',
                            position: isColumnSelected || isCellSelected ? 'relative' : 'static',
                            transition: 'background 0.2s, outline 0.2s',
                            fontWeight: status !== '' ? 'bold' : 'normal',
                            opacity: isSaving ? 0.5 : 1,
                            letterSpacing: (isMutated || isPrevMutated) ? '1px' : 'normal'
                          }}
                          title={isMutated ? `Muté vers ${status.substring(2)}` : (isPrevMutated ? status.substring(3) : (isNonPresent ? "Pas encore affecté" : `${agent.name} - ${sc} - ${dk}`))}
                        >
                          {showModernPulse ? (
                            <div className={pulseClass} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              fontSize: baseTextSize,
                              margin: '0 auto',
                              transition: 'all 0.2s ease-in-out'
                            }}>
                              {content}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', width: '100%' }}>
                              <span style={{
                                fontSize: isEntrant ? (entrantSpanCount <= 1 ? '0.65rem' : '0.85rem') : (isSortant ? (sortantSpanCount <= 1 ? '0.65rem' : '0.85rem') : (isCp ? (cpSpanCount <= 1 ? '0.65rem' : (cpSpanCount <= 2 ? '0.75rem' : (cpSpanCount <= 4 ? '0.85rem' : '0.95rem'))) : ((isMutated || isPrevMutated) ? '0.9rem' : baseTextSize))),
                                color: (isMutated || isPrevMutated) ? 'var(--c)' : 'inherit',
                                textTransform: (isMutated || isPrevMutated) ? 'uppercase' : 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                                display: 'block',
                                lineHeight: '1.1'
                              }}>{content}</span>
                            </div>
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
                  )}
                </DraggableAgentRow>
              );
            });

            if (agentSpacingMode === 'spacer' || agentSpacingMode === 'large_spacer') {
              const h = agentSpacingMode === 'large_spacer' ? '32px' : '16px';
              rows.push(
                <tr key={`spacer-${agent.id}`} style={{ height: h }}>
                  <td style={{ position: 'sticky', left: 0, background: '#0b1220', borderRight: 'none', borderBottom: '1px solid transparent' }}><div style={{ height: h }}></div></td>
                  <td style={{ position: 'sticky', left: '250px', background: '#0b1220', borderRight: 'none', borderBottom: '1px solid transparent' }}></td>
                  {!isVerificationMode && !isArchiveMode && <td style={{ position: 'sticky', left: '315px', background: '#0b1220', borderRight: 'none', borderBottom: '1px solid transparent' }}></td>}
                  <td style={{ position: 'sticky', left: (!isVerificationMode && !isArchiveMode) ? '360px' : '315px', background: '#0b1220', borderRight: 'none', borderBottom: '1px solid transparent' }}></td>
                  <td colSpan={datesList.length} style={{ background: 'transparent', borderBottom: '1px solid transparent' }}></td>
                </tr>
              );
            }

            return rows;
          };

          let forceIndividual = false;
          const activeSiteObj = sites.find(s => s.id === activeSiteId);
          
          if (siteTableModes && siteTableModes[activeSiteId]) {
            forceIndividual = siteTableModes[activeSiteId] === 'individual';
          } else if (activeSiteId === 'site_extras' || activeSiteId === 'site_releves') {
            forceIndividual = true;
          } else {
            forceIndividual = agentTableMode === 'individual';
          }
          
          const currentSiteMode = forceIndividual ? 'individual' : 'grouped';

          if (forceIndividual) {
            return (
              <div key={subsite.id} style={{ marginTop: '16px' }}>
                <div className="glass-panel subsite-card" style={{ padding: '10px 14px', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', background: currentSiteMode === 'individual' ? '#ffffff' : undefined, color: currentSiteMode === 'individual' ? '#0f172a' : undefined }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, color: currentSiteMode === 'individual' ? '#0f172a' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                    {isMutatedGroup ? '🔄' : '📍'} {subsite.name} {subsite.contract_end_date && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>/ Fin de contrat le {new Date(subsite.contract_end_date).toLocaleDateString('fr-FR')}</span>}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: currentSiteMode === 'individual' ? '#64748b' : 'var(--muted)', marginLeft: '6px' }}>
                      ({filteredAgents.length} agent(s))
                    </span>
                  </h3>
                  {!isMutatedGroup && !isArchiveMode && subsite.id !== 'virtual_releves' && (
                    <div style={{ display: 'flex', gap: '8px', position: 'absolute', right: '14px' }}>
                      <button
                        onClick={() => {
                          const agentsToClear = (filteredAgents || []).filter(a => a && a.id);
                          setTreatedAgents(prev => {
                            const next = { ...prev };
                            agentsToClear.forEach(a => {
                              delete next[a.id];
                            });
                            if (currentTreatedKey.current) {
                              try { localStorage.setItem(currentTreatedKey.current, JSON.stringify(next)); } catch (e) {}
                            }
                            return next;
                          });
                          agentsToClear.forEach(a => {
                            apiCall('toggle_treated_agent', { site_id: activeSiteId, period, agent_id: a.id, treated: false });
                          });
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px', background: 'transparent', border: 'none', color: '#10b981', marginRight: '28px' }}
                        title="Effacer les marqueurs 'traité' de cette zone"
                      >
                        🧹
                      </button>
                      <button 
                        onClick={requireEditMode(() => setExternalSuppModal && setExternalSuppModal({ subsite }))}
                        className="btn btn-secondary" 
                        style={{ padding: '4px', background: 'transparent', border: 'none', color: '#8b5cf6' }}
                        title="Ajouter un supplémentaire externe"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        onClick={requireEditMode(() => setMoveZoneAgent({ subsite_id: subsite.id, from_header: true }))}
                        className="btn btn-secondary" 
                        style={{ padding: '4px', background: 'transparent', border: 'none', color: '#0ea5e9' }}
                        title="Changer un agent de zone"
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                      <button 
                        onClick={requireEditMode(() => setZoneConfigModalData({ ...subsite, enabled_functions: Array.isArray(subsite.enabled_functions) ? subsite.enabled_functions : (typeof subsite.enabled_functions === 'string' ? JSON.parse(subsite.enabled_functions) : []) }))}
                        className="btn btn-secondary" 
                        style={{ padding: '4px', background: 'transparent', border: 'none', color: subsite.costume_enabled === 1 ? 'var(--primary)' : 'var(--muted)' }}
                        title="Configuration de la zone"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={requireEditMode(() => handleRenameSubsite(subsite.id, subsite.name))}
                        className="btn btn-secondary" 
                        style={{ padding: '4px', background: 'transparent', border: 'none', color: currentSiteMode === 'individual' ? '#475569' : undefined }}
                        title="Renommer la zone"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={requireEditMode(() => handleDeleteSubsite(subsite.id))}
                        className="btn btn-logout" 
                        style={{ padding: '4px', color: currentSiteMode === 'individual' ? '#ef4444' : 'var(--muted)' }}
                        title="Supprimer la zone"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {filteredAgents.length === 0 ? (
    <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
      Aucun agent dans cette zone.
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      {filteredAgents.map((agent, index) => {
        if (!agent) return null;
        const rows = renderAgentRows(agent, index);
        const prevAgent = index > 0 ? filteredAgents[index - 1] : null;
        const isFirstReleve = agent.is_releve && (!prevAgent || !prevAgent.is_releve);
        return (
          <DroppableZone key={agent.id} id={subsite.id || `agent-${agent.id}`}>
            <div className="glass-panel subsite-card" style={{ padding: '10px 10px', overflowX: 'auto' }}>
            {isFirstReleve && (
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '8px', textAlign: 'center', borderTop: '2px solid rgba(56, 189, 248, 0.3)', borderBottom: '2px solid rgba(56, 189, 248, 0.3)', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#38bdf8', letterSpacing: '1px', fontSize: '0.85rem' }}>🔄 AGENTS RELEVE</span>
              </div>
            )}
            <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.88rem', borderSpacing: 0, tableLayout: 'fixed', width: '100%', minWidth: `${tableWidthPx}px` }}>
                {renderTableHeader()}
                <tbody>
                  {rows}
                </tbody>
              </table>
            </div>
            </div>
          </DroppableZone>
        );
      })}
    </div>
  )
}
              </div >
            );
          }

return (
  <DroppableZone key={subsite.id} id={subsite.id}>
    <div className="glass-panel subsite-card" style={{ marginTop: '16px', padding: '8px 10px', overflowX: 'auto', background: isMutatedGroup ? 'rgba(14, 165, 233, 0.05)' : undefined, border: isMutatedGroup ? '1px solid rgba(14, 165, 233, 0.2)' : undefined }}>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', position: 'relative' }}>
      <h3 style={{ fontSize: '1.05rem', margin: 0, color: isMutatedGroup ? 'var(--c)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
        {isMutatedGroup ? '🔄' : '📍'} {subsite.name} {subsite.contract_end_date && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>/ Fin de contrat le {new Date(subsite.contract_end_date).toLocaleDateString('fr-FR')}</span>}
        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '6px' }}>
          ({filteredAgents.length} agent(s))
        </span>
      </h3>
      {!isMutatedGroup && !isArchiveMode && subsite.id !== 'virtual_releves' && (
        <div style={{ display: 'flex', gap: '8px', position: 'absolute', right: 0 }}>

          <button
            onClick={() => {
              const agentsToClear = (filteredAgents || []).filter(a => a && a.id);
              setTreatedAgents(prev => {
                const next = { ...prev };
                agentsToClear.forEach(a => {
                  delete next[a.id];
                });
                if (currentTreatedKey.current) {
                  try { localStorage.setItem(currentTreatedKey.current, JSON.stringify(next)); } catch (e) {}
                }
                return next;
              });
              agentsToClear.forEach(a => {
                apiCall('toggle_treated_agent', { site_id: activeSiteId, period, agent_id: a.id, treated: false });
              });
            }}
            className="btn btn-secondary"
            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#10b981', marginRight: '28px' }}
            title="Effacer les marqueurs 'traité' de cette zone"
          >
            🧹
          </button>
          <button 
            onClick={requireEditMode(() => setExternalSuppModal && setExternalSuppModal({ subsite }))}
            className="btn btn-secondary" 
            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#8b5cf6' }}
            title="Ajouter un supplémentaire externe"
          >
            <ExternalLink size={16} />
          </button>
          <button 
            onClick={requireEditMode(() => setMoveZoneAgent({ subsite_id: subsite.id, from_header: true }))}
            className="btn btn-secondary" 
            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#0ea5e9' }}
            title="Changer un agent de zone"
          >
            <ArrowLeftRight size={16} />
          </button>
          <button
            onClick={requireEditMode(() => setZoneConfigModalData({ ...subsite, enabled_functions: Array.isArray(subsite.enabled_functions) ? subsite.enabled_functions : (typeof subsite.enabled_functions === 'string' ? JSON.parse(subsite.enabled_functions) : []) }))}
            className="btn btn-secondary"
            style={{ padding: '4px', background: 'transparent', border: 'none', color: subsite.costume_enabled === 1 ? 'var(--primary)' : 'var(--muted)' }}
            title="Configuration de la zone"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={requireEditMode(() => handleRenameSubsite(subsite.id, subsite.name))}
            className="btn btn-secondary"
            style={{ padding: '4px', background: 'transparent', border: 'none' }}
            title="Renommer la zone"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={requireEditMode(() => handleDeleteSubsite(subsite.id))}
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
      <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
        <table className="custom-table" style={{ fontSize: '0.88rem', borderSpacing: 0, tableLayout: 'fixed', width: '100%', minWidth: `${tableWidthPx}px` }}>
          {renderTableHeader()}
          <tbody onMouseUp={() => setIsSelecting(false)}>
            {filteredAgents.map((agent, index) => {
              if (!agent) return null;
              const rows = renderAgentRows(agent, index);
              const prevAgent = index > 0 ? filteredAgents[index - 1] : null;
              
              const isFirstMutated = agent.is_mutated && !agent.is_extra && !agent.is_releve && (!prevAgent || (!prevAgent.is_mutated || prevAgent.is_extra || prevAgent.is_releve));
              const isFirstExtra = agent.is_extra && (!prevAgent || !prevAgent.is_extra);
              const isFirstReleve = agent.is_releve && (!prevAgent || !prevAgent.is_releve);
              
              return (
                <React.Fragment key={agent.id}>
                  {isFirstMutated && (
                    <tr>
                      <td colSpan={datesList.length + 4} style={{ background: 'rgba(14, 165, 233, 0.05)', padding: '4px', textAlign: 'center', borderTop: '2px solid rgba(14, 165, 233, 0.3)', borderBottom: '2px solid rgba(14, 165, 233, 0.3)' }}>
                        <span style={{ fontWeight: 'bold', color: '#0ea5e9', letterSpacing: '1px', fontSize: '0.8rem' }}>🔄 AGENTS MUTÉS (Temporaire)</span>
                      </td>
                    </tr>
                  )}
                  {isFirstExtra && (
                    <tr>
                      <td colSpan={datesList.length + 4} style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '4px', textAlign: 'center', borderTop: '2px solid rgba(245, 158, 11, 0.3)', borderBottom: '2px solid rgba(245, 158, 11, 0.3)' }}>
                        <span style={{ fontWeight: 'bold', color: '#f59e0b', letterSpacing: '1px', fontSize: '0.8rem' }}>⚡ EXTRAS</span>
                      </td>
                    </tr>
                  )}
                  {isFirstReleve && (
                    <tr>
                      <td colSpan={datesList.length + 4} style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '4px', textAlign: 'center', borderTop: '2px solid rgba(56, 189, 248, 0.3)', borderBottom: '2px solid rgba(56, 189, 248, 0.3)' }}>
                        <span style={{ fontWeight: 'bold', color: '#38bdf8', letterSpacing: '1px', fontSize: '0.8rem' }}>🔄 AGENTS RELÈVE</span>
                      </td>
                    </tr>
                  )}
                  {rows}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
  </DroppableZone>
);
          });
          }) ()}
    </>
  );
}
