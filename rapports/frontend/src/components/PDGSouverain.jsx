import React from 'react';
import { Crown, TrendingUp, TrendingDown, Scale, ShieldCheck, Banknote, Activity } from 'lucide-react';

export default function PDGSouverain() {
  const TOTAL_VALUE = 3280500000; // 3.28 Milliards FCFA
  const RENTABILITE = 18.4; // %
  const SANTE = 94; // /100

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '16px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Crown size={40} color="#d4af37" /> Vision Souveraine
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.1rem', lineHeight: '1.5', letterSpacing: '0.5px' }}>
            Synthèse absolue de la valeur, de la santé et de la conformité de l'entreprise.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* VALEUR GLOBALE */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid #d4af37', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
            <Banknote size={150} color="#d4af37" />
          </div>
          <div style={{ color: 'rgba(212,175,55,0.7)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Banknote size={18} /> Valeur Masse Salariale (YTD)
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '8px', textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
            {(TOTAL_VALUE / 1000000000).toFixed(2)}Md <span style={{ fontSize: '1.2rem', color: 'rgba(212,175,55,0.5)' }}>FCFA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.9rem' }}>
            <TrendingUp size={16} /> +4.2% vs Année précédente
          </div>
        </div>

        {/* SANTÉ & RENTABILITÉ */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ color: 'rgba(212,175,55,0.7)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} /> Santé de l'Entreprise
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Score Global (IA)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{SANTE}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/100</span></div>
            </div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(#d4af37 94%, #222 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem' }}>
                A+
              </div>
            </div>
          </div>
          <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Marge Opérationnelle Est.</div>
            <div style={{ fontSize: '1.5rem', color: '#d4af37', fontWeight: 'bold' }}>{RENTABILITE}%</div>
          </div>
        </div>

        {/* CONFORMITÉ */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ color: 'rgba(212,175,55,0.7)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} /> Gouvernance & Légal
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={32} color="#22c55e" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>Conformité Optimale</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>0 litige majeur en cours</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Renouvellement CDD</span>
              <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>100% OK</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Limites Heures Supp.</span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>1 alerte mineure</span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '32px' }}>
         <h2 style={{ margin: '0 0 24px 0', color: 'white', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Message de l'IA Exécutive</h2>
         <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1.1rem', margin: 0, fontStyle: 'italic', borderLeft: '3px solid #d4af37', paddingLeft: '16px' }}>
           "Monsieur le Président, la croissance est soutenue. Les charges sociales sont maîtrisées et en dessous des prévisions de 2%. L'investissement technologique sur les sites de la zone Nord porte ses fruits avec une baisse de l'absentéisme de 14%. La structure financière est robuste."
         </p>
      </div>
    </div>
  );
}
