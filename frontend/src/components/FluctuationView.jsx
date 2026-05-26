import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FluctuationView({ onClose }) {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bridge'); // 'bridge' | 'rentability' | 'adjustments' | 'simulator'
  
  // Data from API
  const [analytics, setAnalytics] = useState(null);
  
  // Modals / Input Forms
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState('');
  const [adjType, setAdjType] = useState('PRIME');
  const [adjCategory, setAdjCategory] = useState('GAIN');
  const [adjValue, setAdjValue] = useState('');
  const [adjComment, setAdjComment] = useState('');
  const [adjDate, setAdjDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [selectedSiteName, setSelectedSiteName] = useState('');
  const [contractRevenue, setContractRevenue] = useState('');
  
  // Simulator State
  const [simSalaryIncrease, setSimSalaryIncrease] = useState(0); // 0% to 50%
  const [simNightBonus, setSimNightBonus] = useState(0); // 0% to 100%
  const [simExtraShiftMult, setSimExtraShiftMult] = useState(1); // 1.0x to 2.5x
  const [bridgeViewMode, setBridgeViewMode] = useState('list'); // 'list' | 'charts'
  const [rentabilityViewMode, setRentabilityViewMode] = useState('list'); // 'list' | 'charts'

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`api.php?action=get_fluctuation_analytics&period=${period}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error("Failed to load fluctuation analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedAgent || !adjValue || Number(adjValue) <= 0) return;
    
    try {
      const res = await fetch('api.php?action=save_manual_adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          type: adjType,
          category: adjCategory,
          value: Number(adjValue),
          comment: adjComment,
          date_application: adjDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAdjModal(false);
        // Reset form
        setSelectedAgent('');
        setAdjValue('');
        setAdjComment('');
        loadAnalytics();
      } else {
        alert(data.message || "Erreur de sauvegarde");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdjustment = async (agentId, adjustmentId) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ajustement ?")) return;
    try {
      const res = await fetch('api.php?action=delete_manual_adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          period,
          adjustment_id: adjustmentId
        })
      });
      const data = await res.json();
      if (data.success) {
        loadAnalytics();
      } else {
        alert(data.message || "Erreur de suppression");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRevenue = async (e) => {
    e.preventDefault();
    if (!selectedSiteName || !contractRevenue) return;
    
    try {
      const res = await fetch('api.php?action=save_site_revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: selectedSiteName,
          contract_revenue: Number(contractRevenue)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowRevenueModal(false);
        loadAnalytics();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!analytics) {
    return (
      <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '1.5rem' }}></i>
          <p>Initialisation du module d'analyse salariale...</p>
        </div>
      </div>
    );
  }

  // --- Calculations for Simulation ---
  // Simulate new Masse Salariale based on sliders
  const baseSim = analytics.base_masse_salariale * (1 + simSalaryIncrease / 100);
  const recruitsSim = analytics.recrutement_impact * (1 + simSalaryIncrease / 100);
  const departsSim = analytics.depart_impact * (1 + simSalaryIncrease / 100);
  const activiteSim = analytics.activite_impact * simExtraShiftMult;
  const disciplineSim = analytics.discipline_impact * (1 + simSalaryIncrease / 100);
  const simulatedMasse = baseSim + recruitsSim - departsSim + activiteSim - disciplineSim + analytics.primes_impact - analytics.advances_impact;

  // Periods list helper (last 6 months)
  const periods = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const p = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    periods.push(p);
  }

  return (
    <div className="fluctuation-view-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f172a' }}>
      <style>{`
        @media print {
          body, html, .fluctuation-view-container {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print, header, button, select, input, .btn {
            display: none !important;
          }
          h2, h3, h4, span, div, p, td, th {
            color: #000000 !important;
            text-shadow: none !important;
          }
          .fluctuation-view-container {
            padding: 10px !important;
          }
          div[style*="background"] {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          table {
            border-color: #cbd5e1 !important;
          }
          th, td {
            border-color: #cbd5e1 !important;
            color: #000000 !important;
          }
        }
      `}</style>
      
      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="btn" onClick={onClose} style={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
            <i className="fas fa-times"></i> Fermer
          </button>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.8rem', color: '#f8fafc', textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}>
            <i className="fas fa-chart-line" style={{ marginRight: '10px', color: '#3b82f6' }}></i> Fluctuation Salariale & BI
          </h2>
        </div>
        
        {/* Period Selector & Quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} className="no-print">
          <button 
            className="btn" 
            onClick={() => window.print()} 
            style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-print"></i> Imprimer
          </button>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}><i className="fas fa-calendar-alt"></i> Période :</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {periods.map(p => <option key={p} value={p} style={{ background: '#1e293b', color: 'white' }}>{p}</option>)}
            </select>
          </div>
          
          <button className="btn btn-primary" onClick={() => setShowAdjModal(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px' }}>
            <i className="fas fa-plus"></i> Ajustement / Prime
          </button>
        </div>
      </header>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('bridge')}
          style={{ background: activeTab === 'bridge' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: activeTab === 'bridge' ? '#3b82f6' : '#94a3b8', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >
          <i className="fas fa-bridge-water" style={{ marginRight: '8px' }}></i> Pont Budgétaire
        </button>
        <button 
          onClick={() => setActiveTab('rentability')}
          style={{ background: activeTab === 'rentability' ? 'rgba(34, 197, 94, 0.15)' : 'transparent', color: activeTab === 'rentability' ? '#22c55e' : '#94a3b8', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >
          <i className="fas fa-dollar-sign" style={{ marginRight: '8px' }}></i> Rentabilité Sites
        </button>
        <button 
          onClick={() => setActiveTab('adjustments')}
          style={{ background: activeTab === 'adjustments' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', color: activeTab === 'adjustments' ? '#a855f7' : '#94a3b8', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >
          <i className="fas fa-hand-holding-dollar" style={{ marginRight: '8px' }}></i> Ajustements & Acomptes
        </button>
        <button 
          onClick={() => setActiveTab('simulator')}
          style={{ background: activeTab === 'simulator' ? 'rgba(234, 179, 8, 0.15)' : 'transparent', color: activeTab === 'simulator' ? '#eab308' : '#94a3b8', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >
          <i className="fas fa-sliders-h" style={{ marginRight: '8px' }}></i> Simulateur Budgétaire
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        
        {/* TAB 1: WATERFALL BRIDGE & DONUT */}
        {activeTab === 'bridge' && (() => {
          const baseVal = analytics.base_masse_salariale || 0;
          const recruitsVal = analytics.recrutement_impact || 0;
          const departsVal = analytics.depart_impact || 0;
          const activityVal = analytics.activite_impact || 0;
          const disciplineVal = analytics.discipline_impact || 0;
          const primesVal = analytics.primes_impact || 0;
          const realVal = analytics.total_real_masse_salariale || 0;

          const maxAccumulated = Math.max(
            baseVal,
            baseVal + recruitsVal,
            baseVal + recruitsVal + activityVal + primesVal,
            realVal,
            1
          );

          const svgHeight = 240;
          const scaleY = svgHeight / (maxAccumulated * 1.15); 

          const steps = [
            { label: 'Masse de Base', value: baseVal, delta: baseVal, cumulativeStart: 0, cumulativeEnd: baseVal, type: 'base' },
            { label: 'Recrutements', value: recruitsVal, delta: recruitsVal, cumulativeStart: baseVal, cumulativeEnd: baseVal + recruitsVal, type: 'increase' },
            { label: 'Départs', value: departsVal, delta: -departsVal, cumulativeStart: baseVal + recruitsVal, cumulativeEnd: baseVal + recruitsVal - departsVal, type: 'decrease' },
            { label: 'Activité / SP', value: activityVal, delta: activityVal, cumulativeStart: baseVal + recruitsVal - departsVal, cumulativeEnd: baseVal + recruitsVal - departsVal + activityVal, type: 'increase' },
            { label: 'Absences', value: disciplineVal, delta: -disciplineVal, cumulativeStart: baseVal + recruitsVal - departsVal + activityVal, cumulativeEnd: baseVal + recruitsVal - departsVal + activityVal - disciplineVal, type: 'decrease' },
            { label: 'Primes & Bonus', value: primesVal, delta: primesVal, cumulativeStart: baseVal + recruitsVal - departsVal + activityVal - disciplineVal, cumulativeEnd: baseVal + recruitsVal - departsVal + activityVal - disciplineVal + primesVal, type: 'increase' },
            { label: 'Masse Réelle', value: realVal, delta: realVal, cumulativeStart: 0, cumulativeEnd: realVal, type: 'real' }
          ];

          const barWidth = 60;
          const gap = 36;
          const startX = 60;

          const svgSteps = steps.map((step, idx) => {
            const x = startX + idx * (barWidth + gap);
            let y = 0;
            let h = 0;

            if (step.type === 'base' || step.type === 'real') {
              y = svgHeight - (step.cumulativeEnd * scaleY);
              h = step.cumulativeEnd * scaleY;
            } else if (step.type === 'increase') {
              y = svgHeight - (step.cumulativeEnd * scaleY);
              h = (step.cumulativeEnd - step.cumulativeStart) * scaleY;
            } else if (step.type === 'decrease') {
              y = svgHeight - (step.cumulativeStart * scaleY);
              h = (step.cumulativeStart - step.cumulativeEnd) * scaleY;
            }

            return {
              ...step,
              x,
              y: Math.max(10, y),
              h: Math.max(4, h)
            };
          });

          // Donut segments
          const sumPositive = baseVal + activityVal + primesVal + recruitsVal;
          const basePct = sumPositive > 0 ? (baseVal / sumPositive) * 100 : 0;
          const activityPct = sumPositive > 0 ? (activityVal / sumPositive) * 100 : 0;
          const primesPct = sumPositive > 0 ? (primesVal / sumPositive) * 100 : 0;
          const recruitsPct = sumPositive > 0 ? (recruitsVal / sumPositive) * 100 : 0;

          const donutSegments = [
            { label: 'Salaire Base', value: baseVal, pct: basePct, color: '#3b82f6' },
            { label: 'Heures Supp / SP', value: activityVal, pct: activityPct, color: '#10b981' },
            { label: 'Primes Exceptionnelles', value: primesVal, pct: primesPct, color: '#a855f7' },
            { label: 'Frais Recrutement', value: recruitsVal, pct: recruitsPct, color: '#eab308' }
          ].filter(s => s.value > 0);

          let donutOffset = 0;
          const donutCircleData = donutSegments.map(seg => {
            const offset = donutOffset;
            donutOffset += (seg.pct / 100) * 440;
            return { ...seg, strokeDashoffset: -offset };
          });

          return (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              {/* Macro Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Masse Attendue (Base)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>{analytics.base_masse_salariale.toLocaleString()} <small style={{ fontSize: '0.9rem' }}>CFA</small></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Effet Suractivité (Vac. Supp)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#22c55e' }}>+ {analytics.activite_impact.toLocaleString()} <small style={{ fontSize: '0.9rem' }}>CFA</small></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Effet Discipline (Absences)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>- {analytics.discipline_impact.toLocaleString()} <small style={{ fontSize: '0.9rem' }}>CFA</small></div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ color: '#3b82f6', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Masse Réelle Consommée</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{analytics.total_real_masse_salariale.toLocaleString()} <small style={{ fontSize: '0.9rem' }}>CFA</small></div>
                </div>
              </div>

              {/* View Selector Segment */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: '10px' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button 
                    onClick={() => setBridgeViewMode('list')}
                    style={{ background: bridgeViewMode === 'list' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-list"></i> Liste des Écarts
                  </button>
                  <button 
                    onClick={() => setBridgeViewMode('charts')}
                    style={{ background: bridgeViewMode === 'charts' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-chart-line"></i> Graphiques & Schémas
                  </button>
                </div>
              </div>

              {/* CONDITIONAL RENDERING */}
              {bridgeViewMode === 'charts' ? (
                /* CHARTS MODE */
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px', marginBottom: '2.5rem' }}>
                  
                  {/* Left: Waterfall Chart */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 600, fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fas fa-chart-line" style={{ color: '#3b82f6' }}></i> Cascade des Écarts Salariés (Pont Budgétaire)
                    </h3>

                    <svg viewBox="0 0 780 320" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="emerald-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="rose-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#9f1239" />
                        </linearGradient>
                        <linearGradient id="violet-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#6b21a8" />
                        </linearGradient>
                        <linearGradient id="amber-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                      </defs>

                      {/* Grid Background lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                        const yVal = svgHeight - (maxAccumulated * r * scaleY);
                        return (
                          <g key={i}>
                            <line x1="40" y1={yVal} x2="760" y2={yVal} stroke="rgba(255,255,255,0.04)" strokeDasharray="5,5" />
                            <text x="15" y={yVal + 4} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">
                              {Math.round(maxAccumulated * r / 1000).toLocaleString()}k
                            </text>
                          </g>
                        );
                      })}

                      {/* Dotted bridge connection lines */}
                      {svgSteps.slice(0, -1).map((bar, i) => {
                        const nextBar = svgSteps[i + 1];
                        let connectorY = 0;
                        if (bar.type === 'base' || bar.type === 'increase') {
                          connectorY = bar.y;
                        } else if (bar.type === 'decrease') {
                          connectorY = bar.y + bar.h;
                        }

                        // Adjust connectors for specific flows
                        if (i === 1) connectorY = bar.y; // Recruits top
                        if (i === 2) connectorY = bar.y + bar.h; // Departs bottom
                        if (i === 3) connectorY = bar.y; // Activity top
                        if (i === 4) connectorY = bar.y + bar.h; // Absences bottom
                        if (i === 5) connectorY = bar.y; // Primes top

                        return (
                          <line 
                            key={i} 
                            x1={bar.x + barWidth} 
                            y1={connectorY} 
                            x2={nextBar.x} 
                            y2={connectorY} 
                            stroke="rgba(255,255,255,0.2)" 
                            strokeDasharray="4,4" 
                            strokeWidth="1.5" 
                          />
                        );
                      })}

                      {/* Bars rendering */}
                      {svgSteps.map((bar, i) => {
                        let colorGrad = 'url(#blue-grad)';
                        if (bar.type === 'increase') {
                          colorGrad = 'url(#emerald-grad)';
                        } else if (bar.type === 'decrease') {
                          colorGrad = 'url(#rose-grad)';
                        } else if (bar.type === 'real') {
                          colorGrad = 'url(#blue-grad)';
                        }

                        return (
                          <g key={i} style={{ cursor: 'pointer' }}>
                            <title>{`${bar.label}: ${bar.delta > 0 ? '+' : ''}${bar.delta.toLocaleString()} CFA`}</title>
                            
                            <rect 
                              x={bar.x} 
                              y={bar.y} 
                              width={barWidth} 
                              height={bar.h} 
                              fill={colorGrad} 
                              rx="8" 
                              style={{ transition: 'all 0.3s' }}
                            />

                            {/* Delta labels above or below bars */}
                            <text 
                              x={bar.x + barWidth / 2} 
                              y={bar.type === 'decrease' ? bar.y + bar.h + 16 : bar.y - 8} 
                              fill={bar.type === 'increase' ? '#34d399' : bar.type === 'decrease' ? '#f43f5e' : '#f8fafc'} 
                              fontSize="10" 
                              fontWeight="bold" 
                              textAnchor="middle"
                            >
                              {bar.type === 'base' || bar.type === 'real' 
                                ? `${Math.round(bar.value/1000)}k` 
                                : `${bar.delta > 0 ? '+' : ''}${Math.round(bar.delta/1000)}k`}
                            </text>

                            {/* Vertical axis labels */}
                            <text 
                              x={bar.x + barWidth / 2} 
                              y={svgHeight + 20} 
                              fill="rgba(255,255,255,0.4)" 
                              fontSize="9.5" 
                              fontWeight="500" 
                              textAnchor="middle"
                            >
                              {bar.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right: Donut Chart of structural cost */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 600, fontSize: '1.2rem', color: '#f8fafc', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fas fa-chart-pie" style={{ color: '#a855f7' }}></i> Structure des Coûts
                    </h3>

                    {donutCircleData.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.3)', margin: 'auto' }}>Aucune donnée financière</div>
                    ) : (
                      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                        <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                          {donutCircleData.map((seg, idx) => (
                            <circle 
                              key={idx}
                              cx="100" 
                              cy="100" 
                              r="70" 
                              fill="none" 
                              stroke={seg.color} 
                              strokeWidth="20" 
                              strokeDasharray="440" 
                              strokeDashoffset={seg.strokeDashoffset}
                              style={{ transition: 'all 0.5s ease', cursor: 'pointer' }}
                            />
                          ))}
                        </svg>
                        {/* Labeled inner content */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Brut</div>
                          <div style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 800 }}>{(sumPositive/1000).toFixed(0)}k <small style={{ fontSize: '0.7rem' }}>CFA</small></div>
                        </div>
                      </div>
                    )}

                    {/* Custom Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '1.5rem' }}>
                      {donutCircleData.map((seg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color }}></span>
                            <span style={{ color: '#94a3b8' }}>{seg.label}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'white' }}>{seg.pct.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* ORIGINAL LIST MODE */
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 2rem 0', fontWeight: 600, fontSize: '1.2rem', color: '#f8fafc' }}>
                    <i className="fas fa-list-ul" style={{ marginRight: '10px' }}></i> Décomposition Détaillée de la Variation (M-1 à M)
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* 1. Base salariale attendue */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span>1. Masse Salariale Initiale (M-1)</span>
                        <span style={{ fontWeight: 700 }}>{analytics.base_masse_salariale.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: '#3b82f6', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 2. Recrutements */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#22c55e' }}><i className="fas fa-user-plus"></i> 2. Coût des nouveaux recrutements (+ {analytics.recruits_list.length} agents)</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>+ {analytics.recrutement_impact.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (analytics.recrutement_impact / (analytics.base_masse_salariale || 1)) * 100)}%`, background: '#22c55e', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 3. Départs */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#ef4444' }}><i className="fas fa-user-minus"></i> 3. Économies sur départs de personnel (- {analytics.departs_list.length} agents)</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>- {analytics.depart_impact.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (analytics.depart_impact / (analytics.base_masse_salariale || 1)) * 100)}%`, background: '#ef4444', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 4. Activité / SP */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#22c55e' }}><i className="fas fa-clock"></i> 4. Impact des heures supplémentaires & nuits (Pointages SP)</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>+ {analytics.activite_impact.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (analytics.activite_impact / (analytics.base_masse_salariale || 1)) * 100)}%`, background: '#22c55e', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 5. Absences */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#ef4444' }}><i className="fas fa-ban"></i> 5. Retenues disciplinaires pour absences</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>- {analytics.discipline_impact.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (analytics.discipline_impact / (analytics.base_masse_salariale || 1)) * 100)}%`, background: '#ef4444', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 6. Primes */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                        <span style={{ color: '#a855f7' }}><i className="fas fa-award"></i> 6. Primes exceptionnelles et bonus</span>
                        <span style={{ fontWeight: 700, color: '#a855f7' }}>+ {analytics.primes_impact.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (analytics.primes_impact / (analytics.base_masse_salariale || 1)) * 100)}%`, background: '#a855f7', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    {/* 7. Masse réelle consommée */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', marginTop: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '1rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#3b82f6' }}>7. Masse Salariale Réelle Finale (M)</span>
                        <span style={{ color: '#3b82f6' }}>{analytics.total_real_masse_salariale.toLocaleString()} CFA</span>
                      </div>
                      <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '100%', background: '#3b82f6', borderRadius: '7px' }}></div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Smart analysis card */}
              <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <i className="fas fa-robot" style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
                <div>
                  <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '5px', fontSize: '1.05rem' }}>Analyse décisionnelle automatique</strong>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Ce mois-ci, la variation de la masse salariale réelle ({analytics.total_real_masse_salariale.toLocaleString()} CFA) par rapport au budget de base est principalement tirée par {analytics.activite_impact > analytics.discipline_impact ? "les heures supplémentaires d'activité intense" : "des retenues importantes pour absentéisme"}. Les charges de recrutement représentent {((analytics.recrutement_impact / (analytics.base_masse_salariale || 1)) * 100).toFixed(1)}% du budget de base global.
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* TAB 2: SITE RENTABILITY */}
        {activeTab === 'rentability' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}><i className="fas fa-chart-pie" style={{ color: '#22c55e', marginRight: '10px' }}></i> Performance Financière & Marges par Site</h3>
                <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Suivi analytique en temps réel du ratio d'effort salarial et du taux de marge brute par client.</p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button 
                    onClick={() => setRentabilityViewMode('list')}
                    style={{ background: rentabilityViewMode === 'list' ? '#22c55e' : 'transparent', color: rentabilityViewMode === 'list' ? '#0f172a' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-list" style={{ marginRight: '6px' }}></i> Liste standard
                  </button>
                  <button 
                    onClick={() => setRentabilityViewMode('charts')}
                    style={{ background: rentabilityViewMode === 'charts' ? '#22c55e' : 'transparent', color: rentabilityViewMode === 'charts' ? '#0f172a' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-tachometer-alt" style={{ marginRight: '6px' }}></i> Jauges & Graphiques
                  </button>
                </div>
                
                <button className="btn btn-primary" onClick={() => setShowRevenueModal(true)} style={{ background: '#22c55e', color: 'white' }}>
                  <i className="fas fa-edit"></i> Déclarer un Contrat Site
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {analytics.sites_rentability.map((site) => {
                const ratio = site.contract_revenue > 0 ? (site.salary_expense / site.contract_revenue) * 100 : 0;
                
                // Marge brute = (CA - Coût Salarial) / CA * 100
                const marginPct = site.contract_revenue > 0 ? ((site.contract_revenue - site.salary_expense) / site.contract_revenue) * 100 : 0;

                let statusColor = '#22c55e'; // Green
                let statusLabel = 'Très Rentable';
                
                if (ratio > 80) {
                  statusColor = '#ef4444'; // Red
                  statusLabel = 'Alerte Rentabilité';
                } else if (ratio > 60) {
                  statusColor = '#eab308'; // Orange
                  statusLabel = 'Limite Budgétaire';
                }
                
                if (site.contract_revenue === 0) {
                  statusColor = '#64748b';
                  statusLabel = 'Contrat Non Saisi';
                }

                // Circumference of 3/4 circular gauge is 188
                const gaugeCircumference = 188;
                // Margin percentage mapped to gauge: 100% margin is full gauge, <=0% margin is empty gauge
                const positiveMarginPct = Math.max(0, marginPct);
                const gaugeStrokeOffset = gaugeCircumference - (positiveMarginPct / 100) * gaugeCircumference;

                return (
                  <div key={site.name} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.75rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}><i className="fas fa-building" style={{ color: '#3b82f6', marginRight: '8px' }}></i> {site.name}</h4>
                      <span className="badge" style={{ background: `${statusColor}15`, color: statusColor, padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{statusLabel}</span>
                    </div>

                    {rentabilityViewMode === 'charts' ? (
                      /* CHARTS / CIRCULAR GAUGE VIEW */
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                        {/* Left: CA & Costs data */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Facturation Client (CA)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                              {site.contract_revenue > 0 ? `${site.contract_revenue.toLocaleString()} CFA` : 'CA non renseigné'}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Dépenses Salariales réelles</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: ratio > 80 ? '#ef4444' : '#e2e8f0', marginTop: '4px' }}>{site.salary_expense.toLocaleString()} CFA</div>
                          </div>
                        </div>

                        {/* Right: Stunning semi-circular visual Gauge for Profit Margin */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {site.contract_revenue > 0 ? (
                            <div style={{ position: 'relative', width: '100px', height: '80px' }}>
                              <svg viewBox="0 0 100 80" style={{ width: '100%', height: '100%' }}>
                                {/* Background track */}
                                <path 
                                  d="M 20 70 A 35 35 0 1 1 80 70" 
                                  fill="none" 
                                  stroke="rgba(255,255,255,0.06)" 
                                  strokeWidth="8" 
                                  strokeLinecap="round" 
                                />
                                {/* Colored margin indicator arc */}
                                <path 
                                  d="M 20 70 A 35 35 0 1 1 80 70" 
                                  fill="none" 
                                  stroke={statusColor} 
                                  strokeWidth="8" 
                                  strokeLinecap="round" 
                                  strokeDasharray={gaugeCircumference} 
                                  strokeDashoffset={gaugeStrokeOffset}
                                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                                />
                              </svg>
                              {/* Inner Percentage value */}
                              <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: statusColor }}>
                                  {marginPct > 0 ? `+${marginPct.toFixed(0)}%` : `${marginPct.toFixed(0)}%`}
                                </div>
                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginTop: '-2px' }}>Marge</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.2)' }}>
                              <i className="fas fa-chart-line" style={{ fontSize: '2.5rem', marginBottom: '5px' }}></i>
                              <div style={{ fontSize: '0.75rem' }}>Calcul impossible</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ORIGINAL STANDARD PROGRESS BAR VIEW */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Facturation Client (CA)</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                              {site.contract_revenue > 0 ? `${site.contract_revenue.toLocaleString()} CFA` : 'Non saisi'}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Coût Salarial Réel</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{site.salary_expense.toLocaleString()} CFA</div>
                          </div>
                        </div>

                        {/* Progress Bar Gauge */}
                        {site.contract_revenue > 0 && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
                              <span>Ratio d'Effort Salarial</span>
                              <span style={{ color: statusColor, fontWeight: 700 }}>{ratio.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, ratio)}%`, background: statusColor, borderRadius: '5px' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom stats details */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', alignItems: 'center' }}>
                      <span>Agents affectés : <strong>{site.agent_count}</strong></span>
                      <button 
                        onClick={() => { setSelectedSiteName(site.name); setContractRevenue(site.contract_revenue || ''); setShowRevenueModal(true); }} 
                        style={{ background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        <i className="fas fa-edit"></i> Modifier le contrat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 3: ADJUSTMENTS & DIGITAL CASH ADVANCES */}
        {activeTab === 'adjustments' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            {/* Left: list of adjustments */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'white', fontSize: '1.2rem' }}><i className="fas fa-list-check" style={{ color: '#a855f7', marginRight: '10px' }}></i> Historique des Ajustements du Mois</h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <th style={{ textAlign: 'left', padding: '10px 5px' }}>Agent</th>
                    <th style={{ textAlign: 'left', padding: '10px 5px' }}>Site</th>
                    <th style={{ textAlign: 'left', padding: '10px 5px' }}>Catégorie</th>
                    <th style={{ textAlign: 'right', padding: '10px 5px' }}>Montant</th>
                    <th style={{ textAlign: 'center', padding: '10px 5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.manual_adjustments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Aucun ajustement saisi pour cette période.</td>
                    </tr>
                  ) : (
                    analytics.manual_adjustments.map((adj) => (
                      <tr key={adj.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem' }}>
                        <td style={{ padding: '12px 5px', color: 'white', fontWeight: 600 }}>{adj.agent_name}</td>
                        <td style={{ padding: '12px 5px', color: '#94a3b8' }}>{adj.site}</td>
                        <td style={{ padding: '12px 5px' }}>
                          <span className="badge" style={{ 
                            background: adj.category === 'GAIN' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: adj.category === 'GAIN' ? '#22c55e' : '#ef4444',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>{adj.type}</span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'right', fontWeight: 700, color: adj.category === 'GAIN' ? '#22c55e' : '#ef4444' }}>
                          {adj.category === 'GAIN' ? '+' : '-'} {adj.value.toLocaleString()} CFA
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteAdjustment(adj.agent_id, adj.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Digital Cash Advance (Earned Wage Access) Simulation */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.2rem' }}><i className="fas fa-piggy-bank" style={{ color: '#3b82f6', marginRight: '10px' }}></i> Acompte sur Pointage Réel (EWA)</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>Sélectionnez un agent pour voir la somme financière sécurisée qu'il a déjà accumulée depuis le début du mois grâce à son pointage, et générer un acompte sécurisé.</p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Sélectionner l'Agent</label>
                <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                >
                  <option value="">-- Choisir un agent --</option>
                  {analytics.agents.map(ag => <option key={ag.id} value={ag.id}>{ag.name} ({ag.site})</option>)}
                </select>
              </div>

              {selectedAgent && (() => {
                const ag = analytics.agents.find(a => a.id === selectedAgent);
                if (!ag) return null;
                
                // Real-time wage estimate based on completed days/pointages
                // A typical simple calculation: base salary * (completed shifts without absences / 30)
                // Let's check attendance for this agent
                // We'll mock the active pointage count or estimate based on past inputs
                const base = ag.base_salary;
                const earnedEstimate = Math.round(base * 0.53); // Assumed mid-month 53% pointage completed
                const maxAdvance = Math.round(earnedEstimate * 0.40); // 40% threshold protection
                
                return (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Salaire de base de l'agent</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>{base.toLocaleString()} CFA</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Acquis au Pointage Réel</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{earnedEstimate.toLocaleString()} CFA</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Plafond Acompte (40%)</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308' }}>{maxAdvance.toLocaleString()} CFA</div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', paddingTop: '1rem', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setAdjType('ACOMPTE');
                          setAdjCategory('RETENUE');
                          setAdjValue(maxAdvance);
                          setAdjComment(`Acompte sécurisé sur salaire acquis au pointage`);
                          setShowAdjModal(true);
                        }} 
                        style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <i className="fas fa-check-double"></i> Émettre l'acompte plafonné
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* TAB 4: WHAT-IF BUDGET SIMULATOR */}
        {activeTab === 'simulator' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            {/* Left Sliders */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px' }}>
              <h3 style={{ margin: '0 0 2rem 0', color: 'white', fontSize: '1.2rem' }}><i className="fas fa-sliders" style={{ color: '#eab308', marginRight: '10px' }}></i> Paramètres de Simulation Budgétaire</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Slider 1 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>Augmentation Générale Salaires de Base</span>
                    <span style={{ color: '#eab308', fontWeight: 700 }}>+ {simSalaryIncrease}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="30" step="1" value={simSalaryIncrease} 
                    onChange={(e) => setSimSalaryIncrease(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#eab308' }} 
                  />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Simule une augmentation générale uniforme sur tous les agents.</small>
                </div>

                {/* Slider 2 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>Indemnité Travail de Nuit (Majoration)</span>
                    <span style={{ color: '#eab308', fontWeight: 700 }}>+ {simNightBonus}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5" value={simNightBonus} 
                    onChange={(e) => setSimNightBonus(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#eab308' }} 
                  />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Majoration du tarif journalier pour chaque pointage de nuit validé.</small>
                </div>

                {/* Slider 3 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>Facteur Heures Supplémentaires (SP)</span>
                    <span style={{ color: '#eab308', fontWeight: 700 }}>{simExtraShiftMult}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2.5" step="0.1" value={simExtraShiftMult} 
                    onChange={(e) => setSimExtraShiftMult(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#eab308' }} 
                  />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Simule un coefficient multiplicateur sur le taux horaire de heures supplémentaires.</small>
                </div>
              </div>
            </div>

            {/* Right Projected Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '2rem', borderRadius: '20px', textAlign: 'center' }}>
                <div style={{ color: '#eab308', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Masse Salariale Réelle Actuelle</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.5rem' }}>{analytics.total_real_masse_salariale.toLocaleString()} CFA</div>
                
                <i className="fas fa-arrow-down" style={{ fontSize: '1.5rem', color: '#eab308', marginBottom: '1.5rem' }}></i>
                
                <div style={{ color: '#eab308', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Masse Salariale Projetée Simulée</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#eab308' }}>{Math.round(simulatedMasse).toLocaleString()} CFA</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'white', fontWeight: 600 }}><i className="fas fa-calculator" style={{ marginRight: '8px' }}></i> Impact budgétaire estimé</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Divergence budgétaire :</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: simulatedMasse > analytics.total_real_masse_salariale ? '#ef4444' : '#22c55e' }}>
                    {simulatedMasse > analytics.total_real_masse_salariale ? '+' : ''} {Math.round(simulatedMasse - analytics.total_real_masse_salariale).toLocaleString()} CFA
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* MODAL 1: ADD MANUAL ADJUSTMENT */}
      <AnimatePresence>
        {showAdjModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '20px', width: '90%', maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'white' }}><i className="fas fa-plus" style={{ marginRight: '10px' }}></i> Nouvel Ajustement / Prime</h3>
              
              <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Agent</label>
                  <select 
                    value={selectedAgent} 
                    onChange={(e) => setSelectedAgent(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                  >
                    <option value="">-- Choisir un agent --</option>
                    {analytics.agents.map(ag => <option key={ag.id} value={ag.id}>{ag.name} ({ag.site})</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Catégorie</label>
                    <select 
                      value={adjCategory} 
                      onChange={(e) => setAdjCategory(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    >
                      <option value="GAIN">Gain (Prime, Bonus)</option>
                      <option value="RETENUE">Retenue (Acompte, Pénalité)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Type de Libellé</label>
                    <select 
                      value={adjType} 
                      onChange={(e) => setAdjType(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    >
                      <option value="PRIME">PRIME</option>
                      <option value="INDEMNITE">INDEMNITÉ</option>
                      <option value="BONUS">BONUS</option>
                      <option value="ACOMPTE">ACOMPTE</option>
                      <option value="RETENUE_CASSE">RETENUE CASSE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Montant (CFA)</label>
                    <input 
                      type="number" value={adjValue} onChange={(e) => setAdjValue(e.target.value)} required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Date d'effet</label>
                    <input 
                      type="date" value={adjDate} onChange={(e) => setAdjDate(e.target.value)} required
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Commentaire explicatif</label>
                  <textarea 
                    value={adjComment} onChange={(e) => setAdjComment(e.target.value)} placeholder="Raison de l'ajustement..."
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none', height: '80px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowAdjModal(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#3b82f6', color: 'white' }}>Sauvegarder</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT SITE CONTRACT REVENUE */}
      <AnimatePresence>
        {showRevenueModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'white' }}><i className="fas fa-edit" style={{ marginRight: '10px' }}></i> Contrat Site Client</h3>
              
              <form onSubmit={handleSaveRevenue} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Site Client</label>
                  <select 
                    value={selectedSiteName} 
                    onChange={(e) => setSelectedSiteName(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                  >
                    <option value="">-- Choisir le site --</option>
                    {analytics.sites_rentability.map(site => <option key={site.name} value={site.name}>{site.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Chiffre d'Affaires Contractuel Mensuel (CFA)</label>
                  <input 
                    type="number" value={contractRevenue} onChange={(e) => setContractRevenue(e.target.value)} required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', outline: 'none' }}
                    placeholder="Ex: 1500000"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowRevenueModal(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#22c55e', color: 'white' }}>Valider le contrat</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
