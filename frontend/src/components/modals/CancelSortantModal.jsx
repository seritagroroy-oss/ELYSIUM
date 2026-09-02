import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiCall } from '../../api';
const CancelSortantModal = ({ cancelSortantModalData, setCancelSortantModalData, period, setSiteData, loadSiteData }) => {
  const [loading, setLoading] = useState(false);

  if (!cancelSortantModalData) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={() => setCancelSortantModalData(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '20px', padding: '36px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(244,63,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)', animation: 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#f43f5e', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
          <span style={{ fontSize: '1.6rem' }}>⚠️</span> Annulation de la sortie
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 25px 0' }}>
          Voulez-vous annuler la sortie de l'agent <strong style={{ color: '#fff' }}>{cancelSortantModalData.name}</strong> et restaurer ses pointages ?
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onClick={() => setCancelSortantModalData(null)}
          >
            Annuler
          </button>
          <button
            disabled={loading}
            style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(to right, #e11d48, #be123c)', border: 'none', borderRadius: '12px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(244,63,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244,63,94,0.5)'; } }}
            onMouseOut={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(244,63,94,0.4)'; } }}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await apiCall('delete_agent_sortant', { agent_id: cancelSortantModalData.id, period });
                if (res.success) {
                  if (setSiteData) {
                    setSiteData(prevData => prevData.map(subsite => ({
                      ...subsite,
                      agents: subsite.agents.map(agent => {
                        if (String(agent.id) === String(cancelSortantModalData.id)) {
                          return { ...agent, exit_date: null, exit_reason: null, attendance: res.attendance || [] };
                        }
                        return agent;
                      })
                    })));
                  } else {
                    await loadSiteData();
                  }
                  setCancelSortantModalData(null);
                } else {
                  alert(res.message || "Erreur lors de l'annulation de la sortie");
                }
              } catch (e) {
                alert("Erreur réseau");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Annulation...' : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSortantModal;
