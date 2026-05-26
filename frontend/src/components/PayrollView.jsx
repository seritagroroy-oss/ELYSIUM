import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  ReceiptText, ChevronLeft, Loader2, Printer, Building2,
  Users, CheckCircle2, Clock, ShieldOff,
  BadgeCheck, Wallet, AlertCircle, MapPin, Eye, Archive, Lock
} from 'lucide-react';

const STATUSES = {
  brouillon: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', next: 'valide' },
  valide:    { label: 'Validé',    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   next: 'paye' },
  paye:      { label: 'Payé',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    next: null },
};

const getPeriodsList = () => {
  const list = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    list.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    });
  }
  return list;
};

const ZONE_COLORS = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f472b6','#fb7185','#818cf8','#2dd4bf','#e879f9','#a3e635'];

export default function PayrollView() {
  const { user } = useAuth();

  const isAllowed =
    user?.role === 'admin' ||
    ['comptabilite', 'comptabilité', 'rh', 'ressources humaines'].includes(
      (user?.service || '').toLowerCase()
    );

  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [sites, setSites] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [archivesList, setArchivesList] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Navigation: null = sites | {id, name} = zones | {siteId, zoneName} = agents
  const [activeSite, setActiveSite] = useState(null);   // {id, name}
  const [activeZone, setActiveZone] = useState(null);   // string (name)
  const [expandedRow, setExpandedRow] = useState(null);

  const formatArchiveTitle = (p) => {
    if (!p) return '';
    const [y, m] = p.split('-');
    const date = new Date(y, parseInt(m) - 1, 1);
    const monthName = date.toLocaleString('fr-FR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const prevDate = new Date(y, parseInt(m) - 2, 21);
    const currDate = new Date(y, parseInt(m) - 1, 20);
    const d1 = prevDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const d2 = currDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `Archive de ${capitalizedMonth} (Du ${d1} au ${d2})`;
  };

  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_payroll_statuses') || '{}'); }
    catch { return {}; }
  });

  const saveStatuses = (s) => {
    setStatuses(s);
    localStorage.setItem('pontage_payroll_statuses', JSON.stringify(s));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, salRes, funcRes, pubRes] = await Promise.all([
        apiCall('get_sites', {}, 'GET'),
        apiCall('get_salaries', { period }, 'GET'),
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_published_periods', {}, 'GET')
      ]);
      if (Array.isArray(sitesRes)) setSites(sitesRes);
      if (Array.isArray(salRes)) setSalaries(salRes);
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (pubRes?.success) {
        setPublishedPeriods(pubRes.published_periods || []);
        setArchivedPeriods(pubRes.archived_periods || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAllowed) loadData(); }, [period]);

  const isArchiveMode = viewMode === 'archives' && selectedArchive;
  const activeSalaries = isArchiveMode ? (archiveDetail?.salaries || []) : salaries;
  const activeStatuses = isArchiveMode ? (archiveDetail?.statuses || {}) : statuses;

  const funcLabel = (id) => functions.find(fn => fn.id === id)?.name || id || '—';

  const getStatusKey = (agentName, siteId, zoneName) => `${isArchiveMode ? selectedArchive : period}_${siteId}_${zoneName}_${agentName}`;
  const getAgentStatus = (agentName, siteId, zoneName) => activeStatuses[getStatusKey(agentName, siteId, zoneName)] || 'brouillon';
  
  const cycleStatus = (agentName, siteId, zoneName) => {
    if (isArchiveMode) return; // Lecture seule en mode archive
    const key = getStatusKey(agentName, siteId, zoneName);
    const next = STATUSES[activeStatuses[key] || 'brouillon']?.next;
    if (next) saveStatuses({ ...activeStatuses, [key]: next });
  };

  // Agents d'un site
  const agentsForSite = (siteName) => activeSalaries.filter(s => s.site === siteName);

  // Zones (subsites) uniques d'un site
  const zonesForSite = (siteName) => {
    const agents = agentsForSite(siteName);
    return [...new Set(agents.map(a => a.subsite).filter(Boolean))];
  };

  // Agents d'une zone précise
  const agentsForZone = (siteName, zoneName) =>
    agentsForSite(siteName).filter(a => a.subsite === zoneName);

  // Résumé par site
  const siteSummary = (site) => {
    const agents = agentsForSite(site.name);
    const total = agents.reduce((acc, s) => acc + s.total, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'valide').length;
    const zones = zonesForSite(site.name).length;
    return { agentsCount: agents.length, total, paid, validated, zones };
  };

  // Résumé par zone
  const zoneSummary = (siteId, siteName, zoneName) => {
    const agents = agentsForZone(siteName, zoneName);
    const total = agents.reduce((acc, s) => acc + s.total, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'valide').length;
    return { agentsCount: agents.length, total, paid, validated };
  };

  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_payroll_archives', {}, 'GET');
      if (res?.success) setArchivesList(res.archives || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (viewMode === 'archives') fetchArchives();
  }, [viewMode]);

  useEffect(() => {
    if (selectedArchive) {
      const loadArch = async () => {
        setArchiveLoading(true);
        try {
          const res = await apiCall(`get_payroll_archive_detail&period=${selectedArchive}`, {}, 'GET');
          if (res?.success) setArchiveDetail(res.archive);
        } catch (e) { console.error(e); } 
        finally { setArchiveLoading(false); }
      };
      loadArch();
    } else {
      setArchiveDetail(null);
      if (viewMode === 'archives') {
        setActiveSite(null);
        setActiveZone(null);
      }
    }
  }, [selectedArchive, viewMode]);

  const handleArchive = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir archiver cet état de paie pour la période ${period} ?\nCeci figera les montants et statuts actuels.`)) return;
    try {
      const res = await apiCall('archive_payroll', { period, salaries, statuses }, 'POST');
      if (res?.success) {
        alert('Archive créée avec succès.');
        setArchivedPeriods(prev => [...prev, period]);
        fetchArchives();
      } else {
        alert(res?.message || 'Erreur lors de l\'archivage.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    }
  };

  const isPeriodPublished = publishedPeriods.includes(period);

  const BackBtn = ({ onClick, label = 'Retour' }) => (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <ChevronLeft size={18} /> {label}
    </button>
  );

  const PeriodSelect = () => (
    <select className="form-input" style={{ background: 'rgba(0,0,0,0.3)', minWidth: '180px' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
      {getPeriodsList().map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
  );

  const ModeTabs = () => (
    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
      <button onClick={() => setViewMode('current')} className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'current' ? 'var(--primary)' : 'transparent', color: viewMode === 'current' ? 'white' : 'var(--muted)', border: 'none' }}>
        Actuel
      </button>
      <button onClick={() => setViewMode('archives')} className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'archives' ? 'var(--primary)' : 'transparent', color: viewMode === 'archives' ? 'white' : 'var(--muted)', border: 'none' }}>
        <Archive size={16} style={{ display: 'inline', marginRight: '6px' }} /> Archives
      </button>
    </div>
  );

  // ─── Accès refusé ────────────────────────────────────────────────────────────
  if (!isAllowed) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <ShieldOff size={40} style={{ color: '#ef4444' }} />
      </div>
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Accès Restreint</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '420px', lineHeight: '1.6' }}>
        Ce module est réservé aux administrateurs et au service Comptabilité / RH.
      </p>
    </div>
  );

  // ─── VUE ARCHIVES (Liste) ───────────────────────────────────────────
  if (viewMode === 'archives' && !selectedArchive) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>Archives de Paie</h2>
          </div>
          <ModeTabs />
        </div>
        
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          {archivesList.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
              <Archive size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>Aucune archive disponible.</p>
            </div>
          ) : (
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
                  {archivesList.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '700', color: 'white' }}>{a.period}</td>
                      <td>{a.archived_at}</td>
                      <td>{a.archived_by}</td>
                      <td>
                        <button onClick={() => setSelectedArchive(a.period)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          Consulter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── BLOCAGE SI NON PUBLIÉ (Seulement en Actuel) ───────────────────────────
  if (!isArchiveMode && !isPeriodPublished) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>État de Paie</h2>
            <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodSelect />
            <ModeTabs />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', marginTop: '24px' }} className="glass-panel">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Lock size={40} style={{ color: '#f59e0b' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Pointage non publié</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '480px', lineHeight: '1.6' }}>
            L'état de paie de <strong>{period}</strong> n'est pas encore accessible. Le service en charge du pointage n'a pas encore validé ni publié les données pour cette période.
          </p>
        </div>
      </div>
    );
  }

  const isPeriodArchived = archivedPeriods.includes(period);

  // ─── BLOCAGE SI DÉJÀ ARCHIVÉ (Seulement en Actuel) ────────────────────────
  if (!isArchiveMode && isPeriodArchived) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>État de Paie</h2>
            <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodSelect />
            <ModeTabs />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', marginTop: '24px' }} className="glass-panel">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Archive size={40} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>État de paie clôturé</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '480px', lineHeight: '1.6' }}>
            L'état de paie de <strong>{period}</strong> a été définitivement archivé. Il n'est plus modifiable dans cet espace.
            <br/><br/>
            Veuillez basculer sur l'onglet <strong>Archives</strong> pour le consulter en lecture seule.
          </p>
        </div>
      </div>
    );
  }

  // ─── VUE 3 : Agents d'une Zone ───────────────────────────────────────────────
  if (activeSite && activeZone) {
    const agents = agentsForZone(activeSite.name, activeZone);
    const totalNet = agents.reduce((acc, s) => acc + s.total, 0);
    const toggleRow = (idx) => setExpandedRow(prev => prev === idx ? null : idx);
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
            <BackBtn onClick={() => setActiveZone(null)} label="Zones" />
            <ReceiptText size={20} style={{ color: 'var(--a)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'} — 
                <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>{activeSite.name}</span>
                <span style={{ color: 'var(--muted)' }}> / </span>
                <span style={{ color: 'var(--a)' }}>{activeZone}</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> Imprimer
            </button>
          </div>
        </div>

        {/* Résumé de la zone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', margin: '20px 0' }}>
          {[
            { label: 'Agents', value: agents.length, color: '#38bdf8', icon: Users },
            { label: 'Brouillons', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'brouillon').length, color: '#94a3b8', icon: Clock },
            { label: 'Validés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'valide').length, color: '#38bdf8', icon: BadgeCheck },
            { label: 'Payés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'paye').length, color: '#22c55e', icon: Wallet },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
              <div style={{ background: `${color}20`, borderRadius: '8px', padding: '8px', color }}><Icon size={18} /></div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>{value}</h4>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune donnée de salaire disponible.<br />Calculez d'abord les salaires dans le module "Calcul Salaires".</p>
          </div>
        ) : (
          <div className="glass-panel">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom & Prénom</th>
                    <th>Poste</th>
                    <th style={{ textAlign: 'center' }}>Jours Trav.</th>
                    <th style={{ textAlign: 'center' }}>Absences</th>
                    <th style={{ textAlign: 'center', color: 'var(--b)' }}>H. Sup.</th>
                    <th style={{ textAlign: 'right' }}>Base (XOF)</th>
                    <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Retenues</th>
                    <th style={{ textAlign: 'right', color: 'var(--b)' }}>Supplémentaire</th>
                    <th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                   {agents.map((s, idx) => {
                    const status = getAgentStatus(s.name, activeSite.id, activeZone);
                    const st = STATUSES[status];
                    const isOpen = expandedRow === idx;
                    return (
                      <React.Fragment key={idx}>
                       <tr>
                         <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                         <td style={{ fontWeight: '700' }}>{s.name}</td>
                         <td>
                           <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem' }}>
                             {funcLabel(s.function)}
                           </span>
                         </td>
                         <td style={{ textAlign: 'center', fontWeight: '600' }}>{s.days_worked ?? (30 - s.absences)}</td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <span style={{ color: s.absences > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                               {s.absences > 0 ? s.absences : '—'}
                             </span>
                             {s.absences > 0 && (
                               <button
                                 onClick={() => toggleRow(isOpen && expandedRow === idx ? null : idx)}
                                 title="Voir les jours d'absence"
                                 style={{ background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--danger)' : 'rgba(239,68,68,0.4)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                               >
                                 <Eye size={14} />
                               </button>
                             )}
                           </div>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <span style={{ color: (s.sp_count||0) > 0 ? 'var(--b)' : 'var(--muted)' }}>
                               {(s.sp_count||0) > 0 ? `+${s.sp_count}` : '—'}
                             </span>
                             {(s.sp_count||0) > 0 && (
                               <button
                                 onClick={() => toggleRow(idx)}
                                 title="Voir les jours supplémentaires"
                                 style={{ background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--b)' : 'rgba(56,189,248,0.4)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                               >
                                 <Eye size={14} />
                               </button>
                             )}
                           </div>
                         </td>
                         <td style={{ textAlign: 'right' }}>{s.base.toLocaleString()}</td>
                         <td style={{ textAlign: 'right', color: s.deductions > 0 ? 'var(--danger)' : 'var(--muted)' }}>{s.deductions > 0 ? `-${s.deductions.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', color: s.gains > 0 ? 'var(--b)' : 'var(--muted)', fontWeight: s.gains > 0 ? '700' : '400' }}>{s.gains > 0 ? `+${s.gains.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.05rem' }}>{s.total.toLocaleString()}</td>
                         <td style={{ textAlign: 'center' }}>
                           <button
                             onClick={() => cycleStatus(s.name, activeSite.id, activeZone)}
                             style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}50`, borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700', cursor: st.next ? 'pointer' : 'default', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                             title={st.next ? `Passer à : ${STATUSES[st.next]?.label}` : 'Statut final'}
                           >
                             {status === 'paye' && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                             {st.label}
                           </button>
                         </td>
                       </tr>
                       {isOpen && (
                         <tr>
                           <td colSpan={11} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 20px' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                               {/* Détails Absences */}
                               <div>
                                 <h4 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                   Jours d'absence ({s.absences})
                                 </h4>
                                 {(s.absence_details || []).length === 0 ? (
                                   <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune absence</p>
                                 ) : (
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {s.absence_details.map((a, i) => (
                                       <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                         {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                               {/* Détails Supplémentaires */}
                               <div>
                                 <h4 style={{ color: 'var(--b)', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                   Services supplémentaires ({s.sp_count || 0})
                                 </h4>
                                 {(s.sp_details || []).length === 0 ? (
                                   <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucun service supplémentaire</p>
                                 ) : (
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {s.sp_details.map((a, i) => (
                                       <span key={i} style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                         {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </td>
                         </tr>
                       )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={6} style={{ fontWeight: '700', padding: '14px 16px' }}>TOTAL ZONE</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{agents.reduce((a, s) => a + s.base, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>-{agents.reduce((a, s) => a + s.deductions, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--b)' }}>+{agents.reduce((a, s) => a + s.gains, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.1rem' }}>{totalNet.toLocaleString()} XOF</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ─── VUE 2 : Zones d'un Site ─────────────────────────────────────────────────
  if (activeSite) {
    const zones = zonesForSite(activeSite.name);
    const allAgents = agentsForSite(activeSite.name);
    const totalSite = allAgents.reduce((a, s) => a + s.total, 0);

    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
            <BackBtn onClick={() => setActiveSite(null)} label="Sites" />
            <ReceiptText size={20} style={{ color: 'var(--a)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'} — <span style={{ color: 'var(--a)' }}>{activeSite.name}</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isArchiveMode && (
              <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={16} /> Archiver l'état de paie
              </button>
            )}
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
            <ModeTabs />
          </div>
        </div>

        {/* Stats du site */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', margin: '20px 0' }}>
          {[
            { label: 'Total Agents', value: allAgents.length, color: '#38bdf8', icon: Users },
            { label: 'Zones', value: zones.length, color: '#a78bfa', icon: MapPin },
            { label: 'Validés', value: allAgents.filter(s => getAgentStatus(s.name, activeSite.id, s.subsite) === 'valide').length, color: '#38bdf8', icon: BadgeCheck },
            { label: 'Payés', value: allAgents.filter(s => getAgentStatus(s.name, activeSite.id, s.subsite) === 'paye').length, color: '#22c55e', icon: Wallet },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
              <div style={{ background: `${color}20`, borderRadius: '8px', padding: '8px', color }}><Icon size={18} /></div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>{value}</h4>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
          </div>
        ) : zones.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune zone / aucune donnée pour ce site sur cette période.</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', margin: '0 0 16px 0', fontSize: '0.95rem' }}>
              Sélectionnez une zone pour voir les états de paie de ses agents.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {zones.map((zone, idx) => {
                const { agentsCount, total, paid, validated } = zoneSummary(activeSite.id, activeSite.name, zone);
                const progress = agentsCount > 0 ? Math.round((paid / agentsCount) * 100) : 0;
                const color = ZONE_COLORS[idx % ZONE_COLORS.length];
                return (
                  <div
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    className="glass-panel"
                    style={{ cursor: 'pointer', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.35s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px -10px ${color}50`; e.currentTarget.style.borderColor = `${color}60`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, borderRadius: '50%' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: `${color}20`, borderRadius: '10px', padding: '10px', color }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0 }}>{zone}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>{agentsCount} agent{agentsCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '5px' }}>
                        <span>Progression paiements</span>
                        <span style={{ color: progress === 100 ? '#22c55e' : color, fontWeight: '700' }}>{progress}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#22c55e' : color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {agentsCount - validated - paid} Brouillon
                        </span>
                        <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {validated} Validé
                        </span>
                        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {paid} Payé
                        </span>
                      </div>
                      <span style={{ color: color, fontWeight: '700', fontSize: '0.88rem' }}>
                        {total.toLocaleString()} <span style={{ fontSize: '0.7rem' }}>XOF</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ─── VUE 1 : Liste des Sites ─────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
          <ReceiptText size={24} style={{ color: 'var(--a)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>{isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'}</h2>
          {!isArchiveMode && <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isArchiveMode && (
            <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={16} /> Archiver l'état de paie
            </button>
          )}
          {!isArchiveMode && <PeriodSelect />}
          {isArchiveMode && (
            <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
              Mode Lecture Seule
            </div>
          )}
          <ModeTabs />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--b)' }} />
        </div>
      ) : sites.length === 0 ? (
        <div className="glass-panel" style={{ marginTop: '24px', textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <Building2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>Aucun site trouvé.</p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', margin: '20px 0 16px 0', fontSize: '0.95rem' }}>
            Sélectionnez un site pour accéder à ses zones, puis aux états de paie.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {sites.map((site, idx) => {
              const { agentsCount, total, paid, validated, zones } = siteSummary(site);
              const progress = agentsCount > 0 ? Math.round((paid / agentsCount) * 100) : 0;
              return (
                <div
                  key={site.id}
                  onClick={() => setActiveSite({ id: site.id, name: site.name })}
                  className="glass-panel"
                  style={{ cursor: 'pointer', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.4s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(56,189,248,0.3)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(56,189,248,0.12)', borderRadius: '10px', padding: '10px', color: 'var(--b)' }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>{site.name}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                        {zones} zone{zones > 1 ? 's' : ''} · {agentsCount} agent{agentsCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '5px' }}>
                      <span>Progression paiements</span>
                      <span style={{ color: progress === 100 ? '#22c55e' : 'var(--b)', fontWeight: '700' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'linear-gradient(to right,#22c55e,#16a34a)' : 'linear-gradient(to right,#38bdf8,#818cf8)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{agentsCount - validated - paid} Brouillon</span>
                      <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{validated} Validé</span>
                      <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{paid} Payé</span>
                    </div>
                    <span style={{ color: 'var(--a)', fontWeight: '700', fontSize: '0.9rem' }}>
                      {total.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>XOF</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @media print { .sidebar,.nav-links,.top-bar button{display:none!important} }
      `}</style>
    </div>
  );
}
