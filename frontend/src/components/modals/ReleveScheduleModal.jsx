import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import { apiCall } from '../../api';

function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (!isOpen) {
      const selectedOpt = options.find(o => o.value === value);
      setSearch(selectedOpt ? selectedOpt.label : '');
    }
  }, [value, options, isOpen]);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', pointerEvents: disabled ? 'none' : 'auto', opacity: 1 }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: disabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.3)',
          border: disabled ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(249, 115, 22, 0.4)',
          borderRadius: '8px',
          color: disabled ? '#ffffff' : '#fff',
          fontSize: '0.95rem',
          fontWeight: '500',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 9999,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Aucun résultat</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  color: '#fff',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: value === opt.value ? 'rgba(249, 115, 22, 0.2)' : 'transparent'
                }}
                onMouseEnter={(e) => e.target.style.background = value === opt.value ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = value === opt.value ? 'rgba(249, 115, 22, 0.2)' : 'transparent'}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ReleveScheduleModal({ agent, sites, period, onClose, onSuccess }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Conflict management state
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedKeeps, setSelectedKeeps] = useState({}); // { '2026-07-01': true }

  const days = [
    { id: 1, label: 'Lundi' },
    { id: 2, label: 'Mardi' },
    { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' },
    { id: 5, label: 'Vendredi' },
    { id: 6, label: 'Samedi' },
    { id: 7, label: 'Dimanche' }
  ];

  const flattenedOptions = React.useMemo(() => {
    const opts = [{ value: '', label: '-- Repos / Aucun --' }];
    (sites || []).forEach(site => {
      if (['site_extras', 'site_releves', 'site_administration'].includes(site.id)) return;
      if (!site.subsites || site.subsites.length === 0) {
        opts.push({
          value: `${site.id}::`,
          label: `${site.name}`
        });
      } else {
        site.subsites.forEach(sub => {
          opts.push({
            value: `${site.id}::${sub.id}`,
            label: `${site.name} — ${sub.name}`
          });
        });
      }
    });
    return opts;
  }, [sites]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await apiCall('get_agent_schedules', { agent_id: agent.id });
        if (res && res.success) {
          const map = {};
          res.data.forEach(item => {
            map[item.day_of_week] = {
              site_id: item.target_site_id,
              subsite_id: item.target_subsite_id || ''
            };
          });
          setSchedule(map);
        }
      } catch (err) {
        console.error("Erreur chargement programme:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [agent.id]);

  const handleSiteChange = (dayId, siteId) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: { site_id: siteId, subsite_id: '' }
    }));
  };

  const handleSubsiteChange = (dayId, subsiteId) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], subsite_id: subsiteId }
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const formattedSchedule = {};
      Object.keys(schedule).forEach(day => {
        if (schedule[day] && schedule[day].site_id) {
          formattedSchedule[day] = schedule[day];
        }
      });

      const res = await apiCall('update_agent_schedules', {
        agent_id: agent.id,
        period: period,
        schedule: formattedSchedule,
        keeps: Object.keys(selectedKeeps).filter(k => selectedKeeps[k]),
        force_apply: showConflictModal // If modal is already shown, it means we are confirming
      });

      if (res && res.success) {
        if (res.has_conflicts && !showConflictModal) {
          setConflicts(res.conflicts);
          setShowConflictModal(true);
          setSaving(false);
        } else {
          onSuccess();
        }
      } else {
        alert("Erreur: " + (res?.message || "Inconnue"));
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde.");
      setSaving(false);
    }
  };

  const confirmConflicts = async () => {
    handleSubmit(); // Re-submit with selectedKeeps populated
  };

  if (loading) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 1000, position: 'fixed', inset: 0 }}>
        <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 1000, position: 'fixed', inset: 0 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1e293b', width: '95%', maxWidth: '800px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
        
        {!showConflictModal ? (
          <>
            <div style={{ padding: '4px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(249, 115, 22, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Programme de Semaine</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    Agent : <strong style={{ color: '#f97316' }}>{agent.name}</strong>
                  </p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '10px 15px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    Modifier le programme
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(false)} className="btn" style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                    Annuler l'édition
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {days.map(day => {
                  const currentSiteId = schedule[day.id]?.site_id || '';
                  const currentSubsiteId = schedule[day.id]?.subsite_id || '';
                  const siteObj = sites.find(s => String(s.id) === String(currentSiteId));
                  const subsites = siteObj?.subsites || [];

                  return (
                    <div
                      key={day.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                    >
                      <div style={{ width: '100px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>
                        {day.label}
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                        <SearchableSelect
                          options={flattenedOptions}
                          value={currentSiteId ? `${currentSiteId}::${currentSubsiteId}` : ''}
                          onChange={(val) => {
                            if (!val) {
                              setSchedule(prev => ({ ...prev, [day.id]: { site_id: '', subsite_id: '' } }));
                            } else {
                              const [s_id, sub_id] = val.split('::');
                              setSchedule(prev => ({ ...prev, [day.id]: { site_id: s_id, subsite_id: sub_id } }));
                            }
                          }}
                          placeholder="Sélectionnez la zone..."
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '4px 15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
              <button onClick={onClose} className="btn btn-secondary">Fermer</button>
              {isEditing && (
                <button onClick={handleSubmit} disabled={saving} className="btn" style={{ background: '#f97316', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving ? <RefreshCw size={16} className="spinning" /> : <Save size={16} />}
                  Enregistrer et Appliquer
                </button>
              )}
            </div>
          </>
        ) : (
          /* CONFLICT MODAL VIEW */
          <>
            <div style={{ padding: '4px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Conflits détectés</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    Des pointages existants ont été trouvés
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', lineHeight: '1.5' }}>
                Le système a détecté que l'agent <strong>{agent.name}</strong> a déjà été pointé sur certains jours ce mois-ci qui diffèrent du nouveau programme. <br/><br/>
                Veuillez sélectionner les jours que vous souhaitez <strong>conserver tels quels</strong>. Si vous ne sélectionnez rien, le système réinitialisera ces jours pour appliquer le nouveau programme.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conflicts.map(conflict => (
                  <label key={conflict.date} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <input 
                      type="checkbox" 
                      checked={!!selectedKeeps[conflict.date]}
                      onChange={(e) => setSelectedKeeps(prev => ({ ...prev, [conflict.date]: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#f97316' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{conflict.date_formatted}</div>
                      <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '4px' }}>
                        Pointage actuel : <strong>{conflict.current_status}</strong>
                      </div>
                      <div style={{ color: '#10b981', fontSize: '0.85rem' }}>
                        Nouveau programme : <strong>{conflict.new_status}</strong>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '4px 15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <button onClick={() => setShowConflictModal(false)} className="btn btn-secondary">Retour</button>
              <button onClick={confirmConflicts} disabled={saving} className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {saving ? <RefreshCw size={16} className="spinning" /> : <Save size={16} />}
                Confirmer l'application
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
