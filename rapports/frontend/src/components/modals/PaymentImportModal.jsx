import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Upload, ArrowRight, Check, AlertTriangle, X, Save, RefreshCw, Smartphone, Building2 } from 'lucide-react';

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
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
    account: ''
  });
  
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
        
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            headerRow = row.values.slice(1);
          } else {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              const header = headerRow[colNumber - 1];
              if (header) rowData[header] = cell.text || cell.value;
            });
            if (Object.keys(rowData).length > 0) dataRows.push(rowData);
          }
        });
      }
      
      setHeaders(headerRow || []);
      setRows(dataRows);
      
      // Auto-guess mapping
      const newMapping = { name: '', payment_method: '', account: '' };
      (headerRow || []).forEach(h => {
        const lh = String(h).toLowerCase();
        if (lh.includes('nom') || lh.includes('agent')) newMapping.name = h;
        else if (lh.includes('moyen') || lh.includes('type') || lh.includes('methode')) newMapping.payment_method = h;
        else if (lh.includes('num') || lh.includes('tel') || lh.includes('compte') || lh.includes('rib')) newMapping.account = h;
      });
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
    
    setTimeout(() => {
      const results = [];
      const usedAccounts = new Set();
      
      rows.forEach((row, index) => {
        const rawName = String(row[mapping.name] || '').trim();
        if (!rawName) return;
        
        let bestMatch = null;
        let highestSim = 0;
        
        salaries.forEach(s => {
          const sim = getSimilarity(rawName, s.name);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = s;
          }
        });
        
        let matchStatus = 'not_found';
        if (highestSim >= 0.95) matchStatus = 'exact';
        else if (highestSim >= 0.60) matchStatus = 'fuzzy';
        
        const account = String(row[mapping.account] || '').trim();
        
        // Déterminer le moyen de paiement (via colonne ou via auto-détection du tel)
        let pm = mapping.payment_method ? String(row[mapping.payment_method] || '').trim() : '';
        const lowerPm = pm.toLowerCase();
        
        let finalPm = 'Wave'; // Default
        if (lowerPm.includes('banque') || lowerPm.includes('virement')) {
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
          // Guess based on phone
          const guessed = guessNetwork(account);
          if (guessed) finalPm = guessed;
        }

        let isDuplicate = false;
        if (account) {
          if (usedAccounts.has(account)) isDuplicate = true;
          usedAccounts.add(account);
        }

        results.push({
          id: `row-${index}`,
          rawName,
          account,
          rawPm: pm,
          finalPm,
          matchedAgent: bestMatch,
          similarity: highestSim,
          matchStatus,
          isDuplicate,
          validated: matchStatus === 'exact' && !isDuplicate
        });
      });
      
      setPreviewData(results);
      setStep(3);
      setIsProcessing(false);
    }, 500);
  };

  const handleAutoValidateAll = () => {
    setPreviewData(prev => prev.map(p => {
      if (p.matchStatus === 'fuzzy' && !p.isDuplicate) {
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

  const handleFinalSave = async () => {
    const toSave = previewData.filter(p => p.validated && p.matchedAgent);
    if (toSave.length === 0) return alert("Aucune donnée validée à sauvegarder.");
    
    setIsProcessing(true);
    
    try {
      const payload = toSave.map(p => {
        // Préparer les données du profile
        let profile = {};
        try {
          profile = JSON.parse(p.matchedAgent.profile_data || '{}');
        } catch(e) {}
        
        let updatedProfile = { ...profile };
        
        if (p.finalPm === 'Virement Bancaire') {
          updatedProfile.payment_method = 'BANQUE';
          updatedProfile.payment_rib = p.account;
          updatedProfile.payment_bank_name = 'Banque (Importé)';
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '16px' }}>
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
              <button 
                className="btn btn-primary" 
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '12px 30px', fontSize: '1.1rem', borderRadius: '10px' }}
              >
                Parcourir (.xlsx, .csv)
              </button>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '16px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Check size={20} color="#34d399" />
                <span>Fichier <strong>{fileName}</strong> chargé avec succès. Il contient {rows.length} lignes. Associez maintenant les colonnes.</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Nom Complet" <span style={{color: '#ef4444'}}>*</span></label>
                  <select className="form-input" style={{ width: '100%', background: '#1e293b' }} value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})}>
                    <option value="">Sélectionnez une colonne...</option>
                    {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                  </select>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px' }}>Sera utilisée pour le rapprochement intelligent avec le Journal.</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>Colonne "Numéro / Compte" <span style={{color: '#ef4444'}}>*</span></label>
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
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button className="btn" onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.1)' }}>Retour</button>
                <button className="btn btn-primary" onClick={generatePreview} disabled={isProcessing} style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  Lancer l'Audit IA
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 16px', borderRadius: '8px', color: '#34d399', fontWeight: 'bold' }}>
                    {previewData.filter(p => p.matchStatus === 'exact' && !p.isDuplicate).length} Exacts
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 16px', borderRadius: '8px', color: '#f59e0b', fontWeight: 'bold' }}>
                    {previewData.filter(p => p.matchStatus === 'fuzzy').length} À vérifier
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold' }}>
                    {previewData.filter(p => p.matchStatus === 'not_found' || p.isDuplicate).length} Rejetés/Doublons
                  </div>
                </div>
                
                {previewData.filter(p => p.matchStatus === 'fuzzy' && !p.isDuplicate).length > 0 && (
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
                      <th>Numéro / Compte</th>
                      <th>Opérateur</th>
                      <th>Statut (IA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map(p => (
                      <tr key={p.id} style={{ 
                        background: p.validated ? 'rgba(52, 211, 153, 0.05)' : (p.matchStatus === 'not_found' || p.isDuplicate) ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                        opacity: (p.matchStatus === 'not_found' || p.isDuplicate) ? 0.7 : 1
                      }}>
                        <td style={{ textAlign: 'center' }}>
                          {(!p.isDuplicate && p.matchStatus !== 'not_found') && (
                            <input 
                              type="checkbox" 
                              checked={p.validated} 
                              onChange={() => toggleValidation(p.id)} 
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{p.rawName}</td>
                        <td>
                          {p.matchedAgent ? (
                            <span style={{ color: p.matchStatus === 'fuzzy' ? '#f59e0b' : '#34d399' }}>
                              {p.matchedAgent.name}
                            </span>
                          ) : <span style={{ color: 'var(--muted)' }}>Introuvable</span>}
                        </td>
                        <td style={{ fontWeight: 'bold', letterSpacing: '1px', color: p.isDuplicate ? '#ef4444' : 'inherit' }}>
                          {p.account}
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            {p.finalPm === 'Virement Bancaire' ? <Building2 size={14} /> : <Smartphone size={14} />}
                            {p.finalPm}
                          </div>
                        </td>
                        <td>
                          {p.isDuplicate ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              <AlertTriangle size={14} /> Doublon de numéro
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
          <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              <strong>{previewData.filter(p => p.validated).length}</strong> agents prêts à être sauvegardés.
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn" onClick={() => setStep(2)} style={{ background: 'rgba(255,255,255,0.1)' }}>Modifier Mapping</button>
              <button 
                className="btn btn-primary" 
                onClick={handleFinalSave}
                disabled={isProcessing || previewData.filter(p => p.validated).length === 0}
                style={{ padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981' }}
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer dans le système
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
