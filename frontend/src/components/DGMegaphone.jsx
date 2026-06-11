import React, { useState } from 'react';
import { Megaphone, Send, AlertTriangle, Info, BellRing, CheckCircle2 } from 'lucide-react';

export default function DGMegaphone() {
  const [urgency, setUrgency] = useState('info'); // 'info', 'warning', 'critical'
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!title || !message) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle('');
      setMessage('');
      setUrgency('info');
    }, 3000);
  };

  const getUrgencyConfig = (level) => {
    switch (level) {
      case 'critical': return { color: '#ef4444', icon: <AlertTriangle size={24} />, bg: 'rgba(239,68,68,0.1)' };
      case 'warning': return { color: '#f59e0b', icon: <BellRing size={24} />, bg: 'rgba(245,158,11,0.1)' };
      case 'info': default: return { color: '#38bdf8', icon: <Info size={24} />, bg: 'rgba(56,189,248,0.1)' };
    }
  };

  const activeConfig = getUrgencyConfig(urgency);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(236,72,153,0.1)', padding: '16px', borderRadius: '50%' }}>
            <Megaphone size={40} color="#ec4899" />
          </div>
        </div>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#ec4899' }}>Mégaphone Exécutif</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
          Diffusez une annonce immédiate et incontournable sur les écrans de tous les collaborateurs connectés.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '12px', fontWeight: 'bold' }}>Niveau d'Urgence</label>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div 
              onClick={() => setUrgency('info')}
              style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${urgency === 'info' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, background: urgency === 'info' ? 'rgba(56,189,248,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
              <Info size={24} color="#38bdf8" />
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Information</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Annonce générale</div>
              </div>
            </div>
            
            <div 
              onClick={() => setUrgency('warning')}
              style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${urgency === 'warning' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, background: urgency === 'warning' ? 'rgba(245,158,11,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
              <BellRing size={24} color="#f59e0b" />
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Important</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Requiert attention</div>
              </div>
            </div>

            <div 
              onClick={() => setUrgency('critical')}
              style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${urgency === 'critical' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: urgency === 'critical' ? 'rgba(239,68,68,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
              <AlertTriangle size={24} color="#ef4444" />
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Critique</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Alerte blocante</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>Titre de l'annonce</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ex: Félicitations pour le trimestre record !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', fontSize: '1.1rem', padding: '16px', borderLeft: `4px solid ${activeConfig.color}` }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>Contenu du message</label>
          <textarea 
            className="form-input" 
            placeholder="Rédigez votre message ici. Il apparaîtra en plein écran chez les employés."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', minHeight: '150px', fontSize: '1.05rem', padding: '16px', resize: 'vertical' }}
          />
        </div>

        <button 
          onClick={handleSend}
          disabled={!title || !message || sent}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: sent ? '#22c55e' : activeConfig.color, color: 'white', fontWeight: 'bold', fontSize: '1.2rem', cursor: (!title || !message || sent) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.3s', opacity: (!title || !message) ? 0.5 : 1 }}
        >
          {sent ? <><CheckCircle2 size={24} /> Message diffusé à 4,285 employés</> : <><Send size={24} /> Diffuser l'annonce maintenant</>}
        </button>
      </div>
    </div>
  );
}
