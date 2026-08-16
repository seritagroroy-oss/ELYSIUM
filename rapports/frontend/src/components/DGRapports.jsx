import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, ChevronRight, Filter, Calendar } from 'lucide-react';

export default function DGRapports() {
  const [reports] = useState([
    { id: 1, title: 'Bilan Social et RH (Mai 2026)', type: 'PDF', status: 'ready', date: '01/06/2026' },
    { id: 2, title: 'Rapport Financier - Masse Salariale', type: 'PDF', status: 'ready', date: '01/06/2026' },
    { id: 3, title: 'Audit Sécurité et Matériel', type: 'Excel', status: 'generating', date: 'En cours...' },
    { id: 4, title: 'Résumé des Réclamations Employés', type: 'PDF', status: 'ready', date: '28/05/2026' },
  ]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#eab308' }}>
            <FileText size={32} /> Rapports Stratégiques
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.5' }}>
            Accédez aux rapports consolidés générés automatiquement pour vos présentations et réunions exécutives.
          </p>
        </div>
        <button style={{ background: '#eab308', color: '#1e293b', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <FileText size={18} /> Générer un nouveau rapport
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'white' }}>Derniers rapports générés</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> Ce mois
            </button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} /> Filtrer
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Titre du Rapport</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Type</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Statut</th>
                <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px', color: 'white', fontWeight: '500' }}>{report.title}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ background: report.type === 'PDF' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: report.type === 'PDF' ? '#ef4444' : '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {report.type}
                    </span>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--muted)' }}>{report.date}</td>
                  <td style={{ padding: '20px' }}>
                    {report.status === 'ready' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '0.9rem' }}>
                        <CheckCircle2 size={16} /> Prêt
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308', fontSize: '0.9rem' }}>
                        <div className="pulse" style={{ width: '8px', height: '8px', background: '#eab308', borderRadius: '50%' }}></div> En génération
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <button disabled={report.status !== 'ready'} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px 16px', borderRadius: '8px', color: report.status === 'ready' ? 'white' : 'var(--muted)', cursor: report.status === 'ready' ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                      <Download size={16} /> Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
