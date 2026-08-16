import React from 'react';

const ReclamationModal = ({
  newReclamation,
  setNewReclamation,
  showReclamationSuggestions,
  setShowReclamationSuggestions,
  salariesLoading,
  salaries,
  isAutoCalculatedMotif,
  isPastErrorMotif,
  showAbsentCalendar,
  setShowAbsentCalendar,
  showPastCalendar,
  setShowPastCalendar,
  pastErrorMonth,
  setPastErrorMonth,
  pastErrorYear,
  setPastErrorYear,
  checkedDates,
  handleToggleAbsentDate,
  absentDatesList,
  reclamations,
  isMontantLocked,
  setIsMontantLocked,
  setCheckedDates,
  setShowAddReclamationModal,
  handleSaveReclamation,
  isEditMode
}) => {
  const [isSaving, setIsSaving] = React.useState(false);

  const onSaveClick = async () => {
    setIsSaving(true);
    try {
      await handleSaveReclamation();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1050px', padding: '40px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px', fontSize: '1.5rem' }}>
          {isEditMode ? 'Modifier une réclamation' : 'Ajouter une réclamation'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {(() => {
            const matchingAgents = salaries.filter(s => (s.name || '').toLowerCase() === (newReclamation.agent_name || '').toLowerCase());
            const hasHomonyms = matchingAgents.length > 1;
            const filteredSalaries = salaries.filter(s => (s.name || '').toLowerCase().includes((newReclamation.agent_name || '').toLowerCase()));
            const uniqueNames = [...new Set(filteredSalaries.map(s => s.name))];

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>
                    Agent <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 'normal' }}>({salaries.length} en base)</span>
                  </label>
                  <input 
                    type="text"
                    className="form-input" 
                    style={{ width: '100%', borderColor: hasHomonyms && !newReclamation.agent_id ? '#f59e0b' : 'var(--border)' }}
                    placeholder="Saisissez le nom de l'agent..."
                    value={newReclamation.agent_name}
                    onChange={e => {
                      setNewReclamation({...newReclamation, agent_name: e.target.value, agent_id: ''});
                      setShowReclamationSuggestions(true);
                    }}
                    onFocus={() => setShowReclamationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReclamationSuggestions(false), 200)}
                  />
                  {showReclamationSuggestions && newReclamation.agent_name && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                      {salariesLoading ? (
                        <div style={{ padding: '10px 14px', color: 'var(--muted)', fontStyle: 'italic' }}>Chargement des agents en cours...</div>
                      ) : (
                        <>
                          {uniqueNames.map((name, idx) => (
                            <div 
                              key={idx}
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const clickedMatches = salaries.filter(s => s.name === name);
                                setNewReclamation({...newReclamation, agent_name: name, agent_id: clickedMatches.length === 1 ? clickedMatches[0].id : ''});
                                setShowReclamationSuggestions(false);
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {name}
                            </div>
                          ))}
                          {uniqueNames.length === 0 && (
                            <div style={{ padding: '10px 14px', color: 'var(--muted)', fontStyle: 'italic' }}>Aucun agent trouvé</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Site {hasHomonyms && !newReclamation.agent_id && <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>(Sélection requise)</span>}</label>
                  <select 
                    className="form-input" 
                    style={{ width: '100%', appearance: 'none', borderColor: hasHomonyms && !newReclamation.agent_id ? '#f59e0b' : 'var(--border)' }}
                    value={newReclamation.agent_id} 
                    onChange={e => setNewReclamation({...newReclamation, agent_id: e.target.value})}
                    disabled={!hasHomonyms && matchingAgents.length <= 1}
                  >
                    {!newReclamation.agent_id && <option value="">Sélectionnez le site...</option>}
                    {matchingAgents.map(a => (
                      <option key={a.id} value={a.id}>{a.site || 'Site inconnu'} - {a.subsite || ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Motif de la réclamation</label>
                  <select 
                    className="form-input" 
                    style={{ width: '100%', appearance: 'none' }}
                    value={newReclamation.motif} 
                    onChange={e => setNewReclamation({...newReclamation, motif: e.target.value})}
                  >
                    <option value="justificatif d'absence">Justificatif d'absence</option>
                    <option value="annulation de permission">Annulation de permission</option>
                    <option value="erreur de paie">Erreur de paie</option>
                    <option value="erreur de pointage">Erreur de pointage</option>
                    <option value="mise à pied">Mise à pied</option>
                    <option value="arrêt de pointage">Arrêt de pointage</option>
                    <option value="ponction">Ponction</option>
                  </select>
                </div>
              </div>
            );
          })()}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Motif spécifique / Raisons (facultatif)</label>
            <input 
              type="text" 
              className="form-input" 
              style={{ width: '100%' }}
              placeholder="Ex: Casse de matériel..."
              value={newReclamation.type_erreur_autre || ''} 
              onChange={e => setNewReclamation({...newReclamation, type_erreur_autre: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Nombre de jours (à payer / déduire)</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: '100%' }}
                value={newReclamation.jours} 
                onChange={e => setNewReclamation({...newReclamation, jours: e.target.value})}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Dates concernées (facultatif)</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: '100%' }}
                placeholder="Ex: 12 au 14 juillet"
                value={newReclamation.dates} 
                onFocus={() => {
                  if (isAutoCalculatedMotif && newReclamation.agent_id) {
                     setShowAbsentCalendar(true);
                  } else if (isPastErrorMotif && newReclamation.agent_id) {
                     setShowPastCalendar(true);
                  }
                }}
                onChange={e => setNewReclamation({...newReclamation, dates: e.target.value})}
              />
              {showPastCalendar && (() => {
                 const getCycleDates = (m, y) => {
                   const dates = [];
                   let pM = m - 1; let pY = y;
                   if (pM === 0) { pM = 12; pY--; }
                   const pad = (n) => n.toString().padStart(2, '0');
                   const daysInPrev = new Date(pY, pM, 0).getDate();
                   for (let i = 21; i <= daysInPrev; i++) {
                     dates.push(`${pY}-${pad(pM)}-${pad(i)}`);
                   }
                   for (let i = 1; i <= 20; i++) {
                     dates.push(`${y}-${pad(m)}-${pad(i)}`);
                   }
                   return dates;
                 };
                 const pastCycleDatesList = getCycleDates(pastErrorMonth, pastErrorYear);

                 const agentRecs = reclamations.filter(r => r.agent_id === newReclamation.agent_id && r.id !== newReclamation.id);
                 let claimedStrings = [];
                 agentRecs.forEach(r => {
                   if (r.motif && (r.motif.includes("justificatif") || r.motif.includes("annulation") || r.motif.includes("mise à pied") || r.motif.includes("erreur de paie") || r.motif.includes("erreur de pointage"))) {
                     let custom = {};
                     try { if (r.description && r.description.startsWith('{')) custom = JSON.parse(r.description); } catch(e) {}
                     const recDates = custom.dates || r.dates || '';
                     if (recDates) {
                       claimedStrings = claimedStrings.concat(recDates.split(',').map(d => d.trim().toLowerCase()));
                     }
                   }
                 });

                 const availableDates = [];
                 const claimedDates = [];
                 pastCycleDatesList.forEach(dateStr => {
                    const dateObj = new Date(dateStr);
                    const formatted = `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', {month: 'short'}).replace('.', '')}`;
                    if (claimedStrings.includes(formatted.toLowerCase())) {
                      claimedDates.push({ dateStr, formatted });
                    } else {
                      availableDates.push({ dateStr, formatted });
                    }
                 });

                 return (
                   <>
                     <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowPastCalendar(false)}></div>
                     <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto', zIndex: 50, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '20px' }}>
                       <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                         <select value={pastErrorMonth} onChange={e => setPastErrorMonth(Number(e.target.value))} className="form-input" style={{ flex: 1, padding: '6px' }}>
                           {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleDateString('fr-FR', {month: 'long'})}</option>)}
                         </select>
                         <input type="number" value={pastErrorYear} onChange={e => setPastErrorYear(Number(e.target.value))} className="form-input" style={{ width: '80px', padding: '6px' }} />
                       </div>

                       {claimedDates.length > 0 && (
                         <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                           <span><b>{claimedDates.length} date(s)</b> ont déjà été régularisées et ne peuvent plus être sélectionnées.</span>
                         </div>
                       )}

                       {availableDates.length > 0 && (
                         <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Dates disponibles (Cycle du 21 au 20) :</div>
                           <div style={{ display: 'flex', gap: '8px' }}>
                             <button 
                               type="button" 
                               style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#60a5fa', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.2s' }}
                               onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'; }}
                               onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                               onClick={() => {
                                 const newCheckedDates = availableDates.map(d => d.dateStr);
                                 const newSelected = availableDates.map(d => d.formatted);
                                 if (setCheckedDates) setCheckedDates(newCheckedDates);
                                 setNewReclamation(prev => ({ ...prev, dates: newSelected.join(', '), jours: newCheckedDates.length }));
                               }}
                             >Tout cocher</button>
                             <button 
                               type="button" 
                               style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#f87171', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.2s' }}
                               onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                               onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                               onClick={() => {
                                 if (setCheckedDates) setCheckedDates([]);
                                 setNewReclamation(prev => ({ ...prev, dates: '', jours: 0 }));
                               }}
                             >Tout décocher</button>
                           </div>
                         </div>
                       )}
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                         {availableDates.map(({ dateStr, formatted }) => {
                            const isChecked = checkedDates.includes(dateStr);
                            return (
                              <div 
                                key={dateStr}
                                onClick={() => handleToggleAbsentDate(dateStr)}
                                onMouseEnter={e => { if (!isChecked) { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; } e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={e => { if (!isChecked) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)'; } e.currentTarget.style.transform = 'scale(1)'; }}
                                style={{ padding: '6px 8px', borderRadius: '6px', background: isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isChecked ? 'transparent' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', color: isChecked ? '#fff' : 'var(--muted)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                              >
                                {formatted}
                              </div>
                            );
                         })}
                       </div>
                       
                       {claimedDates.length > 0 && (
                         <>
                           <div style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--muted)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>Déjà régularisées (Bloquées) :</div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', opacity: 0.6 }}>
                             {claimedDates.map(({ dateStr, formatted }) => (
                               <div key={`claimed-${dateStr}`} title="Déjà régularisée" style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', cursor: 'not-allowed', fontSize: '0.8rem', textAlign: 'center', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                 🔒 {formatted}
                               </div>
                             ))}
                           </div>
                         </>
                       )}
                     </div>
                   </>
                 );
              })()}
              {showAbsentCalendar && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                    onClick={() => setShowAbsentCalendar(false)}
                  ></div>
                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto', zIndex: 50, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '20px' }}>
                    {absentDatesList.length === 0 ? (
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune donnée trouvée pour cet agent ce mois-ci.</div>
                    ) : (() => {
                      const agentRecs = reclamations.filter(r => r.agent_id === newReclamation.agent_id && r.id !== newReclamation.id);
                      let claimedStrings = [];
                      agentRecs.forEach(r => {
                        if (r.motif && (r.motif.includes("justificatif") || r.motif.includes("annulation") || r.motif.includes("mise à pied") || r.motif.includes("erreur de paie") || r.motif.includes("erreur de pointage"))) {
                          let custom = {};
                          try { if (r.description && r.description.startsWith('{')) custom = JSON.parse(r.description); } catch(e) {}
                          const recDates = custom.dates || r.dates || '';
                          if (recDates) {
                            claimedStrings = claimedStrings.concat(recDates.split(',').map(d => d.trim().toLowerCase()));
                          }
                        }
                      });

                      const availableDates = [];
                      const claimedDates = [];
                      
                      absentDatesList.forEach(dateStr => {
                         const dateObj = new Date(dateStr);
                         const formatted = `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', {month: 'short'}).replace('.', '')}`;
                         if (claimedStrings.includes(formatted.toLowerCase())) {
                           claimedDates.push({ dateStr, formatted });
                         } else {
                           availableDates.push({ dateStr, formatted });
                         }
                      });

                      return (
                        <>
                          {claimedDates.length > 0 && (
                            <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                              <span><b>{claimedDates.length} date(s)</b> ont déjà fait l'objet d'une réclamation pour cet agent et ne peuvent plus être sélectionnées.</span>
                            </div>
                          )}
                          
                          {availableDates.length > 0 && (
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Dates disponibles :</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  type="button" 
                                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#60a5fa', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                  onClick={() => {
                                    const newCheckedDates = availableDates.map(d => d.dateStr);
                                    const newSelected = availableDates.map(d => d.formatted);
                                    if (setCheckedDates) setCheckedDates(newCheckedDates);
                                    setNewReclamation(prev => ({ ...prev, dates: newSelected.join(', '), jours: newCheckedDates.length }));
                                  }}
                                >Tout cocher</button>
                                <button 
                                  type="button" 
                                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#f87171', fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                  onClick={() => {
                                    if (setCheckedDates) setCheckedDates([]);
                                    setNewReclamation(prev => ({ ...prev, dates: '', jours: 0 }));
                                  }}
                                >Tout décocher</button>
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                            {availableDates.map(({ dateStr, formatted }) => {
                               const isChecked = checkedDates.includes(dateStr);
                               return (
                                 <div 
                                   key={dateStr}
                                   onClick={() => handleToggleAbsentDate(dateStr)}
                                   onMouseEnter={e => {
                                     if (!isChecked) {
                                       e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                       e.currentTarget.style.color = '#fff';
                                     }
                                     e.currentTarget.style.transform = 'scale(1.05)';
                                   }}
                                   onMouseLeave={e => {
                                     if (!isChecked) {
                                       e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                       e.currentTarget.style.color = 'var(--muted)';
                                     }
                                     e.currentTarget.style.transform = 'scale(1)';
                                   }}
                                   style={{
                                     padding: '6px 8px',
                                     borderRadius: '6px',
                                     background: isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                     border: `1px solid ${isChecked ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                                     cursor: 'pointer',
                                     fontSize: '0.8rem',
                                     textAlign: 'center',
                                     color: isChecked ? '#fff' : 'var(--muted)',
                                     transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                   }}
                                 >
                                   {formatted}
                                 </div>
                               );
                            })}
                          </div>
                          
                          {claimedDates.length > 0 && (
                            <>
                              <div style={{ marginTop: '20px', marginBottom: '10px', color: 'var(--muted)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>Déjà réclamées (Bloquées) :</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', opacity: 0.6 }}>
                                {claimedDates.map(({ dateStr, formatted }) => (
                                  <div 
                                    key={`claimed-${dateStr}`}
                                    title="Cette date a déjà été justifiée"
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      background: 'rgba(239, 68, 68, 0.05)',
                                      border: '1px dashed rgba(239, 68, 68, 0.3)',
                                      cursor: 'not-allowed',
                                      fontSize: '0.8rem',
                                      textAlign: 'center',
                                      color: '#f87171',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    🔒 {formatted}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>
              <span>Montant (FCFA)</span>
              {isAutoCalculatedMotif && (
                <span 
                  style={{ cursor: 'pointer', color: isMontantLocked ? 'var(--primary)' : 'var(--muted)', fontSize: '0.85rem', fontWeight: 'normal' }}
                  onClick={() => setIsMontantLocked(!isMontantLocked)}
                >
                  {isMontantLocked ? '🔒 Auto' : '🔓 Manuel'}
                </span>
              )}
            </label>
            <input 
              type="number" 
              className="form-input" 
              style={{ width: '100%', background: isMontantLocked && isAutoCalculatedMotif ? 'rgba(255,255,255,0.05)' : '' }}
              placeholder="Montant à régulariser"
              disabled={isMontantLocked && isAutoCalculatedMotif}
              value={newReclamation.montant} 
              onChange={e => setNewReclamation({...newReclamation, montant: parseFloat(e.target.value) || ''})}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
          <button 
            className="btn" 
            onClick={() => setShowAddReclamationModal(false)} 
            style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSaveClick}
            disabled={isSaving}
            style={{ 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { if(!isSaving){ e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.5)'; } }}
            onMouseLeave={e => { if(!isSaving){ e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; } }}
          >
            {isSaving && (
              <svg className="animate-spin" style={{ height: '16px', width: '16px', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReclamationModal;
