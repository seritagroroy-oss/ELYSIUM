import React from 'react';

export default function MaladieModal({
  agentName,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClose,
  onSubmit
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #1a0a0a 0%, #1e0f0f 100%)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.2))',
            border: '1.5px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(239,68,68,0.15)'
          }}>🩺</div>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Définir une Maladie</h3>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Agent : {agentName}</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Du (Date de début)</label>
              <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} required
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                  outline: 'none', transition: 'all 0.2s',
                }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Au (Date de fin incluse)</label>
              <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} required
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                  outline: 'none', transition: 'all 0.2s',
                }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} 
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >Annuler</button>
            <button type="submit" 
              style={{ flex: 2, padding: '12px', background: '#ef4444', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 15px rgba(239,68,68,0.3)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Valider la Maladie</button>
          </div>
        </form>
      </div>
    </div>
  );
}
