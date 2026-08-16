import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, X, Clock, Users, ChevronLeft, ChevronRight, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

const SALLES = [
  { id: 'salle_a', name: 'Salle A – Conférence', capacite: 20, color: '#3b82f6' },
  { id: 'salle_b', name: 'Salle B – Réunion', capacite: 10, color: '#8b5cf6' },
  { id: 'salle_c', name: 'Salle C – Formation', capacite: 30, color: '#10b981' },
  { id: 'bureau_dir', name: 'Bureau Directeur', capacite: 6, color: '#f59e0b' },
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h à 18h

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export default function GestionSalles() {
  const { user } = useAuth();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([
    { id: 1, salle_id: 'salle_a', titre: 'Réunion Bilan Mensuel', organisateur: 'Konan Aya', participants: 12, date: today.toISOString().slice(0, 10), debut: '09:00', fin: '11:00' },
    { id: 2, salle_id: 'salle_b', titre: 'Entretien Candidat', organisateur: 'Secrétariat', participants: 2, date: today.toISOString().slice(0, 10), debut: '14:00', fin: '15:00' },
    { id: 3, salle_id: 'salle_c', titre: 'Formation Sécurité', organisateur: 'Bamba Seydou', participants: 25, date: today.toISOString().slice(0, 10), debut: '08:30', fin: '12:00' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [form, setForm] = useState({ titre: '', organisateur: user?.name || '', participants: 1, debut: '09:00', fin: '10:00' });
  const [conflict, setConflict] = useState(false);
  const [activeView, setActiveView] = useState('calendar'); // calendar | list

  const dateStr = currentDate.toISOString().slice(0, 10);

  const dayReservations = reservations.filter(r => r.date === dateStr);

  const hasConflict = (salleId, debut, fin, excludeId = null) => {
    const start = timeToMinutes(debut);
    const end = timeToMinutes(fin);
    return dayReservations.some(r => {
      if (r.id === excludeId || r.salle_id !== salleId) return false;
      const rs = timeToMinutes(r.debut);
      const re = timeToMinutes(r.fin);
      return !(end <= rs || start >= re);
    });
  };

  const handleCellClick = (salleId, hour) => {
    const debut = `${String(hour).padStart(2, '0')}:00`;
    const fin = minutesToTime(timeToMinutes(debut) + parseInt(localStorage.getItem('pontage_sec_room_duration') || '60'));
    setSelectedSalle(salleId);
    setSelectedHour(hour);
    setForm(f => ({ ...f, debut, fin }));
    setConflict(hasConflict(salleId, debut, fin));
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasConflict(selectedSalle, form.debut, form.fin)) { setConflict(true); return; }
    const newRes = {
      id: Date.now(),
      salle_id: selectedSalle,
      ...form,
      participants: parseInt(form.participants),
      date: dateStr,
    };
    setReservations([...reservations, newRes]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const goDay = (delta) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  };

  const isToday = currentDate.toDateString() === today.toDateString();

  const getReservationForCell = (salleId, hour) => {
    return dayReservations.find(r => {
      const start = timeToMinutes(r.debut);
      const end = timeToMinutes(r.fin);
      const cellStart = hour * 60;
      const cellEnd = cellStart + 60;
      return r.salle_id === salleId && start < cellEnd && end > cellStart;
    });
  };

  const isStartHour = (r, hour) => timeToMinutes(r.debut) >= hour * 60 && timeToMinutes(r.debut) < (hour + 1) * 60;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={28} color="#fcd34d" /> Gestion des Salles
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Réservation et gestion des salles de réunion.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['calendar', 'list'].map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              style={{ padding: '9px 18px', borderRadius: '8px', border: `1px solid ${activeView === v ? 'var(--b)' : 'var(--border)'}`, background: activeView === v ? 'rgba(56,189,248,0.15)' : 'transparent', color: activeView === v ? 'white' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
              {v === 'calendar' ? '📅 Grille' : '📋 Liste'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', marginBottom: '24px' }}>
        <button onClick={() => goDay(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {isToday && <span style={{ background: 'rgba(56,189,248,0.2)', color: 'var(--b)', fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>Aujourd'hui</span>}
        </div>
        <button onClick={() => goDay(1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Salles Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {SALLES.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({s.capacite} pers.)</span>
          </div>
        ))}
      </div>

      {activeView === 'calendar' ? (
        /* Grille Calendrier */
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', width: '80px', borderRight: '1px solid var(--border)' }}>Heure</th>
                {SALLES.map(s => (
                  <th key={s.id} style={{ padding: '12px 10px', textAlign: 'center', color: s.color, fontSize: '0.8rem', fontWeight: 700, borderRight: '1px solid var(--border)' }}>
                    {s.name.split('–')[0].trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '6px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 700, verticalAlign: 'top', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {String(hour).padStart(2, '0')}:00
                  </td>
                  {SALLES.map(salle => {
                    const reservation = getReservationForCell(salle.id, hour);
                    const isStart = reservation && isStartHour(reservation, hour);
                    return (
                      <td key={salle.id} style={{ padding: '4px', borderRight: '1px solid var(--border)', verticalAlign: 'top', minWidth: '140px', height: '50px', cursor: reservation ? 'default' : 'pointer' }}
                        onClick={() => !reservation && handleCellClick(salle.id, hour)}>
                        {reservation && isStart ? (
                          <div style={{ background: `${salle.color}25`, border: `1px solid ${salle.color}60`, borderRadius: '6px', padding: '6px 8px', fontSize: '0.78rem', position: 'relative' }}>
                            <div style={{ fontWeight: 700, color: salle.color, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reservation.titre}</div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{reservation.debut}–{reservation.fin}</div>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(reservation.id); }}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ) : !reservation ? (
                          <div style={{ height: '100%', borderRadius: '6px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = `${salle.color}10`}
                            onMouseLeave={e => e.currentTarget.style.background = ''} />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', padding: '12px', fontStyle: 'italic' }}>
            💡 Cliquez sur une case libre pour créer une réservation.
          </p>
        </div>
      ) : (
        /* Vue Liste */
        <div className="glass-panel">
          {dayReservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
              <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
              Aucune réservation pour ce jour.
            </div>
          ) : dayReservations.sort((a,b) => a.debut.localeCompare(b.debut)).map(r => {
            const salle = SALLES.find(s => s.id === r.salle_id);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '4px', height: '50px', borderRadius: '4px', background: salle?.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.titre}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                    {salle?.name} · {r.debut} → {r.fin} · {r.participants} participants · Organisateur : {r.organisateur}
                  </div>
                </div>
                <button onClick={() => handleDelete(r.id)}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600 }}>
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={20} color="#fcd34d" />
                {SALLES.find(s => s.id === selectedSalle)?.name}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {conflict && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} color="#ef4444" />
                <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Conflit détecté ! Cette salle est déjà réservée sur ce créneau.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Objet de la réunion *</label>
                <input type="text" required className="form-input" value={form.titre} onChange={e => { setForm({...form, titre: e.target.value}); setConflict(false); }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Organisateur</label>
                <input type="text" className="form-input" value={form.organisateur} onChange={e => setForm({...form, organisateur: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Début</label>
                  <input type="time" className="form-input" value={form.debut} onChange={e => { setForm({...form, debut: e.target.value}); setConflict(false); }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fin</label>
                  <input type="time" className="form-input" value={form.fin} onChange={e => { setForm({...form, fin: e.target.value}); setConflict(false); }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Participants</label>
                  <input type="number" className="form-input" min="1" max={SALLES.find(s => s.id === selectedSalle)?.capacite} value={form.participants} onChange={e => setForm({...form, participants: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: 700 }}><CheckCircle size={16} /> Réserver la salle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
