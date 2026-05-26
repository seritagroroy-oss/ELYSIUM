import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Settings, Plus, Trash, Save, Loader2, Monitor, Sun, Sparkles, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [cycleStart, setCycleStart] = useState(21);
  const [cycleEnd, setCycleEnd] = useState(20);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedCycle, setSavedCycle] = useState(false);
  const [savedFuncs, setSavedFuncs] = useState(false);
  const [newFuncId, setNewFuncId] = useState('');
  const [newFuncName, setNewFuncName] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('pontage_theme') || 'modern');
  const [statsCardSize, setStatsCardSize] = useState(() => parseFloat(localStorage.getItem('pontage_stats_card_size') || '1'));
  const [savedStatsSize, setSavedStatsSize] = useState(false);

  // Sections visibility
  const [showSectionCycle, setShowSectionCycle] = useState(false);
  const [showSectionFonctions, setShowSectionFonctions] = useState(false);
  const [showSectionApparence, setShowSectionApparence] = useState(false);
  const [showSectionCouleurs, setShowSectionCouleurs] = useState(false);
  const [showSectionCards, setShowSectionCards] = useState(false);
  const [showSectionModes, setShowSectionModes] = useState(false);

  const [modeExtras, setModeExtras] = useState(() => localStorage.getItem('pontage_display_mode_extras') || 'auto_individual');
  const [modeReleves, setModeReleves] = useState(() => localStorage.getItem('pontage_display_mode_releves') || 'auto_individual');
  const [modeAdmin, setModeAdmin] = useState(() => localStorage.getItem('pontage_display_mode_admin') || 'auto_individual');

  const [activeExtras, setActiveExtras] = useState(() => localStorage.getItem('pontage_active_extras') !== 'false');
  const [activeReleves, setActiveReleves] = useState(() => localStorage.getItem('pontage_active_releves') !== 'false');
  const [activeAdmin, setActiveAdmin] = useState(() => localStorage.getItem('pontage_active_admin') !== 'false');

  const applyModeExtras = (m) => { setModeExtras(m); localStorage.setItem('pontage_display_mode_extras', m); };
  const applyModeReleves = (m) => { setModeReleves(m); localStorage.setItem('pontage_display_mode_releves', m); };
  const applyModeAdmin = (m) => { setModeAdmin(m); localStorage.setItem('pontage_display_mode_admin', m); };

  const toggleActiveExtras = (v) => { setActiveExtras(v); localStorage.setItem('pontage_active_extras', v); };
  const toggleActiveReleves = (v) => { setActiveReleves(v); localStorage.setItem('pontage_active_releves', v); };
  const toggleActiveAdmin = (v) => { setActiveAdmin(v); localStorage.setItem('pontage_active_admin', v); };

  const applyStatsCardSize = (val) => {
    setStatsCardSize(val);
    localStorage.setItem('pontage_stats_card_size', String(val));
    window.dispatchEvent(new Event('pontage_stats_size_changed'));
  };

  const handleSaveStatsSize = () => {
    localStorage.setItem('pontage_stats_card_size', String(statsCardSize));
    window.dispatchEvent(new Event('pontage_stats_size_changed'));
    setSavedStatsSize(true);
    setTimeout(() => setSavedStatsSize(false), 3000);
  };

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('pontage_theme', t);
    if (t !== 'modern') {
      document.body.setAttribute('data-theme', t);
    } else {
      document.body.removeAttribute('data-theme');
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settings, funcs] = await Promise.all([
        apiCall('get_settings', {}, 'GET'),
        apiCall('get_functions', {}, 'GET')
      ]);
      if (settings && settings.cycle_start) {
        setCycleStart(settings.cycle_start);
        setCycleEnd(settings.cycle_end);
      }
      if (Array.isArray(funcs)) {
        setFunctions(funcs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCycle = async () => {
    try {
      const res = await apiCall('save_settings', {
        cycle_start: cycleStart,
        cycle_end: cycleEnd
      });
      if (res.success) {
        setSavedCycle(true);
        setTimeout(() => setSavedCycle(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFunction = () => {
    if (!newFuncId.trim() || !newFuncName.trim()) return;
    setFunctions(prev => [...prev, { id: newFuncId.toUpperCase().trim(), name: newFuncName.trim() }]);
    setNewFuncId('');
    setNewFuncName('');
  };

  const handleDeleteFunction = (id) => {
    setFunctions(prev => prev.filter(f => f.id !== id));
  };

  const handleSaveFunctions = async () => {
    try {
      const res = await apiCall('save_functions', { functions });
      if (res.success) {
        setSavedFuncs(true);
        setTimeout(() => setSavedFuncs(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetColors = () => {
    localStorage.removeItem('pontage_extra_cell_bg');
    localStorage.removeItem('pontage_ext_text_color');
    localStorage.removeItem('pontage_extra_name_bg');
    localStorage.removeItem('pontage_releve_cell_bg');
    localStorage.removeItem('pontage_rel_text_color');
    localStorage.removeItem('pontage_releve_name_bg');
    setTheme(t => t); // force re-render
  };

  return (
    <div>
      <div className="top-bar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={24} style={{ color: 'var(--muted)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Paramètres du Système</h2>
        </div>
      </div>

      {!isAdmin && (
        <div className="alert alert-warning" style={{ marginTop: '24px' }}>
          <span>Seul l'administrateur du service peut modifier ces paramètres.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
        </div>
      ) : (
        <>
          {/* Cycle de Paie */}
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionCycle ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>📅 Cycle de Paie</h3>
              <button
                onClick={() => setShowSectionCycle(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionCycle ? 'Masquer' : 'Afficher'}
              >
                {showSectionCycle ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionCycle ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionCycle && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Définissez les jours de début et de fin du cycle de pointage mensuel.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Jour de Début du Cycle</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1} max={31}
                      value={cycleStart}
                      onChange={(e) => setCycleStart(parseInt(e.target.value) || 1)}
                      disabled={!isAdmin}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '4px' }}>
                      ex: 21 → cycle du 21 au 20 du mois suivant
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jour de Fin du Cycle</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1} max={31}
                      value={cycleEnd}
                      onChange={(e) => setCycleEnd(parseInt(e.target.value) || 1)}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className={`btn ${savedCycle ? 'btn-success' : 'btn-primary'}`}
                    style={{ marginTop: '12px' }}
                    onClick={handleSaveCycle}
                  >
                    <Save size={16} />
                    <span>{savedCycle ? '✓ Sauvegardé !' : 'Sauvegarder le Cycle'}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Gestion des Postes / Fonctions */}
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionFonctions ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>🏷️ Postes / Fonctions des Agents</h3>
              <button
                onClick={() => setShowSectionFonctions(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionFonctions ? 'Masquer' : 'Afficher'}
              >
                {showSectionFonctions ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionFonctions ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionFonctions && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Gérez les types de postes disponibles (utilisé dans la configuration des salaires).
                </p>
                {/* Liste des postes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {functions.map(f => (
                    <div key={f.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px'
                    }}>
                      <div>
                        <span style={{ fontWeight: '700', color: 'var(--b)', marginRight: '8px' }}>{f.id}</span>
                        <span style={{ color: 'var(--text)' }}>{f.name}</span>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn-logout"
                          onClick={() => handleDeleteFunction(f.id)}
                          style={{ padding: '4px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: 'none' }}
                        >
                          <Trash size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Ajouter un nouveau poste */}
                {isAdmin && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Code (ex: CP)</label>
                        <input type="text" className="form-input" placeholder="CP" maxLength={10} value={newFuncId} onChange={(e) => setNewFuncId(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nom complet</label>
                        <input type="text" className="form-input" placeholder="ex: Chef de Poste" value={newFuncName} onChange={(e) => setNewFuncName(e.target.value)} />
                      </div>
                      <button className="btn btn-secondary" onClick={handleAddFunction}><Plus size={16} /> Ajouter</button>
                    </div>
                    <button className={`btn ${savedFuncs ? 'btn-success' : 'btn-primary'}`} style={{ marginTop: '16px' }} onClick={handleSaveFunctions}>
                      <Save size={16} />
                      <span>{savedFuncs ? '✓ Sauvegardé !' : 'Sauvegarder les Postes'}</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {/* Apparence & Interface */}
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionApparence ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>🎨 Apparence &amp; Interface</h3>
              <button
                onClick={() => setShowSectionApparence(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionApparence ? 'Masquer' : 'Afficher'}
              >
                {showSectionApparence ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionApparence ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionApparence && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Choisissez le style visuel de l'application. Le changement est instantané.
                </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', width: '100%' }}>

              {/* Card Classique */}
              <div
                onClick={() => applyTheme('classic')}
                style={{
                  cursor: 'pointer',
                  borderRadius: '14px',
                  border: `2px solid ${theme === 'classic' ? 'var(--b)' : 'var(--border)'}`,
                  padding: '20px',
                  background: theme === 'classic' ? 'rgba(2,132,199,0.08)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {theme === 'classic' && (
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'var(--b)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: '700',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>ACTIF</span>
                )}
                {/* Miniature classique */}
                <div style={{
                  background: '#f0f4f8', borderRadius: '8px',
                  padding: '10px', marginBottom: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ background: '#1e293b', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#e2e8f0', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#e2e8f0', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={16} style={{ color: 'var(--b)' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Classique</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Fond blanc, sobre et professionnel</p>
              </div>

              {/* Card Sombre Sobre */}
              <div
                onClick={() => applyTheme('dark-sober')}
                style={{
                  cursor: 'pointer',
                  borderRadius: '14px',
                  border: `2px solid ${theme === 'dark-sober' ? 'var(--b)' : 'var(--border)'}`,
                  padding: '20px',
                  background: theme === 'dark-sober' ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {theme === 'dark-sober' && (
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'var(--b)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: '700',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>ACTIF</span>
                )}
                {/* Miniature sombre sobre */}
                <div style={{
                  background: '#0f172a', borderRadius: '8px',
                  padding: '10px', marginBottom: '12px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ background: '#334155', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#1e293b', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px', border: '1px solid #334155' }} />
                  <div style={{ background: '#1e293b', height: '4px', borderRadius: '2px', width: '55%', border: '1px solid #334155' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={16} style={{ color: 'var(--muted)' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Sombre Sobre</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Dark sans animations ni effets</p>
              </div>

              {/* Card Moderne */}
              <div
                onClick={() => applyTheme('modern')}
                style={{
                  cursor: 'pointer',
                  borderRadius: '14px',
                  border: `2px solid ${theme === 'modern' ? 'var(--b)' : 'var(--border)'}`,
                  padding: '20px',
                  background: theme === 'modern' ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {theme === 'modern' && (
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'var(--b)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: '700',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>ACTIF</span>
                )}
                {/* Miniature moderne */}
                <div style={{
                  background: 'linear-gradient(135deg, #0b1220, #0f172a)',
                  borderRadius: '8px',
                  padding: '10px', marginBottom: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ background: 'linear-gradient(90deg, #38bdf8, #22c55e)', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: 'rgba(255,255,255,0.15)', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={16} style={{ color: 'var(--b)' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Moderne</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Dark glassmorphism, animations</p>
              </div>

              {/* Card Océan Doux */}
              <div
                onClick={() => applyTheme('light-ocean')}
                style={{
                  cursor: 'pointer', borderRadius: '14px', position: 'relative', overflow: 'hidden', padding: '20px', transition: 'all 0.25s',
                  border: `2px solid ${theme === 'light-ocean' ? 'var(--b)' : 'var(--border)'}`,
                  background: theme === 'light-ocean' ? 'rgba(2,132,199,0.08)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {theme === 'light-ocean' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--b)', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>ACTIF</span>}
                <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #bae6fd' }}>
                  <div style={{ background: '#0284c7', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#e0f2fe', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#e0f2fe', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={16} style={{ color: '#0284c7' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Océan Doux</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Bleu clair, apaisant et corporatif</p>
              </div>

              {/* Card Amoled Pur */}
              <div
                onClick={() => applyTheme('dark-amoled')}
                style={{
                  cursor: 'pointer', borderRadius: '14px', position: 'relative', overflow: 'hidden', padding: '20px', transition: 'all 0.25s',
                  border: `2px solid ${theme === 'dark-amoled' ? 'var(--b)' : 'var(--border)'}`,
                  background: theme === 'dark-amoled' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {theme === 'dark-amoled' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--b)', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>ACTIF</span>}
                <div style={{ background: '#000000', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #262626' }}>
                  <div style={{ background: '#3b82f6', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#171717', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#171717', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Amoled Pur</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Noir total, contraste maximal (OLED)</p>
              </div>

              {/* Card Nature / Émeraude */}
              <div
                onClick={() => applyTheme('dark-forest')}
                style={{
                  cursor: 'pointer', borderRadius: '14px', position: 'relative', overflow: 'hidden', padding: '20px', transition: 'all 0.25s',
                  border: `2px solid ${theme === 'dark-forest' ? '#10b981' : 'var(--border)'}`,
                  background: theme === 'dark-forest' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {theme === 'dark-forest' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>ACTIF</span>}
                <div style={{ background: '#064e3b', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #059669' }}>
                  <div style={{ background: '#10b981', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#065f46', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#065f46', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Monitor size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Nature / Forêt</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Vert profond, émeraude et serein</p>
              </div>

              {/* Card Automne / Chaleureux */}
              <div
                onClick={() => applyTheme('light-warm')}
                style={{
                  cursor: 'pointer', borderRadius: '14px', position: 'relative', overflow: 'hidden', padding: '20px', transition: 'all 0.25s',
                  border: `2px solid ${theme === 'light-warm' ? '#d97706' : 'var(--border)'}`,
                  background: theme === 'light-warm' ? 'rgba(217,119,6,0.08)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {theme === 'light-warm' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#d97706', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>ACTIF</span>}
                <div style={{ background: '#fdf6e3', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #eaddc5' }}>
                  <div style={{ background: '#d97706', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#fcf4d9', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#fcf4d9', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={16} style={{ color: '#d97706' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Automne Doux</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Couleurs chaudes, beige, sépia</p>
              </div>

              {/* Card Cyberpunk */}
              <div
                onClick={() => applyTheme('cyberpunk')}
                style={{
                  cursor: 'pointer', borderRadius: '14px', position: 'relative', overflow: 'hidden', padding: '20px', transition: 'all 0.25s',
                  border: `2px solid ${theme === 'cyberpunk' ? '#f43f5e' : 'var(--border)'}`,
                  background: theme === 'cyberpunk' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {theme === 'cyberpunk' && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#f43f5e', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>ACTIF</span>}
                <div style={{ background: '#09090b', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #f43f5e', boxShadow: '0 0 10px rgba(244,63,94,0.3)' }}>
                  <div style={{ background: '#06b6d4', height: '6px', borderRadius: '3px', width: '60%', marginBottom: '6px' }} />
                  <div style={{ background: '#18181b', height: '4px', borderRadius: '2px', width: '80%', marginBottom: '4px' }} />
                  <div style={{ background: '#18181b', height: '4px', borderRadius: '2px', width: '55%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#06b6d4' }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#f8fafc' }}>Cyber Néon</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Extrême, néon rose/cyan, glow</p>
              </div>

            </div>
            </>
            )}
          </div>

          {/* Couleurs des Extras & Relèves */}
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionCouleurs ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>🎨 Couleurs des Extras &amp; Relèves</h3>
              <button
                onClick={() => setShowSectionCouleurs(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionCouleurs ? 'Masquer' : 'Afficher'}
              >
                {showSectionCouleurs ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionCouleurs ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionCouleurs && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Personnalisez les couleurs d'affichage des agents extras et relèves lorsqu'ils sont déployés sur vos sites.
                </p>

            {/* Extras */}
            <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#f59e0b' }}>⭐ Extras</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Fond des cases vides (Extra)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_extra_cell_bg') || '#0f1726'}
                    onChange={(e) => { localStorage.setItem('pontage_extra_cell_bg', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: localStorage.getItem('pontage_extra_cell_bg') || '#0f1726',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: 'var(--muted)'
                  }}>Aperçu case vide</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Couleur du texte "EXT"</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_ext_text_color') || '#ffffff'}
                    onChange={(e) => { localStorage.setItem('pontage_ext_text_color', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.35)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 'bold',
                    color: localStorage.getItem('pontage_ext_text_color') || '#ffffff'
                  }}>EXT</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Fond du nom Agent (Extra)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_extra_name_bg') || '#2a121a'}
                    onChange={(e) => { localStorage.setItem('pontage_extra_name_bg', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: localStorage.getItem('pontage_extra_name_bg') || '#2a121a',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold'
                  }}>Agent Extra</div>
                </div>
              </div>

            </div>

            {/* Relèves */}
            <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#f97316' }}>🔄 Relèves</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Fond des cases vides (Relève)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_releve_cell_bg') || '#1a0810'}
                    onChange={(e) => { localStorage.setItem('pontage_releve_cell_bg', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: localStorage.getItem('pontage_releve_cell_bg') || '#1a0810',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: 'var(--muted)'
                  }}>Aperçu case vide</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Couleur du texte "REL"</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_rel_text_color') || '#ffffff'}
                    onChange={(e) => { localStorage.setItem('pontage_rel_text_color', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.35)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 'bold',
                    color: localStorage.getItem('pontage_rel_text_color') || '#ffffff'
                  }}>REL</div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Fond du nom Agent (Relève)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={localStorage.getItem('pontage_releve_name_bg') || '#2a121a'}
                    onChange={(e) => { localStorage.setItem('pontage_releve_name_bg', e.target.value); setTheme(t => t); }}
                    style={{ width: '48px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <div style={{
                    flex: 1, height: '36px', borderRadius: '8px',
                    background: localStorage.getItem('pontage_releve_name_bg') || '#2a121a',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: '#f97316', fontWeight: 'bold'
                  }}>Agent Relève</div>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                💡 Les modifications sont appliquées instantanément. Retournez sur votre site pour voir le résultat.
              </p>
              <button className="btn btn-secondary" onClick={handleResetColors} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Réinitialiser par défaut
              </button>
            </div>
              </>
            )}
          </div>
          {/* Taille des Cartes de Statistiques */}
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionCards ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>📊 Cartes de Statistiques</h3>
              <button
                onClick={() => setShowSectionCards(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionCards ? 'Masquer' : 'Afficher'}
              >
                {showSectionCards ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionCards ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionCards && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Ajustez la taille des cartes affichées en haut du tableau de bord (Secteurs, Effectif, Présence, Extras).
                </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Slider taille globale */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  Taille globale des cartes — <strong style={{ color: 'white' }}>{Math.round(statsCardSize * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.5" max="1.5" step="0.05"
                  value={statsCardSize}
                  onChange={(e) => applyStatsCardSize(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--b)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px' }}>
                  <span>Très petite (50%)</span>
                  <span>Normale (100%)</span>
                  <span>Grande (150%)</span>
                </div>
              </div>

              {/* Aperçu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(56,189,248,0.03))',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${6 * statsCardSize}px`,
                  padding: `${8 * statsCardSize}px`,
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    background: 'rgba(56,189,248,0.15)',
                    borderRadius: '8px',
                    padding: `${6 * statsCardSize}px`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: `${14 * statsCardSize}px`, color: 'var(--b)' }}>📊</span>
                  </div>
                  <div>
                    <p style={{ fontSize: `${0.68 * statsCardSize}rem`, color: 'var(--muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Aperçu Carte</p>
                    <p style={{ fontSize: `${1.1 * statsCardSize}rem`, fontWeight: 800, color: 'white', margin: '1px 0 0 0' }}>42</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                💡 Les modifications sont appliquées instantanément sur le tableau de bord.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => applyStatsCardSize(1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={16} /> Réinitialiser
                </button>
                <button
                  className={`btn ${savedStatsSize ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleSaveStatsSize}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  <span>{savedStatsSize ? '✓ Sauvegardé !' : 'Sauvegarder'}</span>
                </button>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Mode d'affichage des sites spéciaux */}
          <div className="glass-panel" style={{ marginTop: '24px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionModes ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>⚙️ Comportement des Sites Spéciaux</h3>
              <button
                onClick={() => setShowSectionModes(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionModes ? 'Masquer' : 'Afficher'}
              >
                {showSectionModes ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionModes ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionModes && (
              <>
                <p className="subtitle" style={{ marginBottom: '20px' }}>
                  Personnalisez la façon dont les agents sont organisés dans les viviers spéciaux. 
                  <br />- <b>Option A (Libre)</b> : Tableaux par Postes (autorise la création manuelle de "Zones" pour structurer).
                  <br />- <b>Option B (Automatique)</b> : 1 Tableau par Agent (le système isole visuellement chaque agent).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  
                  {/* Administration */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>🏢 Administration</h4>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ position: 'relative' }}>
                          <input type="checkbox" checked={activeAdmin} onChange={(e) => toggleActiveAdmin(e.target.checked)} style={{ srOnly: true, opacity: 0, position: 'absolute' }} />
                          <div style={{ width: '36px', height: '20px', background: activeAdmin ? 'var(--b)' : 'var(--border)', borderRadius: '10px', transition: 'all 0.2s', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2px', left: activeAdmin ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: activeAdmin ? 'var(--b)' : 'var(--muted)' }}>{activeAdmin ? 'ON' : 'OFF'}</span>
                      </label>
                    </div>
                    
                    {activeAdmin && (
                      <>
                        <select 
                          value={modeAdmin} 
                          onChange={(e) => applyModeAdmin(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border)', marginBottom: '12px' }}
                        >
                          <option value="grouped" style={{ background: '#0f172a', color: 'white' }}>Classique (Tableau unique)</option>
                          <option value="manual_zones" style={{ background: '#0f172a', color: 'white' }}>Option A : Création de Zones</option>
                          <option value="auto_individual" style={{ background: '#0f172a', color: 'white' }}>Option B : 1 Tableau par Agent</option>
                        </select>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={(e) => {
                             const btn = e.currentTarget;
                             const orig = btn.innerHTML;
                             btn.innerHTML = '✓ Sauvegardé !';
                             btn.className = 'btn btn-success';
                             setTimeout(() => { btn.innerHTML = orig; btn.className = 'btn btn-primary'; }, 2000);
                          }}
                        >
                           <Save size={14} /> Sauvegarder
                        </button>
                      </>
                    )}
                  </div>

                  {/* Extras */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '1rem', margin: 0, color: '#f59e0b' }}>⭐ Extras</h4>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ position: 'relative' }}>
                          <input type="checkbox" checked={activeExtras} onChange={(e) => toggleActiveExtras(e.target.checked)} style={{ srOnly: true, opacity: 0, position: 'absolute' }} />
                          <div style={{ width: '36px', height: '20px', background: activeExtras ? 'var(--b)' : 'var(--border)', borderRadius: '10px', transition: 'all 0.2s', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2px', left: activeExtras ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: activeExtras ? 'var(--b)' : 'var(--muted)' }}>{activeExtras ? 'ON' : 'OFF'}</span>
                      </label>
                    </div>

                    {activeExtras && (
                      <>
                        <select 
                          value={modeExtras} 
                          onChange={(e) => applyModeExtras(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border)', marginBottom: '12px' }}
                        >
                          <option value="grouped" style={{ background: '#0f172a', color: 'white' }}>Classique (Tableau unique)</option>
                          <option value="manual_zones" style={{ background: '#0f172a', color: 'white' }}>Option A : Création de Zones</option>
                          <option value="auto_individual" style={{ background: '#0f172a', color: 'white' }}>Option B : 1 Tableau par Agent</option>
                        </select>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={(e) => {
                             const btn = e.currentTarget;
                             const orig = btn.innerHTML;
                             btn.innerHTML = '✓ Sauvegardé !';
                             btn.className = 'btn btn-success';
                             setTimeout(() => { btn.innerHTML = orig; btn.className = 'btn btn-primary'; }, 2000);
                          }}
                        >
                           <Save size={14} /> Sauvegarder
                        </button>
                      </>
                    )}
                  </div>

                  {/* Relèves */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '1rem', margin: 0, color: '#f97316' }}>🔄 Relèves</h4>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ position: 'relative' }}>
                          <input type="checkbox" checked={activeReleves} onChange={(e) => toggleActiveReleves(e.target.checked)} style={{ srOnly: true, opacity: 0, position: 'absolute' }} />
                          <div style={{ width: '36px', height: '20px', background: activeReleves ? 'var(--b)' : 'var(--border)', borderRadius: '10px', transition: 'all 0.2s', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2px', left: activeReleves ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: activeReleves ? 'var(--b)' : 'var(--muted)' }}>{activeReleves ? 'ON' : 'OFF'}</span>
                      </label>
                    </div>

                    {activeReleves && (
                      <>
                        <select 
                          value={modeReleves} 
                          onChange={(e) => applyModeReleves(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border)', marginBottom: '12px' }}
                        >
                          <option value="grouped" style={{ background: '#0f172a', color: 'white' }}>Classique (Tableau unique)</option>
                          <option value="manual_zones" style={{ background: '#0f172a', color: 'white' }}>Option A : Création de Zones</option>
                          <option value="auto_individual" style={{ background: '#0f172a', color: 'white' }}>Option B : 1 Tableau par Agent</option>
                        </select>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={(e) => {
                             const btn = e.currentTarget;
                             const orig = btn.innerHTML;
                             btn.innerHTML = '✓ Sauvegardé !';
                             btn.className = 'btn btn-success';
                             setTimeout(() => { btn.innerHTML = orig; btn.className = 'btn btn-primary'; }, 2000);
                          }}
                        >
                           <Save size={14} /> Sauvegarder
                        </button>
                      </>
                    )}
                  </div>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                    💡 Les modifications prennent effet immédiatement lorsque vous retournez sur "Mes Sites".
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
