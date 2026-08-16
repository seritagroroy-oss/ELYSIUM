import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertTriangle, ChevronDown, Search, MapPin, User, Check } from 'lucide-react';
import { apiCall } from '../../api';

export default function TransferModal({ data, sites, period, onSave, onClose }) {
  const [transferDate, setTransferDate] = useState('');
  const [targetSite, setTargetSite] = useState('');
  const [replacedAgent, setReplacedAgent] = useState('');
  const [motif, setMotif] = useState('');
  const [agentsOfTargetSite, setAgentsOfTargetSite] = useState([]);
  const [isSiteMatched, setIsSiteMatched] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  useEffect(() => {
    if (data && data.dateKey) {
      setTransferDate(data.dateKey);
      setSelectedDates([data.dateKey]);
    }
  }, [data]);

  const periodDates = useMemo(() => {
    if (!period) return [];
    const [yearStr, monthStr] = period.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    
    let startYear = y;
    let startMonth = m - 1;
    if (startMonth === 0) {
      startMonth = 12;
      startYear--;
    }
    const d = new Date(startYear, startMonth - 1, 21);
    const endDate = new Date(y, m - 1, 20);

    const dates = [];
    let current = new Date(d);
    while (current <= endDate) {
      const cy = current.getFullYear();
      const cm = String(current.getMonth() + 1).padStart(2, '0');
      const cd = String(current.getDate()).padStart(2, '0');
      dates.push(`${cy}-${cm}-${cd}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [period]);

  const toggleDate = (dateStr) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const allDestinations = useMemo(() => {
    if (!sites) return [];
    let dests = [];
    sites.forEach(s => {
      dests.push({ label: s.name, siteId: s.id });
      if (s.subsites && s.subsites.length > 0) {
        s.subsites.forEach(sub => {
           // On ne remet pas le nom du site si la zone a le même nom, mais en général on affiche Site / Zone
           if (sub.name !== s.name && !sub.name.includes('Agents non assignés')) {
             dests.push({ label: `${s.name} / ${sub.name}`, siteId: s.id, subsiteId: sub.id });
           }
        });
      }
    });
    return dests;
  }, [sites]);

  const handleSiteChange = async (value) => {
    setTargetSite(value);
    setReplacedAgent(''); // reset replaced agent when site changes
    
    let matchedDest = allDestinations.find(d => d.label === value);
    if (!matchedDest && value) {
      matchedDest = allDestinations.find(d => d.label.toLowerCase() === value.toLowerCase());
    }
    if (!matchedDest && value) {
      matchedDest = allDestinations.find(d => d.label.split(' / ').pop().toLowerCase() === value.toLowerCase());
    }

    if (matchedDest) {
      setIsSiteMatched(true);
      try {
        const fetchPeriod = period || (data && data.dateKey ? data.dateKey.substring(0, 7) : new Date().toISOString().substring(0, 7));
        const res = await apiCall('get_site_data', { site_id: matchedDest.siteId, period: fetchPeriod }, 'GET');
        if (Array.isArray(res)) {
          let agents = [];
          if (matchedDest.subsiteId) {
             const sub = res.find(s => String(s.id) === String(matchedDest.subsiteId));
             if (sub) agents = sub.agents || [];
          } else {
             agents = res.flatMap(sub => sub.agents || []);
          }
          setAgentsOfTargetSite(agents);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsSiteMatched(false);
      setAgentsOfTargetSite([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMultiDay && selectedDates.length === 0) {
      alert('Veuillez sélectionner au moins une date.');
      return;
    }
    if (!isMultiDay && !transferDate) {
      alert('Veuillez sélectionner une date de transfert.');
      return;
    }

    onSave({
      agentId: data.agentId,
      shiftCode: data.shiftCode,
      dateKey: isMultiDay ? selectedDates[0] : transferDate,
      dateKeys: isMultiDay ? selectedDates : [transferDate],
      targetSite,
      replacedAgent,
      motif
    });
  };

  if (!data) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#1e293b', width: '450px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#f97316" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>Agent Transféré (T)</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{data.agentName || 'Agent inconnu'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}>Date du transfert</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isMultiDay ? (
                <input type="date" value={transferDate} onChange={e => { setTransferDate(e.target.value); setSelectedDates([e.target.value]); }} required={!isMultiDay}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none' }} />
              ) : (
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '180px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                    {periodDates.map(dateStr => (
                      <label key={dateStr} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'white' }}>
                        <input type="checkbox" checked={selectedDates.includes(dateStr)} onChange={() => toggleDate(dateStr)} />
                        {dateStr.split('-').reverse().join('/')}
                      </label>
                    ))}
                  </div>
                  {selectedDates.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981' }}>{selectedDates.length} jour(s) sélectionné(s)</div>
                  )}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={isMultiDay} onChange={(e) => setIsMultiDay(e.target.checked)} />
                Ce transfert s'étend sur plusieurs jours
              </label>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}>Site de destination (Optionnel)</label>
            <div 
              onClick={() => setShowSiteDropdown(!showSiteDropdown)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: showSiteDropdown ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: targetSite ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <MapPin size={16} color={targetSite ? '#38bdf8' : 'rgba(255,255,255,0.5)'} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetSite || "Ex: BOA Siège"}</span>
              </div>
              <ChevronDown size={16} style={{ transform: showSiteDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {showSiteDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                  <Search size={16} color="rgba(255,255,255,0.4)" />
                  <input type="text" placeholder="Rechercher un site..." value={siteSearch} onChange={e => setSiteSearch(e.target.value)} autoFocus
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', width: '100%' }} />
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                  {allDestinations.filter(d => d.label.toLowerCase().includes(siteSearch.toLowerCase())).map(d => (
                    <div key={d.label} onClick={() => { handleSiteChange(d.label); setShowSiteDropdown(false); setSiteSearch(''); }}
                      style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: targetSite === d.label ? '#38bdf8' : 'white', background: targetSite === d.label ? 'rgba(56, 189, 248, 0.1)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseOver={e => { if (targetSite !== d.label) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseOut={e => { if (targetSite !== d.label) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: '0.9rem' }}>{d.label}</span>
                      {targetSite === d.label && <Check size={16} />}
                    </div>
                  ))}
                  {allDestinations.filter(d => d.label.toLowerCase().includes(siteSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Aucun site trouvé</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}>
              <span>Nom de l'agent remplacé (Optionnel)</span>
              {isSiteMatched ? <span style={{color: '#10b981', fontSize: '0.75rem'}}>({agentsOfTargetSite.length} agent(s))</span> : <span style={{color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem'}}>(Site requis)</span>}
            </label>
            <div 
              onClick={() => { if (isSiteMatched && agentsOfTargetSite.length > 0) setShowAgentDropdown(!showAgentDropdown); }}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: showAgentDropdown ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: replacedAgent ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '0.95rem', cursor: (isSiteMatched && agentsOfTargetSite.length > 0) ? 'pointer' : 'not-allowed', opacity: (isSiteMatched && agentsOfTargetSite.length > 0) ? 1 : 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <User size={16} color={replacedAgent ? '#10b981' : 'rgba(255,255,255,0.5)'} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replacedAgent || "Sélectionner un agent..."}</span>
              </div>
              <ChevronDown size={16} style={{ transform: showAgentDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {showAgentDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                  <Search size={16} color="rgba(255,255,255,0.4)" />
                  <input type="text" placeholder="Rechercher un agent..." value={agentSearch} onChange={e => setAgentSearch(e.target.value)} autoFocus
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', width: '100%' }} />
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                  {agentsOfTargetSite.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase())).map(a => (
                    <div key={a.id} onClick={() => { setReplacedAgent(a.name); setShowAgentDropdown(false); setAgentSearch(''); }}
                      style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: replacedAgent === a.name ? '#10b981' : 'white', background: replacedAgent === a.name ? 'rgba(16, 185, 129, 0.1)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseOver={e => { if (replacedAgent !== a.name) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseOut={e => { if (replacedAgent !== a.name) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: '0.9rem' }}>{a.name}</span>
                      {replacedAgent === a.name && <Check size={16} />}
                    </div>
                  ))}
                  {agentsOfTargetSite.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Aucun agent trouvé</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}>Motif du transfert (Optionnel)</label>
            <textarea placeholder="Ex: Urgence, Manque d'effectif..." value={motif} onChange={e => setMotif(e.target.value)} rows={3}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              Annuler
            </button>
            <button type="submit"
              style={{ flex: 1, padding: '12px', background: '#f97316', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}
              onMouseOver={e => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <Save size={18} />
              Valider le transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
