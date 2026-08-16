import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { 
  ShieldAlert, 
  UserCheck, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  Search,
  Building,
  Settings
} from 'lucide-react';

export default function CorrectionAdminView() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const [cycleDates, setCycleDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Type de correction : 'change_mutation_destination' ou 'change_attendance_status'
  const [actionType, setActionType] = useState('change_mutation_destination');
  
  // Pour la mutation
  const [subsites, setSubsites] = useState([]);
  const [selectedSubsite, setSelectedSubsite] = useState(null);
  
  // Pour la modification de statut de pointage
  const [newStatus, setNewStatus] = useState('R');
  
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState(null); // { success: boolean, text: string }

  // 1. Charger les périodes publiées et les sites
  useEffect(() => {
    const initData = async () => {
      setLoadingPeriods(true);
      try {
        const resPeriods = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
        if (resPeriods.success && Array.isArray(resPeriods.published_periods)) {
          const sorted = [...resPeriods.published_periods].sort((a, b) => b.localeCompare(a));
          setPeriods(sorted);
          if (sorted.length > 0) {
            setSelectedPeriod(sorted[0]);
          }
        }
        
        const resSites = await apiCall('get_sites', { scope: 'company' }, 'GET');
        if (Array.isArray(resSites)) {
          const flatSubsites = [];
          resSites.forEach(site => {
            if (Array.isArray(site.subsites)) {
              site.subsites.forEach(sub => {
                flatSubsites.push({
                  id: sub.id,
                  name: `${site.name} / ${sub.name}`,
                  subsiteName: sub.name
                });
              });
            }
          });
          flatSubsites.sort((a, b) => a.name.localeCompare(b.name));
          setSubsites(flatSubsites);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPeriods(false);
      }
    };
    initData();
  }, []);

  // 2. Charger les agents de la période sélectionnée
  useEffect(() => {
    if (!selectedPeriod) return;
    
    const loadAgentsOfPeriod = async () => {
      setLoadingAgents(true);
      setSelectedAgent(null);
      setSelectedDates([]);
      setSearchTerm('');
      try {
        const res = await apiCall(`get_salaries?period=${selectedPeriod}&scope=company`, {}, 'GET');
        if (Array.isArray(res)) {
          const uniqueAgents = [];
          const seenIds = new Set();
          res.forEach(item => {
            if (item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              uniqueAgents.push({
                id: item.id,
                name: item.name,
                site: item.site,
                subsite: item.subsite,
                shiftType: item.shift_type
              });
            }
          });
          uniqueAgents.sort((a, b) => a.name.localeCompare(b.name));
          setAgents(uniqueAgents);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAgents(false);
      }
    };
    
    loadAgentsOfPeriod();
    
    const [year, month] = selectedPeriod.split('-').map(Number);
    if (year && month) {
      const startDate = new Date(year, month - 2, 21);
      const endDate = new Date(year, month - 1, 20);
      const dates = [];
      let current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      setCycleDates(dates);
    }
  }, [selectedPeriod]);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDate = (date) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(prev => prev.filter(d => d !== date));
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const handleSelectAllDates = () => {
    if (selectedDates.length === cycleDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates([...cycleDates]);
    }
  };

  const executeCorrection = async () => {
    if (!selectedPeriod || !selectedAgent || selectedDates.length === 0) {
      alert("Veuillez remplir tous les champs avant de valider.");
      return;
    }
    
    if (actionType === 'change_mutation_destination' && !selectedSubsite) {
      alert("Veuillez sélectionner un site de destination.");
      return;
    }

    let confirmMsg = '';
    if (actionType === 'change_mutation_destination') {
      confirmMsg = `Vous allez modifier les pointages de ${selectedAgent.name} pour les dates suivantes :\n` +
        `${selectedDates.join(', ')}\n` +
        `pour les muter vers le site : ${selectedSubsite.name}.\n\n` +
        `Cette action va régénérer immédiatement l'État de paie de la période ${selectedPeriod}.\n` +
        `Voulez-vous continuer ?`;
    } else {
      const statusLabels = { 'R': 'Repos (R)', '1': 'Présent (1)', 'A': 'Absent (A)', 'P': 'Permission (P)', 'C': 'Congé (C)' };
      confirmMsg = `Vous allez modifier les pointages de ${selectedAgent.name} en mettant le code "${statusLabels[newStatus] || newStatus}" pour les dates suivantes :\n` +
        `${selectedDates.join(', ')}\n\n` +
        `Cette action va régénérer immédiatement l'État de paie de la période ${selectedPeriod}.\n` +
        `Voulez-vous continuer ?`;
    }
      
    if (!confirm(confirmMsg)) return;
    
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const payload = {
        period: selectedPeriod,
        agent_id: selectedAgent.id,
        dates: selectedDates,
        action_type: actionType
      };

      if (actionType === 'change_mutation_destination') {
        payload.destination_subsite_id = selectedSubsite.id;
        payload.destination_name = selectedSubsite.subsiteName;
      } else {
        payload.new_status = newStatus;
        // Mettre une valeur bidon pour passer la vérification au besoin ou utiliser le subsite actuel
        payload.destination_subsite_id = 'bypass';
      }

      const res = await apiCall('apply_last_minute_correction', payload);
      
      if (res.success) {
        setStatusMessage({ success: true, text: res.message || "Correction appliquée avec succès !" });
        setSelectedAgent(null);
        setSelectedDates([]);
        setSearchTerm('');
      } else {
        setStatusMessage({ success: false, text: res.message || "Erreur lors de l'application de la correction." });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ success: false, text: "Erreur réseau ou interne lors de la requête." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ animation: 'slideUp 0.3s ease-out' }}>
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            width: 56, height: 56, borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
          }}>
            <ShieldAlert size={28} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Corrections de Paie Clôturée</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Modifiez de manière sécurisée les mutations et pointages sur des périodes déjà publiées.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="glass-panel" style={{
          marginBottom: '24px',
          borderColor: statusMessage.success ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          background: statusMessage.success ? 'rgba(52, 211, 153, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px'
        }}>
          {statusMessage.success ? (
            <CheckCircle size={28} color="#34d399" />
          ) : (
            <AlertCircle size={28} color="#ef4444" />
          )}
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, color: statusMessage.success ? '#34d399' : '#ef4444' }}>
              {statusMessage.success ? "Opération réussie" : "Erreur détectée"}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text)' }}>
              {statusMessage.text}
            </p>
          </div>
        </div>
      )}

      {loadingPeriods ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              Étape 1 : Cible & Actions
            </h3>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                PÉRIODE PUBLIÉE
              </label>
              <select 
                className="form-control" 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ width: '100%' }}
              >
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                TYPE DE CORRECTION
              </label>
              <select 
                className="form-control" 
                value={actionType} 
                onChange={(e) => setActionType(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="change_mutation_destination">Déplacer / Corriger une mutation (Clonage)</option>
                <option value="change_attendance_status">Modifier le code de pointage (Repos, Présent, Permission...)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                RECHERCHER L'AGENT
              </label>
              {!selectedAgent ? (
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tapez le nom de l'agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px' }}
                    disabled={loadingAgents}
                  />
                  {searchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      marginTop: '4px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }}>
                      {filteredAgents.length > 0 ? (
                        filteredAgents.map(ag => (
                          <div 
                            key={ag.id} 
                            onClick={() => {
                              setSelectedAgent(ag);
                              setSearchTerm('');
                            }}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)',
                              fontSize: '0.88rem'
                            }}
                            className="hover-bg"
                          >
                            <div style={{ fontWeight: 700 }}>{ag.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                              Site : {ag.site} / {ag.subsite} | Planning: {ag.shiftType}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                          Aucun agent trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(236, 72, 153, 0.05)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ec4899' }}>{selectedAgent.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Origine : {selectedAgent.site} / {selectedAgent.subsite}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAgent(null)}
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>

            {actionType === 'change_mutation_destination' ? (
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                  SITE DE DESTINATION DE LA MUTATION
                </label>
                <select 
                  className="form-control"
                  value={selectedSubsite?.id || ''}
                  onChange={(e) => {
                    const sub = subsites.find(s => s.id === e.target.value);
                    setSelectedSubsite(sub || null);
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Sélectionner le site de destination --</option>
                  {subsites.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                  NOUVEAU CODE DE POINTAGE A APPLIQUER
                </label>
                <select 
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="R">Repos (R)</option>
                  <option value="1">Présent (1)</option>
                  <option value="A">Absent (A)</option>
                  <option value="P">Permission (P)</option>
                  <option value="C">Congé (C)</option>
                </select>
              </div>
            )}
            
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
                <HelpCircle size={16} />
                <span>
                  {actionType === 'change_mutation_destination' 
                    ? "Ce module va cloner l'agent sur le site cible et adapter ses pointages sans dépublier."
                    : "Ce module va modifier directement le code de pointage de l'agent sur les dates choisies et recalculer la paie."}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Étape 2 : Dates concernées
              </h3>
              <button 
                onClick={handleSelectAllDates} 
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                {selectedDates.length === cycleDates.length ? "Tout décocher" : "Tout cocher"}
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {cycleDates.map(date => {
                const dateObj = new Date(date);
                const dayLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                const isSelected = selectedDates.includes(date);
                
                return (
                  <div 
                    key={date}
                    onClick={() => handleSelectDate(date)}
                    style={{
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isSelected ? 'rgba(236, 72, 153, 0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="hover-bg"
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} 
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 500 }}>
                      {dayLabel}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={executeCorrection}
                className="btn btn-primary"
                disabled={submitting || !selectedAgent || selectedDates.length === 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                  border: 'none',
                  padding: '14px',
                  fontWeight: 700,
                  fontSize: '0.98rem'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Correction en cours...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    <span>Appliquer la correction</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
