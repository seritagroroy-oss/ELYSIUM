import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  Plus, Save, Building, ShieldAlert, Building2, Trash2,
  ChevronLeft, GripVertical, Edit2, X, DollarSign,
  ChevronDown, ChevronUp, Users, FileX, Archive, Clock, AlertTriangle
} from 'lucide-react';
import { apiCall } from '../api';

export default function ContratsClientsView({
  sites, siteContracts, subsiteContracts, configFunctions = [],
  setSites, setSiteContracts, setSubsiteContracts, formatMoney, searchTerm = '', refreshSites, isBilledMode = true
}) {
  const [loading, setLoading] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [activeSite, setActiveSite] = useState(null);
  const [newSubsiteName, setNewSubsiteName] = useState('');
  const [orderedSites, setOrderedSites] = useState([]);
  const [orderedSubsites, setOrderedSubsites] = useState([]);
  const [expandedCards, setExpandedCards] = useState({}); // {subsite_id: bool}
  const [siteSort, setSiteSort] = useState('custom'); // custom, name_asc, name_desc, newest, oldest
  const [showSortModal, setShowSortModal] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Modal state (contrat)
  const [modalSubsite, setModalSubsite] = useState(null);
  const [modalName, setModalName] = useState('');
  const [modalRows, setModalRows] = useState([]);
  const [modalSaving, setModalSaving] = useState(false);



  // Rupture de contrat
  const [ruptureSubsite, setRuptureSubsite] = useState(null);
  const [ruptureMotif, setRuptureMotif] = useState('');
  const [ruptureDate, setRuptureDate] = useState('');
  const [ruptureSaving, setRuptureSaving] = useState(false);

  // Archives
  const [showArchives, setShowArchives] = useState(false);
  const [archives, setArchives] = useState([]);
  const [archiveSearch, setArchiveSearch] = useState('');

  const catColor = '#10b981';

  const functionOptions = configFunctions
    .filter(f => f.type === 'agent' || !f.type)
    .map(f => ({ id: f.id, name: f.name }));
  if (functionOptions.length === 0) {
    ['AS', 'OTS', 'MC', 'GA', 'AC', 'CP', 'CO', 'CRT'].forEach(id =>
      functionOptions.push({ id, name: id })
    );
  }

  // Helper: given an abbreviation, return "FULL NAME (ABBREV)" or just the abbrev if not found
  const getFunctionLabel = (abbrev) => {
    const found = functionOptions.find(f => f.id === abbrev);
    if (!found) return abbrev;
    return found.name === abbrev ? abbrev : `${found.name} (${abbrev})`;
  };

  // ── Ordered Sites ──────────────────────────────────────────
  useEffect(() => {
    const order = JSON.parse(localStorage.getItem('elysium_sites_order') || '[]');
    let filtered = sites.filter(
      s => !['site_extras', 'site_releves', 'site_administration'].includes(s.id)
    );
    if (searchTerm) {
      filtered = filtered.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    filtered.sort((a, b) => {
      if (siteSort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (siteSort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (siteSort === 'newest') return Number(b.id) - Number(a.id);
      if (siteSort === 'oldest') return Number(a.id) - Number(b.id);
      
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
    });
    setOrderedSites(filtered);
  }, [sites, searchTerm, siteSort]);

  // ── Ordered Subsites ───────────────────────────────────────
  useEffect(() => {
    if (!activeSite) return;
    const freshSite = sites.find(s => s.id === activeSite.id);
    if (!freshSite) { setActiveSite(null); return; }
    const order = JSON.parse(localStorage.getItem(`elysium_subsites_order_${freshSite.id}`) || '[]');
    let subs = [...(freshSite.subsites || [])];
    if (searchTerm) {
      subs = subs.filter(sub => sub.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    subs.sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
    });
    setOrderedSubsites(subs);
  }, [activeSite, sites, searchTerm]);

  const handleReorderSites = (newOrder) => {
    setOrderedSites(newOrder);
    localStorage.setItem('elysium_sites_order', JSON.stringify(newOrder.map(s => s.id)));
  };
  const handleReorderSubsites = (newOrder) => {
    setOrderedSubsites(newOrder);
    localStorage.setItem(`elysium_subsites_order_${activeSite.id}`, JSON.stringify(newOrder.map(s => s.id)));
  };

  // ── Totals ─────────────────────────────────────────────────
  const getSubsiteTotal = (id) =>
    (subsiteContracts[id] || []).reduce((s, r) => s + Number(r.quantite || 0) * Number(r.montant_unitaire || 0), 0);
  const getSubsiteEffectif = (id) =>
    (subsiteContracts[id] || []).reduce((s, r) => s + Number(r.quantite || 0), 0);
  const getSiteTotal = (site) =>
    (site.subsites || []).reduce((s, sub) => s + getSubsiteTotal(sub.id), 0);
  const getSiteEffectif = (site) =>
    (site.subsites || []).reduce((s, sub) => s + getSubsiteEffectif(sub.id), 0);

  // ── CRUD ───────────────────────────────────────────────────
  const handleAddSite = async () => {
    const name = newSiteName.trim();
    if (!name) return;

    if (sites.some(s => (s.name || '').toLowerCase() === name.toLowerCase() && !['site_extras', 'site_releves', 'site_administration'].includes(s.id))) {
      setCustomAlert(`Le site "${name}" existe déjà !`);
      return;
    }

    setLoading(true);
    try {
      await apiCall('add_site', { name, location: 'abidjan', module: 'FACTURATION', is_billed: isBilledMode ? 1 : 0 }, 'POST');
      await refreshSites();
      setNewSiteName('');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAddSubsite = async () => {
    const name = newSubsiteName.trim();
    if (!name || !activeSite) {
      console.warn('[AddSubsite] Missing data', { newSubsiteName, activeSite });
      return;
    }

    const freshSite = sites.find(s => s.id === activeSite.id);
    if ((freshSite?.subsites || []).some(sub => (sub.name || '').toLowerCase() === name.toLowerCase())) {
      setCustomAlert(`La zone "${name}" existe déjà dans ce site !`);
      return;
    }

    console.log('[AddSubsite] Starting', { site_id: activeSite.id, name });
    setLoading(true);
    try {
      const res = await apiCall('add_subsite', { site_id: activeSite.id, name }, 'POST');
      console.log('[AddSubsite] Response', res);
      if (res.success !== false) {
        await refreshSites();
        setNewSubsiteName('');
      }
    } catch (e) { console.error('[AddSubsite] Error', e); }
    setLoading(false);
  };

  const handleDeleteSite = (siteId, e) => {
    e.stopPropagation();
    setConfirmDialog({
      title: 'Supprimer ce site ?',
      message: 'Supprimer ce site et toutes ses zones ?',
      onConfirm: async () => {
        setConfirmDialog(null);
        // Suppression visuelle immédiate (Optimistic UI)
        setSites(prev => prev.filter(s => s.id !== siteId));
        
        try {
          await apiCall('delete_site', { site_id: siteId, is_billed: isBilledMode ? 1 : 0 }, 'POST');
          refreshSites(); // Rafraîchissement silencieux en arrière-plan sans await
        } catch (e) { console.error(e); }
      }
    });
  };

  const handleDeleteSubsite = (subsiteId, e) => {
    e.stopPropagation();
    setConfirmDialog({
      title: 'Supprimer cette zone ?',
      message: 'Cette action va supprimer la zone et toutes ses informations de façon irréversible.',
      onConfirm: async () => {
        setConfirmDialog(null);
        // Suppression visuelle immédiate
        setSites(prev => prev.map(s => {
          if (!s.subsites) return s;
          return { ...s, subsites: s.subsites.filter(sub => sub.id !== subsiteId) };
        }));
        
        try {
          await apiCall('delete_subsite', { subsite_id: subsiteId, is_billed: isBilledMode ? 1 : 0 }, 'POST');
          refreshSites(); // Rafraîchissement en arrière-plan
        } catch (e) { console.error(e); }
      }
    });
  };

  // ── Collapse ───────────────────────────────────────────────
  const toggleCollapse = (id, e) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Rupture de contrat ─────────────────────────────
  const openRupture = (sub) => { setRuptureSubsite(sub); setRuptureMotif(''); setRuptureDate(''); };
  const closeRupture = () => { setRuptureSubsite(null); setRuptureMotif(''); setRuptureDate(''); };

  const handleRupture = async () => {
    if (!ruptureSubsite || !ruptureMotif.trim() || !ruptureDate) return;
    setRuptureSaving(true);
    try {
      const rows = subsiteContracts[ruptureSubsite.id] || [];
      const effectif = rows.reduce((s, r) => s + Number(r.quantite || 0), 0);
      const montant_total = rows.reduce((s, r) => s + Number(r.quantite || 0) * Number(r.montant_unitaire || 0), 0);
      const res = await apiCall('archive_contract_rupture', {
        subsite_id: ruptureSubsite.id,
        subsite_name: ruptureSubsite.name,
        site_name: activeSite?.name || '',
        motif: ruptureMotif.trim(),
        rupture_date: ruptureDate,
        effectif,
        montant_total,
        contract_rows: rows,
        is_billed: isBilledMode ? 1 : 0
      }, 'POST');
      if (res.success) {
        setSubsiteContracts(prev => { const n = { ...prev }; delete n[ruptureSubsite.id]; return n; });
        await refreshSites();
        await loadArchives();
        closeRupture();
      }
    } catch (e) { console.error(e); }
    setRuptureSaving(false);
  };

  const loadArchives = async () => {
    try {
      const res = await apiCall('get_contract_ruptures', { is_billed: isBilledMode ? 1 : 0 }, 'GET');
      if (res.success) {
        setArchives(res.ruptures || []);
        return res.ruptures || [];
      }
    } catch (e) { console.error(e); }
    return archives;
  };

  useEffect(() => { loadArchives(); }, [isBilledMode]);
  const seenCount = Number(localStorage.getItem('elysium_seen_archives_count') || 0);
  const unreadCount = Math.max(0, archives.length - seenCount);

  const prevUnreadRef = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const openArchives = async () => { 
    const loaded = await loadArchives(); 
    localStorage.setItem('elysium_seen_archives_count', loaded.length);
    setShowArchives(true); 
  };
  const closeArchives = () => setShowArchives(false);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Modal ──────────────────────────────────────────────────
  const openModal = (sub) => {
    setModalSubsite(sub);
    setModalName(sub.name);
    const existing = subsiteContracts[sub.id] || [];
    setModalRows(existing.map(r => ({
      fonction: r.fonction || 'AS',
      shift_type: r.shift_type || 'Jour',
      quantite: Number(r.quantite || 1),
      montant_unitaire: Number(r.montant_unitaire || 0),
    })));
  };
  const closeModal = () => { setModalSubsite(null); setModalRows([]); setModalName(''); };

  const addRow = () => setModalRows(p => [...p, {
    fonction: functionOptions[0]?.id || 'AS', shift_type: 'Jour', quantite: 1, montant_unitaire: 0
  }]);
  const updateRow = (i, field, val) =>
    setModalRows(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeRow = (i) => setModalRows(p => p.filter((_, idx) => idx !== i));

  const saveModal = async () => {
    if (!modalSubsite) return;
    setModalSaving(true);
    try {
      // Rename if changed
      if (modalName.trim() && modalName.trim() !== modalSubsite.name) {
        await apiCall('rename_subsite', { subsite_id: modalSubsite.id, name: modalName.trim() }, 'POST');
        await refreshSites();
      }
      // Save contract rows
      const res = await apiCall('save_subsite_contracts', {
        subsite_id: modalSubsite.id,
        rows: modalRows,
      }, 'POST');
      if (res.success) {
        setSubsiteContracts(prev => ({ ...prev, [modalSubsite.id]: modalRows }));
        closeModal();
      }
    } catch (e) { console.error(e); }
    setModalSaving(false);
  };

  const modalTotal = modalRows.reduce((s, r) => s + Number(r.quantite || 0) * Number(r.montant_unitaire || 0), 0);
  const modalEffectif = modalRows.reduce((s, r) => s + Number(r.quantite || 0), 0);

  // ── Shift badge style ──────────────────────────────────────
  const shiftStyle = (shift) => {
    if (shift === 'Nuit')    return { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' };
    if (shift === 'Rotatif') return { color: '#f472b6', bg: 'rgba(244,114,182,0.12)' };
    return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `1px solid ${catColor}30`, background: 'linear-gradient(180deg, rgba(15,23,42,0.6), rgba(15,23,42,0.95))' }}
    >
      <style>{`
        .white-placeholder::placeholder { color: white !important; opacity: 1; }
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ─── MODAL RUPTURE DE CONTRAT ───────────────────────── */}
      <AnimatePresence>
        {ruptureSubsite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={closeRupture}>
            <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '18px', width: '100%', maxWidth: '480px', padding: '32px', boxShadow: '0 30px 70px rgba(0,0,0,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(239,68,68,0.12)', padding: '12px', borderRadius: '12px' }}>
                  <FileX size={26} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '1.2rem' }}>Rupture de Contrat</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>{ruptureSubsite.name} • {activeSite?.name}</div>
                </div>
                <button onClick={closeRupture} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>Cette action va supprimer la zone de la liste active et l’archiver avec toutes ses informations. Cette action est irréversible.</div>
              </div>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date de rupture *</label>
                  <input type="date" value={ruptureDate} onChange={e => setRuptureDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', padding: '12px 14px', fontSize: '0.92rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif de la rupture *</label>
                <textarea
                  value={ruptureMotif}
                  onChange={e => setRuptureMotif(e.target.value)}
                  placeholder="Ex: Fin de contrat à durée déterminée, Non-renouvellement, Fermeture du site client..."
                  rows={4}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', padding: '12px 14px', fontSize: '0.92rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button onClick={closeRupture} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#94a3b8', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleRupture} disabled={ruptureSaving || !ruptureMotif.trim() || !ruptureDate}
                  style={{ padding: '10px 22px', background: (ruptureMotif.trim() && ruptureDate) ? '#ef4444' : 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '9px', color: 'white', cursor: (ruptureMotif.trim() && ruptureDate) ? 'pointer' : 'not-allowed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ruptureSaving ? <i className="fas fa-spinner fa-spin" /> : <FileX size={16} />} Confirmer la rupture
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL ARCHIVES RUPTURES */}
      <AnimatePresence>
        {showArchives && (() => {
          const filtered = archives.filter(a =>
            !archiveSearch ||
            a.subsite_name?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            a.site_name?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            a.motif?.toLowerCase().includes(archiveSearch.toLowerCase())
          );
          const shiftColor = (s) => {
            if (s === 'Nuit') return { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' };
            if (s === 'Rotatif') return { color: '#f472b6', bg: 'rgba(244,114,182,0.12)' };
            return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
          };
          const totalPerte = archives.reduce((s, a) => s + Number(a.montant_total || 0), 0);
          const totalAgents = archives.reduce((s, a) => s + Number(a.effectif || 0), 0);
          return (
            <motion.div key="archives-panel"
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #060d1a 0%, #0d1829 50%, #06111f 100%)', zIndex: 999998, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0 40px', height: '72px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.08))', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                    <Archive size={22} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'white', fontSize: '1.15rem' }}>Archives des Ruptures de Contrat</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{filtered.length} / {archives.length} rupture(s)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'white', textTransform: 'uppercase' }}>Agents perdus</div>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.1rem' }}>{totalAgents}</div>
                  </div>
                  <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'white', textTransform: 'uppercase' }}>Facturation perdue</div>
                    <div style={{ fontWeight: 800, color: '#fbbf24' }}>{formatMoney(totalPerte)}</div>
                  </div>
                  <div style={{ position: 'relative', width: '260px' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{'🔍'}</span>
                    <input type="text" placeholder="Rechercher..." value={archiveSearch}
                      onChange={e => setArchiveSearch(e.target.value)} className="white-placeholder"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', padding: '9px 14px 9px 36px', fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={closeArchives}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                    <X size={16} /> Fermer
                  </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '32px 40px' }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '100px 40px' }}>
                    <Archive size={72} style={{ display: 'block', margin: '0 auto 20px', opacity: 0.1 }} />
                    <p style={{ margin: 0, fontSize: '1.1rem', color: '#475569' }}>
                      {archiveSearch ? 'Aucun resultat.' : 'Aucune rupture archivee.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', margin: '0 auto' }}>
                    {filtered.map((a, i) => {
                      const isOpen = !!expandedCards[`archive_${i}`];
                      const rows = Array.isArray(a.contract_rows) ? a.contract_rows : [];
                      return (
                        <motion.div key={a.id || `archive-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          style={{ background: 'rgba(255,255,255,0.03)', border: isOpen ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', transition: 'border-color 0.2s', width: '100%' }}>
                          <div onClick={() => setExpandedCards(prev => ({ ...prev, [`archive_${i}`]: !isOpen }))}
                            style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', borderRadius: isOpen ? '16px 16px 0 0' : '16px', background: isOpen ? 'rgba(239,68,68,0.04)' : 'transparent', transition: 'background 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                              <div style={{ background: isOpen ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.09)', padding: '9px', borderRadius: '10px', flexShrink: 0 }}>
                                <FileX size={17} color="#ef4444" />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{a.subsite_name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <Building size={10} /><span>{a.site_name}</span>
                                  <span>|</span>
                                  <Clock size={10} /><span>Rupture : {a.rupture_date ? new Date(a.rupture_date).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                                  <span>|</span>
                                  <Clock size={10} /><span>Archivé : {formatDate(a.archived_at)}</span>
                                  <span>|</span>
                                  <Users size={10} /><span>Par : <strong style={{ color: '#94a3b8' }}>{a.archived_by}</strong></span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0, marginLeft: '16px' }}>
                              <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '6px 14px' }}>
                                <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase' }}>Agents</div>
                                <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.1rem' }}>{a.effectif}</div>
                              </div>
                              <div style={{ textAlign: 'center', background: 'rgba(251,191,36,0.07)', borderRadius: '8px', padding: '6px 14px' }}>
                                <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase' }}>Facturation</div>
                                <div style={{ fontWeight: 800, color: '#fbbf24' }}>{formatMoney(a.montant_total)}</div>
                              </div>
                              <div style={{ background: isOpen ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '7px', color: isOpen ? '#ef4444' : '#64748b' }}>
                                {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            </div>
                          </div>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div key="body"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}>
                                <div style={{ borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                                  {rows.length > 0 && (
                                    <div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 140px 80px 180px', padding: '10px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        {[['Fonction / Poste', 'left'], ['Vacation', 'center'], ['Qte', 'center'], ['Total', 'right']].map(([h, align], hi) => (
                                          <span key={h} style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700, textTransform: 'uppercase', textAlign: align }}>{h}</span>
                                        ))}
                                      </div>
                                      {rows.map((row, ri) => {
                                        const sc = shiftColor(row.shift_type);
                                        const rowTotal = Number(row.quantite || 0) * Number(row.montant_unitaire || 0);
                                        return (
                                          <div key={row.id || `row-${ri}`} style={{ display: 'grid', gridTemplateColumns: '2fr 140px 80px 180px', padding: '12px 24px', borderBottom: ri < rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem' }}>{row.fonction}</span>
                                            <div style={{ textAlign: 'center' }}><span style={{ fontSize: '0.78rem', color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>{row.shift_type}</span></div>
                                            <span style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 800 }}>{row.quantite}</span>
                                            <span style={{ textAlign: 'right', color: '#f8fafc', fontWeight: 700 }}>{formatMoney(rowTotal)}</span>
                                          </div>
                                        );
                                      })}
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '11px 24px', background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.1)' }}>
                                        <span style={{ fontSize: '0.83rem', color: 'white' }}>{a.effectif} agent(s) contractuel(s)</span>
                                        <span style={{ fontWeight: 800, color: '#ef4444' }}>{formatMoney(a.montant_total)} / mois</span>
                                      </div>
                                    </div>
                                  )}
                                  <div style={{ padding: '20px 24px', background: 'rgba(239,68,68,0.025)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'white', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Motif de la rupture</div>
                                    <div style={{ fontSize: '0.93rem', color: '#fca5a5', fontStyle: 'italic', background: 'rgba(239,68,68,0.07)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.13)', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                                      &ldquo;{a.motif}&rdquo;
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL CONTRAT */}
      <AnimatePresence>
        {modalSubsite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(0,0,0,0.65)' }}>
              <div style={{ padding: '22px 28px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} color="#38bdf8" /> Zone / Sous-site · {activeSite?.name}
                  </div>
                  <input className="white-placeholder" value={modalName} onChange={e => setModalName(e.target.value)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid rgba(56,189,248,0.3)', color: 'white', fontSize: '1.3rem', fontWeight: 700, width: '100%', outline: 'none', paddingBottom: '4px' }}
                    onFocus={e => e.target.style.borderBottomColor = '#38bdf8'}
                    onBlur={e => e.target.style.borderBottomColor = 'rgba(56,189,248,0.3)'} />
                </div>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1 }}>
                {modalRows.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px 150px 40px', gap: '8px', marginBottom: '8px', padding: '8px 4px' }}>
                    {['Fonction', 'Vacation', 'Qte', 'Montant unit.', ''].map((h, i) => (
                      <span key={h} style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                )}
                {modalRows.map((row, i) => (
                  <div key={row.id || `modal-row-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px 150px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <select value={row.fonction} onChange={e => updateRow(i, 'fonction', e.target.value)}
                      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '8px 10px', fontSize: '0.88rem', outline: 'none' }}>
                      {functionOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select value={row.shift_type} onChange={e => updateRow(i, 'shift_type', e.target.value)}
                      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '8px 10px', fontSize: '0.88rem', outline: 'none' }}>
                      {['Jour', 'Nuit', 'Rotatif'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" min={1} value={row.quantite} onChange={e => updateRow(i, 'quantite', Number(e.target.value))}
                      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '8px 10px', fontSize: '0.88rem', outline: 'none', textAlign: 'center' }} />
                    <input type="number" min={0} value={row.montant_unitaire} onChange={e => updateRow(i, 'montant_unitaire', Number(e.target.value))}
                      style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', padding: '8px 10px', fontSize: '0.88rem', outline: 'none', textAlign: 'right' }} />
                    <button onClick={() => removeRow(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '8px', display: 'flex' }}><X size={14} /></button>
                  </div>
                ))}
                <button onClick={addRow}
                  style={{ marginTop: '8px', background: 'rgba(56,189,248,0.08)', border: '1px dashed rgba(56,189,248,0.25)', borderRadius: '8px', color: '#38bdf8', padding: '10px 16px', cursor: 'pointer', width: '100%', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Plus size={15} /> Ajouter une ligne
                </button>
              </div>
              <div style={{ padding: '18px 28px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {modalEffectif} agent(s) &nbsp;&bull;&nbsp; <strong style={{ color: '#10b981' }}>{formatMoney(modalTotal)}</strong> / mois
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={closeModal} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#94a3b8', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={saveModal} disabled={modalSaving}
                    style={{ padding: '9px 22px', background: '#10b981', border: 'none', borderRadius: '9px', color: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {modalSaving ? <i className="fas fa-spinner fa-spin" /> : <Save size={16} />} Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE HEADER */}
      <div style={{ background: `linear-gradient(90deg, ${catColor}20, transparent)`, padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {!activeSite ? (
          <>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSortModal(!showSortModal)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '9px 12px', cursor: 'pointer', outline: 'none', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Trier : {siteSort === 'custom' ? 'Personnalise' : siteSort === 'name_asc' ? 'Nom (A-Z)' : siteSort === 'name_desc' ? 'Nom (Z-A)' : siteSort === 'newest' ? 'Plus recents' : 'Plus anciens'}
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showSortModal && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setShowSortModal(false)} />
                      <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '6px', zIndex: 99999, minWidth: '200px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        {[
                          { id: 'custom', label: 'Personnalise' },
                          { id: 'name_asc', label: 'Nom (A-Z)' },
                          { id: 'name_desc', label: 'Nom (Z-A)' },
                          { id: 'newest', label: 'Plus recents' },
                          { id: 'oldest', label: 'Plus anciens' }
                        ].map(opt => (
                          <div key={opt.id} onClick={() => { setSiteSort(opt.id); setShowSortModal(false); }}
                            style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: siteSort === opt.id ? '#38bdf8' : '#cbd5e1', background: siteSort === opt.id ? 'rgba(56,189,248,0.1)' : 'transparent', fontWeight: siteSort === opt.id ? 700 : 500 }}>
                            {opt.label}
                          </div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={openArchives}
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '9px', padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <Archive size={16} /> Archives Ruptures
                {unreadCount > 0 && (
                  <>
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', zIndex: 2 }}>
                      {unreadCount}
                    </span>
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', padding: '10px', borderRadius: '50%', zIndex: 1, animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  </>
                )}
              </button>

            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Nom du nouveau site..." value={newSiteName} className="white-placeholder"
                onChange={e => setNewSiteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSite()}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 14px', borderRadius: '9px', color: 'white', outline: 'none', minWidth: '400px' }} />
              <button onClick={handleAddSite} disabled={loading || !newSiteName.trim()}
                style={{ background: catColor, color: 'white', padding: '9px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: !newSiteName.trim() ? 0.5 : 1 }}>
                <Plus size={16} /> Ajouter Site
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setActiveSite(null)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '9px', borderRadius: '9px', cursor: 'pointer', display: 'flex' }}>
                <ChevronLeft size={20} />
              </button>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={20} color={catColor} /> {activeSite.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'white' }}>
                  Facturation totale : <strong style={{ color: catColor }}>{formatMoney(getSiteTotal(sites.find(s => s.id === activeSite.id) || activeSite))}</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={openArchives}
                style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '9px', padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <Archive size={16} /> Archives Ruptures
                {unreadCount > 0 && (
                  <>
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', zIndex: 2 }}>
                      {unreadCount}
                    </span>
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', padding: '10px', borderRadius: '50%', zIndex: 1, animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  </>
                )}
              </button>
              <input type="text" placeholder="Nom de la zone..." value={newSubsiteName} className="white-placeholder"
                onChange={e => setNewSubsiteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubsite()}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 14px', borderRadius: '9px', color: 'white', outline: 'none', minWidth: '400px' }} />
              <button onClick={handleAddSubsite} disabled={loading || !newSubsiteName.trim()}
                style={{ background: catColor, color: 'white', padding: '9px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: !newSubsiteName.trim() ? 0.5 : 1 }}>
                <Plus size={16} /> Ajouter Zone
              </button>
            </div>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {!activeSite ? (
          orderedSites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
              <Building2 size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.2 }} />
              <p style={{ margin: 0 }}>Aucun site client. Ajoutez-en un ci-dessus.</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={orderedSites} onReorder={handleReorderSites}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
              {orderedSites.map(site => (
                <Reorder.Item key={site.id} value={site} style={{ cursor: 'default' }}>
                  <motion.div
                    whileHover={{ y: -2, boxShadow: `0 8px 30px rgba(16,185,129,0.12)` }}
                    onClick={() => setActiveSite(site)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: `${catColor}18`, color: catColor, padding: '11px', borderRadius: '11px' }}><Building size={22} /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.15rem' }}>{site.name}</div>
                          <div style={{ fontSize: '0.82rem', color: 'white', marginTop: '2px' }}>{(site.subsites || []).length} zone(s) · {getSiteEffectif(site)} agent(s)</div>
                        </div>
                      </div>
                      <div onClick={e => e.stopPropagation()} style={{ cursor: 'grab', color: '#334155', padding: '4px' }}>
                        <GripVertical size={18} />
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.28)', borderRadius: '10px', margin: '0 14px 14px', padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> Facturation mensuelle</span>
                      <span style={{ fontWeight: 800, color: catColor, fontSize: '1.1rem' }}>{formatMoney(getSiteTotal(site))}</span>
                    </div>
                    { !['site_extras', 'site_releves', 'site_administration', 'site_itc', 'site_extras_sur_site'].includes(site.id) && (
                      <div style={{ padding: '0 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={e => handleDeleteSite(site.id, e)}
                          onPointerDown={e => e.stopPropagation()}
                          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}>
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )
        ) : (
          orderedSubsites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
              <Building size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.2 }} />
              <p style={{ margin: 0 }}>Aucune zone configuree. Ajoutez-en une ci-dessus.</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={orderedSubsites} onReorder={handleReorderSubsites}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', padding: 0, margin: 0 }}>
              {orderedSubsites.map(sub => {
                const rows = subsiteContracts[sub.id] || [];
                const total = rows.reduce((s, r) => s + Number(r.quantite || 0) * Number(r.montant_unitaire || 0), 0);
                const effectif = rows.reduce((s, r) => s + Number(r.quantite || 0), 0);
                const isConfigured = rows.length > 0;
                const isCollapsed = !expandedCards[sub.id];
                return (
                  <Reorder.Item key={sub.id} value={sub} style={{ cursor: 'default' }}>
                    <motion.div
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isConfigured ? catColor + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: !isCollapsed && isConfigured ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div onClick={e => e.stopPropagation()} style={{ cursor: 'grab', color: '#334155' }}>
                            <GripVertical size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem' }}>{sub.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              {isConfigured ? `${effectif} agent(s) · ${formatMoney(total)} / mois` : 'Non configure'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button onClick={() => openModal(sub)}
                            onPointerDown={e => e.stopPropagation()}
                            style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30`, borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Edit2 size={14} /> {isConfigured ? 'Modifier' : 'Configurer'}
                          </button>
                          {isConfigured && (
                            <button onClick={() => openRupture(sub)}
                              onPointerDown={e => e.stopPropagation()}
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FileX size={14} /> Rupture
                            </button>
                          )}
                          { !['site_extras_1', 'site_releves_1', 'site_admin_1', 'site_itc_tenue', 'site_itc_costume', 'site_itc_as'].includes(sub.id) && (
                            <button onClick={e => handleDeleteSubsite(sub.id, e)}
                              onPointerDown={e => e.stopPropagation()}
                              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '7px', display: 'flex' }}
                              onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                              onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                          {isConfigured && (
                            <button onClick={(e) => toggleCollapse(sub.id, e)}
                              onPointerDown={e => e.stopPropagation()}
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}>
                              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && isConfigured && (
                          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 180px', padding: '10px 24px', background: 'rgba(56,189,248,0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              {['Fonction / Poste', 'Vacation', 'Qte', 'Montant'].map((h, i) => (
                                <span key={h} style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', textAlign: i > 1 ? 'center' : 'left' }}>{h}</span>
                              ))}
                            </div>
                            {rows.map((r, i) => {
                              const s = shiftStyle(r.shift_type);
                              return (
                                <div key={r.id || `${r.fonction}-${r.shift_type}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 180px', padding: '13px 24px', background: i % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                                  <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>{getFunctionLabel(r.fonction)}</span>
                                  <div><span style={{ fontSize: '0.84rem', color: s.color, fontWeight: 600, background: s.bg, padding: '3px 12px', borderRadius: '20px' }}>{r.shift_type}</span></div>
                                  <span style={{ fontSize: '1.05rem', color: '#38bdf8', textAlign: 'center', fontWeight: 800 }}>{r.quantite}</span>
                                  <span style={{ fontSize: '1rem', color: '#f8fafc', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(r.quantite) * Number(r.montant_unitaire))}</span>
                                </div>
                              );
                            })}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '13px 24px', background: 'rgba(16,185,129,0.08)', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                              <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>{effectif} agent(s) contractuel(s)</span>
                              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.15rem' }}>{formatMoney(total)}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )
        )}
      </div>

      {/* CUSTOM ALERT MODAL */}
      <AnimatePresence>
        {customAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertTriangle size={32} color="#ef4444" />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 12px 0' }}>Action Impossible</h3>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: '0 0 28px 0', lineHeight: 1.5 }}>{customAlert}</p>
              <button onClick={() => setCustomAlert(null)}
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 32px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DIALOG MODAL */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Trash2 size={32} color="#ef4444" />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 12px 0' }}>{confirmDialog.title}</h3>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: '0 0 28px 0', lineHeight: 1.5 }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setConfirmDialog(null)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Annuler
                </button>
                <button onClick={confirmDialog.onConfirm}
                  style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                  onMouseOut={e => e.currentTarget.style.background = '#ef4444'}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
