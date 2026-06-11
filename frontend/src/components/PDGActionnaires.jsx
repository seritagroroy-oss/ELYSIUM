import React, { useState } from 'react';
import { FileText, Download, Share2, Printer, CheckCircle2, TrendingUp, BarChart3, Users } from 'lucide-react';

export default function PDGActionnaires() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2500);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <FileText size={32} /> Rapport aux Actionnaires
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Génération automatique de l'Executive Summary (Bilan Trimestriel).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {generated && (
            <>
              <button style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} /> Diffuser
              </button>
              <button style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} /> Imprimer
              </button>
            </>
          )}
          <button 
            onClick={handleGenerate}
            disabled={generating || generated}
            style={{ background: generated ? '#22c55e' : '#d4af37', color: '#0a0a0a', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: (generating || generated) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
            {generating ? 'Génération IA en cours...' : generated ? <><CheckCircle2 size={18} /> Rapport Prêt</> : <><Download size={18} /> Générer le PDF</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        
        {/* Aperçu du document PDF A4 simulé */}
        <div style={{ 
          background: 'white', 
          width: '100%', 
          maxWidth: '800px', 
          aspectRatio: '1 / 1.414', // Ratio A4
          borderRadius: '8px', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
          padding: '40px',
          color: '#333',
          position: 'relative',
          overflow: 'hidden',
          filter: generating ? 'blur(4px)' : 'none',
          transition: 'filter 0.5s',
          opacity: (generating || generated) ? 1 : 0.4
        }}>
          
          {/* Filigrane */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '6rem', color: 'rgba(0,0,0,0.02)', fontWeight: 'bold', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            Confidentiel
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #d4af37', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: 0, color: '#111', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>ELYSIUM <span style={{ color: '#d4af37' }}>SÉCURITÉ</span></h1>
              <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Executive Summary - Q2 2026</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold' }}>Confidentialité : Critique</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Destiné au Conseil d'Administration</div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#d4af37', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} /> Synthèse Financière
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #d4af37' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Chiffre d'Affaires</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a' }}>1.2 Md FCFA</div>
                <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold' }}>+8.4% vs Q1</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #d4af37' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>EBITDA (Marge)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a' }}>18.4%</div>
                <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold' }}>+1.2 pts</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #d4af37' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Trésorerie Nette</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a' }}>340 M FCFA</div>
                <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 'bold' }}>Stable</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#d4af37', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Ressources Humaines & Opérations
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: '#475569', fontSize: '0.85rem' }}>Indicateur</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>Valeur</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>Tendance</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>Effectif Total Actif</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>428 Agents</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#22c55e' }}>+12</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>Taux de Turnover</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>12%</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#22c55e' }}>-2%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>Heures Supplémentaires (Global)</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>1,240 h</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#ef4444' }}>+140 h</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={{ color: '#d4af37', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} /> Faits Marquants & Risques
            </h2>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#333', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '8px' }}><strong>Acquisition Client :</strong> Signature du contrat "Port Autonome" (+85 agents). Déploiement achevé à 100%.</li>
              <li style={{ marginBottom: '8px' }}><strong>Légal :</strong> Aucun litige prud'homal majeur en cours ce trimestre. Audit de conformité CNPS validé.</li>
              <li><strong>Alerte :</strong> Légère augmentation des coûts des heures supplémentaires sur la Zone Industrielle. Plan d'optimisation RH lancé par le DG.</li>
            </ul>
          </div>

          <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem' }}>
            <div>Généré par l'IA Exécutive Elysium</div>
            <div>Page 1 / 1</div>
          </div>

          {!generated && !generating && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={handleGenerate} style={{ background: '#d4af37', color: '#0a0a0a', border: 'none', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(212,175,55,0.3)' }}>
                <FileText size={24} /> Compiler le Rapport
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
