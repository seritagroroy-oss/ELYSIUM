import React from 'react';

export default function DashboardKPI({
  selectedKpiAgent,
  setSelectedKpiAgent,
  isScrolled,
  handleKpiMouseDown,
  kpiPos,
  setKpiPos,
  isDraggingKpi,
  salaryGrid,
  datesList
}) {
  return (
    <div 
      onMouseDown={selectedKpiAgent && isScrolled ? handleKpiMouseDown : undefined}
      style={selectedKpiAgent && isScrolled ? { 
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: `translate(calc(-50% + ${kpiPos.x}px), ${kpiPos.y}px)`,
        cursor: isDraggingKpi ? 'grabbing' : 'grab',
        width: 'calc(100% - 48px)',
        maxWidth: '1400px',
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '20px', 
        padding: '20px',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
      } : {
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '20px', 
        margin: '0 0 24px 0',
        padding: '16px 0',
        position: 'relative',
        animation: 'fadeIn 0.5s ease-out'
      }}
    >
      {selectedKpiAgent && (
        <button 
          onClick={() => { setSelectedKpiAgent(null); setKpiPos({ x: 0, y: 0 }); }}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            zIndex: 10
          }}
        >
          ✕
        </button>
      )}
      {!selectedKpiAgent ? (
        <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.15)' }}>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>👆 Cliquez sur le <strong style={{color: 'white'}}>nom d'un agent</strong> dans le tableau pour afficher son aperçu salarial.</p>
        </div>
      ) : (() => {
        const agentFunc = selectedKpiAgent.function || '';
        let baseSalary = 0;
        let scObj = null;
        if (selectedKpiAgent.status_change) {
          try { scObj = JSON.parse(selectedKpiAgent.status_change); } catch(e){}
        }

        let baseSalaryOld = salaryGrid[scObj ? scObj.old_function : agentFunc] || 0;
        let baseSalaryNew = salaryGrid[scObj ? scObj.new_function : agentFunc] || 0;
        
        if (selectedKpiAgent.salary && parseInt(selectedKpiAgent.salary) > 0) {
          baseSalaryOld = parseInt(selectedKpiAgent.salary);
          baseSalaryNew = parseInt(selectedKpiAgent.salary);
        }

        // Si l'agent remplace une fonction précise, son salaire de base pour ce site/journée prend la valeur de la fonction remplacée.
        if ((selectedKpiAgent.is_mutated || selectedKpiAgent.is_extra || selectedKpiAgent.is_releve) && selectedKpiAgent.replaced_functions && selectedKpiAgent.replaced_functions.length > 0) {
            const repF = selectedKpiAgent.replaced_functions[0];
            if (salaryGrid[repF]) {
                baseSalaryOld = salaryGrid[repF];
                baseSalaryNew = salaryGrid[repF];
            }
        }
        
        if (!scObj) {
            baseSalary = baseSalaryOld;
        }
        
        let overtimes = 0;
        let overtimesOld = 0;
        let overtimesNew = 0;
        let absenceDays = 0;
        let absenceDaysOld = 0;
        let absenceDaysNew = 0;
        let cost_count = 0;
        let cost_countOld = 0;
        let cost_countNew = 0;
        let dynamicFuncCounts = {};
        let dynamicFuncCountsOld = {};
        let dynamicFuncCountsNew = {};
        let deductions = 0;
        let gains = 0;

        let costBase = salaryGrid['Costume'] || salaryGrid['A-C'] || 90000;
        let costBonus = 0;
        let dynamicBonus = 0;

        // Group attendance by date to handle overwriting
        const attByDate = {};
        (selectedKpiAgent.attendance || []).forEach(att => {
            if (!dkSet.has(att.date)) return;
            if (!attByDate[att.date]) attByDate[att.date] = [];
            attByDate[att.date].push(att);
        });

        const mutatedDates = new Set();
        // Codes qui représentent des jours non travaillés / déductions (selon api.php)
        const ABSENCE_CODES = ['AB', 'A', 'M', 'P', 'MAP', 'ENTRANT', 'SORTANT', 'DEMISSION', 'ABANDON'];

        const activeDatesSet = new Set();
        const activeDatesOldSet = new Set();
        const activeDatesNewSet = new Set();

        Object.keys(attByDate).forEach(date => {
            const dayAtts = attByDate[date];
            let spAtt = null;
            let normalAtts = [];

            dayAtts.forEach(att => {
                const st = String(att.status);
                if (['S', 'SJ', 'SN'].includes(att.shift_code) && st !== 'A' && st !== 'R' && st !== '') {
                    spAtt = att;
                } else if (['J', 'N'].includes(att.shift_code)) {
                    normalAtts.push(att);
                }
                
                if (st.startsWith('M|') || st.startsWith('PM|')) {
                    mutatedDates.add(att.date);
                }
            });

            if (spAtt) {
                // Supplémentaire trouvé ! On calcule son gain en CFA
                let agentBaseForSp = baseSalary;
                if (scObj) {
                    agentBaseForSp = (date < scObj.date) ? baseSalaryOld : baseSalaryNew;
                }
                
                let gainSp = agentBaseForSp / specialBase; // Scénario C par défaut

                // S'il remplace un agent (Suppl|)
                if (spAtt.status.startsWith('Suppl|')) {
                    const parts = spAtt.status.split('|');
                    let repFunc = parts[4]; // Suppl|dest|agent|motif|rep_func
                    
                    if (!repFunc && selectedKpiAgent.replaced_functions && selectedKpiAgent.replaced_functions.length > 0) {
                        let maxS = -1;
                        selectedKpiAgent.replaced_functions.forEach(f => {
                            const s = salaryGrid[f] || 75000;
                            if (s > maxS) {
                                maxS = s;
                                repFunc = f;
                            }
                        });
                    }

                    if (repFunc && salaryGrid[repFunc]) {
                        const replacedBase = salaryGrid[repFunc];
                        const agentDaily = agentBaseForSp / specialBase;
                        const replacedDaily = replacedBase / specialBase;
                        
                        if (replacedDaily > agentDaily) {
                            // Scénario A : Poste supérieur -> Gagne la différence
                            gainSp = replacedDaily - agentDaily;
                        } else {
                            // Scénario B : Poste inférieur -> S'adapte au taux remplacé
                            gainSp = replacedDaily;
                        }
                    }
                }
                gains += Math.round(gainSp);
                overtimes++; // on l'incrémente ici pour qu'il s'affiche correctement dans le KPI

                // Écraser la vacation normale
                normalAtts.forEach(nAtt => {
                    const nSt = String(nAtt.status);
                    if (nSt !== '' && nSt !== 'R' && !nSt.startsWith('M|') && !nSt.startsWith('PM|')) {
                        // Traité comme une absence pour écraser la vacation normale
                        absenceDays++;
                        if (scObj && date < scObj.date) absenceDaysOld++;
                        else if (scObj && date >= scObj.date) absenceDaysNew++;
                    }
                });

            } else {
                // Pas de supplémentaire, on traite les vacations normales
                normalAtts.forEach(att => {
                    const st = String(att.status);
                    if (st !== '' && !st.startsWith('M|') && !st.startsWith('PM|')) {
                        activeDatesSet.add(att.date);
                        if (scObj && date < scObj.date) activeDatesOldSet.add(att.date);
                        else if (scObj && date >= scObj.date) activeDatesNewSet.add(att.date);
                        
                        if (ABSENCE_CODES.some(c => st === c || st.startsWith(c + '|'))) {
                            absenceDays++;
                            if (scObj && date < scObj.date) absenceDaysOld++;
                            else if (scObj && date >= scObj.date) absenceDaysNew++;
                        }
                    }
                });
            }

            // Bonus divers
            dayAtts.forEach(att => {
                const st = String(att.status);
                if (st === 'COST' || st.startsWith('COST|')) {
                    cost_count++;
                    if (scObj && date < scObj.date) cost_countOld++;
                    else if (scObj && date >= scObj.date) cost_countNew++;
                } else if (st.startsWith('F_')) {
                    const fcode = st.substring(2);
                    dynamicFuncCounts[fcode] = (dynamicFuncCounts[fcode] || 0) + 1;
                    if (scObj && date < scObj.date) {
                        dynamicFuncCountsOld[fcode] = (dynamicFuncCountsOld[fcode] || 0) + 1;
                    } else if (scObj && date >= scObj.date) {
                        dynamicFuncCountsNew[fcode] = (dynamicFuncCountsNew[fcode] || 0) + 1;
                    }
                }
            });
        });

        const specialBase = (selectedKpiAgent.profile_data && selectedKpiAgent.profile_data.special_service) 
            ? (selectedKpiAgent.profile_data.special_service_base || 12) 
            : 30;

        let activeDays = specialBase;
        let realActive = datesList.length;
        let activeDaysOld = 0;
        let activeDaysNew = 0;

        if (selectedKpiAgent.is_mutated && !selectedKpiAgent.is_extra && !selectedKpiAgent.is_releve) {
            realActive = activeDatesSet.size;
            activeDays = realActive === 0 ? 0 : Math.round(realActive * specialBase / datesList.length);
        } else {
            const mutatedDays = mutatedDates.size;
            realActive = datesList.length - mutatedDays;
            activeDays = mutatedDays === 0 ? specialBase : Math.round(realActive * specialBase / datesList.length);
        }
        
        if (scObj) {
            const totalActive = activeDatesOldSet.size + activeDatesNewSet.size;
            if (totalActive > 0) {
                activeDaysOld = Math.round((activeDatesOldSet.size / totalActive) * activeDays);
                activeDaysNew = activeDays - activeDaysOld; // pour garder le total exact
            } else {
                let countOld = 0;
                let countNew = 0;
                datesList.forEach(d => {
                    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    if (dk < scObj.date) countOld++;
                    else countNew++;
                });
                const totalD = countOld + countNew;
                if (totalD > 0) {
                    activeDaysOld = Math.round((countOld / totalD) * activeDays);
                    activeDaysNew = activeDays - activeDaysOld;
                }
            }
        }

        if (scObj) {
            let regularDaysOld = Math.max(0, activeDaysOld - cost_countOld - Object.values(dynamicFuncCountsOld).reduce((a,b)=>a+b, 0));
            let regularDaysNew = Math.max(0, activeDaysNew - cost_countNew - Object.values(dynamicFuncCountsNew).reduce((a,b)=>a+b, 0));
            prorataBase = Math.round(baseSalaryOld * (regularDaysOld / specialBase)) + Math.round(baseSalaryNew * (regularDaysNew / specialBase));
            deductions = Math.round((baseSalaryOld / specialBase) * absenceDaysOld) + Math.round((baseSalaryNew / specialBase) * absenceDaysNew);
            costBonus = Math.round(cost_countOld * (costBase / specialBase)) + Math.round(cost_countNew * (costBase / specialBase));
            
            Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cOld = dynamicFuncCountsOld[fcode] || 0;
                const cNew = dynamicFuncCountsNew[fcode] || 0;
                dynamicBonus += Math.round(cOld * (fBase / specialBase)) + Math.round(cNew * (fBase / specialBase));
            });
        } else {
            let specialDays = cost_count + Object.values(dynamicFuncCounts).reduce((a,b)=>a+b, 0);
            let regularDays = Math.max(0, activeDays - specialDays);
            prorataBase = Math.round(baseSalary * (regularDays / specialBase));
            const dailyRate = baseSalary / specialBase;
            deductions = Math.round(dailyRate * absenceDays);
            costBonus = Math.round(cost_count * (costBase / specialBase));
            
            Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cCount = dynamicFuncCounts[fcode] || 0;
                dynamicBonus += Math.round(cCount * (fBase / specialBase));
            });
        }

        if (costBonus > 0) gains += costBonus;
        if (dynamicBonus > 0) gains += dynamicBonus;

        const netSalary = Math.max(0, prorataBase + gains - deductions);
        return (
          <>
            {/* Card: Salaire de Base */}
            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>💰</span>
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                  Salaire de base — <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: 'normal' }}>{selectedKpiAgent.name}</span>
                </p>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                  {scObj ? 
                      `${baseSalaryOld.toLocaleString('fr-FR')} / ${baseSalaryNew.toLocaleString('fr-FR')}` : 
                      (baseSalary > 0 ? baseSalary.toLocaleString('fr-FR') : '—')
                  } <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>CFA</span>
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>
                  Fonction: {scObj ? `${scObj.old_function || '-'} / ${scObj.new_function || '-'}` : (agentFunc || 'Non définie')}
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>⏱️</span>
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Bonus et Supp.</p>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                  {overtimes > 0 && <span>{overtimes} vac(s)</span>}
                  {overtimes > 0 && cost_count > 0 && <span> • </span>}
                  {cost_count > 0 && <span>{cost_count} COST (+{costBonus.toLocaleString('fr-FR')})</span>}
                  {(overtimes > 0 || cost_count > 0) && Object.keys(dynamicFuncCounts).length > 0 && <span> • </span>}
                  {Object.keys(dynamicFuncCounts).map((fcode, i) => (
                    <span key={fcode}>
                        {i > 0 && ' • '}
                        {dynamicFuncCounts[fcode]} {fcode}
                    </span>
                  ))}
                  {dynamicBonus > 0 && <span> (+{dynamicBonus.toLocaleString('fr-FR')})</span>}
                  {overtimes === 0 && cost_count === 0 && Object.keys(dynamicFuncCounts).length === 0 && <span>0</span>}
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>Absences déduites: {absenceDays} jour(s)</p>
              </div>
            </div>

            <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>💵</span>
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Salaire net (Aperçu)</p>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 0 0', color: 'white' }}>
                  {netSalary > 0 ? netSalary.toLocaleString('fr-FR') : '—'} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)' }}>CFA</span>
                </h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>
                  {realActive < datesList.length ? `Prorata (${realActive}j)` : 'Base'} + Supp. − Absences ({absenceDays}j)
                </p>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
