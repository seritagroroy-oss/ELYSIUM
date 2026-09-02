import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteSpecialAgentModal({ isOpen, onClose, onConfirm, agentName, isLoading }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100000, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, type: 'spring', damping: 25 }}
          style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '32px', borderRadius: '24px', width: '440px', maxWidth: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative', overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Decorative blur blob */}
          <div style={{
            position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px',
            background: 'rgba(239, 68, 68, 0.2)', filter: 'blur(50px)', borderRadius: '50%', zIndex: 0
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8',
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <X size={18} />
          </button>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', marginBottom: '24px',
              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: '1.4rem', fontWeight: 600 }}>
              Supprimer le salaire particulier ?
            </h3>

            <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5' }}>
              Voulez-vous vraiment supprimer le salaire particulier de <strong style={{ color: '#f8fafc' }}>{agentName}</strong> ?
              <br /><br />
              <span style={{ fontSize: '0.9rem' }}>Il/elle retrouvera immédiatement le salaire de base lié à sa fonction.</span>
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '1rem'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Annuler
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: isLoading ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                  color: 'white', border: 'none',
                  fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', fontSize: '1rem',
                  boxShadow: isLoading ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onMouseOver={e => {
                  if (isLoading) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseOut={e => {
                  if (isLoading) return;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLoading ? 'Suppression...' : 'Oui, Supprimer'}
              </button>
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
