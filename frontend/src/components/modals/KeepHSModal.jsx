import React from 'react';
import { Edit } from 'lucide-react';

const KeepHSModal = ({
  showKeepHSModal,
  setShowKeepHSModal,
  sites,
  sitesToKeepHS,
  setSitesToKeepHS
}) => {
  if (!showKeepHSModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={() => setShowKeepHSModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
        maxWidth: '1400px', width: '95vw',
        height: '95vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(234,179,8,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}><Edit size={28} /></div>
          <div>
            <h3 style={{ color: '#fff', margin: '0', fontSize: '1.4rem', fontWeight: 800 }}>Conserver les Heures Suppl.</h3>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
          Cochez les sites pour lesquels vous souhaitez que les lignes supplémentaires (SP) du mois précédent soient automatiquement copiées pour ce nouveau mois.
        </p>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', paddingRight: '8px', alignContent: 'start' }}>
          {sites.filter(s => s && s.name && !s.name.includes('Administration') && !s.name.includes('Relevé')).map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: sitesToKeepHS.includes(s.id) ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)', border: sitesToKeepHS.includes(s.id) ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
              <input
                type="checkbox"
                checked={sitesToKeepHS.includes(s.id)}
                onChange={(e) => {
                  if (e.target.checked) setSitesToKeepHS([...sitesToKeepHS, s.id]);
                  else setSitesToKeepHS(sitesToKeepHS.filter(id => id !== s.id));
                }}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#eab308' }}
              />
              <span style={{ color: sitesToKeepHS.includes(s.id) ? '#fff' : 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: sitesToKeepHS.includes(s.id) ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
          <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            Annuler
          </button>
          <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #eab308 0%, #d97706 100%)', color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(234,179,8,0.4)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Valider la sélection ({sitesToKeepHS.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeepHSModal;
