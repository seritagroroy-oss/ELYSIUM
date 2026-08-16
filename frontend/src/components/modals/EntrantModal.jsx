import React, { useState } from 'react';

export default function EntrantModal({
  agentName,
  startDate,
  onStartDateChange,
  functionName,
  onFunctionChange,
  onClose,
  onSubmit
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverCancel, setHoverCancel] = useState(false);
  const [hoverSubmit, setHoverSubmit] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #0f1f16 0%, #112a1f 100%)',
        border: '1px solid rgba(16,185,129,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.2))',
            border: '1.5px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(16,185,129,0.15)'
          }}>🚶‍♂️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Agent Entrant</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              Agent : <span style={{ color: '#34d399', fontWeight: 700 }}>{agentName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Date de début effectif</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => onStartDateChange(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Fonction</label>
            <input 
              type="text" 
              value={functionName} 
              onChange={e => onFunctionChange(e.target.value)}
              placeholder="ex: AS, CS..."
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting} 
              onMouseEnter={() => setHoverCancel(true)}
              onMouseLeave={() => setHoverCancel(false)}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: hoverCancel ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'all 0.2s ease-in-out',
                transform: hoverCancel ? 'translateY(-2px)' : 'none'
              }}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              onMouseEnter={() => setHoverSubmit(true)}
              onMouseLeave={() => setHoverSubmit(false)}
              style={{ 
                flex: 2, 
                padding: '12px', 
                background: hoverSubmit ? '#059669' : '#10b981', 
                border: 'none', 
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                fontWeight: 800, 
                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                boxShadow: hoverSubmit ? '0 8px 20px rgba(16,185,129,0.5)' : '0 6px 15px rgba(16,185,129,0.3)', 
                opacity: isSubmitting ? 0.7 : 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                transition: 'all 0.2s ease-in-out',
                transform: hoverSubmit ? 'translateY(-2px)' : 'none'
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin" style={{ width: '20px', height: '20px', color: '#fff' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validation...
                </>
              ) : (
                'Valider Entrée'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
