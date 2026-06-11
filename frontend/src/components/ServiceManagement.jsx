import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { ShieldAlert, Plus, Users, Loader2, KeyRound, CheckCircle2, Pencil, Trash2, X, Building2, ChevronRight, ChevronLeft, ArrowLeft, UserCircle2, Layers, PauseCircle, PowerOff, Wrench, Inbox } from 'lucide-react';
import { useAuth } from '../AuthContext';
import BoiteReceptionAdmin from './BoiteReceptionAdmin';

// ─── Définition des 8 Espaces de Travail ─────────────────────────────────────
export const WORKSPACE_PRESETS = {
  'RH': {
    label: 'Espace RH',
    icon: '🏢',
    color: '#38bdf8',
    description: 'Gestion de la présence des agents',
    defaultService: 'Ressources Humaines',
    permissions: {
      analytics: 'read',
      employees: 'write',
      payroll: 'none',
      leave: 'write',
      gps: 'none',
      dashboard: 'none',
      print_attendance: 'none',
      print_payroll: 'none',
      fluctuation: 'none',
      salaries: 'write',
      calcul_salaires: 'none',
      reclamation_view: 'none',
      reclamation_edit: 'none',
      new_mep: 'none',
      recrutement: 'write',
      materiel: 'none',
      verification: 'read',
      archives: 'read',
      communication: 'write',
      services: 'none',
      kiosk: 'none',
      permissions: 'write',
      contracts: 'write',
      registry: 'read'
    }
  },
  'COMPTABLE': {
    label: 'Comptabilité',
    icon: '📊',
    color: '#22c55e',
    description: 'Traitement et calcul de la paie',
    defaultService: 'Comptabilité',
    permissions: {
      analytics: 'write',
      employees: 'none',
      payroll: 'write',
      leave: 'none',
      gps: 'none',
      dashboard: 'none',
      print_attendance: 'read',
      print_payroll: 'write',
      fluctuation: 'write',
      salaries: 'write',
      calcul_salaires: 'write',
      reclamation_view: 'approver_3',
      reclamation_edit: 'none',
      new_mep: 'read',
      recrutement: 'none',
      materiel: 'write',
      verification: 'none',
      archives: 'read',
      communication: 'write',
      services: 'none',
      kiosk: 'none',
      permissions: 'none',
      contracts: 'none',
      registry: 'read',
      company_config: 'write'
    }
  },
  'PC': {
    label: 'Poste de Commandement (PC)',
    icon: '📡',
    color: '#3b82f6',
    description: 'Salle de contrôle H24. Pilotage opérationnel global.',
    defaultService: 'Opérations',
    permissions: {
      analytics: 'read',
      gps: 'write',
      print_attendance: 'read',
      payroll: 'none',
      fluctuation: 'none',
      calcul_salaires: 'none',
      reclamation_edit: 'write',
      recrutement: 'read',
      verification: 'read',
      kiosk: 'write',
      contracts: 'none',
      registre_visiteurs: 'none',
      pointage_courriers: 'none',
      reflexe_securite: 'none',
      gestion_flotte: 'none',
      fournitures_bureau: 'none',
      alertes_securite: 'write',
      dg_rapports: 'none',
      dg_spy: 'none',
      dg_audit: 'none',
      dg_predictive: 'none',
      dg_litiges: 'none',
      dg_agenda: 'none',
      dg_veille: 'none',
      pdg_bilan: 'none',
      pdg_sites: 'none',
      pdg_benchmark: 'none',
      pdg_expansion: 'none',
      pdg_menaces: 'none',
      pc_alertes: 'none',
      pc_dispatch: 'none',
      pc_main_courante: 'none',
      ctrl_feuille: 'none',
      ctrl_rapport: 'write',
      ctrl_messagerie: 'write',
      ctrl_tracking: 'write',
      ctrl_flotte: 'write',
      ctrl_notation: 'read',
      employees: 'none',
      leave: 'none',
      dashboard: 'write',
      print_payroll: 'none',
      salaries: 'none',
      reclamation_view: 'none',
      new_mep: 'write',
      materiel: 'none',
      archives: 'read',
      permissions: 'none',
      registry: 'read',
      annuaire_statut: 'none',
      gestion_salles: 'none',
      gestion_appels: 'none',
      badges_provisoires: 'none',
      accueil_vip: 'none',
      dg_vision: 'none',
      dg_validation: 'none',
      dg_block: 'none',
      dg_megaphone: 'none',
      dg_okr: 'none',
      dg_organigramme: 'none',
      dg_pv: 'none',
      pdg_souverain: 'none',
      pdg_signature: 'none',
      pdg_acces_maitre: 'none',
      pdg_coffre: 'none',
      pdg_actionnaires: 'none',
      pc_radar: 'write',
      pc_cctv: 'write',
      pc_comms: 'write',
      pc_tracking: 'write',
      ctrl_audit: 'none',
      ctrl_dashboard: 'none',
      ctrl_carnet: 'write',
      ctrl_dispatch: 'write',
      ctrl_rondes: 'none'
    }
  },
  'SECRETARIAT': {
    label: 'Secrétariat',
    icon: '📋',
    color: '#f97316',
    description: 'Gestion administrative et communication',
    defaultService: 'Secrétariat',
    permissions: {
      analytics: 'read',
      employees: 'none',
      payroll: 'none',
      leave: 'none',
      gps: 'none',
      dashboard: 'none',
      print_attendance: 'none',
      print_payroll: 'none',
      fluctuation: 'none',
      salaries: 'none',
      calcul_salaires: 'none',
      reclamation_view: 'modifier_no',
      reclamation_edit: 'none',
      new_mep: 'none',
      recrutement: 'write',
      materiel: 'none',
      verification: 'read',
      archives: 'read',
      communication: 'write',
      services: 'none',
      kiosk: 'none',
      permissions: 'none',
      contracts: 'none',
      registry: 'read',
      registre_visiteurs: 'write',
      annuaire_statut: 'write',
      pointage_courriers: 'write',
      gestion_salles: 'write',
      reflexe_securite: 'write',
      gestion_appels: 'write',
      gestion_flotte: 'write',
      badges_provisoires: 'write',
      fournitures_bureau: 'write',
      accueil_vip: 'write',
      alertes_securite: 'write'
    }
  },
  'AGENT': {
    label: 'Espace Agent',
    icon: '👷',
    color: '#94a3b8',
    description: 'Pointage et consultation de bulletin de paie',
    defaultService: 'Agents',
    permissions: ['kiosk', 'payroll']
  },
  'CONTROLEUR': {
    label: 'Contrôleur',
    icon: '🔍',
    color: '#eab308',
    description: 'Vérification et validation des pointages',
    defaultService: 'Contrôle',
    permissions: ['dashboard', 'verification', 'communication']
  },
  'DG_PDG': {
    label: 'Direction Générale',
    icon: '🦅',
    color: '#eab308',
    description: 'Vue stratégique, KPIs 360° et validations exécutives',
    defaultService: 'Direction Générale',
    permissions: {
      analytics: 'read',
      employees: 'read',
      payroll: 'read',
      leave: 'read',
      gps: 'read',
      dashboard: 'read',
      print_attendance: 'read',
      print_payroll: 'read',
      fluctuation: 'read',
      salaries: 'read',
      calcul_salaires: 'none',
      reclamation_view: 'read',
      reclamation_edit: 'none',
      new_mep: 'read',
      recrutement: 'read',
      materiel: 'read',
      verification: 'read',
      archives: 'read',
      communication: 'write',
      services: 'none',
      kiosk: 'none',
      permissions: 'none',
      contracts: 'read',
      registry: 'read',
      registre_visiteurs: 'read',
      annuaire_statut: 'read',
      pointage_courriers: 'read',
      gestion_salles: 'read',
      reflexe_securite: 'read',
      gestion_appels: 'read',
      gestion_flotte: 'read',
      badges_provisoires: 'read',
      fournitures_bureau: 'read',
      accueil_vip: 'read',
      alertes_securite: 'read',
      dg_vision: 'write',
      dg_rapports: 'write',
      dg_validation: 'write',
      dg_spy: 'write', 
      dg_block: 'write',
      dg_audit: 'write',
      dg_megaphone: 'write',
      dg_predictive: 'write',
      dg_okr: 'write',
      dg_litiges: 'write',
      dg_organigramme: 'write',
      dg_agenda: 'write',
      dg_pv: 'write',
      dg_veille: 'write'
    }
  },
  'PDG': {
    label: 'Président Directeur Général (PDG)',
    icon: '👑',
    color: '#d4af37',
    description: 'Espace souverain, vision globale de la valeur et gouvernance.',
    defaultService: 'Direction',
    permissions: {
      pdg_souverain: 'write',
      pdg_bilan: 'write',
      pdg_signature: 'write',
      pdg_sites: 'write',
      pdg_acces_maitre: 'write',
      pdg_benchmark: 'write',
      pdg_coffre: 'write',
      pdg_expansion: 'write',
      pdg_actionnaires: 'write',
      pdg_menaces: 'write',
      dg_vision: 'read',
      dg_rapports: 'read',
      dg_okr: 'read',
      dg_agenda: 'read'
    }
  },

  'CONTROLEUR': {
    label: 'Contrôleur / Superviseur',
    icon: '🔍',
    color: '#6366f1',
    description: 'Supervision terrain des agents et sites. Audits, rapports express et carnet de bord.',
    defaultService: 'Opérations',
    permissions: {
      ctrl_feuille: 'write',
      ctrl_audit: 'write',
      ctrl_rapport: 'write',
      ctrl_dashboard: 'read',
      ctrl_messagerie: 'write',
      ctrl_carnet: 'write',
      ctrl_tracking: 'write',
      ctrl_dispatch: 'write',
      ctrl_flotte: 'write',
      ctrl_rondes: 'write',
      ctrl_notation: 'write',
      gestion_appels: 'write'
    }
  },
  'AUTRE': {
    label: 'Autre (personnalisé)',
    icon: '⚙️',
    color: '#64748b',
    description: 'Profil à configurer manuellement',
    defaultService: '',
    permissions: []
  }
};

