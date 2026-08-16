import React, { useState, useEffect } from 'react';
import { apiCall } from '../../api';

export default function ExternalSuppModal({
  period,
  agents,
  sites,
  currentSiteId,
  onClose,
  onSubmit
}) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [searchAgentText, setSearchAgentText] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [searchSiteText, setSearchSiteText] = useState('');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  const [dateSupp, setDateSupp] = useState('');
  const [vacation, setVacation] = useState('12H J');
  const [motif, setMotif] = useState('');
  
  const [selectedReplacedAgentId, setSelectedReplacedAgentId] = useState('');
  const [searchReplacedText, setSearchReplacedText] = useState('');
  const [showReplacedDropdown, setShowReplacedDropdown] = useState(false);
  const [destinationAgents, setDestinationAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generatePeriodDates = React.useMemo(() => {
    if (!period) return [];
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const dates = [];
    
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    for (let d = 21; d <= daysInPrevMonth; d++) {
      const dateObj = new Date(prevYear, prevMonth - 1, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      dates.push({ value: `${yyyy}-${mm}-${dd}`, label: `${dd}/${mm}/${yyyy}` });
    }
    
    for (let d = 1; d <= 20; d++) {
      const dateObj = new Date(year, month - 1, d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      dates.push({ value: `${yyyy}-${mm}-${dd}`, label: `${dd}/${mm}/${yyyy}` });
    }
    
    return dates;
  }, [period]);

  // Fetch agents of the selected destination site
  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== 'site_extras_sur_site') {
      apiCall('get_site_agents', { site_id: selectedSiteId }).then(res => {
        if (res.success) {
          setDestinationAgents(res.agents || []);
        } else {
          setDestinationAgents([]);
        }
      }).catch(() => {
        setDestinationAgents([]);
      });
    } else {
      setDestinationAgents([]);
    }
  }, [selectedSiteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedSiteId || !dateSupp || !vacation || isLoading) return;
    
    setIsLoading(true);
    try {
      await onSubmit({
        agent_id: selectedAgentId,
        site_destination_id: selectedSiteId,
        date_supp: dateSupp,
        vacation: vacation,
        agent_remplace: selectedReplacedAgentId,
        motif: motif
      });
    } catch (error) {
      alert("Une erreur est survenue lors de l'ajout : " + (error.message || error));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalize = (str) => {
    try {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    } catch (e) {
      return str.toLowerCase();
    }
  };

  const fuzzyWordMatch = (word, text) => {
    let i = 0, j = 0;
    while (i < word.length && j < text.length) {
      if (word[i] === text[j]) i++;
      j++;
    }
    return i === word.length;
  };

  const getFuzzyScore = (query, text) => {
    if (!query) return 1;
    const normQuery = normalize(query);
    const normText = normalize(text);
    
    if (normText === normQuery) return 10000;
    if (normText.includes(normQuery)) return 5000;
    
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return 1;
    
    let score = 0;
    let exactMatchedWords = 0;
    let fuzzyMatchedWords = 0;
    
    queryWords.forEach(word => {
      if (normText.includes(word)) {
        score += word.length * 100;
        exactMatchedWords++;
      } else if (word.length > 2 && fuzzyWordMatch(word, normText)) {
        score += word.length * 2;
        fuzzyMatchedWords++;
      }
    });
    
    if (exactMatchedWords === 0 && fuzzyMatchedWords === 0) return 0;
    
    score += (exactMatchedWords * 1000);
    score += (fuzzyMatchedWords * 10);
    
    const hasLongWords = queryWords.some(w => w.length > 2);
    if (!hasLongWords && (exactMatchedWords + fuzzyMatchedWords) < queryWords.length) return 0;
    
    return score;
  };

  const getSortedByScore = (items, query, textSelector) => {
    if (!query) return items;
    return items
      .map(item => ({ item, score: getFuzzyScore(query, textSelector(item)) }))
      .filter(x => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return textSelector(a.item).localeCompare(textSelector(b.item));
      })
      .map(x => x.item);
  };

  const safeAgents = Array.isArray(agents) ? agents : [];
  const filteredAgents = getSortedByScore(safeAgents, searchAgentText, ag => ag.name) || [];
  const filteredDestAgents = getSortedByScore(destinationAgents, searchReplacedText, ag => ag.name) || [];
  
  const allDestinations = React.useMemo(() => {
    if (!sites) return [];
    let dests = [];
    sites.forEach(s => {
      const validSubsites = (s.subsites || []).filter(sub => 
        !sub.name.includes('Agents non assignés')
      );

      const isSpecialSite = s.id.includes('releve') || s.id.includes('extra') || 
                            s.name.toLowerCase().includes('relève') || s.name.toLowerCase().includes('releve') || 
                            s.name.toLowerCase().includes('extra');

      if (validSubsites.length >= 2 && !isSpecialSite) {
        validSubsites.forEach(sub => {
          dests.push({ label: sub.name, siteId: sub.id, parentName: s.name });
        });
      } else {
        dests.push({ label: s.name, siteId: s.id, parentName: null });
        validSubsites.forEach(sub => {
          dests.push({ label: `${s.name} / ${sub.name}`, siteId: sub.id, parentName: null });
        });
      }
    });
    return dests;
  }, [sites, currentSiteId]);

  const filteredSites = getSortedByScore(allDestinations || [], searchSiteText, s => s.parentName ? `${s.parentName} ${s.label}` : s.label) || [];

  const isFormValid = selectedAgentId && selectedSiteId && dateSupp && vacation && !isLoading;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(12px)',
      animation: 'esmFadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes esmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes esmSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes esmSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .esm-input {
          width: 100%; padding: 11px 14px 11px 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: white; font-size: 0.92rem;
          outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .esm-input:focus { border-color: rgba(139,92,246,0.6) !important; background: rgba(139,92,246,0.06) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.12) !important; }
        .esm-input-cyan:focus { border-color: rgba(6,182,212,0.6) !important; background: rgba(6,182,212,0.06) !important; box-shadow: 0 0 0 3px rgba(6,182,212,0.12) !important; }
        .esm-select {
          width: 100%; padding: 11px 32px 11px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: white; font-size: 0.92rem;
          outline: none; cursor: pointer; transition: all 0.2s; box-sizing: border-box;
          appearance: none; -webkit-appearance: none;
        }
        .esm-select:focus { border-color: rgba(139,92,246,0.6); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
        .esm-select option { background: #1e293b; color: white; }
        .esm-drop-item { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s; }
        .esm-drop-item:hover { background: rgba(139,92,246,0.18) !important; }
        .esm-btn-cancel { transition: all 0.2s; }
        .esm-btn-cancel:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
        .esm-btn-submit { transition: all 0.25s; }
        .esm-btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(124,58,237,0.5) !important; }
        .esm-badge-v { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4); border-radius: 20px; color: #c4b5fd; font-size: 0.76rem; font-weight: 600; margin-top: 5px; }
        .esm-badge-c { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: rgba(6,182,212,0.2); border: 1px solid rgba(6,182,212,0.4); border-radius: 20px; color: #67e8f9; font-size: 0.76rem; font-weight: 600; margin-top: 5px; }
        .esm-label { display: flex; align-items: center; gap: 5px; margin-bottom: 8px; color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .esm-label-dim { color: rgba(255,255,255,0.35) !important; }
      `}</style>

      <div style={{
        background: 'linear-gradient(145deg, #0d1117 0%, #0a0f1e 60%, #0d0a1e 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '20px', padding: '36px', width: '820px', maxWidth: '96vw',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        animation: 'esmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)'
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 8px 24px rgba(124,58,237,0.4)'
            }}>🔗</div>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Supplémentaire Externe
              </h3>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.38)', fontSize: '0.8rem' }}>
                Affecter un agent sur un site externe
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px', border: 'none', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >✕</button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)', marginBottom: '24px' }} />

        <form onSubmit={handleSubmit}>

          {/* ── Row 1 : Agent + Site ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Agent Titulaire */}
            <div style={{ position: 'relative' }}>
              <label className="esm-label"><span style={{ color: '#a78bfa' }}>👤</span> Agent Titulaire</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(167,139,250,0.55)', fontSize: '13px', pointerEvents: 'none', zIndex: 2 }}>🔍</span>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, #7c3aed, #4f46e5)', borderRadius: '10px 0 0 10px', zIndex: 1 }} />
                <input
                  type="text" className="esm-input"
                  placeholder="Rechercher un agent..."
                  value={searchAgentText}
                  onChange={e => { setSearchAgentText(e.target.value); setShowAgentDropdown(true); if (e.target.value === '') setSelectedAgentId(''); }}
                  onFocus={() => setShowAgentDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAgentDropdown(false), 200)}
                  style={{ paddingLeft: '40px', borderLeft: '3px solid rgba(139,92,246,0.45)' }}
                />
              </div>
              {selectedAgentId && <div className="esm-badge-v">✓ {searchAgentText.split(' (')[0]}</div>}
              {showAgentDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#141a2e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', maxHeight: '160px', overflowY: 'auto', zIndex: 20, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                  {filteredAgents.length === 0 ? (
                    <div style={{ padding: '14px', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center' }}>Aucun agent trouvé</div>
                  ) : filteredAgents.map(ag => (
                    <div key={ag.id} className="esm-drop-item"
                      onMouseDown={e => { e.preventDefault(); setSelectedAgentId(ag.id); setSearchAgentText(`${ag.name}${ag.function ? ' (' + ag.function + ')' : ''}`); setShowAgentDropdown(false); }}
                    >
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{ag.name}</div>
                      {ag.function && <div style={{ color: '#a78bfa', fontSize: '0.75rem', marginTop: '1px' }}>{ag.function}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Site de Destination */}
            <div style={{ position: 'relative' }}>
              <label className="esm-label"><span style={{ color: '#22d3ee' }}>📍</span> Site de Destination</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(34,211,238,0.55)', fontSize: '13px', pointerEvents: 'none', zIndex: 2 }}>🔍</span>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, #06b6d4, #0891b2)', borderRadius: '10px 0 0 10px', zIndex: 1 }} />
                <input
                  type="text" className="esm-input esm-input-cyan"
                  placeholder="Rechercher un site..."
                  value={searchSiteText}
                  onChange={e => { setSearchSiteText(e.target.value); setShowSiteDropdown(true); if (e.target.value === '') setSelectedSiteId(''); }}
                  onFocus={() => setShowSiteDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowSiteDropdown(false);
                      if (searchSiteText && !selectedSiteId) {
                        const currentSites = Array.isArray(filteredSites) ? filteredSites : [];
                        const exact = currentSites.find(s => s.label.toLowerCase() === searchSiteText.toLowerCase());
                        if (exact) { setSelectedSiteId(exact.siteId); setSearchSiteText(exact.label); }
                        else if (currentSites.length > 0) { setSelectedSiteId(currentSites[0].siteId); setSearchSiteText(currentSites[0].label); }
                        else { setSearchSiteText(''); }
                      } else if (!searchSiteText) { setSelectedSiteId(''); }
                    }, 200);
                  }}
                  style={{ paddingLeft: '40px', borderLeft: '3px solid rgba(6,182,212,0.45)' }}
                />
              </div>
              {selectedSiteId && <div className="esm-badge-c">✓ {searchSiteText}</div>}
              {showSiteDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#141a2e', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', maxHeight: '160px', overflowY: 'auto', zIndex: 20, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                  {filteredSites.length === 0 ? (
                    <div style={{ padding: '14px', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center' }}>Aucun site trouvé</div>
                  ) : filteredSites.map(site => (
                    <div key={site.siteId} className="esm-drop-item"
                      onMouseDown={e => { e.preventDefault(); setSelectedSiteId(site.siteId); setSearchSiteText(site.label); setShowSiteDropdown(false); }}
                    >
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{site.label}</div>
                      {site.parentName && <div style={{ color: '#22d3ee', fontSize: '0.75rem', marginTop: '1px' }}>📂 {site.parentName}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Agent Remplacé ── */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <label className="esm-label esm-label-dim">
              <span>👥</span> Agent Absent&nbsp;<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.22)' }}>(optionnel)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', fontSize: '13px', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text" className="esm-input"
                placeholder="Rechercher l'agent absent (optionnel)..."
                value={searchReplacedText}
                onChange={e => { setSearchReplacedText(e.target.value); setShowReplacedDropdown(true); if (e.target.value === '') setSelectedReplacedAgentId(''); }}
                onFocus={() => setShowReplacedDropdown(true)}
                onBlur={() => setTimeout(() => setShowReplacedDropdown(false), 200)}
                style={{ paddingLeft: '40px', opacity: 0.7 }}
              />
            </div>
            {showReplacedDropdown && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#141a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', maxHeight: '140px', overflowY: 'auto', zIndex: 20, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                {filteredDestAgents.length === 0 ? (
                  <div style={{ padding: '14px', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', textAlign: 'center' }}>
                    {selectedSiteId ? 'Aucun agent trouvé' : "Sélectionnez d'abord un site"}
                  </div>
                ) : filteredDestAgents.map(ag => (
                  <div key={ag.id} className="esm-drop-item"
                    onMouseDown={e => { e.preventDefault(); setSelectedReplacedAgentId(ag.id); setSearchReplacedText(`${ag.name}${ag.function ? ' (' + ag.function + ')' : ''}`); setShowReplacedDropdown(false); }}
                  >
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.88rem' }}>{ag.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '18px 0' }} />

          {/* ── Row 2 : Date + Vacation ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="esm-label"><span style={{ color: '#f59e0b' }}>📅</span> Date</label>
              <div style={{ position: 'relative' }}>
                <select className="esm-select" value={dateSupp} onChange={e => setDateSupp(e.target.value)} required>
                  <option value="" disabled>Sélectionner une date...</option>
                  {generatePeriodDates.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', fontSize: '11px' }}>▼</span>
              </div>
            </div>
            <div>
              <label className="esm-label"><span style={{ color: '#34d399' }}>⏱</span> Vacation</label>
              <div style={{ position: 'relative' }}>
                <select className="esm-select" value={vacation} onChange={e => setVacation(e.target.value)}>
                  <option value="12H J">12H Jour</option>
                  <option value="12H N">12H Nuit</option>
                  <option value="24H">24H</option>
                  <option value="48H">48H</option>
                  <option value="72H">72H</option>
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', fontSize: '11px' }}>▼</span>
              </div>
            </div>
          </div>

          {/* ── Motif ── */}
          <div style={{ marginBottom: '28px' }}>
            <label className="esm-label esm-label-dim">
              <span>📝</span> Motif&nbsp;<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.22)' }}>(optionnel)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select className="esm-select" value={motif} onChange={e => setMotif(e.target.value)} style={{ opacity: 0.75 }}>
                <option value="">— Aucun statut —</option>
                <option value="A">Absence (A)</option>
                <option value="M">Maladie (M)</option>
                <option value="P">Permission (P)</option>
                <option value="MAP">Mise à pied (MAP)</option>
              </select>
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', fontSize: '11px' }}>▼</span>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="esm-btn-cancel"
              style={{ flex: '0 0 auto', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Annuler
            </button>
            <button type="submit" className="esm-btn-submit" disabled={!isFormValid}
              style={{
                flex: 1, padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: isFormValid ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.06)',
                color: isFormValid ? 'white' : 'rgba(255,255,255,0.25)',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                fontWeight: 700, fontSize: '0.95rem',
                boxShadow: isFormValid ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <svg style={{ width: '16px', height: '16px', animation: 'esmSpin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                  </svg>
                  Ajout en cours...
                </>
              ) : <>✓ Ajouter le Supplémentaire</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
