import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart, Cell
} from 'recharts';

import { 
  Loader2, TrendingUp, ArrowLeft, Archive, Search, X, LayoutDashboard, Settings, 
  UserCheck, Users, Palmtree, AlertTriangle, CheckCircle, Info, Sliders, ArrowDown, ArrowUp, AlertCircle, Calendar,
  TrendingDown, ArrowUpRight, ArrowDownRight, HelpCircle, Activity, Plus, Clock, Building, Scissors
} from 'lucide-react';
import SupplementairesArchiveModal from './modals/SupplementairesArchiveModal';

// Hook d'animation count-up : anime un nombre de 0 vers target en duration ms
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!target || target === 0) { setValue(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 90,
      damping: 14,
      staggerChildren: 0.15 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 12 }
  }
};

function TrendsChart({ trends }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // État vide : aucune archive disponible
  if (!trends || trends.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', margin: 0 }}>
          Aucun historique disponible pour le moment.<br/>
          <span style={{ color: '#334155', fontSize: '0.78rem', fontWeight: 500 }}>
            Le graphique se remplira automatiquement au fur et à mesure des clôtures mensuelles.
          </span>
        </p>
      </div>
    );
  }

  // Point unique : impossible de tracer une courbe, afficher un état "Démarrage"
  if (trends.length === 1) {
    const t = trends[0];
    const formatMonth = (pStr) => {
      if (!pStr) return '';
      const [y, m] = pStr.split('-');
      const months = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
      return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
    };
    const formatMny = (v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M F' : v >= 1000 ? (v/1000).toFixed(0)+'k F' : v+' F';
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
          🚀 Premier mois enregistré — {formatMonth(t.period)}
        </div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#38bdf8', fontSize: '1.4rem', fontWeight: 900 }}>{formatMny(t.chiffre_affaire)}</div>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '4px', fontWeight: 600 }}>Chiffre d'Affaires</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#c084fc', fontSize: '1.4rem', fontWeight: 900 }}>{formatMny(t.masse_salariale)}</div>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '4px', fontWeight: 600 }}>Masse Salariale</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: t.marge_nette >= 0 ? '#10b981' : '#f43f5e', fontSize: '1.4rem', fontWeight: 900 }}>{formatMny(t.marge_nette)}</div>
            <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '4px', fontWeight: 600 }}>Marge Nette</div>
          </div>
        </div>
        <div style={{ color: '#334155', fontSize: '0.76rem', fontWeight: 500, textAlign: 'center', opacity: 0.7 }}>
          Le graphique apparaîtra dès le 2ème mois clôturé.
        </div>
      </div>
    );
  }
  
  // Constantes SVG et fonctions utilitaires (utilisées pour ≥ 2 points)
  const width = 850;
  const height = 260;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allVals = trends.flatMap(t => [t.chiffre_affaire, t.masse_salariale, t.marge_nette]);
  const maxVal = Math.max(...allVals, 1000000);

  const getX = (index) => paddingLeft + (index / (trends.length - 1)) * chartWidth;
  const getY = (val) => paddingTop + chartHeight - (val / maxVal) * chartHeight;

  const caPoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.chiffre_affaire) }));
  const msPoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.masse_salariale) }));
  const margePoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.marge_nette) }));

  const getPathD = (points) => {
    if (points.length === 0) return '';
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  };
  const getAreaD = (points) => {
    if (points.length === 0) return '';
    return `${getPathD(points)} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  };
  const formatMonth = (pStr) => {
    if (!pStr) return '';
    const [y, m] = pStr.split('-');
    const months = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  };
  const formatK = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="margeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Grille Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const val = maxVal * ratio;
          const y = paddingTop + chartHeight - ratio * chartHeight;
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#475569" style={{ fontSize: '9px', fontWeight: 700 }}>
                {formatK(val)}
              </text>
            </g>
          );
        })}
        
        {/* Grille X */}
        {trends.map((t, idx) => {
          const x = getX(idx);
          return (
            <g key={idx}>
              <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="rgba(255,255,255,0.03)" />
              <text x={x} y={paddingTop + chartHeight + 16} textAnchor="middle" fill="#64748b" style={{ fontSize: '9px', fontWeight: 700 }}>
                {formatMonth(t.period)}
              </text>
            </g>
          );
        })}
        
        {/* Zones remplies */}
        <path d={getAreaD(caPoints)} fill="url(#caGrad)" />
        <path d={getAreaD(margePoints)} fill="url(#margeGrad)" />
        
        {/* Lignes de courbes */}
        <path d={getPathD(caPoints)} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(56,189,248,0.3))' }} />
        <path d={getPathD(msPoints)} fill="none" stroke="#c084fc" strokeWidth="1.8" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={getPathD(margePoints)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(16,185,129,0.3))' }} />
        
        {/* Zones réactives */}
        {trends.map((t, idx) => {
          const x = getX(idx);
          return (
            <rect
              key={idx}
              x={x - chartWidth / (trends.length * 2)}
              y={paddingTop}
              width={chartWidth / (trends.length - 1 || 1)}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({
                index: idx,
                x,
                period: t.period,
                ca: t.chiffre_affaire,
                ms: t.masse_salariale,
                marge: t.marge_nette
              })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
        
        {/* Ligne verticale de survol */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={paddingTop}
            x2={hoveredPoint.x}
            y2={paddingTop + chartHeight}
            stroke="rgba(56,189,248,0.25)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: `${(hoveredPoint.x / width) * 100}%`,
          transform: `translateX(${hoveredPoint.x > width / 2 ? '-115%' : '15px'})`,
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          pointerEvents: 'none',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
            {formatMonth(hoveredPoint.period)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>• CA :</span>
            <span style={{ color: 'white', fontWeight: 700 }}>{hoveredPoint.ca.toLocaleString()} F</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
            <span style={{ color: '#c084fc', fontWeight: 600 }}>• MS :</span>
            <span style={{ color: 'white', fontWeight: 700 }}>{hoveredPoint.ms.toLocaleString()} F</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>• Marge :</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{hoveredPoint.marge.toLocaleString()} F</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MarginGauge({ percentage, targetMargin }) {
  const cleanPercent = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * cleanPercent) / 100;
  
  let color = '#10b981';
  if (cleanPercent < 40) {
    color = '#ef4444';
  } else if (cleanPercent < 60) {
    color = '#f59e0b';
  }

  // Calculate target dot position
  const targetAngle = (targetMargin / 100) * 360 - 90;
  const targetRad = (targetAngle * Math.PI) / 180;
  const targetX = 55 + radius * Math.cos(targetRad);
  const targetY = 55 + radius * Math.sin(targetRad);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px' }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ 
              transition: 'stroke-dashoffset 0.8s ease-out',
              filter: `drop-shadow(0 0 4px ${color})`
            }}
          />
          {/* Target marker dot */}
          <circle
            cx={targetX}
            cy={targetY}
            r="4.5"
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth="1.5"
            style={{ transition: 'all 0.5s' }}
            title={`Cible : ${targetMargin}%`}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
            {cleanPercent}%
          </span>
          <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: '1px', letterSpacing: '0.5px' }}>
            Taux Marge
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FluctuationView({ onClose }) {
  const { user, hasWritePermission } = useAuth();
  
  // RBAC: Plus robuste, vérifie hasWritePermission, le type d'espace ou le nom du service
  const isCompta = 
    (hasWritePermission && hasWritePermission('fluctuation')) ||
    user?.workspace_type === 'COMPTABLE' ||
    user?.workspace_preset === 'COMPTABLE' ||
    (user?.service_name && /compta/i.test(user.service_name)) ||
    user?.role === 'admin' || 
    user?.role === 'super_admin';

  // État de survol pour les cartes KPI
  const [hoveredCard, setHoveredCard] = useState(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [histFaqOpen, setHistFaqOpen] = useState(false);
  const [top3FaqOpen, setTop3FaqOpen] = useState(false);
  const [flop3FaqOpen, setFlop3FaqOpen] = useState(false);
  const [top8FaqOpen, setTop8FaqOpen] = useState(false);
  const [budgetFaqOpen, setBudgetFaqOpen] = useState(false);
  const [portefeuilleFaqOpen, setPortefeuilleFaqOpen] = useState(false);
  const [targetMargin, setTargetMargin] = useState(() => {
    const saved = localStorage.getItem('fluctuation_target_margin');
    return saved ? parseInt(saved, 10) : 75;
  });
  
  const handleTargetMarginChange = (val) => {
    const cleanVal = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setTargetMargin(cleanVal);
    localStorage.setItem('fluctuation_target_margin', cleanVal.toString());
  };

  const [showSimulator, setShowSimulator] = useState(false);

  const handleExportExcel = () => {
    if (!analytics || !analytics.sites_rentability) return;
    let csvContent = "\uFEFF"; 
    csvContent += "Nom du Site;Revenu Contractuel (F CFA);Masse Salariale brute (F CFA);Marge brute (F CFA);Taux de Marge (%);Alerte Budget (Coût > 80%)\r\n";
    analytics.sites_rentability.forEach(s => {
      const marginPct = s.contract_revenue > 0 ? (s.net_margin / s.contract_revenue) * 100 : 0;
      csvContent += `${s.site_name};${s.contract_revenue};${s.total_cost};${s.net_margin};${marginPct.toFixed(1)};${s.is_alert ? 'OUI' : 'NON'}\r\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fluctuation_rentabilite_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const getActivePeriod = (archives = []) => {
    if (archives && archives.length > 0) {
      // Les archives sont triées par période (plus récent en premier)
      return archives[0].period;
    }
    const sysD = new Date();
    return `${sysD.getFullYear()}-${String(sysD.getMonth() + 1).padStart(2, '0')}`;
  };

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [archivesList, setArchivesList] = useState([]);
  
  const [showConfig, setShowConfig] = useState(false);
  const [showSuppsArchiveModal, setShowSuppsArchiveModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | saisie
  const [archivesLoaded, setArchivesLoaded] = useState(false);
  
  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_fluctuation_archives', { scope: 'company' }, 'GET');
      if (res?.success) {
        const archs = res.archives || [];
        setArchivesList(archs);
        const currP = res.current_period;
        setCurrentPeriod(currP);
        setPeriod(currP);
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setArchivesLoaded(true);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);
  
  const [analytics, setAnalytics] = useState(null);
  const [comptaData, setComptaData] = useState(null);
  const [prevAnalytics, setPrevAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);

  // Form states for Saisie
  const [gridData, setGridData] = useState([]);
  const [contractsData, setContractsData] = useState([]);
  const [varsData, setVarsData] = useState({ primes_globales: 0, charges_globales_percent: 0 });

  // Valeurs animées (count-up) déclarées au plus haut niveau pour éviter les retours anticipés conditionnels
  const animCA = useCountUp(analytics?.chiffre_affaire || 0);
  const animMsTotal = useCountUp((analytics?.ms_admin || 0) + (analytics?.ms_agents || 0));
  const animMsAdmin = useCountUp(analytics?.ms_admin || 0);
  const animMsAgents = useCountUp(analytics?.ms_agents || 0);
  const netMarginRaw = (analytics?.chiffre_affaire || 0) - (analytics?.ms_admin || 0) - (analytics?.ms_agents || 0);
  const animMarge = useCountUp(Math.abs(netMarginRaw));

  const prevCA = prevAnalytics?.chiffre_affaire || 0;
  const currCA = analytics?.chiffre_affaire || 0;
  const caVar = prevCA > 0 ? ((currCA - prevCA) / prevCA) * 100 : 0;
  
  const prevMS = (prevAnalytics?.ms_admin || 0) + (prevAnalytics?.ms_agents || 0);
  const currMS = (analytics?.ms_admin || 0) + (analytics?.ms_agents || 0);
  const msVar = prevMS > 0 ? ((currMS - prevMS) / prevMS) * 100 : 0;
  
  const prevMarginRaw = (prevAnalytics?.chiffre_affaire || 0) - (prevAnalytics?.ms_admin || 0) - (prevAnalytics?.ms_agents || 0);
  const currMarginRaw = netMarginRaw;
  const marginVar = prevMarginRaw > 0 ? ((currMarginRaw - prevMarginRaw) / prevMarginRaw) * 100 : 0;

  const renderProgressBadge = (val, isExpense = false) => {
    if (val === 0 || isNaN(val)) return null;
    const isPositive = val > 0;
    const isGood = isExpense ? !isPositive : isPositive;
    const color = isGood ? '#10b981' : '#f43f5e';
    const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        color, 
        fontSize: '0.8rem', 
        fontWeight: 700, 
        background: isGood ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', 
        padding: '3px 8px', 
        borderRadius: '20px', 
        border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
        marginLeft: '10px',
        verticalAlign: 'middle',
        boxShadow: isGood ? '0 0 10px rgba(16,185,129,0.05)' : '0 0 10px rgba(244,63,94,0.05)'
      }}>
        <ArrowIcon size={12} />
        {isPositive ? '+' : ''}{val.toFixed(1)}%
      </span>
    );
  };


  const loadData = async () => {
    setAnalytics(null);
    setPrevAnalytics(null);
    setLoading(true);
    try {
      const data = await apiCall('get_fluctuation_analytics', { period }, 'GET');
      if (data && data.success === false) {
        setAnalytics({ _error: data.message });
        return;
      }
      setAnalytics(data);

      // Previous period for comparison
      const [y, m] = period.split('-');
      const d = new Date(y, m - 1, 1);
      d.setMonth(d.getMonth() - 1);
      const prevPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prevData = await apiCall('get_fluctuation_analytics', { period: prevPeriod }, 'GET');
      if (prevData && prevData.success !== false) {
        setPrevAnalytics(prevData);
      }

      // Load Compta data
      const cData = await apiCall('get_compta_data', { period }, 'GET');
      if (cData.success) {
        setComptaData(cData);
        setGridData(cData.grid || []);
        setContractsData(cData.contracts || []);
        setVarsData(cData.variables || { primes_globales: 0, charges_globales_percent: 0 });
      }

      // Load trends data
      const trendsData = await apiCall('get_fluctuation_trends', { period }, 'GET');
      if (trendsData && trendsData.success) {
        setTrends(trendsData.trends || []);
      }
    } catch (e) {
      console.error(e);
      setAnalytics({ _error: "Erreur de connexion au serveur." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (archivesLoaded) {
      loadData();
    }
  }, [period, archivesLoaded]);

  const handleSaveGrid = async () => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_salary_grid', { grid: Object.fromEntries(gridData.map(g => [g.poste, g.taux_horaire])) });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContract = async (site_name, budget, charges, frais, prime) => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_site_contracts', { 
        site_name, 
        budget_mensuel: budget, 
        charges_percent: charges, 
        frais_fixes: frais,
        prime_site: prime
      });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVars = async () => {
    if (!isCompta) return;
    try {
      const res = await apiCall('save_monthly_variables', { 
        period, 
        primes_globales: varsData.primes_globales, 
        charges_globales_percent: varsData.charges_globales_percent 
      });
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (viewMode !== 'archives' || selectedArchive) {
    if (!analytics) {
      return (
        <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={48} style={{ color: '#3b82f6', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <p>Initialisation du module d'analyse salariale...</p>
          </div>
        </div>
      );
    }

    if (analytics._error) {
      return (
        <div className="fluctuation-view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Accès refusé ou Erreur</h3>
            <p style={{ margin: 0 }}>{analytics._error}</p>
            <button onClick={onClose} className="btn mt-4" style={{ marginTop: '15px', background: '#1e293b', color: 'white' }}>Retour</button>
          </div>
        </div>
      );
    }
  }

  // Formatting utils
  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  const formatPeriod = (p) => {
    if (!p) return '';
    const [y, m] = p.split('-');
    const d = new Date(y, parseInt(m, 10) - 1, 1);
    const str = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const prevCost = prevAnalytics?.company_metrics?.total_cost || 0;
  const currentCost = analytics?.company_metrics?.total_cost || 0;
  const diffCost = currentCost - prevCost;
  const diffPercent = prevCost > 0 ? (diffCost / prevCost) * 100 : 0;

  const chartData = (analytics?.sites_rentability || []).map(s => ({
    name: s.name,
    Revenus: s.contract_revenue,
    Coûts: s.total_cost,
    Marge: s.net_margin,
    isAlert: s.is_alert
  })).sort((a, b) => b.Revenus - a.Revenus).slice(0, 8); // Top 8

  // Le netMarginRaw est défini plus haut pour le hook count-up

  return (
    <div className="fluctuation-view-container" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'radial-gradient(ellipse at top, #0f172a 0%, #070a12 100%)', overflowY: 'auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, background: 'rgba(13, 18, 31, 0.45)', backdropFilter: 'blur(20px) saturate(140%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
            <TrendingUp size={24} style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.4))' }} /> Fluctuations & Rentabilité
          </h2>
          <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
            {isCompta ? (
              <span style={{ color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></span>
                Accès Comptabilité (Édition activée)
              </span>
            ) : (
              <span style={{ color: '#fbbf24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></span>
                Accès Lecture Seule
              </span>
            )}
          </div>
        </div>

        {/* Période affichée au centre */}
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(56, 189, 248, 0.04)', padding: '8px 24px', borderRadius: '24px', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(56,189,248,0.05)' }}>
          <Calendar size={18} style={{ color: '#38bdf8' }} /> {formatPeriod(period)}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          
          {/* TABS ACTUEL/ARCHIVES */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
            {selectedArchive && (
              <button onClick={() => setSelectedArchive(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '6px 14px', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                <ArrowLeft size={14} /> Liste
              </button>
            )}
            <button onClick={() => { setViewMode('current'); setPeriod(currentPeriod); }} className={`btn`} style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, background: viewMode === 'current' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent', color: viewMode === 'current' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'current' ? '0 4px 15px rgba(56,189,248,0.3)' : 'none' }}>
              Actuel
            </button>
            <button onClick={() => { setViewMode('archives'); setSelectedArchive(null); }} className={`btn`} style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700, background: viewMode === 'archives' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent', color: viewMode === 'archives' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: viewMode === 'archives' ? '0 4px 15px rgba(56,189,248,0.3)' : 'none' }}>
              <Archive size={14} style={{ marginRight: '6px' }} /> Archives
            </button>
          </div>

          {viewMode === 'current' ? (
            <input 
              type="month" 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5, 8, 16, 0.5)', color: 'white', outline: 'none', fontWeight: 600, fontSize: '0.9rem' }}
            />
          ) : selectedArchive ? (
            <div style={{ padding: '9px 16px', background: 'rgba(245,158,11,0.06)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.03em' }}>Mode Lecture Seule</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(5, 8, 16, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '9px 16px', width: '260px' }}>
              <Search size={16} style={{ color: '#64748b', marginRight: '10px' }} />
              <input type="text" placeholder="Rechercher une archive..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
            </div>
          )}

          <button onClick={onClose} style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* TABS */}
      {(viewMode === 'current' || selectedArchive) && (
        <div style={{ padding: '0 36px', marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '14px 28px', background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#38bdf8' : '#64748b', borderBottom: activeTab === 'dashboard' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LayoutDashboard size={16} /> Tableau de Bord
            </button>
            <button 
              onClick={() => setActiveTab('saisie')}
              style={{ padding: '14px 28px', background: 'none', border: 'none', color: activeTab === 'saisie' ? '#38bdf8' : '#64748b', borderBottom: activeTab === 'saisie' ? '2px solid #38bdf8' : '2px solid transparent', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Settings size={16} /> Saisie & Paramètres
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 36px' }}>
        {viewMode === 'archives' && !selectedArchive ? (
          <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            {archivesList.filter(arch => {
              const q = searchQuery.toLowerCase();
              return (arch.period && arch.period.toLowerCase().includes(q)) || 
                     (arch.archived_by && arch.archived_by.toLowerCase().includes(q)) ||
                     (arch.archived_at && arch.archived_at.toLowerCase().includes(q));
            }).length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
                <Archive size={48} style={{ opacity: 0.2, marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aucune archive trouvée.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(5, 8, 16, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Période</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date d'archivage</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivé par</th>
                    <th style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivesList.filter(arch => {
                    const q = searchQuery.toLowerCase();
                    return (arch.period && arch.period.toLowerCase().includes(q)) || 
                           (arch.archived_by && arch.archived_by.toLowerCase().includes(q)) ||
                           (arch.archived_at && arch.archived_at.toLowerCase().includes(q));
                  }).map(arch => {
                    return (
                      <tr key={arch.period} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
                        <td style={{ padding: '18px 24px', color: 'white', fontWeight: '800', fontSize: '0.98rem' }}>{formatPeriod(arch.period)}</td>
                        <td style={{ padding: '18px 24px', color: '#cbd5e1', fontSize: '0.9rem' }}>{arch.archived_at}</td>
                        <td style={{ padding: '18px 24px', color: '#cbd5e1', fontSize: '0.9rem' }}>{arch.archived_by}</td>
                        <td style={{ padding: '18px 24px' }}>
                          <button onClick={() => { setSelectedArchive(arch.period); setPeriod(arch.period); }} className="btn" style={{ background: 'rgba(56,189,248,0.06)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.12)'; }}>
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && analytics && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                
                {analytics.pending_compta ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ padding: '60px 40px', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', textAlign: 'center', maxWidth: '650px', margin: '40px auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px) saturate(140%)' }}
                  >
                    <motion.div 
                      variants={itemVariants}
                      style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', margin: '0 auto 24px auto', filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.2))' }}
                    >
                      <Loader2 className="animate-spin" size={36} style={{ color: '#38bdf8' }} />
                    </motion.div>
                    <motion.h3 
                      variants={itemVariants}
                      style={{ color: '#f8fafc', fontSize: '1.45rem', fontWeight: 900, margin: '0 0 14px 0', letterSpacing: '-0.02em' }}
                    >
                      Traitement Comptable en cours
                    </motion.h3>
                    <motion.p 
                      variants={itemVariants}
                      style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: '1.6', margin: 0, fontWeight: 500 }}
                    >
                      Les données de fluctuation et de rentabilité pour la période <strong>{formatPeriod(period)}</strong> seront disponibles dès que la comptabilité aura finalisé et clôturé l'état de paie mensuel.
                    </motion.p>
                  </motion.div>
                ) : (
                  <>
                    {analytics.snapshot_exists ? (
                      <>
                        {/* Barre d'outils premium */}
                        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleExportExcel}
                            style={{
                              background: 'rgba(16,185,129,0.08)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              borderRadius: '14px',
                              padding: '8px 18px',
                              color: '#10b981',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              transition: 'all 0.2s'
                            }}
                          >
                            📊 Export Excel
                          </button>
                          <button
                            onClick={handlePrintPDF}
                            style={{
                              background: 'rgba(139,92,246,0.08)',
                              border: '1px solid rgba(139,92,246,0.2)',
                              borderRadius: '14px',
                              padding: '8px 18px',
                              color: '#c084fc',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              transition: 'all 0.2s'
                            }}
                          >
                            🖨️ Imprimer PDF
                          </button>
                          <button
                            onClick={() => setShowSimulator(o => !o)}
                            style={{
                              background: showSimulator ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)',
                              border: '1px solid rgba(56,189,248,0.25)',
                              borderRadius: '14px',
                              padding: '8px 18px',
                              color: '#38bdf8',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              transition: 'all 0.2s'
                            }}
                          >
                            🧪 {showSimulator ? 'Fermer Simulateur' : 'Simulateur'}
                          </button>
                        </div>

                        {/* SIMULATEUR D'IMPACT FINANCIER */}
                        {showSimulator && analytics.sites_rentability && (() => {
                          const SimulatorPanel = () => {
                            const [simSites, setSimSites] = React.useState(
                              analytics.sites_rentability.map(s => ({
                                ...s,
                                sim_revenue: s.contract_revenue,
                                sim_cost: s.total_cost
                              }))
                            );
                            const realCA = analytics.chiffre_affaire || 0;
                            const realMS = (analytics.ms_admin || 0) + (analytics.ms_agents || 0);
                            const realMargin = realCA > 0 ? ((realCA - realMS) / realCA) * 100 : 0;

                            const simCA = simSites.reduce((sum, s) => sum + s.sim_revenue, 0);
                            const simCost = simSites.reduce((sum, s) => sum + s.sim_cost, 0);
                            const simMargin = simCA > 0 ? ((simCA - simCost) / simCA) * 100 : 0;
                            const diff = simMargin - realMargin;

                            return (
                              <div style={{ background: 'rgba(13,18,31,0.6)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(56,189,248,0.12)', marginBottom: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                  <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🧪 Simulateur d'Impact — "Et si... ?"
                                  </h3>
                                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Réel</div>
                                      <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{realMargin.toFixed(1)}%</span>
                                    </div>
                                    <span style={{ color: '#475569', fontSize: '1.2rem' }}>→</span>
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Simulé</div>
                                      <span style={{ color: diff >= 0 ? '#10b981' : '#f43f5e', fontWeight: 900, fontSize: '1.1rem' }}>{simMargin.toFixed(1)}%</span>
                                    </div>
                                    <span style={{ color: diff >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800, fontSize: '0.85rem', background: diff >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${diff >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
                                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Site</th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>CA Simulé (F CFA)</th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Coût Simulé (F CFA)</th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Marge</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {simSites.map((s, idx) => {
                                        const m = s.sim_revenue > 0 ? ((s.sim_revenue - s.sim_cost) / s.sim_revenue) * 100 : 0;
                                        return (
                                          <tr key={s.site_name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '8px 12px', color: 'white', fontWeight: 600, fontSize: '0.82rem' }}>{s.site_name}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                              <input
                                                type="number"
                                                value={s.sim_revenue}
                                                onChange={(e) => {
                                                  const newSites = [...simSites];
                                                  newSites[idx] = { ...newSites[idx], sim_revenue: parseInt(e.target.value) || 0 };
                                                  setSimSites(newSites);
                                                }}
                                                style={{ width: '120px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', color: '#38bdf8', fontWeight: 700, textAlign: 'right', fontSize: '0.82rem' }}
                                              />
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                              <input
                                                type="number"
                                                value={s.sim_cost}
                                                onChange={(e) => {
                                                  const newSites = [...simSites];
                                                  newSites[idx] = { ...newSites[idx], sim_cost: parseInt(e.target.value) || 0 };
                                                  setSimSites(newSites);
                                                }}
                                                style={{ width: '120px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', color: '#c084fc', fontWeight: 700, textAlign: 'right', fontSize: '0.82rem' }}
                                              />
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', color: m >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800, fontSize: '0.82rem' }}>
                                              {m.toFixed(1)}%
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                <div style={{ marginTop: '14px', color: '#475569', fontSize: '0.72rem', fontStyle: 'italic' }}>
                                  💡 Modifiez les valeurs de CA ou de coût pour simuler l'impact sur votre marge globale. Aucune donnée réelle n'est affectée.
                                </div>
                              </div>
                            );
                          };
                          return <SimulatorPanel />;
                        })()}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>

                    
                    {/* CHIFFRE D'AFFAIRES */}
                    <div
                      onMouseEnter={() => setHoveredCard('ca')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: hoveredCard === 'ca' ? 'rgba(14, 165, 233, 0.06)' : 'rgba(14, 165, 233, 0.02)',
                        borderRadius: '24px', padding: '28px',
                        border: hoveredCard === 'ca' ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(14, 165, 233, 0.15)',
                        boxShadow: hoveredCard === 'ca'
                          ? '0 20px 60px 0 rgba(14, 165, 233, 0.18), inset 0 0 30px rgba(14, 165, 233, 0.05)'
                          : '0 8px 32px 0 rgba(14, 165, 233, 0.05), inset 0 0 15px rgba(14, 165, 233, 0.02)',
                        position: 'relative', overflow: 'hidden', cursor: 'default',
                        transform: hoveredCard === 'ca' ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}>
                      <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.08)', filter: 'blur(30px)' }}></div>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: hoveredCard === 'ca' ? '0 0 12px #38bdf8' : 'none', transition: 'box-shadow 0.3s' }}></span>
                        Chiffre d'Affaires
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 950, color: '#f8fafc', letterSpacing: '-0.02em', textShadow: hoveredCard === 'ca' ? '0 0 40px rgba(56,189,248,0.4)' : '0 0 20px rgba(56,189,248,0.15)', transition: 'text-shadow 0.3s', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>{formatMoney(animCA)}</span>
                        {renderProgressBadge(caVar)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px', fontWeight: 500 }}>
                        Période d'activité : {formatPeriod(period)}
                      </div>
                    </div>

                    {/* MASSE SALARIALE */}
                    <div
                      onMouseEnter={() => setHoveredCard('ms')}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        background: hoveredCard === 'ms' ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 92, 246, 0.02)',
                        borderRadius: '24px', padding: '28px',
                        border: hoveredCard === 'ms' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.15)',
                        boxShadow: hoveredCard === 'ms'
                          ? '0 20px 60px 0 rgba(139, 92, 246, 0.18), inset 0 0 30px rgba(139, 92, 246, 0.05)'
                          : '0 8px 32px 0 rgba(139, 92, 246, 0.05), inset 0 0 15px rgba(139, 92, 246, 0.02)',
                        position: 'relative', overflow: 'hidden', cursor: 'default',
                        transform: hoveredCard === 'ms' ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}>
                      <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.08)', filter: 'blur(30px)' }}></div>
                      <div style={{ color: '#a78bfa', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', boxShadow: hoveredCard === 'ms' ? '0 0 12px #a78bfa' : 'none', transition: 'box-shadow 0.3s' }}></span>
                        Masse Salariale
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Total Général</span>
                          <span style={{ fontSize: '1.75rem', fontWeight: 950, color: '#f8fafc', textShadow: hoveredCard === 'ms' ? '0 0 40px rgba(167,139,250,0.4)' : '0 0 20px rgba(167,139,250,0.15)', transition: 'text-shadow 0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{formatMoney(animMsTotal)}</span>
                            {renderProgressBadge(msVar, true)}
                          </span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <UserCheck size={14} style={{ color: '#a78bfa' }} /> Admin <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({analytics.admin_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white' }}>
                            {formatMoney(animMsAdmin)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                            <Users size={14} style={{ color: '#a78bfa' }} /> Agents Terrain <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({analytics.agents_count || 0})</span>
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white' }}>
                            {formatMoney(animMsAgents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MARGE NETTE */}
                    {(() => {
                      const netMarginValue = analytics.chiffre_affaire - analytics.ms_admin - analytics.ms_agents;
                      const isPositive = netMarginValue >= 0;
                      const cardKey = 'marge';
                      return (
                        <div
                          onMouseEnter={() => setHoveredCard(cardKey)}
                          onMouseLeave={() => setHoveredCard(null)}
                          style={{
                            background: hoveredCard === cardKey
                              ? (isPositive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)')
                              : (isPositive ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'),
                            borderRadius: '24px', padding: '28px',
                            border: hoveredCard === cardKey
                              ? (isPositive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)')
                              : (isPositive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'),
                            boxShadow: hoveredCard === cardKey
                              ? (isPositive ? '0 20px 60px 0 rgba(16, 185, 129, 0.18), inset 0 0 30px rgba(16, 185, 129, 0.05)' : '0 20px 60px 0 rgba(239, 68, 68, 0.18), inset 0 0 30px rgba(239, 68, 68, 0.05)')
                              : (isPositive ? '0 8px 32px 0 rgba(16, 185, 129, 0.05), inset 0 0 15px rgba(16, 185, 129, 0.02)' : '0 8px 32px 0 rgba(239, 68, 68, 0.05), inset 0 0 15px rgba(239, 68, 68, 0.02)'),
                            position: 'relative', overflow: 'hidden', cursor: 'default',
                            transform: hoveredCard === cardKey ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)',
                            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          }}>
                          <div style={{ position: 'absolute', top: '-30%', right: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', filter: 'blur(30px)' }}></div>
                          <div style={{ color: isPositive ? '#34d399' : '#f87171', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPositive ? '#34d399' : '#f87171', boxShadow: hoveredCard === cardKey ? `0 0 12px ${isPositive ? '#34d399' : '#f87171'}` : 'none', transition: 'box-shadow 0.3s' }}></span>
                            Marge Nette
                          </div>
                          <div style={{ fontSize: '2.4rem', fontWeight: 950, color: '#f8fafc', letterSpacing: '-0.02em', textShadow: hoveredCard === cardKey ? (isPositive ? '0 0 40px rgba(52,211,153,0.4)' : '0 0 40px rgba(248,113,113,0.4)') : (isPositive ? '0 0 20px rgba(52,211,153,0.15)' : '0 0 20px rgba(248,113,113,0.15)'), transition: 'text-shadow 0.3s', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span>{isPositive ? '' : '-'}{formatMoney(animMarge)}</span>
                            {renderProgressBadge(marginVar)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px', fontWeight: 500 }}>
                            Chiffre d'Affaires - Masse Salariale Totale
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {/* Graphique d'Évolution */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                      {/* En-tête avec bouton FAQ */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingUp size={18} style={{ color: '#38bdf8' }} /> Historique &amp; Évolution (6 mois)
                        </h3>
                        <button
                          onClick={() => setHistFaqOpen(o => !o)}
                          title="Comprendre ce graphique"
                          style={{
                            background: histFaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}
                        >
                          <HelpCircle size={12} /> FAQ
                        </button>
                      </div>

                      {/* Graphique */}
                      <div style={{ height: '260px', width: '100%', position: 'relative' }}>
                        <TrendsChart trends={trends} />
                      </div>

                      {/* Légende des couleurs */}
                      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap' }}>
                        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span> Chiffre d'Affaires</span>
                        <span style={{ color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '2px', background: '#c084fc' }}></span> Masse Salariale</span>
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Marge Nette</span>
                      </div>

                      {/* Panneau FAQ dépliable */}
                      {histFaqOpen && (
                        <div style={{
                          marginTop: '20px',
                          background: 'rgba(5, 10, 22, 0.5)',
                          border: '1px solid rgba(56,189,248,0.1)',
                          borderRadius: '16px',
                          padding: '18px',
                          textAlign: 'left'
                        }}>
                          <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            📈 À quoi sert ce graphique ?
                          </div>

                          {/* Description */}
                          <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.7, margin: '0 0 14px 0' }}>
                            Ce graphique retrace l'évolution financière réelle de votre entreprise sur les <strong style={{ color: 'white' }}>6 derniers mois clôturés</strong>. Il permet d'identifier en un coup d'œil les tendances de croissance ou de dégradation de votre rentabilité.
                          </p>

                          {/* Les 3 courbes */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Les 3 indicateurs tracés</div>
                            {[
                              { color: '#38bdf8', dot: true, label: 'Chiffre d\'Affaires', desc: 'Total des revenus contractuels facturés aux clients ce mois-là.' },
                              { color: '#c084fc', dot: false, label: 'Masse Salariale', desc: 'Somme des salaires de tous les agents terrain + administratifs. Tracé en pointillés.' },
                              { color: '#10b981', dot: true, label: 'Marge Nette', desc: 'CA − Masse Salariale. C\'est le bénéfice réel dégagé après rémunération du personnel.' },
                            ].map(r => (
                              <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: `rgba(${r.color === '#38bdf8' ? '56,189,248' : r.color === '#c084fc' ? '192,132,252' : '16,185,129'},0.05)`, borderRadius: '10px', padding: '8px 12px' }}>
                                <span style={{ width: r.dot ? '8px' : '12px', height: r.dot ? '8px' : '2px', borderRadius: r.dot ? '50%' : '0', background: r.color, marginTop: r.dot ? '5px' : '8px', flexShrink: 0 }}></span>
                                <div>
                                  <span style={{ color: r.color, fontWeight: 800, fontSize: '0.78rem' }}>{r.label}</span>
                                  <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '6px' }}>{r.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* D'où viennent les données */}
                          <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.08)', borderRadius: '10px', padding: '12px' }}>
                            <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source des données</div>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.7 }}>
                              Les données proviennent des <strong style={{ color: '#38bdf8' }}>5 derniers mois archivés</strong> dans votre historique de clôtures mensuelles, auxquels s'ajoute le mois en cours. Un mois n'apparaît dans le graphique que s'il a été <strong style={{ color: 'white' }}>clôturé par le comptable</strong> via le module État de Paie.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Jauge du Taux de Marge avec FAQ */}
                    {(() => { const marginPct = currCA > 0 ? (currMarginRaw / currCA) * 100 : 0; return (
                        <div style={{ background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {/* En-tête avec bouton FAQ */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
                            <h3 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                              Performance Financière
                            </h3>
                            <button
                              onClick={() => setFaqOpen(o => !o)}
                              title="Comprendre cet indicateur"
                              style={{
                                background: faqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                                border: '1px solid rgba(56,189,248,0.25)',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                color: '#38bdf8',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase'
                              }}
                            >
                              <HelpCircle size={12} /> FAQ
                            </button>
                          </div>

                          {/* Jauge */}
                          <MarginGauge percentage={marginPct} targetMargin={targetMargin} />
                          
                          {/* Contrôles interactifs d'Objectif Cible */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            <span>Cible :</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={targetMargin}
                              onChange={(e) => handleTargetMarginChange(e.target.value)}
                              style={{
                                width: '48px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '2px 4px',
                                color: '#38bdf8',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}
                            />
                            <span>%</span>
                            {marginPct >= targetMargin ? (
                              <span style={{ color: '#10b981', fontWeight: 800 }}>✓ Atteint</span>
                            ) : (
                              <span style={{ color: '#f43f5e', fontWeight: 800 }}>-{ (targetMargin - marginPct).toFixed(0) }%</span>
                            )}
                          </div>

                          <p style={{ color: '#64748b', fontSize: '0.78rem', textAlign: 'center', margin: '14px 0 0 0', fontWeight: 500, lineHeight: 1.45 }}>
                            Le taux de marge global représente la part du chiffre d'affaires convertie en bénéfices nets.
                          </p>

                          {/* Panneau FAQ dépliable */}
                          {faqOpen && (
                            <div style={{
                              marginTop: '20px', width: '100%',
                              background: 'rgba(5, 10, 22, 0.5)',
                              border: '1px solid rgba(56,189,248,0.1)',
                              borderRadius: '16px',
                              padding: '18px',
                              animation: 'fadeIn 0.2s ease',
                              textAlign: 'left'
                            }}>
                              <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                🎯 Rôle de la jauge
                              </div>

                              {/* Formule */}
                              <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.08)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.8 }}>
                                <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '6px', fontFamily: 'sans-serif', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formule</div>
                                Taux de Marge = (Marge Nette / CA) × 100<br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= (CA − Masse Salariale) / CA × 100
                              </div>

                              {/* Exemple live */}
                              <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.9 }}>
                                <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exemple (mois actuel)</div>
                                <span style={{ color: '#38bdf8' }}>CA</span> = {currCA.toLocaleString()} F CFA<br/>
                                <span style={{ color: '#c084fc' }}>MS</span> = {currMS.toLocaleString()} F CFA<br/>
                                <span style={{ color: '#10b981' }}>Marge</span> = {currMarginRaw.toLocaleString()} F CFA<br/>
                                <span style={{ color: 'white', fontWeight: 800 }}>Taux = {marginPct.toFixed(1)}%</span>
                              </div>

                              {/* Interprétation */}
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.7 }}>
                                Sur chaque <strong style={{ color: 'white' }}>100 F CFA</strong> facturé, il reste <strong style={{ color: '#10b981' }}>{marginPct.toFixed(0)} F</strong> de bénéfice après salaires.
                                Les <strong style={{ color: '#c084fc' }}>{(100 - marginPct).toFixed(0)} F restants</strong> sont consommés par la masse salariale.
                              </div>

                              {/* Code couleur */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Code couleur de la jauge</div>
                                {[
                                  { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: '> 60%', signal: 'Très bonne rentabilité', icon: '🟢' },
                                  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: '40% – 60%', signal: 'Rentabilité acceptable', icon: '🟡' },
                                  { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', label: '< 40%', signal: 'Alerte — charges trop élevées', icon: '🔴' },
                                ].map(r => (
                                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: r.bg, borderRadius: '8px', padding: '7px 10px' }}>
                                    <span style={{ fontSize: '0.8rem' }}>{r.icon}</span>
                                    <span style={{ color: r.color, fontWeight: 800, fontSize: '0.75rem', minWidth: '70px' }}>{r.label}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{r.signal}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ); })()} 
                  </div>
                  
                  {/* ANALYSE PORTEFEUILLE CLIENT */}
                  {analytics.sites_analysis && (
                    <div style={{ background: 'rgba(13, 18, 31, 0.45)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}>
                            <LayoutDashboard size={18} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>Analyse du Portefeuille Client</h3>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
                              {analytics.sites_analysis.prev_period === 'données actuelles'
                                ? 'Comparaison avec le référentiel actuel de Facturation Clients'
                                : `Comparaison avec le mois précédent (${analytics.sites_analysis.prev_period})`}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setPortefeuilleFaqOpen(o => !o)}
                          title="Comprendre cette section"
                          style={{
                            background: portefeuilleFaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}
                        >
                          <HelpCircle size={12} /> FAQ
                        </button>
                      </div>

                      {/* Panneau FAQ dépliable */}
                      {portefeuilleFaqOpen && (
                        <div style={{
                          marginBottom: '24px',
                          background: 'rgba(5, 10, 22, 0.5)',
                          border: '1px solid rgba(56,189,248,0.1)',
                          borderRadius: '16px',
                          padding: '18px',
                          textAlign: 'left'
                        }}>
                          <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            📁 Comprendre l'Analyse Portefeuille
                          </div>
                          <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                            Cette section compare la liste des sites facturés le mois en cours avec celle du mois précédent. Cela vous permet de suivre l'évolution dynamique de votre parc clients :
                          </p>
                          <ul style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
                            <li><strong style={{ color: 'white' }}>Sites Actifs</strong> : Nombre de sites actuellement facturés ce mois-ci.</li>
                            <li><strong style={{ color: '#10b981' }}>Nouveaux sites (Gagnés)</strong> : Sites qui n'avaient aucune facture le mois dernier mais qui en ont ce mois-ci (nouveaux contrats).</li>
                            <li><strong style={{ color: '#f43f5e' }}>Sites perdus</strong> : Sites qui avaient des factures le mois dernier mais plus aucune ce mois-ci (contrats suspendus ou terminés).</li>
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                        
                        {/* Résumé des sites */}
                        <div style={{ background: 'rgba(5, 8, 16, 0.4)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nombre total de sites</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: '2.1rem', fontWeight: 950, color: 'white' }}>{analytics.sites_analysis.curr_count}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>vs {analytics.sites_analysis.prev_count} le mois dernier</span>
                          </div>
                        </div>

                        {/* Sites Perdus */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.1)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <ArrowDown size={14} style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' }} /> Perdus ({analytics.sites_analysis.lost_sites.length})
                            </div>
                            <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.98rem' }}>-{formatMoney(analytics.sites_analysis.lost_value)}</div>
                          </div>
                          {analytics.sites_analysis.lost_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {analytics.sites_analysis.lost_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                                  <span>{s.name}</span>
                                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun site perdu.</div>
                          )}
                        </div>

                        {/* Sites Gagnés */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(34, 197, 94, 0.1)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <ArrowUp size={14} style={{ filter: 'drop-shadow(0 0 5px rgba(34,197,94,0.5))' }} /> Nouveaux ({analytics.sites_analysis.gained_sites.length})
                            </div>
                            <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '0.98rem' }}>+{formatMoney(analytics.sites_analysis.gained_value)}</div>
                          </div>
                          {analytics.sites_analysis.gained_sites.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                              {analytics.sites_analysis.gained_sites.map(s => (
                                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                                  <span>{s.name}</span>
                                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatMoney(s.value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun nouveau site.</div>
                          )}
                        </div>

                        {/* Congés Payés */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.01)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.1)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              <Palmtree size={14} /> Congés ({(analytics.sites_analysis.conge_agents || []).length})
                            </div>
                            <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '0.98rem' }}>{formatMoney(analytics.sites_analysis.conge_value || 0)}</div>
                          </div>
                          {(analytics.sites_analysis.conge_agents || []).length > 0 ? null : (
                            <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>Aucun congé payé ce mois.</div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                  {/* NOUVELLE GRANDE CARTE : DÉTAILS D'ACTIVITÉ */}
                  <div style={{ background: 'rgba(13, 18, 31, 0.45)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', boxShadow: '0 0 20px rgba(236,72,153,0.1)' }}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>Détails d'Activité et Facturation</h3>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
                          Aperçu des éléments impactant la paie et la facturation
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      
                      {/* 1. RÉCLAMATIONS */}
                      {/* 1. RÉCLAMATIONS */}
                      <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={14} /> RÉCLAMATIONS
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white', marginTop: 'auto' }}>
                          {analytics.reclamations_total !== undefined ? formatMoney(analytics.reclamations_total) : '- F CFA'}
                        </div>
                      </div>

                      {/* 2. SUPPLÉMENTAIRES */}
                      <div 
                        style={{ background: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(56,189,248,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        onClick={() => setShowSuppsArchiveModal(true)}
                      >
                        <div style={{ color: '#7dd3fc', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Plus size={14} /> SUPPLÉMENTAIRES
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white', marginTop: 'auto' }}>
                          {analytics.supplementaires_total !== undefined ? formatMoney(analytics.supplementaires_total) : '- F CFA'}
                        </div>
                      </div>

                      {/* 3. ABSENCES */}
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#fcd34d', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> ABSENCES
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white', marginTop: 'auto' }}>
                          {analytics.absences_total !== undefined 
                            ? (analytics.absences_total > 0 ? `-${formatMoney(analytics.absences_total)}` : '0 F CFA') 
                            : '- F CFA'}
                        </div>
                      </div>

                      {/* X. PONCTIONS */}
                      <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Scissors size={14} /> PONCTIONS
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white', marginTop: 'auto' }}>
                          {analytics.ponctions_total !== undefined 
                            ? (analytics.ponctions_total > 0 ? `-${formatMoney(analytics.ponctions_total)}` : '0 F CFA') 
                            : '- F CFA'}
                        </div>
                      </div>

                      {/* 4. SITES FACTURÉS */}
                      <div style={{ background: 'rgba(34, 197, 94, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(34, 197, 94, 0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#86efac', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={14} /> SITES FACTURÉS
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white' }}>
                            {analytics.billed_sites_count !== undefined ? `${analytics.billed_sites_count} Site${analytics.billed_sites_count > 1 ? 's' : ''}` : '-'}
                          </div>
                          {analytics.chiffre_affaire !== undefined && (
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#86efac', paddingBottom: '4px' }}>
                              {formatMoney(analytics.chiffre_affaire)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5. SITES NON FACTURÉS */}
                      <div style={{ background: 'rgba(148, 163, 184, 0.05)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(148, 163, 184, 0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={14} style={{ opacity: 0.5 }} /> SITES NON FACTURÉS
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white' }}>
                            {analytics.unbilled_sites_count !== undefined ? `${analytics.unbilled_sites_count} Site${analytics.unbilled_sites_count > 1 ? 's' : ''}` : '-'}
                          </div>
                          {analytics.unbilled_salary_total !== undefined && (
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: analytics.unbilled_salary_total > 0 ? '#f87171' : '#94a3b8', paddingBottom: '4px' }}>
                              {analytics.unbilled_salary_total > 0 ? '-' : ''}{formatMoney(analytics.unbilled_salary_total)}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* TOP / FLOP 3 DE RENTABILITÉ DES SITES */}
                  {analytics.sites_rentability && analytics.sites_rentability.length > 0 && (() => {
                    const sortedSites = [...analytics.sites_rentability].sort((a, b) => b.net_margin - a.net_margin);
                    const top3 = sortedSites.slice(0, 3);
                    
                    const sortedFlop = [...analytics.sites_rentability]
                      .sort((a, b) => a.net_margin - b.net_margin)
                      .slice(0, 3);
                      
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {/* TOP 3 */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ color: '#10b981', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TrendingUp size={18} style={{ color: '#10b981' }} /> Top 3 des Sites les plus Rentables
                            </h3>
                            <button
                              onClick={() => setTop3FaqOpen(o => !o)}
                              title="Comprendre cet indicateur"
                              style={{
                                background: top3FaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                                border: '1px solid rgba(56,189,248,0.25)',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                color: '#38bdf8',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase'
                              }}
                            >
                              <HelpCircle size={12} /> FAQ
                            </button>
                          </div>

                          {/* Panneau FAQ dépliable */}
                          {top3FaqOpen && (
                            <div style={{
                              marginBottom: '16px',
                              background: 'rgba(5, 10, 22, 0.5)',
                              border: '1px solid rgba(56,189,248,0.1)',
                              borderRadius: '16px',
                              padding: '14px',
                              textAlign: 'left'
                            }}>
                              <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px' }}>
                                💎 Classement de rentabilité
                              </div>
                              <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                                Ce tableau identifie vos 3 clients les plus rentables en volume financier (bénéfice net brut le plus élevé après soustraction du coût des agents associés).
                              </p>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {top3.map((s, idx) => {
                              const marginPct = s.contract_revenue > 0 ? (s.net_margin / s.contract_revenue) * 100 : 0;
                              return (
                                <div key={s.site_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', padding: '12px 16px', borderRadius: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>#{idx + 1}</span>
                                    <div>
                                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{s.site_name}</span>
                                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>Marge : {marginPct.toFixed(0)}%</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>{formatMoney(s.net_margin)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* FLOP 3 */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ color: '#f43f5e', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TrendingDown size={18} style={{ color: '#f43f5e' }} /> Points de Vigilance (Flop 3)
                            </h3>
                            <button
                              onClick={() => setFlop3FaqOpen(o => !o)}
                              title="Comprendre cet indicateur"
                              style={{
                                background: flop3FaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                                border: '1px solid rgba(56,189,248,0.25)',
                                borderRadius: '20px',
                                padding: '4px 12px',
                                color: '#38bdf8',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase'
                              }}
                            >
                              <HelpCircle size={12} /> FAQ
                            </button>
                          </div>

                          {/* Panneau FAQ dépliable */}
                          {flop3FaqOpen && (
                            <div style={{
                              marginBottom: '16px',
                              background: 'rgba(5, 10, 22, 0.5)',
                              border: '1px solid rgba(56,189,248,0.1)',
                              borderRadius: '16px',
                              padding: '14px',
                              textAlign: 'left'
                            }}>
                              <div style={{ color: '#f43f5e', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px' }}>
                                ⚠️ Attention à la Rentabilité Faible/Négative
                              </div>
                              <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                                Ce classement liste les 3 sites affichant la rentabilité la plus critique. Si la marge est négative (en rouge), la facturation ne couvre pas les coûts de vos agents sur place. Il est recommandé de renégocier les tarifs contractuels ou d'optimiser le personnel.
                              </p>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedFlop.map((s, idx) => {
                              const marginPct = s.contract_revenue > 0 ? (s.net_margin / s.contract_revenue) * 100 : 0;
                              const isNegative = s.net_margin < 0;
                              return (
                                <div key={s.site_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isNegative ? 'rgba(244,63,94,0.05)' : 'rgba(245,158,11,0.04)', border: isNegative ? '1px solid rgba(244,63,94,0.12)' : '1px solid rgba(245,158,11,0.12)', padding: '12px 16px', borderRadius: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isNegative ? '#f43f5e' : '#f59e0b' }}>#{idx + 1}</span>
                                    <div>
                                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{s.site_name}</span>
                                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px', fontWeight: 600 }}>Marge : {marginPct.toFixed(0)}%</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: isNegative ? '#f43f5e' : '#f59e0b', fontWeight: 800, fontSize: '0.95rem' }}>
                                      {isNegative ? '-' : ''}{formatMoney(Math.abs(s.net_margin))}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </>
              ) : (
                <div style={{ padding: '30px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 30px rgba(245, 158, 11, 0.05)' }}>
                  <AlertCircle size={36} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.3))' }} />
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800 }}>Clôture manquante pour ce mois</h3>
                    <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.6', fontSize: '0.92rem' }}>
                      Pour visualiser le Chiffre d'Affaires et la Masse Salariale exacte, vous devez d'abord vous rendre dans <strong>État de Paie</strong> et cliquer sur le bouton <strong>Clôturer l'état de paie</strong> pour la période <strong>{period}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* CHARTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Analyse Rentabilité (Top 8 Sites)</h3>
                    <button
                      onClick={() => setTop8FaqOpen(o => !o)}
                      title="Comprendre ce graphique"
                      style={{
                        background: top8FaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                        border: '1px solid rgba(56,189,248,0.25)',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      <HelpCircle size={12} /> FAQ
                    </button>
                  </div>

                  {/* Panneau FAQ dépliable */}
                  {top8FaqOpen && (
                    <div style={{
                      marginBottom: '20px',
                      background: 'rgba(5, 10, 22, 0.5)',
                      border: '1px solid rgba(56,189,248,0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>
                        📊 Graphique de rentabilité comparée
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                        Ce graphique à barres compare directement les <strong style={{ color: '#7dd3fc' }}>Revenus facturés</strong> (barre bleu clair) avec les <strong style={{ color: '#c4b5fd' }}>Coûts salariaux</strong> (barre violette) pour chacun de vos 8 sites les plus importants. Si la barre des coûts passe en <strong style={{ color: '#fda4af' }}>rose/rouge</strong>, cela signifie que la masse salariale dépasse <strong style={{ color: '#fda4af' }}>80%</strong> du montant facturé (Alerte budget).
                      </p>
                    </div>
                  )}

                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v/1000000).toFixed(1) + 'M'} />
                        <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Revenus" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Coûts" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isAlert ? '#fda4af' : '#c4b5fd'} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Alertes Dépassement Budget</h3>
                    <button
                      onClick={() => setBudgetFaqOpen(o => !o)}
                      title="Comprendre cet indicateur"
                      style={{
                        background: budgetFaqOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.06)',
                        border: '1px solid rgba(56,189,248,0.25)',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      <HelpCircle size={12} /> FAQ
                    </button>
                  </div>

                  {/* Panneau FAQ dépliable */}
                  {budgetFaqOpen && (
                    <div style={{
                      marginBottom: '20px',
                      background: 'rgba(5, 10, 22, 0.5)',
                      border: '1px solid rgba(56,189,248,0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>
                        ⚠️ Règle des 80% du budget
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>
                        Cette section liste les clients dont la masse salariale dépasse <strong style={{ color: '#fda4af' }}>80%</strong> du chiffre d'affaires généré par ce site. Un dépassement de ce seuil signifie qu'il ne reste que moins de 20% de marge brute, ce qui compromet la rentabilité et ne permet pas de couvrir les coûts d'administration globale.
                      </p>
                    </div>
                  )}

                  {analytics.sites_rentability.filter(s => s.is_alert).length === 0 ? (
                    <div style={{ color: '#22c55e', textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircle size={24} style={{ color: '#22c55e', marginBottom: '10px', marginLeft: 'auto', marginRight: 'auto' }} />
                      <div>Aucun site en alerte budget (Tous sous les 80%).</div>
                    </div>
                  ) : (
                    analytics.sites_rentability.filter(s => s.is_alert).map((s) => (
                      <div key={s.name} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{s.name}</span>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>
                            {s.contract_revenue > 0 ? Math.round((s.total_cost / s.contract_revenue) * 100) + '%' : 'Non Facturé'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                           Coût: {formatMoney(s.total_cost)} / {formatMoney(s.contract_revenue)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}


          {activeTab === 'saisie' && (
            <motion.div key="saisie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              
              {!isCompta && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '15px', color: '#fcd34d', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={24} style={{ color: '#fcd34d' }} />
                  Mode Lecture Seule. Seul le service COMPTABILITE peut modifier ces paramètres.
                </div>
              )}


              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
                
                {/* VARIABLES MENSUELLES */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sliders size={18} /> Variables Globales ({period})
                  </h3>
                  
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>Primes Globales Exceptionnelles (XOF)</label>
                    <input 
                      type="number" 
                      disabled={!isCompta}
                      value={varsData.primes_globales}
                      onChange={e => setVarsData({...varsData, primes_globales: Number(e.target.value)})}
                      style={{ width: '100%', background: isCompta ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)', border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '10px', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>Charges Patronales Globales (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      disabled={!isCompta}
                      value={varsData.charges_globales_percent}
                      onChange={e => setVarsData({...varsData, charges_globales_percent: Number(e.target.value)})}
                      style={{ width: '100%', background: isCompta ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)', border: isCompta ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '10px', borderRadius: '8px' }}
                    />
                  </div>

                  {isCompta && (
                    <button onClick={handleSaveVars} style={{ marginTop: 'auto', width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      Appliquer les variables
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
            )}
          </AnimatePresence>
        )}
        {/* Modals */}
      {showSuppsArchiveModal && (
        <SupplementairesArchiveModal
          period={period}
          onClose={() => setShowSuppsArchiveModal(false)}
        />
      )}

    </div>

    </div>
  );
}
