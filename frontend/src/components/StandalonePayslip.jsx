import React, { useEffect, useState } from 'react';
import Payslip from './Payslip';

export default function StandalonePayslip() {
  const [data, setData] = useState(null);
  const [errorInfo, setErrorInfo] = useState("");

  useEffect(() => {
    try {
      let printData = null;
      if (window.opener && window.opener.payslip_print_data) {
        printData = window.opener.payslip_print_data;
      } else {
        const stored = localStorage.getItem('payslip_print_data');
        if (stored) printData = JSON.parse(stored);
      }
      
      if (printData) {
        setData(printData);
      } else {
        const keys = Object.keys(localStorage).join(', ');
        setErrorInfo(`Aucune donnée trouvée via window.opener ou localStorage. Clés: ${keys}`);
        console.error("Aucune donnée de bulletin trouvée");
      }
    } catch (e) {
      setErrorInfo(e.toString());
      console.error(e);
    }
  }, []);

  if (errorInfo) {
    return <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>Erreur: {errorInfo}</div>;
  }

  if (!data) {
    return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>Chargement du bulletin...</div>;
  }

  const { agent, p, period, payrollSettings, functions } = data;

  const funcLabel = (id) => {
    const f = (functions || []).find(x => x.id === id);
    return f ? f.name : id;
  };

  return (
    <div style={{ background: '#e2e8f0', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      <style>{`
        body { margin: 0; background: #e2e8f0; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }} className="no-print">
        <button 
          onClick={() => window.print()} 
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', fontSize: '16px' }}
        >
          🖨️ Imprimer ce bulletin
        </button>
      </div>
      <div className="print-area" style={{ background: 'white', width: '210mm', minHeight: '297mm', padding: '15px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <Payslip 
          agent={agent} 
          p={p} 
          period={period} 
          payrollSettings={payrollSettings} 
          funcLabel={funcLabel} 
        />
      </div>
    </div>
  );
}
