/**
 * QRPointage.jsx — QR Code dynamique de pointage ELYSIUM
 * Le token change toutes les 30 secondes pour éviter la fraude
 */
import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { apiCall } from '../api';
import { RefreshCw, Shield, Clock, CheckCircle, AlertTriangle, Scan, X } from 'lucide-react';

// ─── Génération token côté client (miroir du backend) ─────────────────────────
function generateClientToken(secret = 'ELYSIUM2026') {
  const now = Math.floor(Date.now() / 1000);
  const window30 = Math.floor(now / 30);
  // Simule un HMAC simple : base64(secret + timestamp)
  const raw = `${secret}:${window30}`;
  return btoa(raw).replace(/=/g, '').slice(0, 24);
}

function getSecondsUntilRefresh() {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

// ─── Composant modal de scan ──────────────────────────────────────────────────
function ScanModal({ onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus('loading');
    try {
      const res = await apiCall('validate_qr', { token: code.trim() });
      if (res?.success) {
        setStatus('success');
        setMsg(res.message || 'Pointage enregistré !');
        setTimeout(() => onSuccess?.(), 2000);
      } else {
        setStatus('error');
        setMsg(res?.message || 'Token invalide ou expiré.');
      }
    } catch {
      setStatus('error');
      setMsg('Erreur réseau.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(11,18,32,0.98)', borderRadius: 20, padding: 32,
        border: '1px solid rgba(99,102,241,0.3)', width: 360,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
            <Scan size={18} style={{ marginRight: 8, color: '#6366f1', verticalAlign: 'middle' }} />
            Saisir le code QR
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code affiché sur l'écran..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, color: '#f8fafc',
              padding: '12px 14px', fontSize: 16, letterSpacing: 2,
              fontFamily: 'monospace', textTransform: 'uppercase',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              marginTop: 14, width: '100%',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 10, color: 'white',
              padding: '12px 0', fontSize: 15, fontWeight: 600,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
            }}
          >
            {status === 'loading' ? 'Vérification...' : 'Valider le pointage'}
          </button>
        </form>
        {status === 'success' && (
          <div style={{ marginTop: 14, padding: 12, background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10,
            color: '#34d399', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <CheckCircle size={18} /> {msg}
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginTop: 14, padding: 12, background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10,
            color: '#f87171', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <AlertTriangle size={18} /> {msg}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function QRPointage({ onClose }) {
  const [token, setToken]         = useState(generateClientToken());
  const [countdown, setCountdown] = useState(getSecondsUntilRefresh());
  const [showScan, setShowScan]   = useState(false);
  const [lastScan, setLastScan]   = useState(null);

  // Rafraîchissement toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const secs = getSecondsUntilRefresh();
      setCountdown(secs);
      if (secs === 30) {
        setToken(generateClientToken());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPct = ((30 - countdown) / 30) * 100;
  const isUrgent = countdown <= 5;

  // Valeur encodée dans le QR : token + timestamp pour validation backend
  const qrValue = JSON.stringify({
    t: token,
    ts: Math.floor(Date.now() / 30000),
    app: 'ELYSIUM',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{
        background: 'rgba(11,18,32,0.98)',
        borderRadius: 24, padding: 36,
        border: '1px solid rgba(99,102,241,0.3)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        textAlign: 'center', maxWidth: 440, width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>
              <Shield size={20} style={{ marginRight: 8, color: '#6366f1', verticalAlign: 'middle' }} />
              QR Pointage
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
              Scannez ce code pour pointer votre présence
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, color: '#f87171', padding: '6px 10px', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* QR Code */}
        <div style={{
          background: 'white', padding: 20, borderRadius: 16,
          display: 'inline-block', marginBottom: 20,
          boxShadow: isUrgent
            ? '0 0 0 4px rgba(239,68,68,0.5), 0 0 30px rgba(239,68,68,0.3)'
            : '0 0 0 4px rgba(99,102,241,0.2)',
          transition: 'box-shadow 0.3s',
        }}>
          <QRCode
            value={qrValue}
            size={200}
            level="M"
            style={{ display: 'block' }}
          />
        </div>

        {/* Token lisible (saisie manuelle) */}
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Code manuel
          </div>
          <div style={{
            fontSize: 22, fontWeight: 700, color: '#a5b4fc',
            letterSpacing: 6, fontFamily: 'monospace',
            color: isUrgent ? '#f87171' : '#a5b4fc',
            transition: 'color 0.3s',
          }}>
            {token.toUpperCase()}
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isUrgent ? '#f87171' : '#64748b' }}>
              <Clock size={14} />
              {isUrgent ? 'Expiration imminente !' : 'Renouvellement dans'}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: isUrgent ? '#f87171' : '#10b981',
              fontFamily: 'monospace', transition: 'color 0.3s',
            }}>
              {countdown}s
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${progressPct}%`,
              background: isUrgent
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : 'linear-gradient(90deg, #6366f1, #10b981)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setToken(generateClientToken()); setCountdown(30); }}
            style={{
              flex: 1, background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, color: '#a5b4fc',
              padding: '10px 0', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <RefreshCw size={14} /> Actualiser
          </button>
          <button
            onClick={() => setShowScan(true)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: 10, color: 'white',
              padding: '10px 0', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Scan size={14} /> Saisir un code
          </button>
        </div>

        {/* Dernier scan */}
        {lastScan && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, color: '#34d399', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={16} /> {lastScan}
          </div>
        )}
      </div>

      {/* Modal de saisie manuelle */}
      {showScan && (
        <ScanModal
          onClose={() => setShowScan(false)}
          onSuccess={() => {
            setShowScan(false);
            setLastScan(`Pointage enregistré à ${new Date().toLocaleTimeString('fr-FR')}`);
          }}
        />
      )}
    </div>
  );
}
