import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle2, Banknote, Users, FileText, Target } from 'lucide-react';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const AGENDA_EVENTS = [
  { date: '2026-06-07', type: 'payroll', label: 'Validation Paie — Mai 2026', icon: '💰', color: '#22c55e', time: '09:00' },
  { date: '2026-06-09', type: 'okr', label: 'Point OKR Trimestriel — Tous Départements', icon: '🎯', color: '#f97316', time: '14:00' },
  { date: '2026-06-12', type: 'contract', label: '5 CDD expirent (Action RH requise)', icon: '📋', color: '#ef4444', time: 'Toute la journée' },
  { date: '2026-06-15', type: 'meeting', label: 'Réunion CODIR — Bilan S1', icon: '🤝', color: '#3b82f6', time: '10:00' },
  { date: '2026-06-20', type: 'payroll', label: 'Clôture Calcul Salaires — Juin 2026', icon: '🧮', color: '#22c55e', time: '17:00' },
  { date: '2026-06-25', type: 'report', label: 'Rapport Stratégique Trimestriel', icon: '📑', color: '#8b5cf6', time: '12:00' },
  { date: '2026-06-30', type: 'okr', label: 'Fin Q2 — Évaluation objectifs RH', icon: '🏁', color: '#f97316', time: 'Toute la journée' },
  { date: '2026-07-05', type: 'meeting', label: 'Réunion Actionnaires — Résultats H1', icon: '👔', color: '#eab308', time: '09:30' },
];

const TYPE_LABELS = {
  payroll: { label: 'Paie & Finance', color: '#22c55e' },
  okr: { label: 'Objectifs', color: '#f97316' },
  contract: { label: 'Contrats', color: '#ef4444' },
  meeting: { label: 'Réunion', color: '#3b82f6' },
  report: { label: 'Rapport', color: '#8b5cf6' },
};

export default function DGAgenda() {
  const today = new Date(2026, 5, 7);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  // Adjust so week starts on Monday
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const getEventsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return AGENDA_EVENTS.filter(e => e.date === dateStr);
  };

  const upcomingEvents = AGENDA_EVENTS
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const goMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#38bdf8' }}>
            <CalendarDays size={32} /> Agenda Stratégique
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Vue unifiée de vos échéances stratégiques — paie, OKR, contrats et réunions de direction.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Calendar */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={() => goMonth(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>{MONTHS[currentMonth]} {currentYear}</h2>
            <button onClick={() => goMonth(1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: '600', padding: '4px' }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
              const isToday = isValid && dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const events = isValid ? getEventsForDay(dayNum) : [];

              return (
                <div key={i} style={{ minHeight: '70px', padding: '6px', borderRadius: '8px', background: isToday ? 'rgba(56,189,248,0.15)' : events.length > 0 ? 'rgba(255,255,255,0.03)' : 'transparent', border: isToday ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent', opacity: isValid ? 1 : 0.2 }}>
                  {isValid && (
                    <>
                      <div style={{ color: isToday ? '#38bdf8' : 'white', fontWeight: isToday ? 'bold' : 'normal', fontSize: '0.9rem', marginBottom: '4px' }}>{dayNum}</div>
                      {events.map((ev, ei) => (
                        <div key={ei} style={{ background: `${ev.color}20`, borderLeft: `3px solid ${ev.color}`, padding: '2px 4px', borderRadius: '3px', fontSize: '0.7rem', color: 'white', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.icon} {ev.label}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#38bdf8" /> Prochaines Échéances
            </h3>
            {upcomingEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < upcomingEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{ev.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem', marginBottom: '4px' }}>{ev.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{ev.date.slice(8, 10)}/{ev.date.slice(5, 7)}/{ev.date.slice(0, 4)} — {ev.time}</div>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: '6px' }} />
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '1rem' }}>Légende</h3>
            {Object.entries(TYPE_LABELS).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: val.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
