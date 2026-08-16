import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import { apiCall } from '../../api';

const getAvatar = (name = '?') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a3942&color=aebac1&bold=true`;

const StatusViewer = ({ statuses, onClose, startIndex = 0, currentUserEmail }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(startIndex);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViews, setShowViews] = useState(false);
  const [views, setViews] = useState([]);

  const userGroup = statuses[currentUserIndex];
  // Support both 'items' (API) and 'statuses' (legacy)
  const userStatuses = userGroup?.items || userGroup?.statuses || [userGroup].filter(Boolean);
  const currentStatus = userStatuses[currentStatusIndex];

  useEffect(() => {
    if (!userGroup || !currentStatus) {
      onClose();
      return;
    }

    setProgress(0);
    setShowViews(false);
    
    // If it's a video, progress is handled by video onTimeUpdate
    if (currentStatus.content_type === 'video') return;

    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      if (!showViews) {
        setProgress(p => p + step);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentUserIndex, currentStatusIndex, currentStatus, showViews]);

  useEffect(() => {
    if (progress >= 100 && !showViews) {
      // Next status in this user's group
      if (currentStatusIndex < userStatuses.length - 1) {
        setCurrentStatusIndex(prev => prev + 1);
      } else if (currentUserIndex < statuses.length - 1) {
        // Next user
        setCurrentUserIndex(prev => prev + 1);
        setCurrentStatusIndex(0);
      } else {
        // All done
        onClose();
      }
    }
  }, [progress, currentStatusIndex, currentUserIndex, statuses.length, userStatuses.length, showViews]);

  const loadViews = async () => {
    setShowViews(true);
    try {
      const res = await apiCall('get_status_views', { status_id: currentStatus.id }, 'GET');
      if (res.success) {
        setViews(res.views || []);
      }
    } catch {}
  };

  if (!userGroup || !currentStatus) return null;

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX > rect.width / 2;

    if (isRight) {
      // Forward
      if (currentStatusIndex < userStatuses.length - 1) {
        setCurrentStatusIndex(p => p + 1);
        setProgress(0);
      } else if (currentUserIndex < statuses.length - 1) {
        setCurrentUserIndex(p => p + 1);
        setCurrentStatusIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
    } else {
      // Backward
      if (currentStatusIndex > 0) {
        setCurrentStatusIndex(p => p - 1);
        setProgress(0);
      } else if (currentUserIndex > 0) {
        const prevGroup = statuses[currentUserIndex - 1];
        const prevItems = prevGroup?.items || prevGroup?.statuses || [prevGroup];
        setCurrentUserIndex(p => p - 1);
        setCurrentStatusIndex(prevItems.length - 1);
        setProgress(0);
      }
    }
  };

  const bgColor = currentStatus.bg_color || '#075e54';
  const isImage = currentStatus.content_type === 'image';
  const isVideo = currentStatus.content_type === 'video';
  
  // Build correct media URL: if content starts with 'uploads/' or '/', prefix with '/'
  const getMediaUrl = (content) => {
    if (!content) return '';
    if (content.startsWith('http') || content.startsWith('blob:') || content.startsWith('data:')) return content;
    return content.startsWith('/') ? content : `/${content}`;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Previous user button */}
      {currentUserIndex > 0 && (
        <button
          onClick={() => { setCurrentUserIndex(p => p - 1); setCurrentStatusIndex(0); setProgress(0); }}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#fff' }}>
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Story card */}
      <div style={{ width: '100%', maxWidth: '400px', height: '100%', maxHeight: '720px', position: 'relative', display: 'flex', flexDirection: 'column', background: (isImage || isVideo) ? '#000' : bgColor, borderRadius: window.innerWidth > 600 ? '16px' : 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

        {/* Top overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 16px 40px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
          {/* Progress bars */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
            {userStatuses.map((_, idx) => (
              <div key={idx} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: idx < currentStatusIndex ? '100%' : idx === currentStatusIndex ? `${progress}%` : '0%',
                  height: '100%', background: '#fff', transition: currentStatus.content_type === 'video' ? 'none' : 'width 0.05s linear'
                }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={userGroup.profile_photo || getAvatar(userGroup.user_name)} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{userGroup.user_name}</div>
                {currentStatus.created_at && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    {(() => {
                      try { return new Date(currentStatus.created_at.replace(/-/g, '/')).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
                      catch { return ''; }
                    })()}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content — tap left/right to navigate */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', padding: (isImage || isVideo) ? 0 : '80px 30px' }} onClick={handleTap}>
          {isImage ? (
            <img src={getMediaUrl(currentStatus.content)} alt="statut" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : isVideo ? (
            <video 
              src={getMediaUrl(currentStatus.content)} 
              autoPlay 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onTimeUpdate={(e) => {
                if (e.target.duration) {
                  setProgress((e.target.currentTime / e.target.duration) * 100);
                }
              }}
              onEnded={() => {
                setProgress(100);
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.7rem', fontWeight: 700, lineHeight: 1.4, textShadow: '0 2px 8px rgba(0,0,0,0.3)', wordBreak: 'break-word' }}>
              {currentStatus.content}
            </div>
          )}
        </div>

        {/* Bottom indicator for my statuses */}
        {userGroup.user_email === currentUserEmail && !showViews && (
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); loadViews(); }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '20px', padding: '6px 14px', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
              <Eye size={18} /> Voir qui a vu
            </button>
          </div>
        )}

        {/* Views Modal */}
        {showViews && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: '#111b21', borderRadius: '20px 20px 0 0', zIndex: 20, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #222d34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#e9edef', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={20} color="#00a884" /> Vues ({views.length})
              </div>
              <button onClick={() => setShowViews(false)} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {views.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8696a0', padding: 20, fontSize: '14px' }}>Personne n'a encore vu ce statut.</div>
              ) : (
                views.map(v => (
                  <div key={v.viewer_email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #222d34' }}>
                    <img src={v.profile_photo || getAvatar(v.viewer_name)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ color: '#e9edef', fontSize: '15px', fontWeight: 500 }}>{v.viewer_name}</div>
                      <div style={{ color: '#8696a0', fontSize: '12px' }}>{v.viewed_at ? new Date(v.viewed_at.replace(/-/g, '/')).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next user button */}
      {currentUserIndex < statuses.length - 1 && (
        <button
          onClick={() => { setCurrentUserIndex(p => p + 1); setCurrentStatusIndex(0); setProgress(0); }}
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#fff' }}>
          <ChevronRight size={22} />
        </button>
      )}

      {/* Background blur */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'rgba(0,0,0,0.85)' }} onClick={onClose} />
    </div>
  );
};

export default StatusViewer;
