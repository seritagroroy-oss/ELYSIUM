import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ClotureModals({
  showClotureConfirmModal, setShowClotureConfirmModal,
  showClotureSuccessModal, setShowClotureSuccessModal,
  showClotureWarningModal, setShowClotureWarningModal,
  clotureLoading, clotureErrorMsg, handleClotureFluctuationConfirm,
  period, formatPeriod
}) {
  return (
    <>
      {showClotureConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertCircle size={40} style={{ color: '#38bdf8' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800 }}>Confirmer la clôture</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              Voulez-vous clôturer l'état de paie de <strong style={{ color: 'white' }}>{formatPeriod(period)}</strong> pour le module Fluctuation Salariale ?
            </p>
            {clotureErrorMsg && <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{clotureErrorMsg}</div>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowClotureConfirmModal(false)} className="btn btn-secondary" disabled={clotureLoading} style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Annuler</button>
              <button onClick={handleClotureFluctuationConfirm} className="btn btn-primary" disabled={clotureLoading} style={{ flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {clotureLoading ? <Loader2 size={20} className="animate-spin" /> : 'Oui, clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showClotureSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(34,197,94,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>Clôture réussie</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              La clôture de <strong style={{ color: 'white' }}>{formatPeriod(period)}</strong> a été enregistrée avec succès pour la Fluctuation Salariale.
            </p>
            <button onClick={() => setShowClotureSuccessModal(false)} className="btn btn-success" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700 }}>Compris</button>
          </div>
        </div>
      )}
      {showClotureWarningModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', textAlign: 'center', animation: 'slideUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertCircle size={40} style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>Clôture prématurée</h3>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px', lineHeight: '1.5' }}>
              Il reste encore des sites à traiter. Veuillez vous assurer que la progression de tous les sites affichés est à 100% avant de clôturer.
            </p>
            <button onClick={() => setShowClotureWarningModal(false)} className="btn btn-secondary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>Retour au traitement</button>
          </div>
        </div>
      )}
    </>
  );
}
