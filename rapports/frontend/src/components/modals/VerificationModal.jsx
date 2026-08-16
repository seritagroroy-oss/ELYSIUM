import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, X, ShieldAlert, CheckCircle2, ChevronRight, Loader2, Activity } from 'lucide-react';
import { apiCall } from '../../api';

const VerificationModal = ({ sites, period, cycleStart, onClose }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSiteIndex, setCurrentSiteIndex] = useState(0);
  const [siteStatuses, setSiteStatuses] = useState(
    sites.map(s => ({ id: s.id, name: s.name, status: 'pending', errorCount: 0, warningCount: 0 }))
  );
  
  const [anomalies, setAnomalies] = useState([]);
  
  const generateDates = (p, cs) => {
    const [y, m] = p.split('-').map(Number);
    const dates = [];
    const start = new Date(y, m - 2, cs);
    const end = new Date(y, m - 1, cs - 1);
    let curr = new Date(start);
    while (curr <= end) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    const runScan = async () => {
      let currentAnomalies = [];
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const localDatesList = generateDates(period, cycleStart);

      let globalAgentAttendance = {};

      for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        setCurrentSiteIndex(i);
        
        // Update status to scanning
        setSiteStatuses(prev => {
          const next = [...prev];
          next[i].status = 'scanning';
          return next;
        });

        try {
          // Fetch data for this specific site
          const res = await apiCall('get_dashboard_init', { period, site_id: site.id }, 'GET');
          
          if (res && res.success && Array.isArray(res.site_data)) {
            const agents = res.site_data.flatMap(sub => sub.agents || []);
            
            let siteErrCount = 0;
            let siteWarnCount = 0;

            agents.forEach(agent => {
              const attMap = {};
              
              // Global tracking by normalized name to link original and extra records
              const agentKey = (agent.name || '').trim().toLowerCase();
              if (!agentKey) return; // Skip if no name

              if (!globalAgentAttendance[agentKey]) {
                globalAgentAttendance[agentKey] = { name: agent.name, dates: {} };
              }

              if (Array.isArray(agent.attendance)) {
                agent.attendance.forEach(a => {
                  if (!attMap[a.date]) attMap[a.date] = [];
                  attMap[a.date].push(a);

                  // Add to global
                  if (!globalAgentAttendance[agentKey].dates[a.date]) {
                    globalAgentAttendance[agentKey].dates[a.date] = [];
                  }
                  globalAgentAttendance[agentKey].dates[a.date].push({
                    status: a.status,
                    siteName: site.name,
                    shift: a.shift || 'jour'
                  });
                });
              }

              localDatesList.forEach(d => {
                const dk = typeof d === 'string' ? d : (d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'));
                const isPast = dk < todayStr;
                
                const dayAtts = attMap[dk] || [];
                const contractStart = agent.contract_start_date || agent.date_entree;
                const contractEnd = agent.contract_end_date || agent.date_sortie;
                const isBeforeStart = contractStart && dk < contractStart;
                const isAfterEnd = contractEnd && dk > contractEnd;

                const hasPresence = dayAtts.some(a => a.status && a.status !== '' && !a.status.startsWith('S') && !a.status.startsWith('A') && !a.status.startsWith('EXT_A'));
                
                if (hasPresence && (isBeforeStart || isAfterEnd)) {
                  currentAnomalies.push({
                      severity: 'error', siteName: site.name, agentName: agent.name, date: dk,
                      message: `Pointage alors que l'agent est ${isBeforeStart ? "avant sa date d'entrée" : "après sa date de sortie"}.`
                  });
                  siteErrCount++;
                }

                if (isPast && !isBeforeStart && !isAfterEnd && !agent.is_extra) {
                  if (dayAtts.length === 0 || dayAtts.every(a => !a.status || a.status === '')) {
                      currentAnomalies.push({
                        severity: 'error', siteName: site.name, agentName: agent.name, date: dk,
                        message: 'Case de pointage vide dans le passé.'
                      });
                      siteErrCount++;
                  }
                }
              });
            });

            // Update status to done
            setSiteStatuses(prev => {
              const next = [...prev];
              next[i].status = 'done';
              next[i].errorCount = siteErrCount;
              next[i].warningCount = siteWarnCount;
              return next;
            });

          } else {
            // Failed or empty
            setSiteStatuses(prev => {
              const next = [...prev];
              next[i].status = 'done';
              return next;
            });
          }
        } catch (e) {
          console.error("Error scanning site", site.name, e);
          setSiteStatuses(prev => {
            const next = [...prev];
            next[i].status = 'done';
            return next;
          });
        }

        setScanProgress(Math.round(((i + 1) / sites.length) * 100));
        
        // Artificial delay for visual effect
        await new Promise(r => setTimeout(r, 400));
      }

      // ==== CROSS-SITE ANOMALY DETECTION ====
      Object.keys(globalAgentAttendance).forEach(agentId => {
        const agentData = globalAgentAttendance[agentId];
        let consecutiveWorkDays = 0;
        let consecutiveAbsences = 0;

        localDatesList.forEach(d => {
          const dk = typeof d === 'string' ? d : (d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'));
          const dayAttsGlob = agentData.dates[dk] || [];

          // 1. Conflict Absence vs SuppExt / Presence
          // Un agent est pointé 'A' sur un site ET '1' ou 'S' sur un autre site
          const absences = dayAttsGlob.filter(a => {
            if (!a.status) return false;
            const s = a.status;
            return s === 'A' || s.startsWith('A|') || s.includes('EXT_A') || s.includes('REL_A') || s.startsWith('A_');
          });
          const presents = dayAttsGlob.filter(a => {
            if (!a.status) return false;
            const s = a.status;
            const isAbs = s === 'A' || s.startsWith('A|') || s.includes('EXT_A') || s.includes('REL_A') || s.startsWith('A_');
            const isRest = s === 'R' || s.startsWith('R|') || s.includes('EXT_R') || s.includes('REL_R') || s.startsWith('R_');
            return !isAbs && !isRest && s.trim() !== '';
          });
          
          if (absences.length > 0 && presents.length > 0) {
            for (let abs of absences) {
              const matchingPres = presents[0]; // Any presence is a conflict
              if (matchingPres) {
                const siteText = abs.siteName !== matchingPres.siteName ? matchingPres.siteName : `un autre poste du même site`;
                currentAnomalies.push({
                    severity: 'error', siteName: abs.siteName, agentName: agentData.name, date: dk,
                    message: `Incohérence : Déclaré "Absent" ici, mais pointé "Présent/Supplémentaire" sur ${siteText}.`
                });
                break; // One error per day per agent is enough
              }
            }
          }

          // 2. Consecutive Work Days
          const isWorking = dayAttsGlob.some(a => a.status === '1' || (a.status && (a.status === 'S' || a.status.startsWith('EXT_1') || a.status.startsWith('REL_1'))));
          const isRest = dayAttsGlob.some(a => a.status === 'R' || (a.status && (a.status.startsWith('EXT_R') || a.status.startsWith('REL_R'))));
          
          if (isWorking) {
            consecutiveWorkDays++;
            if (consecutiveWorkDays >= 7) {
                // Determine the last site they worked at for context
                const lastSite = dayAttsGlob.find(a => a.status === '1' || a.status === 'S' || a.status.startsWith('EXT_'))?.siteName || 'Inconnu';
                currentAnomalies.push({
                  severity: 'warning', siteName: lastSite, agentName: agentData.name, date: dk,
                  message: `L'agent travaille depuis ${consecutiveWorkDays} jours sans repos.`
                });
            }
          } else if (isRest) {
            consecutiveWorkDays = 0;
          }

          // 3. Consecutive Absences
          if (absences.length > 0 && !isWorking) {
            consecutiveAbsences++;
            if (consecutiveAbsences > 3) {
                const absentSite = absences[0].siteName;
                currentAnomalies.push({
                  severity: 'warning', siteName: absentSite, agentName: agentData.name, date: dk,
                  message: `${consecutiveAbsences} jours d'absence consécutifs.`
                });
            }
          } else if (dayAttsGlob.some(a => a.status && a.status !== '')) {
            consecutiveAbsences = 0;
          }
        });
      });

      // Recalculate site error counts based on all global anomalies
      setSiteStatuses(prev => {
        const next = [...prev];
        next.forEach(s => {
          s.errorCount = currentAnomalies.filter(a => a.siteName === s.name && a.severity === 'error').length;
          s.warningCount = currentAnomalies.filter(a => a.siteName === s.name && a.severity === 'warning').length;
        });
        return next;
      });

      setAnomalies(currentAnomalies);
      
      // End scan
      setTimeout(() => {
        setIsScanning(false);
      }, 800);
    };

    if (sites && sites.length > 0) {
      runScan();
    } else {
      setIsScanning(false);
    }
  }, [sites, period, cycleStart]);

  const errors = anomalies.filter(a => a.severity === 'error');
  const warnings = anomalies.filter(a => a.severity === 'warning');

  const groupedAnomalies = anomalies.reduce((acc, current) => {
    if (!acc[current.siteName]) acc[current.siteName] = [];
    acc[current.siteName].push(current);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="modal-content" style={{
        background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
        borderRadius: '20px', width: '900px', maxWidth: '95vw', maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{
          padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(124, 58, 237, 0.3)'
            }}>
              {isScanning ? (
                <Activity size={28} color="#8b5cf6" className={isScanning ? "pulse-anim" : ""} />
              ) : (
                <ShieldAlert size={28} color={errors.length > 0 ? "#ef4444" : "#10b981"} />
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>
                {isScanning ? 'Scanner de Pointage en cours...' : 'Rapport de Vérification Stricte'}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                {isScanning ? `Analyse du mois de ${period}` : 'Résultat de l\'analyse des incohérences avant publication'}
              </p>
            </div>
          </div>
          {!isScanning && (
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer',
              padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
               onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}>
              <X size={24} />
            </button>
          )}
        </div>

        {isScanning ? (
          /* VUE SCANNING EN COURS */
          <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>Progression globale</span>
                <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{scanProgress}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', width: `${scanProgress}%`, 
                  background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                }} />
              </div>
            </div>

            <div style={{ 
              background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '20px', 
              border: '1px solid rgba(255,255,255,0.05)', maxHeight: '400px', overflowY: 'auto' 
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Traitement des sites
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {siteStatuses.map((site, idx) => (
                  <div key={site.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '8px',
                    background: site.status === 'scanning' ? 'rgba(124, 58, 237, 0.15)' : (site.status === 'done' ? 'rgba(255,255,255,0.02)' : 'transparent'),
                    border: site.status === 'scanning' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent',
                    opacity: site.status === 'pending' ? 0.4 : 1
                  }}>
                    <span style={{ color: '#fff', fontWeight: site.status === 'scanning' ? 'bold' : 'normal' }}>
                      {site.name}
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {site.status === 'done' && (site.errorCount > 0 || site.warningCount > 0) && (
                         <div style={{ display: 'flex', gap: '8px' }}>
                           {site.errorCount > 0 && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{site.errorCount} Err</span>}
                           {site.warningCount > 0 && <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{site.warningCount} Warn</span>}
                         </div>
                      )}
                      {site.status === 'pending' && <span style={{ color: '#64748b' }}>En attente</span>}
                      {site.status === 'scanning' && <Loader2 size={18} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />}
                      {site.status === 'done' && <CheckCircle2 size={18} color={site.errorCount > 0 ? "#ef4444" : "#10b981"} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .pulse-anim { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
              @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}} />
          </div>
        ) : (
          /* VUE RAPPORT FINAL (l'ancien contenu de VerificationModal) */
          <>
            {/* STATS SUMMARY */}
            <div style={{ padding: '24px 30px', display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{
                flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={24} color="#ef4444" />
                </div>
                <div>
                  <div style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>{errors.length}</div>
                  <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '4px' }}>Erreurs Critiques</div>
                </div>
              </div>

              <div style={{
                flex: 1, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ color: '#f59e0b', fontSize: '1.8rem', fontWeight: 'bold', lineHeight: '1' }}>{warnings.length}</div>
                  <div style={{ color: '#fcd34d', fontSize: '0.9rem', marginTop: '4px' }}>Avertissements</div>
                </div>
              </div>
            </div>

            {/* LISTE DES ANOMALIES */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 30px 30px 30px' }}>
              {anomalies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 20px auto', opacity: 0.8 }} />
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '0 0 10px 0' }}>Excellente nouvelle !</h3>
                  <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Le pointage de tous les sites est parfait. Vous pouvez publier sereinement.</p>
                </div>
              ) : (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.entries(groupedAnomalies).map(([site, items]) => (
                    <div key={site} style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{
                        padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>🏢</span>
                        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>Site : <span style={{ color: '#fff', fontWeight: 'bold' }}>{site}</span></h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {items.map((anom, idx) => (
                          <div key={idx} style={{
                            padding: '16px 20px', display: 'flex', gap: '16px',
                            borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            background: anom.severity === 'error' ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = anom.severity === 'error' ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' : 'transparent'}
                          >
                            <div style={{ paddingTop: '2px' }}>
                              {anom.severity === 'error' 
                                ? <XCircle size={20} color="#ef4444" />
                                : <AlertTriangle size={20} color="#f59e0b" />
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem' }}>{anom.agentName}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                                  {new Date(anom.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div style={{ color: anom.severity === 'error' ? '#fca5a5' : '#fcd34d', fontSize: '0.95rem' }}>
                                {anom.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '20px 30px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #334155, #1e293b)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                  padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationModal;
