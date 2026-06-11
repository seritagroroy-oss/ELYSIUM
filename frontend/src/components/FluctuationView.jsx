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

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | saisie
  
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

  // Formatting utils
  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  const prevCost = prevAnalytics?.company_metrics?.total_cost || 0;
  const currentCost = analytics.company_metrics?.total_cost || 0;
  const diffCost = currentCost - prevCost;
  const diffPercent = prevCost > 0 ? (diffCost / prevCost) * 100 : 0;

  const chartData = analytics.sites_rentability.map(s => ({
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
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="month" 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
          />
          <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* TABS */}
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

      <div style={{ padding: '20px 30px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>Masse Salariale Totale</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{formatMoney(currentCost)}</div>
                  <div style={{ fontSize: '0.85rem', color: diffCost > 0 ? '#ef4444' : '#22c55e', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className={`fas fa-arrow-${diffCost > 0 ? 'up' : 'down'}`}></i>
                    {Math.abs(diffPercent).toFixed(1)}% ({formatMoney(Math.abs(diffCost))}) vs M-1
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>Revenus Contrats</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{formatMoney(analytics.company_metrics?.total_revenues || 0)}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '5px' }}>Marge Nette Globale</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (analytics.company_metrics?.net_margin || 0) > 0 ? '#22c55e' : '#ef4444' }}>
                    {formatMoney(analytics.company_metrics?.net_margin || 0)}
                  </div>
                </div>
              </div>

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
                        <Bar dataKey="Revenus" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Coûts" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isAlert ? '#ef4444' : '#f59e0b'} />
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
                    analytics.sites_rentability.filter(s => s.is_alert).map((s, i) => (
                      <div key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{s.name}</span>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>{Math.round((s.total_cost / s.contract_revenue) * 100)}%</span>
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


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* GRILLE SALARIALE */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-list"></i> Grille Salariale (Base)
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {gridData.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px' }}>
                        <span style={{ color: '#cbd5e1' }}>{item.poste}</span>
                        <input 
                          type="number" 
                          disabled={!isCompta}
                          value={item.taux_horaire}
                          onChange={(e) => {
                            const newGrid = [...gridData];
                            newGrid[idx].taux_horaire = Number(e.target.value);
                            setGridData(newGrid);
                          }}
                          style={{ background: isCompta ? 'rgba(255,255,255,0.1)' : 'transparent', border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', width: '120px', textAlign: 'right' }}
                        />
                      </div>
                    ))}
                  </div>
                  {isCompta && (
                    <button onClick={handleSaveGrid} style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      Enregistrer la Grille
                    </button>
                  )}
                </div>

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
      </div>

    </div>
  );
}
