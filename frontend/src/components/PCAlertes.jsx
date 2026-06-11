import React, { useState } from 'react';
import { Siren, Bell, MapPin, Clock, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PCAlertes() {
  const [alertes, setAlertes] = useState([
    { id: 1, type: 'SOS Agent (Bouton Panique)', site: 'Zone Industrielle Yopougon', agent: 'Koffi Marc', time: 'Il y a 2 min', status: 'critical', ack: false },
    { id: 2, type: 'Intrusion Détectée', site: 'Entrepôt Vridi', agent: 'Système Alarme', time: 'Il y a 14 min', status: 'high', ack: true },
    { id: 3, type: 'Perte de Signal Radio', site: 'Complexe Agro Bouaké', agent: 'Équipe Nuit', time: 'Il y a 28 min', status: 'medium', ack: false }
  ]);

  const acquitterAlerte = (id) => {
    setAlertes(alertes.map(a => a.id === id ? { ...a, ack: true } : a));
  };

  const criticalCount = alertes.filter(a => a.status === 'critical' && !a.ack).length;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(239,68,68,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
            <Siren size={32} /> Urgences & SOS
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Mur centralisé des alertes rouges de détresse et d'intrusion.</p>
        </div>
        
        {criticalCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.2)', padding: '12px 24px', borderRadius: '50px', border: '1px solid #ef4444', animation: 'pulse 1.5s infinite' }}>
            <Bell size={24} color="#ef4444" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{criticalCount} URGENCE(S) NON ACQUITTÉE(S)</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alertes.map(alerte => (
          <div key={alerte.id} style={{ 
            background: alerte.ack ? '#0f172a' : (alerte.status === 'critical' ? 'linear-gradient(90deg, rgba(239,68,68,0.2) 0%, #0f172a 100%)' : 'linear-gradient(90deg, rgba(245,158,11,0.2) 0%, #0f172a 100%)'), 
            border: `1px solid ${alerte.ack ? '#1e293b' : (alerte.status === 'critical' ? '#ef4444' : '#f59e0b')}`, 
            borderRadius: '12px', 
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: alerte.ack ? 0.7 : 1
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: alerte.status === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={32} color={alerte.status === 'critical' ? '#ef4444' : '#f59e0b'} />
              </div>
              
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: alerte.ack ? '#94a3b8' : 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alerte.type}
                  {alerte.status === 'critical' && !alerte.ack && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Priorité Absolue</span>}
                </h3>
                
                <div style={{ display: 'flex', gap: '24px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} color="#3b82f6" /> {alerte.site}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} color="#f59e0b" /> {alerte.time}</span>
                  <span><strong>Source :</strong> {alerte.agent}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!alerte.ack ? (
                <>
                  <button style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <PhoneCall size={18} /> Appeler
                  </button>
                  <button 
                    onClick={() => acquitterAlerte(alerte.id)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(239,68,68,0.4)' }}>
                    Acquitter l'Alerte
                  </button>
                </>
              ) : (
                <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', padding: '12px 20px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid #22c55e' }}>
                  <CheckCircle2 size={20} /> Pris en charge
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
      
    </div>
  );
}