const ALL_MODULES = {
  analytics: '📊 Tableau de Bord Analytique',
  employees: '👥 Gestion des Employés',
  payroll: '🧾 État de Paie',
  leave: '✈️ Gestion des Congés',
  gps: '📍 Pointage GPS',
  dashboard: '📅 Pointage du Mois',
  print_attendance: '🖨️ Imprimer le Pointage',
  print_payroll: '🖨️ Imprimer Fiche de Paie',
  fluctuation: '📈 Fluctuation Salariale',
  salaries: '💰 Grille Salariale',
  calcul_salaires: '🧮 Calcul des Salaires',
  reclamation_view: '👀 Réclamation (Consultation)',
  reclamation_edit: '✏️ Réclamation (Édition)',
  new_mep: '🆕 Nouvelle MEP',
  recrutement: '🎯 Espace E-Recrutement',
  materiel: '📦 Suivi du Matériel',
  verification: '✅ Traitement du pointage',
  archives: '🗂️ Archives & Rapports',
  communication: '💬 Communication & Tickets',
  services: '⚙️ Gestion des Profils',
  kiosk: '📱 Mode Kiosque',
  permissions: '⏱️ Gestion des Permissions',
  contracts: '📁 Gestion des Contrats',
  registry: '🏢 Registre Général',
  registre_visiteurs: '📝 Registre des Visiteurs',
  annuaire_statut: '📞 Annuaire & Statut',
  pointage_courriers: '📮 Pointage Courriers/Colis',
  gestion_salles: '🚪 Gestion des Salles',
  reflexe_securite: '🔒 Réflexe Sécurité',
  gestion_appels: '☎️ Main Courante & Appels',
  gestion_flotte: '🚗 Gestion de Flotte',
  badges_provisoires: '💳 Badges Provisoires',
  fournitures_bureau: '📎 Fournitures de Bureau',
  accueil_vip: '👑 Protocole VIP',
  alertes_securite: '🚨 Alertes Confinement',
  dg_vision: '🦅 Vision 360° (DG)',
  dg_rapports: '📑 Rapports Stratégiques (DG)',
  dg_validation: '🎯 Validations Exécutives (DG)',
  dg_spy: '🕵️ Mode Espion (DG)',
  dg_block: '🚫 Blocage de Service (DG)',
  dg_audit: '📜 Audit & Traçabilité (DG)',
  dg_megaphone: '📢 Mégaphone Exécutif (DG)',
  dg_predictive: '🔮 Analyse Prédictive (DG)',
  dg_okr: '🎯 Objectifs Stratégiques (DG)',
  dg_litiges: '⚖️ Litiges & Alertes (DG)',
  dg_organigramme: '🗺️ Organigramme Live (DG)',
  dg_agenda: '📅 Agenda Stratégique (DG)',
  dg_pv: '📝 Compte Rendu Réunions (DG)',
  dg_veille: '📰 Veille Sectorielle (DG)',
  pdg_souverain: '👑 Tableau de Bord Souverain (PDG)',
  pdg_bilan: '📈 Bilan & Performance Financière (PDG)',
  pdg_signature: '✍️ Signature Électronique Exécutive (PDG)',
  pdg_sites: '🌐 Tableau des Sites & Filiales (PDG)',
  pdg_acces_maitre: '🔐 Accès Maître & Super-Contrôle (PDG)',
  pdg_benchmark: '📊 Comparatif Concurrentiel (PDG)',
  pdg_coffre: '🏦 La Salle des Coffres (PDG)',
  pdg_expansion: '🌍 Simulateur d\'Expansion M&A (PDG)',
  pdg_actionnaires: '📜 Rapport aux Actionnaires (PDG)',
  pdg_menaces: '⚡ Radar des Menaces Critiques (PDG)',
  pc_radar: '🗺️ Radar Tactique (PC)',
  pc_alertes: '🚨 Urgences & SOS (PC)',
  pc_cctv: '📹 Vidéosurveillance CCTV (PC)',
  pc_dispatch: '🚔 Dispatch & Patrouilles (PC)',
  pc_comms: '📻 Statut Réseau & Radios (PC)',
  pc_main_courante: '📋 Registre Central Incidents (PC)',
  pc_tracking: '📱 Tracking & Géolocalisation Live (PC)',
  ctrl_feuille: '📋 Feuille de Route (Contrôleur)',
  ctrl_audit: '🔍 Contrôle & Audit Agents (Contrôleur)',
  ctrl_rapport: '📝 Rapport d\'Incident Express (Contrôleur)',
  ctrl_dashboard: '📊 Tableau de Bord Secteur (Contrôleur)',
  ctrl_messagerie: '💬 Messagerie Interne (Contrôleur)',
  ctrl_carnet: '🗒️ Carnet de Bord (Contrôleur)',
  ctrl_tracking: '📍 Tracking & Géoloc Live (Contrôleur)',
  ctrl_dispatch: '🚔 Dispatch & Interventions (Contrôleur)',
  ctrl_flotte: '🚗 Gestion Flotte (Contrôleur)',
  ctrl_rondes: '⏱️ Supervision Rondes (Contrôleur)',
  ctrl_notation: '⭐ Évaluation & Discipline (Contrôleur)',
  company_config: '🏢 Configuration Entreprise'
};

