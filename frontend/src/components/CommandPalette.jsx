import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Users, Settings, UserPlus, FileText, PieChart, DollarSign, TrendingUp, Archive, MessageSquare, Clock, Calendar, MapPin, Printer, Table, AlertCircle, Building2, Box, BarChart3 } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'home', label: 'Accueil ELYSIUM', desc: "Retour à la page d'accueil principale", icon: <Compass size={18} />, perm: null },
  { id: 'analytics', label: 'TABLEAU DE BORD ANALYTIQUE', desc: 'Visualisez les statistiques, les tendances et les performances en temps réel.', icon: <BarChart3 size={18} />, perm: 'analytics' },
  { id: 'employees', label: 'GESTION DES EMPLOYÉS', desc: 'Gérer la base de données de tous vos employés, leurs contrats et informations.', icon: <Users size={18} />, perm: 'dashboard' },
  { id: 'payroll', label: 'FICHES DE PAIE', desc: 'Génération, consultation et gestion des fiches de paie.', icon: <FileText size={18} />, perm: 'payroll' },
  { id: 'conges', label: 'GESTION DES CONGÉS', desc: 'Suivi et validation des demandes de congés et absences.', icon: <Calendar size={18} />, perm: 'conges' },
  { id: 'pointage_gps', label: 'POINTAGE GPS', desc: 'Signalez votre présence avec votre position géographique.', icon: <MapPin size={18} />, perm: 'gps' },
  { id: 'dashboard', label: 'Pointage du mois', desc: 'Gérer les plannings et les pointages des agents sur les différents sites.', icon: <PieChart size={18} />, perm: 'dashboard' },
  { id: 'print_pointage', label: "IMPRIMER LE POINTAGE de l'agent", desc: 'Générer une version imprimable du pointage pour un agent spécifique.', icon: <Printer size={18} />, perm: 'dashboard' },
  { id: 'print_payroll', label: 'Imprimer la fiche de paie', desc: 'Générer et imprimer les fiches de paie mensuelles.', icon: <Printer size={18} />, perm: 'payroll' },
  { id: 'fluctuation', label: 'FLUTUATION SALARIALE', desc: 'Suivi et analyse des variations salariales et des primes/retenues.', icon: <TrendingUp size={18} />, perm: 'fluctuation' },
  { id: 'grille_salariale', label: 'GRILLE SALARIALE', desc: 'Consulter et modifier la grille de rémunération par fonction/poste.', icon: <Table size={18} />, perm: 'salaries' },
  { id: 'reclamation', label: 'RECLAMMATION', desc: 'Gérer les plaintes, requêtes et réclamations du personnel ou des clients.', icon: <AlertCircle size={18} />, perm: 'reclamation' },
  { id: 'mep', label: 'NOUVELLE MEP / rajout / fermeture', desc: 'Gestion des Mises en Place (MEP) sur site, rajouts et fermetures de postes.', icon: <Building2 size={18} />, perm: 'dashboard' },
  { id: 'recrutement', label: 'ESPACE E RECRUTEMENT', desc: 'Gestion des candidatures, entretiens et embauches de nouveaux agents.', icon: <UserPlus size={18} />, perm: 'recrutement' },
  { id: 'suivi_personnel', label: 'SUIVI DU PERSONNEL', desc: 'Dossiers des agents, sanctions, absences prolongées, mutations.', icon: <Users size={18} />, perm: 'dashboard' },
  { id: 'suivi_materiel', label: 'SUIVI DU MATERIEL', desc: 'Gestion des dotations (tenues, PTI, radios) et inventaire matériel.', icon: <Box size={18} />, perm: 'materiel' },
  { id: 'verification', label: 'Traitement du pointage', desc: 'Vérification et validation des pointages.', icon: <Search size={18} />, perm: 'verification' },
  { id: 'salaries', label: 'Calcul Salaires', desc: 'Calcul automatique des salaires mensuels.', icon: <DollarSign size={18} />, perm: 'salaries' },
  { id: 'archives', label: 'Archives Rapports', desc: 'Consulter l\'historique des rapports passés.', icon: <Archive size={18} />, perm: 'archives' },
  { id: 'communication', label: 'Communication & Tickets', desc: 'Messagerie interne et gestion des tickets.', icon: <MessageSquare size={18} />, perm: 'communication' },
  { id: 'services', label: 'Gestion des Profils', desc: 'Gérer les accès et habilitations des services.', icon: <UserPlus size={18} />, perm: 'services' },
  { id: 'settings', label: 'Paramètres du système', desc: 'Configuration globale de la plateforme ELYSIUM.', icon: <Settings size={18} />, perm: 'admin' }, 
  { id: 'kiosk', label: 'Mode Kiosque (Pointage direct)', desc: 'Interface de pointage sur site pour les agents.', icon: <Clock size={18} />, perm: 'kiosk' },
];

export default function CommandPalette({ isOpen, onClose, onSelectView, hasPermission, user }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = MENU_ITEMS.filter(item => {
    // Vérification des permissions
    if (item.perm) {
      if (item.perm === 'admin' && user?.role !== 'super_admin' && user?.role !== 'admin') return false;
      else if (item.perm !== 'admin' && !hasPermission(item.perm)) return false;
    }
    // Filtrage par texte
    return item.label.toLowerCase().includes(query.toLowerCase()) || 
           item.id.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '15vh', zIndex: 100000
    }} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: '600px', background: 'rgba(15,23,42,0.9)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56,189,248,0.2)',
          overflow: 'hidden', animation: 'slideDown 0.2s ease-out'
        }}
      >
        <style>{`
          @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .cmd-item { padding: 15px 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; color: #cbd5e1; transition: 0.2s; border-left: 3px solid transparent; }
          .cmd-item:hover { background: rgba(56,189,248,0.1); color: white; border-left: 3px solid #38bdf8; }
        `}</style>
        
        <div style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={22} color="#38bdf8" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Où voulez-vous aller ? (ex: Paie, Profils...)" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ 
              background: 'transparent', border: 'none', color: 'white', 
              fontSize: '1.2rem', width: '100%', outline: 'none', marginLeft: '15px' 
            }}
          />
          <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--muted)' }}>ESC</span>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px 0' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>Aucun module trouvé.</div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="cmd-item"
                onClick={() => { onSelectView(item.id); onClose(); }}
              >
                <div style={{ color: '#38bdf8', flexShrink: 0, alignSelf: 'flex-start', marginTop: '4px' }}>{item.icon}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: '500' }}>{item.label}</span>
                  {item.desc && <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>{item.desc}</span>}
                </div>
                <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
                  <span style={{ fontSize: '0.75rem' }}>Ouvrir le module →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
