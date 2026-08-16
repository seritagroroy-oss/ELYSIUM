import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart, Cell
} from 'recharts';

import { 
  Loader2, TrendingUp, ArrowLeft, Archive, Search, X, LayoutDashboard, Settings, 
  UserCheck, Users, Palmtree, AlertTriangle, CheckCircle, Info, Sliders, ArrowDown, ArrowUp, AlertCircle, Calendar
} from 'lucide-react';

// Hook d'animation count-up : anime un nombre de 0 vers target en duration ms
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!target || target === 0) { setValue(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 90,
      damping: 14,
      staggerChildren: 0.15 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 12 }
  }
};

export default function FluctuationView({ onClose }) {
  const { user, hasWritePermission } = useAuth();
  
  // RBAC: Plus robuste, vérifie hasWritePermission, le type d'espace ou le nom du service
  const isCompta = 
    (hasWritePermission && hasWritePermission('fluctuation')) ||
    user?.workspace_type === 'COMPTABLE' ||
    user?.workspace_preset === 'COMPTABLE' ||
    (user?.service_name && /compta/i.test(user.service_name)) ||
    user?.role === 'admin' || 
    user?.role === 'super_admin';

  // État de survol pour les cartes KPI
  const [hoveredCard, setHoveredCard] = useState(null);

  const getActivePeriod = (archives = []) => {
    if (archives && archives.length > 0) {
      // Les archives sont triées par période (plus récent en premier)
      return archives[0].period;
    }
    const sysD = new Date();
    return `${sysD.getFullYear()}-${String(sysD.getMonth() + 1).padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [archivesList, setArchivesList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | saisie
  const [archivesLoaded, setArchivesLoaded] = useState(false);
  
  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_fluctuation_archives', { scope: 'company' }, 'GET');
      if (res?.success) {
        const archs = res.archives || [];
        setArchivesList(archs);
        const currP = res.current_period;
        setCurrentPeriod(currP);
        setPeriod(currP);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setArchivesLoaded(true);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);
  
  const [analytics, setAnalytics] = useState(null);
  const [comptaData, setComptaData] = useState(null);
  const [prevAnalytics, setPrevAnalytics] = useState(null);

  // Form states for Saisie
  const [gridData, setGridData] = useState([]);
  const [contractsData, setContractsData] = useState([]);
  const [varsData, setVarsData] = useState({ primes_globales: 0, charges_globales_percent: 0 });

  // Valeurs animées (count-up) déclarées au plus haut niveau pour éviter les retours anticipés conditionnels
  const animCA = useCountUp(analytics?.chiffre_affaire || 0);
  const animMsTotal = useCountUp((analytics?.ms_admin || 0) + (analytics?.ms_agents || 0));
  const animMsAdmin = useCountUp(analytics?.ms_admin || 0);
  const animMsAgents = useCountUp(analytics?.ms_agents || 0);
  const netMarginRaw = (analytics?.chiffre_affaire || 0) - (analytics?.ms_admin || 0) - (analytics?.ms_agents || 0);
  const animMarge = useCountUp(Math.abs(netMarginRaw));


  const loadData = async () => {
    setAnalytics(null);
    setPrevAnalytics(null);
    setLoading(true);
    try {
      const data = await apiCall('get_fluctuation_analytics', { period }, 'GET');
      if (data && data.success === false) {
        setAnalytics({ _error: data.message });
        return;
      }
      setAnalytics(data);

      // Previous period for comparison
      const [y, m] = period.split('-');
      const d = new Date(y, m - 1, 1);
      d.setMonth(d.getMonth() - 1);
      const prevPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prevData = await apiCall('get_fluctuation_analytics', { period: prevPeriod }, 'GET');
      if (prevData && prevData.success !== false) {
        setPrevAnalytics(prevData);
      }

      // Load Compta data
      const cData = await apiCall('get_compta_data', { period }, 'GET');
      if (cData.success) {
        setComptaData(cData);
        setGridData(cData.grid || []);
        setContractsData(cData.contracts || []);
        setVarsData(cData.variables || { primes_globales: 0, charges_globales_percent: 0 });
      }
    } catch (e) {
      console.error(e);
      setAnalytics({ _error: "Erreur de connexion au serveur." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (archivesLoaded) {
      loadData();
    }
  }, [period, archivesLoaded]);

  const handleSaveGrid = async () => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_salary_grid', { grid: Object.fromEntries(gridData.map(g => [g.poste, g.taux_horaire])) });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContract = async (site_name, budget, charges, frais, prime) => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_site_contracts', { 
        site_name, 
        budget_mensuel: budget, 
        charges_percent: charges, 
        frais_fixes: frais,
        prime_site: prime
      });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVars = async () => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_monthly_variables', { 
        period, 
        primes_globales: varsData.primes_globales, 
        charges_globales_percent: varsData.charges_globales_percent 
      });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (viewMode !== 'archives' || selectedArchive) {
    if (!analytics) {
      return (
        <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: '#3b82f6', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <p>Initialisation du module d'analyse salariale...</p>
          </div>
        </div>
      );
    }

    if (analytics._error) {
      return (
        <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Accès refusé ou Erreur</h3>
            <p style={{ margin: 0 }}>{analytics._error}</p>
            <button onClick={onClose} className="btn mt-4" style={{ marginTop: '15px', background: '#1e293b', color: 'white' }}>Retour</button>
          </div>
        </div>
      );
    }
  }

  // Formatting utils
  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  const formatPeriod = (p) => {
    if (!p) return '';
    const [y, m] = p.split('-');
    const d = new Date(y, parseInt(m, 10) - 1, 1);
    const str = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const prevCost = prevAnalytics?.company_metrics?.total_cost || 0;
  const currentCost = analytics?.company_metrics?.total_cost || 0;
  const diffCost = currentCost - prevCost;
  const diffPercent = prevCost > 0 ? (diffCost / prevCost) * 100 : 0;

  const chartData = (analytics?.sites_rentability || []).map(s => ({
    name: s.name,
    Revenus: s.contract_revenue,
    Coûts: s.total_cost,
    Marge: s.net_margin,
    isAlert: s.is_alert
  })).sort((a, b) => b.Revenus - a.Revenus).slice(0, 8); // Top 8

  // Le netMarginRaw est défini plus haut pour le hook count-up

  return (
    <div className="fluctuation-view-container" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'radial-gradient(ellipse at top, #0f172a 0%, #070a12 100%)', overflowY: 'auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(13, 18, 31, 0.45)', backdropFilter: 'blur(20px) saturate(140%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
            <TrendingUp size={24} style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.4))' }} /> Fluctuations & Rentabilité
          </h2>
          <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
            {isCompta ? (
              <span style={{ color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></span>
                Accès Comptabilité (Édition activée)
              </span>
            ) : (
              <span style={{ color: '#fbbf24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></span>
                Accès Lecture Seule
              </span>
            )}
          </div>
        </div>

        {/* Période affichée au centre */}
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(56, 189, 248, 0.04)', padding: '8px 24px', borderRadius: '24px', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(56,189,248,0.05)' }}>
          <Calendar size={18} style={{ color: '#38bdf8' }} /> {formatPeriod(period)}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          
          {/* TABS ACTUEL/ARCHIVES */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
            {selectedArchive && (
              <button onClick={() => setSelectedArchive(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '6px 14px', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                <ArrowLeft size={14} /> Liste
              </button>
            )}
            <button onClick={() => { setViewMode('current'); setPeriod(currentPeriod); }} className={`btn`} style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, background: viewMode === 'current' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent', color: viewMode === 'current' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'current' ? '0 4px 15px rgba(56,189,248,0.3)' : 'none' }}>
              Actuel
            </button>
            <button onClick={() => { setViewMode('archives'); setSelectedArchive(null); }} className={`btn`} style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, background: viewMode === 'archives' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent', color: viewMode === 'archives' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'archives' ? '0 4px 15px rgba(56,189,248,0.3)' : 'none' }}>
              <Archive size={14} style={{ marginRight: '6px' }} /> Archives
            </button>
          </div>

          {viewMode === 'current' ? (
            <input 
              type="month" 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5, 8, 16, 0.5)', color: 'white', outline: 'none', fontWeight: 600, fontSize: '0.9rem' }}
            />
          ) : selectedArchive ? (
            <div style={{ padding: '9px 16px', background: 'rgba(245,158,11,0.06)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.03em' }}>Mode Lecture Seule</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(5, 8, 16, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '9px 16px', width: '260px' }}>
              <Search size={16} style={{ color: '#64748b', marginRight: '10px' }} />
              <input type="text" placeholder="Rechercher une archive..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
            </div>
          )}

          <button onClick={onClose} style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* TABS */}
      {(viewMode === 'current' || selectedArchive) && (
        <div style={{ padding: '0 36px', marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '14px 28px', background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#38bdf8' : '#64748b', borderBottom: activeTab === 'dashboard' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LayoutDashboard size={16} /> Tableau de Bord
            </button>
            <button 
              onClick={() => setActiveTab('saisie')}
              style={{ padding: '14px 28px', background: 'none', border: 'none', color: activeTab === 'saisie' ? '#38bdf8' : '#64748b', borderBottom: activeTab === 'saisie' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Settings size={16} /> Saisie & Paramètres
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 36px' }}>
        {viewMode === 'archives' && !selectedArchive ? (
          <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            {archivesList.filter(arch => {
              const q = searchQuery.toLowerCase();
              return (arch.period && arch.period.toLowerCase().includes(q)) || 
                     (arch.archived_by && arch.archived_by.toLowerCase().includes(q)) ||
                     (arch.archived_at && arch.archived_at.toLowerCase().includes(q));
            }).length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
                <Archive size={48} style={{ opacity: 0.2, marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aucune archive trouvée.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(5, 8, 16, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Période</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date d'archivage</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivé par</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivesList.filter(arch => {
                    const q = searchQuery.toLowerCase();
                    return (arch.period && arch.period.toLowerCase().includes(q)) || 
                           (arch.archived_by && arch.archived_by.toLowerCase().includes(q)) ||
                           (arch.archived_at && arch.archived_at.toLowerCase().includes(q));
                  }).map(arch => {
                    return (
                      <tr key={arch.period} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
                        <td style={{ padding: '18px 24px', color: 'white', fontWeight: '800', fontSize: '0.98rem' }}>{formatPeriod(arch.period)}</td>
                        <td style={{ padding: '18px 24px', color: '#cbd5e1', fontSize: '0.9rem' }}>{arch.archived_at}</td>
                        <td style={{ padding: '18px 24px', color: '#cbd5e1', fontSize: '0.9rem' }}>{arch.archived_by}</td>
                        <td style={{ padding: '18px 24px' }}>
                          <button onClick={() => { setSelectedArchive(arch.period); setPeriod(arch.period); }} className="btn" style={{ background: 'rgba(56,189,248,0.06)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.12)'; }}>
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && analytics && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                
                {analytics.pending_compta ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ padding: '60px 40px', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', textAlign: 'center', maxWidth: '650px', margin: '40px auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px) saturate(140%)' }}
                  >
                    <motion.div 
                      variants={itemVariants}
                      style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', margin: '0 auto 24px auto', filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.2))' }}
                    >
                      <Loader2 className="animate-spin" size={36} style={{ color: '#38bdf8' }} />
                    </motion.div>
                    <motion.h3 
                      variants={itemVariants}
                      style={{ color: '#f8fafc', fontSize: '1.45rem', fontWeight: 900, margin: '0 0 14px 0', letterSpacing: '-0.02em' }}
                    >
                      Traitement Comptable en cours
                    </motion.h3>
                    <motion.p 
                      variants={itemVariants}
                      style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: '1.6', margin: 0, fontWeight: 500 }}
                    >
                      Les données de fluctuation et de rentabilité pour la période <strong>{formatPeriod(period)}</strong> seront disponibles dès que la comptabilité aura finalisé et clôturé l'état de paie mensuel.
                    </motion.p>
                  </motion.div>
                ) : (
                  <>
                    {analytics.snapshot_exists ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>

                    
                    {/* CHIFFRE D'AFFAIRES */}
                    <div
                      onMouseEnter={() => setHoveredCard('ca')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: hoveredCard === 'ca' ? 'rgba(14, 165, 233, 0.06)' : 'rgba(14, 165, 233, 0.02)',
                        borderRadius: '24px', padding: '28px',
                        border: hoveredCard === 'ca' ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(14, 165, 233, 0.15)',
                        boxShadow: hoveredCard === 'ca'
                          ? '0 20px 60px 0 rgba(14, 165, 233, 0.18), inset 0 0 30px rgba(14, 165, 233, 0.05)'
                          : '0 8px 32px 0 rgba(14, 165, 233, 0.05), inset 0 0 15px rgba(14, 165, 233, 0.02)',
                        position: 'relative', overflow: 'hidden', cursor: 'default',
                        transform: hoveredCard === 'ca' ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}>
                      <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.08)', filter: 'blur(30px)' }}></div>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: hoveredCard === 'ca' ? '0 0 12px #38bdf8' : 'none', transition: 'box-shadow 0.3s' }}></span>
                        Chiffre d'Affaires
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 950, color: '#f8fafc', letterSpacing: '-0.02em', textShadow: hoveredCard === 'ca' ? '0 0 40px rgba(56,189,248,0.4)' : '0 0 20px rgba(56,189,248,0.15)', transition: 'text-shadow 0.3s' }}>
                        {formatMoney(animCA)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px', fontWeight: 500 }}>
                        Période d'activité : {formatPeriod(period)}
                      </div>
                    </div>

                    {/* MASSE SALARIALE */}
                    <div
                      onMouseEnter={() => setHoveredCard('ms')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: hoveredCard === 'ms' ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 92, 246, 0.02)',
                        borderRadius: '24px', padding: '28px',
                        border: hoveredCard === 'ms' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.15)',
                        boxShadow: hoveredCard === 'ms'
                          ? '0 20px 60px 0 rgba(139, 92, 246, 0.18), inset 0 0 30px rgba(139, 92, 246, 0.05)'
                          : '0 8px 32px 0 rgba(139, 92, 246, 0.05), inset 0 0 15px rgba(139, 92, 246, 0.02)',
                        position: 'relative', overflow: 'hidden', cursor: 'default',
                        transform: hoveredCard === 'ms' ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}>
                      <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.08)', filter: 'blur(30px)' }}></div>
                      <div style={{ color: '#a78bfa', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', boxShadow: hoveredCard === 'ms' ? '0 0 12px #a78bfa' : 'none', transition: 'box-shadow 0.3s' }}></span>
                        Masse Salariale
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Total Général</span>
                          <span style={{ fontSize: '1.75rem', fontWeight: 950, color: '#f8fafc', textShadow: hoveredCard === 'ms' ? '0 0 40px rgba(167,139,250,0.4)' : '0 0 20px rgba(167,139,250,0.15)', transition: 'text-shadow 0.3s' }}>
                            {formatMoney(animMsTotal)}
                          </span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <UserCheck size={14} style={{ color: '#a78bfa' }} /> Admin <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({analytics.admin_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white' }}>
                            {formatMoney(animMsAdmin)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <Users size={14} style={{ color: '#a78bfa' }} /> Agents Terrain <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({analytics.agents_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white' }}>
                            {formatMoney(animMsAgents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MARGE NETTE */}
                    {(() => {
                      const netMarginValue = analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents;
                      const isPositive = netMarginValue >= 0;
                      const cardKey = 'marge';
                      return (
                        <div
                          onMouseEnter={() => setHoveredCard(cardKey)}
                          onMouseLeave={() => setHoveredCard(null)}
                          style={{
                            background: hoveredCard === cardKey
                              ? (isPositive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)')
                              : (isPositive ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'),
                            borderRadius: '24px', padding: '28px',
                            border: hoveredCard === cardKey
                              ? (isPositive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)')
                              : (isPositive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'),
                            boxShadow: hoveredCard === cardKey
                              ? (isPositive ? '0 20px 60px 0 rgba(16, 185, 129, 0.18), inset 0 0 30px rgba(16, 185, 129, 0.05)' : '0 20px 60px 0 rgba(239, 68, 68, 0.18), inset 0 0 30px rgba(239, 68, 68, 0.05)')
                              : (isPositive ? '0 8px 32px 0 rgba(16, 185, 129, 0.05), inset 0 0 15px rgba(16, 185, 129, 0.02)' : '0 8px 32px 0 rgba(239, 68, 68, 0.05), inset 0 0 15px rgba(239, 68, 68, 0.02)'),
                            position: 'relative', overflow: 'hidden', cursor: 'default',
                            transform: hoveredCard === cardKey ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          }}>
                          <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', filter: 'blur(30px)' }}></div>
                          <div style={{ color: isPositive ? '#34d399' : '#f87171', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPositive ? '#34d399' : '#f87171', boxShadow: hoveredCard === cardKey ? `0 0 12px ${isPositive ? '#34d399' : '#f87171'}` : 'none', transition: 'box-shadow 0.3s' }}></span>
                            Marge Nette
                          </div>
                          <div style={{ fontSize: '2.4rem', fontWeight: 950, color: '#f8fafc', letterSpacing: '-0.02em', textShadow: hoveredCard === cardKey ? (isPositive ? '0 0 40px rgba(52,211,153,0.4)' : '0 0 40px rgba(248,113,113,0.4)') : (isPositive ? '0 0 20px rgba(52,211,153,0.15)' : '0 0 20px rgba(248,113,113,0.15)'), transition: 'text-shadow 0.3s' }}>
                            {isPositive ? '' : '-'}{formatMoney(animMarge)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px', fontWeight: 500 }}>
                            Chiffre d'Affaires - Masse Salariale Totale
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* ANALYSE PORTEFEUILLE CLIENT */}
                  {analytics.sites_analysis && (
                    <div style={{ background: 'rgba(13, 18, 31, 0.45)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}>
                          <LayoutDashboard size={18} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>Analyse du Portefeuille Client</h3>
                          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
                            {analytics.sites_analysis.prev_period === 'données actuelles'
                              ? 'Comparaison avec le référentiel actuel de Facturation Clients'
                              : `Comparaison avec le mois précédent (${analytics.sites_analysis.prev_period})`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                        
                        {/* Résumé des sites */}
                        <div style={{ background: 'rgba(5, 8, 16, 0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nombre total de sites</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: '2.1rem', fontWeight: 950, color: 'white' }}>{analytics.sites_analysis.curr_count}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>vs {analytics.sites_analysis.prev_count} le mois dernier</span>
                          </div>
                        </div>

                        {/* Sites Perdus */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.1)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <ArrowDown size={14} style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' }} /> Perdus ({analytics.sites_analysis.lost_sites.length})
                            </div>
                            <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.98rem' }}>-{formatMoney(analytics.sites_analysis.lost_value)}</div>
                          </div>
                          {analytics.sites_analysis.lost_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {analytics.sites_analysis.lost_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                                  <span>{s.name}</span>
                                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun site perdu.</div>
                          )}
                        </div>

                        {/* Sites Gagnés */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(34, 197, 94, 0.1)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <ArrowUp size={14} style={{ filter: 'drop-shadow(0 0 5px rgba(34,197,94,0.5))' }} /> Nouveaux ({analytics.sites_analysis.gained_sites.length})
                            </div>
                            <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '0.98rem' }}>+{formatMoney(analytics.sites_analysis.gained_value)}</div>
                          </div>
                          {analytics.sites_analysis.gained_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                              {analytics.sites_analysis.gained_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                                  <span>{s.name}</span>
                                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun nouveau site.</div>
                          )}
                        </div>

                        {/* Congés Payés */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.1)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <Palmtree size={14} /> Congés ({(analytics.sites_analysis.conge_agents || []).length})
                            </div>
                            <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '0.98rem' }}>{formatMoney(analytics.sites_analysis.conge_value || 0)}</div>
                          </div>
                          {(analytics.sites_analysis.conge_agents || []).length > 0 ? null : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun congé payé ce mois.</div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                </>
              ) : (
                <div style={{ padding: '30px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 30px rgba(245, 158, 11, 0.05)' }}>
                  <AlertCircle size={36} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.3))' }} />
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>Clôture manquante pour ce mois</h3>
                    <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.6', fontSize: '0.92rem' }}>
                      Pour visualiser le Chiffre d'Affaires et la Masse Salariale exacte, vous devez d'abord vous rendre dans <strong>État de Paie</strong> et cliquer sur le bouton <strong>Clôturer l'état de paie</strong> pour la période <strong>{period}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#f8fafc' }}>Analyse Rentabilité (Top 8 Sites)</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v/1000000).toFixed(1) + 'M'} />
                        <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Revenus" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Coûts" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isAlert ? '#fda4af' : '#c4b5fd'} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '400px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#f8fafc' }}>Alertes Dépassement Budget</h3>
                  {analytics.sites_rentability.filter(s => s.is_alert).length === 0 ? (
                    <div style={{ color: '#22c55e', textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircle size={24} style={{ color: '#22c55e', marginBottom: '10px', marginLeft: 'auto', marginRight: 'auto' }} />
                      <div>Aucun site en alerte budget (Tous sous les 80%).</div>
                    </div>
                  ) : (
                    analytics.sites_rentability.filter(s => s.is_alert).map((s) => (
                      <div key={s.name} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{s.name}</span>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>
                            {s.contract_revenue > 0 ? Math.round((s.total_cost / s.contract_revenue) * 100) + '%' : 'Non Facturé'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                           Coût: {formatMoney(s.total_cost)} / {formatMoney(s.contract_revenue)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}


          {activeTab === 'saisie' && (
            <motion.div key="saisie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              {!isCompta && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '15px', color: '#fcd34d', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={24} style={{ color: '#fcd34d' }} />
                  Mode Lecture Seule. Seul le service COMPTABILITE peut modifier ces paramètres.
                </div>
              )}


              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
                
                {/* VARIABLES MENSUELLES */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={18} /> Variables Globales ({period})
                  </h3>
                  
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>Primes Globales Exceptionnelles (XOF)</label>
                    <input 
                      type="number" 
                      disabled={!isCompta}
                      value={varsData.primes_globales}
                      onChange={e => setVarsData({...varsData, primes_globales: Number(e.target.value)})}
                      style={{ width: '100%', background: isCompta ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)', border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '10px', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>Charges Patronales Globales (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      disabled={!isCompta}
                      value={varsData.charges_globales_percent}
                      onChange={e => setVarsData({...varsData, charges_globales_percent: Number(e.target.value)})}
                      style={{ width: '100%', background: isCompta ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)', border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '10px', borderRadius: '8px' }}
                    />
                  </div>

                  {isCompta && (
                    <button onClick={handleSaveVars} style={{ marginTop: 'auto', width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      Appliquer les variables
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
