import React, { useEffect, useRef } from 'react';

const CallWindow = ({ roomName, userDisplayName, userEmail, onClose }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const scriptId = 'jitsi-external-api';
    
    const initJitsi = () => {
      const options = {
        roomName: roomName,
        parentNode: containerRef.current,
        userInfo: {
          email: userEmail,
          displayName: userDisplayName
        },
        configOverwrite: { 
          startWithAudioMuted: false,
          startWithVideoMuted: false
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0b141a',
        }
      };
      
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current.addListener('videoConferenceLeft', () => {
        onClose();
      });
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, userDisplayName, userEmail, onClose]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, background: '#0b141a' }}>
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 100000 }}>
        <button 
            onClick={onClose} 
            style={{ 
                background: '#ef4444', color: 'white', border: 'none', 
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', 
                fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' 
            }}>
            Quitter l'appel
        </button>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CallWindow;
