import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { LogIn, Loader2, ArrowLeft, Eye, EyeOff, KeyRound, X, Mail, CheckCircle } from 'lucide-react';
import { apiCall } from '../api';

// Modal "Mot de passe oublié"
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiCall('request_password_reset', { email: resetEmail });
      if (res.success) {
        setStep('sent');
      } else {
        // On affiche toujours "email envoyé" même si l'email n'existe pas
        setStep('sent');
      }
    } catch {
      setStep('sent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#0d1526', borderRadius: '20px', padding: '40px',
        maxWidth: '440px', width: '100%', position: 'relative',
        border: '1px solid rgba(56,189,248,0.2)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(56,189,248,0.05)'
      }}>
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '8px', padding: '4px', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <X size={20} />
        </button>

        {step === 'email' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={28} color="#38bdf8" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '8px' }}>
              Mot de passe oublié ?
            </h3>
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Saisissez votre adresse email. Une demande sera envoyée à votre administrateur pour réinitialiser votre accès.
            </p>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#f87171', fontSize: '0.9rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSend}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                Adresse Email
              </label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 16px 12px 44px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: 'white', fontSize: '1rem', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                  color: '#0b1220', border: 'none', fontWeight: 800, fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 20px rgba(56,189,248,0.3)', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Envoyer la demande à l\'Admin'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={36} color="#22c55e" />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
              Demande envoyée !
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '8px' }}>
              Si l'adresse <strong style={{ color: '#38bdf8' }}>{resetEmail}</strong> est associée à un compte, l'administrateur a été notifié.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Veuillez contacter votre administrateur pour recevoir votre nouveau mot de passe temporaire en main propre ou via un canal sécurisé.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', color: 'white',
                border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login({ setView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        if (res.subscription && !res.subscription.access_allowed) {
          setView('subscription');
        } else {
          setView('home');
        }
      } else {
        setError(res.message || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div style={{ minHeight: '100vh', background: '#070e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="auth-container-animated" style={{ maxWidth: '1050px', width: '100%' }}>
        <div className="auth-wrapper glass-panel">

      {/* Flèche retour */}
      <button
        onClick={() => setView('welcome')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.95rem', padding: '4px 0', marginBottom: '16px', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        <ArrowLeft size={18} />
        <span>Retour</span>
      </button>
      <div className="auth-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <img src="/elysium_logo.png" alt="ELYSIUM" style={{ height: '56px', width: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(56,189,248,0.6)', boxShadow: '0 0 12px rgba(56,189,248,0.4)' }} />
          <span style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '2px', background: 'linear-gradient(135deg, #fff 0%, #38bdf8 60%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ELYSIUM</span>
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Connexion</h2>
        <p className="subtitle" style={{ fontSize: '1rem', margin: 0 }}>Connectez-vous pour accéder à la plateforme.</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="email" style={{ fontSize: '1rem' }}>Adresse Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ex: admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ padding: '12px 16px', fontSize: '1rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="password" style={{ fontSize: '1rem', margin: 0 }}>Mot de passe</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{
                  background: 'none', border: 'none', color: '#38bdf8',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  padding: 0, transition: 'color 0.2s', textDecoration: 'underline',
                  textUnderlineOffset: '3px'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#7dd3fc'}
                onMouseLeave={e => e.currentTarget.style.color = '#38bdf8'}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '12px 40px 12px 16px', fontSize: '1rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Case à cocher "Se souvenir de moi" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 4px 0' }}>
          <div
            onClick={() => setRememberMe(!rememberMe)}
            style={{
              width: '20px', height: '20px', borderRadius: '6px',
              border: `2px solid ${rememberMe ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
              background: rememberMe ? 'rgba(56,189,248,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {rememberMe && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5l3.5 3.5L11 1" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span
            onClick={() => setRememberMe(!rememberMe)}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}
          >
            Se souvenir de moi <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>(30 jours)</span>
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <LogIn size={18} />
              <span>Se connecter</span>
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '1rem', color: 'var(--muted)' }}>
        Pas encore de compte ?{' '}
        <span
          onClick={() => setView('register')}
          style={{ color: 'var(--b)', cursor: 'pointer', fontWeight: '600' }}
        >
          Créer un compte
        </span>
      </div>
      </div>
    </div>
    </div>
    </>
  );
}
