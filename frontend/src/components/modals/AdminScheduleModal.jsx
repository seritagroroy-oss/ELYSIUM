import React, { useState } from 'react';
import { Settings, Check, X, CalendarDays, Edit3, Loader2 } from 'lucide-react';

export default function AdminScheduleModal({
  isOpen,
  onClose,
  adminScheduleDays,
  setAdminScheduleDays,
  onValidate,
  noOverlay = false
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { label: 'Lun - Mar', value: [1, 2] },
    { label: 'Mar - Mer', value: [2, 3] },
    { label: 'Mer - Jeu', value: [3, 4] },
    { label: 'Jeu - Ven', value: [4, 5] },
    { label: 'Ven - Sam', value: [5, 6] },
    { label: 'Sam - Dim', value: [6, 7] },
    { label: 'Dim - Lun', value: [7, 1] }
  ];

  const daysOfWeek = [
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mer', value: 3 },
    { label: 'Jeu', value: 4 },
    { label: 'Ven', value: 5 },
    { label: 'Sam', value: 6 },
    { label: 'Dim', value: 7 }
  ];

  const currentSelection = adminScheduleDays || [];

  const handlePresetSelect = (val) => {
    setAdminScheduleDays(val);
  };

  const toggleDay = (dayVal) => {
    if (currentSelection.includes(dayVal)) {
      setAdminScheduleDays(currentSelection.filter(d => d !== dayVal));
    } else {
      setAdminScheduleDays([...currentSelection, dayVal]);
    }
  };

  const handleValidate = async () => {
    setIsSubmitting(true);
    try {
      if (onValidate) await onValidate();
      else onClose();
    } finally {
      // S'il est fermé, le composant sera démonté, sinon on remet à false en cas d'erreur
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      background: noOverlay ? 'transparent' : 'rgba(15, 23, 42, 0.75)', 
      backdropFilter: noOverlay ? 'none' : 'blur(8px)',
      zIndex: 11000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center' 
    }}>
      <div style={{ 
        background: '#0f172a', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', 
        width: '100%', maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
        animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 28px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '10px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8'
            }}>
              <CalendarDays size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Repos Personnalisé
            </h3>
          </div>
          <button onClick={onClose} className="close-btn-hover" style={{ 
            background: 'transparent', border: 'none', color: '#94a3b8', 
            cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '8px' 
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isCustomMode ? 'Jours de repos personnalisés' : 'Repos préconfigurés (2 Jours)'}
            </label>
            <button 
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              style={{
                background: 'transparent', border: 'none', color: isCustomMode ? '#818cf8' : '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600,
                padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s'
              }}
              title={isCustomMode ? "Revenir aux presets" : "Mode personnalisé"}
            >
              <Edit3 size={15} />
              {isCustomMode ? 'Presets' : 'Libre'}
            </button>
          </div>

          {!isCustomMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {presets.map((preset, idx) => {
                const isSelected = preset.value.length === currentSelection.length && 
                                   preset.value.every(v => currentSelection.includes(v));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset.value)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px', padding: '12px 10px',
                      color: isSelected ? '#818cf8' : '#e2e8f0',
                      fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      }
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {preset.label}
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', padding: '20px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {daysOfWeek.map(day => {
                const isSelected = currentSelection.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className="day-badge-hover"
                    style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.5)' : 'transparent'}`,
                      color: isSelected ? '#818cf8' : '#94a3b8',
                      fontSize: '0.85rem', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            {currentSelection.length === 0 ? "Aucun repos sélectionné" : 
             `${currentSelection.length} jour(s) de repos configuré(s)`}
          </div>

        </div>

        {/* Footer */}
        <div style={{ 
          padding: '20px 28px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.15)'
        }}>
          <button 
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px',
              color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              opacity: isSubmitting ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = 'transparent';
            }}
            disabled={isSubmitting}
          >
            Fermer
          </button>
          <button 
            type="button"
            onClick={handleValidate}
            className="validate-btn-hover"
            style={{
              flex: 1, padding: '12px', background: isSubmitting ? '#4338ca' : '#4f46e5',
              border: 'none', borderRadius: '10px',
              color: '#ffffff', fontSize: '0.95rem', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#4f46e5';
                e.currentTarget.style.transform = 'none';
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                Enregistrement...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
