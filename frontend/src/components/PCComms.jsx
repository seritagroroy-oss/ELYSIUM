import React, { useState, useEffect } from 'react';
import { Radio, Wifi, WifiOff, Battery, BatteryLow, BatteryCharging, Activity } from 'lucide-react';

export default function PCComms() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const RADIOS = [
    { id: 'R-01', user: 'Koffi Marc', site: 'Zone Industrielle Yopougon', battery: 78, signal: 'fort', online: true },
    { id: 'R-02', user: 'Diallo Ibrahim', site: 'Siège Plateau', battery: 45, signal: 'moyen', online: true },
    { id: 'R-03', user: 'Aya Cissé', site: 'Port San Pedro', battery: 12, signal: 'faible', online: true },
    { id: 'R-04', user: 'Koné Dramane', site: 'Complexe Agro Bouaké', battery: 91, signal: 'perdu', online: false },
    { id: 'R-05', user: 'Touré Seydou', site: 'Résidence Cocody', battery: 60, signal: 'fort', online: true },
    { id: 'R-06', user: 'Gbagbo Pierre', site: 'Zone Industrielle Yopougon', battery: 33, signal: 'moyen', online: true },
  ];

  const NETWORK_NODES = [
    { name: 'Serveur PC Central', ip: '10.0.0.1', status: 'online', latency: '2ms' },
    { name: 'Répéteur Radio Plateau', ip: '10.0.1.10', status: 'online', latency: '8ms' },
    { name: 'Répéteur Radio Yopougon', ip: '10.0.2.10', status: 'online', latency: '24ms' },
    { name: 'Répéteur Radio San Pedro', ip: '10.0.3.10', status: 'online', latency: '48ms' },
    { name: 'Répéteur Radio Bouaké', ip: '10.0.4.10', status: 'offline', latency: '---' },
  ];

  const getBatteryIcon = (level) => {
    if (level <= 20) return <BatteryLow size={18} color="#ef4444" />;
    if (level >= 80) return <BatteryCharging size={18} color="#22c55e" />;
    return <Battery size={18} color="#f59e0b" />;
  };

  const getSignalColor = (signal) => {
    switch(signal) {
      case 'fort': return '#22c55e';
      case 'moyen': return '#f59e0b';
      case 'faible': return '#f97316';
      case 'perdu': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(59,130,246,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Radio size={32} /> Statut Réseau & Radios
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Surveillance de la connectivité des équipements terrain en temps réel.</p>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#3b82f6', background: '#0f172a', padding: '8px 20px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          {time}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Radios Terrain */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} /> Portables Radio ({RADIOS.filter(r => r.online).length}/{RADIOS.length} en ligne)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {RADIOS.map(radio => (
              <div key={radio.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: radio.online ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.05)', border: `1px solid ${radio.online ? '#1e293b' : 'rgba(239,68,68,0.3)'}`, padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: radio.online ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${radio.online ? '#22c55e' : '#ef4444'}` }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem' }}>{radio.user}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{radio.site} · ID: {radio.id}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', align: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getBatteryIcon(radio.battery)}
                    <span style={{ fontSize: '0.9rem', color: radio.battery <= 20 ? '#ef4444' : '#e2e8f0', fontWeight: 'bold' }}>{radio.battery}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {radio.online ? <Wifi size={18} color={getSignalColor(radio.signal)} /> : <WifiOff size={18} color="#ef4444" />}
                    <span style={{ color: getSignalColor(radio.signal), fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>{radio.signal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Réseau PC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} /> Infrastructure Réseau
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NETWORK_NODES.map((node, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: node.status === 'offline' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${node.status === 'offline' ? 'rgba(239,68,68,0.3)' : '#1e293b'}`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: node.status === 'online' ? '#22c55e' : '#ef4444' }} />
                    <div>
                      <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{node.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>{node.ip}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: node.status === 'online' ? '#22c55e' : '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{node.status}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e293b' }}>{node.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase' }}>Alertes Techniques</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '3px solid #ef4444', padding: '12px', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                🔴 Répéteur Bouaké HORS LIGNE depuis 28 min — Radio R-04 injoignable
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', borderLeft: '3px solid #f59e0b', padding: '12px', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                🟡 Batterie critique sur R-03 (12%) — Aya Cissé / San Pedro
              </div>
              <div style={{ background: 'rgba(34,197,94,0.1)', borderLeft: '3px solid #22c55e', padding: '12px', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                🟢 Sauvegarde de configuration réseau effectuée à 01:00
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
