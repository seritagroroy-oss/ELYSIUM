import React, { useState } from 'react';
import { 
  Search, CalendarDays, Printer, FileText, TrendingUp, 
  Table, MessageSquareWarning, PlusCircle, Users, 
  UserCheck, Package, Hammer, X
} from 'lucide-react';

export default function Home({ setView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDevModal, setShowDevModal] = useState(false);

  // Définition des 10 cartes demandées
  const cards = [
    {
      id: 'pointage',
      title: 'Pointage du mois',
      description: 'Gérer les plannings et les pointages des agents sur les différents sites.',
      icon: CalendarDays,
      color: '#38bdf8',
      onClick: () => setView('dashboard')
    },
    {
      id: 'imprimer_pointage',
      title: "IMPRIMER LE POINTAGE de l'agent",
      description: 'Générer une version imprimable du pointage pour un agent spécifique.',
      icon: Printer,
      color: '#a78bfa',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'imprimer_paie',
      title: 'Imprimer la fiche de paie',
      description: 'Générer et imprimer les fiches de paie mensuelles.',
      icon: FileText,
      color: '#34d399',
      onClick: () => setView('payslip_print')
    },
    {
      id: 'fluctuation',
      title: 'FLUTUATION SALARIALE',
      description: 'Suivi et analyse des variations salariales et des primes/retenues.',
      icon: TrendingUp,
      color: '#fbbf24',
      onClick: () => setView('fluctuation')
    },
    {
      id: 'grille_salariale',
      title: 'GRILLE SALARIALE',
      description: 'Consulter et modifier la grille de rémunération par fonction/poste.',
      icon: Table,
      color: '#f472b6',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'reclamation',
      title: 'RECLAMMATION',
      description: 'Gérer les plaintes, requêtes et réclamations du personnel ou des clients.',
      icon: MessageSquareWarning,
      color: '#fb7185',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'nouvelle_mep',
      title: 'NOUVELLE MEP / rajout / fermeture',
      description: 'Gestion des Mises en Place (MEP) sur site, rajouts et fermetures de postes.',
      icon: PlusCircle,
      color: '#818cf8',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'recrutement',
      title: 'ESPACE E RECRUTEMENT',
      description: 'Gestion des candidatures, entretiens et embauches de nouveaux agents.',
      icon: Users,
      color: '#2dd4bf',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'suivi_personnel',
      title: 'SUIVI DU PERSONNEL',
      description: 'Dossiers des agents, sanctions, absences prolongées, mutations.',
      icon: UserCheck,
      color: '#e879f9',
      onClick: () => setShowDevModal(true)
    },
    {
      id: 'suivi_materiel',
      title: 'SUIVI DU MATERIEL',
      description: 'Gestion des dotations (tenues, PTI, radios) et inventaire matériel.',
      icon: Package,
      color: '#a3e635',
      onClick: () => setShowDevModal(true)
    }
  ];

  // Filtrage des cartes par rapport à la recherche
  const filteredCards = cards.filter(card => 
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* En-tête et Barre de recherche */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text)' }}>
          Bienvenue sur l'Accueil
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
              border: '1px solid var(--border)',
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
              e.target.style.borderColor = 'var(--a)';
              e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            }}
          />
        </div>
      </div>

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
