import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  ShieldCheck, Users, Loader2, Save, X, Search,
  Eye, EyeOff, ChevronDown, ChevronRight, UserCircle2,
  CheckCircle2, AlertTriangle, Lock, Unlock, Shield
} from 'lucide-react';

const ALL_MODULES = {
  analytics: { label: 'Tableau de Bord Analytique', icon: '📊', desc: 'Visualisez les statistiques, les tendances et les performances en temps réel.' },
  employees: { label: 'Gestion des Employés', icon: '👥', desc: 'Gérer la base de données de tous vos employés, leurs contrats et informations.' },
  payroll: { label: 'État de Paie', icon: '🧾', desc: 'Génération, consultation et gestion des fiches de paie.' },
  leave: { label: 'Gestion des Congés', icon: '✈️', desc: 'Suivi et validation des demandes de congés et absences.' },
  gps: { label: 'Pointage GPS', icon: '📍', desc: 'Signalez votre présence avec votre position géographique.' },
  dashboard: { label: 'Pointage du Mois', icon: '🗓️', desc: 'Gérer les plannings et les pointages des agents sur les différents sites.' },
  print_attendance: { label: 'Imprimer le Pointage', icon: '🖨️', desc: 'Générer une version imprimable du pointage pour un agent spécifique.' },
  print_payroll: { label: 'Imprimer Fiche de Paie', icon: '🖨️', desc: 'Générer et imprimer les fiches de paie mensuelles.' },
  fluctuation: { label: 'Fluctuation Salariale', icon: '📈', desc: 'Suivi et analyse des variations salariales et des primes/retenues.' },
  salaries: { label: 'Grille Salariale', icon: '💰', desc: 'Consulter et modifier la grille de rémunération par fonction/poste.' },
  calcul_salaires: { label: 'Calcul des Salaires', icon: '🧮', desc: 'Génération et validation du calcul global des salaires.' },
  reclamation_view: { label: 'Réclamation (Consultation)', icon: '⚠️', desc: 'Consulter les fiches de réclamation publiées par les autres services.' },
  reclamation_edit: { label: 'Réclamation (Édition)', icon: '✏️', desc: 'Créer, modifier et publier les fiches de réclamation de paie. Droit exclusif accordé par l\'admin.' },
  new_mep: { label: 'Nouvelle MEP', icon: '🏗️', desc: 'Gestion des Mises en Place (MEP) sur site, rajouts et fermetures de postes.' },
  recrutement: { label: 'Espace E-Recrutement', icon: '🤝', desc: 'Gestion des candidatures, entretiens et embauches de nouveaux agents.' },
  materiel: { label: 'Suivi du Matériel', icon: '📦', desc: 'Gestion des dotations (tenues, PTI, radios) et inventaire matériel.' },
  verification: { label: 'Traitement du pointage', icon: '✅', desc: 'Vérification et validation des pointages.' },
  archives: { label: 'Archives Rapports', icon: '🗂️', desc: 'Consulter l\'historique des rapports passés.' },
  communication: { label: 'Communication & Tickets', icon: '💬', desc: 'Messagerie interne et gestion des tickets.' },
  services: { label: 'Gestion des Profils', icon: '⚙️', desc: 'Gérer les accès et habilitations des services.' },
  kiosk: { label: 'Mode Kiosque', icon: '📱', desc: 'Interface de pointage direct sur site.' },
  permissions: { label: 'Gestion des Permissions', icon: '⏱️', desc: 'Suivi et historique des agents ayant obtenu une permission exceptionnelle.' },
  contracts: { label: 'Gestion des Contrats', icon: '📁', desc: 'Gérez les contrats de travail, les renouvellements et les périodes d\'essai.' },
  registry: { label: 'Registre Général', icon: '🏢', desc: 'Consulter l\'effectif total de l\'entreprise (actifs, sortis, incertains).' },
  registre_visiteurs: { label: 'Registre des Visiteurs', icon: '📝', desc: 'Enregistrer l\'arrivée et le départ des visiteurs extérieurs.' },
  annuaire_statut: { label: 'Annuaire & Statut', icon: '📞', desc: 'Savoir qui est présent ou absent à l\'instant T.' },
  pointage_courriers: { label: 'Pointage Courriers/Colis', icon: '📮', desc: 'Enregistrer les arrivées de colis et notifier les collaborateurs.' },
  gestion_salles: { label: 'Gestion des Salles', icon: '🚪', desc: 'Calendrier des réservations de salles de réunion.' },
  reflexe_securite: { label: 'Réflexe Sécurité', icon: '🔒', desc: 'Verrouillage rapide de session pour l\'accueil.' },
  gestion_appels: { label: 'Main Courante & Appels', icon: '☎️', desc: 'Standard virtuel, prise de messages et journal de bord.' },
  gestion_flotte: { label: 'Gestion de Flotte', icon: '🚗', desc: 'Réservation de véhicules de service et gestion des clés.' },
  badges_provisoires: { label: 'Badges Provisoires', icon: '💳', desc: 'Gestion et suivi des badges temporaires prêtés.' },
  fournitures_bureau: { label: 'Fournitures de Bureau', icon: '📎', desc: 'Commandes et gestion du stock de petit matériel.' },
  accueil_vip: { label: 'Protocole & Accueil VIP', icon: '👑', desc: 'Gestion des visites de haut rang (parking, repas, etc.).' },
  alertes_securite: { label: 'Alertes Confinement', icon: '🚨', desc: 'Déclenchement d\'alertes globales d\'évacuation/confinement.' },
  dg_vision: { label: 'Vision 360° (DG)', icon: '🦅', desc: 'Tableau de bord exécutif avec indicateurs de performance clés (KPIs).' },
  dg_rapports: { label: 'Rapports Stratégiques (DG)', icon: '📑', desc: 'Génération de rapports exécutifs pour le conseil et les actionnaires.' },
  dg_validation: { label: 'Validations Exécutives (DG)', icon: '🎯', desc: 'Validation des grosses dépenses, augmentations ou MEP importantes.' },
  dg_spy: { label: 'Mode Espion (DG)', icon: '🕵️', desc: 'Permet au DG de voir le système avec l\'interface et les droits d\'un autre employé spécifique.' },
  dg_block: { label: 'Blocage de Service (DG)', icon: '🚫', desc: 'Permet de geler temporairement l\'accès d\'un service complet.' },
  dg_audit: { label: 'Audit & Traçabilité (DG)', icon: '📜', desc: 'Consultation complète du journal d\'activité (qui a fait quoi et quand).' },
  dg_megaphone: { label: 'Mégaphone Exécutif (DG)', icon: '📢', desc: 'Diffuser une annonce prioritaire à tous les employés.' },
  dg_predictive: { label: 'Analyse Prédictive (DG)', icon: '🔮', desc: 'Simulations des coûts futurs et de l\'absentéisme.' },
  dg_okr: { label: 'Objectifs Stratégiques (DG)', icon: '🎯', desc: 'Suivi de la progression des objectifs des départements.' },
  dg_litiges: { label: 'Litiges & Alertes (DG)', icon: '⚖️', desc: 'Radar des alertes légales, prud\'homales et contractuelles.' },
  dg_organigramme: { label: 'Organigramme Live (DG)', icon: '🗺️', desc: 'Vue hiérarchique détaillée avec coûts et présences des effectifs.' },
  dg_agenda: { label: 'Agenda Stratégique (DG)', icon: '📅', desc: 'Calendrier des échéances stratégiques synchrosé avec les dates clés de l\'entreprise.' },
  dg_pv: { label: 'Compte Rendu Réunions (DG)', icon: '📝', desc: 'Créer, signer et archiver les procès-verbaux de réunions de direction.' },
  dg_veille: { label: 'Veille Sectorielle (DG)', icon: '📰', desc: 'Indicateurs économiques et légaux pour des décisions contextualisées.' },
  pdg_souverain: { label: 'Tableau de Bord Souverain (PDG)', icon: '👑', desc: 'Vue de synthèse absolue de la valeur et de la conformité.' },
  pdg_bilan: { label: 'Bilan & Performance Financière (PDG)', icon: '📈', desc: 'Rapport consolidé sur 12 mois de la performance.' },
  pdg_signature: { label: 'Signature Électronique Exécutive (PDG)', icon: '✍️', desc: 'Apposer une signature numérique officielle sur les documents.' },
  pdg_sites: { label: 'Tableau des Sites & Filiales (PDG)', icon: '🌐', desc: 'Vue globale et contrôle d\'activation/suspension des sites.' },
  pdg_acces_maitre: { label: 'Accès Maître & Super-Contrôle (PDG)', icon: '🔐', desc: 'Création d\'Admins et reset des mots de passe DG.' },
  pdg_benchmark: { label: 'Comparatif Concurrentiel (PDG)', icon: '📊', desc: 'Benchmarks du marché par rapport aux métriques internes.' },
  pdg_coffre: { label: 'La Salle des Coffres (PDG)', icon: '🏦', desc: 'Stockage ultra-sécurisé des documents fondateurs de l\'entreprise.' },
  pdg_expansion: { label: 'Simulateur d\'Expansion M&A (PDG)', icon: '🌍', desc: 'Simulation d\'impact d\'une ouverture de filiale ou acquisition.' },
  pdg_actionnaires: { label: 'Rapport aux Actionnaires (PDG)', icon: '📜', desc: 'Génération automatique de l\'Executive Summary PDF.' },
  pdg_menaces: { label: 'Radar des Menaces Critiques (PDG)', icon: '⚡', desc: 'Vue macro-économique des risques existentiels pour la société.' },
  pc_radar: { label: 'Radar Tactique (PC)', icon: '🗺️', desc: 'Cartographie temps réel des sites et de leur état.' },
  pc_alertes: { label: 'Urgences & SOS (PC)', icon: '🚨', desc: 'Mur centralisé des alertes rouges et boutons panique.' },
  pc_cctv: { label: 'Vidéosurveillance CCTV (PC)', icon: '📹', desc: 'Accès simulé aux flux de caméras de sécurité.' },
  pc_dispatch: { label: 'Dispatch & Patrouilles (PC)', icon: '🚔', desc: 'Gestion des flottes d\'intervention et appels aux forces de l\'ordre.' },
  pc_comms: { label: 'Statut Réseau & Radios (PC)', icon: '📻', desc: 'Surveillance de la connectivité des équipements terrain.' },
  pc_main_courante: { label: 'Registre Central Incidents (PC)', icon: '📋', desc: 'Supervision globale des mains courantes de tous les sites.' },
  pc_tracking: { label: 'Tracking & Géolocalisation Live (PC)', icon: '📱', desc: 'Localisation en direct des agents via téléphone, email et GPS.' },
  ctrl_feuille: { label: 'Feuille de Route (Contrôleur)', icon: '📋', desc: 'Planning journalier des visites et contrôles.' },
  ctrl_audit: { label: 'Contrôle & Audit Agents (Contrôleur)', icon: '🔍', desc: 'Valider la présence des agents et noter les anomalies.' },
  ctrl_rapport: { label: 'Rapport d\'Incident Express (Contrôleur)', icon: '📝', desc: 'Déclarer rapidement un incident depuis le terrain.' },
  ctrl_dashboard: { label: 'Tableau de Bord Secteur (Contrôleur)', icon: '📊', desc: 'Vue des sites sous tutelle : présence et alertes.' },
  ctrl_messagerie: { label: 'Messagerie Interne (Contrôleur)', icon: '💬', desc: 'Communication PC, DG et broadcast agents.' },
  ctrl_carnet: { label: 'Carnet de Bord (Contrôleur)', icon: '🗒️', desc: 'Journal de toutes les visites et statistiques personnelles.' },
  ctrl_tracking: { label: 'Tracking & Géoloc Live (Contrôleur)', icon: '📍', desc: 'Suivi des véhicules et agents en temps réel.' },
  ctrl_dispatch: { label: 'Dispatch & Interventions (Contrôleur)', icon: '🚔', desc: 'Gestion des urgences et assignations.' },
  ctrl_flotte: { label: 'Gestion Flotte (Contrôleur)', icon: '🚗', desc: 'État des véhicules, pleins, et anomalies.' },
  ctrl_rondes: { label: 'Supervision Rondes (Contrôleur)', icon: '⏱️', desc: 'Suivi en direct des scans NFC et alertes.' },
  ctrl_notation: { label: 'Évaluation & Discipline (Contrôleur)', icon: '⭐', desc: 'Formulaires rapides d\'évaluation des agents.' },
  company_config: { label: 'Configuration Entreprise', icon: '🏢', desc: 'Gestion des postes, fonctions et salaires de base des agents.' }
};

