import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Loader2, Plus, Clock, Filter } from 'lucide-react';
import { apiCall } from '../../api';

export default function SupplementairesArchiveModal({ period, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall('get_supplementaires_archive', { period }, 'GET');
        if (res.success) {
          setData(res.supplementaires || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const filteredData = data.filter(s => 
    s.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.shift_label?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = data.reduce((sum, s) => sum + (parseFloat(s.montant_gagne) || 0), 0);

  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dStr) => {
    if (!dStr) return '-';
    const parts = dStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ 
          position: 'relative', 
          width: '900px', 
          maxWidth: '95vw', 
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(56, 189, 248, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '12px', borderRadius: '16px', color: '#38bdf8' }}>
              <Plus size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>
                Archives des Supplémentaires
              </h2>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} /> Période : <strong style={{ color: '#e2e8f0' }}>{period}</strong>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#38bdf8', fontSize: '1.6rem', fontWeight: 900 }}>
                {formatMoney(totalAmount)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total des gains
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Rechercher un agent, un site..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px 14px 48px', 
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px', color: 'white', fontSize: '0.95rem',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(56, 189, 248, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Filter size={16} /> <strong>{filteredData.length}</strong> supplémentaires
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détail (Type & Site)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gains (F CFA)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>
                      <Loader2 size={32} className="lucide-spin" style={{ color: '#38bdf8', margin: '0 auto 16px' }} />
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chargement des archives...</div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>
                      <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Clock size={24} style={{ color: '#475569' }} />
                      </div>
                      <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Aucun supplémentaire trouvé</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Il n'y a pas d'heures supplémentaires enregistrées pour cette recherche.</div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 24px', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 500 }}>
                        {formatDate(row.date_supp)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600 }}>{row.agent_name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>ID: {row.agent_id?.split('_').pop()}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          {row.shift_label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', color: '#22c55e', fontSize: '1.05rem', fontWeight: 800 }}>
                        +{formatMoney(row.montant_gagne)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
