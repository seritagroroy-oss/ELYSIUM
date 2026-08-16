import React from 'react';
import { createPortal } from 'react-dom';

export default function GlobalConfigMenu({
  siteSortOrder,
  setSiteSortOrder,
  cardDesign,
  setCardDesign,
  showAgentCountHover,
  setShowAgentCountHover,
  enableAnimations,
  setEnableAnimations,
  editModeBehavior,
  setEditModeBehavior,
  setRobustBehavior,
  setIsEditMode,
  agentTableMode,
  setAndSaveAgentTableMode,
  currentPeriod,
  isPeriodLocked,
  loadDashboardData,
  onClose
}) {
  const [cellTextSize, setCellTextSize] = React.useState(() => localStorage.getItem('pontage_cell_text_size') || 'medium');
  const [flagUrl, setFlagUrl] = React.useState(() => localStorage.getItem('pontage_custom_flag_url') || "https://flagcdn.com/w20/ci.png");
  const initialBg = localStorage.getItem('pontage_table_header_bg') || '#0b1220';
  const safeTempBg = /^#[0-9A-F]{6}$/i.test(initialBg) ? initialBg : '#0b1220';
  const [tableHeaderBg, setTableHeaderBg] = React.useState(initialBg);
  const [tempBg, setTempBg] = React.useState(safeTempBg);
  const [lockPassword, setLockPassword] = React.useState('');
  const [isTogglingLock, setIsTogglingLock] = React.useState(false);

  const handleCellTextSizeChange = (val) => {
    setCellTextSize(val);
    localStorage.setItem('pontage_cell_text_size', val);
    window.dispatchEvent(new Event('pontage_cell_text_size_changed'));
  };

  const handleTableHeaderBgChange = (e) => {
    setTempBg(e.target.value);
  };

  const saveTableHeaderBg = (colorToSave = tempBg) => {
    setTableHeaderBg(colorToSave);
    setTempBg(colorToSave);
    localStorage.setItem('pontage_table_header_bg', colorToSave);
    window.dispatchEvent(new Event('pontage_table_header_bg_changed'));
    alert("Couleur de l'en-tête sauvegardée !");
  };

  const handleFlagUrlChange = (val) => {
    setFlagUrl(val);
    localStorage.setItem('pontage_custom_flag_url', val);
    window.dispatchEvent(new Event('pontage_custom_flag_url_changed'));
  };

  const handleFlagUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleFlagUrlChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleLock = async () => {
    if (!isPeriodLocked && !lockPassword) {
      alert("Veuillez saisir un mot de passe pour verrouiller.");
      return;
    }
    setIsTogglingLock(true);
    try {
      const { apiCall } = await import('../../api');
      const res = await apiCall('toggle_period_lock', { 
        period: currentPeriod, 
        password: lockPassword, 
        action_type: isPeriodLocked ? 'unlock' : 'lock' 
      });
      if (res.success) {
        setLockPassword('');
        if (loadDashboardData) {
          await loadDashboardData();
        }
      } else {
        alert(res.error || res.message || "Erreur de sécurité");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setIsTogglingLock(false);
    }
  };

  const [isHoverClose, setIsHoverClose] = React.useState(false);

  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999,
      background: '#0f172a', padding: '40px', boxSizing: 'border-box',
      overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Paramètres d'affichage</h2>
        {onClose && (
          <button 
            onClick={onClose}
            onMouseEnter={() => setIsHoverClose(true)}
            onMouseLeave={() => setIsHoverClose(false)}
            style={{ 
              background: isHoverClose ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
              border: isHoverClose ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)', 
              color: isHoverClose ? '#ef4444' : 'var(--muted)', 
              fontSize: '2rem', 
              cursor: 'pointer', 
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isHoverClose ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
            }}
            title="Fermer"
          >
            ×
          </button>
        )}
      </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Trier les sites :</label>
          <select 
            value={siteSortOrder} 
            onChange={(e) => setSiteSortOrder(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
          <option value="alpha_asc" style={{background:'#0f172a'}}>A → Z</option>
          <option value="alpha_desc" style={{background:'#0f172a'}}>Z → A</option>
          <option value="created" style={{background:'#0f172a'}}>Date création</option>
          <option value="zone" style={{background:'#0f172a'}}>Par Zone</option>
        </select>
      </div>
      
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: '#facc15', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          🔒 Sécurité du mois ({currentPeriod})
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isPeriodLocked && (
            <input 
              type="password" 
              placeholder="Nouveau mot de passe" 
              value={lockPassword}
              onChange={(e) => setLockPassword(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', flex: 1, outline: 'none' }}
            />
          )}
          <button 
            onClick={handleToggleLock}
            disabled={isTogglingLock || (!isPeriodLocked && !lockPassword)}
            style={{ 
              padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', 
              background: isPeriodLocked ? 'rgba(239,68,68,0.2)' : 'rgba(250,204,21,0.2)',
              color: isPeriodLocked ? '#f87171' : '#facc15',
              flex: isPeriodLocked ? 1 : 'none'
            }}
          >
            {isTogglingLock ? "En cours..." : (isPeriodLocked ? "🔓 Déverrouiller (Supprimer Mdp)" : "Verrouiller le mois")}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Design des cartes :</label>
        <select 
          value={cardDesign} 
          onChange={(e) => setCardDesign(e.target.value)}
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <option value="neon" style={{background:'#0f172a'}}>Néon Minimal</option>
          <option value="glass" style={{background:'#0f172a'}}>Verre Premium</option>
          <option value="gradient" style={{background:'#0f172a'}}>3D Dégradé</option>
          <option value="holographic" style={{background:'#0f172a'}}>Holographique</option>
          <option value="aurora" style={{background:'#0f172a'}}>Aurore Boréale</option>
          <option value="cyberpunk" style={{background:'#0f172a'}}>Cyberpunk</option>
          <option value="neumorphism" style={{background:'#0f172a'}}>Neumorphism</option>
          <option value="brutalist" style={{background:'#0f172a'}}>Brutalist Tech</option>
          <option value="pulse" style={{background:'#0f172a'}}>Glow Pulse</option>
          <option value="skeuomorph" style={{background:'#0f172a'}}>Skeuomorphisme 3D</option>
          <option value="blob" style={{background:'#0f172a'}}>Liquid Blob</option>
          <option value="matrix" style={{background:'#0f172a'}}>Hacker Matrix</option>
          <option value="retro" style={{background:'#0f172a'}}>Retro Brutalism</option>
          <option value="classic" style={{background:'#0f172a'}}>Classique</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Options des cartes :</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <input 
            type="checkbox" 
            checked={showAgentCountHover} 
            onChange={e => setShowAgentCountHover(e.target.checked)} 
            style={{ cursor: 'pointer' }}
          />
          Afficher le nombre d'agents au survol
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <input 
            type="checkbox" 
            checked={enableAnimations} 
            onChange={e => {
              setEnableAnimations(e.target.checked);
              localStorage.setItem('pontage_enable_animations', e.target.checked ? 'true' : 'false');
            }} 
            style={{ cursor: 'pointer' }}
          />
          Activer les animations du tableau
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
          Sécurité & Édition du pointage :
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'remember_session', label: '🔓 Garder mon choix (Session)', desc: 'Le cadenas garde sa position (ouvert ou fermé) quand vous changez de site' },
            { id: 'lock_always', label: '🔒 Verrouiller automatiquement', desc: 'Se reverrouille automatiquement à chaque fois que vous changez de site/zone' },
            { id: 'unlock_always', label: '🔓 Déverrouiller automatiquement', desc: 'Se déverrouille automatiquement à chaque fois que vous changez de site/zone ou actualisez la page' },
            { id: 'default_locked', label: '🔒 Verrouillage par défaut', desc: 'Verrouillé au démarrage, puis garde votre choix (Session)' },
            { id: 'default_unlocked', label: '🔓 Déverrouillage par défaut', desc: 'Déverrouillé au démarrage, puis garde votre choix (Session)' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setEditModeBehavior(opt.id);
                setRobustBehavior(opt.id);
                if (window.forceSyncSettings) window.forceSyncSettings();
                if (opt.id === 'unlock_always' || opt.id === 'default_unlocked') setIsEditMode(true);
                if (opt.id === 'lock_always' || opt.id === 'default_locked') setIsEditMode(false);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                background: editModeBehavior === opt.id ? 'rgba(52,211,153,0.15)' : 'rgba(0,0,0,0.2)',
                border: editModeBehavior === opt.id ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.05)',
                color: editModeBehavior === opt.id ? '#34d399' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px', color: editModeBehavior === opt.id ? '#34d399' : 'white' }}>{opt.label}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Mode d'affichage ⚙️ Tableau :</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'grouped', label: '📊 Tableau groupé', desc: 'Tous les agents dans un seul tableau par zone' },
            { id: 'individual', label: '🃏 Tableau individuel', desc: 'Un tableau dédié par agent' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setAndSaveAgentTableMode(opt.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                background: agentTableMode === opt.id ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.2)',
                border: agentTableMode === opt.id ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.05)',
                color: 'white', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Couleur de l'en-tête du tableau :</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="color" 
            value={tempBg} 
            onChange={handleTableHeaderBgChange} 
            onInput={handleTableHeaderBgChange}
            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: 'white', fontSize: '0.85rem' }}>{tempBg}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => saveTableHeaderBg(tempBg)}
                style={{ padding: '4px 10px', background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#0f172a', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                💾 Sauvegarder
              </button>
              <button 
                onClick={() => saveTableHeaderBg('#0b1220')}
                style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--muted)', borderRadius: '4px', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Couleur par défaut
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Taille du texte (A, P, R, etc) :</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'small', label: 'Petite' },
            { id: 'medium', label: 'Moyenne' },
            { id: 'large', label: 'Grande' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleCellTextSizeChange(opt.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                background: cellTextSize === opt.id ? 'rgba(56,189,248,0.25)' : 'rgba(0,0,0,0.2)',
                border: cellTextSize === opt.id ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(255,255,255,0.05)',
                color: cellTextSize === opt.id ? '#38bdf8' : 'white', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Drapeau (Sites Intérieur) :</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <img src={flagUrl} alt="Drapeau" style={{ width: '24px', borderRadius: '2px', objectFit: 'contain' }} />
          <input
            type="text"
            value={flagUrl}
            onChange={(e) => handleFlagUrlChange(e.target.value)}
            style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none' }}
            placeholder="URL de l'image (ex: https://flagcdn.com/w20/fr.png)"
          />
          <label style={{ cursor: 'pointer', padding: '8px 12px', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <input type="file" accept="image/*" onChange={handleFlagUpload} style={{ display: 'none' }} />
            Importer image
          </label>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
