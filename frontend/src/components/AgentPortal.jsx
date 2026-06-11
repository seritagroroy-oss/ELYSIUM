import React, { useState } from 'react';
import { apiCall } from '../api';
import { Fingerprint, Lock, User, Phone, Calendar, Loader2, DownloadCloud, LogOut, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AgentPortal() {
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  
  // Register State
  const [regMode, setRegMode] = useState('matricule'); // 'matricule' or 'infos'
  const [regData, setRegData] = useState({ matricule: '', nom: '', phone: '', dob: '', pin: '', pinConfirm: '' });
  
  // Dashboard State
  const [agentData, setAgentData] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'leaves'
  
  // Leaves State
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ type: '', start: '', end: '', reason: '', attachment: null });
  const [leaveMsg, setLeaveMsg] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await apiCall('login_agent_portal', { matricule: loginId, pin: loginPin }, 'POST');
      if (res.success) {
        setAgentData({ id: res.agent_id, name: res.name });
        setView('dashboard');
        fetchLeaveData(res.agent_id);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (regData.pin !== regData.pinConfirm) {
      setErrorMsg("Les codes PIN ne correspondent pas.");
      return;
    }
    if (regData.pin.length < 4) {
      setErrorMsg("Le code PIN doit contenir au moins 4 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        matricule: regMode === 'matricule' ? regData.matricule : '',
        nom: regMode === 'infos' ? regData.nom : '',
        phone: regMode === 'infos' ? regData.phone : '',
        dob: regMode === 'infos' ? regData.dob : '',
        pin: regData.pin
      };
      
      const res = await apiCall('register_agent_portal', payload, 'POST');
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setView('login'), 4000);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg("Erreur serveur lors de la vérification. Assurez-vous d'avoir pointé ce mois-ci.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAgentData(null);
    setLoginId('');
    setLoginPin('');
    setView('login');
  };

  const fetchLeaveData = async (agentId) => {
    try {
      const typesRes = await apiCall('get_leave_types', {}, 'GET');
      if (typesRes.success) setLeaveTypes(typesRes.leave_types);

      const balRes = await apiCall('get_my_leave_balances', { agent_id: agentId }, 'GET');
      if (balRes.success) setLeaveBalances(balRes.balance);

      const reqRes = await apiCall('get_my_leave_requests', { agent_id: agentId }, 'GET');
      if (reqRes.success) setLeaveRequests(reqRes.requests);
    } catch (e) {
      console.error(e);
    }
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();
    setLeaveMsg('');
    if (!leaveForm.type || !leaveForm.start || !leaveForm.end) {
      setLeaveMsg('Veuillez remplir les dates et le type');
      return;
    }
    const startD = new Date(leaveForm.start);
    const endD = new Date(leaveForm.end);
    let totalDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1; // Simplistic
    if (totalDays <= 0) {
      setLeaveMsg('Date de fin invalide');
      return;
    }

    setIsSubmittingLeave(true);
    let attachmentUrl = '';
    
    // Si fichier, on l'upload d'abord
    if (leaveForm.attachment) {
      const formData = new FormData();
      formData.append('file', leaveForm.attachment);
      try {
        const uploadRes = await fetch('http://localhost:8000/api.php?action=upload_leave_attachment', {
          method: 'POST',
          body: formData
        }).then(r => r.json());
        if (uploadRes.success) {
          attachmentUrl = uploadRes.url;
        } else {
          setLeaveMsg('Erreur upload: ' + uploadRes.message);
          setIsSubmittingLeave(false);
          return;
        }
      } catch (err) {
        setLeaveMsg('Erreur lors de l\'upload');
        setIsSubmittingLeave(false);
        return;
      }
    }

    try {
      const res = await apiCall('submit_leave_request', {
        agent_id: agentData.id,
        leave_type_id: leaveForm.type,
        start_date: leaveForm.start,
        end_date: leaveForm.end,
        total_days: totalDays,
        reason: leaveForm.reason,
        attachment_url: attachmentUrl
      }, 'POST');

      if (res.success) {
        setLeaveMsg('Demande soumise avec succès !');
        setLeaveForm({ type: '', start: '', end: '', reason: '', attachment: null });
        fetchLeaveData(agentData.id); // Refresh
      } else {
        setLeaveMsg(res.message);
      }
    } catch (e) {
      setLeaveMsg('Erreur de soumission');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      color: 'white',
      padding: '20px'
    }}>
      {/* ───────────────────────────────────────────────────────── */}
      {/* LOGIN VIEW */}
      {/* ───────────────────────────────────────────────────────── */}
      {view === 'login' && (
        <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.4s' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ background: 'linear-gradient(135deg, #38bdf8, #a855f7)', width: 80, height: 80, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 15px 30px rgba(56, 189, 248, 0.3)' }}>
              <Fingerprint size={40} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Portail Agent</h1>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Accédez à vos fiches de paie et documents RH</p>
          </div>

          <form onSubmit={handleLogin} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><XCircle size={18} /> {errorMsg}</div>}
            {successMsg && <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#6ee7b7', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} /> {successMsg}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Matricule ou Téléphone</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input required type="text" value={loginId} onChange={e => setLoginId(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border 0.2s' }} onFocus={e=>e.target.style.borderColor='#38bdf8'} onBlur={e=>e.target.style.borderColor='#1e293b'} />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Code PIN (4 chiffres)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input required type="password" inputMode="numeric" maxLength="4" value={loginPin} onChange={e => setLoginPin(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1.2rem', letterSpacing: '4px', outline: 'none' }} onFocus={e=>e.target.style.borderColor='#38bdf8'} onBlur={e=>e.target.style.borderColor='#1e293b'} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#38bdf8', color: '#020617', border: 'none', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {loading ? <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /> : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '30px', color: '#64748b' }}>
            Première connexion ? <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}>Créer mon accès</button>
          </p>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* REGISTER VIEW */}
      {/* ───────────────────────────────────────────────────────── */}
      {view === 'register' && (
        <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.4s' }}>
          <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
            &larr; Retour à la connexion
          </button>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Créer mon accès</h1>
            <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Votre compte sera automatiquement validé si vous avez pointé ce mois-ci sur l'un de nos sites.
            </p>
          </div>

          <form onSubmit={handleRegister} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18} /> {errorMsg}</div>}

            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setRegMode('matricule')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: regMode === 'matricule' ? '#1e293b' : 'transparent', color: regMode === 'matricule' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>J'ai un Matricule</button>
              <button type="button" onClick={() => setRegMode('infos')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: regMode === 'infos' ? '#1e293b' : 'transparent', color: regMode === 'infos' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>Je n'en ai pas</button>
            </div>

            {regMode === 'matricule' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Votre Matricule</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input required type="text" value={regData.matricule} onChange={e => setRegData({...regData, matricule: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none' }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Nom et Prénom(s)</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input required type="text" value={regData.nom} onChange={e => setRegData({...regData, nom: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none' }} placeholder="Taper exactement comme sur le planning" />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Numéro de téléphone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input required type="tel" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Date de naissance</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input type="date" value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1rem', outline: 'none' }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Créer un Code PIN (4 chiffres)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input required type="password" inputMode="numeric" maxLength="4" value={regData.pin} onChange={e => setRegData({...regData, pin: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1.2rem', letterSpacing: '4px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>Confirmer le Code PIN</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input required type="password" inputMode="numeric" maxLength="4" value={regData.pinConfirm} onChange={e => setRegData({...regData, pinConfirm: e.target.value})} style={{ width: '100%', padding: '16px 16px 16px 44px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', color: 'white', fontSize: '1.2rem', letterSpacing: '4px', outline: 'none' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /> : "S'inscrire"}
            </button>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* DASHBOARD VIEW (AFTER LOGIN) */}
      {/* ───────────────────────────────────────────────────────── */}
      {view === 'dashboard' && agentData && (
        <div style={{ width: '100%', maxWidth: '450px', animation: 'fadeIn 0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Espace Agent</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{agentData.name}</div>
            </div>
            <button onClick={logout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
              <LogOut size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#0f172a', padding: '5px', borderRadius: '16px' }}>
            <button onClick={() => setActiveTab('home')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: activeTab === 'home' ? '#38bdf8' : 'transparent', color: activeTab === 'home' ? '#020617' : '#94a3b8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Accueil</button>
            <button onClick={() => setActiveTab('leaves')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: activeTab === 'leaves' ? '#a855f7' : 'transparent', color: activeTab === 'leaves' ? 'white' : '#94a3b8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Mes Congés</button>
          </div>

          {activeTab === 'home' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px' }}>Prochain Salaire (Estimatif)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>-- XOF</div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px' }}>
                  Le détail sera disponible à la fin du cycle de paie.
                </p>
              </div>

              <button style={{ width: '100%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '16px', borderRadius: '16px', color: '#38bdf8', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                <DownloadCloud size={20} /> Télécharger le dernier Bulletin
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Congés Restants</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                    {leaveBalances ? (leaveBalances.acquired - leaveBalances.taken).toFixed(1) + ' J' : '--'}
                  </div>
                </div>
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Avances</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316' }}>0 F</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              
              {/* Soldes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                 <div style={{ background: '#0f172a', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Acquis</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{leaveBalances?.acquired || 0}</div>
                 </div>
                 <div style={{ background: '#0f172a', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Dispo</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{(leaveBalances?.acquired || 0) - (leaveBalances?.taken || 0)}</div>
                 </div>
                 <div style={{ background: '#0f172a', padding: '15px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>En cours</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{leaveBalances?.pending || 0}</div>
                 </div>
              </div>

              {/* Formulaire de Demande */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Nouvelle Demande</h3>
                {leaveMsg && <div style={{ marginBottom: '15px', color: '#fca5a5', fontSize: '0.9rem' }}>{leaveMsg}</div>}
                
                <form onSubmit={submitLeaveRequest}>
                  <select required value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: 'white', marginBottom: '15px', outline: 'none' }}>
                    <option value="">Sélectionner un motif...</option>
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Du</label>
                      <input required type="date" value={leaveForm.start} onChange={e => setLeaveForm({...leaveForm, start: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: 'white', outline: 'none', marginTop: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Au</label>
                      <input required type="date" value={leaveForm.end} onChange={e => setLeaveForm({...leaveForm, end: e.target.value})} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: 'white', outline: 'none', marginTop: '4px' }} />
                    </div>
                  </div>

                  <textarea placeholder="Motif ou commentaire (optionnel)" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: 'white', marginBottom: '15px', outline: 'none', resize: 'none', height: '60px' }}></textarea>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Justificatif (si maladie, etc.)</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setLeaveForm({...leaveForm, attachment: e.target.files[0]})} style={{ width: '100%', color: '#94a3b8', fontSize: '0.9rem' }} />
                  </div>

                  <button type="submit" disabled={isSubmittingLeave} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7, #c084fc)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: isSubmittingLeave ? 'not-allowed' : 'pointer' }}>
                    {isSubmittingLeave ? 'Envoi...' : 'Soumettre ma demande'}
                  </button>
                </form>
              </div>

              {/* Historique */}
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Mes Demandes</h3>
              {leaveRequests.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Aucune demande pour le moment.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaveRequests.map(req => (
                    <div key={req.id} style={{ background: '#0f172a', padding: '15px', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{req.type_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{req.start_date} au {req.end_date} ({req.total_days}j)</div>
                      </div>
                      <div style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: req.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : req.status === 'approved' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: req.status === 'pending' ? '#fbbf24' : req.status === 'approved' ? '#34d399' : '#ef4444'
                       }}>
                        {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Validé' : 'Refusé'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
