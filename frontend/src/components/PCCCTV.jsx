import React, { useState, useEffect } from 'react';
import { Video, Maximize, AlertCircle, RefreshCw, Eye } from 'lucide-react';

export default function PCCCTV() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const CAMERAS = [
    { id: 1, name: 'CAM-01: Entrée Principale', site: 'Siège Plateau', status: 'online', interference: false },
    { id: 2, name: 'CAM-04: Couloir Direction', site: 'Siège Plateau', status: 'online', interference: false },
    { id: 3, name: 'CAM-12: Parking Sous-Sol', site: 'Zone Ind. Yopougon', status: 'online', interference: true },
    { id: 4, name: 'CAM-03: Périmètre Extérieur', site: 'Port San Pedro', status: 'offline', interference: false },
    { id: 5, name: 'CAM-08: Salle des Serveurs', site: 'Siège Plateau', status: 'online', interference: false },
    { id: 6, name: 'CAM-02: Accès VIP', site: 'Résidence Cocody', status: 'online', interference: false }
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Video size={32} /> Mur d'Écrans (CCTV)
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Réseau de caméras intégré. Simulation de flux vidéo en direct.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#0f172a', padding: '12px 24px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} /> REC
          </div>
          <div style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '2px' }}>
            {time}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {CAMERAS.map(cam => (
          <div key={cam.id} style={{ 
            aspectRatio: '16/9', 
            background: cam.status === 'offline' ? '#0f172a' : '#111', 
            border: `2px solid ${cam.status === 'offline' ? '#ef4444' : '#1e293b'}`, 
            borderRadius: '8px', 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: cam.status === 'offline' ? '0 0 20px rgba(239,68,68,0.2) inset' : 'none'
          }}>
            
            {/* Simulation d'image / bruit */}
            {cam.status === 'online' && (
              <div style={{ position: 'absolute', inset: 0, opacity: cam.interference ? 0.3 : 0.05, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', animation: cam.interference ? 'pulse 0.2s infinite' : 'none' }} />
            )}

            {cam.status === 'offline' ? (
              <div style={{ textAlign: 'center', color: '#ef4444' }}>
                <AlertCircle size={48} style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Signal Perdu</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Tentative de reconnexion...</p>
              </div>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={48} color="rgba(255,255,255,0.05)" />
              </div>
            )}

            {/* OSD (On Screen Display) */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', textShadow: '1px 1px 2px black', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <div>{cam.name}</div>
              <div style={{ color: '#3b82f6' }}>{cam.site}</div>
            </div>

            <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: 'white', textShadow: '1px 1px 2px black', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {time}
            </div>

            {cam.interference && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#f59e0b', textShadow: '1px 1px 2px black', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                <RefreshCw size={14} /> INTERFÉRENCE
              </div>
            )}

            {/* Bouton Agrandir (Hover) */}
            <div className="cam-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}>
              <button style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '10px 20px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Maximize size={18} /> Agrandir
              </button>
            </div>
            
            <style>{`
              div:hover > .cam-overlay { opacity: 1 !important; }
            `}</style>
          </div>
        ))}
      </div>

    </div>
  );
}
