import React from 'react';

export default function ReposSegmentModal({
  reposSegmentSelection,
  setReposSegmentSelection,
  datesList,
  formatDateKey,
  executeSegmentRepos
}) {
  return (
    <div className="modal-overlay" onClick={() => setReposSegmentSelection(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '2.5rem', borderRadius: '16px', maxWidth: '500px', width: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Sur quelle période définir ce repos ?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Cet agent a changé de vacation au cours du mois. Choisissez la période sur laquelle vous souhaitez appliquer ce jour de repos.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {reposSegmentSelection.segments.map((seg, idx) => {
            const isOngoing = seg.to === '9999-12-31';
            const periodStartStr = formatDateKey(datesList[0]);
            
            let periodDescription = "";
            if (seg.from <= periodStartStr && isOngoing) {
              periodDescription = "Sur tout le mois";
            } else if (seg.from <= periodStartStr) {
              periodDescription = `Depuis le début du mois jusqu'au ${new Date(seg.to).toLocaleDateString('fr-FR')}`;
            } else if (isOngoing) {
              periodDescription = `À partir du ${new Date(seg.from).toLocaleDateString('fr-FR')} jusqu'à la fin du mois`;
            } else {
              periodDescription = `Du ${new Date(seg.from).toLocaleDateString('fr-FR')} au ${new Date(seg.to).toLocaleDateString('fr-FR')}`;
            }
            
            const isLast = idx === reposSegmentSelection.segments.length - 1;
            
            const emerald = '#10b981';
            const emeraldRgb = '16, 185, 129';
            
            const baseBg = isLast ? `rgba(${emeraldRgb}, 0.08)` : 'rgba(255,255,255,0.05)';
            const baseBorder = isLast ? `1px solid ${emerald}` : '1px solid rgba(255,255,255,0.2)';
            const hoverBg = isLast ? `rgba(${emeraldRgb}, 0.15)` : 'rgba(56, 189, 248, 0.1)';
            const hoverBorder = isLast ? emerald : 'var(--primary)';
            const boxShadow = isLast ? `0 0 15px rgba(${emeraldRgb}, 0.2)` : 'none';

            return (
              <button 
                key={seg.type || `seg-${idx}`} 
                className="btn" 
                style={{ background: baseBg, color: 'white', border: baseBorder, padding: '15px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: boxShadow }}
                onMouseOver={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = hoverBorder; }}
                onMouseOut={e => { e.currentTarget.style.background = baseBg; e.currentTarget.style.borderColor = baseBorder; }}
                onClick={() => executeSegmentRepos(reposSegmentSelection.agent, reposSegmentSelection.dayOfWeekIndex, seg)}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                    Vacation: {seg.type}
                    {isLast && (
                      <span style={{ fontSize: '0.7rem', background: emerald, color: '#ffffff', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Actuelle
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isLast ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>{periodDescription}</div>
                </div>
                <span style={{ fontSize: '1.5rem', color: isLast ? emerald : 'var(--primary)' }}>→</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setReposSegmentSelection(null)}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
