import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar } from 'lucide-react';

export default function PermanentSupplementsModal({ isOpen, onClose, agent, supps, onSave }) {
  const [selectedSupps, setSelectedSupps] = useState({});

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

  const handleSave = () => {
    onSave(agent.id, selectedSupps);
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
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        width: '850px',
        maxWidth: '95%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} color="#38bdf8" />
            Récurrence des Supplémentaires
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '30px 40px', flex: 1, overflowY: 'auto', maxHeight: '65vh' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={24} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#bae6fd', lineHeight: '1.6' }}>
              Cochez les jours pour lesquels vous souhaitez rendre ce supplémentaire <strong>permanent</strong>. <br/>
              Lors de la création des mois suivants, l'agent <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{agent.name}</strong> aura automatiquement le supplémentaire (du même type) ajouté tous les jours correspondants.
            </p>
          </div>

          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Supplémentaires du mois ({uniqueSupps.length})
          </h3>

          {uniqueSupps.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              Aucune supplémentaire détectée ce mois-ci.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uniqueSupps.map((s, i) => {
                const dateObj = new Date(s.date);
                const dayNumber = dateObj.getDay() || 7;
                const isChecked = selectedSupps[dayNumber] && !!selectedSupps[dayNumber][s.shift];
                const dayName = getDayName(dayNumber);
                
                // Show human-readable code
                let displayCode = s.code;
                if (s.code === '1') displayCode = 'Interne (1)';
                else if (s.code && s.code.startsWith('Suppl')) displayCode = 'Externe (' + s.code + ')';

                return (
                  <label key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', 
                    background: isChecked ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)', 
                    border: isChecked ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.04)', 
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isChecked ? '0 4px 12px rgba(56, 189, 248, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggle(dayNumber, s.shift, s.code)}
                      style={{ width: '24px', height: '24px', accentColor: '#38bdf8', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '1.1rem', textTransform: 'capitalize', marginBottom: '6px' }}>
                        {formatDate(s.date)} — <span style={{ color: '#38bdf8' }}>{s.shift === 'S' ? 'SP' : s.shift === 'SJ' ? 'SP-J' : s.shift === 'SN' ? 'SP-N' : s.shift}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Vacation : {s.shift === 'SJ' ? 'Jour' : s.shift === 'SN' ? 'Nuit' : 'Spécial'} — Code : <span style={{ color: s.code === '1' ? '#38bdf8' : '#cbd5e1', fontWeight: '600' }}>{displayCode}</span>
                      </div>
                    </div>
                    {isChecked && (
                      <div style={{ background: '#38bdf8', color: '#0f172a', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                        Tous les {dayName}s
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '8px 16px', background: '#38bdf8', border: 'none', color: '#0f172a', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={18} />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
