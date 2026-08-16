import React, { useState } from 'react';
import { Siren, AlertTriangle, ShieldAlert, Radio, Phone, Activity, Flame, ShieldOff } from 'lucide-react';
import { apiCall } from '../api';

export default function AlertesSecurite() {
  const [activeAlert, setActiveAlert] = useState(null); // 'evacuation' | 'confinement' | null
  const [countdown, setCountdown] = useState(5);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingType, setPendingType] = useState(null);

  const initiateAlert = (type) => {
    setPendingType(type);
    setIsConfirming(true);
    setCountdown(5);
    
    // Countdown before triggering
    let c = 5;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        setActiveAlert(type);
        setIsConfirming(false);
        // Persist to backend so ALL users see it
        apiCall('set_global_security_alert', { alert: type }, 'POST');
      }
    }, 1000);

    window.alertInterval = interval;
  };

  const cancelAlert = () => {
    clearInterval(window.alertInterval);
    setIsConfirming(false);
    setPendingType(null);
  };

  const stopAlert = () => {
    setActiveAlert(null);
    // Clear on backend so ALL users see the end
    apiCall('set_global_security_alert', { alert: null }, 'POST');
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px', color: activeAlert ? '#ef4444' : 'inherit' }}>
            <Siren size={28} color={activeAlert ? '#ef4444' : '#f43f5e'} className={activeAlert ? 'pulse' : ''} /> 
            Poste de Commandement (PCS)
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Déclenchement des procédures d'urgence globales sur tous les écrans du site.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          <Activity size={18} /> Système Opérationnel
        </div>
      </div>

      {activeAlert ? (
        <div className="glass-panel pulse-bg" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444', textAlign: 'center', padding: '40px', borderRadius: '16px' }}>
          <AlertTriangle size={80} color="#ef4444" className="pulse" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2.5rem', color: '#ef4444', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
            Alerte {activeAlert === 'evacuation' ? 'Évacuation Incendie' : 'Confinement Intrusion'} en cours
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'white', maxWidth: '600px', marginBottom: '40px' }}>
            Tous les écrans connectés à Elysium sur le site affichent actuellement les consignes de sécurité. Les sirènes ont été déclenchées.
          </p>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button style={{ background: 'white', color: 'black', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <Radio size={24} /> Contacter les Secours (112)
            </button>
            <button onClick={stopAlert} style={{ background: 'transparent', color: '#ef4444', border: '2px solid #ef4444', padding: '16px 32px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <ShieldOff size={24} /> Fin d'Alerte
            </button>
          </div>
        </div>
      ) : isConfirming ? (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.1)', border: '2px solid #f59e0b', textAlign: 'center', padding: '40px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '2rem', color: '#f59e0b', margin: '0 0 20px 0' }}>Confirmation Requise</h2>
          <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'white', marginBottom: '20px', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>
            {countdown}
          </div>
          <p style={{ fontSize: '1.2rem', color: 'var(--muted)', marginBottom: '30px' }}>
            L'alerte sera déclenchée automatiquement à la fin du compte à rebours.
          </p>
          <button onClick={cancelAlert} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '16px 40px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
            ANNULER LE DÉCLENCHEMENT
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1 }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <Flame size={64} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', color: 'white' }}>Procédure d'Évacuation</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '30px', lineHeight: '1.6' }}>
              Déclenche les alarmes incendie et force l'affichage du plan d'évacuation et du point de rassemblement sur tous les postes de travail.
            </p>
            <button onClick={() => initiateAlert('evacuation')} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', border: 'none', padding: '20px 40px', borderRadius: '100px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(239,68,68,0.5)', transition: 'transform 0.1s', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Siren size={24} /> DÉCLENCHER L'ÉVACUATION
            </button>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
              <ShieldAlert size={64} color="#f59e0b" />
            </div>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 16px 0', color: 'white' }}>Procédure de Confinement</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '30px', lineHeight: '1.6' }}>
              Intrusion ou menace externe. Verrouille les accès contrôlés et ordonne aux employés de se barricader silencieusement.
            </p>
            <button onClick={() => initiateAlert('confinement')} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', color: 'white', border: 'none', padding: '20px 40px', borderRadius: '100px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(245,158,11,0.5)', transition: 'transform 0.1s', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} /> DÉCLENCHER LE CONFINEMENT
            </button>
          </div>
        </div>
      )}

      {/* Styles for pulse animation if not in main css */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        .pulse {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .pulse-bg {
          animation: pulse-bg-anim 2s infinite alternate;
        }
        @keyframes pulse-bg-anim {
          from { background-color: rgba(239,68,68,0.1); }
          to { background-color: rgba(239,68,68,0.3); }
        }
      `}</style>
    </div>
  );
}
