import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Archive, Trash, Eye, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Archives() {
  const { user } = useAuth();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSubsite, setExpandedSubsite] = useState(null);
  const [activeArchiveSiteId, setActiveArchiveSiteId] = useState(null);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_archives', {}, 'GET');
      if (Array.isArray(res)) {
        setArchives(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchives();
  }, []);

  const handleViewArchive = async (id) => {
    if (selectedArchiveId === id) {
      setSelectedArchiveId(null);
      setArchiveDetail(null);
      return;
    }

    setSelectedArchiveId(id);
    setLoadingDetail(true);
    try {
      const res = await apiCall('get_archive_detail', { id }, 'GET');
      if (res && res.success !== false) {
        setArchiveDetail(res);
        if (res.sites && res.sites.length > 0) {
          setActiveArchiveSiteId(res.sites[0].id);
        }
      } else {
        setArchiveDetail(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteArchive = async (id) => {
    if (!window.confirm("Supprimer définitivement cette archive ?")) return;
    try {
      const res = await apiCall('delete_archive', { id });
      if (res.success) {
        if (selectedArchiveId === id) {
          setSelectedArchiveId(null);
          setArchiveDetail(null);
        }
        loadArchives();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Afficher le pointage archivé identique à Mes Sites
  const renderArchiveAttendance = () => {
    if (!archiveDetail) return null;
    const { sites, period } = archiveDetail;
    if (!sites) return null;

    // Dates du cycle 21 → 20
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 2, 21, 12, 0, 0);
    const endDate   = new Date(year, month - 1, 20, 12, 0, 0);
    const dates = [];
    let cur = new Date(startDate);
    while (cur <= endDate) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    const getDayLabel = (dateStr) => ['D','L','M','M','J','V','S'][new Date(dateStr + 'T00:00:00').getDay()];
    const formatDateKey = (dateStr) => dateStr; // already YYYY-MM-DD

    const activeSite = sites.find(s => s.id === activeArchiveSiteId) || sites[0];
    if (!activeSite) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        {(activeSite.subsites || []).map(subsite => {
          if (!subsite) return null;
          const isMutatedGroup = String(subsite.id).startsWith('mutated_');
          return (
            <div key={subsite.id} className="glass-panel" style={{ marginTop: '24px', padding: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: isMutatedGroup ? 'var(--c)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMutatedGroup ? '🔄' : '📍'} {subsite.name}
                  <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted)', marginLeft: '8px' }}>
                    ({(subsite.agents || []).length} agent(s))
                  </span>
                </h3>
              </div>

              {!(subsite.agents && subsite.agents.length > 0) ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>Aucun agent dans cette zone.</div>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="custom-table" style={{ fontSize: '0.88rem', borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '180px', position: 'sticky', left: 0, background: '#0b1220', zIndex: 10 }}>Agent / Poste</th>
                        <th style={{ width: '80px' }}>Poste</th>
                        <th style={{ width: '20px', position: 'sticky', left: '180px', background: '#0b1220', zIndex: 10, padding: '4px 0', fontSize: '0.7rem' }}>Type</th>
                        {dates.map((d, i) => (
                          <th key={i} style={{ textAlign: 'center', padding: '4px 6px', minWidth: '32px', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.72rem' }}>{getDayLabel(d)}</div>
                            <div style={{ fontWeight: 'bold' }}>{parseInt(d.slice(8))}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(subsite.agents || []).map(agent => {
                        if (!agent) return null;

                        // Construire la map d'attendance depuis agent.attendance (snapshot)
                        const attMap = {};
                        (agent.attendance || []).forEach(att => {
                          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
                          attMap[att.shift_code][att.date] = att.status;
                        });

                        const isRotative = ['24h', '48h', '72h'].includes(agent.shift_type);
                        const primaryShift = agent.shift_type === 'Nuit' ? 'N' : 'J';
                        let shiftRows = isRotative ? ['J', 'N'] : [primaryShift];

                        const hasSP = agent.has_sp || (agent.attendance && agent.attendance.some(a => ['S','SJ','SN'].includes(a.shift_code) && a.status && a.status.trim() !== ''));
                        if (hasSP) {
                          shiftRows.push(...(isRotative ? ['SJ', 'SN'] : ['S']));
                        }

                        let totalA = 0, totalSP = 0;
                        dates.forEach(d => {
                          ['J','N'].forEach(s => { if (attMap[s]?.[d] === 'A') totalA++; });
                          ['S','SJ','SN'].forEach(s => { const sp = attMap[s]?.[d]; if (sp === '1' || Number(sp) > 0) totalSP++; });
                        });
                        const totalP = 30 - totalA;

                        return shiftRows.map((sc, scIdx) => (
                          <tr key={`${agent.id}-${sc}`} style={{ background: sc.startsWith('S') ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            {scIdx === 0 ? (
                              <td rowSpan={shiftRows.length} style={{ fontWeight: '600', position: 'sticky', left: 0, background: '#0b1220', zIndex: 9, borderRight: '1px solid var(--border)', minWidth: '220px', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{agent.name}</span>
                                    {agent.is_mutated && <span style={{ fontSize: '0.72rem', color: 'var(--c)' }}>Muté de {agent.original_site}</span>}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                      <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ {totalP}</span>
                                      <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>✗ {totalA}</span>
                                      {totalSP > 0 && <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: 'var(--b)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>+ {totalSP}</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            ) : null}

                            {scIdx === 0 ? (
                              <td rowSpan={shiftRows.length} style={{ verticalAlign: 'middle', padding: '0 8px', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                {agent.function}
                              </td>
                            ) : null}

                            <td style={{ textAlign: 'center', fontWeight: 'bold', position: 'sticky', left: '180px', zIndex: 9, background: sc.startsWith('S') ? '#0f172a' : '#1e293b', color: sc.startsWith('S') ? 'var(--primary)' : 'var(--text-muted)', borderRight: '1px solid var(--border)', fontSize: '0.7rem', padding: '0 1px' }}>
                              {sc === 'S' ? 'SP' : sc === 'SJ' ? 'SP-J' : sc === 'SN' ? 'SP-N' : sc}
                            </td>

                            {dates.map(d => {
                              const status = attMap[sc]?.[d] ?? '';
                              const isMutated = typeof status === 'string' && status.startsWith('M|');
                              let bgStyle = 'transparent', textStyle = '#ccc', content = '';

                              if (sc.startsWith('S')) {
                                if (status && status !== '') { bgStyle = 'rgba(56,189,248,0.55)'; textStyle = '#fff'; content = status; }
                                else { bgStyle = 'rgba(56,189,248,0.08)'; textStyle = 'rgba(56,189,248,0.4)'; }
                              } else {
                                if (status === '1')                     { bgStyle = 'rgba(34,197,94,0.2)';  textStyle = 'var(--a)';      content = '1'; }
                                else if (status === 'R')                { bgStyle = '#ffffff';               textStyle = '#000000';       content = 'R'; }
                                else if (status === 'A')                { bgStyle = 'rgba(239,68,68,0.2)';  textStyle = 'var(--danger)'; content = 'A'; }
                                else if (['M','CP','AT'].includes(status)) { bgStyle = 'rgba(245,158,11,0.2)'; textStyle = '#f59e0b'; content = status; }
                                else if (isMutated)                     { bgStyle = 'rgba(245,158,11,0.15)'; textStyle = 'var(--c)';    content = '🔄'; }
                              }

                              return (
                                <td key={d} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '4px 6px', border: '1px solid var(--border)' }}>
                                  <div style={{ width: '100%', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', background: bgStyle, color: textStyle }}>
                                    {content}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="top-bar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Archive size={24} style={{ color: 'var(--c)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Archives de Pointage</h2>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
        </div>
      ) : archives.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '24px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--c)', marginBottom: '16px' }} />
          <h3>Aucune Archive</h3>
          <p className="subtitle" style={{ marginTop: '8px' }}>
            Rendez-vous dans le Dashboard, sélectionnez une période et cliquez sur "Archiver Période".
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '24px' }}>
          {selectedArchiveId ? (
            <div>
              {/* Barre d'info archive */}
              <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setSelectedArchiveId(null); setArchiveDetail(null); setActiveArchiveSiteId(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>←</span> Archives
                  </button>
                  <div style={{ borderLeft: '1px solid var(--border)', height: '32px' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                      📍 {archiveDetail?.sites?.find(s => s.id === activeArchiveSiteId)?.name || 'Site'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {(() => {
                        if (!archiveDetail?.period) return '';
                        const [y, m] = archiveDetail.period.split('-').map(Number);
                        const s = new Date(y, m - 2, 21);
                        const e = new Date(y, m - 1, 20);
                        const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        return `Période : ${fmt(s)} → ${fmt(e)}`;
                      })()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{archiveDetail?.sites?.length || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Sites</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>
                      {archiveDetail?.sites?.find(s => s.id === activeArchiveSiteId)?.subsites?.reduce((acc, sub) => acc + (sub.agents?.length || 0), 0) || 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Agents</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b' }}>{archiveDetail?.archived_at}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Archivé le</div>
                  </div>
                </div>
              </div>

              {/* Onglets de sites */}
              {archiveDetail?.sites?.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {archiveDetail.sites.map(site => (
                    <button
                      key={site.id}
                      onClick={() => setActiveArchiveSiteId(site.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: activeArchiveSiteId === site.id ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: activeArchiveSiteId === site.id ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                        color: activeArchiveSiteId === site.id ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: activeArchiveSiteId === site.id ? 700 : 500,
                        transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <span>{site.icon || '📍'}</span> {site.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Contenu du pointage */}
              <div>
                {loadingDetail ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 className="animate-spin" size={28} style={{ color: 'var(--b)' }} />
                  </div>
                ) : archiveDetail ? (
                  renderArchiveAttendance()
                ) : (
                  <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                    Impossible de charger le détail de cette archive.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {archives.map((archive, idx) => {
                const glowColors = ['var(--b)', 'var(--a)', 'var(--c)', '#a78bfa', '#f472b6'];
                const glow = glowColors[idx % glowColors.length];
                return (
                  <div
                    key={archive.id}
                    className="site-card"
                    style={{ '--card-glow': glow }}
                    onClick={() => handleViewArchive(archive.id)}
                  >
                    <div className="site-card-inner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: '52px', height: '52px', background: 'rgba(245, 158, 11, 0.12)', 
                          borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          color: 'var(--c)', marginBottom: '16px' 
                        }}>
                          <Archive size={24} />
                        </div>
                        {user?.role === 'admin' && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px', borderRadius: '8px', zIndex: 10 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteArchive(archive.id); }}
                            title="Supprimer cette archive"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                      
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)', lineHeight: '1.4' }}>
                        {(() => {
                          if (!archive.period) return '';
                          const [year, month] = archive.period.split('-');
                          const date = new Date(year, parseInt(month) - 1, 1);
                          const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
                          const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                          
                          const prevMonthDate = new Date(year, parseInt(month) - 2, 21);
                          const currentMonthDate = new Date(year, parseInt(month) - 1, 20);
                          
                          const formatD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          
                          return `Pointage du mois de ${capitalizedMonth} (du ${formatD(prevMonthDate)} au ${formatD(currentMonthDate)})`;
                        })()}
                      </h3>
                      
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>Archivé le {archive.archived_at}</span>
                        <span>Par {archive.archived_by}</span>
                        <span>{archive.sites_count} site(s) enregistrés</span>
                      </div>
                      
                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: glow, fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>Voir les présences</span>
                        <span style={{ fontSize: '1rem' }}>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
