import React, { useState } from 'react';

export default function EntrantConfigModal({
  agentName,
  entrantMotif,
  onEntrantMotifChange,
  entrantDate,
  onEntrantDateChange,
  onClose,
  onSubmit,
  period,
  noOverlay
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPeriodBounds = (periodStr) => {
    if (!periodStr) return null;
    const parts = periodStr.split('-');
    if (parts.length !== 2) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-12
    
    const startDate = new Date(year, month - 2, 21);
    const endDate = new Date(year, month - 1, 20);

    const startY = startDate.getFullYear();
    const startM = String(startDate.getMonth() + 1).padStart(2, '0');
    const startD = '21';
    const startStrISO = `${startY}-${startM}-${startD}`;

    const endY = endDate.getFullYear();
    const endM = String(endDate.getMonth() + 1).padStart(2, '0');
    const endD = '20';
    const endStrISO = `${endY}-${endM}-${endD}`;

    return { startStrISO, endStrISO, startDate, endDate };
  };

  const periodBounds = getPeriodBounds(period);
  let isDateOut = false;
  let warningMessage = '';

  if (periodBounds && entrantDate) {
    if (entrantDate < periodBounds.startStrISO || entrantDate > periodBounds.endStrISO) {
      isDateOut = true;
      const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      const startStr = `21 ${monthNames[periodBounds.startDate.getMonth()]} ${periodBounds.startDate.getFullYear()}`;
      const endStr = `20 ${monthNames[periodBounds.endDate.getMonth()]} ${periodBounds.endDate.getFullYear()}`;
      warningMessage = `Attention, cette date n'est pas dans la période en cours (du ${startStr} au ${endStr}). L'agent ne peut pas être enregistré pour cette période.`;
    }
  }

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
    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn-entrant-cancel {
          flex: 1; padding: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff;
          font-size: 0.95rem; fontWeight: 600;
          cursor: pointer; transition: all 0.2s ease;
          outline: none;
        }
        .btn-entrant-cancel:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .btn-entrant-cancel:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-entrant-submit {
          flex: 2; padding: 12px;
          background: #2563eb; border: none;
          border-radius: 10px; color: #fff;
          font-size: 0.95rem; fontWeight: 800;
          cursor: pointer;
          box-shadow: 0 6px 15px rgba(37,99,235,0.3);
          display: flex; alignItems: center;
          justify-content: center; gap: 8px;
          transition: all 0.2s ease;
          outline: none;
        }
        .btn-entrant-submit:hover:not(:disabled) {
          background: #3b82f6;
          box-shadow: 0 8px 20px rgba(59,130,246,0.45);
          transform: translateY(-1px);
        }
        .btn-entrant-submit:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
      {!noOverlay ? (
        <div onClick={!isSubmitting ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      ) : (
        <div onClick={!isSubmitting ? onClose : undefined} style={{ position: 'absolute', inset: 0 }} />
      )}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid rgba(59,130,246,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.2))',
            border: '1.5px solid rgba(59,130,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(59,130,246,0.15)'
          }}>👋</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Agent Entrant</h3>
            {agentName && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                Agent : <span style={{ color: '#60a5fa', fontWeight: 700 }}>{agentName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="entrant-config-content">
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Motif</label>
            <select 
              value={entrantMotif} 
              onChange={e => onEntrantMotifChange(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
            >
              <option value="ENTRANT" style={{ background: '#1e293b', color: 'white' }}>Entrant</option>
              <option value="REINTEGRATION" style={{ background: '#1e293b', color: 'white' }}>Réintégration</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Date d'entrée (Le pointage commencera à partir de cette date)</label>
            <input 
              type="date" 
              value={entrantDate} 
              onChange={e => onEntrantDateChange(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'text', opacity: isSubmitting ? 0.6 : 1 }}
              required
            />
          </div>
          
          {isDateOut && (
            <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.85rem', lineHeight: '1.4' }}>
              <strong>⚠️ Période décalée :</strong><br/>
              {warningMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-entrant-cancel" onClick={onClose} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.6 : 1 }}>Annuler</button>
            <button type="button" className="btn-entrant-submit" onClick={handleSubmit} disabled={isSubmitting || isDateOut} style={{ opacity: (isSubmitting || isDateOut) ? 0.5 : 1, cursor: isDateOut ? 'not-allowed' : undefined }}>
              {isSubmitting ? (
                <>
                  <span className="loader" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Validation...
                </>
              ) : 'Valider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
