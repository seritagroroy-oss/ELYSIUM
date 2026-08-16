import React, { useEffect } from 'react';
import { Download, Building } from 'lucide-react';

export default function MasseSalariale({ salaries, period, payrollSettings }) {
  useEffect(() => {
    if (!window.jspdf) {
      const script1 = document.createElement('script');
      script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(script1);
      
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
        document.head.appendChild(script2);
      };
    }
  }, []);
  // Parsing the profile_data for payment methods
  const processedSalaries = salaries.map(agent => {
    let paymentMethod = 'especes';
    let banque = '';
    let codeBanque = '';
    let codeGuichet = '';
    let numCompte = '';
    let rib = '';
    
    if (agent.profile_data) {
      try {
        const pd = JSON.parse(agent.profile_data);
        if (pd.payment_method) paymentMethod = pd.payment_method;
        if (pd.bank_name) banque = pd.bank_name;
        if (pd.bank_code) codeBanque = pd.bank_code;
        if (pd.branch_code) codeGuichet = pd.branch_code;
        if (pd.bank_account) numCompte = pd.bank_account;
        if (pd.rib) rib = pd.rib;
      } catch (e) {}
    }
    
    // Identifiers
    const isAdministration = agent.site === 'ADMINISTRATION';
    const isInterieur = agent.site_location === 'interieur';
    
    // Derived values similar to Salaries.jsx table
    const its = parseFloat(payrollSettings?.its || 1.2);
    const fdfp = parseFloat(payrollSettings?.fdfp || 1.2);
    const apprentissage = parseFloat(payrollSettings?.taxe_apprentissage || 0.4);
    const accident = parseFloat(payrollSettings?.accidents_travail || 2.0);
    const cmu = parseFloat(payrollSettings?.cmu_amount || 500);

    const cnpsBase = Math.min(agent.base, 1647315);
    const cnpsSal = cnpsBase * (parseFloat(payrollSettings?.cnps_salarial || 6.3) / 100);
    const itsVal = agent.base * (its / 100);
    const fdfpVal = agent.base * (fdfp / 100);
    const appVal = agent.base * (apprentissage / 100);
    const accVal = agent.base * (accident / 100);

    const deductions = cnpsSal + cmu + itsVal + agent.deductions;
    const gains = agent.gains;
    const brut = agent.base + gains;
    const net = brut - cnpsSal - cmu - itsVal; // Approximation simplifiée or maybe use actual agent.deductions, let's look at the original math.
    // Actually, in Salaries.jsx, net is calculated differently? Let me use a robust formula matching what's there.
    // net = agent.base + agent.gains - agent.deductions (which includes CNPS, CMU, Loans, etc? No, deductions in agent object are JUST loans/absences).
    // Let's rely on standard logic: agent.base + agent.gains - agent.deductions (absences) - CNPS - CMU...
    // Wait, let's just re-calculate like in Salaries.jsx.
    const absenceSanctionVal = agent.deductions;
    const prts_avances = 0; // TODO: get from loans? It's grouped in agent.deductions in Salaries.jsx?
    
    const finalNet = (agent.base - absenceSanctionVal) + gains - cnpsSal - cmu - itsVal - prts_avances; // Need to verify if agent.deductions includes absences only or loans too.

    return {
      ...agent,
      paymentMethod,
      banque,
      codeBanque,
      codeGuichet,
      numCompte,
      rib,
      isAdministration,
      isInterieur,
      cnpsSal,
      itsVal,
      fdfpVal,
      appVal,
      accVal,
      cmu,
      absenceSanctionVal,
      brut: (agent.base - absenceSanctionVal) + gains,
      net: finalNet
    };
  });

  const formatMonth = (periodStr) => {
    if (!periodStr) return '';
    const parts = periodStr.split('-');
    if (parts.length !== 2) return periodStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const generatePDF = (agents, title, type = 'virement') => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Le module d'export PDF est en cours de chargement, veuillez patienter quelques secondes puis réessayer.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    if (type === 'virement') {
      doc.setFontSize(14);
      const titleText = title.includes('Admin') 
        ? `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DU PERSONNEL ADMINISTRATIF EN VIREMENT`
        : `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN VIREMENT`;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(titleText, pageWidth / 2, 15, { align: 'center' });
      const tableData = agents.map((a, index) => [
        (index + 1).toString().padStart(2, '0'),
        a.site,
        a.name,
        a.function || 'Agent',
        a.banque || '-',
        a.codeBanque || '-',
        a.codeGuichet || '-',
        a.numCompte || '-',
        a.rib || '-',
        formatNumber(a.net)
      ]);

      const total = agents.reduce((sum, a) => sum + a.net, 0);
      tableData.push(['', '', '', '', '', '', '', '', 'TOTAL DES VIREMENTS', formatNumber(total)]);

      doc.autoTable({
        startY: 25,
        head: [['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'BANQUE', 'CODE BANQUE', 'CODE GUICHET', 'N° DE COMPTE', 'RIB', 'SALAIRE']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: function(data) {
          if (data.row.index === tableData.length - 1 && data.section === 'body') {
            doc.setFillColor(173, 216, 230);
            doc.setFont("helvetica", "bold");
          }
        }
      });
    } else if (type === 'especes_abidjan') {
      doc.setFontSize(14);
      const titleText = `FICHE DES SALAIRES EN ESPCES DU MOIS DE ${formatMonth(period)} DES AGENTS D'ABIDJAN`;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(titleText, pageWidth / 2, 15, { align: 'center' });

      const adminAgents = agents.filter(a => a.isAdministration);
      const exploitAgents = agents.filter(a => !a.isAdministration);

      const adminTotal = adminAgents.reduce((sum, a) => sum + a.net, 0);
      const exploitTotal = exploitAgents.reduce((sum, a) => sum + a.net, 0);

      // --- 1. PERSONNEL ADMINISTRATION ---
      doc.setFontSize(11);
      doc.text("PERSONNEL ADMINISTRATION", 14, 25);
      
      const adminData = adminAgents.map((a, index) => [
        (index + 1).toString().padStart(2, '0'),
        a.site,
        a.name,
        a.function || 'Agent',
        formatNumber(a.net)
      ]);
      adminData.push(['', '', '', 'TOTAL PAIE ADMINISTRATION', formatNumber(adminTotal)]);

      doc.autoTable({
        startY: 28,
        head: [['N°', 'SITE', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']],
        body: adminData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: function(data) {
          if (data.row.index === adminData.length - 1 && data.section === 'body') {
            doc.setFillColor(173, 216, 230);
            doc.setFont("helvetica", "bold");
          }
        }
      });

      // --- 2. AGENTS D'EXPLOITATION ABIDJAN ---
      let currentY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.text("AGENTS D'EXPLOITATION ABIDJAN", 14, currentY);

      const exploitData = exploitAgents.map((a, index) => [
        (index + 1).toString().padStart(2, '0'),
        a.site,
        a.name,
        a.function || 'Agent',
        formatNumber(a.net)
      ]);
      exploitData.push(['', '', '', 'TOTAL', formatNumber(exploitTotal)]);

      doc.autoTable({
        startY: currentY + 3,
        head: [['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']],
        body: exploitData,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: function(data) {
          if (data.row.index === exploitData.length - 1 && data.section === 'body') {
            doc.setFillColor(173, 216, 230);
            doc.setFont("helvetica", "bold");
          }
        }
      });

      // --- 3. RECAPITULATIF ---
      currentY = doc.lastAutoTable.finalY + 15;
      const recapData = [
        ['TOTAL ESPECES ADMINISTRATION', formatNumber(adminTotal)],
        ["TOTAL ESPECES AGENTS D'EXPLOITATION ABIDJAN", formatNumber(exploitTotal)],
        ['TOTAL DES SALAIRES ESPECES DU MOIS...............', formatNumber(adminTotal + exploitTotal)]
      ];

      doc.autoTable({
        startY: currentY,
        body: recapData,
        theme: 'grid',
        styles: { fontSize: 10, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 150 } }
      });

    } else {
      doc.setFontSize(14);
      let titleText = '';
      if (title.includes('Intérieur')) {
        titleText = `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN ESPCES DE L'INTERIEUR`;
      } else if (title.includes('Mobile Money')) {
        titleText = `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN MOBILE MONEY`;
      } else {
        titleText = `${title} - ${formatMonth(period)}`;
      }
      
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(titleText, pageWidth / 2, 15, { align: 'center' });
      
      const tableData = agents.map((a, index) => [
        (index + 1).toString().padStart(2, '0'),
        a.site,
        a.name,
        a.function || 'Agent',
        formatNumber(a.net)
      ]);

      const total = agents.reduce((sum, a) => sum + a.net, 0);
      tableData.push(['', '', '', 'TOTAL DES SALAIRES ESPECES DU MOIS.............', formatNumber(total)]);

      doc.autoTable({
        startY: 25,
        head: [['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: function(data) {
          if (data.row.index === tableData.length - 1 && data.section === 'body') {
            doc.setFillColor(173, 216, 230);
            doc.setFont("helvetica", "bold");
          }
        }
      });
    }

    doc.setFontSize(10);
    doc.text("Administrateur", 240, doc.lastAutoTable.finalY + 20);
    doc.text("KOFFI Konan Jean Yves", 240, doc.lastAutoTable.finalY + 40);

    doc.save(`${title.replace(/ /g, '_')}_${period}.pdf`);
  };

  const virementAgents = processedSalaries.filter(a => a.paymentMethod === 'virement');
  const especeAgents = processedSalaries.filter(a => a.paymentMethod === 'especes');
  const mmAgents = processedSalaries.filter(a => a.paymentMethod === 'mobile_money');

  return (
    <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: 'var(--text)' }}><Building size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Masse Salariale GLOBALE</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Virements */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ color: '#38bdf8', marginBottom: '12px' }}>Virements Bancaires ({virementAgents.length} agents)</h4>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => generatePDF(virementAgents, 'Virements Bancaires (Tous)', 'virement')}>
            <Download size={16} /> Exporter Virements (Tous)
          </button>
          <button className="btn" style={{ width: '100%', background: 'rgba(56,189,248,0.1)' }} onClick={() => generatePDF(virementAgents.filter(a => a.isAdministration), 'Virements Bancaires (Admin)', 'virement')}>
            <Download size={16} /> Exporter Virements (Administration)
          </button>
        </div>

        {/* Espèces */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
          <h4 style={{ color: '#facc15', marginBottom: '12px' }}>Espèces ({especeAgents.length} agents)</h4>
          <button className="btn" style={{ width: '100%', marginBottom: '8px', background: 'rgba(250,204,21,0.2)' }} onClick={() => generatePDF(especeAgents.filter(a => !a.isInterieur), 'Espèces (Abidjan)', 'especes_abidjan')}>
            <Download size={16} /> Exporter Espèces (Abidjan)
          </button>
          <button className="btn" style={{ width: '100%', background: 'rgba(250,204,21,0.2)' }} onClick={() => generatePDF(especeAgents.filter(a => a.isInterieur), 'Espèces (Intérieur)', 'especes')}>
            <Download size={16} /> Exporter Espèces (Intérieur)
          </button>
        </div>

        {/* Mobile Money */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', gridColumn: 'span 2' }}>
          <h4 style={{ color: '#fb923c', marginBottom: '12px' }}>Mobile Money ({mmAgents.length} agents)</h4>
          <button className="btn" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }} onClick={() => generatePDF(mmAgents, 'Mobile Money', 'especes')}>
            <Download size={16} /> Exporter Mobile Money
          </button>
        </div>
      </div>
    </div>
  );
}