export default function ServiceManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI Switcher States
  const [uiDesign, setUiDesign] = useState(3);
  
  // Design 1 States
  const [showDrawer, setShowDrawer] = useState(false);
  
  // Design 3 States
  const [viewMode, setViewMode] = useState('list');
  const [wizardStep, setWizardStep] = useState(1);
  
  // Design 4 States
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'companies'

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [role, setRole] = useState('user');
  const [workspaceType, setWorkspaceType] = useState('');
  const [companies, setCompanies] = useState([]);
  const [permissions, setPermissions] = useState(
    Object.fromEntries(Object.keys(ALL_MODULES).map(k => [k, 'none']))
  );
  const [profilePhoto, setProfilePhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCardPhoto = (userEmail, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoBase64 = reader.result;
        try {
          const res = await apiCall('update_user_photo', { email: userEmail, profile_photo: photoBase64 });
          if (res.success) fetchUsers();
          else alert(res.message);
        } catch(e) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const [editingUser, setEditingUser] = useState(null);
  const [maintenanceTargetUser, setMaintenanceTargetUser] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_all_users', {}, 'GET');
      if (res.success && res.users) setUsers(res.users);
      if (user?.role === 'super_admin') {
        const compRes = await apiCall('get_all_companies', {}, 'GET');
        if (compRes.success && compRes.companies) setCompanies(compRes.companies);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (userToUpdate, newStatus) => {
    if (userToUpdate.email === user.email) {
      alert("Vous ne pouvez pas modifier votre propre statut.");
      return;
    }
    const confirm = window.confirm(`Voulez-vous vraiment changer le statut de ce compte en : ${newStatus} ?`);
    if (!confirm) return;
    try {
      const res = await apiCall('update_user_status', { email: userToUpdate.email, status: newStatus });
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.message || "Erreur lors de la mise à jour");
      }
    } catch(e) { alert("Erreur réseau"); }
  };

  const handleToggleMaintenance = (userToUpdate) => {
    if (userToUpdate.email === user.email) {
      alert("Vous ne pouvez pas mettre votre propre compte en maintenance.");
      return;
    }
    setMaintenanceTargetUser(userToUpdate);
  };

  const confirmToggleMaintenance = async () => {
    if (!maintenanceTargetUser) return;
    const newMode = !maintenanceTargetUser.maintenance_mode;
    try {
      const res = await apiCall('toggle_user_maintenance', { email: maintenanceTargetUser.email, maintenance_mode: newMode });
      if (res.success) {
        fetchUsers();
        setMaintenanceTargetUser(null);
      } else {
        alert(res.message || "Erreur");
      }
    } catch(e) { alert("Erreur réseau"); }
  };

  const handleImpersonate = async () => {
    if (!maintenanceTargetUser) return;
    try {
      const res = await apiCall('impersonate_user', { email: maintenanceTargetUser.email }, 'POST');
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.message || "Erreur d'impersonation");
      }
    } catch(e) { alert("Erreur réseau"); }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.email === user.email) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${userToDelete.name} (${userToDelete.email}) et toutes ses données associées ? Cette action est irréversible.`);
    if (!confirmDelete) return;

    try {
      const res = await apiCall('delete_user', { id: userToDelete.id });
      if (res.success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
      } else {
        alert(res.error || res.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      alert('Erreur réseau lors de la suppression');
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'admin') fetchUsers();
    else setLoading(false);
  }, [user]);

  const handleWorkspaceChange = (ws) => {
    setWorkspaceType(ws);
    if (ws && WORKSPACE_PRESETS[ws]) {
      const preset = WORKSPACE_PRESETS[ws];
      const newPerms = Object.fromEntries(Object.keys(ALL_MODULES).map(k => [k, 'none']));
      if (Array.isArray(preset.permissions)) {
        preset.permissions.forEach(p => { if (p in newPerms) newPerms[p] = 'write'; });
      } else if (typeof preset.permissions === 'object') {
        Object.entries(preset.permissions).forEach(([k, v]) => {
          if (k in newPerms) newPerms[k] = v;
        });
      }
      setPermissions(newPerms);
      if (preset.defaultService && !serviceName) setServiceName(preset.defaultService);
    }
  };

  const evaluatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.match(/[A-Z]/)) score += 25;
    if (pass.match(/[a-z]/)) score += 25;
    if (pass.match(/[0-9]/)) score += 25;
    if (pass.match(/[^A-Za-z0-9]/)) score += 25;
    return Math.min(100, score);
  };

  const passwordStrength = evaluatePasswordStrength(password);
  let strengthColor = '#ef4444';
  let strengthLabel = 'Très faible';
  if (passwordStrength >= 50) { strengthColor = '#eab308'; strengthLabel = 'Moyen'; }
  if (passwordStrength >= 75) { strengthColor = '#34d399'; strengthLabel = 'Fort'; }
  if (passwordStrength === 100) { strengthColor = '#10b981'; strengthLabel = 'Très fort'; }

  const handleCreateAccount = async (e) => {
    if(e) e.preventDefault();
    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      setSuccess(false); return;
    }
    if (passwordStrength < 75) {
      setMessage("Le mot de passe doit être Fort ou Très fort.");
      setSuccess(false); return;
    }

    setSubmitting(true); setMessage(''); setSuccess(false);
    try {
      const res = await apiCall('admin_create_account', {
        email, password, name, service_name: serviceName, role,
        workspace_type: workspaceType || 'AUTRE',
        permissions: permissions,
        profile_photo: profilePhoto
      });

      if (res.success) {
        setSuccess(true); setMessage(res.message);
        setEmail(''); setPassword(''); setName(''); setServiceName('');
        setRole('user'); setWorkspaceType(''); setProfilePhoto('');
        setPermissions(Object.fromEntries(Object.keys(ALL_MODULES).map(k => [k, 'none'])));
        fetchUsers();
        
        // Reset states based on design
        if(uiDesign === 1) setShowDrawer(false);
        if(uiDesign === 3) { setViewMode('list'); setWizardStep(1); }
        if(uiDesign === 4) setActiveTab('list');
      } else {
        let errorMsg = res.message || 'Erreur lors de la création';
        if (res.suggestions && res.suggestions.length > 0) {
          errorMsg = (
            <div>
              {res.message}
              <div style={{ marginTop: '10px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>💡 Suggestions :</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {res.suggestions.map((sugg, idx) => (
                    <div key={idx} style={{ color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56,189,248,0.1)', padding: '6px 12px', borderRadius: '6px' }} onClick={() => { setEmail(sugg); setMessage(''); }}>
                      <span>👉</span> <strong>{sugg}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        setMessage(errorMsg);
      }
    } catch (e) { setMessage('Erreur de connexion'); } finally { setSubmitting(false); }
  };

  const hasServicesPermission = user?.role === 'super_admin' ||
    (Array.isArray(user?.permissions) ? user.permissions.includes('services') :
    (user?.permissions ? Object.values(user.permissions).includes('services') || !!user.permissions['services'] : false));

  if (!hasServicesPermission) return <div className="alert alert-danger" style={{ margin: '20px' }}>Accès refusé.</div>;

  const getWorkspaceBadge = (ws) => {
    const preset = WORKSPACE_PRESETS[ws] || WORKSPACE_PRESETS['AUTRE'];
    return (
      <span style={{ background: `${preset.color}22`, color: preset.color, border: `1px solid ${preset.color}55`, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
        {preset.icon} {preset.label}
      </span>
    );
  };

  // --- SHARED COMPONENTS ---
  const UserGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
      {users.length === 0 ? (
        <div style={{ padding: '40px', color: 'var(--muted)', textAlign: 'center', gridColumn: '1 / -1' }}>Aucun compte trouvé.</div>
      ) : (
        users.map((u, idx) => (
          <div key={idx} className="glass-panel profile-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', border: '3px solid white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                <label style={{ cursor: 'pointer', flexShrink: 0 }} title="Modifier la photo">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(56,189,248,0.3)', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'}>
                    {u.profile_photo
                      ? <img src={u.profile_photo} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : u.name
                        ? <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>{u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                        : <UserCircle2 size={28} />
                    }
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleUpdateCardPhoto(u.email, e)} style={{ display: 'none' }} />
                </label>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                     {u.name}
                    {(u.role === 'admin' || u.role === 'super_admin') && (
                       <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#eab30822', color: '#eab308', borderRadius: '4px', border: '1px solid #eab30855', fontWeight: 700, letterSpacing: '0.5px' }}>ADMIN</span>
                    )}
                  </h4>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: u.status === 'suspended' ? '#f59e0b22' : u.status === 'deactivated' ? '#ef444422' : '#22c55e22', color: u.status === 'suspended' ? '#f59e0b' : u.status === 'deactivated' ? '#ef4444' : '#22c55e', borderRadius: '4px', border: '1px solid currentColor', fontWeight: 700, letterSpacing: '0.5px' }}>
                      {u.status === 'suspended' ? 'SUSPENDU' : u.status === 'deactivated' ? 'DÉSACTIVÉ' : 'ACTIF'}
                    </span>
                    {u.maintenance_mode && <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#3b82f622', color: '#3b82f6', borderRadius: '4px', border: '1px solid currentColor', fontWeight: 700, letterSpacing: '0.5px' }}>MAINTENANCE</span>}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'white', marginTop: '4px', display: 'block', wordBreak: 'break-word' }}>{u.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '0 0 auto' }}>
                <button 
                  onClick={() => {
                      setEditingUser(u);
                      const p = {};
                      Object.keys(ALL_MODULES).forEach(m => {
                          if (Array.isArray(u.permissions)) p[m] = u.permissions.includes(m) ? 'write' : 'none';
                          else if (u.permissions && typeof u.permissions === 'object') {
                              if (u.permissions[m] === true) p[m] = 'write';
                              else if (u.permissions[m] === false) p[m] = 'none';
                              else if (typeof u.permissions[m] === 'string') p[m] = u.permissions[m];
                              else p[m] = Object.values(u.permissions).includes(m) ? 'write' : 'none';
                          }
                          else p[m] = 'none';
                      });
                      setEditPerms(p);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '5px' }}
                  title="Modifier les permissions"
                >
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleUpdateStatus(u, u.status === 'suspended' ? 'active' : 'suspended')} style={{ background: 'transparent', border: 'none', color: u.status === 'suspended' ? '#22c55e' : '#f59e0b', cursor: 'pointer', padding: '5px' }} title={u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}>
                  <PauseCircle size={16} />
                </button>
                <button onClick={() => handleUpdateStatus(u, u.status === 'deactivated' ? 'active' : 'deactivated')} style={{ background: 'transparent', border: 'none', color: u.status === 'deactivated' ? '#22c55e' : '#ef4444', cursor: 'pointer', padding: '5px' }} title={u.status === 'deactivated' ? 'Réactiver' : 'Désactiver'}>
                  <PowerOff size={16} />
                </button>
                <button onClick={() => handleToggleMaintenance(u)} style={{ background: 'transparent', border: 'none', color: u.maintenance_mode ? '#3b82f6' : '#94a3b8', cursor: 'pointer', padding: '5px' }} title={u.maintenance_mode ? 'Désactiver Maintenance' : 'Activer Maintenance'}>
                  <Wrench size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteUser(u)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                  title="Supprimer définitivement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {getWorkspaceBadge(u.workspace_type || 'AUTRE')}
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>
                  {u.service}
                </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const FormContent = () => (
    <>
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label className="form-label">Photo de profil (Optionnel)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profilePhoto ? <img src={profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle2 size={24} color="var(--muted)" />}
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ color: 'var(--muted)', fontSize: '0.85rem' }} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 700, color: '#38bdf8' }}>🏷️ Espace de Travail</label>
        <select className="form-input" value={workspaceType} onChange={e => handleWorkspaceChange(e.target.value)} style={{ fontWeight: 600 }}>
          <option value="">— Choisir un espace —</option>
          {Object.entries(WORKSPACE_PRESETS).map(([key, ws]) => (<option key={key} value={key}>{ws.icon} {ws.label}</option>))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Nom Complet</label>
        <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Jean Dupont" />
      </div>
      <div className="form-group">
        <label className="form-label">Email (Identifiant)</label>
        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jean.dupont@entreprise.com" />
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe sécurisé</label>
        <div style={{ position: 'relative' }}>
          <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--muted)' }} />
          <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '36px' }} placeholder="Minimum 8 caractères" />
        </div>
        {password.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--muted)' }}>Force :</span>
              <span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${passwordStrength}%`, height: '100%', background: strengthColor, transition: '0.3s' }} />
            </div>
          </div>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">Nom du Service</label>
        <input type="text" className="form-input" value={serviceName} onChange={e => setServiceName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Niveau de Privilège</label>
        <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">Utilisateur standard</option>
          <option value="admin">Administrateur</option>
          {user?.role === 'super_admin' && <option value="super_admin">Super Administrateur</option>}
        </select>
      </div>
      <div className="form-group" style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <label className="form-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'block' }}>Modules</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {Object.entries(ALL_MODULES).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: permissions[key] && permissions[key] !== 'none' ? '#f0f9ff' : 'var(--muted)' }}>
              <span>{label}</span>
              <select value={permissions[key] || 'none'} onChange={(e) => setPermissions(prev => ({ ...prev, [key]: e.target.value }))} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}>
                <option value="none">Aucun accès</option>
                                <option value="read">Lecture seule</option>
                                <option value="write">Modification</option>
                                {key === 'reclamation_view' && <option value="modifier_no">Modification (etape 2)</option>}
                                {key === 'reclamation_view' && <option value="approver_3">Approbateur Final (etape 3)</option>}
              </select>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* HEADER & SWITCHER */}
      {!(uiDesign === 3 && viewMode === 'wizard') && (
        <div className="top-bar glass-panel" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', border: '2px solid white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={28} style={{ color: '#38bdf8' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>Gestion des Services</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>Gérez les identités et les habilitations</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', padding: '0 8px' }}>Design :</span>
              {[1, 2, 3, 4].map(d => (
                <button 
                  key={d} onClick={() => { setUiDesign(d); setMessage(''); }}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: uiDesign === d ? '#38bdf8' : 'transparent', color: uiDesign === d ? 'black' : 'white', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                >
                  {d}
                </button>
              ))}
            </div>
            
            {/* Action Button for specific designs */}
            {uiDesign === 1 && (
              <button className="btn btn-primary" onClick={() => setShowDrawer(true)} style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Plus size={18} /> Nouveau Compte
              </button>
            )}
            {uiDesign === 3 && viewMode === 'list' && (
              <button className="btn btn-primary" onClick={() => { setViewMode('wizard'); setWizardStep(1); }} style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Plus size={18} /> Nouveau Compte
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
           <Loader2 className="animate-spin" size={40} style={{ color: '#38bdf8' }} />
         </div>
      ) : (
        <>
          {/* =====================================================================
              DESIGN 1 : DRAWER (PANNEAU COULISSANT)
          ====================================================================== */}
          {uiDesign === 1 && (
            <div style={{ position: 'relative', overflowX: 'hidden' }}>
              <div style={{ filter: showDrawer ? 'blur(4px)' : 'none', opacity: showDrawer ? 0.6 : 1, transition: '0.3s' }}>
                <UserGrid />
              </div>
              
              {/* Drawer */}
              <div style={{
                position: 'fixed', top: 0, right: showDrawer ? 0 : '-500px', width: '100%', maxWidth: '450px', height: '100vh',
                background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 9999,
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Nouveau Compte</h3>
                  <button onClick={() => setShowDrawer(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                  {message && <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>{message}</div>}
                  <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <FormContent />
                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '20px', padding: '14px' }}>
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Créer
                    </button>
                  </form>
                </div>
              </div>
              {showDrawer && <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998 }} />}
            </div>
          )}

          {/* =====================================================================
              DESIGN 2 : GRILLE + FORMULAIRE LATÉRAL (SPLIT SCREEN)
          ====================================================================== */}
          {uiDesign === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} color="#38bdf8"/> Créer un compte</h3>
                {message && <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>{message}</div>}
                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <FormContent />
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '20px', padding: '14px' }}>
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Créer le compte
                  </button>
                </form>
              </div>
              <div>
                 <UserGrid />
              </div>
            </div>
          )}

          {/* =====================================================================
              DESIGN 3 : WIZARD (ÉTAPE PAR ÉTAPE)
          ====================================================================== */}
          {uiDesign === 3 && (
            viewMode === 'wizard' ? (
              <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '0', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button onClick={() => setViewMode('list')} className="btn" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: 'none', color: 'white' }}><ArrowLeft size={18} color="white" /></button>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Création d'un Profil</h3>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                      {[1, 2, 3].map(step => (<div key={step} style={{ height: '4px', flex: 1, borderRadius: '2px', background: wizardStep >= step ? '#38bdf8' : 'rgba(255,255,255,0.1)', transition: '0.3s' }} />))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '30px' }}>
                  {message && <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>{message}</div>}

                  {wizardStep === 1 && (
                    <div className="animate-fade-in">
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'white' }}>1. Choisissez le type d'espace (Profil)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {Object.entries(WORKSPACE_PRESETS).map(([key, ws]) => (
                          <div key={key} onClick={() => { handleWorkspaceChange(key); setWizardStep(2); }} className={`wizard-card ${workspaceType === key ? 'active' : ''}`}>
                            <span style={{ fontSize: '2rem' }}>{ws.icon}</span>
                            <strong style={{ color: workspaceType === key ? ws.color : 'white', fontSize: '1.05rem' }}>{ws.label}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{ws.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '1.5rem' }}>{WORKSPACE_PRESETS[workspaceType]?.icon}</span>2. Informations de {WORKSPACE_PRESETS[workspaceType]?.label}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Photo de profil (Optionnel)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {profilePhoto ? <img src={profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle2 size={30} color="var(--muted)" />}
                            </div>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ color: 'var(--muted)', fontSize: '0.85rem' }} />
                          </div>
                        </div>
                        <div className="form-group"><label className="form-label">Nom Complet de l'Agent</label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Nom du Service / Dépt</label><input type="text" className="form-input" value={serviceName} onChange={e => setServiceName(e.target.value)} required /></div>
                      </div>
                      <div className="form-group"><label className="form-label">Email (Identifiant de connexion)</label><input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                      <div className="form-group">
                        <label className="form-label">Mot de passe sécurisé</label>
                        <div style={{ position: 'relative' }}><KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--muted)' }} /><input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '36px' }} /></div>
                        {password.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}><span style={{ color: 'var(--muted)' }}>Force :</span><span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span></div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${passwordStrength}%`, height: '100%', background: strengthColor, transition: '0.3s' }} /></div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button type="button" onClick={() => setWizardStep(1)} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}><ChevronLeft size={16} /> Précédent</button>
                        <button type="button" className="btn btn-primary" onClick={() => {
                            if(!name || !email || !serviceName || !password) { setMessage('Veuillez remplir tous les champs'); return; }
                            if(password.length < 8 || passwordStrength < 75) { setMessage('Mot de passe trop faible.'); return; }
                            setMessage(''); setWizardStep(3);
                          }}>Continuer <ChevronRight size={16} /></button>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <form onSubmit={handleCreateAccount} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'white' }}>3. Révision des Droits</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="form-group" style={{ marginBottom: '15px' }}><label className="form-label">Rôle technique</label><select className="form-input" value={role} onChange={e => setRole(e.target.value)}><option value="user">Utilisateur standard</option><option value="admin">Administrateur</option>{user?.role === 'super_admin' && <option value="super_admin">Super Administrateur</option>}</select></div>
                        <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>Modules</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {Object.entries(ALL_MODULES).map(([key, label]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: permissions[key] && permissions[key] !== 'none' ? 'white' : 'var(--muted)' }}>
                              <span>{label}</span>
                              <select value={permissions[key] || 'none'} onChange={(e) => setPermissions(prev => ({ ...prev, [key]: e.target.value }))} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}>
                                <option value="none">Aucun accès</option>
                                <option value="read">Lecture seule</option>
                                <option value="write">Modification</option>
                                {key === 'reclamation_view' && <option value="modifier_no">Modification (etape 2)</option>}
                                {key === 'reclamation_view' && <option value="approver_3">Approbateur Final (etape 3)</option>}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button type="button" onClick={() => setWizardStep(2)} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}><ChevronLeft size={16} /> Retour</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '12px 24px', fontWeight: 700 }}>{submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} <span style={{ marginLeft: '8px' }}>Créer le compte</span></button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <UserGrid />
            )
          )}

          {/* =====================================================================
              DESIGN 4 : ONGLETS (TABS)
          ====================================================================== */}
          {uiDesign === 4 && (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                <button onClick={() => setActiveTab('list')} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'list' ? '2px solid #38bdf8' : '2px solid transparent', color: activeTab === 'list' ? '#38bdf8' : 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                  <Users size={18} /> Liste des Comptes
                </button>
                <button onClick={() => setActiveTab('create')} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'create' ? '2px solid #38bdf8' : '2px solid transparent', color: activeTab === 'create' ? '#38bdf8' : 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                  <Plus size={18} /> Créer un Profil
                </button>
                {user?.role === 'super_admin' && (
                  <button onClick={() => setActiveTab('companies')} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'companies' ? '2px solid #38bdf8' : '2px solid transparent', color: activeTab === 'companies' ? '#38bdf8' : 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                    <Building2 size={18} /> Entreprises
                  </button>
                )}
                <button onClick={() => setActiveTab('inbox')} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'inbox' ? '2px solid #38bdf8' : '2px solid transparent', color: activeTab === 'inbox' ? '#38bdf8' : 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                  <Inbox size={18} /> Messagerie Privée
                </button>
              </div>
              
              <div style={{ padding: '30px' }}>
                {activeTab === 'list' && <UserGrid />}
                {activeTab === 'create' && (
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {message && <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>{message}</div>}
                    <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <FormContent />
                      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '20px', padding: '14px', width: '100%' }}>
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Créer le compte
                      </button>
                    </form>
                  </div>
                )}
                {activeTab === 'companies' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                        <th style={{ padding: '12px 8px' }}>Nom</th><th style={{ padding: '12px 8px' }}>Propriétaire</th><th style={{ padding: '12px 8px' }}>Inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', color: 'white' }}>{c.name}</td><td style={{ padding: '12px 8px', color: 'var(--muted)' }}>{c.owner_email}</td><td style={{ padding: '12px 8px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeTab === 'inbox' && (
                  <BoiteReceptionAdmin />
                )}
              </div>
            </div>
          )}

        </>
      )}

      {/* Modal Modifier Permissions */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Modifier les permissions</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(56,189,248,0.08)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}><b style={{ color: 'white' }}>{editingUser.name}</b>{getWorkspaceBadge(editingUser.workspace_type || 'AUTRE')}</div>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{editingUser.email} · Service : {editingUser.service}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {Object.entries(ALL_MODULES).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', color: editPerms[key] && editPerms[key] !== 'none' ? '#f0f9ff' : 'var(--muted)' }}>
                  <span>{label}</span>
                  <select value={editPerms[key] || 'none'} onChange={(e) => setEditPerms(prev => ({ ...prev, [key]: e.target.value }))} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}>
                    <option value="none">Aucun accès</option>
                                <option value="read">Lecture seule</option>
                                <option value="write">Modification</option>
                                {key === 'reclamation_view' && <option value="approver_2">Modification (etape 2)</option>}
                                {key === 'reclamation_view' && <option value="approver_3">Approbateur Final (etape 3)</option>}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn" onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Annuler</button>
              <button className="btn btn-primary" disabled={editSaving} onClick={async () => {
                  setEditSaving(true);
                  try {
                    const res = await apiCall('update_user_permissions', { email: editingUser.email, permissions: editPerms });
                    if (res.success) { setEditingUser(null); fetchUsers(); } else alert(res.message);
                  } catch (e) { alert('Erreur réseau'); } finally { setEditSaving(false); }
              }}>
                {editSaving ? <Loader2 className="animate-spin" size={18} /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Maintenance / Impersonation */}
      {maintenanceTargetUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#eab308' }}>Mode Maintenance</h3>
              <button onClick={() => setMaintenanceTargetUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
              Que souhaitez-vous faire pour le compte de <b style={{color: 'white'}}>{maintenanceTargetUser.name}</b> ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={confirmToggleMaintenance}
                style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#fef08a', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}
              >
                <Wrench size={18} />
                {maintenanceTargetUser.maintenance_mode ? 'Désactiver la maintenance (Débloquer)' : 'Activer la maintenance (Bloquer l\'accès)'}
              </button>
              
              {!maintenanceTargetUser.maintenance_mode && (
                <button 
                  onClick={handleImpersonate}
                  style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#bae6fd', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}
                >
                  <UserCircle2 size={18} />
                  Se connecter en tant que cet utilisateur
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
