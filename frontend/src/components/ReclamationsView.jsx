import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { FileText, CheckCircle, Send, Loader2, Calendar, FileWarning, X, Eye, Settings, LayoutTemplate, Layers, Columns, Grid, FolderOpen, ArrowLeft, Edit3, Share2, Plus, Users, FilePlus, Search } from 'lucide-react';

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
          <h1 style={{ textDecoration: 'underline', fontSize: '24px', margin: '30px 0 0 0' }}>FICHE DE RECLAMATION</h1>
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
        <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '5px' }}>
          Signature de l'agent
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
                Signature & Cachet
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
                Signature & Cachet
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
      <select value={formData[field]} onChange={e => onChange(field, e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = '#38bdf8'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
        {options.map(opt => <option key={opt} value={opt} style={{color:'black'}}>{opt}</option>)}
      </select>
      {formData[field] === 'Autre' && (
        <input type="text" placeholder="Veuillez préciser..." required value={formData[fieldAutre] || ''} onChange={e => onChange(fieldAutre, e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '14px', borderRadius: '10px', border: '1px solid #38bdf8', background: 'white', color: '#1e293b', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s' }} autoFocus />
      )}
    </div>
  </div>
);

export default function ReclamationsView() {
  const { user } = useAuth();
  
  // Droit d'édition exclusif
  const canEdit = user?.role === 'admin' || user?.role === 'super_admin' ||
    (user?.permissions?.reclamation_edit && user.permissions.reclamation_edit !== false && user.permissions.reclamation_edit !== 'none');

  const canModifyNo = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.reclamation_view === 'modifier_no';
  const canApprove = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.reclamation_view === 'approver_3';

  // Navigation State
  const [currentView, setCurrentView] = useState('months'); // 'months' | 'month_detail' | 'form'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyServices, setCompanyServices] = useState([]);
  
  // Modals & Settings
  const [formLayout, setFormLayout] = useState('cards'); 
  const [wizardStep, setWizardStep] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPublishServices, setSelectedPublishServices] = useState([]);

  // Nouveaux Modals pour Circuit de Validation
  const [showNumberingModal, setShowNumberingModal] = useState(false);
  const [numberingStart, setNumberingStart] = useState('');
  const [manualNumbers, setManualNumbers] = useState({});
  const [showCloseMonthModal, setShowCloseMonthModal] = useState(false);
  const [actionRec, setActionRec] = useState(null); // Pour Valider/Refuser une fiche
  const [motifRefus, setMotifRefus] = useState('');

  const defaultFormData = {
    id: '', statut: 'Brouillon',
    agent_nom: '', agent_matricule: '', agent_site: '', agent_fonction: '', date_entree: '', reclamation_categorie: 'Salaire', reclamation_categorie_autre: '',
    declarant_nom: '', declarant_prenom: '', declarant_matricule: '', declarant_fonction: '', declarant_service: user?.service || '',
    type_erreur: 'Erreur de pointage(s)', type_erreur_autre: '', mois_concerne: '', jours_concernes: '', premiere_reclamation: 'Oui', ponction_precedente_correcte: 'Non',
    montant_estime: '', action_demandee: 'A payer', description: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Initial Fetch — relancer si les permissions changent (connexion asynchrone)
  useEffect(() => {
    if (user) {
      fetchReclamations();
      fetchServices();
    }
  }, [user?.permissions?.reclamation_view, user?.permissions?.reclamation_edit, user?.role]);

  const fetchReclamations = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_reclamations', {}, 'GET');
      if (res.success) {
        let data = res.reclamations || [];
        const userPermsRec = user?.permissions?.reclamation_view;
        const isModifierNo = userPermsRec === 'modifier_no';
        const isApprobateur = userPermsRec === 'approver_3';
        const isEditor = user?.role === 'admin' || user?.role === 'super_admin' ||
          (user?.permissions?.reclamation_edit && user.permissions.reclamation_edit !== false && user.permissions.reclamation_edit !== 'none');

        if (!isEditor) {
          data = data.filter(r => {
             if (r.statut === 'Brouillon') return false;
             
             // Une fois Clôturé, tout le monde visé peut consulter la version finale
             if (r.statut === 'Clôturé') {
                 return r.services_cibles?.includes('Tous') || r.services_cibles?.includes(user?.service);
             }
             
             // Le Numéroteur voit les fiches de l'étape 1
             if (isModifierNo && r.statut === 'En attente') return true;
             
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
    setFormData({ ...defaultFormData, mois_concerne: selectedMonth });
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

  const publishReclamations = async () => {
    if (selectedPublishServices.length === 0) {
      alert("Veuillez sélectionner au moins un service.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiCall('publish_reclamations', { 
        mois: selectedMonth, 
        services: selectedPublishServices 
      }, 'POST');
      if (res.success) {
        setShowPublishModal(false);
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
      <InputClean label="Nom & Prénom(s)" field="agent_nom" placeholder="Ex: Jean Dupont" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Matricule" field="agent_matricule" placeholder="Ex: 12345" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Site / Zone" field="agent_site" placeholder="Ex: Zone Industrielle" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Fonction" field="agent_fonction" placeholder="Ex: Agent de sécurité" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Date d'entrée" field="date_entree" type="text" placeholder="Ex: 01/01/2020" formData={formData} onChange={handleFieldChange} />
      <SelectWithOther label="Catégorie" field="reclamation_categorie" fieldAutre="reclamation_categorie_autre" options={['Salaire', 'Tenue', 'Matériel / Equipement', 'Autre']} formData={formData} onChange={handleFieldChange} />
    </div>
  );
  const renderDeclarantSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <InputClean label="Nom" field="declarant_nom" placeholder="Ex: Martin" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Prénom(s)" field="declarant_prenom" placeholder="Ex: Paul" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Matricule" field="declarant_matricule" placeholder="Ex: 54321" formData={formData} onChange={handleFieldChange} />
      <InputClean label="Fonction" field="declarant_fonction" placeholder="Ex: Chef d'équipe" required formData={formData} onChange={handleFieldChange} />
      <InputClean label="Service" field="declarant_service" placeholder="Ex: Comptabilité" formData={formData} onChange={handleFieldChange} />
    </div>
  );
  const renderAdminSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
      <SelectWithOther label="Type d'erreur" field="type_erreur" fieldAutre="type_erreur_autre" options={['Abandon de poste(s)', 'Absence', 'Erreur de pointage(s)', 'Mise à pied', 'Arrêt de pointage', 'Autre']} formData={formData} onChange={handleFieldChange} />
      <InputClean label="Mois Concerné" field="mois_concerne" type="text" placeholder="Ex: Janvier 2024" required formData={formData} onChange={handleFieldChange} />
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
      // Clôture
      const res = await apiCall('publish_reclamations', {
        mois: selectedMonth,
        services: ['Tous'],
        from_status: 'Transmis',
        to_status: 'Clôturé'
      }, 'POST');
      if (res.success) {
        setShowCloseMonthModal(false);
        fetchReclamations();
      }
    } catch(e) {}
    setSubmitting(false);
  };

  // ====== VIEWS ======

  const renderMonthsView = () => (
    <div className="fade-in">
      <div style={{ marginBottom: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
        <div style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)' }}><FolderOpen size={24} color="white" /></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}><h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Dossiers de Réclamations</h1><span style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Parcourez les fiches triées par mois.</span></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Loader2 className="animate-spin" size={40} color="#a855f7" /></div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'flex-start' }}>
          {Object.keys(groupedReclamations).sort().reverse().map(mois => {
            const recs = groupedReclamations[mois];
            const nbBrouillons = recs.filter(r => r.statut === 'Brouillon').length;
            const nbPublies = recs.length - nbBrouillons;

            return (
              <div key={mois} onClick={() => { setSelectedMonth(mois); setCurrentView('month_detail'); }} style={{ width: '320px', flex: '0 0 auto', background: 'linear-gradient(180deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)', border: '3px solid white', borderRadius: '20px', padding: '25px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#38bdf8'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'white'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={24} color="#38bdf8" /></div>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: 'white', textTransform: 'capitalize' }}>{formatMonthName(mois)}</h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                  {canEdit && (
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px' }}>{nbBrouillons} brouillons</span>
                  )}
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '6px' }}>{nbPublies} envoyées</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMonthDetailView = () => {
    const recs = groupedReclamations[selectedMonth] || [];
    
    // Filtrage par recherche
    const filteredRecs = recs.filter(r => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (r.agent_nom && r.agent_nom.toLowerCase().includes(searchLower)) ||
             (r.agent_site && r.agent_site.toLowerCase().includes(searchLower));
    });

    const drafts = filteredRecs.filter(r => r.statut === 'Brouillon');
    const published = filteredRecs.filter(r => r.statut !== 'Brouillon');

    return (
      <div className="fade-in">
        {/* Header Espace de travail */}
        <div style={{ marginBottom: '30px', paddingTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Bouton Retour Premium à gauche, légèrement descendu */}
          <div style={{ paddingTop: '10px' }}>
            <button 
              onClick={() => setCurrentView('months')} 
              style={{ 
                background: 'white', 
                border: '1px solid rgba(255,255,255,0.05)', 
                color: '#1e293b', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 18px', 
                borderRadius: '12px',
                fontSize: '0.9rem', 
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f8fafc';
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
              <ArrowLeft size={16} style={{ transition: 'transform 0.3s' }} /> Retour aux mois
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
              {canEdit && drafts.length > 0 && (
                <button onClick={() => setShowPublishModal(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
                  <Share2 size={18} /> Publier les fiches ({drafts.length})
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#334155' }}>
                      {rec.avis_secretariat ? <CheckCircle size={14} color="#10b981" /> : <Loader2 size={14} color="#f59e0b" />}
                      <span><strong>Secrétariat :</strong> {rec.avis_secretariat || 'En attente'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                      {rec.avis_comptabilite ? <CheckCircle size={14} color="#10b981" /> : <Loader2 size={14} color="#f59e0b" />}
                      <span><strong>Comptabilité :</strong> {rec.avis_comptabilite || 'En attente'}</span>
                    </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '40px', marginBottom: '40px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '3px solid white' }}>
            <button type="button" onClick={() => saveReclamation('Brouillon')} disabled={submitting} style={{ background: 'transparent', color: '#38bdf8', border: '2px solid #38bdf8', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.3)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <FilePlus size={20} />} Enregistrer (Brouillon)
            </button>
            <button type="submit" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '16px 36px', borderRadius: '12px', fontSize: '1.15rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa, #3b82f6)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Eye size={22} /> Examiner l'Aperçu PDF avant l'Envoi
            </button>
          </div>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '12px', background: selectedPublishServices.includes('Tous') ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPublishServices.includes('Tous') ? '#38bdf8' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={selectedPublishServices.includes('Tous')} onChange={() => togglePublishService('Tous')} style={{ transform: 'scale(1.2)' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Tous les services</span>
              </label>
              
              {companyServices.map(srv => (
                <label key={srv.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '12px', background: selectedPublishServices.includes(srv.name) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPublishServices.includes(srv.name) ? '#10b981' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', opacity: selectedPublishServices.includes('Tous') ? 0.5 : 1 }}>
                  <input type="checkbox" checked={selectedPublishServices.includes(srv.name) || selectedPublishServices.includes('Tous')} disabled={selectedPublishServices.includes('Tous')} onChange={() => togglePublishService(srv.name)} style={{ transform: 'scale(1.2)' }} />
                  <span style={{ fontSize: '1.05rem', color: '#cbd5e1' }}>{srv.name}</span>
                </label>
              ))}
              {companyServices.length === 0 && (
                 <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '12px', background: selectedPublishServices.includes('Secrétariat') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPublishServices.includes('Secrétariat') ? '#10b981' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>
                   <input type="checkbox" checked={selectedPublishServices.includes('Secrétariat')} onChange={() => togglePublishService('Secrétariat')} style={{ transform: 'scale(1.2)' }} />
                   <span style={{ fontSize: '1.05rem', color: '#cbd5e1' }}>Secrétariat (Défaut)</span>
                 </label>
              )}
            </div>

            <button disabled={submitting} onClick={publishReclamations} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
    </div>
  );
}
