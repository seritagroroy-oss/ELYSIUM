import React, { useState } from 'react';
import { Route, Clock, CheckCircle2, MapPin, AlertCircle, Calendar, Users, Eye } from 'lucide-react';

export default function CtrlFeuille() {
  const [visits, setVisits] = useState([
    { id: 1, site: 'Siège Social Cocody', address: 'Boulevard de France, Abidjan', scheduled: '08:30', actual: '08:42', visited: true, agents: 4, comment: 'Relève effectuée à l\'heure. Tenue correcte.' },
    { id: 2, site: 'Entrepôt Vridi', address: 'Zone Portuaire, Rue des Gaz', scheduled: '10:45', actual: null, visited: false, agents: 8, comment: '' },
    { id: 3, site: 'Zone Industrielle Yopougon', address: 'Extension 2e Tranche', scheduled: '14:00', actual: null, visited: false, agents: 12, comment: '' },
    { id: 4, site: 'Centre Commercial Marcory', address: 'Avenue de la Paix', scheduled: '16:30', actual: null, visited: false, agents: 6, comment: '' }
  ]);

  const [filter, setFilter] = useState('all');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [tempComment, setTempComment] = useState('');

  const handleVisit = (id) => {
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setVisits(visits.map(v => v.id === id ? { ...v, visited: true, actual: timeNow, comment: v.comment || 'Contrôle effectué sans anomalie majeure.' } : v));
  };

  const saveComment = (id) => {
    setVisits(visits.map(v => v.id === id ? { ...v, comment: tempComment } : v));
    setSelectedVisit(null);
  };

  const openCommentModal = (visit) => {
    setSelectedVisit(visit);
    setTempComment(visit.comment);
  };

  const visitedCount = visits.filter(v => v.visited).length;
  const totalCount = visits.length;
  const progressPercent = Math.round((visitedCount / totalCount) * 100);

  const filteredVisits = visits.filter(v => {
    if (filter === 'visited') return v.visited;
    if (filter === 'pending') return !v.visited;
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', mdDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
            <Route size={28} /> Feuille de Route
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Planning de patrouille terrain et suivi des inspections journalières.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          <Calendar size={18} color="#818cf8" />
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
            Aujourd'hui : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Progress Bar & KPI */}
      <div style={{ background: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#cbd5e1' }}>Progression de la tournée</span>
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#818cf8' }}>{progressPercent}% ({visitedCount}/{totalCount} sites)</span>
        </div>
        <div style={{ width: '100%', height: '12px', backgroundColor: '#1f2937', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', borderRadius: '6px', transition: 'width 0.4s ease-out' }}></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'pending', 'visited'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === f ? '1px solid #818cf8' : '1px solid #1f2937',
              backgroundColor: filter === f ? 'rgba(99, 102, 241, 0.15)' : '#111827',
              color: filter === f ? '#a5b4fc' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {f === 'all' ? 'Tous' : f === 'pending' ? 'À visiter' : 'Visités'}
          </button>
        ))}
      </div>

      {/* Route List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredVisits.map((visit) => (
          <div
            key={visit.id}
            style={{
              backgroundColor: '#111827',
              border: visit.visited ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Left status color bar */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: visit.visited ? '#10b981' : '#6366f1'
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {visit.site}
                  {visit.visited && (
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      Visité
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <MapPin size={14} color="#818cf8" />
                  <span>{visit.address}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', backgroundColor: '#1f2937', padding: '6px 12px', borderRadius: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                    <Clock size={14} color="#a855f7" /> Prévu: <strong>{visit.scheduled}</strong>
                  </span>
                  {visit.visited && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                      <CheckCircle2 size={14} /> Fait à: <strong>{visit.actual}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visit Details */}
            <div style={{ borderTop: '1px solid #1f2937', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} color="#818cf8" /> {visit.agents} agents à auditer
                </span>
                {visit.comment && (
                  <span style={{ fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Note: "{visit.comment}"
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {visit.visited && (
                  <button
                    onClick={() => openCommentModal(visit)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #1f2937',
                      backgroundColor: '#1f2937',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <Eye size={14} /> {visit.comment ? 'Modifier Note' : 'Ajouter Note'}
                  </button>
                )}
                {!visit.visited && (
                  <button
                    onClick={() => handleVisit(visit.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#6366f1',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Valider le Passage
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredVisits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '1rem' }}>Aucune visite enregistrée pour ce filtre.</p>
          </div>
        )}
      </div>

      {/* Modal simulation for comment */}
      {selectedVisit && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
              Note de contrôle : {selectedVisit.site}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Enregistrez vos observations sur les postes, le personnel ou les équipements de ce site.
            </p>
            <textarea
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              placeholder="Ex: Prise de service OK. Tous les agents portent leurs EPI réglementaires."
              style={{
                width: '100%',
                height: '100px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                resize: 'none',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedVisit(null)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => saveComment(selectedVisit.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
