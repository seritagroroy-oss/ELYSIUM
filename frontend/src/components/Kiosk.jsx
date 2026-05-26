import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { Clock, CheckCircle, XCircle, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';

export default function Kiosk({ setView }) {
  const [sites, setSites] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAction, setLastAction] = useState(null); // { agentName, status, shift }
  const [loading, setLoading] = useState(false);
  const [cycleStart, setCycleStart] = useState(21);
  const lastActionTimer = useRef(null);

  // Horloge en direct
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les paramètres
  useEffect(() => {
    async function init() {
      try {
        const settings = await apiCall('get_settings', {}, 'GET');
        if (settings?.cycle_start) setCycleStart(settings.cycle_start);

        const res = await apiCall('get_sites', {}, 'GET');
        if (Array.isArray(res) && res.length > 0) {
          setSites(res);
          setActiveSiteId(res[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  // Charger les agents du site sélectionné
  useEffect(() => {
    if (!activeSiteId) return;
    loadSiteData();
  }, [activeSiteId, period]);

  const loadSiteData = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_site_data', { site_id: activeSiteId, period }, 'GET');
      if (Array.isArray(res)) {
        setSiteData(res.filter(sub => !sub.id.startsWith('mutated_')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatDateKey(currentTime);

  // Détermine si on est sur le shift J ou N selon l'heure
  const getAutoShiftCode = () => {
    const hour = currentTime.getHours();
    return (hour >= 6 && hour < 18) ? 'J' : 'N';
  };

  const getAgentCurrentStatus = (agent) => {
    const shiftCode = getAutoShiftCode();
    const att = agent.attendance || [];
    const todayAtt = att.find(a => a.date === todayStr && a.shift_code === shiftCode);
    return todayAtt ? todayAtt.status : '';
  };

  // Basculer la présence d'un agent via clic en mode kiosque
  const handleAgentToggle = async (agent, subsiteId) => {
    const shiftCode = getAutoShiftCode();
    const currentStatus = getAgentCurrentStatus(agent);

    // Toggle : si présent → retirer, si absent/vide → présent
    const newStatus = currentStatus === '1' ? '' : '1';
    const actionLabel = newStatus === '1' ? 'POINTÉ PRÉSENT' : 'POINTAGE RETIRÉ';

    try {
      const res = await apiCall('update_attendance', {
        agent_id: agent.id,
        date: todayStr,
        shift_code: shiftCode,
        status: newStatus,
        period
      });

      if (res.success) {
        // Feedback visuel en haut
        setLastAction({ agentName: agent.name, status: actionLabel, shift: shiftCode === 'J' ? 'JOUR' : 'NUIT' });
        clearTimeout(lastActionTimer.current);
        lastActionTimer.current = setTimeout(() => setLastAction(null), 5000);

        // Mise à jour locale optimiste
        setSiteData(prev => prev.map(sub => {
          if (sub.id !== subsiteId) return sub;
          return {
            ...sub,
            agents: (sub.agents || []).map(a => {
              if (a.id !== agent.id) return a;
              let updatedAtt = [...(a.attendance || [])];
              const idx = updatedAtt.findIndex(x => x.date === todayStr && x.shift_code === shiftCode);
              if (idx > -1) {
                if (newStatus === '') updatedAtt.splice(idx, 1);
                else updatedAtt[idx].status = newStatus;
              } else if (newStatus !== '') {
                updatedAtt.push({ date: todayStr, shift_code: shiftCode, status: newStatus });
              }
              return { ...a, attendance: updatedAtt };
            })
          };
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const shiftCode = getAutoShiftCode();
  const shiftLabel = shiftCode === 'J' ? '☀️ VACATION JOUR' : '🌙 VACATION NUIT';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 90%, rgba(34,197,94,0.1), transparent 40%), radial-gradient(circle at 90% 10%, rgba(56,189,248,0.1), transparent 40%), #080e1b',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      margin: '-24px',
    }}>
      {/* Barre supérieure Kiosque */}
      <div style={{
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ShieldAlert size={32} style={{ color: 'var(--b)' }} />
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Pointage Pro</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Mode Kiosque — {shiftLabel}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Sélecteur de site */}
          <select
            className="form-input"
            style={{ background: 'rgba(0,0,0,0.4)', minWidth: '160px', borderColor: 'rgba(255,255,255,0.12)' }}
            value={activeSiteId}
            onChange={(e) => setActiveSiteId(e.target.value)}
          >
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Horloge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Retour Dashboard */}
          <button
            className="btn btn-secondary"
            onClick={() => setView('dashboard')}
            style={{ padding: '10px 14px' }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Feedback du dernier pointage */}
      {lastAction && (
        <div style={{
          padding: '16px 32px',
          background: lastAction.status.includes('PRÉSENT') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          borderBottom: `1px solid ${lastAction.status.includes('PRÉSENT') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {lastAction.status.includes('PRÉSENT')
            ? <CheckCircle size={28} style={{ color: 'var(--a)', flexShrink: 0 }} />
            : <XCircle size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: lastAction.status.includes('PRÉSENT') ? 'var(--a)' : 'var(--danger)' }}>
              {lastAction.agentName}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              {lastAction.status} — Vacation {lastAction.shift}
            </div>
          </div>
        </div>
      )}

      {/* Grille des agents */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--b)' }} />
          </div>
        ) : siteData.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--muted)' }}>
            <ShieldAlert size={56} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <h3>Aucun agent sur ce site</h3>
          </div>
        ) : (
          siteData.map(sub => (
            <div key={sub.id} style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                marginBottom: '16px',
                paddingLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '4px', height: '16px', background: 'var(--b)', borderRadius: '2px', display: 'inline-block' }}></span>
                {sub.name}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '14px'
              }}>
                {sub.agents.map(agent => {
                  const status = getAgentCurrentStatus(agent);
                  const isPresent = status === '1';
                  const isAbsent = status === 'A';

                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentToggle(agent, sub.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '24px 16px',
                        borderRadius: '16px',
                        border: `2px solid ${isPresent ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        background: isPresent
                          ? 'rgba(34,197,94,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-family)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {/* Avatar Cercle */}
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: isPresent
                          ? 'rgba(34,197,94,0.25)'
                          : 'rgba(255,255,255,0.06)',
                        border: `3px solid ${isPresent ? 'var(--a)' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        fontWeight: '800',
                        color: isPresent ? 'var(--a)' : 'var(--muted)',
                        transition: 'all 0.2s'
                      }}>
                        {agent.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Nom */}
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.2 }}>
                        {agent.name}
                      </div>

                      {/* Statut */}
                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: isPresent ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isPresent ? 'var(--a)' : 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}>
                        {isPresent ? '✓ Présent' : '— Absent'}
                      </div>

                      {/* Poste */}
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', opacity: 0.7 }}>
                        {agent.function} · {agent.shift_type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pied de page */}
      <div style={{
        padding: '14px 32px',
        background: 'rgba(0,0,0,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.82rem',
        color: 'var(--muted)'
      }}>
        <span>Cliquez sur un agent pour basculer sa présence</span>
        <span>
          Total présents aujourd'hui : <strong style={{ color: 'var(--a)' }}>
            {siteData.flatMap(s => s.agents).filter(a => getAgentCurrentStatus(a) === '1').length}
          </strong>
          {' '}/ {siteData.flatMap(s => s.agents).length} agents
        </span>
      </div>
    </div>
  );
}
