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
import CompanyConfigView from './components/CompanyConfigView';
import WelcomePage from './components/WelcomePage';
import PayslipPrintView from './components/PayslipPrintView';
import ServiceManagement, { WORKSPACE_PRESETS } from './components/ServiceManagement';
import PermissionsManager from './components/PermissionsManager';
import Communication from './components/Communication';
import EmployeesView from './components/EmployeesView';
import CommandPalette from './components/CommandPalette';
import JarvisseChat from './components/JarvisseChat';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ReclamationsView from './components/ReclamationsView';
import AgentPortal from './components/AgentPortal';
import PortalAdminView from './components/PortalAdminView';
import LeaveManagement from './components/LeaveManagement';
import PermissionsAbsence from './components/PermissionsAbsence';
import ContractsView from './components/ContractsView';
import PersonnelRegistry from './components/PersonnelRegistry';
import RegistreVisiteurs from './components/RegistreVisiteurs';
import AnnuaireStatut from './components/AnnuaireStatut';
import PointageCourriers from './components/PointageCourriers';
import GestionSalles from './components/GestionSalles';
import ReflexeSecurite from './components/ReflexeSecurite';
import GestionAppels from './components/GestionAppels';
import GestionFlotte from './components/GestionFlotte';
import BadgesProvisoires from './components/BadgesProvisoires';
import FournituresBureau from './components/FournituresBureau';
import AccueilVIP from './components/AccueilVIP';
import AlertesSecurite from './components/AlertesSecurite';
import DGVision from './components/DGVision';
import DGRapports from './components/DGRapports';
import DGValidations from './components/DGValidations';
import DGAudit from './components/DGAudit';
import DGMegaphone from './components/DGMegaphone';
import DGPredictive from './components/DGPredictive';
import DGOKR from './components/DGOKR';
import DGLitiges from './components/DGLitiges';
import DGOrganigramme from './components/DGOrganigramme';
import DGAgenda from './components/DGAgenda';
import DGPV from './components/DGPV';
import DGVeille from './components/DGVeille';
import PDGSouverain from './components/PDGSouverain';
import PDGBilan from './components/PDGBilan';
import PDGSignature from './components/PDGSignature';
import PDGSites from './components/PDGSites';
import PDGAccesMaitre from './components/PDGAccesMaitre';
import PDGBenchmark from './components/PDGBenchmark';
import PDGCoffre from './components/PDGCoffre';
import PDGExpansion from './components/PDGExpansion';
import PDGActionnaires from './components/PDGActionnaires';
import PDGMenaces from './components/PDGMenaces';
import PCRadar from './components/PCRadar';
import PCAlertes from './components/PCAlertes';
import PCCCTV from './components/PCCCTV';
import PCDispatch from './components/PCDispatch';
import PCComms from './components/PCComms';
import PCMainCourante from './components/PCMainCourante';
import PCTracking from './components/PCTracking';
import CtrlFeuille from './components/CtrlFeuille';
import CtrlAudit from './components/CtrlAudit';
import CtrlRapport from './components/CtrlRapport';
import CtrlDashboard from './components/CtrlDashboard';
import CtrlMessagerie from './components/CtrlMessagerie';
import CtrlCarnet from './components/CtrlCarnet';
import CtrlTracking from './components/CtrlTracking';
import CtrlDispatch from './components/CtrlDispatch';
import CtrlFlotte from './components/CtrlFlotte';
import CtrlRondes from './components/CtrlRondes';
import CtrlNotation from './components/CtrlNotation';
import { ShieldAlert, Shield, UserPlus, Calendar, DollarSign, Archive, Settings, LogOut, Clock, Loader2, Sparkles, Menu, X, CheckCircle, Home as HomeIcon, ReceiptText, TrendingUp, MessageSquare, Camera, Bell, Search, BarChart3, Bot, FileWarning, Fingerprint, Contact, Plane, Briefcase, Database, Users, Printer, FileText, MapPin, PlusCircle, Package, MessageSquareWarning, MessageCircle, AlertTriangle, Inbox, Building2 } from 'lucide-react';
import { apiCall } from './api';
import BoiteReceptionAdmin from './components/BoiteReceptionAdmin';
import './App.css';

const safeFormatMonth = (periodStr) => {
  if (!periodStr || typeof periodStr !== 'string' || !periodStr.includes('-')) return periodStr;
  const parts = periodStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m)) return periodStr;
  const d = new Date(y, m - 1, 1);
  if (isNaN(d.getTime())) return periodStr;
  try {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d);
  } catch(e) { return periodStr; }
};

