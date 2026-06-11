import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, TrendingUp, Calendar, AlertCircle, ArrowLeft, Activity, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCall } from '../api';

const COLORS = ['#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#f472b6', '#34d399', '#fbbf24'];

function formatPeriod(period) {
  const [y, m] = period.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return months[parseInt(m) - 1] + ' ' + y;
}

export default function AnalyticsDashboard({ goBack }) {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall('get_analytics', { period }, 'GET');
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Erreur inconnue du serveur.');
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const changePeriod = (delta) => {
    const [y, m] = period.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setPeriod(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--a)' }}>
        <Activity className="animate-spin" size={48} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
        <h2 style={{ marginBottom: '16px' }}>Erreur de chargement</h2>
        <p>{error || "Impossible de charger les données analytiques."}</p>
        <button onClick={goBack} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={goBack}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text)' }}>
              Tableau de Bord Analytique
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Aperçu global et statistiques en temps réel</p>
          </div>
        </div>

        {/* Period Selector */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', 
          background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border)', 
          borderRadius: '12px', padding: '8px 16px' 
        }}>
          <button onClick={() => changePeriod(-1)} style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', minWidth: '160px', textAlign: 'center' }}>
            {formatPeriod(period)}
          </span>
          <button onClick={() => changePeriod(1)} style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Agents Actifs', value: data.totalAgents, icon: Users, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' },
          { label: 'Taux de Présence', value: data.presenceRate + '%', icon: Calendar, color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' },
          { label: 'Absences (Ce cycle)', value: data.totalAbsences, icon: AlertCircle, color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' },
          { label: 'Masse Salariale', value: data.masseSalarialeLabel + ' FCFA', icon: CreditCard, color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.2)' }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ 
              background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${kpi.borderColor}`, 
              borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px',
              transition: 'all 0.3s', cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 25px -5px ${kpi.color}20`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={26} color={kpi.color} />
              </div>
              <div>
                <p style={{ color: 'var(--muted)', margin: '0 0 4px 0', fontSize: '0.85rem' }}>{kpi.label}</p>
                <h3 style={{ margin: 0, fontSize: '1.7rem', color: '#f8fafc', fontWeight: 800 }}>{kpi.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        {/* Pie Chart */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text)', fontSize: '1rem' }}>Répartition par Site</h3>
          <div style={{ height: '300px' }}>
            {data.agentsBySite && data.agentsBySite.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.agentsBySite}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.agentsBySite.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: '10px' }}>
                <Users size={32} style={{ opacity: 0.3 }} />
                <span>Aucun agent pour cette période</span>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text)', fontSize: '1rem' }}>Présences vs Absences — {formatPeriod(period)}</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                <Bar dataKey="Présents" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="Absents" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Area Chart - Full Width */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <TrendingUp size={20} color="#a855f7" />
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>Évolution de la Masse Salariale (6 derniers mois)</h3>
        </div>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.salaryFluctuation} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMasse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} 
                tickFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}
              />
              <RechartsTooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [value.toLocaleString('fr-FR') + ' FCFA', 'Masse Salariale']}
              />
              <Area type="monotone" dataKey="MasseSalariale" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorMasse)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
