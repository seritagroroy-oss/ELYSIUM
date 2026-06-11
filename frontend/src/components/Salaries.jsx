import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCall } from '../api';
import { DollarSign, Search, Settings, Edit3, Calculator, Loader2, Save, Printer, ChevronDown, ChevronUp, Download, CreditCard, PiggyBank, BookOpen, Building, BarChart3, CalendarDays, FileText, Bell, AlertTriangle, TrendingUp, Users, X, Plus, Trash2, Clock, Award, Archive, ArrowUpRight, ArrowDownRight, FileSignature, Target, Briefcase, Smartphone, Scale, Receipt, DownloadCloud, Fingerprint } from 'lucide-react';

// ── Utilitaires ──
const getMonthsDiff = (start, end) => {
  const d1 = new Date(start + '-01');
  const d2 = new Date(end + '-01');
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};
const fmt = (n) => (n || 0).toLocaleString('fr-FR');
const fmtPeriod = (p) => {
  const d = new Date(p + '-01');
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};
const countBusinessDays = (start, end) => {
  let count = 0;
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) { if (d.getDay() !== 0) count++; d.setDate(d.getDate() + 1); }
  return count;
};
const getDaysInMonth = (periodStr, startDate, endDate) => {
  const monthStart = new Date(periodStr + '-01');
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const sStart = new Date(startDate);
  const sEnd = new Date(endDate);
  const overlapStart = sStart > monthStart ? sStart : monthStart;
  const overlapEnd = sEnd < monthEnd ? sEnd : monthEnd;
  if (overlapStart > overlapEnd) return 0;
  return countBusinessDays(overlapStart, overlapEnd);
};

