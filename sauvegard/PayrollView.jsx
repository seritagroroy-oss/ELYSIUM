import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  ReceiptText, ChevronLeft, Loader2, Printer, Building2,
  Users, CheckCircle2, Clock, ShieldOff,
  BadgeCheck, Wallet, AlertCircle, MapPin, Eye, Archive, Lock, Search, Settings, TrendingUp, ChevronUp, ChevronDown, X,
  Calendar, Briefcase, Calculator, PiggyBank, History, ArrowLeftRight, Info, RotateCcw
} from 'lucide-react';
import PaymentMethodModal from './modals/PaymentMethodModal';
import BulkConfirmModal from './modals/BulkConfirmModal';
import ClotureModals from './modals/ClotureModals';
import ArchiveConfirmModal from './modals/ArchiveConfirmModal';
import PayrollColumnsModal, { DEFAULT_VISIBLE_COLS } from './modals/PayrollColumnsModal';

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
    alert("La fenêtre d'aide s'ouvre ! (Si vous voyez ceci, la modale a bien été chargée)");
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
            <h4 style={{ margin: '0 0 12px 0', color: '#f87171', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Priorité des Absences (Mutations Multiples)
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              Lorsqu&apos;un agent est muté plusieurs fois dans le mois, il peut accumuler un grand nombre de vacations tout en ayant des absences. Le système <strong>privilégiera toujours la sanction</strong>.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>
              <span style={{ color: '#94a3b8' }}>Exemple (Agent muté 3 fois) :</span><br/>
              L&apos;agent a pointé <strong>23 jours</strong> de présence cumulée sur ses différents sites, mais a eu <strong>9 absences</strong> réelles au cours du mois.<br/><br/>
              <span style={{ color: '#f87171' }}>Calcul :</span> Base maximum (30 jours) - Absences réelles (9 jours)<br/>
              <span style={{ color: '#f87171' }}>Résultat :</span> L&apos;agent sera payé pour <strong>21 jours</strong> (et non 22 ou 23).<br/>
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

export function AgentPayrollDetailsModal({ agent, taxes, funcLabel, payrollSettings, onClose, period, setView, noAnimation = false }) {
  if (!agent) return null;

  let profileObj = {};
  try {
    profileObj = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {});
  } catch (e) {}
  const isSpecial = !!profileObj.special_service;

  const renderHistoryList = () => {
    let history = [];
    if (agent.is_entrant === true || (agent.entrant_sortant_count > 0 && !agent.is_sortant)) {
       const hireDate = agent.hire_date || agent.profile_data?.hire_date || agent.profile_data?.date_embauche || null;
       const hireDateFmt = hireDate ? new Date(hireDate).toLocaleDateString('fr-FR') : 'N/A';
       history.push({ date: hireDateFmt, type: 'Entrée', color: '#10b981', desc: 'Nouvel agent entrant ce mois' });
    }
    if (agent.is_sortant === true || agent.status === 'sortant' || agent.status === 'abandon' || agent.status === 'demission') {
       const exitDate = agent.contract_end || null;
       const exitDateFmt = exitDate ? new Date(exitDate).toLocaleDateString('fr-FR') : 'N/A';
       const exitLabel = agent.status ? agent.status.toUpperCase() : 'SORTANT';
       history.push({ date: exitDateFmt, type: exitLabel, color: '#ef4444', desc: 'Agent sortant/inactif' });
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

    if (agent.profile_data?.multi_site_deployments && agent.profile_data.multi_site_deployments.length > 0) {
        history.push({
            date: 'N/A',
            type: 'Affectation Multi-Sites (Temps Partiel)',
            color: '#10b981',
            desc: (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {agent.profile_data.multi_site_deployments.map((dep, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', borderLeft: '4px solid #10b981', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontWeight: '700', color: 'white', marginBottom: '4px', fontSize: '0.85rem' }}>Site : {dep.site || '?'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span>Jours travaillés: <span style={{color:'white', fontWeight:'600'}}>{dep.worked_days || 0}</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            )
        });
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
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
            <div style={{ padding: '6px 12px', background: `${h.color}15`, color: h.color, borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', whiteSpace: 'nowrap', border: `1px solid ${h.color}25` }}>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
      <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{label}</span>
      <span style={{ color: color, fontWeight: isBold ? '800' : '600', fontSize: isBold ? '1rem' : '0.95rem' }}>
        {isDeduction && value > 0 ? '-' : ''}{value > 0 ? value.toLocaleString() : '0'} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>XOF</span>
      </span>
    </div>
  );

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const handleSavePaymentMethod = async (id, updatedProfile) => {
    try {
      const res = await apiCall('update_agent_profile', { agent_id: id, profile_data: updatedProfile, period: period });
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

  const totalDeductions = agent.deductions + taxes.cnpsSalarial + taxes.cmuEmploye + taxes.impotsTaxes + taxes.avances + taxes.remboursementsPrets;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(3, 5, 10, 0.75)', backdropFilter: 'blur(25px) saturate(180%)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: noAnimation ? 'none' : 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={onClose}>
      {showPaymentModal && <PaymentMethodModal agent={agent} onClose={() => setShowPaymentModal(false)} onSubmit={handleSavePaymentMethod} />}
      {successMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#10b981', color: 'white', padding: '20px 40px', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 10px 25px rgba(16,185,129,0.5)', animation: 'slideUp 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>✓</span> {successMsg}
          </div>
        </div>
      )}
      <div style={{ background: 'rgba(13, 18, 31, 0.55)', width: '100%', maxWidth: '1220px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 80px -10px rgba(0,0,0,0.95), 0 0 60px rgba(56, 189, 248, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', height: '88vh', overflow: 'hidden', animation: noAnimation ? 'none' : 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '28px 36px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(90deg, rgba(10, 16, 30, 0.85) 0%, rgba(5, 8, 14, 0.85) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: isSpecial ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: '900', boxShadow: isSpecial ? '0 0 25px rgba(251, 191, 36, 0.3)' : '0 0 25px rgba(56, 189, 248, 0.3)' }}>
              {agent.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {agent.name}
                <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8', borderRadius: '9999px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.2)', letterSpacing: '0.02em', boxShadow: '0 0 15px rgba(56,189,248,0.1)' }}>
                  {funcLabel(agent.function)}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await apiCall('set_nav_state', {
                        period: period,
                        agentName: agent.name,
                        siteName: agent.site,
                        agentId: agent.id,
                        agentData: agent,
                        source: 'payroll'
                      });
                    } catch (e) {
                      console.error("Erreur set_nav_state:", e);
                    }
                    if (typeof setView === 'function') {
                      setView('archives');
                      onClose();
                    }
                  }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px rgba(16,185,129,0.15)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Search size={14} /> Voir le pointage
                </button>
                {isSpecial && (
                  <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', borderRadius: '9999px', fontWeight: 700, border: '1px solid rgba(251, 191, 36, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 15px rgba(251,191,36,0.1)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    Temps Partiel
                  </span>
                )}
                {(() => {
                  const sortantMotifDetail = agent.absence_details?.find(d => 
                    ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(d.reason) || 
                    (d.reason && d.reason.startsWith('SORTANT_'))
                  );
                  if (!sortantMotifDetail) return null;
                  const sortantLabel = sortantMotifDetail.reason.startsWith('SORTANT_') 
                    ? sortantMotifDetail.reason.substring(8).toUpperCase() 
                    : sortantMotifDetail.reason.replace('_', ' ');

                  let dateSortie = "";
                  if (sortantMotifDetail.date) {
                    const parts = sortantMotifDetail.date.split('-');
                    if (parts.length === 3) {
                      dateSortie = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    } else {
                      dateSortie = sortantMotifDetail.date;
                    }
                  }

                  return (
                    <React.Fragment>
                      {dateSortie && (
                        <span style={{ fontSize: '0.8rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, letterSpacing: 'normal' }}>
                          cet agent est Sortant à partir du : {dateSortie}
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, letterSpacing: 'normal' }}>
                        Motif : {sortantLabel}
                      </span>
                    </React.Fragment>
                  );
                })()}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} /> Fiche de Synthèse Individuelle
                </span>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; e.currentTarget.style.color = '#38bdf8'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  {(() => {
                    let prof = {};
                    try { prof = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {}); } catch(e){}
                    if (prof.payment_method === 'MONEY' && prof.payment_number) {
                      return <><Wallet size={13} /> {prof.payment_operator} : {prof.payment_number}</>;
                    } else if (prof.payment_method === 'BANQUE' && prof.payment_rib) {
                      return <><Building2 size={13} /> {prof.payment_bank_name}</>;
                    }
                    return <><Wallet size={13} /> Ajouter un mode de paiement</>;
                  })()}
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
            <X size={20} />
          </button>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', display: 'grid', gridTemplateColumns: '290px 1fr 340px', gap: '32px', background: 'rgba(10, 15, 26, 0.45)', backdropFilter: 'blur(20px)' }}>
          
          {/* Column 1: Timecard & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Temps de Travail */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Calendar size={16} color="#38bdf8" /> Temps de Travail
              </h3>
              
              {isSpecial && (
                <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                    Agent à Temps Partiel
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Jours planifiés : <strong>{profileObj.special_service_base || 12} jours</strong>.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Jours effectués : <strong>{agent.days_worked ?? (30 - agent.absences - (agent.map_count||0) - (agent.entrant_sortant_count||0))} jours</strong>.
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(34,197,94,0.01)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(34,197,94,0.08)', boxShadow: '0 0 15px rgba(34,197,94,0.03)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#22c55e' }}>{agent.days_worked ?? (30 - agent.absences - (agent.map_count||0) - (agent.entrant_sortant_count||0))}</div>
                  <div style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>Actifs</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.01)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.08)', boxShadow: '0 0 15px rgba(239,68,68,0.03)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444' }}>{agent.absences}</div>
                  <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>Absences</div>
                </div>
                <div style={{ background: 'rgba(249,115,22,0.01)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(249,115,22,0.08)', boxShadow: '0 0 15px rgba(249,115,22,0.03)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f97316' }}>{agent.map_count || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#fdba74', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>MAP</div>
                </div>
                <div style={{ background: 'rgba(167,139,250,0.01)', padding: '12px 8px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(167,139,250,0.08)', boxShadow: '0 0 15px rgba(167,139,250,0.03)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#c084fc' }}>{agent.permission_count || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: '#ddd6fe', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>Perms</div>
                </div>
              </div>
            </div>
 
            {/* Historique Mouvements */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <History size={16} color="#fbbf24" /> Mouvements (Mois)
              </h3>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                {renderHistoryList()}
              </div>
            </div>
            
          </div>
 
          {/* Column 2: Financial Breakdown (Earnings & Deductions) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Revenus & Gains */}
            <div style={{ background: 'rgba(34,197,94,0.01)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.15)', boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.05), inset 0 0 12px rgba(34, 197, 94, 0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#22c55e', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Wallet size={16} /> Revenus & Gains
              </h3>
              <InfoRow label="Base Salariale Forfaitaire" value={agent.base} color="#22c55e" isBold />
              {(agent.prime_site || 0) > 0 && <InfoRow label="Prime de Site" value={agent.prime_site} color="#86efac" />}
              {agent.gains > 0 && <InfoRow label="Heures Supplémentaires" value={agent.gains} color="#38bdf8" />}
              {taxes.primeAnciennete > 0 && <InfoRow label="Prime d'Ancienneté" value={taxes.primeAnciennete} color="#c084fc" />}
              {taxes.primeVariable > 0 && <InfoRow label="Sursalaire / Prime variable" value={taxes.primeVariable} color="#38bdf8" />}
              
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(34,197,94,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.03em' }}>SALAIRE BRUT</span>
                  <span style={{ color: '#22c55e', fontSize: '1.35rem', fontWeight: '950', textShadow: '0 0 20px rgba(34,197,94,0.1)' }}>{taxes.brut.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight:'600' }}>XOF</span></span>
                </div>
              </div>
            </div>
 
            {/* Déductions */}
            <div style={{ background: 'rgba(239,68,68,0.01)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.15)', boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.05), inset 0 0 12px rgba(239, 68, 68, 0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Calculator size={16} /> Retenues Salariales
              </h3>
              {agent.deductions > 0 && <InfoRow label="Absences / MAP déductibles" value={agent.deductions} color="#fca5a5" isDeduction />}
              {taxes.cnpsSalarial > 0 && <InfoRow label="CNPS Salarié" value={taxes.cnpsSalarial} color="#fca5a5" isDeduction />}
              {taxes.cmuEmploye > 0 && <InfoRow label="CMU Salarié" value={taxes.cmuEmploye} color="#fca5a5" isDeduction />}
              {taxes.impotsTaxes > 0 && <InfoRow label="ITS (Impôts sur Salaire)" value={taxes.impotsTaxes} color="#fca5a5" isDeduction />}
              {taxes.avances > 0 && <InfoRow label="Avances sur salaire / Quinzaines" value={taxes.avances} color="#fdba74" isDeduction />}
              {taxes.remboursementsPrets > 0 && <InfoRow label="Remboursement de Prêt" value={taxes.remboursementsPrets} color="#fdba74" isDeduction />}
              
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.03em' }}>TOTAL RETENUES</span>
                  <span style={{ color: '#ef4444', fontSize: '1.35rem', fontWeight: '950', textShadow: '0 0 20px rgba(239,68,68,0.1)' }}>-{totalDeductions.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight:'600' }}>XOF</span></span>
                </div>
              </div>
            </div>

          </div>

          {/* Column 3: Net à Payer & Employer Costs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Giant Net à Payer display */}
            <div style={{ background: 'linear-gradient(135deg, rgba(9, 19, 36, 0.4) 0%, rgba(6, 10, 18, 0.4) 100%)', padding: '32px 24px', borderRadius: '24px', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 20px 45px rgba(0,0,0,0.65), 0 0 35px rgba(56,189,248,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
              <div style={{ position: 'absolute', top: '-25%', right: '-25%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)', filter: 'blur(30px)' }}></div>
              <PiggyBank size={36} color="#38bdf8" style={{ marginBottom: '10px', opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.4))' }} />
              <h3 style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Net à Payer</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#38bdf8', textShadow: '0 0 25px rgba(56,189,248,0.45)', lineHeight: 1 }}>
                {taxes.netAPayer.toLocaleString()}
              </div>
              <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: '800', marginTop: '4px' }}>XOF</div>
            </div>

            {/* Charges Patronales */}
            <div style={{ background: 'rgba(245,158,11,0.01)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(245,158,11,0.15)', boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.03)' }}>
              <h3 style={{ margin: '0 0 14px 0', color: '#f59e0b', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Briefcase size={15} /> Charges Patronales
              </h3>
              {taxes.cnpsPatronal > 0 && <InfoRow label="CNPS Patronal" value={taxes.cnpsPatronal} color="#f59e0b" />}
              {taxes.cmuEmployeur > 0 && <InfoRow label="CMU Patronal" value={taxes.cmuEmployeur} color="#f59e0b" />}
              {taxes.accidentsTravail > 0 && <InfoRow label="Accidents du Travail" value={taxes.accidentsTravail} color="#f59e0b" />}
              {taxes.taxeFormation > 0 && <InfoRow label="Taxe FDFP" value={taxes.taxeFormation} color="#f59e0b" />}
              {taxes.taxeApprentissage > 0 && <InfoRow label="Taxe Apprentissage" value={taxes.taxeApprentissage} color="#f59e0b" />}
              {!(taxes.cnpsPatronal > 0 || taxes.cmuEmployeur > 0 || taxes.accidentsTravail > 0) && (
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Aucune charge patronale appliquée.</div>
              )}
            </div>

          </div>
  
        </div>
  
      </div>
      

      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(35px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
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
            <h4 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Absences</span>
              {(() => {
                const sortantMotifDetail = agent.absence_details?.find(d => 
                  ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(d.reason) || 
                  (d.reason && d.reason.startsWith('SORTANT_'))
                );
                if (!sortantMotifDetail) return null;
                const sortantLabel = sortantMotifDetail.reason.startsWith('SORTANT_') 
                  ? sortantMotifDetail.reason.substring(8).toUpperCase() 
                  : sortantMotifDetail.reason.replace('_', ' ');

                let dateSortie = "";
                if (sortantMotifDetail.date) {
                  const parts = sortantMotifDetail.date.split('-');
                  if (parts.length === 3) {
                    dateSortie = `${parts[2]}/${parts[1]}/${parts[0]}`;
                  } else {
                    dateSortie = sortantMotifDetail.date;
                  }
                }

                return (
                  <React.Fragment>
                    {dateSortie && (
                      <span style={{ fontSize: '0.85rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, letterSpacing: 'normal' }}>
                        cet agent est Sortant à partir du : {dateSortie}
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, letterSpacing: 'normal' }}>
                      Motif : {sortantLabel}
                    </span>
                  </React.Fragment>
                );
              })()}
            </h4>
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
  const agentName = selectedMutationDetails.agent?.name || 'Agent';

  const originalDays = original.worked_days !== undefined ? original.worked_days : (original.active_days||0);
  const mutatedDays = mutated.worked_days !== undefined ? mutated.worked_days : (mutated.active_days||0);
  const totalDays = originalDays + mutatedDays;
  const totalSalary = (original.base_prorata || 0) + (mutated.base_prorata || 0);

  const renderDaysInfo = (details, badgeColor = '#38bdf8') => {
    const active = details.active_days ?? 0;
    const worked = details.worked_days !== undefined ? details.worked_days : active;
    const baseFull = details.base_full || (details.base_prorata ? Math.round((details.base_prorata / (active || 1)) * 30) : 0);
    
    const hasDeductions = details.worked_days !== undefined && (
      (details.absences || 0) > 0 || 
      (details.map_count || 0) > 0 || 
      (details.permission_count || 0) > 0 || 
      (details.entrant_sortant_count || 0) > 0
    );

    return (
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px' }}>
          {(details.base_prorata || 0).toLocaleString('fr-FR')}
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>XOF</span>
        </div>

        {/* Formule de calcul explicite */}
        <div style={{
          marginTop: '6px',
          fontSize: '0.76rem',
          color: '#cbd5e1',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px 10px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ color: badgeColor, fontWeight: '700' }}>🧮 Calcul :</span>
          <span>({baseFull.toLocaleString('fr-FR')} XOF ÷ 30 j) × {active} j = <strong style={{ color: '#ffffff' }}>{(details.base_prorata || 0).toLocaleString('fr-FR')} XOF</strong></span>
        </div>

        <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: '700', color: badgeColor, display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${badgeColor}15`, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${badgeColor}30` }}>
          <Clock size={13} /> {worked} jour(s) de service réel
        </div>
        {hasDeductions ? (
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px', fontWeight: '500' }}>
            ({active} actif{active > 1 ? 's' : ''}
            {(details.absences || 0) > 0 && ` • ${details.absences} abs.`}
            {(details.map_count || 0) > 0 && ` • ${details.map_count} MAP`}
            {(details.permission_count || 0) > 0 && ` • ${details.permission_count} perm.`}
            {(details.entrant_sortant_count || 0) > 0 && ` • ${details.entrant_sortant_count} entr./sort.`}
            )
          </span>
        ) : (
          details.worked_days === undefined && (
            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
              ({active} jour(s) actif(s))
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(7, 11, 22, 0.88)', 
        backdropFilter: 'blur(16px) saturate(180%)', 
        zIndex: 99999, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '24px' 
      }} 
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', 
          padding: '36px', 
          borderRadius: '30px', 
          width: '1120px', 
          maxWidth: '92vw', 
          border: '1px solid rgba(56, 189, 248, 0.25)', 
          boxShadow: '0 35px 80px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(56, 189, 248, 0.12)', 
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Bouton de fermeture ultra-stylisé */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          title="Fermer"
        >
          <X size={20} />
        </button>

        {/* En-tête Premium */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)', 
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '16px', 
              borderRadius: '20px', 
              color: '#38bdf8',
              boxShadow: '0 8px 25px rgba(56, 189, 248, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ArrowLeftRight size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  Détail de Mutation
                </h3>
                <span style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Période Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Agent concerné :</span>
                <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  👤 {agentName}
                </span>
              </div>
            </div>
          </div>

          {/* Badge Note Comptable dans l'en-tête (Dégagé du bouton de fermeture) */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            padding: '10px 16px',
            maxWidth: '480px',
            marginRight: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <Info size={22} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.45' }}>
              <strong style={{ color: '#38bdf8' }}>Note comptable (Règle forfaitaire des 30 jours) :</strong> Les jours actifs sur chaque site sont ajustés de manière proratisée pour respecter le forfait mensuel universel de 30 jours (30 jours calendaires réels équivalent à 30 jours comptables), garantissant une paie exacte et conforme.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Site d'Origine */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)', 
              border: '1px solid rgba(245, 158, 11, 0.35)', 
              borderRadius: '22px', 
              padding: '24px', 
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.008)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.7)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.18), 0 0 25px rgba(245, 158, 11, 0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            }}
          >
            <div style={{ 
              position: 'absolute', top: '-12px', left: '24px', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              padding: '3px 12px', 
              borderRadius: '12px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span>📍 SITE D'ORIGINE (PROVENANCE)</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: '800' }}>
                  {original.site}
                </h4>
                {original.subsite && (
                  <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                    Sous-site : <strong style={{ color: '#cbd5e1' }}>{original.subsite}</strong>
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Fonction :</span>
                  <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                    {original.function}
                  </span>
                </div>
              </div>
              {renderDaysInfo(original, '#f59e0b')}
            </div>
          </div>

          {/* Connecteur de Mutation Visuel */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-8px 0' }}>
            <div 
              style={{ 
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.15))', 
                border: '1px solid rgba(56, 189, 248, 0.3)', 
                color: '#38bdf8', 
                padding: '6px 18px', 
                borderRadius: '20px', 
                fontSize: '0.78rem', 
                fontWeight: '800', 
                display: 'flex', alignItems: 'center', gap: '8px',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
              }}
            >
              <span>➔</span> MUTATION EFFECTUÉE EN COURS DE MOIS <span>➔</span>
            </div>
          </div>

          {/* Card 2: Site de Mutation */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(56, 189, 248, 0.04) 100%)', 
              border: '1px solid rgba(56, 189, 248, 0.4)', 
              borderRadius: '22px', 
              padding: '24px', 
              position: 'relative',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.008)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.75)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(6, 182, 212, 0.25), 0 0 25px rgba(56, 189, 248, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.1)';
            }}
          >
            <div style={{ 
              position: 'absolute', top: '-12px', left: '24px', 
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              padding: '3px 12px', 
              borderRadius: '12px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span>✨ SITE DE DESTINATION (MUTATION)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: '800' }}>
                  {mutated.site}
                </h4>
                {mutated.subsite && (
                  <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                    Sous-site : <strong style={{ color: '#cbd5e1' }}>{mutated.subsite}</strong>
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Fonction :</span>
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                    {mutated.function}
                  </span>
                </div>
              </div>
              {renderDaysInfo(mutated, '#38bdf8')}
            </div>
          </div>

          {/* Bilan Synthétique des Jours et du Salaire */}
          <div 
            style={{ 
              background: 'rgba(15, 23, 42, 0.75)', 
              padding: '20px 24px', 
              borderRadius: '22px', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
              alignItems: 'center',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '20px' }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Cumul du service effectif
              </span>
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.25rem', marginTop: '4px', display: 'block' }}>
                {totalDays} jour(s) travaillés
              </span>
              <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#f59e0b', fontWeight: '700' }}>🧮 Somme :</span>
                <span>{originalDays} j ({original.site}) + {mutatedDays} j ({mutated.site}) = <strong style={{ color: '#ffffff' }}>{totalDays} j</strong></span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Salaire de Base Brut Total
              </span>
              <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.45rem', marginTop: '2px', display: 'block', textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                {totalSalary.toLocaleString('fr-FR')} <span style={{ fontSize: '0.85rem' }}>XOF</span>
              </span>
              <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#10b981', fontWeight: '700' }}>🧮 Somme :</span>
                <span>{(original.base_prorata || 0).toLocaleString('fr-FR')} XOF + {(mutated.base_prorata || 0).toLocaleString('fr-FR')} XOF = <strong style={{ color: '#10b981' }}>{totalSalary.toLocaleString('fr-FR')} XOF</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec Bouton Fermer */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
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
    const saved = localStorage.getItem('pontage_payroll_period');
    if (saved) return saved;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    localStorage.setItem('pontage_payroll_period', period);
  }, [period]);
  const initialLoadRef = React.useRef(true);
  const [sites, setSites] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [primeExclusionModal, setPrimeExclusionModal] = useState(null);
  const [primeExclusionLoading, setPrimeExclusionLoading] = useState(false);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    // Si on revient depuis la grille de pointage (window SPA ou localStorage),
    // forcer l'onglet "Actuel" — indépendamment de ce qui était sauvegardé avant.
    if (window.pontage_return_agent_data) return 'current';
    try {
      if (localStorage.getItem('pontage_return_to_payroll_agent_data')) return 'current';
    } catch (e) {}
    return localStorage.getItem('pontage_payroll_viewMode') || 'current';
  });
  const [archivesList, setArchivesList] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(() => {
    return localStorage.getItem('pontage_payroll_selectedArchive') || null;
  });

  useEffect(() => {
    localStorage.setItem('pontage_payroll_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (selectedArchive) {
      localStorage.setItem('pontage_payroll_selectedArchive', selectedArchive);
    } else {
      localStorage.removeItem('pontage_payroll_selectedArchive');
    }
  }, [selectedArchive]);
  const isArchiveMode = viewMode === 'archives' && selectedArchive;
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [searchArchiveText, setSearchArchiveText] = useState('');
  const [globalSearchText, setGlobalSearchText] = useState('');
  const searchInputRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [statusChangeInfoModal, setStatusChangeInfoModal] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkConfirmModal, setBulkConfirmModal] = useState(null);
  const [globalPayConfirmModal, setGlobalPayConfirmModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [archiveActionLoading, setArchiveActionLoading] = useState(false);
  const [reclamations, setReclamations] = useState([]);
  const autoOpenedRef = React.useRef(false);
  const pendingArchiveNavRef = React.useRef(null); // { siteName, zoneName } pour navigation post-fermeture
  const agentLoadedSyncRef = React.useRef(false);  // true si agent résolu immédiatement (window/localStorage)
  const [selectedAgentPayrollDetails, setSelectedAgentPayrollDetails] = useState(() => {
    // 1. Lire depuis window en priorité (SPA — même onglet, même session JS)
    if (window.pontage_return_agent_data) {
      const agent = window.pontage_return_agent_data;
      window.pontage_return_agent_data = null;
      window.pontage_return_agent_id = null;
      autoOpenedRef.current = true;
      agentLoadedSyncRef.current = true; // résolu immédiatement → pas de flash
      return agent;
    }
    // 2. Fallback localStorage (même origine)
    const data = localStorage.getItem('pontage_return_to_payroll_agent_data');
    if (data) {
      try {
        const agent = JSON.parse(data);
        localStorage.removeItem('pontage_return_to_payroll_agent_data');
        localStorage.removeItem('pontage_return_to_payroll_agent_id');
        autoOpenedRef.current = true;
        agentLoadedSyncRef.current = true; // résolu immédiatement → pas de flash
        return agent;
      } catch (e) {}
    }
    // 3. Fallback backend (ngrok, IP externe, etc.) — géré dans useEffect ci-dessous
    return null;
  });

  // Vrai quand la vérification du nav_state (backend) est terminée.
  // Départ à true si l'agent était déjà résolu synchroniquement (window/LS) → pas de flash.
  // Départ à false si on attend le backend → le bloc "Période Clôturée" est masqué pendant ce temps.
  const [navStateChecked, setNavStateChecked] = useState(() => agentLoadedSyncRef.current);

  // Fallback backend : si window et localStorage n'avaient rien (cas ngrok/changement d'origine),
  // on interroge le backend (session PHP — indépendant du domaine).
  useEffect(() => {
    if (selectedAgentPayrollDetails) { setNavStateChecked(true); return; } // déjà résolu en mémoire
    apiCall('get_nav_state', {}, 'GET')
      .then(res => {
        if (
          res?.success &&
          res.nav_state?.source === 'payroll' &&
          res.nav_state?.agentData
        ) {
          autoOpenedRef.current = true;
          setSelectedAgentPayrollDetails(res.nav_state.agentData);
          // Forcer l'onglet "Actuel" (cas ngrok : localStorage était différent)
          setViewMode('current');
          // Nettoyer l'état serveur pour ne pas le réutiliser au prochain montage
          apiCall('clear_nav_state', {}, 'POST').catch(() => {});
        }
      })
      .catch(() => {}) // silencieux si l'API échoue
      .finally(() => setNavStateChecked(true)); // ← démasque le rendu après vérification
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
    if (!p.includes('-')) return `Archive de ${p}`; // Support for periods that are just text (e.g., "Août 2026")
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
  const [visibleCols, setVisibleCols] = useState(null); // null = chargement en cours
  const [isColConfigOpen, setIsColConfigOpen] = useState(false);
  const [colSaveStatus, setColSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Chargement des préférences de colonnes depuis le backend
  useEffect(() => {
    apiCall('get_column_prefs', { view_key: 'payroll_table' }, 'GET')
      .then(res => {
        if (res?.success) {
          setVisibleCols(res.prefs ?? DEFAULT_VISIBLE_COLS);
        } else {
          setVisibleCols(DEFAULT_VISIBLE_COLS);
        }
      })
      .catch(() => setVisibleCols(DEFAULT_VISIBLE_COLS));
  }, []);

  // Sauvegarde des préférences de colonnes vers le backend
  const handleColChange = async (newCols) => {
    setVisibleCols(newCols);
    setColSaveStatus('saving');
    try {
      await apiCall('save_column_prefs', { view_key: 'payroll_table', prefs: newCols });
      setColSaveStatus('saved');
      setTimeout(() => setColSaveStatus('idle'), 2000);
    } catch (e) {
      setColSaveStatus('idle');
    }
  };

  // Helper: colonne visible ?
  const colVisible = (key) => visibleCols === null || visibleCols[key] !== false;

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
    const isActive = (key) => {
      const val = payrollSettings[key];
      return val === true || val === 'true' || val === 1 || val === '1';
    };
    
    const vars = payrollVariables[s.id] || { avance: 0, prime: 0 };
    const safeBase = Number(s.base) || 0;
    const safeGains = Number(s.gains) || 0;
    const safePrimeSite = Number(s.prime_site) || 0;
    const safeDeductions = Number(s.deductions) || 0;
    const primeAnciennete = isActive('enable_seniority') ? getSeniorityBonus(s.profile_data?.date_embauche || s.profile_data?.hire_date, safeBase) : 0;
    const primeVariable = isActive('enable_sursalaire') ? (vars.prime || 0) : 0;
    
    // Réclamations Validées (Absences justifiées)
    const baseJournaliere = safeBase / ((s.profile_data?.special_service) ? (s.profile_data.special_service_base || 12) : 30);
    const joursAbsencesJustifiees = reclamations
      .filter(r => r.agent_nom === s.name && r.statut === 'Clôturé' && r.mois_concerne === period && r.type_erreur === 'Absence' && r.action_demandee === 'A payer')
      .reduce((acc, r) => acc + (parseInt(r.jours_concernes) || 0), 0);
    
    // On réduit les retenues d'absence du montant justifié
    const deductionsAjustees = Math.max(0, safeDeductions - Math.round(joursAbsencesJustifiees * baseJournaliere));
    
    // Le brut intègre l'ancienneté et le sursalaire en plus de la base, gains et prime site
    const brut = Math.max(0, safeBase - deductionsAjustees + safeGains + safePrimeSite + primeAnciennete + primeVariable);
    
    const cnpsSalarial = isActive('enable_cnps_salarial') ? Math.round(brut * ((payrollSettings.cnps_salarial || 6.3) / 100)) : 0;
    const cmuEmploye = isActive('enable_cmu_employe') ? parseInt(payrollSettings.cmu_amount || 500) : 0;
    
    // Patronales
    const cnpsPatronal = isActive('enable_cnps_patronal') ? Math.round(brut * ((payrollSettings.cnps_patronal || 7.7) / 100)) : 0;
    const cmuEmployeur = isActive('enable_cmu_employeur') ? parseInt(payrollSettings.cmu_amount || 500) : 0;
    const accidentsTravail = isActive('enable_accidents_travail') ? Math.round(brut * ((payrollSettings.accidents_travail || 2.0) / 100)) : 0;
    const taxeFormation = isActive('enable_fdfp') ? Math.round(brut * ((payrollSettings.taxe_formation || 0.6) / 100)) : 0;
    const taxeApprentissage = isActive('enable_taxe_apprentissage') ? Math.round(brut * ((payrollSettings.taxe_apprentissage || 0.4) / 100)) : 0;
    
    let impotsTaxes = 0;
    if (isActive('enable_its')) {
      if (payrollSettings.tax_mode === 'reel_ci') {
        const taxRes = calculateTaxesCI(brut - cnpsSalarial, getParts(s.profile_data || {}));
        impotsTaxes = taxRes.total;
      } else {
        impotsTaxes = Math.round((brut - cnpsSalarial) * ((payrollSettings.its || 1.2) / 100));
      }
    }
    const totalRetenuesFiscales = cnpsSalarial + impotsTaxes + cmuEmploye;
    const avances = isActive('enable_avances') ? (vars.avance || 0) : 0;
    const remboursementsPrets = (s.remboursement_pret || 0);

    const totalDeductionsNettes = avances + remboursementsPrets;
    const netAPayer = Math.max(0, brut - totalRetenuesFiscales - totalDeductionsNettes);
    return { 
      primeAnciennete, primeVariable, brut, cnpsSalarial, cmuEmploye, impotsTaxes, 
      accidentsTravail, taxeFormation, taxeApprentissage, cnpsPatronal, cmuEmployeur, 
      avances, remboursementsPrets, totalDeductionsNettes, netAPayer 
    };
  };

  // agentData = { period, site_id, zone_name, agent_name } — passé directement par cycleStatus
  const saveStatuses = async (newStatuses, changedKey, agentData) => {
    setStatuses(newStatuses);
    localStorage.setItem('pontage_payroll_statuses', JSON.stringify(newStatuses));

    // Persister en base de données si une clé précise a changé
    if (changedKey && agentData) {
      try {
        await apiCall('save_payroll_status', {
          period: agentData.period,
          site_id: String(agentData.site_id || ''),
          zone_name: String(agentData.zone_name || ''),
          agent_name: String(agentData.agent_name || ''),
          status: newStatuses[changedKey] || 'brouillon'
        }, 'POST');
      } catch (err) {
        console.error('[PayrollView] Erreur sauvegarde statut backend:', err);
        // On ne lève pas l'erreur — le localStorage garde le statut comme fallback
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, salRes, funcRes, pubRes, settingsRes, varsRes, reclamRes, statusesRes] = await Promise.all([
        apiCall('get_sites', { scope: 'company' }, 'GET'),
        apiCall('get_salaries', { period, scope: 'company' }, 'GET'),
        apiCall('get_functions', { scope: 'company' }, 'GET'),
        apiCall('get_published_periods', { scope: 'company' }, 'GET'),
        apiCall('get_payroll_settings', { scope: 'company' }, 'GET'),
        apiCall('get_payroll_variables', { period, scope: 'company' }, 'GET'),
        apiCall('get_reclamations', { scope: 'company' }, 'GET'),
        apiCall('get_payroll_statuses', { period, scope: 'company' }, 'GET')
      ]);
      if (Array.isArray(sitesRes)) setSites(sitesRes);
      else if (sitesRes && sitesRes.success && Array.isArray(sitesRes.sites)) setSites(sitesRes.sites);
      if (Array.isArray(salRes)) { setSalaries(salRes); setLoadedSites({ all: true }); }
      else if (salRes && salRes.salaries) { setSalaries(salRes.salaries); setLoadedSites({ all: true }); }
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (settingsRes?.success) setPayrollSettings(settingsRes.settings || {});
      if (varsRes?.success) setPayrollVariables(varsRes.variables || {});
      if (reclamRes?.success && Array.isArray(reclamRes.reclamations)) setReclamations(reclamRes.reclamations);

      // Charger les statuts depuis la DB (priorité sur localStorage)
      if (statusesRes?.success && statusesRes.statuses) {
        const localStatuses = (() => {
          try { return JSON.parse(localStorage.getItem('pontage_payroll_statuses') || '{}'); }
          catch { return {}; }
        })();
        // Fusionner: la DB a la priorité pour la période courante
        const merged = { ...localStatuses, ...statusesRes.statuses };
        setStatuses(merged);
        localStorage.setItem('pontage_payroll_statuses', JSON.stringify(merged));
      }

      if (pubRes?.success) {
        const pubs = pubRes.published_periods || [];
        const archs = pubRes.archived_periods || [];
        setPublishedPeriods(pubs);
        setArchivedPeriods(archs);
        
        // Auto-jump to the most recent period with REAL data (archived or published)
        // Merge archived + published, prefer archived (they have actual payroll snapshots)
        const allDataPeriods = [...new Set([...archs, ...pubs])].filter(p => /^\d{4}-\d{2}$/.test(p)).sort().reverse();
        if (allDataPeriods.length > 0) {
          // Use the most recent period that has actual data, not just latest_publication timestamp
          const targetPeriod = allDataPeriods[0];

          if (initialLoadRef.current) {
             setPeriod(targetPeriod);
             initialLoadRef.current = false;
          } else if (!pubs.includes(period) && !archs.includes(period)) {
            // Check if period is exactly one month after the latest known period
            const latestKnown = allDataPeriods[0];
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
        } else if (pubs.length > 0) {
          // Fallback: only published periods exist, use the most recent
          const targetPeriod = [...pubs].sort().reverse()[0];
          if (initialLoadRef.current) {
            setPeriod(targetPeriod);
            initialLoadRef.current = false;
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  
  const handleTogglePrimeSite = async (agent, exclusionType) => {
    setPrimeExclusionLoading(true);
    try {
      const pData = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {});
      const updatedProfile = { ...pData };
      
      if (exclusionType === 'none') {
          delete updatedProfile.prime_site_excluded;
          delete updatedProfile.prime_site_excluded_period;
      } else if (exclusionType === 'period') {
          updatedProfile.prime_site_excluded = false;
          updatedProfile.prime_site_excluded_period = period;
      } else if (exclusionType === 'permanent') {
          updatedProfile.prime_site_excluded = true;
          delete updatedProfile.prime_site_excluded_period;
      }
      
      const res = await apiCall('update_agent_profile', { agent_id: agent.id, profile_data: updatedProfile, period: period });
      if (res.success) {
        setPrimeExclusionModal(null);
        setPrimeExclusionLoading(false);

        if (viewMode === 'archives' && selectedArchive) {
          // Si on est dans les archives, on force le rechargement de l'archive
          const loadArch = async () => {
            setArchiveLoading(true);
            try {
              const r = await apiCall(`get_payroll_archive_detail&period=${selectedArchive}&scope=company`, {}, 'GET');
              if (r?.success) setArchiveDetail(r.archive);
            } catch (e) { console.error(e); } 
            finally { setArchiveLoading(false); }
          };
          loadArch();
        } else {
          // Sinon on recharge les données du mois en cours
          loadData();
        }
      } else {
        alert(res.message || 'Erreur lors de la sauvegarde');
        setPrimeExclusionLoading(false);
      }
    } catch(e) {
      console.error(e);
      alert('Erreur serveur');
      setPrimeExclusionLoading(false);
    }
  };

  useEffect(() => { if (isAllowed) loadData(); }, [period]);

  const activeSalaries = isArchiveMode ? (archiveDetail?.salaries || []) : salaries;
  const activeStatuses = isArchiveMode ? (archiveDetail?.statuses || {}) : statuses;

  const funcLabel = (id) => functions.find(fn => fn.id === id)?.name || id || '—';

  const getStatusKey = (agentName, siteId, zoneName) => `${isArchiveMode ? selectedArchive : period}_${siteId}_${zoneName}_${agentName}`;
  const getAgentStatus = (agentName, siteId, zoneName) => activeStatuses[getStatusKey(agentName, siteId, zoneName)] || 'brouillon';

  // --- RECHERCHE INTELLIGENTE MULTI-CRITÈRES ---
  const normalizeText = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const filteredSalaries = React.useMemo(() => {
    if (!globalSearchText.trim()) return activeSalaries;
    const q = normalizeText(globalSearchText);
    return activeSalaries.filter(sal => {
      const nameMatch = normalizeText(sal.name).includes(q);
      const siteMatch = normalizeText(sal.site).includes(q);
      const subsiteMatch = normalizeText(sal.subsite).includes(q);
      const funcMatch = normalizeText(sal.function).includes(q) || normalizeText(funcLabel(sal.function)).includes(q);
      
      const stKey = getStatusKey(sal.name, sal.site_id || sal.site, sal.subsite);
      const stStatus = activeStatuses[stKey] || 'brouillon';
      const stLabel = STATUSES[stStatus]?.label || '';
      const statusMatch = normalizeText(stLabel).includes(q);

      return nameMatch || siteMatch || subsiteMatch || funcMatch || statusMatch;
    });
  }, [activeSalaries, globalSearchText, activeStatuses, functions, isArchiveMode, selectedArchive, period]);

  // Déterminer la liste des sites à afficher et leur ordre
  const activeSites = React.useMemo(() => {
    if (isArchiveMode) {
      if (archiveDetail?.sites && archiveDetail.sites.length > 0) {
        return archiveDetail.sites.map(s => ({ id: s.id, name: s.name }));
      } else {
        // Fallback for older archives that didn't freeze the sites array
        const uniqueSites = [...new Set((activeSalaries || []).map(s => s.site).filter(Boolean))];
        return uniqueSites.map((siteName, index) => {
          const matchingCurrentSite = sites.find(s => s.name === siteName);
          return { id: matchingCurrentSite ? matchingCurrentSite.id : `legacy-${index}`, name: siteName };
        });
      }
    }
    const sitesWithAgents = sites.filter(site => {
      const cleanSiteName = (site.name || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
      const siteNameMatch = globalSearchText.trim() && normalizeText(site.name).includes(normalizeText(globalSearchText));
      return siteNameMatch || filteredSalaries.some(s => {
        const cleanSalarySite = (s.site || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
        return cleanSalarySite === cleanSiteName;
      });
    });
    const siteOrder = JSON.parse(localStorage.getItem('pontage_site_order') || '[]');
    return sitesWithAgents.sort((a, b) => {
      const idxA = siteOrder.indexOf(a.id);
      const idxB = siteOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [sites, isArchiveMode, archiveDetail, user?.service_id, filteredSalaries, globalSearchText]);
  
  const cycleStatus = (agentName, siteId, zoneName) => {
    if (isArchiveMode) return; // Lecture seule en mode archive
    const key = getStatusKey(agentName, siteId, zoneName);
    const next = STATUSES[activeStatuses[key] || 'brouillon']?.next;
    if (next) {
      const agentData = { period, site_id: String(siteId || ''), zone_name: String(zoneName || ''), agent_name: String(agentName || '') };
      saveStatuses({ ...activeStatuses, [key]: next }, key, agentData);
    }
  };

  const handleBulkStatusChange = async (targetStatus, siteName, siteId) => {
    if (isArchiveMode || isBulkUpdating) return;
    const agents = agentsForSite(siteName);
    if (agents.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updates = [];
      const newStatuses = { ...activeStatuses };
      
      agents.forEach(agent => {
        const zoneName = agent.subsite || '';
        const key = getStatusKey(agent.name, siteId || agent.site, zoneName);
        newStatuses[key] = targetStatus;
        updates.push({
          site_id: String(siteId || agent.site || ''),
          zone_name: String(zoneName),
          agent_name: String(agent.name),
          status: targetStatus
        });
      });

      // Update UI immediately (optimistic UI)
      setStatuses(newStatuses);
      localStorage.setItem('pontage_payroll_statuses', JSON.stringify(newStatuses));

      // Call API
      const res = await apiCall('bulk_save_payroll_status', { period, updates }, 'POST');
      if (!res.success) {
        alert(res.message || 'Erreur lors de la mise à jour en masse');
      }
    } catch (e) {
      console.error("Bulk update error", e);
      alert('Erreur réseau lors de la mise à jour en masse');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleGlobalPay = async () => {
    if (isArchiveMode || isBulkUpdating) return;
    const agents = salaries;
    if (agents.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updates = [];
      const newStatuses = { ...activeStatuses };
      
      agents.forEach(agent => {
        const zoneName = agent.subsite || '';
        const siteObj = sites.find(s => s.name === agent.site);
        const siteId = siteObj ? siteObj.id : agent.site; 
        const key = getStatusKey(agent.name, siteId, zoneName);
        newStatuses[key] = 'paye';
        updates.push({
          site_id: String(siteId || ''),
          zone_name: String(zoneName),
          agent_name: String(agent.name),
          status: 'paye'
        });
      });

      setStatuses(newStatuses);
      localStorage.setItem('pontage_payroll_statuses', JSON.stringify(newStatuses));

      const res = await apiCall('bulk_save_payroll_status', { period, updates }, 'POST');
      if (!res.success) {
        alert(res.message || 'Erreur lors de la mise à jour en masse globale');
      }
    } catch (e) {
      console.error("Global bulk update error", e);
      alert('Erreur réseau lors de la mise à jour en masse globale');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Agents d'un site
  const agentsForSite = (siteName) => filteredSalaries.filter(s => s.site === siteName);

  // Zones (subsites) uniques d'un site
  const zonesForSite = (siteName) => {
    const agents = agentsForSite(siteName);
    return [...new Set(agents.map(a => a.subsite).filter(Boolean))];
  };

  // Agents d'une zone précise
  const agentsForZone = (siteName, zoneName) =>
    agentsForSite(siteName).filter(a => a.subsite === zoneName);

  // Composant visuel SmartSearchBar (appel direct pour conserver le focus)
  const renderSmartSearchBar = () => (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.75)',
      border: globalSearchText ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '14px',
      padding: '8px 16px',
      gap: '10px',
      transition: 'all 0.25s ease',
      boxShadow: globalSearchText ? '0 0 20px rgba(56, 189, 248, 0.25)' : '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '280px',
      flex: 1,
      maxWidth: '480px',
      marginRight: 'auto',
      marginLeft: '20px'
    }}>
      <Search size={18} style={{ color: globalSearchText ? '#38bdf8' : '#64748b' }} />
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Recherche intelligente (Nom, site, zone, poste, statut)..."
        value={globalSearchText}
        onChange={(e) => setGlobalSearchText(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          outline: 'none',
          width: '100%',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}
      />
      {globalSearchText ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', whiteSpace: 'nowrap', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
            {filteredSalaries.length} trouvé{filteredSalaries.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setGlobalSearchText('')}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#94a3b8', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Effacer la recherche"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', whiteSpace: 'nowrap', fontWeight: '600' }}>
          Ctrl K
        </span>
      )}
    </div>
  );

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
    if (globalProgress < 100) {
      setShowClotureWarningModal(true);
      return;
    }
    setShowArchiveConfirmModal(true);
  };

  const confirmArchiveAction = async () => {
    setArchiveActionLoading(true);
    try {
      const res = await apiCall('archive_payroll', { period, salaries, statuses, sites: activeSites, scope: 'company' }, 'POST');
      if (res?.success) {
        setShowArchiveConfirmModal(false);
        alert('Archive créée avec succès.');
        setArchivedPeriods(prev => [...prev, period]);
        fetchArchives();
      } else {
        alert(res?.message || 'Erreur lors de l\'archivage.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    } finally {
      setArchiveActionLoading(false);
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
      let total_reclamations = 0;

      // OPTIMIZATION: Index reclamations
      const reclamationsByAgentId = {};
      const reclamationsByAgentName = {};
      reclamations.forEach(r => {
        if (r.mois_concerne !== period) return;
        if (r.agent_matricule) {
          if (!reclamationsByAgentId[r.agent_matricule]) reclamationsByAgentId[r.agent_matricule] = [];
          reclamationsByAgentId[r.agent_matricule].push(r);
        }
        if (r.agent_nom) {
          if (!reclamationsByAgentName[r.agent_nom]) reclamationsByAgentName[r.agent_nom] = [];
          reclamationsByAgentName[r.agent_nom].push(r);
        }
      });
      const motifsRecl = ["justificatif d'absence", "annulation de permission", "mise à pied", "erreur de paie", "erreur de pointage", "omission"];

      salaries.forEach(s => {
        const taxes = calculateAgentTaxes(s);
        
        const agentRecls = [...(reclamationsByAgentId[s.id] || []), ...(reclamationsByAgentName[s.name] || [])];
        
        let montantPonctions = 0;
        let montantReclamations = 0;

        agentRecls.forEach(r => {
          if (r.statut === 'Clôturé' || r.statut === 'Transmis') {
            const type = (r.type_erreur || r.motif || r.reclamation_categorie || '').toLowerCase();
            const montant = parseFloat(r.montant || r.montant_estime) || 0;
            if (type === 'ponction') {
              montantPonctions += montant;
            } else if (r.statut === 'Clôturé' && motifsRecl.includes(type)) {
              montantReclamations += montant;
            }
          }
        });

        total_reclamations += montantReclamations;

        // Net final du Journal
        const journalNet = Math.max(0, taxes.netAPayer - montantPonctions) + montantReclamations;
        
        if (s.site && s.site.toLowerCase().includes('administration')) {
          ms_admin += journalNet;
          admin_count++;
        } else {
          ms_agents += journalNet;
          agents_count++;
        }
      });
      
      const res = await apiCall('close_payroll_fluctuation', {
        period,
        chiffre_affaire: ca,
        ms_admin,
        ms_agents,
        admin_count,
        agents_count,
        reclamations_total: total_reclamations
      }, 'POST');
      
      // Préparer une liste enrichie d'agents pour l'archive, en récupérant le site et la zone certifiés par l'Etat de Paie
      const periodPrefix = `${period}_`;
      
      // OPTIMIZATION: Index active statuses by agent name
      const validNames = new Set(salaries.map(s => s.name));
      const statusByAgent = {};
      
      for (const [key, val] of Object.entries(activeStatuses)) {
         if (!key.startsWith(periodPrefix)) continue;
         const middleAndName = key.substring(periodPrefix.length);
         const parts = middleAndName.split('_');
         
         let agentNameCandidate = '';
         for (let i = parts.length - 1; i >= 1; i--) {
             if (agentNameCandidate) agentNameCandidate = parts[i] + '_' + agentNameCandidate;
             else agentNameCandidate = parts[i];
             
             if (validNames.has(agentNameCandidate)) {
                 const extSiteAndZone = parts.slice(0, i).join('_');
                 const lastUnderscore = extSiteAndZone.lastIndexOf('_');
                 let extSite = extSiteAndZone;
                 let extZone = '';
                 if (lastUnderscore !== -1) {
                     extSite = extSiteAndZone.substring(0, lastUnderscore);
                     extZone = extSiteAndZone.substring(lastUnderscore + 1);
                 }
                 
                 if (!statusByAgent[agentNameCandidate]) {
                     statusByAgent[agentNameCandidate] = { site: extSite, zone: extZone, isDraft: val === 'brouillon' };
                 } else if (val !== 'brouillon') {
                     statusByAgent[agentNameCandidate] = { site: extSite, zone: extZone, isDraft: false };
                 }
                 break;
             }
         }
      }
      
      const enrichedSalaries = salaries.map(s => {
         let certifiedSite = s.site;
         let certifiedZone = s.subsite || '';
         const st = statusByAgent[s.name];
         if (st) {
            if (!st.isDraft) {
               certifiedSite = st.site;
               certifiedZone = st.zone;
            } else if (certifiedSite === s.site) {
               certifiedSite = st.site;
               certifiedZone = st.zone;
            }
         }
         return {
           ...s,
           archive_site: certifiedSite,
           archive_zone: certifiedZone
         };
      });

      // -- AJOUT : Archiver automatiquement le Journal en même temps --
      const archRes = await apiCall('archive_payroll', { period, salaries: enrichedSalaries, statuses, sites: activeSites, scope: 'company' }, 'POST');
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


  // ─── isPeriodArchived (besoin avant les hooks) ─────────────────────────────
  const isPeriodArchived = archivedPeriods.includes(period);

  // ─── Handler de fermeture de la modal agent ────────────────────────────────
  // ⚠️  Doit être AVANT tout return conditionnel (Rules of Hooks)
  // Si la modal a été auto-ouverte (retour depuis grille de pointage) ET que la période
  // est archivée, on navigue directement vers le site/zone de l'agent dans l'archive.
  const handleAgentModalClose = React.useCallback(() => {
    const wasAutoOpened = autoOpenedRef.current;
    const agentData = selectedAgentPayrollDetails;
    setSelectedAgentPayrollDetails(null);
    autoOpenedRef.current = false;

    if (wasAutoOpened && agentData && archivedPeriods.includes(period)) {
      pendingArchiveNavRef.current = {
        siteName: agentData.site || agentData.site_name || null,
        zoneName: agentData.subsite || agentData.zone || agentData.sous_site || null,
        agentId:  agentData.id || null,
      };
      setViewMode('archives');
      setSelectedArchive(period);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentPayrollDetails, archivedPeriods, period]);

  // Quand l'archiveDetail se charge (après setSelectedArchive), naviguer vers le site/zone
  React.useEffect(() => {
    if (!pendingArchiveNavRef.current || !archiveDetail) return;
    const { siteName, zoneName } = pendingArchiveNavRef.current;
    pendingArchiveNavRef.current = null;
    if (!siteName) return;
    const matchedSite = sites.find(s =>
      (s.name && s.name === siteName) ||
      (s.nom  && s.nom  === siteName)
    );
    if (matchedSite) {
      setActiveSite({ id: matchedSite.id, name: matchedSite.name || matchedSite.nom });
      if (zoneName) {
        setActiveZone(zoneName);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveDetail]);

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
      let monthLabel = a.period || '';
      if (a.period && a.period.includes('-')) {
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
                    let monthLabel = a.period || '';
                    if (a.period && a.period.includes('-')) {
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


  // ─── BLOCAGE SI CLOTURÉ / ARCHIVÉ (Seulement en Actuel) ──────────────────────
  // Guard : si on attend encore la réponse du backend pour le nav_state (cas ngrok),
  // on n'affiche rien pour éviter le flash de "Période Clôturée" avant la modal agent.
  if (!isArchiveMode && isPeriodArchived && !navStateChecked) {
    return <div style={{ minHeight: '60vh' }} />; // écran vide ~100ms
  }
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
            <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAideModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        {/* ✅ Modal agent : doit s'afficher même quand la période est clôturée
            (retour depuis la grille de pointage via "Voir le pointage") */}
        <AgentPayrollDetailsModal
          agent={selectedAgentPayrollDetails}
          taxes={selectedAgentPayrollDetails ? calculateAgentTaxes(selectedAgentPayrollDetails) : {}}
          funcLabel={funcLabel}
          payrollSettings={payrollSettings}
          onClose={handleAgentModalClose}
          period={period}
          setView={setView}
          noAnimation={autoOpenedRef.current}
        />
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
            <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAideModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          {renderSmartSearchBar()}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAideModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> Aide Comptable
            </button>
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setIsThemeModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> Thème
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
                    <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          title="Paramètres du tableau"
                          onClick={() => setIsColConfigOpen(true)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(148,163,184,0.6)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.2s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.6)'}
                        >
                          <Settings size={13} />
                        </button>
                        <span>#</span>
                      </div>
                    </th>
                    {colVisible('nom') && <th style={{ color: 'white' }}>Nom & Prénom</th>}
                    {colVisible('poste') && <th style={{ color: 'white' }}>Poste</th>}
                    {colVisible('jours') && <th style={{ textAlign: 'center', color: 'white' }}>Jours Trav.</th>}
                    {colVisible('absences') && <th style={{ textAlign: 'center', minWidth: '100px', color: 'var(--danger)' }}>Absences</th>}
                    {colVisible('map') && <th style={{ textAlign: 'center', color: 'var(--danger)', minWidth: '100px' }}>MAP</th>}
                    {colVisible('permission') && <th style={{ textAlign: 'center', color: '#8b5cf6', minWidth: '100px' }}>Permission</th>}
                    {colVisible('base') && <th style={{ textAlign: 'right', color: 'white' }}>Base (XOF)</th>}
                    {colVisible('retenues') && <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Retenues</th>}
                    {colVisible('prime_site') && <th style={{ textAlign: 'right', color: '#22c55e' }}>Prime Site</th>}
                    {colVisible('suppl') && <th style={{ textAlign: 'right', color: 'var(--b)' }}>Suppl.</th>}
                    {colVisible('anciennete') && <th style={{ textAlign: 'right', color: '#a855f7' }}>Ancienneté</th>}
                    {payrollSettings.enable_sursalaire !== false && colVisible('sursalaire') ? <th style={{ textAlign: 'right', color: '#38bdf8' }}>Sursalaire</th> : null}
                    {colVisible('brut') && <th style={{ textAlign: 'right', color: 'white' }}>Brut</th>}
                    {payrollSettings.enable_cnps_salarial !== false && colVisible('cnps_sal') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>CNPS Sal.</th> : null}
                    {payrollSettings.enable_cmu_employe !== false && colVisible('cmu_sal') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>CMU Sal.</th> : null}
                    {payrollSettings.enable_its !== false && colVisible('its') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>ITS</th> : null}
                    {payrollSettings.enable_cnps_patronal !== false && colVisible('cnps_pat') ? <th style={{ textAlign: 'right', color: '#f59e0b' }}>CNPS Pat.</th> : null}
                    {payrollSettings.enable_cmu_employeur !== false && colVisible('cmu_pat') ? <th style={{ textAlign: 'right', color: '#f59e0b' }}>CMU Pat.</th> : null}
                    {payrollSettings.enable_accidents_travail !== false && colVisible('acc_trav') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Acc. Trav.</th> : null}
                    {payrollSettings.enable_fdfp !== false && colVisible('fdfp') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>FDFP</th> : null}
                    {payrollSettings.enable_taxe_apprentissage !== false && colVisible('taxe_appr') ? <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Taxe Appr.</th> : null}
                    {colVisible('av_prets') && <th style={{ textAlign: 'right', color: '#f43f5e' }}>Av/Prêts</th>}
                    {colVisible('conges') && <th style={{ textAlign: 'center', color: '#06b6d4', minWidth: '100px' }}>Congés</th>}
                    {colVisible('net') && <th style={{ textAlign: 'right', color: 'var(--a)', minWidth: '100px' }}>Net à Payer</th>}
                    {colVisible('statut') && <th style={{ textAlign: 'center', minWidth: '100px' }}>Statut</th>}
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
                          {colVisible('nom') && <td style={{ fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap' }}>
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
                              {(() => {
                                const isAgentSortant = (
                                  s.is_sortant === true ||
                                  ['sortant', 'abandon', 'demission', 'licencie', 'retire'].includes(s.status?.toLowerCase()) || 
                                  !!s.exit_reason || 
                                  (s.absence_details && s.absence_details.some(d => 
                                    ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(d.reason) || 
                                    (d.reason && d.reason.startsWith('SORTANT_'))
                                  ))
                                );
                                return (
                                  <span 
                                    style={{ 
                                      cursor: 'default', 
                                      color: isAgentSortant ? '#ef4444' : 'inherit' 
                                    }}
                                    title={isAgentSortant ? 'Agent Sortant (Inactif)' : ''}
                                  >{s.name}</span>
                                );
                              })()}
                            </div>
                          </td>}
                          {colVisible('poste') && <td style={{ cursor: s.profile_data?.mutation_breakdown ? 'pointer' : (s.status_change ? 'pointer' : 'default') }} onClick={() => {
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
                          </td>}
                          {colVisible('jours') && <td 
                            style={{ 
                              textAlign: 'center', 
                              fontWeight: '600', 
                              color: 'white',
                              cursor: 'default',
                            }}
                          >
                            <span style={{ borderBottom: 'none', paddingBottom: '2px', color: 'white' }}>
                              {s.days_worked ?? (30 - (s.absences||0) - (s.map_count||0) - (s.entrant_sortant_count||0))}
                            </span>
                          </td>}
                          {colVisible('absences') && <td style={{ textAlign: 'center' }}>
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
                          </td>}
                          {colVisible('map') && <td style={{ textAlign: 'center' }}>
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
                          </td>}
                          {colVisible('permission') && <td style={{ textAlign: 'center' }}>
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
                          </td>}
                          {colVisible('base') && <td style={{ textAlign: 'right', color: 'white' }}>{((s.base_full || s.base) || 0).toLocaleString()}</td>}
                          {colVisible('retenues') && <td style={{ textAlign: 'right', color: s.deductions > 0 ? 'var(--danger)' : 'var(--muted)' }}>{s.deductions > 0 ? `-${(s.deductions||0).toLocaleString()}` : '—'}</td>}
                          {colVisible('prime_site') && (
                        <td style={{ textAlign: 'right', color: s.is_prime_excluded ? '#94a3b8' : '#22c55e', fontWeight: (s.prime_site||0) > 0 || s.is_prime_excluded ? '700' : '400' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            {s.is_prime_excluded ? (
                              <>
                                <ShieldOff size={14} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={(e) => { e.stopPropagation(); setPrimeExclusionModal({agent: {id: s.id, name: `${s.nom} ${s.prenoms}`, profile_data: s.profile_data, is_prime_excluded: s.is_prime_excluded}}); }} title="Activer la prime" />
                                <span style={{ textDecoration: 'line-through', color: '#64748b' }}>Désactivée</span>
                              </>
                            ) : (
                              <>
                                {((s.prime_site||0) > 0) && (
                                  <ShieldOff size={14} color="#64748b" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); setPrimeExclusionModal({agent: {id: s.id, name: `${s.nom} ${s.prenoms}`, profile_data: s.profile_data, is_prime_excluded: s.is_prime_excluded}}); }} title="Désactiver la prime" />
                                )}
                                {(s.prime_site||0) > 0 ? `+${(s.prime_site||0).toLocaleString()}` : '—'}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                          {colVisible('suppl') && <td style={{ textAlign: 'right', color: s.gains > 0 ? '#8b5cf6' : 'var(--muted)', fontWeight: s.gains > 0 ? '700' : '400' }}>
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
                          </td>}
                          {colVisible('anciennete') && <td style={{ textAlign: 'right', color: '#a855f7' }}>+{calculateAgentTaxes(s).primeAnciennete.toLocaleString()}</td>}
                          {payrollSettings.enable_sursalaire !== false && colVisible('sursalaire') ? (<td style={{ textAlign: 'right', color: '#38bdf8' }}>+{calculateAgentTaxes(s).primeVariable.toLocaleString()}</td>) : null}
                          {colVisible('brut') && <td style={{ textAlign: 'right', color: 'white', fontWeight: 'bold' }}>{calculateAgentTaxes(s).brut.toLocaleString()}</td>}
                          {payrollSettings.enable_cnps_salarial !== false && colVisible('cnps_sal') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).cnpsSalarial.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cmu_employe !== false && colVisible('cmu_sal') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).cmuEmploye.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_its !== false && colVisible('its') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).impotsTaxes.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cnps_patronal !== false && colVisible('cnps_pat') ? (<td style={{ textAlign: 'right', color: '#f59e0b' }}>+{calculateAgentTaxes(s).cnpsPatronal.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_cmu_employeur !== false && colVisible('cmu_pat') ? (<td style={{ textAlign: 'right', color: '#f59e0b' }}>+{calculateAgentTaxes(s).cmuEmployeur.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_accidents_travail !== false && colVisible('acc_trav') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).accidentsTravail.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_fdfp !== false && colVisible('fdfp') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).taxeFormation.toLocaleString()}</td>) : null}
                          {payrollSettings.enable_taxe_apprentissage !== false && colVisible('taxe_appr') ? (<td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{calculateAgentTaxes(s).taxeApprentissage.toLocaleString()}</td>) : null}
                          {colVisible('av_prets') && <td style={{ textAlign: 'right', color: calculateAgentTaxes(s).totalDeductionsNettes > 0 ? '#f43f5e' : 'var(--muted)', fontWeight: calculateAgentTaxes(s).totalDeductionsNettes > 0 ? '700' : '400' }}>{calculateAgentTaxes(s).totalDeductionsNettes > 0 ? `-${calculateAgentTaxes(s).totalDeductionsNettes.toLocaleString()}` : '—'}</td>}
                          {colVisible('conges') && <td style={{ textAlign: 'center' }}>
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
                          </td>}
                          {colVisible('net') && <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.05rem' }}>{calculateAgentTaxes(s).netAPayer.toLocaleString()}</td>}
                          {colVisible('statut') && <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => cycleStatus(s.name, activeSite.id, activeZone)}
                              style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}50`, borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700', cursor: st.next ? 'pointer' : 'default', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                              title={st.next ? `Passer à : ${STATUSES[st.next]?.label}` : 'Statut final'}
                            >
                              {status === 'paye' && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                              {st.label}
                            </button>
                          </td>}
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
        <AgentPayrollDetailsModal agent={selectedAgentPayrollDetails} taxes={selectedAgentPayrollDetails ? calculateAgentTaxes(selectedAgentPayrollDetails) : {}} funcLabel={funcLabel} payrollSettings={payrollSettings} onClose={handleAgentModalClose} period={period} setView={setView} noAnimation={autoOpenedRef.current} />
        <AgentDetailsModal agent={selectedAgentDetails} onClose={() => setSelectedAgentDetails(null)} />
        <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
        <StatusChangeInfoModalComponent agent={statusChangeInfoModal} onClose={() => setStatusChangeInfoModal(null)} />

      {primeExclusionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldOff size={20} color={primeExclusionModal.agent.is_prime_excluded ? "#22c55e" : "#ef4444"}/> 
              {primeExclusionModal.agent.is_prime_excluded ? 'Réactiver la Prime de Site' : 'Désactiver la Prime de Site'}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Pour l'agent <strong>{primeExclusionModal.agent.name}</strong>, comment souhaitez-vous {primeExclusionModal.agent.is_prime_excluded ? 'réactiver' : 'désactiver'} la prime de site ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {primeExclusionModal.agent.is_prime_excluded ? (
                <button
                  type="button"
                  disabled={primeExclusionLoading}
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'none')}
                  style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                >
                  {primeExclusionLoading && <span style={{ width: '14px', height: '14px', border: '2px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                  Réactiver la prime (Annuler la désactivation)
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={primeExclusionLoading}
                    onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'period')}
                    style={{ padding: '12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                  >
                    {primeExclusionLoading && <span style={{ width: '14px', height: '14px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                    Pour ce mois uniquement
                  </button>
                  <button
                    type="button"
                    disabled={primeExclusionLoading}
                    onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'permanent')}
                    style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                  >
                    {primeExclusionLoading && <span style={{ width: '14px', height: '14px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                    Définitivement (Tous les mois)
                  </button>
                </>
              )}

            </div>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button onClick={() => setPrimeExclusionModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}


        <PayrollColumnsModal
          isOpen={isColConfigOpen}
          visibleCols={visibleCols ?? {}}
          payrollSettings={payrollSettings}
          onChange={handleColChange}
          onClose={() => setIsColConfigOpen(false)}
          saveStatus={colSaveStatus}
        />
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
                <button 
                  onClick={() => setBulkConfirmModal({ status: 'valide', siteName: activeSite.name, siteId: activeSite.id })} 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.3)'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                  disabled={isBulkUpdating}
                  title="Tout marquer comme vérifié"
                >
                  {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} 
                  Tout vérifier
                </button>
                <button 
                  onClick={() => setBulkConfirmModal({ status: 'paye', siteName: activeSite.name, siteId: activeSite.id })} 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)'; e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; }}
                  disabled={isBulkUpdating}
                  title="Tout marquer comme payé"
                >
                  {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 
                  Tout payer
                </button>
                <button 
                  onClick={() => setBulkConfirmModal({ status: 'brouillon', siteName: activeSite.name, siteId: activeSite.id })} 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }} 
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(148, 163, 184, 0.3)'; e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'; }}
                  disabled={isBulkUpdating}
                  title="Tout remettre en brouillon"
                >
                  {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} 
                  Tout annuler
                </button>
                
              </>
            )}
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
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
        
        {bulkConfirmModal && (
          <BulkConfirmModal
            status={bulkConfirmModal.status}
            siteName={bulkConfirmModal.siteName}
            onConfirm={() => {
              handleBulkStatusChange(bulkConfirmModal.status, bulkConfirmModal.siteName, bulkConfirmModal.siteId);
              setBulkConfirmModal(null);
            }}
            onClose={() => setBulkConfirmModal(null)}
          />
        )}

        <AgentPayrollDetailsModal agent={selectedAgentPayrollDetails} taxes={selectedAgentPayrollDetails ? calculateAgentTaxes(selectedAgentPayrollDetails) : {}} funcLabel={funcLabel} payrollSettings={payrollSettings} onClose={handleAgentModalClose} period={period} setView={setView} noAnimation={autoOpenedRef.current} />
        <AgentDetailsModal agent={selectedAgentDetails} onClose={() => setSelectedAgentDetails(null)} />
        <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
        <ClotureModals 
          showClotureConfirmModal={showClotureConfirmModal} setShowClotureConfirmModal={setShowClotureConfirmModal}
          showClotureSuccessModal={showClotureSuccessModal} setShowClotureSuccessModal={setShowClotureSuccessModal}
          showClotureWarningModal={showClotureWarningModal} setShowClotureWarningModal={setShowClotureWarningModal}
          clotureLoading={clotureLoading} clotureErrorMsg={clotureErrorMsg} handleClotureFluctuationConfirm={handleClotureFluctuationConfirm}
          period={period} formatPeriod={formatPeriod}
        />
        
        {showArchiveConfirmModal && (
          <ArchiveConfirmModal
            period={formatPeriod(period)}
            onConfirm={confirmArchiveAction}
            onClose={() => setShowArchiveConfirmModal(false)}
            loading={archiveActionLoading}
          />
        )}
        
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
        </div>
        {renderSmartSearchBar()}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isArchiveMode && (
            <>
              <button 
                className="btn" 
                onClick={() => setGlobalPayConfirmModal(true)} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', transition: 'all 0.2s', fontWeight: 'bold' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                disabled={isBulkUpdating}
                title="Tout payer pour tous les sites"
              >
                {isBulkUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Tout payer
              </button>
              <button className="btn btn-primary" onClick={handleClotureFluctuation} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} title="Clôturer l'état de paie pour la fluctuation salariale">
                <CheckCircle2 size={16} /> Clôturer
                {globalProgress === 100 && (
                  <span style={{
                    position: 'absolute', top: '-10px', right: '-10px', 
                    background: '#22c55e', color: 'white', fontSize: '0.65rem', fontWeight: 'bold',
                    padding: '2px 6px', borderRadius: '10px', border: '2px solid #0f172a',
                    animation: 'pulseReady 2s infinite', boxShadow: '0 0 10px rgba(34,197,94,0.5)'
                  }}>Prêt</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 16px 0', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
              Sélectionnez un site pour accéder à ses zones, puis aux états de paie.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '20px', padding: '5px 14px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <span style={{ color: 'var(--b)', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                {String(activeSites.length).padStart(2, '0')} site{activeSites.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
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

              const matchedAgents = globalSearchText.trim() ? agentsForSite(site.name) : [];

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

                  {matchedAgents.length > 0 && (
                    <div 
                      style={{ marginTop: '14px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(56,189,248,0.25)', padding: '10px 12px', borderRadius: '12px', maxHeight: '140px', overflowY: 'auto' }} 
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '800', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        AGENTS TROUVÉS ({matchedAgents.length}) :
                      </div>
                      {matchedAgents.map((a, aIdx) => (
                        <div
                          key={a.id || `matched-agent-${aIdx}`}
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.85rem',
                            color: '#f8fafc',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            background: 'rgba(255, 255, 255, 0.04)',
                            marginBottom: '4px'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSite({ id: site.id, name: site.name });
                            if (a.subsite) {
                              setActiveZone(a.subsite);
                            }
                            setSelectedAgentPayrollDetails(a);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                            <span style={{ color: '#38bdf8' }}>👤</span> {a.name}
                          </div>
                          {a.subsite && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '6px' }}>
                              {a.subsite}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

      <AgentPayrollDetailsModal agent={selectedAgentPayrollDetails} taxes={selectedAgentPayrollDetails ? calculateAgentTaxes(selectedAgentPayrollDetails) : {}} funcLabel={funcLabel} payrollSettings={payrollSettings} onClose={handleAgentModalClose} period={period} setView={setView} noAnimation={autoOpenedRef.current} />
      <MutationDetailsModal selectedMutationDetails={selectedMutationDetails} onClose={() => setSelectedMutationDetails(null)} />
      <ClotureModals 
        showClotureConfirmModal={showClotureConfirmModal} setShowClotureConfirmModal={setShowClotureConfirmModal}
        showClotureSuccessModal={showClotureSuccessModal} setShowClotureSuccessModal={setShowClotureSuccessModal}
        showClotureWarningModal={showClotureWarningModal} setShowClotureWarningModal={setShowClotureWarningModal}
        clotureLoading={clotureLoading} clotureErrorMsg={clotureErrorMsg} handleClotureFluctuationConfirm={handleClotureFluctuationConfirm}
        period={period} formatPeriod={formatPeriod}
      />

      {showArchiveConfirmModal && (
        <ArchiveConfirmModal
          period={formatPeriod(period)}
          onConfirm={confirmArchiveAction}
          onClose={() => setShowArchiveConfirmModal(false)}
          loading={archiveActionLoading}
        />
      )}
      
      {globalPayConfirmModal && (
        <BulkConfirmModal
          status="paye"
          siteName="TOUS LES SITES"
          onConfirm={() => {
            handleGlobalPay();
            setGlobalPayConfirmModal(false);
          }}
          onClose={() => setGlobalPayConfirmModal(false)}
        />
      )}

      {showAideModal && <AideComptableModal onClose={() => setShowAideModal(false)} />}
      
      <StatusChangeInfoModalComponent agent={statusChangeInfoModal} onClose={() => setStatusChangeInfoModal(null)} />

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseReady {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @media print { .sidebar,.nav-links,.top-bar button{display:none!important} }
      `}</style>
    </div>
  );
}
