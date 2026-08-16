import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Upload, ArrowRight, Check, AlertTriangle, X, Save, RefreshCw, Smartphone, Building2 } from 'lucide-react';
import FuzzyMatchModal from './FuzzyMatchModal';

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (a.length > b.length) {
    let tmp = a; a = b; b = tmp;
  }
  const row = new Array(a.length + 1);
  for (let i = 0; i <= a.length; i++) row[i] = i;
  for (let i = 1; i <= b.length; i++) {
    let prev = i;
    for (let j = 1; j <= a.length; j++) {
      let val;
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, Math.min(prev + 1, row[j] + 1));
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }
  return row[a.length];
};

const getSimilarity = (s1, s2) => {
  let longer = s1.toLowerCase().trim();
  let shorter = s2.toLowerCase().trim();
  if (s1.length < s2.length) { longer = s2.toLowerCase().trim(); shorter = s1.toLowerCase().trim(); }
  let longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - levenshteinDistance(longer, shorter)) / parseFloat(longerLength);
};

// Guess network based on prefix
const guessNetwork = (phone) => {
  const p = String(phone).replace(/\D/g, '');
  if (!p) return null;
  const prefix = p.substring(0, 2);
  if (['07', '08', '09'].includes(prefix)) return 'Orange Money';
  if (['05', '04', '06'].includes(prefix)) return 'MTN Money';
  if (['01', '02', '03'].includes(prefix)) return 'Moov Money';
  return 'Wave'; // Default fallback if format doesn't match perfectly
};

