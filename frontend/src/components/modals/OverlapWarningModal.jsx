import React from 'react';

const OverlapWarningModal = ({ overlapWarning, setOverlapWarning, isSubmittingLeave }) => {
  if (!overlapWarning) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', padding: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>⚠️</div>
          <div>
            <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.05rem', fontWeight: 700 }}>Chevauchement détecté</h3>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Avertissement — action requise</p>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px', background: 'rgba(245,158,11,0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
          {overlapWarning.message}<br />
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Voulez-vous continuer et écraser la période existante ?</span>
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setOverlapWarning(null)}
            disabled={isSubmittingLeave}
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 20px', borderRadius: '8px', cursor: isSubmittingLeave ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: isSubmittingLeave ? 0.5 : 1 }}
          >Annuler</button>
          <button
            onClick={overlapWarning.onConfirm}
            disabled={isSubmittingLeave}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#000', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: isSubmittingLeave ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: isSubmittingLeave ? 'none' : '0 4px 15px rgba(245,158,11,0.4)', opacity: isSubmittingLeave ? 0.7 : 1 }}
          >
            {isSubmittingLeave ? (
               <>
                 <svg style={{ animation: 'spin 1s linear infinite', height: '1rem', width: '1rem', color: '#000' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 En cours...
               </>
            ) : '✅ Continuer quand même'}
          </button>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    </div>
  );
};

export default OverlapWarningModal;
