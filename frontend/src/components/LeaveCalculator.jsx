import React, { useState, useEffect } from 'react';
import { ArrowLeft, CalendarDays, Calendar, Calculator as CalculatorIcon } from 'lucide-react';

const LeaveCalculator = ({ onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState(null);

  // Auto-calcul à chaque changement de date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const diffTime = end - start;
      
      if (diffTime < 0) {
        setResult({ error: "La date de fin doit être après la date de début." });
        return;
      }

      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;

      let detailStr = '';
      if (months > 0) {
        detailStr = `${months} mois`;
        if (remainingDays > 0) detailStr += ` et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
      } else {
        detailStr = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }

      setResult({
        totalDays: diffDays,
        details: detailStr,
        error: null
      });
    } else {
      setResult(null);
    }
  }, [startDate, endDate]);

  return (
    <div style={{ 
      position: 'relative',
      padding: '24px', 
      width: '100%', 
      minHeight: 'calc(100vh - 64px)',
      color: 'white',
      overflow: 'hidden'
    }}>
      
      {/* BACKGROUND BLOBS FOR GLASSMORPHISM EFFECT */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px', background: 'rgba(56, 189, 248, 0.4)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, animation: 'float 6s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '500px', height: '500px', background: 'rgba(168, 85, 247, 0.3)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0, animation: 'float 8s ease-in-out infinite reverse' }}></div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '50px' }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              transition: 'all 0.3s', 
              marginRight: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Calculateur de Durée
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: 300 }}>
              Anticipez les congés avec précision.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* GLASSMORPHISM CARD - INPUTS */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '30px', 
            padding: '40px', 
            boxShadow: '0 15px 35px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CalendarDays size={18} color="#38bdf8" /> DATE DE DÉBUT
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '18px 24px', 
                    borderRadius: '20px', 
                    color: 'white', 
                    fontSize: '1.2rem', 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    transition: 'all 0.3s',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="#f43f5e" /> DATE DE FIN
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '18px 24px', 
                    borderRadius: '20px', 
                    color: 'white', 
                    fontSize: '1.2rem', 
                    fontFamily: 'inherit', 
                    outline: 'none', 
                    transition: 'all 0.3s',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#f43f5e'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
                />
              </div>

            </div>
          </div>

          {/* GLASSMORPHISM CARD - RESULTS */}
          <div style={{ 
            background: result && !result.error ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: result && !result.error ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '24px', 
            padding: '30px 40px', 
            textAlign: 'center',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: result && !result.error ? '0 20px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none',
            transform: result && !result.error ? 'translateY(-5px)' : 'translateY(0)'
          }}>
            {!result ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', fontWeight: 300 }}>
                Les résultats apparaîtront ici.
              </div>
            ) : result.error ? (
              <div style={{ color: '#f87171', fontSize: '1.1rem', fontWeight: 500 }}>
                {result.error}
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Durée exacte
                </span>
                <div style={{ 
                  fontSize: '4.5rem', 
                  fontWeight: 900, 
                  color: 'white', 
                  lineHeight: 1, 
                  letterSpacing: '-2px',
                  textShadow: '0 5px 20px rgba(255,255,255,0.3)',
                  margin: '10px 0'
                }}>
                  {result.totalDays}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', fontWeight: 400 }}>
                  Jours consécutifs
                </span>
                
                <div style={{ 
                  marginTop: '20px', 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '12px 30px', 
                  borderRadius: '100px', 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.05rem', 
                  fontWeight: 400,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  Équivalent à <strong style={{ color: 'white', fontWeight: 700 }}>{result.details}</strong>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
          100% { transform: translateY(0px) scale(1); }
        }
      `}} />
    </div>
  );
};

export default LeaveCalculator;
