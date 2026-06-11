import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Archive, Trash, Loader2, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Dashboard from './Dashboard';

export default function Archives({ onSwitchToCurrent }) {
  const { user } = useAuth();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchArchiveText, setSearchArchiveText] = useState('');

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

  const handleBackToList = () => {
    setSelectedArchiveId(null);
    setArchiveDetail(null);
  };

  // Si une archive est sélectionnée et chargée, afficher le Dashboard en mode archive
  if (selectedArchiveId && archiveDetail) {
    const archiveMeta = archives.find(a => a.id === selectedArchiveId);
    return (
      <div>
        {/* Barre de retour */}
        <div className="glass-panel" style={{ 
          display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', 
          justifyContent: 'space-between', marginBottom: '20px', padding: '16px 24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <ArrowLeft size={16} /> Archives
            </button>
            <div style={{ borderLeft: '1px solid var(--border)', height: '32px' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗂️ Archive — {(() => {
                  if (!archiveDetail.period) return '';
                  const [year, month] = archiveDetail.period.split('-').map(Number);
                  const date = new Date(year, month - 1, 1);
                  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
                  return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year;
                })()}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>
                  Mode Lecture Seule
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                {(() => {
                  if (!archiveDetail.period) return '';
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
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{archiveDetail.sites?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Sites</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>
                {archiveDetail.sites?.reduce((acc, site) => acc + (site.subsites?.reduce((a, sub) => a + (sub.agents?.length || 0), 0) || 0), 0) || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Agents</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b' }}>{archiveDetail.archived_at}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Archivé le</div>
            </div>
            {archiveMeta && (
              <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a855f7' }}>{archiveDetail.archived_by || '—'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Par</div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard en mode archive (lecture seule) */}
        <Dashboard archiveData={archiveDetail} />
      </div>
    );
  }

  // Écran de chargement du détail
  if (selectedArchiveId && loadingDetail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--b)' }} />
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Chargement de l'archive...</p>
      </div>
    );
  }

  // Liste des archives
  const normalizeString = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredArchives = archives.filter(a => {
    let monthLabel = a.period;
    let formattedService = '';
    if (a.period && a.period.includes('-')) {
       const [y, m] = a.period.split('-');
       const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
       monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    if (a.service_id) {
       formattedService = a.service_id.replace('service_', '').replace('_', ' ');
    }
    const searchable = `${a.period} ${monthLabel} ${formattedService} ${a.archived_by} ${a.archived_at}`;
    return normalizeString(searchable).includes(normalizeString(searchArchiveText));
  });

  return (
    <div>
      <div className="top-bar glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Titre à gauche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Archive size={24} style={{ color: 'var(--c)' }} />
          <h2 style={{ fontSize: '1.4rem', margin: 0, whiteSpace: 'nowrap' }}>Archives de Pointage</h2>
        </div>

        {/* Recherche centrée et élargie */}
        <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', width: '100%', maxWidth: '600px', gap: '10px', transition: 'all 0.2s' }}>
            <Search size={20} style={{ color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher une archive (mois, année, auteur)..." 
              value={searchArchiveText}
              onChange={(e) => setSearchArchiveText(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
            />
          </div>
        </div>

        {/* Bouton retour / Onglets (Optionnel) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {onSwitchToCurrent && (
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
              <button
                className="btn"
                onClick={onSwitchToCurrent}
                style={{ 
                  padding: '6px 16px', 
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                }}
              >
                Actuel
              </button>
              <button
                className="btn btn-primary"
                style={{ 
                  padding: '6px 16px', 
                  background: 'var(--a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Archive size={14} /> Archives
              </button>
            </div>
          )}
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
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Date d'archivage</th>
                  <th>Archivé par</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchives.map((a, i) => {
                  let monthLabel = a.period;
                  if (a.period && a.period.includes('-')) {
                     const [y, m] = a.period.split('-');
                     const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
                     monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                     monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                  }
                  
                  let dateLabel = a.archived_at;
                  if (dateLabel && dateLabel.includes('-')) {
                     // format from YYYY-MM-DD HH:MM:SS to DD/MM/YYYY HH:MM:SS (if needed)
                     const parts = dateLabel.split(' ');
                     if (parts.length > 0) {
                        const dateParts = parts[0].split('-');
                        if (dateParts.length === 3) {
                           dateLabel = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}${parts[1] ? ' ' + parts[1] : ''}`;
                        }
                     }
                  } else if (dateLabel && dateLabel.includes('/')) {
                     // Already DD/MM/YYYY
                     dateLabel = a.archived_at;
                  }

                  const sName = a.service_id ? a.service_id.replace('service_', '').replace('_', ' ').toUpperCase() : 'INCONNU';

                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: '700', color: 'white' }}>
                        {monthLabel}
                        {i === 0 && (
                           <span style={{ marginLeft: '8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Nouveau</span>
                        )}
                      </td>
                      <td>{dateLabel}</td>
                      <td>{a.archived_by}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => handleViewArchive(a.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Consulter
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px', borderRadius: '4px' }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteArchive(a.id); }}
                              title="Supprimer cette archive"
                            >
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
