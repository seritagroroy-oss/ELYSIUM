import React, { useState } from 'react';
import { Key, ShieldAlert, UserPlus, RefreshCw, Eye, Lock, CheckCircle2, History } from 'lucide-react';

export default function PDGAccesMaitre() {
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [created, setCreated] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleCreateAdmin = () => {
    if (!adminName || !adminEmail) return;
    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setAdminName('');
      setAdminEmail('');
    }, 4000);
  };

  const handleResetDG = () => {
    setResetting(true);
    setTimeout(() => setResetting(false), 3000);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Key size={32} /> Accès Maître & Super-Contrôle
          </h1>
          <p style={{ margin: 0, color: 'rgba(239,68,68,0.8)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Zone restreinte (Niveau 0). Gestion des privilèges d'administration et de direction.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Création d'Admin */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#ef4444" /> Déléguer un Accès Administrateur
          </h3>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Créez un compte "Admin" pour confier la gestion quotidienne des paramètres (sans donner accès aux données financières PDG).</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Nom complet</label>
              <input type="text" className="form-input" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Ex: Jean Dupont" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Email Professionnel</label>
              <input type="email" className="form-input" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@entreprise.com" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <button onClick={handleCreateAdmin} disabled={!adminName || !adminEmail || created} style={{ width: '100%', padding: '14px', background: created ? '#22c55e' : 'rgba(239,68,68,0.1)', border: `1px solid ${created ? '#22c55e' : '#ef4444'}`, color: created ? '#0a0a0a' : '#ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: (!adminName || !adminEmail || created) ? 'default' : 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {created ? <><CheckCircle2 size={18} /> Compte Admin Créé et Email Envoyé</> : 'Générer Accès Admin'}
          </button>
        </div>

        {/* Contrôle DG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="#d4af37" /> Sécurité Compte DG
            </h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Si le Directeur Général perd son accès, seul le PDG peut forcer la réinitialisation de son mot de passe de manière sécurisée.</p>
            
            <button onClick={handleResetDG} disabled={resetting} style={{ padding: '14px 24px', background: resetting ? '#d4af37' : 'rgba(255,255,255,0.05)', border: resetting ? 'none' : '1px solid rgba(255,255,255,0.1)', color: resetting ? '#0a0a0a' : 'white', borderRadius: '8px', fontWeight: 'bold', cursor: resetting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
              {resetting ? <><CheckCircle2 size={18} /> Lien de réinitialisation envoyé au DG</> : <><RefreshCw size={18} /> Forcer Réinitialisation MDP DG</>}
            </button>
          </div>

          <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', flex: 1 }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#38bdf8" /> Journal de Connexion Admins
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Admin Système', ip: '192.168.1.45', time: 'Aujourd\'hui, 08:30' },
                { name: 'Admin RH', ip: '10.0.0.12', time: 'Hier, 14:15' },
                { name: 'Admin Système', ip: '192.168.1.45', time: '05 Juin, 09:00' }
              ].map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{log.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>IP: {log.ip}</div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{log.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
