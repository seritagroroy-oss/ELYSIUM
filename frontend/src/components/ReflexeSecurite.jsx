import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, Shield, Clock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function ReflexeSecurite({ setView }) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockedAt] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState(false);

  // Live timer showing how long session has been locked
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lockedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedAt]);

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleUnlock = () => {
    if (password.trim() === '') {
      setError('Veuillez entrer votre mot de passe pour déverrouiller.');
      triggerShake();
      return;
    }
    // In production: verify against backend. Here we accept any non-empty password.
    setView('home');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const hour = lockedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', backdropFilter: 'blur(20px)',
    }}>
      {/* Animated background rings */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${i * 200}px`, height: `${i * 200}px`,
            borderRadius: '50%', border: '1px solid rgba(239,68,68,0.1)',
            animation: `pulse ${2 + i}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div style={{
        background: 'rgba(10, 10, 26, 0.8)',
        padding: '48px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(239,68,68,0.2)',
        textAlign: 'center',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.05)',
        animation: shake ? 'none' : undefined,
        transform: shake ? 'translateX(0)' : 'none',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Lock icon with glow */}
        <div style={{
          width: '90px', height: '90px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 0 30px rgba(239,68,68,0.15)',
        }}>
          <Lock size={40} color="#ef4444" />
        </div>

        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 800 }}>Session Verrouillée</h2>
        <p style={{ color: '#64748b', marginBottom: '6px', fontSize: '0.9rem' }}>
          Verrouillé à {hour} · Durée : <strong style={{ color: '#ef4444' }}>{formatElapsed(elapsed)}</strong>
        </p>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.85rem' }}>
          Connecté en tant que <strong style={{ color: 'white' }}>{user?.name || 'Secrétariat'}</strong>
        </p>

        {/* Shield badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '8px 16px', marginBottom: '28px' }}>
          <ShieldAlert size={15} color="#ef4444" />
          <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Réflexe Sécurité Activé</span>
        </div>

        {/* Password input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Entrez votre mot de passe..."
              className="form-input"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '1rem',
                padding: '14px 48px',
                background: shake ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldAlert size={13} /> {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleUnlock}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              boxShadow: '0 4px 15px rgba(56,189,248,0.3)',
            }}
          >
            <Unlock size={18} /> Reprendre la session
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
