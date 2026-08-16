import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, CheckCircle, X } from 'lucide-react';
import { apiCall } from '../../api';

export default function PointageCalendarModal({ isOpen, onClose, period }) {
  console.log("PointageCalendarModal rendu avec isOpen:", isOpen, "et period:", period);
  
  if (!isOpen) return null;

  const [checkedDays, setCheckedDays] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!period) return;
    
    // 1. Chargement instantané depuis le cache local (si disponible)
    const cached = localStorage.getItem(`calendar_fast_cache_${period}`);
    if (cached) {
      try { setCheckedDays(JSON.parse(cached)); } catch(e) {}
    }
    
    // 2. Chargement depuis le serveur en arrière-plan
    const fetchProgress = async () => {
      try {
        setIsLoading(!cached); // Afficher le loader seulement si pas de cache
        const res = await apiCall('get_calendar_progress', { period }, 'POST');
        if (res.success && res.progress) {
          setCheckedDays(res.progress);
          localStorage.setItem(`calendar_fast_cache_${period}`, JSON.stringify(res.progress));
        }
      } catch (e) {
        console.error("Erreur récupération calendrier:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [period]);

  const toggleDay = async (dateStr) => {
    const newChecked = { ...checkedDays, [dateStr]: !checkedDays[dateStr] };
    setCheckedDays(newChecked);
    if (period) {
      // Sauvegarde instantanée dans le cache local
      localStorage.setItem(`calendar_fast_cache_${period}`, JSON.stringify(newChecked));
      try {
        await apiCall('save_calendar_progress', { period, progress: newChecked }, 'POST');
      } catch (e) {
        console.error("Erreur sauvegarde calendrier:", e);
      }
    }
  };

  const getFormattedPeriod = () => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getDaysInCycle = () => {
    if (!period) return [];
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    // JS months are 0-indexed. month - 2 is previous month.
    const start = new Date(year, month - 2, 21);
    const end = new Date(year, month - 1, 20);
    
    const daysList = [];
    let current = new Date(start);
    while (current <= end) {
      daysList.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return daysList;
  };

  const days = getDaysInCycle();
  if (days.length === 0) {
    console.error("Aucun jour calculé pour la période:", period);
    return null;
  }

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999999
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px', padding: '30px',
        maxWidth: '500px', width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <Calendar size={24} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>Suivi du Pointage</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Période : {getFormattedPeriod()}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ 
              width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', 
              borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 15px',
              animation: 'spin 1s linear infinite' 
            }} />
            Chargement...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
              <div key={`header-${i}`} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>{j}</div>
            ))}

            {Array.from({ length: days.length > 0 ? (days[0].getDay() === 0 ? 6 : days[0].getDay() - 1) : 0 }).map((_, i) => (
               <div key={`empty-${i}`} />
            ))}

            {days.map((d, i) => {
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const isChecked = checkedDays[dateStr];
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              
              return (
                <div 
                  key={i}
                  onClick={() => toggleDay(dateStr)}
                  style={{
                    aspectRatio: '1/1',
                    background: isChecked ? 'linear-gradient(135deg, #10b981, #059669)' : (isWeekend ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'),
                    border: isChecked ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isChecked ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={e => { if(!isChecked) e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.border = isChecked ? '1px solid #34d399' : '1px solid rgba(56, 189, 248, 0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.border = isChecked ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)'; }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isChecked ? 'white' : 'rgba(255,255,255,0.8)', marginBottom: isChecked ? '2px' : '0' }}>{d.getDate()}</span>
                  {isChecked && <CheckCircle size={12} color="white" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
          Cliquez sur un jour pour marquer le pointage comme terminé. 
          <br/>Les données sont sauvegardées localement.
        </div>
      </div>
    </div>,
    document.body
  );
}
