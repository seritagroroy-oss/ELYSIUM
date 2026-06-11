import React, { useEffect, useState, useRef } from 'react';
import { Clock, Sparkles, ShieldCheck, CheckCircle, Search, LayoutDashboard, ArrowRight, UserPlus, Settings, Database, TrendingUp, MapPin, ClipboardEdit, Briefcase, Bot } from 'lucide-react';

const AnimatedLogo = () => {
  const canvasRef = useRef(null);
  const [typedText, setTypedText] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const colors = ['#ffffff', '#f97316', '#38bdf8'];

  useEffect(() => {
    const fullText = "Plus qu'un pointage, une solution.";
    let currentText = "";
    let isDeleting = false;
    let timer;

    const loop = () => {
      if (!isDeleting && currentText.length < fullText.length) {
        currentText = fullText.substring(0, currentText.length + 1);
        setTypedText(currentText);
        timer = setTimeout(loop, 120);
      } else if (isDeleting && currentText.length > 0) {
        currentText = fullText.substring(0, currentText.length - 1);
        setTypedText(currentText);
        timer = setTimeout(loop, 60);
      } else if (!isDeleting && currentText.length === fullText.length) {
        isDeleting = true;
        timer = setTimeout(loop, 3000);
      } else if (isDeleting && currentText.length === 0) {
        isDeleting = false;
        setColorIndex(prev => (prev + 1) % colors.length);
        timer = setTimeout(loop, 800);
      }
    };

    timer = setTimeout(loop, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', pointerEvents: 'none' }}>
        <h1 style={{ 
          fontSize: '5rem', 
          fontWeight: '900', 
          margin: '0', 
          background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #f97316 100%)', 
          WebkitBackgroundClip: 'text', 
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '6px'
        }}>
          ELYSIUM
        </h1>
        <p style={{ 
          fontSize: '1.4rem', 
          marginTop: '12px', 
          fontWeight: '600', 
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          color: colors[colorIndex],
          minHeight: '2.5rem'
        }}>
          {typedText}
          <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
        </p>
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

const PreviewCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    "/capture1.png",
    "/capture2.png",
    "/capture3.png"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ flex: '1.5', minWidth: '300px', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: '-2px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(56,189,248,0.4), rgba(249,115,22,0.2), rgba(168,85,247,0.3))', zIndex: 0, filter: 'blur(1px)' }} />
      <div style={{ position: 'relative', zIndex: 1, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', aspectRatio: '1.92', background: '#0b1220' }}>
        {slides.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`Aperçu ${index + 1}`}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain',
              opacity: currentSlide === index ? 1 : 0, transition: 'opacity 1s ease-in-out', display: 'block', borderRadius: '18px'
            }}
          />
        ))}
        {/* Badge "Live" flottant */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          EN DIRECT
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {slides.map((_, index) => (
          <button 
            key={index} 
            onClick={() => setCurrentSlide(index)}
            style={{ 
              width: currentSlide === index ? '24px' : '8px', height: '8px', borderRadius: '4px', border: 'none', 
              background: currentSlide === index ? '#38bdf8' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease', cursor: 'pointer' 
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default function WelcomePage({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const bgCanvasRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const particles = [];
    const particleCount = 100; // Un peu plus de particules car la zone est plus grande
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight; // Prend toute la hauteur de l'écran
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1,
        baseColor: i % 3 === 0 ? '#38bdf8' : (i % 3 === 1 ? '#a855f7' : '#f97316')
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.baseColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) { // Lignes un peu plus longues pour le grand écran
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const op = 1 - dist / 150;
            ctx.strokeStyle = `rgba(56, 189, 248, ${op * 0.5})`;
            ctx.lineWidth = op * 1.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const features = [
    {
      icon: <Clock size={32} color="#38bdf8" />,
      title: "Pointage Temps Réel",
      desc: "Suivi précis des présences, des absences, des retards et génération automatique des heures supplémentaires.",
      glow: "rgba(56,189,248,0.2)"
    },
    {
      icon: <CheckCircle size={32} color="#22c55e" />,
      title: "Paie Automatisée",
      desc: "Calcul automatique des salaires, déduction des absences et export direct vers votre logiciel de paie.",
      glow: "rgba(34,197,94,0.2)"
    },
    {
      icon: <UserPlus size={32} color="#f59e0b" />,
      title: "Gestion des Viviers",
      desc: "Affectation rapide des Extras et Relèves avec un système intelligent qui met à jour les plannings et les sites.",
      glow: "rgba(245,158,11,0.2)"
    },
    {
      icon: <Database size={32} color="#a855f7" />,
      title: "Historique & Archives",
      desc: "Toutes vos données sont sécurisées et archivées. Retrouvez n'importe quelle période de paie en 1 clic.",
      glow: "rgba(168,85,247,0.2)"
    },
    {
      icon: <TrendingUp size={32} color="#f43f5e" />,
      title: "Fluctuation Salariale",
      desc: "Analysez et anticipez les variations de salaires, identifiez les surcoûts et gérez vos budgets avec précision.",
      glow: "rgba(244,63,94,0.2)"
    },
    {
      icon: <MapPin size={32} color="#14b8a6" />,
      title: "Pointage GPS",
      desc: "Garantissez la présence physique de vos agents sur site grâce à la validation de position par géolocalisation.",
      glow: "rgba(20,184,166,0.2)"
    },
    {
      icon: <ClipboardEdit size={32} color="#8b5cf6" />,
      title: "NMEP et RAJOUT",
      desc: "Gérez les Nouvelles Mises En Place (NMEP) sur de nouveaux sites ainsi que les RAJOUTS d'effectif demandés par vos clients sur de nouveaux postes.",
      glow: "rgba(139,92,246,0.2)"
    },
    {
      icon: <Briefcase size={32} color="#eab308" />,
      title: "Espace de Recrutement",
      desc: "Créez votre vivier de talents, suivez les candidatures et intégrez directement les nouveaux agents au système.",
      glow: "rgba(234,179,8,0.2)"
    },
    {
      icon: <Bot size={32} color="#3b82f6" />,
      title: "Jarvisse Assistant",
      desc: "Votre assistant IA dédié, toujours prêt à répondre à vos requêtes et vous guider sur toute la plateforme.",
      glow: "rgba(59,130,246,0.2)"
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'white', overflowX: 'hidden', margin: '-24px' }}>
      
      {/* HEADER / NAVIGATION */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, padding: '20px 40px', zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrolled ? 'rgba(11, 18, 32, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/elysium_logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          <span style={{ 
            fontWeight: 800, fontSize: '1.4rem', letterSpacing: '1px',
            background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #f97316 100%)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>ELYSIUM</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setView('login')}
            style={{ padding: '10px 20px', borderRadius: '10px', background: '#f97316', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(249,115,22,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Se connecter
          </button>
          <button 
            onClick={() => setView('register')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', background: '#38bdf8', color: '#0b1220', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(56,189,248,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            S'inscrire (15j offert)
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '60px 20px 20px', textAlign: 'center', overflow: 'hidden'
      }}>
        {/* Canvas de particules en plein écran sur la Hero Section */}
        <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', marginTop: '80px' }}>
          <AnimatedLogo />
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px', background: 'linear-gradient(to right, #ffffff, #38bdf8, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            La solution ultime pour la Gestion du Personnel
          </h1>
          
          <p style={{ fontSize: '1.15rem', color: 'var(--muted)', maxWidth: '700px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Elysium révolutionne votre façon de gérer les plannings, de suivre les présences et de calculer les salaires de vos agents de sécurité et de vos équipes.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={() => setView('login')}
              style={{ padding: '16px 32px', borderRadius: '12px', background: '#38bdf8', color: '#0b1220', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 25px rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Démarrer maintenant <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '16px 32px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Découvrir la plateforme
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{ padding: '100px 20px', background: 'rgba(0,0,0,0.2)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>Conçu pour l'Excellence Opérationnelle</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              De la planification au paiement, chaque étape est automatisée et sécurisée.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {features.map((feat, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.03)', padding: '32px', borderRadius: '20px', 
                border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s ease', cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = feat.icon.props.color;
                e.currentTarget.style.boxShadow = `0 20px 40px ${feat.glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '16px', background: feat.glow, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' 
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APERÇU / PREVIEW SECTION */}
      <section style={{ padding: '100px 40px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        {/* Halo de fond */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px' }}>
          {/* Texte à gauche */}
          <div style={{ flex: '1', minWidth: '280px' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px', letterSpacing: '1px' }}>
              APERÇU DE LA PLATEFORME
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>
              Une interface pensée pour la{' '}
              <span style={{ background: 'linear-gradient(135deg, #38bdf8, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                productivité
              </span>
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '32px' }}>
              Toutes vos données de pointage, de paie et de gestion d'équipe centralisées dans un tableau de bord clair, rapide et accessible en un clic.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { color: '#38bdf8', text: 'Suivi des présences en temps réel par site et par zone' },
                { color: '#22c55e', text: 'Validation et export des états de paie en quelques secondes' },
                { color: '#f97316', text: 'Gestion multi-sites avec vues filtrées et historiques complets' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, marginTop: '7px', flexShrink: 0, boxShadow: `0 0 8px ${item.color}` }} />
                  <span style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setView('login')}
              style={{ marginTop: '36px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #38bdf8, #f97316)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 25px rgba(56,189,248,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Accéder à la plateforme <ArrowRight size={18} />
            </button>
          </div>

          {/* Carrousel d'images à droite */}
          <PreviewCarousel setView={setView} />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#070b14', padding: '40px 40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '30px', marginBottom: '30px' }}>
          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img src="/elysium_logo.png" alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              <span style={{ 
                fontWeight: 800, fontSize: '1rem', letterSpacing: '1px',
                background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #f97316 100%)', 
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>ELYSIUM</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              L'outil complet pour la gestion de votre personnel, de vos plannings et de vos salaires. Propulsé par une technologie sécurisée de dernière génération.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', color: 'white', fontSize: '0.9rem' }}>Légal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <li><span style={{ color: 'var(--muted)', cursor: 'pointer' }}>Confidentialité</span></li>
              <li><span style={{ color: 'var(--muted)', cursor: 'pointer' }}>Conditions d'utilisation</span></li>
              <li><span style={{ color: 'var(--muted)', cursor: 'pointer' }}>Mentions légales</span></li>
            </ul>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.75rem' }}>
          <span>&copy; {new Date().getFullYear()} ELYSIUM Technologies. Tous droits réservés.</span>
          <span>Version 2.0</span>
        </div>
      </footer>
    </div>
  );
}
