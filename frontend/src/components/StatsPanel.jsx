/**
 * StatsPanel.jsx — Panneau de statistiques avec graphiques recharts
 * Intégré dans le Dashboard ELYSIUM comme overlay/panel
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { apiCall } from '../api';
import { TrendingUp, Users, UserCheck, UserX, Clock, RefreshCw, X } from 'lucide-react';

// ─── Couleurs palette ELYSIUM ──────────────────────────────────────────────────
const COLORS = {
  present: '#10b981',
  absent:  '#ef4444',
  late:    '#f59e0b',
  primary: '#6366f1',
  secondary: '#8b5cf6',
};

const PIE_COLORS = [COLORS.present, COLORS.absent, COLORS.late, '#3b82f6'];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: 10,
      padding: '8px 14px',
      color: '#f8fafc',
      fontSize: 13,
    }}>
      <p style={{ margin: 0, fontWeight: 600, color: '#a5b4fc' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color, delta }) => (
  <div style={{
    background: 'rgba(15,23,42,0.7)',
    border: `1px solid ${color}40`,
    borderRadius: 14,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flex: '1 1 140px',
    minWidth: 130,
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{
      background: `${color}20`,
      borderRadius: 10,
      padding: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{value ?? '—'}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 11, color: delta >= 0 ? COLORS.present : COLORS.absent, marginTop: 2 }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs hier
        </div>
      )}
    </div>
  </div>
);

// ─── Composant principal ────────────────────────────────────────────────────────
export default function StatsPanel({ companyId, onClose, embedded = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_stats', { period }, 'GET');
      if (res && !res.error) {
        setStats(res);
      } else {
        // Données de démonstration si l'endpoint n'est pas encore disponible
        setStats(generateDemoStats());
      }
    } catch (e) {
      setStats(generateDemoStats());
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const generateDemoStats = () => ({
    total_agents: 70,
    present_today: 52,
    absent_today: 8,
    late_today: 10,
    by_day: [
      { day: 'Lun', count: 58 }, { day: 'Mar', count: 61 }, { day: 'Mer', count: 55 },
      { day: 'Jeu', count: 63 }, { day: 'Ven', count: 59 }, { day: 'Sam', count: 48 },
      { day: 'Dim', count: 52 },
    ],
    monthly: [
      { month: '2025-12', count: 1820 }, { month: '2026-01', count: 1950 },
      { month: '2026-02', count: 1780 }, { month: '2026-03', count: 2100 },
      { month: '2026-04', count: 1980 }, { month: '2026-05', count: 2200 },
    ],
  });

  const pieData = stats ? [
    { name: 'Présents', value: stats.present_today },
    { name: 'Absents',  value: stats.absent_today },
    { name: 'Retards',  value: stats.late_today },
  ] : [];

  const containerStyle = embedded ? {} : {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  };

  const panelStyle = embedded ? {
    background: 'rgba(11,18,32,0.95)',
    borderRadius: 20,
    padding: 24,
    border: '1px solid rgba(99,102,241,0.2)',
  } : {
    background: 'rgba(11,18,32,0.98)',
    borderRadius: 20,
    padding: 28,
    border: '1px solid rgba(99,102,241,0.3)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    width: '100%',
    maxWidth: 900,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'daily',    label: 'Par jour' },
    { id: 'monthly',  label: 'Mensuel' },
  ];

  return (
    <div style={containerStyle} onClick={embedded ? undefined : (e) => e.target === e.currentTarget && onClose?.()}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={22} color="#6366f1" />
              Statistiques de présence
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
              Période : {period}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="month"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#f8fafc',
                padding: '6px 10px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            />
            <button
              onClick={fetchStats}
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#a5b4fc',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {!embedded && onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#f87171',
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                background: activeTab === t.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                border: activeTab === t.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent',
                borderRadius: 8,
                color: activeTab === t.id ? '#a5b4fc' : '#64748b',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#6366f1' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <KpiCard icon={Users}     label="Total agents"   value={stats?.total_agents}  color="#6366f1" />
              <KpiCard icon={UserCheck} label="Présents auj."  value={stats?.present_today} color={COLORS.present} />
              <KpiCard icon={UserX}     label="Absents auj."   value={stats?.absent_today}  color={COLORS.absent} />
              <KpiCard icon={Clock}     label="Retards auj."   value={stats?.late_today}    color={COLORS.late} />
            </div>

            {/* Tab: Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Pie Chart */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Répartition aujourd'hui</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart - 7 derniers jours */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>7 derniers jours</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats?.by_day || []} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Présents" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab: Par jour */}
            {activeTab === 'daily' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Présences par jour (7 derniers jours)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats?.by_day || []} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Présents" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#4338ca" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tab: Mensuel */}
            {activeTab === 'monthly' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Évolution sur 6 mois</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={stats?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Présences"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#1e1b4b' }}
                      activeDot={{ r: 7, fill: '#a5b4fc' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
