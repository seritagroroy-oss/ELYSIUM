import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Fingerprint, CheckCircle, XCircle, Clock, Loader2, Users, ShieldCheck, ShieldX, RefreshCw } from 'lucide-react';

export default function PortalAdminView() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_portal_registrations', {}, 'GET');
      if (res.success && Array.isArray(res.registrations)) {
        setRegistrations(res.registrations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRegistrations(); }, []);

  const handleValidate = async (userId, status) => {
    const label = status === 'approved' ? 'valider' : 'refuser';
    if (!confirm(`Êtes-vous sûr de vouloir ${label} cet accès ?`)) return;
    try {
      const res = await apiCall('update_portal_registration', { user_id: userId, status });
      if (res.success) {
        alert(status === 'approved' ? 'Accès validé avec succès !' : 'Accès refusé.');
        loadRegistrations();
      } else {
        alert(res.message || 'Erreur');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = registrations.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  const statusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)', text: '⏳ En attente' },
      approved: { bg: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: 'rgba(52, 211, 153, 0.3)', text: '✅ Validé' },
      rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', text: '❌ Refusé' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700
      }}>{s.text}</span>
    );
  };

  return (
    <div style={{ animation: 'slideUp 0.3s ease-out' }}>
      {/* En-tête */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #34d399, #38bdf8)',
              width: 56, height: 56, borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(52, 211, 153, 0.3)'
            }}>
              <Fingerprint size={28} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Validations Portail Agent</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Gérez les demandes d'accès des agents au portail self-service
              </p>
            </div>
          </div>
          <button onClick={loadRegistrations} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: registrations.length, icon: <Users size={20} />, color: '#38bdf8', filterVal: 'all' },
          { label: 'En attente', value: pendingCount, icon: <Clock size={20} />, color: '#fbbf24', filterVal: 'pending' },
          { label: 'Validés', value: approvedCount, icon: <ShieldCheck size={20} />, color: '#34d399', filterVal: 'approved' },
          { label: 'Refusés', value: rejectedCount, icon: <ShieldX size={20} />, color: '#ef4444', filterVal: 'rejected' },
        ].map((kpi, i) => (
          <div key={i}
            onClick={() => setFilter(kpi.filterVal)}
            className="glass-panel"
            style={{
              padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
              cursor: 'pointer', transition: 'all 0.2s',
              border: filter === kpi.filterVal ? `2px solid ${kpi.color}` : '1px solid var(--border)',
              transform: filter === kpi.filterVal ? 'scale(1.02)' : 'scale(1)'
            }}>
            <div style={{ background: `${kpi.color}15`, color: kpi.color, borderRadius: '12px', padding: '12px', display: 'flex' }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lien du portail */}
      <div className="glass-panel" style={{
        marginBottom: '24px', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Lien du portail à envoyer à vos agents :</div>
          <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1.1rem', marginTop: '4px', fontFamily: 'monospace' }}>
            {window.location.origin}/portail-agent
          </div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/portail-agent`);
            alert('Lien copié dans le presse-papier !');
          }}
          className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          📋 Copier le lien
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--a)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <Fingerprint size={48} style={{ color: 'var(--muted)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--muted)', fontWeight: 600 }}>Aucune demande {filter !== 'all' ? `(${filter})` : ''}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Lorsque des agents s'inscriront via le portail, leurs demandes apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="glass-panel">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Matricule / ID</th>
                  <th>Téléphone</th>
                  <th>Date de demande</th>
                  <th style={{ textAlign: 'center' }}>Statut</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, idx) => (
                  <tr key={reg.id || idx} style={{
                    animation: `slideUp 0.3s ease-out ${idx * 0.05}s both`
                  }}>
                    <td style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                      {reg.name}
                      {reg.dob && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'normal', marginTop: '2px' }}>
                          📅 Né(e) le : {reg.dob}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>{reg.matricule || reg.agent_id?.substring(0, 12)}</td>
                    <td>{reg.phone || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{reg.created_at}</td>
                    <td style={{ textAlign: 'center' }}>{statusBadge(reg.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {reg.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleValidate(reg.id, 'approved')}
                            style={{
                              background: 'rgba(52, 211, 153, 0.15)', color: '#34d399',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                              fontWeight: 700, fontSize: '0.85rem',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.3)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            <CheckCircle size={16} /> Valider
                          </button>
                          <button
                            onClick={() => handleValidate(reg.id, 'rejected')}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                              fontWeight: 700, fontSize: '0.85rem',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                          >
                            <XCircle size={16} /> Refuser
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
