import React from 'react';
import { Check } from 'lucide-react';

const PasteConfirmModal = ({
  pasteConfirmModal,
  setPasteConfirmModal,
  setClipboardWeek,
  setSiteData,
  apiCall,
  formatDateKey,
  period,
  cycleStart
}) => {
  if (!pasteConfirmModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h3 style={{ marginBottom: '12px', fontSize: '1.3rem', color: '#f8fafc' }}>Confirmer le collage</h3>
        <p style={{ color: '#cbd5e1', marginBottom: '24px', lineHeight: '1.5' }}>
          Êtes-vous sûr de vouloir coller les pointages de <br />
          <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.sourceAgent.name}</strong> vers <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.targetAgent.name}</strong> ?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="btn"
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px' }}
            onClick={() => setPasteConfirmModal(null)}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={async () => {
              const { sourceAgent, targetAgent } = pasteConfirmModal;
              const updates = [];
              const newAttendance = [...(targetAgent.attendance || [])];

              const year = parseInt(period.split('-')[0], 10);
              const month = parseInt(period.split('-')[1], 10) - 1;
              const startD = new Date(year, month - 1, cycleStart);
              const endD = new Date(year, month, cycleStart - 1);
              const tempDatesList = [];
              let cur = new Date(startD);
              while (cur <= endD) {
                tempDatesList.push(new Date(cur));
                cur.setDate(cur.getDate() + 1);
              }

              tempDatesList.forEach(d => {
                const dk = formatDateKey(d);
                ['J', 'N', 'S', 'SJ', 'SN'].forEach(sc => {
                  const srcCell = (sourceAgent.attendance || []).find(a => a.date === dk && a.shift_code === sc);
                  if (srcCell && srcCell.status) {
                    updates.push(apiCall('update_attendance', {
                      agent_id: targetAgent.id, date: dk, shift_code: sc, status: srcCell.status, period
                    }));

                    const idx = newAttendance.findIndex(a => a.date === dk && a.shift_code === sc);
                    if (idx >= 0) {
                      newAttendance[idx] = { ...newAttendance[idx], status: srcCell.status };
                    } else {
                      newAttendance.push({ date: dk, shift_code: sc, status: srcCell.status });
                    }
                  }
                });
              });

              setSiteData(prev => prev.map(sub => ({
                ...sub,
                agents: sub.agents?.map(ag => {
                  if (ag.id === targetAgent.id) return { ...ag, attendance: newAttendance };
                  return ag;
                })
              })));

              setPasteConfirmModal(null);
              setClipboardWeek(null);
              await Promise.all(updates);
            }}
          >
            <Check size={18} /> Coller
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteConfirmModal;
