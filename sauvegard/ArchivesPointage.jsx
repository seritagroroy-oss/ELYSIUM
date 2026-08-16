import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiCall } from '../api';
import { Archive, Trash, Loader2, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../AuthContext';
import Dashboard from './Dashboard';

export default function ArchivesPointage({ onSwitchToCurrent, setView }) {
  const { user } = useAuth();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchArchiveText, setSearchArchiveText] = useState('');
  const [syncingCount, setSyncingCount] = useState(0);
  const [debugSync, setDebugSync] = useState(null);
  const [isAutoSearching, setIsAutoSearching] = useState(!!localStorage.getItem('pontage_auto_search_archive'));

  useEffect(() => {
    const handleAutoSearchComplete = () => setIsAutoSearching(false);
    window.addEventListener('auto_search_complete', handleAutoSearchComplete);
    
    // Fallback de sécurité : masquer l'écran de chargement après 12 secondes si bloqué
    // IMPORTANT : on ne supprime PAS pontage_auto_search_archive ici, car le chargement 
    // peut encore être en cours — le useEffect([archives, loading]) s'en charge.
    let fallbackTimer;
    if (isAutoSearching) {
      fallbackTimer = setTimeout(() => {
        setIsAutoSearching(false);
        // Ne pas supprimer pontage_auto_search_archive ici !
      }, 12000);
    }

    return () => {
      window.removeEventListener('auto_search_complete', handleAutoSearchComplete);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isAutoSearching]);

  const syncOldArchives = async (currentArchives) => {
    try {
      const pubRes = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
      if (pubRes.success && pubRes.published_periods) {
        const existingPeriods = currentArchives.map(a => a.period);
        // Re-sync archives with empty sites too (created before full-data endpoint existed)
        const archivesWithEmptySites = currentArchives.filter(a => {
          // We'll detect these after loading, for now include all missing periods
          return false; // Will be handled separately
        });
        const missingPeriods = pubRes.published_periods.filter(p => !existingPeriods.includes(p));
        
        if (missingPeriods.length > 0) {
          setDebugSync(`Trouvé ${missingPeriods.length} périodes manquantes...`);
          setSyncingCount(missingPeriods.length);
          for (let i = 0; i < missingPeriods.length; i++) {
            const p = missingPeriods[i];
            const [archRes, leavesRes] = await Promise.all([
               apiCall('get_pointage_for_archive', { period: p }, 'GET'),
               apiCall('get_leaves', {}, 'GET')
            ]);
            
            if (archRes.success) {
               const pointageData = { 
                  sites: archRes.sites || [], 
                  globalAgents: archRes.global_agents || [], 
                  leaves: leavesRes.success ? leavesRes.leaves : [] 
               };
               await apiCall('archive_pointage', {
                  period: p,
                  data: JSON.stringify(pointageData)
               });
            }
          }
          setSyncingCount(0);
          setDebugSync("Synchronisation terminée avec succès.");
          return true;
        } else {
           setDebugSync(`Aucune période manquante (Déjà archivé: ${existingPeriods.length}, Publié: ${pubRes.published_periods.length})`);
        }
      } else {
         setDebugSync(`Échec get_published_periods: ${pubRes.message || 'Erreur inconnue'}`);
      }
    } catch (e) {
      console.error("Erreur de récupération auto", e);
      setDebugSync(`Erreur critique: ${e.message}`);
      setSyncingCount(0);
    }
    return false;
  };


  // Re-synchronise les archives existantes qui ont des sites vides
  const resyncEmptyArchives = async () => {
    try {
      const detailsRes = await apiCall('get_archives_pointage_list', {}, 'GET');
      if (!detailsRes.success) return false;
      const archives = detailsRes.archives || [];
      
      // Load detail for each archive and check if sites is empty
      const emptyOnes = [];
      for (const arch of archives) {
        const detail = await apiCall('get_archive_pointage_detail', { id: arch.id }, 'GET');
        if (detail.success && detail.archive) {
          try {
            const parsed = JSON.parse(detail.archive.data);
            if (!parsed.sites || parsed.sites.length === 0) {
              emptyOnes.push(arch.period);
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }

      if (emptyOnes.length === 0) return false;

      setDebugSync(`Réparation de ${emptyOnes.length} archive(s) vide(s)...`);
      setSyncingCount(emptyOnes.length);
      for (const p of emptyOnes) {
        const [archRes, leavesRes] = await Promise.all([
          apiCall('get_pointage_for_archive', { period: p }, 'GET'),
          apiCall('get_leaves', {}, 'GET')
        ]);
        if (archRes.success) {
          const pointageData = {
            sites: archRes.sites || [],
            globalAgents: archRes.global_agents || [],
            leaves: leavesRes.success ? leavesRes.leaves : []
          };
          await apiCall('archive_pointage', { period: p, data: JSON.stringify(pointageData) });
        }
        setSyncingCount(prev => Math.max(0, prev - 1));
      }
      setSyncingCount(0);
      setDebugSync(`${emptyOnes.length} archive(s) réparée(s) avec succès.`);
      return true;
    } catch (e) {
      console.error("Erreur resyncEmptyArchives", e);
      return false;
    }
  };


  const loadArchives = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_archives_pointage_list', {}, 'GET');
      if (res.success && Array.isArray(res.archives)) {
        let archivesList = res.archives;
        const didSync = await syncOldArchives(archivesList);
        if (didSync) {
            const res2 = await apiCall('get_archives_pointage_list', {}, 'GET');
            if (res2.success && Array.isArray(res2.archives)) {
                archivesList = res2.archives;
            }
        }
        // Réparer les archives existantes avec sites vides
        const didResync = await resyncEmptyArchives();
        if (didResync) {
            const res3 = await apiCall('get_archives_pointage_list', {}, 'GET');
            if (res3.success && Array.isArray(res3.archives)) {
                archivesList = res3.archives;
            }
        }
        setArchives(archivesList);
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
    setSelectedArchiveId(id);
    setLoadingDetail(true);
    try {
      const res = await apiCall('get_archive_pointage_detail', { id }, 'GET');
      if (res && res.success !== false) {
        let dataParsed = null;
        try {
           dataParsed = JSON.parse(res.archive.data);
        } catch(e) {
           console.error("Erreur parsing JSON archive pointage", e);
        }
        setArchiveDetail({
          ...res.archive,
          ...dataParsed
        });
      } else {
        setArchiveDetail(null);
      }
    } catch (err) {
      console.error(err);
      setArchiveDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (archives.length > 0) {
      const autoSearchStr = localStorage.getItem('pontage_auto_search_archive');
      if (autoSearchStr) {
        try {
          const autoSearch = JSON.parse(autoSearchStr);
          if (autoSearch.period) {
            const targetArchive = archives.find(a => a.period === autoSearch.period);
            if (targetArchive) {
              // NE PAS supprimer pontage_auto_search_archive ici !
              // Dashboard.jsx en a besoin pour naviguer vers le bon site/agent.
              handleViewArchive(targetArchive.id);
            } else if (!loading) {
              // Chargement terminé et archive toujours pas trouvée
              alert(`Le pointage ne peut pas être affiché car l'archive pour la période ${autoSearch.period} n'a pas encore été publiée.`);
              localStorage.removeItem('pontage_auto_search_archive');
              setIsAutoSearching(false);
            }
          }
        } catch (e) {
          console.error('Error handling auto_search_archive:', e);
          localStorage.removeItem('pontage_auto_search_archive');
          setIsAutoSearching(false);
        }
      }
    }
  }, [archives, loading]);




  const handleDeleteArchive = async (id, periodStr) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'archive de ${periodStr} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      const res = await apiCall('delete_archive_pointage', { id }, 'POST');
      if (res && res.success !== false) {
        setArchives(prev => prev.filter(a => a.id !== id));
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  const renderOverlay = () => {
    if (!isAutoSearching) return null;
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, background: 'rgba(3, 5, 10, 1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
        <h2 style={{ marginTop: '20px', color: '#38bdf8' }}>Recherche automatique du pointage...</h2>
      </div>,
      document.body
    );
  };

  // Si une archive est sélectionnée et chargée, afficher le Dashboard en mode archive
  if (selectedArchiveId && archiveDetail) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {renderOverlay()}
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => { setSelectedArchiveId(null); setArchiveDetail(null); }}>
            <ArrowLeft size={18} /> Retour à la liste des archives
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
                Mode Archive ({archiveDetail.period})
             </div>
             {onSwitchToCurrent && (
                <button className="btn btn-primary" onClick={onSwitchToCurrent}>
                   Aller au pointage en cours
                </button>
             )}
          </div>
        </div>
        <Dashboard isArchiveMode={true} archiveData={archiveDetail} setView={setView} />
      </div>
    );
  }

  // Écran de chargement du détail
  if (selectedArchiveId && loadingDetail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0', flexDirection: 'column', gap: '16px' }}>
        {renderOverlay()}
        <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
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
    if (a.period && a.period.includes('-')) {
       const [y, m] = a.period.split('-');
       const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
       monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    const searchable = `${a.period} ${monthLabel} ${a.archived_by} ${a.archived_date}`;
    return normalizeString(searchable).includes(normalizeString(searchArchiveText));
  });

  return (
    <div>
      {renderOverlay()}
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
      
      {debugSync && (
        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#ccc' }}>
            Debug Sync: {debugSync}
        </div>
      )}

      {loading || syncingCount > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
          {syncingCount > 0 && <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Récupération automatique des anciennes archives... ({syncingCount} restante(s))</div>}
        </div>
      ) : archives.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '24px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--c)', marginBottom: '16px' }} />
          <h3>Aucune Archive de Pointage</h3>
          <p className="subtitle" style={{ marginTop: '8px' }}>
            Publiez un pointage depuis le module Plannings & Pointage pour créer une archive automatique.
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
                  
                  let dateLabel = a.archived_date;
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
                     dateLabel = a.archived_date;
                  }

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
