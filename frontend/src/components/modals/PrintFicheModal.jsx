import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { apiCall } from '../../api';

// Helper pour parser les dates (ex: 2024-07 -> "JUILLET 2024")
const formatPeriod = (periodStr) => {
  if (!periodStr) return '';
  const date = new Date(periodStr + '-01');
  return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
};

const formatPeriodMonth = (periodStr) => {
  if (!periodStr) return '';
  const date = new Date(periodStr + '-01');
  return date.toLocaleString('fr-FR', { month: 'long' });
};

const formatDateDayMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(dateStr);
  let res = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  // Capitalize first letter of month
  const arr = res.split(' ');
  if (arr.length === 3) {
      arr[1] = arr[1].charAt(0).toUpperCase() + arr[1].slice(1).replace('.', '');
      res = arr.join(' ');
  }
  return res;
};

export default function PrintFicheModal({
  agent,
  period,
  payrollSettings,
  reclamations,
  onClose,
  calculatePayslip,
  parseProfileData,
  fmt
}) {
  const [details, setDetails] = useState({ absences: [], map: [], hs: [], loans: [] });
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    setLoadingDetails(true);
    apiCall('get_agent_period_details', { agent_id: agent.id, period }).then(res => {
      if (res && res.success) {
        setDetails(res.details);
      }
      setLoadingDetails(false);
    }).catch(e => {
      console.error(e);
      setLoadingDetails(false);
    });
  }, [agent.id, period]);

  const p = calculatePayslip(agent);

  const agentAbsences = agent.absence_details || [];
  const agentMaps = agent.map_details || [];
  const agentSp = agent.sp_details || [];
  
  const absList = agentAbsences.length > 0 ? agentAbsences.map(d => formatDateDayMonthYear(d.date) + (d.reason && d.reason !== 'A' ? ` (${d.reason})` : '')) : details.absences.map(d => formatDateDayMonthYear(d));
  const mapList = agentMaps.length > 0 ? agentMaps.map(d => formatDateDayMonthYear(d.date)) : details.map.map(d => formatDateDayMonthYear(d));
  const hsList = agentSp.length > 0 ? agentSp.map(d => `${formatDateDayMonthYear(d.date)} - ${d.shift}`) : details.hs.map(d => {
    const match = String(d).match(/^(\d{4}-\d{2}-\d{2})(.*)/);
    if (match) return `${formatDateDayMonthYear(match[1])}${match[2]}`;
    return d;
  });

  const profileData = parseProfileData(agent.profile_data);
  const pm = profileData.payment_method || 'Especes';
  
  let paymentTitle = pm;
  let paymentDetails = '';
  if (pm === 'MONEY' || pm === 'Mobile Money') {
    const operator = profileData.payment_operator || 'MONEY';
    const num = profileData.payment_number || profileData.payment_phone || '';
    const prefix = profileData.payment_phone_prefix ? `${profileData.payment_phone_prefix} ` : '';
    paymentTitle = `MONEY - ${operator}`;
    paymentDetails = num ? `${prefix}${num}` : '';
  } else if (pm === 'BANQUE' || pm === 'Virement Bancaire') {
    const bankName = profileData.payment_bank_name || profileData.bank_name || 'Banque';
    let acc = profileData.payment_rib || profileData.bank_account || '';
    if (acc.length === 24) {
      acc = `${acc.substring(0, 5)}\u00A0\u00A0\u00A0${acc.substring(5, 10)}\u00A0\u00A0\u00A0${acc.substring(10, 22)}\u00A0\u00A0\u00A0${acc.substring(22, 24)}`;
    }
    paymentTitle = `BANQUE - ${bankName}`;
    paymentDetails = acc;
  } else {
    paymentTitle = pm === 'Especes' ? 'ESPÈCES' : pm;
  }

  const agentRecl = reclamations.filter(r => r.mois_concerne === period && r.agent_nom === agent.name && r.statut === 'Clôturé');

  // Mois concerné (ex: JUILLET)
  const currentMonthName = formatPeriodMonth(period);
  // Mois précédent
  const periodDate = new Date(period + '-01');
  const prevDate = new Date(periodDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonthName = prevDate.toLocaleString('fr-FR', { month: 'long' });

  const cStart = payrollSettings?.cycle_start || 21;
  const cEnd = payrollSettings?.cycle_end || 20;

  const periodeText = `Période de ${currentMonthName.toUpperCase()} : Du ${cStart} ${prevMonthName} au ${cEnd} ${currentMonthName}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000000, padding: '20px', overflowY: 'auto' }}>
      <style>{`@media print { @page { size: portrait; margin: 10mm; } }`}</style>
      <div className="printable-section" style={{ width: '100%', maxWidth: '800px', background: 'white', color: 'black', padding: '40px', borderRadius: '8px', margin: 'auto' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          <button className="btn" onClick={onClose} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>Fermer</button>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={16} /> Imprimer</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '3px solid #0f172a', paddingBottom: '15px' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>FICHE DE POINTAGE & PAIE</h1>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#64748b', fontWeight: 'normal', textTransform: 'capitalize' }}>{periodeText}</h3>
            {(() => {
                const entrantDate = agent.hire_date || agent.entry_date;
                const sortantDate = agent.contract_end || agent.end_date;
                const hasEntrantStatus = agent.attendance?.some(a => a.status === 'ENTRANT') || agent.is_entrant;
                const hasSortantStatus = agent.attendance?.some(a => a.status === 'SORTANT') || agent.is_sortant;
                
                if (hasEntrantStatus && entrantDate) {
                  const d = new Date(entrantDate);
                  const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#0284c7', fontStyle: 'italic', display: 'inline-block', background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                      Cet agent est entrant et a débuté le {formatted}
                    </div>
                  );
                }
                if (hasSortantStatus && sortantDate) {
                  const d = new Date(sortantDate);
                  const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#b91c1c', fontStyle: 'italic', display: 'inline-block', background: '#fee2e2', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                      Cet agent est sortant et a terminé le {formatted}
                    </div>
                  );
                }
                return null;
            })()}
          </div>
          <div style={{ textAlign: 'right', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#0f172a' }}>{agent.name}</h2>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Statut : Salarié / Journalier</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
          {/* Colonne Gains */}
          <div>
            <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 15px', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '8px 8px 0 0', borderBottom: '2px solid #22c55e' }}>
              GAINS & PRIMES
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <tbody>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Salaire de Base</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{fmt(p.salaireBase)}</td></tr>
                {agent.is_special_salary && (
                  <tr>
                    <td colSpan="2" style={{ padding: '4px 15px 12px 15px', borderBottom: '1px solid #e2e8f0', color: '#8b5cf6', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Agent bénéficiant d'un salaire particulier pour cette période.
                    </td>
                  </tr>
                )}
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Heures Supplémentaires</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{fmt(p.gainsHS)}</td></tr>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Primes (Site, Ancienneté...)</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{fmt(p.primeSite + p.primeAnciennete + p.primeVariable + p.gainsCostume)}</td></tr>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Réclamations Validées</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#22c55e', fontWeight: 'bold' }}>+{fmt(p.montantReclamations)}</td></tr>
                <tr><td style={{ padding: '12px 15px', background: '#f8fafc', fontWeight: 'bold', borderRadius: '0 0 0 8px' }}>SALAIRE BRUT</td><td style={{ padding: '12px 15px', background: '#f8fafc', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '0 0 8px 0' }}>{fmt(p.salaireBrut)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Colonne Retenues */}
          <div>
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 15px', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '8px 8px 0 0', borderBottom: '2px solid #ef4444' }}>
              RETENUES & DÉDUCTIONS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <tbody>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Absences / MAP</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ef4444' }}>-{fmt(p.retenuesAbsences + p.retenuesSanctions)}</td></tr>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Ponctions Manuelles</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#f97316' }}>-{fmt(p.montantPonctions)}</td></tr>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Taxes & Impôts (Salarial)</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ef4444' }}>-{fmt(p.totalRetenuesFiscales)}</td></tr>
                <tr><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0' }}>Prêts / Avances</td><td style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ef4444' }}>-{fmt(p.totalDeductionsNettes)}</td></tr>
                <tr><td style={{ padding: '12px 15px', background: '#f8fafc', fontWeight: 'bold', borderRadius: '0 0 0 8px' }}>TOTAL RETENUES</td><td style={{ padding: '12px 15px', background: '#f8fafc', textAlign: 'right', fontWeight: 'bold', color: '#ef4444', fontSize: '1.1rem', borderRadius: '0 0 8px 0' }}>-{fmt(p.retenuesAbsences + p.retenuesSanctions + p.montantPonctions + p.totalRetenuesFiscales + p.totalDeductionsNettes)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mega bloc Net à Payer */}
        <div style={{ background: '#0f172a', color: 'white', borderRadius: '16px', padding: '15px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div>
            <div style={{ fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Net à Payer (FCFA)</div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'capitalize' }}>À régler pour la période de {currentMonthName}</div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px' }}>
            {fmt(p.netAPayer)} <span style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#94a3b8' }}>FCFA</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: '1rem' }}>Détail des Absences & MAP</h3>
            {!loadingDetails ? (
              <ul style={{ paddingLeft: '20px', margin: '5px 0', fontSize: '0.9rem' }}>
                {absList.map((d, i) => <li key={`a-${i}`}>Absence: {d}</li>)}
                {mapList.map((d, i) => <li key={`m-${i}`}>Mise à pied: {d}</li>)}
                {absList.length === 0 && mapList.length === 0 && <li style={{ fontStyle: 'italic', color: '#666' }}>Aucune absence.</li>}
              </ul>
            ) : <span style={{ fontSize: '0.9rem', color: '#666' }}>Chargement...</span>}
          </div>
          
          <div>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: '1rem' }}>Détail des H. Supplémentaires</h3>
            {!loadingDetails ? (
              <ul style={{ paddingLeft: '20px', margin: '5px 0', fontSize: '0.9rem' }}>
                {hsList.map((d, i) => <li key={`h-${i}`}>{d}</li>)}
                {hsList.length === 0 && <li style={{ fontStyle: 'italic', color: '#666' }}>Aucune heure supplémentaire.</li>}
              </ul>
            ) : <span style={{ fontSize: '0.9rem', color: '#666' }}>Chargement...</span>}
          </div>
        </div>

        <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: '1rem' }}>Détail des Réclamations</h3>
            {agentRecl.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: '5px 0', fontSize: '0.9rem' }}>
                {agentRecl.map((r, i) => <li key={i}>{r.type_erreur || r.motif} : {fmt(r.montant || r.montant_estime)} FCFA</li>)}
              </ul>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#666', fontSize: '0.9rem', margin: '5px 0' }}>Aucune réclamation validée.</p>
            )}
          </div>
          
          <div>
            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', fontSize: '1rem' }}>Détail Prêts / Avances</h3>
            {!loadingDetails ? (
              <ul style={{ paddingLeft: '20px', margin: '5px 0', fontSize: '0.9rem' }}>
                {details.loans.map((l, i) => (
                  <li key={`l-${i}`}>Demande du {l.date} : {fmt(l.amount)} FCFA ({l.modality}) - Motif: {l.motif}</li>
                ))}
                {details.loans.length === 0 && <li style={{ fontStyle: 'italic', color: '#666' }}>Aucun prêt enregistré.</li>}
              </ul>
            ) : <span style={{ fontSize: '0.9rem', color: '#666' }}>Chargement...</span>}
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '10px 15px', border: '2px dashed #ccc', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>Informations de Paiement</h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>{paymentTitle}</span>
          </div>
          {paymentDetails && (
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', letterSpacing: '1px' }}>
              {paymentDetails}
            </p>
          )}
        </div>
        
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: '5px', width: '200px', textAlign: 'center' }}>Signature de l'Agent</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '5px', width: '200px', textAlign: 'center' }}>Signature de l'Administration</div>
        </div>
      </div>
    </div>
  );
}
