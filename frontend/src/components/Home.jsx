import React, { useState, useEffect } from 'react';
import { 
  Search, CalendarDays, Printer, FileText, TrendingUp, 
  Table, MessageSquareWarning, PlusCircle, Users, 
  UserCheck, Package, Hammer, X, MapPin, Loader2, CheckCircle, AlertTriangle, Contact, Banknote, Plane, BarChart3, Shield, Briefcase, Clock, Database, Bell, DollarSign, MessageSquare, Archive, ShieldAlert,
  Phone, Car, CreditCard, Paperclip, Crown, Siren, Eye, ScrollText, Target, ShieldOff, Megaphone, Sparkles, Scale, Network, BookOpen, Globe, PenTool, Map, Key, BarChart, Lock, Zap, Video, Radio, ClipboardList, Crosshair, Route, Star, Building2
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { apiCall } from '../api';

export default function Home({ setView, user }) {
  const { hasPermission, hasWritePermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [rhAlerts, setRhAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);

  // Charger les alertes RH au montage
  useEffect(() => {
    if (user?.workspace_type !== 'RH' && user?.role !== 'admin' && user?.role !== 'super_admin') return;
    const loadRHAlerts = async () => {
      try {
        const res = await apiCall('get_all_agents', {}, 'GET');
        if (!res?.success || !res.agents) return;
        const agents = res.agents;
        const alerts = [];
        const alertContractDays = parseInt(localStorage.getItem('pontage_rh_alert_contract') || '15');
        const now = new Date();

        agents.forEach(agent => {
          const pData = agent.profile_data || {};

          // Alerte fin de contrat
          if (pData.contract_type && (pData.contract_type.includes('Déterminée') || pData.contract_type.includes('Essai')) && pData.contract_end) {
            const endDate = new Date(pData.contract_end);
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            if (daysLeft > 0 && daysLeft <= alertContractDays) {
              alerts.push({
                type: 'contract',
                agent: agent.name,
                message: `Contrat expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
                detail: pData.contract_type,
                severity: daysLeft <= 7 ? 'critical' : 'warning'
              });
            } else if (daysLeft <= 0) {
              alerts.push({
                type: 'contract',
                agent: agent.name,
                message: 'Contrat expiré',
                detail: pData.contract_type,
                severity: 'critical'
              });
            }
          }
        });

        setRhAlerts(alerts);
      } catch (e) {
        console.error('Erreur chargement alertes RH:', e);
      }
    };
    loadRHAlerts();
  }, [user]);

  // Définition des 10 cartes demandées
  const cards = [
    {
      id: 'analytics',
      title: 'TABLEAU DE BORD ANALYTIQUE',
      description: 'Visualisez les statistiques, les tendances et les performances en temps réel.',
      icon: BarChart3,
      color: '#a855f7',
      onClick: () => setView('analytics'),
      perm: 'analytics'
    },
    {
      id: 'employes',
      title: 'GESTION DES EMPLOYÉS',
      description: 'Gérer la base de données de tous vos employés, leurs contrats et informations.',
      icon: Contact,
      color: '#f97316',
      onClick: () => setView('employees'),
      perm: 'employees'
    },
    {
      id: 'fiche_paie',
      title: 'ÉTAT DE PAIE',
      description: 'Génération, consultation et gestion des fiches de paie.',
      icon: Banknote,
      color: '#10b981',
      onClick: () => setView('payroll'),
      perm: 'payroll'
    },
    {
      id: 'conge',
      title: 'GESTION DES CONGÉS',
      description: 'Suivi et validation des demandes de congés et absences.',
      icon: Plane,
      color: '#0ea5e9',
      onClick: () => setView('leave_admin'),
      perm: 'leave'
    },
    {
      id: 'pointage_gps',
      title: 'POINTAGE GPS',
      description: 'Signalez votre présence avec votre position géographique.',
      icon: MapPin,
      color: '#10b981',
      onClick: () => setShowGPSModal(true),
      perm: 'gps'
    },
    {
      id: 'pointage',
      title: 'Pointage du mois',
      description: 'Gérer les plannings et les pointages des agents sur les différents sites.',
      icon: CalendarDays,
      color: '#38bdf8',
      onClick: () => setView('dashboard'),
      perm: 'dashboard'
    },
    {
      id: 'imprimer_pointage',
      title: "IMPRIMER LE POINTAGE de l'agent",
      description: 'Générer une version imprimable du pointage pour un agent spécifique.',
      icon: Printer,
      color: '#a78bfa',
      onClick: () => setShowDevModal(true),
      perm: 'print_attendance'
    },
    {
      id: 'imprimer_paie',
      title: 'Imprimer la fiche de paie',
      description: 'Générer et imprimer les fiches de paie mensuelles.',
      icon: FileText,
      color: '#34d399',
      onClick: () => setView('payslip_print'),
      perm: 'print_payroll'
    },
    {
      id: 'fluctuation',
      title: 'FLUTUATION SALARIALE',
      description: 'Suivi et analyse des variations salariales et des primes/retenues.',
      icon: TrendingUp,
      color: '#fbbf24',
      onClick: () => setView('fluctuation'),
      perm: 'fluctuation'
    },
    {
      id: 'company_config',
      title: 'CONFIGURATION DE L\'ENTREPRISE',
      description: 'Gérer les postes, fonctions et salaires de base des agents.',
      icon: Building2,
      color: '#8b5cf6',
      onClick: () => setView('company_config'),
      perm: 'company_config'
    },
    {
      id: 'calcul_salaires',
      title: 'CALCUL DES SALAIRES',
      description: 'Génération et validation du calcul global des salaires.',
      icon: DollarSign,
      color: '#2dd4bf',
      onClick: () => setView('calcul_salaires'),
      perm: 'calcul_salaires'
    },
    {
      id: 'verification',
      title: 'TRAITEMENT DU POINTAGE',
      description: 'Vérification, validation et traitement des pointages.',
      icon: CheckCircle,
      color: '#818cf8',
      onClick: () => setView('verification'),
      perm: 'verification'
    },
    {
      id: 'grille_salariale',
      title: 'GRILLE SALARIALE',
      description: 'Consulter et modifier la grille de rémunération par fonction/poste.',
      icon: Table,
      color: '#f472b6',
      onClick: () => setView('salaries'),
      perm: 'salaries'
    },
    {
      id: 'permissions_absence',
      title: 'GESTION DES PERMISSIONS',
      description: 'Suivi et historique des agents ayant obtenu une permission exceptionnelle d\'absence.',
      icon: Clock,
      color: '#f59e0b',
      onClick: () => setView('permissions_absence'),
      perm: 'permissions'
    },
    {
      id: 'contrats',
      title: 'GESTION DES CONTRATS',
      description: 'Gérez les contrats de travail, les renouvellements et les périodes d\'essai.',
      icon: Briefcase,
      color: '#f43f5e',
      onClick: () => setView('contracts'),
      perm: 'contracts'
    },
    {
      id: 'registry',
      title: 'REGISTRE GÉNÉRAL',
      description: 'Consulter l\'effectif total de l\'entreprise (actifs, sortis, incertains).',
      icon: Database,
      color: '#60a5fa',
      onClick: () => setView('registry'),
      perm: 'registry'
    },
    {
      id: 'reclamation',
      title: 'RECLAMATION PAIE',
      description: 'Gérer les erreurs de pointage et les réclamations liées aux salaires.',
      icon: MessageSquareWarning,
      color: '#fb7185',
      onClick: () => setView('reclamations'),
      perm: 'reclamation_view'
    },
    {
      id: 'nouvelle_mep',
      title: 'NOUVELLE MEP / rajout / fermeture',
      description: 'Gestion des Mises en Place (MEP) sur site, rajouts et fermetures de postes.',
      icon: PlusCircle,
      color: '#818cf8',
      onClick: () => setShowDevModal(true),
      perm: 'new_mep'
    },
    {
      id: 'recrutement',
      title: 'ESPACE E RECRUTEMENT',
      description: 'Gestion des candidatures, entretiens et embauches de nouveaux agents.',
      icon: Users,
      color: '#2dd4bf',
      onClick: () => setShowDevModal(true),
      perm: 'recrutement'
    },
    {
      id: 'suivi_personnel',
      title: 'SUIVI DU PERSONNEL',
      description: 'Dossiers des agents, sanctions, absences prolongées, mutations.',
      icon: UserCheck,
      color: '#e879f9',
      onClick: () => setShowDevModal(true),
      perm: 'dashboard'
    },
    {
      id: 'suivi_materiel',
      title: 'SUIVI DU MATERIEL',
      description: 'Gestion des dotations (tenues, PTI, radios) et inventaire matériel.',
      icon: Package,
      color: '#a3e635',
      onClick: () => setShowDevModal(true),
      perm: 'materiel'
    },
    {
      id: 'archives',
      title: 'ARCHIVES & RAPPORTS',
      description: 'Consulter l\'historique des rapports passés.',
      icon: Archive,
      color: '#9ca3af',
      onClick: () => setView('archives'),
      perm: 'archives'
    },
    {
      id: 'services',
      title: 'GESTION DES PROFILS',
      description: 'Gérer les accès et habilitations des services.',
      icon: ShieldAlert,
      color: '#ef4444',
      onClick: () => setView('services'),
      perm: 'services'
    },
    {
      id: 'kiosk',
      title: 'MODE KIOSQUE',
      description: 'Interface de pointage direct sur site.',
      icon: Clock,
      color: '#8b5cf6',
      onClick: () => setView('kiosk'),
      perm: 'kiosk'
    },
    {
      id: 'registre_visiteurs',
      title: 'REGISTRE DES VISITEURS',
      description: 'Enregistrer l\'arrivée et le départ des visiteurs extérieurs.',
      icon: Users,
      color: '#fb923c',
      onClick: () => setView('registre_visiteurs'),
      perm: 'registre_visiteurs'
    },
    {
      id: 'annuaire_statut',
      title: 'ANNUAIRE & STATUT',
      description: 'Savoir qui est présent ou absent à l\'instant T.',
      icon: Contact,
      color: '#38bdf8',
      onClick: () => setView('annuaire_statut'),
      perm: 'annuaire_statut'
    },
    {
      id: 'pointage_courriers',
      title: 'POINTAGE COURRIERS / COLIS',
      description: 'Enregistrer les arrivées de colis et notifier les collaborateurs.',
      icon: Package,
      color: '#a78bfa',
      onClick: () => setView('pointage_courriers'),
      perm: 'pointage_courriers'
    },
    {
      id: 'gestion_salles',
      title: 'GESTION DES SALLES',
      description: 'Calendrier des réservations de salles de réunion.',
      icon: CalendarDays,
      color: '#fcd34d',
      onClick: () => setView('gestion_salles'),
      perm: 'gestion_salles'
    },
    {
      id: 'reflexe_securite',
      title: 'RÉFLEXE SÉCURITÉ',
      description: 'Verrouillage rapide de session pour l\'accueil.',
      icon: ShieldAlert,
      color: '#ef4444',
      onClick: () => setView('reflexe_securite'),
      perm: 'reflexe_securite'
    },
    {
      id: 'gestion_appels',
      title: 'MAIN COURANTE & APPELS',
      description: 'Standard virtuel, prise de messages et journal de bord.',
      icon: Phone,
      color: '#10b981',
      onClick: () => setView('gestion_appels'),
      perm: 'gestion_appels'
    },
    {
      id: 'gestion_flotte',
      title: 'GESTION DE FLOTTE',
      description: 'Réservation de véhicules de service et gestion des clés.',
      icon: Car,
      color: '#3b82f6',
      onClick: () => setView('gestion_flotte'),
      perm: 'gestion_flotte'
    },
    {
      id: 'badges_provisoires',
      title: 'BADGES PROVISOIRES',
      description: 'Gestion et suivi des badges temporaires prêtés.',
      icon: CreditCard,
      color: '#f59e0b',
      onClick: () => setView('badges_provisoires'),
      perm: 'badges_provisoires'
    },
    {
      id: 'fournitures_bureau',
      title: 'FOURNITURES DE BUREAU',
      description: 'Commandes et gestion du stock de petit matériel.',
      icon: Paperclip,
      color: '#8b5cf6',
      onClick: () => setView('fournitures_bureau'),
      perm: 'fournitures_bureau'
    },
    {
      id: 'accueil_vip',
      title: 'PROTOCOLE & ACCUEIL VIP',
      description: 'Gestion des visites de haut rang (parking, repas, etc.).',
      icon: Crown,
      color: '#eab308',
      onClick: () => setView('accueil_vip'),
      perm: 'accueil_vip'
    },
    {
      id: 'alertes_securite',
      title: 'ALERTES CONFINEMENT',
      description: 'Déclenchement d\'alertes globales d\'évacuation/confinement.',
      icon: Siren,
      color: '#ef4444',
      onClick: () => setView('alertes_securite'),
      perm: 'alertes_securite'
    },
    {
      id: 'dg_vision',
      title: 'VISION 360° EXÉCUTIVE',
      description: 'Tableau de bord stratégique avec KPIs en temps réel.',
      icon: Eye,
      color: '#eab308',
      onClick: () => setView('dg_vision'),
      perm: 'dg_vision'
    },
    {
      id: 'dg_rapports',
      title: 'RAPPORTS STRATÉGIQUES',
      description: 'Génération de rapports exécutifs et bilans globaux.',
      icon: FileText,
      color: '#3b82f6',
      onClick: () => setView('dg_rapports'),
      perm: 'dg_rapports'
    },
    {
      id: 'dg_validation',
      title: 'VALIDATIONS EXÉCUTIVES',
      description: 'Approbation des dépenses et changements majeurs.',
      icon: Target,
      color: '#22c55e',
      onClick: () => setView('dg_validation'),
      perm: 'dg_validation'
    },
    {
      id: 'dg_audit',
      title: 'AUDIT & TRAÇABILITÉ',
      description: 'Journal complet des actions sensibles de l\'entreprise.',
      icon: ScrollText,
      color: '#64748b',
      onClick: () => setView('dg_audit'),
      perm: 'dg_audit'
    },
    {
      id: 'dg_spy',
      title: 'MODE ESPION',
      description: 'Visualisez le système tel qu\'un employé le voit.',
      icon: Eye,
      color: '#a855f7',
      onClick: () => setShowDevModal(true),
      perm: 'dg_spy'
    },
    {
      id: 'dg_block',
      title: 'BLOCAGE DE SERVICE',
      description: 'Geler temporairement l\'accès d\'un service complet.',
      icon: ShieldOff,
      color: '#ef4444',
      onClick: () => setShowDevModal(true),
      perm: 'dg_block'
    },
    {
      id: 'dg_megaphone',
      title: 'MÉGAPHONE EXÉCUTIF',
      description: 'Diffuser une annonce prioritaire à tous les employés.',
      icon: Megaphone,
      color: '#ec4899',
      onClick: () => setView('dg_megaphone'),
      perm: 'dg_megaphone'
    },
    {
      id: 'dg_predictive',
      title: 'ANALYSE PRÉDICTIVE',
      description: 'Simulations des coûts futurs et de l\'absentéisme.',
      icon: Sparkles,
      color: '#8b5cf6',
      onClick: () => setView('dg_predictive'),
      perm: 'dg_predictive'
    },
    {
      id: 'dg_okr',
      title: 'OBJECTIFS STRATÉGIQUES (OKR)',
      description: 'Suivi de la progression des objectifs des départements.',
      icon: Target,
      color: '#f97316',
      onClick: () => setView('dg_okr'),
      perm: 'dg_okr'
    },
    {
      id: 'dg_litiges',
      title: 'LITIGES & ALERTES LÉGALES',
      description: 'Radar des alertes légales et prud\'homales.',
      icon: Scale,
      color: '#ef4444',
      onClick: () => setView('dg_litiges'),
      perm: 'dg_litiges'
    },
    {
      id: 'dg_organigramme',
      title: 'ORGANIGRAMME LIVE',
      description: 'Vue hiérarchique détaillée avec effectifs et coûts.',
      icon: Network,
      color: '#14b8a6',
      onClick: () => setView('dg_organigramme'),
      perm: 'dg_organigramme'
    },
    {
      id: 'dg_agenda',
      title: 'AGENDA STRATÉGIQUE',
      description: 'Calendrier des échéances stratégiques et réunions de direction.',
      icon: CalendarDays,
      color: '#38bdf8',
      onClick: () => setView('dg_agenda'),
      perm: 'dg_agenda'
    },
    {
      id: 'dg_pv',
      title: 'COMPTE RENDU DE RÉUNIONS',
      description: 'Rédiger, archiver et diffuser vos procès-verbaux de direction.',
      icon: BookOpen,
      color: '#34d399',
      onClick: () => setView('dg_pv'),
      perm: 'dg_pv'
    },
    {
      id: 'dg_veille',
      title: 'VEILLE SECTORIELLE',
      description: 'Indicateurs économiques, légaux et tendances du secteur.',
      icon: Globe,
      color: '#f59e0b',
      onClick: () => setView('dg_veille'),
      perm: 'dg_veille'
    },
    {
      id: 'pdg_souverain',
      title: 'TABLEAU SOUVERAIN (PDG)',
      description: 'Vision absolue de la valeur et de la santé de l\'entreprise.',
      icon: Crown,
      color: '#d4af37',
      onClick: () => setView('pdg_souverain'),
      perm: 'pdg_souverain'
    },
    {
      id: 'pdg_bilan',
      title: 'PERFORMANCE FINANCIÈRE',
      description: 'Bilan consolidé sur 12 mois (budget vs réel).',
      icon: TrendingUp,
      color: '#d4af37',
      onClick: () => setView('pdg_bilan'),
      perm: 'pdg_bilan'
    },
    {
      id: 'pdg_signature',
      title: 'SIGNATURE EXÉCUTIVE',
      description: 'Apposer une signature numérique officielle (documents & PV).',
      icon: PenTool,
      color: '#d4af37',
      onClick: () => setView('pdg_signature'),
      perm: 'pdg_signature'
    },
    {
      id: 'pdg_sites',
      title: 'TABLEAU DES SITES',
      description: 'Contrôle souverain : vision, activation et suspension des sites.',
      icon: Map,
      color: '#d4af37',
      onClick: () => setView('pdg_sites'),
      perm: 'pdg_sites'
    },
    {
      id: 'pdg_acces_maitre',
      title: 'ACCÈS MAÎTRE',
      description: 'Super-contrôle : création d\'admins et gestion du DG.',
      icon: Key,
      color: '#d4af37',
      onClick: () => setView('pdg_acces_maitre'),
      perm: 'pdg_acces_maitre'
    },
    {
      id: 'pdg_benchmark',
      title: 'COMPARATIF CONCURRENTIEL',
      description: 'Benchmarks du marché par rapport aux performances internes.',
      icon: BarChart,
      color: '#d4af37',
      onClick: () => setView('pdg_benchmark'),
      perm: 'pdg_benchmark'
    },
    {
      id: 'pdg_coffre',
      title: 'SALLE DES COFFRES',
      description: 'Stockage ultra-sécurisé des documents fondateurs de l\'entreprise.',
      icon: Lock,
      color: '#d4af37',
      onClick: () => setView('pdg_coffre'),
      perm: 'pdg_coffre'
    },
    {
      id: 'pdg_expansion',
      title: 'SIMULATEUR M&A',
      description: 'Simulation d\'impact d\'une ouverture de filiale ou acquisition.',
      icon: Globe,
      color: '#d4af37',
      onClick: () => setView('pdg_expansion'),
      perm: 'pdg_expansion'
    },
    {
      id: 'pdg_actionnaires',
      title: 'RAPPORT ACTIONNAIRES',
      description: 'Génération automatique de l\'Executive Summary PDF.',
      icon: FileText,
      color: '#d4af37',
      onClick: () => setView('pdg_actionnaires'),
      perm: 'pdg_actionnaires'
    },
    {
      id: 'pdg_menaces',
      title: 'RADAR DES MENACES',
      description: 'Vue macro-économique des risques existentiels pour la société.',
      icon: Zap,
      color: '#ef4444',
      onClick: () => setView('pdg_menaces'),
      perm: 'pdg_menaces'
    },
    {
      id: 'pc_radar',
      title: 'RADAR TACTIQUE',
      description: 'Cartographie temps réel des sites et de leur état.',
      icon: Crosshair,
      color: '#3b82f6',
      onClick: () => setView('pc_radar'),
      perm: 'pc_radar'
    },
    {
      id: 'pc_alertes',
      title: 'URGENCES & SOS',
      description: 'Mur centralisé des alertes rouges et boutons panique.',
      icon: Siren,
      color: '#ef4444',
      onClick: () => setView('pc_alertes'),
      perm: 'pc_alertes'
    },
    {
      id: 'pc_cctv',
      title: 'VIDÉOSURVEILLANCE CCTV',
      description: 'Accès simulé aux flux de caméras de sécurité.',
      icon: Video,
      color: '#3b82f6',
      onClick: () => setView('pc_cctv'),
      perm: 'pc_cctv'
    },
    {
      id: 'pc_dispatch',
      title: 'DISPATCH & PATROUILLES',
      description: 'Gestion des flottes d\'intervention et appels aux forces de l\'ordre.',
      icon: ShieldAlert,
      color: '#f59e0b',
      onClick: () => setView('pc_dispatch'),
      perm: 'pc_dispatch'
    },
    {
      id: 'pc_comms',
      title: 'STATUT RÉSEAU & RADIOS',
      description: 'Surveillance de la connectivité des équipements terrain.',
      icon: Radio,
      color: '#3b82f6',
      onClick: () => setView('pc_comms'),
      perm: 'pc_comms'
    },
    {
      id: 'pc_main_courante',
      title: 'REGISTRE CENTRAL INCIDENTS',
      description: 'Supervision globale des mains courantes de tous les sites.',
      icon: ClipboardList,
      color: '#3b82f6',
      onClick: () => setView('pc_main_courante'),
      perm: 'pc_main_courante'
    },
    {
      id: 'pc_tracking',
      title: 'TRACKING & GÉOLOCALISATION LIVE',
      description: 'Localiser et suivre en direct agents, contrôleurs et équipages.',
      icon: MapPin,
      color: '#38bdf8',
      onClick: () => setView('pc_tracking'),
      perm: 'pc_tracking'
    },
    {
      id: 'ctrl_feuille',
      title: 'MA FEUILLE DE ROUTE',
      description: 'Planning journalier des visites de sites et contrôles terrain.',
      icon: Route,
      color: '#6366f1',
      onClick: () => setView('ctrl_feuille'),
      perm: 'ctrl_feuille'
    },
    {
      id: 'ctrl_audit',
      title: 'CONTRÔLE & AUDIT AGENTS',
      description: 'Valider la présence des agents et noter les anomalies sur site.',
      icon: UserCheck,
      color: '#6366f1',
      onClick: () => setView('ctrl_audit'),
      perm: 'ctrl_audit'
    },
    {
      id: 'ctrl_rapport',
      title: 'RAPPORT D\'INCIDENT EXPRESS',
      description: 'Déclarer rapidement un incident ou une anomalie depuis le terrain.',
      icon: MessageSquareWarning,
      color: '#6366f1',
      onClick: () => setView('ctrl_rapport'),
      perm: 'ctrl_rapport'
    },
    {
      id: 'ctrl_dashboard',
      title: 'TABLEAU DE BORD SECTEUR',
      description: 'Vue d\'ensemble des sites sous tutelle : présences et alertes.',
      icon: BarChart3,
      color: '#6366f1',
      onClick: () => setView('ctrl_dashboard'),
      perm: 'ctrl_dashboard'
    },
    {
      id: 'ctrl_messagerie',
      title: 'MESSAGERIE INTERNE',
      description: 'Communication directe avec le PC, la DG et broadcast agents.',
      icon: MessageSquare,
      color: '#6366f1',
      onClick: () => setView('ctrl_messagerie'),
      perm: 'ctrl_messagerie'
    },
    {
      id: 'ctrl_carnet',
      title: 'CARNET DE BORD',
      description: 'Historique personnel des visites de sites et statistiques de contrôle.',
      icon: BookOpen,
      color: '#6366f1',
      onClick: () => setView('ctrl_carnet'),
      perm: 'ctrl_carnet'
    },
    {
      id: 'ctrl_tracking',
      title: 'TRACKING & GÉOLOC LIVE',
      description: 'Suivre en direct les agents et véhicules d\'intervention.',
      icon: MapPin,
      color: '#6366f1',
      onClick: () => setView('ctrl_tracking'),
      perm: 'ctrl_tracking'
    },
    {
      id: 'ctrl_dispatch',
      title: 'DISPATCH & INTERVENTIONS',
      description: 'Gestion des urgences et assignation des équipages disponibles.',
      icon: ShieldAlert,
      color: '#6366f1',
      onClick: () => setView('ctrl_dispatch'),
      perm: 'ctrl_dispatch'
    },
    {
      id: 'ctrl_flotte',
      title: 'GESTION DE FLOTTE',
      description: 'État des lieux des véhicules de service (kilométrage, dommages).',
      icon: Car,
      color: '#6366f1',
      onClick: () => setView('ctrl_flotte'),
      perm: 'ctrl_flotte'
    },
    {
      id: 'ctrl_rondes',
      title: 'SUPERVISION DES RONDES',
      description: 'Suivi chronologique des tags NFC scannés par les agents et alarmes.',
      icon: Clock,
      color: '#6366f1',
      onClick: () => setView('ctrl_rondes'),
      perm: 'ctrl_rondes'
    },
    {
      id: 'ctrl_notation',
      title: 'ÉVALUATION & DISCIPLINE',
      description: 'Noter rapidement l\'attitude et la tenue d\'un agent lors d\'un contrôle.',
      icon: Star,
      color: '#6366f1',
      onClick: () => setView('ctrl_notation'),
      perm: 'ctrl_notation'
    }
  ];

  // Filtrage des cartes par rapport à la recherche et aux permissions
  const filteredCards = cards.filter(card => {
    // Vérification des permissions
    if (card.perm) {
      if (card.perm === 'admin' && user?.role !== 'super_admin' && user?.role !== 'admin') return false;
      else if (card.perm !== 'admin') {
        // Appliquer globalement la règle : s'affiche sur l'accueil UNIQUEMENT s'il a un droit de modification
        if (!hasWritePermission(card.perm)) return false;
      }
    }
    // Filtrage par texte
    return card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           card.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* En-tête et Barre de recherche */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text)' }}>
          Bienvenue sur Elysium
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '32px' }}>
          Accédez rapidement à tous les modules de votre système de gestion.
        </p>

        <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <div style={{
            position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'white'
          }}>
            <Search size={22} />
          </div>
          <input
            type="text"
            placeholder="Rechercher un module (ex: Pointage, Paie, Recrutement...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="home-search-input"
            style={{
              width: '100%',
              padding: '16px 24px 16px 48px',
              borderRadius: '50px',
              border: '1px solid white',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '1.1rem',
              outline: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'white';
              e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            }}
          />
        </div>
      </div>

      {/* Panneau d'Alertes RH */}
      {(user?.workspace_type === 'RH' || user?.role === 'admin' || user?.role === 'super_admin') && showAlerts && rhAlerts.length > 0 && (
        <div style={{
          marginBottom: '32px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '16px', padding: '20px', position: 'relative', animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(239,68,68,0.15)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <Bell size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'white' }}>Alertes RH</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{rhAlerts.length} alerte{rhAlerts.length > 1 ? 's' : ''} active{rhAlerts.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
            {rhAlerts.slice(0, 6).map((alert, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px',
                background: alert.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`,
              }}>
                <AlertTriangle size={16} style={{ color: alert.severity === 'critical' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span style={{ display: 'block', color: 'white', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.agent}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: alert.severity === 'critical' ? '#fca5a5' : '#fde68a' }}>{alert.message}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', flexShrink: 0 }}>{alert.detail}</span>
              </div>
            ))}
          </div>
          {rhAlerts.length > 6 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
              ... et {rhAlerts.length - 6} autre{rhAlerts.length - 6 > 1 ? 's' : ''} alerte{rhAlerts.length - 6 > 1 ? 's' : ''}.
            </p>
          )}
        </div>
      )}

      {/* Grille de Cartes */}
      {filteredCards.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          padding: '12px 0'
        }}>
          {filteredCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.onClick}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: `slideUp 0.4s ease-out forwards`,
                  animationDelay: `${idx * 0.05}s`,
                  opacity: 0,
                  transform: 'translateY(20px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 15px 30px -10px ${card.color}40`;
                  e.currentTarget.style.border = `1px solid ${card.color}60`;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.border = '1px solid var(--border)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                {/* Décoration en arrière-plan (glow) */}
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`,
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} />

                <div style={{ 
                  background: `${card.color}20`, 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '20px',
                  color: card.color
                }}>
                  <Icon size={24} />
                </div>
                
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text)', lineHeight: '1.4' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.5', flex: 1, margin: 0 }}>
                  {card.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', color: card.color, fontSize: '0.9rem', fontWeight: '600' }}>
                  <span>Ouvrir le module</span>
                  <span>&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Search size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Aucun module trouvé</h3>
          <p>Essayez d'autres mots-clés pour votre recherche.</p>
        </div>
      )}
      
      {/* Modal GPS Pointage */}
      {showGPSModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowGPSModal(false)}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '24px',
            padding: '36px', maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px auto',
              background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <MapPin size={40} color="#10b981" />
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.4rem', margin: '0 0 12px 0' }}>Enregistrement GPS</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
              Votre position actuelle va être relevée pour valider votre pointage.
            </p>
            <button
              onClick={async () => {
                if (!navigator.geolocation) {
                  alert('La géolocalisation n\'est pas supportée par votre navigateur.');
                  return;
                }
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  try {
                    const res = await apiCall('pointage_gps', {
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude
                    });
                    if (res.success) {
                      alert('Pointage réussi !');
                      setShowGPSModal(false);
                    } else {
                      alert('Erreur: ' + res.message);
                    }
                  } catch (e) {
                    alert('Erreur réseau');
                  }
                }, () => {
                  alert('Impossible de récupérer votre position. Veuillez autoriser la localisation.');
                });
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Confirmer ma position
            </button>
          </div>
        </div>
      )}

      {/* Modal Fonctionnalité en cours de dev */}
      {showDevModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowDevModal(false)}
        >
          <div 
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '450px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowDevModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.05)', border: 'none',
                color: 'var(--muted)', width: '32px', height: '32px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
              margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Hammer size={40} style={{ color: 'var(--a)' }} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
              En cours de développement
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Cette fonctionnalité est actuellement en cours de conception. Elle sera bientôt disponible dans une prochaine mise à jour !
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: '1.05rem' }}
              onClick={() => setShowDevModal(false)}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Keyframes pour les animations si elles ne sont pas globales */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .home-search-input::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
        }
      `}</style>
    </div>
  );
}
