import React, { useState } from 'react';
import { Map, MapPin, Power, ShieldOff, ShieldCheck, Users, Banknote, AlertTriangle } from 'lucide-react';

const INITIAL_SITES = [
  { id: 1, name: 'Siège Central — Plateau', city: 'Abidjan', status: 'active', agents: 45, cost: 12500000, risk: 'low' },
  { id: 2, name: 'Zone Industrielle', city: 'Yopougon', status: 'active', agents: 120, cost: 28000000, risk: 'medium' },
  { id: 3, name: 'Résidence Diplomatique', city: 'Cocody', status: 'active', agents: 18, cost: 6500000, risk: 'low' },
  { id: 4, name: 'Port Autonome', city: 'San Pedro', status: 'suspended', agents: 85, cost: 18400000, risk: 'high', reason: 'Litige facturation client' },
  { id: 5, name: 'Complexe Agro', city: 'Bouaké', status: 'active', agents: 64, cost: 14200000, risk: 'medium' },
];

export default function PDGSites() {
  const [sites, setSites] = useState(INITIAL_SITES);
  const [confirmModal, setConfirmModal] = useState(null); // null or site object

  const toggleSiteStatus = (siteId) => {
    setSites(s => s.map(site => {
      if (site.id === siteId) {
        return { 
          ...site, 
          status: site.status === 'active' ? 'suspended' : 'active',
          reason: site.status === 'active' ? 'Décision souveraine du PDG' : undefined
        };
      }
      return site;
    }));
    setConfirmModal(null);
  };

  const activeSites = sites.filter(s => s.status === 'active').length;
  const totalAgents = sites.reduce((acc, s) => acc + s.agents, 0);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Map size={32} /> Contrôle des Sites & Filiales
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Vision globale du déploiement territorial. Vous avez le pouvoir de geler ou réactiver instantanément n'importe quel site.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37' }}>{activeSites}/{sites.length}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Sites Actifs</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{totalAgents}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Agents Déployés</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {sites.map(site => (
          <div key={site.id} style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: `1px solid ${site.status === 'active' ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', opacity: site.status === 'active' ? 1 : 0.8 }}>
            
            {site.status === 'suspended' && (
              <div style={{ position: 'absolute', top: '16px', right: '-32px', background: '#ef4444', color: 'white', fontWeight: 'bold', padding: '4px 40px', transform: 'rotate(45deg)', fontSize: '0.8rem', letterSpacing: '1px', zIndex: 10 }}>
                SUSPENDU
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {site.name}
                </h3>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {site.city}
                </div>
              </div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: site.status === 'active' ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${site.status === 'active' ? '#22c55e' : '#ef4444'}` }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> Effectif</div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{site.agents}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Banknote size={14} /> Coût mensuel</div>
                <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem' }}>{(site.cost/1000000).toFixed(1)}M</div>
              </div>
            </div>

            {site.status === 'suspended' && (
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '24px', borderLeft: '3px solid #ef4444' }}>
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Motif de suspension :</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{site.reason}</div>
              </div>
            )}

            <button 
              onClick={() => setConfirmModal(site)}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: site.status === 'active' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)', background: site.status === 'active' ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)', color: site.status === 'active' ? '#ef4444' : '#22c55e', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <Power size={18} /> {site.status === 'active' ? 'Suspendre ce site' : 'Réactiver ce site'}
            </button>
          </div>
        ))}
      </div>

      {confirmModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, borderRadius: '24px' }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #d4af37', padding: '40px', borderRadius: '20px', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
            {confirmModal.status === 'active' ? (
              <ShieldOff size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
            ) : (
              <ShieldCheck size={64} color="#22c55e" style={{ marginBottom: '24px' }} />
            )}
            
            <h2 style={{ color: 'white', margin: '0 0 16px 0' }}>
              {confirmModal.status === 'active' ? 'Confirmer la suspension ?' : 'Confirmer la réactivation ?'}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: '1.5', marginBottom: '32px' }}>
              {confirmModal.status === 'active' 
                ? `Vous êtes sur le point de geler complètement le site "${confirmModal.name}". Tous les accès et pointages liés à ce site seront bloqués.` 
                : `Vous allez rétablir l'activité normale pour le site "${confirmModal.name}". Les agents pourront à nouveau pointer.`}
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => toggleSiteStatus(confirmModal.id)} style={{ flex: 1, background: confirmModal.status === 'active' ? '#ef4444' : '#22c55e', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${confirmModal.status === 'active' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}` }}>
                {confirmModal.status === 'active' ? 'Oui, Suspendre' : 'Oui, Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
