import React, { useState } from 'react';
import { FileText, Plus, X, CheckCircle2, Clock, User, ChevronRight, Edit3, Archive } from 'lucide-react';

const INITIAL_PV = [
  {
    id: 1,
    title: 'CODIR — Bilan RH du 1er Semestre',
    date: '2026-06-05',
    status: 'signed',
    participants: ['Direction Générale', 'RH', 'Comptabilité', 'Logistique'],
    summary: 'Revue des objectifs S1. Absentéisme à 4.8%, objectif non atteint. Décision : lancement d\'un plan d\'action bien-être agent dès juillet.',
    actions: [
      { id: 'a1', label: 'RH : Lancer enquête satisfaction agents', due: '15/07/2026', done: false },
      { id: 'a2', label: 'Compta : Valider budget programme bien-être', due: '20/07/2026', done: false },
    ]
  },
  {
    id: 2,
    title: 'Réunion Sécurité — Procédure Confinement',
    date: '2026-05-28',
    status: 'signed',
    participants: ['Direction Générale', 'Secrétariat', 'Sécurité Site'],
    summary: 'Mise à jour de la procédure d\'évacuation. Validation du protocole d\'alerte digital via la plateforme.',
    actions: [
      { id: 'a3', label: 'Secrétariat : Former les équipes sur la nouvelle alerte digitale', due: '10/06/2026', done: true },
    ]
  },
];

export default function DGPV() {
  const [pvList, setPvList] = useState(INITIAL_PV);
  const [selectedPV, setSelectedPV] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newParticipants, setNewParticipants] = useState('');

  const toggleAction = (pvId, actionId) => {
    setPvList(list => list.map(pv => pv.id === pvId ? {
      ...pv,
      actions: pv.actions.map(a => a.id === actionId ? { ...a, done: !a.done } : a)
    } : pv));
  };

  const handleCreate = () => {
    if (!newTitle) return;
    const newPV = {
      id: Date.now(),
      title: newTitle,
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      participants: newParticipants.split(',').map(p => p.trim()).filter(Boolean),
      summary: newSummary,
      actions: [],
    };
    setPvList(l => [newPV, ...l]);
    setShowNew(false);
    setNewTitle(''); setNewSummary(''); setNewParticipants('');
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#34d399' }}>
            <FileText size={32} /> Compte Rendu de Réunions
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Rédigez, archivez et diffusez les PV de vos réunions de direction avec suivi des points d'action.
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ background: '#34d399', color: '#1e293b', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(52,211,153,0.3)' }}>
          <Plus size={18} /> Nouveau PV
        </button>
      </div>

      {/* New PV Form */}
      {showNew && (
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', borderTop: '4px solid #34d399' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#34d399' }}>Nouveau Procès-Verbal</h3>
            <button onClick={() => setShowNew(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ color: 'white', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Titre de la réunion *</label>
              <input type="text" className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: CODIR — Bilan du Trimestre" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ color: 'white', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Participants (séparés par virgule)</label>
              <input type="text" className="form-input" value={newParticipants} onChange={e => setNewParticipants(e.target.value)} placeholder="RH, Comptabilité, Direction..." style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ color: 'white', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Résumé & Décisions</label>
              <textarea className="form-input" value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Rédigez le compte rendu de la réunion..." style={{ width: '100%', minHeight: '120px', resize: 'vertical' }} />
            </div>
            <button onClick={handleCreate} style={{ background: '#34d399', color: '#1e293b', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} /> Créer et Archiver le PV
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {pvList.map(pv => (
          <div key={pv.id} className="glass-panel" style={{ padding: '24px', borderLeft: `4px solid ${pv.status === 'signed' ? '#34d399' : '#f59e0b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: pv.status === 'signed' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: pv.status === 'signed' ? '#34d399' : '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {pv.status === 'signed' ? <><Archive size={12} /> Archivé</> : <><Edit3 size={12} /> Brouillon</>}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{pv.date}</span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '1.1rem' }}>{pv.title}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {pv.participants.map((p, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{p}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedPV(selectedPV?.id === pv.id ? null : pv)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                {selectedPV?.id === pv.id ? 'Réduire' : 'Voir le détail'} <ChevronRight size={14} style={{ transform: selectedPV?.id === pv.id ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }} />
              </button>
            </div>

            {selectedPV?.id === pv.id && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '20px' }}>{pv.summary}</p>
                {pv.actions.length > 0 && (
                  <div>
                    <h4 style={{ color: 'white', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#34d399" /> Points d'Action
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pv.actions.map(action => (
                        <div key={action.id} onClick={() => toggleAction(pv.id, action.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: action.done ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${action.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${action.done ? '#34d399' : 'rgba(255,255,255,0.3)'}`, background: action.done ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                            {action.done && <CheckCircle2 size={12} color="#1e293b" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: action.done ? 'var(--muted)' : 'white', textDecoration: action.done ? 'line-through' : 'none', fontSize: '0.9rem' }}>{action.label}</div>
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', flexShrink: 0 }}>Avant le {action.due}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
