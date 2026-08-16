import React from 'react';

export default function ReadOnlyAlert({ setShowReadOnlyAlert }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '30px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.4rem' }}>Mode Lecture activé</h3>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
          Le pointage est actuellement verrouillé contre les modifications.<br /><br />
          Veuillez cliquer sur le bouton <strong>🔒 Mode Lecture</strong> (en haut de l'écran à côté du mois) pour le déverrouiller et pouvoir ajouter un agent.
        </p>
        <button className="btn btn-primary" onClick={() => setShowReadOnlyAlert(false)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', width: '100%', fontSize: '1.05rem', fontWeight: 'bold' }}>
          J'ai compris
        </button>
      </div>
    </div>
  );
}
