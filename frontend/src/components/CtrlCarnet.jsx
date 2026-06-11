import React, { useState } from 'react';
import { BookOpen, Calendar, ShieldCheck, AlertCircle, BarChart, Plus, CheckCircle, Search, Clock } from 'lucide-react';

export default function CtrlCarnet() {
  const [stats] = useState({
    visitsThisMonth: 84,
    agentsAuditedThisMonth: 312,
    incidentsReportedThisMonth: 7,
    satisfactionRate: 98
  });

  const [entries, setEntries] = useState([
    { id: 1, date: '07 Juin 2026', time: '08:42', site: 'Siège Social Cocody', type: 'Contrôle Routine', status: 'conforme', description: 'Ronde effectuée. Tout le personnel de sécurité est présent à son poste en tenue réglementaire. RAS.' },
    { id: 2, date: '06 Juin 2026', time: '14:30', site: 'Centre Commercial Marcory', type: 'Contrôle Routine', status: 'conforme', description: 'Visite impromptue. Agents alertes. Registre des visiteurs tenu à jour.' },
    { id: 3, date: '05 Juin 2026', time: '11:15', site: 'Entrepôt Vridi', type: 'Audit Spécifique', status: 'anomalie', description: 'Pointage de 11h. Agent Diallo Yacouba absent sans motif valable. Remplacé par agent de réserve à 11h45.' },
    { id: 4, date: '04 Juin 2026', time: '16:00', site: 'Zone Industrielle Yopougon', type: 'Incident', status: 'incident', description: 'Défaillance signalée de la caméra thermique Nord. Transmis au service technique et PC.' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    site: 'Siège Social Cocody',
    type: 'Contrôle Routine',
    status: 'conforme',
    description: ''
  });

  const handleAddEntry = (e) => {
    e.preventDefault();
    const dateNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const entry = {
      id: Date.now(),
      date: dateNow,
      time: timeNow,
      ...newEntry
    };

    setEntries([entry, ...entries]);
    setShowAddModal(false);
    setNewEntry({
      site: 'Siège Social Cocody',
      type: 'Contrôle Routine',
      status: 'conforme',
      description: ''
    });
  };

  const filteredEntries = entries.filter(e => 
    e.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
            <BookOpen size={28} /> Carnet de Bord du Contrôleur
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Journal personnel d'inspection, historique de vos constatations et statistiques de performance.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
          }}
        >
          <Plus size={18} /> Nouvelle Entrée
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{stats.visitsThisMonth}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Visites ce mois</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{stats.agentsAuditedThisMonth}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Agents audités</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{stats.incidentsReportedThisMonth}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Incidents signalés</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>{stats.satisfactionRate}%</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Conformité zone</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans le carnet de bord (site, type, mot-clé...)"
          style={{
            width: '100%',
            padding: '12px 16px 12px 48px',
            borderRadius: '8px',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Timeline entries list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredEntries.map((entry) => (
          <div key={entry.id} style={{ display: 'flex', gap: '20px' }}>
            
            {/* Timeline date bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1' }}>{entry.date}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                <Clock size={12} /> {entry.time}
              </span>
              <div style={{ width: '2px', flex: 1, backgroundColor: '#1f2937', marginTop: '8px' }}></div>
            </div>

            {/* Timeline Card */}
            <div style={{ 
              flex: 1, 
              backgroundColor: '#111827', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '20px',
              position: 'relative'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '700', color: 'white' }}>{entry.site}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', backgroundColor: '#1f2937', padding: '2px 8px', borderRadius: '4px' }}>
                    {entry.type}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: entry.status === 'conforme' ? '#10b981' : (entry.status === 'anomalie' ? '#f59e0b' : '#ef4444'),
                  backgroundColor: entry.status === 'conforme' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  {entry.status}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                {entry.description}
              </p>

            </div>

          </div>
        ))}
      </div>

      {/* Add Entry Modal simulation */}
      {showAddModal && (
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>
              Ajouter une note au Carnet de Bord
            </h3>
            
            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
                  Site inspecté
                </label>
                <select
                  value={newEntry.site}
                  onChange={(e) => setNewEntry({ ...newEntry, site: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }}
                >
                  <option value="Siège Social Cocody">Siège Social Cocody</option>
                  <option value="Entrepôt Vridi">Entrepôt Vridi</option>
                  <option value="Zone Industrielle Yopougon">Zone Industrielle Yopougon</option>
                  <option value="Centre Commercial Marcory">Centre Commercial Marcory</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
                    Type d'Activité
                  </label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }}
                  >
                    <option value="Contrôle Routine">Contrôle Routine</option>
                    <option value="Audit Spécifique">Audit Spécifique</option>
                    <option value="Incident">Incident</option>
                    <option value="Réunion Site">Réunion Site</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
                    Statut Global
                  </label>
                  <select
                    value={newEntry.status}
                    onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }}
                  >
                    <option value="conforme">Conforme</option>
                    <option value="anomalie">Anomalie</option>
                    <option value="incident">Incident Majeur</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600' }}>
                  Observations & Compte Rendu
                </label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  required
                  placeholder="Saisissez vos notes personnelles ou constats pour cette visite..."
                  style={{
                    width: '100%',
                    height: '100px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '10px',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  Ajouter au Carnet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
