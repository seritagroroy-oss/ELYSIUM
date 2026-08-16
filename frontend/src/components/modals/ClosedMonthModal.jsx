import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function ClosedMonthModal({ message, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      />
      
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '450px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)',
          color: 'white',
          animation: 'modalSlideUp 0.3s ease-out'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none', color: '#94a3b8',
            cursor: 'pointer', padding: '4px', borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            padding: '16px', 
            borderRadius: '50%',
            color: '#ef4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
          }}>
            <ShieldAlert size={48} />
          </div>
          
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc' }}>
            Action bloquée
          </h2>
          
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5' }}>
            {message || "Vous ne pouvez pas effectuer cette action car le mois sélectionné est déjà clôturé ou passé."}
          </p>

          <button 
            onClick={onClose}
            style={{
              marginTop: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
          >
            Compris
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
