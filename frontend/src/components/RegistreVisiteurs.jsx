import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { Users, UserPlus, Clock, LogOut, Camera, X, CheckCircle2, Search, Download, RefreshCw, Loader2 } from 'lucide-react';

export default function RegistreVisiteurs() {
  const { user } = useAuth();
  
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | history
  const [visiteurs, setVisiteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire d'entrée
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryData, setEntryData] = useState({
    nom: '', prenom: '', entreprise: '', motif: 'Rendez-vous',
    personne_visitee: '', num_badge: '', photo_url: ''
  });
  
  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Stats
  const activeCount = visiteurs.filter(v => v.statut === 'Présent').length;
  const todayCount = visiteurs.filter(v => new Date(v.heure_entree).toDateString() === new Date().toDateString()).length;

  useEffect(() => {
    fetchVisiteurs();
  }, []);

  const fetchVisiteurs = async () => {
    setLoading(true);
    try {
      // Pour l'instant on utilise un mock ou un endpoint si backend prêt
      const res = await apiCall('get_visiteurs', {}, 'GET').catch(() => ({ success: false }));
      if (res.success && res.visiteurs) {
        setVisiteurs(res.visiteurs);
      } else {
        // Fallback local state pour test d'UI
        setVisiteurs([
          { id: 1, nom: 'Dupont', prenom: 'Jean', entreprise: 'TechCorp', motif: 'Rendez-vous', personne_visitee: 'Directeur', heure_entree: new Date(Date.now() - 3600000).toISOString(), heure_sortie: null, statut: 'Présent', num_badge: '12' },
          { id: 2, nom: 'Martin', prenom: 'Sophie', entreprise: 'Livraison Express', motif: 'Livraison', personne_visitee: 'Accueil', heure_entree: new Date(Date.now() - 7200000).toISOString(), heure_sortie: new Date(Date.now() - 7000000).toISOString(), statut: 'Parti', num_badge: '5' }
        ]);
      }
    } catch(e) {}
    setLoading(false);
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowWebcam(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Erreur d'accès à la webcam : " + err.message);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  useEffect(() => {
    if (showWebcam && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showWebcam, stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setEntryData({ ...entryData, photo_url: dataUrl });
      stopWebcam();
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    const newVisiteur = {
      ...entryData,
      id: Date.now(),
      heure_entree: new Date().toISOString(),
      statut: 'Présent',
      heure_sortie: null
    };
    
    // Simulate API call
    setVisiteurs([newVisiteur, ...visiteurs]);
    setShowEntryModal(false);
    setEntryData({ nom: '', prenom: '', entreprise: '', motif: 'Rendez-vous', personne_visitee: '', num_badge: '', photo_url: '' });
  };

  const handleCheckout = async (id) => {
    setVisiteurs(visiteurs.map(v => 
      v.id === id ? { ...v, statut: 'Parti', heure_sortie: new Date().toISOString() } : v
    ));
    // Call backend later
  };

  const filteredVisiteurs = visiteurs.filter(v => {
    if (activeView === 'dashboard' && v.statut !== 'Présent') return false;
    if (activeView === 'history' && v.statut !== 'Parti') return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return v.nom.toLowerCase().includes(term) || 
             v.prenom.toLowerCase().includes(term) || 
             v.entreprise.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--b)" /> Registre des Visiteurs
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>Gérez les flux d'entrées et de sorties dans vos locaux.</p>
        </div>
        <button 
          onClick={() => setShowEntryModal(true)}
          style={{ background: 'var(--b)', color: '#0f172a', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)' }}
        >
          <UserPlus size={20} /> Nouvelle Entrée
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '12px' }}><Users size={24} color="var(--b)" /></div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Présents Actuellement</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{activeCount}</h2>
          </div>
        </div>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><CheckCircle2 size={24} color="#10b981" /></div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Aujourd'hui</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{todayCount}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveView('dashboard')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', color: activeView === 'dashboard' ? 'var(--b)' : 'var(--muted)', fontSize: '1rem', fontWeight: 600, borderBottom: activeView === 'dashboard' ? '2px solid var(--b)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Visiteurs Présents
        </button>
        <button 
          onClick={() => setActiveView('history')}
          style={{ background: 'none', border: 'none', padding: '8px 16px', color: activeView === 'history' ? 'var(--b)' : 'var(--muted)', fontSize: '1rem', fontWeight: 600, borderBottom: activeView === 'history' ? '2px solid var(--b)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Historique
        </button>
      </div>

      <div className="glass-panel" style={{ minHeight: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou entreprise..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '300px', outline: 'none' }}
            />
          </div>
          {activeView === 'history' && (
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Exporter PDF
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Photo</th>
                <th style={{ padding: '12px' }}>Visiteur</th>
                <th style={{ padding: '12px' }}>Motif & Badge</th>
                <th style={{ padding: '12px' }}>Personne Visitée</th>
                <th style={{ padding: '12px' }}>Heure Entrée</th>
                {activeView === 'history' && <th style={{ padding: '12px' }}>Heure Sortie</th>}
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisiteurs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    Aucun visiteur trouvé.
                  </td>
                </tr>
              ) : (
                filteredVisiteurs.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {v.photo_url ? <img src={v.photo_url} alt="Visiteur" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} color="var(--muted)" />}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{v.prenom} {v.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{v.entreprise || 'Particulier'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: 'white' }}>{v.motif}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--b)' }}>Badge N°{v.num_badge || '-'}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'white' }}>{v.personne_visitee}</td>
                    <td style={{ padding: '12px', color: 'white' }}>{new Date(v.heure_entree).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    {activeView === 'history' && <td style={{ padding: '12px', color: 'white' }}>{v.heure_sortie ? new Date(v.heure_sortie).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>}
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {v.statut === 'Présent' ? (
                        <button 
                          onClick={() => handleCheckout(v.id)}
                          style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                        >
                          <LogOut size={16} /> Marquer Parti
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Terminé</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOUVELLE ENTREE */}
      {showEntryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '800px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><UserPlus size={24} color="var(--b)" /> Enregistrer un Visiteur</h2>
              <button onClick={() => { setShowEntryModal(false); stopWebcam(); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleEntrySubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Photo Section */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {showWebcam ? (
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : entryData.photo_url ? (
                    <img src={entryData.photo_url} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={40} color="var(--muted)" />
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!showWebcam ? (
                    <button type="button" onClick={startWebcam} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={16} /> Activer Webcam
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={capturePhoto} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={16} /> Prendre la photo
                      </button>
                      <button type="button" onClick={stopWebcam} className="btn btn-secondary">Annuler</button>
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              {/* Form Fields */}
              <div className="form-group">
                <label className="form-label">Nom <span style={{color:'var(--danger)'}}>*</span></label>
                <input type="text" className="form-input" required value={entryData.nom} onChange={e => setEntryData({...entryData, nom: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Prénom <span style={{color:'var(--danger)'}}>*</span></label>
                <input type="text" className="form-input" required value={entryData.prenom} onChange={e => setEntryData({...entryData, prenom: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Entreprise représentée</label>
                <input type="text" className="form-input" placeholder="Laisser vide si particulier" value={entryData.entreprise} onChange={e => setEntryData({...entryData, entreprise: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Personne / Service visité <span style={{color:'var(--danger)'}}>*</span></label>
                <input type="text" className="form-input" required value={entryData.personne_visitee} onChange={e => setEntryData({...entryData, personne_visitee: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Motif de la visite</label>
                <select className="form-input" value={entryData.motif} onChange={e => setEntryData({...entryData, motif: e.target.value})}>
                  <option value="Rendez-vous">Rendez-vous</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Entretien d'embauche">Entretien d'embauche</option>
                  <option value="Intervention technique">Intervention technique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">N° Badge Visiteur Remis</label>
                <input type="text" className="form-input" placeholder="ex: 14" value={entryData.num_badge} onChange={e => setEntryData({...entryData, num_badge: e.target.value})} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEntryModal(false); stopWebcam(); }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 'bold' }}>Enregistrer l'Entrée</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
