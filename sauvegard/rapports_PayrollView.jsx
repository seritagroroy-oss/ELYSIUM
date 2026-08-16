import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  ReceiptText, ChevronLeft, Loader2, Printer, Building2,
  Users, CheckCircle2, Clock, ShieldOff,
  BadgeCheck, Wallet, AlertCircle, MapPin, Eye, Archive, Lock, Search, Settings, TrendingUp, ChevronUp, ChevronDown, X,
  Calendar, Briefcase, Calculator, PiggyBank, History
} from 'lucide-react';
import PaymentMethodModal from './modals/PaymentMethodModal';

const STATUSES = {
  brouillon: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', next: 'valide' },
  valide:    { label: 'Validé',    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   next: 'paye' },
  paye:      { label: 'Payé',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    next: null },
};

const getPeriodsList = (currentPeriod = null, limitPeriod = null) => {
  const list = [];
  const now = new Date();
  const periodSet = new Set();
  
  if (!limitPeriod) {
    const currentRealY = now.getFullYear();
    const currentRealM = String(now.getMonth() + 1).padStart(2, '0');
    limitPeriod = `${currentRealY}-${currentRealM}`;
  }

  for (let i = -60; i <= 60; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const val = `${y}-${m}`;
    
    // Bloquer les périodes futures
    if (val > limitPeriod) continue;
    
    // Note: use local time construction to avoid timezone shifts
    const dLabel = new Date();
    dLabel.setFullYear(y, parseInt(m, 10) - 1, 1);
    dLabel.setHours(12, 0, 0, 0); // Safe mid-day
    
    list.push({ value: val, label: dLabel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) });
    periodSet.add(val);
  }

  if (currentPeriod && !periodSet.has(currentPeriod) && currentPeriod <= limitPeriod) {
    const [cy, cm] = currentPeriod.split('-');
    const dLabel = new Date();
    dLabel.setFullYear(parseInt(cy), parseInt(cm, 10) - 1, 1);
    dLabel.setHours(12, 0, 0, 0);
    list.push({ value: currentPeriod, label: dLabel.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) });
    list.sort((a, b) => a.value.localeCompare(b.value));
  }

  return list;
};

const ZONE_COLORS = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f472b6','#fb7185','#818cf8','#2dd4bf','#e879f9','#a3e635'];

function AideComptableModal({ onClose }) {
  React.useEffect(() => {
    console.log("AIDE COMPTABLE MODAL MOUNTED");
    // alert("La fenêtre d'aide s'ouvre !");
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#1e293b', padding: '32px', borderRadius: '24px', width: '700px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'white' }}>Aide Comptable — Manuel des calculs</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Guide de référence pour les états de paie</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Règle des 30 jours */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#facc15', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Règle du Trentième (Mois de 31 Jours)
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              L&apos;entreprise applique la <strong>Règle du trentième</strong>. Le salaire est un <strong>forfait mensuel basé sur 30 jours</strong>.
              Toute absence est déduite de ce forfait de 30 jours, indépendamment de la durée réelle du mois calendaire (28, 30 ou 31 jours).
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>
              <span style={{ color: '#94a3b8' }}>Exemple (Mois de 31 jours) :</span><br/>
              L&apos;agent a travaillé <strong>9 jours</strong> réels, puis a fait <strong>22 jours d&apos;abandon</strong> (9+22 = 31).<br/><br/>
              <span style={{ color: '#facc15' }}>Calcul :</span> Base (30 jours) - Absences (22 jours)<br/>
              <span style={{ color: '#facc15' }}>Résultat :</span> L&apos;agent est payé pour <strong>8 jours</strong> (Jours Travaillés = 8).<br/>
              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Note : Le 31ème jour vient &quot;absorber&quot; mathématiquement le jour d&apos;absence dans le forfait.</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BadgeCheck size={18} /> Principe de calcul : Bonus Costume (COST)
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              Lorsqu&apos;un agent de <strong>Tenue Régulière</strong> effectue des jours en <strong>Costume (COST)</strong>, il reçoit un bonus différentiel correspondant à la différence de salaire entre les deux fonctions, proratisé au nombre de jours.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>
              <span style={{ color: '#94a3b8' }}>Exemple de calcul :</span><br/>
              Si Salaire Tenue = <strong style={{ color: '#f472b6' }}>75 000 XOF</strong> et Costume = <strong style={{ color: '#34d399' }}>90 000 XOF</strong><br/>
              Pour <strong>5 jours</strong> en costume :<br/><br/>
              <span style={{ color: '#38bdf8' }}>Bonus</span> = 5 × (90 000 - 75 000) / 30<br/>
              <span style={{ color: '#38bdf8' }}>Bonus</span> = 5 × 15 000 / 30<br/>
              <span style={{ color: '#38bdf8' }}>Bonus</span> = <strong>2 500 XOF</strong> en plus (ajouté aux Gains de l&apos;agent)
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} /> Autres règles (à venir...)
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              D&apos;autres explications sur les MAP, permissions, et fluctuations seront ajoutées ici prochainement pour vous guider.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Fermer l&apos;aide</button>
        </div>
      </div>
    </div>
  );
}

