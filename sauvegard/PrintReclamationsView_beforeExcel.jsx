import React, { useState, useMemo } from 'react';
import { ArrowLeft, Printer, FileText, Download } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('fr-FR');

const formatMonth = (periodStr) => {
  if (!periodStr) return '';
  const parts = periodStr.split('-');
  if (parts.length !== 2) return periodStr;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  const formatted = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function PrintReclamationsView({ 
  reclamations, 
  period, 
  onClose,
  isArchive
}) {
  const [selectedMotif, setSelectedMotif] = useState('');
  const [selectedSousMotif, setSelectedSousMotif] = useState('Tous');
  const [selectedAgents, setSelectedAgents] = useState({});

  // Regrouper les réclamations par motif (reclamation_categorie)
  const motifs = useMemo(() => {
    const map = new Map();
    reclamations.forEach(r => {
      const motif = r.reclamation_categorie || 'Non spécifié';
      if (!map.has(motif)) map.set(motif, []);
      map.get(motif).push(r);
    });
    return Array.from(map.keys()).sort();
  }, [reclamations]);

  // Initialiser le motif sélectionné au premier chargement
  React.useEffect(() => {
    if (motifs.length > 0 && !selectedMotif) {
      setSelectedMotif(motifs[0]);
    }
  }, [motifs, selectedMotif]);

  // Réinitialiser le sous-motif quand le motif principal change
  React.useEffect(() => {
    setSelectedSousMotif('Tous');
  }, [selectedMotif]);

  // Obtenir les réclamations pour le motif sélectionné
  const currentReclamations = useMemo(() => {
    if (!selectedMotif) return [];
    return reclamations.filter(r => (r.reclamation_categorie || 'Non spécifié') === selectedMotif);
  }, [reclamations, selectedMotif]);

  // Extraire les sous-motifs uniques de l'onglet courant
  const sousMotifs = useMemo(() => {
    const set = new Set();
    currentReclamations.forEach(r => {
      const sm = [r.type_erreur, r.type_erreur_autre].filter(Boolean).join(' - ');
      if (sm) set.add(sm);
    });
    return Array.from(set).sort();
  }, [currentReclamations]);

  // Filtrer par sous-motif
  const displayedReclamations = useMemo(() => {
    if (selectedSousMotif === 'Tous') return currentReclamations;
    return currentReclamations.filter(r => {
      const sm = [r.type_erreur, r.type_erreur_autre].filter(Boolean).join(' - ');
      return sm === selectedSousMotif;
    });
  }, [currentReclamations, selectedSousMotif]);

  // Initialiser les cases à cocher pour les éléments affichés
  React.useEffect(() => {
    const newSelected = {};
    displayedReclamations.forEach(r => {
      newSelected[r.id] = true; // Tout est coché par défaut pour ce filtre
    });
    setSelectedAgents(newSelected);
  }, [displayedReclamations]);

  const handleToggleAgent = (id) => {
    setSelectedAgents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAll = (e) => {
    const checked = e.target.checked;
    const newSelected = {};
    displayedReclamations.forEach(r => {
      newSelected[r.id] = checked;
    });
    setSelectedAgents(newSelected);
  };

  const selectedCount = Object.values(selectedAgents).filter(Boolean).length;
  // Les éléments sélectionnés sont toujours pris parmi ceux affichés
  const filteredReclamations = displayedReclamations.filter(r => selectedAgents[r.id]);

  // EXPORT WORD (HTML format)
  const exportWord = () => {
    if (filteredReclamations.length === 0) return alert('Sélectionnez au moins un agent.');
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export Word</title>
    <style>
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style></head><body>`;
    
    let body = `<h2>Réclamations Validées - ${isArchive ? 'Archive' : 'Mois'} : ${formatMonth(period)}</h2>`;
    body += `<h3>Catégorie : ${selectedMotif.toUpperCase()}</h3>`;
    body += `<table><thead><tr>
      <th>N° Fiche</th>
      <th>Agent concerné</th>
      <th>Type / Motif</th>
      <th>Jours</th>
      <th>Montant Estimé</th>
    </tr></thead><tbody>`;
    
    let totalMontantWord = 0;
    filteredReclamations.forEach(r => {
      const motifStr = [r.type_erreur, r.type_erreur_autre].filter(Boolean).join(' - ');
      const montantStr = (selectedMotif.toLowerCase() === 'ponction' && r.montant_estime) ? `-${fmt(r.montant_estime)}` : fmt(r.montant_estime);
      if (r.montant_estime) totalMontantWord += parseFloat(r.montant_estime);
      body += `<tr>
        <td>${r.numero_fiche || '-'}</td>
        <td>${r.agent_nom}</td>
        <td>${motifStr}</td>
        <td>${r.jours_concernes || '-'}</td>
        <td>${montantStr ? `${montantStr} FCFA` : '-'}</td>
      </tr>`;
    });
    
    const totalMontantStrWord = totalMontantWord > 0 ? ((selectedMotif.toLowerCase() === 'ponction') ? `-${fmt(totalMontantWord)}` : fmt(totalMontantWord)) : '-';
    if(totalMontantWord > 0) {
      body += `<tr>
        <td colspan="4" style="text-align:right; font-weight:bold;">TOTAL</td>
        <td style="font-weight:bold;">${totalMontantStrWord !== '-' ? `${totalMontantStrWord} FCFA` : '-'}</td>
      </tr>`;
    }
    
    body += `</tbody></table></body></html>`;
    
    const blob = new Blob(['\ufeff', header + body], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reclamations_${selectedMotif.replace(/[^a-z0-9]/gi, '_')}_${period}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // EXPORT EXCEL (CSV)
  const exportExcel = () => {
    if (filteredReclamations.length === 0) return alert('Sélectionnez au moins un agent.');
    const headers = ['N° Fiche', 'Agent concerné', 'Type / Motif', 'Jours', 'Montant Estimé'];
    let csvContent = headers.join(';') + '\n';
    
    let totalMontantExcel = 0;
    filteredReclamations.forEach(r => {
      const motifStr = [r.type_erreur, r.type_erreur_autre].filter(Boolean).join(' - ');
      const montantStr = (selectedMotif.toLowerCase() === 'ponction' && r.montant_estime) ? `-${r.montant_estime}` : (r.montant_estime || '');
      if (r.montant_estime) totalMontantExcel += parseFloat(r.montant_estime);
      const row = [
        r.numero_fiche || '-',
        r.agent_nom,
        `"${motifStr.replace(/"/g, '""')}"`,
        r.jours_concernes || '',
        montantStr
      ];
      csvContent += row.join(';') + '\n';
    });
    
    const totalMontantStrExcel = totalMontantExcel > 0 ? ((selectedMotif.toLowerCase() === 'ponction') ? `-${totalMontantExcel}` : totalMontantExcel) : '';
    if(totalMontantExcel > 0) {
      csvContent += `;;;TOTAL;${totalMontantStrExcel}\n`;
    }
    
    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reclamations_${selectedMotif.replace(/[^a-z0-9]/gi, '_')}_${period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // EXPORT PDF / PRINT
  const exportPrint = () => {
    if (filteredReclamations.length === 0) return alert('Sélectionnez au moins un agent.');
    
    let htmlContent = `
      <html>
        <head>
          <title>Impression Réclamations</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; }
            h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h3 { color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .montant { text-align: right; font-weight: bold; }
            .ponction { color: #ef4444; }
            .positif { color: #16a34a; }
          </style>
        </head>
        <body>
          <h2>Réclamations Validées - ${isArchive ? 'Archive' : 'Mois'} : ${formatMonth(period)}</h2>
          <h3>Catégorie : <span style="color:#0ea5e9;">${selectedMotif.toUpperCase()}</span></h3>
          <table>
            <thead>
              <tr>
                <th>N° Fiche</th>
                <th>Agent concerné</th>
                <th>Type / Motif</th>
                <th style="text-align:center;">Jours</th>
                <th style="text-align:right;">Montant Estimé</th>
              </tr>
            </thead>
            <tbody>
    `;

    let totalMontantPrint = 0;
    filteredReclamations.forEach(r => {
      const motifStr = [r.type_erreur, r.type_erreur_autre].filter(Boolean).join(' - ');
      const isPonction = selectedMotif.toLowerCase() === 'ponction';
      const isPositif = ['erreur de paie', "justificatif d'absence", 'omission'].includes(selectedMotif.toLowerCase());
      const montantStr = r.montant_estime ? (isPonction ? `-${fmt(r.montant_estime)}` : fmt(r.montant_estime)) : '-';
      if (r.montant_estime) totalMontantPrint += parseFloat(r.montant_estime);
      
      let classColor = '';
      if (isPonction) classColor = 'ponction';
      else if (isPositif) classColor = 'positif';

      htmlContent += `
        <tr>
          <td><strong>${r.numero_fiche || '-'}</strong></td>
          <td><strong>${r.agent_nom}</strong></td>
          <td>${motifStr}</td>
          <td style="text-align:center;">${r.jours_concernes || '-'}</td>
          <td class="montant ${classColor}">${montantStr !== '-' ? `${montantStr} FCFA` : '-'}</td>
        </tr>
      `;
    });

    const isPonctionTotal = selectedMotif.toLowerCase() === 'ponction';
    const isPositifTotal = ['erreur de paie', "justificatif d'absence", 'omission'].includes(selectedMotif.toLowerCase());
    let classColorTotal = '';
    if (isPonctionTotal) classColorTotal = 'ponction';
    else if (isPositifTotal) classColorTotal = 'positif';
    const totalMontantStrPrint = totalMontantPrint > 0 ? (isPonctionTotal ? `-${fmt(totalMontantPrint)}` : fmt(totalMontantPrint)) : '-';
    
    if (totalMontantPrint > 0) {
      htmlContent += `
        <tr>
          <td colspan="4" style="text-align:right; font-weight:bold; font-size:16px;">TOTAL</td>
          <td class="montant ${classColorTotal}" style="font-size:16px;">${totalMontantStrPrint !== '-' ? `${totalMontantStrPrint} FCFA` : '-'}</td>
        </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>
          <div style="margin-top: 40px; font-size: 12px; color: #64748b; text-align: right;">
            Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Attendre que le contenu soit chargé avant de lancer l'impression
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: 'bold' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <ArrowLeft size={18} /> Retour aux Réclamations
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Impression des Réclamations</h2>
          <div style={{ color: 'var(--muted)' }}>
            Période : <strong style={{ color: 'white' }}>{formatMonth(period)}</strong> {isArchive && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '10px' }}>Archive</span>}
          </div>
        </div>
      </div>

      {motifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
          <div style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '20px' }}>📭</div>
          <h3>Aucune réclamation validée pour cette période.</h3>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          
          {/* TABS MOTIFS */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {motifs.map(motif => (
              <button
                key={motif}
                onClick={() => setSelectedMotif(motif)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  background: selectedMotif === motif ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedMotif === motif ? 'white' : 'var(--muted)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (selectedMotif !== motif) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { if (selectedMotif !== motif) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              >
                {motif.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Agents sélectionnés : <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedCount}</span> / {displayedReclamations.length}
              </h3>
              {sousMotifs.length > 1 && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Filtre spécifique :</span>
                  <select 
                    value={selectedSousMotif} 
                    onChange={e => setSelectedSousMotif(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', outline: 'none', maxWidth: '300px' }}
                  >
                    <option value="Tous">Tous les motifs</option>
                    {sousMotifs.map(sm => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={exportWord}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.5)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
              >
                <FileText size={18} /> Word
              </button>
              
              <button
                onClick={exportExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.5)', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
              >
                <Download size={18} /> Excel
              </button>

              <button
                onClick={exportPrint}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Printer size={18} /> Imprimer (PDF)
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-container" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="custom-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={displayedReclamations.length > 0 && selectedCount === displayedReclamations.length}
                      onChange={handleToggleAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th>N° Fiche</th>
                  <th>Agent concerné</th>
                  <th>Type / Motif</th>
                  <th style={{ textAlign: 'center' }}>Jours</th>
                  <th style={{ textAlign: 'right' }}>Montant Estimé</th>
                </tr>
              </thead>
              <tbody>
                {displayedReclamations.map(r => {
                  const isPonction = selectedMotif.toLowerCase() === 'ponction';
                  return (
                    <tr key={r.id} style={{ background: selectedAgents[r.id] ? 'transparent' : 'rgba(0,0,0,0.3)', opacity: selectedAgents[r.id] ? 1 : 0.5, transition: 'all 0.2s' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedAgents[r.id] || false}
                          onChange={() => handleToggleAgent(r.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{r.numero_fiche || '-'}</td>
                      <td style={{ fontWeight: 'bold' }}>{r.agent_nom}</td>
                      <td>
                        <div style={{ color: 'white' }}>{r.type_erreur}</div>
                        {r.type_erreur_autre && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{r.type_erreur_autre}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{r.jours_concernes || '-'}</td>
                      <td style={{ textAlign: 'right', color: isPonction ? '#ef4444' : '#34d399', fontWeight: 'bold' }}>
                        {r.montant_estime 
                          ? (isPonction ? `-${fmt(r.montant_estime)} FCFA` : `${fmt(r.montant_estime)} FCFA`)
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
                {currentReclamations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Aucune donnée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
