import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ReposConfirmModal({
  reposConfirmData,
  setReposConfirmData,
  executeAssignRepos
}) {
  return (
    <div className="modal-overlay" onClick={() => setReposConfirmData(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', padding: '2.5rem', borderRadius: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,193,7,0.2) 0%, rgba(255,193,7,0.05) 100%)', color: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '1px solid rgba(255,193,7,0.2)', boxShadow: '0 0 20px rgba(255,193,7,0.1)' }}>
          <AlertTriangle size={32} />
        </div>
        <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Confirmation Requise</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: '400' }}>
          {reposConfirmData.message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => setReposConfirmData(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '600', fontSize: '0.95rem' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>Annuler</button>
          <button onClick={executeAssignRepos} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)', color: '#000', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(255,193,7,0.3)' }} onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(255,193,7,0.4)'; }} onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(255,193,7,0.3)'; }}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}
