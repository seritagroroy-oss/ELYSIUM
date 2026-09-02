import React, { Suspense } from 'react';
import { createPortal } from 'react-dom';
import { apiCall } from '../../api';
import { Archive, Settings, Search, CheckCircle2, ChevronRight, LayoutGrid, Clock, Info, MoreVertical, X, Check, CalendarDays, Edit, Loader2, HelpCircle, ChevronDown, ChevronLeft, ArrowLeft, TrendingUp, ShieldAlert, Plus, Trash2, Users, Trash, RefreshCw } from 'lucide-react';
import RenameSiteModal from '../modals/RenameSiteModal';
import PointageCalendarModal from '../modals/PointageCalendarModal';
import VerificationModal from '../modals/VerificationModal';
import StatsPanel from '../StatsPanel';
import BlacklistModal from '../BlacklistModal';
import DeleteSiteModal from '../modals/DeleteSiteModal';
import PublishReportModal from '../modals/PublishReportModal';

const SITE_EMOJIS = ['🏢', '🏗', '🏭', '🏬', '🏪', '🏦', '🏥', '🏨', '🏫', '🏛', '🗼', '🗽', '⛪', '🕌', '🕍', '🛕', '🏠', '🏡', '🏚', '🏰', '🏯', '⚓', '🚒', '🚑', '🚔', '🧱', '🔒', '🛡', '⚙️', '🔧', '🔑', '📡', '💡', '🌍', '🌿', '⭐', '🔥', '💎', '🎯', '📊'];

