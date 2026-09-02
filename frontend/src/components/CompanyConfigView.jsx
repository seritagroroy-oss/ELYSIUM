import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  Building2, Save, Trash2, Plus, Loader2, CheckCircle2,
  ChevronDown, ChevronRight, X, Shield, Settings, Briefcase, BookOpen, Pencil, AlertTriangle, Info
} from 'lucide-react';
import ConfigurationManualModal from './modals/ConfigurationManualModal';
import ConfirmDeleteSpecialAgentModal from './modals/ConfirmDeleteSpecialAgentModal';
import ConfirmDeleteSitePrimeModal from './modals/ConfirmDeleteSitePrimeModal';
import ConfirmDeleteFunctionModal from './modals/ConfirmDeleteFunctionModal';

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
  const [showManual, setShowManual] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState({});
  const [contractsData, setContractsData] = useState([]);
  const [newFuncId, setNewFuncId] = useState('');
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncSalary, setNewFuncSalary] = useState('');
  const [newFuncType, setNewFuncType] = useState('agent');
  const [savedFuncs, setSavedFuncs] = useState(false);
  const [savingFunc, setSavingFunc] = useState(false);
  const [funcToDelete, setFuncToDelete] = useState(null);
  const [isDeletingFunc, setIsDeletingFunc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const [showFunctions, setShowFunctions] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [showPrimes, setShowPrimes] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSitePrime, setNewSitePrime] = useState('');
  const [newSiteFunc, setNewSiteFunc] = useState('');
  const [primesData, setPrimesData] = useState([]);
  const [allSiteNames, setAllSiteNames] = useState([]);
  const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);
  const [showSpecialAgents, setShowSpecialAgents] = useState(false);
  const [specialAgents, setSpecialAgents] = useState([]);
  const [allAgentNames, setAllAgentNames] = useState([]);
  const [newSpecialAgentName, setNewSpecialAgentName] = useState('');
  const [newSpecialAgentFunc, setNewSpecialAgentFunc] = useState('');
  const [newSpecialAgentSalary, setNewSpecialAgentSalary] = useState('');
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [editingSpecialAgentName, setEditingSpecialAgentName] = useState(null);
  const [specialAgentToDelete, setSpecialAgentToDelete] = useState(null);
  const [savingSpecialAgent, setSavingSpecialAgent] = useState(false);
  const [isDeletingSpecialAgent, setIsDeletingSpecialAgent] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [sitePrimeToDelete, setSitePrimeToDelete] = useState(null);
  const [isDeletingSitePrime, setIsDeletingSitePrime] = useState(false);
  const [searchSpecialAgentText, setSearchSpecialAgentText] = useState('');
  const [showPayrollConfig, setShowPayrollConfig] = useState(false);
  const [payrollSettings, setPayrollSettings] = useState({
    cnps_salarial: 0, cnps_patronal: 0, its: 0, fdfp: 0,
    enable_seniority: false, tax_mode: 'simplifie',
    enable_sursalaire: true, enable_cnps_salarial: true, enable_its: true, 
    enable_cnps_patronal: true, enable_fdfp: true, enable_avances: true
  });
  const [payrollSaved, setPayrollSaved] = useState(false);
  const [payrollSaving, setPayrollSaving] = useState(false);
  
  const [editSalaryId, setEditSalaryId] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');
  const [selectedFuncDetails, setSelectedFuncDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const [funcsRes, salCfgRes, comptaRes, specialRes, payrollRes] = await Promise.all([
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_salary_config', {}, 'GET'),
        apiCall('get_compta_data', {}, 'GET'),
        apiCall('get_special_agents', {}, 'GET'),
        apiCall('get_payroll_settings', {}, 'GET')
      ]);
      if (funcsRes.success) setFunctions(funcsRes.functions || []);
      if (salCfgRes.success) setSalaryConfig(salCfgRes.config || {});
      if (comptaRes.success) {
        const allContracts = comptaRes.contracts || [];
        setContractsData(allContracts);
        setPrimesData(allContracts.filter(c => Number(c.prime_site) > 0));
        setAllSiteNames(comptaRes.site_names || []);
      }
      if (specialRes && specialRes.success) {
        setSpecialAgents(specialRes.agents || []);
        setAllAgentNames(specialRes.all_names || []);
      }
      if (payrollRes?.success && payrollRes.settings) {
        setPayrollSettings(prev => ({ ...prev, ...payrollRes.settings }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunction = async () => {
    if (!newFuncId.trim() || !newFuncName.trim()) return;
    const newFunc = { id: newFuncId.toUpperCase().trim(), name: newFuncName.trim(), type: newFuncType };
    const updated = [...functions.filter(f => f.id !== newFunc.id), newFunc];
    setFunctions(updated);

    const salary = newFuncSalary === '' ? 0 : parseInt(newFuncSalary) || 0;
    const updatedSalaryConfig = { ...salaryConfig, [newFunc.id]: salary };
    setSalaryConfig(updatedSalaryConfig);

    setNewFuncId('');
    setNewFuncName('');
    setNewFuncSalary('');
    setNewFuncType('agent');

    setSavingFunc(true);
    try {
      const [res1, res2] = await Promise.all([
        apiCall('save_functions', { functions: updated }),
        apiCall('save_salary_grid', { grid: updatedSalaryConfig })
      ]);
      if (res1.success && res2.success) {
        showToast('Fonction/Poste ajouté avec succès !', 'success');
        setSavedFuncs(true);
        setTimeout(() => setSavedFuncs(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingFunc(false);
    }
  };

  const handleDeleteFunction = async () => {
    if (!funcToDelete) return;
    setIsDeletingFunc(true);
    const updated = functions.filter(f => f.id !== funcToDelete.id);
    setFunctions(updated);
    try {
      const res = await apiCall('save_functions', { functions: updated });
      if (res.success) {
        showToast('Fonction/Poste supprimé avec succès !', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingFunc(false);
      setFuncToDelete(null);
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

  const handleSaveSalaryEdit = async (id) => {
    const salary = editSalaryValue === '' ? 0 : parseInt(editSalaryValue) || 0;
    const updatedSalaryConfig = { ...salaryConfig, [id]: salary };
    setSalaryConfig(updatedSalaryConfig);
    setEditSalaryId(null);
    try {
      await apiCall('save_salary_grid', { grid: updatedSalaryConfig });
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
        loadData(false);
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

    setSavingSite(true);
    try {
      const res = await handleSaveContract(newSiteName.trim(), 0, 0, 0, primeValue, newSiteFunc);
      if (res && res.success) {
        setNewSiteName('');
        setNewSitePrime('');
        setNewSiteFunc('');
        showToast('Prime de site ajoutée avec succès !', 'success');
      }
    } finally {
      setSavingSite(false);
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
    setSavingSpecialAgent(true);
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
        setEditingSpecialAgentName(null);
        showToast(editingSpecialAgentName ? 'Agent particulier modifié avec succès !' : 'Agent particulier ajouté avec succès !', 'success');
        loadData(false);
      } else {
        alert("Erreur: " + (res.message || 'Erreur inconnue'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSpecialAgent(false);
    }
  };

  const handleRemoveSpecialAgent = async (agent_id) => {
    if (!agent_id) return;
    setIsDeletingSpecialAgent(true);
    try {
      const res = await apiCall('remove_special_agent', { agent_id });
      if (res.success) {
        setSpecialAgentToDelete(null);
        showToast('Agent particulier supprimé avec succès !', 'error');
        loadData(false);
      } else {
        alert("Erreur: " + (res.message || 'Erreur inconnue'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingSpecialAgent(false);
    }
  };

  const handleDeleteSitePrime = async () => {
    if (!sitePrimeToDelete) return;
    setIsDeletingSitePrime(true);
    try {
      // Optimistic UI update
      setPrimesData(prev => prev.filter(p => p.site_name !== sitePrimeToDelete.site_name || p.prime_function !== sitePrimeToDelete.prime_function));
      
      const res = await handleSaveContract(
        sitePrimeToDelete.site_name, 
        sitePrimeToDelete.budget_mensuel, 
        sitePrimeToDelete.charges_percent, 
        sitePrimeToDelete.frais_fixes, 
        0, 
        sitePrimeToDelete.prime_function || ''
      );
      
      if (res && res.success) {
        console.log("Prime supprimée avec succès.");
        showToast('Prime de site supprimée avec succès !', 'error');
      } else {
        // Revert on failure by reloading data
        loadData(false);
      }
    } finally {
      setIsDeletingSitePrime(false);
      setSitePrimeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#38bdf8', marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', margin: 0 }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b1220', overflowY: 'auto' }}>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '40px', right: '40px', zIndex: 99999,
          background: toastMessage.type === 'success' ? '#10b981' : (toastMessage.type === 'info' ? '#3b82f6' : '#ef4444'),
          color: 'white', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '14px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={26} /> : (toastMessage.type === 'info' ? <Info size={26} /> : <AlertTriangle size={26} />)}
          <span style={{ fontWeight: '600', fontSize: '1.05rem', letterSpacing: '0.3px' }}>{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: '8px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}><X size={20}/></button>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        position: 'sticky', top: 0, background: 'rgba(11,18,32,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={28} style={{ color: '#8b5cf6' }} />
            Configuration Entreprise
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
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setShowManual(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 16px',
              borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
          >
            <BookOpen size={18} />
            Manuel du module
          </button>
          <button
            onClick={onClose}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 0 rgba(239,68,68,0)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(239,68,68,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.boxShadow = '0 0 0 rgba(239,68,68,0)';
            }}
            title="Fermer"
          >
            <X size={20} />
          </button>
      </div>
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
              cursor: 'pointer', userSelect: 'none', padding: '12px 16px', margin: '-12px -16px', borderRadius: '12px', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
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
                    display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1.5fr auto', gap: '24px', alignItems: 'flex-end', width: '100%'
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
                        Catégorie
                      </label>
                      <select
                        value={newFuncType} onChange={(e) => setNewFuncType(e.target.value)}
                        style={{
                          width: '100%', padding: '14px 16px', borderRadius: '14px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(15,23,42,0.6)', color: 'white', outline: 'none',
                          fontSize: '1rem', transition: 'all 0.2s',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        <option value="agent" style={{ background: '#0f172a', color: 'white' }}>Agents</option>
                        <option value="admin" style={{ background: '#0f172a', color: 'white' }}>Administration</option>
                      </select>
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
                      disabled={savingFunc}
                      style={{
                        padding: '14px 32px', 
                        background: savingFunc ? 'linear-gradient(135deg, #64748b, #475569)' : (functions.some(f => f.id === newFuncId.toUpperCase().trim()) ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #8b5cf6, #4f46e5)'),
                        color: 'white', border: 'none', borderRadius: '14px',
                        cursor: savingFunc ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap',
                        height: '52px', 
                        boxShadow: savingFunc ? 'none' : (functions.some(f => f.id === newFuncId.toUpperCase().trim()) ? '0 4px 15px rgba(59,130,246,0.3)' : '0 4px 15px rgba(139,92,246,0.3)'), 
                        fontSize: '1.05rem',
                        width: '100%'
                      }}
                    >
                      {savingFunc ? <Loader2 size={20} className="animate-spin" /> : (functions.some(f => f.id === newFuncId.toUpperCase().trim()) ? <Pencil size={20} /> : <Plus size={20} />)}
                      {savingFunc ? 'Enregistrement...' : (functions.some(f => f.id === newFuncId.toUpperCase().trim()) ? 'Modifier ce poste' : 'Ajouter ce poste')}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: '800', color: '#e2e8f0',
                            fontSize: '0.85rem', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                            padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px',
                            cursor: 'help'
                          }} title={f.name}>{f.id}</span>
                          <span style={{ 
                            color: '#f8fafc', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '0.3px',
                            maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }} title={f.name}>{f.name}</span>
                          <button
                            onClick={() => setSelectedFuncDetails(f)}
                            style={{ 
                              background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', 
                              borderRadius: '50%', width: '24px', height: '24px', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.2)'; e.currentTarget.style.color = '#38bdf8'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
                            title="Afficher le nom complet"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          </button>
                          <span style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px',
                            background: f.type === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(56,189,248,0.2)',
                            color: f.type === 'admin' ? '#d8b4fe' : '#bae6fd',
                            border: `1px solid ${f.type === 'admin' ? 'rgba(168,85,247,0.3)' : 'rgba(56,189,248,0.3)'}`
                          }}>
                            {f.type === 'admin' ? 'Administration' : 'Agents'}
                          </span>
                        </div>
                        {editSalaryId === f.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text" inputMode="numeric" pattern="[0-9]*"
                              value={editSalaryValue}
                              onChange={(e) => setEditSalaryValue(e.target.value.replace(/\\D/g, ''))}
                              style={{
                                width: '100px', padding: '4px 8px', borderRadius: '6px',
                                border: '1px solid #3b82f6', background: 'rgba(15,23,42,0.6)',
                                color: 'white', outline: 'none', fontSize: '0.9rem'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSalaryEdit(f.id);
                                if (e.key === 'Escape') setEditSalaryId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveSalaryEdit(f.id)}
                              style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => setEditSalaryId(null)}
                              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                            {isCompta && (
                              <button
                                onClick={() => {
                                  setEditSalaryId(f.id);
                                  setEditSalaryValue(salaryConfig[f.id] ? String(salaryConfig[f.id]) : '');
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', 
                                  borderRadius: '6px', padding: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                title="Modifier le salaire de base"
                                onMouseOver={e => e.currentTarget.style.color = '#38bdf8'}
                                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isCompta && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setNewFuncId(f.id);
                              setNewFuncName(f.name);
                              setNewFuncType(f.type || 'agent');
                              setNewFuncSalary(salaryConfig[f.id] || '');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              padding: '10px', borderRadius: '12px', cursor: 'pointer',
                              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                              color: '#38bdf8', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Modifier ce poste (Remonte au formulaire d'ajout)"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setFuncToDelete(f)}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Supprimer la fonction"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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
              cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <span style={{ fontSize: '0.85rem' }}>
                {specialAgents.length} agent{specialAgents.length > 1 ? 's' : ''} avec salaire particulier
              </span>
              {showSpecialAgents ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
            </div>
          </div>

          {showSpecialAgents && (
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              
              {isCompta && (
                <div style={{ 
                  display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap',
                  background: 'rgba(15,23,42,0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                      Nom de l'Agent
                    </label>
                    <input 
                      type="text"
                      placeholder="Tapez pour rechercher un agent..."
                      autoComplete="off"
                      value={newSpecialAgentName}
                      onChange={(e) => setNewSpecialAgentName(e.target.value)}
                      onFocus={() => setShowAgentSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowAgentSuggestions(false), 200)}
                      style={{ 
                        width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', padding: '12px 16px', borderRadius: '10px', outline: 'none', transition: 'border 0.2s',
                        fontSize: '0.95rem'
                      }}
                    />
                    {showAgentSuggestions && newSpecialAgentName.length >= 1 && (() => {
                      const filtered = allAgentNames.filter(n => n.toLowerCase().includes(newSpecialAgentName.toLowerCase()));
                      if (filtered.length === 0) return null;
                      return (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: '#1e293b', border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: '10px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                          {filtered.map((name, idx) => (
                            <div
                              key={idx}
                              onMouseDown={() => { setNewSpecialAgentName(name); setShowAgentSuggestions(false); }}
                              style={{
                                padding: '10px 16px', color: '#e2e8f0', cursor: 'pointer',
                                fontSize: '0.9rem', transition: 'background 0.15s',
                                borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', gap: '8px' }}>
                    <button 
                      onClick={handleSaveSpecialAgent}
                      disabled={savingSpecialAgent}
                      style={{
                        padding: '0 24px', 
                        background: savingSpecialAgent ? 'linear-gradient(135deg, #64748b, #475569)' : (editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f43f5e, #e11d48)'), 
                        color: 'white',
                        border: 'none', borderRadius: '10px', cursor: savingSpecialAgent ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex',
                        alignItems: 'center', gap: '8px', height: '46px', transition: 'all 0.3s ease', whiteSpace: 'nowrap',
                        boxShadow: savingSpecialAgent ? 'none' : (editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(244, 63, 94, 0.3)')
                      }}
                      onMouseOver={(e) => {
                        if (savingSpecialAgent) return;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? '0 8px 25px rgba(16, 185, 129, 0.5)' : '0 8px 25px rgba(244, 63, 94, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        if (savingSpecialAgent) return;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(244, 63, 94, 0.3)';
                      }}
                    >
                      {savingSpecialAgent ? <Loader2 size={18} className="animate-spin" /> : (editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? <CheckCircle2 size={18} /> : <Plus size={18} />)} 
                      {savingSpecialAgent ? 'Enregistrement...' : (editingSpecialAgentName === newSpecialAgentName && newSpecialAgentName !== '' ? 'Mettre à jour' : 'Ajouter')}
                    </button>
                    {editingSpecialAgentName && (
                      <button 
                        onClick={() => {
                          setNewSpecialAgentName('');
                          setNewSpecialAgentFunc('');
                          setNewSpecialAgentSalary('');
                          setEditingSpecialAgentName(null);
                        }}
                        style={{
                          padding: '0 16px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, display: 'flex',
                          alignItems: 'center', gap: '6px', height: '46px', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Rechercher un agent dans cette liste..." 
                  value={searchSpecialAgentText}
                  onChange={(e) => setSearchSpecialAgentText(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.4)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', 
                    color: '#f8fafc', outline: 'none' 
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(56,189,248,0.5)'}
                  onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
              </div>

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
                    {(() => {
                      const filtered = specialAgents.filter(a => 
                        (a.name || '').toLowerCase().includes(searchSpecialAgentText.toLowerCase()) || 
                        (a.function || '').toLowerCase().includes(searchSpecialAgentText.toLowerCase())
                      );
                      return filtered.length === 0 ? (
                        <tr>
                          <td colSpan={isCompta ? 4 : 3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                            Aucun salaire particulier ne correspond à cette recherche.
                          </td>
                        </tr>
                      ) : (
                        [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })).map((agent, idx) => (
                          <tr key={agent.id || agent.name || `agent-${idx}`} style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', 
                          transition: 'all 0.2s',
                          background: editingSpecialAgentName === agent.name ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          borderLeft: editingSpecialAgentName === agent.name ? '3px solid #10b981' : '3px solid transparent'
                        }}>
                          <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>{agent.name}</td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{agent.function}</td>
                          <td style={{ padding: '16px', color: '#f43f5e', fontWeight: 600 }}>{Number(agent.salary).toLocaleString('fr-FR')} FCFA</td>
                          {isCompta && (
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => {
                                    setNewSpecialAgentName(agent.name);
                                    setNewSpecialAgentFunc(agent.function);
                                    setNewSpecialAgentSalary(agent.salary);
                                    setEditingSpecialAgentName(agent.name);
                                  }}
                                  style={{ 
                                    background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'none', 
                                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.25)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                                  title="Modifier ce salaire"
                                >
                                  <Pencil size={16} /> Modifier
                                </button>
                                <button 
                                  onClick={() => setSpecialAgentToDelete(agent)}
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
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    );
                    })()}
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
              cursor: 'pointer', userSelect: 'none', padding: '12px 16px', margin: '-12px -16px', borderRadius: '12px', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
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
                  <div style={{ flex: '1 1 300px', position: 'relative' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>Nouveau Site Spécial</label>
                    <input 
                      type="text" placeholder="Tapez pour rechercher un site..."
                      autoComplete="off"
                      value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
                      onFocus={() => setShowSiteSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSiteSuggestions(false), 200)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white',
                        outline: 'none', transition: 'all 0.2s'
                      }}
                    />
                    {showSiteSuggestions && newSiteName.length >= 1 && (() => {
                      const filtered = allSiteNames.filter(n => n.toLowerCase().includes(newSiteName.toLowerCase()));
                      if (filtered.length === 0) return null;
                      return (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: '#1e293b', border: '1px solid rgba(56,189,248,0.3)',
                          borderRadius: '10px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                          {filtered.map((name, idx) => (
                            <div
                              key={idx}
                              onMouseDown={() => { setNewSiteName(name); setShowSiteSuggestions(false); }}
                              style={{
                                padding: '10px 16px', color: '#e2e8f0', cursor: 'pointer',
                                fontSize: '0.9rem', transition: 'background 0.15s',
                                borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(56,189,248,0.15)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
                      Fonction Éligible
                    </label>
                    <select
                      value={newSiteFunc}
                      onChange={(e) => setNewSiteFunc(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.6)', color: 'white',
                        outline: 'none', fontSize: '0.95rem', appearance: 'auto'
                      }}
                    >
                      <option value="">Toutes les fonctions (Par défaut)</option>
                      {functions.map(f => (
                        <option key={f.id} value={f.id}>{f.id} - {f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
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
                    disabled={savingSite}
                    style={{
                      padding: '0 24px', 
                      background: savingSite ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                      color: 'white',
                      border: 'none', borderRadius: '10px', 
                      cursor: savingSite ? 'not-allowed' : 'pointer', 
                      fontWeight: 600, display: 'flex',
                      alignItems: 'center', gap: '8px', height: '46px', transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                  >
                    {savingSite ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                    {savingSite ? 'Enregistrement...' : 'Ajouter ce site'}
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
                        <tr key={contract.site_name || `prime-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                          <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>{contract.site_name}</td>
                          <td style={{ padding: '16px', color: '#38bdf8', fontWeight: 600 }}>
                            {Number(contract.prime_site || 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td style={{ padding: '16px', color: '#a78bfa' }}>
                            {contract.prime_function && contract.prime_function !== '' 
                              ? `${contract.prime_function} - ${functions.find(f => f.id === contract.prime_function)?.name || ''}`
                              : 'Toutes les fonctions (Par défaut)'
                            }
                          </td>
                          {isCompta && (
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => {
                                    setNewSiteName(contract.site_name);
                                    setNewSitePrime(contract.prime_site || 0);
                                    setNewSiteFunc(contract.prime_function || '');
                                  }}
                                  style={{ 
                                    background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'none', 
                                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                    fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.25)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                                  title="Modifier cette prime"
                                >
                                  <Pencil size={16} /> Modifier
                                </button>
                                <button 
                                  onClick={() => setSitePrimeToDelete(contract)}
                                  style={{ 
                                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', 
                                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, transition: 'background 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                  title="Supprimer la prime pour ce site"
                                >
                                  <Trash2 size={16} /> Supprimer
                                </button>
                              </div>
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

        {/* ═══════════ CONFIGURATION PAIE ═══════════ */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
          padding: '24px', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px'
        }}>
          <div
            onClick={() => setShowPayrollConfig(v => !v)}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              cursor: 'pointer', userSelect: 'none', padding: '12px 16px', margin: '-12px -16px', borderRadius: '12px', transition: 'all 0.2s' 
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={22} style={{ color: '#38bdf8' }} />
              ⚙️ Configuration de la Fiche de Paie
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              {showPayrollConfig ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>

          {showPayrollConfig && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Méthode imposition */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(56,189,248,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '10px' }}>Méthode de calcul des impôts</label>
                  <select
                    disabled={!isCompta}
                    style={{ width: '100%', padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    value={payrollSettings.tax_mode}
                    onChange={e => setPayrollSettings({ ...payrollSettings, tax_mode: e.target.value })}
                  >
                    <option value="simplifie">Simplifié (Taux fixe)</option>
                    <option value="reel_ci">Barème Progressif Réel CI (Quotient Familial)</option>
                  </select>
                </div>
                {/* Logo de l'entreprise */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(139,92,246,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '4px' }}>Logo de l'entreprise (Bulletin de Paie)</label>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Par défaut, le logo Elysium sera utilisé. Ajoutez votre propre logo ici.</p>
                  </div>
                  <div>
                    {payrollSettings.company_logo && <img src={payrollSettings.company_logo} alt="Logo" style={{ height: '40px', marginRight: '16px', borderRadius: '4px' }} />}
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="logo_upload" 
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const base64 = event.target.result;
                            setPayrollSettings({ ...payrollSettings, company_logo: base64 });
                            if (isCompta) {
                              try {
                                await apiCall('upload_company_logo', { logo_base64: base64 });
                                alert('Logo mis à jour avec succès !');
                              } catch(err) {
                                console.error(err);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="logo_upload" 
                      style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'inline-block', fontWeight: 500 }}
                    >
                      Uploader un Logo
                    </label>
                  </div>
                </div>
                {/* Rubriques du Bulletin de Paie */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  
                  <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '16px', fontSize: '1.05rem' }}>Rubriques du Bulletin de Paie</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    {[
                      { key: 'enable_sursalaire', label: 'Sursalaire / Primes', default: true },
                      { key: 'enable_seniority', label: "Prime d'Ancienneté", default: true },
                      { key: 'enable_cnps_salarial', label: 'Retraite Générale (C.N.P.S)', default: true },
                      { key: 'enable_cmu_employe', label: 'CMU Employé', default: true },
                      { key: 'enable_its', label: 'Impôt sur trait. et sal. (ITS)', default: true },
                      { key: 'enable_accidents_travail', label: 'Accidents du Travail', default: true },
                      { key: 'enable_fdfp', label: 'Taxe Formation Prof. Continue', default: true },
                      { key: 'enable_taxe_apprentissage', label: "Taxe d'apprentissage", default: true },
                      { key: 'enable_cmu_employeur', label: 'CMU Employeur', default: true },
                      { key: 'enable_cnps_patronal', label: 'CNPS Patronale (Autre)', default: true },
                      { key: 'enable_avances', label: 'Avances et Autres Retenues', default: true },
                      { key: 'enable_payslip_absences', label: 'Afficher la ligne Absences', default: true },
                      { key: 'enable_payslip_map', label: 'Afficher la ligne Mises à pied', default: true },
                      { key: 'enable_payslip_permissions', label: 'Afficher la ligne Permissions', default: true },
                      { key: 'enable_payslip_reclamations', label: 'Afficher la ligne Réclamations', default: true },
                      { key: 'count_hours_permissions', label: 'Inclure Permissions (P) dans les Heures Travaillées', default: false },
                      { key: 'count_hours_maladie', label: 'Inclure Maladie (M) dans les Heures Travaillées', default: false },
                      { key: 'count_hours_conges', label: 'Inclure Congés (CP) dans les Heures Travaillées', default: true },
                      { key: 'count_hours_repos', label: 'Inclure Repos (R) dans les Heures Travaillées', default: false }
                    ].map(item => (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={item.key}
                          disabled={!isCompta}
                          checked={payrollSettings[item.key] !== undefined ? payrollSettings[item.key] : item.default}
                          onChange={e => setPayrollSettings({ ...payrollSettings, [item.key]: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
                        />
                        <label htmlFor={item.key} style={{ color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paramètres du Cumul Annuel et Avantages */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '16px', fontSize: '1.05rem' }}>Paramètres du Cumul Annuel et Avantages</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Mois de début du Cumul Annuel</label>
                      <select
                        disabled={!isCompta}
                        style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                        value={payrollSettings.cumul_start_month || 1}
                        onChange={e => setPayrollSettings({ ...payrollSettings, cumul_start_month: parseInt(e.target.value) })}
                      >
                        <option value={1}>Janvier (Recommandé)</option>
                        <option value={2}>Février</option>
                        <option value={3}>Mars</option>
                        <option value={4}>Avril</option>
                        <option value={5}>Mai</option>
                        <option value={6}>Juin</option>
                        <option value={7}>Juillet</option>
                        <option value={8}>Août</option>
                        <option value={9}>Septembre</option>
                        <option value={10}>Octobre</option>
                        <option value={11}>Novembre</option>
                        <option value={12}>Décembre</option>
                      </select>
                      <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Le mois à partir duquel les compteurs annuels redémarrent à zéro.</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>Avantages en nature par défaut (XOF)</label>
                      <input
                        type="number"
                        disabled={!isCompta}
                        style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                        value={payrollSettings.avantages_nature_default !== undefined ? payrollSettings.avantages_nature_default : 0}
                        onChange={e => setPayrollSettings({ ...payrollSettings, avantages_nature_default: parseInt(e.target.value) || 0 })}
                      />
                      <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Montant ajouté par défaut dans la colonne "Avantage en nature".</p>
                    </div>
                  </div>
                </div>

                {/* Horaires de Montée et Descente */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ display: 'block', color: 'white', fontWeight: 600, marginBottom: '16px', fontSize: '1.05rem' }}>Heures de Montée et Descente</label>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>Définissez l'heure de début et de fin de chaque vacation. Le système s'en servira pour calculer la durée réelle travaillée.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Jour */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '12px', fontSize: '0.95rem' }}>☀️ Vacation Jour</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '4px' }}>Heure de Montée</label>
                          <input type="time" disabled={!isCompta} value={payrollSettings.shift_j_start || '06:30'} onChange={e => setPayrollSettings({ ...payrollSettings, shift_j_start: e.target.value })} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '4px' }}>Heure de Descente</label>
                          <input type="time" disabled={!isCompta} value={payrollSettings.shift_j_end || '18:30'} onChange={e => setPayrollSettings({ ...payrollSettings, shift_j_end: e.target.value })} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }} />
                        </div>
                      </div>
                    </div>
                    {/* Nuit */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <h4 style={{ color: '#8b5cf6', marginTop: 0, marginBottom: '12px', fontSize: '0.95rem' }}>🌙 Vacation Nuit</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '4px' }}>Heure de Montée</label>
                          <input type="time" disabled={!isCompta} value={payrollSettings.shift_n_start || '18:30'} onChange={e => setPayrollSettings({ ...payrollSettings, shift_n_start: e.target.value })} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '4px' }}>Heure de Descente</label>
                          <input type="time" disabled={!isCompta} value={payrollSettings.shift_n_end || '06:30'} onChange={e => setPayrollSettings({ ...payrollSettings, shift_n_end: e.target.value })} style={{ width: '100%', padding: '8px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Taux */}
                {[['cnps_salarial','CNPS Salarial (%)'],['cnps_patronal','CNPS Patronal (%)'],
                  ...(payrollSettings.tax_mode === 'simplifie' ? [['its','ITS Fixe (%)']] : []),
                  ['taxe_formation','Taxe Formation (%)'],['taxe_apprentissage',"Taxe d'apprentissage (%)"],
                  ['accidents_travail','Accidents du Travail (%)'],['cmu_amount','Montant CMU (Fixe)']
                ].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>{label}</label>
                    <input
                      type="number" step="0.1"
                      disabled={!isCompta}
                      value={payrollSettings[key] || ''}
                      onChange={e => setPayrollSettings({ ...payrollSettings, [key]: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '12px', background: isCompta ? 'rgba(15,23,42,0.6)' : 'transparent', border: isCompta ? '1px solid rgba(255,255,255,0.1)' : 'none', color: 'white', borderRadius: '10px', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              {isCompta && (
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    onClick={async () => {
                      if (payrollSaving) return;
                      setPayrollSaving(true);
                      try {
                        const res = await apiCall('save_payroll_settings', { settings: payrollSettings });
                        if (res.success) { 
                          setPayrollSaved(true); 
                          setTimeout(() => setPayrollSaved(false), 3000); 
                        } else {
                          alert(res.message || "Erreur lors de l'enregistrement des paramètres de paie.");
                        }
                      } catch(e) { 
                        console.error(e); 
                        alert("Erreur de connexion.");
                      } finally {
                        setPayrollSaving(false);
                      }
                    }}
                    style={{
                      padding: '12px 28px',
                      background: payrollSaving ? 'linear-gradient(135deg,#64748b,#475569)' : (payrollSaved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#38bdf8,#0284c7)'),
                      color: 'white', border: 'none', borderRadius: '12px', cursor: payrollSaving ? 'not-allowed' : 'pointer',
                      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                    }}
                  >
                    {payrollSaving ? <Loader2 size={18} className="animate-spin" /> : (payrollSaved ? <CheckCircle2 size={18} /> : <Save size={18} />)}
                    {payrollSaving ? 'Enregistrement...' : (payrollSaved ? 'Paramètres enregistrés !' : 'Enregistrer')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {showManual && <ConfigurationManualModal onClose={() => setShowManual(false)} />}

        {selectedFuncDetails && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              borderRadius: '20px', padding: '32px', width: '400px', maxWidth: '90%',
              border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              position: 'relative', animation: 'slideUp 0.3s ease-out'
            }}>
              <button 
                onClick={() => setSelectedFuncDetails(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={18} />
              </button>
              
              <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.6rem' }}>ℹ️</span> Détails du Poste
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Code abrégé</label>
                  <div style={{ color: '#f8fafc', fontSize: '1.15rem', fontWeight: 600, display: 'inline-block', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '4px 12px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                    {selectedFuncDetails.id}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Nom complet</label>
                  <div style={{ color: '#38bdf8', fontSize: '1.15rem', fontWeight: 600, wordBreak: 'break-word' }}>
                    {selectedFuncDetails.name}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Catégorie</label>
                  <div style={{ color: '#f8fafc', fontSize: '1rem' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500,
                      background: selectedFuncDetails.type === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(56,189,248,0.2)',
                      color: selectedFuncDetails.type === 'admin' ? '#d8b4fe' : '#bae6fd',
                      border: `1px solid ${selectedFuncDetails.type === 'admin' ? 'rgba(168,85,247,0.3)' : 'rgba(56,189,248,0.3)'}`
                    }}>
                      {selectedFuncDetails.type === 'admin' ? 'Administration' : 'Agents'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedFuncDetails(null)}
                style={{ 
                  marginTop: '32px', width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)',
                  color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteSpecialAgentModal
        isOpen={!!specialAgentToDelete}
        onClose={() => setSpecialAgentToDelete(null)}
        onConfirm={() => handleRemoveSpecialAgent(specialAgentToDelete?.id)}
        agentName={specialAgentToDelete?.name || ''}
        isLoading={isDeletingSpecialAgent}
      />

      <ConfirmDeleteSitePrimeModal
        isOpen={!!sitePrimeToDelete}
        onClose={() => setSitePrimeToDelete(null)}
        onConfirm={handleDeleteSitePrime}
        siteName={sitePrimeToDelete?.site_name || ''}
        isLoading={isDeletingSitePrime}
      />

      <ConfirmDeleteFunctionModal
        isOpen={!!funcToDelete}
        onClose={() => setFuncToDelete(null)}
        onConfirm={handleDeleteFunction}
        functionName={funcToDelete?.name || ''}
        isLoading={isDeletingFunc}
      />
    </div>
  );
}
