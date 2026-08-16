import React from 'react';
import { X, Trash2, MapPin, User, FileText } from 'lucide-react';

export default function TransferDetailsModal({ data, onDelete, onClose }) {
  if (!data) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#1e293b', width: '400px', borderRadius: '16px', border: '1px solid rgba(249, 115, 22, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(249, 115, 22, 0.05)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>Détails du transfert</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#f97316', marginTop: '2px', fontWeight: '500' }}>Agent: {data.agentName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <MapPin size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '2px' }}>Site de destination</div>
              <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: '500' }}>{data.targetSite || <span style={{opacity: 0.5, fontStyle: 'italic'}}>Non renseigné</span>}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <User size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '2px' }}>Agent remplacé</div>
              <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: '500' }}>{data.replacedAgent || <span style={{opacity: 0.5, fontStyle: 'italic'}}>Non renseigné</span>}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '2px' }}>Motif</div>
              <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: '500', lineHeight: '1.4' }}>{data.motif || <span style={{opacity: 0.5, fontStyle: 'italic'}}>Non renseigné</span>}</div>
            </div>
          </div>

        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={() => onDelete(data)}
            style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}>
            <Trash2 size={16} />
            Annuler le transfert
          </button>
        </div>
      </div>
    </div>
  );
}
