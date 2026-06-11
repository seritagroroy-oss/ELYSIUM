import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Settings, Plus, Trash, Save, Loader2, Monitor, Sun, Sparkles, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Bell, FileSpreadsheet, Users, SortAsc } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isRH = user?.workspace_type === 'RH';
  const isComptable = user?.workspace_type === 'COMPTABLE';
  const isSecretariat = user?.workspace_type === 'SECRETARIAT';

  const [cycleStart, setCycleStart] = useState(21);
  const [cycleEnd, setCycleEnd] = useState(20);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedCycle, setSavedCycle] = useState(false);
  const [savedFuncs, setSavedFuncs] = useState(false);
  const [newFuncId, setNewFuncId] = useState('');
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncSalary, setNewFuncSalary] = useState('');
  const [salaryConfig, setSalaryConfig] = useState({});
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
  const [showSectionRH, setShowSectionRH] = useState(false);
  const [showSectionComptable, setShowSectionComptable] = useState(false);

  // Comptable-specific preferences
  const [comptTaxMode, setComptTaxMode] = useState(() => localStorage.getItem('pontage_compt_tax_mode') || 'simplifie');
  const [comptCnpsSalarial, setComptCnpsSalarial] = useState(() => parseFloat(localStorage.getItem('pontage_compt_cnps_sal') || '6.3'));
  const [comptCnpsPatronal, setComptCnpsPatronal] = useState(() => parseFloat(localStorage.getItem('pontage_compt_cnps_pat') || '7.7'));
  const [comptExportFormat, setComptExportFormat] = useState(() => localStorage.getItem('pontage_compt_export') || 'excel');
  const [comptFiscalYear, setComptFiscalYear] = useState(() => localStorage.getItem('pontage_compt_fiscal_year') || 'jan');
  const [comptAutoCalc, setComptAutoCalc] = useState(() => localStorage.getItem('pontage_compt_auto_calc') !== 'false');

  // Cat 1: Paie & Calculs
  const [comptHsJour, setComptHsJour] = useState(() => parseInt(localStorage.getItem('pontage_compt_hs_jour') || '15'));
  const [comptHsNuit, setComptHsNuit] = useState(() => parseInt(localStorage.getItem('pontage_compt_hs_nuit') || '50'));
  const [comptHsDimanche, setComptHsDimanche] = useState(() => parseInt(localStorage.getItem('pontage_compt_hs_dim') || '75'));
  const [comptHsFerie, setComptHsFerie] = useState(() => parseInt(localStorage.getItem('pontage_compt_hs_ferie') || '100'));
  const [comptPrimeAnciennete, setComptPrimeAnciennete] = useState(() => localStorage.getItem('pontage_compt_prime_anc') !== 'false');
  const [comptSeuilMinimal, setComptSeuilMinimal] = useState(() => parseInt(localStorage.getItem('pontage_compt_seuil_min') || '60000'));
  const [comptJourVirement, setComptJourVirement] = useState(() => parseInt(localStorage.getItem('pontage_compt_jour_vir') || '25'));

  // Cat 2: Alertes Comptables
  const [comptAlerteVariationMasse, setComptAlerteVariationMasse] = useState(() => parseInt(localStorage.getItem('pontage_compt_alerte_var_masse') || '10'));
  const [comptAlerteSansRib, setComptAlerteSansRib] = useState(() => localStorage.getItem('pontage_compt_alerte_rib') !== 'false');
  const [comptAlerteInfSmig, setComptAlerteInfSmig] = useState(() => localStorage.getItem('pontage_compt_alerte_smig') !== 'false');

  // Cat 3: Bulletins de Paie
  const [comptEnteteBulletin, setComptEnteteBulletin] = useState(() => localStorage.getItem('pontage_compt_entete') || 'Elysium Sécurité CI');
  const [comptMentionLegale, setComptMentionLegale] = useState(() => localStorage.getItem('pontage_compt_mention') || 'Document Confidentiel');
  const [comptFormatNum, setComptFormatNum] = useState(() => localStorage.getItem('pontage_compt_format_num') || 'ELYS-YYYY-XXXX');
  const [comptHideLignesVides, setComptHideLignesVides] = useState(() => localStorage.getItem('pontage_compt_hide_vides') !== 'false');

  // Cat 4: Tableau de Bord Comptable
  const [comptComparePeriod, setComptComparePeriod] = useState(() => localStorage.getItem('pontage_compt_compare') || 'prev_month');
  const [comptModeConfidentiel, setComptModeConfidentiel] = useState(() => localStorage.getItem('pontage_compt_confid') === 'true');
  const [comptDevise, setComptDevise] = useState(() => localStorage.getItem('pontage_compt_devise') || 'XOF');

  const [savedCompt, setSavedCompt] = useState(false);

  // RH-specific preferences
  const [rhAlertContract, setRhAlertContract] = useState(() => parseInt(localStorage.getItem('pontage_rh_alert_contract') || '15'));
  const [rhAlertAbsence, setRhAlertAbsence] = useState(() => parseInt(localStorage.getItem('pontage_rh_alert_absence') || '3'));
  const [rhExportFormat, setRhExportFormat] = useState(() => localStorage.getItem('pontage_rh_export_format') || 'excel');
  const [rhExportFull, setRhExportFull] = useState(() => localStorage.getItem('pontage_rh_export_full') !== 'false');
  const [rhSortOrder, setRhSortOrder] = useState(() => localStorage.getItem('pontage_rh_sort_order') || 'name');
  const [rhHideInactive, setRhHideInactive] = useState(() => localStorage.getItem('pontage_rh_hide_inactive') === 'true');
  const [savedRH, setSavedRH] = useState(false);

  // Secretariat-specific preferences
  const [secAutoCheckout, setSecAutoCheckout] = useState(() => localStorage.getItem('pontage_sec_auto_checkout') || '19:00');
  const [secBadgeMax, setSecBadgeMax] = useState(() => parseInt(localStorage.getItem('pontage_sec_badge_max') || '50'));
  const [secAlertColis, setSecAlertColis] = useState(() => localStorage.getItem('pontage_sec_alert_colis') !== 'false');
  const [secRoomDuration, setSecRoomDuration] = useState(() => parseInt(localStorage.getItem('pontage_sec_room_duration') || '60'));
  const [savedSec, setSavedSec] = useState(false);
  const [showSectionSecretariat, setShowSectionSecretariat] = useState(false);

  const handleSaveSecPrefs = () => {
    localStorage.setItem('pontage_sec_auto_checkout', secAutoCheckout);
    localStorage.setItem('pontage_sec_badge_max', String(secBadgeMax));
    localStorage.setItem('pontage_sec_alert_colis', String(secAlertColis));
    localStorage.setItem('pontage_sec_room_duration', String(secRoomDuration));
    window.dispatchEvent(new Event('pontage_sec_prefs_changed'));
    setSavedSec(true);
    setTimeout(() => setSavedSec(false), 3000);
  };

  const handleSaveComptPrefs = () => {
    localStorage.setItem('pontage_compt_tax_mode', comptTaxMode);
    localStorage.setItem('pontage_compt_cnps_sal', String(comptCnpsSalarial));
    localStorage.setItem('pontage_compt_cnps_pat', String(comptCnpsPatronal));
    localStorage.setItem('pontage_compt_export', comptExportFormat);
    localStorage.setItem('pontage_compt_fiscal_year', comptFiscalYear);
    localStorage.setItem('pontage_compt_auto_calc', String(comptAutoCalc));

    localStorage.setItem('pontage_compt_hs_jour', String(comptHsJour));
    localStorage.setItem('pontage_compt_hs_nuit', String(comptHsNuit));
    localStorage.setItem('pontage_compt_hs_dim', String(comptHsDimanche));
    localStorage.setItem('pontage_compt_hs_ferie', String(comptHsFerie));
    localStorage.setItem('pontage_compt_prime_anc', String(comptPrimeAnciennete));
    localStorage.setItem('pontage_compt_seuil_min', String(comptSeuilMinimal));
    localStorage.setItem('pontage_compt_jour_vir', String(comptJourVirement));

    localStorage.setItem('pontage_compt_alerte_var_masse', String(comptAlerteVariationMasse));
    localStorage.setItem('pontage_compt_alerte_rib', String(comptAlerteSansRib));
    localStorage.setItem('pontage_compt_alerte_smig', String(comptAlerteInfSmig));

    localStorage.setItem('pontage_compt_entete', comptEnteteBulletin);
    localStorage.setItem('pontage_compt_mention', comptMentionLegale);
    localStorage.setItem('pontage_compt_format_num', comptFormatNum);
    localStorage.setItem('pontage_compt_hide_vides', String(comptHideLignesVides));

    localStorage.setItem('pontage_compt_compare', comptComparePeriod);
    localStorage.setItem('pontage_compt_confid', String(comptModeConfidentiel));
    localStorage.setItem('pontage_compt_devise', comptDevise);

    window.dispatchEvent(new Event('pontage_compt_prefs_changed'));
    setSavedCompt(true);
    setTimeout(() => setSavedCompt(false), 3000);
  };

  const handleSaveRHPrefs = () => {
    localStorage.setItem('pontage_rh_alert_contract', String(rhAlertContract));
    localStorage.setItem('pontage_rh_alert_absence', String(rhAlertAbsence));
    localStorage.setItem('pontage_rh_export_format', rhExportFormat);
    localStorage.setItem('pontage_rh_export_full', String(rhExportFull));
    localStorage.setItem('pontage_rh_sort_order', rhSortOrder);
    localStorage.setItem('pontage_rh_hide_inactive', String(rhHideInactive));
    window.dispatchEvent(new Event('pontage_rh_prefs_changed'));
    setSavedRH(true);
    setTimeout(() => setSavedRH(false), 3000);
  };

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
      const [settings, funcs, salCfg] = await Promise.all([
        apiCall('get_settings', {}, 'GET'),
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_salary_config', {}, 'GET')
      ]);
      if (settings && settings.cycle_start) {
        setCycleStart(settings.cycle_start);
        setCycleEnd(settings.cycle_end);
      }
      if (Array.isArray(funcs)) {
        setFunctions(funcs);
      }
      if (salCfg && typeof salCfg === 'object') {
        setSalaryConfig(salCfg);
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

  const handleAddFunction = async () => {
    if (!newFuncId.trim() || !newFuncName.trim()) return;
    const newFunc = { id: newFuncId.toUpperCase().trim(), name: newFuncName.trim() };
    const updated = [...functions, newFunc];
    setFunctions(updated);

    // Update salary_config with the new function's salary
    const salary = parseInt(newFuncSalary) || 75000;
    const updatedSalaryConfig = { ...salaryConfig, [newFunc.id]: salary };
    setSalaryConfig(updatedSalaryConfig);

    setNewFuncId('');
    setNewFuncName('');
    setNewFuncSalary('');
    // Auto-save immediately to backend
    try {
      const [res1, res2] = await Promise.all([
        apiCall('save_functions', { functions: updated }),
        apiCall('save_salary_grid', { grid: updatedSalaryConfig })
      ]);
      if (res1.success && res2.success) {
        setSavedFuncs(true);
        setTimeout(() => setSavedFuncs(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFunction = async (id) => {
    const updated = functions.filter(f => f.id !== id);
    setFunctions(updated);
    // Auto-save immediately to backend
    try {
      await apiCall('save_functions', { functions: updated });
    } catch (e) {
      console.error(e);
    }
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
          {/* === SECTION RH UNIQUEMENT === */}
          {isRH && (
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionRH ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>⚙️ Préférences de l'Espace RH</h3>
              <button
                onClick={() => setShowSectionRH(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionRH ? 'Masquer' : 'Afficher'}
              >
                {showSectionRH ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionRH ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionRH && (
              <>
                <p className="subtitle" style={{ marginBottom: '24px' }}>
                  Configurez les alertes, le format d'export et l'affichage du personnel pour votre espace RH.
                </p>

                {/* ---- 1. Alertes & Notifications ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: 'var(--a)', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} /> Alertes & Notifications</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>🔔 Alerte fin de contrat (jours avant échéance)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="range" min="5" max="90" step="5" value={rhAlertContract}
                          onChange={(e) => setRhAlertContract(parseInt(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--b)' }}
                        />
                        <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', minWidth: '60px', textAlign: 'center' }}>{rhAlertContract} j</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Vous serez alerté {rhAlertContract} jours avant l'expiration d'un contrat CDD ou période d'essai.</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>⚠️ Seuil d'alerte absentéisme (jours / mois)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="range" min="1" max="15" step="1" value={rhAlertAbsence}
                          onChange={(e) => setRhAlertAbsence(parseInt(e.target.value))}
                          style={{ flex: 1, accentColor: '#f59e0b' }}
                        />
                        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700', minWidth: '60px', textAlign: 'center' }}>{rhAlertAbsence} j</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Un agent dépassant {rhAlertAbsence} jours d'absence sur le mois sera signalé.</p>
                    </div>
                  </div>
                </div>

                {/* ---- 2. Format & Préférences d'Export ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: 'var(--a)', display: 'flex', alignItems: 'center', gap: '8px' }}><FileSpreadsheet size={18} /> Format & Préférences d'Export</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>Format d'export par défaut</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[{id: 'excel', label: '📊 Excel (.xlsx)', color: '#10b981'}, {id: 'csv', label: '📄 CSV (.csv)', color: '#38bdf8'}, {id: 'pdf', label: '📑 PDF', color: '#a78bfa'}].map(fmt => (
                          <button
                            key={fmt.id}
                            onClick={() => setRhExportFormat(fmt.id)}
                            style={{
                              flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                              background: rhExportFormat === fmt.id ? `${fmt.color}22` : 'rgba(255,255,255,0.03)',
                              border: `2px solid ${rhExportFormat === fmt.id ? fmt.color : 'var(--border)'}`,
                              color: rhExportFormat === fmt.id ? fmt.color : 'var(--muted)',
                              fontSize: '0.85rem', fontWeight: rhExportFormat === fmt.id ? '700' : '400'
                            }}
                          >{fmt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>Contenu de l'export</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setRhExportFull(true)}
                          style={{
                            flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: rhExportFull ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${rhExportFull ? '#10b981' : 'var(--border)'}`,
                            color: rhExportFull ? '#10b981' : 'var(--muted)',
                            fontSize: '0.85rem', fontWeight: rhExportFull ? '700' : '400'
                          }}
                        >📋 Complet</button>
                        <button
                          onClick={() => setRhExportFull(false)}
                          style={{
                            flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: !rhExportFull ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${!rhExportFull ? '#38bdf8' : 'var(--border)'}`,
                            color: !rhExportFull ? '#38bdf8' : 'var(--muted)',
                            fontSize: '0.85rem', fontWeight: !rhExportFull ? '700' : '400'
                          }}
                        >📝 Simplifié</button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>{rhExportFull ? 'Toutes les colonnes seront incluses dans l\'export.' : 'Seules les colonnes essentielles (Nom, Fonction, Site, Salaire) seront exportées.'}</p>
                    </div>
                  </div>
                </div>

                {/* ---- 3. Affichage du Personnel ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: 'var(--a)', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} /> Affichage du Personnel</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}><SortAsc size={14} style={{ display: 'inline', marginRight: '6px' }}/>Tri par défaut du vivier</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[{id: 'name', label: '🔤 Par nom (A → Z)'}, {id: 'function', label: '🏷️ Par poste / fonction'}, {id: 'date', label: '📅 Par date d\'embauche'}].map(opt => (
                          <label
                            key={opt.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                              background: rhSortOrder === opt.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${rhSortOrder === opt.id ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.05)'}`,
                            }}
                          >
                            <input type="radio" name="rhSortOrder" value={opt.id} checked={rhSortOrder === opt.id} onChange={() => setRhSortOrder(opt.id)} style={{ accentColor: 'var(--b)' }} />
                            <span style={{ color: rhSortOrder === opt.id ? 'white' : 'var(--muted)', fontSize: '0.9rem' }}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>Visibilité des agents inactifs</label>
                      <div
                        onClick={() => setRhHideInactive(!rhHideInactive)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                          background: rhHideInactive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                          border: `1px solid ${rhHideInactive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        }}
                      >
                        <div>
                          <span style={{ display: 'block', color: 'white', fontSize: '0.95rem', fontWeight: '600' }}>{rhHideInactive ? 'Agents inactifs masqués' : 'Tous les agents visibles'}</span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>{rhHideInactive ? 'Les agents dont le contrat est expiré ou suspendu ne s\'afficheront pas.' : 'Tous les agents apparaissent, y compris les inactifs.'}</span>
                        </div>
                        <div style={{
                          width: '48px', height: '26px', borderRadius: '13px', padding: '3px', cursor: 'pointer', transition: 'all 0.3s',
                          background: rhHideInactive ? '#ef4444' : '#10b981',
                        }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s',
                            transform: rhHideInactive ? 'translateX(22px)' : 'translateX(0)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px', fontStyle: 'italic' }}>💡 Un agent est considéré "inactif" si son contrat est arrivé à échéance ou s'il a été marqué comme sorti.</p>
                    </div>
                  </div>
                </div>

                {/* Bouton Sauvegarder */}
                {isAdmin && (
                  <button
                    className={`btn ${savedRH ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleSaveRHPrefs}
                    style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={16} />
                    <span>{savedRH ? '✓ Préférences RH sauvegardées !' : 'Sauvegarder les Préférences RH'}</span>
                  </button>
                )}
              </>
            )}
          </div>
          )}

          {/* === SECTION SECRÉTARIAT UNIQUEMENT === */}
          {isSecretariat && (
          <div className="glass-panel" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionSecretariat ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>⚙️ Préférences Secrétariat & Accueil</h3>
              <button
                onClick={() => setShowSectionSecretariat(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
                title={showSectionSecretariat ? 'Masquer' : 'Afficher'}
              >
                {showSectionSecretariat ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionSecretariat ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionSecretariat && (
              <>
                <p className="subtitle" style={{ marginBottom: '24px' }}>
                  Configurez les règles de la réception, de l'annuaire et de la gestion du courrier.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>⏰ Heure de Check-out automatique</label>
                    <input
                      type="time" className="form-input"
                      value={secAutoCheckout}
                      onChange={(e) => setSecAutoCheckout(e.target.value)}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Les visiteurs n'ayant pas pointé leur départ seront automatiquement marqués partis à cette heure.</p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>🎫 Nombre Max de Badges Visiteurs</label>
                    <input
                      type="number" className="form-input" min="1" max="500"
                      value={secBadgeMax}
                      onChange={(e) => setSecBadgeMax(parseInt(e.target.value))}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Le nombre de badges physiques disponibles à l'accueil pour les visiteurs.</p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>📦 Notifications de Colis</label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ position: 'relative' }}>
                          <input type="checkbox" checked={secAlertColis} onChange={(e) => setSecAlertColis(e.target.checked)} style={{ srOnly: true, opacity: 0, position: 'absolute' }} />
                          <div style={{ width: '36px', height: '20px', background: secAlertColis ? 'var(--b)' : 'var(--border)', borderRadius: '10px', transition: 'all 0.2s', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2px', left: secAlertColis ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                          </div>
                        </div>
                      </label>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>Avertir automatiquement le destinataire lorsqu'un courrier/colis est réceptionné.</p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>⏱️ Durée standard d'une réservation de salle</label>
                    <select
                      className="form-input"
                      value={secRoomDuration}
                      onChange={(e) => setSecRoomDuration(parseInt(e.target.value))}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1h 30mins</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>
                </div>

                <button
                  className={`btn ${savedSec ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleSaveSecPrefs}
                  style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  <span>{savedSec ? '✓ Préférences sauvegardées !' : 'Sauvegarder les Préférences'}</span>
                </button>
              </>
            )}
          </div>
          )}

          {/* Cycle de Paie */}
          {!isRH && !isSecretariat && (
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
          )}


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

          {/* === SECTION COMPTABILITÉ UNIQUEMENT === */}
          {isComptable && (
          <div className="glass-panel" style={{ marginTop: '24px', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSectionComptable ? '8px' : 0 }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>🧮 Préférences de l'Espace Comptabilité</h3>
              <button
                onClick={() => setShowSectionComptable(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px' }}
              >
                {showSectionComptable ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSectionComptable ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>
            {showSectionComptable && (
              <>
                <p className="subtitle" style={{ marginBottom: '24px' }}>
                  Configurez les paramètres de calcul de paie, les taux sociaux et les préférences d'export pour votre espace comptabilité.
                </p>

                {/* ---- 1. Mode de Calcul Fiscal ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>📐 Mode de Calcul Fiscal</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>Régime fiscal par défaut</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'simplifie', label: '⚡ ITS Simplifié (1.2%)', desc: 'Calcul rapide, taux forfaitaire' },
                          { id: 'reel_ci', label: '🏛️ IGR Réel Côte d\'Ivoire', desc: 'Barème progressif IS+CN+IGR' }
                        ].map(opt => (
                          <label key={opt.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: comptTaxMode === opt.id ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${comptTaxMode === opt.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)'}`,
                          }}>
                            <input type="radio" name="comptTaxMode" value={opt.id} checked={comptTaxMode === opt.id} onChange={() => setComptTaxMode(opt.id)} style={{ accentColor: '#22c55e', marginTop: '2px' }} />
                            <div>
                              <span style={{ color: comptTaxMode === opt.id ? 'white' : 'var(--muted)', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{opt.label}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{opt.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>🗓️ Début de l'exercice fiscal</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[
                          { id: 'jan', label: 'Janvier' }, { id: 'avr', label: 'Avril' },
                          { id: 'jul', label: 'Juillet' }, { id: 'oct', label: 'Octobre' }
                        ].map(m => (
                          <button key={m.id} onClick={() => setComptFiscalYear(m.id)} style={{
                            flex: '1 1 calc(50% - 6px)', padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: comptFiscalYear === m.id ? 700 : 400,
                            background: comptFiscalYear === m.id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${comptFiscalYear === m.id ? '#22c55e' : 'var(--border)'}`,
                            color: comptFiscalYear === m.id ? '#22c55e' : 'var(--muted)'
                          }}>{m.label}</button>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '10px', fontStyle: 'italic' }}>Utilisé pour les rapports DISA et bilans annuels.</p>
                    </div>
                  </div>
                </div>

                {/* ---- 2. Paie & Calculs ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>💰 Paie & Calculs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>⏱️ Taux Heures Supplémentaires (%)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', width: '70px', color: 'var(--muted)' }}>Jour</span>
                          <input type="range" min="0" max="50" step="5" value={comptHsJour} onChange={e => setComptHsJour(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#22c55e' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px' }}>+{comptHsJour}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', width: '70px', color: 'var(--muted)' }}>Nuit</span>
                          <input type="range" min="0" max="100" step="5" value={comptHsNuit} onChange={e => setComptHsNuit(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#22c55e' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px' }}>+{comptHsNuit}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', width: '70px', color: 'var(--muted)' }}>Dimanche</span>
                          <input type="range" min="0" max="150" step="5" value={comptHsDimanche} onChange={e => setComptHsDimanche(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#22c55e' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px' }}>+{comptHsDimanche}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', width: '70px', color: 'var(--muted)' }}>Férié</span>
                          <input type="range" min="0" max="200" step="5" value={comptHsFerie} onChange={e => setComptHsFerie(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#22c55e' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '40px' }}>+{comptHsFerie}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>👴 Prime d'ancienneté</label>
                        <div onClick={() => setComptPrimeAnciennete(!comptPrimeAnciennete)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                          <span style={{ fontSize: '0.9rem', color: comptPrimeAnciennete ? 'white' : 'var(--muted)' }}>{comptPrimeAnciennete ? 'Activée (+2%/an)' : 'Désactivée'}</span>
                          <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: comptPrimeAnciennete ? '#22c55e' : 'var(--border)', padding: '2px' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptPrimeAnciennete ? 'translateX(18px)' : 'translateX(0)' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>💸 Seuil minimal de versement</label>
                        <input type="number" className="form-input" value={comptSeuilMinimal} onChange={e => setComptSeuilMinimal(parseInt(e.target.value) || 0)} style={{ width: '100%', marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Alerte si net &lt; {comptSeuilMinimal} XOF</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>📆 Jour de virement</label>
                        <input type="number" min="1" max="31" className="form-input" value={comptJourVirement} onChange={e => setComptJourVirement(parseInt(e.target.value) || 1)} style={{ width: '100%', marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Sera le {comptJourVirement} du mois</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- 3. Taux Cotisations Sociales ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>🏦 Taux des Cotisations Sociales (CNPS)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>👤 CNPS Salarial (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="range" min="3" max="15" step="0.1" value={comptCnpsSalarial}
                          onChange={e => setComptCnpsSalarial(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: '#22c55e' }} />
                        <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>{comptCnpsSalarial.toFixed(1)}%</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Taux légal actuel : 6.3%</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>🏢 CNPS Patronal (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="range" min="5" max="20" step="0.1" value={comptCnpsPatronal}
                          onChange={e => setComptCnpsPatronal(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: '#f59e0b' }} />
                        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>{comptCnpsPatronal.toFixed(1)}%</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Taux légal actuel : 7.7%</p>
                    </div>
                  </div>
                </div>

                {/* ---- 4. Alertes Comptables ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>🔔 Alertes Comptables</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>⚠️ Variation Masse Salariale (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="range" min="1" max="50" step="1" value={comptAlerteVariationMasse} onChange={e => setComptAlerteVariationMasse(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#f59e0b' }} />
                        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>±{comptAlerteVariationMasse}%</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Alerte si la masse varie de plus de {comptAlerteVariationMasse}% vs mois N-1.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Alerte Virement sans RIB</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Bloque l'export si RIB manquant</span>
                        </div>
                        <div onClick={() => setComptAlerteSansRib(!comptAlerteSansRib)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: comptAlerteSansRib ? '#f59e0b' : 'var(--border)', padding: '2px', cursor: 'pointer' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptAlerteSansRib ? 'translateX(18px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Alerte salaire &lt; SMIG</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Signale les paies sous 75 000</span>
                        </div>
                        <div onClick={() => setComptAlerteInfSmig(!comptAlerteInfSmig)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: comptAlerteInfSmig ? '#ef4444' : 'var(--border)', padding: '2px', cursor: 'pointer' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptAlerteInfSmig ? 'translateX(18px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- 5. Bulletins de Paie ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>🖨️ Bulletins de Paie</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Entête (Entreprise)</label>
                        <input type="text" className="form-input" value={comptEnteteBulletin} onChange={e => setComptEnteteBulletin(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Mention légale personnalisée</label>
                        <input type="text" className="form-input" value={comptMentionLegale} onChange={e => setComptMentionLegale(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Format numérotation</label>
                        <select className="form-input" value={comptFormatNum} onChange={e => setComptFormatNum(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)' }}>
                          <option value="ELYS-YYYY-XXXX">ELYS-YYYY-XXXX</option>
                          <option value="PAIE-YY-MM-XXX">PAIE-YY-MM-XXX</option>
                          <option value="000XXX">000XXX</option>
                        </select>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Masquer lignes vides</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Cacher les rubriques à 0</span>
                        </div>
                        <div onClick={() => setComptHideLignesVides(!comptHideLignesVides)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: comptHideLignesVides ? '#22c55e' : 'var(--border)', padding: '2px', cursor: 'pointer' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptHideLignesVides ? 'translateX(18px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- 6. Tableau de Bord Comptable ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Tableau de Bord</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Période de comparaison</label>
                      <select className="form-input" value={comptComparePeriod} onChange={e => setComptComparePeriod(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)' }}>
                        <option value="prev_month">Mois précédent</option>
                        <option value="prev_year">Même mois N-1</option>
                        <option value="avg_3m">Moyenne 3 mois</option>
                      </select>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Devise</label>
                      <select className="form-input" value={comptDevise} onChange={e => setComptDevise(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.4)' }}>
                        <option value="XOF">XOF (Franc CFA)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Mode Confidentiel</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Masquer montants (••••)</span>
                        </div>
                        <div onClick={() => setComptModeConfidentiel(!comptModeConfidentiel)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: comptModeConfidentiel ? '#a855f7' : 'var(--border)', padding: '2px', cursor: 'pointer' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptModeConfidentiel ? 'translateX(18px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- 7. Export & Automatisation ---- */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1rem', margin: '0 0 16px 0', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>📤 Export & Automatisation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>Format d'export préféré</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[{id: 'excel', label: '📊 Excel', color: '#10b981'}, {id: 'csv', label: '📄 CSV', color: '#38bdf8'}, {id: 'pdf', label: '📑 PDF', color: '#a78bfa'}].map(fmt => (
                          <button key={fmt.id} onClick={() => setComptExportFormat(fmt.id)} style={{
                            flex: 1, padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: comptExportFormat === fmt.id ? `${fmt.color}22` : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${comptExportFormat === fmt.id ? fmt.color : 'var(--border)'}`,
                            color: comptExportFormat === fmt.id ? fmt.color : 'var(--muted)',
                            fontSize: '0.82rem', fontWeight: comptExportFormat === fmt.id ? 700 : 400
                          }}>{fmt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>🔄 Recalcul automatique</label>
                      <div onClick={() => setComptAutoCalc(!comptAutoCalc)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        background: comptAutoCalc ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.05)',
                        border: `1px solid ${comptAutoCalc ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`
                      }}>
                        <div>
                          <span style={{ display: 'block', color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>{comptAutoCalc ? '✅ Calcul en temps réel' : '⏸️ Calcul manuel'}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>{comptAutoCalc ? 'Les bulletins sont recalculés à chaque modification.' : 'Cliquez sur "Calculer" pour déclencher le calcul.'}</span>
                        </div>
                        <div style={{ width: '48px', height: '26px', borderRadius: '13px', padding: '3px', background: comptAutoCalc ? '#22c55e' : 'var(--border)' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'transform 0.3s', transform: comptAutoCalc ? 'translateX(22px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button className={`btn ${savedCompt ? 'btn-success' : 'btn-primary'}`} onClick={handleSaveComptPrefs}
                    style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', background: savedCompt ? undefined : 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
                    <Save size={16} />
                    <span>{savedCompt ? '✓ Préférences Comptabilité sauvegardées !' : 'Sauvegarder les Préférences Comptabilité'}</span>
                  </button>
                )}
              </>
            )}
          </div>
          )}

          {/* Sections masquées pour l'Espace RH et Comptabilité */}
          {!isRH && !isComptable && !isSecretariat && (
            <>
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
          {/* Sections Apparence toujours disponibles pour la Comptabilité */}
        </>
      )}
    </div>
  );
}
