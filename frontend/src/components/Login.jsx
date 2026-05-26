import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { LogIn, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Login({ setView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
            <label className="form-label" htmlFor="password" style={{ fontSize: '1rem' }}>Mot de passe</label>
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
  );
}
