import React, { useState } from 'react';
import SpecialServiceModal from './SpecialServiceModal';
import HomonymWarningModal from './HomonymWarningModal';
import { Settings } from 'lucide-react';

function SearchableSelect({ options, value, onChange, placeholder }) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (!isOpen) {
      const selectedOpt = options.find(o => o.value === value);
      setSearch(selectedOpt ? selectedOpt.label : '');
    }
  }, [value, options, isOpen]);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        className="form-input"
        style={{ padding: '10px', fontSize: '0.95rem', width: '100%', borderColor: isOpen ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)' }}
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') onChange('');
        }}
        onClick={() => {
          setSearch('');
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', marginTop: '4px' }}>
          <div
            style={{ padding: '8px 12px', cursor: 'pointer', color: '#94a3b8', borderBottom: '1px solid #334155', fontSize: '0.9rem', fontStyle: 'italic' }}
            onMouseDown={() => { onChange(''); setIsOpen(false); }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            -- Repos / Aucun --
          </div>
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <div
              key={opt.value}
              style={{ padding: '8px 12px', cursor: 'pointer', color: '#e2e8f0', borderBottom: '1px solid #334155', fontSize: '0.9rem' }}
              onMouseDown={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(56,189,248,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {opt.label}
            </div>
          )) : (
            <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.9rem' }}>Aucun résultat</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddAgentModal({
  siteData,
  functions,
  allSites,
  globalAgents,
  activeSiteId,
  onClose,
  onSubmit,
  errorMsg,
  period,
  datesList
}) {
  const [name, setName] = useState('');
  const [reposDay, setReposDay] = useState('');
  const [shiftPattern, setShiftPattern] = useState(null);


  const [subsiteId, setSubsiteId] = useState('');
  const [agentFunction, setAgentFunction] = useState('');
  const [shiftType, setShiftType] = useState('Jour');
  const [contractEnd, setContractEnd] = useState('');
  const [isEntrant, setIsEntrant] = useState(false);
  const [entrantDate, setEntrantDate] = useState('');
  const [isDebut, setIsDebut] = useState(false);
  const [debutDate, setDebutDate] = useState('');
  const [ancienSite, setAncienSite] = useState('');
  const [isAdminSchedule, setIsAdminSchedule] = useState(false);
  const [isSpecialService, setIsSpecialService] = useState(false);
  const [specialServiceBase, setSpecialServiceBase] = useState(12);
  const [specialServiceDays, setSpecialServiceDays] = useState([]);
  const [showSpecialServiceModal, setShowSpecialServiceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [disableDefaultRepos, setDisableDefaultRepos] = useState(false);
  const [showHomonymWarningModal, setShowHomonymWarningModal] = useState(false);
  const [hasConfirmedHomonym, setHasConfirmedHomonym] = useState(false);
  
  const [schedule, setSchedule] = useState({
    1: { site_id: '', subsite_id: '' },
    2: { site_id: '', subsite_id: '' },
    3: { site_id: '', subsite_id: '' },
    4: { site_id: '', subsite_id: '' },
    5: { site_id: '', subsite_id: '' },
    6: { site_id: '', subsite_id: '' },
    7: { site_id: '', subsite_id: '' }
  });

  const [isLoading, setIsLoading] = useState(false);

  const formatDateForInput = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = datesList && datesList.length > 0 ? formatDateForInput(datesList[0]) : '';
  const maxDate = datesList && datesList.length > 0 ? formatDateForInput(datesList[datesList.length - 1]) : '';

  const effectiveStartDate = React.useMemo(() => {
    if (isEntrant && entrantDate) {
      const dt = new Date(entrantDate);
      if (!isNaN(dt)) return dt;
    }
    if (isDebut && debutDate) {
      const dt = new Date(debutDate);
      if (!isNaN(dt)) return dt;
    }
    return datesList.length > 0 ? datesList[0] : new Date();
  }, [isEntrant, entrantDate, datesList]);

  const flattenedOptions = React.useMemo(() => {
    const opts = [];
    (allSites || []).forEach(site => {
      if (['site_extras', 'site_releves', 'site_administration'].includes(site.id)) return;
      (site.subsites || []).forEach(sub => {
        if (sub.contract_end_date) {
          const endMonth = sub.contract_end_date.substring(0, 7);
          if (period && endMonth < period) return;
        }
        opts.push({
          value: `${site.id}::${sub.id}`,
          label: `${site.name} — ${sub.name}`
        });
      });
    });
    return opts;
  }, [allSites, period]);

  const executeSubmit = async () => {
    if (isSpecialService) {
      const calculateCycleTotalDays = () => {
        if (!datesList || datesList.length === 0) return 0;
        if (specialServiceDays.length === 0) return 0;

        let count = 0;
        datesList.forEach(dStr => {
          const d = new Date(dStr);
          const jsDay = d.getDay();
          const appDay = jsDay === 0 ? 7 : jsDay;
          if (specialServiceDays.includes(appDay)) {
            count++;
          }
        });
        return count;
      };

      const cycleTotalDays = calculateCycleTotalDays();
      if (specialServiceDays.length === 0) {
        alert("Veuillez sélectionner au moins un jour travaillé dans la semaine pour le Temps Partiel.");
        setShowSpecialServiceModal(true);
        return;
      }
      if (specialServiceBase <= 0) {
        alert("La base jours / mois pour le Temps Partiel doit être supérieure à 0.");
        setShowSpecialServiceModal(true);
        return;
      }
      if (specialServiceBase !== cycleTotalDays) {
        alert(`Incohérence détectée : vous avez configuré une base de ${specialServiceBase} jours alors que cet agent travaillera réellement ${cycleTotalDays} jours sur ce mois. Veuillez corriger ou utiliser l'ajustement automatique.`);
        setShowSpecialServiceModal(true);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      await onSubmit({
        name,
        subsiteId,
        agentFunction,
        shiftType,
        contractEnd,
        isEntrant,
        entrantDate,
        isDebut,
        debutDate,
        ancienSite,
        adminSchedule: isAdminSchedule,
        specialService: isSpecialService,
        specialServiceBase: specialServiceBase,
        specialServiceDays: specialServiceDays,
        disableDefaultRepos: disableDefaultRepos,
        reposDay: shiftPattern ? null : reposDay,
        shiftPattern,
        schedule: activeSiteId === 'site_releves' ? schedule : null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || !subsiteId) return;

    if (existingHomonyms.length > 0 && !hasConfirmedHomonym) {
      setShowHomonymWarningModal(true);
      return;
    }

    await executeSubmit();
  };

  const renderPatternOptions = () => {
    let cycleLen, workDays, shiftDescription;
    if (shiftType === '24h') { cycleLen = 2; workDays = 1; shiftDescription = "1 jour de service (J/N) et 1 jour de repos"; }
    else if (shiftType === '48h') { cycleLen = 4; workDays = 2; shiftDescription = "2 jours de service (J/N) et 2 jours de repos"; }
    else if (shiftType === '72h') { cycleLen = 6; workDays = 3; shiftDescription = "3 jours de service (J/N) et 3 jours de repos"; }
    else { cycleLen = 1; workDays = 1; shiftDescription = `Sa ligne s'affiche en ${shiftType.toLowerCase()}`; }

    const startDay = 21; // Par défaut
    const nextDay = 22;
    const thirdDay = 23;

    if (shiftType === 'Jour' || shiftType === 'Nuit') {
      const days = [
        { label: 'Lundi', value: 1 }, { label: 'Mardi', value: 2 }, { label: 'Mercredi', value: 3 },
        { label: 'Jeudi', value: 4 }, { label: 'Vendredi', value: 5 }, { label: 'Samedi', value: 6 },
        { label: 'Dimanche', value: 0 }
      ];
      return (
        <div className="form-group">
          <label className="form-label">Jour de Repos (Optionnel)</label>
          <select className="form-input" value={reposDay} onChange={e => {
            setReposDay(e.target.value);
            setShiftPattern(null);
          }}>
            <option value="">Aucun repos fixe</option>
            {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      );
    }

    let allowed = [0, 1, workDays, workDays + 1].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);
    if (shiftType === '72h') {
      allowed = [0, 1, 2, workDays, workDays + 1, workDays + 2].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);
    }

    return (
      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
        <label className="form-label" style={{ marginBottom: '10px' }}>Générer le planning (Rotation pour {shiftType})</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {allowed.map(offset => {
            let preview = "";
            for (let i = 0; i < 6; i++) {
                let pos = (i - offset) % cycleLen;
                if (pos < 0) pos += cycleLen;
                preview += (pos < workDays) ? "🟢" : "⚪";
            }
            let desc = "";
            if (shiftType === '48h') {
              if (offset === 0) desc = `Commencer Travail le ${startDay} / Repos le ${thirdDay}`;
              else if (offset === 1) desc = `Commencer Travail le ${nextDay} / Repos le ${thirdDay + 1}`;
              else if (offset === workDays) desc = `Commencer Travail le ${thirdDay} / Repos le ${startDay}`;
              else if (offset === workDays + 1) desc = `Commencer Travail le ${thirdDay + 1} / Repos le ${nextDay}`;
            } else {
              if (offset === 0) desc = `Commencer Travail le ${startDay}`;
              else if (offset === 1) desc = `Commencer Travail le ${nextDay}`;
              else if (offset === 2) desc = `Commencer Travail le ${thirdDay}`;
              else if (offset === workDays) desc = `Commencer Repos le ${startDay}`;
              else if (offset === workDays + 1) desc = `Commencer Repos le ${nextDay}`;
              else if (offset === workDays + 2) desc = `Commencer Repos le ${thirdDay}`;
            }

            const isSelected = shiftPattern && shiftPattern.offset === offset;
            
            return (
              <button key={offset} type="button" style={{ background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'left', padding: '10px', borderRadius: '8px', border: isSelected ? '1px solid #38bdf8' : '1px solid transparent' }}
                onClick={() => {
                  setShiftPattern({ cycle: cycleLen, work: workDays, offset: offset, shiftType: shiftType });
                  setReposDay('');
                }}>
                <span style={{ fontFamily: 'Segoe UI Emoji' }}>{preview}</span>
                <span style={{ fontSize: '0.85rem', marginLeft: '10px' }}>{desc}</span>
              </button>
            );
          })}
        </div>
        
        {shiftPattern && (
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <button type="button" onClick={() => setShiftPattern(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>Effacer la sélection</button>
          </div>
        )}
      </div>
    );
  };

  const existingHomonyms = React.useMemo(() => {
    if (!name || name.trim().length < 3) return [];
    const trimmed = name.trim().toLowerCase();
    const results = [];
    const seenIds = new Set();

    const subsiteToSiteMap = new Map();
    const subsiteToNameMap = new Map();

    if (Array.isArray(allSites)) {
      for (const s of allSites) {
        if (Array.isArray(s.subsites)) {
          for (const sub of s.subsites) {
            subsiteToSiteMap.set(sub.id, s.name);
            subsiteToNameMap.set(sub.id, sub.name);
          }
        }
      }
    }

    const addMatch = (a, siteName, zoneName, subsiteId) => {
      if (!a || !a.name) return;
      if (a.name.trim().toLowerCase() === trimmed) {
        const agentId = a.id || `${siteName}_${zoneName}_${a.name}`;
        if (seenIds.has(agentId)) return;
        seenIds.add(agentId);

        let sName = siteName || (subsiteId ? subsiteToSiteMap.get(subsiteId) : '') || '';
        let zName = zoneName || (subsiteId ? subsiteToNameMap.get(subsiteId) : '') || '';

        let loc = sName;
        if (zName && zName !== sName) {
          loc = sName ? `${sName} / ${zName}` : zName;
        } else if (zName && !sName) {
          loc = zName;
        }

        results.push({
          id: agentId,
          name: a.name,
          fullLocation: loc || 'Site non spécifié',
          function: a.function_label || a.function_name || a.function || 'AS'
        });
      }
    };

    if (Array.isArray(globalAgents)) {
      for (const a of globalAgents) {
        addMatch(a, a.site_name, a.subsite_name, a.subsite_id);
      }
    }

    if (Array.isArray(allSites)) {
      for (const site of allSites) {
        if (Array.isArray(site.agents)) {
          for (const a of site.agents) {
            addMatch(a, site.name, a.subsite_name || a.subsite, a.subsite_id);
          }
        }
        if (Array.isArray(site.subsites)) {
          for (const sub of site.subsites) {
            if (Array.isArray(sub.agents)) {
              for (const a of sub.agents) {
                addMatch(a, site.name, sub.name, sub.id);
              }
            }
          }
        }
      }
    }

    if (Array.isArray(siteData)) {
      for (const sub of siteData) {
        if (Array.isArray(sub.agents)) {
          for (const a of sub.agents) {
            const pName = subsiteToSiteMap.get(sub.id) || sub.site_name || '';
            addMatch(a, pName, sub.name, sub.id);
          }
        }
      }
    }

    return results;
  }, [name, siteData, allSites, globalAgents]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '20px 30px', background: '#0f172a', border: '1px solid rgba(56,189,248,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'center', fontSize: '1.4rem' }}>Ajouter un Agent de sécurité</h3>
        {errorMsg && <div className="alert alert-danger" style={{ padding: '8px', marginBottom: '10px' }}>{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            <div className="form-group">
              <label className="form-label">Nom Complet</label>
              <input
                type="text"
                className="form-input"
                placeholder="ex: Mamadou Diallo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasConfirmedHomonym(false);
                }}
                required
                autoFocus
              />
              {existingHomonyms.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    borderRadius: '8px',
                    color: '#fde047',
                    fontSize: '0.82rem',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    ⚠️ <strong>{existingHomonyms.length} Homonyme{existingHomonyms.length > 1 ? 's' : ''} détecté{existingHomonyms.length > 1 ? 's' : ''}</strong> ({existingHomonyms.map(h => h.fullLocation).join(' ; ')})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowHomonymWarningModal(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '0.78rem',
                      textDecoration: 'underline',
                      color: '#38bdf8',
                      marginLeft: '8px',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                  >
                    Voir détails
                  </button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Zone de travail</label>
              <select
                className="form-input"
                value={subsiteId}
                onChange={(e) => setSubsiteId(e.target.value)}
                required
              >
                <option value="">Sélectionnez la zone...</option>
                {siteData.filter(s => !String(s.id).startsWith('mutated_')).map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fonction / Poste (Vacation)</label>
              <select
                className="form-input"
                value={agentFunction}
                onChange={(e) => setAgentFunction(e.target.value)}
                required
              >
                <option value="">Sélectionnez une fonction...</option>
                {functions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type de vacation</label>
              <select
                className="form-input"
                value={shiftType}
                onChange={(e) => {
                  setShiftType(e.target.value);
                  setShiftPattern(null);
                  setReposDay('');
                }}
                required
              >
                <option value="Jour">Jour (12h)</option>
                <option value="Nuit">Nuit (12h)</option>
                <option value="24h">24h</option>
                <option value="48h">48h</option>
                <option value="72h">72h</option>
              </select>
            </div>
            
            {renderPatternOptions()}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 15px', marginTop: '15px', marginBottom: '15px', alignItems: 'end' }}>
            {/* 1. Date de fin */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ marginBottom: '4px' }}>Date de fin de contrat (Optionnel)</label>
              <input
                type="date"
                className="form-input"
                style={{ padding: '8px 12px' }}
                value={contractEnd}
                onChange={(e) => setContractEnd(e.target.value)}
              />
            </div>
            
            {/* 2. Temps Partiel */}
            <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '41px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fbbf24', margin: 0, fontSize: '0.85rem', fontWeight: 600, width: '100%' }}>
                <input 
                  type="checkbox" 
                  checked={isSpecialService} 
                  onChange={e => {
                    setIsSpecialService(e.target.checked);
                    if (e.target.checked) {
                      setIsAdminSchedule(false);
                      setShowSpecialServiceModal(true);
                    }
                  }}
                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                />
                Temps Partiel
              </label>
              {isSpecialService && (
                <button 
                  type="button"
                  onClick={() => setShowSpecialServiceModal(true)}
                  style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Configurer le service temps partiel"
                >
                  <Settings size={15} />
                </button>
              )}
            </div>

            {/* 3. Agent Entrant */}
            {!isSpecialService && (
              <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '41px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-color)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={isEntrant} 
                    onChange={e => {
                      setIsEntrant(e.target.checked);
                      if (e.target.checked) setIsDebut(false);
                    }}
                    style={{ width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  Cet agent est un Agent Entrant
                </label>
              </div>
            )}

            {/* 4. Migration */}
            <div className="form-group" style={{ background: 'rgba(236, 72, 153, 0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.2)', marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '41px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f472b6', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={isDebut} 
                  onChange={e => {
                    setIsDebut(e.target.checked);
                    if (e.target.checked) setIsEntrant(false);
                  }}
                  style={{ width: '16px', height: '16px', flexShrink: 0 }}
                />
                Début (Migration)
              </label>
            </div>

            {/* 5. Repos Weekend */}
            {!isSpecialService && (
                <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '41px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#818cf8', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={isAdminSchedule} 
                      onChange={e => setIsAdminSchedule(e.target.checked)}
                      style={{ width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    Repos Weekend
                  </label>
                </div>
            )}

            {/* 6. Désactiver repos */}
            {!isSpecialService && (
                <div className="form-group" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '41px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#22c55e', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={disableDefaultRepos} 
                      onChange={e => setDisableDefaultRepos(e.target.checked)}
                      style={{ width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    Désactiver repos auto
                  </label>
                </div>
            )}
          </div>
          <SpecialServiceModal 
            isOpen={showSpecialServiceModal}
            onClose={() => setShowSpecialServiceModal(false)}
            specialServiceBase={specialServiceBase}
            setSpecialServiceBase={setSpecialServiceBase}
            specialServiceDays={specialServiceDays}
            setSpecialServiceDays={setSpecialServiceDays}
            isEntrant={isEntrant}
            setIsEntrant={setIsEntrant}
            entrantDate={entrantDate}
            setEntrantDate={setEntrantDate}
            isDebut={isDebut}
            setIsDebut={setIsDebut}
            debutDate={debutDate}
            setDebutDate={setDebutDate}
            minDate={minDate}
            maxDate={maxDate}
            datesList={datesList}
          />
          
          {!isSpecialService && isEntrant && (
            <div style={{ marginTop: '0', marginBottom: '10px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 600 }}>Date d'entrée (Le pointage commencera à partir de cette date)</label>
              <input 
                type="date"
                className="form-input"
                style={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                value={entrantDate}
                onChange={e => setEntrantDate(e.target.value)}
                required={isEntrant && !isSpecialService}
                min={minDate}
                max={maxDate}
              />
            </div>
          )}

          {!isSpecialService && isDebut && (
            <div style={{ marginTop: '0', marginBottom: '10px', padding: '15px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f472b6', fontSize: '0.9rem', fontWeight: 600 }}>Date de début sur ce site</label>
                <input 
                  type="date"
                  className="form-input"
                  style={{ borderColor: 'rgba(236, 72, 153, 0.5)' }}
                  value={debutDate}
                  onChange={e => setDebutDate(e.target.value)}
                  required={isDebut && !isSpecialService}
                  min={minDate}
                  max={maxDate}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f472b6', fontSize: '0.9rem', fontWeight: 600 }}>Ancien Site</label>
                <input
                  type="text"
                  list="ancien-sites-list"
                  className="form-input"
                  style={{ borderColor: 'rgba(236, 72, 153, 0.5)' }}
                  placeholder="Tapez le nom de l'ancien site..."
                  value={ancienSite}
                  onChange={e => setAncienSite(e.target.value)}
                  required={isDebut && !isSpecialService}
                />
                <datalist id="ancien-sites-list">
                  {allSites && allSites.filter(s => s.name && !['🌟 EXTRA BUREAU', '🔄 Vivier des relèves', '🌟 EXTRA SUR SITE', '🏢 Administration'].includes(s.name)).map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {activeSiteId === 'site_releves' && (
            <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ color: '#10b981', margin: '0 0 4px 0', fontSize: '1.1rem' }}>Programme de la semaine</h4>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Configuration des sites d'intervention</div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowScheduleModal(true)} 
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
              >
                Configurer le programme
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '14px 40px', fontSize: '1.15rem', fontWeight: 600, minWidth: '180px', borderRadius: '10px' }}>Annuler</button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
              style={{ 
                padding: '14px 40px', 
                fontSize: '1.15rem', 
                fontWeight: 600, 
                minWidth: '180px', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: isLoading ? '#6b7280' : undefined,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading && (
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
      
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,1)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#10b981', textAlign: 'center', fontSize: '1.4rem' }}>Programme de la semaine (Sites d'intervention)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {Object.entries(schedule).map(([dayId, target]) => {
                  const dayNames = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' };
                  return (
                    <div key={dayId} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ width: '100px', fontWeight: 'bold', color: '#94a3b8', fontSize: '1.05rem' }}>{dayNames[dayId]}</div>
                      <SearchableSelect 
                        options={flattenedOptions}
                        placeholder="Rechercher un site / zone..."
                        value={target.site_id ? `${target.site_id}::${target.subsite_id}` : ''}
                        onChange={(val) => {
                          if (!val) {
                            setSchedule(prev => ({ ...prev, [dayId]: { site_id: '', subsite_id: '' } }));
                          } else {
                            const [s_id, sub_id] = val.split('::');
                            setSchedule(prev => ({ ...prev, [dayId]: { site_id: s_id, subsite_id: sub_id } }));
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button type="button" onClick={() => setShowScheduleModal(false)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 40px', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                Terminer la configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {showHomonymWarningModal && existingHomonyms.length > 0 && (
        <HomonymWarningModal
          homonyms={existingHomonyms}
          onConfirm={() => {
            setHasConfirmedHomonym(true);
            setShowHomonymWarningModal(false);
            executeSubmit();
          }}
          onModify={() => {
            setShowHomonymWarningModal(false);
          }}
        />
      )}
    </div>
  );
}
