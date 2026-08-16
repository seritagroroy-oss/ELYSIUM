import React from 'react';

export default function ChgtStatutModal({
  agentName,
  date,
  onDateChange,
  newFunction,
  onNewFunctionChange,
  reason,
  onReasonChange,
  colorNewFunction,
  onColorNewFunctionChange,
  colorValue,
  onColorValueChange,
  functions,
  datesList,
  formatDateKey,
  getDayLabel,
  onClose,
  onSubmit
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)',
        border: '1px solid rgba(234,179,8,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(234,179,8,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(234,179,8,0.25), rgba(202,138,4,0.2))',
            border: '1.5px solid rgba(234,179,8,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(234,179,8,0.15)'
          }}>🔄</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Changement de Statut</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              Agent : <span style={{ color: '#facc15', fontWeight: 700 }}>{agentName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Date d'effet (À partir de)</label>
            <select 
              value={date} 
              onChange={e => onDateChange(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'pointer' }}
              required
            >
              <option value="" disabled style={{background: '#1e293b', color: 'rgba(255,255,255,0.5)'}}>Sélectionnez une date...</option>
              {datesList.map(d => {
                const dk = formatDateKey(d);
                return <option key={dk} value={dk} style={{background: '#1e293b', color: 'white'}}>{d.toLocaleDateString('fr-FR')} ({getDayLabel(d)})</option>;
              })}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Nouvelle Fonction</label>
            <select 
              value={newFunction} 
              onChange={e => onNewFunctionChange(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'pointer' }}
              required
            >
              <option value="" disabled style={{background: '#1e293b', color: 'rgba(255,255,255,0.5)'}}>Sélectionnez la nouvelle fonction...</option>
              {functions.map(f => (
                <option key={f.id} value={f.id} style={{background: '#1e293b', color: 'white'}}>{f.fullName || f.id}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Motif (optionnel)</label>
            <input 
              type="text" 
              value={reason} 
              onChange={e => onReasonChange(e.target.value)}
              placeholder="ex: Décision client, Remplacement..."
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="colorNewFunction"
                checked={colorNewFunction}
                onChange={e => onColorNewFunctionChange(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#eab308' }}
              />
              <label htmlFor="colorNewFunction" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                Colorer les cases de la nouvelle fonction
              </label>
            </div>
            {colorNewFunction && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', paddingLeft: '28px' }}>
                <input 
                  type="color" 
                  value={colorValue}
                  onChange={e => onColorValueChange(e.target.value)}
                  style={{ width: '40px', height: '30px', padding: '0', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Choisissez la couleur</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} 
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Annuler
            </button>
            <button type="submit" 
              style={{ flex: 2, padding: '12px', background: '#eab308', border: 'none', borderRadius: '10px', color: '#000', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 15px rgba(234,179,8,0.3)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#facc15'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(234,179,8,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#eab308'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(234,179,8,0.3)'; }}
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
