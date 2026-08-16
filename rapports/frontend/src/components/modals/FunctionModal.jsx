import React, { useState } from 'react';

export default function FunctionModal({
  functionModalAgent,
  setFunctionModalAgent,
  activeSiteId,
  functions,
  handleUpdateAgentField
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredFunctions = functions.filter(f => f.id.toLowerCase().includes(searchTerm.toLowerCase()) || f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={() => setFunctionModalAgent(null)}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div
        style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #0f1a2e 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '1200px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 800 }}>Modifier la Fonction</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
              Agent : <strong style={{ color: 'white' }}>{functionModalAgent.name}</strong>
            </p>
          </div>
          <input 
            type="text"
            placeholder="Rechercher une fonction..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '12px 18px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.4)', background: 'rgba(0,0,0,0.3)', color: 'white', width: '400px', outline: 'none', fontSize: '1rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {/* Option Aucun */}
          {(searchTerm === '' ? true : "— Aucune / Vide".toLowerCase().includes(searchTerm.toLowerCase())) && (
            <button
              onClick={() => { handleUpdateAgentField(functionModalAgent.id, 'function', ''); setFunctionModalAgent(null); }}
              style={{
                padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                background: !functionModalAgent.function ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                color: !functionModalAgent.function ? '#818cf8' : 'var(--muted)',
                cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.15s'
              }}
            >
              — Aucune / Vide
            </button>
          )}

          {filteredFunctions.map(f => (
            <button
              key={f.id}
              onClick={() => { handleUpdateAgentField(functionModalAgent.id, 'function', f.id); setFunctionModalAgent(null); }}
              style={{
                padding: '16px 20px', borderRadius: '12px', border: `1px solid ${functionModalAgent.function === f.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: functionModalAgent.function === f.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = functionModalAgent.function === f.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)'}
            >
              <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 800, fontSize: '0.9rem', padding: '6px 10px', borderRadius: '8px', minWidth: '40px', textAlign: 'center' }}>{f.id}</span>
              <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>{f.fullName || f.id}</span>
              {functionModalAgent.function === f.id && <span style={{ marginLeft: 'auto', color: '#818cf8', fontSize: '1.2rem' }}>✓</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFunctionModalAgent(null)}
          style={{ 
            marginTop: '24px', width: '100%', padding: '14px', borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#f87171', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