export function AgentPayrollDetailsModal({ agent, taxes, funcLabel, payrollSettings, onClose }) {
  if (!agent) return null;

  let profileObj = {};
  try {
    profileObj = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {});
  } catch (e) {}
  const isSpecial = !!profileObj.special_service;

  const renderHistoryList = () => {
    let history = [];
    if (agent.entrant_sortant_count > 0 && agent.status === 'entrant') {
       history.push({ date: agent.profile_data?.date_embauche || agent.profile_data?.hire_date || 'N/A', type: 'Entrée', color: '#10b981', desc: 'Nouvel agent' });
    }
    if (agent.status === 'sortant' || agent.status === 'abandon' || agent.status === 'demission') {
       history.push({ date: 'N/A', type: agent.status.toUpperCase(), color: '#ef4444', desc: 'Agent sortant/inactif' });
    }
    if (agent.profile_data?.mutation_breakdown) {
       const m = agent.profile_data.mutation_breakdown;
       if (Array.isArray(m)) {
           m.forEach(item => {
               history.push({ date: 'N/A', type: 'Mutation', color: '#3b82f6', desc: `De ${item.old_site || '?'} vers ${item.new_site || '?'}` });
           });
       } else if (m.original && m.mutated) {
           history.push({ 
               date: 'N/A', 
               type: 'Mutation Inter-Sites', 
               color: '#3b82f6', 
               desc: (
                   <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                       <div style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', borderLeft: '4px solid #3b82f6', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                           <div style={{ fontWeight: '700', color: 'white', marginBottom: '4px', fontSize: '0.85rem' }}>Site Initial : {m.original.site || '?'} ({m.original.subsite || '-'})</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                               <span>Jours travaillés: <span style={{color:'white', fontWeight:'600'}}>{m.original.worked_days || 0}</span></span>
                               <span style={{ fontWeight: '700', color: '#10b981' }}>{Number(m.original.base_prorata || 0).toLocaleString()} XOF</span>
                           </div>
                       </div>
                       <div style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', borderLeft: '4px solid #8b5cf6', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                           <div style={{ fontWeight: '700', color: 'white', marginBottom: '4px', fontSize: '0.85rem' }}>Nouveau Site : {m.mutated.site || '?'} ({m.mutated.subsite || '-'})</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                               <span>Jours travaillés: <span style={{color:'white', fontWeight:'600'}}>{m.mutated.worked_days || 0}</span></span>
                               <span style={{ fontWeight: '700', color: '#10b981' }}>{Number(m.mutated.base_prorata || 0).toLocaleString()} XOF</span>
                           </div>
                       </div>
                   </div>
               )
           });
       }
    } else if (agent.profile_data?.mutated_from_function && agent.profile_data.mutated_from_function !== agent.function) {
       history.push({ date: 'N/A', type: 'Mutation Poste', color: '#8b5cf6', desc: `De ${agent.profile_data.mutated_from_function} vers ${funcLabel(agent.function)}` });
    }

    const scObj = typeof agent.status_change === 'string' ? JSON.parse(agent.status_change) : agent.status_change;
    if (scObj) {
        history.push({ date: scObj.date ? scObj.date.split('-').reverse().join('/') : 'N/A', type: 'Changement de Statut', color: '#eab308', desc: `De ${scObj.old_function} vers ${scObj.new_function} (${scObj.reason || ''})` });
    }

    if (history.length === 0) {
        return <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)', textAlign: 'center' }}>Aucun mouvement historique majeur détecté ce mois-ci.</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
            <div style={{ padding: '6px 12px', background: `${h.color}15`, color: h.color, borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', whiteSpace: 'nowrap', border: `1px solid ${h.color}30` }}>
              {h.date}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'white', fontSize: '0.9rem' }}>{h.type}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.4' }}>{h.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const InfoRow = ({ label, value, isBold, color = 'white', isDeduction = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ color: color, fontWeight: isBold ? '800' : '600', fontSize: isBold ? '1rem' : '0.95rem' }}>
        {isDeduction && value > 0 ? '-' : ''}{value > 0 ? value.toLocaleString() : '0'} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>XOF</span>
      </span>
    </div>
  );

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const handleSavePaymentMethod = async (id, updatedProfile) => {
    try {
      const res = await apiCall('update_agent_profile', { agent_id: id, profile_data: updatedProfile });
      if (res.success) {
        setShowPaymentModal(false);
        agent.profile_data = JSON.stringify(updatedProfile);
        setSuccessMsg('Moyen de paiement mis à jour !');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(res.message || 'Erreur lors de la sauvegarde');
      }
    } catch(e) {
      console.error(e);
      alert('Erreur serveur');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      {showPaymentModal && <PaymentMethodModal agent={agent} onClose={() => setShowPaymentModal(false)} onSubmit={handleSavePaymentMethod} />}
      {successMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#10b981', color: 'white', padding: '20px 40px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 10px 25px rgba(16,185,129,0.5)', animation: 'slideUp 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>✓</span> {successMsg}
          </div>
        </div>
      )}
      <div style={{ background: '#090d16', width: '100%', maxWidth: '1200px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', height: '90vh', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, rgba(13, 20, 35, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: isSpecial ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.4rem', fontWeight: '900', boxShadow: isSpecial ? '0 8px 20px -4px rgba(234, 179, 8, 0.3)' : '0 8px 20px -4px rgba(14, 165, 233, 0.3)' }}>
              {agent.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {agent.name}
                <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', borderRadius: '9999px', fontWeight: 700, border: '1px solid rgba(14, 165, 233, 0.25)' }}>
                  {funcLabel(agent.function)}
                </span>
                {isSpecial && (
                  <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(234, 179, 8, 0.1)', color: '#fbbf24', borderRadius: '9999px', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    Temps Partiel
                  </span>
                )}
              </h2>
              <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} /> Profil Complet & Synthèse de Paie
                </span>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  {(() => {
                    let prof = {};
                    try { prof = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {}); } catch(e){}
                    if (prof.payment_method === 'MONEY' && prof.payment_number) {
                      return <><Wallet size={13} /> {prof.payment_operator} : {prof.payment_number}</>;
                    } else if (prof.payment_method === 'BANQUE' && prof.payment_rib) {
                      return <><Building2 size={13} /> {prof.payment_bank_name}</>;
                    }
                    return <><Wallet size={13} /> Ajouter un moyen de paiement</>;
                  })()}
                </button>
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
            <X size={20} />
          </button>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
          
          {/* Left Column: HR & Movements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Temps de Travail */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                <Calendar size={18} color="#3b82f6" /> Temps de Travail
              </h3>
              
              {isSpecial && (
                <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    Agent à Temps Partiel
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Jours planifiés ce mois-ci : <strong>{profileObj.special_service_base || 12} jours</strong>.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Jours effectués ce mois-ci : <strong>{agent.days_worked ?? (30 - agent.absences - (agent.map_count||0) - (agent.entrant_sortant_count||0))} jours</strong>.
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '4px', marginTop: '2px' }}>
                    Salaire journalier calculé sur 30 jours (Base / 30).
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(16,185,129,0.03)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.12)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981' }}>{agent.days_worked ?? (30 - agent.absences - (agent.map_count||0) - (agent.entrant_sortant_count||0))}</div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '700', marginTop: '1px' }}>Jours Trav.</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.03)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.12)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444' }}>{agent.absences}</div>
                  <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '700', marginTop: '1px' }}>Absences</div>
                </div>
                <div style={{ background: 'rgba(249,115,22,0.03)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(249,115,22,0.12)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f97316' }}>{agent.map_count || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#f97316', fontWeight: '700', marginTop: '1px' }}>MAP</div>
                </div>
                <div style={{ background: 'rgba(139,92,246,0.03)', padding: '10px 8px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(139,92,246,0.12)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#8b5cf6' }}>{agent.permission_count || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#8b5cf6', fontWeight: '700', marginTop: '1px' }}>Permissions</div>
                </div>
              </div>
            </div>
 
            {/* Historique Terrain */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                <History size={18} color="#f59e0b" /> Historique Terrain (PC)
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
                {renderHistoryList()}
              </div>
            </div>
            
          </div>
 
          {/* Right Column: Payroll Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Revenus & Gains */}
              <div style={{ background: 'rgba(16,185,129,0.01)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.12)', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#10b981', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  <Wallet size={18} /> Revenus & Gains
                </h3>
                <InfoRow label="Base Salariale" value={agent.base} color="#10b981" isBold />
                {(agent.prime_site || 0) > 0 && <InfoRow label="Prime de Site" value={agent.prime_site} color="#10b981" />}
                {agent.gains > 0 && <InfoRow label="Heures Supplémentaires" value={agent.gains} color="#0ea5e9" />}
                {taxes.primeAnciennete > 0 && <InfoRow label="Prime d'Ancienneté" value={taxes.primeAnciennete} color="#a855f7" />}
                {taxes.primeVariable > 0 && <InfoRow label="Sursalaire" value={taxes.primeVariable} color="#38bdf8" />}
                
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1rem', fontWeight: '800', letterSpacing: '0.03em' }}>SALAIRE BRUT</span>
                    <span style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: '900', textShadow: '0 0 20px rgba(16,185,129,0.2)' }}>{taxes.brut.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight:'600' }}>XOF</span></span>
                  </div>
                </div>
              </div>
 
              {/* Déductions & Taxes */}
              <div style={{ background: 'rgba(239,68,68,0.01)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.12)', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  <Calculator size={18} /> Retenues Salariales
                </h3>
                {agent.deductions > 0 && <InfoRow label="Retenues (Abs/MAP...)" value={agent.deductions} color="#ef4444" isDeduction />}
                {taxes.cnpsSalarial > 0 && <InfoRow label="CNPS Salarié" value={taxes.cnpsSalarial} color="#ef4444" isDeduction />}
                {taxes.cmuEmploye > 0 && <InfoRow label="CMU Salarié" value={taxes.cmuEmploye} color="#ef4444" isDeduction />}
                {taxes.impotsTaxes > 0 && <InfoRow label="ITS (Impôts)" value={taxes.impotsTaxes} color="#ef4444" isDeduction />}
                {taxes.avances > 0 && <InfoRow label="Avances / Acomptes" value={taxes.avances} color="#f97316" isDeduction />}
                {taxes.remboursementsPrets > 0 && <InfoRow label="Remboursement Prêt" value={taxes.remboursementsPrets} color="#f97316" isDeduction />}
                
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontSize: '1rem', fontWeight: '800', letterSpacing: '0.03em' }}>TOTAL RETENUES</span>
                    <span style={{ color: '#ef4444', fontSize: '1.3rem', fontWeight: '900', textShadow: '0 0 20px rgba(239,68,68,0.2)' }}>-{(agent.deductions + taxes.cnpsSalarial + taxes.cmuEmploye + taxes.impotsTaxes + taxes.avances + taxes.remboursementsPrets).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight:'600' }}>XOF</span></span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Charges Patronales & Bilan */}
            <div style={{ display: 'flex', gap: '24px' }}>
              
              <div style={{ background: 'rgba(245,158,11,0.01)', padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.12)', flex: 1.2, boxShadow: '0 8px 16px -4px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  <Briefcase size={15} /> Charges Patronales (Infos)
                </h3>
                {taxes.cnpsPatronal > 0 && <InfoRow label="CNPS Patronal" value={taxes.cnpsPatronal} color="#f59e0b" />}
                {taxes.cmuEmployeur > 0 && <InfoRow label="CMU Patronal" value={taxes.cmuEmployeur} color="#f59e0b" />}
                {taxes.accidentsTravail > 0 && <InfoRow label="Accidents de Travail" value={taxes.accidentsTravail} color="#f59e0b" />}
                {taxes.taxeFormation > 0 && <InfoRow label="Taxe FDFP" value={taxes.taxeFormation} color="#f59e0b" />}
                {taxes.taxeApprentissage > 0 && <InfoRow label="Taxe Apprentissage" value={taxes.taxeApprentissage} color="#f59e0b" />}
                {!(taxes.cnpsPatronal > 0 || taxes.cmuEmployeur > 0 || taxes.accidentsTravail > 0) && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Aucune charge patronale appliquée.</div>
                )}
              </div>
 
              <div style={{ flex: 1, background: 'linear-gradient(135deg, #090f1e 0%, #0f172a 100%)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(56,189,248,0.06)', filter: 'blur(25px)' }}></div>
                <PiggyBank size={32} color="#38bdf8" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <h3 style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Net à Payer</h3>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.3)', lineHeight: 1 }}>
                  {taxes.netAPayer.toLocaleString()}
                </div>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: '800', marginTop: '2px' }}>XOF</div>
              </div>
 
            </div>
 
          </div>
 
        </div>
 
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function AgentDetailsModal({ agent, onClose }) {
  if (!agent) return null;

  const renderBadgeList = (list, color, bgColor) => {
    if (!list || list.length === 0) return <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune donnée</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {list.map((item, i) => {
          const dateStr = item.date || item.start_date;
          const displayDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : '';
          let text = displayDate;
          if (item.end_date) {
            text += ` - ${new Date(item.end_date).toLocaleDateString('fr-FR')}`;
          }
          if (item.shift) {
            text += ` (${item.shift})`;
          }
          return (
            <span key={i} style={{ background: bgColor, color: color, padding: '6px 14px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, border: `1px solid ${color}40`, letterSpacing: '0.02em' }}>
              {text}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div style={{ background: '#1e293b', width: '100%', maxWidth: '1050px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', zIndex: 10 }}>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: 'white', letterSpacing: '0.01em' }}>{agent.name}</h3>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Détails du pointage et des mouvements</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div 
            style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 24px', borderRadius: '16px', borderLeft: '5px solid #ef4444', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>Absences</h4>
            {renderBadgeList(agent.absence_details, '#ef4444', 'rgba(239,68,68,0.1)')}
          </div>

          <div 
            style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 24px', borderRadius: '16px', borderLeft: '5px solid #f97316', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(249,115,22,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#f97316', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>Mises à Pied (MAP)</h4>
            {renderBadgeList(agent.map_details, '#f97316', 'rgba(249,115,22,0.1)')}
          </div>

          <div 
            style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 24px', borderRadius: '16px', borderLeft: '5px solid #8b5cf6', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#8b5cf6', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>Permissions</h4>
            {renderBadgeList(agent.permission_details, '#8b5cf6', 'rgba(139,92,246,0.1)')}
          </div>

          <div 
            style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 24px', borderRadius: '16px', borderLeft: '5px solid #38bdf8', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>Heures Supplémentaires</h4>
            {renderBadgeList(agent.sp_details, '#38bdf8', 'rgba(56,189,248,0.1)')}
          </div>

          <div 
            style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 24px', borderRadius: '16px', borderLeft: '5px solid #06b6d4', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(6,182,212,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
          >
            <h4 style={{ margin: '0 0 16px 0', color: '#06b6d4', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em' }}>Congés Payés</h4>
            {renderBadgeList(agent.cp_details, '#06b6d4', 'rgba(6,182,212,0.1)')}
          </div>
          
        </div>
      </div>
    </div>
  );
}

function MutationDetailsModal({ selectedMutationDetails, onClose }) {
  if (!selectedMutationDetails) return null;
  const { original, mutated } = selectedMutationDetails.details;

  const renderDaysInfo = (details, textColor) => {
    const active = details.active_days ?? 0;
    const worked = details.worked_days !== undefined ? details.worked_days : active;
    
    const hasDeductions = details.worked_days !== undefined && (
      (details.absences || 0) > 0 || 
      (details.map_count || 0) > 0 || 
      (details.permission_count || 0) > 0 || 
      (details.entrant_sortant_count || 0) > 0
    );

    return (
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: '0 0 4px 0', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
          {details.base_prorata.toLocaleString('fr-FR')} <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>XOF</span>
        </p>
        <p style={{ margin: 0, color: textColor, fontSize: '0.85rem', fontWeight: 600 }}>
          {worked} jour(s) de service réel
        </p>
        {hasDeductions ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
            ({active} actif{active > 1 ? 's' : ''}
            {(details.absences || 0) > 0 && ` - ${details.absences} abs.`}
            {(details.map_count || 0) > 0 && ` - ${details.map_count} MAP`}
            {(details.permission_count || 0) > 0 && ` - ${details.permission_count} perm.`}
            {(details.entrant_sortant_count || 0) > 0 && ` - ${details.entrant_sortant_count} entr./sort.`}
            )
          </span>
        ) : (
          details.worked_days === undefined && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
              ({active} jour(s) actif(s))
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#1e293b', padding: '32px', borderRadius: '24px', width: '850px', maxWidth: '100%', maxHeight: '96vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}>
            <MapPin size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>Détail de Mutation</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{selectedMutationDetails.agent.name}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Site Original */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-10px', left: '20px', background: '#3b82f6', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Site d'origine</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.1rem' }}>{original.site}</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Fonction : <span style={{ color: '#f87171', fontWeight: 600 }}>{original.function}</span></p>
              </div>
              {renderDaysInfo(original, '#38bdf8')}
            </div>
          </div>

          {/* Site Mutation */}
          <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.02) 100%)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '16px', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-10px', left: '20px', background: '#0ea5e9', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Site de mutation</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.1rem' }}>{mutated.site}</h4>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Fonction : <span style={{ color: '#38bdf8', fontWeight: 600 }}>{mutated.function}</span></p>
              </div>
              {renderDaysInfo(mutated, '#38bdf8')}
            </div>
          </div>

          {/* Bilan des Jours */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'block' }}>Total des jours imputés</span>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {(original.worked_days !== undefined ? original.worked_days : (original.active_days||0)) + (mutated.worked_days !== undefined ? mutated.worked_days : (mutated.active_days||0))} jour(s) de service effectif
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'block' }}>Salaire de Base Brut Total</span>
              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem' }}>
                {(original.base_prorata + mutated.base_prorata).toLocaleString('fr-FR')} XOF
              </span>
            </div>
          </div>

          {/* Note explicative pour le comptable */}
          <div style={{ marginTop: '16px', padding: '16px 20px', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ color: '#38bdf8', marginTop: '2px' }}><AlertCircle size={20} /></div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--muted)', lineHeight: '1.5' }}>
              <strong style={{ color: '#38bdf8' }}>Note comptable (Principe des 30 jours) :</strong> Les jours actifs sur chaque site sont ajustés proportionnellement pour correspondre à une base forfaitaire de 30 jours au total {original.calendar_active_days !== undefined && mutated.calendar_active_days !== undefined ? `(ex: ${original.calendar_active_days + mutated.calendar_active_days} jours calendaires réels ramenés à ${original.active_days + mutated.active_days} jours actifs comptables)` : ''}, garantissant un calcul équitable du salaire de base quel que soit le nombre de jours réels du mois.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '10px 24px', fontSize: '0.95rem', borderRadius: '12px' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusChangeInfoModalComponent({ agent, onClose }) {
  if (!agent) return null;
  const scObj = typeof agent.status_change === 'string' ? JSON.parse(agent.status_change) : agent.status_change;
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '480px', width: '90%', border: '1px solid rgba(234,179,8,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#facc15', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Détails Changement Statut</h3>
        <p style={{ margin: '10px 0', color: 'white' }}><strong>Agent :</strong> {agent.name}</p>
        <p style={{ margin: '10px 0', color: 'white' }}><strong>Ancienne Fonction :</strong> <span style={{ color: '#ef4444' }}>{scObj.old_function || '-'}</span> <span style={{fontSize:'0.85rem', color:'rgba(255,255,255,0.5)'}}>(Salaire de base : {(agent.sc_base_old||0).toLocaleString('fr-FR')} FCFA)</span></p>
        <p style={{ margin: '10px 0', color: 'white' }}><strong>Nouvelle Fonction :</strong> <span style={{ color: '#22c55e' }}>{scObj.new_function || '-'}</span> <span style={{fontSize:'0.85rem', color:'rgba(255,255,255,0.5)'}}>(Salaire de base : {(agent.sc_base_new||0).toLocaleString('fr-FR')} FCFA)</span></p>
        <p style={{ margin: '10px 0', color: 'white' }}><strong>Date d'effet :</strong> {scObj.date ? scObj.date.split('-').reverse().join('/') : '-'}</p>
        <p style={{ margin: '10px 0', color: 'white' }}><strong>Motif :</strong> {scObj.reason || 'Non spécifié'}</p>
        
        <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize: '0.95rem' }}>Démonstration du calcul de salaire (Prorata)</h4>
          <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Le système répartit le salaire sur une base de 30 jours, en se basant sur les <strong>jours assignés</strong>. Les absences ne diminuent pas cette base de prorata, elles seront déduites lors du calcul final sur la fiche de paie.
          </p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', color: 'white', fontSize: '0.85rem' }}>
            <li><strong>Jours assignés ({scObj.old_function || 'Ancienne'}) :</strong> {agent.sc_assigned_days_old} jour(s) {(agent.sc_abs_old > 0) ? <span style={{color: '#f87171'}}>(dont {agent.sc_abs_old} non travaillés/absents)</span> : ''}</li>
            <li><strong>Jours assignés ({scObj.new_function || 'Nouvelle'}) :</strong> {agent.sc_assigned_days_new} jour(s) {(agent.sc_abs_new > 0) ? <span style={{color: '#f87171'}}>(dont {agent.sc_abs_new} non travaillés/absents)</span> : ''}</li>
            <li style={{ marginTop: '8px' }}><strong>Base Prorata ({scObj.old_function || 'Ancienne'}) :</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{agent.sc_active_days_old} jour(s) de salaire</span></li>
            <li><strong>Base Prorata ({scObj.new_function || 'Nouvelle'}) :</strong> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{agent.sc_active_days_new} jour(s) de salaire</span></li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollView({ setView }) {
  const { user } = useAuth();

  const sName = (user?.service || '').toLowerCase();
  const isAllowed =
    user?.role === 'admin' ||
    sName.includes('compta') ||
    sName.includes('rh') ||
    sName.includes('ressources humaines') ||
    (user?.permissions && user.permissions.can_view_salaries);

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const initialLoadRef = React.useRef(true);
  const [sites, setSites] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [archivesList, setArchivesList] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const isArchiveMode = viewMode === 'archives' && selectedArchive;
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [searchArchiveText, setSearchArchiveText] = useState('');
  const [statusChangeInfoModal, setStatusChangeInfoModal] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [selectedAgentPayrollDetails, setSelectedAgentPayrollDetails] = useState(null);

  const [loadedSites, setLoadedSites] = useState({});

  // Navigation: null = sites | {id, name} = zones | {siteId, zoneName} = agents
  const [activeSite, setActiveSite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_payroll_activeSite')) || null; } catch { return null; }
  });

  useEffect(() => {
    if (activeSite && activeSite.id && !isArchiveMode && !loading) {
      const siteKey = `${activeSite.id}_${period}`;
      if (!loadedSites.all && !loadedSites[siteKey]) {
        // Fetch detailed salaries for this site
        setLoading(true);
        apiCall('get_salaries', { period, scope: 'company' }, 'GET')
          .then(res => {
            if (Array.isArray(res)) {
              // get_salaries returns all agents for all sites, so we can replace the entire array
              setSalaries(res);
              setLoadedSites({ all: true });
            }
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      }
    }
  }, [activeSite, period, isArchiveMode, loadedSites, loading]);

  const [activeZone, setActiveZone] = useState(() => {
    return localStorage.getItem('pontage_payroll_activeZone') || null;
  });

  useEffect(() => {
    if (activeSite) localStorage.setItem('pontage_payroll_activeSite', JSON.stringify(activeSite));
    else localStorage.removeItem('pontage_payroll_activeSite');
  }, [activeSite]);

  useEffect(() => {
    if (activeZone) localStorage.setItem('pontage_payroll_activeZone', activeZone);
    else localStorage.removeItem('pontage_payroll_activeZone');
  }, [activeZone]);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState(null);

  const [modalConcept, setModalConcept] = useState(() => {
    return localStorage.getItem('pontage_payroll_modal_concept') || 'concept1';
  });

  useEffect(() => {
    localStorage.setItem('pontage_payroll_modal_concept', modalConcept);
  }, [modalConcept]);

  const [tableTheme, setTableTheme] = useState(() => {
    return localStorage.getItem('pontage_table_theme') || 'theme-floating';
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [selectedMutationDetails, setSelectedMutationDetails] = useState(null);
  const [showKPICards, setShowKPICards] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showAideModal, setShowAideModal] = useState(false);

  const [showClotureConfirmModal, setShowClotureConfirmModal] = useState(false);
  const [showClotureSuccessModal, setShowClotureSuccessModal] = useState(false);
  const [showClotureWarningModal, setShowClotureWarningModal] = useState(false);
  const [clotureLoading, setClotureLoading] = useState(false);
  const [clotureErrorMsg, setClotureErrorMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('pontage_table_theme', tableTheme);
  }, [tableTheme]);

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

  const formatPeriod = (p) => {
    if (!p) return '';
    const [y, m] = p.split('-');
    const date = new Date(y, parseInt(m) - 1, 1);
    const monthName = date.toLocaleString('fr-FR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  };

  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_payroll_statuses') || '{}'); }
    catch { return {}; }
  });
  const [payrollSettings, setPayrollSettings] = useState({});
  const [payrollVariables, setPayrollVariables] = useState({});

  const calculateTaxesCI = (brutImposable, parts) => {
    const baseIS = Math.round(brutImposable * 0.8);
    const IS = Math.round(baseIS * 0.012);
    let CN = 0;
    if (baseIS > 200000) CN = Math.round((baseIS - 200000) * 0.10 + 150000 * 0.05 + 80000 * 0.015);
    else if (baseIS > 130000) CN = Math.round((baseIS - 130000) * 0.05 + 80000 * 0.015);
    else if (baseIS > 50000) CN = Math.round((baseIS - 50000) * 0.015);
    const baseIGR = baseIS - IS - CN;
    const netBaseIGR = Math.round(baseIGR * 0.8);
    const Q = parts > 0 ? parts : 1;
    const quotient = netBaseIGR / Q;
    let IGR_part = 0;
    if (quotient > 841000) IGR_part = (quotient * 0.36) - 138060;
    else if (quotient > 348000) IGR_part = (quotient * 0.32) - 104420;
    else if (quotient > 227000) IGR_part = (quotient * 0.28) - 90500;
    else if (quotient > 126000) IGR_part = (quotient * 0.24) - 81420;
    else if (quotient > 81000) IGR_part = (quotient * 0.20) - 76380;
    else if (quotient > 45000) IGR_part = (quotient * 0.15) - 72330;
    else if (quotient > 25000) IGR_part = (quotient * 0.10) - 71080;
    let IGR = Math.max(0, Math.round(IGR_part * Q));
    return { IS, CN, IGR, total: IS + CN + IGR };
  };

  const getParts = (profile) => {
    let p = 1;
    const mat = (profile?.matrimonial || '').toLowerCase();
    if (mat === 'marié' || mat === 'mariée' || mat === 'marie') p = 2;
    p += Math.min((parseInt(profile?.children) || 0) * 0.5, 2.5);
    return p;
  };

  const getSeniorityBonus = (hireDateStr, base) => {
    if (!hireDateStr || !payrollSettings.enable_seniority) return 0;
    const diffYears = (new Date(period + '-01') - new Date(hireDateStr)) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears >= 2) return Math.round(base * (0.02 + Math.floor(diffYears - 2) * 0.01));
    return 0;
  };

  const calculateAgentTaxes = (s) => {
    const vars = payrollVariables[s.id] || { avance: 0, prime: 0 };
    const safeBase = Number(s.base) || 0;
    const safeGains = Number(s.gains) || 0;
    const safePrimeSite = Number(s.prime_site) || 0;
    const safeDeductions = Number(s.deductions) || 0;
    const primeAnciennete = payrollSettings.enable_seniority ? getSeniorityBonus(s.profile_data?.date_embauche || s.profile_data?.hire_date, safeBase) : 0;
    const primeVariable = payrollSettings.enable_sursalaire !== false ? (vars.prime || 0) : 0;
    
    // Réclamations Validées (Absences justifiées)
    const baseJournaliere = safeBase / ((s.profile_data?.special_service) ? (s.profile_data.special_service_base || 12) : 30);
    const joursAbsencesJustifiees = reclamations
      .filter(r => r.agent_nom === s.name && r.statut === 'Clôturé' && r.mois_concerne === period && r.type_erreur === 'Absence' && r.action_demandee === 'A payer')
      .reduce((acc, r) => acc + (parseInt(r.jours_concernes) || 0), 0);
    
    // On réduit les retenues d'absence du montant justifié
    const deductionsAjustees = Math.max(0, safeDeductions - Math.round(joursAbsencesJustifiees * baseJournaliere));
    
    // Le brut intègre l'ancienneté et le sursalaire en plus de la base, gains et prime site
    const brut = Math.max(0, safeBase - deductionsAjustees + safeGains + safePrimeSite + primeAnciennete + primeVariable);
    
    const cnpsSalarial = payrollSettings.enable_cnps_salarial !== false ? Math.round(brut * ((payrollSettings.cnps_salarial || 6.3) / 100)) : 0;
    const cmuEmploye = payrollSettings.enable_cmu_employe !== false ? (payrollSettings.cmu_amount || 500) : 0;
    
    // Patronales
    const cnpsPatronal = payrollSettings.enable_cnps_patronal !== false ? Math.round(brut * ((payrollSettings.cnps_patronal || 7.7) / 100)) : 0;
    const cmuEmployeur = payrollSettings.enable_cmu_employeur !== false ? (payrollSettings.cmu_amount || 500) : 0;
    const accidentsTravail = payrollSettings.enable_accidents_travail !== false ? Math.round(brut * ((payrollSettings.accidents_travail || 2.0) / 100)) : 0;
    const taxeFormation = payrollSettings.enable_fdfp !== false ? Math.round(brut * ((payrollSettings.taxe_formation || 0.6) / 100)) : 0;
    const taxeApprentissage = payrollSettings.enable_taxe_apprentissage !== false ? Math.round(brut * ((payrollSettings.taxe_apprentissage || 0.4) / 100)) : 0;
    
    let impotsTaxes = 0;
    if (payrollSettings.enable_its !== false) {
      if (payrollSettings.tax_mode === 'reel_ci') {
        const taxRes = calculateTaxesCI(brut - cnpsSalarial, getParts(s.profile_data || {}));
        impotsTaxes = taxRes.total;
      } else {
        impotsTaxes = Math.round((brut - cnpsSalarial) * ((payrollSettings.its || 1.2) / 100));
      }
    }
    const totalRetenuesFiscales = cnpsSalarial + impotsTaxes + cmuEmploye;
    const avances = payrollSettings.enable_avances !== false ? (vars.avance || 0) : 0;
    const remboursementsPrets = (s.remboursement_pret || 0);
    const totalDeductionsNettes = avances + remboursementsPrets;
    const netAPayer = Math.max(0, brut - totalRetenuesFiscales - totalDeductionsNettes);
    return { 
      primeAnciennete, primeVariable, brut, cnpsSalarial, cmuEmploye, impotsTaxes, 
      accidentsTravail, taxeFormation, taxeApprentissage, cnpsPatronal, cmuEmployeur, 
      avances, remboursementsPrets, totalDeductionsNettes, netAPayer 
    };
  };

  const saveStatuses = (s) => {
    setStatuses(s);
    localStorage.setItem('pontage_payroll_statuses', JSON.stringify(s));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, salRes, funcRes, pubRes, settingsRes, varsRes, reclamRes] = await Promise.all([
        apiCall('get_sites', { scope: 'company' }, 'GET'),
        apiCall('get_salaries', { period, scope: 'company' }, 'GET'),
        apiCall('get_functions', { scope: 'company' }, 'GET'),
        apiCall('get_published_periods', { scope: 'company' }, 'GET'),
        apiCall('get_payroll_settings', { scope: 'company' }, 'GET'),
        apiCall('get_payroll_variables', { period, scope: 'company' }, 'GET'),
        apiCall('get_reclamations', { scope: 'company' }, 'GET')
      ]);
      if (Array.isArray(sitesRes)) setSites(sitesRes);
      if (Array.isArray(salRes)) { setSalaries(salRes); setLoadedSites({ all: true }); }
      else if (salRes && salRes.salaries) { setSalaries(salRes.salaries); setLoadedSites({ all: true }); }
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (settingsRes?.success) setPayrollSettings(settingsRes.settings || {});
      if (varsRes?.success) setPayrollVariables(varsRes.variables || {});
      if (reclamRes?.success && Array.isArray(reclamRes.reclamations)) setReclamations(reclamRes.reclamations);
      if (pubRes?.success) {
        const pubs = pubRes.published_periods || [];
        const archs = pubRes.archived_periods || [];
        setPublishedPeriods(pubs);
        setArchivedPeriods(archs);
        
        // Auto-jump to the latest publication on initial load, or if the current period is entirely missing
        if (pubs.length > 0) {
          const exactLatest = pubRes.latest_publication?.period;
          const targetPeriod = exactLatest && pubs.includes(exactLatest) ? exactLatest : [...pubs].sort().reverse()[0];
          
          if (initialLoadRef.current) {
             setPeriod(targetPeriod);
             initialLoadRef.current = false;
          } else if (!pubs.includes(period) && !archs.includes(period)) {
            // Check if period is exactly one month after the latest known period
            const allKnown = [...pubs, ...archs].sort().reverse();
            const latestKnown = allKnown.length > 0 ? allKnown[0] : null;
            let isNextMonthReady = false;
            if (latestKnown) {
               const [y, m] = latestKnown.split('-');
               const d = new Date(parseInt(y), parseInt(m), 1);
               const nextKnownStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
               if (period === nextKnownStr) isNextMonthReady = true;
            }
            
            if (!isNextMonthReady && targetPeriod) {
               setPeriod(targetPeriod);
            }
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAllowed) loadData(); }, [period]);

  const activeSalaries = isArchiveMode ? (archiveDetail?.salaries || []) : salaries;
  const activeStatuses = isArchiveMode ? (archiveDetail?.statuses || {}) : statuses;

  // Déterminer la liste des sites à afficher et leur ordre
  const activeSites = React.useMemo(() => {
    if (isArchiveMode && archiveDetail?.sites) {
      // En mode archive, on prend l'ordre historique figé dans l'archive
      return archiveDetail.sites.map(s => ({ id: s.id, name: s.name }));
    }
    // En mode actuel, on filtre pour ne garder que les sites ayant des agents (pointages) pour la période
    const sitesWithAgents = sites.filter(site => {
      const cleanSiteName = (site.name || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
      return activeSalaries.some(s => {
        const cleanSalarySite = (s.site || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
        return cleanSalarySite === cleanSiteName;
      });
    });
    // Puis on trie avec l'ordre du localStorage (celui du Dashboard)
    const siteOrder = JSON.parse(localStorage.getItem('pontage_site_order') || '[]');
    return sitesWithAgents.sort((a, b) => {
      const idxA = siteOrder.indexOf(a.id);
      const idxB = siteOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [sites, isArchiveMode, archiveDetail, user?.service_id, activeSalaries]);

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
    const total = agents.reduce((acc, s) => acc + calculateAgentTaxes(s).netAPayer, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'valide').length;
    const zones = zonesForSite(site.name).length;
    return { agentsCount: agents.length, total, paid, validated, zones };
  };

  // Résumé par zone
  const zoneSummary = (siteId, siteName, zoneName) => {
    const agents = agentsForZone(siteName, zoneName);
    const total = agents.reduce((acc, s) => acc + calculateAgentTaxes(s).netAPayer, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'valide').length;
    return { agentsCount: agents.length, total, paid, validated };
  };

  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_payroll_archives', { scope: 'company' }, 'GET');
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
          const res = await apiCall(`get_payroll_archive_detail&period=${selectedArchive}&scope=company`, {}, 'GET');
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
      const res = await apiCall('archive_payroll', { period, salaries, statuses, sites: activeSites, scope: 'company' }, 'POST');
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

  const handleClotureFluctuation = () => {
    if (globalProgress < 100) {
      setShowClotureWarningModal(true);
      return;
    }
    setShowClotureConfirmModal(true);
  };

  const handleClotureFluctuationConfirm = async () => {
    setClotureLoading(true);
    setClotureErrorMsg('');
    try {
      const cData = await apiCall('get_compta_data', { period }, 'GET');
      let ca = 0;
      if (cData.success && cData.subsite_contracts) {
        ca = Object.values(cData.subsite_contracts).flat().reduce((acc, r) => acc + Number(r.quantite || 0) * Number(r.montant_unitaire || 0), 0);
      }
      
      let ms_admin = 0;
      let ms_agents = 0;
      let admin_count = 0;
      let agents_count = 0;
      salaries.forEach(s => {
        const taxes = calculateAgentTaxes(s);
        const net = taxes.netAPayer;
        if (s.site && s.site.toLowerCase().includes('administration')) {
          ms_admin += net;
          admin_count++;
        } else {
          ms_agents += net;
          agents_count++;
        }
      });
      
      const res = await apiCall('close_payroll_fluctuation', {
        period,
        chiffre_affaire: ca,
        ms_admin,
        ms_agents,
        admin_count,
        agents_count
      }, 'POST');
      
      // -- AJOUT : Archiver automatiquement le Journal en même temps --
      const archRes = await apiCall('archive_payroll', { period, salaries, statuses, sites: activeSites, scope: 'company' }, 'POST');
      if (archRes?.success) {
        setArchivedPeriods(prev => [...prev, period]);
        fetchArchives();
      }
      
      if (res?.success) {
        setShowClotureConfirmModal(false);
        
        // Préparer l'onglet "Actuel" pour le mois suivant
        let [y, m] = period.split('-');
        let nextDate = new Date(parseInt(y), parseInt(m), 1);
        let nextPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
        
        // On ne contraint pas nextPeriod par rapport au système ici, on fait confiance à l'avancement naturel de 1 mois.
        
        setPeriod(nextPeriod);
        setActiveSite(null);
        setActiveZone(null);
        
        // On redirige vers CALCUL SALAIRES pour afficher le Journal de la période clôturée
        localStorage.setItem('pontage_target_period', period);
        if (typeof setView === 'function') {
          setView('calcul_salaires');
        } else {
          setShowClotureSuccessModal(true);
        }
      } else {
        setClotureErrorMsg(res?.message || 'Erreur lors de la clôture.');
      }
    } catch (e) {
      setClotureErrorMsg('Erreur réseau lors de la clôture.');
    } finally {
      setClotureLoading(false);
    }
  };

  const ClotureModals = () => (
    <>
      {showClotureConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertCircle size={40} style={{ color: '#38bdf8' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800 }}>Confirmer la clôture</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              Voulez-vous clôturer l'état de paie de <strong style={{ color: 'white' }}>{formatPeriod(period)}</strong> pour le module Fluctuation Salariale ?
            </p>
            {clotureErrorMsg && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{clotureErrorMsg}</div>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowClotureConfirmModal(false)} className="btn btn-secondary" disabled={clotureLoading} style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Annuler</button>
              <button onClick={handleClotureFluctuationConfirm} className="btn btn-primary" disabled={clotureLoading} style={{ flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {clotureLoading ? <Loader2 size={20} className="animate-spin" /> : 'Oui, clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showClotureSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(34,197,94,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>Clôture réussie</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              La clôture de <strong style={{ color: 'white' }}>{formatPeriod(period)}</strong> a été enregistrée avec succès pour la Fluctuation Salariale.
            </p>
            <button onClick={() => setShowClotureSuccessModal(false)} className="btn btn-success" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700 }}>Compris</button>
          </div>
        </div>
      )}
      {showClotureWarningModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertCircle size={40} style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>Clôture prématurée</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              Il reste encore des sites à traiter. Veuillez vous assurer que la progression de tous les sites affichés est à 100% avant de clôturer.
            </p>
            <button onClick={() => setShowClotureWarningModal(false)} className="btn btn-secondary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>Retour au traitement</button>
          </div>
        </div>
      )}
    </>
  );

  const isPeriodPublished = publishedPeriods.includes(period);

  const calculateGlobalProgress = () => {
    if (!activeSites || activeSites.length === 0) return 0;
    let all100 = true;
    let hasAgents = false;
    activeSites.forEach(site => {
      const summary = siteSummary(site);
      if (summary.agentsCount > 0) {
        hasAgents = true;
        const progress = Math.round((summary.paid / summary.agentsCount) * 100);
        if (progress < 100) all100 = false;
      }
    });
    return (all100 && hasAgents) ? 100 : 0;
  };
  const globalProgress = calculateGlobalProgress();

  const BackBtn = ({ onClick, label = 'Retour' }) => (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <ChevronLeft size={18} /> {label}
    </button>
  );

  const allPeriodsKnown = [...publishedPeriods, ...archivedPeriods, period];
  let limitPeriod = null;
  if (allPeriodsKnown.length > 0) {
    const highest = allPeriodsKnown.sort().reverse()[0];
    let [y, m] = highest.split('-');
    let d = new Date(parseInt(y), parseInt(m), 1); // next month
    limitPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const PeriodSelect = () => (
    <select className="form-input" style={{ background: 'rgba(0,0,0,0.3)', minWidth: '180px' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
      {getPeriodsList(period, limitPeriod).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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

  // ─── CHARGEMENT GLOBAL ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Chargement des données de l'état de paie...</p>
      </div>
    );
  }

  // ─── VUE ARCHIVES (Liste) ───────────────────────────────────────────
  if (viewMode === 'archives' && !selectedArchive) {
    const normalizeString = (str) => {
      if (!str) return "";
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredArchives = archivesList.filter(a => {
      let monthLabel = a.period;
      if (a.period.includes('-')) {
         const [y, m] = a.period.split('-');
         const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
         monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      const searchable = `${a.period} ${monthLabel} ${a.archived_by} ${a.archived_at}`;
      return normalizeString(searchable).includes(normalizeString(searchArchiveText));
    });

    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Titre à gauche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem', margin: 0, whiteSpace: 'nowrap' }}>Archives de Paie</h2>
          </div>
          
          {/* Recherche centrée et élargie */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', width: '100%', maxWidth: '600px', gap: '10px', transition: 'all 0.2s' }}>
              <Search size={20} style={{ color: 'var(--muted)' }} />
              <input 
                type="text" 
                placeholder="Rechercher une archive (mois, année, auteur)..." 
                value={searchArchiveText}
                onChange={e => setSearchArchiveText(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          {/* Onglets à droite */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <ModeTabs />
          </div>
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
                  {filteredArchives.map((a, i) => {
                    let monthLabel = a.period;
                    if (a.period.includes('-')) {
                       const [y, m] = a.period.split('-');
                       const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
                       monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                       monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                    }
                    
                    let dateLabel = a.archived_at;
                    if (dateLabel && dateLabel.includes('-')) {
                       // format from YYYY-MM-DD HH:MM:SS to DD/MM/YYYY HH:MM:SS
                       const parts = dateLabel.split(' ');
                       if (parts.length > 0) {
                          const dateParts = parts[0].split('-');
                          if (dateParts.length === 3) {
                             dateLabel = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}${parts[1] ? ' ' + parts[1] : ''}`;
                          }
                       }
                    }

                    return (
                      <tr key={a.period || `archive-${i}`}>
                        <td style={{ fontWeight: '700', color: 'white' }}>{monthLabel}</td>
                        <td>{dateLabel}</td>
                        <td>{a.archived_by}</td>
                        <td>
                          <button onClick={() => setSelectedArchive(a.period)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isPeriodArchived = archivedPeriods.includes(period);

  // ─── BLOCAGE SI CLOTURÉ / ARCHIVÉ (Seulement en Actuel) ──────────────────────
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
            <button className="btn btn-secondary" onClick={() => setShowAideModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Aide Comptable
            </button>
            <PeriodSelect />
            <ModeTabs />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', marginTop: '24px' }} className="glass-panel">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Lock size={40} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Période Clôturée</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '480px', lineHeight: '1.6' }}>
            L'état de paie de <strong>{formatPeriod(period)}</strong> a été définitivement clôturé par la Comptabilité.<br/>
            Il n'est plus modifiable. Veuillez basculer vers l'onglet <strong>Archives</strong> pour le consulter.
          </p>
          <button className="btn btn-primary" onClick={() => { setViewMode('archives'); setSelectedArchive(period); }} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={18} /> Consulter l'Archive
          </button>
        </div>
        {showAideModal && <AideComptableModal onClose={() => setShowAideModal(false)} />}
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
            <button className="btn btn-secondary" onClick={() => setShowAideModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Aide Comptable
            </button>
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
        {showAideModal && <AideComptableModal onClose={() => setShowAideModal(false)} />}
      </div>
    );
  }

  // ─── VUE 3 : Agents d'une Zone ───────────────────────────────────────────────
  if (activeSite && activeZone) {
    const agents = agentsForZone(activeSite.name, activeZone);
    const totalNet = agents.reduce((acc, s) => acc + calculateAgentTaxes(s).netAPayer, 0);
    // toggleRow removed
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        {showTopBar ? (
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
            <button className="btn btn-secondary" onClick={() => setShowAideModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Aide Comptable
            </button>
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => {
              let csv = "data:text/csv;charset=utf-8,\uFEFFNom,Poste,Jours Trav,Absences,MAP,Perm.,Base,Retenues,Gains,Remb. Prêt,Net,Statut\n";
              agents.forEach(s => {
                const stLabel = STATUSES[getAgentStatus(s.name, activeSite.id, activeZone)]?.label || '';
                csv += `"${s.name}","${funcLabel(s.function)}",${s.days_worked ?? (30 - s.absences - (s.map_count||0) - (s.entrant_sortant_count||0))},${s.absences},${s.map_count||0},${s.permission_count||0},${s.base},${s.deductions},${s.gains},${s.remboursement_pret||0},${s.total},"${stLabel}"\n`;
              });
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csv));
              link.setAttribute("download", `paie_${activeSite.name}_${activeZone}_${period}.csv`.replace(/ /g, '_'));
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--border)' }}>
              <ReceiptText size={16} /> Exporter CSV
            </button>
            <button className="btn btn-secondary" onClick={() => setIsThemeModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> Thème
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> Imprimer
            </button>
            <button 
              className="btn" 
              style={{ background: showKPICards ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', color: showKPICards ? '#818cf8' : 'white', border: `1px solid ${showKPICards ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} 
              onClick={() => setShowKPICards(!showKPICards)} 
              title="Afficher/Masquer les statistiques KPI"
            >
              <TrendingUp size={16} /> 
              <span style={{ fontSize: '0.85rem' }}>{showKPICards ? 'Masquer KPI' : 'Voir KPI'}</span>
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowTopBar(false)} 
              title="Masquer l'en-tête"
              style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronUp size={16} />
            </button>
          </div>
        </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', marginTop: '-10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowTopBar(true)} 
              title="Afficher l'en-tête"
              style={{ padding: '4px 20px', borderRadius: '0 0 12px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, position: 'relative' }}
            >
              <ChevronDown size={16} />
            </button>
          </div>
        )}

        {/* Résumé de la zone */}
        {showKPICards && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', margin: '20px 0', width: '100%' }}>
          {[
            { label: 'Agents', value: agents.length, color: '#38bdf8', icon: Users },
            { label: 'Brouillons', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'brouillon').length, color: '#94a3b8', icon: Clock },
            { label: 'Validés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'valide').length, color: '#38bdf8', icon: BadgeCheck },
            { label: 'Payés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'paye').length, color: '#22c55e', icon: Wallet },
            { label: 'MAP', value: agents.reduce((a, s) => a + (s.map_count || 0), 0), color: '#f97316', icon: AlertCircle },
            { isLink: true, label: 'Consulter Pointage', color: '#a855f7', icon: Clock }
          ].map((item, idx) => {
            if (item.isLink) {
              return (
                <div key={item.label} className="glass-panel" 
                  onClick={() => {
                     let finalSiteId = activeSite.id;
                     if (!finalSiteId || finalSiteId === 'null' || finalSiteId === 'undefined') {
                       const cleanActiveName = (activeSite.name || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
                       const found = sites.find(s => (s.name || '').replace(/^[\p{Emoji}\s]+/u, '').trim() === cleanActiveName);
                       if (found) finalSiteId = found.id;
                     }
                     if (!finalSiteId || finalSiteId === 'null' || finalSiteId === 'undefined') {
                       alert("Erreur critique : Impossible de déterminer l'identifiant de ce site. Veuillez resélectionner le site dans la grille.");
                       setActiveSite(null);
                       return;
                     }
                     localStorage.setItem('pontage_activeSiteId', finalSiteId);
                     localStorage.setItem('pontage_activeSiteName', activeSite.name);
                     localStorage.setItem('pontage_period', period);
                     localStorage.setItem('pontage_searchTerm', activeZone);
                     if (typeof setView === 'function') setView('verification');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', cursor: 'pointer', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', transition: 'all 0.2s', borderRadius: '12px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(168,85,247,0.2)'; e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; }}
                >
                  <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.90rem', fontWeight: 800, margin: 0, color: 'white', textTransform: 'uppercase' }}>{item.label}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>Aller au traitement</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={item.label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
                <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>{item.value}</h4>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {agents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune donnée de salaire disponible.<br />Calculez d'abord les salaires dans le module "Calcul Salaires".</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '0 8px 16px 8px', margin: '0 -10px' }}>
            <div className="table-container" style={{ paddingBottom: '30px', resize: 'vertical', minHeight: '300px', height: 'calc(100vh - 280px)', maxHeight: 'none' }}>
              <table className={`custom-table ${tableTheme}`}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ color: 'white' }}>Nom & Prénom</th>
                    <th style={{ color: 'white' }}>Poste</th>
                    <th style={{ textAlign: 'center', color: 'white' }}>Jours Trav.</th>
                    <th style={{ textAlign: 'center', minWidth: '180px', color: 'var(--danger)' }}>Absences</th>
                    <th style={{ textAlign: 'center', color: 'var(--danger)', minWidth: '180px' }}>MAP</th>
                    <th style={{ textAlign: 'center', color: '#8b5cf6', minWidth: '180px' }}>Permission</th>
                    <th style={{ textAlign: 'right', color: 'white' }}>Base (XOF)</th>
                    <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Retenues</th>
                    <th style={{ textAlign: 'right', color: '#22c55e' }}>Prime Site</th>
                    <th style={{ textAlign: 'right', color: 'var(--b)' }}>Suppl.</th>
                    <th style={{ textAlign: 'right', color: '#a855f7' }}>Ancienneté</th>
                    {payrollSettings.enable_sursalaire !== false ? <th style={{ textAlign: 'right', color: '#38bdf8' }}>Sursalaire</th> : null}
                    <th style={{ textAlign: 'right', color: 'white' }}>Brut</th>
                    {payrollSettings.enable_cnps_salarial !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>CNPS Sal.</th> : null}
                    {payrollSettings.enable_cmu_employe !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>CMU Sal.</th> : null}
                    {payrollSettings.enable_its !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>ITS</th> : null}
                    {payrollSettings.enable_cnps_patronal !== false ? <th style={{ textAlign: 'right', color: '#f59e0b' }}>CNPS Pat.</th> : null}
                    {payrollSettings.enable_cmu_employeur !== false ? <th style={{ textAlign: 'right', color: '#f59e0b' }}>CMU Pat.</th> : null}
                    {payrollSettings.enable_accidents_travail !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Acc. Trav.</th> : null}
                    {payrollSettings.enable_fdfp !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>FDFP</th> : null}
                    {payrollSettings.enable_taxe_apprentissage !== false ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Taxe Appr.</th> : null}
                    <th style={{ textAlign: 'right', color: '#f43f5e' }}>Av/Prêts</th>
                    <th style={{ textAlign: 'center', color: '#06b6d4', minWidth: '180px' }}>Congés</th>
                    <th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                   {agents.map((s, idx) => {
                    const status = getAgentStatus(s.name, activeSite.id, activeZone);
                    const st = STATUSES[status];
                    return (
                      <React.Fragment key={s.id || s.name || `agent-${idx}`}>
                        <tr className={status === 'paye' ? 'row-paye' : ''}>
                          <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentPayrollDetails(s); }}
                                title="Voir la fiche détaillée & synthèse de paie"
                                style={{
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  borderRadius: '6px',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  padding: '3px 7px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'; e.currentTarget.style.color = '#ffffff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'; e.currentTarget.style.color = '#38bdf8'; }}
                              >
                                <Eye size={15} />
                              </button>
                              <span 
                                style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                onClick={() => setSelectedAgentPayrollDetails(s)}
                                title="Voir le profil complet de l'agent"
                              >{s.name}</span>
                            </div>
                          </td>
                          <td style={{ cursor: s.profile_data?.mutation_breakdown ? 'pointer' : (s.status_change ? 'pointer' : 'default') }} onClick={() => {
                            if (s.profile_data?.mutation_breakdown) {
                              setSelectedMutationDetails({agent: s, details: s.profile_data.mutation_breakdown});
                            } else if (s.status_change) {
                              setStatusChangeInfoModal(s);
                            }
                          }}>
                            {(() => {
                              const scObj = s.status_change ? (typeof s.status_change === 'string' ? JSON.parse(s.status_change) : s.status_change) : null;
                              if (scObj) {
                                return (
                                  <span onClick={(e) => { e.stopPropagation(); setStatusChangeInfoModal(s); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(234,179,8,0.06)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem', transition: 'all 0.2s', border: '1px solid rgba(234,179,8,0.3)', cursor: 'pointer' }} title="Cliquez pour voir les détails du changement de statut">
                                    <span style={{ color: '#ef4444' }}>{scObj.old_function || '-'}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>/</span>
                                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{scObj.new_function || '-'}</span>
                                  </span>
                                );
                              } else if (s.profile_data && s.profile_data.mutated_from_function && s.profile_data.mutated_from_function !== s.function) {
                                return (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56,189,248,0.06)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem', transition: 'all 0.2s', border: s.profile_data.mutation_breakdown ? '1px solid rgba(56,189,248,0.3)' : 'none' }} title={s.profile_data.mutation_breakdown ? "Cliquez pour voir les détails de mutation" : ""}>
                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.profile_data.mutated_from_function}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>/</span>
                                    <span style={{ color: '#f87171', fontWeight: 700 }}>{funcLabel(s.function)}</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span style={{ background: 'rgba(56,189,248,0.1)', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem' }}>
                                    {funcLabel(s.function)}
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td 
                            style={{ 
                              textAlign: 'center', 
                              fontWeight: '600', 
                              color: 'white',
                              cursor: s.profile_data?.mutation_breakdown ? 'pointer' : 'default',
                            }}
                            onClick={(e) => {
                              if (s.profile_data?.mutation_breakdown) {
                                e.stopPropagation();
                                setSelectedMutationDetails({agent: s, details: s.profile_data.mutation_breakdown});
                              }
                            }}
                            title={s.profile_data?.mutation_breakdown ? "Voir les détails de mutation" : ""}
                          >
                            <span style={{ borderBottom: s.profile_data?.mutation_breakdown ? '1px dashed rgba(56,189,248,0.8)' : 'none', paddingBottom: '2px', color: s.profile_data?.mutation_breakdown ? '#38bdf8' : 'white' }}>
                              {s.days_worked ?? (30 - (s.absences||0) - (s.map_count||0) - (s.entrant_sortant_count||0))}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--danger)' }}>
                                {s.absences > 0 ? s.absences : '—'}
                              </span>
                              {s.absences > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentDetails(s); }}
                                  title="Voir les jours d'absence"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--danger)' }}>
                                {(s.map_count||0) > 0 ? s.map_count : '—'}
                              </span>
                              {(s.map_count||0) > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentDetails(s); }}
                                  title="Voir les jours de mise à pied"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(249,115,22,0.7)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <span style={{ color: (s.permission_count||0) > 0 ? '#8b5cf6' : 'var(--muted)' }}>
                                {(s.permission_count||0) > 0 ? s.permission_count : '—'}
                              </span>
                              {(s.permission_count||0) > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentDetails(s); }}
                                  title="Voir les jours de permission"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(139,92,246,0.7)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', color: 'white' }}>{((s.base_full || s.base) || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: s.deductions > 0 ? 'var(--danger)' : 'var(--muted)' }}>{s.deductions > 0 ? `-${(s.deductions||0).toLocaleString()}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: (s.prime_site||0) > 0 ? '700' : '400' }}>{(s.prime_site||0) > 0 ? `+${(s.prime_site||0).toLocaleString()}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: s.gains > 0 ? '#8b5cf6' : 'var(--muted)', fontWeight: s.gains > 0 ? '700' : '400' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <span>{s.gains > 0 ? `+${(s.gains||0).toLocaleString()}` : '—'}</span>
                              {s.gains > 0 && s.sp_details && s.sp_details.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentDetails(s); }}
                                  title="Voir les jours supplémentaires"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(56,189,248,0.7)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', color: '#a855f7' }}>+{calculateAgentTaxes(s).primeAnciennete.toLocaleString()}</td>
                          {payrollSettings.enable_sursalaire !== false ? (<td style={{ textAlign: 'right', color: '#38bdf8' }}>+{calculateAgentTaxes(s).primeVariable.toLocaleString()}</td>) : null}
                          <td style={{ textAlign: 'right', color: 'white', fontWeight: 'bold' }}>{calculateAgentTaxes(s).brut.toLocaleString()}</td>
                          {payrollSettings.enable_cnps_salarial !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).cnpsSalarial.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cmu_employe !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).cmuEmploye.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_its !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).impotsTaxes.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cnps_patronal !== false ? (<td style={{ textAlign: 'right', color: '#f59e0b' }}>+{calculateAgentTaxes(s).cnpsPatronal.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cmu_employeur !== false ? (<td style={{ textAlign: 'right', color: '#f59e0b' }}>+{calculateAgentTaxes(s).cmuEmployeur.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_accidents_travail !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).accidentsTravail.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_fdfp !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).taxeFormation.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_taxe_apprentissage !== false ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).taxeApprentissage.toLocaleString()}</td>) : null}
                          <td style={{ textAlign: 'right', color: calculateAgentTaxes(s).totalDeductionsNettes > 0 ? '#f43f5e' : 'var(--muted)', fontWeight: calculateAgentTaxes(s).totalDeductionsNettes > 0 ? '700' : '400' }}>{calculateAgentTaxes(s).totalDeductionsNettes > 0 ? `-${calculateAgentTaxes(s).totalDeductionsNettes.toLocaleString()}` : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <span style={{ color: (s.cp_count||0) > 0 ? '#06b6d4' : 'var(--muted)' }}>
                                {(s.cp_count||0) > 0 ? s.cp_count : '—'}
                              </span>
                              {(s.cp_count||0) > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedAgentDetails(s); }}
                                  title="Voir les jours de congé payé"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(6,182,212,0.7)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.05rem' }}>{calculateAgentTaxes(s).netAPayer.toLocaleString()}</td>
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
                        {/* expanded row removed */}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)', borderTop: '2px solid #22c55e', borderBottom: '1px solid #22c55e' }}>
                    <td colSpan={7} style={{ fontWeight: '800', padding: '16px 16px', color: '#22c55e', fontSize: '0.95rem' }}>TOTAL ZONE</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#22c55e' }}>{agents.reduce((a, s) => a + (s.base_full || s.base || 0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (s.deductions||0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#a855f7' }}>+{agents.reduce((a, s) => a + (s.prime_site||0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#38bdf8' }}>+{agents.reduce((a, s) => a + (s.gains||0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#a855f7' }}>+{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.primeAnciennete||0), 0).toLocaleString()}</td>
                    {payrollSettings.enable_sursalaire !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#38bdf8' }}>+{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.primeVariable||0), 0).toLocaleString()}</td>) : null}
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#22c55e' }}>{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.brut||0), 0).toLocaleString()}</td>
                    {payrollSettings.enable_cnps_salarial !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.cnpsSalarial||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_cmu_employe !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.cmuEmploye||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_its !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.impotsTaxes||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_cnps_patronal !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#f59e0b' }}>+{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.cnpsPatronal||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_cmu_employeur !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#f59e0b' }}>+{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.cmuEmployeur||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_accidents_travail !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.accidentsTravail||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_fdfp !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.taxeFormation||0), 0).toLocaleString()}</td>) : null}
                    {payrollSettings.enable_taxe_apprentissage !== false ? (<td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.taxeApprentissage||0), 0).toLocaleString()}</td>) : null}
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#f43f5e' }}>-{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.totalDeductionsNettes||0), 0).toLocaleString()}</td>
                    <td></td> {/* Colonne Congés */}
                    <td style={{ textAlign: 'right', fontWeight: '900', color: '#22c55e', fontSize: '1.2rem' }}>{agents.reduce((a, s) => a + (calculateAgentTaxes(s)?.netAPayer||0), 0).toLocaleString()} XOF</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        {isThemeModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsThemeModalOpen(false)}>
            <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', width: '450px', maxWidth: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'white' }}>Choisir un Thème</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'theme-floating', name: 'Lignes Flottantes' },
                  { id: 'theme-minimalist', name: 'Minimaliste' },
                  { id: 'theme-neon', name: 'Néon Cyberpunk' },
                  { id: 'theme-striped', name: 'Zébré Moderne' },
                  { id: 'theme-dark-grid', name: 'Grille Excel' },
                  { id: 'theme-glass', name: 'Glassmorphism' },
                  { id: 'theme-bubbles', name: 'Bulles Douces' },
                  { id: 'theme-high-contrast', name: 'Haute Contraste' },
                  { id: 'theme-ethereal', name: 'Lignes Éthérées' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTableTheme(t.id); setIsThemeModalOpen(false); }}
                    style={{
                      padding: '12px', background: tableTheme === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid', borderColor: tableTheme === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                      textAlign: 'left', fontWeight: tableTheme === t.id ? '700' : '500'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={() => setIsThemeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px 16px' }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
        <AgentPayrollDetailsModal agent={selectedAgentPayrollDetails} taxes={selectedAgentPayrollDetails ? calculateAgentTaxes(selectedAgentPayrollDetails) : {}} funcLabel={funcLabel} payrollSettings={payrollSettings} onClose={() => setSelectedAgentPayrollDetails(null)} />
        <AgentDetailsModal agent={selectedAgentDetails} onClose={() => setSelectedAgentDetails(null)} />
        <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
        <StatusChangeInfoModalComponent agent={statusChangeInfoModal} onClose={() => setStatusChangeInfoModal(null)} />
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ─── VUE 2 : Zones d'un Site ─────────────────────────────────────────────────
  if (activeSite) {
    const zones = zonesForSite(activeSite.name);
    const allAgents = agentsForSite(activeSite.name);
    const totalSite = allAgents.reduce((a, s) => a + calculateAgentTaxes(s).netAPayer, 0);

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
              <>
                <button className="btn btn-primary" onClick={handleClotureFluctuation} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} title="Clôturer l'état de paie pour la fluctuation salariale">
                  <CheckCircle2 size={16} /> Clôturer
                  {globalProgress === 100 && (
                    <span style={{
                      position: 'absolute', top: '-15px', right: '-10px', fontSize: '1.4rem',
                      animation: 'blinkFinger 1.2s infinite'
                    }}>👇</span>
                  )}
                </button>
                <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Archive size={16} /> Archiver l'état de paie
                </button>
              </>
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

        {/* Stats du site (Removed as requested by user on Payroll interface) */}

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
        <AgentDetailsModal agent={selectedAgentDetails} onClose={() => setSelectedAgentDetails(null)} />
        <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
        <ClotureModals />
        {showAideModal && <AideComptableModal onClose={() => setShowAideModal(false)} />}
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
            <>
              <button className="btn btn-primary" onClick={handleClotureFluctuation} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} title="Clôturer l'état de paie pour la fluctuation salariale">
                <CheckCircle2 size={16} /> Clôturer
                {globalProgress === 100 && (
                  <span style={{
                    position: 'absolute', top: '-15px', right: '-10px', fontSize: '1.4rem',
                    animation: 'blinkFinger 1.2s infinite'
                  }}>👇</span>
                )}
              </button>
              <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={16} /> Archiver l'état de paie
              </button>
            </>
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
            {activeSites.map((site, idx) => {
              const { agentsCount, total, paid, validated, zones } = siteSummary(site);
              const progress = agentsCount > 0 ? Math.round((paid / agentsCount) * 100) : 0;
              const isAllPaid = agentsCount > 0 && paid === agentsCount;
              const isAllValidatedOrPaid = agentsCount > 0 && (validated + paid === agentsCount) && !isAllPaid;

              let cardBg = '';
              let cardBorderColor = 'var(--border)';
              let cardHoverBorderColor = 'rgba(56,189,248,0.4)';
              let cardHoverShadow = '0 12px 30px -10px rgba(56,189,248,0.3)';
              let radialGradientColor = 'rgba(56,189,248,0.15)';
              let iconBgColor = 'rgba(56,189,248,0.12)';
              let iconColor = 'var(--b)';

              if (isAllPaid) {
                cardBg = 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)';
                cardBorderColor = 'rgba(34,197,94,0.3)';
                cardHoverBorderColor = 'rgba(34,197,94,0.7)';
                cardHoverShadow = '0 12px 30px -10px rgba(34,197,94,0.4)';
                radialGradientColor = 'rgba(34,197,94,0.2)';
                iconBgColor = 'rgba(34,197,94,0.2)';
                iconColor = '#22c55e';
              } else if (isAllValidatedOrPaid) {
                cardBg = 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.02) 100%)';
                cardBorderColor = 'rgba(56,189,248,0.4)';
                cardHoverBorderColor = 'rgba(56,189,248,0.8)';
                cardHoverShadow = '0 12px 30px -10px rgba(56,189,248,0.5)';
                radialGradientColor = 'rgba(56,189,248,0.25)';
                iconBgColor = 'rgba(56,189,248,0.2)';
                iconColor = '#38bdf8';
              }

              return (
                <div
                  key={site.id}
                  onClick={() => setActiveSite({ id: site.id, name: site.name })}
                  className="glass-panel"
                  style={{ cursor: 'pointer', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.4s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0, background: cardBg || undefined, borderColor: cardBorderColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = cardHoverShadow; e.currentTarget.style.borderColor = cardHoverBorderColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = cardBorderColor; }}
                >
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${radialGradientColor} 0%, transparent 70%)`, borderRadius: '50%' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: iconBgColor, borderRadius: '10px', padding: '10px', color: iconColor }}>
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

      {isThemeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsThemeModalOpen(false)}>
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', width: '450px', maxWidth: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'white' }}>Choisir un Thème</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { id: 'theme-floating', name: 'Lignes Flottantes' },
                { id: 'theme-minimalist', name: 'Minimaliste' },
                { id: 'theme-neon', name: 'Néon Cyberpunk' },
                { id: 'theme-striped', name: 'Zébré Moderne' },
                { id: 'theme-dark-grid', name: 'Grille Excel' },
                { id: 'theme-glass', name: 'Glassmorphism' },
                { id: 'theme-bubbles', name: 'Bulles Douces' },
                { id: 'theme-high-contrast', name: 'Haute Contraste' },
                { id: 'theme-ethereal', name: 'Lignes Éthérées' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTableTheme(t.id); setIsThemeModalOpen(false); }}
                  style={{
                    padding: '12px', background: tableTheme === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid', borderColor: tableTheme === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'left', fontWeight: tableTheme === t.id ? '700' : '500'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setIsThemeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px 16px' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
      <ClotureModals />
      {showAideModal && <AideComptableModal onClose={() => setShowAideModal(false)} />}
      
      <StatusChangeInfoModalComponent agent={statusChangeInfoModal} onClose={() => setStatusChangeInfoModal(null)} />

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blinkFinger {
          0%, 100% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.3; transform: translateY(-5px) scale(1.1); }
        }
        @media print { .sidebar,.nav-links,.top-bar button{display:none!important} }
      `}</style>
    </div>
  );
}
