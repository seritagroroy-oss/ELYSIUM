import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../../api';
import { Bell, Check, Circle, RefreshCw } from 'lucide-react';

export default function NotificationBell({ currentPeriod, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await apiCall('get_notifications', {}, 'GET');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (e) {
      console.error("Error loading notifications", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id = 'all') => {
    try {
      const res = await apiCall('mark_notification_read', { notif_id: id });
      if (res.success) {
        if (id === 'all') {
          setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
          setUnreadCount(0);
        } else {
          setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (e) {
      console.error("Error marking notification as read", e);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--muted)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '350px',
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>Notifications</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadNotifications}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                title="Actualiser"
              >
                <RefreshCw size={14} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={() => handleMarkAsRead('all')}
                  style={{
                    background: 'rgba(56,189,248,0.15)',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                <Bell size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    background: notif.is_read ? 'transparent' : 'rgba(56,189,248,0.08)',
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <div style={{ marginTop: '2px', color: notif.is_read ? 'var(--muted)' : '#38bdf8' }}>
                    {notif.is_read ? <Check size={16} /> : <Circle size={16} fill="currentColor" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: notif.is_read ? 500 : 700, color: 'white' }}>
                      {notif.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                      {notif.message}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(notif.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
