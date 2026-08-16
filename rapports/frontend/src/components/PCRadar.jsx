import React, { useState, useEffect } from 'react';
import { Crosshair, MapPin, Radio, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function PCRadar() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const SITES = [
    { id: 1, name: 'Siège Central - Plateau', status: 'normal', agents: 45, x: '50%', y: '50%' },
    { id: 2, name: 'Zone Industrielle - Yopougon', status: 'alert', type: 'Intrusion', agents: 120, x: '25%', y: '40%' },
    { id: 3, name: 'Port Autonome - San Pedro', status: 'normal', agents: 85, x: '20%', y: '80%' },
    { id: 4, name: 'Résidence Diplomatique - Cocody', status: 'normal', agents: 18, x: '65%', y: '45%' },
    { id: 5, name: 'Complexe Agro - Bouaké', status: 'warning', type: 'Perte Comms', agents: 64, x: '45%', y: '20%' },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(59,130,246,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
            <Crosshair size={32} /> Radar Tactique Central
          </h1>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} color="#22c55e" /> SYSTÈME EN LIGNE</span>
            <span>|</span>
            <span>DERNIÈRE SYNCHRO: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', padding: '8px 16px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{SITES.filter(s => s.status === 'normal').length}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Sites Sécurisés</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '4px', textAlign: 'center', animation: SITES.some(s => s.status === 'alert') ? 'pulse 2s infinite' : 'none' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{SITES.filter(s => s.status === 'alert').length}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Alerte Critique</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Radar Vue Map */}
        <div style={{ position: 'relative', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', height: '600px', overflow: 'hidden' }}>
          {/* Grille Radar */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1000px', height: '1000px', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(59,130,246,0.2)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(59,130,246,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '200px', height: '200px', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px dashed rgba(59,130,246,0.4)', pointerEvents: 'none' }} />
          
          {/* Ligne Balayage Radar (Simulation via CSS possible, ici on met juste l'axe) */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(59,130,246,0.3)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(59,130,246,0.3)' }} />

          {/* Points des sites */}
          {SITES.map(site => (
            <div key={site.id} style={{ position: 'absolute', left: site.x, top: site.y, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '16px', height: '16px', borderRadius: '50%', 
                background: site.status === 'normal' ? '#22c55e' : (site.status === 'alert' ? '#ef4444' : '#f59e0b'),
                boxShadow: `0 0 15px ${site.status === 'normal' ? '#22c55e' : (site.status === 'alert' ? '#ef4444' : '#f59e0b')}`,
                animation: site.status !== 'normal' ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'inherit', borderRadius: '50%', zIndex: 10 }} />
              </div>
              <div style={{ marginTop: '8px', background: 'rgba(15,23,42,0.8)', border: `1px solid ${site.status === 'normal' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.5)'}`, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontWeight: 'bold', color: site.status === 'normal' ? '#e2e8f0' : (site.status === 'alert' ? '#ef4444' : '#f59e0b') }}>{site.name}</div>
                {site.type && <div style={{ color: site.status === 'alert' ? '#ef4444' : '#f59e0b' }}>⚠️ {site.type}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Panneau latéral Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> Menaces Actives
            </h3>
            {SITES.filter(s => s.status !== 'normal').map(site => (
              <div key={site.id} style={{ background: 'rgba(239,68,68,0.1)', borderLeft: `3px solid ${site.status === 'alert' ? '#ef4444' : '#f59e0b'}`, padding: '12px', marginBottom: '12px', borderRadius: '0 8px 8px 0' }}>
                <div style={{ color: site.status === 'alert' ? '#ef4444' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{site.name}</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>Type : {site.type}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>Effectif: {site.agents} agents sur site</div>
              </div>
            ))}
            {SITES.filter(s => s.status !== 'normal').length === 0 && (
              <div style={{ color: '#22c55e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} /> Aucune menace détectée
              </div>
            )}
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} /> Log Transmission
            </h3>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>[{new Date().toLocaleTimeString()}] PING OK - Secteur Abidjan Sud</div>
              <div>[{new Date(Date.now() - 30000).toLocaleTimeString()}] SYNC 45 agents Plateau</div>
              <div style={{ color: '#f59e0b' }}>[{new Date(Date.now() - 120000).toLocaleTimeString()}] LATENCE {'>'} 200ms Bouaké</div>
              <div>[{new Date(Date.now() - 180000).toLocaleTimeString()}] PING OK - Secteur Cocody</div>
              <div style={{ color: '#ef4444' }}>[{new Date(Date.now() - 250000).toLocaleTimeString()}] ALERTE Intrusion Yopougon</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
