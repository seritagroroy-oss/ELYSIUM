import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart, Cell
} from 'recharts';

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
  
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [archivesList, setArchivesList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | saisie
  
  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_fluctuation_archives', { scope: 'company' }, 'GET');
      if (res?.success) {
        const archs = res.archives || [];
        setArchivesList(archs);
        setPeriod(getActivePeriod(archs));
      }
    } catch (e) { console.error(e); }
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

  const loadData = async () => {
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
    loadData();
  }, [period]);

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
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '1.5rem' }}></i>
            <p>Initialisation du module d'analyse salariale...</p>
          </div>
        </div>
      );
    }

    if (analytics._error) {
      return (
        <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1.5rem' }}></i>
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
  })).sort((a, b) => b.Revenus - a.Revenus).slice(0, 8); // Top 8 sites

  return (
    <div className="fluctuation-view-container" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b1220', overflowY: 'auto' }}>
      
      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(11,18,32,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-chart-line" style={{ color: '#3b82f6' }}></i> Fluctuations & Rentabilité
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
            {isCompta ? <span style={{ color: '#22c55e' }}><i className="fas fa-unlock"></i> Accès Comptabilité (Édition activée)</span> : <span style={{ color: '#f59e0b' }}><i className="fas fa-lock"></i> Accès Lecture Seule</span>}
          </div>
        </div>

        {/* Période affichée au centre */}
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', background: 'rgba(255,255,255,0.05)', padding: '6px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="far fa-calendar-alt" style={{ color: '#3b82f6' }}></i> {formatPeriod(period)}
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* TABS ACTUEL/ARCHIVES */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
            {selectedArchive && (
              <button onClick={() => setSelectedArchive(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-arrow-left"></i> Liste
              </button>
            )}
            <button onClick={() => { setViewMode('current'); setPeriod(getActivePeriod(archivesList)); }} className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'current' ? '#3b82f6' : 'transparent', color: viewMode === 'current' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
              Actuel
            </button>
            <button onClick={() => { setViewMode('archives'); setSelectedArchive(null); }} className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'archives' ? '#3b82f6' : 'transparent', color: viewMode === 'archives' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
              <i className="fas fa-archive" style={{ marginRight: '6px' }}></i> Archives
            </button>
          </div>

          {viewMode === 'current' ? (
            <input 
              type="month" 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
            />
          ) : selectedArchive ? (
            <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>Mode Lecture Seule</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', width: '250px' }}>
              <i className="fas fa-search" style={{ color: '#94a3b8', marginRight: '8px' }}></i>
              <input type="text" placeholder="Rechercher une archive..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} />
            </div>
          )}

          <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* TABS (Hidden when in archives list view) */}
      {(viewMode === 'current' || selectedArchive) && (
        <div style={{ padding: '0 30px', marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8', borderBottom: activeTab === 'dashboard' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <i className="fas fa-chart-pie" style={{ marginRight: '8px' }}></i> Tableau de Bord
            </button>
            <button 
              onClick={() => setActiveTab('saisie')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'saisie' ? '#38bdf8' : '#94a3b8', borderBottom: activeTab === 'saisie' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i> Saisie & Paramètres
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 30px' }}>
        {viewMode === 'archives' && !selectedArchive ? (
          <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            {archivesList.filter(arch => {
              const q = searchQuery.toLowerCase();
              return (arch.period && arch.period.toLowerCase().includes(q)) || 
                     (arch.archived_by && arch.archived_by.toLowerCase().includes(q)) ||
                     (arch.archived_at && arch.archived_at.toLowerCase().includes(q));
            }).length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="fas fa-archive" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '16px' }}></i>
                <p>Aucune archive trouvée.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600 }}>Période</th>
                    <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600 }}>Date d'archivage</th>
                    <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600 }}>Archivé par</th>
                    <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: 600 }}>Actions</th>
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
                      <tr key={arch.period} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold' }}>{formatPeriod(arch.period)}</td>
                        <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>{arch.archived_at}</td>
                        <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>{arch.archived_by}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <button onClick={() => { setSelectedArchive(arch.period); setPeriod(arch.period); }} className="btn" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
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
                
                {/* KPI CARDS */}
              {analytics.snapshot_exists ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.15)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(56, 189, 248, 0.3)', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)' }}>
                      <div style={{ color: '#bae6fd', fontSize: '0.95rem', marginBottom: '15px', fontWeight: 600 }}>
                        Chiffre d'Affaire de l'Entreprise
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
                        {formatMoney(analytics.chiffre_affaire)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                        De {formatPeriod(period)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(167, 139, 250, 0.15)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(167, 139, 250, 0.3)', boxShadow: '0 4px 20px rgba(167, 139, 250, 0.1)' }}>
                      <div style={{ color: '#ddd6fe', fontSize: '0.95rem', marginBottom: '15px', fontWeight: 600 }}>
                        Masse Salariale
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Total</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                            {formatMoney(analytics.ms_admin + analytics.ms_agents)}
                          </span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-user-tie"></i> Personnel Administratif <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '4px' }}>({analytics.admin_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                            {formatMoney(analytics.ms_admin)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="fas fa-hard-hat"></i> Agents <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginLeft: '4px' }}>({analytics.agents_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                            {formatMoney(analytics.ms_agents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: (analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents) >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)', borderRadius: '16px', padding: '20px', border: (analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents) >= 0 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)', boxShadow: (analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents) >= 0 ? '0 4px 20px rgba(52, 211, 153, 0.1)' : '0 4px 20px rgba(244, 63, 94, 0.1)' }}>
                      <div style={{ color: (analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents) >= 0 ? '#a7f3d0' : '#fecdd3', fontSize: '0.95rem', marginBottom: '15px', fontWeight: 600 }}>Marge Nette de l'Entreprise</div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
                        {formatMoney(analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                        Chiffre d'Affaires - Masse Salariale Totale
                      </div>
                    </div>
                  </div>
                  
                  {/* ANALYSE PORTEFEUILLE CLIENT */}
                  {analytics.sites_analysis && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(196, 181, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', boxShadow: '0 4px 15px rgba(196,181,253,0.2)' }}>
                          <i className="fas fa-chart-pie" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Analyse du Portefeuille Client</h3>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>
                            {analytics.sites_analysis.prev_period === 'données actuelles'
                              ? 'Comparaison avec le référentiel actuel de Facturation Clients'
                              : `Comparaison avec le mois précédent (${analytics.sites_analysis.prev_period})`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        
                        {/* Résumé des sites */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>Évolution du nombre de sites</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{analytics.sites_analysis.curr_count}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>vs {analytics.sites_analysis.prev_count} le mois dernier</span>
                          </div>
                        </div>

                        {/* Sites Perdus */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fas fa-arrow-down"></i> Sites Perdus ({analytics.sites_analysis.lost_sites.length})
                            </div>
                            <div style={{ color: '#ef4444', fontWeight: 700 }}>-{formatMoney(analytics.sites_analysis.lost_value)}</div>
                          </div>
                          {analytics.sites_analysis.lost_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {analytics.sites_analysis.lost_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                  <span>{s.name}</span>
                                  <span>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun site perdu.</div>
                          )}
                        </div>

                        {/* Sites Gagnés */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fas fa-arrow-up"></i> Nouveaux Sites ({analytics.sites_analysis.gained_sites.length})
                            </div>
                            <div style={{ color: '#22c55e', fontWeight: 700 }}>+{formatMoney(analytics.sites_analysis.gained_value)}</div>
                          </div>
                          {analytics.sites_analysis.gained_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {analytics.sites_analysis.gained_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                  <span>{s.name}</span>
                                  <span>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun nouveau site.</div>
                          )}
                        </div>

                        {/* Congés Payés */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fas fa-umbrella-beach"></i> Congés Payés ({(analytics.sites_analysis.conge_agents || []).length})
                            </div>
                            <div style={{ color: '#f59e0b', fontWeight: 700 }}>{formatMoney(analytics.sites_analysis.conge_value || 0)}</div>
                          </div>
                          {(analytics.sites_analysis.conge_agents || []).length > 0 ? null : (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun congé payé ce mois.</div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                </>
              ) : (
                <div style={{ padding: '30px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <i className="fas fa-exclamation-circle" style={{ fontSize: '2.5rem', color: '#f59e0b' }}></i>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.2rem' }}>Clôture manquante pour ce mois</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
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
                      <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
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
            </motion.div>
          )}

          {activeTab === 'saisie' && (
            <motion.div key="saisie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              {!isCompta && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '15px', color: '#fcd34d', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '1.5rem' }}></i>
                  Mode Lecture Seule. Seul le service COMPTABILITE peut modifier ces paramètres.
                </div>
              )}


              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
                
                {/* VARIABLES MENSUELLES */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-sliders-h"></i> Variables Globales ({period})
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
