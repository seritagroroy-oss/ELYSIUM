import { 
  CalendarDays, Printer, FileText, TrendingUp, Table, MessageSquareWarning, 
  PlusCircle, Users, UserCheck, Package, Hammer, X, MapPin, Loader2, 
  CheckCircle, AlertTriangle, Contact, Banknote, Plane, BarChart3, Shield, 
  Briefcase, Clock, Database, Bell, DollarSign, MessageSquare, Archive, 
  ShieldAlert, Phone, Car, CreditCard, Paperclip, Crown, Siren, Eye, 
  ScrollText, Target, ShieldOff, Megaphone, Sparkles, Scale, Network, 
  BookOpen, Globe, PenTool, Map, Key, BarChart, Lock, Zap, Video, Radio, 
  ClipboardList, Crosshair, Route, Star, Building2, Calculator, Home as HomeIcon, ReceiptText, Fingerprint, Calendar
} from 'lucide-react';

export const MASTER_MODULES = [
  { id: 'payroll', title: 'État de Paie', description: 'Génération, consultation et gestion des fiches de paie.', icon: Banknote, color: '#10b981', viewId: 'payroll', perm: 'payroll' },
  { id: 'leave', title: 'GESTION DES CONGÉS', description: 'Suivi et validation des demandes de congés et absences.', icon: Plane, color: '#0ea5e9', viewId: 'leave_admin', perm: 'leave' },
  { id: 'leave_calculator', title: 'CALCULATEUR DE CONGÉS', description: 'Calcul automatique de la durée des permissions et congés.', icon: Calculator, color: '#a855f7', viewId: 'leave_calculator', perm: 'leave_calculator' },
  { id: 'dashboard', title: 'Pointage du mois', description: 'Gérer les plannings et les pointages des agents sur les différents sites.', icon: CalendarDays, color: '#38bdf8', viewId: 'dashboard', perm: 'dashboard' },
  { id: 'fluctuation', title: 'FLUTUATION SALARIALE', description: 'Suivi et analyse des variations salariales et des primes/retenues.', icon: TrendingUp, color: '#fbbf24', viewId: 'fluctuation', perm: 'fluctuation' },
  { id: 'company_config', title: 'CONFIGURATION ENTREPRISE', description: 'Gérer les postes, fonctions et salaires de base des agents.', icon: Building2, color: '#8b5cf6', viewId: 'company_config', perm: 'company_config' },
  { id: 'calcul_salaires', title: 'CALCUL DES SALAIRES', description: 'Génération et validation du calcul global des salaires.', icon: DollarSign, color: '#2dd4bf', viewId: 'calcul_salaires', perm: 'calcul_salaires' },
  { id: 'verification', title: 'TRAITEMENT DU POINTAGE', description: 'Vérification, validation et traitement des pointages.', icon: CheckCircle, color: '#818cf8', viewId: 'verification', perm: 'verification' },
  { id: 'facturation', title: 'FACTURATION CLIENTS', description: 'Gérer les contrats et la facturation des sites clients.', icon: Briefcase, color: '#10b981', viewId: 'facturation', perm: 'facturation' },
  { id: 'grille_salariale', title: 'GRILLE SALARIALE', description: 'Consulter et modifier la grille de rémunération par fonction/poste.', icon: Table, color: '#f472b6', viewId: 'grille_salariale', perm: 'salaries' },
  { id: 'permissions_absence', title: 'GESTION DES PERMISSIONS', description: 'Suivi et historique des agents ayant obtenu une permission exceptionnelle.', icon: Clock, color: '#f59e0b', viewId: 'permissions_absence', perm: 'permissions' },
  { id: 'contracts', title: 'GESTION DES CONTRATS', description: 'Gérez les contrats de travail, les renouvellements et les périodes d\'essai.', icon: Briefcase, color: '#f43f5e', viewId: 'contracts', perm: 'contracts' },
  { id: 'registry', title: 'REGISTRE GÉNÉRAL', description: 'Consulter l\'effectif total de l\'entreprise (actifs, sortis, incertains).', icon: Database, color: '#60a5fa', viewId: 'registry', perm: 'registry' },
  { id: 'reclamation', title: 'RECLAMATION PAIE', description: 'Gérer les erreurs de pointage et les réclamations liées aux salaires.', icon: MessageSquareWarning, color: '#ef4444', viewId: 'reclamations', perm: 'reclamation_view' },
  { id: 'suivi_personnel', title: 'SUIVI DU PERSONNEL', description: 'Dossiers des agents, sanctions, absences prolongées, mutations.', icon: UserCheck, color: '#e879f9', viewId: 'suivi_personnel', perm: 'suivi_personnel' },
  { id: 'archives', title: 'ARCHIVES & RAPPORTS', description: 'Consulter l\'historique des rapports passés.', icon: Archive, color: '#9ca3af', viewId: 'archives', perm: 'archives' },
  { id: 'services', title: 'GESTION DES PROFILS', description: 'Gérer les accès et habilitations des services.', icon: ShieldAlert, color: '#ef4444', viewId: 'services', perm: 'services' },
  { id: 'registre_visiteurs', title: 'REGISTRE DES VISITEURS', description: 'Enregistrer l\'arrivée et le départ des visiteurs extérieurs.', icon: Users, color: '#fb923c', viewId: 'registre_visiteurs', perm: 'registre_visiteurs' },
  { id: 'pointage_courriers', title: 'POINTAGE COURRIERS / COLIS', description: 'Enregistrer les arrivées de colis et notifier les collaborateurs.', icon: Package, color: '#a78bfa', viewId: 'pointage_courriers', perm: 'pointage_courriers' },
  { id: 'dg_audit', title: 'AUDIT & TRAÇABILITÉ', description: 'Journal complet des actions sensibles de l\'entreprise.', icon: ScrollText, color: '#64748b', viewId: 'dg_audit', perm: 'dg_audit' },
  { id: 'pc_main_courante', title: 'REGISTRE CENTRAL INCIDENTS', description: 'Supervision globale des mains courantes de tous les sites.', icon: ClipboardList, color: '#3b82f6', viewId: 'pc_main_courante', perm: 'pc_main_courante' },
  { id: 'kiosk', title: 'Mode Kiosque', description: 'Pointeuse autonome en plein écran.', icon: Clock, color: '#10b981', viewId: 'kiosk', perm: 'kiosk' },
  { id: 'employees', title: 'Gestion des Employés', description: 'Gestion de la base de données des employés.', icon: Contact, color: '#6366f1', viewId: 'employees', perm: 'employees' },
  { id: 'recrutement', title: 'Espace e-Recrutement', description: 'Portail des recrutements et des CVs.', icon: Users, color: '#f43f5e', viewId: 'recrutement', perm: 'recrutement' },
  { id: 'print_payroll', title: 'Imprimer Fiche de Paie', description: 'Impression en masse des bulletins.', icon: FileText, color: '#0ea5e9', viewId: 'print_payroll', perm: 'print_payroll' },
  { id: 'gps', title: 'Pointage GPS', description: 'Suivi et cartographie des agents sur site.', icon: MapPin, color: '#8b5cf6', viewId: 'gps', perm: 'gps' },
  { id: 'annuaire_statut', title: 'Annuaire & Statut', description: 'Statuts en direct des collaborateurs.', icon: Contact, color: '#10b981', viewId: 'annuaire_statut', perm: 'annuaire_statut' },
  { id: 'gestion_salles', title: 'Gestion des Salles', description: 'Réservation et planning des salles de réunion.', icon: Calendar, color: '#fbbf24', viewId: 'gestion_salles', perm: 'gestion_salles' },
  { id: 'reflexe_securite', title: 'Réflexe Sécurité', description: 'Procédures et alertes sécurité.', icon: ShieldAlert, color: '#ef4444', viewId: 'reflexe_securite', perm: 'reflexe_securite' }
];

export const DEFAULT_SIDEBAR_IDS = [
  'dashboard', 'company_config', 'verification', 'payroll', 'facturation', 
  'kiosk', 'grille_salariale', 'calcul_salaires', 'fluctuation', 'archives', 
  'services', 'employees', 'leave', 'permissions_absence', 'contracts', 'registry', 
  'recrutement', 'print_payroll', 'gps', 'reclamation', 'registre_visiteurs', 
  'annuaire_statut', 'pointage_courriers', 'gestion_salles', 'reflexe_securite'
];

export const DEFAULT_HOME_IDS = [
  'payroll', 'leave', 'leave_calculator', 'dashboard', 'fluctuation', 
  'company_config', 'calcul_salaires', 'verification', 'facturation', 
  'grille_salariale', 'permissions_absence', 'contracts', 'registry', 
  'reclamation', 'suivi_personnel', 'archives', 'services', 
  'registre_visiteurs', 'pointage_courriers', 'dg_audit', 'pc_main_courante'
];
