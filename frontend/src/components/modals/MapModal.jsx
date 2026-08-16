import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const MapModal = ({
  agentName,
  period,
  cycleStart,
  mapNavOffset,
  setMapNavOffset,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  manualDuration,
  onManualDurationChange,
  onClose,
  onSubmit,
  getSafePeriod,
  formatDateKey,
  getDayLabel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={() => { if(!isSubmitting) onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        pointerEvents: isSubmitting ? 'none' : 'auto',
        opacity: isSubmitting ? 0.7 : 1,
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: '20px', padding: '36px',
        maxWidth: '550px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.2))',
            border: '1.5px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 6px 20px rgba(239,68,68,0.15)'
          }}>🚨</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Mise à pied (MAP) / Sanction</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
              Agent : <span style={{ color: '#f87171', fontWeight: 700 }}>{agentName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={async (e) => { 
          e.preventDefault(); 
          setIsSubmitting(true);
          try {
            await onSubmit();
          } catch (err) {
            console.error("Form submit error:", err);
            alert("Erreur lors de la validation : " + err.message);
          } finally {
            setIsSubmitting(false);
          }
        }}>
          <div style={{ marginBottom: '24px' }}>
            {/* Options de sélection */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button type="button" onClick={() => { localStorage.setItem('map_selection_mode', 'nav'); setMapNavOffset(0); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: (localStorage.getItem('map_selection_mode') || 'nav') === 'nav' ? 'rgba(239,68,68,0.2)' : 'transparent', color: (localStorage.getItem('map_selection_mode') || 'nav') === 'nav' ? '#f87171' : 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Mois par mois</button>
              <button type="button" onClick={() => { localStorage.setItem('map_selection_mode', 'extended'); setMapNavOffset(0); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: (localStorage.getItem('map_selection_mode') || 'nav') === 'extended' ? 'rgba(239,68,68,0.2)' : 'transparent', color: (localStorage.getItem('map_selection_mode') || 'nav') === 'extended' ? '#f87171' : 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Vue 45 jours</button>
              <button type="button" onClick={() => { localStorage.setItem('map_selection_mode', 'manual'); setMapNavOffset(0); onManualDurationChange('3'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: (localStorage.getItem('map_selection_mode') || 'nav') === 'manual' ? 'rgba(239,68,68,0.2)' : 'transparent', color: (localStorage.getItem('map_selection_mode') || 'nav') === 'manual' ? '#f87171' : 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Saisie Durée</button>
            </div>

            <label style={{ display: 'block', marginBottom: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', textAlign: 'center' }}>
              {(() => {
                const mode = localStorage.getItem('map_selection_mode') || 'nav';
                if (mode === 'manual') return "Sélectionnez le début et saisissez la durée";
                return "Sélectionnez la période (cliquez le début puis la fin)";
              })()}
            </label>

            {/* Navigation controls if in 'nav' mode */}
            {(localStorage.getItem('map_selection_mode') || 'nav') === 'nav' && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <button type="button" onClick={() => setMapNavOffset(o => o - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>⬅️</button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', minWidth: '150px', textAlign: 'center' }}>
                  {(() => {
                    const [y, m] = getSafePeriod(period).split('-').map(Number);
                    let start = new Date(y, m - 2 + mapNavOffset, cycleStart);
                    let end = new Date(y, m - 1 + mapNavOffset, cycleStart - 1);
                    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
                  })()}
                </span>
                <button type="button" onClick={() => setMapNavOffset(o => o + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>➡️</button>
                <button type="button" onClick={() => setMapNavOffset(0)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '4px' }}>Aujourd'hui</button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {(() => {
                const mode = localStorage.getItem('map_selection_mode') || 'nav';
                const [year, month] = getSafePeriod(period).split('-').map(Number);
                let startD = new Date(year, month - 2, cycleStart);
                let endD = new Date(year, month - 1, cycleStart - 1);

                if (mode === 'nav') {
                  startD.setMonth(startD.getMonth() + mapNavOffset);
                  endD = new Date(startD.getFullYear(), startD.getMonth() + 1, cycleStart - 1);
                } else if (mode === 'extended') {
                  endD.setDate(endD.getDate() + 15);
                }
                
                const list = [];
                let curr = new Date(startD);
                while (curr <= endD) {
                  list.push(new Date(curr));
                  curr.setDate(curr.getDate() + 1);
                }
                return list;
              })().map(d => {
                const dk = formatDateKey(d);
                
                let isSelected = false;
                let isBetween = false;
                
                if (startDate && endDate) {
                  if (dk === startDate || dk === endDate) isSelected = true;
                  if (startDate < endDate && dk > startDate && dk < endDate) isBetween = true;
                  if (endDate < startDate && dk > endDate && dk < startDate) isBetween = true;
                } else if (startDate && dk === startDate) {
                  isSelected = true;
                }

                const getBg = () => {
                  if (isSelected) return 'rgba(239, 68, 68, 0.9)'; // bright red
                  if (isBetween) return 'rgba(239, 68, 68, 0.25)';  // light red
                  return 'rgba(255, 255, 255, 0.05)';
                };

                const getColor = () => {
                  if (isSelected) return '#fff';
                  if (isBetween) return '#fca5a5';
                  return 'rgba(255, 255, 255, 0.5)';
                };

                return (
                  <div
                    key={dk}
                    onClick={() => {
                      const mode = localStorage.getItem('map_selection_mode') || 'nav';
                      if (mode === 'manual') {
                         onStartDateChange(dk);
                         if (manualDuration && parseInt(manualDuration) > 0) {
                            let ed = new Date(dk);
                            ed.setDate(ed.getDate() + parseInt(manualDuration) - 1);
                            onEndDateChange(formatDateKey(ed));
                         } else {
                            onEndDateChange('');
                         }
                         return;
                      }

                      if (!startDate || (startDate && endDate)) {
                        // start new selection
                        onStartDateChange(dk);
                        onEndDateChange('');
                      } else {
                        // complete selection
                        if (dk < startDate) {
                          onEndDateChange(startDate);
                          onStartDateChange(dk);
                        } else {
                          onEndDateChange(dk);
                        }
                      }
                    }}
                    style={{
                      width: '38px', height: '38px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: getBg(),
                      color: getColor(),
                      border: isSelected ? '1px solid rgba(255,255,255,0.8)' : (isBetween ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)'),
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: isSelected || isBetween ? 'bold' : 'normal',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                       if (!isSelected && !isBetween) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                       if (!isSelected && !isBetween) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    title={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}`}
                  >
                    <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', marginBottom: '-2px', opacity: 0.8, color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {getDayLabel(d).charAt(0)}
                    </span>
                    <span>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Saisie Manuelle de la Durée (si mode manual et date de début sélectionnée) */}
            {(localStorage.getItem('map_selection_mode') || 'nav') === 'manual' && startDate && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Nombre de jours :</label>
                <input type="number" min="1" value={manualDuration} onChange={e => {
                  const val = e.target.value;
                  onManualDurationChange(val);
                  if (val && parseInt(val) > 0) {
                    let ed = new Date(startDate);
                    ed.setDate(ed.getDate() + parseInt(val) - 1);
                    onEndDateChange(formatDateKey(ed));
                  } else {
                    onEndDateChange('');
                  }
                }} style={{ width: '80px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', padding: '8px 10px', fontSize: '1rem', textAlign: 'center', outline: 'none' }} placeholder="Ex: 5" />
              </div>
            )}
          </div>

          {/* Résumé de la sélection */}
          {startDate && endDate && startDate <= endDate && (() => {
            let count = 0;
            let c = new Date(startDate);
            const e = new Date(endDate);
            while(c <= e) { count++; c.setDate(c.getDate() + 1); }
            return (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                🔴 <strong style={{ color: '#f87171' }}>{count} jour{count > 1 ? 's' : ''}</strong> de mise à pied seront enregistrés
              </div>
            );
          })()}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              type="button"
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!startDate || !endDate || isSubmitting}
              style={{
                flex: 2, padding: '12px', borderRadius: '10px',
                background: (!startDate || !endDate || isSubmitting) ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: (!startDate || !endDate || isSubmitting) ? 'rgba(255,255,255,0.3)' : '#fff',
                border: 'none', cursor: (!startDate || !endDate || isSubmitting) ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700,
                boxShadow: (!startDate || !endDate || isSubmitting) ? 'none' : '0 6px 15px rgba(239,68,68,0.3)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Validation en cours...
                </>
              ) : (!startDate || !endDate) ? 'Sélectionnez une période' : 'Valider la Sanction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MapModal;
