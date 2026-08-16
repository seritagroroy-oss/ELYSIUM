import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { apiCall } from '../api';
import { 
  Table, ChevronLeft, ChevronRight, Save, TrendingUp, AlertCircle, Search, 
  ShieldAlert, Building, Briefcase, UserCheck, Calculator, Download
} from 'lucide-react';
import ContratsClientsView from './ContratsClientsView';

export default function GrilleSalarialeView({ onClose }) {
  const { user, hasWritePermission } = useAuth();
  
  // Permissions
  const isCompta = 
    (hasWritePermission && hasWritePermission('salaries')) ||
    user?.workspace_type === 'COMPTABLE' ||
    user?.role === 'admin' || 
    user?.role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState([]);
  const [siteContracts, setSiteContracts] = useState([]);
  const [subsiteContracts, setSubsiteContracts] = useState({}); // { subsite_id: [rows] }
  const [sites, setSites] = useState([]);
  const [agents, setAgents] = useState([]);
  const [configFunctions, setConfigFunctions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'success', 'error'
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        const [cData, fData, pubRes, sData] = await Promise.all([
          apiCall('get_compta_data', { period: currentPeriod }, 'GET'),
          apiCall('get_functions', { scope: 'company' }, 'GET'),
          apiCall('get_published_periods', { scope: 'company' }, 'GET'),
          apiCall('get_sites', { scope: 'company' }, 'GET')
        ]);
        
        if (cData.success) {
          setGridData(cData.grid || []);
          setSiteContracts(cData.contracts || []);
          setSubsiteContracts(cData.subsite_contracts || {});
        }
        if (fData.success && fData.functions) {
          setConfigFunctions(fData.functions);
        }
        if (Array.isArray(sData)) {
          setSites(sData);
        } else if (sData && sData.sites) {
          setSites(sData.sites);
        }

        // Identifier la dernière période publiée par le PC (Poste de Contrôle)
        let targetPeriod = currentPeriod;
        if (pubRes?.success && pubRes.published_periods?.length > 0) {
          const pubs = pubRes.published_periods;
          const exactLatest = pubRes.latest_publication?.period;
          targetPeriod = exactLatest && pubs.includes(exactLatest) ? exactLatest : [...pubs].sort().reverse()[0];
        }

        // Récupérer l'état de paie de cette période pour obtenir le vrai nombre d'agents actifs
        const salRes = await apiCall('get_salaries', { period: targetPeriod, scope: 'company' }, 'GET');
        if (Array.isArray(salRes)) {
           const activeAgentsList = salRes.map(s => ({ 
             function: s.function || 'AS',
             name: s.name,
             site: s.site,
             subsite: s.subsite
           }));
           setAgents(activeAgentsList);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!isCompta) return;
    setSaveStatus('saving');
    try {
      const payload = Object.fromEntries(gridData.map(g => [g.poste, g.taux_horaire]));
      const res = await apiCall('save_salary_grid', { grid: payload });
      if (res.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateGridValue = (poste, newValue) => {
    setGridData(prev => prev.map(item => 
      item.poste === poste ? { ...item, taux_horaire: Number(newValue) } : item
    ));
  };

  // Helper for formatting
  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  const getFullPosteName = (poste) => {
    // Lookup dynamically in the configured functions from CompanyConfig
    const configFunc = configFunctions.find(f => f.id === poste);
    if (configFunc) return configFunc.name;
    
    // Fallback if not found in configuration
    return poste;
  };

  // Group roles by categories
  const getCategory = (poste) => {
    // Lookup dynamically in the configured functions from CompanyConfig
    const configFunc = configFunctions.find(f => f.id === poste);
    
    // Si un type précis a été sauvegardé, on l'utilise
    if (configFunc && configFunc.type === 'admin') {
      return "Membres de l'administration";
    }
    if (configFunc && configFunc.type === 'agent') {
      return 'Tous les agents';
    }

    // Fallback pour les anciens postes sans type
    const p = getFullPosteName(poste).toLowerCase();
    
    if (
      p.includes('directeur') || 
      p.includes('dg') || 
      p.includes('pdg') ||
      p.includes('rh') ||
      p.includes('comptable') ||
      p.includes('secrétaire') ||
      p.includes('assistant') ||
      p.includes('manager')
    ) {
      return "Membres de l'administration";
    }
    
    return 'Tous les agents';
  };

  const categoryIcons = {
    "Membres de l'administration": <Building size={18} />,
    'Tous les agents': <ShieldAlert size={18} />
  };

  const categoryColors = {
    "Membres de l'administration": '#f59e0b', // Amber/Gold
    'Tous les agents': '#38bdf8' // Bright Blue
  };

  // Process data for display
  const processedData = useMemo(() => {
    const categories = {
      "Tous les agents": [],
      "Membres de l'administration": []
    };
    
    // Create a map of grid data by poste for quick lookup
    const gridMap = {};
    gridData.forEach(g => gridMap[g.poste] = g.taux_horaire);

    // Combine configured functions and grid data to ensure no function is left behind
    const allRolesSet = new Set([...configFunctions.map(f => f.id), ...gridData.map(g => g.poste)]);
    
    Array.from(allRolesSet).forEach(poste => {
      const fullName = getFullPosteName(poste);
      if (searchTerm && !fullName.toLowerCase().includes(searchTerm.toLowerCase()) && !poste.toLowerCase().includes(searchTerm.toLowerCase())) return;
      
      const cat = getCategory(poste);
      if (!categories[cat]) categories[cat] = [];
      
      // Calculate how many active agents have this role
      const activeAgents = agents.filter(a => (a.function || 'AS') === poste).length;
      const taux_horaire = Number(gridMap[poste] || 0);
      
      // Demande utilisateur: L'impact mensuel est la somme des salaires de base (indépendamment des effectifs)
      const totalCost = taux_horaire;
      
      categories[cat].push({
        poste: poste,
        taux_horaire: taux_horaire,
        activeAgents,
        totalCost
      });
    });

    return categories;
  }, [gridData, agents, configFunctions, searchTerm]);

  const globalTotalCost = useMemo(() => {
    let total = 0;
    Object.values(processedData).forEach(cat => {
      cat.forEach(item => { total += item.totalCost; });
    });
    return total;
  }, [processedData]);

  const globalTotalRevenue = useMemo(() => {
    let total = 0;
    // Sum from subsite contracts (contractual amounts defined by accountant)
    Object.values(subsiteContracts).forEach(rows => {
      rows.forEach(row => { total += (Number(row.quantite || 0) * Number(row.montant_unitaire || 0)); });
    });
    return total;
  }, [subsiteContracts]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#38bdf8', marginBottom: '1.5rem' }}></i>
          <p>Initialisation de la grille salariale...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, padding: '0', background: '#0b1220', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .white-placeholder::placeholder { color: white !important; opacity: 1; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          50% { opacity: 0.6; transform: scale(1.3); box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        .status-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
      `}</style>
      {/* Top Bar */}
      {!selectedCategory && (
        <div className="top-bar glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {onClose && (
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(244, 114, 182, 0.1)', padding: '8px', borderRadius: '8px', color: '#f472b6' }}>
                <Table size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#f8fafc' }}>Tableau de Bord Financier</h2>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span>Masse Salariale : <strong style={{ color: '#f8fafc' }}>{formatMoney(globalTotalCost)}</strong></span>


                  {isCompta ? <><div className="status-dot" style={{width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block'}}></div> Édition autorisée</> : <><div style={{width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block'}}></div> Lecture seule</>}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                className="white-placeholder"
                placeholder="Rechercher un poste..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px 8px 36px', borderRadius: '8px', color: 'white', width: '250px' }}
              />
            </div>
            
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Exporter
            </button>
            
            {isCompta && (
              <button 
                onClick={handleSave} 
                disabled={saveStatus === 'saving'}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  background: saveStatus === 'success' ? '#22c55e' : (saveStatus === 'error' ? '#ef4444' : 'var(--primary)'), 
                  color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin"></i> : <Save size={16} />}
                {saveStatus === 'success' ? 'Enregistré' : (saveStatus === 'error' ? 'Erreur' : 'Enregistrer')}
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: selectedCategory ? '0' : '24px 30px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {!selectedCategory ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {Object.entries(processedData).map(([category, items], idx) => {
              const catColor = categoryColors[category] || '#94a3b8';
              const catIcon = categoryIcons[category];
              const catTotal = items.reduce((sum, it) => sum + it.totalCost, 0);

              return (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedCategory(category)}
                  className="glass-panel hover-scale" 
                  style={{ 
                    padding: '24px', cursor: 'pointer', border: `1px solid ${catColor}40`,
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    background: `linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.95))`
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = `0 8px 30px ${catColor}20`}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: catColor, background: `${catColor}15`, padding: '12px', borderRadius: '12px' }}>
                      {React.cloneElement(catIcon, { size: 28 })}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>{category}</h3>
                      <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{items.length} poste(s) configuré(s)</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Impact Mensuel Estimé</div>
                      <div style={{ fontWeight: 800, color: catColor, fontSize: '1.3rem' }}>{formatMoney(catTotal)}</div>
                    </div>
                    <div style={{ color: catColor, opacity: 0.7 }}>
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </motion.div>
              );
            })}


          </div>
        ) : (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
            background: '#0b1220',
            display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '20px 30px 0 30px' }}>
              <button 
                onClick={() => setSelectedCategory(null)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content',
                  background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <ChevronLeft size={18} /> Retour aux catégories
              </button>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text" 
                    className="white-placeholder"
                    placeholder="Rechercher un poste..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px 8px 36px', borderRadius: '8px', color: 'white', width: '250px' }}
                  />
                </div>
                
                {isCompta && (
                  <button 
                    onClick={handleSave} 
                    disabled={saveStatus === 'saving'}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', 
                      background: saveStatus === 'success' ? '#22c55e' : (saveStatus === 'error' ? '#ef4444' : 'var(--primary)'), 
                      color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin"></i> : <Save size={16} />}
                    {saveStatus === 'success' ? 'Enregistré' : (saveStatus === 'error' ? 'Erreur' : 'Enregistrer')}
                  </button>
                )}
              </div>
            </div>

            {(() => {


              const category = selectedCategory;
              const items = processedData[category] || [];
              const catColor = categoryColors[category] || '#94a3b8';
              const catIcon = categoryIcons[category];
              const catTotal = items.reduce((sum, it) => sum + it.totalCost, 0);

              return (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ padding: '0', overflow: 'hidden', borderTop: `1px solid ${catColor}30`, flex: 1, display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.9) 100%)` }}
                >
                  <div style={{ background: `linear-gradient(90deg, ${catColor}20, transparent)`, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: catColor, background: `${catColor}15`, padding: '8px', borderRadius: '8px' }}>
                        {catIcon}
                      </div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{category}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Impact Estimé</div>
                      <div style={{ fontWeight: 700, color: catColor }}>{formatMoney(catTotal)}</div>
                    </div>
                  </div>
                  
                  <div className="table-container" style={{ margin: 0, flex: 1, overflowY: 'auto', maxHeight: 'none', paddingBottom: 0 }}>
                    <table className="custom-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                        <tr style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                          <th style={{ width: '35%', padding: '16px 20px', borderRadius: '8px 0 0 8px', background: 'rgba(20, 30, 50, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Fonction / Poste</th>
                          <th style={{ textAlign: 'center', width: '15%', padding: '16px 20px', background: 'rgba(20, 30, 50, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Effectif Actif</th>
                          <th style={{ textAlign: 'right', width: '25%', padding: '16px 20px', background: 'rgba(20, 30, 50, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Salaire de Base (XOF)</th>
                          <th style={{ textAlign: 'right', width: '25%', padding: '16px 20px', borderRadius: '0 8px 8px 0', background: 'rgba(20, 30, 50, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Impact Mensuel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Aucun poste configuré pour cette catégorie. Vous pouvez ajouter des rôles administratifs (ex: RH, Comptable, Directeur) depuis la Configuration Entreprise.
                            </td>
                          </tr>
                        ) : (
                          items.map((item) => (
                            <tr key={item.poste}>
                              <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '1.05rem' }}>{getFullPosteName(item.poste)}</span>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>{item.poste}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', color: item.activeAgents > 0 ? '#38bdf8' : '#64748b' }}>
                                  {item.activeAgents} agent(s)
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <input 
                                    type="number" 
                                    disabled={!isCompta}
                                    value={item.taux_horaire}
                                    onChange={(e) => updateGridValue(item.poste, e.target.value)}
                                    style={{ 
                                      background: isCompta ? 'rgba(0,0,0,0.3)' : 'transparent', 
                                      border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', 
                                      color: 'white', padding: '8px 12px', borderRadius: '8px', width: '140px', textAlign: 'right',
                                      fontSize: '1rem', fontWeight: 600,
                                      transition: 'all 0.2s',
                                      outline: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = catColor}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                                  />
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#cbd5e1' }}>
                                {formatMoney(item.totalCost)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
