import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function SpecialServiceModal({
  isOpen,
  onClose,
  specialServiceBase,
  setSpecialServiceBase,
  specialServiceDays,
  setSpecialServiceDays,
  isEntrant,
  setIsEntrant,
  entrantDate,
  setEntrantDate,
  isDebut,
  setIsDebut,
  debutDate,
  setDebutDate,
  minDate,
  maxDate,
  datesList = [],
  onValidate,
  noOverlay = false
}) {
  const [errorMsg, setErrorMsg] = useState('');


  const daysOfWeek = [
    { label: 'Lundi', value: 1 },
    { label: 'Mardi', value: 2 },
    { label: 'Mercredi', value: 3 },
    { label: 'Jeudi', value: 4 },
    { label: 'Vendredi', value: 5 },
    { label: 'Samedi', value: 6 },
    { label: 'Dimanche', value: 7 }
  ];

  // Calculer dynamiquement le nombre de jours travaillés selon le calendrier
  const calculateRealWorkedDays = () => {
    if (!datesList || datesList.length === 0) return 0;
    if (specialServiceDays.length === 0) return 0;

    // Normaliser la date de début de comparaison
    let startDate = null;
    if (isEntrant && entrantDate) {
      startDate = new Date(entrantDate + 'T00:00:00');
    } else if (isDebut && debutDate) {
      startDate = new Date(debutDate + 'T00:00:00');
    } else {
      // Par défaut, début du cycle
      const firstDate = new Date(datesList[0]);
      firstDate.setHours(0, 0, 0, 0);
      startDate = firstDate;
    }

    let count = 0;
    datesList.forEach(dStr => {
      const d = new Date(dStr);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() >= startDate.getTime()) {
        const jsDay = d.getDay(); // 0 = Dimanche, 1 = Lundi...
        const appDay = jsDay === 0 ? 7 : jsDay;
        if (specialServiceDays.includes(appDay)) {
          count++;
        }
      }
    });
    return count;
  };

  const formatNiceDate = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      return `${String(val.getDate()).padStart(2, '0')}/${String(val.getMonth() + 1).padStart(2, '0')}/${val.getFullYear()}`;
    }
    if (typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return val;
    }
    return '';
  };

  const calculateCycleTotalDays = () => {
    if (!datesList || datesList.length === 0) return 0;
    if (specialServiceDays.length === 0) return 0;

    let count = 0;
    datesList.forEach(dStr => {
      const d = new Date(dStr);
      const jsDay = d.getDay();
      const appDay = jsDay === 0 ? 7 : jsDay;
      if (specialServiceDays.includes(appDay)) {
        count++;
      }
    });
    return count;
  };

  const cycleTotalDays = calculateCycleTotalDays();
  const realDaysCount = calculateRealWorkedDays();

  // Ajuster dynamiquement et automatiquement la base de jours en temps réel
  useEffect(() => {
    if (specialServiceDays.length > 0) {
      if (cycleTotalDays > 0 && specialServiceBase !== cycleTotalDays) {
        setSpecialServiceBase(cycleTotalDays);
      }
      setErrorMsg('');
    } else {
      setErrorMsg('');
    }
  }, [specialServiceBase, specialServiceDays, cycleTotalDays, setSpecialServiceBase]);

  if (!isOpen) return null;

  const handleValidate = () => {
    if (specialServiceDays.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un jour travaillé dans la semaine.");
      return;
    }
    if (specialServiceBase <= 0) {
      setErrorMsg("Veuillez saisir une base jours / mois supérieure à 0.");
      return;
    }

    // On ne bloque plus la validation pour cause d'incohérence, le système gère ça en auto

    // Validation de la date de début si active
    if (isDebut && debutDate) {
      const dObj = new Date(debutDate + 'T00:00:00');
      const cycleStart = datesList.length > 0 ? new Date(datesList[0]) : null;
      const cycleEnd = datesList.length > 0 ? new Date(datesList[datesList.length - 1]) : null;
      if (cycleStart && cycleEnd) {
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd.setHours(23, 59, 59, 999);
        if (dObj < cycleStart || dObj > cycleEnd) {
          const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
          setErrorMsg(`La date doit être dans le cycle actuel (du ${fmt(cycleStart)} au ${fmt(cycleEnd)}).`);
          return;
        }
      }
    }

    // Validation de l'agent entrant si actif
    if (isEntrant && entrantDate) {
      const dObj = new Date(entrantDate + 'T00:00:00');
      const cycleStart = datesList.length > 0 ? new Date(datesList[0]) : null;
      const cycleEnd = datesList.length > 0 ? new Date(datesList[datesList.length - 1]) : null;
      if (cycleStart && cycleEnd) {
        cycleStart.setHours(0, 0, 0, 0);
        cycleEnd.setHours(23, 59, 59, 999);
        if (dObj < cycleStart || dObj > cycleEnd) {
          const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
          setErrorMsg(`La date d'entrée doit être dans le cycle actuel (du ${fmt(cycleStart)} au ${fmt(cycleEnd)}).`);
          return;
        }
      }
    }

    setErrorMsg('');
    if (onValidate) {
      onValidate();
    } else {
      onClose();
    }
  };

  const handleAutoAdjust = () => {
    setSpecialServiceBase(cycleTotalDays);
    setErrorMsg('');
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      background: noOverlay ? 'transparent' : 'rgba(15, 23, 42, 0.75)', 
      backdropFilter: noOverlay ? 'none' : 'blur(8px)',
      zIndex: 11000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center' 
    }}>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .day-badge-hover {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .day-badge-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }
        .close-btn-hover {
          transition: all 0.2s ease;
        }
        .close-btn-hover:hover {
          color: #ef4444 !important;
          transform: rotate(90deg);
        }
        .validate-btn-hover {
          transition: all 0.25s ease;
        }
        .validate-btn-hover:hover {
          background: #2563eb !important;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }
      `}</style>
      
      <div style={{ 
        background: '#0f172a', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', 
        padding: '32px', 
        width: '90%', 
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span> Configurer Temps Partiel
          </h3>
          <button onClick={onClose} className="close-btn-hover" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#f87171', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            fontSize: '0.85rem',
            lineHeight: 1.4,
            animation: 'modalFadeIn 0.2s ease'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <span>{errorMsg}</span>
              {errorMsg.includes("Incohérence détectée") && (
                <button 
                  onClick={handleAutoAdjust}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                >
                  Ajuster automatiquement à {cycleTotalDays} jours
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Base jours / mois */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Base jours / mois
            </label>
            <input 
              type="number"
              className="form-input"
              style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                color: 'white', 
                borderRadius: '12px', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                width: '100%', 
                padding: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: 600
              }}
              value={specialServiceBase}
              onChange={e => setSpecialServiceBase(Number(e.target.value))}
              required
            />
          </div>

          {/* Jours de travail */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '12px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jours travaillés dans la semaine
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {daysOfWeek.map(day => {
                const isSelected = specialServiceDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    className="day-badge-hover"
                    onClick={() => {
                      if (isSelected) {
                        setSpecialServiceDays(specialServiceDays.filter(d => d !== day.value));
                      } else {
                        setSpecialServiceDays([...specialServiceDays, day.value]);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? '#f59e0b' : '#94a3b8',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Badge dynamique */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Jours programmés sur le mois :</span>
              <span style={{ 
                color: cycleTotalDays === specialServiceBase ? '#10b981' : '#f59e0b', 
                fontWeight: 700,
                fontSize: '1rem',
                background: cycleTotalDays === specialServiceBase ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {cycleTotalDays} jours
              </span>
            </div>
            
            {((isDebut && debutDate) || (isEntrant && entrantDate)) && (
              <>
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Jours réellement effectués (restants) :</span>
                  <span style={{ 
                    color: '#60a5fa', 
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'rgba(96, 165, 250, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '8px'
                  }}>
                    {realDaysCount} jours
                  </span>
                </div>
              </>
            )}
            
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <div className="form-group" style={{ 
                background: isEntrant ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
                padding: '8px 12px', 
                borderRadius: '12px', 
                border: `1px solid ${isEntrant ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`, 
                display: 'flex', 
                alignItems: 'center', 
                height: '46px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isEntrant ? '#60a5fa' : '#94a3b8', margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={isEntrant} onChange={e => { setIsEntrant(e.target.checked); if(e.target.checked) setIsDebut(false); }} />
                  Agent Entrant
                </label>
              </div>
              <div className="form-group" style={{ 
                background: isDebut ? 'rgba(236, 72, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
                padding: '8px 12px', 
                borderRadius: '12px', 
                border: `1px solid ${isDebut ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`, 
                display: 'flex', 
                alignItems: 'center', 
                height: '46px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isDebut ? '#f472b6' : '#94a3b8', margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={isDebut} onChange={e => { setIsDebut(e.target.checked); if(e.target.checked) setIsEntrant(false); }} />
                  Date de début
                </label>
              </div>
            </div>

            {isEntrant && (
              <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700 }}>Date d'entrée</label>
                {datesList.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(96, 165, 250, 0.8)', marginBottom: '8px', fontWeight: 500 }}>
                    📅 Cycle actif : du {formatNiceDate(datesList[0])} au {formatNiceDate(datesList[datesList.length - 1])}
                  </div>
                )}
                <input type="date" className="form-input" style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} value={entrantDate} onChange={e => setEntrantDate(e.target.value)} min={minDate} max={maxDate} />
              </div>
            )}

            {isDebut && (
              <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f472b6', fontSize: '0.8rem', fontWeight: 700 }}>Saisie à partir du</label>
                {datesList.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(244, 114, 182, 0.8)', marginBottom: '8px', fontWeight: 500 }}>
                    📅 Cycle actif : du {formatNiceDate(datesList[0])} au {formatNiceDate(datesList[datesList.length - 1])}
                  </div>
                )}
                <input type="date" className="form-input" style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} value={debutDate} onChange={e => setDebutDate(e.target.value)} min={minDate} max={maxDate} />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '12px' }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '10px 24px', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 600 }}
          >
            Fermer
          </button>
          <button 
            onClick={handleValidate} 
            className="validate-btn-hover" 
            style={{ 
              padding: '10px 28px', 
              fontSize: '0.85rem', 
              background: '#3b82f6', 
              border: 'none', 
              borderRadius: '10px', 
              color: '#fff', 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
