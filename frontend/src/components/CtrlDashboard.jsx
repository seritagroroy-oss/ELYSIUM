import React from 'react';
import { BarChart3, Users, AlertTriangle, Clock, MapPin, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';

export default function CtrlDashboard() {
  const stats = {
    globalPresenceRate: 91,
    activeSites: 4,
    totalAgentsOnDuty: 30,
    openAlerts: 2,
    totalOvertimeHours: 42
  };

  const sitesSummary = [
    { name: 'Siège Social Cocody', presence: 100, onDuty: 4, scheduled: 4, status: 'all_present', alerts: 0 },
    { name: 'Entrepôt Vridi', presence: 75, onDuty: 3, scheduled: 4, status: 'missing_agent', alerts: 1 },
    { name: 'Zone Industrielle Yopougon', presence: 92, onDuty: 11, scheduled: 12, status: 'minor_anomaly', alerts: 1 },
    { name: 'Centre Commercial Marcory', presence: 100, onDuty: 6, scheduled: 6, status: 'all_present', alerts: 0 }
  ];

  const recentEvents = [
    { id: 1, site: 'Entrepôt Vridi', time: 'Il y a 10 min', text: 'Tuho Moussa signalé ABSENT à la prise de service.', type: 'critical' },
    { id: 2, site: 'Zone Industrielle Yopougon', time: 'Il y a 45 min', text: 'Audit site : Sanogo Bakary signalé avec Anomalie de tenue.', type: 'warning' },
    { id: 3, site: 'Siège Social Cocody', time: 'Il y a 2h', text: 'Ronde de début de service validée par le contrôleur.', type: 'info' }
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
          <BarChart3 size={28} /> Tableau de Bord Secteur
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Indicateurs opérationnels des sites sous votre supervision directe.
        </p>
      </div>

      {/* KPI Cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* KPI 1: Taux de présence */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Taux de Présence</span>
            <Users size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>{stats.globalPresenceRate}%</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{stats.totalAgentsOnDuty} agents actifs en ce moment</span>
        </div>

        {/* KPI 2: Alertes Ouvertes */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Alertes en cours</span>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: stats.openAlerts > 0 ? '#ef4444' : '#10b981' }}>{stats.openAlerts}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nécessitent une action terrain</span>
        </div>

        {/* KPI 3: Heures Supplémentaires */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Heures Sup (Mois)</span>
            <Clock size={20} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#cbd5e1' }}>{stats.totalOvertimeHours}h</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cumulées sur votre secteur</span>
        </div>

        {/* KPI 4: Sites actifs */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sites sous Tutelle</span>
            <MapPin size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8' }}>{stats.activeSites}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tous déclarés actifs</span>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Sites Presence details */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#818cf8" /> État des Sites supervisés
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sitesSummary.map((site, index) => (
              <div key={index} style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#cbd5e1' }}>{site.name}</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '700', 
                    color: site.presence === 100 ? '#10b981' : (site.presence >= 80 ? '#f59e0b' : '#ef4444'),
                    backgroundColor: site.presence === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {site.presence}% Présence
                  </span>
                </div>

                <div style={{ width: '100%', height: '6px', backgroundColor: '#1f2937', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${site.presence}%`, 
                    height: '100%', 
                    backgroundColor: site.presence === 100 ? '#10b981' : (site.presence >= 80 ? '#f59e0b' : '#ef4444'),
                    borderRadius: '3px'
                  }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Effectif : {site.onDuty} / {site.scheduled} agents</span>
                  <span style={{ color: site.alerts > 0 ? '#ef4444' : '#94a3b8', fontWeight: site.alerts > 0 ? '700' : 'normal' }}>
                    {site.alerts > 0 ? `⚠️ ${site.alerts} alerte active` : '✓ Aucune alerte'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed & Recent Activities */}
        <div style={{ backgroundColor: '#111827', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#818cf8" /> Fil d'Activité Récent
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentEvents.map((evt) => (
              <div key={evt.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: evt.type === 'critical' ? '#ef4444' : (evt.type === 'warning' ? '#f59e0b' : '#38bdf8'),
                  marginTop: '6px'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1' }}>{evt.site}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{evt.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>{evt.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
