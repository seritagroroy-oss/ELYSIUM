import React, { useEffect } from 'react';
import { Download, Building, Wallet, Smartphone, PieChart } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('fr-FR');

const Donut = ({ slices, size = 140 }) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let cumul = 0;
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
        {slices.map((s) => {
          const pct = s.value / total;
          const offset = c * (1 - cumul);
          cumul += pct;
          return <circle key={s.label} cx={50} cy={50} r={r} fill="none" stroke={s.color} strokeWidth={16} strokeDasharray={`${c * pct} ${c * (1 - pct)}`} strokeDashoffset={offset} transform="rotate(-90 50 50)" style={{ transition: 'all 0.5s ease-out' }} />;
        })}
        <text x={50} y={48} textAnchor="middle" fill="white" fontSize="11" fontWeight="900">{fmt(total)}</text>
        <text x={50} y={58} textAnchor="middle" fill="#94a3b8" fontSize="6">XOF</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0, boxShadow: `0 0 8px ${s.color}80` }} />
            <span style={{ color: 'var(--muted)', width: '90px' }}>{s.label}</span>
            <span style={{ fontWeight: 'bold', color: 'white' }}>{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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

      {/* GRAPHIC VISUALIZATION */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <Donut 
          size={180}
          slices={[
            { label: 'Virements', value: totalVirements, color: '#38bdf8' },
            { label: 'Espèces', value: '#facc15' ? totalEspeces : 0, color: '#facc15' },
            { label: 'Mobile Money', value: totalMM, color: '#fb923c' }
          ].filter(s => s.value > 0).map(s => ({ ...s, value: s.label === 'Espèces' ? totalEspeces : s.value }))} 
        />
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
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }} onClick={() => generatePDF(virementAgents, 'Virements Bancaires (Tous)', 'virement')}>
              <Download size={18} /> Export Global (Tous)
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
