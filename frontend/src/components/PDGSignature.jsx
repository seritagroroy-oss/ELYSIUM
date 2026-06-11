import React, { useState, useRef } from 'react';
import { PenTool, UploadCloud, CheckCircle2, FileText, Download, Fingerprint } from 'lucide-react';

export default function PDGSignature() {
  const [mode, setMode] = useState('draw'); // draw, upload, stamp
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSign = () => {
    setSigned(true);
    setTimeout(() => {
      setSigned(false);
      clearCanvas();
    }, 3000);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <PenTool size={32} /> Signature Électronique Exécutive
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Apposez votre cachet numérique souverain sur les documents nécessitant la validation finale.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Liste des documents en attente */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#d4af37" /> Documents en attente
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 1, type: 'PV Réunion', name: 'CODIR - Bilan Trimestriel', date: '05/06/2026' },
              { id: 2, type: 'Validation Budgétaire', name: 'Achat Matériel Zone Nord', date: '06/06/2026' },
              { id: 3, type: 'Contrat', name: 'Prestataire Nettoyage Siège', date: '07/06/2026' }
            ].map(doc => (
              <div key={doc.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#d4af37', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{doc.type}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{doc.date}</span>
                </div>
                <div style={{ color: 'white', fontWeight: '500' }}>{doc.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Espace de signature */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '32px' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <button onClick={() => setMode('draw')} style={{ background: mode === 'draw' ? 'rgba(212,175,55,0.1)' : 'transparent', color: mode === 'draw' ? '#d4af37' : 'var(--muted)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: mode === 'draw' ? 'bold' : 'normal', transition: 'all 0.2s' }}>
              <PenTool size={18} /> Dessiner
            </button>
            <button onClick={() => setMode('upload')} style={{ background: mode === 'upload' ? 'rgba(212,175,55,0.1)' : 'transparent', color: mode === 'upload' ? '#d4af37' : 'var(--muted)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: mode === 'upload' ? 'bold' : 'normal', transition: 'all 0.2s' }}>
              <UploadCloud size={18} /> Importer Image
            </button>
            <button onClick={() => setMode('stamp')} style={{ background: mode === 'stamp' ? 'rgba(212,175,55,0.1)' : 'transparent', color: mode === 'stamp' ? '#d4af37' : 'var(--muted)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: mode === 'stamp' ? 'bold' : 'normal', transition: 'all 0.2s' }}>
              <Fingerprint size={18} /> Tampon Numérique
            </button>
          </div>

          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {mode === 'draw' && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>Dessinez votre signature à la souris ou au doigt</p>
                <div style={{ background: 'white', borderRadius: '12px', padding: '10px', display: 'inline-block' }}>
                  <canvas ref={canvasRef} width={500} height={200} style={{ border: '2px dashed #e2e8f0', borderRadius: '8px', cursor: 'crosshair' }}></canvas>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button onClick={clearCanvas} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Effacer</button>
                </div>
              </div>
            )}

            {mode === 'upload' && (
              <div style={{ width: '100%', border: '2px dashed rgba(212,175,55,0.4)', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(212,175,55,0.02)' }}>
                <UploadCloud size={48} color="#d4af37" style={{ marginBottom: '16px' }} />
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Importer une signature scannée</h3>
                <p style={{ color: 'var(--muted)', margin: 0 }}>PNG ou JPG avec fond transparent recommandé</p>
              </div>
            )}

            {mode === 'stamp' && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ border: '3px double #d4af37', padding: '32px 48px', borderRadius: '12px', textAlign: 'center', transform: 'rotate(-5deg)', background: 'rgba(212,175,55,0.05)' }}>
                  <h2 style={{ margin: '0 0 12px 0', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '2px' }}>Approuvé par le PDG</h2>
                  <div style={{ color: 'rgba(212,175,55,0.8)', fontFamily: 'monospace', fontSize: '1.1rem' }}>ID: 8F92-C4B1-A09X</div>
                  <div style={{ color: 'rgba(212,175,55,0.8)', fontFamily: 'monospace', fontSize: '1rem', marginTop: '4px' }}>Le 07 Juin 2026 à 14:32:05</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSign}
              disabled={signed}
              style={{ background: signed ? '#22c55e' : '#d4af37', color: '#0a0a0a', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: signed ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s' }}>
              {signed ? <><CheckCircle2 size={20} /> Document scellé et archivé</> : <><Fingerprint size={20} /> Apposer la Signature Souveraine</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
