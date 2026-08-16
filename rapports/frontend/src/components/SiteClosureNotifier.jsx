import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { ShieldAlert, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SiteClosureNotifier = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Polling function
    const fetchAlerts = async (forcePeriod = null) => {
      try {
        const currentPeriod = forcePeriod || window.pontage_period || localStorage.getItem('pontage_period') || '';
        const res = await apiCall('get_closure_alerts', { period: currentPeriod });
        if (res && res.success && res.alerts) {
          setAlerts(prev => {
            let addedNew = false;
            res.alerts.forEach(incomingAlert => {
              if (!prev.some(a => a.id === incomingAlert.id)) {
                addedNew = true;
              }
            });
            
            if (addedNew) {
              try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
              } catch(e) {
                console.log('Audio play prevented', e);
              }
            }
            
            return res.alerts;
          });
        }
      } catch (err) {
        console.error("Error fetching closure alerts", err);
      }
    };

    // Fetch immediately on mount, then every 60 seconds
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    
    const handlePeriodChange = (e) => {
      fetchAlerts(e?.detail);
    };
    window.addEventListener('pontage_period_changed', handlePeriodChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('pontage_period_changed', handlePeriodChange);
    };
  }, []);

  const handleDismiss = async (alert) => {
    // Remove from UI immediately
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    
    // Ack to backend
    try {
      await apiCall('ack_closure_alert', {
        subsite_id: alert.subsite_id,
        type: alert.type
      });
    } catch (err) {
      console.error("Error acking alert", err);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      maxWidth: '400px',
      pointerEvents: 'none' // Let clicks pass through the container
    }}>
      {alerts.map(alert => (
        <motion.div 
          key={alert.id} 
          drag 
          dragMomentum={false}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          style={{
            background: '#0f172a',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(245, 158, 11, 0.2)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            pointerEvents: 'auto', // Re-enable clicks for the actual toast
            cursor: 'grab',
            animation: 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <button 
            onClick={() => handleDismiss(alert)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px', color: '#f59e0b' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8, fontWeight: 'bold', textAlign: 'center', width: '100%', marginBottom: '10px' }}>Jarvis Assistant</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={24} />
              <strong style={{ fontSize: '1rem', lineHeight: '1.2' }}>
                {alert.type === 'immediate' ? 'Alerte Fermeture Programmée' : 'Rappel Fermeture Approchante'}
              </strong>
            </div>
          </div>
          
          <p style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {alert.message}
          </p>
          
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => handleDismiss(alert)}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Compris
            </button>
          </div>
        </motion.div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default SiteClosureNotifier;
