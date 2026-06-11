import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  Building2, Save, Trash2, Plus, Loader2, CheckCircle2,
  ChevronDown, ChevronRight, X, Shield, Settings, Briefcase
} from 'lucide-react';

export default function CompanyConfigView({ onClose }) {
  const { user, hasWritePermission } = useAuth();

  // RBAC: Plus robuste, vérifie hasWritePermission, le type d'espace ou le nom du service
  const isCompta = 
    (hasWritePermission && hasWritePermission('company_config')) ||
    user?.workspace_type === 'COMPTABLE' ||
    user?.workspace_preset === 'COMPTABLE' ||
    (user?.service_name && /compta/i.test(user.service_name)) ||
    user?.role === 'admin' || 
    user?.role === 'super_admin';

  const [functions, setFunctions] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState({});
  const [contractsData, setContractsData] = useState([]);
  const [newFuncId, setNewFuncId] = useState('');
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncSalary, setNewFuncSalary] = useState('');
  const [savedFuncs, setSavedFuncs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFunctions, setShowFunctions] = useState(true);
  const [showContracts, setShowContracts] = useState(false);
  const [showPrimes, setShowPrimes] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSitePrime, setNewSitePrime] = useState('');
  const [primesData, setPrimesData] = useState([]);
  const [showSpecialAgents, setShowSpecialAgents] = useState(false);
  const [specialAgents, setSpecialAgents] = useState([]);
  const [newSpecialAgentName, setNewSpecialAgentName] = useState('');
  const [newSpecialAgentFunc, setNewSpecialAgentFunc] = useState('');
  const [newSpecialAgentSalary, setNewSpecialAgentSalary] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [funcsRes, salCfgRes, comptaRes, specialRes] = await Promise.all([
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_salary_config', {}, 'GET'),
        apiCall('get_compta_data', {}, 'GET'),
        apiCall('get_special_agents', {}, 'GET')
      ]);
      if (funcsRes.success) setFunctions(funcsRes.functions || []);
      if (salCfgRes.success) setSalaryConfig(salCfgRes.config || {});
      if (comptaRes.success) {
        const allContracts = comptaRes.contracts || [];
        setContractsData(allContracts);
        setPrimesData(allContracts.filter(c => Number(c.prime_site) > 0));
      }
      if (specialRes && specialRes.success) {
        setSpecialAgents(specialRes.agents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunction = async () => {
    if (!newFuncId.trim() || !newFuncName.trim()) return;
    const newFunc = { id: newFuncId.toUpperCase().trim(), name: newFuncName.trim() };
    const updated = [...functions, newFunc];
    setFunctions(updated);

    const salary = newFuncSalary === '' ? 0 : parseInt(newFuncSalary) || 0;
    const updatedSalaryConfig = { ...salaryConfig, [newFunc.id]: salary };
    setSalaryConfig(updatedSalaryConfig);

    setNewFuncId('');
    setNewFuncName('');
    setNewFuncSalary('');

    try {
      const [res1, res2] = await Promise.all([
        apiCall('save_functions', { functions: updated }),
        apiCall('save_salary_grid', { grid: updatedSalaryConfig })
      ]);
      if (res1.success && res2.success) {
        setSavedFuncs(true);
        setTimeout(() => setSavedFuncs(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFunction = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette fonction ?\n\nATTENTION : Cette action supprimera la fonction de tous les agents actuellement affectés à ce poste dans le planning en cours.")) return;
    const updated = functions.filter(f => f.id !== id);
    setFunctions(updated);
    try {
      await apiCall('save_functions', { functions: updated });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFunctions = async () => {
    try {
      const res = await apiCall('save_functions', { functions });
      if (res.success) {
        setSavedFuncs(true);
        setTimeout(() => setSavedFuncs(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContract = async (site_name, budget, charges, frais, prime, prime_func = '') => {
    if (!isCompta) {
      alert("Erreur de droits: Vous n'êtes pas autorisé à sauvegarder.");
      return;
    }
    try {
      const res = await apiCall('save_site_contracts', { 
        site_name, 
        budget_mensuel: budget, 
        charges_percent: charges, 
        frais_fixes: frais,
        prime_site: prime,
        prime_function: prime_func
      });
      if (res.success) {
        loadData();
      } else {
        alert("Erreur: " + (res.message || 'Erreur inconnue'));
      }
      return res;
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  };

  const handleAddSitePrime = async () => {
    if (!newSiteName.trim()) {
      alert("Le nom du site est vide.");
      return;
    }
    if (!isCompta) {
      return;
    }
    const primeValue = newSitePrime === '' ? 0 : parseInt(newSitePrime) || 0;
    
    if (primeValue <= 0) {
      alert("Veuillez saisir un montant de prime supérieur à 0. Un site spécial doit obligatoirement avoir une prime.");
      return;
    }

    const res = await handleSaveContract(newSiteName.trim(), 0, 0, 0, primeValue);
    if (res && res.success) {
      setNewSiteName('');
      setNewSitePrime('');
    }
  };

  const handleSaveSpecialAgent = async () => {
    if (!newSpecialAgentName.trim()) {
      alert("Le nom de l'agent est requis.");
      return;
    }
    if (!newSpecialAgentFunc) {
      alert("Veuillez sélectionner une fonction.");
      return;
    }
    const salary = parseInt(newSpecialAgentSalary) || 0;
    if (salary <= 0) {
      alert("Veuillez saisir un salaire valide.");
      return;
    }
    try {
      const res = await apiCall('save_special_agent', {
        name: newSpecialAgentName.trim(),
        function: newSpecialAgentFunc,
        salary: salary
      });
      if (res.success) {
        setNewSpecialAgentName('');
        setNewSpecialAgentFunc('');
        setNewSpecialAgentSalary('');
        loadData();
      } else {
        alert("Erreur: " + (res.message || 'Erreur inconnue'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSpecialAgent = async (agent_id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce salaire particulier ? L'agent retrouvera le salaire de base de sa fonction.")) return;
    try {
      const res = await apiCall('remove_special_agent', { agent_id });
      if (res.success) {
        loadData();
      } else {
        alert("Erreur: " + (res.message || 'Erreur inconnue'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Loader2 className="animate-spin" size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem' }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b1220', overflowY: 'auto' }}>

      {/* HEADER */}
      <div style={{
        position: 'sticky', top: 0, background: 'rgba(11,18,32,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={28} style={{ color: '#8b5cf6' }} />
            Configuration de l'Entreprise
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
            {isCompta ? (
              <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> Accès Comptabilité (Édition activée)
              </span>
            ) : (
              <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> Accès Lecture Seule
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '30px 40px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>

        {!isCompta && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px', padding: '15px', color: '#fcd34d', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem'
          }}>
            <Shield size={20} />
            Mode Lecture Seule. Seul le service COMPTABILITÉ et les Administrateurs peuvent modifier ces paramètres.
          </div>
        )}

        {/* ═══════════ POSTES ET FONCTIONS ═══════════ */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
          padding: '24px', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div
            onClick={() => setShowFunctions(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{
              margin: 0, fontSize: '1.15rem', color: '#f8fafc',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Briefcase size={22} style={{ color: '#8b5cf6' }} />
              🏷️ Postes / Fonctions des Agents
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span style={{ fontSize: '0.85rem' }}>{functions.length} poste{functions.length > 1 ? 's' : ''}</span>
              {showFunctions ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>

          {showFunctions && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                Gérez les types de postes disponibles et leur salaire de base par défaut (utilisé dans le module Paie pour le calcul automatique).
              </p>

              {/* Formulaire d'ajout */}
              {isCompta && (
                <div style={{
                  background: 'linear-gradient(180deg, rgba(139,92,246,0.05) 0%, rgba(30,41,59,0.3) 100%)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '20px', padding: '32px', marginBottom: '32px',
                  boxShadow: 'inset 0 2px 15px rgba(139,92,246,0.05), 0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 24px 0', color: '#e0e7ff', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600
                  }}>
                    <div style={{ background: 'rgba(139,92,246,0.2)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <Plus size={20} color="#a855f7" />
                    </div>
                    Ajouter un nouveau poste
                  </h4>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 2.5fr 1.5fr auto', gap: '24px', alignItems: 'flex-end', width: '100%'
                  }}>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
                        Code (ex: CP)
                      </label>
                      <input
                        type="text" placeholder="CP" maxLength={10}
                        value={newFuncId} onChange={(e) => setNewFuncId(e.target.value)}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '14px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(15,23,42,0.6)', color: 'white', outline: 'none',
                          fontSize: '1rem', transition: 'all 0.2s',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
                        Nom complet du poste
                      </label>
                      <input
                        type="text" placeholder="ex: Chef de Poste"
                        value={newFuncName} onChange={(e) => setNewFuncName(e.target.value)}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '14px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(15,23,42,0.6)', color: 'white', outline: 'none',
                          fontSize: '1rem', transition: 'all 0.2s',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
                        Salaire de base (FCFA)
                      </label>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*" placeholder="ex: 85000"
                        value={newFuncSalary} onChange={(e) => setNewFuncSalary(e.target.value.replace(/\D/g, ''))}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '14px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(15,23,42,0.6)', color: 'white', outline: 'none',
                          fontSize: '1rem', transition: 'all 0.2s',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAddFunction}
                      style={{
                        padding: '14px 32px', background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)',
                        color: 'white', border: 'none', borderRadius: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap',
                        height: '52px', boxShadow: '0 4px 15px rgba(139,92,246,0.3)', fontSize: '1.05rem',
                        width: '100%'
                      }}
                    >
                      <Plus size={20} /> Ajouter ce poste
                    </button>
                  </div>
                  <div style={{ 
                    marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px', 
                    background: 'rgba(56,189,248,0.05)', padding: '16px', borderRadius: '12px',
                    border: '1px solid rgba(56,189,248,0.1)'
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>💡</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                      Le <strong>salaire de base</strong> indiqué ici sera utilisé comme valeur par défaut dans le module <strong>Paie</strong> pour le calcul automatique des rémunérations mensuelles.
                    </p>
                  </div>
                </div>
              )}

              {/* Liste des postes existants */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Postes Actuels</h4>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '16px', marginBottom: '28px'
                }}>
                  {functions.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', 
                      background: 'linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.8))',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(139, 92, 246, 0.15)', 
                      borderRadius: '16px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, boxShadow 0.2s'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontWeight: '800', color: '#e2e8f0',
                            fontSize: '0.85rem', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                            padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px'
                          }}>{f.id}</span>
                          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '0.3px' }}>{f.name}</span>
                        </div>
                        {salaryConfig[f.id] ? (
                          <div style={{
                            fontSize: '0.9rem', color: '#10b981',
                            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', width: 'fit-content'
                          }}>
                            💰 {Number(salaryConfig[f.id]).toLocaleString('fr-FR')} FCFA <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8'}}>/ mois</span>
                          </div>
                        ) : (
                          <div style={{
                            fontSize: '0.85rem', color: '#94a3b8',
                            fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            ⚠️ Aucun salaire configuré
                          </div>
                        )}
                      </div>
                      {isCompta && (
                        <button
                          onClick={() => handleDeleteFunction(f.id)}
                          style={{
                            padding: '10px', borderRadius: '12px', cursor: 'pointer',
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Supprimer ce poste"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {functions.length === 0 && (
                    <div style={{
                      gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8',
                      padding: '40px', background: 'rgba(30,41,59,0.3)', borderRadius: '16px',
                      border: '1px dashed rgba(148,163,184,0.2)', fontStyle: 'italic'
                    }}>
                      Aucun poste configuré. Ajoutez votre premier poste ci-dessus.
                    </div>
                  )}
                </div>
              </div>

              {isCompta && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveFunctions}
                    style={{
                      padding: '14px 28px',
                      background: savedFuncs ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      cursor: 'pointer', fontWeight: 600, display: 'flex',
                      alignItems: 'center', gap: '10px', transition: 'all 0.3s',
                      fontSize: '1rem', boxShadow: savedFuncs ? '0 4px 15px rgba(16,185,129,0.3)' : '0 4px 15px rgba(59,130,246,0.3)'
                    }}
                  >
                    {savedFuncs ? <CheckCircle2 size={20} /> : <Save size={20} />}
                    {savedFuncs ? 'Postes sauvegardés avec succès !' : 'Sauvegarder les Postes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- SALAIRES PARTICULIERS (AGENTS) --- */}
        <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: '24px' }}>
          <div 
            onClick={() => setShowSpecialAgents(!showSpecialAgents)}
            style={{ 
              padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              cursor: 'pointer', background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: 'rgba(244,63,94,0.1)', borderRadius: '12px', color: '#f43f5e' }}>
                <Shield size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  Salaires Particuliers (Agents / Superviseurs)
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Gérez les exceptions de salaires pour des agents spécifiques.
                </p>
              </div>
            </div>
            {showSpecialAgents ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
          </div>

          {showSpecialAgents && (
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              
              {isCompta && (
                <div style={{ 
                  display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap',
                  background: 'rgba(15,23,42,0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                      Nom de l'Agent
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: Jean Dupont"
                      value={newSpecialAgentName}
                      onChange={(e) => setNewSpecialAgentName(e.target.value)}
                      style={{ 
                        width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', padding: '12px 16px', borderRadius: '10px', outline: 'none', transition: 'border 0.2s',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                      Fonction
                    </label>
                    <select
                      value={newSpecialAgentFunc}
                      onChange={(e) => setNewSpecialAgentFunc(e.target.value)}
                      style={{
                        width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', padding: '12px 16px', borderRadius: '10px', outline: 'none', fontSize: '0.95rem'
                      }}
                    >
                      <option value="">-- Choisir une fonction --</option>
                      {functions.map(f => (
                        <option key={f.id} value={f.id}>{f.id} - {f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                      Salaire (XOF)
                    </label>
                    <input 
                      type="number"
                      placeholder="Ex: 150000"
                      value={newSpecialAgentSalary}
                      onChange={(e) => setNewSpecialAgentSalary(e.target.value)}
                      style={{ 
                        width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', padding: '12px 16px', borderRadius: '10px', outline: 'none', transition: 'border 0.2s',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                    <button 
                      onClick={handleSaveSpecialAgent}
                      style={{
                        padding: '0 24px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white',
                        border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex',
                        alignItems: 'center', gap: '8px', height: '46px', transition: 'all 0.2s', whiteSpace: 'nowrap'
                      }}
                    >
                      <Plus size={18} /> Ajouter l'agent
                    </button>
                  </div>
                </div>
              )}

              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(15,23,42,0.4)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', textAlign: 'left', fontSize: '0.9rem' }}>
                      <th style={{ padding: '16px' }}>Nom de l'Agent</th>
                      <th style={{ padding: '16px' }}>Fonction Configurée</th>
                      <th style={{ padding: '16px', color: '#f43f5e' }}>Salaire Particulier (XOF)</th>
                      {isCompta && <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {specialAgents.length === 0 ? (
                      <tr>
                        <td colSpan={isCompta ? 4 : 3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          Aucun salaire particulier n'a été défini pour un agent.
                        </td>
                      </tr>
                    ) : (
                      specialAgents.map((agent, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                          <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>{agent.name}</td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{agent.function}</td>
                          <td style={{ padding: '16px', color: '#f43f5e', fontWeight: 600 }}>{Number(agent.salary).toLocaleString('fr-FR')} FCFA</td>
                          {isCompta && (
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleRemoveSpecialAgent(agent.id)}
                                style={{ 
                                  background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', 
                                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                  fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                title="Réinitialiser au salaire normal de sa fonction"
                              >
                                <Trash2 size={16} /> Supprimer
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>


        {/* ═══════════ CONTRATS SITES ═══════════ */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
          padding: '24px', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div
            onClick={() => setShowContracts(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{
              margin: 0, fontSize: '1.15rem', color: '#f8fafc',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Building2 size={22} style={{ color: '#3b82f6' }} />
              🏢 Contrats Clients & Frais par Site
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span style={{ fontSize: '0.85rem' }}>{contractsData.length} site{contractsData.length > 1 ? 's' : ''}</span>
              {showContracts ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>

          {showContracts && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                Gérez les budgets, charges, et frais fixes alloués pour chaque site client.
              </p>

              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(15,23,42,0.4)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', textAlign: 'left', fontSize: '0.9rem' }}>
                      <th style={{ padding: '16px' }}>Site</th>
                      <th style={{ padding: '16px' }}>Budget Client (XOF)</th>
                      <th style={{ padding: '16px' }}>Charges %</th>
                      <th style={{ padding: '16px' }}>Frais Fixes</th>
                      {isCompta && <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {contractsData.map((contract, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                        <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>{contract.site_name}</td>
                        <td style={{ padding: '16px' }}>
                          <input 
                            type="number" 
                            disabled={!isCompta}
                            value={contract.budget_mensuel}
                            onChange={(e) => {
                              const newC = [...contractsData];
                              newC[idx].budget_mensuel = Number(e.target.value);
                              setContractsData(newC);
                            }}
                            style={{ 
                              background: isCompta ? 'rgba(15,23,42,0.8)' : 'transparent', 
                              border: isCompta ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                              color: 'white', padding: '10px 12px', borderRadius: '8px', width: '130px',
                              outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <input 
                            type="number" 
                            step="0.1"
                            disabled={!isCompta}
                            value={contract.charges_percent}
                            onChange={(e) => {
                              const newC = [...contractsData];
                              newC[idx].charges_percent = Number(e.target.value);
                              setContractsData(newC);
                            }}
                            style={{ 
                              background: isCompta ? 'rgba(15,23,42,0.8)' : 'transparent', 
                              border: isCompta ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                              color: 'white', padding: '10px 12px', borderRadius: '8px', width: '90px',
                              outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <input 
                            type="number" 
                            disabled={!isCompta}
                            value={contract.frais_fixes}
                            onChange={(e) => {
                              const newC = [...contractsData];
                              newC[idx].frais_fixes = Number(e.target.value);
                              setContractsData(newC);
                            }}
                            style={{ 
                              background: isCompta ? 'rgba(15,23,42,0.8)' : 'transparent', 
                              border: isCompta ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                              color: 'white', padding: '10px 12px', borderRadius: '8px', width: '130px',
                              outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
                            }}
                          />
                        </td>
                        {isCompta && (
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleSaveContract(contract.site_name, contract.budget_mensuel, contract.charges_percent, contract.frais_fixes, contract.prime_site)}
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2))', 
                                color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', 
                                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.3))'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2))'}
                            >
                              <Save size={16} /> Sauver
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ PRIMES DE SITE ═══════════ */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
          padding: '24px', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div
            onClick={() => setShowPrimes(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', userSelect: 'none'
            }}
          >
            <h3 style={{
              margin: 0, fontSize: '1.15rem', color: '#f8fafc',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎁</span> Primes de Site par Agent
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span style={{ fontSize: '0.85rem' }}>{primesData.length} site{primesData.length > 1 ? 's' : ''} avec prime</span>
              {showPrimes ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>

          {showPrimes && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                Gérez spécifiquement les primes accordées aux agents pour chaque site.
              </p>

              {isCompta && (
                <div style={{
                  display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end',
                  background: 'rgba(56,189,248,0.05)', padding: '20px', borderRadius: '12px',
                  border: '1px dashed rgba(56,189,248,0.3)', width: '100%', flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>Nouveau Site Spécial</label>
                    <input 
                      type="text" placeholder="Nom du site (ex: Base 4)"
                      value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white',
                        outline: 'none', transition: 'all 0.2s'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>Prime (XOF)</label>
                    <input 
                      type="number" placeholder="ex: 20000"
                      value={newSitePrime} onChange={e => setNewSitePrime(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white',
                        outline: 'none', transition: 'all 0.2s'
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleAddSitePrime}
                    style={{
                      padding: '0 24px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white',
                      border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex',
                      alignItems: 'center', gap: '8px', height: '46px', transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                  >
                    <Plus size={18} /> Ajouter ce site
                  </button>
                </div>
              )}

              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(15,23,42,0.4)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', textAlign: 'left', fontSize: '0.9rem' }}>
                      <th style={{ padding: '16px', width: '30%' }}>Site</th>
                      <th style={{ padding: '16px', color: '#38bdf8' }}>Prime de Site / Agent (XOF)</th>
                      <th style={{ padding: '16px', color: '#a78bfa' }}>Fonction Éligible</th>
                      {isCompta && <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {primesData.length === 0 ? (
                      <tr>
                        <td colSpan={isCompta ? 4 : 3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          Aucun site n'a encore de prime attribuée. Utilisez le formulaire ci-dessus pour en ajouter un.
                        </td>
                      </tr>
                    ) : (
                      primesData.map((contract, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                          <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>{contract.site_name}</td>
                          <td style={{ padding: '16px' }}>
                            <input 
                              type="number" 
                              disabled={!isCompta}
                              value={contract.prime_site || 0}
                              onChange={(e) => {
                                const newP = [...primesData];
                                newP[idx].prime_site = Number(e.target.value);
                                setPrimesData(newP);
                              }}
                              style={{ 
                                background: isCompta ? 'rgba(56,189,248,0.1)' : 'transparent', 
                                border: isCompta ? '1px solid rgba(56,189,248,0.3)' : 'none', 
                                color: '#38bdf8', padding: '10px 12px', borderRadius: '8px', width: '200px',
                                outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem', fontWeight: 600
                              }}
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <select
                              disabled={!isCompta}
                              value={contract.prime_function || ''}
                              onChange={(e) => {
                                const newP = [...primesData];
                                newP[idx].prime_function = e.target.value;
                                setPrimesData(newP);
                              }}
                              style={{
                                background: isCompta ? 'rgba(167,139,250,0.1)' : 'transparent',
                                border: isCompta ? '1px solid rgba(167,139,250,0.3)' : 'none',
                                color: '#a78bfa', padding: '10px 12px', borderRadius: '8px', width: '100%',
                                outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem'
                              }}
                            >
                              <option value="" style={{ background: '#1e293b', color: '#f8fafc' }}>Toutes les fonctions (Par défaut)</option>
                              {functions.map(f => (
                                <option key={f.id} value={f.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                                  {f.id} - {f.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          {isCompta && (
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleSaveContract(contract.site_name, contract.budget_mensuel, contract.charges_percent, contract.frais_fixes, contract.prime_site, contract.prime_function)}
                                style={{ 
                                  background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2))', 
                                  color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', 
                                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                  fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.3))'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2))'}
                              >
                                <Save size={16} /> Sauver
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}
