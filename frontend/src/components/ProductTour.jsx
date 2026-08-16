import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { apiCall } from '../api';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '🎉 Bienvenue sur ELYSIUM !',
    content: "Nous sommes ravis de vous compter parmi nous. Laissez-nous vous guider rapidement à travers les éléments clés de votre espace.",
    target: null, // Au centre de l'écran
    position: 'center'
  },
  {
    id: 'menu',
    title: '☰ Menu de Navigation',
    content: "Cliquez ici pour ouvrir le panneau latéral et accéder à tous les modules d'ELYSIUM.",
    target: '[data-tour="menu"]',
    position: 'bottom'
  },
  {
    id: 'home_search',
    title: '🔍 Recherche de modules',
    content: "Utilisez cette grande barre pour filtrer instantanément les modules affichés sur votre écran d'accueil.",
    target: '[data-tour="home_search"]',
    position: 'bottom'
  },
  {
    id: 'quick_search',
    title: '⚡ Recherche Rapide (Ctrl+K)',
    content: "Où que vous soyez dans l'application, utilisez ce bouton ou le raccourci clavier pour rechercher rapidement des employés, des sites ou des documents.",
    target: '[data-tour="quick_search"]',
    position: 'bottom'
  },
  {
    id: 'jarvisse',
    title: '🤖 Assistant Jarvisse',
    content: "Besoin d'aide ou d'une analyse de données complexe ? Jarvisse, notre IA intégrée, est là pour vous assister.",
    target: '[data-tour="jarvisse"]',
    position: 'bottom'
  },
  {
    id: 'messages',
    title: '💬 Historique et Messages',
    content: "Consultez ici l'historique de vos notifications et accédez aux communications internes et tickets.",
    target: '[data-tour="messages"]',
    position: 'bottom'
  },

  {
    id: 'settings',
    title: '⚙️ Paramètres',
    content: "Personnalisez votre profil, changez votre mot de passe, ou modifiez vos préférences d'affichage.",
    target: '[data-tour="settings"]',
    position: 'bottom'
  }
];

export default function ProductTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Retarder légèrement pour laisser le temps au DOM de se dessiner
    const timer = setTimeout(() => {
      if (step.target) {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
          // Scroll if not visible
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          // Si l'élément cible n'existe pas (ex: pas la permission), passer à l'étape suivante
          if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(c => c + 1);
          } else {
            handleComplete();
          }
        }
      } else {
        setTargetRect(null);
      }
    }, 300); // 300ms pour laisser le temps au menu/sidebar de s'ouvrir
    return () => clearTimeout(timer);
  }, [currentStep, step, windowSize]);

  const handleComplete = async () => {
    // Verrou immédiat en localStorage pour empêcher tout rechargement de relancer le tour
    try { localStorage.setItem('tour_completed', '1'); } catch(e) {}
    onComplete(); // Cacher l'UI immédiatement
    try {
      await apiCall('complete_tour', {}, 'POST');
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  // Calcul du style de la bulle
  let popoverStyle = {
    position: 'fixed',
    zIndex: 100001,
    width: '320px',
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    padding: '24px',
    color: '#fff',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: 1,
    transform: 'scale(1)'
  };

  if (!targetRect || step.position === 'center') {
    popoverStyle.top = '50%';
    popoverStyle.left = '50%';
    popoverStyle.transform = 'translate(-50%, -50%) scale(1)';
  } else if (step.position === 'bottom') {
    popoverStyle.top = (targetRect.top + targetRect.height + 20) + 'px';
    // Center horizontally relative to target, but keep within screen bounds
    let leftPos = targetRect.left + (targetRect.width / 2) - 160; // 160 is half of 320px width
    if (leftPos + 320 > window.innerWidth - 20) {
      leftPos = window.innerWidth - 340; // 320px + 20px padding
    }
    popoverStyle.left = Math.max(20, leftPos) + 'px';
  } else {
    // Default to 'right' position for sidebar items
    popoverStyle.top = Math.max(20, Math.min(window.innerHeight - 300, targetRect.top + targetRect.height / 2 - 100)) + 'px';
    let leftPos = targetRect.left + targetRect.width + 20;
    // Check if it goes off screen on the right
    if (leftPos + 320 > window.innerWidth - 20) {
      // Switch to left position if not enough space on right
      leftPos = targetRect.left - 340;
    }
    popoverStyle.left = Math.max(20, leftPos) + 'px';
  }

  return (
    <>
      <style>{`
        .tour-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 100000;
          mix-blend-mode: hard-light;
          pointer-events: none;
          transition: all 0.4s ease;
        }
        .tour-highlight {
          position: fixed;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.5) inset;
          border: 2px solid #38bdf8;
          border-radius: 8px;
          z-index: 99999;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Overlay global */}
      {targetRect ? (
        <div 
          className="tour-highlight"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
        />
      ) : (
        <div className="tour-overlay" />
      )}

      {/* Bulle d'info */}
      <div style={popoverStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{step.title}</h3>
          <button onClick={handleComplete} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', lineHeight: 1.6, color: '#cbd5e1' }}>
          {step.content}
        </p>
        
        {/* Progress Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {TOUR_STEPS.map((s, idx) => (
            <div key={s.id} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: idx === currentStep ? '#38bdf8' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={handleComplete}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}
          >
            Ignorer le guide
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                  padding: '8px', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            
            <button 
              onClick={handleNext}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#38bdf8', color: '#0f172a', border: 'none',
                padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>Terminer <Check size={18} /></>
              ) : (
                <>Suivant <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
