import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiCall } from '../api';
import { DollarSign, Search, Settings, Edit3, Calculator, Loader2, Save, Printer, ChevronDown, ChevronUp, Download, CreditCard, PiggyBank, BookOpen, Building, BarChart3, CalendarDays, FileText, Bell, AlertTriangle, TrendingUp, Users, X, Plus, Trash2, Clock, Award, Archive, ArrowUpRight, ArrowDownRight, FileSignature, ShieldAlert, ShieldCheck, BadgeInfo, CheckCircle2, ChevronRight, Key, Scale, Briefcase, Smartphone, Target, Wallet, Receipt, Fingerprint, DownloadCloud, Info } from 'lucide-react';
import DOMPurify from 'dompurify';
import Payslip from './Payslip';
import PaymentMethodModal from './modals/PaymentMethodModal';
import PaymentImportModal from './modals/PaymentImportModal';
import PaymentAuditModal from './modals/PaymentAuditModal';
import ReclamationModal from './modals/ReclamationModal';
import PrintReclamationsView from './PrintReclamationsView';
import PrintFicheModal from './modals/PrintFicheModal';
import MasseSalariale from './MasseSalariale';
import ExcelJS from 'exceljs';

// ── Utilitaires ──
const getMonthsDiff = (start, end) => {
  const d1 = new Date(start + '-01');
  const d2 = new Date(end + '-01');
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};
const fmt = (n) => {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
const fmtPeriod = (p) => {
  const d = new Date(p + '-01');
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};
const parseProfileData = (data) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch (e) { return {}; }
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

function useCountUp(end, duration = 1500) {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  useEffect(() => {
    let start = 0;
    if (start === end) {
      setAnimatedTotal(end);
      return;
    }
    let startTime = null;
    let animationFrameId;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedTotal(Math.floor(easeProgress * end));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimatedTotal(end);
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);
  return animatedTotal;
}

// ── Mini SVG Chart Components ──
const MiniBar = ({ data, height = 160, color = '#38bdf8' }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: `${height}px`, width: '100%', paddingTop: '10px' }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 40);
        return (
          <div key={d.label || `bar-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', fontFamily: "'Times New Roman', Times, serif" }}>
              {fmt(d.value)}
            </span>
            <div style={{ width: '70%', height: `${Math.max(h, 2)}px`, background: d.color || color, borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', fontFamily: "'Times New Roman', Times, serif", marginBottom: '5px' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Donut = ({ slices, size = 140 }) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let cumul = 0;
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {slices.map((s) => {
          const pct = s.value / total;
          const offset = c * (1 - cumul);
          cumul += pct;
          return <circle key={s.label} cx={50} cy={50} r={r} fill="none" stroke={s.color} strokeWidth={16} strokeDasharray={`${c * pct} ${c * (1 - pct)}`} strokeDashoffset={offset} transform="rotate(-90 50 50)" />;
        })}
        <text x={50} y={48} textAnchor="middle" fill="white" fontSize="9" fontWeight="900">{fmt(total)}</text>
        <text x={50} y={58} textAnchor="middle" fill="#94a3b8" fontSize="5">XOF</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
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
const getDatesInfo = (r) => {
    let datesStr = '';
    let count = 0;
    
    let custom = {};
    try { if (r.description && r.description.startsWith('{')) custom = JSON.parse(r.description); } catch(e) {}
    
    if (custom.dates) {
        datesStr = String(custom.dates);
        // Pour les manuelles, le nombre de jours exact est déjà stocké dans r.jours_concernes ou custom.jours
        count = parseInt(custom.jours || r.jours_concernes, 10) || (datesStr.split(',').length);
    } else if (r.jours_concernes) {
        datesStr = String(r.jours_concernes);
        const matches = datesStr.match(/\d+/g);
        count = matches ? matches.length : 0;
    }
    
    return {
        text: datesStr,
        count: count > 0 ? (count < 10 ? `0${count}` : count) : '-',
        hasDates: count > 0 || datesStr.length > 0
    };
};

export default function Salaries({ setView }) {
  // ── États ──
  const [activeTab, setActiveTab] = useState(() => {
    let rs = window.pontage_return_source;
    if (!rs) {
      try { rs = localStorage.getItem('pontage_return_source'); } catch(e){}
    }
    if (rs === 'salaries') {
      return 'journal';
    }
    return 'dashboard';
  });
  const [period, setPeriod] = useState(() => {
    const target = localStorage.getItem('pontage_target_period');
    if (target) {
      localStorage.removeItem('pontage_target_period');
      window.pontage_had_target_period = true;
      return target;
    }
    window.pontage_had_target_period = false;
    return new Date().toISOString().slice(0, 7);
  });
  const initialLoadRef = useRef(true);
  const expectedHistoryPeriodRef = useRef(null);
  const [flagUrl, setFlagUrl] = useState(() => localStorage.getItem('pontage_custom_flag_url') || "https://flagcdn.com/w20/ci.png");
  
  useEffect(() => {
    const handleFlagChange = () => setFlagUrl(localStorage.getItem('pontage_custom_flag_url') || "https://flagcdn.com/w20/ci.png");
    window.addEventListener('pontage_custom_flag_url_changed', handleFlagChange);
    return () => window.removeEventListener('pontage_custom_flag_url_changed', handleFlagChange);
  }, []);

  useEffect(() => {
    window.pontage_return_source = null;
    try {
      if (localStorage.getItem('pontage_return_source') === 'salaries') {
        localStorage.removeItem('pontage_return_source');
        localStorage.removeItem('pontage_return_to_payroll_agent_data');
        localStorage.removeItem('pontage_return_to_payroll_agent_id');
      }
    } catch(e) {}
  }, []);
  const [salaries, setSalaries] = useState([]);
  const [prevSalaries, setPrevSalaries] = useState([]);
  const [payrollSettings, setPayrollSettings] = useState({
    cnps_salarial: 0, cnps_patronal: 0, its: 0, fdfp: 0, taxe_formation: 0, taxe_apprentissage: 0, accidents_travail: 0, cmu_amount: 0,
    enable_seniority: false, tax_mode: 'simplifie',
    enable_sursalaire: true, enable_cnps_salarial: true, enable_its: true, 
    enable_cnps_patronal: true, enable_fdfp: true, enable_avances: true,
    enable_cmu_employe: true, enable_cmu_employeur: true, enable_taxe_apprentissage: true, enable_accidents_travail: true
  });
  const [payrollVariables, setPayrollVariables] = useState({});
  const [loans, setLoans] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [adminTitleInput, setAdminTitleInput] = useState(localStorage.getItem('pdfAdminTitle') || 'Administrateur');
  const [adminNameInput, setAdminNameInput] = useState(localStorage.getItem('pdfAdminName') || 'KOFFI Konan Jean Yves');
  
  const [newLoan, setNewLoan] = useState({ agent_name: '', amount: '', motif: '', modality: 'mensualite', monthly_deduction: '', start_period: period, date_granted: new Date().toISOString().slice(0, 10) });
  const [showLoanSuggestions, setShowLoanSuggestions] = useState(false);
  const [newLeave, setNewLeave] = useState({ agent_id: '', start_date: '', end_date: '', type: 'conge_paye' });
  const [newSanction, setNewSanction] = useState({ agent_id: '', motif: '', days: 1, date_sanction: new Date().toISOString().slice(0, 10) });
  const [showAddReclamationModal, setShowAddReclamationModal] = useState(false);
  const [newReclamation, setNewReclamation] = useState({ agent_id: '', motif: "justificatif d'absence", jours: 1, dates: '', montant: '', agent_name: '' });
  const [showReclamationSuggestions, setShowReclamationSuggestions] = useState(false);
  const [absentDatesList, setAbsentDatesList] = useState([]);
  const [showAbsentCalendar, setShowAbsentCalendar] = useState(false);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [isMontantLocked, setIsMontantLocked] = useState(true);
  const [checkedDates, setCheckedDates] = useState([]);
  
  const [showPastCalendar, setShowPastCalendar] = useState(false);
  const [pastErrorMonth, setPastErrorMonth] = useState(() => new Date().getMonth() + 1);
  const [pastErrorYear, setPastErrorYear] = useState(() => new Date().getFullYear());

  const [historyAgent, setHistoryAgent] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardHistory, setDashboardHistory] = useState([]);
  
  const [viewDatesModal, setViewDatesModal] = useState(null);
  const [showRecInfo, setShowRecInfo] = useState(false);
  const [reclamationSearch, setReclamationSearch] = useState('');
  const [selfAgentId, setSelfAgentId] = useState('');
  
  const [stcModal, setStcModal] = useState(null);
  const [showAddPretModal, setShowAddPretModal] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');
  const [loanTab, setLoanTab] = useState('actuel');
  const [paymentMethodModal, setPaymentMethodModal] = useState(null);
  const [showPaymentImportModal, setShowPaymentImportModal] = useState(false);
  const [showPaymentAuditModal, setShowPaymentAuditModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);

  // Self-Service State
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  
  // Payment Tabs
  const [activePaymentTab, setActivePaymentTab] = useState('Wave');
  
  // Reclamations print view state
  const [showPrintView, setShowPrintView] = useState(false);

  // Reclamations validées mini-tabs
  const [recTab, setRecTab] = useState('actuel');
  const [archivedRecMonthView, setArchivedRecMonthView] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);
  const [domBanque, setDomBanque] = useState(() => localStorage.getItem('pontage_dom_banque') || 'BDU');
  const [editingDomBanque, setEditingDomBanque] = useState(false);
  const handleDownloadVirementsOrder = async () => {
    try {
      const targetPeriod = masseMode === 'archives' ? masseSelectedArchive : period;
      const displayPeriod = fmtPeriod(targetPeriod);
      
      const banqueAgents = [];
      filteredSalaries.forEach(agent => {
        if (agent.profile_data) {
          try {
            const pd = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : agent.profile_data;
            if (pd.payment_method === 'BANQUE') {
              banqueAgents.push({
                ...agent,
                parsedProfile: pd
              });
            }
          } catch (e) {}
        }
      });

      if (banqueAgents.length === 0) {
        showToast("Aucun agent payé par banque pour cette période.", "error");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Ordre de Virements');

      // Style header
      const headerRow = sheet.addRow([
        'NOM ET RENOMS',
        'NOM BANQUE',
        'CODE BANQUE',
        'CODE AGENCE',
        'NUMERO COMPTE',
        'RIB',
        'MONTANT',
        'LIBELLE VIREMENT'
      ]);

      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' }
        };
        cell.font = { bold: true };
        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Data rows
      banqueAgents.forEach(agent => {
        const netAPayer = calculatePayslip(agent).netAPayer;
        const pd = agent.parsedProfile;
        
        let rawRib = String(pd.payment_rib || '').replace(/\s+/g, '');
        const cBanque = rawRib.length >= 24 ? rawRib.substring(0, 5) : '';
        const cAgence = rawRib.length >= 24 ? rawRib.substring(5, 10) : '';
        const numCompte = rawRib.length >= 24 ? rawRib.substring(10, 22) : '';
        const ribKey = rawRib.length >= 24 ? rawRib.substring(22, 24) : rawRib;
        
        const row = sheet.addRow([
          (agent.name || '').toUpperCase(),
          (pd.payment_bank_name || '').toUpperCase(),
          cBanque,
          cAgence,
          numCompte,
          ribKey,
          netAPayer,
          `SALAIRE ${displayPeriod}`.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ]);

        row.eachCell((cell, colNumber) => {
          if (colNumber === 1 || colNumber === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if ([3, 4, 5, 6].includes(colNumber)) {
            cell.numFmt = '@'; // Force text format for bank codes
          }
          if (colNumber === 7) {
            cell.numFmt = '#,##0'; // Number format for montant
          }
        });
      });

      // Total row
      const totalNet = banqueAgents.reduce((sum, agent) => sum + calculatePayslip(agent).netAPayer, 0);
      const totalRow = sheet.addRow(['', '', '', '', '', '', totalNet, '']);
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
        if (colNumber === 7) {
          cell.numFmt = '#,##0';
        }
      });

      // Note row
      const noteRow = sheet.addRow(['', 'Toutes les colonnes en texte sauf le montant en nombre', '', '', '', '', '', '']);
      const noteCell = noteRow.getCell(2);
      noteCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
      noteCell.alignment = { horizontal: 'center', vertical: 'middle' };
      // Merge cells B to H for the note
      const noteRowNumber = noteRow.number;
      sheet.mergeCells(noteRowNumber, 2, noteRowNumber, 8);

      // Adjust column widths
      sheet.getColumn(1).width = 30; // NOM
      sheet.getColumn(2).width = 20; // BANQUE
      sheet.getColumn(3).width = 15; // C. BANQUE
      sheet.getColumn(4).width = 15; // C. AGENCE
      sheet.getColumn(5).width = 25; // N. COMPTE
      sheet.getColumn(6).width = 10; // RIB
      sheet.getColumn(7).width = 15; // MONTANT
      sheet.getColumn(8).width = 25; // LIBELLE

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanPeriod = displayPeriod.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanBank = (domBanque || 'BDU').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      a.download = `ORDRE DE VIREMENT SALAIRES SECURITEX DE ${cleanPeriod} POUR ${cleanBank}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast("Ordre de virements généré avec succès !");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la génération du fichier Excel", "error");
    }
  };

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Journal Mode State
  const [journalMode, setJournalMode] = useState('actuel');
  const [masseMode, setMasseMode] = useState('actuel');
  const [journalArchivedPeriods, setJournalArchivedPeriods] = useState([]); // Mois passés archivés
  const [journalCurrentPeriod, setJournalCurrentPeriod] = useState('');   // Le mois en cours (dernier publié)
  const [journalIsCloture, setJournalIsCloture] = useState(false);         // Est-ce que le mois en cours est clôturé?
  const [journalSelectedArchive, setJournalSelectedArchive] = useState('');
  const [masseSelectedArchive, setMasseSelectedArchive] = useState('');
  const [journalArchiveDetail, setJournalArchiveDetail] = useState(null);
  const [masseArchiveDetail, setMasseArchiveDetail] = useState(null);
  const [journalArchiveLoading, setJournalArchiveLoading] = useState(false);
  const [masseArchiveLoading, setMasseArchiveLoading] = useState(false);
  const [journalActuelData, setJournalActuelData] = useState([]);           // Données snapshot du mois en cours
  const [journalActuelLoading, setJournalActuelLoading] = useState(false);
  const [latestPubReclamations, setLatestPubReclamations] = useState(null);

  // Nouveaux états pour le menu d'action agent et fiche imprimable
  const [agentActionModal, setAgentActionModal] = useState(() => {
    if (localStorage.getItem('pontage_return_source') === 'salaries') {
      const data = localStorage.getItem('pontage_return_to_payroll_agent_data');
      if (data) {
        try {
          return JSON.parse(data);
        } catch(e) {}
      }
    }
    return null;
  });
  const [printFicheModal, setPrintFicheModal] = useState(null);

  const handleSavePaymentMethod = async (id, updatedProfile) => {
    try {
      const res = await apiCall('update_agent_profile', { agent_id: id, profile_data: updatedProfile, period });
      if (res.success) {
        setPaymentMethodModal(null);
        showToast('Moyen de paiement mis à jour avec succès !', 'success');
        // Mettre à jour l'agent localement
        setSalaries(prev => prev.map(s => {
          if (s.id === id) {
            return { ...s, profile_data: JSON.stringify(updatedProfile) };
          }
          return s;
        }));
        // Mettre à jour les données initiales pour le tableau de paiement
        setPrevSalaries(prev => prev.map(s => {
          if (s.id === id) {
            return { ...s, profile_data: JSON.stringify(updatedProfile) };
          }
          return s;
        }));
        // Mettre à jour les archives si on est en mode archive
        setJournalArchiveDetail(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            salaries: (prev.salaries || []).map(s => {
              if (s.id === id) {
                // Dans l'archive, profile_data est souvent un objet plutôt qu'une chaîne JSON
                return { ...s, profile_data: updatedProfile };
              }
              return s;
            })
          };
        });
        
        // Mettre à jour le snapshot actuel
        setJournalActuelData(prev => (prev || []).map(s => {
          if (s.id === id) {
            return { ...s, profile_data: JSON.stringify(updatedProfile) };
          }
          return s;
        }));
      } else {
        alert(res.message || 'Erreur lors de la sauvegarde');
      }
    } catch(e) {
      console.error(e);
      alert('Erreur serveur');
    }
  };

  const handleSaveImportedPayments = async (payload) => {
    try {
      const promises = payload.map(item => 
        apiCall('update_agent_profile', { agent_id: item.agent_id, profile_data: item.profile_data, period: period })
      );
      await Promise.all(promises);
      setShowPaymentImportModal(false);
      showToast(`${payload.length} moyens de paiement importés avec succès !`, 'success');
      loadData();
    } catch(e) {
      console.error(e);
      alert("Erreur serveur lors de l'importation en masse");
    }
  };

  const getPeriodsList = (currentPeriod = null) => {
    const list = [];
    const now = new Date();
    const periodSet = new Set();
    
    // De 2 ans dans le passé à 5 ans dans le futur
    for (let i = -24; i <= 60; i++) {
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

  const [salariesLoading, setSalariesLoading] = useState(false);

  // ── Chargement des données ──
  const loadData = async () => {
    // 1. Chargement très rapide des données annexes
    setLoading(true);
    try {
      const [setRes, varRes, funcRes, loansRes, leavesRes, sanctRes, reclamRes, pubRes] = await Promise.all([
        apiCall('get_payroll_settings', {}, 'GET'),
        apiCall('get_payroll_variables', { period }, 'GET'),
        apiCall('get_functions', {}, 'GET'),
        apiCall('get_payroll_loans', { period }, 'GET'),
        apiCall('get_leaves', {}, 'GET'),
        apiCall('get_sanctions', {}, 'GET'),
        apiCall('get_reclamations', {}, 'GET'),
        apiCall('get_published_periods', { scope: 'company' }, 'GET')
      ]);

      if (pubRes?.success && initialLoadRef.current) {
        initialLoadRef.current = false;
        const pubs = pubRes.published_periods || [];
        const archs = pubRes.archived_periods || [];
        const allPeriods = [...pubs, ...archs];
        if (allPeriods.length > 0) {
          const exactLatest = pubRes.latest_publication?.period;
          setJournalCurrentPeriod(exactLatest || (pubs.length > 0 ? pubs[pubs.length - 1] : ''));
          setLatestPubReclamations(pubRes.latest_publication_reclamations || null);
          // Si on n'a PAS de target_period spécifique demandé par la clôture, on prend le plus récent
          if (!window.pontage_had_target_period) {
            let targetPeriod = exactLatest && pubs.includes(exactLatest) ? exactLatest : null;
            if (!targetPeriod) targetPeriod = archs.length > 0 ? [...archs].sort().reverse()[0] : [...pubs].sort().reverse()[0];
            
            if (targetPeriod && targetPeriod !== period) {
              setPeriod(targetPeriod);
              return; // React will re-trigger useEffect when period changes
            }
          }
        }
      } else if (pubRes?.success) {
          const currentPeriod = pubRes.latest_publication?.period || '';
          setJournalCurrentPeriod(currentPeriod);
          setLatestPubReclamations(pubRes.latest_publication_reclamations || null);
      }

      if (setRes?.success && setRes.settings) setPayrollSettings(prev => ({ ...prev, ...setRes.settings }));
      if (varRes?.success && varRes.variables) setPayrollVariables(varRes.variables);
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (loansRes?.success && Array.isArray(loansRes.loans)) setLoans(loansRes.loans);
      if (leavesRes?.success && Array.isArray(leavesRes.leaves)) setLeaves(leavesRes.leaves);
      if (sanctRes?.success && Array.isArray(sanctRes.sanctions)) setSanctions(sanctRes.sanctions);
      if (reclamRes?.success && Array.isArray(reclamRes.reclamations)) {
        const parsed = reclamRes.reclamations.map(r => {
          let custom = {};
          try { if (r.description && r.description.startsWith('{')) custom = JSON.parse(r.description); } catch(e) {}
          return {
            ...r,
            agent_id: custom.agent_id || r.agent_matricule, // Fallback if no agent_id
            period: custom.period || r.mois_concerne,
            montant: custom.montant || r.montant_estime,
            jours: custom.jours || r.jours_concernes,
            motif: r.reclamation_categorie || custom.motif
          };
        });
        setReclamations(parsed);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }

    // 2. Chargement des salaires (lourd) en arrière-plan
    setSalariesLoading(true);
    try {
      const salRes = await apiCall('get_salaries', { period }, 'GET');
      if (Array.isArray(salRes)) setSalaries(salRes);
      setPrevSalaries([]); // Plus utilisé, on lira depuis l'historique
    } catch (e) { console.error(e); }
    finally { setSalariesLoading(false); }
  };

  const loadDashboardHistory = async (requestedPeriod) => {
    // Utiliser la période passée en paramètre ou la période actuelle
    const p = requestedPeriod || period;
    // Enregistrer cette période comme la plus récente attendue
    expectedHistoryPeriodRef.current = p;
    try {
      const res = await apiCall('get_dashboard_history', { period: p, scope: 'company' }, 'GET');
      // Ignorer les réponses périmées (si une nouvelle requête a déjà été lancée)
      if (expectedHistoryPeriodRef.current !== p) return;
      if (res.success && res.history) {
        setDashboardHistory(res.history.map(item => {
          const [y, mo] = item.period.split('-');
          const label = new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
          const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
          return { label: labelCap, total: item.total, period: item.period };
        }));
      }
    } catch (e) { console.error(e); }
  };


  useEffect(() => { loadData(); }, [period]);

  const isAutoCalculatedMotif = ["justificatif d'absence", "annulation de permission", "mise à pied"].includes(newReclamation.motif.toLowerCase());
  const isPastErrorMotif = ["erreur de paie", "erreur de pointage", "omission"].includes(newReclamation.motif.toLowerCase());

  useEffect(() => {
    if (isAutoCalculatedMotif && newReclamation.agent_id) {
      const agentData = salaries.find(s => s.id === newReclamation.agent_id);
      if (agentData) {
        const motif = newReclamation.motif.toLowerCase();
        if (motif === "justificatif d'absence") {
          let allDates = [];
          if (agentData.absence_details) allDates = allDates.concat(agentData.absence_details.map(d => d.date || d.start_date));
          if (agentData.permission_details) allDates = allDates.concat(agentData.permission_details.map(d => d.date || d.start_date));
          if (agentData.map_details) allDates = allDates.concat(agentData.map_details.map(d => d.date || d.start_date));
          if (agentData.abandon_details) allDates = allDates.concat(agentData.abandon_details.map(d => d.date || d.start_date));
          setAbsentDatesList([...new Set(allDates)].filter(Boolean));
        } else if (motif === "annulation de permission" && agentData.permission_details) {
          setAbsentDatesList(agentData.permission_details.map(d => d.date || d.start_date));
        } else if (motif === "mise à pied" && agentData.map_details) {
          setAbsentDatesList(agentData.map_details.map(d => d.date || d.start_date));
        } else {
          setAbsentDatesList([]);
        }
      } else {
        setAbsentDatesList([]);
      }
      setCheckedDates([]);
    } else {
      setAbsentDatesList([]);
      setCheckedDates([]);
    }
  }, [newReclamation.agent_id, newReclamation.motif, salaries]);

  useEffect(() => {
    if ((isAutoCalculatedMotif || isPastErrorMotif) && newReclamation.agent_id && isMontantLocked) {
      const agentData = salaries.find(s => s.id === newReclamation.agent_id);
      if (agentData) {
        let dailySalary = (Number(agentData.base) || 75000) / 30;
        if (agentData.profile_data?.special_service) {
           dailySalary = (Number(agentData.base) || 75000) / (agentData.profile_data.special_service_base || 12);
        }
        const normalizedJours = Number(String(newReclamation.jours).replace(',', '.')) || 0;
        let effectiveJours = normalizedJours;
        // Règle métier : Si le mois fait 31 jours et qu'on coche les 31 jours, le calcul du montant est basé sur 30 jours
        if (checkedDates && checkedDates.length === 31 && normalizedJours === 31) {
           effectiveJours = 30;
        }
        const montant = Math.round(dailySalary * effectiveJours);
        setNewReclamation(prev => ({ ...prev, montant }));
      }
    }
  }, [newReclamation.jours, newReclamation.agent_id, newReclamation.motif, salaries, isMontantLocked, checkedDates]);

  const handleToggleAbsentDate = (dateStr) => {
    let currentSelected = newReclamation.dates ? newReclamation.dates.split(',').map(d => d.trim()).filter(Boolean) : [];
    
    const dateObj = new Date(dateStr);
    const formatted = `${dateObj.getDate()} ${dateObj.toLocaleDateString('fr-FR', {month: 'short'}).replace('.', '')}`;
    
    let newSelected;
    let newCheckedDates;
    if (checkedDates.includes(dateStr)) {
      newCheckedDates = checkedDates.filter(d => d !== dateStr);
      newSelected = currentSelected.filter(d => d !== formatted);
    } else {
      newCheckedDates = [...checkedDates, dateStr];
      newSelected = [...currentSelected, formatted];
    }
    setCheckedDates(newCheckedDates);
    
    setNewReclamation(prev => ({
       ...prev,
       dates: newSelected.join(', '),
       jours: newCheckedDates.length
    }));
  };

  useEffect(() => {
    // Vider l'ancien historique et charger le nouveau en passant la période explicitement
    setDashboardHistory([]);
    loadDashboardHistory(period);
  }, [period]);
  useEffect(() => { if (activeTab === 'dashboard') loadDashboardHistory(period); }, [activeTab]);

  const loadJournalArchives = async () => {
    try {
      const res = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
      if (res?.success) {
        const allArchs = res.archived_periods || [];
        const clotures = res.cloture_periods || [];
        const currentPeriod = res.latest_publication?.period || '';
        setJournalCurrentPeriod(currentPeriod);
        setJournalIsCloture(clotures.includes(currentPeriod));
        // Archives = tous les mois archivés SAUF le mois en cours
        const pastArchs = allArchs.filter(p => p !== currentPeriod).sort().reverse();
        setJournalArchivedPeriods(pastArchs);
        if (pastArchs.length > 0 && !journalSelectedArchive) {
          setJournalSelectedArchive(pastArchs[0]);
        }
        // Charger les données du mois en cours
        if (currentPeriod) loadJournalActuel(currentPeriod);
      }
    } catch (e) { console.error(e); }
  };

  const loadJournalActuel = async (currentPeriod) => {
    setJournalActuelLoading(true);
    try {
      // Utiliser get_salaries qui lit déjà le snapshot gelé au moment de la publication
      const res = await apiCall('get_salaries', { period: currentPeriod, scope: 'company' }, 'GET');
      if (Array.isArray(res)) setJournalActuelData(res);
      else if (res?.salaries) setJournalActuelData(res.salaries);
    } catch (e) { console.error(e); }
    finally { setJournalActuelLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'journal' || activeTab === 'masse_salariale') loadJournalArchives();
  }, [activeTab]);

  useEffect(() => {
    if (masseMode === 'archives' && masseSelectedArchive) {
      const fetchMasseArchive = async () => {
        setMasseArchiveLoading(true);
        try {
          const res = await apiCall(`get_payroll_archive_detail&period=${masseSelectedArchive}&scope=company`, {}, 'GET');
          if (res?.success) setMasseArchiveDetail(res.archive);
        } catch (e) { console.error(e); }
        finally { setMasseArchiveLoading(false); }
      };
      fetchMasseArchive();
    }
  }, [masseMode, masseSelectedArchive]);

  useEffect(() => {
    if (journalMode === 'archives' && journalSelectedArchive) {
      const fetchArchiveDetail = async () => {
        setJournalArchiveLoading(true);
        try {
          const res = await apiCall(`get_payroll_archive_detail&period=${journalSelectedArchive}&scope=company`, {}, 'GET');
          if (res?.success) setJournalArchiveDetail(res.archive);
        } catch (e) { console.error(e); }
        finally { setJournalArchiveLoading(false); }
      };
      fetchArchiveDetail();
    }
  }, [journalMode, journalSelectedArchive]);

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
      agent_id: agent ? agent.id : '',
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

  const handleSaveReclamation = async () => {
    if (!newReclamation.agent_id || !newReclamation.montant) {
      showToast("Veuillez remplir l'agent et le montant.", 'error');
      return;
    }
    try {
      const normalizedJours = Number(String(newReclamation.jours).replace(',', '.')) || 0;
      const res = await apiCall('save_reclamation', { ...newReclamation, jours: normalizedJours, period }, 'POST');
      if (res.success) {
        setShowAddReclamationModal(false);
        setNewReclamation({ agent_id: '', motif: "justificatif d'absence", jours: 1, dates: '', montant: '', agent_name: '' });
        showToast('Réclamation enregistrée avec succès !', 'success');
        loadData();
      } else {
        showToast(res.message || "Erreur lors de la création de la réclamation", 'error');
      }
    } catch (e) { 
      console.error(e); 
      showToast("Erreur de connexion au serveur", 'error');
    }
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
    const salaireBase = Number(agent.base) || 0;
    const salaireBaseFull = Number(agent.base_full) || Number(agent.base) || 75000;
    const specialBase = (profile.special_service) 
      ? (profile.special_service_base || 12) 
      : 30;
    // Base journalière (utilisée seulement pour les HS et les sanctions discipline)
    const baseJournaliere = salaireBaseFull / specialBase;

    // Congés payés (calculé précisément par le backend en tenant compte du diviseur 30)
    const congePayes = agent.cp_count || 0;

    // ─── RETENUES : on utilise directement la valeur calculée par le backend ───
    // Le backend (functions.php) calcule déjà précisément : absences + MAP + permissions + entrant/sortant
    // On n'a PAS besoin de recalculer ici — cela évite les divergences
    const retenuesBackend = Number(agent.deductions) || 0;

    // Sanctions disciplinaires du MODULE DISCIPLINE (pas comptées dans le backend)
    const sanctionDisciplineDays = getAgentSanctionDays(agent.id);
    const retenuesSanctionsDiscipline = Math.round(sanctionDisciplineDays * baseJournaliere);

    // Total retenues absences/MAP/permission/discipline
    const retenuesAbsences = retenuesBackend;
    const retenuesSanctions = retenuesSanctionsDiscipline;
    const retenuesPermissions = 0; // déjà incluses dans retenuesBackend
    const absencesDeductibles = agent.absences || 0;
    const permissionsDeductibles = agent.permission_count || 0;
    const joursMiseAPied = (agent.map_count || 0) + sanctionDisciplineDays;

    const isActive = (key) => {
      const val = payrollSettings[key];
      return val === true || val === 'true' || val === 1 || val === '1';
    };

    const primeAnciennete = isActive('enable_seniority') ? getSeniorityBonus(profile.date_embauche || profile.hire_date, salaireBase) : 0;
    const primeVariable = isActive('enable_sursalaire') ? (vars.prime || 0) : 0;
    const gainsHS = Number(agent.gains) || 0;  // Valeur exacte calculée par le backend (logique différence salariale)
    const gainsCostume = 0; // Déjà inclus dans agent.gains côté backend
    
    // Le brut utilise la base (prorata), moins les retenues backend et discipline, plus les gains
    const totalRetenues = retenuesBackend + retenuesSanctionsDiscipline;
    const salaireBrut = Math.max(0, salaireBase - totalRetenues + (Number(agent.gains) || 0) + (Number(agent.prime_site) || 0) + primeAnciennete + primeVariable + gainsCostume);

    const cnpsSalarial = isActive('enable_cnps_salarial') ? Math.round(salaireBrut * ((payrollSettings.cnps_salarial ?? 0) / 100)) : 0;
    const cmuEmploye = isActive('enable_cmu_employe') ? parseInt(payrollSettings.cmu_amount ?? 0) : 0;
    
    // Patronales
    const cnpsPatronal = isActive('enable_cnps_patronal') ? Math.round(salaireBrut * ((payrollSettings.cnps_patronal ?? 0) / 100)) : 0;
    const accidentsTravail = isActive('enable_accidents_travail') ? Math.round(salaireBrut * ((payrollSettings.accidents_travail ?? 0) / 100)) : 0;
    const taxeFormation = isActive('enable_fdfp') ? Math.round(salaireBrut * ((payrollSettings.taxe_formation ?? 0) / 100)) : 0;
    const taxeApprentissage = isActive('enable_taxe_apprentissage') ? Math.round(salaireBrut * ((payrollSettings.taxe_apprentissage ?? 0) / 100)) : 0;
    const cmuEmployeur = isActive('enable_cmu_employeur') ? parseInt(payrollSettings.cmu_amount ?? 0) : 0;

    const fdfp = taxeFormation + taxeApprentissage; // used for cout employeur backward compat

    let impotsTaxes = 0, detailImpots = { IS: 0, CN: 0, IGR: 0 };
    if (isActive('enable_its')) {
      if (payrollSettings.tax_mode === 'reel_ci') {
        const taxRes = calculateTaxesCI(salaireBrut - cnpsSalarial, getParts(profile));
        impotsTaxes = taxRes.total;
        detailImpots = taxRes;
      } else {
        impotsTaxes = Math.round((salaireBrut - cnpsSalarial) * ((payrollSettings.its ?? 0) / 100));
        detailImpots.IS = impotsTaxes;
      }
    }

    const totalRetenuesFiscales = cnpsSalarial + impotsTaxes + cmuEmploye;
    const avances = isActive('enable_avances') ? (vars.avance || 0) : 0;
    const remboursementsPrets = isActive('enable_avances') ? getLoanDeduction(agent.id) : 0;
    const montantPonctions = reclamations
      .filter(r => r.mois_concerne === period && (r.agent_matricule ? r.agent_matricule === agent.id : r.agent_nom === agent.name) && ['Clôturé', 'Transmis'].includes(r.statut) && (r.type_erreur || r.motif || r.reclamation_categorie || '').toLowerCase() === 'ponction')
      .reduce((acc, r) => acc + (parseFloat(r.montant || r.montant_estime) || 0), 0);

    const totalDeductionsNettes = avances + remboursementsPrets; // On ne mélange plus avec les ponctions pour l'affichage séparé

    // Calcul des réclamations (ajouts nets au salaire final)
    const motifsRecl = ["justificatif d'absence", "annulation de permission", "mise à pied", "erreur de paie", "erreur de pointage", "omission"];
    const montantReclamations = reclamations
      .filter(r => r.mois_concerne === period && (r.agent_matricule ? r.agent_matricule === agent.id : r.agent_nom === agent.name) && r.statut === 'Clôturé' && motifsRecl.includes((r.type_erreur || r.motif || r.reclamation_categorie || '').toLowerCase()))
      .reduce((acc, r) => acc + (parseFloat(r.montant || r.montant_estime) || 0), 0);

    const netAPayer = Math.max(0, salaireBrut - totalRetenuesFiscales - totalDeductionsNettes - montantPonctions) + montantReclamations;
    const coutEmployeur = salaireBrut + cnpsPatronal + accidentsTravail + taxeFormation + taxeApprentissage + cmuEmployeur;

    return {
      salaireBase, retenuesAbsences, congePayes, absencesDeductibles, joursMiseAPied, retenuesSanctions,
      permissionsDeductibles, retenuesPermissions,
      primeAnciennete, primeVariable, gainsHS, gainsCostume, primeSite: Number(agent.prime_site) || 0,
      salaireBrut, cnpsSalarial, cmuEmploye, cnpsPatronal, accidentsTravail, taxeFormation, taxeApprentissage, cmuEmployeur, impotsTaxes, detailImpots, fdfp,
      avances, remboursementsPrets, totalDeductionsNettes,
      totalRetenuesFiscales, netAPayer, coutEmployeur, parts: getParts(agent.profile_data || {}),
      montantReclamations, montantPonctions
    };
  }, [payrollVariables, payrollSettings, loans, leaves, sanctions, period, reclamations]);

  const activeSalariesList = 
    (activeTab === 'journal' && journalMode === 'archives')
      ? (journalArchiveDetail?.salaries || [])
      : (activeTab === 'masse_salariale' && masseMode === 'archives')
        ? (masseArchiveDetail?.salaries || [])
        : salaries;

  const filteredSalaries = useMemo(() => activeSalariesList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.site.toLowerCase().includes(searchQuery.toLowerCase())
  ), [activeSalariesList, searchQuery]);

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
    let csv = "Agent;Site;Poste;Base;Absences;Sanctions;Congés Payés;Primes;Brut;CNPS Sal;CMU Sal;ITS;Acc. Travail;Taxe Form;Taxe Appr;CMU Patr;Avances/Prêts;Net;Charges Patr;Coût Total\n";
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      csv += `"${s.name}";"${s.site}";"${funcLabel(s.function)}";${p.salaireBase};${p.retenuesAbsences};${p.retenuesSanctions};${p.congePayes};${p.primeAnciennete + p.primeVariable + p.gainsHS};${p.salaireBrut};${p.cnpsSalarial};${p.cmuEmploye};${p.impotsTaxes};${p.accidentsTravail};${p.taxeFormation};${p.taxeApprentissage};${p.cmuEmployeur};${p.totalDeductionsNettes};${p.netAPayer};${p.cnpsPatronal + p.accidentsTravail + p.taxeFormation + p.taxeApprentissage + p.cmuEmployeur};${p.coutEmployeur}\n`;
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

  const handleExportMobileMoney = () => {
    let csv = "Nom Complet;Numéro Téléphone;Réseau;Montant Net (XOF)\n";
    let count = 0;
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      const profileData = parseProfileData(s.profile_data);
      const pm = profileData.payment_method || 'Especes';
      const phone = profileData.mobile_money_number || profileData.phone || profileData.telephone;
      
      if (pm === 'Mobile Money' && phone) {
        let reseau = "Mobile Money";
        if (phone.startsWith('07') || phone.startsWith('08') || phone.startsWith('09')) reseau = "Orange";
        else if (phone.startsWith('05') || phone.startsWith('04') || phone.startsWith('06')) reseau = "MTN";
        else if (phone.startsWith('01') || phone.startsWith('02') || phone.startsWith('03')) reseau = "Moov";
        csv += `"${s.name}";"${phone}";"${reseau}";${p.netAPayer}\n`;
        count++;
      }
    });
    downloadCSV(`Paiements_MobileMoney_${period}.csv`, csv);
    alert(`${count} agents exportés pour paiement Mobile Money (les autres n'ont pas ce mode de paiement ou pas de numéro renseigné).`);
  };

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
        const cnps = Math.round(d.brut * ((payrollSettings.cnps_salarial ?? 0) / 100));
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
    </style></head><body>${DOMPurify.sanitize(html)}</body></html>`);
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
    if (!filteredSalaries.length) return { totalNet: 0, totalBrut: 0, totalCout: 0, totalCNPS: 0, totalImpots: 0, count: 0, adminCount: 0 };
    let totalNet = 0, totalBrut = 0, totalCout = 0, totalCNPS = 0, totalImpots = 0;
    let adminCount = 0;
    filteredSalaries.forEach(s => {
      const p = calculatePayslip(s);
      totalNet += p.netAPayer;
      totalBrut += p.salaireBrut;
      totalCout += p.coutEmployeur;
      totalCNPS += p.cnpsSalarial + p.cnpsPatronal;
      totalImpots += p.impotsTaxes;
      // Compter uniquement les agents du site Administration (le champ 'site' contient le nom du site)
      const siteNameLower = (s.site || '').toLowerCase().replace(/[🏢\s]/g, '');
      if (siteNameLower.includes('administration') || s.site_id === 'site_administration') {
        adminCount++;
      }
    });
    
    // Le total "Agents Payés" selon la règle de l'utilisateur = Total Agents - Admin Agents
    const agentsCount = filteredSalaries.length - adminCount;
    
    return { totalNet, totalBrut, totalCout, totalCNPS, totalImpots, count: agentsCount, adminCount, trueTotal: filteredSalaries.length };
  }, [filteredSalaries, calculatePayslip]);

  const animatedNet = useCountUp(dashAgg.totalNet, 2500);
  const animatedCount = useCountUp(dashAgg.count, 2000);
  const animatedAdminCount = useCountUp(dashAgg.adminCount, 2000);

  const prevAgg = useMemo(() => {
    const prevDate = new Date(period + '-01');
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevPeriodStr = prevDate.toISOString().slice(0, 7);
    
    // Chercher dans l'historique du dashboard qui vient d'être chargé
    const pastMonthData = dashboardHistory.find(d => d.period === prevPeriodStr);
    
    if (pastMonthData) {
      return { totalNet: pastMonthData.total || 0 };
    }
    return { totalNet: 0 };
  }, [dashboardHistory, period]);

  const isColActive = (key) => {
    const val = payrollSettings[key];
    return val === true || val === 'true' || val === 1 || val === '1';
  };

  // ══════════════════════════════════════════════
  // RENDU DES ONGLETS
  // ══════════════════════════════════════════════
  const tabs = [
    { id: 'dashboard', icon: <BarChart3 size={16} />, label: 'Tableau de Bord' },
    { id: 'reclamations', icon: <CheckCircle2 size={16} />, label: 'Réclamations Validées' },
    { id: 'journal', icon: <BookOpen size={16} />, label: 'Journal' },
    { id: 'calcul', icon: <DollarSign size={16} />, label: 'Bulletins' },
    { id: 'paiements', icon: <Wallet size={16} />, label: 'Moyens de paiements' },
    { id: 'prets', icon: <PiggyBank size={16} />, label: 'Prêts' },
    { id: 'masse_salariale', icon: <Building size={16} />, label: 'Masse Salariale' },
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '40px', right: '40px', zIndex: 99999,
          background: toastMessage.type === 'success' ? '#10b981' : (toastMessage.type === 'info' ? '#3b82f6' : '#ef4444'),
          color: 'white', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '14px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={26} /> : (toastMessage.type === 'info' ? <Info size={26} /> : <AlertTriangle size={26} />)}
          <span style={{ fontWeight: '600', fontSize: '1.05rem', letterSpacing: '0.3px' }}>{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: '8px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}><X size={20}/></button>
        </div>
      )}

      {/* MODALS */}
      {showPaymentAuditModal && (
        <PaymentAuditModal
          currentSalaries={filteredSalaries}
          currentPeriod={period}
          onClose={() => setShowPaymentAuditModal(false)}
        />
      )}

      {showPaymentImportModal && (
        <PaymentImportModal 
          salaries={salaries} 
          onClose={() => setShowPaymentImportModal(false)} 
          onSave={handleSaveImportedPayments} 
        />
      )}



      {/* BARRE DU HAUT */}
      <div className="top-bar glass-panel" style={{ overflowX: 'auto', paddingTop: '10px', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: 'max-content' }}>
          <select className="form-input" style={{ background: 'rgba(0,0,0,0.3)', minWidth: '150px', flexShrink: 0 }} value={period} onChange={e => setPeriod(e.target.value)}>
            {getPeriodsList(period).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}>
                {t.icon} <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div></div>
      ) : (
        <div style={{ marginTop: '24px' }}>

          {/* ═══════════ DASHBOARD ═══════════ */}
          {activeTab === 'dashboard' && (
            <div style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Comparaison M-1 
                    <Info 
                      size={14} 
                      style={{ cursor: 'pointer', opacity: 0.7, color: '#38bdf8' }} 
                      onClick={() => setToastMessage({ type: 'info', message: "Cet indicateur compare la masse salariale nette de ce mois avec celle de l'archive du mois précédent. S'il affiche +0, c'est que les montants sont identiques ou qu'il n'y a pas d'archive précédente." })}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                      title="Cliquez pour plus d'explications"
                    /> :
                  </span>
                  {salariesLoading ? (
                    <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Loader2 size={16} className="animate-spin" /> Calcul en cours...</span>
                  ) : dashAgg.totalNet >= prevAgg.totalNet ? (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><ArrowUpRight size={16} /> +{fmt(dashAgg.totalNet - prevAgg.totalNet)} XOF</span>
                  ) : (
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><ArrowDownRight size={16} /> -{fmt(prevAgg.totalNet - dashAgg.totalNet)} XOF</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Masse Salariale Nette', value: salariesLoading ? 'Calcul...' : fmt(animatedNet) + ' XOF', icon: <DollarSign size={20} />, color: '#38bdf8', info: "Il s'agit du montant total net physique (l'argent) qui sera viré ou distribué aux agents pour ce mois, après toutes les retenues et les primes." },
                  { label: 'Agents Payés', value: salariesLoading ? 'Calcul...' : animatedCount, icon: <Users size={20} />, color: '#34d399' },
                  { label: 'Personnel admin. payé', value: salariesLoading ? 'Calcul...' : animatedAdminCount + ' personnel(s)', icon: <Users size={20} />, color: '#a78bfa' },
                ].map((kpi) => (
                  <div key={kpi.label} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: `${kpi.color}15`, color: kpi.color, borderRadius: '12px', padding: '12px', display: 'flex' }}>{kpi.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {kpi.label}
                        {kpi.info && (
                          <Info 
                            size={12} 
                            style={{ cursor: 'pointer', opacity: 0.7, color: kpi.color }} 
                            onClick={() => setToastMessage({ type: 'info', message: kpi.info })}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            title="Cliquez pour plus d'informations"
                          />
                        )}
                      </div>
                      <div style={{ fontSize: salariesLoading ? '1rem' : '1.3rem', fontWeight: salariesLoading ? '400' : '900', color: salariesLoading ? 'var(--muted)' : 'white' }}>
                        {salariesLoading && <Loader2 size={12} className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }}/>}
                        {kpi.value}
                      </div>
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
                {salariesLoading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}><Loader2 size={24} className="animate-spin" style={{ marginBottom: '10px' }} /><br/>Calcul des variables en cours...</td></tr>
                ) : filteredSalaries.map(s => {
                  const vars = payrollVariables[s.id] || {};
                  return (<tr key={s.id}><td style={{ fontWeight: 'bold' }}>{s.name}</td><td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{funcLabel(s.function)} • {s.site} {s.site_location === 'interieur' && <img src={flagUrl} width="14" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'contain' }}/>}</td>
                    <td><input type="number" className="form-input" style={{ padding: '8px', width: '100%', background: 'rgba(0,0,0,0.2)' }} value={vars.avance || ''} onChange={e => updateVariable(s.id, 'avance', e.target.value)} placeholder="0" /></td>
                    <td><input type="number" className="form-input" style={{ padding: '8px', width: '100%', background: 'rgba(0,0,0,0.2)' }} value={vars.prime || ''} onChange={e => updateVariable(s.id, 'prime', e.target.value)} placeholder="0" /></td></tr>);
                })}
              </tbody></table></div>
            </div>
          )}

          {/* ═══════════ PRÊTS & AVANCES ═══════════ */}
          {activeTab === 'prets' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}>Gestion des Prêts</h3>
                
                <div style={{ position: 'relative', flex: 1, margin: '0 24px', maxWidth: '350px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Rechercher (nom, motif)..." 
                    value={loanSearch} 
                    onChange={e => setLoanSearch(e.target.value)} 
                    style={{ paddingLeft: '36px', width: '100%', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowAddPretModal(true)}
                    style={{ background: '#f43f5e', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Plus size={16} /> Ajouter un prêt
                  </button>
                  <button
                    onClick={() => setLoanTab('actuel')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', background: loanTab === 'actuel' ? 'var(--primary)' : 'transparent', color: loanTab === 'actuel' ? 'white' : 'var(--muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; if (loanTab !== 'actuel') { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; if (loanTab !== 'actuel') { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    Mois Actuel
                  </button>
                  <button
                    onClick={() => setLoanTab('archives')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', background: loanTab === 'archives' ? 'var(--primary)' : 'transparent', color: loanTab === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; if (loanTab !== 'archives') { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; if (loanTab !== 'archives') { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <Archive size={16} /> Archives
                  </button>
                </div>
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
                    {(() => {
                      let filteredLoans = loans.filter(l => {
                        const total = parseInt(l.total_amount);
                        const monthly = parseInt(l.monthly_deduction);
                        const totalMonths = Math.ceil(total / (monthly > 0 ? monthly : total));
                        const startTs = new Date(l.start_period + '-01').getTime();
                        const currTs = new Date(period + '-01').getTime();
                        let isComplete = false;
                        if (currTs >= startTs) {
                          const mp = getMonthsDiff(l.start_period, period);
                          if (mp >= totalMonths) isComplete = true;
                          else {
                            const deductedSoFar = Math.min(total, (mp + 1) * (monthly > 0 ? monthly : total));
                            if (deductedSoFar >= total) isComplete = true;
                          }
                        }
                        
                        if (loanTab === 'actuel' && isComplete) return false;
                        if (loanTab === 'archives' && !isComplete) return false;
                        
                        if (loanSearch) {
                          const q = loanSearch.toLowerCase();
                          if (!(l.agent_name && l.agent_name.toLowerCase().includes(q)) && 
                              !(l.motif && l.motif.toLowerCase().includes(q))) {
                            return false;
                          }
                        }
                        return true;
                      });

                      if (filteredLoans.length === 0) return <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucun prêt dans cette catégorie</td></tr>;
                      return filteredLoans.map(l => {
                        const total = parseInt(l.total_amount);
                        const monthly = parseInt(l.monthly_deduction);
                      
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
                                  <div key={`month-bar-${i}`} style={{ width: `${pct}%`, height: '100%', background: getMonthColor(i), transition: 'width 0.3s' }}></div>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <button onClick={() => handleDeleteLoan(l.id)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }} title="Supprimer"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    }); })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ RÉCLAMATIONS VALIDÉES ═══════════ */}
          {activeTab === 'reclamations' && (() => {
            const allValidees = reclamations.filter(r => r.statut === 'Clôturé');
            const latestMonth = period;
            
            return showPrintView ? (
              <PrintReclamationsView 
                reclamations={recTab === 'archives' && archivedRecMonthView ? reclamations.filter(r => r.statut === 'Clôturé' && r.mois_concerne === archivedRecMonthView) : allValidees.filter(r => r.mois_concerne === latestMonth)} 
                period={recTab === 'archives' && archivedRecMonthView ? archivedRecMonthView : latestMonth} 
                onClose={() => { setShowPrintView(false); if (recTab === 'archives') setArchivedRecMonthView(null); }} 
                isArchive={recTab === 'archives'}
              />
            ) : (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, color: recTab === 'archives' ? '#a855f7' : '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {recTab === 'archives' ? <Archive size={24} /> : <CheckCircle2 size={24} />} {recTab === 'actuel' ? `Réclamations Clôturées / Validées (${fmtPeriod(latestMonth)})` : 'Archives des Réclamations Validées'}
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '12px' }}>
                    <button 
                      onMouseEnter={() => setShowRecInfo(true)}
                      onMouseLeave={() => setShowRecInfo(false)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--muted)', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', transition: 'all 0.2s' }}
                    >
                      <Info size={16} />
                    </button>
                    {showRecInfo && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '0', background: '#0f172a', border: '1px solid rgba(52,211,153,0.3)', padding: '16px', borderRadius: '8px', width: '450px', zIndex: 100, color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                        <strong style={{ color: '#34d399', fontSize: '1rem', display: 'block', marginBottom: '8px' }}>Information</strong> 
                        Ces réclamations proviennent du module de pointage (PC) et ont été formellement validées par la comptabilité.<br/><br/>
                        Les réclamations de type <strong>"Absence"</strong> dont l'action est <strong>"A payer"</strong> déduisent automatiquement les jours justifiés des absences de l'agent, et annulent la retenue salariale correspondante dans le livre de paie.
                      </div>
                    )}
                  </div>
                </h3>
                <div style={{ position: 'relative', flex: 1, margin: '0 24px', maxWidth: '350px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Rechercher (nom, fiche, catégorie)..." 
                    value={reclamationSearch} 
                    onChange={e => setReclamationSearch(e.target.value)} 
                    style={{ paddingLeft: '36px', width: '100%', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px', alignItems: 'center' }}>
                  {((recTab === 'actuel') || (recTab === 'archives' && archivedRecMonthView)) && (
                    <button 
                      onClick={() => setShowPrintView(true)}
                      title="Imprimer par motifs"
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginRight: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setNewReclamation({ agent_id: '', motif: "justificatif d'absence", jours: 1, dates: '', montant: '', agent_name: '' });
                      setShowAddReclamationModal(true);
                    }}
                    className="btn btn-primary" 
                    style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Plus size={16} /> Ajouter une réclamation
                  </button>
                  <button
                    onClick={() => setRecTab('actuel')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', background: recTab === 'actuel' ? 'var(--primary)' : 'transparent', color: recTab === 'actuel' ? 'white' : 'var(--muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; if (recTab !== 'actuel') { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; if (recTab !== 'actuel') { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    Mois Actuel
                  </button>
                  <button
                    onClick={() => setRecTab('archives')}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', background: recTab === 'archives' ? 'var(--primary)' : 'transparent', color: recTab === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; if (recTab !== 'archives') { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; if (recTab !== 'archives') { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <Archive size={16} /> Archives
                  </button>
                </div>
              </div>
              <div className="table-container">
                {recTab === 'archives' ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>PÉRIODE</th>
                        <th style={{ textAlign: 'center' }}>NOMBRE DE FICHES</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const recsValideesArchives = allValidees.filter(r => r.mois_concerne !== latestMonth);
                        const groupedArchives = {};
                        recsValideesArchives.forEach(r => {
                          if (!groupedArchives[r.mois_concerne]) groupedArchives[r.mois_concerne] = 0;
                          groupedArchives[r.mois_concerne]++;
                        });
                        const archiveMonths = Object.keys(groupedArchives).sort().reverse();
                        
                        if (archiveMonths.length === 0) {
                          return <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucune réclamation validée dans les archives.</td></tr>;
                        }
                        
                        return archiveMonths.map(m => (
                          <tr key={m}>
                            <td style={{ fontWeight: 'bold', textTransform: 'capitalize', color: 'white' }}>{fmtPeriod(m)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#34d399', fontWeight: 'bold', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>{groupedArchives[m]} Validée{groupedArchives[m] > 1 ? 's' : ''}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => { setArchivedRecMonthView(m); setShowPrintView(true); }}
                                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
                              >
                                Consulter
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>N° Fiche</th>
                        <th>Agent concerné</th>
                        <th>Catégorie</th>
                        <th>Type / Motif</th>
                        <th style={{ textAlign: 'center' }}>Dates Justifiées</th>
                        <th style={{ textAlign: 'right' }}>Montant Estimé</th>
                        <th>Action de paie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let recsValidees = allValidees.filter(r => r.mois_concerne === latestMonth).sort((a, b) => b.mois_concerne.localeCompare(a.mois_concerne));
                        if (reclamationSearch) {
                          const q = reclamationSearch.toLowerCase();
                          recsValidees = recsValidees.filter(r => 
                            (r.agent_nom && r.agent_nom.toLowerCase().includes(q)) || 
                            (r.numero_fiche && String(r.numero_fiche).toLowerCase().includes(q)) || 
                            (r.reclamation_categorie && r.reclamation_categorie.toLowerCase().includes(q))
                          );
                        }
                        
                        if (recsValidees.length === 0) {
                          const latestMonthRecs = reclamations.filter(r => r.mois_concerne === latestMonth);
                          const hasTransmis = latestMonthRecs.some(r => r.statut === 'Transmis');
                          const hasEnAttente = latestMonthRecs.some(r => r.statut === 'En attente');
                          
                          // S'il n'y a plus rien "En attente" mais qu'il y a du "Transmis", c'est que c'est chez le Comptable.
                          const isWithComptable = hasTransmis && !hasEnAttente;
                          
                          const isPendingSecretariat = latestPubReclamations && 
                                                       latestPubReclamations.period === latestMonth &&
                                                       (latestPubReclamations.services_cibles?.includes('Secrétariat') || latestPubReclamations.services_cibles?.includes('Tous'));
                                                       
                          if (isPendingSecretariat || isWithComptable) {
                            const serviceName = isWithComptable ? 'Comptable' : 'Secrétariat';
                            return (
                              <tr>
                                <td colSpan="7" style={{ padding: '0' }}>
                                  <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                                    <div className="animate-hourglass" style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                                    <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 10px 0', color: '#fbbf24' }}>
                                      {fmtPeriod(latestMonth)} — En cours de traitement
                                    </h3>
                                    <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                                      Les données des réclamations sont en cours de traitement par le service {serviceName}. Elles apparaîtront ici une fois le traitement terminé.
                                    </p>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                                      <span className="animate-hourglass">⏳</span>
                                      <span>En attente de traitement par le {serviceName}</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          } else {
                            return <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucune réclamation validée pour le mois actuel.</td></tr>;
                          }
                        }
                        return recsValidees.map(r => {
                          const isAbsence = r.type_erreur === 'Absence' && r.action_demandee === 'A payer';
                          return (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{r.numero_fiche || '-'}</td>
                              <td style={{ fontWeight: 'bold' }}>{r.agent_nom}</td>
                              <td>{r.type_erreur || r.reclamation_categorie}</td>
                              <td>
                                {r.type_erreur_autre ? <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{r.type_erreur_autre}</div> : <span style={{ color: 'var(--muted)' }}>-</span>}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: isAbsence ? '#34d399' : 'white' }}>
                                {(() => {
                                  const info = getDatesInfo(r);
                                  return info.hasDates ? (
                                    <span 
                                      style={{ cursor: 'pointer', borderBottom: '1px dashed currentColor', paddingBottom: '2px' }}
                                      onClick={() => {
                                        r._computedDatesString = info.text;
                                        setViewDatesModal(r);
                                      }}
                                      title="Voir les dates"
                                    >
                                      {info.count}
                                    </span>
                                  ) : '-';
                                })()}
                              </td>
                              <td style={{ textAlign: 'right', color: (r.reclamation_categorie || '').toLowerCase() === 'ponction' ? '#ef4444' : '#34d399', fontWeight: 'bold' }}>
                                {r.montant_estime 
                                  ? ((r.reclamation_categorie || '').toLowerCase() === 'ponction' ? `-${fmt(r.montant_estime)} FCFA` : `${fmt(r.montant_estime)} FCFA`)
                                  : '-'}
                              </td>
                              <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {isAbsence ? (
                                  <span style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    Absences justifiées
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{r.action_demandee} (Manuel)</span>
                                )}
                                <button
                                  onClick={() => {
                                    let parsedDates = '';
                                    try {
                                      if (r.description && r.description.startsWith('{')) {
                                        const custom = JSON.parse(r.description);
                                        parsedDates = custom.dates || '';
                                      }
                                    } catch(e) {}
                                    
                                    setNewReclamation({
                                      id: r.id,
                                      agent_id: r.agent_matricule,
                                      agent_name: r.agent_nom,
                                      motif: r.type_erreur || r.reclamation_categorie,
                                      jours: r.jours_concernes || 0,
                                      dates: parsedDates,
                                      montant: r.montant_estime || ''
                                    });
                                    setShowAddReclamationModal(true);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                                  title="Modifier cette réclamation"
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                                >
                                  <Edit3 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            );
          })()}


          {/* ═══════════ JOURNAL DE PAIE ═══════════ */}
          {activeTab === 'journal' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h3 style={{ margin: 0 }}>Livre de Paie & Exports</h3>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                    <button
                      onClick={() => setJournalMode('actuel')}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: journalMode === 'actuel' ? 'var(--primary)' : 'transparent', color: journalMode === 'actuel' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Actuel
                    </button>
                    <button
                      onClick={() => setJournalMode('archives')}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: journalMode === 'archives' ? 'var(--primary)' : 'transparent', color: journalMode === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Archive size={14} /> Archives
                    </button>
                  </div>
                  {journalMode === 'archives' && (
                    <select 
                      className="form-input" 
                      style={{ width: '150px' }} 
                      value={journalSelectedArchive} 
                      onChange={(e) => setJournalSelectedArchive(e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {journalArchivedPeriods.map(p => (
                        <option key={p} value={p}>{fmtPeriod(p)}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} /><input type="text" className="form-input" placeholder="Rechercher un agent..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px', minWidth: '250px' }} /></div>
                  <button className="btn btn-primary" onClick={handleExportJournal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Export Total</button>
                </div>
              </div>

              {/* Bannière statut mois en cours (mode Actuel) */}
              {journalMode === 'actuel' && journalCurrentPeriod && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', borderRadius: '8px', marginBottom: '12px',
                  background: journalIsCloture ? 'rgba(34,197,94,0.06)' : 'rgba(251,191,36,0.06)',
                  border: journalIsCloture ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(251,191,36,0.2)'
                }}>
                  <span style={{ fontSize: '1.05rem' }}>{journalIsCloture ? '✅' : '🔄'}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: journalIsCloture ? '#22c55e' : '#fbbf24', fontSize: '0.85rem' }}>
                      {fmtPeriod(journalCurrentPeriod)} — {journalIsCloture ? 'Clôturé' : 'En cours de traitement'}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                      {journalIsCloture
                        ? 'Ce mois a été officiellement clôturé par le comptable. Les données sont définitives.'
                        : 'Données figées au moment de la publication du pointage. En attente de clôture par le comptable.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Contenu Actuel : bannière et données SI clôturé */}
              {journalMode === 'actuel' && (
                !journalCurrentPeriod ? (
                  <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                    <p style={{ fontSize: '1.1rem' }}>Aucune période publiée.<br />Publiez d'abord un pointage depuis le module Pointage.</p>
                  </div>
                ) : (
                  <>
                    {!journalIsCloture ? (
                      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                        <div className="animate-hourglass" style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 10px 0', color: '#fbbf24' }}>
                          {fmtPeriod(journalCurrentPeriod)} — En cours de traitement
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                          Les données de paie sont en cours de traitement par le comptable. Elles apparaîtront ici une fois le mois officiellement clôturé.
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                          <span className="animate-hourglass">⏳</span>
                          <span>En attente de clôture par le comptable</span>
                        </div>
                      </div>
                    ) : (
                      <>


                        {journalActuelLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
                          </div>
                        ) : (
                          <div className="table-container" style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                            <table className="custom-table" style={{ fontSize: '1rem' }}><thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}><tr>
                            <th style={{ width: '100%', padding: '8px 16px' }}>Agent</th>
                            <th style={{ textAlign: 'left', width: '1%', padding: '8px 16px' }}>Site</th>
                            <th style={{ textAlign: 'left', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Fonction</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Base</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#ef4444', padding: '8px 16px' }} title="Absences / Sanctions">Abs/S.</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#f97316', padding: '8px 16px' }} title="Ponctions Manuelles">Ponct.</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Primes et Gains divers">+Gains</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#22c55e', padding: '8px 16px' }} title="Prime de Site">Prime Site</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#10b981', padding: '8px 16px' }}>Brut</th>
                            {isColActive('enable_cnps_salarial') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="CNPS Salarial">CNPS</th>}
                            {isColActive('enable_cmu_employe') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="CMU Salarial">CMU</th>}
                            {isColActive('enable_its') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>ITS</th>}
                            {isColActive('enable_accidents_travail') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Accident du Travail">AT</th>}
                            {isColActive('enable_fdfp') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>FDFP</th>}
                            {isColActive('enable_taxe_apprentissage') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Apprentissage">Appr.</th>}
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Avances et Prêts">Prêts</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#3b82f6', padding: '8px 16px' }} title="Réclamations">Récl.</th>
                            <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: 'var(--a)', padding: '8px 16px' }}>Net</th>
                            <th style={{ textAlign: 'center', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Moyen de Paiement">Paiem.</th>
                          </tr></thead><tbody>
                            {journalActuelData.filter(s =>
                              (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                            ).map(s => {
                              const p = calculatePayslip(s);
                              const profileData = parseProfileData(s.profile_data);
                              const pm = profileData.payment_method || 'Especes';
                              let PaymentIcon = null;
                              let PaymentText = '-';
                              if (pm === 'MONEY' || pm === 'Mobile Money') {
                                PaymentIcon = <Smartphone size={14} color="#f97316" title="Mobile Money" style={{ marginLeft: '6px' }} />;
                                PaymentText = profileData.payment_operator || 'MONEY';
                              } else if (pm === 'BANQUE' || pm === 'Virement Bancaire') {
                                PaymentIcon = <Building size={14} color="#3b82f6" title="Virement Bancaire" style={{ marginLeft: '6px' }} />;
                                PaymentText = `Banque (${profileData.payment_bank_name || '...'})`;
                              } else {
                                PaymentText = (pm === 'Especes' || pm === 'NON DEFINI') ? 'AUCUN' : pm;
                              }
                              return (<tr key={s.id}>
                                <td style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setAgentActionModal(s)} title="Cliquez pour choisir une action (Paiement ou Fiche)">
                                  {s.name}
                                  {s.site_location === 'interieur' && <img src={flagUrl} width="16" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'contain' }}/>}
                                  {PaymentIcon}
                                </td>
                                <td style={{ textAlign: 'left', padding: '6px 16px', color: 'var(--muted)', lineHeight: '1.2' }}>
                                  <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{s.archive_site || s.site}</div>
                                  <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>{s.archive_zone || s.subsite || (s.site_location === 'interieur' ? 'Intérieur' : 'Abidjan')}</div>
                                </td>
                                <td style={{ textAlign: 'left', padding: '6px 16px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{funcLabel(s.function)}</td>
                                <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.salaireBase)}</td>
                                <td style={{ textAlign: 'right', color: '#ef4444', padding: '6px 16px' }}>{fmt(p.retenuesAbsences + p.retenuesSanctions)}</td>
                                <td style={{ textAlign: 'right', color: '#f97316', padding: '6px 16px' }}>{fmt(p.montantPonctions)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--b)', padding: '6px 16px' }}>{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS + p.gainsCostume)}</td>
                                <td style={{ textAlign: 'right', color: '#22c55e', padding: '6px 16px' }}>{fmt(p.primeSite)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', padding: '6px 16px' }}>{fmt(p.salaireBrut)}</td>
                                {isColActive('enable_cnps_salarial') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.cnpsSalarial)}</td>}
                                {isColActive('enable_cmu_employe') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.cmuEmploye)}</td>}
                                {isColActive('enable_its') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.impotsTaxes)}</td>}
                                {isColActive('enable_accidents_travail') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.accidentsTravail)}</td>}
                                {isColActive('enable_fdfp') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.taxeFormation)}</td>}
                                {isColActive('enable_taxe_apprentissage') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.taxeApprentissage)}</td>}
                                <td style={{ textAlign: 'right', color: '#f97316', padding: '6px 16px' }}>{fmt(p.totalDeductionsNettes)}</td>
                                <td style={{ textAlign: 'right', color: '#3b82f6', padding: '6px 16px' }}>+{fmt(p.montantReclamations)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--a)', padding: '6px 16px' }}>{fmt(p.netAPayer)}</td>
                                <td style={{ textAlign: 'center', color: 'var(--muted)', padding: '6px 16px', fontSize: '0.85rem' }}>{PaymentText}</td>
                              </tr>);
                            })}
                          </tbody></table>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )
              )}

              {/* Contenu Archives */}
              {journalMode === 'archives' && (
                journalArchiveLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
                  </div>
                ) : !journalSelectedArchive ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>🗄️</div>
                    <p>Aucune archive disponible. Les mois précédents apparaissent ici automatiquement.</p>
                  </div>
                ) : (
                <div className="table-container" style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '1rem' }}><thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}><tr>
                  <th style={{ width: '100%', padding: '8px 16px' }}>Agent</th>
                  <th style={{ textAlign: 'left', width: '1%', padding: '8px 16px' }}>Site</th>
                  <th style={{ textAlign: 'left', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Fonction</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Base</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#ef4444', padding: '8px 16px' }}>Abs/S.</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>+Gains</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#22c55e', padding: '8px 16px' }}>Prime Site</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#10b981', padding: '8px 16px' }}>Brut</th>
                  {isColActive('enable_cnps_salarial') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>CNPS</th>}
                  {isColActive('enable_cmu_employe') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>CMU</th>}
                  {isColActive('enable_its') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>ITS</th>}
                  {isColActive('enable_accidents_travail') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>AT</th>}
                  {isColActive('enable_fdfp') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>FDFP</th>}
                  {isColActive('enable_taxe_apprentissage') && <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Appr.</th>}
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }}>Prêts</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: '#3b82f6', padding: '8px 16px' }}>Récl.</th>
                  <th style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap', color: 'var(--a)', padding: '8px 16px' }}>Net</th>
                  <th style={{ textAlign: 'center', width: '1%', whiteSpace: 'nowrap', padding: '8px 16px' }} title="Moyen de Paiement">Paiem.</th>
                </tr></thead><tbody>
                  {(journalArchiveDetail?.salaries || []).filter(s =>
                    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(s => {
                    const p = calculatePayslip(s);
                    const profileData = parseProfileData(s.profile_data);
                    const pm = profileData.payment_method || 'Especes';
                    let PaymentIcon = null;
                    let PaymentText = '-';
                    if (pm === 'MONEY' || pm === 'Mobile Money') {
                      PaymentIcon = <Smartphone size={14} color="#f97316" title="Mobile Money" style={{ marginLeft: '6px' }} />;
                      PaymentText = profileData.payment_operator || 'MONEY';
                    } else if (pm === 'BANQUE' || pm === 'Virement Bancaire') {
                      PaymentIcon = <Building size={14} color="#3b82f6" title="Virement Bancaire" style={{ marginLeft: '6px' }} />;
                      PaymentText = `Banque (${profileData.payment_bank_name || '...'})`;
                    } else {
                      PaymentText = pm === 'Especes' ? 'AUCUN' : pm;
                    }
                    return (<tr key={s.id}>
                      <td style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setAgentActionModal(s)} title="Cliquez pour choisir une action (Paiement ou Fiche)">
                        {s.name}
                        {s.site_location === 'interieur' && <img src={flagUrl} width="16" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'contain' }}/>}
                        {PaymentIcon}
                      </td>
                      <td style={{ textAlign: 'left', padding: '6px 16px', color: 'var(--muted)', lineHeight: '1.2' }}>
                        <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{s.archive_site || s.site}</div>
                        <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>{s.archive_zone || s.subsite || (s.site_location === 'interieur' ? 'Intérieur' : 'Abidjan')}</div>
                      </td>
                      <td style={{ textAlign: 'left', padding: '6px 16px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{funcLabel(s.function)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.salaireBase)}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', padding: '6px 16px' }}>{fmt(p.retenuesAbsences + p.retenuesSanctions)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--b)', padding: '6px 16px' }}>{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS + p.gainsCostume)}</td>
                      <td style={{ textAlign: 'right', color: '#22c55e', padding: '6px 16px' }}>{fmt(p.primeSite)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', padding: '6px 16px' }}>{fmt(p.salaireBrut)}</td>
                      {isColActive('enable_cnps_salarial') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.cnpsSalarial)}</td>}
                      {isColActive('enable_cmu_employe') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.cmuEmploye)}</td>}
                      {isColActive('enable_its') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.impotsTaxes)}</td>}
                      {isColActive('enable_accidents_travail') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.accidentsTravail)}</td>}
                      {isColActive('enable_fdfp') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.taxeFormation)}</td>}
                      {isColActive('enable_taxe_apprentissage') && <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(p.taxeApprentissage)}</td>}
                      <td style={{ textAlign: 'right', color: '#f97316', padding: '6px 16px' }}>{fmt(p.totalDeductionsNettes)}</td>
                      <td style={{ textAlign: 'right', color: '#3b82f6', padding: '6px 16px' }}>+{fmt(p.montantReclamations)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--a)', padding: '6px 16px' }}>{fmt(p.netAPayer)}</td>
                      <td style={{ textAlign: 'center', color: 'var(--muted)', padding: '6px 16px', fontSize: '0.85rem' }}>{PaymentText}</td>
                    </tr>);
                  })}
                </tbody></table>
              </div>
              ))}
            </div>
          )}

          {/* ═══════════ PORTAIL EMPLOYÉ ═══════════ */}
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
                      <div style={{ background: 'var(--primary)', padding: '40px 20px 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Espace Agent</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>{s.name}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{funcLabel(s.function)} • {s.site} {s.site_location === 'interieur' && <img src={flagUrl} width="14" alt="Côte d'Ivoire" title="Site de l'Intérieur" style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'contain' }}/>}</div>
                          </div>
                          <div style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fingerprint size={20} /></div>
                        </div>
                      </div>
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

          {activeTab === 'paiements' && (() => {
            const groups = ['Wave', 'MTN Money', 'Moov Money', 'Orange Money', 'BANQUE', 'NON DEFINI'];
            const groupedAgents = {};
            const numbersFreq = {};
            groups.forEach(g => groupedAgents[g] = []);

            filteredSalaries.forEach(s => {
              let prof = {};
              try { prof = typeof s.profile_data === 'string' ? JSON.parse(s.profile_data) : (s.profile_data || {}); } catch(e){}
              const meth = prof.payment_method;
              const op = prof.payment_operator;
              
              if (meth === 'MONEY' && prof.payment_number) {
                 const n = prof.payment_number.replace(/\D/g, '');
                 if (n) numbersFreq[n] = (numbersFreq[n] || 0) + 1;
              }
              
              if (!meth || (meth !== 'MONEY' && meth !== 'BANQUE')) {
                groupedAgents['NON DEFINI'].push(s);
              } else if (meth === 'BANQUE') {
                groupedAgents['BANQUE'].push(s);
              } else if (meth === 'MONEY' && groups.includes(op)) {
                groupedAgents[op].push(s);
              } else {
                groupedAgents['NON DEFINI'].push(s);
              }
            });

            return (
              <div className="glass-panel printable-section" style={{ animation: 'slideUp 0.3s ease-out', background: 'var(--card-bg)' }}>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={20} color="var(--a)" /> Moyens de Paiements</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                      <input type="text" className="form-input" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                    </div>
                    {(() => {
                      const handleExportPayments = async () => {
                        const currentAgents = groupedAgents[activePaymentTab];
                        if (!currentAgents || currentAgents.length === 0) return alert('Aucun agent dans cette liste.');
                        
                        const workbook = new ExcelJS.Workbook();
                        const worksheet = workbook.addWorksheet('Paiements ' + activePaymentTab);

                        worksheet.columns = [
                          { header: 'Nom Complet', key: 'name', width: 30 },
                          { header: 'Poste', key: 'function', width: 25 },
                          { header: 'Site', key: 'site', width: 25 },
                          { header: 'Net à Payer (FCFA)', key: 'net', width: 20 },
                          { header: 'Moyen de Paiement', key: 'method', width: 20 },
                          { header: 'Numéro de Compte', key: 'numero', width: 20 },
                          { header: 'Nom de la Banque', key: 'banque', width: 20 }
                        ];

                        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
                        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

                        currentAgents.forEach(s => {
                          let prof = {};
                          if (typeof s.profile_data === 'string') {
                            try { prof = JSON.parse(s.profile_data); } catch(e){}
                          } else if (typeof s.profile_data === 'object' && s.profile_data !== null) {
                            prof = s.profile_data;
                          }
                          const isBanque = prof.payment_method === 'BANQUE';
                          const num = isBanque ? prof.payment_rib : prof.payment_number;
                          const bankName = isBanque ? prof.payment_bank_name : '';
                          const ps = calculatePayslip(s);
                          const net = Math.round(ps.netAPayer);
                          
                          worksheet.addRow({
                            name: s.name || '',
                            function: s.function || '',
                            site: s.site || '',
                            net: net,
                            method: activePaymentTab,
                            numero: num || '',
                            banque: bankName || ''
                          });
                        });
                        
                        // Appliquer des bordures et alignement
                        worksheet.eachRow((row, rowNumber) => {
                          row.eachCell((cell) => {
                            cell.border = {
                              top: { style: 'thin' },
                              left: { style: 'thin' },
                              bottom: { style: 'thin' },
                              right: { style: 'thin' }
                            };
                            if (rowNumber > 1) {
                              cell.alignment = { vertical: 'middle', horizontal: 'center' };
                            }
                          });
                        });
                        
                        // Formatter la colonne net avec séparateurs de milliers
                        worksheet.getColumn('net').numFmt = '#,##0';
                        worksheet.getColumn('net').eachCell((cell, rowNumber) => {
                          if (rowNumber > 1) {
                            cell.alignment = { vertical: 'middle', horizontal: 'right' };
                            cell.font = { bold: true, color: { argb: 'FF16A34A' } }; // vert pour les montants
                          }
                        });
                        
                        const buffer = await workbook.xlsx.writeBuffer();
                        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", `Paiements_${activePaymentTab}_${period}.xlsx`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };
                      return (
                        <button onClick={handleExportPayments} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f59e0b', border: 'none', color: 'white' }}>
                          <Download size={16} /> Exporter {activePaymentTab}
                        </button>
                      );
                    })()}
                    <button onClick={() => setShowPaymentAuditModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#8b5cf6', border: 'none', color: 'white' }}>
                      <ShieldCheck size={16} /> Auditer les profils
                    </button>
                    <button onClick={() => setShowPaymentImportModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#38bdf8', border: 'none', color: 'white' }}>
                      <DownloadCloud size={16} /> Importer (Excel)
                    </button>
                    <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#22c55e', border: 'none', color: 'white' }}>
                      <Printer size={16} /> Imprimer (PDF)
                    </button>
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  {groups.map(group => {
                    const count = groupedAgents[group].length;
                    const groupColor = group === 'Wave' ? '#3b82f6' : group === 'MTN Money' ? '#eab308' : group === 'Orange Money' ? '#f97316' : group === 'Moov Money' ? '#22c55e' : group === 'BANQUE' ? '#8b5cf6' : '#94a3b8';
                    const isActive = activePaymentTab === group;
                    
                    return (
                      <button
                        key={group}
                        onClick={() => setActivePaymentTab(group)}
                        style={{
                          background: isActive ? `${groupColor}20` : 'transparent',
                          color: isActive ? groupColor : 'var(--muted)',
                          border: `1px solid ${isActive ? groupColor : 'rgba(255,255,255,0.1)'}`,
                          padding: '8px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: isActive ? 'bold' : '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {group === 'BANQUE' ? <Building size={16} /> : <Smartphone size={16} />}
                        {group} <span style={{ background: isActive ? groupColor : 'rgba(255,255,255,0.1)', color: isActive ? 'white' : 'var(--muted)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                
                <div className="print-only" style={{ display: 'none' }}>
                  <h2 style={{ color: '#1d4ed8', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px', fontSize: '1.3rem' }}>Liste des Moyens de Paiements - {(() => { const p = period.split('-'); if (p.length === 2) { const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1); const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); } return period; })()}</h2>
                </div>
                
                <div className="table-container">
                  {groups.map(group => {
                    const groupAgents = groupedAgents[group];
                    
                    if (groupAgents.length === 0) return null;
                    
                    // Dans la vue écran, on n'affiche que l'onglet actif. Mais à l'impression, on affiche tous les groupes ou seulement l'actif ?
                    // On va afficher seulement l'onglet actif pour l'écran et l'impression pour rester cohérent, ou bien tout à l'impression ?
                    // Le user a demandé "je veux que chaque moyens de paiement ai son interface a lui". 
                    // Donc s'il imprime, il veut sûrement imprimer la vue courante.
                    const isVisible = activePaymentTab === group;
                    
                    const groupColor = group === 'Wave' ? '#3b82f6' : group === 'MTN Money' ? '#eab308' : group === 'Orange Money' ? '#f97316' : group === 'Moov Money' ? '#22c55e' : group === 'BANQUE' ? '#8b5cf6' : '#94a3b8';
                    
                    return (
                      <div key={group} style={{ marginBottom: '30px', display: isVisible ? 'block' : 'none' }} className={isVisible ? "print-avoid-break" : "no-print"}>
                        <h4 style={{ color: groupColor, borderBottom: `2px solid ${groupColor}50`, paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {group === 'BANQUE' ? <Building size={18} /> : <Smartphone size={18} />}
                          {group} ({groupAgents.length})
                        </h4>
                        <table className="custom-table print-friendly" style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead><tr>
                            <th style={{ width: '30%', textAlign: 'center', padding: '10px 12px' }}>Agent</th>
                            <th style={{ width: '15%', textAlign: 'center', padding: '10px 12px' }}>Poste</th>
                            <th style={{ width: '25%', textAlign: 'center', padding: '10px 12px' }}>Site</th>
                            <th style={{ width: '30%', textAlign: 'center', padding: '10px 12px' }}>Détails de paiement</th>
                          </tr></thead>
                          <tbody>
                            {groupAgents.map(s => {
                              let prof = {};
                              try { prof = typeof s.profile_data === 'string' ? JSON.parse(s.profile_data) : (s.profile_data || {}); } catch(e){}
                              
                              return (
                                <tr key={s.id}>
                                  <td style={{ fontWeight: 'bold', textAlign: 'center', padding: '10px 12px' }} className="print-text-black">{s.name}</td>
                                  <td style={{ textAlign: 'center', padding: '10px 12px' }} className="print-text-black">{funcLabel(s.function)}</td>
                                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                                    <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '12px', 
                                      fontSize: '0.8rem', 
                                      background: 'rgba(255,255,255,0.05)', 
                                      color: 'var(--muted)' 
                                    }}>
                                      {s.subsite || s.site || 'N/A'}
                                    </span>
                                  </td>
                                  <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                      {group === 'BANQUE' ? (
                                        <span style={{ color: 'var(--a)' }} className="print-text-black">
                                          <Building size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>
                                          {prof.payment_bank_name} - {prof.payment_rib}
                                        </span>
                                      ) : group === 'NON DEFINI' ? (
                                        <span style={{ color: 'var(--muted)', fontStyle: 'italic' }} className="print-text-black">Non défini</span>
                                      ) : (
                                        <span style={{ color: 'white', fontWeight: 'bold', letterSpacing: '1px' }} className="print-text-black">{prof.payment_number}</span>
                                      )}
                                      {prof.payment_method === 'MONEY' && prof.payment_number && numbersFreq[prof.payment_number.replace(/\D/g, '')] > 1 && (
                                        <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                          <AlertTriangle size={12}/> Doublon détecté
                                        </div>
                                      )}
                                    </div>
                                      <button 
                                        className="no-print"
                                        title="Modifier le moyen de paiement" 
                                        onClick={() => setPaymentMethodModal(s)} 
                                        style={{ 
                                          background: 'rgba(16, 185, 129, 0.1)', 
                                          color: '#10b981', 
                                          border: '1px solid rgba(16, 185, 129, 0.3)', 
                                          padding: '4px 10px', 
                                          borderRadius: '6px', 
                                          cursor: 'pointer', 
                                          fontWeight: 'bold',
                                          fontSize: '0.8rem',
                                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                      onMouseEnter={(e) => { 
                                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; 
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                      }}
                                      onMouseLeave={(e) => { 
                                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; 
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      Modifier
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {activeTab === 'masse_salariale' && (() => {
            const masseHeaderLeft = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadVirementsOrder}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  <Download size={18} /> Télécharger l'ordre de virements
                </button>
                {editingDomBanque ? (
                  <input
                    type="text"
                    autoFocus
                    value={domBanque}
                    onChange={(e) => { setDomBanque(e.target.value); localStorage.setItem('pontage_dom_banque', e.target.value); }}
                    onBlur={() => setEditingDomBanque(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingDomBanque(false)}
                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.82rem', width: '90px', outline: 'none' }}
                  />
                ) : (
                  <span
                    onClick={() => setEditingDomBanque(true)}
                    title="Cliquer pour modifier la banque domiciliataire"
                    style={{ fontSize: '0.78rem', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}
                  >
                    <Edit3 size={12} /> POUR: {domBanque || 'BDU'}
                  </span>
                )}
              </div>
            );

            const masseHeaderRight = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdminSettings(true); }}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Paramétrer les signataires PDF"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => setMasseMode('actuel')}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: masseMode === 'actuel' ? 'var(--primary)' : 'transparent', color: masseMode === 'actuel' ? 'white' : 'var(--muted)' }}
                  >
                    Mois Actuel
                  </button>
                  <button
                    onClick={() => setMasseMode('archives')}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: masseMode === 'archives' ? 'var(--primary)' : 'transparent', color: masseMode === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Archive size={16} /> Archives
                  </button>
                </div>
                {masseMode === 'archives' && (
                  <select
                    value={masseSelectedArchive}
                    onChange={e => setMasseSelectedArchive(e.target.value)}
                    className="form-input"
                    style={{ minWidth: '200px' }}
                  >
                    <option value="">-- Choisir un mois archivé --</option>
                    {journalArchivedPeriods.map(p => (
                      <option key={p} value={p}>{fmtPeriod(p)}</option>
                    ))}
                  </select>
                )}
              </div>
            );

            const showMasseSalariale = !(
              masseArchiveLoading || 
              (masseMode === 'archives' && !masseSelectedArchive) || 
              (masseMode === 'actuel' && !journalCurrentPeriod) || 
              (masseMode === 'actuel' && !journalIsCloture) || 
              salariesLoading
            );

            return (
              <div>
                {!showMasseSalariale && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    {masseHeaderRight}
                  </div>
                )}
                
                {/* Bannière statut mois en cours (mode Actuel seulement) */}
                {masseMode === 'actuel' && journalCurrentPeriod && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '8px', marginBottom: '12px',
                    background: journalIsCloture ? 'rgba(34,197,94,0.06)' : 'rgba(251,191,36,0.06)',
                    border: journalIsCloture ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(251,191,36,0.2)'
                  }}>
                    <span style={{ fontSize: '1.05rem' }}>{journalIsCloture ? '✅' : '🔄'}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: journalIsCloture ? '#22c55e' : '#fbbf24', fontSize: '0.85rem' }}>
                        {fmtPeriod(journalCurrentPeriod)} — {journalIsCloture ? 'Clôturé' : 'En cours de traitement'}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                        {journalIsCloture
                          ? 'Ce mois a été officiellement clôturé par le comptable. Les données sont définitives.'
                          : 'Données figées au moment de la publication du pointage. En attente de clôture par le comptable.'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Contenu */}
                {masseArchiveLoading ? (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px' }} /><br/>Chargement de l'archive...
                  </div>
                ) : masseMode === 'archives' && !masseSelectedArchive ? (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Archive size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p>Sélectionnez un mois archivé ci-dessus pour afficher la masse salariale correspondante.</p>
                  </div>
                ) : masseMode === 'actuel' && !journalCurrentPeriod ? (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                    <p style={{ fontSize: '1.1rem' }}>Aucune période publiée.<br />Publiez d'abord un pointage depuis le module Pointage.</p>
                  </div>
                ) : masseMode === 'actuel' && !journalIsCloture ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <div className="animate-hourglass" style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 10px 0', color: '#fbbf24' }}>
                      {fmtPeriod(journalCurrentPeriod)} — En cours de traitement
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                      Les données de paie sont en cours de traitement par le comptable. Elles apparaîtront ici une fois le mois officiellement clôturé.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                      <span className="animate-hourglass">⏳</span>
                      <span>En attente de clôture par le comptable</span>
                    </div>
                  </div>
                ) : salariesLoading ? (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px' }} /><br/>Analyse de la masse salariale en cours...
                  </div>
                ) : (
                  <MasseSalariale pdfAdminTitle={adminTitleInput} pdfAdminName={adminNameInput} salaries={filteredSalaries.map(s => {
                    const stripEmoji = (str) => (str || '').replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{1F300}-\u{1F9FF}]|[\uFE0F\u20E3]/gu, '').trim();
                    const rawSite = s.archive_site || s.site;
                    const rawZone = s.archive_zone || s.subsite || (s.site_location === 'interieur' ? 'Intérieur' : 'Abidjan');
                    return {
                      ...s,
                      computedNet: calculatePayslip(s).netAPayer,
                      displaySite: `${stripEmoji(rawSite)} / ${stripEmoji(rawZone)}`,
                      displayZone: stripEmoji(rawZone),
                      displayFunction: funcLabel(s.function)
                    };
                  })} period={masseMode === 'archives' ? masseSelectedArchive : period} payrollSettings={payrollSettings} headerLeft={masseHeaderLeft} headerRight={masseHeaderRight} />
                )}
              </div>
            );
          })()}

          {activeTab === 'calcul' && (
            <div className="glass-panel" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Fiches de Paie</h3>

                {/* Toggle Actuel / Archives */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', gap: '2px' }}>
                  <button
                    onClick={() => setJournalMode('actuel')}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: journalMode === 'actuel' ? 'var(--primary)' : 'transparent', color: journalMode === 'actuel' ? 'white' : 'var(--muted)' }}
                  >
                    Actuel
                  </button>
                  <button
                    onClick={() => setJournalMode('archives')}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: journalMode === 'archives' ? 'var(--primary)' : 'transparent', color: journalMode === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Archive size={16} /> Archives
                  </button>
                </div>

                <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} /><input type="text" className="form-input" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px', maxWidth: '280px' }} /></div>
              </div>

              {/* SECTION ACTUEL */}
              {journalMode === 'actuel' && (
                !journalCurrentPeriod ? (
                  <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                    <p style={{ fontSize: '1.1rem' }}>Aucune période publiée.<br />Publiez d'abord un pointage depuis le module Pointage.</p>
                  </div>
                ) : (
                  <>
                    {!journalIsCloture ? (
                      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
                        <div className="animate-hourglass" style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 10px 0', color: '#fbbf24' }}>
                          {fmtPeriod(journalCurrentPeriod)} — En cours de traitement
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                          Les fiches de paie sont en cours de traitement par le comptable. Elles apparaîtront ici une fois le mois officiellement clôturé.
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                          <span className="animate-hourglass">⏳</span>
                          <span>En attente de clôture par le comptable</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                          <span style={{ fontSize: '1.3rem' }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.95rem' }}>
                              {fmtPeriod(journalCurrentPeriod)} — Clôturé
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                              Ce mois a été officiellement clôturé. Vous pouvez imprimer les fiches.
                            </div>
                          </div>
                        </div>

                        {journalActuelLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
                          </div>
                        ) : (
                          <div className="table-container"><table className="custom-table"><thead><tr>
                            <th>Agent</th><th style={{ textAlign: 'right' }}>Base</th><th style={{ textAlign: 'right', color: 'var(--b)' }}>+Gains</th><th style={{ textAlign: 'right', color: '#f97316' }}>-Absences</th><th style={{ textAlign: 'right', color: '#ef4444' }}>-MAP</th><th style={{ textAlign: 'right', color: '#8b5cf6' }}>-Perm.</th><th style={{ textAlign: 'right' }}>Brut</th><th style={{ textAlign: 'right', color: 'var(--danger)' }}>-Retenues</th><th style={{ textAlign: 'right', color: '#f97316' }}>-Ponct.</th><th style={{ textAlign: 'right', color: '#3b82f6' }}>+Récl.</th><th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th><th style={{ textAlign: 'center' }}>Actions RH</th>
                          </tr></thead><tbody>
                            {journalActuelData.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map((s, idx) => {
                              const p = calculatePayslip(s);
                              return (
                                <React.Fragment key={s.id || s.name || `salary-${idx}`}>
                                  <tr>
                                    <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                                    <td style={{ textAlign: 'right' }}>{fmt(p.salaireBase)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--b)' }}>+{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS + p.gainsCostume)}</td>
                                    <td style={{ textAlign: 'right', color: '#f97316' }}>-{fmt(p.retenuesAbsences)}</td>
                                    <td style={{ textAlign: 'right', color: '#ef4444' }}>-{fmt(p.retenuesSanctions)}</td>
                                    <td style={{ textAlign: 'right', color: '#8b5cf6' }}>-{fmt(p.retenuesPermissions)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.salaireBrut)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{fmt(p.totalRetenuesFiscales + p.totalDeductionsNettes)}</td>
                                    <td style={{ textAlign: 'right', color: '#f97316' }}>-{fmt(p.montantPonctions)}</td>
                                    <td style={{ textAlign: 'right', color: '#3b82f6' }}>+{fmt(p.montantReclamations)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--a)', fontSize: '1.1rem' }}>{fmt(p.netAPayer)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <button 
                                        title="Ouvrir le bulletin" 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          const dataToPrint = { agent: s, p, period: journalCurrentPeriod, payrollSettings, functions }; 
                                          window.payslip_print_data = dataToPrint; 
                                          try { 
                                            for (let i = localStorage.length - 1; i >= 0; i--) {
                                              const k = localStorage.key(i);
                                              if (k && (k.length > 100 || k.includes('map_selection_mode_') || k.includes('pontage_payroll_activeZone_'))) {
                                                localStorage.removeItem(k);
                                              }
                                            }
                                            localStorage.setItem('payslip_print_data', JSON.stringify(dataToPrint)); 
                                          } catch(err){ console.error(err); } 
                                          window.open(window.location.pathname + '?print_payslip=true', '_blank', 'opener'); 
                                        }} 
                                        style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                      >
                                        Ouvrir
                                      </button>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody></table></div>
                        )}
                      </>
                    )}
                  </>
                )
              )}

              {/* SECTION ARCHIVES */}
              {journalMode === 'archives' && (
                journalArchiveLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CalendarDays size={18} style={{ color: '#34d399' }} />
                        <select value={journalSelectedArchive} onChange={e => setJournalSelectedArchive(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          {journalArchivedPeriods.length === 0 && <option value="">Aucune archive</option>}
                          {journalArchivedPeriods.map(p => <option key={p} value={p} style={{ background: '#1e293b', color: 'white' }}>{fmtPeriod(p)}</option>)}
                        </select>
                      </div>
                    </div>

                    {!journalSelectedArchive ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>🗄️</div>
                        <p>Aucune archive disponible. Les mois précédents apparaissent ici automatiquement.</p>
                      </div>
                    ) : (
                      <div className="table-container"><table className="custom-table"><thead><tr>
                        <th>Agent</th><th style={{ textAlign: 'right' }}>Base</th><th style={{ textAlign: 'right', color: 'var(--b)' }}>+Gains</th><th style={{ textAlign: 'right', color: '#f97316' }}>-Absences</th><th style={{ textAlign: 'right', color: '#ef4444' }}>-MAP</th><th style={{ textAlign: 'right', color: '#8b5cf6' }}>-Perm.</th><th style={{ textAlign: 'right' }}>Brut</th><th style={{ textAlign: 'right', color: 'var(--danger)' }}>-Retenues</th><th style={{ textAlign: 'right', color: '#f97316' }}>-Ponct.</th><th style={{ textAlign: 'right', color: '#3b82f6' }}>+Récl.</th><th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th><th style={{ textAlign: 'center' }}>Actions RH</th>
                      </tr></thead><tbody>
                        {(journalArchiveDetail?.salaries || []).filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map((s, idx) => {
                          const p = calculatePayslip(s);
                          return (
                            <React.Fragment key={s.id || s.name || `salary-${idx}`}>
                              <tr>
                                <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                                <td style={{ textAlign: 'right' }}>{fmt(p.salaireBase)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--b)' }}>+{fmt(p.primeAnciennete + p.primeVariable + p.gainsHS + p.gainsCostume)}</td>
                                <td style={{ textAlign: 'right', color: '#f97316' }}>-{fmt(p.retenuesAbsences)}</td>
                                <td style={{ textAlign: 'right', color: '#ef4444' }}>-{fmt(p.retenuesSanctions)}</td>
                                <td style={{ textAlign: 'right', color: '#8b5cf6' }}>-{fmt(p.retenuesPermissions)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(p.salaireBrut)}</td>
                                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>-{fmt(p.totalRetenuesFiscales + p.totalDeductionsNettes)}</td>
                                <td style={{ textAlign: 'right', color: '#f97316' }}>-{fmt(p.montantPonctions)}</td>
                                <td style={{ textAlign: 'right', color: '#3b82f6' }}>+{fmt(p.montantReclamations)}</td>
                                <td style={{ textAlign: 'right', fontWeight: '900', color: 'var(--a)', fontSize: '1.1rem' }}>{fmt(p.netAPayer)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    title="Ouvrir le bulletin" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const dataToPrint = { agent: s, p, period: journalSelectedArchive, payrollSettings, functions }; 
                                      window.payslip_print_data = dataToPrint; 
                                      try { 
                                        for (let i = localStorage.length - 1; i >= 0; i--) {
                                          const k = localStorage.key(i);
                                          if (k && (k.length > 100 || k.includes('map_selection_mode_') || k.includes('pontage_payroll_activeZone_'))) {
                                            localStorage.removeItem(k);
                                          }
                                        }
                                        localStorage.setItem('payslip_print_data', JSON.stringify(dataToPrint)); 
                                      } catch(err){ console.error(err); } 
                                      window.open(window.location.pathname + '?print_payslip=true', '_blank', 'opener'); 
                                    }} 
                                    style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    Ouvrir
                                  </button>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody></table></div>
                    )}
                  </>
                )
              )}
            </div>
          )}
        </div>
      )}
      
      {agentActionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Action pour {agentActionModal.name}</h3>
              <button onClick={() => setAgentActionModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <style>{`
              .action-btn-hover {
                transition: all 0.2s ease-in-out;
              }
              .action-btn-hover:hover {
                transform: scale(1.03);
                filter: brightness(1.2);
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
              }
            `}</style>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary action-btn-hover"
                onClick={() => { setPaymentMethodModal(agentActionModal); setAgentActionModal(null); }}
                style={{ padding: '14px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}
              >
                <CreditCard size={20} /> Moyen de paiement
              </button>
              
              <button 
                className="btn action-btn-hover"
                onClick={() => { setPrintFicheModal(agentActionModal); setAgentActionModal(null); }}
                style={{ padding: '14px', fontSize: '1.1rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', justifyContent: 'center', gap: '10px' }}
              >
                <FileText size={20} /> Fiche de pointage
              </button>

              <button 
                className="btn action-btn-hover"
                onClick={async () => {
                  try {
                    await apiCall('set_nav_state', {
                      period: period,
                      agentName: agentActionModal.name,
                      siteName: agentActionModal.site,
                      agentId: agentActionModal.id,
                      agentData: agentActionModal,
                      source: 'salaries'
                    });
                  } catch (e) {
                    console.error("Erreur set_nav_state:", e);
                  }
                  if (typeof setView === 'function') {
                    setView('archives');
                    setAgentActionModal(null);
                  }
                }}
                style={{ padding: '14px', fontSize: '1.1rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '4px' }}
              >
                <Clock size={20} /> Voir le pointage
              </button>
            </div>
          </div>
        </div>
      )}

      {printFicheModal && (
        <PrintFicheModal
          agent={printFicheModal}
          period={period}
          payrollSettings={payrollSettings}
          reclamations={reclamations}
          onClose={() => setPrintFicheModal(null)}
          calculatePayslip={calculatePayslip}
          parseProfileData={parseProfileData}
          fmt={fmt}
        />
      )}
      
      {paymentMethodModal && (
        <PaymentMethodModal 
          agent={paymentMethodModal} 
          onClose={() => setPaymentMethodModal(null)} 
          onSubmit={handleSavePaymentMethod} 
        />
      )}

      {showAddReclamationModal && (
        <ReclamationModal
          newReclamation={newReclamation}
          setNewReclamation={setNewReclamation}
          showReclamationSuggestions={showReclamationSuggestions}
          setShowReclamationSuggestions={setShowReclamationSuggestions}
          salariesLoading={salariesLoading}
          salaries={salaries}
          isAutoCalculatedMotif={isAutoCalculatedMotif}
          isPastErrorMotif={isPastErrorMotif}
          showAbsentCalendar={showAbsentCalendar}
          setShowAbsentCalendar={setShowAbsentCalendar}
          showPastCalendar={showPastCalendar}
          setShowPastCalendar={setShowPastCalendar}
          pastErrorMonth={pastErrorMonth}
          setPastErrorMonth={setPastErrorMonth}
          pastErrorYear={pastErrorYear}
          setPastErrorYear={setPastErrorYear}
          checkedDates={checkedDates}
          setCheckedDates={setCheckedDates}
          handleToggleAbsentDate={handleToggleAbsentDate}
          absentDatesList={absentDatesList}
          reclamations={reclamations}
          isMontantLocked={isMontantLocked}
          setIsMontantLocked={setIsMontantLocked}
          setShowAddReclamationModal={setShowAddReclamationModal}
          handleSaveReclamation={handleSaveReclamation}
          isEditMode={!!newReclamation.id}
        />
      )}

      {viewDatesModal && (() => {
        let custom = {};
        try { if (viewDatesModal.description && viewDatesModal.description.startsWith('{')) custom = JSON.parse(viewDatesModal.description); } catch(e) {}
        const recDates = viewDatesModal._computedDatesString || custom.dates || viewDatesModal.dates || String(viewDatesModal.jours_concernes || '');
        const matches = recDates.match(/\d+/g);
        const datesArray = matches ? matches : [];

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Dates Concernées</h3>
                <button onClick={() => setViewDatesModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              {datesArray.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                  {datesArray.map((date, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', textAlign: 'center', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                      {date}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>Aucune date spécifique enregistrée.</div>
              )}

              <div style={{ marginTop: '24px' }}>
                <button 
                  className="btn" 
                  onClick={() => setViewDatesModal(null)} 
                  style={{ width: '100%', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', justifyContent: 'center', textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL AJOUT PRÊT */}
      {showAddPretModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '40px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#f43f5e', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PiggyBank size={24} /> Nouvelle demande de prêt
              </h2>
              <button onClick={() => setShowAddPretModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', background: 'rgba(244,63,94,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div style={{ position: 'relative' }}><label className="form-label">Nom de l'agent</label>
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
              <div><label className="form-label">Montant (XOF)</label>
                <input type="number" className="form-input" value={newLoan.amount} onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} placeholder="Ex: 50000" style={{ width: '100%' }} />
              </div>
              <div><label className="form-label">Motif du prêt</label>
                <input type="text" className="form-input" value={newLoan.motif} onChange={e => setNewLoan({ ...newLoan, motif: e.target.value })} placeholder="Ex: Scolarité..." style={{ width: '100%' }} />
              </div>
              <div><label className="form-label">Modalité</label>
                <select className="form-input" value={newLoan.modality} onChange={e => setNewLoan({ ...newLoan, modality: e.target.value })} style={{ width: '100%' }}>
                  <option value="mensualite">Mensualité</option>
                  <option value="totalite">Tout en une fois</option>
                </select>
              </div>
              {newLoan.modality === 'mensualite' && (
                <div><label className="form-label">Déduction/Mois</label>
                  <input type="number" className="form-input" value={newLoan.monthly_deduction} onChange={e => setNewLoan({ ...newLoan, monthly_deduction: e.target.value })} placeholder="Ex: 10000" style={{ width: '100%' }} />
                </div>
              )}
              <div><label className="form-label">Date d'octroi</label>
                <input type="date" className="form-input" value={newLoan.date_granted} onChange={e => setNewLoan({ ...newLoan, date_granted: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div><label className="form-label">Mois de début</label>
                <input type="month" className="form-input" value={newLoan.start_period} onChange={e => setNewLoan({ ...newLoan, start_period: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
              <button className="btn" onClick={() => setShowAddPretModal(false)} style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}>Annuler</button>
              <button className="btn btn-primary" onClick={() => { handleAddLoan(); setShowAddPretModal(false); }} style={{ background: '#f43f5e', padding: '12px 24px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.5)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}><PiggyBank size={16} /> Accorder</button>
            </div>
          </div>
        </div>
      )}
      {showAdminSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }} onClick={() => setShowAdminSettings(false)}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '24px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(56,189,248,0.2)', padding: '10px', borderRadius: '12px', color: '#38bdf8' }}><Settings size={20} /></div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 'bold' }}>Signataire PDF</h3>
              </div>
              <button onClick={() => setShowAdminSettings(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Titre (ex: Administrateur)</label>
                <input type="text" className="form-input" value={adminTitleInput} onChange={e => setAdminTitleInput(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="form-label">Nom Complet</label>
                <input type="text" className="form-input" value={adminNameInput} onChange={e => setAdminNameInput(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
              <button className="btn" onClick={() => setShowAdminSettings(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>Annuler</button>
              <button className="btn btn-primary" onClick={() => { localStorage.setItem('pdfAdminTitle', adminTitleInput); localStorage.setItem('pdfAdminName', adminNameInput); setShowAdminSettings(false); }} style={{ padding: '12px 24px' }}><Save size={16} /> Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tab-btn{padding:9px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.3);color:var(--muted);display:flex;align-items:center;gap:6px;font-weight:600;transition:all .2s;cursor:pointer;font-size:0.9rem;white-space:nowrap}
        .tab-btn:hover{background:rgba(255,255,255,0.1);color:white}
        .tab-btn.active{background:var(--primary);color:white;box-shadow:0 4px 12px rgba(56,189,248,0.3)}
        .tab-label{display:inline}
        @media(max-width:900px){.tab-label{display:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media print{
          body * { visibility: hidden; }
          .printable-section, .printable-section * { visibility: visible; }
          .printable-section { position: absolute; left: 0; top: 0; width: 100%; color: black !important; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .printable-section h3, .printable-section h4 { color: black !important; border-bottom: 1px solid #ccc !important; }
          .printable-section .print-text-black { color: black !important; }
          .print-friendly { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .print-friendly th, .print-friendly td { border: 1px solid #ddd; padding: 8px; text-align: left; color: black !important; }
          .print-friendly th { background-color: #f3f4f6 !important; font-weight: bold; }
          .print-avoid-break { page-break-inside: avoid; }
          div[style*="background: white"] *{visibility:visible}
          div[style*="background: white"]{position:absolute;left:0;top:0;width:100%;box-shadow:none!important}
        }
      `}</style>
    </div>
  );
}
