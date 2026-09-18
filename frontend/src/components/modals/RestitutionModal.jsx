import React from 'react';
import { AlertCircle, CheckCircle, X, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RestitutionModal = ({ isOpen, onClose, onConfirm, siteName, isLoading, error }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          {/* Overlay avec effet de flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Conteneur principal de la modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                <Info size={32} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, paddingTop: '8px' }}>
                <h3 style={{
                  color: '#fff',
                  margin: '0 0 8px 0',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em'
                }}>
                  Restituer le site ?
                </h3>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  Vous êtes sur le point de restituer <strong style={{ color: '#f8fafc' }}>{siteName}</strong> au service traitant.
                </p>
              </div>
            </div>

            {/* Message d'avertissement */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                Cette action est définitive pour ce mois. Vous n'aurez plus accès aux pointages de ce site.
              </p>
            </div>

            {/* Message d'erreur potentiel */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderLeft: '4px solid #ef4444',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginTop: '-8px'
                  }}>
                    <X size={18} color="#ef4444" style={{ marginTop: '2px' }} />
                    <p style={{ color: '#fecaca', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '14px',
                  borderRadius: '14px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
              >
                Annuler
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isLoading}
                style={{
                  flex: 1.5,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.6)',
                  padding: '14px',
                  borderRadius: '14px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)'; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)'; }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Restitution...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Restituer le site
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RestitutionModal;
