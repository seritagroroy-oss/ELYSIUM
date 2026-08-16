import React, { useState } from 'react';
import { Lock, Unlock, FileText, Download, ShieldAlert, KeyRound } from 'lucide-react';

export default function PDGCoffre() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    // Simulation: Any 4 digit pin unlocks for demo, except '0000'
    if (pin.length >= 4 && pin !== '0000') {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const DOCUMENTS = [
    { id: 1, name: 'Statuts de l\'Entreprise.pdf', size: '2.4 MB', date: 'Créé le 12/04/2015', type: 'Fondateur' },
    { id: 2, name: 'K-Bis & Registre Commerce.pdf', size: '1.1 MB', date: 'Mis à jour le 01/01/2026', type: 'Légal' },
    { id: 3, name: 'Pacte d\'Actionnaires.pdf', size: '5.8 MB', date: 'Signé le 15/06/2020', type: 'Confidentiel' },
    { id: 4, name: 'RIB Master (Comptes Séquestres).pdf', size: '0.5 MB', date: 'Mis à jour le 10/03/2026', type: 'Finance' },
    { id: 5, name: 'Titres de Propriété Immobilière.zip', size: '14.2 MB', date: 'Créé le 22/09/2018', type: 'Actifs' }
  ];

  if (!unlocked) {
    return (
      <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: `1px solid ${error ? '#ef4444' : '#d4af37'}`, borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: error ? '0 0 30px rgba(239,68,68,0.2)' : '0 0 30px rgba(212,175,55,0.1)' }}>
          <Lock size={64} color={error ? '#ef4444' : '#d4af37'} style={{ marginBottom: '24px' }} />
          <h2 style={{ color: 'white', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Salle des Coffres</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.9rem' }}>Niveau d'habilitation Requis : PDG</p>
          
          <form onSubmit={handleUnlock}>
            <div style={{ marginBottom: '24px' }}>
              <input 
                type="password" 
                value={pin}
                onChange={e => { setPin(e.target.value); setError(false); }}
                placeholder="Code PIN" 
                maxLength={6}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${error ? '#ef4444' : 'rgba(212,175,55,0.3)'}`, color: 'white', padding: '16px', borderRadius: '12px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px' }} 
              />
              {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px' }}>Code d'accès incorrect. Accès refusé.</div>}
            </div>
            <button type="submit" style={{ width: '100%', background: '#d4af37', color: '#0a0a0a', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <KeyRound size={20} /> Déverrouiller le coffre
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Unlock size={32} /> La Salle des Coffres
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Documents fondateurs et archives souveraines. Accès strictement confidentiel.
          </p>
        </div>
        <button onClick={() => setUnlocked(false)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <Lock size={16} /> Verrouiller et Quitter
        </button>
      </div>

      <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <ShieldAlert size={20} color="#ef4444" />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Toute action de téléchargement dans cet espace est journalisée et conservée indéfiniment.</span>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {DOCUMENTS.map(doc => (
            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer' }} className="hover-highlight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(212,175,55,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} color="#d4af37" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{doc.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: '16px' }}>
                    <span>{doc.size}</span>
                    <span>{doc.date}</span>
                    <span style={{ color: '#d4af37' }}>{doc.type}</span>
                  </div>
                </div>
              </div>
              <button style={{ background: 'transparent', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
