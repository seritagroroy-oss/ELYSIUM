import React, { useState, useEffect, useRef } from 'react';
import { Package, Bell, Search, Plus, CheckCircle2, Clock, Loader2, X, User, Printer, Download } from 'lucide-react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';

const TYPES_COLIS = ['Courrier', 'Colis Standard', 'Colis Fragile', 'Pli Confidentiel', 'Document Officiel', 'Recommandé'];

export default function PointageCourriers() {
  const { user } = useAuth();
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ destinataire: '', type: 'Colis Standard', expediteur: '', description: '', urgence: false });
  const [notifSent, setNotifSent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes] = await Promise.all([
        apiCall('get_all_agents', {}, 'GET'),
      ]);
      if (agentsRes?.success && agentsRes.agents) {
        setAgents(agentsRes.agents.map(a => ({ id: a.id, name: a.name })));
      } else {
        setAgents([{ id: 1, name: 'Konan Aya' }, { id: 2, name: 'Bamba Seydou' }, { id: 3, name: 'Yao Emmanuel' }]);
      }
    } catch(e) {}
    // Load from local state for demo
    setCourriers([
      { id: 1, destinataire: 'Konan Aya', type: 'Recommandé', expediteur: 'Direction Générale CI', description: 'Convocation réunion annuelle', heure_arrivee: new Date(Date.now() - 5400000).toISOString(), statut: 'remis', heure_remise: new Date(Date.now() - 1800000).toISOString(), urgence: false },
      { id: 2, destinataire: 'Bamba Seydou', type: 'Colis Standard', expediteur: 'Bureau Équipements Ouest', description: 'Radios et PTI', heure_arrivee: new Date(Date.now() - 900000).toISOString(), statut: 'en_attente', heure_remise: null, urgence: true },
    ]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCourrier = {
      id: Date.now(),
      ...form,
      heure_arrivee: new Date().toISOString(),
      statut: 'en_attente',
      heure_remise: null,
      enregistre_par: user?.name || 'Secrétariat',
    };
    setCourriers([newCourrier, ...courriers]);
    setShowModal(false);
    setForm({ destinataire: '', type: 'Colis Standard', expediteur: '', description: '', urgence: false });
    // Simulate notification
    setNotifSent(form.destinataire);
    setTimeout(() => setNotifSent(null), 5000);
  };

  const handleConfirmRemise = (id) => {
    setCourriers(prev => prev.map(c => c.id === id ? { ...c, statut: 'remis', heure_remise: new Date().toISOString() } : c));
  };

  const filtered = courriers.filter(c => {
    if (filterStatus === 'pending' && c.statut !== 'en_attente') return false;
    if (filterStatus === 'done' && c.statut !== 'remis') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.destinataire.toLowerCase().includes(q) || c.expediteur.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={28} color="#a78bfa" /> Courriers & Colis
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Enregistrement des arrivées et notifications aux destinataires.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#a78bfa', color: '#0f172a', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(167,139,250,0.3)' }}
        >
          <Plus size={20} /> Nouveau Colis / Courrier
        </button>
      </div>

      {/* Notification Banner */}
      {notifSent && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={18} color="#10b981" />
          <span style={{ color: '#10b981', fontWeight: 600 }}>Notification envoyée à <strong>{notifSent}</strong> pour l'informer de l'arrivée de son colis !</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'En Attente', value: courriers.filter(c => c.statut === 'en_attente').length, color: '#f59e0b' },
          { label: 'Remis', value: courriers.filter(c => c.statut === 'remis').length, color: '#10b981' },
          { label: 'Total Aujourd\'hui', value: courriers.filter(c => new Date(c.heure_arrivee).toDateString() === new Date().toDateString()).length, color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel" style={{ padding: '20px', borderLeft: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '2rem', fontWeight: 800, color }}>{value}</h2>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[['pending', '📦 En Attente'], ['done', '✅ Remis'], ['all', 'Tous']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${filterStatus === val ? 'var(--b)' : 'var(--border)'}`, background: filterStatus === val ? 'rgba(56,189,248,0.15)' : 'transparent', color: filterStatus === val ? 'white' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>
            {lbl}
          </button>
        ))}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Rechercher par destinataire ou expéditeur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 9px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color="var(--b)" /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Type & Expéditeur</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Destinataire</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Arrivée</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--muted)' }}>Aucun courrier trouvé.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {c.urgence && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>URGENT</span>}
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>{c.type}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>De : {c.expediteur}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="var(--muted)" />
                      <span style={{ fontWeight: 600, color: 'white' }}>{c.destinataire}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {new Date(c.heure_arrivee).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {c.statut === 'en_attente' ? (
                      <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>⏳ En attente</span>
                    ) : (
                      <div>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>✓ Remis</span>
                        {c.heure_remise && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{new Date(c.heure_remise).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {c.statut === 'en_attente' && (
                      <button onClick={() => handleConfirmRemise(c.id)}
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                      >
                        <CheckCircle2 size={15} /> Confirmer la remise
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '560px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={22} color="#a78bfa" /> Enregistrer une arrivée</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type de courrier</label>
                <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES_COLIS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Destinataire <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="form-input" required value={form.destinataire} onChange={e => setForm({ ...form, destinataire: e.target.value })}>
                  <option value="">-- Choisir le destinataire --</option>
                  {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expéditeur</label>
                <input type="text" className="form-input" placeholder="Nom de l'expéditeur ou de l'organisme" value={form.expediteur} onChange={e => setForm({ ...form, expediteur: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description / Objet</label>
                <input type="text" className="form-input" placeholder="Brève description du contenu" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', background: form.urgence ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.urgence ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
                <input type="checkbox" checked={form.urgence} onChange={e => setForm({ ...form, urgence: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#ef4444' }} />
                <div>
                  <div style={{ fontWeight: 700, color: form.urgence ? '#ef4444' : 'white' }}>🚨 Marquer comme URGENT</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Le destinataire sera notifié en priorité.</div>
                </div>
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontWeight: 700 }}>
                  <Bell size={16} /> Enregistrer & Notifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
