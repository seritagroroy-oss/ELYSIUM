import React from 'react';
import { Loader2, X } from 'lucide-react';

export default function ShiftModal({
  shiftModalAgent,
  setShiftModalAgent,
  isGenerating,
  shiftModalType,
  setShiftModalType,
  handleUpdateAgentField,
  renderPatternOptions
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', position: 'relative', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', borderRadius: '16px', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isGenerating && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
            <div className="loader-pulsar" style={{ marginBottom: '24px' }}><div className="loader-pulsar-inner"></div></div>
            <h3 style={{ color: 'white', margin: 0 }}>Génération en cours...</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>Veuillez patienter.</p>
          </div>
        )}
        <button 
          onClick={() => setShiftModalAgent(null)}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', zIndex: 10 }}
          title="Fermer"
          disabled={isGenerating}
        >
          <X size={24} />
        </button>
        <h3 style={{ marginBottom: '24px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', paddingRight: '30px', flexShrink: 0 }}>Type de Service & Planning</h3>
        
        <div style={{ marginBottom: '25px', flexShrink: 0 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500' }}>1. Sélectionner le Type</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['Jour', 'Nuit', '24h', '48h', '72h'].map(t => (
              <button key={t} className="btn" 
                style={{ background: shiftModalType === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', border: shiftModalType === t ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: shiftModalType === t ? 'bold' : 'normal', flex: '1 1 auto' }}
                onClick={() => {
                  setShiftModalType(t);
                  handleUpdateAgentField(shiftModalAgent.id, 'shift_type', t); // Optimistic update
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.95rem', fontWeight: '500', flexShrink: 0 }}>2. Générer le planning (Rotation)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '10px' }}>
            {renderPatternOptions()}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button className="btn" onClick={() => setShiftModalAgent(null)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
