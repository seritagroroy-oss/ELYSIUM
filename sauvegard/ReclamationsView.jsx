import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { FileText, CheckCircle, Send, Loader2, Calendar, FileWarning, X, Eye, Settings, LayoutTemplate, Layers, Columns, Grid, FolderOpen, ArrowLeft, Edit3, Share2, Plus, Users, FilePlus, Search, Archive, Clock, FileX, UserCog, PenTool, Upload, AlertTriangle } from 'lucide-react';
import AutocompleteAgentInput from './AutocompleteAgentInput';
import AutocompleteDeclarantInput from './AutocompleteDeclarantInput';

const RECLAMATION_CATEGORIES = [
  { id: 'SUPPLEMENTAIRE', label: 'SUPPLÉMENTAIRE', icon: Clock, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.4)', shadow: 'rgba(56,189,248,0.3)' },
  { id: 'ABSENCES', label: "JUSTIFICATIF D'ABSENCES", icon: FileX, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
  { id: 'STATUT', label: 'CHANGEMENT DE STATUT', icon: UserCog, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', shadow: 'rgba(16,185,129,0.3)' },
  { id: 'DIVERS', label: 'DIVERS', icon: Layers, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' }
];

// Composant d'aperçu visuel façon "FICHE PAPIER PDF"
const PdfPreview = ({ data }) => {
  return (
    <div style={{
      background: 'white', color: 'black', width: '100%', maxWidth: '800px', margin: '0 auto',
      padding: '40px', fontFamily: '"Times New Roman", Times, serif', fontSize: '14px', lineHeight: '1.5',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <div style={{ width: '80px', height: '90px', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <strong>LOGO</strong>
          </div>
          <div style={{ fontWeight: 'bold', marginTop: '5px' }}>SECURITEX</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ textDecoration: 'underline', fontSize: '24px', margin: '20px 0 5px 0' }}>FICHE DE RECLAMATION</h1>
          <h2 style={{ fontSize: '14px', margin: '0', color: '#4b5563', textTransform: 'uppercase' }}>
            {RECLAMATION_CATEGORIES.find(c => c.id === (data.categorie || 'DIVERS'))?.label || 'DIVERS'}
          </h2>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <div>Crée-le : 31/12/2018</div>
          <div>Révisée le 16/06/2019</div>
          <div style={{ marginTop: '10px' }}>N° .........................</div>
        </div>
      </div>

      <style>{`
        .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .pdf-table th, .pdf-table td { border: 1px solid black; padding: 6px 8px; text-align: left; }
        .pdf-section-title { font-weight: bold; font-style: italic; margin-bottom: 5px; text-decoration: underline; }
        .checkbox { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1.5px solid black; margin-right: 4px; vertical-align: middle; font-size: 11px; font-weight: bold; line-height: 1; }
        .checked::after { content: '✓'; color: black; }
      `}</style>

      <div className="pdf-section-title">Concerné</div>
      <table className="pdf-table">
        <tbody>
          <tr>
            <td colSpan="2">Nom : <strong>{data.agent_nom}</strong></td>
            <td colSpan="2">Prénom(s) :</td>
            <td>Matricule : <strong>{data.agent_matricule}</strong></td>
          </tr>
          <tr>
            <td colSpan="2">Fonction : <strong>{data.agent_fonction}</strong></td>
            <td colSpan="2">Site : <strong>{data.agent_site}</strong></td>
            <td>date d'entrée : <strong>{data.date_entree}</strong></td>
          </tr>
          <tr>
            <td colSpan="5">
              Type de réclamation : &nbsp;&nbsp;
              <span className={`checkbox ${data.reclamation_categorie === 'Salaire' ? 'checked' : ''}`}></span> Salaire &nbsp;&nbsp;
              <span className={`checkbox ${data.reclamation_categorie === 'Tenue' ? 'checked' : ''}`}></span> Tenue &nbsp;&nbsp;
              <span className={`checkbox ${data.reclamation_categorie === 'Matériel / Equipement' ? 'checked' : ''}`}></span> Matériel / Equipement &nbsp;&nbsp;
              <span className={`checkbox ${data.reclamation_categorie === 'Autre' ? 'checked' : ''}`}></span> Autre : {data.reclamation_categorie === 'Autre' && <strong>{data.reclamation_categorie_autre || 'X'}</strong>}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="pdf-section-title">Déclarant</div>
      <table className="pdf-table">
        <tbody>
          <tr>
            <td colSpan="2">Nom : <strong>{data.declarant_nom}</strong></td>
            <td colSpan="2">Prénom(s) : <strong>{data.declarant_prenom}</strong></td>
            <td>Matricule : <strong>{data.declarant_matricule}</strong></td>
          </tr>
          <tr>
            <td colSpan="3">Fonction : <strong>{data.declarant_fonction}</strong></td>
            <td colSpan="2">Service : <strong>{data.declarant_service}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="pdf-section-title">Administration</div>
      <table className="pdf-table">
        <tbody>
          <tr>
            <td>
              Type de réclamation : 
              <span className={`checkbox ${data.type_erreur === 'Abandon de poste(s)' ? 'checked' : ''}`} style={{marginLeft:'5px'}}></span> Abandon de poste(s) &nbsp;
              <span className={`checkbox ${data.type_erreur === 'Absence' ? 'checked' : ''}`}></span> Absence &nbsp;
              <span className={`checkbox ${data.type_erreur === 'Erreur de pointage(s)' ? 'checked' : ''}`}></span> Erreur de pointage(s) &nbsp;
              <span className={`checkbox ${data.type_erreur === 'Mise à pied' ? 'checked' : ''}`}></span> Mise à pied &nbsp;
              <span className={`checkbox ${data.type_erreur === 'Arrêt de pointage' ? 'checked' : ''}`}></span> Arrêt de pointage
            </td>
          </tr>
          <tr>
            <td>
              <span className={`checkbox ${data.type_erreur === 'Autre' || (!['Abandon de poste(s)', 'Absence', 'Erreur de pointage(s)', 'Mise à pied', 'Arrêt de pointage'].includes(data.type_erreur)) ? 'checked' : ''}`}></span> 
              Autre : <strong>{data.type_erreur === 'Autre' ? data.type_erreur_autre : (!['Abandon de poste(s)', 'Absence', 'Erreur de pointage(s)', 'Mise à pied', 'Arrêt de pointage'].includes(data.type_erreur) ? data.type_erreur : '')}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="pdf-table">
        <tbody>
          <tr>
            <td>Date(s) concernée(s) : Mois : <strong>{data.mois_concerne}</strong></td>
            <td>Jours : <strong>{data.jours_concernes}</strong></td>
          </tr>
          <tr>
            <td colSpan="2">
              Première réclamation ? Oui {data.premiere_reclamation === 'Oui' ? 'X' : '_'} / Non {data.premiere_reclamation === 'Non' ? 'X' : '_'} 
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Votre/vos précédente(s) ponction ont été faite correctement(s) ? Oui {data.ponction_precedente_correcte === 'Oui' ? 'X' : '_'} / Non {data.ponction_precedente_correcte === 'Non' ? 'X' : '_'}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="pdf-table">
        <tbody>
          <tr>
            <td style={{ width: '60%' }}>Montant : <strong>{data.montant_estime ? `${data.montant_estime} FCFA` : ''}</strong></td>
            <td style={{ width: '20%' }}><span className={`checkbox ${data.action_demandee === 'A prélever' ? 'checked' : ''}`}></span> A prélever</td>
            <td style={{ width: '20%' }}><span className={`checkbox ${data.action_demandee === 'A payer' ? 'checked' : ''}`}></span> A payé</td>
          </tr>
          <tr>
            <td colSpan="3" style={{ height: '60px', verticalAlign: 'top' }}>
              <strong>Nb :</strong> <strong>{data.description}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', paddingRight: '50px' }}>
        <div style={{ width: '200px', textAlign: 'center', position: 'relative', minHeight: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          {data.radio_signature && (
            <img src={data.radio_signature} alt="Signature" style={{ maxHeight: '55px', maxWidth: '180px', objectFit: 'contain', marginBottom: '4px' }} />
          )}
          <div style={{ borderTop: '1px solid black', width: '100%', textAlign: 'center', paddingTop: '5px' }}>
            Signature
            {data.radio_code && <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>({data.radio_code})</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '5px' }}>Avis de l'administration / Comptabilité :</div>
        <table className="pdf-table" style={{ width: '100%', height: '80px' }}>
          <tbody>
            <tr>
              <td style={{ width: '70%', verticalAlign: 'top' }}>
                <span style={{ color: data.avis_secretariat === 'Favorable' || data.avis_secretariat === 'Défavorable' ? 'black' : 'gray' }}>
                  {data.avis_secretariat ? <>Secrétariat: <strong>{data.avis_secretariat}</strong></> : ''}
                </span>
                <br/>
                <span style={{ color: data.avis_comptabilite ? 'black' : 'gray' }}>
                  {data.avis_comptabilite ? <>Comptabilité: <strong>{data.avis_comptabilite}</strong></> : ''}
                </span>
              </td>
              <td style={{ width: '30%', verticalAlign: 'bottom', textAlign: 'center' }}>
                Signature &amp; Cachet
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '10px' }}>
        <div style={{ marginBottom: '5px' }}>Décision Directeur Général :</div>
        <table className="pdf-table" style={{ width: '100%', height: '80px' }}>
          <tbody>
            <tr>
              <td style={{ width: '70%', verticalAlign: 'top' }}></td>
              <td style={{ width: '30%', verticalAlign: 'bottom', textAlign: 'center' }}>
                Signature &amp; Cachet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Formattage du mois "2024-06" -> "Juin 2024"
const formatMonthName = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string' || !monthStr.includes('-')) return monthStr;
  const parts = monthStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return monthStr;
  
  const date = new Date(year, month - 1, 1);
  if (isNaN(date.getTime())) return monthStr; // Sécurité si date invalide
  
  try {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
  } catch(e) {
    return monthStr;
  }
};

// ====== FORM INPUT COMPONENTS (outside parent to avoid re-mount on each render) ======
const InputClean = ({ label, type="text", field, required=false, placeholder="", half=false, formData, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: half ? 'span 1' : 'span 2' }}>
    <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <input required={required} type={type} placeholder={placeholder} value={formData[field] || ''} onChange={e => onChange(field, e.target.value)} style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
  </div>
);

const SelectClean = ({ label, field, options, half=false, formData, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: half ? 'span 1' : 'span 2' }}>
    <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <select value={formData[field]} onChange={e => onChange(field, e.target.value)} style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
      {options.map(opt => <option key={opt} value={opt} style={{color:'black'}}>{opt}</option>)}
    </select>
  </div>
);

const SelectWithOther = ({ label, field, fieldAutre, options, half=false, formData, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: half ? 'span 1' : 'span 2' }}>
    <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <select value={formData[field]} onChange={e => onChange(field, e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: '#0369a1', fontWeight: 'bold', fontSize: '1.05rem', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
        {options.map(opt => <option key={opt} value={opt} style={{color: 'white', backgroundColor: '#1e293b', fontWeight: 'bold'}}>{opt}</option>)}
      </select>
      {formData[field] === 'Autre' && (
        <input type="text" placeholder="Veuillez préciser..." required value={formData[fieldAutre] || ''} onChange={e => onChange(fieldAutre, e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '10px', border: '1px solid #38bdf8', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s' }} autoFocus />
      )}
    </div>
  </div>
);

const SignatureCanvas = ({ onSave }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [points, setPoints] = React.useState([]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // Bleu marine pour faire stylo
    ctx.lineWidth = 2.5;
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    // Eviter le défilement sur mobile
    if (e.touches) e.preventDefault();
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setPoints([{ x, y }]);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (e.touches) e.preventDefault();
    if (!isDrawing) return;
    
    const { x, y } = getCoordinates(e);
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    if (newPoints.length > 0) {
      ctx.moveTo(newPoints[0].x, newPoints[0].y);
      for (let i = 1; i < newPoints.length - 1; i++) {
        const xc = (newPoints[i].x + newPoints[i + 1].x) / 2;
        const yc = (newPoints[i].y + newPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(newPoints[i].x, newPoints[i].y, xc, yc);
      }
      if (newPoints.length > 1) {
          const lastPoint = newPoints[newPoints.length - 1];
          ctx.lineTo(lastPoint.x, lastPoint.y);
      }
    }
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    onSave(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ position: 'relative', width: '300px', height: '150px' }}>
        <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          style={{ 
            border: '2px solid #e2e8f0', 
            borderRadius: '12px', 
            background: '#f8fafc', 
            cursor: 'crosshair', 
            touchAction: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <button type="button" onClick={clear} style={{ padding: '8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}>Refaire la signature</button>
    </div>
  );
};

export default function ReclamationsView() {
  const { user, hasPermission } = useAuth();
  
  // Droit d'édition exclusif
  const canEdit = hasPermission('reclamation_edit');

  const canModifyNo = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.reclamation_view === 'modifier_no';
  const canApprove = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.reclamation_view === 'approver_3';

  // Navigation State
  const [currentView, setCurrentView] = useState('months'); // 'months' | 'month_detail' | 'form'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('actuel'); // 'actuel' | 'archives'
  const [selectedPeriod, setSelectedPeriod] = useState(() => localStorage.getItem('pontage_period') || new Date().toISOString().slice(0, 7)); // ex: '2026-06'
  const [archivedMonthView, setArchivedMonthView] = useState(null); // month key being viewed in archives
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyServices, setCompanyServices] = useState([]);
  
  
  const [isSyncingPeriod, setIsSyncingPeriod] = useState(true);
  const [publishError, setPublishError] = useState('');

  // Synchro sécurisée du mois avec le backend (survie aux F5 et reconnexions)
  useEffect(() => {
    const syncPeriodWithBackend = async () => {
      try {
        const res = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
        if (res && res.max_initialized_period) {
          const currentStored = localStorage.getItem('pontage_period');
          // Si on n'a rien (reconnexion) ou si le backend est plus avancé que notre affichage local, on s'aligne
          if (!currentStored || currentStored !== res.max_initialized_period) {
            setSelectedPeriod(res.max_initialized_period);
            localStorage.setItem('pontage_period', res.max_initialized_period);
          }
        }
      } catch (e) {
        console.error("Erreur sync_period:", e);
      } finally {
        setIsSyncingPeriod(false);
      }
    };
    syncPeriodWithBackend();
  }, []);

  // Modals & Settings
  const [formLayout, setFormLayout] = useState('cards'); 
  const [wizardStep, setWizardStep] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPublishServices, setSelectedPublishServices] = useState([]);
  const [publishSuccess, setPublishSuccess] = useState(null);

  // Nouveaux Modals pour Circuit de Validation
  const [showNumberingModal, setShowNumberingModal] = useState(false);
  const [numberingStart, setNumberingStart] = useState('');
  const [manualNumbers, setManualNumbers] = useState({});
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false);
  const [actionRec, setActionRec] = useState(null); // Pour Valider/Refuser une fiche
  const [motifRefus, setMotifRefus] = useState('');

  // Signatures Opérateurs Radio
  const [radioSignatures, setRadioSignatures] = useState([]);
  const [showSignatureConfig, setShowSignatureConfig] = useState(false);
  const [showSignatureSelect, setShowSignatureSelect] = useState(false);
  const [newRadioCode, setNewRadioCode] = useState('');
  const [newRadioImage, setNewRadioImage] = useState(null);
  const [newRadioNom, setNewRadioNom] = useState('');
  const [newRadioPrenom, setNewRadioPrenom] = useState('');
  const [newRadioMatricule, setNewRadioMatricule] = useState('');
  const [newRadioFonction, setNewRadioFonction] = useState('');
  const [newRadioService, setNewRadioService] = useState('');
  const [selectedRadioCode, setSelectedRadioCode] = useState('');

  // Synchronisation event global
  useEffect(() => {
    const handleGlobalPeriodChange = (e) => {
      if (e.detail && e.detail !== selectedPeriod) {
        setSelectedPeriod(e.detail);
      }
    };
    window.addEventListener('pontage_period_changed', handleGlobalPeriodChange);
    return () => window.removeEventListener('pontage_period_changed', handleGlobalPeriodChange);
  }, [selectedPeriod]);

  useEffect(() => {
    localStorage.setItem('pontage_period', selectedPeriod);
    window.dispatchEvent(new CustomEvent('pontage_period_changed', { detail: selectedPeriod })); // informer les autres onglets
  }, [selectedPeriod]);

  // Mois Suivant Modal
  const [showNextMonthModal, setShowNextMonthModal] = useState(false);
  const [pendingNextPeriod, setPendingNextPeriod] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  const defaultFormData = {
    id: '', statut: 'Brouillon',
    agent_nom: '', agent_matricule: '', agent_site: '', agent_fonction: '', date_entree: '', reclamation_categorie: 'Salaire', reclamation_categorie_autre: '',
    declarant_nom: '', declarant_prenom: '', declarant_matricule: '', declarant_fonction: '', declarant_service: user?.service || '',
    type_erreur: 'Erreur de pointage(s)', type_erreur_autre: '', mois_concerne: '', jours_concernes: '', premiere_reclamation: 'Oui', ponction_precedente_correcte: 'Non',
    montant_estime: '', action_demandee: 'A payer', description: '',
    radio_code: '', radio_signature: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Auto-remplissage des remarques pour "Absence", "Supplementaire" et "Erreur de pointage(s)"
  useEffect(() => {
    if (formData.type_erreur === 'Absence' || formData.type_erreur === 'Supplementaire' || formData.type_erreur === 'Erreur de pointage(s)') {
      let formattedDates = formData.jours_concernes || '';
      
      if (formData.mois_concerne && formattedDates && (formData.type_erreur === 'Absence' || formData.type_erreur === 'Supplementaire')) {
        const [yyyyStr, mmStr] = formData.mois_concerne.split('-');
        let baseYear = parseInt(yyyyStr, 10);
        let baseMonth = parseInt(mmStr, 10);

        if (!isNaN(baseYear) && !isNaN(baseMonth)) {
          // Remplacer chaque nombre de 1 à 31 par sa date complète
          formattedDates = formattedDates.replace(/\b([1-9]|[12][0-9]|3[01])\b/g, (match) => {
            const day = parseInt(match, 10);
            let m = baseMonth;
            let y = baseYear;
            
            // Le cycle commence le 21 du mois précédent
            if (day >= 21) {
              m -= 1;
              if (m === 0) {
                m = 12;
                y -= 1;
              }
            }
            
            const formattedM = m.toString().padStart(2, '0');
            const formattedD = day.toString().padStart(2, '0');
            return `${formattedD}/${formattedM}/${y}`;
          });
        }
      }

      const prefix = formattedDates ? ` ${formattedDates}` : '';
      let text = '';
      if (formData.type_erreur === 'Absence') {
        text = `L'agent a apporté des documents médicaux pour justifier ses absences du${prefix}`;
      } else if (formData.type_erreur === 'Supplementaire') {
        text = `L'agent a servir en supplementaire les${prefix} .......... en lieu et place de l'agent ...................`;
      } else if (formData.type_erreur === 'Erreur de pointage(s)') {
        text = `L'agent a perçu ...................... au lieu de  ..................... alors qu'il a ...................................`;
      }
      
      if (text && formData.description !== text) {
        setFormData(prev => ({ ...prev, description: text }));
      }
    }
  }, [formData.type_erreur, formData.jours_concernes, formData.mois_concerne]);

  useEffect(() => {
    if (user) {
      fetchReclamations();
      fetchServices();
      fetchSignatures();
    }
  }, [user?.permissions?.reclamation_view, user?.permissions?.reclamation_edit, user?.role]);

  useEffect(() => {
    localStorage.setItem('pontage_period', selectedPeriod);
    window.dispatchEvent(new Event('pontage_period_changed')); // Optionnel, pour informer les autres onglets ou composants si besoin
  }, [selectedPeriod]);

  const fetchSignatures = async () => {
    try {
      const res = await apiCall('get_radio_signatures', {}, 'GET');
      if (res.success) setRadioSignatures(res.signatures || []);
    } catch (e) {}
  };

  const fetchReclamations = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_reclamations', {}, 'GET');
      if (res.success) {
        let data = res.reclamations || [];
        const userPermsRec = user?.permissions?.reclamation_view;
        const isModifierNo = userPermsRec === 'modifier_no';
        const isApprobateur = userPermsRec === 'approver_3';
        const isEditor = user?.role === 'admin' || user?.role === 'super_admin' || canEdit;

        if (!isEditor) {
          data = data.filter(r => {
             if (r.statut === 'Brouillon') return false;
             
             // Une fois Clôturé ou Refusé, tout le monde visé peut consulter la version finale
             if (r.statut === 'Clôturé' || r.statut === 'Refusé') {
                 return true; // tous les acteurs du circuit peuvent voir les fiches clôturées
             }
             
             // Le Numéroteur voit les fiches de l'étape 1 (En attente) et celles qu'il a transmises (Transmis)
             if (isModifierNo && (r.statut === 'En attente' || r.statut === 'Transmis')) return true;
             
             // L'Approbateur voit les fiches de l'étape 2
             if (isApprobateur && r.statut === 'Transmis') return true;
             
             // Pour les lecteurs simples, les étapes intermédiaires sont invisibles
             return false;
          });
        }
        setReclamations(data);
      }
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await apiCall('get_services', {}, 'GET');
      if (res.success) setCompanyServices(res.services || []);
    } catch (err) {}
  };

  // Grouping by month
  const groupedReclamations = reclamations.reduce((acc, rec) => {
    const mois = rec.mois_concerne || 'Inconnu';
    if (!acc[mois]) acc[mois] = [];
    acc[mois].push(rec);
    return acc;
  }, {});

  // Générer une carte vide pour le mois en cours UNIQUEMENT pour le Créateur
  // Les autres services ne verront la carte du mois que lorsqu'une fiche leur sera publiée
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  if (canEdit && !groupedReclamations[currentMonthStr]) {
    groupedReclamations[currentMonthStr] = [];
  }

  // --- Actions ---
  const handleOpenFormNew = () => {
    setFormData({ 
      ...defaultFormData, 
      categorie: selectedCategory || 'DIVERS',
      type_erreur: '', type_erreur_autre: '', mois_concerne: selectedMonth || new Date().toISOString().slice(0, 7), jours_affectes: '',
      premiere_reclamation: 'Oui', ponction_correcte: 'Non',
      montant_estime: '', action_demandee: 'A payer', remarques: ''
    });
    setWizardStep(1);
    setCurrentView('form');
  };

  const handleOpenFormEdit = (rec) => {
    setFormData(rec);
    setWizardStep(1);
    setCurrentView('form');
  };

  const handleOpenPreview = (e) => {
    if (e) e.preventDefault();
    setPreviewData(formData);
    setShowPreview(true);
  };

  const handleOpenPreviewExisting = (rec) => {
    setPreviewData(rec);
    setShowPreview(true);
  };

  const saveReclamation = async (statut = 'Brouillon') => {
    setSubmitting(true);
    try {
      const dataToSave = { ...formData, statut };
      const res = await apiCall('add_reclamation', dataToSave, 'POST');
      if (res.success) {
        setShowPreview(false);
        await fetchReclamations();
        setCurrentView('month_detail');
      } else {
        alert("Erreur lors de l'enregistrement.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRadioImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRadioSignature = async () => {
    if (!newRadioCode || !newRadioImage) {
      alert('Veuillez entrer un code et une image/signature');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiCall('save_radio_signature', { 
        code: newRadioCode, 
        image: newRadioImage,
        nom: newRadioNom,
        prenom: newRadioPrenom,
        matricule: newRadioMatricule,
        fonction: newRadioFonction,
        service: newRadioService
      }, 'POST');
      if (res.success) {
        setNewRadioCode('');
        setNewRadioImage(null);
        setNewRadioNom('');
        setNewRadioPrenom('');
        setNewRadioMatricule('');
        setNewRadioFonction('');
        setNewRadioService('');
        await fetchSignatures();
        alert('Signature sauvegardée avec succès !');
      }
    } catch (e) {
      alert('Erreur lors de la sauvegarde de la signature');
    } finally {
      setSubmitting(false);
    }
  };

  const publishReclamations = async () => {
    if (selectedPublishServices.length === 0) {
      alert("Veuillez sélectionner au moins un service.");
      return;
    }
    setSubmitting(true);
    try {
      const pubRes = await apiCall('get_published_periods', { scope: 'company' }, 'GET');
      if (pubRes && pubRes.published_periods) {
         if (!pubRes.published_periods.includes(selectedMonth)) {
            setPublishError(`Impossible d'envoyer les réclamations.\nLe pointage du mois de ${formatMonthName(selectedMonth)} n'a pas encore été publié.\n\nVeuillez publier le pointage avant de transmettre les réclamations.`);
            setSubmitting(false);
            return;
         }
      }

      const res = await apiCall('publish_reclamations', { 
        mois: selectedMonth, 
        services: selectedPublishServices 
      }, 'POST');
      if (res.success) {
        setShowPublishModal(false);
        setPublishSuccess({ services: selectedPublishServices });
        setSelectedPublishServices([]);
        await fetchReclamations();
      }
    } catch (err) {
      alert("Erreur lors de la publication.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublishService = (serviceName) => {
    if (serviceName === 'Tous') {
      if (selectedPublishServices.includes('Tous')) setSelectedPublishServices([]);
      else setSelectedPublishServices(['Tous']);
      return;
    }
    let newServices = selectedPublishServices.filter(s => s !== 'Tous');
    if (newServices.includes(serviceName)) {
      newServices = newServices.filter(s => s !== serviceName);
    } else {
      newServices.push(serviceName);
    }
    setSelectedPublishServices(newServices);
  };

  const getStatusColor = (status) => {
    if (status === 'Brouillon') return '#64748b'; // gris
    if (status === 'Traitée par Comptabilité') return '#10b981'; // vert
    if (status === 'Rejetée') return '#ef4444'; // rouge
    return '#f59e0b'; // orange (En attente)
  };

  // Stable field change handler - prevents re-mount of inputs on each keystroke
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const renderAgentSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <AutocompleteAgentInput label="Nom & Prénom(s)" field="agent_nom" placeholder="Ex: Jean Dupont" required formData={formData} onChange={handleFieldChange} moisConcerne={formData.mois_concerne} />
      <InputClean label="Matricule" field="agent_matricule" placeholder="Ex: 12345" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Site / Zone" field="agent_site" placeholder="Ex: Zone Industrielle" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Fonction" field="agent_fonction" placeholder="Ex: Agent de sécurité" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Date d'entrée" field="date_entree" type="text" placeholder="Ex: 01/01/2020" formData={formData} onChange={handleFieldChange} />
      <SelectWithOther label="Catégorie" field="reclamation_categorie" fieldAutre="reclamation_categorie_autre" options={['Salaire', 'Tenue', 'Matériel / Equipement', 'Autre']} formData={formData} onChange={handleFieldChange} />
    </div>
  );
  const renderDeclarantSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <AutocompleteDeclarantInput label="Nom" field="declarant_nom" placeholder="Ex: Martin" required formData={formData} onChange={handleFieldChange} radioSignatures={radioSignatures} />
      <InputClean label="Prénom(s)" field="declarant_prenom" placeholder="Ex: Paul" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Matricule" field="declarant_matricule" placeholder="Ex: 54321" formData={formData} onChange={handleFieldChange} />
      <InputClean label="Fonction" field="declarant_fonction" placeholder="Ex: Chef d'équipe" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Service" field="declarant_service" placeholder="Ex: Comptabilité" formData={formData} onChange={handleFieldChange} />
    </div>
  );
  const renderAdminSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <SelectWithOther label="Type d'erreur" field="type_erreur" fieldAutre="type_erreur_autre" options={['Abandon de poste(s)', 'Absence', 'Erreur de pointage(s)', 'Mise à pied', 'Arrêt de pointage', 'Supplementaire', 'Justificatif d\'absence', 'Omission', 'Ponction', 'Autre']} formData={formData} onChange={handleFieldChange} />
      <InputClean label="Mois Concerné" field="mois_concerne" type="month" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Jours précis affectés" field="jours_concernes" placeholder="Ex: 12, 13 et 14" formData={formData} onChange={handleFieldChange} />
      <SelectClean label="Première réclamation ?" field="premiere_reclamation" options={['Oui', 'Non']} formData={formData} onChange={handleFieldChange} />
      <SelectClean label="Ponction précédente correcte ?" field="ponction_precedente_correcte" options={['Oui', 'Non']} formData={formData} onChange={handleFieldChange} />
    </div>
  );
  const renderActionSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <InputClean label="Montant Estimé (FCFA)" field="montant_estime" type="text" placeholder="Ex: 15 000" formData={formData} onChange={handleFieldChange} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action Demandée</label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: formData.action_demandee === 'A payer' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '8px', border: `1px solid ${formData.action_demandee === 'A payer' ? '#34d399' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' }}>
            <input type="radio" value="A payer" checked={formData.action_demandee === 'A payer'} onChange={e => handleFieldChange('action_demandee', e.target.value)} style={{ accentColor: '#34d399', transform: 'scale(1.2)' }} />
            <span style={{ color: formData.action_demandee === 'A payer' ? '#34d399' : '#cbd5e1', fontWeight: 600, fontSize: '1.05rem' }}>À Payer</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: formData.action_demandee === 'A prélever' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '8px', border: `1px solid ${formData.action_demandee === 'A prélever' ? '#f87171' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' }}>
            <input type="radio" value="A prélever" checked={formData.action_demandee === 'A prélever'} onChange={e => handleFieldChange('action_demandee', e.target.value)} style={{ accentColor: '#f87171', transform: 'scale(1.2)' }} />
            <span style={{ color: formData.action_demandee === 'A prélever' ? '#f87171' : '#cbd5e1', fontWeight: 600, fontSize: '1.05rem' }}>À Prélever</span>
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
        <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarques complémentaires (Nb)</label>
        <textarea required rows="3" placeholder="Saisissez les détails de la réclamation ici..." value={formData.description} onChange={e => handleFieldChange('description', e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      </div>
    </div>
  );


  const handleAssignNumbersAndForward = async () => {
    setSubmitting(true);
    try {
      // Préparer les numéros
      const toNumber = groupedReclamations[selectedMonth].filter(r => r.statut === 'En attente');
      let currentNo = numberingStart ? parseInt(numberingStart, 10) : null;
      const updates = toNumber.map(r => {
        let n = manualNumbers[r.id];
        if (!n && currentNo) {
          n = currentNo.toString();
          currentNo++;
        }
        return { id: r.id, fields: { numero_fiche: n } };
      });
      
      // Assigner les N°
      await apiCall('batch_update_reclamations', { updates }, 'POST');
      
      // Publier au service suivant (Transmis)
      const res = await apiCall('publish_reclamations', {
        mois: selectedMonth,
        services: selectedPublishServices,
        from_status: 'En attente',
        to_status: 'Transmis'
      }, 'POST');

      if (res.success) {
        setShowNumberingModal(false);
        fetchReclamations();
      }
    } catch(e) {}
    setSubmitting(false);
  };

  const handleCloseMonth = async () => {
    setSubmitting(true);
    try {
      // Séparer les fiches refusées des fiches validées
      const monthRecs = groupedReclamations[selectedMonth] || [];
      const transmisRecs = monthRecs.filter(r => r.statut === 'Transmis');
      const refuseesIds = transmisRecs.filter(r => r.statut_final === 'Refusée').map(r => r.id);
      const valideesIds = transmisRecs.filter(r => r.statut_final !== 'Refusée').map(r => r.id);

      // Passer les refusées en statut 'Refusé'
      if (refuseesIds.length > 0) {
        await apiCall('batch_update_reclamations', {
          updates: refuseesIds.map(id => ({ id, fields: { statut: 'Refusé' } }))
        }, 'POST');
      }
      // Passer les validées en statut 'Clôturé'
      if (valideesIds.length > 0) {
        await apiCall('batch_update_reclamations', {
          updates: valideesIds.map(id => ({ id, fields: { statut: 'Clôturé' } }))
        }, 'POST');
      }
      setShowCloseMonthModal(false);
      await fetchReclamations();
    } catch(e) { console.error(e); }
    setSubmitting(false);
  };

  // ====== VIEWS ======
  useEffect(() => {
    fetchReclamations();
    fetchServices();
  }, [activeTab]);

  useEffect(() => {
    if (showNumberingModal) {
      setNumberingStart('');
      setManualNumbers({});
    }
  }, [showNumberingModal]);

  // Si on est en train de synchroniser la période avec le backend, on ne montre rien (évite le flash)
  if (isSyncingPeriod) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#a855f7' }} />
        <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>Synchronisation de la période...</div>
      </div>
    );
  }

  const renderMonthsView = () => {
    const allMonths = Object.keys(groupedReclamations).sort().reverse();
    
    // Un mois est considéré "Archivé" SI ET SEULEMENT SI :
    // 1. Il contient des réclamations
    // 2. TOUTES ses réclamations sont clôturées ou refusées
    const archiveMonths = allMonths.filter(m => {
      const monthRecs = groupedReclamations[m] || [];
      if (monthRecs.length === 0) return false;
      const allDone = monthRecs.every(r => r.statut === 'Clôturé' || r.statut === 'Refusé' || r.statut_final === 'Refusée');
      return allDone;
    });

    // La liste des mois pour le menu déroulant de l'onglet "Actuel"
    // On ne montre QUE les mois qui ne sont PAS archivés (donc ceux en cours de traitement)
    const getPeriodsList = () => {
      const list = Object.keys(groupedReclamations)
        .filter(m => !archiveMonths.includes(m))
        .sort().reverse()
        .map(m => ({ value: m, label: formatMonthName(m) }));
      
      // Si tous les mois sont archivés ou qu'il n'y a pas encore de réclamations,
      // on affiche au moins le selectedPeriod actuel (ex: le nouveau mois créé)
      return list.length > 0 ? list : [{ value: selectedPeriod, label: formatMonthName(selectedPeriod) }];
    };

    // Pour l'onglet Actuel, afficher la carte du mois sélectionné
    const periodMonths = groupedReclamations[selectedPeriod] ? [selectedPeriod] : [];

    const normalizeStr = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filteredArchives = archiveMonths.filter(m =>
      normalizeStr(formatMonthName(m)).includes(normalizeStr(searchTerm))
    );

    const recsForPeriod = groupedReclamations[selectedPeriod] || [];
    const totalDraftsForPeriod = recsForPeriod.filter(r => r.statut === 'Brouillon').length;

    const userPermsRec = user?.permissions?.reclamation_view;
    const isModifierNo = userPermsRec === 'modifier_no'; // Secrétariat
    const isApprobateur = userPermsRec === 'approver_3'; // Comptabilité
    
    // Pour Secrétariat, ils ont des fiches 'En attente'
    const secPending = isModifierNo ? recsForPeriod.filter(r => r.statut === 'En attente') : [];

    const ModeTabs = () => (
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {canEdit && activeTab === 'actuel' && totalDraftsForPeriod > 0 && (
          <button 
            onClick={() => {
              setSelectedMonth(selectedPeriod);
              setShowPublishModal(true);
            }} 
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', minWidth: '180px', justifyContent: 'center', transition: 'all 0.3s ease' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
              e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.background = '#10b981';
            }}
          >
            <Share2 size={18} /> Publier les fiches ({totalDraftsForPeriod})
          </button>
        )}
        {isModifierNo && activeTab === 'actuel' && secPending.length > 0 && (
          <button 
            onClick={async () => {
              // Transmettre toutes les fiches "En attente" à la comptabilité
              const toPublishIds = secPending.map(r => r.id);
              try {
                const updates = toPublishIds.map(id => ({ id, fields: { statut: 'Transmis', services_cibles: ['Comptabilité'] } }));
                const res = await apiCall('batch_update_reclamations', { updates }, 'POST');
                if (res.success) {
                  await fetchReclamations();
                }
              } catch(e) {}
            }} 
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', minWidth: '180px', justifyContent: 'center', transition: 'all 0.3s ease' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.background = '#3b82f6';
            }}
          >
            <Share2 size={18} /> Transmettre Comptabilité ({secPending.length})
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => setShowSignatureConfig(true)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.4)', cursor: 'pointer', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.3s ease' }}
            title="Gérer les signatures radio"
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(56,189,248,0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(56,189,248,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <PenTool size={16} /> Signatures
          </button>
        )}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('actuel')}
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: activeTab === 'actuel' ? 'var(--primary)' : 'transparent', color: activeTab === 'actuel' ? 'white' : 'var(--muted)' }}
          >
            Actuel
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: activeTab === 'archives' ? 'var(--primary)' : 'transparent', color: activeTab === 'archives' ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive size={14} /> Archives
          </button>
        </div>
      </div>
    );

    return (
      <div className="fade-in" style={{ padding: '0 0 40px 0' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* ─── TOP BAR (identique à PayrollView Archives) ─────────────────── */}
        <div className="top-bar glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

          {/* Titre à gauche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', padding: '8px', borderRadius: '10px' }}>
              <FolderOpen size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, whiteSpace: 'nowrap' }}>
              {activeTab === 'archives' ? 'Archives de Réclamations' : 'Dossiers de Réclamations'}
            </h2>
          </div>

          {/* Centre : sélecteur de mois (Actuel) ou barre de recherche (Archives) */}
          {activeTab === 'actuel' ? (
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
              <button 
                title="Mois Précédent"
                onClick={() => {
                  const [y, m] = selectedPeriod.split('-');
                  const d = new Date(y, parseInt(m) - 1, 1);
                  d.setMonth(d.getMonth() - 1);
                  setSelectedPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                &lt;
              </button>
              
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: '#a855f7', zIndex: 1 }}>
                  <Calendar size={16} />
                </div>
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: '12px',
                    padding: '10px 42px 10px 38px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    minWidth: '200px',
                    cursor: 'pointer',
                    outline: 'none',
                    textTransform: 'capitalize',
                    boxShadow: '0 0 16px rgba(168,85,247,0.2)',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.8)'; e.target.style.boxShadow = '0 0 24px rgba(168,85,247,0.35)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.4)'; e.target.style.boxShadow = '0 0 16px rgba(168,85,247,0.2)'; }}
                >
                  {getPeriodsList().map(p => (
                    <option key={p.value} value={p.value} style={{ background: '#1e293b', color: 'white' }}>{p.label}</option>
                  ))}
                  {/* Ajouter dynamiquement le selectedPeriod au cas où il n'est pas dans getPeriodsList() */}
                  {!getPeriodsList().find(p => p.value === selectedPeriod) && (
                    <option value={selectedPeriod} style={{ background: '#1e293b', color: 'white' }}>{formatMonthName(selectedPeriod)}</option>
                  )}
                </select>
                <div style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: '#a855f7' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              <button 
                title="Mois Suivant"
                onClick={() => {
                  const [y, m] = selectedPeriod.split('-');
                  const d = new Date(y, parseInt(m) - 1, 1);
                  d.setMonth(d.getMonth() + 1);
                  setPendingNextPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                  setShowNextMonthModal(true);
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Mois Suiv. &gt;
              </button>
            </div>

          ) : (
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', width: '100%', maxWidth: '600px', gap: '10px' }}>
                <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Rechercher une archive (mois, année)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                />
              </div>
            </div>
          )}


          {/* Onglets à droite */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <ModeTabs />
          </div>
        </div>

        {/* ─── CONTENU ─────────────────────────────────────────────────────── */}
        {(() => {
          const draftsForPeriod = canEdit ? recsForPeriod.filter(r => r.statut === 'Brouillon') : [];
          
          const pendingForPeriodPC = canEdit ? recsForPeriod.filter(r => r.statut === 'En attente' || r.statut === 'Transmis') : [];
          const transmittedForPeriodSec = isModifierNo ? recsForPeriod.filter(r => r.statut === 'Transmis') : [];
          const finishedForPeriod = recsForPeriod.filter(r => r.statut === 'Clôturé' || r.statut === 'Refusé' || r.statut_final === 'Refusée');

          const pcAwaiting = canEdit && draftsForPeriod.length === 0 && pendingForPeriodPC.length > 0;
          const secAwaiting = isModifierNo && secPending.length === 0 && transmittedForPeriodSec.length > 0;

          const awaitingProcessing = pcAwaiting || secAwaiting;
          const pendingForDisplay = pcAwaiting ? pendingForPeriodPC : (secAwaiting ? transmittedForPeriodSec : []);

          const isUnlocked = (canEdit || isModifierNo || isApprobateur) 
                             && draftsForPeriod.length === 0 
                             && pendingForPeriodPC.length === 0 
                             && secPending.length === 0 
                             && transmittedForPeriodSec.length === 0 
                             && finishedForPeriod.length > 0;

          if (loading) return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
            </div>
          );

          // Si on visualise un mois archivé depuis l'onglet Archives
          if (activeTab === 'archives' && archivedMonthView) {
            const archMonthRecs = groupedReclamations[archivedMonthView] || [];
            const archFinished = archMonthRecs.filter(r => r.statut === 'Clôturé' || r.statut === 'Refusé' || r.statut_final === 'Refusée');
            const archNbValides = archFinished.filter(r => r.statut !== 'Refusé' && r.statut_final !== 'Refusée').length;
            const archNbRefuses = archFinished.filter(r => r.statut === 'Refusé' || r.statut_final === 'Refusée').length;
            return (
              <div style={{ marginTop: '24px', animation: 'slideUp 0.5s ease-out' }}>
                {/* Bouton retour */}
                <button
                  onClick={() => setArchivedMonthView(null)}
                  style={{ background: 'white', border: '1px solid rgba(255,255,255,0.05)', color: '#1e293b', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s ease', marginBottom: '24px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.transform = 'translateX(-5px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <ArrowLeft size={16} /> Retour aux archives
                </button>

                {/* Bandeau de statut */}
                <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Archive size={22} color="#a855f7" />
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '1.05rem' }}>Archive — {formatMonthName(archivedMonthView)} — Cliquez sur une catégorie pour consulter</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem' }}>
                      ✅ {archNbValides} Validée(s)
                    </span>
                    {archNbRefuses > 0 && (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem' }}>
                        ❌ {archNbRefuses} Refusée(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 cartes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'flex-start', marginBottom: '32px' }}>
                  {RECLAMATION_CATEGORIES.map((cat, cidx) => {
                    const catRecs = archFinished.filter(r => (r.categorie || 'DIVERS') === cat.id);
                    const catRefused = catRecs.filter(r => r.statut === 'Refusé' || r.statut_final === 'Refusée').length;
                    const catValides = catRecs.length - catRefused;
                    const isEmpty = catRecs.length === 0;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => { if (!isEmpty) { setSelectedMonth(archivedMonthView); setSelectedCategory(cat.id); setCurrentView('month_detail'); } }}
                        className="glass-panel"
                        style={{ cursor: isEmpty ? 'default' : 'pointer', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: 'slideUp 0.4s ease-out forwards', animationDelay: `${cidx * 0.06}s`, opacity: isEmpty ? 0.4 : 0, width: '320px', flex: '0 0 auto', borderColor: 'var(--border)' }}
                        onMouseEnter={(e) => { if (!isEmpty) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px -10px ${cat.shadow}`; e.currentTarget.style.borderColor = cat.border; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${cat.bg} 0%, transparent 70%)`, borderRadius: '50%' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ background: cat.bg, borderRadius: '10px', padding: '10px', color: cat.color }}>
                            <Icon size={22} />
                          </div>
                          <div>
                            <h3 style={{ fontWeight: '700', fontSize: '0.95rem', margin: 0, color: 'white' }}>{cat.label}</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>{isEmpty ? 'Aucune fiche ce mois' : `${catRecs.length} fiche(s) traitée(s)`}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {catValides > 0 && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>✅ {catValides} validée(s)</span>}
                          {catRefused > 0 && <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>❌ {catRefused} refusée(s)</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Récapitulatif global */}
                <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
                  <div className="table-container" style={{ margin: 0, maxHeight: '65vh', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)' }}>
                        <tr>
                          <th colSpan="6" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Archive size={18} color="#a855f7" /> Récapitulatif global — {formatMonthName(archivedMonthView)}
                              </h4>
                              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input 
                                  type="text" 
                                  placeholder="Rechercher un agent ou un site..." 
                                  value={globalSearchTerm} 
                                  onChange={(e) => setGlobalSearchTerm(e.target.value)} 
                                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                />
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr>
                          <th style={{ paddingLeft: '24px' }}>Agent</th>
                          <th>Site</th>
                          <th>Catégorie</th>
                          <th>Action Demandée</th>
                          <th>Statut Final</th>
                          <th style={{ paddingRight: '24px' }}>Motif Refus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archFinished.filter(r => {
                          if (!globalSearchTerm) return true;
                          const s = globalSearchTerm.toLowerCase();
                          return (r.agent_nom && r.agent_nom.toLowerCase().includes(s)) || (r.agent_site && r.agent_site.toLowerCase().includes(s));
                        }).map(r => {
                          const isRef = r.statut === 'Refusé' || r.statut_final === 'Refusée';
                          return (
                            <tr key={r.id}>
                              <td style={{ paddingLeft: '24px' }}>{r.agent_nom}</td><td>{r.agent_site}</td><td>{r.categorie || 'DIVERS'}</td><td>{r.action_demandee || '—'}</td>
                              <td><span style={{ background: !isRef ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: !isRef ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{!isRef ? '✅ Validé' : '❌ Refusé'}</span></td>
                              <td style={{ paddingRight: '24px', color: '#ef4444', fontSize: '0.85rem' }}>{isRef ? (r.motif_refus || '—') : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          }

          if (activeTab === 'archives') return (
            <div className="glass-panel" style={{ marginTop: '24px' }}>
              {filteredArchives.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                  <Archive size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p>{archiveMonths.length === 0 ? 'Aucune archive disponible.' : 'Aucun résultat pour cette recherche.'}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th>Nombre de fiches</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArchives.map((mois, i) => {
                        const recs = groupedReclamations[mois];
                        const nbBrouillons = recs.filter(r => r.statut === 'Brouillon').length;
                        const nbPublies = recs.length - nbBrouillons;
                        return (
                          <tr key={mois || `archive-row-${i}`}>
                            <td style={{ fontWeight: '700', color: 'white', textTransform: 'capitalize' }}>{formatMonthName(mois)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {canEdit && <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' }}>{nbBrouillons} Brouillon</span>}
                                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' }}>{nbPublies} Envoyée{nbPublies > 1 ? 's' : ''}</span>
                              </div>
                            </td>
                            <td>
                              <button onClick={() => { setArchivedMonthView(mois); setSelectedPeriod(mois); }} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Consulter</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );

          // VUE ACTUEL — Écran d'attente
          if (awaitingProcessing) {
            const servicesSet = new Set();
            pendingForDisplay.forEach(r => {
                let sc = r.services_cibles;
                if (typeof sc === 'string') {
                    try { sc = JSON.parse(sc); } catch(e) { sc = []; }
                }
                if (sc && Array.isArray(sc)) sc.forEach(s => servicesSet.add(s));
            });
            const servicesList = [...servicesSet];
            if (isModifierNo && servicesList.length === 0) servicesList.push('Comptabilité');
            const isWithComptable = pendingForDisplay.length > 0 && pendingForDisplay.every(r => r.statut === 'Transmis');
            const serviceName = isWithComptable ? 'Comptable' : 'Secrétariat';
            return (
              <div style={{ textAlign: 'center', padding: '60px 40px', marginTop: '60px', animation: 'slideUp 0.5s ease-out' }}>
                <div className="animate-hourglass" style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 10px 0', color: '#fbbf24' }}>
                  {formatMonthName(selectedMonth)} — En cours de traitement
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                  Les données des réclamations sont en cours de traitement par le service {serviceName}. Les résultats apparaîtront ici une fois le traitement terminé.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px 20px', borderRadius: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                  <span className="animate-hourglass">⏳</span>
                  <span>En attente de traitement par le {serviceName}</span>
                </div>
              </div>
            );
          }

          // VUE ACTUEL — Mois clôturé : Tableau récapitulatif (sans les cartes)
          if (isUnlocked && activeTab === 'actuel') {
            const filteredFinished = finishedForPeriod.filter(r => {
              if (!globalSearchTerm) return true;
              const s = globalSearchTerm.toLowerCase();
              return (r.agent_nom && r.agent_nom.toLowerCase().includes(s)) || (r.agent_site && r.agent_site.toLowerCase().includes(s));
            });
            return (
              <div style={{ marginTop: '10px', animation: 'slideUp 0.5s ease-out' }}>
                {/* Récapitulatif global */}
                <div className="glass-panel" style={{ border: '2px solid white', padding: '0px', overflow: 'hidden' }}>
                  <div className="table-container" style={{ margin: 0, maxHeight: '65vh', overflowY: 'auto' }}>
                    <table className="custom-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)' }}>
                        <tr>
                          <th colSpan="6" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Archive size={18} color="#a855f7" /> Récapitulatif global du mois
                              </h4>
                              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input 
                                  type="text" 
                                  placeholder="Rechercher un agent ou un site..." 
                                  value={globalSearchTerm} 
                                  onChange={(e) => setGlobalSearchTerm(e.target.value)} 
                                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                />
                              </div>
                            </div>
                          </th>
                        </tr>
                        <tr>
                          <th style={{ paddingLeft: '24px' }}>Agent</th>
                          <th>Site</th>
                          <th>Catégorie</th>
                          <th>Action Demandée</th>
                          <th>Statut Final</th>
                          <th style={{ paddingRight: '24px' }}>Motif Refus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFinished.map(r => {
                          const isRefused = r.statut === 'Refusé' || r.statut_final === 'Refusée';
                          return (
                            <tr key={r.id}>
                              <td style={{ paddingLeft: '24px' }}>{r.agent_nom}</td>
                              <td>{r.agent_site}</td>
                              <td>{r.categorie || 'DIVERS'}</td>
                              <td>{r.action_demandee || '—'}</td>
                              <td>
                                <span style={{ background: !isRefused ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: !isRefused ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                  {!isRefused ? '✅ Validé' : '❌ Refusé'}
                                </span>
                              </td>
                              <td style={{ paddingRight: '24px', color: '#ef4444', fontSize: '0.85rem' }}>{isRefused ? (r.motif_refus || '—') : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          }

          // VUE ACTUEL : Cartes (Secrétariat avant traitement, ou PC avant publication)
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'flex-start', marginTop: '24px' }}>
              {RECLAMATION_CATEGORIES.map((cat, idx) => {
                const recs = groupedReclamations[selectedPeriod] || [];
                let catRecs = [];
                if (canEdit) {
                    catRecs = recs.filter(r => (r.categorie || 'DIVERS') === cat.id && r.statut === 'Brouillon');
                } else if (isModifierNo) {
                    catRecs = recs.filter(r => (r.categorie || 'DIVERS') === cat.id && r.statut === 'En attente');
                } else {
                    catRecs = recs.filter(r => (r.categorie || 'DIVERS') === cat.id);
                }
                
                const nbToTreat = catRecs.length;
                const Icon = cat.icon;
                if (!canEdit && !isModifierNo && nbToTreat === 0) return null;
                
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setSelectedMonth(selectedPeriod); setSelectedCategory(cat.id); setCurrentView('month_detail'); }}
                    className="glass-panel"
                    style={{ cursor: 'pointer', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.4s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0, width: '320px', flex: '0 0 auto', borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px -10px ${cat.shadow}`; e.currentTarget.style.borderColor = cat.border; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${cat.bg} 0%, transparent 70%)`, borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: cat.bg, borderRadius: '10px', padding: '10px', color: cat.color }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: '700', fontSize: '0.95rem', margin: 0, color: 'white' }}>{cat.label}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                          {nbToTreat} fiche(s) à traiter
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  const renderMonthDetailView = () => {
    const recs = groupedReclamations[selectedMonth] || [];
    
    // Filtrage par recherche et catégorie
    const filteredRecs = recs.filter(r => {
      if ((r.categorie || 'DIVERS') !== selectedCategory) return false;
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (r.agent_nom && r.agent_nom.toLowerCase().includes(searchLower)) ||
             (r.agent_site && r.agent_site.toLowerCase().includes(searchLower));
    });

    const drafts = filteredRecs.filter(r => r.statut === 'Brouillon');
    const published = filteredRecs.filter(r => r.statut !== 'Brouillon');
    
    const catConfig = RECLAMATION_CATEGORIES.find(c => c.id === selectedCategory) || RECLAMATION_CATEGORIES[3];

    return (
      <div className="fade-in">
        {/* Header Espace de travail */}
        <div style={{ marginBottom: '30px', paddingTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Bouton Retour Premium à gauche, légèrement descendu */}
          <div style={{ paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setCurrentView('months')} 
              style={{ 
                background: 'white', 
                border: '1px solid rgba(255,255,255,0.05)', 
                color: '#1e293b', 
                cursor: 'pointer', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                fontSize: '0.9rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#38bdf8';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.transform = 'translateX(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(56, 189, 248, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <ArrowLeft size={16} style={{ transition: 'transform 0.3s' }} /> Retour aux catégories
            </button>
          </div>

          {/* Titre (plus petit) et Actions à droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Rechercher un agent ou un site..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    padding: '10px 10px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'white',
                    color: '#1e293b',
                    fontSize: '1rem',
                    width: '300px',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.background = 'white';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'white';
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {canEdit && (
                <button onClick={handleOpenFormNew} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                  <FilePlus size={18} /> Ajouter une fiche
                </button>
              )}
              {canModifyNo && published.some(r => r.statut === 'En attente') && (
                <button onClick={() => {
                  const toNumber = published.filter(r => r.statut === 'En attente');
                  const initNums = {};
                  toNumber.forEach(r => initNums[r.id] = r.numero_fiche || '');
                  setManualNumbers(initNums);
                  setShowNumberingModal(true);
                }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                  <Edit3 size={18} /> Attribuer N° & Transmettre
                </button>
              )}
              {canApprove && published.some(r => r.statut === 'Transmis') && (
                <button onClick={() => setShowCloseMonthModal(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                  <CheckCircle size={18} /> Valider pour ce mois
                </button>
              )}
            </div>
          </div>
        </div>


        {recs.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15,23,42,0.5)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
             <FileText size={48} color="#475569" style={{ marginBottom: '15px' }} />
             <h3 style={{ margin: '0 0 10px 0', color: '#cbd5e1' }}>Espace Vierge</h3>
             <p style={{ color: '#94a3b8', margin: '0 0 20px 0' }}>Il n'y a aucune réclamation pour ce mois.</p>
             {canEdit && (
               <button onClick={handleOpenFormNew} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Plus size={18}/> Créer la première fiche</button>
             )}
           </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px', marginTop: '80px' }}>
            
            {/* Rendu des BROUILLONS (Design Mini-PDF) */}
            {drafts.map(rec => (
              <div 
                key={rec.id} 
                style={{ 
                  background: '#cbd5e1', 
                  color: 'black', 
                  border: '1px solid #94a3b8', 
                  borderRadius: '8px', 
                  padding: '3px', 
                  position: 'relative', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 35px rgba(0,0,0,0.4), 0 0 15px rgba(245,158,11,0.4)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
              >
                <div style={{ background: 'white', flex: 1, padding: '15px', borderRadius: '5px', fontFamily: '"Times New Roman", serif', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>BROUILLON</div>
                  {rec.numero_fiche && (
                    <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>N° {rec.numero_fiche}</div>
                  )}
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a' }}>{rec.agent_nom || 'Agent Non Renseigné'}</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#475569' }}>Site: <strong>{rec.agent_site || 'N/A'}</strong></p>
                  
                  {rec.statut_final && (
                    <div style={{ background: rec.statut_final === 'Validé' ? '#dcfce7' : '#fee2e2', color: rec.statut_final === 'Validé' ? '#166534' : '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px' }}>
                      <strong>{rec.statut_final}</strong>
                      {rec.motif_refus && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>Motif: {rec.motif_refus}</div>}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    {canEdit && (
                      <button onClick={() => handleOpenFormEdit(rec)} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                        <Edit3 size={14} /> Modifier
                      </button>
                    )}
                    <button onClick={() => handleOpenPreviewExisting(rec)} style={{ flex: 1, background: '#64748b', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#475569'} onMouseLeave={e => e.currentTarget.style.background = '#64748b'}>
                      <Eye size={14} /> Voir
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Rendu des fiches PUBLIÉES */}
            {published.map(rec => (
              <div 
                key={rec.id} 
                style={{ 
                  background: '#cbd5e1', 
                  color: 'black', 
                  border: '1px solid #94a3b8', 
                  borderRadius: '8px', 
                  padding: '3px', 
                  position: 'relative', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 35px rgba(0,0,0,0.4), 0 0 15px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
              >
                <div style={{ background: 'white', flex: 1, padding: '15px', borderRadius: '5px', fontFamily: '"Times New Roman", serif', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: getStatusColor(rec.statut), color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 10, textTransform: 'uppercase' }}>
                    {rec.statut}
                  </div>
                  {rec.numero_fiche && (
                    <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>N° {rec.numero_fiche}</div>
                  )}
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a' }}>{rec.agent_nom || 'Agent Non Renseigné'}</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#475569' }}>Matricule: {rec.agent_matricule} | Site: <strong>{rec.agent_site || 'N/A'}</strong></p>
                  
                  {rec.statut_final && (
                    <div style={{ background: rec.statut_final === 'Validé' ? '#dcfce7' : '#fee2e2', color: rec.statut_final === 'Validé' ? '#166534' : '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px' }}>
                      <strong>{rec.statut_final}</strong>
                      {rec.motif_refus && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>Motif: {rec.motif_refus}</div>}
                    </div>
                  )}
                  
                  <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginBottom: '15px' }}>
                    {/* Avis déduit dynamiquement du statut */}
                    {(() => {
                      const statut = rec.statut;
                      const secTraite = ['Transmis', 'Clôturé', 'Refusé'].includes(statut);
                      const compTraite = ['Clôturé', 'Refusé'].includes(statut) || !!rec.statut_final;
                      const compAvis = rec.avis_comptabilite || (statut === 'Clôturé' ? 'Favorable' : (statut === 'Refusé' || rec.statut_final === 'Refusée' ? 'Défavorable' : null));
                      const secAvis = rec.avis_secretariat || (secTraite ? 'Favorable' : null);
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#334155' }}>
                            {secTraite ? <CheckCircle size={14} color="#10b981" /> : <Loader2 size={14} color="#f59e0b" />}
                            <span><strong>Secrétariat :</strong> {secAvis || 'En attente'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                            {compTraite ? <CheckCircle size={14} color="#10b981" /> : <Loader2 size={14} color="#f59e0b" />}
                            <span><strong>Comptabilité :</strong> {compAvis || 'En attente'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                    {canApprove && rec.statut === 'Transmis' && !rec.statut_final && (
                      <>
                        <button onClick={() => { setActionRec(rec); setMotifRefus(''); }} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Refuser</button>
                        <button onClick={async () => {
                          await apiCall('batch_update_reclamations', { updates: [{ id: rec.id, fields: { statut_final: 'Validé', motif_refus: '' } }] }, 'POST');
                          fetchReclamations();
                        }} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Valider</button>
                      </>
                    )}
                    <button onClick={() => handleOpenPreviewExisting(rec)} style={{ flex: 1, background: '#64748b', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#475569'} onMouseLeave={e => e.currentTarget.style.background = '#64748b'}>
                      <Eye size={14} /> Fiche PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFormView = () => (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <button onClick={() => setCurrentView('month_detail')} style={{ background: 'white', border: '1px solid rgba(255,255,255,0.05)', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', padding: '8px 18px', borderRadius: '12px', transition: 'all 0.3s ease', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateX(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(239, 68, 68, 0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}>
          <ArrowLeft size={16} /> Annuler
        </button>
        <button type="button" onClick={() => setShowSettings(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }} onMouseEnter={e => { e.currentTarget.style.background = '#60a5fa'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)'; }}>
          <Settings size={18} color="white" /> Design du formulaire
        </button>
      </div>

      <form onSubmit={handleOpenPreview}>
        {formLayout === 'classique' && <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}><div><h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>1. Concerné</h3>{renderAgentSection()}</div><div><h3 style={{ color: '#a855f7', marginBottom: '15px' }}>2. Déclarant</h3>{renderDeclarantSection()}</div><div><h3 style={{ color: '#10b981', marginBottom: '15px' }}>3. Administration</h3>{renderAdminSection()}</div><div><h3 style={{ color: '#f59e0b', marginBottom: '15px' }}>4. Action</h3>{renderActionSection()}</div></div></div>}
        {formLayout === 'cards' && <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}><div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '3px solid #38bdf8', borderRadius: '20px', padding: '35px', position: 'relative' }}><h3 style={{ margin: '0 0 25px 0', color: '#38bdf8', fontSize: '1.4rem' }}>1. Concerné</h3>{renderAgentSection()}</div><div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '3px solid #a855f7', borderRadius: '20px', padding: '35px', position: 'relative' }}><h3 style={{ margin: '0 0 25px 0', color: '#a855f7', fontSize: '1.4rem' }}>2. Déclarant</h3>{renderDeclarantSection()}</div><div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '3px solid #10b981', borderRadius: '20px', padding: '35px', position: 'relative' }}><h3 style={{ margin: '0 0 25px 0', color: '#10b981', fontSize: '1.4rem' }}>3. Administration</h3>{renderAdminSection()}</div><div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '3px solid #f59e0b', borderRadius: '20px', padding: '35px', position: 'relative' }}><h3 style={{ margin: '0 0 25px 0', color: '#f59e0b', fontSize: '1.4rem' }}>4. Action</h3>{renderActionSection()}</div></div>}
        {formLayout === 'wizard' && <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}><div style={{ position: 'absolute', top: '15px', left: 0, width: `${((wizardStep - 1) / 3) * 100}%`, height: '2px', background: '#38bdf8' }}></div>{[1, 2, 3, 4].map(step => (<div key={step} onClick={() => setWizardStep(step)} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: wizardStep >= step ? '#38bdf8' : '#1e293b', color: wizardStep >= step ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step}</div></div>))}</div><div style={{ minHeight: '300px' }}>{wizardStep === 1 && renderAgentSection()}{wizardStep === 2 && renderDeclarantSection()}{wizardStep === 3 && renderAdminSection()}{wizardStep === 4 && renderActionSection()}</div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}><button type="button" onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}>Précédent</button>{wizardStep < 4 && <button type="button" onClick={() => setWizardStep(Math.min(4, wizardStep + 1))}>Suivant</button>}</div></div>}
        {formLayout === 'split' && <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}><div style={{ flex: '0 0 350px', position: 'sticky', top: '20px', background: '#0f172a', borderRadius: '20px', padding: '30px' }}><FileWarning size={28} color="#38bdf8" /><h2>Déclaration</h2><p>Remplissez le formulaire ci-contre.</p></div><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>{renderAgentSection()}{renderDeclarantSection()}{renderAdminSection()}{renderActionSection()}</div></div>}

        {!(formLayout === 'wizard' && wizardStep < 4) && (
          <>
            {/* Zone Signature */}
            <div style={{ marginTop: '30px', background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '16px', border: formData.radio_signature ? '2px solid #10b981' : '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><PenTool size={18} /> Signature Opérateur Radio</h4>
                {formData.radio_code ? (
                  <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>Signé par : {formData.radio_code}</p>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Aucune signature apposée (Optionnel)</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {formData.radio_signature && (
                  <div style={{ background: 'white', padding: '5px', borderRadius: '8px', height: '50px' }}>
                    <img src={formData.radio_signature} alt="Signature" style={{ height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <button type="button" onClick={() => setShowSignatureSelect(true)} style={{ background: '#38bdf8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#0284c7'} onMouseLeave={e => e.currentTarget.style.background = '#38bdf8'}>
                  {formData.radio_code ? 'Changer de signature' : 'Apposer Signature Radio'}
                </button>
              </div>
            </div>

            {/* Boutons d'action finaux */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '20px', marginBottom: '40px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '3px solid white' }}>
              <button type="button" onClick={() => saveReclamation('Brouillon')} disabled={submitting} style={{ background: 'transparent', color: '#38bdf8', border: '2px solid #38bdf8', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.3)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <FilePlus size={20} />} Enregistrer (Brouillon)
              </button>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '16px 36px', borderRadius: '12px', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa, #3b82f6)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <Eye size={22} /> Examiner l'Aperçu PDF avant l'Envoi
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );

  return (
    <div style={{ padding: '0 24px 24px 24px', width: '100%', margin: '-15px 0 0 0', color: '#f8fafc' }}>
      
      {currentView === 'months' && renderMonthsView()}
      {currentView === 'month_detail' && renderMonthDetailView()}
      {currentView === 'form' && renderFormView()}

      {/* MODAL SETTINGS (Design) */}
      {showSettings && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '700px', padding: '40px', position: 'relative' }}>
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}><X size={28} /></button>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px' }}><Settings size={28} color="#38bdf8" /> Interface</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <button onClick={() => { setFormLayout('classique'); setShowSettings(false); }} style={{ background: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', textAlign: 'left', border: formLayout === 'classique' ? '2px solid #38bdf8' : 'none', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(56, 189, 248, 0.2)'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'white'; }}>Classique</button>
              <button onClick={() => { setFormLayout('cards'); setShowSettings(false); }} style={{ background: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', textAlign: 'left', border: formLayout === 'cards' ? '2px solid #38bdf8' : 'none', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(56, 189, 248, 0.2)'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'white'; }}>Cartes (Premium)</button>
              <button onClick={() => { setFormLayout('wizard'); setShowSettings(false); }} style={{ background: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', textAlign: 'left', border: formLayout === 'wizard' ? '2px solid #38bdf8' : 'none', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(56, 189, 248, 0.2)'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'white'; }}>Multi-étapes</button>
              <button onClick={() => { setFormLayout('split'); setShowSettings(false); }} style={{ background: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', textAlign: 'left', border: formLayout === 'split' ? '2px solid #38bdf8' : 'none', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(56, 189, 248, 0.2)'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'white'; }}>Split Screen</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLICATION */}
      {showPublishModal && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '500px', padding: '40px', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setShowPublishModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}><X size={28} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px' }}><Share2 size={28} color="#10b981" /></div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'white' }}>Publier les fiches</h2>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>À quels services souhaitez-vous envoyer les brouillons de ce mois ?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '12px', background: selectedPublishServices.includes('Secrétariat') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPublishServices.includes('Secrétariat') ? '#10b981' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={selectedPublishServices.includes('Secrétariat')} onChange={() => togglePublishService('Secrétariat')} style={{ transform: 'scale(1.2)' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Secrétariat</span>
              </label>
            </div>

            <button 
              disabled={submitting} 
              onClick={publishReclamations} 
              style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}
              onMouseEnter={e => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = '#059669';
                }
              }}
              onMouseLeave={e => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#10b981';
                }
              }}
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Confirmer la publication
            </button>
          </div>
        </div>
      )}

      {/* MODAL APERCU PDF */}
      {showPreview && previewData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={24} /> Aperçu de la fiche</h2>
            <button onClick={() => setShowPreview(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}><X size={32} /></button>
          </div>
          <PdfPreview data={previewData} />
          {/* Note: Il n'y a plus de bouton d'envoi ici. C'est juste un aperçu comme demandé. */}
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setShowPreview(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}>Fermer l'aperçu</button>
          </div>
        </div>
      )}
      {/* MODAL NUMEROTATION ET TRANSMISSION */}
      {showNumberingModal && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '600px', padding: '40px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowNumberingModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            <h2 style={{ color: 'white', margin: '0 0 20px 0' }}>Attribuer Numéros et Transmettre</h2>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '10px' }}>Numérotation Automatique (N° de départ)</label>
              <input type="number" value={numberingStart} onChange={e => setNumberingStart(e.target.value)} placeholder="Ex: 100" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #38bdf8', background: 'white', fontSize: '1rem', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
              <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Ou numérotation manuelle par agent :</h4>
              {groupedReclamations[selectedMonth].filter(r => r.statut === 'En attente').map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '8px' }}>
                  <span style={{ color: 'white' }}>{r.agent_nom}</span>
                  <input type="text" value={manualNumbers[r.id] || ''} onChange={e => setManualNumbers(prev => ({...prev, [r.id]: e.target.value}))} placeholder="N°" style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }} />
                </div>
              ))}
            </div>

            <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Service Destinataire :</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px', maxHeight: '150px', overflowY: 'auto' }}>
              {companyServices.map(srv => (
                <label key={srv.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', borderRadius: '8px', background: selectedPublishServices.includes(srv.name) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedPublishServices.includes(srv.name)} onChange={() => togglePublishService(srv.name)} />
                  <span style={{ color: '#cbd5e1' }}>{srv.name}</span>
                </label>
              ))}
            </div>

            <button disabled={submitting || selectedPublishServices.length === 0} onClick={handleAssignNumbersAndForward} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: (submitting || selectedPublishServices.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Enregistrer N° et Transmettre
            </button>
          </div>
        </div>
      )}

      {/* MODAL REFUS FICHE */}
      {actionRec && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '500px', padding: '40px', position: 'relative' }}>
            <button onClick={() => setActionRec(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            <h2 style={{ color: 'white', margin: '0 0 20px 0' }}>Refuser la réclamation</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Agent: {actionRec.agent_nom}</p>
            <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)} placeholder="Motif du refus obligatoire..." style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', background: 'white', border: '1px solid #ef4444', outline: 'none', marginBottom: '20px', fontSize: '1rem' }} />
            <button disabled={!motifRefus.trim()} onClick={async () => {
              await apiCall('batch_update_reclamations', { updates: [{ id: actionRec.id, fields: { statut_final: 'Refusée', motif_refus: motifRefus } }] }, 'POST');
              setActionRec(null);
              fetchReclamations();
            }} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: !motifRefus.trim() ? 'not-allowed' : 'pointer' }}>
              Confirmer le refus
            </button>
          </div>
        </div>
      )}

      {/* MODAL CLOTURE MOIS */}
      {showCloseMonthModal && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '500px', padding: '40px', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowCloseMonthModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            <h2 style={{ color: 'white', margin: '0 0 20px 0' }}>Valider pour ce mois</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '1.05rem', lineHeight: 1.5 }}>
              Cette action va clôturer définitivement les réclamations pour ce mois. Les statuts Validé/Refusé seront partagés avec tous les services impliqués.
            </p>
            <button disabled={submitting} onClick={handleCloseMonth} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmer la clôture'}
            </button>
          </div>
        </div>
      )}
      {/* MODAL CONFIGURATION SIGNATURES RADIO */}
      {showSignatureConfig && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '600px', padding: '40px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowSignatureConfig(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            <h2 style={{ color: 'white', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><PenTool size={24} color="#38bdf8" /> Signatures Opérateurs Radio</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '15px' }}>Nouvel Opérateur</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <InputClean label="Nom de Code (Ex: PENTAGONE 5)" field="newRadioCode" formData={{ newRadioCode }} onChange={(_, val) => setNewRadioCode(val)} />
                  <InputClean label="Nom" field="newRadioNom" placeholder="Ex: Martin" formData={{ newRadioNom }} onChange={(_, val) => setNewRadioNom(val)} />
                  <InputClean label="Prénom(s)" field="newRadioPrenom" placeholder="Ex: Paul" formData={{ newRadioPrenom }} onChange={(_, val) => setNewRadioPrenom(val)} />
                  <InputClean label="Matricule" field="newRadioMatricule" placeholder="Ex: 54321" formData={{ newRadioMatricule }} onChange={(_, val) => setNewRadioMatricule(val)} />
                  <InputClean label="Fonction" field="newRadioFonction" placeholder="Ex: Chef d'équipe" formData={{ newRadioFonction }} onChange={(_, val) => setNewRadioFonction(val)} />
                  <InputClean label="Service" field="newRadioService" placeholder="Ex: Comptabilité" formData={{ newRadioService }} onChange={(_, val) => setNewRadioService(val)} />
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>Option 1 : Dessiner la signature</label>
                  <SignatureCanvas onSave={(img) => setNewRadioImage(img)} />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>Option 2 : Importer une image</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', color: 'white', width: 'max-content' }}>
                    <Upload size={18} /> Choisir un fichier
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {newRadioImage && (
                  <div style={{ marginTop: '20px', padding: '10px', background: 'white', borderRadius: '10px', display: 'inline-block' }}>
                    <img src={newRadioImage} alt="Aperçu signature" style={{ maxHeight: '100px' }} />
                  </div>
                )}

                <button disabled={submitting} onClick={saveRadioSignature} style={{ width: '100%', marginTop: '20px', background: '#38bdf8', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? <Loader2 className="animate-spin" /> : 'Enregistrer la signature'}
                </button>
              </div>

              <div>
                <h3 style={{ color: 'white', marginBottom: '15px' }}>Opérateurs Enregistrés</h3>
                {radioSignatures.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>Aucune signature enregistrée.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {radioSignatures.map(sig => (
                      <div key={sig.code} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>{sig.code}</span>
                        <div style={{ background: 'white', padding: '5px', borderRadius: '8px', width: '100%' }}>
                          <img src={sig.image} alt={`Signature ${sig.code}`} style={{ width: '100%', height: 'auto', maxHeight: '60px', objectFit: 'contain' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTION SIGNATURE POUR LA FICHE */}
      {showSignatureSelect && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '40px', position: 'relative' }}>
            <button onClick={() => setShowSignatureSelect(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            <h2 style={{ color: 'white', margin: '0 0 20px 0' }}>Signer la fiche</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Sélectionnez votre nom de code d'opérateur :</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {radioSignatures.map(sig => (
                <button 
                  key={sig.code} 
                  onClick={() => {
                    setFormData({ ...formData, radio_code: sig.code, radio_signature: sig.image });
                    setShowSignatureSelect(false);
                  }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  {sig.code}
                  <div style={{ background: 'white', padding: '2px', borderRadius: '4px', height: '30px' }}>
                     <img src={sig.image} style={{ height: '100%' }} alt="sig" />
                  </div>
                </button>
              ))}
              {radioSignatures.length === 0 && <p style={{ color: '#ef4444' }}>Aucune signature configurée.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Mois Suivant */}
      {showNextMonthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(168,85,247,0.5)', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease-out' }}>
            <h3 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '1.4rem' }}>Passage au mois suivant</h3>
            <p style={{ color: '#94a3b8', margin: '20px 0', lineHeight: '1.5', fontSize: '1rem' }}>
              Voulez-vous vraiment basculer l'interface des réclamations sur le mois de <strong style={{ color: '#a855f7' }}>{formatMonthName(pendingNextPeriod)}</strong> ?
              <br/><br/>
              Ce choix sera mémorisé pour vos prochaines connexions.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
              <button 
                onClick={() => setShowNextMonthModal(false)}
                disabled={isInitializing}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '10px', border: '1px solid #475569', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: isInitializing ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s', opacity: isInitializing ? 0.5 : 1 }}
                onMouseEnter={e => !isInitializing && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => !isInitializing && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >Annuler</button>
              <button 
                disabled={isInitializing}
                onClick={async () => {
                  setIsInitializing(true);
                  try {
                    // Force l'initialisation du mois suivant dans la base de données (comme le module Pointage)
                    const res = await apiCall('init_next_period', { current_period: selectedPeriod, next_period: pendingNextPeriod, sites_to_keep_hs: {} }, 'POST');
                    
                    if (!res || !res.success) {
                       alert("Impossible d'initialiser le mois suivant : " + (res?.message || "Erreur serveur non spécifiée."));
                       return;
                    }

                    // On force la mise à jour de max_initialized_period dans le backend au cas où la fonction précédente aurait sauté l'étape (ex: s'il n'y a aucun agent actif détecté)
                    await apiCall('set_first_visit_period', { period: pendingNextPeriod }, 'POST');

                    setSelectedPeriod(pendingNextPeriod);
                    localStorage.setItem('pontage_period', pendingNextPeriod);
                    window.dispatchEvent(new CustomEvent('pontage_period_changed', { detail: pendingNextPeriod }));
                    
                    setShowNextMonthModal(false);
                  } catch (error) {
                    console.error("Erreur lors de l'initialisation du mois :", error);
                    alert("Une erreur de réseau s'est produite lors de la création du nouveau mois.");
                  } finally {
                    setIsInitializing(false);
                  }
                }}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', cursor: isInitializing ? 'not-allowed' : 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(168,85,247,0.4)', transition: 'all 0.2s', opacity: isInitializing ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { if(!isInitializing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(168,85,247,0.6)'; } }}
                onMouseLeave={e => { if(!isInitializing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(168,85,247,0.4)'; } }}
              >
                {isInitializing ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Traitement...
                  </span>
                ) : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL ERREUR PUBLICATION */}
      {publishError && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px', width: '90%', maxWidth: '450px', padding: '40px', position: 'relative', textAlign: 'center', boxShadow: '0 25px 50px rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
              <AlertTriangle size={48} color="#ef4444" />
            </div>
            <h2 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '1.5rem' }}>Action Impossible</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '30px', whiteSpace: 'pre-line' }}>
              {publishError}
            </p>
            <button onClick={() => setPublishError('')} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#dc2626'} onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
