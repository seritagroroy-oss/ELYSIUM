import React from 'react';
import { Trash2, Users } from 'lucide-react';

export default function DashboardSiteCard({
  site,
  glow,
  cardDesign,
  draggedSite,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  setSiteContextMenu,
  selectSite,
  iconPickerSiteId,
  setIconPickerSiteId,
  handleUpdateSiteIcon,
  SITE_EMOJIS,
  handleRenameSiteInline,
  handleDeleteSiteInline,
  showAgentCountHover
}) {
  const siteIcon = site.icon || '🏢';
  const [flagUrl, setFlagUrl] = React.useState(() => localStorage.getItem('pontage_custom_flag_url') || "https://flagcdn.com/w20/ci.png");

  React.useEffect(() => {
    const handleFlagChange = () => setFlagUrl(localStorage.getItem('pontage_custom_flag_url') || "https://flagcdn.com/w20/ci.png");
    window.addEventListener('pontage_custom_flag_url_changed', handleFlagChange);
    return () => window.removeEventListener('pontage_custom_flag_url_changed', handleFlagChange);
  }, []);

  return (
    <div
      className={`site-card design-${cardDesign}`}
      draggable
      onDragStart={(e) => handleDragStart(e, site.id)}
      onDragOver={(e) => handleDragOver(e, site.id)}
      onDragEnd={handleDragEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSiteContextMenu({ visible: true, x: e.clientX, y: e.clientY, siteId: site.id, siteName: site.name });
      }}
      style={{ 
        '--card-glow': glow, 
        cursor: 'grab',
        opacity: draggedSite === site.id ? 0.4 : 1,
        transform: draggedSite === site.id ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={() => selectSite(site.id, site.name)}
    >
      <div className="site-card-inner">
        {/* Icône modifiable */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <button
            title="Changer l'icône"
            onClick={e => { e.stopPropagation(); setIconPickerSiteId(iconPickerSiteId === site.id ? null : site.id); }}
            style={{ width: '52px', height: '52px', background: 'rgba(56,189,248,0.08)', borderRadius: '12px', border: '1px dashed rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', padding: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.22)'; e.currentTarget.style.borderColor = 'var(--b)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.08)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
          >
            {siteIcon.startsWith('data:') ? (
              <img src={siteIcon} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} />
            ) : (
              siteIcon
            )}
          </button>

          {/* Picker popup */}
          {iconPickerSiteId === site.id && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: '58px', left: 0, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', width: '272px' }}
            >
              {/* Upload image button */}
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.35)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', marginBottom: '10px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--b)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
              >
                🖼️ Importer une image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 300 * 1024) { alert('Image trop grande (max 300 Ko)'); return; }
                    const reader = new FileReader();
                    reader.onload = ev => handleUpdateSiteIcon(site.id, ev.target.result);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {/* Separator */}
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>ou choisir un emoji</div>
              {/* Emoji grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                {SITE_EMOJIS.map(em => (
                  <button
                    key={em}
                    onClick={() => handleUpdateSiteIcon(site.id, em)}
                    style={{ background: em === siteIcon ? 'rgba(56,189,248,0.25)' : 'transparent', border: em === siteIcon ? '1px solid var(--b)' : '1px solid transparent', borderRadius: '6px', fontSize: '1.2rem', padding: '4px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = em === siteIcon ? 'rgba(56,189,248,0.25)' : 'transparent'}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            {site.name} {site.location === 'interieur' && <img src={flagUrl} width="16" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'contain' }}/>}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
                title="Renommer le site"
                onClick={(e) => handleRenameSiteInline(e, site.id, site.name)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--muted)',
                  cursor: 'pointer', padding: '4px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.2s, background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--b)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '14px' }}>✏️</span>
              </button>
            {!['site_extras', 'site_releves', 'site_administration'].includes(site.id) && (
              <button
                title="Supprimer le site"
                onClick={(e) => handleDeleteSiteInline(e, site.id)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--muted)',
                  cursor: 'pointer', padding: '4px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.2s, background 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Gestion du Pointage</p>
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: glow, fontSize: '0.85rem', fontWeight: 700 }}>
          <span>Ouvrir le tableau</span>
          <span style={{ fontSize: '1rem' }}>→</span>
        </div>
        
        {/* ZONE & AGENT COUNT ON HOVER */}
        {showAgentCountHover && (
        <div className="zone-count-hover" style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '8px', color: 'var(--b)', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', opacity: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'translateY(-10px)', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span> {site.subsites ? site.subsites.length : 0} zone{site.subsites && site.subsites.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
            <Users size={14} color="#f59e0b" /> {site.agents_count || 0} agent{site.agents_count > 1 ? 's' : ''}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