const RISK_LEVELS = {
  analytics: 'low',
  employees: 'medium',
  payroll: 'high',
  leave: 'medium',
  gps: 'low',
  dashboard: 'low',
  print_attendance: 'low',
  print_payroll: 'medium',
  fluctuation: 'medium',
  salaries: 'high',
  calcul_salaires: 'high',
  reclamation_view: 'medium',
  reclamation_edit: 'high',
  new_mep: 'medium',
  recrutement: 'medium',
  materiel: 'low',
  verification: 'medium',
  archives: 'low',
  communication: 'low',
  services: 'critical',
  kiosk: 'low',
  permissions: 'medium',
  contracts: 'high',
  registry: 'medium',
  registre_visiteurs: 'low',
  annuaire_statut: 'low',
  pointage_courriers: 'low',
  gestion_salles: 'low',
  reflexe_securite: 'low',
  gestion_appels: 'low',
  gestion_flotte: 'medium',
  badges_provisoires: 'medium',
  fournitures_bureau: 'low',
  accueil_vip: 'low',
  alertes_securite: 'high',
  dg_vision: 'medium',
  dg_rapports: 'medium',
  dg_validation: 'high',
  dg_spy: 'critical',
  dg_block: 'critical',
  dg_audit: 'high',
  dg_megaphone: 'high',
  dg_predictive: 'medium',
  dg_okr: 'medium',
  dg_litiges: 'high',
  dg_organigramme: 'medium',
  dg_agenda: 'low',
  dg_pv: 'medium',
  dg_veille: 'low',
  pdg_souverain: 'medium',
  pdg_bilan: 'high',
  pdg_signature: 'critical',
  pdg_sites: 'critical',
  pdg_acces_maitre: 'critical',
  pdg_benchmark: 'low',
  pdg_coffre: 'critical',
  pdg_expansion: 'medium',
  pdg_actionnaires: 'high',
  pdg_menaces: 'high',
  pc_radar: 'high',
  pc_alertes: 'critical',
  pc_cctv: 'high',
  pc_dispatch: 'critical',
  pc_comms: 'medium',
  pc_main_courante: 'high',
  pc_tracking: 'critical',
  ctrl_feuille: 'medium',
  ctrl_audit: 'high',
  ctrl_rapport: 'high',
  ctrl_dashboard: 'low',
  ctrl_messagerie: 'medium',
  ctrl_carnet: 'low',
  ctrl_tracking: 'high',
  ctrl_dispatch: 'critical',
  ctrl_flotte: 'medium',
  ctrl_rondes: 'medium',
  ctrl_notation: 'high'
};

