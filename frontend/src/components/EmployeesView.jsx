import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { 
  Search, UserPlus, Grid, List as ListIcon, X, MapPin, Building, Briefcase, Calendar, 
  Phone, Mail, DollarSign, Clock, ShieldCheck, ArrowLeft, MoreVertical, Edit2, Users, 
  Save, Heart, GraduationCap, FileText, UploadCloud, Globe, CheckCircle, Badge, MessageSquare, FolderOpen, Download, Settings
} from 'lucide-react';

export default function EmployeesView() {
  const [agents, setAgents] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); 
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('pro');
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const fileInputRef = useRef(null);
  const [currentUploadField, setCurrentUploadField] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [newAgent, setNewAgent] = useState({ name: '', subsite_id: '', function: 'AS', shift_type: 'Jour' });

  // Print settings saved locally
  const [printSettings, setPrintSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('elysium_print_settings');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      companyName: 'ELYSIUM SECURITY',
      headerSubtitle: 'Dossier Personnel Confidentiel',
      footerText: 'Signature de l\'Administration : ..............................'
    };
  });

  useEffect(() => {
    localStorage.setItem('elysium_print_settings', JSON.stringify(printSettings));
  }, [printSettings]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sitesRes = await apiCall('get_sites', {}, 'GET');
      if (Array.isArray(sitesRes)) {
        let allSubsites = [];
        sitesRes.forEach(site => {
          if (site.subsites && Array.isArray(site.subsites)) {
            site.subsites.forEach(sub => {
              allSubsites.push({ ...sub, site_name: site.name, site_id: site.id });
            });
          } else {
            allSubsites.push({ id: site.id, name: 'Zone Principale', site_name: site.name, site_id: site.id });
          }
        });
        setSiteData(allSubsites);
      }
      const res = await apiCall('get_all_agents', {}, 'GET');
      if (res && res.success) {
        setAgents(res.agents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.subsite_id) return;
    try {
      const res = await apiCall('add_agent', newAgent);
      if (res.success) {
        setShowAddModal(false);
        setNewAgent({ name: '', subsite_id: '', function: 'AS', shift_type: 'Jour' });
        fetchData(); 
      } else {
        alert(res.message || "Erreur lors de la création.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    }
  };

  const startEditing = () => {
    setEditData({
      name: selectedAgent.name || '',
      function: selectedAgent.function || '',
      salary: selectedAgent.salary || '',
      profile_data: selectedAgent.profile_data || {}
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        agent_id: selectedAgent.id,
        name: editData.name,
        salary: editData.salary,
        profile_data: editData.profile_data
      };
      const res = await apiCall('update_agent_profile', payload);
      if (res.success) {
        setIsEditing(false);
        const updatedAgent = { ...selectedAgent, ...payload };
        setSelectedAgent(updatedAgent);
        setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch(e) {
      alert("Erreur réseau.");
    }
  };

  const updateProfileData = (field, value) => {
    setEditData(prev => ({
      ...prev,
      profile_data: {
        ...(prev.profile_data || {}),
        [field]: value
      }
    }));
  };

  const triggerFileUpload = (fieldName) => {
    if (!isEditing) return;
    setCurrentUploadField(fieldName);
    fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      updateProfileData(currentUploadField, { name: file.name, data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // RH preferences from localStorage
  const rhSortOrder = localStorage.getItem('pontage_rh_sort_order') || 'name';
  const rhHideInactive = localStorage.getItem('pontage_rh_hide_inactive') === 'true';

  const filteredAgents = agents.filter(a => {
    const matchesSearch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.function || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filter out inactive agents if RH preference is enabled
    if (rhHideInactive) {
      const pData = a.profile_data || {};
      // Check if agent has an exit date (date_sortie) or if contract has expired
      if (pData.date_sortie) return false;
      if (pData.contract_type && pData.contract_type.includes('Déterminée') && pData.contract_end) {
        const endDate = new Date(pData.contract_end);
        if (endDate < new Date()) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    switch (rhSortOrder) {
      case 'function':
        return (a.function || '').localeCompare(b.function || '');
      case 'date':
        const dateA = a.profile_data?.contract_start || '';
        const dateB = b.profile_data?.contract_start || '';
        return dateB.localeCompare(dateA); // newest first
      case 'name':
      default:
        return (a.name || '').localeCompare(b.name || '');
    }
  });

  const getSiteName = (subsiteId) => {
    if (!siteData || siteData.length === 0) return 'Chargement...';
    const site = siteData.find(s => s.id === subsiteId);
    if (site) return `${site.site_name} - ${site.name}`;
    return 'Non affecté';
  };

  const renderField = (label, fieldPath, type = 'text', icon = null, options = null) => {
    const value = editData.profile_data?.[fieldPath] || '';
    const displayValue = selectedAgent.profile_data?.[fieldPath] || '—';
    
    if (isEditing) {
      if (type === 'select') {
        return (
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{label}</label>
            <select 
              value={value} 
              onChange={e => updateProfileData(fieldPath, e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', color: 'black', outline: 'none' }}
            >
              <option value="" style={{ color: 'black' }}>Sélectionner...</option>
              {options.map(o => <option key={o.value || o} value={o.value || o} style={{ color: 'black' }}>{o.label || o}</option>)}
            </select>
          </div>
        );
      }
      if (type === 'textarea') {
        return (
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{label}</label>
            <textarea 
              value={value} 
              onChange={e => updateProfileData(fieldPath, e.target.value)}
              rows={4}
              placeholder={label}
              style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid var(--a)', borderRadius: '8px', color: 'black', outline: 'none', boxShadow: '0 0 0 2px rgba(56,189,248,0.1)', resize: 'vertical' }}
            />
          </div>
        );
      }
      return (
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{label}</label>
          <input 
            type={type} 
            value={value} 
            onChange={e => updateProfileData(fieldPath, e.target.value)}
            placeholder={label}
            style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid var(--a)', borderRadius: '8px', color: 'black', outline: 'none', boxShadow: '0 0 0 2px rgba(56,189,248,0.1)' }}
          />
        </div>
      );
    }
    
    return (
      <div style={{ marginBottom: '16px' }}>
        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '1rem', fontWeight: 500 }}>
          {icon && <span style={{ color: 'var(--muted)' }}>{icon}</span>}
          {type === 'textarea' ? <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.5' }}>{displayValue}</div> : displayValue}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0 0 0' }} />
      </div>
    );
  };

  const renderFileField = (label, fieldPath) => {
    const fileData = isEditing ? editData.profile_data?.[fieldPath] : selectedAgent.profile_data?.[fieldPath];
    const hasFile = !!fileData?.data;

    return (
      <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
          {hasFile && <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '10px' }}>Fichier joint</span>}
        </div>
        
        {hasFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
            <FileText size={24} style={{ color: 'var(--a)' }} />
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{fileData.name}</div>
              <button type="button" onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                if (!fileData || !fileData.data) { alert("Erreur: Le fichier est vide."); return; } 
                const w = window.open("", "_blank");
                if (w) {
                  w.document.write('<style>body{margin:0;overflow:hidden;background:#333;}</style><iframe src="' + fileData.data + '" frameborder="0" style="width:100vw;height:100vh;border:none;"></iframe>');
                  w.document.close();
                } else {
                  alert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour voir le document.");
                }
              }} style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, zIndex: 10 }}><Search size={14}/> Voir</button>
            </div>
            {isEditing ? (
               <button type="button" onClick={() => updateProfileData(fieldPath, null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16}/></button>
            ) : (
               <a href={fileData.data} download={fileData.name} style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}><Download size={14}/> Télécharger</a>
            )}
          </div>
        ) : (
          <div 
            onClick={() => isEditing && triggerFileUpload(fieldPath)}
            style={{ padding: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.2s', background: isEditing ? 'rgba(56,189,248,0.05)' : 'transparent' }}
          >
            {isEditing ? (
              <>
                <UploadCloud size={24} style={{ color: 'var(--a)', margin: '0 auto 8px auto' }} />
                <span style={{ color: 'var(--a)', fontSize: '0.9rem' }}>Cliquez pour importer</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Aucun document</span>
            )}
          </div>
        )}
      </div>
    );
  };


  // VUE DETAIL
  if (selectedAgent) {
    const a = selectedAgent;
    const pData = a.profile_data || {};
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--muted)' }}>Employés / <span style={{ color: 'white' }}>{a.name}</span></h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowDossierModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.3)' }}>
              <FolderOpen size={16} /> Voir le dossier complet
            </button>

            {isEditing ? (
              <>
                <button className="btn btn-secondary" onClick={cancelEditing}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSaveProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={16} /> Sauvegarder</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={startEditing} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--a)', color: 'var(--a)' }}>
                <Edit2 size={16} /> Modifier le profil
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Panel */}
          <div style={{ flex: '1 1 350px', background: 'rgba(255,255,255,0.03)', border: '3px solid white', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--b), var(--a))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', boxShadow: '0 10px 25px rgba(56,189,248,0.3)', position: 'relative', overflow: 'hidden' }}>
                  {(isEditing ? editData.profile_data?.avatar?.data : pData.avatar?.data) ? <img src={isEditing ? editData.profile_data.avatar.data : pData.avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar"/> : (a.name ? a.name.substring(0, 2).toUpperCase() : '??')}
                </div>
                {isEditing && (
                  <button onClick={() => triggerFileUpload('avatar')} style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--a)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <UploadCloud size={14} /> Changer
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {isEditing ? (
                  <input type="text" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} placeholder="Nom complet" style={{ width: '100%', fontSize: '1.4rem', fontWeight: 'bold', background: 'white', border: '1px solid var(--a)', color: 'black', borderRadius: '6px', padding: '4px 8px', marginBottom: '8px' }} />
                ) : (
                  <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</h1>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  <Briefcase size={16} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.function || 'Non défini'}</span>
                </div>
                {pData.has_badge && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <ShieldCheck size={12} /> Badge Remis
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <div style={{ flex: 1, padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>Statut</span>
                <span style={{ display: 'block', fontSize: '1rem', color: 'white', fontWeight: 'bold', marginTop: '4px' }}>Actif</span>
              </div>
              <div style={{ flex: 1, padding: '12px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>Site</span>
                <span style={{ display: 'block', fontSize: '1rem', color: 'white', fontWeight: 'bold', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getSiteName(a.subsite_id)}</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderField('Téléphone Professionnel', 'phone_pro', 'tel', <Phone size={16}/>)}
              {renderField('Email Professionnel', 'email_pro', 'email', <Mail size={16}/>)}
              {renderField('Département', 'department', 'text', <Building size={16}/>)}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: '2 1 600px', background: 'rgba(255,255,255,0.03)', border: '3px solid white', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', overflowX: 'auto' }}>
              {[
                { id: 'pro', label: 'Informations Privées', icon: <Heart size={16}/> },
                { id: 'docs', label: 'Éducation & Docs', icon: <GraduationCap size={16}/> },
                { id: 'contract', label: 'Contrat & Paie', icon: <DollarSign size={16}/> },
                { id: 'skills', label: 'CV & Évaluations', icon: <CheckCircle size={16}/> },
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, minWidth: '150px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--b)' : '2px solid transparent', color: activeTab === tab.id ? 'white' : 'var(--muted)', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '32px', flex: 1 }}>
              {/* ONGLET 1: PRIVÉ */}
              {activeTab === 'pro' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={18}/> Coordonnées Privées</h3>
                      {renderField('E-mail Personnel', 'email_perso', 'email')}
                      {renderField('Téléphone Personnel', 'phone_perso', 'tel')}
                      {renderField('Distance Domicile-Lieu de Travail (km)', 'distance_km', 'number')}
                      
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18}/> Adresse Personnelle</h3>
                      {renderField('Adresse (Rue, Quartier)', 'address')}
                      {renderField('Ville', 'city')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={18}/> Identité & Nationalité</h3>
                      {renderField('Nom légal', 'legal_name')}
                      {renderField('Lieu de Naissance', 'birth_place')}
                      {renderField('Date de Naissance', 'birth_date', 'date')}
                      {renderField('Nationalité (Pays)', 'nationality')}
                      {renderField('Sexe', 'gender', 'select', null, ['Masculin', 'Féminin', 'Autre'])}
                      
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> Famille & Urgence</h3>
                      {renderField('État Civil', 'marital_status', 'select', null, ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve'])}
                      {renderField('Enfants à charge', 'children_count', 'number')}
                      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#ef4444', fontSize: '0.9rem' }}>Contact d'Urgence</h4>
                        {renderField('Nom du Contact', 'emergency_name')}
                        {renderField('Téléphone d\'Urgence', 'emergency_phone', 'tel')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ONGLET 2: DOCS */}
              {activeTab === 'docs' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Éducation</h3>
                      {renderField('Niveau de Certificat', 'education_level', 'select', null, ['Licence', 'Master', 'Doctorat', 'BTS/DUT', 'Baccalauréat', 'Aucun'])}
                      {renderField('Champ d\'étude (ex: Sécurité, Commerce)', 'education_field')}
                      {renderFileField('Copie du Diplôme', 'doc_diploma')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Documents d'Identité</h3>
                      {renderField('Type d\'identification', 'id_type', 'select', null, ['CNI', 'Passeport', 'Permis de conduire', 'Attestation'])}
                      {renderField('Numéro d\'identification', 'id_number')}
                      {renderFileField('Copie de la Pièce d\'Identité', 'doc_id')}
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '24px' }}>Permis & Visas</h3>
                      {renderField('Numéro de Permis / Visa', 'visa_number')}
                      {renderFileField('Copie du Permis', 'doc_license')}
                    </div>
                  </div>
                </div>
              )}

              {/* ONGLET 3: CONTRAT */}
              {activeTab === 'contract' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Aperçu du Contrat</h3>
                      {renderField('Type d\'employé', 'employee_type', 'select', null, ['Employé', 'Stagiaire', 'Consultant', 'Indépendant'])}
                      {renderField('Contrat', 'contract_type', 'select', null, ['Durée Indéterminée (CDI)', 'Durée Déterminée (CDD)', 'Essai'])}
                      {renderField('Horaire de base', 'working_hours', 'select', null, ['40 heures / semaine', '35 heures / semaine', 'Temps partiel'])}
                      {renderField('Date de début de contrat', 'contract_start', 'date')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Rémunération & Banque</h3>
                      {isEditing ? (
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Salaire de Base (CFA)</label>
                          <input type="number" value={editData.salary} onChange={e => setEditData({...editData, salary: e.target.value})} placeholder="Salaire de Base (CFA)" style={{ width: '100%', padding: '10px', background: 'white', border: '1px solid var(--a)', borderRadius: '8px', color: 'black' }} />
                        </div>
                      ) : (
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>Salaire de Base</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '1.2rem', fontWeight: 700 }}>
                            {a.salary ? `${a.salary} FCFA / mois` : 'Non défini'}
                          </div>
                          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0 0 0' }} />
                        </div>
                      )}
                      
                      {renderField('Numéro de compte (IBAN/RIB)', 'bank_account')}
                      {renderField('Nom de la Banque', 'bank_name')}
                      
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '24px' }}>Statut Administratif</h3>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={editData.profile_data?.has_badge || false} onChange={e => updateProfileData('has_badge', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--a)' }}/>
                            <span style={{ color: 'white', fontSize: '0.95rem' }}>Badge d'identification remis</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={editData.profile_data?.has_cnps || false} onChange={e => updateProfileData('has_cnps', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--a)' }}/>
                            <span style={{ color: 'white', fontSize: '0.95rem' }}>Déclaré à la CNPS</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={editData.profile_data?.has_sp || false} onChange={e => updateProfileData('has_sp', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--a)' }}/>
                            <span style={{ color: 'white', fontSize: '0.95rem' }}>Droit à la Prime Panier (SP)</span>
                          </label>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ padding: '8px 16px', background: pData.has_badge ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.05)', color: pData.has_badge ? '#a78bfa' : 'var(--muted)', borderRadius: '8px', fontSize: '0.85rem' }}>{pData.has_badge ? '✓ Badge remis' : '✗ Aucun badge'}</div>
                          <div style={{ padding: '8px 16px', background: pData.has_cnps ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: pData.has_cnps ? '#10b981' : 'var(--muted)', borderRadius: '8px', fontSize: '0.85rem' }}>{pData.has_cnps ? '✓ Déclaré CNPS' : '✗ Non déclaré CNPS'}</div>
                          <div style={{ padding: '8px 16px', background: pData.has_sp ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)', color: pData.has_sp ? '#38bdf8' : 'var(--muted)', borderRadius: '8px', fontSize: '0.85rem' }}>{pData.has_sp ? '✓ Prime Panier (SP)' : '✗ Sans Prime Panier'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ONGLET 4: CV & EVALUATIONS */}
              {activeTab === 'skills' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Curriculum Vitae</h3>
                      {renderFileField('Télécharger le CV complet', 'doc_cv')}
                      
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '24px' }}>Expérience Majeure</h3>
                      {renderField('Dernier Poste', 'last_job_title')}
                      {renderField('Entreprise précédente', 'last_company')}
                      {renderField('Période d\'expérience', 'experience_duration', 'select', null, ['Aucune', 'Moins d\'1 an', '1 à 3 ans', '3 à 5 ans', 'Plus de 5 ans'])}
                      
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px', marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} /> Avis de l'Administration
                      </h3>
                      {renderField('Évaluation et commentaires', 'admin_review', 'textarea')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--a)', marginBottom: '20px' }}>Compétences Principales (Auto-évaluation)</h3>
                      
                      {['Langues (Ex: Anglais)', 'Sécurité / Gardiennage', 'Utilisation Informatique'].map((skill, idx) => (
                        <div key={idx} style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'white', fontSize: '0.9rem' }}>{skill}</span>
                            <span style={{ color: 'var(--a)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              {isEditing ? (
                                <input type="number" min="0" max="100" value={editData.profile_data?.[`skill_${idx}`] || 0} onChange={e=>updateProfileData(`skill_${idx}`, e.target.value)} placeholder="0" style={{ width: '50px', background: 'white', border: 'none', color: 'black', textAlign: 'right', outline: 'none' }} />
                              ) : (
                                `${pData[`skill_${idx}`] || 0}`
                              )} %
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pData[`skill_${idx}`] || (isEditing ? editData.profile_data?.[`skill_${idx}`] : 0)}%`, height: '100%', background: 'linear-gradient(90deg, var(--a), var(--b))', transition: 'width 0.3s' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL DOSSIER COMPLET (A4 PDF VIEWER) */}
        {showDossierModal && (
          <div className="dossier-modal-overlay" style={{
            position: 'fixed', inset: 0, background: '#525659',
            display: 'flex', flexDirection: 'column', zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Toolbar PDF */}
            <div className="dossier-toolbar" style={{ background: '#323639', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #202124', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'relative' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <FileText size={18}/> Dossier_Complet_{a.name.replace(/\s+/g, '_')}.pdf
              </h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setShowSettingsModal(!showSettingsModal)} style={{ background: 'transparent', color: '#9aa0a6', border: '1px solid #5f6368', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Settings size={18}/> Paramètres
                </button>
                <button onClick={() => { setShowSettingsModal(false); window.print(); }} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Download size={18}/> Imprimer / Enregistrer en PDF
                </button>
                <button onClick={() => setShowDossierModal(false)} style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <X size={20} />
                </button>
              </div>

              {showSettingsModal && (
                <div style={{ position: 'absolute', top: '60px', right: '120px', background: 'white', borderRadius: '8px', padding: '20px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 10001 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b' }}>En-tête et Pied de page</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Nom de l'Entreprise</label>
                      <input type="text" value={printSettings.companyName} onChange={e => setPrintSettings({...printSettings, companyName: e.target.value})} placeholder="Nom de l'Entreprise" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', color: 'black', background: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Sous-titre (ex: Dossier Personnel)</label>
                      <input type="text" value={printSettings.headerSubtitle} onChange={e => setPrintSettings({...printSettings, headerSubtitle: e.target.value})} placeholder="Sous-titre (ex: Dossier Personnel)" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', color: 'black', background: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Texte Pied de page</label>
                      <input type="text" value={printSettings.footerText} onChange={e => setPrintSettings({...printSettings, footerText: e.target.value})} placeholder="Texte Pied de page" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', color: 'black', background: 'white' }} />
                    </div>
                    <button onClick={() => setShowSettingsModal(false)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}>Fermer</button>
                  </div>
                </div>
              )}
            </div>

            {/* A4 Pages Container */}
            <div className="dossier-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => showSettingsModal && setShowSettingsModal(false)}>
              <div id="dossier-print-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <style>
                  {`
                    @page {
                      size: A4;
                      margin: 0 !important;
                    }
                    @media print {
                      body * { visibility: hidden !important; }
                      
                      .dossier-modal-overlay {
                        position: absolute !important;
                        top: 0 !important; left: 0 !important;
                        background: transparent !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                      }

                      .dossier-toolbar { display: none !important; }

                      .dossier-scroll-area {
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                      }

                      #dossier-print-container {
                        visibility: visible !important;
                        display: block !important;
                        position: relative !important;
                      }
                      
                      #dossier-print-container * {
                        visibility: visible !important;
                      }

                      .a4-page {
                        margin: 0 !important;
                        box-shadow: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        max-height: 297mm !important;
                        overflow: hidden !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        padding: 15mm !important;
                        display: block !important;
                        position: relative !important;
                      }
                      .a4-page:last-child { page-break-after: auto !important; }
                    }
                  `}
                </style>

                {/* --- PAGE 1 : PROFIL PRINCIPAL --- */}
                <div className="a4-page" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', margin: '0 auto 24px auto', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', boxSizing: 'border-box', position: 'relative', color: 'black' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #0f172a', paddingBottom: '12px', marginBottom: '32px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>{printSettings.companyName}</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>{printSettings.headerSubtitle}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Fiche Synthèse</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Édité le {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  {/* Identity Block */}
                  <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '40px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #cbd5e1', flexShrink: 0 }}>
                      {pData.avatar?.data ? <img src={pData.avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : <UserPlus size={48} color="#94a3b8" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', color: '#0f172a', fontWeight: 800 }}>{a.name}</h1>
                      <p style={{ margin: 0, fontSize: '1.2rem', color: '#3b82f6', fontWeight: 600 }}>{a.function || 'Agent de Sécurité'} • {getSiteName(a.subsite_id)}</p>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
                        {pData.phone_pro && <div style={{ fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16} color="#64748b"/> {pData.phone_pro}</div>}
                        {pData.email_pro && <div style={{ fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16} color="#64748b"/> {pData.email_pro}</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '40px' }}>
                    {/* Left Col */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identité & Privé</h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', lineHeight: '2', fontSize: '0.95rem' }}>
                        <li><strong>Nom légal :</strong> {pData.legal_name || '-'}</li>
                        <li><strong>Date de naissance :</strong> {pData.birth_date || '-'} ({pData.birth_place || '-'})</li>
                        <li><strong>Sexe :</strong> {pData.gender || '-'}</li>
                        <li><strong>Nationalité :</strong> {pData.nationality || '-'}</li>
                        <li><strong>État Civil :</strong> {pData.marital_status || '-'}</li>
                        <li><strong>Téléphone privé :</strong> {pData.phone_perso || '-'}</li>
                        <li><strong>Adresse :</strong> {pData.address || '-'} {pData.city || ''}</li>
                      </ul>

                      <h3 style={{ fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '20px', marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contrat & Paie</h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', lineHeight: '2', fontSize: '0.95rem' }}>
                        <li><strong>Type de contrat :</strong> {pData.contract_type || '-'}</li>
                        <li><strong>Vacation :</strong> {a.shift_type || 'Jour'}</li>
                        <li><strong>Salaire de base :</strong> {a.salary ? `${a.salary} FCFA` : '-'}</li>
                        <li><strong>Compte Bancaire :</strong> {pData.bank_account || '-'} ({pData.bank_name || '-'})</li>
                        <li><strong>Statuts :</strong> {[pData.has_badge && 'Badge', pData.has_cnps && 'CNPS', pData.has_sp && 'Prime Panier'].filter(Boolean).join(', ') || 'Aucun'}</li>
                      </ul>
                    </div>

                    {/* Right Col */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En cas d'urgence</h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', lineHeight: '2', fontSize: '0.95rem' }}>
                        <li><strong>Personne à contacter :</strong> {pData.emergency_name || '-'}</li>
                        <li><strong>Téléphone d'urgence :</strong> {pData.emergency_phone || '-'}</li>
                      </ul>

                      <h3 style={{ fontSize: '1.1rem', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '20px', marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Éducation & Profil</h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155', lineHeight: '2', fontSize: '0.95rem' }}>
                        <li><strong>Niveau d'étude :</strong> {pData.education_level || '-'}</li>
                        <li><strong>Champ d'étude :</strong> {pData.education_field || '-'}</li>
                        <li><strong>Dernier emploi :</strong> {pData.last_job_title || '-'} chez {pData.last_company || '-'}</li>
                      </ul>

                      <div style={{ marginTop: '32px', padding: '20px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1rem', color: '#be123c', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Avis de l'Administration</h3>
                        <p style={{ margin: 0, color: '#881337', fontSize: '0.95rem', fontStyle: 'italic', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {pData.admin_review || 'Aucune évaluation n\'a encore été enregistrée pour cet agent dans le système.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Page 1 */}
                  <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{printSettings.footerText}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Page 1 / Dossier Principal</span>
                  </div>
                </div>

                {/* --- PAGES ANNEXES POUR CHAQUE DOCUMENT --- */}
                {(() => {
                  const documents = [
                    { key: 'doc_id', label: 'Copie de la Pièce d\'Identité', typeLabel: 'ANNEXE I' },
                    { key: 'doc_license', label: 'Copie du Permis de Conduire', typeLabel: 'ANNEXE II' },
                    { key: 'doc_diploma', label: 'Diplôme / Certificat Académique', typeLabel: 'ANNEXE III' },
                    { key: 'doc_cv', label: 'Curriculum Vitae', typeLabel: 'ANNEXE IV' }
                  ];

                  let pageNumber = 2;

                  return documents.map(doc => {
                    const file = pData[doc.key];
                    if (!file || !file.data) return null;
                    
                    const isImage = file.type ? file.type.startsWith('image/') : file.data.startsWith('data:image/');
                    const isPdf = file.type ? file.type === 'application/pdf' : file.data.startsWith('data:application/pdf');
                    
                    const currentPage = pageNumber++;

                    return (
                      <div key={doc.key} className="a4-page" style={{ width: '210mm', height: '297mm', padding: '15mm', margin: '0 auto 24px auto', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', boxSizing: 'border-box', color: 'black', position: 'relative' }}>
                        
                        {/* Header Annexe */}
                        <div style={{ height: '30mm', display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #0f172a', paddingBottom: '5mm', boxSizing: 'border-box' }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>{printSettings.companyName}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Dossier de : {a.name}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{doc.typeLabel}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{doc.label}</p>
                          </div>
                        </div>

                        {/* Document Content */}
                        <div style={{ width: '100%', height: '210mm', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                          {isImage ? (
                            <img src={file.data} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageOrientation: 'from-image', borderRadius: '4px' }} alt={doc.label} />
                          ) : isPdf ? (
                            <div style={{ width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden', background: 'white' }}>
                               <iframe src={`${file.data}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }} title={doc.label} />
                            </div>
                          ) : (
                            <div style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', width: '80%', margin: 'auto' }}>
                              <FileText size={64} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
                              <h3 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '1.4rem' }}>Document non affichable ({file.name})</h3>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Le format de ce fichier ne permet pas un aperçu direct. Veuillez le télécharger depuis le profil numérique.</p>
                            </div>
                          )}
                        </div>

                        {/* Footer Annexe */}
                        <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', height: '15mm', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '5mm', boxSizing: 'border-box' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Document certifié conforme - Propriété de {printSettings.companyName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Page {currentPage} / {doc.typeLabel}</span>
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // VUE GLOBALE
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>Employés</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '1.1rem' }}>Gérez votre base de données d'employés ({agents.length} au total)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un employé..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', color: 'black', outline: 'none', fontSize: '0.95rem' }}
              onFocus={e => { e.target.style.borderColor = 'var(--b)'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'white'; }}
            />
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ background: viewMode === 'kanban' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', padding: '8px 14px', borderRadius: '4px', color: viewMode === 'kanban' ? 'white' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', padding: '8px 14px', borderRadius: '4px', color: viewMode === 'list' ? 'white' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <ListIcon size={18} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <UserPlus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--b)', borderRadius: '50%' }}></div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <Users size={64} style={{ color: 'var(--muted)', opacity: 0.5, margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>Aucun employé trouvé</h3>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Essayez de modifier vos termes de recherche ou ajoutez un nouvel employé.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredAgents.map(a => (
            <div 
              key={a.id} 
              onClick={() => setSelectedAgent(a)}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '3px solid white', borderRadius: '16px', padding: '24px',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', gap: '20px', alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--b)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)'; e.currentTarget.style.background = 'rgba(56,189,248,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(167,139,250,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--a)', border: '1px solid rgba(56,189,248,0.2)', flexShrink: 0, overflow: 'hidden' }}>
                {a.profile_data?.avatar?.data ? <img src={a.profile_data.avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : (a.name ? a.name.substring(0, 2).toUpperCase() : '?')}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Briefcase size={14} /> {a.function || 'Agent de Sécurité'}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  <MapPin size={12} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getSiteName(a.subsite_id)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Fonction</th>
                  <th style={{ textAlign: 'left', padding: '16px' }}>Site d'affectation</th>
                  <th style={{ textAlign: 'center', padding: '16px' }}>Vacation</th>
                  <th style={{ textAlign: 'center', padding: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setSelectedAgent(a)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--b), var(--a))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: 'white', overflow: 'hidden' }}>
                        {a.profile_data?.avatar?.data ? <img src={a.profile_data.avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : (a.name ? a.name.substring(0, 2).toUpperCase() : '?')}
                      </div>
                      <span style={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>{a.name}</span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.95rem' }}>{a.function || 'Agent de Sécurité'}</td>
                    <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.95rem' }}>{getSiteName(a.subsite_id)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.85rem', color: 'white' }}>
                        {a.shift_type || 'Jour'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => setSelectedAgent(a)}>
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREATION */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px',
            width: '100%', maxWidth: '550px', padding: '40px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.1)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444';}} onMouseLeave={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)';}}>
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--a)', border: '1px solid rgba(56,189,248,0.3)' }}>
                <UserPlus size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px 0', color: 'white' }}>Nouvel Employé</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Ajoutez un nouvel agent à votre base de données</p>
              </div>
            </div>
            
            <form onSubmit={handleAddAgent} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom Complet *</label>
                <div style={{ position: 'relative' }}>
                  <Users size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    value={newAgent.name} 
                    onChange={e => setNewAgent({...newAgent, name: e.target.value})} 
                    required 
                    placeholder="Ex: Jean Dupont"
                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: 'black', fontSize: '1.05rem', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--a)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.background = 'white'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Site d'affectation *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <select 
                    value={newAgent.subsite_id} 
                    onChange={e => setNewAgent({...newAgent, subsite_id: e.target.value})} 
                    required
                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: 'black', fontSize: '1.05rem', outline: 'none', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--a)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.background = 'white'; e.target.style.boxShadow = 'none'; }}
                  >
                    <option value="" style={{ background: 'white', color: 'black' }}>Sélectionner un site/zone...</option>
                    {siteData.map(sub => (
                      <option key={sub.id} value={sub.id} style={{ background: 'white', color: 'black', padding: '10px' }}>{sub.site_name} - {sub.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)' }}>▼</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fonction</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <select 
                      value={newAgent.function} 
                      onChange={e => setNewAgent({...newAgent, function: e.target.value})}
                      style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: 'black', fontSize: '1.05rem', outline: 'none', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--a)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.background = 'white'; }}
                    >
                      <option value="AS" style={{ background: 'white', color: 'black' }}>Agent Simple (AS)</option>
                      <option value="CP" style={{ background: 'white', color: 'black' }}>Chef de Poste (CP)</option>
                      <option value="MC" style={{ background: 'white', color: 'black' }}>Maitre Chien (MC)</option>
                      <option value="GA" style={{ background: 'white', color: 'black' }}>Garde Armé (GA)</option>
                    </select>
                    <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)' }}>▼</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vacation par défaut</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={18} style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <select 
                      value={newAgent.shift_type} 
                      onChange={e => setNewAgent({...newAgent, shift_type: e.target.value})}
                      style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: 'black', fontSize: '1.05rem', outline: 'none', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--a)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.background = 'white'; }}
                    >
                      <option value="Jour" style={{ background: 'white', color: 'black' }}>Jour (J)</option>
                      <option value="Nuit" style={{ background: 'white', color: 'black' }}>Nuit (N)</option>
                      <option value="J/N" style={{ background: 'white', color: 'black' }}>Jour/Nuit (J/N)</option>
                      <option value="Matin" style={{ background: 'white', color: 'black' }}>Matin (M)</option>
                      <option value="Soir" style={{ background: 'white', color: 'black' }}>Soir (S)</option>
                    </select>
                    <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)' }}>▼</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '14px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '14px 32px', background: 'linear-gradient(135deg, var(--a), var(--b))', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(56,189,248,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 25px rgba(56,189,248,0.4)';}} onMouseLeave={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(56,189,248,0.3)';}}>
                  <UserPlus size={18} /> Confirmer la Création
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}