export default function SiteSelector({ state, actions }) {
  const {
    isArchiveMode, isPastMonth, isVerificationMode, sites, viewMode, showSiteSettings, siteSortOrder, cardDesign,
    searchTerm, activeSiteId, period, settingsMenuRef, getSafePeriod,
    showRenameModalData, showFirstVisitModal, showAddSite, errorMsg, newSiteName, newSiteLocation, isSpecialSite, specialSiteType, customBehavior,
    showPublishModal, user, publishProgress, showFaqModal,
    showNextMonthModal, initializing, initProgress, sitesToKeepHS, showKeepHSModal,
    siteContextMenu, loading, showStats, showBlacklist, showDeleteSiteModal, deleteSiteData,
    lockedZones, getPeriodLabel, isEditMode, isEmptyMonth, isEmptyFutureMonth,
    publishedPeriods, maxInitializedPeriod, datesList, showVerificationSites, showVerificationModal, showCalendar,
    showPublishReport, showPublishSuccess, leaves, cycleStart,
    expandedFaq, siteSearchTerm, enableAnimations, editModeBehavior, agentTableMode, showRenameSiteModal,
    isVerifying, publishing, draggedSite, iconPickerSiteId, highlightedAgentId, showAgentCountHover,
    renameModalData, pasteConfirmModal, globalAgents, siteOrder, siteData, renameSiteName, clipboardWeek,
    stats
  } = state;

  const {
    setViewMode, setShowSiteSettings, setSiteSortOrder, setCardDesign, setSearchTerm, setActiveSiteId, setActiveSiteName,
    setRenameModalData, executeRenameSite, handleFirstVisitNon, handleFirstVisitOui, handleFirstVisitIgnore,
    setShowAddSite, setNewSiteName, setNewSiteLocation, setIsSpecialSite, setSpecialSiteType, setCustomBehavior, handleCreateSite,
    setShowPublishModal, setShowFaqModal, setShowStats, setShowBlacklist, setShowDeleteSiteModal, setDeleteSiteData, setSites,
    setShowNextMonthModal, setShowKeepHSModal, handleNextMonth, handleCancelNextMonth, setIsEditMode, changePeriod,
    setShowVerificationSites, setShowVerificationModal, setShowCalendar, setShowPublishReport, setShowPublishSuccess,
    setExpandedFaq, setSiteSearchTerm, setEnableAnimations, setEditModeBehavior, setRobustBehavior,
    setAndSaveAgentTableMode, setSiteContextMenu, setShowRenameSiteModal,
    handleDragStart, handleDragOver, handleDragEnd, handleUpdateSiteIcon,
    handleRenameSiteInline, handlePublishPeriod, handleRenameSite,
    setIconPickerSiteId, setHighlightedAgentId, setShowAgentCountHover, setPasteConfirmModal,
    setSiteData, setClipboardWeek, setSitesToKeepHS, setRenameSiteName, setSiteOrder, setGlobalAgents,
    setContextMenu, selectSite, toggleAllZonesLock,
  } = actions;

  // Ref pour le champ de recherche
  const searchInputRef = React.useRef(null);

  // Raccourci clavier universel Ctrl + K
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fonction de normalisation des textes (insensible à la casse et aux accents)
  const normalizeText = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  // Filtrage intelligent des sites (Nom de site, Sous-site/Zone, Nom/Fonction des Agents)
  const filteredSites = React.useMemo(() => {
    if (!siteSearchTerm || !siteSearchTerm.trim()) return sites || [];
    const q = normalizeText(siteSearchTerm);

    return (sites || []).filter(site => {
      const cleanSiteName = (site.name || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
      const siteNameMatch = normalizeText(cleanSiteName).includes(q) || normalizeText(site.name || '').includes(q);
      
      const subsiteMatch = site.subsites && Array.isArray(site.subsites) 
        ? site.subsites.some(sub => normalizeText(sub.name || sub || '').includes(q))
        : false;

      const agentMatch = (globalAgents || []).some(agent => {
        const agentSiteClean = (agent.site || '').replace(/^[\p{Emoji}\s]+/u, '').trim();
        const belongsToSite = (agentSiteClean && cleanSiteName && agentSiteClean === cleanSiteName) || (agent.site_id && site.id && agent.site_id === site.id) || (agent.site_id && site.id && String(agent.site_id) === String(site.id));
        if (!belongsToSite) return false;

        const agentNameMatch = normalizeText(agent.name || agent.nom || '').includes(q);
        const agentFuncMatch = normalizeText(agent.function || agent.poste || '').includes(q);
        return agentNameMatch || agentFuncMatch;
      });

      const embeddedAgentMatch = (site.subsites || []).some(sub => 
        (sub.agents || []).some(agent => {
          const agentNameMatch = normalizeText(agent.name || agent.nom || '').includes(q);
          const agentFuncMatch = normalizeText(agent.function || agent.poste || '').includes(q);
          return agentNameMatch || agentFuncMatch;
        })
      );

      return siteNameMatch || subsiteMatch || agentMatch || embeddedAgentMatch;
    });
  }, [sites, siteSearchTerm, globalAgents]);

    return (
      <>
        <>
          <div
            className="sites-header"
            style={{
              position: 'sticky',
              top: '-24px',
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '12px 24px 16px 24px',
              margin: '-24px -24px 24px -24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="sites-header-left">
              <div className="sites-title-row">
                {isArchiveMode && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => window.dispatchEvent(new CustomEvent('closeArchiveMode'))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginRight: '12px' }}
                  >
                    <ArrowLeft size={14} /> Retour à la liste
                  </button>
                )}
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isArchiveMode ? (
                    <>
                      🗂️ Archive de Pointage — {getPeriodLabel()}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Mode Lecture Seule</span>
                    </>
                  ) : isVerificationMode ? '✅ Traitement du pointage' : '📍 Mes Sites'}
                  {!isVerificationMode && !isArchiveMode && <span style={{ fontSize: '1rem', color: '#ef4444', marginLeft: '12px', fontWeight: 900 }}>({sites.length})</span>}
                </h2>
                {isPastMonth && !isArchiveMode && (
                  <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Historique
                  </span>
                )}
                {!isVerificationMode && !isArchiveMode && (
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '4px', marginLeft: '12px' }}>
                    <button
                      className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`}
                      onClick={() => setViewMode('current')}
                      style={{
                        padding: '8px 16px', fontSize: '0.9rem',
                        background: viewMode === 'current' ? 'var(--a)' : 'transparent',
                        color: viewMode === 'current' ? 'white' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: viewMode === 'current' ? '700' : '500',
                      }}
                    >
                      Actuel
                    </button>
                    <button
                      className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`}
                      onClick={() => setViewMode('archives')}
                      style={{
                        padding: '8px 16px', fontSize: '0.9rem',
                        background: viewMode === 'archives' ? 'var(--a)' : 'transparent',
                        color: viewMode === 'archives' ? 'white' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: viewMode === 'archives' ? '700' : '500',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Archive size={14} /> Archives
                    </button>
                    <div ref={settingsMenuRef} style={{ position: 'relative', marginLeft: '4px' }}>
                      <button
                        onClick={() => setShowSiteSettings(!showSiteSettings)}
                        style={{
                          padding: '8px', fontSize: '0.9rem',
                          background: showSiteSettings ? 'var(--a)' : 'transparent',
                          color: showSiteSettings ? 'white' : 'var(--muted)',
                          border: 'none',
                          borderRadius: '4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        title="Paramètres d'affichage"
                      >
                        <Settings size={16} />
                      </button>
                      {showSiteSettings && (
                        <div style={{
                          position: 'absolute', top: '100%', marginTop: '8px', left: 0, zIndex: 200,
                          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px', padding: '16px', minWidth: '750px',
                          maxHeight: '85vh', overflowY: 'auto',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '20px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Trier les sites :</label>
                            <select
                              value={siteSortOrder}
                              onChange={(e) => setSiteSortOrder(e.target.value)}
                              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <option value="alpha_asc" style={{ background: '#0f172a' }}>A → Z</option>
                              <option value="alpha_desc" style={{ background: '#0f172a' }}>Z → A</option>
                              <option value="created" style={{ background: '#0f172a' }}>Date création</option>
                              <option value="zone" style={{ background: '#0f172a' }}>Par Zone</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Design des cartes :</label>
                            <select
                              value={cardDesign}
                              onChange={(e) => setCardDesign(e.target.value)}
                              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                              <option value="neon" style={{ background: '#0f172a' }}>Néon Minimal</option>
                              <option value="glass" style={{ background: '#0f172a' }}>Verre Premium</option>
                              <option value="gradient" style={{ background: '#0f172a' }}>3D Dégradé</option>
                              <option value="holographic" style={{ background: '#0f172a' }}>Holographique</option>
                              <option value="aurora" style={{ background: '#0f172a' }}>Aurore Boréale</option>
                              <option value="cyberpunk" style={{ background: '#0f172a' }}>Cyberpunk</option>
                              <option value="neumorphism" style={{ background: '#0f172a' }}>Neumorphism</option>
                              <option value="brutalist" style={{ background: '#0f172a' }}>Brutalist Tech</option>
                              <option value="pulse" style={{ background: '#0f172a' }}>Glow Pulse</option>
                              <option value="skeuomorph" style={{ background: '#0f172a' }}>Skeuomorphisme 3D</option>
                              <option value="blob" style={{ background: '#0f172a' }}>Liquid Blob</option>
                              <option value="matrix" style={{ background: '#0f172a' }}>Hacker Matrix</option>
                              <option value="retro" style={{ background: '#0f172a' }}>Retro Brutalism</option>
                              <option value="classic" style={{ background: '#0f172a' }}>Classique</option>
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
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--muted)', marginTop: '4px', marginBottom: '12px', fontSize: '0.9rem' }}>Sélectionnez un site pour accéder au tableau de pointage.</p>

              {!isVerificationMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFaqModal(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(168,85,247,0.15)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#c084fc',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    marginTop: '8px',
                    width: 'fit-content'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(168,85,247,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <HelpCircle size={15} />
                  Foire aux questions (FAQ)
                </button>
              )}

              {/* ============ MODAL FAQ (INLINED) ============ */}
              {showFaqModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }} onClick={() => setShowFaqModal(false)}>
                  <div onClick={e => e.stopPropagation()} style={{
                    width: '98vw', maxWidth: '100%', height: '96vh', maxHeight: '96vh',
                    background: 'linear-gradient(135deg, #110c22 0%, #1a103c 100%)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                    borderRadius: '20px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168,85,247,0.2)', paddingBottom: '16px' }}>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🔮</span> Foire aux questions (FAQ)
                      </h3>
                      <button onClick={() => setShowFaqModal(false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', transition: 'all 0.2s' }}>Fermer</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Accordion Item 1 */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'costume' ? null : 'costume')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'costume' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'costume' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'costume' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>👔</span> Comment est calculé le bonus pour les jours en Costume (COST) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'costume' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'costume' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'costume' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>Lorsqu'un agent effectue des jours en "Costume", il bénéficie d'un supplément calculé de manière différentielle.</p>
                              <div style={{ background: 'rgba(168,85,247,0.1)', borderLeft: '4px solid #c084fc', padding: '16px 20px', borderRadius: '6px' }}>
                                <strong>Principe :</strong> Le bonus correspond à la différence entre le salaire de base de la fonction Costume et le salaire de base habituel de l'agent, ramené à la journée.
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple de calcul concret :</strong>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <li>Salaire Tenue (habituel) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                                  <li>Salaire Costume (A-C) = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                                  <li><strong>Différence journalière</strong> = 3 000 - 2 500 = <strong style={{ color: '#c084fc' }}>+500 CFA</strong> par jour</li>
                                </ul>
                                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                                  Si l'agent fait <strong>5 jours</strong> en Costume :<br />
                                  <span style={{ display: 'inline-block', marginTop: '10px' }}><strong>Bonus final généré</strong> = 5 jours × 500 CFA = <strong style={{ color: '#c084fc', fontSize: '1.4rem' }}>+2 500 CFA</strong></span>
                                </div>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> Ce montant s'ajoute automatiquement au <strong>Salaire net (Aperçu)</strong> dans la section "Bonus et Supp.".
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vous pourrez ajouter d'autres éléments ici à l'avenir */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'prorata' ? null : 'prorata')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'prorata' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'prorata' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'prorata' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>🛡️</span> Comment est calculé le prorata pour les autres fonctions (GA, CP, MC, etc.) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'prorata' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'prorata' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'prorata' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>La logique est exactement la même que pour le Costume, et s'applique automatiquement à <strong>toutes les fonctions et postes existants ou que vous créerez plus tard</strong>.</p>
                              <div style={{ background: 'rgba(168,85,247,0.1)', borderLeft: '4px solid #c084fc', padding: '16px 20px', borderRadius: '6px' }}>
                                <strong>Principe :</strong> Le système calcule la différence entre le salaire de la fonction assignée pour la journée et le salaire de base de l'agent.
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple (Agent AS qui effectue des jours en tant que CP) :</strong>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <li>Salaire de base de l'agent (AS) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                                  <li>Salaire de la fonction (CP) = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                                  <li><strong>Différence journalière</strong> = 3 000 - 2 500 = <strong style={{ color: '#c084fc' }}>+500 CFA</strong> par jour</li>
                                </ul>
                                <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                                  Si l'agent fait <strong>3 jours</strong> en tant que CP :<br />
                                  <span style={{ display: 'inline-block', marginTop: '10px' }}><strong>Bonus final généré</strong> = 3 jours × 500 CFA = <strong style={{ color: '#c084fc', fontSize: '1.4rem' }}>+1 500 CFA</strong></span>
                                </div>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> Note : Si la fonction assignée a le <strong>même salaire</strong> que la fonction de base de l'agent (ex: AS en GA = 75 000), le bonus généré sera logiquement de +0 CFA.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accordion Item Raccourcis Clavier */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'shortcuts' ? null : 'shortcuts')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'shortcuts' ? 'rgba(168,85,247,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'shortcuts' ? '#c084fc' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'shortcuts' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>⌨️</span> Quels sont les raccourcis clavier pour le pointage ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'shortcuts' ? '#c084fc' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'shortcuts' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'shortcuts' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(168,85,247,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <p style={{ margin: 0 }}>Vous pouvez utiliser votre clavier pour corriger plus rapidement vos erreurs de saisie :</p>

                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Z</strong>
                                    <span style={{ marginLeft: '12px' }}><strong>Annuler</strong> la dernière modification de présence. Si vous cliquez sur une case par erreur, ce raccourci la remet dans son état précédent.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Y</strong> <em style={{ opacity: 0.6, fontSize: '0.9rem' }}>(ou CTRL + MAJ + Z)</em>
                                    <span style={{ marginLeft: '12px' }}><strong>Rétablir</strong> une modification que vous venez d'annuler.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + F</strong>
                                    <span style={{ marginLeft: '12px' }}>Place directement le curseur dans la barre de <strong>recherche d'un agent</strong>.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Flèches (Haut, Bas, Gauche, Droite)</strong>
                                    <span style={{ marginLeft: '12px' }}>Permet de se déplacer rapidement de cellule en cellule au clavier.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Entrée</strong>
                                    <span style={{ marginLeft: '12px' }}>Ouvre la fenêtre de modification ou valide le pointage sur la cellule sélectionnée.</span>
                                  </li>
                                  <li>
                                    <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Suppr / Backspace</strong>
                                    <span style={{ marginLeft: '12px' }}>Efface instantanément le pointage de la cellule sélectionnée.</span>
                                  </li>
                                </ul>
                              </div>
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#c084fc' }}>ℹ️</span> <em>Note : L'historique des annulations est propre à votre session sur la page. Si vous quittez ou actualisez la page, l'historique repart à zéro.</em>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* NOUVELLE SECTION FAQ PREMIUM */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedFaq(expandedFaq === 'premium' ? null : 'premium')}
                          style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'premium' ? 'rgba(56,189,248,0.15)' : 'transparent', transition: 'all 0.2s' }}
                        >
                          <h4 style={{ color: expandedFaq === 'premium' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'premium' ? 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' : 'none' }}>🚀</span> Comment utiliser les Fonctionnalités Premium (Mode Zen, Pinceau, Copier/Coller) ?
                          </h4>
                          <ChevronDown size={26} color={expandedFaq === 'premium' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'premium' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>

                        {expandedFaq === 'premium' && (
                          <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(56,189,248,0.1)', marginTop: '4px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Mode Zen 👁️ / 🔍</strong> : En bas à droite de l'écran, cliquez sur l'icône de l'œil pour masquer l'interface supérieure et passer en plein écran.
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Mode Pinceau 🖌️</strong> : En bas au centre, activez cette case pour saisir très rapidement des pointages. Choisissez le statut (Présent, Absent, etc.), puis cliquez et glissez sur les cellules sans relâcher la souris.
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Menu Contextuel 🖱️</strong> : Un clic-droit sur n'importe quelle cellule du tableau ouvre un menu rapide sous votre curseur (pour muter l'agent, changer de vacation, etc.).
                                  </li>
                                  <li>
                                    <strong style={{ color: '#38bdf8' }}>Copier / Coller de semaine 📋</strong> : Dans le menu du clic-droit, vous pouvez "Copier la semaine" d'un agent puis "Coller la semaine" sur un autre agent pour dupliquer tout le mois instantanément !
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>,
                document.body
              )}

            </div>

            <div className="sites-actions-bar">

              {/* Navigateur de mois et Toggle d'édition */}
              {viewMode === 'current' && !isArchiveMode && (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div className="month-navigator" style={{ background: isPastMonth ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: isPastMonth ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)' }}>
                    <button
                      onClick={() => changePeriod(-1)}
                      style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Mois précédent"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: '6px 14px', fontWeight: 700, fontSize: '0.95rem', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {getPeriodLabel()}
                    </span>
                    <button
                      onClick={() => changePeriod(1)}
                      style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Mois suivant"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <button
                    onClick={(isVerificationMode || publishedPeriods.includes(period)) ? null : () => setIsEditMode(!isEditMode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '8px',
                      background: publishedPeriods.includes(period)
                        ? 'rgba(255, 255, 255, 0.03)'
                        : (isEditMode && !isVerificationMode) ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: publishedPeriods.includes(period)
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : (isEditMode && !isVerificationMode) ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border)',
                      color: publishedPeriods.includes(period)
                        ? 'rgba(255, 255, 255, 0.3)'
                        : (isEditMode && !isVerificationMode) ? '#34d399' : 'var(--text-muted)',
                      cursor: (isVerificationMode || publishedPeriods.includes(period)) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      opacity: publishedPeriods.includes(period) ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    title={publishedPeriods.includes(period) ? "Pointage publié — Lecture seule. Dépubliez pour modifier." : isVerificationMode ? "Sécurité activée. Mode lecture seule uniquement." : (isEditMode ? "Le pointage est modifiable (Clic pour verrouiller)" : "Sécurité activée. Clic-gauche et modifications désactivés (Clic pour déverrouiller)")}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{publishedPeriods.includes(period) ? '🔒' : (isEditMode && !isVerificationMode) ? '🔓' : '🔒'}</span>
                    {publishedPeriods.includes(period) ? 'Lecture seule' : isVerificationMode ? 'Mode Lecture' : (isEditMode ? 'Mode Édition' : 'Mode Lecture')}
                  </button>
                </div>
              )}

              {!isVerificationMode && !isArchiveMode && viewMode === 'current' && !isEmptyMonth && (
                <div className="sites-action-buttons" style={{ position: 'relative' }}>
                  <button
                    className={`btn ${publishedPeriods.includes(period) ? 'btn-secondary' : ''}`}
                    onClick={() => setShowPublishModal(true)}
                    disabled={publishedPeriods.includes(period)}
                    style={publishedPeriods.includes(period) ? { padding: '8px 16px', fontSize: '0.9rem' } : {
                      padding: '8px 16px', fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      border: '1px solid rgba(16, 185, 129, 0.6)',
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      if (!publishedPeriods.includes(period)) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!publishedPeriods.includes(period)) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                  >
                    <Check size={18} style={{ strokeWidth: 3 }} />
                    {publishedPeriods.includes(period) ? `Pointage publié ✅` : `PUBLIER LE POINTAGE`}
                  </button>
                  {publishedPeriods.includes(period) && (
                    <button
                      onClick={() => setShowPublishReport(true)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none', color: '#fff',
                        borderRadius: '6px', padding: '6px 12px',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
                      }}
                    >📋 Voir le Rapport</button>
                  )}
                  {!publishedPeriods.includes(period) ? (
                    <>

                      <button className="btn btn-primary" onClick={() => setShowBlacklist(true)} style={{ background: '#ef4444', padding: '8px 16px', fontSize: '0.9rem' }}>
                        <ShieldAlert size={16} /> Liste Noire
                      </button>
                      <button className="btn btn-primary" onClick={() => setShowAddSite(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        <Plus size={16} /> Nouveau Site
                      </button>
                      <div style={{ 
                        position: 'absolute',
                        top: 'calc(100% + 20px)',
                        right: 0,
                        display: 'flex',
                        gap: '10px',
                        zIndex: 50
                      }}>
                        <button 
                          className="btn hover-scale" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setShowCalendar(true); 
                          }} 
                          style={{ 
                            padding: '8px 16px', fontSize: '0.85rem', width: 'max-content', 
                            background: 'linear-gradient(135deg, #0d9488, #0f766e)', 
                            border: '1px solid #14b8a6', color: 'white', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(13, 148, 136, 0.4)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 148, 136, 0.7)';
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #0d9488, #0f766e)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.4)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          }}
                        >
                          📅 Suivi Pointage
                        </button>

                      </div>
                    </>
                  ) : (
                    // Masquer le bouton "Mois Suivant" si l'utilisateur a déjà avancé au-delà de ce mois
                    maxInitializedPeriod && maxInitializedPeriod > period ? null : (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowNextMonthModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                        cursor: 'pointer',
                        opacity: 1
                      }}
                    >
                      <CalendarDays size={14} /> Mois Suivant ➔
                    </button>
                    )
                  )}
                </div>
              )}
            </div>

            {!isEmptyMonth && (
              <div style={{ flexBasis: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '-12px', position: 'relative', zIndex: 10 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  width: '100%',
                  maxWidth: '420px',
                  boxShadow: '0 8px 25px -5px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
                  gap: '10px',
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <Search size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Recherche intelligente (Site, zone, agent)..."
                    value={siteSearchTerm}
                    onChange={(e) => setSiteSearchTerm(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  />
                  {siteSearchTerm ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', whiteSpace: 'nowrap', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.3)' }}>
                        {filteredSites.length} trouvé{filteredSites.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setSiteSearchTerm('')}
                        style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#94a3b8', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="Effacer la recherche"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      Ctrl K
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>

        {isVerificationMode && !publishedPeriods.includes(period) && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>⏳</div>
            <h3>Aucun pointage n'est encore publié pour ce mois de {getPeriodLabel()}</h3>
            <p className="subtitle" style={{ marginTop: '8px' }}>Veuillez attendre que le service planning publie le pointage pour y accéder.</p>
          </div>
        )}

        {isVerificationMode && publishedPeriods.includes(period) && datesList.length > 0 && !showVerificationSites && (
          <div className="glass-panel"
            onClick={() => setShowVerificationSites(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(34,197,94,0.1) 100%)',
              border: showVerificationSites ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(56,189,248,0.6)',
              padding: '24px',
              marginBottom: '32px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: showVerificationSites ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: showVerificationSites ? 'none' : '0 10px 30px -10px rgba(56,189,248,0.3)',
              transform: showVerificationSites ? 'none' : 'translateY(0)'
            }}
            onMouseEnter={e => { if (!showVerificationSites) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!showVerificationSites) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(56,189,248,0.2)', padding: '16px', borderRadius: '50%', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={36} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>Période à traiter</h3>
                <p style={{ fontSize: '1.05rem', color: 'var(--muted)', margin: 0 }}>
                  Traitement des pointages du <strong style={{ color: '#fff' }}>{datesList[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong> au <strong style={{ color: '#fff' }}>{datesList[datesList.length - 1].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
                </p>
              </div>
            </div>
            {!showVerificationSites && (
              <div style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 0 15px rgba(56,189,248,0.5)',
                transition: 'all 0.2s ease'
              }}>
                Démarrer le traitement ➔
              </div>
            )}
          </div>
        )}

        {((!isVerificationMode && !isArchiveMode) || isArchiveMode || (isVerificationMode && publishedPeriods.includes(period) && showVerificationSites)) && (
          <>
            {isVerificationMode && publishedPeriods.includes(period) && datesList.length > 0 && showVerificationSites && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(34,197,94,0.05) 100%)',
                border: '1px solid rgba(56,189,248,0.25)',
                padding: '12px 20px',
                marginBottom: '24px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '0.95rem',
                width: '100%'
              }}>
                <span style={{ color: '#38bdf8', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>📅</span>
                <span>
                  <strong>Période à traiter :</strong> du <strong style={{ color: '#38bdf8' }}>{datesList[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong> au <strong style={{ color: '#38bdf8' }}>{datesList[datesList.length - 1].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                </span>
              </div>
            )}
            {(isEmptyMonth && !loading) ? (
              /* ── Mois sans données (passé vide ou futur) ── */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 24px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.35 }}>
                  {isEmptyFutureMonth ? '🔒' : '📭'}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
                  Aucun pointage disponible
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.6 }}>
                  {isEmptyFutureMonth ? (
                    <>Le pointage de <strong style={{ color: 'var(--text)' }}>{getPeriodLabel()}</strong> n'est pas encore disponible.<br />Publiez d'abord le mois en cours avant de passer au suivant.</>
                  ) : (
                    <>Aucune donnée de pointage n'a été enregistrée pour <strong style={{ color: 'var(--text)' }}>{getPeriodLabel()}</strong>.<br />Ce mois précède la période d'utilisation de l'application.</>
                  )}
                </p>
                <button
                  onClick={() => changePeriod(isEmptyFutureMonth ? -1 : 1)}
                  style={{
                    marginTop: '28px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--a)', color: 'white', border: 'none', borderRadius: '10px',
                    padding: '10px 22px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(56,189,248,0.3)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {isEmptyFutureMonth ? <><ChevronLeft size={16} /> Revenir au mois précédent</> : <><ChevronRight size={16} /> Revenir au mois suivant</>}
                </button>
              </div>
            ) : sites.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>🏢</div>
                <h3>Aucun site enregistré</h3>
                <p className="subtitle" style={{ marginTop: '8px' }}>Commencez par créer un site pour gérer vos agents.</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowAddSite(true)}>
                  <Plus size={16} /> Créer mon premier site
                </button>
              </div>
            ) : (
              <div className="sites-grid">
                {filteredSites.filter(site => {
                  if (site.id === 'site_extras' && localStorage.getItem('pontage_active_extras') === 'false') return false;
                  if (site.id === 'site_releves' && localStorage.getItem('pontage_active_releves') === 'false') return false;
                  if (site.id === 'site_administration' && localStorage.getItem('pontage_active_admin') === 'false') return false;
                  return true;
                }).sort((a, b) => {
                  if (isArchiveMode) return 0;
                  const cleanStr = (s) => (s || '').replace(/[^a-zA-Z0-9À-ÿ]/g, '').toLowerCase();
                  if (siteSortOrder === 'alpha_asc') {
                    return cleanStr(a.name).localeCompare(cleanStr(b.name));
                  } else if (siteSortOrder === 'alpha_desc') {
                    return cleanStr(b.name).localeCompare(cleanStr(a.name));
                  } else if (siteSortOrder === 'zone') {
                    const zoneA = a.zone || 'Autre';
                    const zoneB = b.zone || 'Autre';
                    if (zoneA !== zoneB) return cleanStr(zoneA).localeCompare(cleanStr(zoneB));
                    return cleanStr(a.name).localeCompare(cleanStr(b.name));
                  } else if (siteSortOrder === 'created') {
                    const idxA = siteOrder.indexOf(a.id);
                    const idxB = siteOrder.indexOf(b.id);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return 0;
                  }
                  return 0;
                }).map((site, idx) => {
                  const glowColors = ['var(--b)', 'var(--a)', 'var(--c)', '#a78bfa', '#f472b6'];
                  const glow = glowColors[idx % glowColors.length];
                  
                  let matchedAgents = [];
                  if (siteSearchTerm) {
                    const q = normalizeText(siteSearchTerm);
                    const globalMatches = (globalAgents || []).filter(a => {
                      const siteIdMatches = a.site_id && site.id && String(a.site_id) === String(site.id);
                      const siteNameMatches = (a.site && site.name && a.site === site.name) || (a.site && site.nom && a.site === site.nom);
                      return (siteIdMatches || siteNameMatches) && normalizeText(a.name || a.nom || '').includes(q);
                    });
                    
                    if (globalMatches.length > 0) {
                      matchedAgents = globalMatches;
                    } else if (site.subsites) {
                      site.subsites.forEach(sub => {
                        (sub.agents || []).forEach(agent => {
                          if (normalizeText(agent.name || agent.nom || '').includes(q)) {
                            // Avoid duplicates safely if id is undefined
                            const agentIdentifier = agent.id || agent.name || agent.nom;
                            if (!matchedAgents.some(m => (m.id || m.name || m.nom) === agentIdentifier)) {
                              matchedAgents.push({ ...agent, name: agent.name || agent.nom, id: agent.id || agentIdentifier });
                            }
                          }
                        });
                      });
                    }
                  }
                  

                  const siteIcon = site.icon || '🏢';
                  return (
                    <div
                      key={site.id}
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
                            {site.name} {site.location === 'interieur' && <img src="https://flagcdn.com/w20/ci.png" srcSet="https://flagcdn.com/w40/ci.png 2x" width="16" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px' }} />}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!isVerificationMode && !isArchiveMode && (!publishedPeriods || !publishedPeriods.includes(getSafePeriod())) && (
                              <>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteSiteData(site);
                                      setShowDeleteSiteModal(true);
                                    }}
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
                              </>
                            )}
                          </div>
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Gestion du Pointage</p>
                        {matchedAgents.length > 0 && (
                          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', maxHeight: '120px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--b)', fontWeight: 'bold', marginBottom: '6px' }}>AGENTS TROUVÉS :</div>
                            {matchedAgents.map(a => (
                              <div
                                key={a.id}
                                style={{
                                  padding: '6px',
                                  fontSize: '0.85rem',
                                  color: '#e2e8f0',
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  transition: 'background 0.2s',
                                  display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSiteSearchTerm('');
                                  setHighlightedAgentId(a.id);
                                  selectSite(site.id, site.name);
                                }}
                              >
                                <span style={{ color: 'var(--a)' }}>👤</span> {a.name}
                              </div>
                            ))}
                          </div>
                        )}
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
                              <Users size={14} color="#f59e0b" /> {site.agents_count || 0} agent{(site.agents_count || 0) > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============ MODAL RENOMMER SITE ============ */}
        <RenameSiteModal
          isOpen={!!renameModalData}
          currentName={renameModalData?.currentName}
          onClose={() => setRenameModalData(null)}
          onConfirm={executeRenameSite}
        />

        {/* Modal Première Connexion */}
        {showFirstVisitModal && (() => {
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const [y, m] = getSafePeriod(period).split('-').map(Number);
          const currentMonthName = monthNames[m - 1];
          const nextD = new Date(y, m, 1);
          const nextMonthName = monthNames[nextD.getMonth()];
          const nextYear = nextD.getFullYear();
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
              <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px', padding: '32px',
                maxWidth: '520px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗓️</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Première connexion — Pointage</h2>
                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '16px' }}>
                  Avez-vous déjà <strong>traité et publié</strong> le pointage du mois de{' '}
                  <strong style={{ color: '#38bdf8' }}>{currentMonthName} {y}</strong> ?
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  Si oui, nous basculons directement sur <strong style={{ color: 'white' }}>{nextMonthName} {nextYear}</strong> pour le nouveau cycle.<br />
                  Si non, vous travaillerez sur <strong style={{ color: 'white' }}>{currentMonthName} {y}</strong> normalement.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleFirstVisitNon} className="btn btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
                    ❌ Non, commencer {currentMonthName}
                  </button>
                  <button onClick={handleFirstVisitOui} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
                    ✅ Oui, passer à {nextMonthName}
                  </button>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button onClick={handleFirstVisitIgnore} className="btn" style={{ width: '100%', padding: '10px', fontSize: '0.9rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    Ignorer ce message
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal Ajout Site */}
        {showAddSite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '420px' }}>
              <h3 style={{ marginBottom: '16px' }}>Nouveau Site</h3>
              {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
              <input className="form-input" style={{ width: '100%', marginBottom: '16px' }} placeholder="Nom du site..." value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />

              <div style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="siteLocation" value="abidjan" checked={newSiteLocation === 'abidjan'} onChange={e => setNewSiteLocation(e.target.value)} />
                  Abidjan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="siteLocation" value="interieur" checked={newSiteLocation === 'interieur'} onChange={e => setNewSiteLocation(e.target.value)} />
                  Intérieur
                </label>
              </div>

              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: isSpecialSite ? '8px' : '0' }}>
                  <input type="checkbox" checked={isSpecialSite} onChange={e => setIsSpecialSite(e.target.checked)} />
                  <span style={{ fontWeight: 'bold' }}>Ceci est un Vivier Spécial</span>
                </label>
                {isSpecialSite && (
                  <>
                    <select
                      className="form-input"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', marginBottom: specialSiteType === 'definir' ? '12px' : '0' }}
                      value={specialSiteType}
                      onChange={e => setSpecialSiteType(e.target.value)}
                    >
                      <option value="extras">Comportement : Extras (Réserve)</option>
                      <option value="releves">Comportement : Relèves (Remplaçants)</option>
                      <option value="admin">Comportement : Administration</option>
                      <option value="custom">Autre / Libre</option>
                      <option value="definir">Définir le comportement</option>
                    </select>

                    {specialSiteType === 'definir' && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Choisissez l'affichage :</label>
                        <select
                          className="form-input"
                          style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--b)', color: 'white' }}
                          value={customBehavior}
                          onChange={e => setCustomBehavior(e.target.value)}
                        >
                          <option value="grouped">Classique (Tableau unique)</option>
                          <option value="manual_zones">Option A : Création de Zones</option>
                          <option value="auto_individual">Option B : 1 Tableau par Agent</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowAddSite(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleCreateSite}>Créer</button>
              </div>
            </div>
          </div>
        )}

        {/* ============ MODAL PUBLIER POINTAGE ============ */}
        {showPublishModal && (() => {
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const [yr, mn] = getSafePeriod(period).split('-').map(Number);
          const monthName = monthNames[mn - 1];
          const startD = new Date(yr, mn - 2, 21);
          const endD = new Date(yr, mn - 1, 20);
          const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div onClick={() => !publishing && setShowPublishModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
              {publishing ? (
                <div style={{
                  position: 'relative', zIndex: 1,
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '24px', padding: '40px 32px',
                  maxWidth: '520px', width: '100%',
                  boxShadow: '0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(56, 189, 248, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                  textAlign: 'center',
                  backdropFilter: 'blur(16px)'
                }}>
                  <style>{`
                    @keyframes folderReceive {
                      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.2)); }
                      50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.8)); }
                    }
                    @keyframes slideFile {
                      0% { left: 0%; transform: scale(0.5) translateY(-50%); opacity: 0; }
                      15% { left: 15%; transform: scale(1) translateY(-50%); opacity: 1; }
                      85% { left: 85%; transform: scale(1) translateY(-50%); opacity: 1; }
                      100% { left: 100%; transform: scale(0.3) translateY(-50%); opacity: 0; }
                    }
                    .file-particle {
                      position: absolute;
                      top: 50%;
                      color: #38bdf8;
                      animation: slideFile 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                    .file-1 { animation-delay: 0s; }
                    .file-2 { animation-delay: 0.5s; }
                    .file-3 { animation-delay: 1s; }
                  `}</style>

                  {/* Flow Visualization */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px', position: 'relative', width: '100%' }}>
                    {/* Source Icon (Stack of files) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', width: '72px', height: '72px', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/>
                      </svg>
                    </div>

                    {/* Animated Files Pipeline */}
                    <div style={{ flex: 1, position: 'relative', height: '40px' }}>
                      {/* Guide line */}
                      <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'rgba(56, 189, 248, 0.1)', transform: 'translateY(-50%)', borderTop: '1px dashed rgba(56,189,248,0.3)' }} />
                      
                      {/* Particles */}
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`file-particle file-${i}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(56,189,248,0.1)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' }}>
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                      ))}
                    </div>

                    {/* Destination Folder */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '16px', width: '80px', height: '80px', justifyContent: 'center', flexShrink: 0, animation: 'folderReceive 2s infinite ease-in-out' }}>
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Texts */}
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 8px 0', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 40%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Transmission Quantique...</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', marginBottom: '32px', lineHeight: '1.5' }}>Synchronisation et sécurisation de la période sur l'environnement distant.</p>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'ping 1.5s infinite' }}></span>
                      CHIFFREMENT DES DONNÉES
                    </span>
                    <span style={{ color: '#38bdf8' }}>{publishProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', padding: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ 
                      width: `${publishProgress}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)', 
                      borderRadius: '8px', 
                      transition: 'width 0.1s linear',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'relative', zIndex: 1,
                  background: 'linear-gradient(145deg, #0a1628 0%, #111827 50%, #0f1a2e 100%)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: '24px', padding: '20px 24px',
                  maxWidth: '500px', width: '100%',
                  maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(56,189,248,0.15))', border: '2px solid rgba(34,197,94,0.4)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 25px rgba(34,197,94,0.2)' }}>🚀</div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>Publier le pointage</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Mois de <span style={{ color: '#22c55e', fontWeight: 700 }}>{monthName} {yr}</span>
                    </p>
                  </div>

                  {/* Période card */}
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <CalendarDays size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Période concernée</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{fmtD(startD)} → {fmtD(endD)}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{sites.length}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Site(s)</div>
                    </div>
                    <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{stats.totalAgents}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Agent(s)</div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>En publiant :</p>
                    {[
                      { icon: '📤', text: 'Le pointage sera visible pour le service de traitement' },
                      { icon: '📦', text: 'Une archive automatique sera créée' },
                      { icon: '🔒', text: 'Le bouton "Mois Suivant" sera débloqué' },
                    ].map((item, i) => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowPublishModal(false)} disabled={publishing}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >Annuler</button>
                    <button onClick={handlePublishPeriod} disabled={publishing}
                      style={{ flex: 2, padding: '12px', borderRadius: '12px', background: publishing ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', border: 'none', cursor: publishing ? 'wait' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onMouseEnter={e => { if (!publishing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(34,197,94,0.5)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,197,94,0.4)'; }}
                    >
                      {publishing ? (
                        <><Loader2 size={18} className="animate-spin" /> Publication en cours...</>
                      ) : (
                        <><Check size={18} /> Confirmer la publication</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============ MODAL MOIS SUIVANT ============ */}
        {showNextMonthModal && (() => {
          let [y, m] = getSafePeriod(period).split('-').map(Number);
          m += 1; if (m > 12) { m = 1; y += 1; }
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const currentMonthName = monthNames[Number(getSafePeriod(period).split('-')[1]) - 1];
          const nextMonthName = monthNames[m - 1];

          const start = new Date(y, m - 2, 21);
          const end = new Date(y, m - 1, 20);
          const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div onClick={() => setShowNextMonthModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
              <div className="next-month-modal-container">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 25px rgba(245,158,11,0.2)' }}>📅</div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>Passage au mois suivant</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>{currentMonthName} → <span style={{ color: '#f59e0b', fontWeight: 700 }}>{nextMonthName} {y}</span></p>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CalendarDays size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nouvelle période de pointage</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{fmtDate(start)} → {fmtDate(end)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Ce qui va se passer :</p>
                  {[
                    { icon: '✅', color: '#22c55e', text: 'La structure de vos sites et agents est conservée' },
                    { icon: '✅', color: '#22c55e', text: 'Les vacations et fonctions sont maintenues' },
                    { icon: '🗑️', color: '#ef4444', text: 'Les absences sont remises à zéro' },
                    { icon: '🗑️', color: '#ef4444', text: 'Les heures supplémentaires sont effacées', hasEdit: true },
                    { icon: '🔄', color: '#38bdf8', text: 'Le calendrier est recalculé pour la nouvelle période' }
                  ].map((item, i) => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.text}</span>
                      {item.hasEdit && (
                        <button onClick={() => setShowKeepHSModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} title="Sélectionner les sites pour lesquels conserver les HS">
                          <Edit size={16} />
                          {sitesToKeepHS.length > 0 && <span style={{ fontSize: '0.75rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{sitesToKeepHS.length} site(s)</span>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="next-month-buttons" style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCancelNextMonth} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Annuler</button>
                  <button onClick={handleNextMonth} disabled={initializing} style={{ flex: 2, padding: initializing ? '10px 14px' : '14px', borderRadius: '12px', background: initializing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: initializing ? 'rgba(255,255,255,0.8)' : '#fff', border: 'none', cursor: initializing ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: initializing ? 'none' : '0 4px 20px rgba(245,158,11,0.4)', display: 'flex', flexDirection: initializing ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5)'; } }} onMouseLeave={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)'; } }}>
                    {initializing ? (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <span>Initialisation en cours... {initProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${initProgress}%`, height: '100%', background: '#fff', transition: 'width 0.1s linear' }} />
                        </div>
                      </div>
                    ) : (
                      <><CalendarDays size={18} /> Confirmer — Passer à {nextMonthName}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {showStats && <StatsPanel companyId={user?.company_id} onClose={() => setShowStats(false)} />}
        {showBlacklist && <BlacklistModal onClose={() => setShowBlacklist(false)} />}

        {/* MENU CONTEXTUEL SITE */}
        {siteContextMenu.visible && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: siteContextMenu.y,
              left: siteContextMenu.x,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 9999,
              padding: '4px',
              minWidth: '180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <div style={{ padding: '8px', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
              Site: {siteContextMenu.siteName}
            </div>
            <button
              className="btn"
              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setRenameSiteName(siteContextMenu.siteName);
                setShowRenameSiteModal(true);
                setSiteContextMenu({ ...siteContextMenu, visible: false });
              }}
            >
              <Edit size={14} /> Renommer
            </button>
            <button
              className="btn"
              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                setShowDeleteSiteModal(true);
                setSiteContextMenu({ ...siteContextMenu, visible: false });
              }}
            >
              <Trash size={14} /> Supprimer
            </button>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <button
              className="btn"
              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                if (window.confirm('Voulez-vous réinitialiser l\'ordre et l\'interface par défaut ? Cela rechargera la page.')) {
                  localStorage.removeItem('elysium_sites_order');
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('elysium_subsites_order_') || key.startsWith('elysium_dashboard_')) {
                      localStorage.removeItem(key);
                    }
                  });
                  window.location.reload();
                }
                setSiteContextMenu({ ...siteContextMenu, visible: false });
              }}
            >
              <RefreshCw size={14} /> Réinitialiser Interface
            </button>
          </div>
        )}

        {/* MODALE RENOMMER SITE */}
        {showRenameSiteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '400px' }}>
              <h3 style={{ marginBottom: '16px' }}>Renommer le site</h3>
              <form onSubmit={handleRenameSite}>
                <input
                  className="form-input"
                  style={{ width: '100%', marginBottom: '20px' }}
                  value={renameSiteName}
                  onChange={e => setRenameSiteName(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowRenameSiteModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Renommer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE CONFIRMATION COLLAGE */}
        {pasteConfirmModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.3rem', color: '#f8fafc' }}>Confirmer le collage</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '24px', lineHeight: '1.5' }}>
                Êtes-vous sûr de vouloir coller les pointages de <br />
                <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.sourceAgent.name}</strong> vers <strong style={{ color: '#38bdf8' }}>{pasteConfirmModal.targetAgent.name}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  className="btn"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px' }}
                  onClick={() => setPasteConfirmModal(null)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={async () => {
                    const { sourceAgent, targetAgent } = pasteConfirmModal;
                    const updates = [];
                    const newAttendance = [...(targetAgent.attendance || [])];

                    const year = parseInt(period.split('-')[0], 10);
                    const month = parseInt(period.split('-')[1], 10) - 1;
                    const startD = new Date(year, month - 1, cycleStart);
                    const endD = new Date(year, month, cycleStart - 1);
                    const tempDatesList = [];
                    let cur = new Date(startD);
                    while (cur <= endD) {
                      tempDatesList.push(new Date(cur));
                      cur.setDate(cur.getDate() + 1);
                    }

                    tempDatesList.forEach(d => {
                      const dk = formatDateKey(d);
                      ['J', 'N', 'S', 'SJ', 'SN'].forEach(sc => {
                        const srcCell = (sourceAgent.attendance || []).find(a => a.date === dk && a.shift_code === sc);
                        if (srcCell && srcCell.status) {
                          updates.push(apiCall('update_attendance', {
                            agent_id: targetAgent.id, date: dk, shift_code: sc, status: srcCell.status, period
                          }));

                          const idx = newAttendance.findIndex(a => a.date === dk && a.shift_code === sc);
                          if (idx >= 0) {
                            newAttendance[idx] = { ...newAttendance[idx], status: srcCell.status };
                          } else {
                            newAttendance.push({ date: dk, shift_code: sc, status: srcCell.status });
                          }
                        }
                      });
                    });

                    setSiteData(prev => prev.map(sub => ({
                      ...sub,
                      agents: sub.agents?.map(ag => {
                        if (ag.id === targetAgent.id) return { ...ag, attendance: newAttendance };
                        return ag;
                      })
                    })));

                    setPasteConfirmModal(null);
                    setClipboardWeek(null);
                    await Promise.all(updates);
                  }}
                >
                  <Check size={18} /> Coller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ MODAL CONSERVATION HS ============ */}
        {showKeepHSModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={() => setShowKeepHSModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
            <div style={{
              position: 'relative', zIndex: 1,
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px',
              maxWidth: '1400px', width: '95vw',
              height: '95vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 50px rgba(234,179,8,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}><Edit size={28} /></div>
                <div>
                  <h3 style={{ color: '#fff', margin: '0', fontSize: '1.4rem', fontWeight: 800 }}>Conserver les Heures Suppl.</h3>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '24px', lineHeight: '1.6' }}>
                Cochez les sites pour lesquels vous souhaitez que les lignes supplémentaires (SP) du mois précédent soient automatiquement copiées pour ce nouveau mois.
              </p>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', paddingRight: '8px', alignContent: 'start' }}>
                {sites.filter(s => s && s.name && !s.name.includes('Administration') && !s.name.includes('Relevé')).map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: sitesToKeepHS.includes(s.id) ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)', border: sitesToKeepHS.includes(s.id) ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { if (!sitesToKeepHS.includes(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                    <input
                      type="checkbox"
                      checked={sitesToKeepHS.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSitesToKeepHS([...sitesToKeepHS, s.id]);
                        else setSitesToKeepHS(sitesToKeepHS.filter(id => id !== s.id));
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#eab308' }}
                    />
                    <span style={{ color: sitesToKeepHS.includes(s.id) ? '#fff' : 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: sitesToKeepHS.includes(s.id) ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Annuler
                </button>
                <button onClick={() => setShowKeepHSModal(false)} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #eab308 0%, #d97706 100%)', color: '#000', border: 'none', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 800, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(234,179,8,0.4)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  Valider la sélection ({sitesToKeepHS.length})
                </button>
              </div>
            </div>
          </div>
      )}

      {/* MODALE SUPPRIMER SITE */}
      {showDeleteSiteModal && deleteSiteData && (
        <DeleteSiteModal
          siteName={deleteSiteData.name}
          onClose={() => {
            setShowDeleteSiteModal(false);
            setDeleteSiteData(null);
          }}
          onConfirm={async () => {
            try {
              const res = await apiCall('delete_site', { site_id: deleteSiteData.id, motif: 'Suppression depuis dashboard' });
              if (res.success) {
                const newSites = sites.filter(s => s.id !== deleteSiteData.id);
                setSites(newSites);
                localStorage.setItem('pontage_sites_cache', JSON.stringify(newSites));
                if (activeSiteId === deleteSiteData.id) setActiveSiteId(null);
                setShowDeleteSiteModal(false);
                setDeleteSiteData(null);
              } else {
                alert(res.message || "Erreur de suppression");
              }
            } catch (e) {
              alert("Erreur serveur.");
            }
          }}
        />
      )}

      {/* ============ MODAL SUCCÈS PUBLICATION ============ */}
      {showPublishSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: 36, width: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.7)', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            {/* Icône succès animée */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>✅</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '1.3rem', fontWeight: 800 }}>Pointage Publié !</h2>
            <p style={{ margin: '0 0 6px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Le pointage de <strong style={{ color: '#e2e8f0' }}>{(() => { const [y, m] = period.split('-'); return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][parseInt(m) - 1] + ' ' + y; })()}</strong> a été publié avec succès.
            </p>
            <p style={{ margin: '0 0 28px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Les agents du service vérification peuvent maintenant le consulter.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowPublishSuccess(false); setShowPublishReport(true); }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >📋 Voir le Rapport de Pointage</button>
              <button
                onClick={() => setShowPublishSuccess(false)}
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem' }}
              >Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL RAPPORT DE POINTAGE ============ */}
      {showPublishReport && (
        <PublishReportModal
          period={period}
          cycleStart={cycleStart}
          siteData={siteData}
          leaves={leaves}
          user={user}
          sites={sites}
          onClose={() => setShowPublishReport(false)}
        />
      )}

      {/* ============ MODAL VERIFICATION STRICTE ============ */}
      {showVerificationModal && (
        <Suspense fallback={null}>
          <VerificationModal 
            sites={sites}
            period={period}
            cycleStart={cycleStart}
            onClose={() => setShowVerificationModal(false)} 
          />
        </Suspense>
      )}

      {showCalendar && (
        <PointageCalendarModal 
          isOpen={showCalendar} 
          onClose={() => setShowCalendar(false)} 
          period={period} 
        />
      )}
    </>
    );
}