const RISK_COLORS = {
  low: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e', label: 'Faible' },
  medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', label: 'Moyen' },
  high: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', label: 'Élevé' },
  critical: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7', label: 'Critique' }
};

export default function PermissionsManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkPerms, setBulkPerms] = useState({});

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_all_users', {}, 'GET');
      if (res.success && res.users) setUsers(res.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) fetchUsers(); else setLoading(false); }, []);

  const getUserPerms = (u) => {
    const p = {};
    Object.keys(ALL_MODULES).forEach(m => {
      if (Array.isArray(u.permissions)) p[m] = u.permissions.includes(m) ? 'write' : false;
      else if (u.permissions && typeof u.permissions === 'object') {
        p[m] = u.permissions[m] || false;
        // Migration of old booleans
        if (p[m] === true) p[m] = 'write';
      } else {
        p[m] = false;
      }
    });
    return p;
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setEditPerms(getUserPerms(u));
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const permsToSave = {};
      Object.keys(editPerms).forEach(k => {
        permsToSave[k] = editPerms[k] || false;
      });
      const res = await apiCall('update_user_permissions', {
        email: selectedUser.email,
        permissions: permsToSave
      });
      if (res.success) {
        setSaveMsg('✅ Permissions mises à jour avec succès');
        fetchUsers();
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('❌ ' + (res.message || 'Erreur'));
      }
    } catch (e) { setSaveMsg('❌ Erreur réseau'); }
    finally { setSaving(false); }
  };

  const handleBulkSave = async () => {
    if (bulkUsers.length === 0) return;
    setSaving(true);
    setSaveMsg('');
    try {
      let success = 0;
      for (const email of bulkUsers) {
        const currentUser = users.find(u => u.email === email);
        if (!currentUser) continue;
        const currentPerms = getUserPerms(currentUser);
        const mergedPerms = { ...currentPerms };
        Object.keys(bulkPerms).forEach(k => {
          if (bulkPerms[k] !== null) mergedPerms[k] = bulkPerms[k];
        });
        const permsToSave = {};
        Object.keys(mergedPerms).forEach(k => {
          permsToSave[k] = mergedPerms[k] || false;
        });
        const res = await apiCall('update_user_permissions', {
          email,
          permissions: permsToSave
        });
        if (res.success) success++;
      }
      setSaveMsg(`✅ ${success}/${bulkUsers.length} utilisateurs mis à jour`);
      fetchUsers();
      setBulkMode(false);
      setBulkUsers([]);
      setBulkPerms({});
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) { setSaveMsg('❌ Erreur réseau'); }
    finally { setSaving(false); }
  };

  const getPermCount = (u) => {
    const p = getUserPerms(u);
    return Object.values(p).filter(Boolean).length;
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.service?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <Lock size={40} style={{ color: '#ef4444' }} />
      </div>
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Accès Restreint</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '420px', lineHeight: '1.6' }}>
        Ce module est réservé aux administrateurs.
      </p>
    </div>
  );

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header */}
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} style={{ color: '#a855f7' }} />
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Gestion des Permissions</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
              Contrôle granulaire des accès par utilisateur
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`btn ${bulkMode ? 'btn-primary' : ''}`}
            onClick={() => { setBulkMode(!bulkMode); setBulkUsers([]); setBulkPerms({}); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Users size={16} /> {bulkMode ? 'Annuler le mode masse' : 'Mode masse'}
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', minWidth: '220px' }}
            />
          </div>
        </div>
      </div>

      {saveMsg && (
        <div style={{
          padding: '12px 20px', margin: '16px 0', borderRadius: '12px',
          background: saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${saveMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: saveMsg.startsWith('✅') ? '#22c55e' : '#ef4444',
          fontWeight: 600, fontSize: '0.9rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {saveMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: '#a855f7' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedUser && !bulkMode ? '380px 1fr' : '1fr', gap: '24px', marginTop: '24px' }}>
          {/* Left Panel: User List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
              </span>
              {bulkMode && bulkUsers.length > 0 && (
                <span style={{ color: '#a855f7', fontSize: '0.85rem', fontWeight: 700 }}>
                  {bulkUsers.length} sélectionné{bulkUsers.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: selectedUser ? '70vh' : 'auto', overflowY: selectedUser ? 'auto' : 'visible' }}>
              {filteredUsers.map((u, idx) => {
                const permCount = getPermCount(u);
                const isSelected = selectedUser?.email === u.email;
                const isBulkSelected = bulkUsers.includes(u.email);
                return (
                  <div
                    key={idx}
                    onClick={() => bulkMode
                      ? setBulkUsers(prev => prev.includes(u.email) ? prev.filter(e => e !== u.email) : [...prev, u.email])
                      : selectUser(u)
                    }
                    className="glass-panel"
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      border: isSelected ? '1px solid #a855f7' : isBulkSelected ? '1px solid #38bdf8' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(168,85,247,0.08)' : isBulkSelected ? 'rgba(56,189,248,0.08)' : undefined,
                      transition: 'all 0.2s',
                      animation: `slideUp 0.3s ease-out forwards`,
                      animationDelay: `${idx * 0.03}s`,
                      opacity: 0
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
                    onMouseLeave={e => { if (!isSelected && !isBulkSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={isBulkSelected}
                          readOnly
                          style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
                        />
                      )}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0
                      }}>
                        {u.profile_photo
                          ? <img src={u.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <UserCircle2 size={20} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'white', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.name}
                          </span>
                          {(u.role === 'admin' || u.role === 'super_admin') && (
                            <span style={{
                              fontSize: '0.6rem', padding: '2px 5px',
                              background: '#eab30822', color: '#eab308',
                              borderRadius: '4px', border: '1px solid #eab30855',
                              fontWeight: 700, flexShrink: 0
                            }}>
                              {u.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.service}</span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: permCount > 6 ? 'rgba(239,68,68,0.1)' : permCount > 3 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                        color: permCount > 6 ? '#ef4444' : permCount > 3 ? '#f59e0b' : '#22c55e',
                        padding: '3px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        flexShrink: 0
                      }}>
                        <Shield size={12} /> {permCount}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk Action Bar */}
            {bulkMode && bulkUsers.length > 0 && (
              <div className="glass-panel" style={{ marginTop: '16px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#38bdf8' }}>
                  Modifier {bulkUsers.length} utilisateur{bulkUsers.length > 1 ? 's' : ''}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                  {Object.entries(ALL_MODULES).map(([key, mod]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'white' }}>{mod.icon} {mod.label}</span>
                      <select 
                        value={bulkPerms[key] === null ? '' : (bulkPerms[key] || 'false')}
                        onChange={e => {
                          const val = e.target.value === 'false' ? false : e.target.value;
                          setBulkPerms(prev => ({ ...prev, [key]: val === '' ? null : val }));
                        }}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', padding: '4px', fontSize: '0.75rem' }}
                      >
                        <option value="">(Inchangé)</option>
                        <option value="false">Aucun accès</option>
                        <option value="read">Lecture seule</option>
                        <option value="write">Lecture et Modification</option>
                      </select>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleBulkSave} disabled={saving}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Appliquer à {bulkUsers.length} utilisateur{bulkUsers.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Permission Editor */}
          {selectedUser && !bulkMode && (
            <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {selectedUser.profile_photo
                      ? <img src={selectedUser.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <UserCircle2 size={28} />
                    }
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>{selectedUser.name}</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{selectedUser.email}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Risk Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {Object.entries(RISK_COLORS).map(([level, style]) => {
                  const count = Object.keys(editPerms).filter(k => editPerms[k] && RISK_LEVELS[k] === level).length;
                  return (
                    <div key={level} style={{
                      padding: '10px', borderRadius: '10px', textAlign: 'center',
                      background: style.bg, border: `1px solid ${style.border}`,
                      cursor: 'pointer',
                      boxShadow: expandedRisk === level ? `0 0 12px ${style.border}` : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setExpandedRisk(expandedRisk === level ? null : level)}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: style.text }}>{count}</div>
                      <div style={{ fontSize: '0.68rem', color: style.text, fontWeight: 600, textTransform: 'uppercase' }}>{style.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Permission Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                {Object.entries(ALL_MODULES).map(([key, mod]) => {
                  const risk = RISK_LEVELS[key] || 'low';
                  const riskStyle = RISK_COLORS[risk];
                  const permVal = editPerms[key] || false;
                  const isEnabled = permVal !== false;
                  const isHighlighted = expandedRisk === risk;

                  if (expandedRisk && expandedRisk !== risk) return null;

                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '12px',
                      background: isEnabled ? `${riskStyle.bg}` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isEnabled ? riskStyle.border : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.25s',
                      transform: isHighlighted ? 'scale(1.01)' : 'scale(1)'
                    }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{mod.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: isEnabled ? 'white' : 'var(--muted)', fontSize: '0.9rem' }}>
                          {mod.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                          {mod.desc}
                        </div>
                      </div>
                      
                      {/* Read/Write Selection */}
                      <select 
                        value={permVal || 'false'}
                        onChange={(e) => {
                          const val = e.target.value === 'false' ? false : e.target.value;
                          setEditPerms(prev => ({ ...prev, [key]: val }));
                        }}
                        style={{
                          background: isEnabled ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isEnabled ? riskStyle.border : 'rgba(255,255,255,0.1)'}`,
                          color: isEnabled ? 'white' : 'var(--muted)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="false">Aucun accès</option>
                        <option value="read">Lecture seule</option>
                        <option value="write">Lecture et Modif.</option>
                        {key === 'reclamation_view' && (
                          <>
                            <option value="modifier_no">Modification N° (Étape 2)</option>
                            <option value="approver_3">Approbateur Final (Étape 3)</option>
                          </>
                        )}
                      </select>
                    </div>
                  );
                })}
              </div>

              {expandedRisk && (
                <button
                  onClick={() => setExpandedRisk(null)}
                  style={{
                    marginTop: '12px', background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--muted)', padding: '8px', borderRadius: '8px', cursor: 'pointer',
                    width: '100%', fontSize: '0.82rem'
                  }}
                >
                  Afficher toutes les permissions
                </button>
              )}

              {/* Save Button */}
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{
                  marginTop: '20px', width: '100%', padding: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontWeight: 700, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(168,85,247,0.3)'
                }}
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer les permissions
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
