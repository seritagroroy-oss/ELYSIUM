import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Plus, X, Building2, Trash2, ChevronDown, ChevronUp, Edit3, Check, Archive } from 'lucide-react';
import { apiCall } from '../../api';

export default function UnbilledSitesModal({ unbilledSites, setUnbilledSites, onClose }) {
  const [newSiteName, setNewSiteName] = useState('');
  const [newSubsiteNames, setNewSubsiteNames] = useState({});
  const [expandedSites, setExpandedSites] = useState({});
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingSite, setEditingSite] = useState(null); // { id, name }
  const [editingSubsite, setEditingSubsite] = useState(null); // { id, name, siteId }
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, showMotif }
  const [deleteMotif, setDeleteMotif] = useState('');
  const [deletingProgress, setDeletingProgress] = useState(null);

  // Archives state
  const [showArchives, setShowArchives] = useState(false);
  const [archives, setArchives] = useState([]);

  const toggleSite = (siteId) => {
    setExpandedSites(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const handleFocus = (e) => {
    e.target.style.background = 'white';
    e.target.style.color = 'black';
  };

  const handleBlur = (e, defaultBg) => {
    e.target.style.background = defaultBg;
    e.target.style.color = 'white';
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
    setLoading(true);
    try {
      await apiCall('add_site', { name: newSiteName.trim(), location: 'abidjan', module: 'FACTURATION', is_billed: 0 }, 'POST');
      const res = await apiCall('get_sites', { scope: 'company', module: 'FACTURATION', is_billed: 0 }, 'GET');
      if (Array.isArray(res)) setUnbilledSites(res);
      else if (res && res.sites) setUnbilledSites(res.sites);
      setNewSiteName('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddSubsite = async (siteId) => {
    const name = newSubsiteNames[siteId]?.trim();
    if (!name) return;
    setLoading(true);
    try {
      await apiCall('add_subsite', { site_id: siteId, name }, 'POST');
      const res = await apiCall('get_sites', { scope: 'company', module: 'FACTURATION', is_billed: 0 }, 'GET');
      if (Array.isArray(res)) setUnbilledSites(res);
      else if (res && res.sites) setUnbilledSites(res.sites);
      setNewSubsiteNames(prev => ({ ...prev, [siteId]: '' }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_contract_ruptures', { is_billed: 0 }, 'GET');
      if (res && res.ruptures) setArchives(res.ruptures);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleDeleteSite = (siteId) => {
    setDeleteMotif('');
    setConfirmDialog({
      type: 'site',
      siteId,
      title: 'Supprimer ce site ?',
      message: 'Êtes-vous sûr de vouloir supprimer ce site et toutes ses zones ? Cette action est irréversible.',
      showMotif: true
    });
  };

  const handleDeleteSubsite = (siteId, subsiteId) => {
    setDeleteMotif('');
    setConfirmDialog({
      type: 'subsite',
      siteId,
      subsiteId,
      title: 'Supprimer cette zone ?',
      message: 'Voulez-vous vraiment supprimer cette zone ?',
      showMotif: true
    });
  };

  const executeConfirmDialog = async () => {
    if (!confirmDialog) return;
    setDeletingProgress(0);
    
    const interval = setInterval(() => {
      setDeletingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    try {
      if (confirmDialog.type === 'site') {
        await apiCall('delete_site', { site_id: confirmDialog.siteId, motif: deleteMotif, is_billed: 0 }, 'POST');
        setUnbilledSites(prev => prev.filter(s => s.id !== confirmDialog.siteId));
      } else if (confirmDialog.type === 'subsite') {
        await apiCall('delete_subsite', { subsite_id: confirmDialog.subsiteId, motif: deleteMotif, is_billed: 0 }, 'POST');
        const res = await apiCall('get_sites', { scope: 'company', module: 'FACTURATION', is_billed: 0 }, 'GET');
        if (Array.isArray(res)) setUnbilledSites(res);
        else if (res && res.sites) setUnbilledSites(res.sites);
      }
    } catch (e) {
      console.error(e);
    }
    
    clearInterval(interval);
    setDeletingProgress(100);
    setTimeout(() => {
      setDeletingProgress(null);
      setConfirmDialog(null);
    }, 400);
  };

  const saveRenameSite = async () => {
    if (!editingSite || !editingSite.name.trim()) return;
    setLoading(true);
    try {
      await apiCall('rename_site', { site_id: editingSite.id, name: editingSite.name.trim() }, 'POST');
      const res = await apiCall('get_sites', { scope: 'company', module: 'FACTURATION', is_billed: 0 }, 'GET');
      if (Array.isArray(res)) setUnbilledSites(res);
      else if (res && res.sites) setUnbilledSites(res.sites);
      setEditingSite(null);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const saveRenameSubsite = async () => {
    if (!editingSubsite || !editingSubsite.name.trim()) return;
    setLoading(true);
    try {
      await apiCall('rename_subsite', { subsite_id: editingSubsite.id, name: editingSubsite.name.trim() }, 'POST');
      const res = await apiCall('get_sites', { scope: 'company', module: 'FACTURATION', is_billed: 0 }, 'GET');
      if (Array.isArray(res)) setUnbilledSites(res);
      else if (res && res.sites) setUnbilledSites(res.sites);
      setEditingSubsite(null);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>{showArchives ? "Archives (Sites Non Facturés)" : "Clients Non Facturés"}</h2>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>{showArchives ? "Historique des sites et zones non facturés supprimés" : "Sites sur lesquels des agents sont postés sans contrepartie financière"}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => {
              if (!showArchives) fetchArchives();
              setShowArchives(!showArchives);
            }} style={{ background: showArchives ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)', color: showArchives ? '#38bdf8' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              {showArchives ? 'Retour aux Sites' : 'Archives Ruptures'}
            </button>
            <button onClick={onClose} 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {showArchives ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={20} style={{ color: '#ef4444' }} /> Archives Ruptures
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>
              Historique des sites et zones non facturés supprimés.
            </p>
            {archives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Aucune archive trouvée.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {archives.map(arch => (
                  <div key={arch.id} style={{ 
                    background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.4))', 
                    border: '1px solid rgba(239, 68, 68, 0.25)', 
                    borderRadius: '12px', 
                    padding: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative red accent line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingLeft: '8px' }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{arch.site_name} <span style={{ color: '#94a3b8', margin: '0 6px' }}>—</span> {arch.subsite_name}</h4>
                      <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={14} /> Rupture le: {arch.rupture_date}
                      </span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem', paddingLeft: '8px' }}>
                      <span style={{ color: '#ef4444', fontWeight: '600' }}>Motif: </span> {arch.motif || 'Aucun motif renseigné'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                      Archivé par <span style={{ color: '#94a3b8' }}>{arch.archived_by}</span> le {new Date(arch.archived_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Add new site */}
        <div style={{ padding: '16px 32px', background: 'rgba(56, 189, 248, 0.05)', borderBottom: '1px solid rgba(56, 189, 248, 0.1)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Nom du nouveau site non facturé..." 
            value={newSiteName} 
            onChange={e => setNewSiteName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddSite()}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, 'rgba(0,0,0,0.3)')}
            style={{ width: '350px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s' }} 
          />
          <button 
            onClick={handleAddSite} 
            disabled={loading || !newSiteName.trim()}
            style={{ background: '#38bdf8', color: '#0f172a', padding: '0 20px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: !newSiteName.trim() ? 0.5 : 1 }}>
            <Plus size={16} /> Ajouter Site
          </button>
        </div>

        {/* List of sites */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {unbilledSites.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
               <Building2 size={64} style={{ display: 'block', margin: '0 auto 20px', opacity: 0.2 }} />
               <p style={{ margin: 0, fontSize: '1.1rem' }}>Aucun client non facturé pour le moment.</p>
             </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {unbilledSites.map(site => {
                const isExpanded = !!expandedSites[site.id];
                return (
                <div key={site.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div 
                    onClick={() => toggleSite(site.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', cursor: 'pointer', background: isExpanded ? 'rgba(56, 189, 248, 0.03)' : 'transparent', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '10px', borderRadius: '10px' }}>
                        <Building size={20} />
                      </div>
                      {editingSite?.id === site.id ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }} onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            value={editingSite.name} 
                            onChange={e => setEditingSite(prev => ({...prev, name: e.target.value}))}
                            onKeyDown={e => e.key === 'Enter' && saveRenameSite()}
                            style={{ background: 'white', color: 'black', border: '1px solid #38bdf8', borderRadius: '6px', padding: '4px 10px', fontSize: '1rem', outline: 'none', width: '250px' }}
                          />
                          <button onClick={saveRenameSite} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><Check size={16} /></button>
                          <button onClick={() => setEditingSite(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{site.name}</h3>
                          <button onClick={(e) => { e.stopPropagation(); setEditingSite({ id: site.id, name: site.name }); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onMouseOver={e=>e.currentTarget.style.color='white'} onMouseOut={e=>e.currentTarget.style.color='#94a3b8'}>
                            <Edit3 size={15} />
                          </button>
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: '8px' }}>
                            {(site.subsites || []).length} zone(s)
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSite(site.id); }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                      <div style={{ color: '#64748b' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zones / Sous-sites</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {(site.subsites || []).length === 0 ? (
                            <div style={{ color: '#475569', fontSize: '0.9rem', fontStyle: 'italic' }}>Aucune zone configurée.</div>
                          ) : (
                            (site.subsites || []).map((sub, index) => (
                              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '8px' }}>
                                {editingSubsite?.id === sub.id ? (
                                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                    <input 
                                      autoFocus
                                      value={editingSubsite.name} 
                                      onChange={e => setEditingSubsite(prev => ({...prev, name: e.target.value}))}
                                      onKeyDown={e => e.key === 'Enter' && saveRenameSubsite()}
                                      style={{ background: 'white', color: 'black', border: '1px solid #38bdf8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.9rem', outline: 'none', width: '250px' }}
                                    />
                                    <button onClick={saveRenameSubsite} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><Check size={16} /></button>
                                    <button onClick={() => setEditingSubsite(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><X size={16} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {index + 1}
                                      </span>
                                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{sub.name}</span>
                                      <button onClick={() => setEditingSubsite({ id: sub.id, name: sub.name, siteId: site.id })} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '4px' }} onMouseOver={e=>e.currentTarget.style.color='white'} onMouseOut={e=>e.currentTarget.style.color='#64748b'}>
                                        <Edit3 size={14} />
                                      </button>
                                    </div>
                                    <button onClick={() => handleDeleteSubsite(site.id, sub.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.7}>
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            placeholder="Nom de la nouvelle zone..." 
                            value={newSubsiteNames[site.id] || ''} 
                            onChange={e => setNewSubsiteNames(prev => ({ ...prev, [site.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubsite(site.id)}
                            onFocus={handleFocus}
                            onBlur={(e) => handleBlur(e, 'rgba(255,255,255,0.05)')}
                            style={{ width: '300px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '8px 12px', outline: 'none', fontSize: '0.85rem', transition: 'all 0.2s' }} 
                          />
                          <button 
                            onClick={() => handleAddSubsite(site.id)} 
                            disabled={loading || !(newSubsiteNames[site.id] || '').trim()}
                            style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem', opacity: !(newSubsiteNames[site.id] || '').trim() ? 0.5 : 1 }}>
                            <Plus size={15} /> Ajouter
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                );
              })}
            </div>
          )}
          </div>
          </>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', textAlign: deletingProgress !== null ? 'center' : 'left' }}>
            
            {deletingProgress !== null ? (
              <div style={{ padding: '20px 0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '1.25rem' }}>Suppression en cours...</h3>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '100px', height: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${deletingProgress}%` }} 
                    style={{ background: '#ef4444', height: '100%', borderRadius: '100px' }} 
                  />
                </div>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.5rem' }}>{deletingProgress}%</div>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 12px 0', color: 'white', fontSize: '1.25rem' }}>{confirmDialog.title}</h3>
                <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>{confirmDialog.message}</p>
                
                {confirmDialog.showMotif && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Motif de suppression / rupture <span style={{color: '#ef4444'}}>*</span></label>
                    <textarea 
                      value={deleteMotif}
                      onChange={e => setDeleteMotif(e.target.value)}
                      placeholder="Ex: Fin du contrat bénévole, fermeture du site..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '12px', minHeight: '80px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setConfirmDialog(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={executeConfirmDialog} disabled={confirmDialog.showMotif && !deleteMotif.trim()} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: (confirmDialog.showMotif && !deleteMotif.trim()) ? 0.5 : 1 }}>
                    <Trash2 size={16} /> Confirmer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
