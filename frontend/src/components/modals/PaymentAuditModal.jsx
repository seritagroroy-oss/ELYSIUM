import React, { useState, useEffect } from 'react';
import { apiCall } from '../../api';
import { Loader2, X, AlertTriangle, UserMinus, UserPlus, CheckCircle2, ShieldCheck, RefreshCcw, ArrowRight } from 'lucide-react';

const formatPeriodFr = (p) => {
  if (!p) return '';
  const [y, m] = p.split('-');
  const date = new Date(y, parseInt(m) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
};

export default function PaymentAuditModal({ currentSalaries, currentPeriod, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [changedAgents, setChangedAgents] = useState([]);
  const [missingAgents, setMissingAgents] = useState([]);
  const [newAgents, setNewAgents] = useState([]);
  const [intactAgents, setIntactAgents] = useState([]);

  useEffect(() => {
    auditData();
  }, []);

  const getPrevPeriod = (p) => {
    if (!p) return null;
    const [y, m] = p.split('-');
    let date = new Date(y, parseInt(m) - 1 - 1, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const parseProfile = (s) => {
    try {
      return typeof s.profile_data === 'string' ? JSON.parse(s.profile_data) : (s.profile_data || {});
    } catch(e) {
      return {};
    }
  };

  const hasPaymentMethod = (prof) => {
    return prof && prof.payment_method && (prof.payment_method === 'MONEY' || prof.payment_method === 'BANQUE');
  };

  const formatPaymentInfo = (prof) => {
    if (prof.payment_method === 'BANQUE') return `Banque: ${prof.payment_rib || 'N/A'}`;
    if (prof.payment_method === 'MONEY') return `${prof.payment_operator}: ${prof.payment_number || 'N/A'}`;
    return 'Non défini';
  };

  const auditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prevPeriod = getPrevPeriod(currentPeriod);
      // Scope company pour chercher tous les agents
      const res = await apiCall('get_salaries', { period: prevPeriod, scope: 'company' });
      
      const prevSalaries = Array.isArray(res) ? res : [];
      
      const changed = [];
      const missing = [];
      const newAg = [];
      const intact = [];

      // Dictionnaires pour accès rapide
      const curMap = new Map();
      currentSalaries.forEach(s => curMap.set(s.id, s));
      
      const curNameMap = new Map();
      currentSalaries.forEach(s => curNameMap.set(String(s.name).toLowerCase().trim(), s));

      // 1. On cherche les disparus ou modifiés
      prevSalaries.forEach(prevS => {
        const prevProf = parseProfile(prevS);
        // On s'intéresse surtout à ceux qui avaient un moyen de paiement
        if (!hasPaymentMethod(prevProf)) return;
        
        let curS = curMap.get(prevS.id);
        
        // Si introuvable par ID, on essaie par nom (cas où l'ID a changé mais le nom est resté identique)
        if (!curS) {
          curS = curNameMap.get(String(prevS.name).toLowerCase().trim());
        }

        if (!curS) {
          // L'agent n'est plus dans la paie actuelle
          missing.push(prevS);
        } else {
          // L'agent y est. Y a t-il un changement ?
          const changes = [];
          if (String(prevS.name).trim() !== String(curS.name).trim()) {
            changes.push(`Nom: "${prevS.name}" ➔ "${curS.name}"`);
          }
          if (String(prevS.site || '').trim() !== String(curS.site || '').trim()) {
            changes.push(`Site: "${prevS.site || 'N/A'}" ➔ "${curS.site || 'N/A'}"`);
          }
          if (String(prevS.function || '').trim() !== String(curS.function || '').trim()) {
            changes.push(`Poste: "${prevS.function || 'N/A'}" ➔ "${curS.function || 'N/A'}"`);
          }
          
          if (changes.length > 0) {
            changed.push({ prev: prevS, cur: curS, changes });
          } else {
            intact.push(curS);
          }
        }
      });

      // 2. On cherche les nouveaux (sans moyen de paiement)
      currentSalaries.forEach(curS => {
        const curProf = parseProfile(curS);
        if (!hasPaymentMethod(curProf)) {
          // L'agent n'a pas de moyen de paiement ce mois-ci. 
          newAg.push(curS);
        }
      });

      setChangedAgents(changed);
      setMissingAgents(missing);
      setNewAgents(newAg);
      setIntactAgents(intact);
      
    } catch (err) {
      console.error(err);
      setError("Impossible de récupérer les archives du mois précédent pour l'audit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '0' }}>
      <div className="glass-panel" style={{ width: '100vw', maxWidth: '100vw', padding: 0, background: '#0f172a', border: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '12px', borderRadius: '16px' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>Audit Automatique des Profils de Paiement</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '0.95rem' }}>
                Comparaison de <strong>{formatPeriodFr(currentPeriod)}</strong> avec le mois précédent (<strong>{formatPeriodFr(getPrevPeriod(currentPeriod))}</strong>)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--muted)' }}>
              <Loader2 className="animate-spin" size={48} style={{ color: '#a78bfa', marginBottom: '20px' }} />
              <p style={{ fontSize: '1.1rem' }}>Analyse des profils et rapprochement des mois en cours...</p>
            </div>
          ) : error ? (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '20px', color: '#ef4444', textAlign: 'center' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0 }}>{error}</p>
              <button onClick={auditData} className="btn btn-primary" style={{ marginTop: '16px', background: '#ef4444' }}>Réessayer</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* SUMMARY STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                  <AlertTriangle size={24} color="#eab308" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#eab308' }}>{changedAgents.length}</div>
                  <div style={{ color: 'rgba(234, 179, 8, 0.8)', fontSize: '0.9rem' }}>Changements Détectés</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                  <UserMinus size={24} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{missingAgents.length}</div>
                  <div style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.9rem' }}>Agents Disparus</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                  <UserPlus size={24} color="#38bdf8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>{newAgents.length}</div>
                  <div style={{ color: 'rgba(56, 189, 248, 0.8)', fontSize: '0.9rem' }}>Nouveaux Sans Paiement</div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
                  <CheckCircle2 size={24} color="#22c55e" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{intactAgents.length}</div>
                  <div style={{ color: 'rgba(34, 197, 94, 0.8)', fontSize: '0.9rem' }}>Profils Intacts</div>
                </div>
              </div>

              {/* LISTS */}
              
              {/* CHANGED */}
              {changedAgents.length > 0 && (
                <div>
                  <h3 style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(234, 179, 8, 0.2)', paddingBottom: '8px' }}>
                    <AlertTriangle size={20} /> Changements Détectés (Toujours dans la paie)
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '25%' }}>Agent (Ce mois-ci)</th>
                          <th style={{ width: '45%' }}>Changements observés (par rapport au mois précédent)</th>
                          <th style={{ width: '30%' }}>Moyen de paiement conservé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changedAgents.map((item, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'bold' }}>{item.cur.name}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {item.changes.map((c, idx) => (
                                  <span key={idx} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{formatPaymentInfo(parseProfile(item.cur))}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MISSING */}
              {missingAgents.length > 0 && (
                <div>
                  <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '8px' }}>
                    <UserMinus size={20} /> Agents Disparus (Avaient un paiement, mais absents ce mois-ci)
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Nom le mois précédent</th>
                          <th style={{ width: '30%' }}>Dernier Site Connu</th>
                          <th style={{ width: '40%' }}>Numéro de paiement perdu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingAgents.map((ag, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>{ag.name}</td>
                            <td style={{ color: 'rgba(255,255,255,0.5)' }}>{ag.site || 'N/A'}</td>
                            <td>
                              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{formatPaymentInfo(parseProfile(ag))}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NEW */}
              {newAgents.length > 0 && (
                <div>
                  <h3 style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '8px' }}>
                    <UserPlus size={20} /> Agents Sans Moyen de Paiement
                  </h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Agent</th>
                          <th style={{ width: '30%' }}>Site / Poste</th>
                          <th style={{ width: '40%' }}>Action requise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newAgents.slice(0, 10).map((ag, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'bold' }}>{ag.name}</td>
                            <td>{ag.site || 'N/A'} • {ag.function || 'N/A'}</td>
                            <td>
                              <span style={{ color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Veuillez importer ou définir le numéro manuellement <ArrowRight size={14}/>
                              </span>
                            </td>
                          </tr>
                        ))}
                        {newAgents.length > 10 && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '12px' }}>
                              ... et {newAgents.length - 10} autres.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {changedAgents.length === 0 && missingAgents.length === 0 && newAgents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#10b981' }}>
                  <ShieldCheck size={64} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0' }}>Aucune anomalie détectée !</h3>
                  <p style={{ color: 'var(--muted)', margin: 0 }}>Tous les agents ayant un moyen de paiement sont parfaitement alignés avec le mois précédent.</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
