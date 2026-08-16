import React, { useEffect } from 'react';
import { Download, Building, Wallet, Smartphone } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('fr-FR');

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
        const pd = typeof agent.profile_data === 'object' ? agent.profile_data : JSON.parse(agent.profile_data);
        if (pd.payment_method) paymentMethod = pd.payment_method;
        
        // Extract correct fields based on PaymentMethodModal logic
        if (pd.payment_bank_name) banque = pd.payment_bank_name;
        if (pd.payment_rib) {
          const rawRib = pd.payment_rib;
          codeBanque = rawRib.substring(0, 5);
          codeGuichet = rawRib.substring(5, 10);
          numCompte = rawRib.substring(10, 22);
          rib = rawRib.substring(22, 24);
        }
      } catch (e) {}
    }
    
    // Identifiers
    const isAdministration = agent.site === 'ADMINISTRATION';
    const isInterieur = agent.site_location === 'interieur';
    
    const net = agent.computedNet || 0;
    
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
      net
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

  const virementAgents = processedSalaries.filter(a => a.paymentMethod === 'virement' || a.paymentMethod === 'BANQUE' || a.paymentMethod === 'Virement Bancaire');
  const especeAgents = processedSalaries.filter(a => a.paymentMethod === 'especes' || a.paymentMethod === 'Especes');
  const mmAgents = processedSalaries.filter(a => a.paymentMethod === 'mobile_money' || a.paymentMethod === 'MONEY');

  const totalVirements = virementAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalEspeces = especeAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalMM = mmAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalGlobal = totalVirements + totalEspeces + totalMM;

  return (
    <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out', padding: '30px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building size={24} style={{ color: '#38bdf8' }}/> Masse Salariale GLOBALE
        </h3>
        
        <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '24px 48px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Total Net à Décaisser</div>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', textShadow: '0 4px 15px rgba(56,189,248,0.3)', lineHeight: 1 }}>
            {fmt(totalGlobal)} <span style={{ fontSize: '1.5rem', color: '#38bdf8', opacity: 0.8, fontWeight: '700' }}>XOF</span>
          </div>
        </div>
      </div>
      
      {/* CARDS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Virements */}
        <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', padding: '24px', borderRadius: '20px', transition: 'all 0.3s ease', cursor: 'default', ':hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(56,189,248,0.1)' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(56,189,248,0.2)', padding: '10px', borderRadius: '12px', color: '#38bdf8' }}><Building size={20} /></div>
              <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Virements</h4>
            </div>
            <span style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{virementAgents.length} agents</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '24px' }}>
            {fmt(totalVirements)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }} onClick={() => generatePDF(virementAgents.filter(a => !a.isAdministration), 'Virements Bancaires (Non Admin)', 'virement')}>
              <Download size={18} /> Export Global (Hors Admin)
            </button>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }} onClick={() => generatePDF(virementAgents.filter(a => a.isAdministration), 'Virements Bancaires (Admin)', 'virement')}>
              <Download size={18} /> Export Administration
            </button>
          </div>
        </div>

        {/* Espèces */}
        <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)', padding: '24px', borderRadius: '20px', transition: 'all 0.3s ease', cursor: 'default', ':hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(250,204,21,0.1)' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(250,204,21,0.2)', padding: '10px', borderRadius: '12px', color: '#facc15' }}><Wallet size={20} /></div>
              <h4 style={{ color: '#facc15', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Espèces</h4>
            </div>
            <span style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{especeAgents.length} agents</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '24px' }}>
            {fmt(totalEspeces)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(250,204,21,0.2)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }} onClick={() => generatePDF(especeAgents.filter(a => !a.isInterieur), 'Espèces (Abidjan)', 'especes_abidjan')}>
              <Download size={18} /> Export Caisse Abidjan
            </button>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px dashed rgba(250,204,21,0.3)' }} onClick={() => generatePDF(especeAgents.filter(a => a.isInterieur), 'Espèces (Intérieur)', 'especes')}>
              <Download size={18} /> Export Caisse Intérieur
            </button>
          </div>
        </div>

        {/* Mobile Money */}
        <div style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', padding: '24px', borderRadius: '20px', transition: 'all 0.3s ease', cursor: 'default', ':hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(251,146,60,0.1)' } }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(251,146,60,0.2)', padding: '10px', borderRadius: '12px', color: '#fb923c' }}><Smartphone size={20} /></div>
              <h4 style={{ color: '#fb923c', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Mobile Money</h4>
            </div>
            <span style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{mmAgents.length} agents</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '24px' }}>
            {fmt(totalMM)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }} onClick={() => generatePDF(mmAgents, 'Mobile Money', 'especes')}>
              <Download size={18} /> Export Mobile Money
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
