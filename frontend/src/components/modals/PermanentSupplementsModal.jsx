import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar, Loader2 } from 'lucide-react';

export default function PermanentSupplementsModal({ isOpen, onClose, agent, supps, onSave }) {
  const [selectedSupps, setSelectedSupps] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      const profile = agent.profile_data || {};
      const saved = profile.permanent_supps;
      
      let initObj = {};
      if (Array.isArray(saved)) {
        // Legacy: convert array to object with default code '1' under 'S'
        saved.forEach(d => { initObj[d] = { 'S': '1' }; });
      } else if (saved && typeof saved === 'object') {
        Object.keys(saved).forEach(k => {
          if (typeof saved[k] === 'string') {
             // Legacy string format
             initObj[k] = { 'S': saved[k] };
          } else {
             // New format
             initObj[k] = { ...saved[k] };
          }
        });
      }
      setSelectedSupps(initObj);
    }
  }, [isOpen, agent]);

  if (!isOpen || !agent) return null;

  const handleToggle = (dayNumber, shiftKey, code) => {
    setSelectedSupps(prev => {
      const next = { ...prev };
      if (!next[dayNumber]) next[dayNumber] = {};
      
      if (next[dayNumber][shiftKey]) {
        delete next[dayNumber][shiftKey];
        if (Object.keys(next[dayNumber]).length === 0) {
          delete next[dayNumber];
        }
      } else {
        next[dayNumber][shiftKey] = code;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(agent.id, selectedSupps);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Group supps by date and shift to allow selecting multiple per day
  const uniqueSupps = [];
  const seenDateShifts = new Set();
  (supps || []).forEach(s => {
    const key = `${s.date}_${s.shift}`;
    if (!seenDateShifts.has(key)) {
      seenDateShifts.add(key);
      uniqueSupps.push(s);
    }
  });

  const getDayName = (dayNumber) => {
    const days = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' };
    return days[dayNumber] || '';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000,
      opacity: 1, transition: 'opacity 0.3s ease-out'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '24px',
        width: '850px',
        maxWidth: '95%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0) 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', padding: '8px', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>
              <Calendar size={22} color="#ffffff" />
            </div>
            Récurrence des Supplémentaires
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', maxHeight: '65vh' }}>
          <div style={{ background: 'linear-gradient(to right, rgba(14, 165, 233, 0.1), rgba(56, 189, 248, 0.05))', border: '1px solid rgba(56, 189, 248, 0.2)', borderLeft: '4px solid #0ea5e9', padding: '20px 24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AlertCircle size={28} color="#38bdf8" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '1rem', color: '#e0f2fe', lineHeight: '1.6' }}>
              Cochez les jours pour lesquels vous souhaitez rendre ce supplémentaire <strong style={{ color: '#ffffff' }}>permanent</strong>. <br/>
              Lors de la création des mois suivants, l'agent <strong style={{ color: '#38bdf8', fontSize: '1.1rem', background: 'rgba(14, 165, 233, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>{agent.name}</strong> aura automatiquement le supplémentaire ajouté tous les jours correspondants.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
              Supplémentaires du mois
            </h3>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}></div>
            <span style={{ background: '#1e293b', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{uniqueSupps.length} détecté{uniqueSupps.length > 1 ? 's' : ''}</span>
          </div>

          {uniqueSupps.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '1.1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              Aucune supplémentaire détectée ce mois-ci.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {uniqueSupps.map((s, i) => {
                const dateObj = new Date(s.date);
                const dayNumber = dateObj.getDay() || 7;
                const isChecked = selectedSupps[dayNumber] && !!selectedSupps[dayNumber][s.shift];
                const dayName = getDayName(dayNumber);
                
                let displayCode = s.code;
                if (s.code === '1') displayCode = 'Interne (1)';
                else if (s.code && s.code.startsWith('Suppl')) displayCode = 'Externe (' + s.code + ')';

                return (
                  <label key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', 
                    background: isChecked ? 'linear-gradient(145deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))' : 'rgba(255,255,255,0.03)', 
                    border: isChecked ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isChecked ? '0 8px 20px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                    transform: isChecked ? 'translateY(-2px)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (!isChecked) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                  onMouseLeave={(e) => { if (!isChecked) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; } }}>
                    
                    {/* Custom Checkbox */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', 
                      background: isChecked ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'rgba(0,0,0,0.2)',
                      border: isChecked ? 'none' : '2px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      boxShadow: isChecked ? '0 4px 12px rgba(14, 165, 233, 0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {isChecked && (
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 6L6 10L14 2" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggle(dayNumber, s.shift, s.code)}
                      style={{ display: 'none' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ color: isChecked ? '#ffffff' : '#f8fafc', fontWeight: '700', fontSize: '1.15rem', textTransform: 'capitalize', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {formatDate(s.date)}
                        <span style={{ background: isChecked ? '#0ea5e9' : '#1e293b', color: isChecked ? '#ffffff' : '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {s.shift === 'S' ? 'SP' : s.shift === 'SJ' ? 'SP-J' : s.shift === 'SN' ? 'SP-N' : s.shift}
                        </span>
                      </div>
                      <div style={{ color: isChecked ? '#bae6fd' : '#94a3b8', fontSize: '0.95rem' }}>
                        Vacation : {s.shift === 'SJ' ? 'Jour' : s.shift === 'SN' ? 'Nuit' : 'Spécial'} <span style={{ opacity: 0.5, margin: '0 8px' }}>|</span> Code : <span style={{ color: isChecked ? '#ffffff' : (s.code === '1' ? '#38bdf8' : '#cbd5e1'), fontWeight: '600' }}>{displayCode}</span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      opacity: isChecked ? 1 : 0, transform: isChecked ? 'scale(1)' : 'scale(0.8)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc', fontSize: '0.9rem', padding: '8px 16px', borderRadius: '20px', fontWeight: '700' 
                    }}>
                      Tous les {dayName}s
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 32px', background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', border: 'none', color: '#ffffff', borderRadius: '12px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'all 0.2s', opacity: isSaving ? 0.7 : 1 }}
            onMouseEnter={e => { if(!isSaving){ e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(14, 165, 233, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'; } }}
            onMouseLeave={e => { if(!isSaving){ e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'; } }}
          >
            {isSaving ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? 'Enregistrement...' : 'Sauvegarder les Récurrences'}
          </button>
        </div>
      </div>
    </div>
  );
}
