import React, { useEffect, useState } from 'react';
import { Download, Building, Wallet, Smartphone, X, FileText, Table } from 'lucide-react';
import ExcelJS from 'exceljs';

const fmt = (n) => (n || 0).toLocaleString('fr-FR');
const formatWithSpaces = (n) => {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

function useCountUp(end, duration = 1500) {
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    let start = 0;
    if (start === end) {
      setAnimatedTotal(end);
      return;
    }
    let startTime = null;
    let animationFrameId;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedTotal(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimatedTotal(end);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return animatedTotal;
}

export default function MasseSalariale({ salaries = [], period = '', payrollSettings = {}, pdfAdminTitle, pdfAdminName, headerLeft, headerRight }) {
  const [exportModalData, setExportModalData] = useState(null);
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
    const isAdministration = (agent.site || '').toUpperCase().includes('ADMINISTRATION');
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
    
    const adjustFontSize = function(data) {
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
        let text = data.cell.raw ? data.cell.raw.toString() : '';
        let len = text.length;
        if (len > 35) {
          data.cell.styles.fontSize = 6.5;
        } else if (len > 25) {
          data.cell.styles.fontSize = 7.5;
        } else if (len > 18) {
          data.cell.styles.fontSize = 8;
        }
      }
    };
    
    if (type === 'virement') {
      doc.setFontSize(14);
      const titleText = title.includes('Non Admin') || !title.includes('Admin')
        ? `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN VIREMENT`
        : `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DU PERSONNEL ADMINISTRATIF EN VIREMENT`;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(titleText, pageWidth / 2, 15, { align: 'center' });
      const tableData = agents.map((a, index) => [
        (index + 1).toString().padStart(2, '0'),
        a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
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
        head: [['N°', 'SITE', 'NOMS & PRENOMS', 'FONCTION', 'BANQUE', 'CODE BANQUE', 'CODE GUICHET', 'N° DE COMPTE', 'RIB', 'SALAIRE']],
        body: tableData,
        theme: 'grid',
        didParseCell: adjustFontSize,
        styles: { fontSize: 9, halign: 'center', valign: 'middle' },
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
        a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
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
        didParseCell: adjustFontSize,
        styles: { fontSize: 9, halign: 'center', valign: 'middle' },
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
        a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
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
        didParseCell: adjustFontSize,
        styles: { fontSize: 9, halign: 'center', valign: 'middle' },
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
      const monthStr = formatMonth(period);
      const dePrefix = /^[AEIOUY]/i.test(monthStr) ? "D'" : "DE ";
      const recapData = [
        ['TOTAL ESPECES ADMINISTRATION', formatNumber(adminTotal)],
        ["TOTAL ESPECES AGENTS D'EXPLOITATION ABIDJAN", formatNumber(exploitTotal)],
        [`TOTAL DES SALAIRES ESPECES ${dePrefix}${monthStr}`, formatNumber(adminTotal + exploitTotal)]
      ];

      doc.autoTable({
        startY: currentY,
        body: recapData,
        theme: 'grid',
        didParseCell: adjustFontSize,
        styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', valign: 'middle' },
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
        a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
        a.name,
        a.function || 'Agent',
        formatNumber(a.net)
      ]);

      const total = agents.reduce((sum, a) => sum + a.net, 0);
      const monthStr = formatMonth(period);
      const dePrefix = /^[AEIOUY]/i.test(monthStr) ? "D'" : "DE ";
      tableData.push(['', '', '', `TOTAL DES SALAIRES ESPECES ${dePrefix}${monthStr}`, formatNumber(total)]);

      doc.autoTable({
        startY: 25,
        head: [['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']],
        body: tableData,
        theme: 'grid',
        didParseCell: adjustFontSize,
        styles: { fontSize: 10, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [173, 216, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: function(data) {
          if (data.row.index === tableData.length - 1 && data.section === 'body') {
            doc.setFillColor(173, 216, 230);
            doc.setFont("helvetica", "bold");
          }
        }
      });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const pdfTitle = pdfAdminTitle || "Administrateur";
    const pdfName = pdfAdminName || "KOFFI Konan Jean Yves";
    const finalPageWidth = doc.internal.pageSize.getWidth();
    doc.text(pdfTitle, finalPageWidth - 14, doc.lastAutoTable.finalY + 20, { align: 'right' });
    doc.text(pdfName, finalPageWidth - 14, doc.lastAutoTable.finalY + 40, { align: 'right' });

    doc.save(`${title.replace(/ /g, '_')}_${period}.pdf`);
    setExportModalData(null);
  };

  const generateExcel = async (agents, title, type = 'virement') => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.substring(0, 31).replace(/[\*\?\/\\\[\]]/g, ''));
    
    // Style de base pour l'en-tête
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    };

    if (type === 'virement') {
      const titleText = title.includes('Non Admin') || !title.includes('Admin')
        ? `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN VIREMENT`
        : `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DU PERSONNEL ADMINISTRATIF EN VIREMENT`;
      
      sheet.mergeCells('A1:J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = titleText;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };
      
      sheet.addRow([]); // Ligne vide

      const headers = ['N°', 'SITE', 'NOMS & PRENOMS', 'FONCTION', 'BANQUE', 'CODE BANQUE', 'CODE GUICHET', 'N° DE COMPTE', 'RIB', 'SALAIRE'];
      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => { Object.assign(cell, headerStyle); });
      
      sheet.columns = [
        { width: 5 }, { width: 25 }, { width: 35 }, { width: 20 },
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 },
        { width: 10 }, { width: 15 }
      ];

      let total = 0;
      agents.forEach((a, idx) => {
        const row = sheet.addRow([
          (idx + 1).toString().padStart(2, '0'),
          a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
          a.name,
          a.function || 'Agent',
          a.banque || '-',
          a.codeBanque || '-',
          a.codeGuichet || '-',
          a.numCompte || '-',
          a.rib || '-',
          a.net
        ]);
        row.getCell(10).numFmt = '#,##0';
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        total += (a.net || 0);
      });

      const totalRow = sheet.addRow(['', '', '', '', '', '', '', '', 'TOTAL DES VIREMENTS', total]);
      totalRow.getCell(10).numFmt = '#,##0';
      totalRow.eachCell((cell, colNumber) => {
        if (colNumber >= 9) {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        }
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      
    } else if (type === 'especes_abidjan') {
      const titleText = `FICHE DES SALAIRES EN ESPCES DU MOIS DE ${formatMonth(period)} DES AGENTS D'ABIDJAN`;
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = titleText;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };
      
      sheet.addRow([]);

      sheet.columns = [
        { width: 5 }, { width: 30 }, { width: 40 }, { width: 25 }, { width: 20 }
      ];

      const adminAgents = agents.filter(a => a.isAdministration);
      const exploitAgents = agents.filter(a => !a.isAdministration);
      const adminTotal = adminAgents.reduce((sum, a) => sum + a.net, 0);
      const exploitTotal = exploitAgents.reduce((sum, a) => sum + a.net, 0);

      // --- 1. PERSONNEL ADMINISTRATION ---
      sheet.addRow(['PERSONNEL ADMINISTRATION']).font = { bold: true, size: 12 };
      const adminHeader = sheet.addRow(['N°', 'SITE', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']);
      adminHeader.eachCell(c => Object.assign(c, headerStyle));
      
      adminAgents.forEach((a, idx) => {
        const row = sheet.addRow([
          (idx + 1).toString().padStart(2, '0'),
          a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
          a.name,
          a.function || 'Agent',
          a.net
        ]);
        row.getCell(5).numFmt = '#,##0';
        row.eachCell(c => { c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      
      const adminTotalRow = sheet.addRow(['', '', '', 'TOTAL PAIE ADMINISTRATION', adminTotal]);
      adminTotalRow.getCell(5).numFmt = '#,##0';
      adminTotalRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; });
      
      sheet.addRow([]);
      sheet.addRow([]);

      // --- 2. AGENTS D'EXPLOITATION ---
      sheet.addRow(["AGENTS D'EXPLOITATION ABIDJAN"]).font = { bold: true, size: 12 };
      const exploitHeader = sheet.addRow(['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']);
      exploitHeader.eachCell(c => Object.assign(c, headerStyle));
      
      exploitAgents.forEach((a, idx) => {
        const row = sheet.addRow([
          (idx + 1).toString().padStart(2, '0'),
          a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
          a.name,
          a.function || 'Agent',
          a.net
        ]);
        row.getCell(5).numFmt = '#,##0';
        row.eachCell(c => { c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      
      const exploitTotalRow = sheet.addRow(['', '', '', 'TOTAL', exploitTotal]);
      exploitTotalRow.getCell(5).numFmt = '#,##0';
      exploitTotalRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; });
      
      sheet.addRow([]);
      sheet.addRow([]);

      // --- 3. RECAPITULATIF ---
      const monthStr = formatMonth(period);
      const dePrefix = /^[AEIOUY]/i.test(monthStr) ? "D'" : "DE ";
      sheet.addRow(['TOTAL ESPECES ADMINISTRATION', adminTotal]).getCell(2).numFmt = '#,##0';
      sheet.addRow(["TOTAL ESPECES AGENTS D'EXPLOITATION ABIDJAN", exploitTotal]).getCell(2).numFmt = '#,##0';
      const grandTotalRow = sheet.addRow([`TOTAL DES SALAIRES ESPECES ${dePrefix}${monthStr}`, adminTotal + exploitTotal]);
      grandTotalRow.getCell(2).numFmt = '#,##0';
      grandTotalRow.font = { bold: true };

    } else {
      let titleText = '';
      if (title.includes('Intérieur')) {
        titleText = `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN ESPCES DE L'INTERIEUR`;
      } else if (title.includes('Mobile Money')) {
        titleText = `FICHE DES SALAIRES DU MOIS DE ${formatMonth(period)} DES AGENTS EN MOBILE MONEY`;
      } else {
        titleText = `${title} - ${formatMonth(period)}`;
      }

      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = titleText;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };
      
      sheet.addRow([]);
      sheet.columns = [
        { width: 5 }, { width: 30 }, { width: 40 }, { width: 25 }, { width: 20 }
      ];

      const headerRow = sheet.addRow(['N°', 'SITES', 'NOMS & PRENOMS', 'FONCTION', 'MONTANT PAIE']);
      headerRow.eachCell(c => Object.assign(c, headerStyle));

      let total = 0;
      agents.forEach((a, idx) => {
        const row = sheet.addRow([
          (idx + 1).toString().padStart(2, '0'),
          a.subsite || a.displayZone || a.zone || (a.site && a.site.includes('/') ? a.site.split('/').pop().trim() : a.site),
          a.name,
          a.function || 'Agent',
          a.net
        ]);
        row.getCell(5).numFmt = '#,##0';
        row.eachCell(c => { c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
        total += (a.net || 0);
      });

      const monthStr = formatMonth(period);
      const dePrefix = /^[AEIOUY]/i.test(monthStr) ? "D'" : "DE ";
      const totalRow = sheet.addRow(['', '', '', `TOTAL DES SALAIRES ESPECES ${dePrefix}${monthStr}`, total]);
      totalRow.getCell(5).numFmt = '#,##0';
      totalRow.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('url');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/ /g, '_')}_${period}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportModalData(null);
  };

  const virementAgents = processedSalaries.filter(a => a.paymentMethod === 'virement' || a.paymentMethod === 'BANQUE' || a.paymentMethod === 'Virement Bancaire');
  const especeAgents = processedSalaries.filter(a => a.paymentMethod === 'especes' || a.paymentMethod === 'Especes');
  const mmAgents = processedSalaries.filter(a => a.paymentMethod === 'mobile_money' || a.paymentMethod === 'MONEY');

  const totalVirements = virementAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalEspeces = especeAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalMM = mmAgents.reduce((sum, a) => sum + (Number(a.net) || 0), 0);
  const totalGlobal = totalVirements + totalEspeces + totalMM;

  const animatedTotal = useCountUp(totalGlobal, 4000);
  const animatedVirements = useCountUp(totalVirements, 3000);
  const animatedEspeces = useCountUp(totalEspeces, 3000);
  const animatedMM = useCountUp(totalMM, 3000);

  return (
    <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out', padding: '30px', position: 'relative' }}>
      
      {/* HEADER SECTION */}
      {headerLeft && (
        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
          {headerLeft}
        </div>
      )}
      {headerRight && (
        <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
          {headerRight}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building size={24} style={{ color: '#38bdf8' }}/> Masse Salariale GLOBALE
        </h3>
        
        <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '24px 48px', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Total Net à Décaisser</div>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', textShadow: '0 4px 15px rgba(56,189,248,0.3)', lineHeight: 1 }}>
            {formatWithSpaces(animatedTotal)} <span style={{ fontSize: '1.5rem', color: '#38bdf8', opacity: 0.8, fontWeight: '700' }}>XOF</span>
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
            {formatWithSpaces(animatedVirements)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }} onClick={() => setExportModalData({ agents: virementAgents.filter(a => !a.isAdministration), title: 'Virements Bancaires (Non Admin)', type: 'virement' })}>
              <Download size={18} /> Export Global (Hors Admin)
            </button>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }} onClick={() => setExportModalData({ agents: virementAgents.filter(a => a.isAdministration), title: 'Virements Bancaires (Admin)', type: 'virement' })}>
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
            {formatWithSpaces(animatedEspeces)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(250,204,21,0.2)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }} onClick={() => setExportModalData({ agents: especeAgents.filter(a => !a.isInterieur), title: 'Espèces (Abidjan)', type: 'especes_abidjan' })}>
              <Download size={18} /> Export Caisse Abidjan
            </button>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px dashed rgba(250,204,21,0.3)' }} onClick={() => setExportModalData({ agents: especeAgents.filter(a => a.isInterieur), title: 'Espèces (Intérieur)', type: 'especes' })}>
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
            {formatWithSpaces(animatedMM)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>XOF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 'bold', background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }} onClick={() => setExportModalData({ agents: mmAgents, title: 'Mobile Money', type: 'especes' })}>
              <Download size={18} /> Export Mobile Money
            </button>
          </div>
        </div>

      </div>

      {exportModalData && (
        <div className="modal-overlay" onClick={() => setExportModalData(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: '24px', maxWidth: '400px', width: '90%', padding: '30px', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <button className="modal-close" onClick={() => setExportModalData(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text)' }}>Choisir le format d'export</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
              Pour: <strong>{exportModalData.title}</strong>
            </p>
            <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '15px', justifyContent: 'center', fontSize: '1.1rem', gap: '10px' }}
                onClick={() => generatePDF(exportModalData.agents, exportModalData.title, exportModalData.type)}
              >
                <FileText size={24} /> Exporter en PDF
              </button>
              <button 
                className="btn btn-success" 
                style={{ padding: '15px', justifyContent: 'center', fontSize: '1.1rem', gap: '10px', background: '#10b981', color: 'white', border: 'none' }}
                onClick={() => generateExcel(exportModalData.agents, exportModalData.title, exportModalData.type)}
              >
                <Table size={24} /> Exporter en Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
