import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Printer } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('fr-FR');
const fmtDec = (n) => n ? Number(n).toFixed(1).replace('.', ',') : '';

export default function Payslip({ agent, p, period, payrollSettings, funcLabel }) {
  const [cumuls, setCumuls] = useState({
    base_salary: 0, brut: 0, cnps: 0, its: 0, net: 0, prime_panier: 0, prime_transport: 0
  });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const year = period.split('-')[0];
        const [cumulsRes, settingsRes] = await Promise.all([
          apiCall('get_annual_cumuls', { agent_id: agent.id, period }, 'GET'),
          apiCall('get_settings', {}, 'GET')
        ]);
        if (cumulsRes && cumulsRes.success && cumulsRes.cumuls) {
          setCumuls(cumulsRes.cumuls);
        }
        if (settingsRes) {
          setSettings(settingsRes.settings || settingsRes || {});
        }
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [agent.id, period]);

  const prof = agent.profile_data || {};
  const logoSrc = payrollSettings?.company_logo || '/elysium_logo.png';
  
  const nbreParts = prof.marital_status === 'Marié(e)' ? 2 : 1;
  const enfants = parseInt(prof.children_count) || 0;
  const partsTotal = nbreParts + (enfants * 0.5);

  const embauche = prof.contract_start ? new Date(prof.contract_start).toLocaleDateString('fr-FR') : '';
  const [yearStr, monthStr] = period.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  
  const defaultEnd = new Date(y, m, 0).getDate();
  const cStart = parseInt(settings?.cycle_start) || 1;
  const cEnd = parseInt(settings?.cycle_end) || defaultEnd;

  let startM = m;
  let startY = y;
  
  if (cStart > 1) {
    startM = m - 1;
    if (startM === 0) {
      startM = 12;
      startY = y - 1;
    }
  }

  const startDate = `${cStart.toString().padStart(2, '0')}/${startM.toString().padStart(2, '0')}/${startY}`;
  const endDate = `${cEnd.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
  const paymentDate = new Date(y, m, 0).toLocaleDateString('fr-FR');

  // Compute patronale
  const totalPatronales = (p.cnpsPatronal || 0) + (p.accidentsTravail || 0) + (p.taxeFormation || 0) + (p.taxeApprentissage || 0) + (p.cmuEmployeur || 0);

  // The CSS
  const Tbl = { width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '6px' };
  const Td = { border: '1px solid black', padding: '4px 6px', verticalAlign: 'middle' };
  const Th = { border: '1px solid black', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' };

  return (
    <div style={{ background: 'white', color: 'black', maxWidth: '800px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', fontSize: '11.5px', lineHeight: '1.25' }}>
      
      {/* Header */}
      <table style={Tbl}>
        <tbody>
          <tr>
            <td style={{ ...Td, width: '20%', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle', borderLeft: 'none', borderTop: 'none' }}>BULLETIN DE<br/>PAIE</td>
            <td style={{ ...Td, width: '50%', verticalAlign: 'middle', borderTop: 'none' }}>periode du {startDate} au {endDate}</td>
            <td style={{ ...Td, width: '30%', verticalAlign: 'middle', borderRight: 'none', borderTop: 'none' }}>paiement le {paymentDate}<br/>par:Espèces</td>
          </tr>
        </tbody>
      </table>

      {/* Info Grid */}
      <table style={Tbl}>
        <tbody>
          <tr>
            <td rowSpan={3} style={{ ...Td, width: '25%', textAlign: 'center', verticalAlign: 'middle', borderBottom: 'none', borderLeft: 'none' }}>
              <img src={logoSrc} alt="Logo" style={{ maxWidth: '90%', maxHeight: '60px', objectFit: 'contain' }} />
              <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>SECURITEX</div>
              {/* Removed phrase as requested */}
            </td>
            <td style={Td}>Matricule<br/>{agent.id.substring(0,6).toUpperCase()}</td>
            <td style={Td}>Embauche<br/>{embauche}</td>
            <td style={Td}>Sit.<br/>Matrimoniale<br/>{prof.marital_status || 'Célibataire'}</td>
            <td style={Td}>Nbre<br/>Parts<br/>{fmtDec(partsTotal)}</td>
            <td style={Td}>Coefficient<br/>{prof.coefficient || ''}</td>
            <td style={Td}>Indice<br/>{prof.indice || ''}</td>
            <td style={Td}>Anncienneté<br/>0 an(s)</td>
            <td style={{ ...Td, borderRight: 'none' }}>No de Sécurité<br/>Sociale<br/>{prof.num_secu_sociale || ''}</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...Td, textAlign: 'center' }}>Categorie {prof.categorie || ''}</td>
            <td colSpan={2} style={{ ...Td, textAlign: 'center' }}>Emploi occupé</td>
            <td colSpan={2} style={{ ...Td, textAlign: 'center', borderRight: 'none' }}>Département</td>
          </tr>
          <tr>
            <td colSpan={4} style={{ ...Td, textAlign: 'center' }}>Qualification<br/>{funcLabel(agent.function)}</td>
            <td colSpan={2} style={{ ...Td, textAlign: 'center' }}>Horaire<br/>{agent.heures_travaillees ? `${agent.heures_travaillees}h` : (prof.horaire_mensuel || '173,330')}</td>
            <td colSpan={2} style={{ ...Td, textAlign: 'center', borderRight: 'none' }}>Convention collective interprofessionnelle<br/>{prof.convention_collective || ''}</td>
          </tr>
        </tbody>
      </table>

      {/* Conges & Name */}
      <table style={Tbl}>
        <tbody>
          <tr>
            <td style={{ ...Td, width: '25%', borderBottom: 'none', borderLeft: 'none' }}>SECURITEX</td>
            <td rowSpan={3} style={{ ...Td, width: '75%', textAlign: 'center', verticalAlign: 'middle', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: 'none', borderRight: 'none' }}>
              {agent.name}
            </td>
          </tr>
          <tr>
            <td style={{ ...Td, padding: 0, borderBottom: 'none', borderLeft: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 4px', width: '40%' }}>Repos comp.<br/>conges</td>
                    <td style={{ padding: '2px 4px', width: '20%', borderLeft: '1px solid black' }}>Acquis<br/>0,0</td>
                    <td style={{ padding: '2px 4px', width: '20%', borderLeft: '1px solid black' }}>Reste à<br/>prendre<br/>0,0</td>
                    <td style={{ padding: '2px 4px', width: '20%', borderLeft: '1px solid black' }}>Pris<br/>0,0</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ ...Td, borderBottom: 'none', borderLeft: 'none' }}>
              Dates de congés &nbsp;&nbsp;&nbsp; du<br/>
              <span style={{ display: 'inline-block', width: '70px' }}></span>au
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...Td, borderLeft: 'none', borderRight: 'none' }}>commentaire :</td>
          </tr>
        </tbody>
      </table>

      {/* Main Breakdown */}
      <table style={Tbl}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...Th, width: '4%', borderLeft: 'none' }}>No</th>
            <th rowSpan={2} style={{ ...Th, width: '30%' }}>Designation</th>
            <th rowSpan={2} style={{ ...Th, width: '6%' }}>Nombre</th>
            <th rowSpan={2} style={{ ...Th, width: '8%' }}>Base</th>
            <th colSpan={3} style={Th}>Part Salariale</th>
            <th colSpan={3} style={{ ...Th, borderRight: 'none' }}>Part Patronale</th>
          </tr>
          <tr>
            <th style={{ ...Th, width: '6%' }}>Taux</th>
            <th style={{ ...Th, width: '8%' }}>Gain</th>
            <th style={{ ...Th, width: '8%' }}>Retenue</th>
            <th style={{ ...Th, width: '6%' }}>Taux</th>
            <th style={{ ...Th, width: '8%' }}>Retenue (+)</th>
            <th style={{ ...Th, width: '8%', borderRight: 'none' }}>Retenue (-)</th>
          </tr>
        </thead>
        <tbody>
          {/* Sursalaire */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>102</td>
            <td style={Td}>Sursalaire</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.primeVariable)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.primeVariable)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.primeVariable)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          {/* Prime Costume */}
          {p.gainsCostume > 0 && (
            <tr>
              <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>103</td>
              <td style={Td}>Prime de Costume</td>
              <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.gainsCostume)}</td>
              <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.gainsCostume)}</td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.gainsCostume)}</td>
              <td style={{ ...Td, borderRight: 'none' }}></td>
            </tr>
          )}
          
          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ ...Td, borderRight: 'none', borderLeft: 'none' }}></td>
            <td style={{ ...Td, borderLeft: 'none', textAlign: 'center' }}>BASE IMPOSABLE</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt((p.primeVariable || 0) + (p.gainsCostume || 0))}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', borderRight: 'none' }}>0</td>
          </tr>

          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>100</td>
            <td style={Td}>Salaire de base</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBase)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBase)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          {/* Absences */}
          {payrollSettings?.enable_payslip_absences !== false && (
            <tr>
              <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>104</td>
              <td style={Td}>Absences Déductibles</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(p.absencesDeductibles || 0)} j.</td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={Td}></td>
              <td style={{ ...Td, textAlign: 'right', color: p.retenuesAbsences > 0 ? 'red' : 'inherit' }}>{fmt(p.retenuesAbsences)}</td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={{ ...Td, borderRight: 'none' }}></td>
            </tr>
          )}

          {/* Sanctions */}
          {payrollSettings?.enable_payslip_map !== false && (
            <tr>
              <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>105</td>
              <td style={Td}>Mises à pied / Sanctions</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(p.joursMiseAPied || 0)} j.</td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={Td}></td>
              <td style={{ ...Td, textAlign: 'right', color: p.retenuesSanctions > 0 ? 'red' : 'inherit' }}>{fmt(p.retenuesSanctions)}</td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={{ ...Td, borderRight: 'none' }}></td>
            </tr>
          )}

          {/* Permissions */}
          {payrollSettings?.enable_payslip_permissions !== false && (
            <tr>
              <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>107</td>
              <td style={Td}>Permissions Déductibles</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(p.permissionsDeductibles || 0)} j.</td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={{ ...Td, textAlign: 'right' }}></td>
              <td style={Td}></td>
              <td style={{ ...Td, textAlign: 'right', color: p.retenuesPermissions > 0 ? 'red' : 'inherit' }}>{fmt(p.retenuesPermissions)}</td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={{ ...Td, borderRight: 'none' }}></td>
            </tr>
          )}

          {/* Prime Anciennete */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>101</td>
            <td style={Td}>Prime d'ancienneté</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.primeAnciennete)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.primeAnciennete)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          {/* Base Imposable CNPS informational row */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>106</td>
            <td style={Td}>Base Imposable CNPS</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ ...Td, borderRight: 'none', borderLeft: 'none' }}></td>
            <td style={{ ...Td, borderLeft: 'none', textAlign: 'center' }}>TOTAL BASE IMPOSABLE</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', borderRight: 'none' }}>0</td>
          </tr>

          {/* Retenues Salariales */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>112</td>
            <td style={Td}>Retraite Générale (C.N.P.S)</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(payrollSettings?.cnps_salarial ?? 0)}</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.cnpsSalarial)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>113</td>
            <td style={Td}>CMU Employe</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(payrollSettings?.cmu_amount ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.cmuEmploye)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>120</td>
            <td style={Td}>Impôt sur trait. et sal. (ITS)</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.impotsTaxes)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ ...Td, borderRight: 'none', borderLeft: 'none' }}></td>
            <td style={{ ...Td, borderLeft: 'none', textAlign: 'center' }}>RETENUES SALARIALES</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.totalRetenuesFiscales)}</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', borderRight: 'none' }}>0</td>
          </tr>

          {/* Retenues Patronales */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>116</td>
            <td style={Td}>Accidents du Travail</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(payrollSettings?.accidents_travail ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.accidentsTravail)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>117</td>
            <td style={Td}>CNPS Patronale (Autre)</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(payrollSettings?.cnps_patronal ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.cnpsPatronal)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>118</td>
            <td style={Td}>Taxe Formation Prof. Continue</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(payrollSettings?.taxe_formation ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.taxeFormation)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>119</td>
            <td style={Td}>Taxe d'apprentissage</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmtDec(payrollSettings?.taxe_apprentissage ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.taxeApprentissage)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>121</td>
            <td style={Td}>CMU Employeur</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(payrollSettings?.cmu_amount ?? 0)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.cmuEmployeur)}</td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>
          
          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ ...Td, borderRight: 'none', borderLeft: 'none' }}></td>
            <td style={{ ...Td, borderLeft: 'none', textAlign: 'center' }}>RETENUES PATRONALES</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(totalPatronales)}</td>
            <td style={{ ...Td, textAlign: 'right', borderRight: 'none' }}>0</td>
          </tr>

          {/* Deductions nettes */}
          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>130</td>
            <td style={Td}>Avances et autres retenues</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}></td>
            <td style={{ ...Td, textAlign: 'right' }}></td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.totalDeductionsNettes)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          {payrollSettings?.enable_payslip_reclamations !== false && p.montantReclamations > 0 && (
            <tr>
              <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>131</td>
              <td style={Td}>Régularisation (Réclamations)</td>
              <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.montantReclamations)}</td>
              <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
              <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.montantReclamations)}</td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={Td}></td>
              <td style={{ ...Td, borderRight: 'none' }}></td>
            </tr>
          )}

          <tr>
            <td style={{ ...Td, textAlign: 'right', borderLeft: 'none' }}>127</td>
            <td style={Td}>Net de paie</td>
            <td style={{ ...Td, textAlign: 'right' }}>1.0</td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.netAPayer)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0.0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.netAPayer)}</td>
            <td style={Td}></td>
            <td style={Td}></td>
            <td style={{ ...Td, borderRight: 'none' }}></td>
          </tr>

          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ ...Td, borderRight: 'none', borderLeft: 'none' }}></td>
            <td style={{ ...Td, borderLeft: 'none', textAlign: 'center' }}>TOTAL SALAIRE NET</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>{fmt(p.netAPayer)}</td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={Td}></td>
            <td style={{ ...Td, textAlign: 'right' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', borderRight: 'none' }}>0</td>
          </tr>
        </tbody>
      </table>

      {/* Cumuls Table */}
      <table style={{ ...Tbl, marginBottom: 0, tableLayout: 'fixed', fontSize: '10.5px' }}>
        <thead>
          <tr>
            <th style={{ ...Th, borderLeft: 'none', padding: '2px 4px' }}>Cumul</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Salaire<br/>brut</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Net<br/>Imposable</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Charge<br/>salariale</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Charge<br/>patronales</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Heure<br/>Travaillés</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Heure<br/>Sup</th>
            <th style={{ ...Th, padding: '2px 4px' }}>Avantage en<br/>nature</th>
            <th style={{ ...Th, borderRight: 'none', padding: '2px 4px' }}>NET A<br/>PAYER</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...Td, borderLeft: 'none', padding: '2px 4px' }}>Période</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(p.totalRetenuesFiscales)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(totalPatronales)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>173</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(settings?.avantages_nature_default || 0)}</td>
            <td rowSpan={2} style={{ ...Td, textAlign: 'center', verticalAlign: 'middle', fontSize: '13px', fontWeight: 'bold', borderRight: 'none', padding: '2px 4px' }}>
              {fmt(p.netAPayer)}
            </td>
          </tr>
          <tr>
            <td style={{ ...Td, borderLeft: 'none', padding: '2px 4px' }}>Année</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(cumuls.brut + p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(cumuls.brut + p.salaireBrut)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(cumuls.cnps + cumuls.its + p.totalRetenuesFiscales)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(totalPatronales)}</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>0</td>
            <td style={{ ...Td, textAlign: 'right', padding: '2px 4px', wordBreak: 'break-all' }}>{fmt(settings?.avantages_nature_default || 0)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '5px', fontSize: '11px' }}>
        Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
      </div>
      
      <div className="no-print" style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontFamily: 'sans-serif' }}>
          <Printer size={18} /> Imprimer la Fiche
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; padding: 10mm !important; margin: 0 !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
