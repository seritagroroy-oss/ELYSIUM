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
  if (!selectedKpiAgent) return null;

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
          }}>
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
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>👆 Cliquez sur le <strong style={{ color: 'white' }}>nom d'un agent</strong> dans le tableau pour afficher son aperçu salarial.</p>
            </div>
          ) : (() => {
            const agentFunc = selectedKpiAgent.function || '';
            let baseSalary = 0;
            let scObj = null;
            if (selectedKpiAgent.status_change) {
              try { scObj = JSON.parse(selectedKpiAgent.status_change); } catch (e) { }
            }

            let baseSalaryOld = salaryGrid[scObj ? scObj.old_function : agentFunc] || 0;
            let baseSalaryNew = salaryGrid[scObj ? scObj.new_function : agentFunc] || 0;

            if (selectedKpiAgent.salary && parseInt(selectedKpiAgent.salary) > 0) {
              baseSalaryOld = parseInt(selectedKpiAgent.salary);
              baseSalaryNew = parseInt(selectedKpiAgent.salary);
            }

            if (!scObj) {
              baseSalary = baseSalaryOld;
            }

            let overtimes = 0;
            let overtimesGains = 0;
            let overtimesGainsOld = 0;
            let overtimesGainsNew = 0;
            let absenceDays = 0;
            let absenceDaysOld = 0;
            let absenceDaysNew = 0;
            let cost_count = 0;
            let cost_countOld = 0;
            let cost_countNew = 0;
            let dynamicFuncCounts = {};
            let dynamicFuncCountsOld = {};
            let dynamicFuncCountsNew = {};
            const mutatedDates = new Set();
            const ABSENCE_CODES = ['AB', 'A', 'M', 'P', 'MAP', 'ENTRANT', 'REINTEGRATION', 'SORTANT', 'DEMISSION', 'ABANDON'];

            const dkSet = new Set(datesList.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`));

            const activeDatesSet = new Set();
            const activeDatesOldSet = new Set();
            const activeDatesNewSet = new Set();

            let specialBase = 30;
            if (selectedKpiAgent.profile_data && selectedKpiAgent.profile_data.special_service) {
              const spDays = selectedKpiAgent.profile_data.special_service_days || [];
              if (spDays.length > 0 && datesList && datesList.length > 0) {
                let count = 0;
                datesList.forEach(dStr => {
                  const d = new Date(dStr);
                  const jsDay = d.getDay();
                  const appDay = jsDay === 0 ? 7 : jsDay;
                  if (spDays.includes(appDay) || spDays.includes(String(appDay))) {
                    count++;
                  }
                });
                specialBase = count > 0 ? count : (selectedKpiAgent.profile_data.special_service_base || 12);
              } else {
                specialBase = selectedKpiAgent.profile_data.special_service_base || 12;
              }
            }

            (selectedKpiAgent.attendance || []).forEach(att => {
              if (!dkSet.has(att.date)) return;

              const st = String(att.status);
              if (st.startsWith('M|') || st.startsWith('PM|')) {
                mutatedDates.add(att.date);
              } else if (st !== '') {
                activeDatesSet.add(att.date);
                if (scObj && att.date < scObj.date) {
                  activeDatesOldSet.add(att.date);
                } else if (scObj && att.date >= scObj.date) {
                  activeDatesNewSet.add(att.date);
                }
              }

              if (att.shift_code === 'S' || att.shift_code === 'SJ' || att.shift_code === 'SN') {
                if (att.status !== 'A' && att.status !== 'R') {
                  overtimes++;

                  let agentBaseForSp = baseSalary;
                  if (scObj) {
                    agentBaseForSp = (att.date < scObj.date) ? baseSalaryOld : baseSalaryNew;
                  }

                  let gainSp = agentBaseForSp / 30; // Règle absolue

                  if (st.startsWith('Suppl|') || st === 'Suppl_Dest') {
                    const parts = st.split('|');
                    let repFunc = parts[4]; 

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

                    // On cherche la base de l'agent remplacé (soit directement, soit via functions array)
                    let replacedBase = null;
                    if (repFunc) {
                      if (salaryGrid[repFunc]) {
                        replacedBase = salaryGrid[repFunc];
                      } else if (functions && functions.length > 0) {
                        const fMatch = functions.find(f => f.short_name === repFunc || f.name === repFunc);
                        if (fMatch && salaryGrid[fMatch.id]) {
                          replacedBase = salaryGrid[fMatch.id];
                        }
                      }
                    }

                    if (!replacedBase) {
                      replacedBase = salaryGrid['AS'] || 75000;
                    }

                    if (replacedBase) {
                      const replacedDaily = replacedBase / 30; // Règle absolue
                      gainSp = replacedDaily;
                    }
                  }

                  if (scObj && att.date < scObj.date) {
                    overtimesGainsOld += gainSp;
                  } else if (scObj && att.date >= scObj.date) {
                    overtimesGainsNew += gainSp;
                  } else {
                    overtimesGains += gainSp;
                  }
                }
              } else if (att.status && !st.startsWith('M|') && !st.startsWith('PM|') && ABSENCE_CODES.some(c => att.status === c || st.startsWith(c + '|'))) {
                absenceDays++;
                if (scObj && att.date < scObj.date) absenceDaysOld++;
                else if (scObj && att.date >= scObj.date) absenceDaysNew++;
              }

              if (st === 'COST' || st.startsWith('COST|')) {
                cost_count++;
                if (scObj && att.date < scObj.date) cost_countOld++;
                else if (scObj && att.date >= scObj.date) cost_countNew++;
              } else if (st.startsWith('F_')) {
                const fcode = st.substring(2);
                dynamicFuncCounts[fcode] = (dynamicFuncCounts[fcode] || 0) + 1;
                if (scObj && att.date < scObj.date) {
                  dynamicFuncCountsOld[fcode] = (dynamicFuncCountsOld[fcode] || 0) + 1;
                } else if (scObj && att.date >= scObj.date) {
                  dynamicFuncCountsNew[fcode] = (dynamicFuncCountsNew[fcode] || 0) + 1;
                }
              }
            });

            if (datesList.length > 30) {
              const surplus = datesList.length - 30;
              let entrantSortantCount = 0;
              (selectedKpiAgent.attendance || []).forEach(att => {
                if (!dkSet.has(att.date)) return;
                const st = String(att.status);
                if (st === 'ENTRANT' || st === 'REINTEGRATION' || ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || st.startsWith('SORTANT_')) {
                  entrantSortantCount++;
                }
              });
              
              if (entrantSortantCount > 0) {
                const adjust = Math.min(entrantSortantCount, surplus);
                absenceDays = Math.max(0, absenceDays - adjust);
                if (scObj) {
                  if (absenceDaysNew > 0) absenceDaysNew = Math.max(0, absenceDaysNew - adjust);
                  else if (absenceDaysOld > 0) absenceDaysOld = Math.max(0, absenceDaysOld - adjust);
                }
              }
            }

            let activeDays = specialBase;
            let realActive = datesList.length;
            let activeDaysOld = 0;
            let activeDaysNew = 0;

            if (selectedKpiAgent.profile_data && selectedKpiAgent.profile_data.special_service) {
              const attMap = {};
              (selectedKpiAgent.attendance || []).forEach(att => {
                  if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
                  attMap[att.shift_code][att.date] = String(att.status);
              });

              let realWorked = 0;
              let realWorkedOld = 0;
              let realWorkedNew = 0;

              datesList.forEach(dStr => {
                  const d = new Date(dStr);
                  const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  
                  ['J', 'N'].forEach(sc => {
                      const st = attMap[sc]?.[dk];
                      if (st === '1' || st === 'COST' || (st && st.startsWith('COST|')) || (st && st.startsWith('F_'))) {
                          realWorked++;
                          if (scObj && dk < scObj.date) realWorkedOld++;
                          else if (scObj && dk >= scObj.date) realWorkedNew++;
                      }
                  });
              });

              activeDays = realWorked;
              activeDaysOld = realWorkedOld;
              activeDaysNew = realWorkedNew;
              absenceDays = 0;
              absenceDaysOld = 0;
              absenceDaysNew = 0;
            } else {
              const is244872 = ['24h', '48h', '72h'].includes(String(selectedKpiAgent.shift_type).toLowerCase());
            let totalRuptureKpi = 0;
            (selectedKpiAgent.attendance || []).forEach(att => {
              if (!dkSet.has(att.date)) return;
              const st = String(att.status);
              if (st === 'ENTRANT' || st === 'REINTEGRATION' || ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(st) || st.startsWith('SORTANT_') || st.startsWith('M|')) {
                totalRuptureKpi++;
              }
            });

            if (is244872 && totalRuptureKpi > 0) {
              let totalRealWorkedUnits = 0;
              (selectedKpiAgent.attendance || []).forEach(att => {
                if (dkSet.has(att.date) && att.status === '1') {
                   totalRealWorkedUnits++;
                }
              });
              absenceDays = Math.max(0, specialBase - totalRealWorkedUnits);
              
              if (scObj) {
                  absenceDaysOld = 0;
                  absenceDaysNew = absenceDays;
              }
            }

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
                activeDaysNew = activeDays - activeDaysOld;
              } else {
                let countOld = 0;
                let countNew = 0;
                datesList.forEach(d => {
                  const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
            } // END OF ELSE

            let prorataBase = 0;
            let deductions = 0;
            let gains = 0;

            let costBase = salaryGrid['Costume'] || salaryGrid['A-C'] || 90000;
            let costBonus = 0;
            let dynamicBonus = 0;

            if (scObj) {
              prorataBase = Math.round(baseSalaryOld * (activeDaysOld / 30)) + Math.round(baseSalaryNew * (activeDaysNew / 30));
              deductions = Math.round((baseSalaryOld / 30) * absenceDaysOld) + Math.round((baseSalaryNew / 30) * absenceDaysNew);
              gains = Math.round(overtimesGainsOld) + Math.round(overtimesGainsNew);
              costBonus = Math.round(cost_countOld * ((costBase / 30) - (baseSalaryOld / 30))) + Math.round(cost_countNew * ((costBase / 30) - (baseSalaryNew / 30)));

              Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cOld = dynamicFuncCountsOld[fcode] || 0;
                const cNew = dynamicFuncCountsNew[fcode] || 0;
                dynamicBonus += Math.round(cOld * ((fBase / 30) - (baseSalaryOld / 30))) + Math.round(cNew * ((fBase / 30) - (baseSalaryNew / 30)));
              });
            } else {
              prorataBase = Math.round(baseSalary * (activeDays / 30));
              const dailyRate = baseSalary / 30;
              deductions = Math.round(dailyRate * absenceDays);
              gains = Math.round(overtimesGains);
              costBonus = Math.round(cost_count * ((costBase / 30) - dailyRate));

              Object.keys(dynamicFuncCounts).forEach(fcode => {
                const fBase = salaryGrid[fcode] || 75000;
                const cCount = dynamicFuncCounts[fcode] || 0;
                dynamicBonus += Math.round(cCount * ((fBase / 30) - dailyRate));
              });
            }

            if (selectedKpiAgent.is_mutated) {
              prorataBase = 0;
            }

            if (costBonus > 0) {
              gains += costBonus;
            }
            if (dynamicBonus > 0) {
              gains += dynamicBonus;
            }

            const netSalary = Math.max(0, prorataBase + gains - deductions);
            return (
              <>
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
                      {selectedKpiAgent.is_mutated ? 'Supp. uniquement (Déplacement) − Absences' : `${realActive < datesList.length ? `Prorata (${realActive}j)` : 'Base'} + Supp. − Absences (${absenceDays}j)`}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
  );
}
