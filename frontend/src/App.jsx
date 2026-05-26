import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Subscription from './components/Subscription';
import Dashboard from './components/Dashboard';
import Salaries from './components/Salaries';
import Archives from './components/Archives';
import SettingsView from './components/SettingsView';
import Kiosk from './components/Kiosk';
import Home from './components/Home';
import PayrollView from './components/PayrollView';
import FluctuationView from './components/FluctuationView';
import PayslipPrintView from './components/PayslipPrintView';
import ServiceManagement from './components/ServiceManagement';
import Communication from './components/Communication';
import { ShieldAlert, Calendar, DollarSign, Archive, Settings, LogOut, Clock, Loader2, Sparkles, Menu, X, CheckCircle, Home as HomeIcon, ReceiptText, TrendingUp, MessageSquare } from 'lucide-react';
import './App.css';

// ─── Initialisation du thème au chargement ───────────────────────────────
const _savedTheme = localStorage.getItem('pontage_theme') || 'modern';
if (_savedTheme !== 'modern') {
  document.body.setAttribute('data-theme', _savedTheme);
} else {
  document.body.removeAttribute('data-theme');
}

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const particles = [];
    const particleCount = 70;
    
    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth || 800;
      canvas.height = 300;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
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

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const op = 1 - dist / 120;
            ctx.strokeStyle = `rgba(56, 189, 248, ${op * 0.6})`;
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', pointerEvents: 'none' }}>
        <h1 style={{ 
          fontSize: '6rem', 
          fontWeight: '900', 
          margin: '0', 
          background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #a855f7 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 50px rgba(56, 189, 248, 0.4)',
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

function MainAppContent() {
  const { user, subscription, loading, logout } = useAuth();
  const [view, setView] = useState('welcome'); // 'welcome' | 'login' | 'register' | 'subscription' | 'dashboard' | 'salaries' | 'archives' | 'settings' | 'kiosk'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hasPermission = (moduleName) => {
    if (user?.role === 'super_admin') return true;
    if (!user?.permissions) return false;
    
    // Si c'est un tableau (ex: ['dashboard', 'services'])
    if (Array.isArray(user.permissions)) return user.permissions.includes(moduleName);
    
    // Si c'est un objet (ex: {"0": "dashboard", "can_view": true}), on cherche dans les valeurs et les clés
    return Object.values(user.permissions).includes(moduleName) || !!user.permissions[moduleName];
  };

  useEffect(() => {
    if (!user) {
      setView('welcome');
      setIsSidebarOpen(false);
    } else {
      setView(prev => (prev === 'login' || prev === 'register' || prev === 'welcome') ? 'home' : prev);
      setIsSidebarOpen(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b1220' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--b)', marginBottom: '16px' }} />
        <span style={{ color: 'var(--muted)', fontWeight: '500' }}>Chargement de l'application...</span>
      </div>
    );
  }

  // Si non connecté
  if (!user) {
    if (view === 'login') return <Login setView={setView} />;
    if (view === 'register') return <Register setView={setView} />;
    
    // Page d'accueil / Welcome (similaire à l'ancien index.php)
    return (
      <div className="container" style={{ padding: '20px 20px 80px 20px', textAlign: 'center', position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <style>{`
          @keyframes pulseLogoGlow {
            0% { transform: scale(1); box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
            100% { transform: scale(1.08); box-shadow: 0 0 25px rgba(56, 189, 248, 0.9), 0 0 15px rgba(255, 255, 255, 0.6); }
          }
        `}</style>

        {/* Logo en haut à gauche */}
        <div style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/elysium_logo.png" 
            alt="ELYSIUM Logo" 
            style={{ 
              height: '100px', 
              width: '100px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              animation: 'pulseLogoGlow 2s ease-in-out infinite alternate',
              border: '3px solid rgba(56, 189, 248, 0.6)'
            }} 
          />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '1px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            ELYSIUM
          </span>
        </div>

        {/* Boutons en haut à droite */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', zIndex: 10 }}>
          <button 
            onClick={() => setView('login')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <Clock size={16} />
            Se connecter
          </button>
          <button 
            onClick={() => setView('register')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', background: '#38bdf8', color: '#0b1220', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Sparkles size={16} />
            S'inscrire (15j gratuit)
          </button>
        </div>

        <div style={{ marginBottom: '20px', width: '100%', maxWidth: '1200px' }}>
          <AnimatedLogo />
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', marginTop: '20px' }}>
            Gestion du Personnel Intelligente
          </h1>
          <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
            Optimisez le suivi de présence, automatisez le calcul des salaires et gérez vos viviers (Extras, Relèves) en toute simplicité.
          </p>
        </div>

        <div style={{ marginTop: 'auto', color: 'var(--muted)', fontSize: '0.85rem' }}>
          ELYSIUM &copy; {new Date().getFullYear()} - Plus qu'un pointage, une solution.
        </div>
      </div>
    );
  }

  // Si connecté mais abonnement expiré
  const isAccessAllowed = subscription?.access_allowed;
  if (!isAccessAllowed) {
    return <Subscription setView={setView} />;
  }



  // Si on est en mode Kiosque complet (sans sidebar)
  if (view === 'kiosk') {
    return <Kiosk setView={setView} />;
  }

  // Rendu de l'application connectée avec Sidebar
  return (
    <div className="app-layout">
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, backdropFilter: 'blur(4px)' }}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="brand" onClick={() => { setView('home'); setIsSidebarOpen(false); }} style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/elysium_logo.png" alt="ELYSIUM Logo" style={{ height: '80px', width: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(56,189,248,0.5)', marginRight: '20px' }} />
            <span style={{ fontWeight: 800, fontSize: '2.2rem', letterSpacing: '2px', background: 'linear-gradient(to right, #ffffff, #38bdf8, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ELYSIUM</span>
          </div>
          <button className="btn btn-logout" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="nav-links">
          <div className={`nav-link ${view === 'home' ? 'active' : ''}`} onClick={() => { setView('home'); setIsSidebarOpen(false); }}>
            <HomeIcon size={18} />
            <span>Accueil</span>
          </div>

          {hasPermission('dashboard') && (
            <div className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}>
              <Calendar size={18} />
              <span>Plannings & Pointage</span>
            </div>
          )}

          {hasPermission('verification') && (
            <div className={`nav-link ${view === 'verification' ? 'active' : ''}`} onClick={() => { setView('verification'); setIsSidebarOpen(false); }}>
              <CheckCircle size={18} />
              <span>Traitement du pointage</span>
            </div>
          )}

          {hasPermission('payroll') && (
            <div className={`nav-link ${view === 'payroll' ? 'active' : ''}`} onClick={() => { setView('payroll'); setIsSidebarOpen(false); }}>
              <ReceiptText size={18} />
              <span>État de Paie</span>
            </div>
          )}

          {hasPermission('kiosk') && (
            <div className={`nav-link ${view === 'kiosk' ? 'active' : ''}`} onClick={() => { setView('kiosk'); setIsSidebarOpen(false); }}>
              <Clock size={18} />
              <span>Mode Kiosque</span>
            </div>
          )}

          {hasPermission('salaries') && (
            <div className={`nav-link ${view === 'salaries' ? 'active' : ''}`} onClick={() => { setView('salaries'); setIsSidebarOpen(false); }}>
              <DollarSign size={18} />
              <span>Calcul Salaires</span>
            </div>
          )}

          {hasPermission('fluctuation') && (
            <div className={`nav-link ${view === 'fluctuation' ? 'active' : ''}`} onClick={() => { setView('fluctuation'); setIsSidebarOpen(false); }}>
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
              <span style={{ color: '#22c55e', fontWeight: 600 }}>Fluctuation Salariale</span>
            </div>
          )}

          {hasPermission('archives') && (
            <div className={`nav-link ${view === 'archives' ? 'active' : ''}`} onClick={() => { setView('archives'); setIsSidebarOpen(false); }}>
              <Archive size={18} />
              <span>Archives Rapports</span>
            </div>
          )}

          {hasPermission('communication') && (
            <div className={`nav-link ${view === 'communication' ? 'active' : ''}`} onClick={() => { setView('communication'); setIsSidebarOpen(false); }}>
              <MessageSquare size={18} />
              <span>Communication & Tickets</span>
            </div>
          )}

          <div className={`nav-link ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setIsSidebarOpen(false); }}>
            <Settings size={18} />
            <span>Paramètres</span>
          </div>


          {hasPermission('services') && (
            <div className={`nav-link ${view === 'services' ? 'active' : ''}`} onClick={() => { setView('services'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #38bdf8' }}>
              <ShieldAlert size={18} style={{ color: '#38bdf8' }} />
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>Gestion des Services</span>
            </div>
          )}

        </nav>

        <div className="user-profile-widget">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.service} ({user.role === 'super_admin' ? 'Directeur Général' : user.role === 'admin' ? 'Propriétaire' : 'Agent'})</span>
          </div>
          <button className="btn-logout" onClick={logout} title="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content" style={(view === 'fluctuation' || view === 'payslip_print') ? { padding: 0 } : {}}>
        {view !== 'fluctuation' && view !== 'payslip_print' && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary" onClick={() => setIsSidebarOpen(true)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
              <Menu size={20} />
            </button>
          </div>
        )}

        {view === 'home' && <Home setView={setView} />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'verification' && <Dashboard isVerificationMode={true} />}
        {view === 'payroll' && <PayrollView />}
        {view === 'salaries' && <Salaries />}
        {view === 'payslip_print' && <PayslipPrintView onClose={() => setView('home')} />}
        {view === 'fluctuation' && <FluctuationView onClose={() => setView('home')} />}
        {view === 'archives' && <Archives />}
        {view === 'communication' && <Communication />}
        {view === 'settings' && <SettingsView />}
        {view === 'services' && <ServiceManagement />}
        {view === 'subscription' && <Subscription setView={setView} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