// ── Mini SVG Chart Components ──
const MiniBar = ({ data, height = 160, color = '#38bdf8' }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height: `${height}px` }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        return (
          <g key={i}>
            <rect x={i * w + w * 0.15} y={height - h - 20} width={w * 0.7} height={h} rx={2} fill={d.color || color} opacity={0.85} />
            <text x={i * w + w / 2} y={height - 4} textAnchor="middle" fontSize="5" fill="#94a3b8">{d.label}</text>
            <text x={i * w + w / 2} y={height - h - 24} textAnchor="middle" fontSize="4.5" fill="white">{fmt(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
};

const Donut = ({ slices, size = 140 }) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let cumul = 0;
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {slices.map((s, i) => {
          const pct = s.value / total;
          const offset = c * (1 - cumul);
          cumul += pct;
          return <circle key={i} cx={50} cy={50} r={r} fill="none" stroke={s.color} strokeWidth={16} strokeDasharray={`${c * pct} ${c * (1 - pct)}`} strokeDashoffset={offset} transform="rotate(-90 50 50)" />;
        })}
        <text x={50} y={48} textAnchor="middle" fill="white" fontSize="9" fontWeight="900">{fmt(total)}</text>
        <text x={50} y={58} textAnchor="middle" fill="#94a3b8" fontSize="5">XOF</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--muted)' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'white' }}>{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════
export default function Salaries() {
  // ── États ──
  const [activeTab, setActiveTab] = useState('dashboard');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [salaries, setSalaries] = useState([]);
  const [prevSalaries, setPrevSalaries] = useState([]);
  const [payrollSettings, setPayrollSettings] = useState({
    cnps_salarial: 6.3, cnps_patronal: 7.7, its: 1.2, fdfp: 1.2,
    taux_hs_jour: 15, taux_hs_nuit: 50, taux_hs_dimanche: 75, taux_hs_ferie: 100,
    enable_seniority: false, tax_mode: 'simplifie'
  });
  const [payrollVariables, setPayrollVariables] = useState({});
  const [loans, setLoans] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  
  const [newLoan, setNewLoan] = useState({ agent_name: '', amount: '', motif: '', modality: 'mensualite', monthly_deduction: '', start_period: period, date_granted: new Date().toISOString().slice(0, 10) });
  const [showLoanSuggestions, setShowLoanSuggestions] = useState(false);
  const [newLeave, setNewLeave] = useState({ agent_id: '', start_date: '', end_date: '', type: 'conge_paye' });
  const [newSanction, setNewSanction] = useState({ agent_id: '', motif: '', days: 1, date_sanction: new Date().toISOString().slice(0, 10) });
  
  const [historyAgent, setHistoryAgent] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardHistory, setDashboardHistory] = useState([]);
  
  const [stcModal, setStcModal] = useState(null);
  const [showAlerts, setShowAlerts] = useState(true);

  // Self-Service State
  const [selfAgentId, setSelfAgentId] = useState('');

  const getPeriodsList = (currentPeriod = null) => {
    const list = [];
    const now = new Date();
    const periodSet = new Set();
    
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const val = `${y}-${m}`;
      list.push({ value: val, label: fmtPeriod(val) });
      periodSet.add(val);
    }
    
    if (currentPeriod && !periodSet.has(currentPeriod)) {
      list.push({ value: currentPeriod, label: fmtPeriod(currentPeriod) });
      list.sort((a, b) => a.value.localeCompare(b.value));
    }
    
    return list;
  };

  // ── Chargement des données ──
  const loadData = async () => {
    setLoading(true);
    try {
      const prevDate = new Date(period + '-01');
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevPeriodStr = prevDate.toISOString().slice(0, 7);

      const [salRes, prevSalRes, setRes, varRes, funcRes, loansRes, leavesRes, sanctRes] = await Promise.all([
        apiCall('get_salaries', { period }, 'GET'),
        apiCall('get_salaries', { period: prevPeriodStr }, 'GET'),
        apiCall('get_payroll_settings', {}, 'GET'),
        apiCall('get_payroll_variables', { period }, 'GET'),
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_payroll_loans', { period }, 'GET'),
        apiCall('get_leaves', {}, 'GET'),
        apiCall('get_sanctions', {}, 'GET')
      ]);
      if (Array.isArray(salRes)) setSalaries(salRes);
      if (Array.isArray(prevSalRes)) setPrevSalaries(prevSalRes);
      if (setRes?.success && setRes.settings) setPayrollSettings(prev => ({ ...prev, ...setRes.settings }));
      if (varRes?.success && varRes.variables) setPayrollVariables(varRes.variables);
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (loansRes?.success && Array.isArray(loansRes.loans)) setLoans(loansRes.loans);
      if (leavesRes?.success && Array.isArray(leavesRes.leaves)) setLeaves(leavesRes.leaves);
      if (sanctRes?.success && Array.isArray(sanctRes.sanctions)) setSanctions(sanctRes.sanctions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDashboardHistory = async () => {
    try {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7));
      }
      const results = await Promise.all(months.map(m => apiCall('get_salaries', { period: m }, 'GET')));
      setDashboardHistory(months.map((m, idx) => {
        const data = Array.isArray(results[idx]) ? results[idx] : [];
        const totalBase = data.reduce((a, s) => a + (s.total || 0), 0);
        return { period: m, label: fmtPeriod(m).substring(0, 4), total: totalBase, count: data.length };
      }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [period]);
  useEffect(() => { if (activeTab === 'dashboard') loadDashboardHistory(); }, [activeTab]);

  // ── CRUD Handlers ──
  const handleSaveSettings = async () => {
    try {
      const res = await apiCall('save_payroll_settings', { settings: payrollSettings });
      if (res.success) alert('Paramètres sauvegardés !');
      else alert(res.message || 'Erreur');
    } catch (e) { console.error(e); }
  };

  const handleSaveVariables = async () => {
    try {
      const res = await apiCall('save_payroll_variables', { period, variables: payrollVariables });
      if (res.success) alert('Variables sauvegardées !');
      else alert(res.message || 'Erreur');
    } catch (e) { console.error(e); }
  };

  const updateVariable = (agentId, field, value) => {
    setPayrollVariables(prev => ({ ...prev, [agentId]: { ...(prev[agentId] || { avance: 0, prime: 0 }), [field]: parseInt(value) || 0 } }));
  };

  const handleAddLoan = async () => {
    if (!newLoan.agent_name || !newLoan.amount) return alert('Remplissez le nom et le montant');
    const agent = salaries.find(s => s.name === newLoan.agent_name);
    const payload = {
      agent_name: newLoan.agent_name,
      agent_function: agent ? agent.function : '',
      amount: parseInt(newLoan.amount),
      motif: newLoan.motif || 'Prêt personnel',
      date_granted: newLoan.date_granted || new Date().toISOString().slice(0, 10),
      monthly_deduction: newLoan.modality === 'mensualite' ? parseInt(newLoan.monthly_deduction || 0) : parseInt(newLoan.amount),
      start_period: newLoan.start_period
    };
    
    try {
      const res = await apiCall('add_payroll_loan', payload);
      if (res.success) {
        alert('Prêt ajouté avec succès !');
        setNewLoan({ agent_name: '', amount: '', motif: '', modality: 'mensualite', monthly_deduction: '', start_period: period, date_granted: new Date().toISOString().slice(0, 10) });
        loadData(); // Recharger les prêts
      } else { alert(res.message || 'Erreur'); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteLoan = async (id) => {
    if (!confirm('Supprimer ce prêt ? L\'historique de ses remboursements sera perdu.')) return;
    try {
      const res = await apiCall('delete_payroll_loan', { loan_id: id });
      if (res.success) {
        setLoans(prev => prev.filter(l => l.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleAddLeave = async () => {
    if (!newLeave.agent_id || !newLeave.start_date || !newLeave.end_date) return alert('Remplissez tous les champs');
    const leave = { ...newLeave, id: 'lv_' + Date.now(), status: 'approuve' };
    const updated = [...leaves, leave];
    setLeaves(updated);
    setNewLeave({ agent_id: '', start_date: '', end_date: '', type: 'conge_paye' });
    try { await apiCall('save_leave', { leave }); alert('Congé enregistré !'); } catch (e) { console.error(e); }
  };

  const handleDeleteLeave = async (id) => {
    if (!confirm('Supprimer ce congé ?')) return;
    setLeaves(prev => prev.filter(l => l.id !== id));
    try { await apiCall('delete_leave', { leave_id: id }); } catch (e) { console.error(e); }
  };

  const handleAddSanction = async () => {
    if (!newSanction.agent_id || !newSanction.motif || !newSanction.days) return alert('Remplissez tous les champs');
    const sanction = { ...newSanction, id: 'sanc_' + Date.now() };
    const updated = [...sanctions, sanction];
    setSanctions(updated);
    setNewSanction({ agent_id: '', motif: '', days: 1, date_sanction: new Date().toISOString().slice(0, 10) });
    try { await apiCall('save_sanction', { sanction }); alert('Sanction enregistrée !'); } catch (e) { console.error(e); }
  };

  const handleDeleteSanction = async (id) => {
    if (!confirm('Annuler cette sanction ?')) return;
    setSanctions(prev => prev.filter(s => s.id !== id));
    try { await apiCall('delete_sanction', { sanction_id: id }); } catch (e) { console.error(e); }
  };

  const handleUpdateContract = async (agentId, contractData) => {
    try {
      const res = await apiCall('update_agent_contract', { agent_id: agentId, contract_data: contractData });
      if (res.success) {
        alert('Contrat mis à jour !');
        loadData();
      } else alert(res.message || 'Erreur');
    } catch (e) { console.error(e); }
  };

  const handleGenerateQuinzaine = async () => {
    if (!confirm("Voulez-vous générer un acompte de 50% du salaire de base pour tous les agents n'ayant pas encore d'avance ?")) return;
    const newVars = { ...payrollVariables };
    let count = 0;
    salaries.forEach(s => {
      if (!newVars[s.id] || !newVars[s.id].avance) {
        newVars[s.id] = { ...(newVars[s.id] || { prime: 0 }), avance: Math.round(s.base / 2) };
        count++;
      }
    });
    setPayrollVariables(newVars);
    try {
      await apiCall('save_payroll_variables', { period, variables: newVars });
      alert(`Quinzaine générée pour ${count} agents ! N'oubliez pas d'exporter le fichier pour paiement.`);
    } catch (e) { console.error(e); }
  };

  // ── Historique individuel ──
  const loadHistory = async (agent) => {
    setHistoryAgent(agent);
    setHistoryLoading(true);
    try {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7));
      }
      const results = await Promise.all(months.map(m => apiCall('get_salaries', { period: m }, 'GET')));
      const history = months.map((m, idx) => {
        const data = Array.isArray(results[idx]) ? results[idx] : [];
        const agentData = data.find(s => s.id === agent.id);
        return { period: m, label: fmtPeriod(m), total: agentData?.total || 0, base: agentData?.base || 0, found: !!agentData };
      });
      setHistoryData(history);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  // ── Référence des fonctions ──
  const funcLabel = (id) => { const f = functions.find(fn => fn.id === id); return f ? f.name : id; };
  const agentName = (id) => { const a = salaries.find(s => s.id === id); return a ? a.name : 'Inconnu'; };

  // ══════════════════════════════════════════════
  // MOTEUR DE CALCUL (INTÈGRE LES SANCTIONS)
  // ══════════════════════════════════════════════
  const calculateTaxesCI = (brutImposable, parts) => {
    const baseIS = Math.round(brutImposable * 0.8);
    const IS = Math.round(baseIS * 0.012);
    let CN = 0;
    if (baseIS > 200000) CN = Math.round((baseIS - 200000) * 0.10 + 150000 * 0.05 + 80000 * 0.015);
    else if (baseIS > 130000) CN = Math.round((baseIS - 130000) * 0.05 + 80000 * 0.015);
    else if (baseIS > 50000) CN = Math.round((baseIS - 50000) * 0.015);
    const baseIGR = baseIS - IS - CN;
    const netBaseIGR = Math.round(baseIGR * 0.8);
    const Q = parts > 0 ? parts : 1;
    const quotient = netBaseIGR / Q;
    let IGR_part = 0;
    if (quotient > 841000) IGR_part = (quotient * 0.36) - 138060;
    else if (quotient > 348000) IGR_part = (quotient * 0.32) - 104420;
    else if (quotient > 227000) IGR_part = (quotient * 0.28) - 90500;
    else if (quotient > 126000) IGR_part = (quotient * 0.24) - 81420;
    else if (quotient > 81000) IGR_part = (quotient * 0.20) - 76380;
    else if (quotient > 45000) IGR_part = (quotient * 0.15) - 72330;
    else if (quotient > 25000) IGR_part = (quotient * 0.10) - 71080;
    let IGR = Math.max(0, Math.round(IGR_part * Q));
    return { IS, CN, IGR, total: IS + CN + IGR };
  };

  const getParts = (profile) => {
    let p = 1;
    const mat = (profile?.matrimonial || '').toLowerCase();
    if (mat === 'marié' || mat === 'mariée' || mat === 'marie') p = 2;
    p += Math.min((parseInt(profile?.children) || 0) * 0.5, 2.5);
    return p;
  };

  const getSeniorityBonus = (hireDateStr, base) => {
    if (!hireDateStr || !payrollSettings.enable_seniority) return 0;
    const diffYears = (new Date(period + '-01') - new Date(hireDateStr)) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears >= 2) return Math.round(base * (0.02 + Math.floor(diffYears - 2) * 0.01));
    return 0;
  };

  const getLoanDeduction = (agentId) => {
    const agent = salaries.find(s => s.id === agentId);
    if (!agent) return 0;
    return agent.remboursement_pret || 0;
  };

  const getAgentLeaveDays = (agentId) => {
    return leaves.filter(l => l.agent_id === agentId && l.status === 'approuve')
      .reduce((acc, l) => acc + getDaysInMonth(period, l.start_date, l.end_date), 0);
  };

  const getAgentSanctionDeduction = (agentId, baseJournaliere) => {
    return sanctions.filter(s => s.agent_id === agentId && s.date_sanction.startsWith(period))
      .reduce((acc, s) => acc + Math.round((parseInt(s.days) || 0) * baseJournaliere), 0);
  };

  const getAgentSanctionDays = (agentId) => {
    return sanctions.filter(s => s.agent_id === agentId && s.date_sanction.startsWith(period))
      .reduce((acc, s) => acc + (parseInt(s.days) || 0), 0);
  };

  const calculatePayslip = useCallback((agent) => {
    const vars = payrollVariables[agent.id] || { avance: 0, prime: 0 };
    const profile = agent.profile_data || {};
    const salaireBase = agent.base || 75000;
    const baseJournaliere = salaireBase / 30;

    // Congés payés : on les soustrait des absences
    const congePayes = getAgentLeaveDays(agent.id);
    const absencesDeductibles = Math.max(0, (agent.absences + agent.map_count) - congePayes);
    const retenuesAbsences = Math.round(absencesDeductibles * baseJournaliere);

    // Sanctions disciplinaires
    const joursMiseAPied = getAgentSanctionDays(agent.id);
    const retenuesSanctions = Math.round(joursMiseAPied * baseJournaliere);

    const primeAnciennete = getSeniorityBonus(profile.date_embauche || profile.hire_date, salaireBase);
    const primeVariable = vars.prime || 0;
    const gainsHS = Math.round((agent.sp_count || 0) * baseJournaliere * (1 + ((payrollSettings.taux_hs_jour || 15) / 100)));
    
    // Le brut est diminué des absences ET des mises à pied
    const salaireBrut = Math.max(0, salaireBase - retenuesAbsences - retenuesSanctions + primeAnciennete + primeVariable + gainsHS);

    const cnpsSalarial = Math.round(salaireBrut * ((payrollSettings.cnps_salarial || 6.3) / 100));
    const cnpsPatronal = Math.round(salaireBrut * ((payrollSettings.cnps_patronal || 7.7) / 100));
    const fdfp = Math.round(salaireBrut * ((payrollSettings.fdfp || 1.2) / 100));

    let impotsTaxes = 0, detailImpots = { IS: 0, CN: 0, IGR: 0 };
    if (payrollSettings.tax_mode === 'reel_ci') {
      const taxRes = calculateTaxesCI(salaireBrut - cnpsSalarial, getParts(profile));
      impotsTaxes = taxRes.total;
      detailImpots = taxRes;
    } else {
      impotsTaxes = Math.round((salaireBrut - cnpsSalarial) * ((payrollSettings.its || 1.2) / 100));
      detailImpots.IS = impotsTaxes;
    }

    const totalRetenuesFiscales = cnpsSalarial + impotsTaxes;
    const avances = vars.avance || 0;
    const remboursementsPrets = getLoanDeduction(agent.id);
    const totalDeductionsNettes = avances + remboursementsPrets;
    const netAPayer = Math.max(0, salaireBrut - totalRetenuesFiscales - totalDeductionsNettes);
    const coutEmployeur = salaireBrut + cnpsPatronal + fdfp;

    return {
      salaireBase, retenuesAbsences, congePayes, absencesDeductibles, joursMiseAPied, retenuesSanctions,
      primeAnciennete, primeVariable, gainsHS,
      salaireBrut, cnpsSalarial, cnpsPatronal, impotsTaxes, detailImpots, fdfp,
      avances, remboursementsPrets, totalDeductionsNettes,
      totalRetenuesFiscales, netAPayer, coutEmployeur, parts: getParts(agent.profile_data || {})
    };
  }, [payrollVariables, payrollSettings, loans, leaves, sanctions, period]);

  const filteredSalaries = useMemo(() => salaries.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.site.toLowerCase().includes(searchQuery.toLowerCase())
  ), [salaries, searchQuery]);

  // ══════════════════════════════════════════════
  // EXPORTS & DOCUMENTS
  // ══════════════════════════════════════════════
  const downloadCSV = (filename, content) => {
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExportJournal = () => {
    let csv = "Agent;Site;Poste;Base;Absences;Sanctions;Congés Payés;Primes;Brut;CNPS Sal;Impôts;Avances/Prêts;Net;Charges Patr;Coût Total\n";
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      csv += `"${s.name}";"${s.site}";"${funcLabel(s.function)}";${p.salaireBase};${p.retenuesAbsences};${p.retenuesSanctions};${p.congePayes};${p.primeAnciennete + p.primeVariable + p.gainsHS};${p.salaireBrut};${p.cnpsSalarial};${p.impotsTaxes};${p.totalDeductionsNettes};${p.netAPayer};${p.cnpsPatronal + p.fdfp};${p.coutEmployeur}\n`;
    });
    downloadCSV(`Livre_Paie_${period}.csv`, csv);
  };

  const handleExportBank = () => {
    let csv = "Nom Complet;RIB / Compte Bancaire;Montant Net (XOF)\n";
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      const rib = s.profile_data?.rib || s.profile_data?.compte_bancaire || 'NON RENSEIGNÉ';
      csv += `"${s.name}";"${rib}";${p.netAPayer}\n`;
    });
    downloadCSV(`Virements_Bancaires_${period}.csv`, csv);
  };

  // NOUVEAU: Export Mobile Money
  const handleExportMobileMoney = () => {
    let csv = "Nom Complet;Numéro Téléphone;Réseau;Montant Net (XOF)\n";
    let count = 0;
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      const phone = s.profile_data?.phone || s.profile_data?.telephone;
      if (phone) {
        let reseau = "Mobile Money";
        if (phone.startsWith('07') || phone.startsWith('08') || phone.startsWith('09')) reseau = "Orange";
        else if (phone.startsWith('05') || phone.startsWith('04') || phone.startsWith('06')) reseau = "MTN";
        else if (phone.startsWith('01') || phone.startsWith('02') || phone.startsWith('03')) reseau = "Moov";
        csv += `"${s.name}";"${phone}";"${reseau}";${p.netAPayer}\n`;
        count++;
      }
    });
    downloadCSV(`Paiements_MobileMoney_${period}.csv`, csv);
    alert(`${count} agents exportés pour paiement Mobile Money (les autres n'ont pas de numéro renseigné).`);
  };

  // NOUVEAU: Bilan Fiscal (État 301)
  const handleExportFiscal = () => {
    let csv = "ÉTAT 301 / DÉCLARATION FISCALE ET SOCIALE GLOBALE\n";
    csv += "Période;Agents;Masse Brute Imposable;ITS;CNPS Salariale;CNPS Patronale;FDFP;Total Versé État\n";
    
    const stats = { count: 0, brut: 0, its: 0, cnpsSal: 0, cnpsPat: 0, fdfp: 0 };
    salaries.forEach(s => {
      const p = calculatePayslip(s);
      stats.count++; stats.brut += p.salaireBrut; stats.its += p.impotsTaxes;
      stats.cnpsSal += p.cnpsSalarial; stats.cnpsPat += p.cnpsPatronal; stats.fdfp += p.fdfp;
    });

    const totalVerse = stats.its + stats.cnpsSal + stats.cnpsPat + stats.fdfp;
    csv += `"${period}";${stats.count};${stats.brut};${stats.its};${stats.cnpsSal};${stats.cnpsPat};${stats.fdfp};${totalVerse}\n`;
    downloadCSV(`Bilan_Fiscal_301_${period}.csv`, csv);
  };

  const handleExportDISA = () => {
    const year = prompt("Année de la DISA :", new Date().getFullYear() - 1);
    if (!year) return;
    alert(`Chargement des 12 mois de ${year}... Cela peut prendre quelques secondes.`);
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    Promise.all(months.map(m => apiCall('get_salaries', { period: m }, 'GET'))).then(results => {
      const agentTotals = {};
      results.forEach((monthData, idx) => {
        if (!Array.isArray(monthData)) return;
        monthData.forEach(agent => {
          if (!agentTotals[agent.id]) agentTotals[agent.id] = { name: agent.name, function: agent.function_label || agent.function, brut: 0, cnps: 0, months: 0 };
          agentTotals[agent.id].brut += agent.total || agent.base || 0;
          agentTotals[agent.id].months += 1;
        });
      });
      let csv = `DISA - Déclaration Individuelle des Salaires Annuels - Année ${year}\n`;
      csv += "Matricule;Nom et Prénoms;Fonction;Salaire Brut Annuel;Cotisation CNPS Annuelle;Nb Mois Travaillés\n";
      Object.entries(agentTotals).forEach(([id, d]) => {
        const cnps = Math.round(d.brut * ((payrollSettings.cnps_salarial || 6.3) / 100));
        csv += `"${id.substring(0, 10)}";"${d.name}";"${d.function}";${d.brut};${cnps};${d.months}\n`;
      });
      downloadCSV(`DISA_${year}.csv`, csv);
    });
  };

  const printDocument = (html) => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:'Segoe UI',Arial,sans-serif;padding:50px;color:#1e293b;line-height:1.7}
      h1{text-align:center;font-size:1.6rem;border-bottom:3px double #1e293b;padding-bottom:12px}
      .section{margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px}
      .label{color:#64748b;font-size:0.9rem}.value{font-weight:bold;font-size:1.05rem}
      .signature{display:flex;justify-content:space-between;margin-top:60px}
      .signature div{text-align:center;min-width:200px;border-top:1px solid #cbd5e1;padding-top:8px}
      @media print{body{padding:30px}}
    </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const generateSanctionLetter = (sanction) => {
    const agent = salaries.find(s => s.id === sanction.agent_id);
    if (!agent) return;
    const today = new Date().toLocaleDateString('fr-FR');
    printDocument(`
      <h1>LETTRE DE MISE À PIED DISCIPLINAIRE</h1>
      <p style="text-align:center;color:#64748b">Remise en main propre contre décharge</p>
      <div class="section">
        <p><strong>À l'attention de M./Mme ${agent.name}</strong></p>
        <p>Matricule : ${agent.id.substring(0, 10)}</p>
        <p style="margin-top:20px">Monsieur/Madame,</p>
        <p>Nous faisons suite aux agissements constitutifs d'une faute disciplinaire survenus récemment, à savoir :</p>
        <div style="background:#f1f5f9;padding:15px;border-left:4px solid #ef4444;margin:15px 0">
          <strong>Motif :</strong> ${sanction.motif}
        </div>
        <p>En raison de la gravité de ces faits, nous vous notifions par la présente une mise à pied disciplinaire d'une durée de <strong>${sanction.days} jour(s)</strong>.</p>
        <p>Cette sanction entraînera une retenue proportionnelle sur votre rémunération mensuelle.</p>
        <p>Nous vous demandons de faire en sorte qu'un tel incident ne se reproduise plus, faute de quoi nous serions contraints de prendre des mesures plus sévères pouvant aller jusqu'au licenciement.</p>
      </div>
      <p>Fait à Abidjan, le <strong>${today}</strong></p>
      <div class="signature">
        <div>La Direction</div>
        <div>L'Employé(e)<br/><span style="font-size:0.8rem">(Signature et date pour réception)</span></div>
      </div>
    `);
  };

  // ── Dashboard Aggregates ──
  const dashAgg = useMemo(() => {
    if (!filteredSalaries.length) return { totalNet: 0, totalBrut: 0, totalCout: 0, totalCNPS: 0, totalImpots: 0, count: 0 };
    let totalNet = 0, totalBrut = 0, totalCout = 0, totalCNPS = 0, totalImpots = 0;
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      totalNet += p.netAPayer;
      totalBrut += p.salaireBrut;
      totalCout += p.coutEmployeur;
      totalCNPS += p.cnpsSalarial + p.cnpsPatronal;
      totalImpots += p.impotsTaxes;
    });
    return { totalNet, totalBrut, totalCout, totalCNPS, totalImpots, count: filteredSalaries.length };
  }, [filteredSalaries, calculatePayslip]);

  const prevAgg = useMemo(() => {
    if (!prevSalaries.length) return { totalNet: 0 };
    let totalNet = 0;
    prevSalaries.forEach(s => { totalNet += (s.total || s.base || 0); });
    return { totalNet };
  }, [prevSalaries]);

  // ══════════════════════════════════════════════
  // RENDU DES ONGLETS
  // ══════════════════════════════════════════════
  const tabs = [
    { id: 'dashboard', icon: <BarChart3 size={16} />, label: 'Tableau de Bord' },
    { id: 'parametres', icon: <Settings size={16} />, label: 'Paramètres' },
    { id: 'variables', icon: <Edit3 size={16} />, label: 'Variables / Quinzaine' },
    { id: 'prets', icon: <PiggyBank size={16} />, label: 'Prêts' },
    { id: 'conges', icon: <CalendarDays size={16} />, label: 'Congés' },
    { id: 'discipline', icon: <Scale size={16} />, label: 'Discipline' },
    { id: 'contrats', icon: <Briefcase size={16} />, label: 'Contrats' },
    { id: 'journal', icon: <BookOpen size={16} />, label: 'Journal' },
    { id: 'calcul', icon: <DollarSign size={16} />, label: 'Bulletins' },
    { id: 'selfservice', icon: <Smartphone size={16} />, label: 'Portail Employé' },
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* BARRE DU HAUT */}
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calculator size={24} style={{ color: 'var(--a)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Paie & RH Pro (Phase 5)</h2>
          <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Côte d'Ivoire</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input" style={{ background: 'rgba(0,0,0,0.3)', minWidth: '150px' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {getPeriodsList().map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}>
                {t.icon} <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={40} style={{ color: 'var(--a)' }} /></div>
      ) : (
        <div style={{ marginTop: '24px' }}>

          {/* ═══════════ DASHBOARD ═══════════ */}
          {activeTab === 'dashboard' && (
            <div style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Comparaison M-1 :</span>
                  {dashAgg.totalNet >= prevAgg.totalNet ? (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><ArrowUpRight size={16} /> +{fmt(dashAgg.totalNet - prevAgg.totalNet)} XOF</span>
                  ) : (
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><ArrowDownRight size={16} /> -{fmt(prevAgg.totalNet - dashAgg.totalNet)} XOF</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Masse Salariale Nette', value: fmt(dashAgg.totalNet) + ' XOF', icon: <DollarSign size={20} />, color: '#38bdf8' },
                  { label: 'Coût Total Employeur', value: fmt(dashAgg.totalCout) + ' XOF', icon: <Building size={20} />, color: '#f97316' },
                  { label: 'Agents Payés', value: dashAgg.count, icon: <Users size={20} />, color: '#34d399' },
                  { label: 'Charges Sociales', value: fmt(dashAgg.totalCNPS) + ' XOF', icon: <TrendingUp size={20} />, color: '#a78bfa' },
                ].map((kpi, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: `${kpi.color}15`, color: kpi.color, borderRadius: '12px', padding: '12px', display: 'flex' }}>{kpi.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{kpi.label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'white' }}>{kpi.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="glass-panel">
                  <h4 style={{ marginBottom: '16px', color: 'var(--b)' }}>Évolution de la Masse Salariale (6 mois)</h4>
                  {dashboardHistory.length > 0 ? (
                    <MiniBar data={dashboardHistory.map(d => ({ value: d.total, label: d.label, color: d.period === period ? '#38bdf8' : 'rgba(56,189,248,0.4)' }))} height={180} />
                  ) : <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>Chargement...</p>}
                </div>
                <div className="glass-panel">
                  <h4 style={{ marginBottom: '16px', color: 'var(--b)' }}>Répartition — {fmtPeriod(period)}</h4>
                  <Donut slices={[
                    { label: 'Net à Payer', value: dashAgg.totalNet, color: '#38bdf8' },
                    { label: 'CNPS (Sal+Patr)', value: dashAgg.totalCNPS, color: '#a78bfa' },
                    { label: 'Impôts (ITS/IGR)', value: dashAgg.totalImpots, color: '#f97316' },
                  ]} />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ VARIABLES & QUINZAINE ═══════════ */}
          {activeTab === 'variables' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div><h3 style={{ margin: 0 }}>Variables Mensuelles ({fmtPeriod(period)})</h3><p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Avances, acomptes et primes du mois</p></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={handleGenerateQuinzaine} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }}><Target size={18} /> Générer Quinzaine (50%)</button>
                  <button className="btn btn-primary" onClick={handleSaveVariables} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> Enregistrer</button>
                </div>
              </div>
              <div className="table-container"><table className="custom-table"><thead><tr><th>Agent</th><th>Poste / Site</th><th style={{ width: '180px' }}>Avance/Acompte (XOF)</th><th style={{ width: '180px' }}>Prime (XOF)</th></tr></thead><tbody>
                {filteredSalaries.map(s => {
                  const vars = payrollVariables[s.id] || {};
                  return (<tr key={s.id}><td style={{ fontWeight: 'bold' }}>{s.name}</td><td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{funcLabel(s.function)} • {s.site}</td>
                    <td><input type="number" className="form-input" style={{ padding: '8px', width: '100%', background: 'rgba(0,0,0,0.2)' }} value={vars.avance || ''} onChange={e => updateVariable(s.id, 'avance', e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input" style={{ padding: '8px', width: '100%', background: 'rgba(0,0,0,0.2)' }} value={vars.prime || ''} onChange={e => updateVariable(s.id, 'prime', e.target.value)} placeholder="0" /></td></tr>);
                })}
              </tbody></table></div>
            </div>
          )}

          {/* ═══════════ PRÊTS & AVANCES ═══════════ */}
          {activeTab === 'prets' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: '#f43f5e' }}>Gestion des Prêts</h3>
              
              {/* Formulaire d'ajout */}
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(244,63,94,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ flex: '1 1 250px', position: 'relative' }}><label className="form-label">Nom de l'agent</label>
                  <input type="text" className="form-input" value={newLoan.agent_name} onChange={e => setNewLoan({ ...newLoan, agent_name: e.target.value })} onFocus={() => setShowLoanSuggestions(true)} onBlur={() => setTimeout(() => setShowLoanSuggestions(false), 200)} placeholder="Saisir ou sélectionner..." style={{ width: '100%' }} />
                  {showLoanSuggestions && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #3b82f6', zIndex: 50, maxHeight: '220px', overflowY: 'auto', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '8px' }}>
                      {salaries.filter(s => (s.name || '').toLowerCase().includes((newLoan.agent_name || '').toLowerCase())).map(s => (
                        <div key={s.id} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontWeight: '500', transition: 'all 0.2s' }} onMouseDown={() => { setNewLoan({ ...newLoan, agent_name: s.name }); setShowLoanSuggestions(false); }} onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.paddingLeft = '24px'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '16px'; }}>
                          {s.name}
                        </div>
                      ))}
                      {salaries.filter(s => (s.name || '').toLowerCase().includes((newLoan.agent_name || '').toLowerCase())).length === 0 && (
                        <div style={{ padding: '12px 16px', color: '#94a3b8', fontStyle: 'italic' }}>Aucun agent trouvé</div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: '1 1 150px' }}><label className="form-label">Montant (XOF)</label>
                  <input type="number" className="form-input" value={newLoan.amount} onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} placeholder="Ex: 50000" style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}><label className="form-label">Motif du prêt</label>
                  <input type="text" className="form-input" value={newLoan.motif} onChange={e => setNewLoan({ ...newLoan, motif: e.target.value })} placeholder="Ex: Scolarité..." style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 150px' }}><label className="form-label">Modalité</label>
                  <select className="form-input" value={newLoan.modality} onChange={e => setNewLoan({ ...newLoan, modality: e.target.value })} style={{ width: '100%' }}>
                    <option value="mensualite">Mensualité</option>
                    <option value="totalite">Tout en une fois</option>
                  </select>
                </div>
                {newLoan.modality === 'mensualite' && (
                  <div style={{ flex: '1 1 150px' }}><label className="form-label">Déduction/Mois</label>
                    <input type="number" className="form-input" value={newLoan.monthly_deduction} onChange={e => setNewLoan({ ...newLoan, monthly_deduction: e.target.value })} placeholder="Ex: 10000" style={{ width: '100%' }} />
                  </div>
                )}
                <div style={{ flex: '1 1 150px' }}><label className="form-label">Date d'octroi</label>
                  <input type="date" className="form-input" value={newLoan.date_granted} onChange={e => setNewLoan({ ...newLoan, date_granted: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 150px' }}><label className="form-label">Mois de début</label>
                  <input type="month" className="form-input" value={newLoan.start_period} onChange={e => setNewLoan({ ...newLoan, start_period: e.target.value })} style={{ width: '100%' }} />
                </div>
                <button className="btn btn-primary" onClick={handleAddLoan} style={{ background: '#f43f5e', padding: '12px 24px', height: '46px' }}><PiggyBank size={16} /> Accorder</button>
              </div>
              
              {/* Tableau de suivi */}
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Agent & Poste</th>
                      <th>Motif & Octroi</th>
                      <th style={{ textAlign: 'center' }}>Présence (Pointage)</th>
                      <th style={{ textAlign: 'right' }}>Montant Prêt</th>
                      <th style={{ textAlign: 'center' }}>Modalité</th>
                      <th style={{ width: '200px' }}>Progression du Remboursement</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucun prêt en cours</td></tr> : loans.map(l => {
                      const total = parseInt(l.total_amount);
                      const monthly = parseInt(l.monthly_deduction);
                      
                      // Calcul de la progression simulée pour la vue
                      let deductedSoFar = 0;
                      let paidMonthsCount = 0;
                      const totalMonths = Math.ceil(total / (monthly > 0 ? monthly : total));
                      const startTs = new Date(l.start_period + '-01').getTime();
                      const currTs = new Date(period + '-01').getTime();
                      if (currTs >= startTs) {
                        const mp = getMonthsDiff(l.start_period, period);
                        paidMonthsCount = Math.min(totalMonths, mp + 1);
                        if (mp >= totalMonths) {
                          deductedSoFar = total;
                        } else {
                          // On inclut le mois en cours dans la barre de progression
                          deductedSoFar = Math.min(total, (mp + 1) * (monthly > 0 ? monthly : total));
                        }
                      }
                      
                      const progressPct = Math.min(100, Math.round((deductedSoFar / total) * 100));
                      const isComplete = progressPct >= 100;
                      const colors = ['#ef4444', '#eab308', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#84cc16'];
                      const getMonthColor = (i) => i < colors.length ? colors[i] : `hsl(${(i * 137.508) % 360}, 70%, 50%)`;

                      return (
                        <tr key={l.id}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{l.agent_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{funcLabel(l.agent_function)}</div>
                          </td>
                          <td>
                            <div>{l.motif}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Dès {l.start_period}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {l.has_exited ? (
                              <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(249,115,22,0.1)', color: '#f97316', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ A QUITTÉ (Déduire du STC)</span>
                            ) : l.is_pointed ? (
                              <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>✅ Pointé au {period}</span>
                            ) : (
                              <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>❌ Absent du pointage</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f43f5e' }}>{fmt(total)} XOF</td>
                          <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                            {monthly > 0 ? `${fmt(monthly)} / mois` : '1 seule fois'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                              <span style={{ color: isComplete ? '#22c55e' : 'var(--muted)' }}>{fmt(deductedSoFar)}</span>
                              <span style={{ color: 'var(--muted)' }}>{fmt(total)}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                              {Array.from({ length: paidMonthsCount }).map((_, i) => {
                                const amountThisMonth = (i === totalMonths - 1) ? (total - i * (monthly > 0 ? monthly : total)) : (monthly > 0 ? monthly : total);
                                const pct = (amountThisMonth / total) * 100;
                                return (
                                  <div key={i} style={{ width: `${pct}%`, height: '100%', background: getMonthColor(i), transition: 'width 0.3s' }}></div>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <button onClick={() => handleDeleteLoan(l.id)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }} title="Supprimer"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ DISCIPLINE & SANCTIONS ═══════════ */}
          {activeTab === 'discipline' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: '#ef4444' }}>Sanctions & Mises à Pied</h3>
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(239,68,68,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ flex: '1 1 250px' }}><label className="form-label">Agent</label>
                  <select className="form-input" value={newSanction.agent_id} onChange={e => setNewSanction({ ...newSanction, agent_id: e.target.value })} style={{ width: '100%' }}>
                    <option value="">-- Choisir --</option>{salaries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div style={{ flex: '1 1 200px' }}><label className="form-label">Motif de la sanction</label>
                  <input type="text" className="form-input" value={newSanction.motif} onChange={e => setNewSanction({ ...newSanction, motif: e.target.value })} placeholder="Abandon de poste..." style={{ width: '100%' }} /></div>
                <div style={{ flex: '1 1 100px' }}><label className="form-label">Durée (Jours)</label>
                  <input type="number" min="1" max="8" className="form-input" value={newSanction.days} onChange={e => setNewSanction({ ...newSanction, days: e.target.value })} style={{ width: '100%' }} /></div>
                <div style={{ flex: '1 1 150px' }}><label className="form-label">Date (pour le mois en cours)</label>
                  <input type="date" className="form-input" value={newSanction.date_sanction} onChange={e => setNewSanction({ ...newSanction, date_sanction: e.target.value })} style={{ width: '100%' }} /></div>
                <button className="btn btn-primary" onClick={handleAddSanction} style={{ background: '#ef4444', padding: '12px 24px', height: '46px' }}><Scale size={16} /> Sanctionner</button>
              </div>
              <div className="table-container"><table className="custom-table"><thead><tr><th>Agent</th><th>Motif</th><th>Date</th><th style={{ textAlign: 'center' }}>Mise à pied</th><th style={{ textAlign: 'right' }}>Impact Salaire</th><th>Actions</th></tr></thead><tbody>
                {sanctions.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucune sanction enregistrée</td></tr> : sanctions.map(s => {
                  const agent = salaries.find(a => a.id === s.agent_id);
                  const impact = agent ? Math.round((agent.base / 30) * s.days) : 0;
                  return (<tr key={s.id}><td style={{ fontWeight: 'bold' }}>{agentName(s.agent_id)}</td><td>{s.motif}</td><td>{s.date_sanction}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{s.days} jours</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>-{fmt(impact)} XOF</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => generateSanctionLetter(s)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Printer size={14} /> Lettre</button>
                        <button onClick={() => handleDeleteSanction(s.id)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Trash2 size={14} /></button>
                      </div>
                    </td></tr>);
                })}
              </tbody></table></div>
            </div>
          )}

          {/* ═══════════ JOURNAL DE PAIE (AJOUTS MOBILE MONEY ET FISCAL) ═══════════ */}
          {activeTab === 'journal' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div><h3 style={{ margin: 0 }}>Livre de Paie & Exports</h3></div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={handleExportMobileMoney} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }}><Smartphone size={16} /> Mobile Money (Masse)</button>
                  <button className="btn btn-secondary" onClick={handleExportBank} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' }}><CreditCard size={16} /> Banque</button>
                  <button className="btn btn-secondary" onClick={handleExportFiscal} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}><Receipt size={16} /> État 301 (Fiscal)</button>
                  <button className="btn btn-secondary" onClick={handleExportDISA} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}><FileText size={16} /> DISA</button>
                  <button className="btn btn-primary" onClick={handleExportJournal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Export Total</button>
                </div>
              </div>
              <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.82rem' }}><thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}><tr>
                  <th>Agent</th><th style={{ textAlign: 'right' }}>Base</th><th style={{ textAlign: 'right' }}>Abs/Sanct.</th><th style={{ textAlign: 'right' }}>+Gains</th><th style={{ textAlign: 'right', color: 'var(--b)' }}>Brut</th><th style={{ textAlign: 'right' }}>CNPS</th><th style={{ textAlign: 'right' }}>Impôts</th><th style={{ textAlign: 'right' }}>Av/Prêts</th><th style={{ textAlign: 'right', color: 'var(--a)' }}>Net</th>
                </tr></thead><tbody>
                  {filteredSalaries.map(s => {
                    const p = calculatePayslip(s);
                    return (<tr key={s.id}><td style={{ fontWeight: 'bold' }}>{s.name}</td><td style={{ textAlign: 'right' }}>{fmt(p.salaireBase)}</td><td style={{ textAlign: 'right', color: (p.retenuesAbsences || p.retenuesSanctions) ? 'var(--danger)' : 'var(--muted)' }}>{fmt(p.retenuesAbsences + p.retenuesSanctions)}</td><td style={{ textAlign: 'right', color: 'var(--b)' }}>{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS)}</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--b)' }}>{fmt(p.salaireBrut)}</td><td style={{ textAlign: 'right' }}>{fmt(p.cnpsSalarial)}</td><td style={{ textAlign: 'right' }}>{fmt(p.impotsTaxes)}</td><td style={{ textAlign: 'right', color: '#f97316' }}>{fmt(p.totalDeductionsNettes)}</td><td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--a)' }}>{fmt(p.netAPayer)}</td></tr>);
                  })}
                </tbody></table>
              </div>
            </div>
          )}

          {/* ═══════════ PORTAIL EMPLOYÉ (SIMULATEUR) ═══════════ */}
          {activeTab === 'selfservice' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, color: 'var(--b)' }}>Simulateur du Portail Employé sur Téléphone</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Sélectionnez un agent pour voir l'interface à laquelle il aurait accès sur son téléphone.</p>
                <select className="form-input" style={{ width: '100%', maxWidth: '300px', margin: '20px auto', display: 'block', padding: '12px' }} value={selfAgentId} onChange={e => setSelfAgentId(e.target.value)}>
                  <option value="">-- Sélectionnez un agent --</option>
                  {salaries.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id.substring(0, 8)})</option>)}
                </select>
              </div>

              {selfAgentId && salaries.find(s => s.id === selfAgentId) && (() => {
                const s = salaries.find(a => a.id === selfAgentId);
                const p = calculatePayslip(s);
                return (
                  <div style={{ background: 'black', width: '380px', margin: '0 auto', borderRadius: '35px', padding: '10px', border: '8px solid #1e293b', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#0f172a', borderRadius: '25px', overflow: 'hidden', minHeight: '650px', position: 'relative' }}>
                      {/* En-tête Mobile */}
                      <div style={{ background: 'var(--primary)', padding: '40px 20px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Espace Agent</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>{s.name}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{funcLabel(s.function)} • {s.site}</div>
                          </div>
                          <div style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fingerprint size={20} /></div>
                        </div>
                      </div>

                      {/* Contenu Mobile */}
                      <div style={{ padding: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Salaire Net de {fmtPeriod(period)}</div>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'white', margin: '8px 0' }}>{fmt(p.netAPayer)} FCFA</div>
                          <button style={{ width: '100%', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <DownloadCloud size={18} /> Télécharger mon Bulletin
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <CalendarDays size={24} style={{ color: '#34d399', margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Congés Acquis</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{p.congePayes || 0} jours</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <PiggyBank size={24} style={{ color: '#f97316', margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Prêt en cours</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{fmt(p.remboursementsPrets)} F/m</div>
                          </div>
                        </div>

                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>Actions Rapides</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <button style={{ background: '#1e293b', border: 'none', padding: '16px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}><Target size={16} /></div>
                            <span style={{ flex: 1 }}>Demander une avance</span>
                            <ChevronDown size={16} color="var(--muted)" style={{ transform: 'rotate(-90deg)' }} />
                          </button>
                          <button style={{ background: '#1e293b', border: 'none', padding: '16px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                            <div style={{ background: 'rgba(167,139,250,0.1)', padding: '8px', borderRadius: '8px', color: '#a78bfa' }}><FileText size={16} /></div>
                            <span style={{ flex: 1 }}>Attestation de travail</span>
                            <ChevronDown size={16} color="var(--muted)" style={{ transform: 'rotate(-90deg)' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══════════ AUTRES ONGLETS (PARAMÈTRES, PRÊTS, CONTRATS, BULLETINS MÊMES QUE AVANT) ═══════════ */}
          {activeTab === 'parametres' && (
            <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', animation: 'slideUp 0.3s ease-out' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--a)' }}>Configuration Paie (CI)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(56,189,248,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <label className="form-label" style={{ color: 'white', fontSize: '1.05rem', marginBottom: '12px' }}>Méthode de calcul des impôts</label>
                  <select className="form-input" style={{ width: '100%', padding: '12px' }} value={payrollSettings.tax_mode} onChange={e => setPayrollSettings({ ...payrollSettings, tax_mode: e.target.value })}>
                    <option value="simplifie">Simplifié (Taux fixe)</option>
                    <option value="reel_ci">Barème Progressif Réel CI (Quotient Familial)</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
                  <input type="checkbox" id="seniority" checked={payrollSettings.enable_seniority || false} onChange={e => setPayrollSettings({ ...payrollSettings, enable_seniority: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                  <div><label htmlFor="seniority" style={{ color: 'white', fontWeight: 'bold' }}>Activer la Prime d'Ancienneté</label></div>
                </div>
                {[ ['cnps_salarial', 'CNPS Salarial (%)'], ['cnps_patronal', 'CNPS Patronal (%)'], ...(payrollSettings.tax_mode === 'simplifie' ? [['its', 'ITS Fixe (%)']] : []), ['fdfp', 'FDFP (%)'] ].map(([key, label]) => (
                  <div className="form-group" key={key}><label className="form-label">{label}</label><input type="number" step="0.1" className="form-input" value={payrollSettings[key] || ''} onChange={e => setPayrollSettings({ ...payrollSettings, [key]: parseFloat(e.target.value) })} /></div>
                ))}
              </div>
              <div style={{ marginTop: '24px', textAlign: 'right' }}><button className="btn btn-primary" onClick={handleSaveSettings} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}><Save size={18} /> Enregistrer</button></div>
            </div>
          )}

          {activeTab === 'contrats' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={20} color="var(--a)" /> Suivi des Contrats</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input type="text" className="form-input" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
              </div>
              <div className="table-container">
                <table className="custom-table">
                  <thead><tr><th>Agent</th><th>Poste</th><th>Type Contrat</th><th>Date de Fin</th><th>Statut</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredSalaries.map(s => {
                      const prof = s.profile_data || {};
                      const cType = prof.contract_type || 'CDD';
                      const cEnd = prof.contract_end || prof.date_fin_contrat;
                      let status = 'Actif', statusColor = '#34d399';
                      if (cType === 'CDD' && cEnd) {
                        const daysLeft = Math.round((new Date(cEnd) - new Date()) / (1000 * 60 * 60 * 24));
                        if (daysLeft < 0) { status = 'Expiré'; statusColor = '#ef4444'; }
                        else if (daysLeft <= 30) { status = `Expire dans ${daysLeft}j`; statusColor = '#f97316'; }
                      }
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 'bold' }}>{s.name}</td><td>{funcLabel(s.function)}</td>
                          <td><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', background: cType === 'CDI' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)', color: cType === 'CDI' ? '#38bdf8' : '#a78bfa' }}>{cType}</span></td>
                          <td>{cType === 'CDI' ? 'Indéterminée' : (cEnd || '—')}</td>
                          <td><span style={{ color: statusColor, fontWeight: 'bold', fontSize: '0.9rem' }}>{status}</span></td>
                          <td>{cType !== 'CDI' && (<div style={{ display: 'flex', gap: '8px' }}><button onClick={() => { const nd = prompt('Nouvelle date:', cEnd || ''); if (nd) handleUpdateContract(s.id, { contract_end: nd, contract_type: 'CDD' }); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Renouveler</button><button onClick={() => { if (confirm('Passer CDI ?')) handleUpdateContract(s.id, { contract_type: 'CDI', contract_end: '' }); }} style={{ background: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>CDI</button></div>)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calcul' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Fiches de Paie</h3>
                <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} /><input type="text" className="form-input" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px', maxWidth: '280px' }} /></div>
              </div>
              <div className="table-container"><table className="custom-table"><thead><tr>
                <th>Agent</th><th style={{ textAlign: 'right' }}>Base</th><th style={{ textAlign: 'right', color: 'var(--b)' }}>+Gains</th><th style={{ textAlign: 'right' }}>Brut</th><th style={{ textAlign: 'right', color: 'var(--danger)' }}>-Retenues</th><th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th><th style={{ textAlign: 'center' }}>Actions RH</th>
              </tr></thead><tbody>
                {filteredSalaries.map((s, idx) => {
                  const p = calculatePayslip(s);
                  const isExp = expandedRow === idx;
                  return (
                    <React.Fragment key={idx}>
                      <tr style={{ cursor: 'pointer', background: isExp ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                        <td style={{ fontWeight: 'bold' }} onClick={() => setExpandedRow(isExp ? null : idx)}>{s.name}</td>
                        <td style={{ textAlign: 'right' }} onClick={() => setExpandedRow(isExp ? null : idx)}>{fmt(p.salaireBase)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--b)' }} onClick={() => setExpandedRow(isExp ? null : idx)}>+{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }} onClick={() => setExpandedRow(isExp ? null : idx)}>{fmt(p.salaireBrut)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--danger)' }} onClick={() => setExpandedRow(isExp ? null : idx)}>-{fmt(p.totalRetenuesFiscales + p.totalDeductionsNettes)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--a)', fontSize: '1.1rem' }} onClick={() => setExpandedRow(isExp ? null : idx)}>{fmt(p.netAPayer)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button title="Voir bulletin" onClick={() => setExpandedRow(isExp ? null : idx)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>{isExp ? 'Fermer' : 'Ouvrir'}</button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr><td colSpan={7} style={{ background: 'rgba(255,255,255,0.02)', padding: '30px' }}>
                          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', color: 'black', maxWidth: '850px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #1e293b', paddingBottom: '20px', marginBottom: '24px' }}>
                              <div><h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', color: '#0f172a', fontWeight: '900' }}>BULLETIN DE PAIE</h2><p style={{ margin: 0, color: '#475569' }}>Période : {fmtPeriod(period)}</p></div>
                              <div style={{ textAlign: 'right' }}><h3 style={{ margin: '0 0 4px', color: '#0f172a' }}>{s.name}</h3><p style={{ margin: '0 0 2px', color: '#475569', fontSize: '0.9rem' }}>Poste : {funcLabel(s.function)}</p></div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                              <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}><th style={{ textAlign: 'left', padding: '10px' }}>Désignation</th><th style={{ textAlign: 'right', padding: '10px', color: '#16a34a' }}>Gains</th><th style={{ textAlign: 'right', padding: '10px', color: '#dc2626' }}>Retenues</th></tr></thead>
                              <tbody>
                                <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Salaire de Base</td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{fmt(p.salaireBase)}</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td></tr>
                                {p.retenuesAbsences > 0 && <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Absences ({p.absencesDeductibles}j)</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>{fmt(p.retenuesAbsences)}</td></tr>}
                                {p.retenuesSanctions > 0 && <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Mise à pied disciplinaire ({p.joursMiseAPied}j)</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>{fmt(p.retenuesSanctions)}</td></tr>}
                                {p.primeVariable > 0 && <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Prime / Autre gain</td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{fmt(p.primeVariable)}</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td></tr>}
                                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}><td style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>SALAIRE BRUT</td><td style={{ textAlign: 'right', padding: '10px', borderBottom: '2px solid #cbd5e1' }}>{fmt(p.salaireBrut)}</td><td style={{ borderBottom: '2px solid #cbd5e1' }}></td></tr>
                                <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Retenues Sociales (CNPS)</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{fmt(p.cnpsSalarial)}</td></tr>
                                <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Impôts (ITS/IGR)</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{fmt(p.impotsTaxes)}</td></tr>
                                {p.totalDeductionsNettes > 0 && <tr><td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Avances et Remb. Prêts</td><td style={{ borderBottom: '1px solid #e2e8f0' }}></td><td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{fmt(p.totalDeductionsNettes)}</td></tr>}
                              </tbody>
                              <tfoot><tr style={{ background: '#0f172a', color: 'white' }}><td style={{ padding: '14px 10px', borderBottomLeftRadius: '8px', fontSize: '1.15rem', fontWeight: '900' }}>NET À PAYER</td><td colSpan={2} style={{ textAlign: 'right', padding: '14px 10px', borderBottomRightRadius: '8px', fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8' }}>{fmt(p.netAPayer)} XOF</td></tr></tfoot>
                            </table>
                            <div style={{ marginTop: '30px', textAlign: 'center' }}><button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}><Printer size={18} /> Imprimer</button></div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody></table></div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .tab-btn{padding:8px 12px;border-radius:10px;border:none;background:transparent;color:var(--muted);display:flex;align-items:center;gap:6px;font-weight:600;transition:all .2s;cursor:pointer;font-size:0.85rem;white-space:nowrap}
        .tab-btn:hover{background:rgba(255,255,255,0.05);color:white}
        .tab-btn.active{background:var(--primary);color:white;box-shadow:0 4px 12px rgba(56,189,248,0.3)}
        .tab-label{display:inline}
        @media(max-width:900px){.tab-label{display:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media print{body *{visibility:hidden}.glass-panel *{visibility:hidden}div[style*="background: white"] *{visibility:visible}div[style*="background: white"]{position:absolute;left:0;top:0;width:100%;box-shadow:none!important}}
      `}</style>
    </div>
  );
}
