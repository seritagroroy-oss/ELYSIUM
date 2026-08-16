import React, { useState, useEffect } from 'react';

export default function RenameSiteModal({ isOpen, onClose, currentName, onConfirm }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName(currentName || '');
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onConfirm(name.trim());
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '2.5rem',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '92%',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✏️</div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>Renommer la zone</h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.6rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.3px' }}>
              Nouveau nom pour la zone :
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                fontSize: '1.05rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box'
              }}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder="Ex: Tenue Régulière"
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              style={{
                flex: 2,
                padding: '14px',
                background: (!name.trim() || name.trim() === currentName) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (!name.trim() || name.trim() === currentName) ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: 700,
                transition: 'all 0.2s',
                boxShadow: (!name.trim() || name.trim() === currentName) ? 'none' : '0 4px 20px rgba(99,102,241,0.4)'
              }}
              onMouseEnter={e => { if (name.trim() && name.trim() !== currentName) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