// ─── Composant Onboarding (Vidéo plein écran et Confettis) ────────────────
const OnboardingModal = ({ onComplete }) => {
  const [activeVideo, setActiveVideo] = useState(1);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f172a', // Couleur de fond de secours
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, overflow: 'hidden'
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeInVideo { from { opacity: 0; } to { opacity: 0.8; } }
      `}</style>

      {/* VIDÉO 1 (Joue une fois, puis passe à la vidéo 2) */}
      {activeVideo === 1 && (
        <video 
          autoPlay muted playsInline
          onEnded={() => setActiveVideo(2)}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            objectFit: 'cover', zIndex: 1, opacity: 0.5
          }}
        >
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        </video>
      )}

      {/* VIDÉO 2 (Prend le relais en boucle) */}
      {activeVideo === 2 && (
        <video 
          autoPlay loop muted playsInline
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            objectFit: 'cover', zIndex: 1, opacity: 0.8,
            animation: 'fadeInVideo 1s ease-in-out'
          }}
        >
          <source src="/party.mp4" type="video/mp4" />
        </video>
      )}
      
      {/* CONTENU (TEXTE ET BOUTON) */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '90%', maxWidth: '800px', textAlign: 'center', padding: '50px',
        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)',
        borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 1s ease-out 3s both' // <- Délai de 3 secondes
      }}>
        <style>{`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatText {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); text-shadow: 0 5px 15px rgba(255,255,255,0.3); }
          }
        `}</style>
        
        <h1 style={{ 
          fontSize: '4.5rem', fontWeight: '900', marginBottom: '20px',
          background: 'linear-gradient(90deg, #ffffff, #38bdf8, #a855f7, #ffffff)',
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: '1.2',
          animation: 'slideUp 0.8s ease-out 3.2s both, gradientMove 4s linear infinite' // <- Apparaît à 3.2s
        }}>
          Bienvenue sur ELYSIUM !
        </h1>
        
        <p style={{ 
          color: '#e2e8f0', marginBottom: '40px', fontSize: '1.4rem', fontWeight: '500', 
          animation: 'slideUp 0.8s ease-out 3.6s both, floatText 3s ease-in-out infinite 4s' // <- Apparaît à 3.6s
        }}>
          Plus qu'un pointage, une solution.
        </p>
        
        <button 
          onClick={onComplete}
          style={{
            background: '#38bdf8', color: '#0f172a',
            border: 'none', padding: '18px 50px', fontSize: '1.3rem', fontWeight: '900',
            borderRadius: '50px', cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(56, 189, 248, 0.3)', transition: 'all 0.2s',
            animation: 'slideUp 0.8s ease-out 4s both' // <- Apparaît à 4s
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(56, 189, 248, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(56, 189, 248, 0.3)'; }}
        >
          Commencer à utiliser l'application
        </button>
      </div>
    </div>
  );
};


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

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    workspace_type: user?.workspace_type || 'AUTRE'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('update_profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        workspace_type: formData.workspace_type
      });
      if (res.success) {
        setSuccessMsg("Profil mis à jour avec succès !");
        onUpdate();
        setTimeout(() => {
          onClose();
        }, 2000); // Laisse le temps au toast d'être lu
      } else {
        setErrorMsg(res.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#0f172a', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '450px',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700 }}>Modifier mon profil</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Floating Toast Notification */}
        {successMsg && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000000,
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#fff', padding: '16px 24px', borderRadius: '12px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            fontWeight: 500, fontSize: '0.95rem'
          }}>
            <div style={{ background: 'rgba(34,197,94,0.2)', borderRadius: '50%', padding: '6px', display: 'flex', color: '#4ade80' }}>
              <CheckCircle size={20} />
            </div>
            {successMsg}
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Nom complet</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Espace de Travail (Environnement)</label>
            <select value={formData.workspace_type} onChange={e => setFormData({...formData, workspace_type: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
              {Object.entries(WORKSPACE_PRESETS).map(([key, ws]) => (
                <option key={key} value={key} style={{ background: '#0f172a', color: 'white' }}>{ws.icon} {ws.label}</option>
              ))}
            </select>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#fca5a5' }}>
              <ShieldAlert size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Informations sensibles</span>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Adresse Email (Identifiant)</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Numéro de téléphone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optionnel"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Nouveau mot de passe (laisser vide si inchangé)</label>
            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
          </div>
          {formData.password && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Confirmer le mot de passe</label>
              <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: 'linear-gradient(135deg, #38bdf8, #a855f7)', color: 'white', padding: '14px', borderRadius: '10px',
            border: 'none', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px',
            opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
          }}>
            {loading ? <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }} /> : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- GESTION AUDIO GLOBALE ---
let globalAudioCtx = null;
const initAudio = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};
// Débloquer l'audio au premier clic sur l' application (requis par les navigateurs)
document.addEventListener('click', initAudio, { once: true });

function MainAppContent() {
  const { user, subscription, loading, logout, refreshUser, hasPermission, hasWritePermission } = useAuth();
  const [view, setView] = useState(() => localStorage.getItem('pontage_active_view') || 'welcome'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isJarvisseOpen, setIsJarvisseOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pontage_active_view', view);
  }, [view]);
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedThisSession, setCompletedThisSession] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [latestPublication, setLatestPublication] = useState(null);
  const [latestReclamationPub, setLatestReclamationPub] = useState(null);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [showNotifHistory, setShowNotifHistory] = useState(false);
  const [notifHistoryData, setNotifHistoryData] = useState([]);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [globalSecurityAlert, setGlobalSecurityAlert] = useState(null);

  useEffect(() => {
    const handleCmdK = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleCmdK);
    return () => window.removeEventListener('keydown', handleCmdK);
  }, []);

  const formatPeriodCycle = (periodStr) => {
    if (!periodStr) return '';
    const [year, month] = periodStr.split('-');
    const currentMonthDate = new Date(year, parseInt(month) - 1, 1);
    const prevMonthDate = new Date(year, parseInt(month) - 2, 1);
    
    const currMonthName = currentMonthDate.toLocaleDateString('fr-FR', { month: 'long' });
    const prevMonthName = prevMonthDate.toLocaleDateString('fr-FR', { month: 'long' });
    const fullYear = currentMonthDate.getFullYear();
    const prevYear = prevMonthDate.getFullYear();
    
    const currCap = currMonthName.charAt(0).toUpperCase() + currMonthName.slice(1);
    const prevCap = prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1);
    
    return `du 21 ${prevCap}${prevYear !== fullYear ? ' ' + prevYear : ''} au 20 ${currCap} ${fullYear}`;
  };

  const playBeep = () => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {
      console.log('Audio play prevented', e);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Enregistrement de la première connexion sur ce navigateur pour éviter les notifications fantômes du passé
    const loginKey = `first_login_${user.email}`;
    if (!localStorage.getItem(loginKey)) {
      localStorage.setItem(loginKey, Date.now().toString());
    }
    const firstLoginTime = parseInt(localStorage.getItem(loginKey) || '0');

    const checkData = async () => {
      try {
        // --- 1. Check Publication ---
        const pubRes = await apiCall('get_latest_publication', {}, 'GET');
        if (pubRes?.success && pubRes.publication) {
          const pub = pubRes.publication;
          
          if (pub.service_id && user.service_id && pub.service_id !== user.service_id && pub.service_name !== user.service) {
            const keyPrefix = `pub_${pub.period}_${pub.timestamp}`;
            
            // Auto-dismiss si la publication est plus ancienne que la première connexion sur cet ordi (avec 1min de marge)
            if (pub.timestamp * 1000 < firstLoginTime - 60000) {
              localStorage.setItem(`${keyPrefix}_dismissed`, 'true');
            }

            if (!localStorage.getItem(`${keyPrefix}_dismissed`)) {
              const ignoredUntil = localStorage.getItem('pub_ignored_until');
              if (!ignoredUntil || Date.now() >= parseInt(ignoredUntil)) {
                if (!latestPublication || latestPublication.timestamp !== pub.timestamp) {
                  playBeep();
                }
                setLatestPublication(pub);
              }
            }
          }
        } else {
          setLatestPublication(null);
        }

        // --- 2. Check Feedback ---
        const fbRes = await apiCall('get_latest_feedback', {}, 'GET');
        if (fbRes?.success) {
          const activeFeedbacks = [];
          
          const checkFb = (fb) => {
            if (!fb) return;
            const isMeantForUs = (
              (fb.type === 'function_deleted' && user.service !== fb.service_name) ||
              (fb.type !== 'function_deleted' && fb.publisher_service_id && user.service_id && fb.publisher_service_id === user.service_id)
            );
            if (!isMeantForUs) return;
            
            const keyPrefix = `fb_${fb.period}_${fb.timestamp}`;
            if (fb.timestamp * 1000 < firstLoginTime - 60000) {
              localStorage.setItem(`${keyPrefix}_dismissed`, 'true');
            }
            
            if (!localStorage.getItem(`${keyPrefix}_dismissed`)) {
              activeFeedbacks.push(fb);
            }
          };
          
          checkFb(fbRes.function_deleted);
          checkFb(fbRes.pub_feedback);
          checkFb(fbRes.reclamation_feedback);
          
          if (activeFeedbacks.length > 0) {
            activeFeedbacks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const newest = activeFeedbacks[0];
            if (!latestFeedback || latestFeedback.timestamp !== newest.timestamp || latestFeedback.type !== newest.type) {
              playBeep();
            }
            setLatestFeedback(newest);
          } else {
            setLatestFeedback(null);
          }
        } else {
          setLatestFeedback(null);
        }

        // --- 3. Check Réclamation Publication ---
        const recPubRes = await apiCall('get_latest_publication_reclamations', {}, 'GET');
        if (recPubRes?.success && recPubRes.publication) {
          const pub = recPubRes.publication;
          if (pub.service_id && user.service_id && pub.service_id !== user.service_id) {
            const isTargeted = pub.services_cibles && (pub.services_cibles.includes('Tous') || pub.services_cibles.includes(user.service));
            
            if (isTargeted) {
              const keyPrefix = `rec_pub_${pub.period}_${pub.timestamp}`;
              
              if (pub.timestamp * 1000 < firstLoginTime - 60000) {
                localStorage.setItem(`${keyPrefix}_dismissed`, 'true');
              }

              if (!localStorage.getItem(`${keyPrefix}_dismissed`)) {
                if (!latestReclamationPub || latestReclamationPub.timestamp !== pub.timestamp) {
                  playBeep();
                }
                setLatestReclamationPub(pub);
              }
            }
          }
        } else {
          setLatestReclamationPub(null);
        }

        // --- 4. Check Global Security Alert (from backend) ---
        if (recPubRes?.success && recPubRes.global_security_alert) {
          let alertData = recPubRes.global_security_alert;
          if (typeof alertData === 'string') {
            try { alertData = JSON.parse(alertData); } catch(e) {}
          }
          if (alertData && alertData.type) {
            // Ne pas afficher si c'est nous qui l'avons publié
            if (alertData.publisher_service_id !== user.service) {
              // Vérifier si cet incident précis a été ignoré
              const dismissedKey = `alert_${alertData.timestamp}_dismissed`;
              if (localStorage.getItem(dismissedKey) !== 'true') {
                setGlobalSecurityAlert(alertData);
              } else {
                setGlobalSecurityAlert(null);
              }
            } else {
              // L'auteur ne voit pas l'écran de blocage global
              setGlobalSecurityAlert(null);
            }
          } else {
            setGlobalSecurityAlert(null);
          }
        } else {
          setGlobalSecurityAlert(null);
        }

      } catch (e) {}
    };

    checkData();
    const interval = setInterval(checkData, 5000);
    return () => clearInterval(interval);
  }, [user, latestPublication, latestFeedback, latestReclamationPub]);

  const handlePubIgnorer = () => {
    localStorage.setItem('pub_ignored_until', (Date.now() + 5 * 60 * 1000).toString()); // 5 minutes
    setLatestPublication(null);
  };

  const sendPubFeedback = async (type) => {
    if (!latestPublication || !latestPublication.service_id) return;
    try {
      await apiCall('send_pub_feedback', {
        period: latestPublication.period,
        type: type,
        publisher_service_id: latestPublication.service_id
      }, 'POST');
    } catch (e) {
      console.error(e);
    }
  };

  const handleFbCompris = () => {
    if (latestFeedback) {
      localStorage.setItem(`fb_${latestFeedback.period}_${latestFeedback.timestamp}_dismissed`, 'true');
      setLatestFeedback(null);
    }
  };

  const handlePubAccuser = () => {
    if (latestPublication) {
      sendPubFeedback('accuse');
      localStorage.setItem(`pub_${latestPublication.period}_${latestPublication.timestamp}_dismissed`, 'true');
      setLatestPublication(null);
    }
  };

  const handlePubConsulter = () => {
    if (latestPublication) {
      sendPubFeedback('consulter');
      localStorage.setItem(`pub_${latestPublication.period}_${latestPublication.timestamp}_dismissed`, 'true');
      setLatestPublication(null);
    }
    if (user?.permissions?.can_view_salaries || user?.role === 'admin') {
      setView('payroll');
    } else {
      alert("Vous n'avez pas l'autorisation d'accéder au module État de paie.");
    }
  };

  const handleRecPubIgnorer = () => {
    if (latestReclamationPub) {
      localStorage.setItem(`rec_pub_${latestReclamationPub.period}_${latestReclamationPub.timestamp}_dismissed`, 'true');
      setLatestReclamationPub(null);
    }
  };

  const handleRecPubAccuser = async () => {
    if (!latestReclamationPub) return;
    try {
      await apiCall('send_reclamation_feedback', {
        period: latestReclamationPub.period,
        type: 'accuse',
        publisher_service_id: latestReclamationPub.service_id
      }, 'POST');
    } catch(e) {}
    localStorage.setItem(`rec_pub_${latestReclamationPub.period}_${latestReclamationPub.timestamp}_dismissed`, 'true');
    setLatestReclamationPub(null);
  };

  const handleRecPubConsulter = async () => {
    if (latestReclamationPub) {
      try {
        await apiCall('send_reclamation_feedback', {
          period: latestReclamationPub.period,
          type: 'consulter',
          publisher_service_id: latestReclamationPub.service_id
        }, 'POST');
      } catch(e) {}
      localStorage.setItem(`rec_pub_${latestReclamationPub.period}_${latestReclamationPub.timestamp}_dismissed`, 'true');
      setLatestReclamationPub(null);
    }
    if (hasPermission('reclamation')) {
      setView('reclamation');
    }
  };


  useEffect(() => {
    if (user && user.has_seen_onboarding === false && !completedThisSession) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user, completedThisSession]);

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false); // Cacher immédiatement
    setCompletedThisSession(true); // Empêcher la réapparition
    try {
      apiCall('complete_onboarding', {}, 'POST'); // Ne pas bloquer l'UI
      if (refreshUser) refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }
    
    // On ne bloque plus sur la taille, on compresse !
    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Redimensionnement via Canvas (max 200x200 pour un avatar)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export en JPEG 80% (très léger, idéal pour contourner la limite du serveur PHP local)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        try {
          const res = await apiCall('upload_profile_photo', { photo: compressedBase64 });
          if (res.success) {
            if (refreshUser) await refreshUser();
          } else {
            alert(res.message || 'Erreur lors de la mise à jour de la photo');
          }
        } catch (err) {
          alert('Erreur réseau');
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };



  useEffect(() => {
    if (loading) return; // Ne pas rediriger pendant la vérification de session
    if (!user) {
      setView('welcome');
      setIsSidebarOpen(false);
    } else {
      if (user.workspace_type === 'AGENT' && !user.is_impersonated) {
        setView(prev => (prev === 'login' || prev === 'register' || prev === 'welcome') ? 'kiosk' : prev);
      } else {
        setView(prev => (prev === 'login' || prev === 'register' || prev === 'welcome') ? 'home' : prev);
      }
      setIsSidebarOpen(false);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchNotifs = async () => {
      if (!hasPermission('communication')) return;
      try {
        let count = 0;
        const resTkt = await apiCall('get_tickets', {}, 'GET');
        if (resTkt.success && resTkt.tickets) {
          count += resTkt.tickets.filter(t => t.status !== 'resolved' && (t.to_service === user.service || t.from_service === user.service || user.role === 'super_admin')).length;
        }
        const resMsg = await apiCall('get_inter_service_messages', {}, 'GET');
        if (resMsg.success && resMsg.messages) {
          const lastSeen = Number(localStorage.getItem('last_seen_messages') || 0);
          count += resMsg.messages.filter(m => {
            if (m.to_service !== 'all' && m.to_service !== user.service && user.role !== 'super_admin') return false;
            return new Date(m.timestamp).getTime() > lastSeen;
          }).length;
        }
        if (isMounted) setNotificationsCount(count);
      } catch(e) {}
    };
    fetchNotifs();
    const int = setInterval(fetchNotifs, 5000); // 5 secondes
    return () => { isMounted = false; clearInterval(int); };
  }, [user]);

  if (loading) {
    // Un simple fond vide pour ne pas faire "flasher" l'écran d'accueil avant de savoir si l'utilisateur est connecté
    return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }

  // ──── PORTAIL AGENT (accessible sans connexion admin) ────
  if (window.location.pathname === '/portail-agent') {
    return <AgentPortal />;
  }

  // Si non connecté
  if (!user) {
    if (view === 'login') return <Login setView={setView} />;
    if (view === 'register') return <Register setView={setView} />;
    
    // Page d'accueil / Welcome (Landing Page complète)
    return <WelcomePage setView={setView} />;
  }

  // Si connecté mais abonnement expiré
  const isAccessAllowed = subscription?.access_allowed;
  if (!isAccessAllowed) {
    return <Subscription setView={setView} />;
  }

  if (user?.status === 'suspended' || user?.status === 'deactivated') {
    logout();
    return null;
  }

  if (user?.maintenance_mode && !user?.is_impersonated) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', textAlign: 'center', padding: '20px' }}>
        <AlertTriangle size={64} color="#eab308" style={{ marginBottom: '20px' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>En Maintenance</h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Votre espace de travail est temporairement en maintenance par l'administrateur.<br/>Veuillez patienter ou le contacter.</p>
        <button onClick={logout} className="btn btn-secondary" style={{ marginTop: '20px', padding: '10px 20px' }}>Se déconnecter</button>
      </div>
    );
  }



  // Si on est en mode Kiosque complet (sans sidebar)
  if (view === 'kiosk') {
    return <Kiosk setView={setView} />;
  }

  // Rendu de l'application connectée avec Sidebar
  return (
    <div className="app-layout" style={{ paddingTop: user?.is_impersonated ? '45px' : 0 }}>
      {user?.is_impersonated && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '45px', zIndex: 9999999, background: '#ef4444', color: 'white', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
            <AlertTriangle size={20} />
            MODE IMPERSONATION : Vous êtes connecté en tant que {user.name} ({user.email})
          </div>
          <button 
            onClick={async () => {
              try {
                await apiCall('stop_impersonation', {}, 'POST');
                window.location.reload();
              } catch(e) { alert("Erreur lors de l'arrêt de l'impersonation"); }
            }}
            style={{ background: 'white', color: '#ef4444', border: 'none', padding: '5px 15px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Terminer l'impersonation
          </button>
        </div>
      )}
      {globalSecurityAlert && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '40px'
        }}>
          <div className="pulse-bg" style={{ padding: '60px', borderRadius: '24px', border: '4px solid #ef4444', background: 'rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={120} color="#ef4444" className="pulse" style={{ marginBottom: '30px' }} />
            <h1 style={{ fontSize: '3.5rem', color: '#ef4444', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Alerte {globalSecurityAlert.type === 'evacuation' ? 'Évacuation' : 'Confinement'}
            </h1>
            <p style={{ fontSize: '1.5rem', color: 'white', maxWidth: '800px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Une procédure d'urgence a été déclenchée. Veuillez suivre immédiatement les consignes de sécurité et écouter les annonces vocales.
            </p>
            <button 
              onClick={() => {
                localStorage.setItem(`alert_${globalSecurityAlert.timestamp}_dismissed`, 'true');
                setGlobalSecurityAlert(null);
              }}
              style={{
                background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)',
                padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
              }}
            >
              J'ai compris (Ignorer cette alerte)
            </button>
          </div>
          <style>{`
            @keyframes pulse-ring {
              0% { transform: scale(0.9); opacity: 1; }
              100% { transform: scale(1.1); opacity: 0; }
            }
            .pulse { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
            @keyframes pulse-bg-anim {
              from { background-color: rgba(239,68,68,0.1); }
              to { background-color: rgba(239,68,68,0.3); }
            }
            .pulse-bg { animation: pulse-bg-anim 2s infinite alternate; }
          `}</style>
        </div>
      )}

      {showOnboarding && <OnboardingModal onComplete={handleCompleteOnboarding} />}

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

          {[
                { id: 'dashboard', icon: Calendar, label: 'Plannings & Pointage' },
                { id: 'company_config', icon: Building2, label: 'Configuration Entreprise' },
                { id: 'verification', icon: CheckCircle, label: 'Traitement du pointage' },
                { id: 'payroll', icon: ReceiptText, label: 'État de Paie' },
                { id: 'kiosk', icon: Clock, label: 'Mode Kiosque' },
                { id: 'salaries', icon: DollarSign, label: 'Grille Salariale' },
                { id: 'calcul_salaires', icon: DollarSign, label: 'Calcul des Salaires' },
                { id: 'fluctuation', icon: TrendingUp, label: 'Fluctuation Salariale' },
                { id: 'archives', icon: Archive, label: 'Archives Rapports' },
                { id: 'analytics', icon: BarChart3, label: 'Tableau de Bord Analytique' },
                { id: 'services', icon: ShieldAlert, label: 'Gestion des Services' },
                { id: 'employees', icon: Contact, label: 'Gestion des Employés' },
                { id: 'leave', icon: Plane, label: 'Gestion des Congés' },
                { id: 'permissions', icon: Clock, label: 'Gestion des Permissions' },
                { id: 'contracts', icon: Briefcase, label: 'Gestion des Contrats' },
                { id: 'registry', icon: Database, label: 'Registre Général' },
                { id: 'recrutement', icon: Users, label: 'Espace e-Recrutement' },
                { id: 'print_attendance', icon: Printer, label: 'Imprimer le Pointage' },
                { id: 'print_payroll', icon: FileText, label: 'Imprimer Fiche de Paie' },
                { id: 'gps', icon: MapPin, label: 'Pointage GPS' },
                { id: 'new_mep', icon: PlusCircle, label: 'Nouvelle MEP' },
                { id: 'materiel', icon: Package, label: 'Suivi du Matériel' },
                { id: 'reclamation_view', icon: MessageSquareWarning, label: 'Réclamation Paie' },
                // --- Modules Secrétariat ---
                { id: 'registre_visiteurs', icon: Users, label: 'Registre des Visiteurs' },
                { id: 'annuaire_statut', icon: Contact, label: 'Annuaire & Statut' },
                { id: 'pointage_courriers', icon: Package, label: 'Courriers & Colis' },
                { id: 'gestion_salles', icon: Calendar, label: 'Gestion des Salles' },
                { id: 'reflexe_securite', icon: ShieldAlert, label: 'Réflexe Sécurité' },
              ].map(mod => {
                const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
                if (hasPermission(mod.id) && (isAdmin || !hasWritePermission(mod.id))) {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.id} className={`nav-link ${view === mod.id ? 'active' : ''}`} onClick={() => { setView(mod.id); setIsSidebarOpen(false); }}>
                      <Icon size={18} />
                      <span>{mod.label}</span>
                    </div>
                  );
                }
                return null;
              })}

          <div className={`nav-link ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setIsSidebarOpen(false); }}>
            <Settings size={18} />
            <span>Paramètres</span>
          </div>

          <div className={`nav-link ${view === 'private_inbox' ? 'active' : ''}`} onClick={() => { setView('private_inbox'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #06b6d4' }}>
            <Inbox size={18} style={{ color: '#06b6d4' }} />
            <span style={{ color: '#06b6d4', fontWeight: 700 }}>Boîte de réception</span>
          </div>

          {hasPermission('services') && (
            <div className={`nav-link ${view === 'services' ? 'active' : ''}`} onClick={() => { setView('services'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #38bdf8' }}>
              <ShieldAlert size={18} style={{ color: '#38bdf8' }} />
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>Gestion des Services</span>
            </div>
          )}

          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <>
            {hasPermission('view_agents') && (
              <div className={`nav-link ${view === 'portal_admin' ? 'active' : ''}`} onClick={() => { setView('portal_admin'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #34d399' }}>
                <Fingerprint size={18} style={{ color: '#34d399' }} />
                <span style={{ color: '#34d399', fontWeight: 700 }}>Validations Portail</span>
              </div>
            )}
            {hasPermission('view_agents') && (
              <div className={`nav-link ${view === 'leave_admin' ? 'active' : ''}`} onClick={() => { setView('leave_admin'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #f59e0b' }}>
                <Calendar size={18} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Gestion des Congés</span>
              </div>
            )}
            <div className={`nav-link ${view === 'permissions' ? 'active' : ''}`} onClick={() => { setView('permissions'); setIsSidebarOpen(false); }} style={{ borderLeft: '2px solid #a855f7' }}>
              <Shield size={18} style={{ color: '#a855f7' }} />
              <span style={{ color: '#a855f7', fontWeight: 700 }}>Permissions</span>
            </div>
            </>
          )}

        </nav>


      </aside>

      <main className="main-content" style={(view === 'fluctuation' || view === 'payslip_print' || view === 'communication') ? { padding: 0 } : {}}>
        {view === 'home' && (
          <header style={{ 
            margin: '-24px -24px 24px -24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            background: 'rgba(15, 23, 42, 0.8)', 
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            padding: '16px 32px', 
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Left section: Menu */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ 
                  padding: '8px 14px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: 'var(--text)', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Menu size={20} style={{ color: '#38bdf8' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.5px' }}>Menu</span>
              </button>
            </div>
            
            {/* Center section: Notification Bell */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <style>{`
                @keyframes bellRing {
                  0%, 100% { transform: rotate(0deg); }
                  10% { transform: rotate(15deg); }
                  20% { transform: rotate(-10deg); }
                  30% { transform: rotate(5deg); }
                  40% { transform: rotate(-5deg); }
                  50% { transform: rotate(0deg); }
                }
                @keyframes badgePulse {
                  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8); }
                  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
              `}</style>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  title="Recherche Rapide (Ctrl+K)"
                  onClick={() => setIsCmdPaletteOpen(true)}
                  style={{ 
                    position: 'relative', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid white',
                    borderRadius: '12px', padding: '0 15px', height: '42px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '10px', cursor: 'pointer', color: '#94a3b8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                    e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Search size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recherche...</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginLeft: '5px' }}>Ctrl+K</span>
                </button>

                <button 
                  title="Assistant IA Jarvisse"
                  onClick={() => setIsJarvisseOpen(!isJarvisseOpen)}
                  style={{ 
                    position: 'relative', background: isJarvisseOpen ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)', border: isJarvisseOpen ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid white',
                    borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: isJarvisseOpen ? '#fff' : '#94a3b8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = isJarvisseOpen ? '#fff' : '#94a3b8'; e.currentTarget.style.background = isJarvisseOpen ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = isJarvisseOpen ? 'rgba(168, 85, 247, 0.4)' : 'white'; e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Bot size={20} />
                </button>

                <button 
                  title="Historique des Notifications"
                  onClick={async () => {
                    setShowNotifHistory(true);
                    try {
                      const res = await apiCall('get_feedback_history', {}, 'GET');
                      if (res.success) setNotifHistoryData(res.history);
                    } catch(e) {}
                  }}
                  style={{ 
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid white',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = '#fff'; 
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = '#94a3b8'; 
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Archive size={20} />
                </button>

                <button 
                  title="Communication & Tickets"
                  onClick={() => {
                    setView('communication');
                    localStorage.setItem('last_seen_messages', Date.now().toString());
                    setNotificationsCount(0);
                  }}
                  style={{ 
                    position: 'relative',
                    background: notificationsCount > 0 
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))' 
                      : 'rgba(99, 102, 241, 0.08)',
                    border: notificationsCount > 0 
                      ? '1px solid rgba(99, 102, 241, 0.6)' 
                      : '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    height: '42px',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: notificationsCount > 0 ? '#a5b4fc' : '#94a3b8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: notificationsCount > 0 ? '0 0 18px rgba(99,102,241,0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = '#fff'; 
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.25))';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.8)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 0 22px rgba(99,102,241,0.4)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = notificationsCount > 0 ? '#a5b4fc' : '#94a3b8'; 
                    e.currentTarget.style.background = notificationsCount > 0 
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))' 
                      : 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.borderColor = notificationsCount > 0 
                      ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = notificationsCount > 0 ? '0 0 18px rgba(99,102,241,0.3)' : 'none';
                  }}
                >
                  <MessageCircle 
                    size={20} 
                    style={{ 
                      animation: notificationsCount > 0 ? 'bellRing 2s infinite ease-in-out' : 'none',
                      flexShrink: 0
                    }} 
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Messages</span>
                  {notificationsCount > 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'badgePulse 2s infinite'
                    }}>
                      {notificationsCount > 9 ? '9+' : notificationsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right section: Profile Widget */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '24px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.3px', color: '#f8fafc' }}>{user.name}</span>
                    <Settings size={14} color="#94a3b8" style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} 
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'} 
                      onClick={() => setShowProfileModal(true)} 
                      title="Modifier mon profil" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{user.service}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    {(() => {
                      const ws = user.workspace_type || 'AUTRE';
                      const preset = WORKSPACE_PRESETS[ws] || WORKSPACE_PRESETS['AUTRE'];
                      return (
                        <span style={{
                          color: preset.color,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {preset.icon} {preset.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

              {/* Avatar cliquable pour upload photo */}
              <div 
                style={{ 
                  position: 'relative', 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: user.profile_photo ? 'transparent' : 'linear-gradient(135deg, #38bdf8, #a855f7)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  border: '2px solid rgba(255,255,255,0.15)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'; e.currentTarget.querySelector('.overlay').style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.querySelector('.overlay').style.opacity = '0'; }}
                title="Changer la photo de profil"
              >
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
                <div className="overlay" style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(2px)', opacity: 0, transition: 'opacity 0.2s'
                }}>
                  {uploadingPhoto ? <Loader2 size={20} className="animate-spin" color="#38bdf8" /> : <Camera size={20} color="#f8fafc" />}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              </div>

              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                title="Déconnexion"
                style={{
                  background: 'transparent',
                  color: 'var(--muted)',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>
        )}

        {/* Global floating Close Button for sections */}
        {view !== 'home' && view !== 'fluctuation' && view !== 'payslip_print' && view !== 'communication' && (
          <button
            onClick={() => {
              if (view === 'verification' && localStorage.getItem('pontage_payroll_activeSite')) {
                setView('payroll');
              } else {
                setView('home');
              }
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#f8fafc',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="Fermer la section et retourner à l'accueil"
          >
            <X size={20} />
          </button>
        )}

        {view === 'home' && <Home setView={setView} hasPermission={hasPermission} user={user} />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'verification' && <Dashboard isVerificationMode={true} onBack={() => setView('payroll')} />}
        {view === 'employees' && <EmployeesView />}
        {view === 'payroll' && <PayrollView setView={setView} />}
        {view === 'salaries' && <Salaries />}
        {view === 'calcul_salaires' && <Salaries />}
        {view === 'payslip_print' && <PayslipPrintView onClose={() => setView('home')} />}
        {view === 'fluctuation' && <FluctuationView onClose={() => setView('home')} />}
        {view === 'company_config' && <CompanyConfigView onClose={() => setView('home')} />}
        {view === 'archives' && <Archives onSwitchToCurrent={() => setView('dashboard')} />}
        {view === 'communication' && <Communication onClose={() => setView('home')} />}
        {view === 'reclamations' && <ReclamationsView />}
        {view === 'settings' && <SettingsView />}
        {view === 'services' && <ServiceManagement />}
        {view === 'private_inbox' && <BoiteReceptionAdmin />}
        {view === 'permissions' && <PermissionsManager />}
        {view === 'subscription' && <Subscription setView={setView} />}
        {view === 'analytics' && <AnalyticsDashboard goBack={() => setView('home')} />}
        {view === 'portal_admin' && <PortalAdminView />}
        {view === 'leave_admin' && <LeaveManagement />}
        {view === 'permissions_absence' && <PermissionsAbsence />}
        {view === 'contracts' && <ContractsView />}
        {view === 'registry' && <PersonnelRegistry />}
        {view === 'registre_visiteurs' && <RegistreVisiteurs />}
        {view === 'annuaire_statut' && <AnnuaireStatut />}
        {view === 'pointage_courriers' && <PointageCourriers />}
        {view === 'gestion_salles' && <GestionSalles />}
        {view === 'reflexe_securite' && <ReflexeSecurite setView={setView} />}
        {view === 'gestion_appels' && <GestionAppels />}
        {view === 'gestion_flotte' && <GestionFlotte />}
        {view === 'badges_provisoires' && <BadgesProvisoires />}
        {view === 'fournitures_bureau' && <FournituresBureau />}
        {view === 'accueil_vip' && <AccueilVIP />}
        {view === 'alertes_securite' && <AlertesSecurite />}
        {view === 'dg_vision' && <DGVision />}
        {view === 'dg_rapports' && <DGRapports />}
        {view === 'dg_validation' && <DGValidations />}
        {view === 'dg_audit' && <DGAudit />}
        {view === 'dg_megaphone' && <DGMegaphone />}
        {view === 'dg_predictive' && <DGPredictive />}
        {view === 'dg_okr' && <DGOKR />}
        {view === 'dg_litiges' && <DGLitiges />}
        {view === 'dg_organigramme' && <DGOrganigramme />}
        {view === 'dg_agenda' && <DGAgenda />}
        {view === 'dg_pv' && <DGPV />}
        {view === 'dg_veille' && <DGVeille />}
        {view === 'pdg_souverain' && <PDGSouverain />}
        {view === 'pdg_bilan' && <PDGBilan />}
        {view === 'pdg_signature' && <PDGSignature />}
        {view === 'pdg_sites' && <PDGSites />}
        {view === 'pdg_acces_maitre' && <PDGAccesMaitre />}
        {view === 'pdg_benchmark' && <PDGBenchmark />}
        {view === 'pdg_coffre' && <PDGCoffre />}
        {view === 'pdg_expansion' && <PDGExpansion />}
        {view === 'pdg_actionnaires' && <PDGActionnaires />}
        {view === 'pdg_menaces' && <PDGMenaces />}
        {view === 'pc_radar' && <PCRadar />}
        {view === 'pc_alertes' && <PCAlertes />}
        {view === 'pc_cctv' && <PCCCTV />}
        {view === 'pc_dispatch' && <PCDispatch />}
        {view === 'pc_comms' && <PCComms />}
        {view === 'pc_main_courante' && <PCMainCourante />}
        {view === 'pc_tracking' && <PCTracking />}
        {view === 'ctrl_feuille' && <CtrlFeuille />}
        {view === 'ctrl_audit' && <CtrlAudit />}
        {view === 'ctrl_rapport' && <CtrlRapport />}
        {view === 'ctrl_dashboard' && <CtrlDashboard />}
        {view === 'ctrl_messagerie' && <CtrlMessagerie />}
        {view === 'ctrl_carnet' && <CtrlCarnet />}
        {view === 'ctrl_tracking' && <CtrlTracking onClose={() => setView('home')} />}
        {view === 'ctrl_dispatch' && <CtrlDispatch onClose={() => setView('home')} />}
        {view === 'ctrl_flotte' && <CtrlFlotte onClose={() => setView('home')} />}
        {view === 'ctrl_rondes' && <CtrlRondes onClose={() => setView('home')} />}
        {view === 'ctrl_notation' && <CtrlNotation onClose={() => setView('home')} />}
      </main>

      {showProfileModal && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onUpdate={() => refreshUser(true)} 
        />
      )}

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <div style={{
            background: '#0f172a', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#ef4444' }}>
              <LogOut size={48} />
            </div>
            <h2 style={{ margin: '0 0 15px 0', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700 }}>Déconnexion</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '30px' }}>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{
                flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                Annuler
              </button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} style={{
                flex: 1, padding: '12px', borderRadius: '10px', background: '#ef4444',
                border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE DES NOTIFICATIONS */}
      {showNotifHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <div style={{
            background: '#0f172a', padding: '30px', borderRadius: '24px', width: '95%', maxWidth: '1000px',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            height: '90vh', display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Archive size={24} style={{ color: '#10b981' }}/> Historique
              </h2>
              <button onClick={() => setShowNotifHistory(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="custom-scrollbar" style={{ overflowY: 'scroll', flex: 1, paddingRight: '15px' }}>
              {notifHistoryData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                  Aucune notification dans l'historique.
                </div>
              ) : (
                notifHistoryData.map((notif, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px', padding: '16px', marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                      <span>{new Date(notif.timestamp * 1000).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span>{new Date(notif.timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                      {notif.type === 'function_deleted' ? (
                        <>Le <strong style={{ color: '#ef4444' }}>{notif.service_name}</strong> a supprimé la fonction <strong style={{ color: '#38bdf8' }}>{notif.function_name}</strong>. Les agents affectés ont été mis à jour.</>
                      ) : notif.type === 'publish' ? (
                        <>Le <strong style={{ color: '#10b981' }}>{notif.service_name}</strong> a publié le pointage de la période <strong style={{ color: '#38bdf8' }}>{formatPeriodCycle(notif.period)}</strong>.</>
                      ) : notif.type === 'publish_reclamations' ? (
                        <>Le <strong style={{ color: '#f59e0b' }}>{notif.service_name}</strong> a publié des réclamations pour <strong style={{ color: '#38bdf8' }}>{safeFormatMonth(notif.period)}</strong>.</>
                      ) : notif.type === 'close_reclamations' ? (
                        <>Le <strong style={{ color: '#10b981' }}>{notif.service_name}</strong> a clôturé et validé les réclamations pour <strong style={{ color: '#38bdf8' }}>{safeFormatMonth(notif.period)}</strong>.</>
                      ) : notif.type?.startsWith('reclamation_') ? (
                        <><strong style={{ color: '#f59e0b' }}>{notif.service_name}</strong> a {notif.type === 'reclamation_accuse' ? 'accusé réception des' : 'consulté les'} réclamations de <strong style={{ color: '#38bdf8' }}>{safeFormatMonth(notif.period)}</strong>.</>
                      ) : (
                        <><strong style={{ color: '#38bdf8' }}>{notif.service_name}</strong> a {notif.type === 'accuse' ? 'accusé réception du' : 'consulté le'} pointage <strong style={{ color: '#38bdf8' }}>{formatPeriodCycle(notif.period)}</strong>.</>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FEEDBACK RETOUR */}
      {latestFeedback && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{ 
              display: 'flex', justifyContent: 'center', marginBottom: '24px', 
              color: '#10b981', position: 'relative'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                <MessageSquare size={40} strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 style={{ 
              margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.75rem', fontWeight: 800,
              letterSpacing: '-0.025em' 
            }}>
              {latestFeedback.type === 'function_deleted' ? 'Alerte Système !' : 'Accusé de réception !'}
            </h2>
            
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.05rem', lineHeight: 1.6 }}>
              {latestFeedback.type === 'function_deleted' ? (
                <>Le <strong style={{ color: '#ef4444' }}>{latestFeedback.service_name}</strong> a supprimé la fonction <strong style={{ color: '#38bdf8' }}>{latestFeedback.function_name}</strong>. Les agents affectés ont été mis à jour vers le statut "Aucun / Vide".</>
              ) : (
                <>
                  Le <strong style={{ color: '#e2e8f0' }}>{latestFeedback.service_name}</strong> a {
                    latestFeedback.type === 'accuse' ? 'accusé réception du pointage' :
                    latestFeedback.type === 'consulter' ? 'consulté le pointage' :
                    latestFeedback.type === 'close_reclamations' ? 'clôturé les réclamations' :
                    latestFeedback.type === 'reclamation_accuse' ? 'accusé réception des réclamations' :
                    'consulté les réclamations'
                  } que vous avez publié pour la période <strong style={{ color: '#10b981' }}>{
                    latestFeedback.type?.startsWith('reclamation_') 
                    ? safeFormatMonth(latestFeedback.period) 
                    : formatPeriodCycle(latestFeedback.period)
                  }</strong>.
                </>
              )}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={handleFbCompris} style={{
                width: '100%', padding: '16px', borderRadius: '12px', background: '#10b981',
                border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', 
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)'; }}>
                <CheckCircle size={20} strokeWidth={2.5} /> Super !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM NOTIFICATION PUBLICATION */}
      {latestPublication && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(56, 189, 248, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Effet lumineux en arrière-plan */}
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              background: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.15) 0%, transparent 60%)',
              pointerEvents: 'none'
            }}></div>

            <div style={{ 
              display: 'flex', justifyContent: 'center', marginBottom: '24px', 
              color: '#38bdf8', position: 'relative'
            }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '50%',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
              }}>
                <Bell size={40} strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 style={{ 
              margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.75rem', fontWeight: 800,
              letterSpacing: '-0.025em' 
            }}>Nouveau Pointage !</h2>
            
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Le <strong style={{ color: '#e2e8f0' }}>{latestPublication.service_name}</strong> vient de publier le pointage pour la période <strong style={{ color: '#38bdf8' }}>{formatPeriodCycle(latestPublication.period)}</strong>.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handlePubIgnorer} style={{
                  flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontSize: '0.95rem'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}>
                  Ignorer
                </button>
                <button onClick={handlePubAccuser} style={{
                  flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontSize: '0.95rem'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}>
                  Accuser réception
                </button>
              </div>
              
              <button onClick={handlePubConsulter} style={{
                width: '100%', padding: '16px', borderRadius: '12px', background: '#38bdf8',
                border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer', 
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
                transition: 'all 0.2s', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)'; }}>
                <CheckCircle size={20} strokeWidth={2.5} /> Consulter l'état de paie
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CommandPalette 
        isOpen={isCmdPaletteOpen} 
        onClose={() => setIsCmdPaletteOpen(false)} 
        onSelectView={(id) => setView(id)} 
        hasPermission={hasPermission}
        user={user}
      />
      
      {/* TOAST NOTIFICATION RÉCLAMATIONS — Style Ambre */}
      {latestReclamationPub && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px',
          zIndex: 100001, animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1c1008, #1a0f00)',
            padding: '24px', borderRadius: '20px', width: '380px',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 20px 40px -8px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(245,158,11,0.1)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
            <div style={{ position: 'absolute', top: '-60%', right: '-20%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📋</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Réclamations de Paie</span>
                  <button onClick={handleRecPubIgnorer} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', lineHeight: 1, fontSize: '1.1rem' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>✕</button>
                </div>
                <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', margin: '0 0 4px 0' }}>
                  {latestReclamationPub.count ? `${latestReclamationPub.count} fiche${latestReclamationPub.count > 1 ? 's' : ''} publiée${latestReclamationPub.count > 1 ? 's' : ''}` : 'Nouvelles fiches publiées'}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  <strong style={{ color: '#fcd34d' }}>{latestReclamationPub.service_name}</strong> — {safeFormatMonth(latestReclamationPub.period)}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleRecPubAccuser} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(245,158,11,0.25)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(245,158,11,0.12)'; e.currentTarget.style.transform='translateY(0)'; }}>✓ Accusé réception</button>
                  <button onClick={handleRecPubConsulter} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#1c1008', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(245,158,11,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>👁 Consulter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JARVISSE AI ASSISTANT */}
      <JarvisseChat user={user} isOpen={isJarvisseOpen} setIsOpen={setIsJarvisseOpen} hideFloatingButton={view === 'home'} />

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
