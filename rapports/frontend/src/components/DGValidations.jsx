import React, { useState } from 'react';
import { Target, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DGValidations() {
  const [validations, setValidations] = useState([
    { id: 1, type: 'Recrutement', title: 'Création de 3 nouveaux postes (Sécurité)', amount: '1,200,000 FCFA/mois', requester: 'RH', status: 'pending' },
    { id: 2, type: 'Matériel', title: 'Achat de 50 radios TETRA', amount: '2,500,000 FCFA', requester: 'Logistique', status: 'pending' },
    { id: 3, type: 'Prime', title: 'Prime exceptionnelle (Site Alpha)', amount: '450,000 FCFA', requester: 'Opérations', status: 'pending' }
  ]);

  const handleAction = (id, action) => {
    setValidations(validations.filter(v => v.id !== id));
    // In a real app, this would call the API
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#eab308' }}>
            <Target size={32} /> Validations Exécutives
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.5' }}>
            Approuvez ou rejetez les demandes critiques, les dépenses exceptionnelles et les changements structurels majeurs.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {validations.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: 'white', margin: '0 0 8px 0' }}>Aucune validation en attente</h2>
            <p style={{ margin: 0 }}>Toutes les demandes ont été traitées.</p>
          </div>
        ) : (
          validations.map((v) => (
            <div key={v.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #eab308' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {v.type}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Demandé par {v.requester}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'white' }}>{v.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold' }}>
                  <AlertTriangle size={16} /> Impact estimé : {v.amount}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleAction(v.id, 'reject')}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <XCircle size={18} /> Rejeter
                </button>
                <button 
                  onClick={() => handleAction(v.id, 'approve')}
                  style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                >
                  <CheckCircle size={18} /> Approuver <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
