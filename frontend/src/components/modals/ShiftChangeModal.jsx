import React from 'react';

export default function ShiftChangeModal({
  showShiftChangeMenu,
  setShowShiftChangeMenu,
  handleShiftChangeSubmit,
  datesList = [],
  shiftChangeDateSearch,
  setShiftChangeDateSearch,
  shiftChangeDate,
  setShiftChangeDate,
  shiftChangeDatePickerOpen,
  setShiftChangeDatePickerOpen,
  shiftChangeNewType,
  setShiftChangeNewType,
  formatDateKey,
  getDayLabel,
  loading
}) {
  if (!showShiftChangeMenu) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowShiftChangeMenu(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '420px', width: '90%', border: '1px solid rgba(56,189,248,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Changement de Vacation
        </h3>
        <form onSubmit={handleShiftChangeSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500' }}>À partir de quelle date ?</label>
            {(() => {
              const filteredDates = (datesList || []).filter(d => {
                if (!shiftChangeDateSearch) return true;
                return d.toLocaleDateString('fr-FR').includes(shiftChangeDateSearch) ||
                  (getDayLabel && getDayLabel(d).toLowerCase().includes(shiftChangeDateSearch.toLowerCase()));
              });
              const selectedDateObj = shiftChangeDate && formatDateKey ? datesList.find(d => formatDateKey(d) === shiftChangeDate) : null;
              return (
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShiftChangeDatePickerOpen(o => !o)}
                    style={{ width: '100%', padding: '12px 14px', background: shiftChangeDatePickerOpen ? 'rgba(56,189,248,0.15)' : 'rgba(0,0,0,0.2)', color: 'white', border: `1px solid ${shiftChangeDatePickerOpen ? 'rgba(56,189,248,0.7)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', textAlign: 'left' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={shiftChangeDatePickerOpen ? '#38bdf8' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <span style={{ color: selectedDateObj ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                        {selectedDateObj ? `${selectedDateObj.toLocaleDateString('fr-FR')} (${getDayLabel ? getDayLabel(selectedDateObj) : ''})` : 'Sélectionnez une date...'}
                      </span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: shiftChangeDatePickerOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>

                  {shiftChangeDatePickerOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50, background: 'linear-gradient(145deg, #1e1b4b, #0f172a)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ position: 'relative' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          <input
                            autoFocus
                            placeholder="Rechercher une date..."
                            value={shiftChangeDateSearch}
                            onChange={e => setShiftChangeDateSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px' }}>
                        {filteredDates.length === 0 && (
                          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '16px 0' }}>Aucune date trouvée</p>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
                          {filteredDates.map(d => {
                            const dk = formatDateKey ? formatDateKey(d) : '';
                            const isSelected = shiftChangeDate === dk;
                            const dayLabel = getDayLabel ? getDayLabel(d) : '';
                            const isWeekend = dayLabel === 'Di' || dayLabel === 'Sa';
                            return (
                              <button key={dk} type="button"
                                onClick={() => { setShiftChangeDate(dk); setShiftChangeDatePickerOpen(false); setShiftChangeDateSearch(''); }}
                                style={{ padding: '8px 10px', background: isSelected ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'rgba(56,189,248,0.8)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', color: isSelected ? '#38bdf8' : isWeekend ? '#f97316' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontSize: '0.8rem', lineHeight: '1.4' }}
                                onMouseOver={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; } }}
                                onMouseOut={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                              >
                                <div style={{ fontWeight: 700 }}>{dayLabel} {d.getDate().toString().padStart(2, '0')}</div>
                                <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>{d.toLocaleDateString('fr-FR', { month: 'short' })} {d.getFullYear()}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500' }}>Nouvelle vacation</label>
            {(() => {
              const vacationOptions = [
                { value: 'Jour', label: 'Jour', sub: 'J', icon: '☀️', color: '#facc15' },
                { value: 'Nuit', label: 'Nuit', sub: 'N', icon: '🌙', color: '#818cf8' },
                { value: '24h', label: '24 heures', sub: 'J, N', icon: '🔄', color: '#34d399' },
                { value: '48h', label: '48 heures', sub: 'J, N', icon: '⏳', color: '#f97316' },
                { value: '72h', label: '72 heures', sub: 'J, N', icon: '⌛', color: '#ec4899' },
              ];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                  {vacationOptions.map(opt => {
                    const isSelected = shiftChangeNewType === opt.value;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setShiftChangeNewType(opt.value)}
                        style={{
                          padding: '12px 8px',
                          background: isSelected ? `rgba(${opt.color === '#facc15' ? '250,204,21' : opt.color === '#818cf8' ? '129,140,248' : opt.color === '#34d399' ? '52,211,153' : opt.color === '#f97316' ? '249,115,22' : '236,72,153'},0.2)` : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${isSelected ? opt.color : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '10px',
                          color: isSelected ? opt.color : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.18s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                        }}
                        onMouseOver={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.color = opt.color; } }}
                        onMouseOut={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                      >
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{opt.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>({opt.sub})</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setShowShiftChangeMenu(null)}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Annuler
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 2, padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', color: '#000', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 15px rgba(56,189,248,0.3)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#7dd3fc'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(56,189,248,0.4)'; } }}
              onMouseOut={e => { if (!loading) { e.currentTarget.style.background = '#38bdf8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(56,189,248,0.3)'; } }}
            >
              {loading ? 'En cours...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
