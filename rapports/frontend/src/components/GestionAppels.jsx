import React, { useState, useEffect } from 'react';
import { Phone, Search, Bell, CheckCircle2, User, PhoneCall, Clock, MessageSquare, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function GestionAppels() {
  const { user } = useAuth();
  const [appels, setAppels] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ appelant: '', societe: '', destinataire: '', message: '', urgent: false });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Mock data
    setAppels([
      { id: 1, appelant: 'M. Roy', societe: 'Orange CI', destinataire: 'Konan Aya', message: 'Rappel concernant le contrat fibre.', date: new Date(Date.now() - 3600000).toISOString(), urgent: true, traite: false },
      { id: 2, appelant: 'Mme Traoré', societe: '', destinataire: 'Bamba Seydou', message: 'Confirme le rendez-vous de demain.', date: new Date(Date.now() - 7200000).toISOString(), urgent: false, traite: true }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppel = {
      ...form,
      id: Date.now(),
      date: new Date().toISOString(),
      traite: false
    };
    setAppels([newAppel, ...appels]);
    setShowModal(false);
    setForm({ appelant: '', societe: '', destinataire: '', message: '', urgent: false });
    // In a real app, this would trigger an internal notification/email to the destinataire
  };

  const markAsDone = (id) => {
    setAppels(appels.map(a => a.id === id ? { ...a, traite: true } : a));
  };

  const filtered = appels.filter(a => {
    if (filter === 'pending' && a.traite) return false;
    if (filter === 'urgent' && !a.urgent) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.appelant.toLowerCase().includes(q) || a.destinataire.toLowerCase().includes(q) || a.societe.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PhoneCall size={28} color="#10b981" /> Main Courante & Appels
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Enregistrement des appels entrants et transmission des messages.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#10b981', color: '#0f172a', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
          <Plus size={20} /> Nouvel Appel
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[['all', 'Tous les appels'], ['pending', 'Non traités'], ['urgent', '🚨 Urgents']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${filter === val ? 'var(--b)' : 'var(--border)'}`, background: filter === val ? 'rgba(56,189,248,0.15)' : 'transparent', color: filter === val ? 'white' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
            {lbl}
          </button>
        ))}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '9px 9px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <Phone size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>Aucun appel trouvé.</p>
          </div>
        ) : filtered.map(a => (
          <div key={a.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: `4px solid ${a.traite ? '#64748b' : a.urgent ? '#ef4444' : '#10b981'}` }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: a.traite ? 'rgba(100,116,139,0.1)' : a.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PhoneCall size={24} color={a.traite ? '#64748b' : a.urgent ? '#ef4444' : '#10b981'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{a.appelant} {a.societe && <span style={{ color: 'var(--muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>({a.societe})</span>}</h3>
                {a.urgent && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> URGENT</span>}
                {a.traite && <span style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>Traité</span>}
              </div>
              <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '0.95rem' }}><MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: 'var(--muted)' }} /> "{a.message}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Pour : <strong style={{ color: '#38bdf8' }}>{a.destinataire}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            {!a.traite && (
              <button onClick={() => markAsDone(a.id)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', flexShrink: 0 }}>
                <CheckCircle2 size={18} /> Marquer Traité
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}><PhoneCall size={22} color="#10b981" /> Enregistrer un appel</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Appelant *</label>
                <input type="text" required className="form-input" value={form.appelant} onChange={e => setForm({ ...form, appelant: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Société (optionnel)</label>
                <input type="text" className="form-input" value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pour qui ? (Destinataire) *</label>
                <input type="text" required className="form-input" placeholder="Nom du collaborateur" value={form.destinataire} onChange={e => setForm({ ...form, destinataire: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Message *</label>
                <textarea required className="form-input" rows="3" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: form.urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${form.urgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}` }}>
                <input type="checkbox" checked={form.urgent} onChange={e => setForm({ ...form, urgent: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
                <span style={{ fontWeight: 600, color: form.urgent ? '#ef4444' : 'white' }}>Marquer comme URGENT (Notifie immédiatement le collaborateur)</span>
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, background: '#10b981', color: '#0f172a', fontWeight: 'bold' }}><Bell size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Enregistrer & Notifier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
