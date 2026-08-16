import React, { useState } from 'react';

export default function SortantModal({
  agentName,
  sortantType,
  onSortantTypeChange,
  customReason,
  onCustomReasonChange,
  startDate,
  onStartDateChange,
  onClose,
  onSubmit
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn-sortant-cancel {
          flex: 1; padding: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff;
          font-size: 0.95rem; fontWeight: 600;
          cursor: pointer; transition: all 0.2s ease;
          outline: none;
        }
        .btn-sortant-cancel:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .btn-sortant-cancel:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-sortant-submit {
          flex: 2; padding: 12px;
          background: #e11d48; border: none;
          border-radius: 10px; color: #fff;
          font-size: 0.95rem; fontWeight: 800;
          cursor: pointer;
          box-shadow: 0 6px 15px rgba(225,29,72,0.3);
          display: flex; alignItems: center;
          justify-content: center; gap: 8px;
          transition: all 0.2s ease;
          outline: none;
        }
        .btn-sortant-submit:hover:not(:disabled) {
          background: #f43f5e;
          box-shadow: 0 8px 20px rgba(244,63,94,0.45);
          transform: translateY(-1px);
        }
        .btn-sortant-submit:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
      <div onClick={!isSubmitting ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #1f0f15 0%, #2a111a 100%)',
        border: '1px solid rgba(244,63,94,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(244,63,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(244,63,94,0.25), rgba(225,29,72,0.2))',
            border: '1.5px solid rgba(244,63,94,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(244,63,94,0.15)'
          }}>🚶</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Agent Sortant</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              Agent : <span style={{ color: '#fb7185', fontWeight: 700 }}>{agentName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Motif</label>
            <select 
              value={sortantType} 
              onChange={e => onSortantTypeChange(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
            >
              <option value="ABANDON" style={{ background: '#1e293b', color: 'white' }}>Abandon de poste</option>
              <option value="DEMISSION" style={{ background: '#1e293b', color: 'white' }}>Démission</option>
              <option value="RETIRE" style={{ background: '#1e293b', color: 'white' }}>Retiré de l'effectif</option>
              <option value="LICENCIE" style={{ background: '#1e293b', color: 'white' }}>Licencié</option>
              <option value="LICENCIE_ADMIN" style={{ background: '#1e293b', color: 'white' }}>Licencié par l'Administrateur</option>
              <option value="FIN_CONTRAT" style={{ background: '#1e293b', color: 'white' }}>Fin de stage/contrat</option>
              <option value="AUTRE" style={{ background: '#1e293b', color: 'white' }}>Autre...</option>
            </select>
            {sortantType === 'AUTRE' && (
              <div style={{ marginTop: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Saisissez le motif..."
                  value={customReason} 
                  onChange={e => onCustomReasonChange(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'text', opacity: isSubmitting ? 0.6 : 1 }}
                  required
                />
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Date de départ effectif</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => onStartDateChange(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'text', opacity: isSubmitting ? 0.6 : 1 }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-sortant-cancel" onClick={onClose} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.6 : 1 }}>Annuler</button>
            <button type="submit" className="btn-sortant-submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? (
                <>
                  <span className="loader" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Validation...
                </>
              ) : 'Valider Sortie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
