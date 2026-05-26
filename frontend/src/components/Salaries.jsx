import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { DollarSign, Search, Download, ChevronDown, ChevronUp, Loader2, Settings } from 'lucide-react';

export default function Salaries() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [salaries, setSalaries] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState({});
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const getPeriodsList = () => {
    const list = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({
        value: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      });
    }
    return list;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [salRes, cfgRes, funcRes] = await Promise.all([
        apiCall('get_salaries', { period }, 'GET'),
        apiCall('get_salary_config', {}, 'GET'),
        apiCall('get_functions', {}, 'GET'),
      ]);
      if (Array.isArray(salRes)) setSalaries(salRes);
      if (cfgRes && !cfgRes.success === false) setSalaryConfig(cfgRes);
      if (Array.isArray(funcRes)) setFunctions(funcRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const filteredSalaries = salaries.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subsite.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMasse = filteredSalaries.reduce((acc, s) => acc + s.total, 0);

  const funcLabel = (id) => {
    const f = functions.find(fn => fn.id === id);
    return f ? f.name : id;
  };

  const handleUpdateSalaryConfig = async () => {
    try {
      const res = await apiCall('update_salary_config', { config: salaryConfig });
      if (res.success) {
        alert('Configuration des taux de salaires sauvegardée !');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {/* Barre d'action */}
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={24} style={{ color: 'var(--a)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Calcul des Salaires</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ background: 'rgba(0,0,0,0.3)', minWidth: '180px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {getPeriodsList().map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher un agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', minWidth: '200px' }}
            />
          </div>
        </div>
      </div>



      {/* Résumé Global */}
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="stat-card">
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Agents calculés</span>
          <span className="stat-val" style={{ color: 'var(--b)' }}>{filteredSalaries.length}</span>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Masse Salariale Totale</span>
          <span className="stat-val" style={{ color: 'var(--a)' }}>{totalMasse.toLocaleString()} XOF</span>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total Absences</span>
          <span className="stat-val" style={{ color: 'var(--danger)' }}>
            {filteredSalaries.reduce((acc, s) => acc + s.absences, 0)}
          </span>
        </div>
        <div className="stat-card">
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total Supplémentaires</span>
          <span className="stat-val" style={{ color: 'var(--c)' }}>
            {filteredSalaries.reduce((acc, s) => acc + (s.sp_count || 0), 0).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Table des Salaires */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
        </div>
      ) : (
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Site / Zone</th>
                  <th>Poste</th>
                  <th>Vacation</th>
                  <th style={{ textAlign: 'right' }}>Base (XOF)</th>
                  <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Retenues</th>
                  <th style={{ textAlign: 'right', color: 'var(--b)' }}>Supplémentaire</th>
                  <th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
                      Aucun agent trouvé pour cette période
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((s, idx) => (
                    <React.Fragment key={idx}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: '600' }}>{s.name}</td>
                        <td style={{ color: 'var(--muted)' }}>{s.site} / {s.subsite}</td>
                        <td>
                          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--b)', padding: '3px 8px', borderRadius: '20px', fontSize: '0.82rem' }}>
                            {funcLabel(s.function)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{s.shift_type}</td>
                        <td style={{ textAlign: 'right' }}>{s.base.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: s.deductions > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                          {s.deductions > 0 ? `-${s.deductions.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', color: s.gains > 0 ? 'var(--b)' : 'var(--muted)' }}>
                          {s.gains > 0 ? `+${s.gains.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--a)' }}>
                          {s.total.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          {expandedRow === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={9} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                              <div>
                                <h4 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                  Absences ({s.absences} jours)
                                </h4>
                                {(s.absence_details || []).length === 0 ? (
                                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Aucune absence</p>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {s.absence_details.map((a, i) => (
                                      <span key={i} style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        color: 'var(--danger)',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                      }}>
                                        {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 style={{ color: 'var(--b)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                  Services Supplémentaires
                                </h4>
                                {(s.sp_details || []).length === 0 ? (
                                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Aucun service SP</p>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {s.sp_details.map((a, i) => (
                                      <span key={i} style={{
                                        background: 'rgba(56,189,248,0.1)',
                                        color: 'var(--b)',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                      }}>
                                        {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {filteredSalaries.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={4} style={{ fontWeight: '700', padding: '14px 16px' }}>TOTAL MASSE SALARIALE</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {filteredSalaries.reduce((acc, s) => acc + s.base, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--danger)' }}>
                      -{filteredSalaries.reduce((acc, s) => acc + s.deductions, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--b)' }}>
                      +{filteredSalaries.reduce((acc, s) => acc + s.gains, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.05rem' }}>
                      {totalMasse.toLocaleString()} XOF
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
