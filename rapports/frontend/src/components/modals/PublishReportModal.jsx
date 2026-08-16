import React, { useRef, useMemo, useEffect, useState } from 'react';
import { apiCall } from '../../api';

// ─── Utilitaires ─────────────────────────────────────────────────────────────
const MONTH_NAMES_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function formatPeriodLabel(period) {
  if (!period) return '';
  const [y, m] = period.split('-');
  return `${MONTH_NAMES_FR[parseInt(m, 10) - 1]} ${y}`;
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('-').reverse().join('/');
}

function getDatesForPeriod(period, cycleStart) {
  try {
    const [year, month] = period.split('-').map(Number);
    const dates = [];
    const b = new Date(year, month - 2, cycleStart || 21);
    const e = new Date(year, month - 1, (cycleStart || 21) - 1);
    let curr = new Date(b);
    while (curr <= e) {
      dates.push(new Date(curr).toISOString().slice(0, 10));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  } catch (err) {
    return [];
  }
}

function buildAgentCounts(agent, leaves, datesList) {
  const agentId = String(agent.id);
  const attMap = {};

  try {
    const att = agent.attendance;
    if (Array.isArray(att)) {
      att.forEach(a => { if (a && a.date) attMap[a.date] = a.status; });
    } else if (att && typeof att === 'object') {
      // Cas où attendance est un objet keyed par date
      Object.entries(att).forEach(([dk, s]) => { attMap[dk] = typeof s === 'string' ? s : (s?.status || ''); });
    }
  } catch (e) {
    console.error('[Report] buildAgentCounts attendance error:', e);
  }

  const agentLeaves = leaves.filter(l => String(l.agent_id) === agentId);

  let present = 0, repos = 0, absent = 0, retard = 0, cp = 0, map = 0, perm = 0, entrant = 0, sortant = 0;

  datesList.forEach(dk => {
    const cpL   = agentLeaves.find(l => l.type === 'CP'  && l.start_date <= dk && l.end_date >= dk);
    const mapL  = agentLeaves.find(l => l.type === 'MAP' && l.start_date <= dk && l.end_date >= dk);
    const permL = agentLeaves.find(l => l.type === 'P'   && l.start_date <= dk && l.end_date >= dk);
    if (cpL)        { cp++;      return; }
    if (mapL)       { map++;     return; }
    if (permL)      { perm++;    return; }
    const st = attMap[dk] || '';
    if (st === '1')                                         present++;
    else if (st === 'R')                                    repos++;
    else if (st === 'A' || st === 'M')                      absent++;
    else if (st === 'Ret' || st === 'ret')                  retard++;
    else if (st === 'ENTRANT' || st === 'entrant')          entrant++;
    else if (st === 'SORTANT' || st?.startsWith?.('SORTANT_') || st === 'ABANDON') sortant++;
  });

  return { present, repos, absent, retard, cp, map, perm, entrant, sortant, total: datesList.length };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PublishReportModal({ period, cycleStart, siteData = [], leaves = [], user, sites = [], onClose }) {
  const printRef = useRef();
  
  const [localSiteData, setLocalSiteData] = useState(siteData);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(siteData.length === 0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lostSitesData, setLostSitesData] = useState([]);

  // Chargement global si siteData est vide
  useEffect(() => {
    let isMounted = true;
    
    // On charge toujours les sites perdus, peu importe si siteData est déjà là
    const fetchLostSites = async () => {
      try {
        const lsRes = await apiCall('get_lost_sites');
        if (lsRes && lsRes.success && isMounted) {
          setLostSitesData(lsRes.lost_sites || []);
        }
      } catch (e) {
        console.error("Erreur chargement sites perdus:", e);
      }
    };
    fetchLostSites();

    if (siteData.length > 0) {
      setLocalSiteData(siteData);
      setIsLoadingGlobal(false);
      return () => { isMounted = false; };
    }

    const fetchGlobalData = async () => {
      setIsLoadingGlobal(true);
      try {
        let allSubsites = [];
        let completed = 0;
        
        // On récupère aussi les sites en dur par défaut
        const allSitesToFetch = [...sites];
        const hardcoded = ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc'];
        hardcoded.forEach(id => {
          if (!allSitesToFetch.find(s => s.id === id)) {
            allSitesToFetch.push({ id });
          }
        });

        // Batch processing to avoid crashing the server
        for (let i = 0; i < allSitesToFetch.length; i += 3) {
          const batch = allSitesToFetch.slice(i, i + 3);
          const promises = batch.map(s => apiCall('get_site_data', { period, site_id: s.id }, 'GET'));
          const results = await Promise.all(promises);
          
          results.forEach(res => {
            if (Array.isArray(res)) {
              allSubsites.push(...res);
            }
          });
          
          completed += batch.length;
          if (isMounted) setLoadingProgress(Math.min(100, Math.round((completed / allSitesToFetch.length) * 100)));
        }

        if (isMounted) {
          setLocalSiteData(allSubsites);
        }
      } catch (err) {
        console.error("Erreur chargement global:", err);
      } finally {
        if (isMounted) setIsLoadingGlobal(false);
      }
    };

    fetchGlobalData();
    return () => { isMounted = false; };
  }, [siteData, period, sites]);

  const datesList = useMemo(() => getDatesForPeriod(period, cycleStart), [period, cycleStart]);

  const reportData = useMemo(() => {
    try {
      return (localSiteData || []).map(subsite => {
        const agents = (subsite.agents || []).filter(a => a && a.name).map(agent => ({
          ...agent,
          counts: buildAgentCounts(agent, leaves, datesList)
        }));
        return { ...subsite, agents };
      });
    } catch (e) {
      console.error('[Report] reportData build error:', e);
      return [];
    }
  }, [localSiteData, leaves, datesList]);

  const publishedDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodLabel = formatPeriodLabel(period);

  let cycleRange = '';
  try {
    const [py, pm] = (period || '').split('-').map(Number);
    const s = cycleStart || 21;
    const b = new Date(py, pm - 2, s);
    const e = new Date(py, pm - 1, s - 1);
    cycleRange = `${formatDateFR(b.toISOString().slice(0,10))} → ${formatDateFR(e.toISOString().slice(0,10))}`;
  } catch (e) {
    cycleRange = period || '';
  }

  // ─── Impression ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return;
    
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport de Pointage</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            @page { size: landscape; margin: 1.5cm; }
            body { 
              font-family: 'Outfit', sans-serif, system-ui, -apple-system, sans-serif;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    doc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  // ─── Export DOCX (import dynamique) ──────────────────────────────────────
  const handleExportDocx = async () => {
    try {
      const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, PageOrientation } = await import('docx');
      const { saveAs } = await import('file-saver');

      const children = [];

      children.push(
        new Paragraph({ text: 'RAPPORT DE POINTAGE', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Période : ${periodLabel}`, bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Cycle : ${cycleRange}`, size: 22 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Publié par : ${user?.name || user?.email || 'N/A'} — ${publishedDate}`, size: 20 })], alignment: AlignmentType.CENTER }),
      );

      const HEADERS = ['Agent', 'Fonction', 'Vac.', 'Présents', 'Repos', 'Absents', 'Retards', 'CP', 'MAP', 'Perm.', 'Entrant', 'Sortant'];

      reportData.forEach((subsite, si) => {
        children.push(new Paragraph({ text: `Site : ${subsite.name || `Poste ${si + 1}`}`, heading: HeadingLevel.HEADING_2 }));

        const mkCell = (text, bold = false, bg = undefined) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(text || ''), bold, size: 16 })], alignment: AlignmentType.CENTER })],
          ...(bg ? { shading: { fill: bg } } : {}),
        });

        const headerRow = new TableRow({ tableHeader: true, children: HEADERS.map(h => mkCell(h, true, '1e3a5f')) });

        const rows = subsite.agents.map(a => {
          const c = a.counts;
          return new TableRow({ children: [mkCell(a.name, true), mkCell(a.function || '—'), mkCell(a.shift_type?.[0] || 'J'), mkCell(c.present), mkCell(c.repos), mkCell(c.absent), mkCell(c.retard), mkCell(c.cp), mkCell(c.map), mkCell(c.perm), mkCell(c.entrant), mkCell(c.sortant)] });
        });

        children.push(new Table({ rows: [headerRow, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } }));
        children.push(new Paragraph({ text: '' }));
      });

      const doc = new Document({
        sections: [{
          properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `rapport_pointage_${period}.docx`);
    } catch (err) {
      console.error('[Report] DOCX export error:', err);
      alert('Erreur lors de la génération du DOCX : ' + err.message);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const COL_HEADERS = ['Agent', 'Fonction', 'Vac.', 'Présents', 'Repos', 'Absents', 'Retards', 'CP', 'MAP', 'Perm.', 'Entrant', 'Sortant'];

  return (
    <div className="report-modal" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="report-header" style={{ background: '#1e293b', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            📋
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Rapport de Pointage — {periodLabel}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Cycle : {cycleRange} · {publishedDate} · {user?.name || 'PCC'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} disabled={isLoadingGlobal} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, opacity: isLoadingGlobal ? 0.5 : 1 }}>
            🖨️ Imprimer / PDF
          </button>
          <button onClick={handleExportDocx} disabled={isLoadingGlobal} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, opacity: isLoadingGlobal ? 0.5 : 1 }}>
            📄 Exporter DOCX
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="report-scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {isLoadingGlobal ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px' }}>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</div>
            <h3 style={{ color: '#1e293b', fontSize: '1.2rem' }}>Génération du Méga-Rapport en cours...</h3>
            <p style={{ color: '#64748b' }}>Récupération des agents de tous les sites ({loadingProgress}%)</p>
            <div style={{ width: '300px', height: '6px', background: '#e2e8f0', borderRadius: '3px', margin: '20px auto', overflow: 'hidden' }}>
              <div style={{ width: `${loadingProgress}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        ) : (
          <div ref={printRef} style={{ width: '100%', maxWidth: '1200px', minHeight: '794px', background: '#fff', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', borderRadius: 12 }}>
            <div className="print-section">
              <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Rapport de pointage de {periodLabel}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0, fontWeight: 500 }}>
                  Cycle : {cycleRange}
                </p>
              </div>
              {(() => {
                let globalRomanCounter = 1;
                const toRoman = (num) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][num - 1] || num;

                const renderSection = (title, conditionFn, dateColor = '#475569') => {
                  let counter = 1;
                  const agentsList = [];
                  
                  // Helper for consecutive dates formatting
                  const formatDatesAsRanges = (dateStrings) => {
                    if (!dateStrings || dateStrings.length === 0) return '';
                    if (dateStrings.length === 1) return dateStrings[0];
                    
                    // Convert back to Date objects for comparison
                    const dates = dateStrings.map(d => {
                      const [day, month, year] = d.split('/');
                      return new Date(year, month - 1, day);
                    }).sort((a, b) => a - b);
                    
                    const ranges = [];
                    let rangeStart = dates[0];
                    let rangeEnd = dates[0];
                    
                    const pushRange = () => {
                      if (rangeStart.getTime() === rangeEnd.getTime()) {
                        ranges.push(rangeStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
                      } else {
                        const startStr = rangeStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const endStr = rangeEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        ranges.push(`Du ${startStr} au ${endStr}`);
                      }
                    };

                    for (let i = 1; i < dates.length; i++) {
                      const diffTime = Math.abs(dates[i] - rangeEnd);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                      if (diffDays === 1) {
                        rangeEnd = dates[i];
                      } else {
                        pushRange();
                        rangeStart = dates[i];
                        rangeEnd = dates[i];
                      }
                    }
                    pushRange();
                    
                    return ranges.join(', ');
                  };

                  reportData.forEach(subsite => {
                    (subsite.agents || []).forEach(agent => {
                      const attMap = {};
                      if (Array.isArray(agent.attendance)) {
                        agent.attendance.forEach(a => { 
                          if (a?.date) {
                            const dateKey = String(a.date).slice(0, 10);
                            attMap[dateKey] = a.status; 
                          }
                        });
                      }
                      const agentLeaves = leaves.filter(l => String(l.agent_id) === String(agent.id));
                      const matchDates = [];
                      datesList.forEach(dk => {
                        if (conditionFn(dk, attMap, agentLeaves)) {
                          matchDates.push(new Date(dk).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
                        }
                      });
                      
                      if (matchDates.length > 0) {
                        if (title.includes('ENTRANTS')) {
                          // Pour les entrants, la date de début est le lendemain du dernier jour "ENTRANT" pointé
                          const lastDateStr = matchDates[matchDates.length - 1];
                          const [d, m, y] = lastDateStr.split('/');
                          const startDate = new Date(y, m - 1, parseInt(d) + 1);
                          agentsList.push({
                            id: `${subsite.id}-${agent.id}`,
                            name: agent.name,
                            site: subsite.name,
                            count: '-',
                            datesFormatted: `A débuté le ${startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                          });
                        } else if (title.includes('SORTANTS')) {
                          // Pour les sortants, la date de départ est la veille du premier jour "SORTANT" pointé
                          const firstDateStr = matchDates[0];
                          const [d, m, y] = firstDateStr.split('/');
                          const leaveDate = new Date(y, m - 1, parseInt(d) - 1);
                          agentsList.push({
                            id: `${subsite.id}-${agent.id}`,
                            name: agent.name,
                            site: subsite.name,
                            count: '-',
                            datesFormatted: `A quitté le ${leaveDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                          });
                        } else {
                          agentsList.push({
                            id: `${subsite.id}-${agent.id}`,
                            name: agent.name,
                            site: subsite.name,
                            count: matchDates.length,
                            datesFormatted: formatDatesAsRanges(matchDates)
                          });
                        }
                      }
                    });
                  });

                  const sectionBlock = (
                    <div key={title} style={{ marginBottom: '40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '16px', textTransform: 'uppercase', borderBottom: '2px solid #818cf8', padding: '12px 16px', textAlign: 'center', background: '#e0e7ff', borderRadius: '8px 8px 0 0', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)' }}>
                        {toRoman(globalRomanCounter)}- {title}
                      </h3>
                      
                      {agentsList.length > 0 ? (
                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                            <thead style={{ background: '#eef2ff', borderBottom: '2px solid #c7d2fe' }}>
                              <tr>
                                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3730a3', width: '50px' }}>N°</th>
                                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3730a3', width: '25%' }}>Agent</th>
                                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3730a3', width: '20%' }}>Site / Zone</th>
                                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3730a3', width: '15%' }}>Nombre de jour(s)</th>
                                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3730a3' }}>Période / Dates concernées</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agentsList.map((ag) => (
                                <tr key={ag.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{counter++}</td>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{ag.name}</td>
                                  <td style={{ padding: '10px 16px', color: '#334155' }}>{ag.site}</td>
                                  <td style={{ padding: '10px 16px', color: '#334155' }}>
                                    {ag.count !== '-' ? (
                                      <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
                                        {ag.count} j
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 16px', color: dateColor, fontWeight: dateColor !== '#475569' ? 700 : 400, lineHeight: '1.4' }}>{ag.datesFormatted}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                          Aucun agent concerné.
                        </div>
                      )}
                    </div>
                  );
                  globalRomanCounter++;
                  return sectionBlock;
                };

                const sections = [
                  renderSection('AGENTS OU PERSONNELS ABSENTS AU COURS DU MOIS', (dk, attMap) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'A' || st === 'M';
                  }, '#ef4444'),
                  renderSection('AGENTS EN CONGÉ', (dk, attMap, agentLeaves) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'CP' || agentLeaves.some(l => l.type === 'CP' && String(l.start_date).slice(0, 10) <= dk && String(l.end_date).slice(0, 10) >= dk);
                  }),
                  renderSection('AGENTS EN PERMISSION', (dk, attMap, agentLeaves) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'P' || agentLeaves.some(l => l.type === 'P' && String(l.start_date).slice(0, 10) <= dk && String(l.end_date).slice(0, 10) >= dk);
                  }),
                  renderSection('AGENTS EN MISE À PIED', (dk, attMap, agentLeaves) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'MAP' || agentLeaves.some(l => l.type === 'MAP' && String(l.start_date).slice(0, 10) <= dk && String(l.end_date).slice(0, 10) >= dk);
                  }, '#ef4444'),
                  renderSection('AGENTS ABANDON', (dk, attMap) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'ABANDON';
                  }),
                  renderSection('AGENTS DÉMISSIONNAIRES', (dk, attMap) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st.includes('DEMISSION') || st.includes('DÉMISSION');
                  }, '#ef4444'),
                  renderSection('AGENTS ENTRANTS', (dk, attMap) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'ENTRANT' || st === 'ENT';
                  }),
                  renderSection('AGENTS SORTANTS', (dk, attMap) => {
                    const st = String(attMap[dk] || '').toUpperCase().trim();
                    return st === 'SORTANT' || st === 'SOR' || (st.startsWith('SORTANT_') && !st.includes('DEMISSION') && !st.includes('ABANDON'));
                  })
                ];
                
                const lostSitesBlock = (
                  <div key="SITES_PERDUS" style={{ marginBottom: '40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '16px', textTransform: 'uppercase', borderBottom: '2px solid #818cf8', padding: '12px 16px', textAlign: 'center', background: '#e0e7ff', borderRadius: '8px 8px 0 0', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)' }}>
                      {toRoman(globalRomanCounter++)}- SITES PERDUS
                    </h3>
                    
                    {lostSitesData.length > 0 ? (
                      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                          <thead style={{ background: '#fef2f2', borderBottom: '2px solid #fecaca' }}>
                            <tr>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#991b1b', width: '50px' }}>N°</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#991b1b', width: '30%' }}>Site / Zone</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#991b1b', width: '25%' }}>Motif de perte</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#991b1b', width: '20%' }}>Date de rupture</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#991b1b' }}>Nombre d'agents perdus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lostSitesData.map((site, index) => {
                              const ruptureDate = site.contract_end_date 
                                ? new Date(site.contract_end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                : 'Non définie';
                              return (
                                <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{index + 1}</td>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#ef4444' }}>{site.site_name} - {site.name}</td>
                                  <td style={{ padding: '10px 16px', color: '#334155' }}>{site.contract_end_motif || 'Non précisé'}</td>
                                  <td style={{ padding: '10px 16px', color: '#334155', fontStyle: ruptureDate === 'Non définie' ? 'italic' : 'normal' }}>{ruptureDate}</td>
                                  <td style={{ padding: '10px 16px', color: '#334155' }}>
                                    {(site.lost_agents_summary && site.lost_agents_summary.length > 0) ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {site.lost_agents_summary.map((line, idx) => (
                                          <span key={idx} style={{ display: 'inline-block', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', width: 'fit-content' }}>
                                            {line}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Aucun agent précisé</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        Aucun site perdu.
                      </div>
                    )}
                  </div>
                );
                sections.push(lostSitesBlock);

                const activeSections = sections.filter(Boolean);
                if (activeSections.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                      <div>Aucune donnée à afficher pour cette période.</div>
                    </div>
                  );
                }
                return activeSections;
              })()}
              
              <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 16, borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.8rem' }}>
                Document généré par ELYSIUM — Gestion du Personnel · {publishedDate}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