export default function PaymentImportModal({ salaries, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  
  const [mapping, setMapping] = useState({
    name: '',
    payment_method: '',
    account: '',
    bank_name: '',
    bank_code: '',
    agency_code: '',
    rib_key: ''
  });
  const [sniffed, setSniffed] = useState({ account: false, payment_method: false });
  
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [fuzzyModalData, setFuzzyModalData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    try {
      let headerRow = null;
      const dataRows = [];
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length > 0) {
          // Detect separator (comma or semicolon)
          const sep = lines[0].includes(';') ? ';' : ',';
          headerRow = lines[0].split(sep).map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(sep).map(v => v.trim());
            const rowData = {};
            headerRow.forEach((h, colIdx) => {
              rowData[h] = values[colIdx] || '';
            });
            if (Object.values(rowData).some(v => v)) dataRows.push(rowData);
          }
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];
        
        const allRawRows = [];
        worksheet.eachRow((row, rowNumber) => {
          const rowValues = [];
          for (let i = 1; i < row.values.length; i++) {
              let v = row.values[i];
              if (v === null || v === undefined) v = '';
              else if (typeof v === 'object') {
                  if (v.richText) v = v.richText.map(t => t.text || '').join('');
                  else if (v.result !== undefined) v = String(v.result || '');
                  else if (v.text !== undefined) v = String(v.text || '');
                  else v = String(v);
              } else {
                  v = String(v);
              }
              rowValues.push(v.trim());
          }
          allRawRows.push(rowValues);
        });

        let headerRowIndex = 0;
        let maxCols = 0;
        
        for (let i = 0; i < Math.min(10, allRawRows.length); i++) {
          const nonEmptyCount = allRawRows[i].filter(v => v !== '').length;
          if (nonEmptyCount > maxCols) {
            maxCols = nonEmptyCount;
            headerRowIndex = i;
          }
        }
        
        headerRow = allRawRows[headerRowIndex] || [];
        
        for (let i = headerRowIndex + 1; i < allRawRows.length; i++) {
           const rowValues = allRawRows[i];
           const rowData = {};
           let hasData = false;
           headerRow.forEach((header, colIdx) => {
             if (header) {
                const val = rowValues[colIdx] || '';
                rowData[header] = val;
                if (val !== '') hasData = true;
             }
           });
           if (hasData) dataRows.push(rowData);
        }
      }
      
      setHeaders(headerRow || []);
      setRows(dataRows);
      
      // Auto-guess mapping & Data Sniffing
      const newMapping = { name: '', payment_method: '', account: '', bank_name: '', bank_code: '', agency_code: '', rib_key: '', site: '', function: '' };
      const newSniffed = { account: false, payment_method: false };
      
      const safeHeaders = headerRow || [];
      
      // Etape A: Analyse agressive des en-têtes
      safeHeaders.forEach(h => {
        const lh = String(h).toLowerCase();
        if (lh.match(/(nom|agent|employé|salarié|nom complet|noms & prenoms|prénom|prenom)/i)) {
            newMapping.name = h;
        } else if (lh.match(/(moyen|type|m[eé]thode|r[eé]seau|op[eé]rateur)/i)) {
            newMapping.payment_method = h;
        } else if (lh.match(/(num|t[eé]l|compte|rib|contact|n°)/i) && !lh.match(/(cl[eé]|code)/i)) {
            newMapping.account = h;
        }
        
        // Nouveaux champs bancaires
        if (lh.match(/^(banque)$/i) || lh.match(/(nom banque)/i)) {
            newMapping.bank_name = h;
        }
        if (lh.match(/^(code)$/i) || lh.match(/(code banque|code bq)/i)) {
            newMapping.bank_code = h;
        }
        if (lh.match(/(code agc|agence|guichet)/i)) {
            newMapping.agency_code = h;
        }
        if (lh.match(/(cl[eé])/i)) {
            newMapping.rib_key = h;
        }
        if (lh.match(/(site|agence|lieu|localisation)/i)) {
            newMapping.site = h;
        }
        if (lh.match(/(fonction|poste|grade|titre)/i)) {
            newMapping.function = h;
        }
      });
      
      // Etape B: Sniffing des Données si nécessaire (Les 5 premières lignes)
      if (!newMapping.account && dataRows.length > 0) {
        // On cherche une colonne qui contient majoritairement des chiffres (téléphone, RIB)
        for (let h of safeHeaders) {
          if (newMapping.name === h) continue;
          let isNumericScore = 0;
          let samples = Math.min(5, dataRows.length);
          for (let i = 0; i < samples; i++) {
            let val = String(dataRows[i][h] || '').replace(/[\s\-\.]/g, '');
            if (val.match(/^\d{8,24}$/)) isNumericScore++;
          }
          if (isNumericScore >= Math.floor(samples / 2)) {
            newMapping.account = h;
            newSniffed.account = true;
            break;
          }
        }
      }
      
      setSniffed(newSniffed);
      setMapping(newMapping);
      setStep(2);
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier : " + err.message + "\\n\\nSi le fichier Excel ne passe pas, enregistrez-le au format .CSV (séparateur point-virgule) et importez-le à la place.");
    }
  };

  const generatePreview = () => {
    if (!mapping.name || !mapping.account) {
      return alert("Veuillez au moins mapper la colonne du Nom et du Numéro/Compte.");
    }

    setIsProcessing(true);
    setAnalysisProgress(0);
    
    setTimeout(() => {
      const results = [];
      const usedAccounts = new Set();
      
      const globalAccounts = new Map();
      const exactMatchMap = new Map();
      
      salaries.forEach(s => {
        const key = s.name.toLowerCase().trim();
        if (!exactMatchMap.has(key)) exactMatchMap.set(key, []);
        exactMatchMap.get(key).push(s);
        
        let pd = {};
        try { pd = typeof s.profile_data === 'string' ? JSON.parse(s.profile_data || '{}') : (s.profile_data || {}); } catch(e) {}
        if (pd.payment_number) {
          const num = String(pd.payment_number).replace(/[\s\-_:]/g, '');
          if (num) globalAccounts.set(num, s.id);
        }
        if (pd.payment_rib) {
          const num = String(pd.payment_rib).replace(/[\s\-_:]/g, '');
          if (num) globalAccounts.set(num, s.id);
        }
      });
      
      const CHUNK_SIZE = 100;
      let currentIndex = 0;
      
      const processChunk = () => {
        const endIndex = Math.min(currentIndex + CHUNK_SIZE, rows.length);
        
        for (let index = currentIndex; index < endIndex; index++) {
          const row = rows[index];
          let rawName = String(row[mapping.name] || '').trim();
          if (!rawName) continue;
          
          let bestMatch = null;
          let highestSim = 0;
          let matchStatus = 'not_found';
          
          let rawSite = mapping.site ? String(row[mapping.site] || '').trim() : '';
          let rawFunction = mapping.function ? String(row[mapping.function] || '').trim() : '';
          
          const lowerName = rawName.toLowerCase();
          if (exactMatchMap.has(lowerName)) {
            const matches = exactMatchMap.get(lowerName);
            if (matches.length === 1) {
              bestMatch = matches[0];
            } else {
              // Gestion des homonymes (ex: 2 RAPHAEL)
              let found = null;
              if (rawSite) {
                const searchSite = rawSite.toLowerCase();
                found = matches.find(m => {
                  const mSite = String(m.subsite || m.site || '').toLowerCase();
                  return mSite && (mSite.includes(searchSite) || searchSite.includes(mSite));
                });
              }
              // Par défaut, on prend le premier qui a un RIB s'il y en a un pour déclencher l'alerte, sinon le premier tout court
              if (!found) {
                 found = matches.find(m => {
                    let pd = {};
                    try { pd = typeof m.profile_data === 'string' ? JSON.parse(m.profile_data || '{}') : (m.profile_data || {}); } catch(e) {}
                    return pd.payment_number || pd.payment_rib;
                 });
              }
              bestMatch = found || matches[0];
            }
            highestSim = 1.0;
            matchStatus = 'exact';
          } else {
            salaries.forEach(s => {
              const sim = getSimilarity(rawName, s.name);
              if (sim > highestSim) {
                highestSim = sim;
                bestMatch = s;
              }
            });
            if (highestSim >= 0.85) matchStatus = 'exact';
            else if (highestSim >= 0.40) matchStatus = 'fuzzy';
            else bestMatch = null;
          }
          let account = String(row[mapping.account] || '').trim();
          let bc = mapping.bank_code ? String(row[mapping.bank_code] || '').trim() : '';
          let ac = mapping.agency_code ? String(row[mapping.agency_code] || '').trim() : '';
          let rk = mapping.rib_key ? String(row[mapping.rib_key] || '').trim() : '';
  
          // create a searchAccount without any spaces or dashes to match against the DB properly
          const searchAccount = account.replace(/[\s\-_:]/g, '');
          
          account = account.replace(/(?:\b|)(WAVE|MTN|ORANGE|MOOV|MONEY|BANQUE|IBAN)(?:\b|)/ig, '').trim();
          account = account.replace(/^[-_\s:]+|[-_\s:]+$/g, '');
          
          let pm = mapping.payment_method ? String(row[mapping.payment_method] || '').trim() : '';
          const lowerPm = pm.toLowerCase();
          let exactBankName = mapping.bank_name ? String(row[mapping.bank_name] || '').trim() : '';
          
          let finalPm = 'Wave'; // Default
          let digitCount = (account.match(/\d/g) || []).length;
          if (bc || ac) digitCount += (bc.match(/\d/g) || []).length + (ac.match(/\d/g) || []).length;
          
          if (lowerPm.includes('banque') || lowerPm.includes('virement') || exactBankName || account.match(/[a-zA-Z]/) || bc || ac || digitCount > 12) {
            finalPm = 'Virement Bancaire';
          } else if (lowerPm.includes('mtn')) {
            finalPm = 'MTN Money';
          } else if (lowerPm.includes('orange')) {
            finalPm = 'Orange Money';
          } else if (lowerPm.includes('moov')) {
            finalPm = 'Moov Money';
          } else if (lowerPm.includes('wave')) {
            finalPm = 'Wave';
          } else if (account) {
            const guessed = guessNetwork(account);
            if (guessed) finalPm = guessed;
          }
  
          let isDuplicate = false;
          if (account) {
            if (usedAccounts.has(account)) isDuplicate = true;
            usedAccounts.add(account);
          }
  
          let isGlobalDuplicate = false;
          let globalDuplicateAgentName = '';
          if (account && globalAccounts.has(account)) {
            const ownerId = globalAccounts.get(account);
            if (!bestMatch || ownerId !== bestMatch.id) {
              isGlobalDuplicate = true;
              const owner = salaries.find(s => s.id === ownerId);
              if (owner) globalDuplicateAgentName = owner.name;
            }
          }
  
          let isInvalidFormat = false;
          let invalidReason = '';
          
          if (finalPm !== 'Virement Bancaire') {
            const cleaned = account.replace(/\D/g, '');
            if (cleaned.length !== 10) {
              isInvalidFormat = true;
              invalidReason = `Numéro à ${cleaned.length} chiffres au lieu de 10.`;
            }
          } else {
            if (bc || ac || rk) {
               const cleanBc = bc.replace(/[^A-Z0-9]/gi, '');
               const cleanAc = ac.replace(/[^A-Z0-9]/gi, '');
               const cleanAcc = account.replace(/[^A-Z0-9]/gi, '');
               const cleanRk = rk.replace(/[^A-Z0-9]/gi, '');
               const errors = [];
               if (cleanBc.length !== 5) errors.push(`Banque (${cleanBc.length}/5)`);
               if (cleanAc.length !== 5) errors.push(`Agence (${cleanAc.length}/5)`);
               if (cleanAcc.length !== 12) errors.push(`Compte (${cleanAcc.length}/12)`);
               if (cleanRk.length !== 2) errors.push(`Clé (${cleanRk.length}/2)`);
               
               if (errors.length > 0) {
                 isInvalidFormat = true;
                 invalidReason = errors.join(', ');
               }
            } else {
               const cleanFull = account.replace(/[^A-Z0-9]/gi, '');
               if (cleanFull.length !== 24) {
                 isInvalidFormat = true;
                 invalidReason = `RIB complet ${cleanFull.length} carac. au lieu de 24.`;
               }
            }
          }
  
          // rawSite et rawFunction sont déjà extraits plus haut
          
          let hasExistingPayment = false;
          let existingPaymentStr = '';
          if (bestMatch) {
            let pd = {};
            try { pd = typeof bestMatch.profile_data === 'string' ? JSON.parse(bestMatch.profile_data || '{}') : (bestMatch.profile_data || {}); } catch(e) {}
            if (pd.payment_number || pd.payment_rib) {
               hasExistingPayment = true;
               existingPaymentStr = pd.payment_number ? `${pd.payment_method || 'Money'} - ${pd.payment_number}` : `BANQUE - ${pd.payment_rib}`;
            }
          }

          results.push({
            id: `row-${index}`,
            rawName,
            account,
            bc,
            ac,
            rk,
            rawSite,
            rawFunction,
            rawPm: pm,
            finalPm,
            exactBankName,
            matchedAgent: bestMatch,
            similarity: highestSim,
            matchStatus,
            isDuplicate,
            isInvalidFormat,
            invalidReason,
            isGlobalDuplicate,
            globalDuplicateAgentName,
            hasExistingPayment,
            existingPaymentStr,
            overrideExisting: false,
            validated: matchStatus === 'exact' && !isDuplicate && !isGlobalDuplicate && !isInvalidFormat && !hasExistingPayment
          });
        }
        
        currentIndex = endIndex;
        setAnalysisProgress(Math.round((currentIndex / rows.length) * 100));
        
        if (currentIndex < rows.length) {
          requestAnimationFrame(processChunk);
        } else {
          setPreviewData(results);
          setIsProcessing(false);
          setStep(3);
        }
      };
      
      requestAnimationFrame(processChunk);
    }, 100);
  };

  const handleAutoValidateAll = () => {
    setPreviewData(prev => prev.map(p => {
      if (p.matchStatus === 'fuzzy' && !p.isDuplicate && !p.isGlobalDuplicate && !p.isInvalidFormat) {
        return { ...p, validated: true };
      }
      return p;
    }));
  };

  const toggleValidation = (id) => {
    setPreviewData(prev => prev.map(p => {
      if (p.id === id) return { ...p, validated: !p.validated };
      return p;
    }));
  };

  const toggleOverride = (id) => {
    setPreviewData(prev => prev.map(p => {
      if (p.id === id) {
        const newOverride = !p.overrideExisting;
        return { 
          ...p, 
          overrideExisting: newOverride,
          validated: newOverride && p.matchStatus !== 'not_found' && !p.isDuplicate && !p.isGlobalDuplicate && !p.isInvalidFormat
        };
      }
      return p;
    }));
  };

  const handleFinalSave = async () => {
    const toSave = previewData.filter(p => p.validated && p.matchedAgent);
    if (toSave.length === 0) return alert("Aucune donnée validée à sauvegarder.");
    
    setIsProcessing(true);
    
    try {
      const payload = toSave.map(p => {
        // Préparer les données du profile
        let profile = {};
        try {
          profile = typeof p.matchedAgent.profile_data === 'string' ? JSON.parse(p.matchedAgent.profile_data || '{}') : (p.matchedAgent.profile_data || {});
        } catch(e) {}
        
        let updatedProfile = { ...profile };
        
        if (p.finalPm === 'Virement Bancaire') {
          updatedProfile.payment_method = 'BANQUE';
          updatedProfile.payment_rib = (p.bc || p.ac) ? `${p.bc}${p.ac}${p.account}${p.rk}` : p.account;
          updatedProfile.payment_bank_name = p.exactBankName || 'Banque (Importé)';
        } else {
          updatedProfile.payment_method = 'MONEY';
          updatedProfile.payment_number = p.account;
          updatedProfile.payment_operator = p.finalPm; 
          updatedProfile.payment_country = 'CI';
        }
        
        return {
          agent_id: p.matchedAgent.id,
          profile_data: updatedProfile
        };
      });
      
      // We pass the array back to the parent to execute the saves
      await onSave(payload);
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la préparation à la sauvegarde.");
      setIsProcessing(false);
    } 
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0' }}>
      <div className="glass-panel" style={{ width: '100vw', maxWidth: '100vw', padding: 0, background: '#0f172a', border: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Upload size={24} color="var(--primary)" />
            Importation Intelligente des Moyens de Paiement
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }} className="hover-bg">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? 'var(--primary)' : 'var(--muted)', fontWeight: step >= 1 ? 'bold' : 'normal' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: step >= 1 ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
              Upload Fichier
            </div>
            <ArrowRight size={16} color="var(--muted)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? 'var(--primary)' : 'var(--muted)', fontWeight: step >= 2 ? 'bold' : 'normal' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: step >= 2 ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
              Configuration
            </div>
            <ArrowRight size={16} color="var(--muted)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 3 ? 'var(--primary)' : 'var(--muted)', fontWeight: step >= 3 ? 'bold' : 'normal' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 3 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: step >= 3 ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              Audit & Vérification
            </div>
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                <Upload size={48} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Sélectionnez un fichier Excel</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
                Le fichier doit contenir au minimum une colonne avec le nom de l'agent et une colonne avec son numéro de téléphone ou RIB.
              </p>
              
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn" onClick={onClose} 
                  style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 24px', fontSize: '1.1rem', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)'; }} 
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} 
                  style={{ padding: '12px 24px', fontSize: '1.1rem', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', border: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.5)'; }} 
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Parcourir les fichiers
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '16px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Check size={20} color="#34d399" />
                <span>Fichier <strong>{fileName}</strong> chargé avec succès. Il contient {rows.length} lignes. Associez maintenant les colonnes.</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Nom Complet" <span style={{color: '#ef4444'}}>*</span></label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})}>
                    <option value="">Sélectionnez une colonne...</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <span>Colonne "Numéro / Compte" <span style={{color: '#ef4444'}}>*</span></span>
                    {sniffed.account && <span style={{ fontSize: '0.75rem', background: '#38bdf8', color: '#000', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>🤖 Détecté par IA</span>}
                  </label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.account} onChange={e => setMapping({...mapping, account: e.target.value})}>
                    <option value="">Sélectionnez une colonne...</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>Le numéro Wave, MTN, Orange, Moov ou RIB Bancaire.</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Opérateur" <span style={{color: 'var(--muted)', fontWeight: 'normal'}}>(Optionnel)</span></label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.payment_method} onChange={e => setMapping({...mapping, payment_method: e.target.value})}>
                    <option value="">Auto-détection (Préfixe du numéro)</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>Si non spécifié, le système déduira l'opérateur selon le numéro (05 MTN, 07 Orange, etc.) ou Wave par défaut.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Site / Agence" <span style={{color: 'var(--muted)', fontWeight: 'normal'}}>(Optionnel)</span></label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.site} onChange={e => setMapping({...mapping, site: e.target.value})}>
                    <option value="">Sélectionnez une colonne...</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>Aide l'IA à confirmer l'identité en cas d'homonymes ou de correspondances floues.</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Fonction / Poste" <span style={{color: 'var(--muted)', fontWeight: 'normal'}}>(Optionnel)</span></label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.function} onChange={e => setMapping({...mapping, function: e.target.value})}>
                    <option value="">Sélectionnez une colonne...</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>Aide l'IA à confirmer l'identité en comparant le métier.</p>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} />
                  Détails Bancaires (Optionnels)
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Si les coordonnées bancaires sont séparées en plusieurs colonnes, associez-les ici. Le système les fusionnera automatiquement pour créer le RIB complet.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>Nom de la Banque</label>
                    <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.bank_name} onChange={e => setMapping({...mapping, bank_name: e.target.value})}>
                      <option value="">Sélectionnez...</option>
                      {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>Code Banque</label>
                    <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.bank_code} onChange={e => setMapping({...mapping, bank_code: e.target.value})}>
                      <option value="">Sélectionnez...</option>
                      {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>Code Agence (Guichet)</label>
                    <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.agency_code} onChange={e => setMapping({...mapping, agency_code: e.target.value})}>
                      <option value="">Sélectionnez...</option>
                      {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.95rem' }}>Clé RIB</label>
                    <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.rib_key} onChange={e => setMapping({...mapping, rib_key: e.target.value})}>
                      <option value="">Sélectionnez...</option>
                      {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                    </select>
                  </div>
                  
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button className="btn" onClick={onClose} 
                  style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 24px', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)'; }} 
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >Annuler</button>
                <button className="btn" onClick={() => setStep(1)} 
                  style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }} 
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >Retour</button>
                <button className="btn btn-primary" onClick={generatePreview} disabled={isProcessing} 
                  style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', justifyContent: 'center', border: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.5)'; } }} 
                  onMouseLeave={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; } }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Analyse en cours... {analysisProgress}%
                    </>
                  ) : (
                    <>
                      <ArrowRight size={18} />
                      Lancer l'Audit IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={() => setFilterStatus(filterStatus === 'exact' ? 'all' : 'exact')}
                    style={{ 
                      background: 'rgba(52, 211, 153, 0.1)', 
                      border: `1px solid ${filterStatus === 'exact' ? '#34d399' : 'rgba(52, 211, 153, 0.3)'}`, 
                      padding: '10px 16px', borderRadius: '8px', color: '#34d399', fontWeight: 'bold',
                      cursor: 'pointer', outline: 'none', transition: 'all 0.2s', opacity: filterStatus === 'all' || filterStatus === 'exact' ? 1 : 0.4
                    }} className="hover-bg">
                    {previewData.filter(p => p.matchStatus === 'exact' && !p.isDuplicate && !p.isGlobalDuplicate).length} Exacts
                  </button>
                  <button 
                    onClick={() => setFilterStatus(filterStatus === 'fuzzy' ? 'all' : 'fuzzy')}
                    style={{ 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      border: `1px solid ${filterStatus === 'fuzzy' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'}`, 
                      padding: '10px 16px', borderRadius: '8px', color: '#f59e0b', fontWeight: 'bold',
                      cursor: 'pointer', outline: 'none', transition: 'all 0.2s', opacity: filterStatus === 'all' || filterStatus === 'fuzzy' ? 1 : 0.4
                    }} className="hover-bg">
                    {previewData.filter(p => p.matchStatus === 'fuzzy').length} À vérifier
                  </button>
                  <button 
                    onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: `1px solid ${filterStatus === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`, 
                      padding: '10px 16px', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold',
                      cursor: 'pointer', outline: 'none', transition: 'all 0.2s', opacity: filterStatus === 'all' || filterStatus === 'rejected' ? 1 : 0.4
                    }} className="hover-bg">
                    {previewData.filter(p => p.matchStatus === 'not_found' || p.isDuplicate || p.isGlobalDuplicate).length} Rejetés/Doublons
                  </button>
                </div>
                
                {previewData.filter(p => p.matchStatus === 'fuzzy' && !p.isDuplicate && !p.isGlobalDuplicate).length > 0 && (
                  <button onClick={handleAutoValidateAll} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover-bg">
                    <Check size={16} /> Valider tous les flous
                  </button>
                )}
              </div>
              
              <div className="table-container" style={{ flex: 1, minHeight: '350px' }}>
                <table className="custom-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Nom dans Excel</th>
                      <th>Agent Trouvé (Journal)</th>
                      <th>Banque / Opérateur</th>
                      <th>Code Bq</th>
                      <th>Code Agc</th>
                      <th>Numéro / Compte</th>
                      <th>Clé</th>
                      <th>Statut (IA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.filter(p => {
                      if (filterStatus === 'exact') return p.matchStatus === 'exact' && !p.isDuplicate && !p.isGlobalDuplicate;
                      if (filterStatus === 'fuzzy') return p.matchStatus === 'fuzzy';
                      if (filterStatus === 'rejected') return p.matchStatus === 'not_found' || p.isDuplicate || p.isGlobalDuplicate || p.isInvalidFormat;
                      return true; // 'all'
                    }).map(p => (
                      <tr key={p.id} style={{ 
                        background: p.validated ? 'rgba(52, 211, 153, 0.05)' : (p.matchStatus === 'not_found' || p.isDuplicate || p.isGlobalDuplicate || p.isInvalidFormat) ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                        opacity: (p.matchStatus === 'not_found' || p.isDuplicate || p.isGlobalDuplicate || p.isInvalidFormat) ? 0.7 : 1
                      }}>
                        <td style={{ textAlign: 'center' }}>
                          {(!p.isDuplicate && !p.isGlobalDuplicate && !p.isInvalidFormat && p.matchStatus !== 'not_found') && (
                            p.hasExistingPayment ? (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '0.7rem', color: '#f97316', fontWeight: 'bold' }} title="Cocher pour écraser l'ancien numéro">
                                <input 
                                  type="checkbox" 
                                  checked={p.overrideExisting} 
                                  onChange={() => toggleOverride(p.id)} 
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f97316', marginBottom: '2px' }}
                                />
                                Écraser
                              </label>
                            ) : (
                              <input 
                                type="checkbox" 
                                checked={p.validated} 
                                onChange={() => toggleValidation(p.id)} 
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                            )
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{p.rawName}</td>
                        <td>
                          {p.matchedAgent ? (
                            p.matchStatus === 'fuzzy' ? (
                              <button 
                                onClick={() => setFuzzyModalData({ row: p, matchedAgent: p.matchedAgent, similarity: p.similarity })}
                                style={{ 
                                  background: 'rgba(245, 158, 11, 0.1)', 
                                  border: '1px solid rgba(245, 158, 11, 0.3)', 
                                  color: '#f59e0b', 
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                className="hover-bg"
                                title="Cliquez pour comparer"
                              >
                                {p.matchedAgent.name} <AlertTriangle size={14} />
                              </button>
                            ) : (
                              <span style={{ color: p.matchStatus === 'exact' ? '#34d399' : '#f59e0b', fontWeight: 'bold' }}>
                                {p.matchedAgent.name}
                              </span>
                            )
                          ) : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Introuvable</span>}
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {p.finalPm === 'Virement Bancaire' ? <Building2 size={14} /> : <Smartphone size={14} />}
                            {p.exactBankName || p.finalPm}
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{p.bc || '-'}</td>
                        <td style={{ color: 'var(--muted)' }}>{p.ac || '-'}</td>
                        <td style={{ fontWeight: 'bold', letterSpacing: '1px', color: (p.isDuplicate || p.isGlobalDuplicate) ? '#ef4444' : 'inherit' }}>
                          {p.account}
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{p.rk || '-'}</td>
                        <td>
                          {p.isGlobalDuplicate ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Doublon : {p.globalDuplicateAgentName || 'Autre agent'}
                            </span>
                          ) : p.isDuplicate ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Doublon de numéro (Fichier)
                            </span>
                          ) : p.isInvalidFormat ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Format Invalide : {p.invalidReason}
                            </span>
                          ) : p.hasExistingPayment ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f97316', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Déjà configuré : {p.existingPaymentStr}
                            </span>
                          ) : p.matchStatus === 'exact' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <Check size={14} /> Exact
                            </span>
                          ) : p.matchStatus === 'fuzzy' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Flou ({Math.round(p.similarity * 100)}%)
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <X size={14} /> Échec
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {step === 3 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', marginTop: 'auto' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              <strong>{previewData.filter(p => p.validated).length}</strong> agents prêts à être sauvegardés.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn" onClick={onClose} 
                style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 24px', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)'; }} 
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >Annuler</button>
              <button className="btn" onClick={() => setStep(2)} 
                style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }} 
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >Modifier Mapping</button>
              <button 
                className="btn btn-primary" 
                onClick={handleFinalSave}
                disabled={isProcessing || previewData.filter(p => p.validated).length === 0}
                style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', border: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.5)'; e.currentTarget.style.background = '#34d399'; } }} 
                onMouseLeave={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#10b981'; } }}
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer dans le système
              </button>
            </div>
          </div>
        )}
      </div>

      <FuzzyMatchModal 
        isOpen={!!fuzzyModalData} 
        onClose={() => setFuzzyModalData(null)} 
        data={fuzzyModalData} 
        onValidate={(id) => { 
          setPreviewData(prev => prev.map(item => item.id === id ? { ...item, validated: true } : item)); 
        }} 
      />
    </div>
  );
}
