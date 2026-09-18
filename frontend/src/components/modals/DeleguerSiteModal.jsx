import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiCall } from "../../api";
import { X, Search, Users, CheckCircle2, Loader2, Building2, Send } from "lucide-react";

export default function DeleguerSiteModal({ sites = [], currentPeriod = "", onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [siteSearch, setSiteSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeDelegations, setActiveDelegations] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      try {
        const [usersRes, delegRes] = await Promise.all([
          apiCall("get_company_users", {}, "GET"),
          apiCall("get_delegations", { period: currentPeriod }, "GET"),
        ]);
        if (usersRes.success) setUsers(usersRes.users || []);
        if (delegRes.success) {
          const activeSiteIds = (delegRes.sent || [])
            .filter(d => d.status === "active")
            .map(d => d.site_id);
          setActiveDelegations(activeSiteIds);
        }
      } catch (e) {
        setError("Erreur lors du chargement des donnees.");
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [currentPeriod]);

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role_display || "").toLowerCase().includes(q);
  });

  const availableSites = sites.filter(s => s.id && !activeDelegations.includes(s.id));
  const filteredSites = availableSites.filter(s => (s.name || "").toLowerCase().includes(siteSearch.toLowerCase()));

  const handleDelegate = async () => {
    if (!selectedUser || !selectedSite) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiCall("delegate_site", {
        delegated_to: selectedUser.email,
        site_id:      selectedSite.id,
        site_name:    selectedSite.name,
        period:       currentPeriod,
        notes,
      });
      if (res.success) {
        if (onSuccess) onSuccess(selectedSite, selectedUser);
        onClose();
      } else {
        setError(res.message || "Une erreur est survenue.");
      }
    } catch (e) {
      setError("Erreur reseau. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = "") => {
    const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
    return colors[name.charCodeAt(0) % colors.length] || colors[0];
  };

  const overlayStyle = {
    position:"fixed",top:0,left:0,width:"100vw",height:"100vh",
    zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",
    background:"rgba(0,0,0,0.72)",backdropFilter:"blur(8px)"
  };
  const boxStyle = {
    background:"linear-gradient(135deg,rgba(15,23,42,0.98) 0%,rgba(20,30,55,0.98) 100%)",
    border:"1px solid rgba(255,255,255,0.12)",borderRadius:"20px",
    width:"680px",maxWidth:"95vw",maxHeight:"88vh",
    display:"flex",flexDirection:"column",
    boxShadow:"0 24px 80px rgba(0,0,0,0.7)",overflow:"hidden"
  };

  const modalContent = (
    <div style={overlayStyle}>
      <style>{`
        .deleq-card:hover{background:rgba(99,102,241,0.12)!important;border-color:rgba(99,102,241,0.4)!important;}
        .deleq-card.sel{background:rgba(99,102,241,0.18)!important;border-color:#6366f1!important;}
        .deleg-site-c:hover{background:rgba(16,185,129,0.12)!important;border-color:rgba(16,185,129,0.4)!important;}
        .deleg-site-c.sel{background:rgba(16,185,129,0.18)!important;border-color:#10b981!important;}
        .deleq-card,.deleg-site-c{transition:all 0.18s ease;cursor:pointer;}
        @keyframes spin-del{to{transform:rotate(360deg)}}
        .spin-del{animation:spin-del 1s linear infinite;}
      `}</style>
      <div style={boxStyle}>
        {/* Header */}
        <div style={{padding:"22px 28px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)",background:"linear-gradient(90deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(99,102,241,0.4)"}}>
              <Send size={18} color="white" />
            </div>
            <div>
              <h2 style={{margin:0,fontSize:"1.1rem",fontWeight:800,color:"white"}}>Deleguer un site de pointage</h2>
              <p style={{margin:0,fontSize:"0.75rem",color:"rgba(255,255,255,0.45)"}}>Periode : <strong style={{color:"#a5b4fc"}}>{currentPeriod}</strong></p>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"8px",cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center"}}>
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{padding:"14px 28px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",background:"rgba(0,0,0,0.15)",flexShrink:0}}>
          {[{n:1,label:"Controleur"},{n:2,label:"Site"},{n:3,label:"Confirmer"}].map(({n,label},i) => (
            <React.Fragment key={n}>
              <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                <div style={{width:"26px",height:"26px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.73rem",fontWeight:700,background:step>=n?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.07)",color:step>=n?"white":"rgba(255,255,255,0.3)",transition:"all 0.25s"}}>
                  {step>n ? <CheckCircle2 size={13}/> : n}
                </div>
                <span style={{fontSize:"0.8rem",fontWeight:step===n?700:500,color:step===n?"white":step>n?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.3)"}}>{label}</span>
              </div>
              {i<2 && <div style={{flex:1,height:"2px",margin:"0 10px",background:step>n?"linear-gradient(90deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.08)",borderRadius:"2px",transition:"background 0.4s"}}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"22px 28px"}}>
          {error && <div style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"10px",padding:"11px 16px",color:"#f87171",fontSize:"0.83rem",marginBottom:"14px",display:"flex",alignItems:"center",gap:"8px"}}><X size={13}/> {error}</div>}

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.84rem",margin:"0 0 14px"}}>Choisissez le controleur qui va travailler sur le site.</p>
              <div style={{display:"flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"9px 14px",marginBottom:"14px"}}>
                <Search size={14} color="rgba(255,255,255,0.35)"/>
                <input type="text" placeholder="Rechercher par nom, email, role..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} style={{background:"none",border:"none",outline:"none",color:"white",fontSize:"0.88rem",flex:1}}/>
              </div>
              {loadingUsers ? (
                <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.35)"}}>
                  <Loader2 size={22} className="spin-del"/><p style={{marginTop:"10px",fontSize:"0.83rem"}}>Chargement...</p>
                </div>
              ) : filteredUsers.length===0 ? (
                <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.3)"}}><Users size={30} style={{marginBottom:"8px",opacity:0.3}}/><p style={{fontSize:"0.83rem"}}>Aucun utilisateur</p></div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                  {filteredUsers.map(u=>(
                    <div key={u.email} className={`deleq-card${selectedUser?.email===u.email?" sel":""}`} onClick={()=>setSelectedUser(u)} style={{display:"flex",alignItems:"center",gap:"13px",padding:"11px 15px",borderRadius:"12px",background:selectedUser?.email===u.email?"rgba(99,102,241,0.18)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedUser?.email===u.email?"#6366f1":"rgba(255,255,255,0.07)"}`}}>
                      <div style={{width:"38px",height:"38px",borderRadius:"50%",flexShrink:0,background:getAvatarColor(u.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"0.82rem",color:"white"}}>{getInitials(u.name)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontWeight:700,fontSize:"0.88rem",color:"white",lineHeight:1.2}}>{u.name}</p>
                        <p style={{margin:"2px 0 0",fontSize:"0.73rem",color:"rgba(255,255,255,0.4)"}}>{u.email}</p>
                      </div>
                      <span style={{padding:"3px 10px",borderRadius:"20px",fontSize:"0.7rem",background:"rgba(99,102,241,0.15)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.2)",fontWeight:600,flexShrink:0}}>{u.role_display||u.role}</span>
                      {selectedUser?.email===u.email && <CheckCircle2 size={17} color="#6366f1" style={{flexShrink:0}}/>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:"20px"}}>
                <button disabled={!selectedUser} onClick={()=>setStep(2)} style={{background:selectedUser?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.1)",color:selectedUser?"white":"rgba(255,255,255,0.3)",padding:"10px 20px",borderRadius:"8px",border:"none",fontWeight:700,cursor:selectedUser?"pointer":"not-allowed",transition:"all 0.2s"}}>Suivant</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"10px",padding:"9px 15px"}}>
                <div style={{width:"30px",height:"30px",borderRadius:"50%",background:getAvatarColor(selectedUser?.name||""),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"0.75rem",color:"white",flexShrink:0}}>{getInitials(selectedUser?.name||"")}</div>
                <div><p style={{margin:0,fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>Controleur</p><p style={{margin:0,fontSize:"0.88rem",fontWeight:700,color:"white"}}>{selectedUser?.name}</p></div>
              </div>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.84rem",margin:"0 0 14px"}}>Choisissez le site a deleguer. Les sites deja delegues sont exclus.</p>
              <div style={{display:"flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"9px 14px",marginBottom:"14px"}}>
                <Search size={14} color="rgba(255,255,255,0.35)"/>
                <input type="text" placeholder="Rechercher un site..." value={siteSearch} onChange={e=>setSiteSearch(e.target.value)} style={{background:"none",border:"none",outline:"none",color:"white",fontSize:"0.88rem",flex:1}}/>
              </div>
              {filteredSites.length===0 ? (
                <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.3)"}}><Building2 size={30} style={{marginBottom:"8px",opacity:0.3}}/><p style={{fontSize:"0.83rem"}}>{availableSites.length===0?"Tous vos sites sont deja delegues.":"Aucun site ne correspond."}</p></div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                  {filteredSites.map(s=>(
                    <div key={s.id} className={`deleg-site-c${selectedSite?.id===s.id?" sel":""}`} onClick={()=>setSelectedSite(s)} style={{display:"flex",alignItems:"center",gap:"13px",padding:"11px 15px",borderRadius:"12px",background:selectedSite?.id===s.id?"rgba(16,185,129,0.18)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedSite?.id===s.id?"#10b981":"rgba(255,255,255,0.07)"}`}}>
                      <div style={{width:"38px",height:"38px",borderRadius:"10px",flexShrink:0,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>{s.icon||"🏢"}</div>
                      <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:"0.88rem",color:"white"}}>{s.name}</p></div>
                      {selectedSite?.id===s.id && <CheckCircle2 size={17} color="#10b981" style={{flexShrink:0}}/>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:"20px"}}>
                <button onClick={()=>setStep(1)} style={{background:"rgba(255,255,255,0.08)",color:"white",padding:"10px 20px",borderRadius:"8px",border:"none",fontWeight:600,cursor:"pointer"}}>Retour</button>
                <button disabled={!selectedSite} onClick={()=>setStep(3)} style={{background:selectedSite?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.1)",color:selectedSite?"white":"rgba(255,255,255,0.3)",padding:"10px 20px",borderRadius:"8px",border:"none",fontWeight:700,cursor:selectedSite?"pointer":"not-allowed",transition:"all 0.2s"}}>Suivant</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.84rem",margin:"0 0 18px"}}>Verifiez les informations avant de confirmer.</p>
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",padding:"18px",marginBottom:"18px",display:"flex",flexDirection:"column",gap:"13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"11px"}}>
                  <Users size={15} color="#a5b4fc" style={{flexShrink:0}}/>
                  <div><p style={{margin:0,fontSize:"0.73rem",color:"rgba(255,255,255,0.4)"}}>Controleur designe</p><p style={{margin:0,fontWeight:700,color:"white"}}>{selectedUser?.name}</p><p style={{margin:0,fontSize:"0.73rem",color:"rgba(255,255,255,0.35)"}}>{selectedUser?.email}</p></div>
                </div>
                <div style={{height:"1px",background:"rgba(255,255,255,0.06)"}}/>
                <div style={{display:"flex",alignItems:"center",gap:"11px"}}>
                  <Building2 size={15} color="#6ee7b7" style={{flexShrink:0}}/>
                  <div><p style={{margin:0,fontSize:"0.73rem",color:"rgba(255,255,255,0.4)"}}>Site delegue</p><p style={{margin:0,fontWeight:700,color:"white"}}>{selectedSite?.icon||"🏢"} {selectedSite?.name}</p></div>
                </div>
              </div>
              <div style={{marginBottom:"18px"}}>
                <label style={{display:"block",marginBottom:"8px",fontSize:"0.8rem",color:"rgba(255,255,255,0.6)"}}>Note pour le controleur (optionnel)</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instructions particulieres..." style={{width:"100%",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px",color:"white",fontSize:"0.88rem",minHeight:"80px",resize:"none",outline:"none"}}/>
              </div>
              
              <div style={{display:"flex",justifyContent:"space-between",marginTop:"10px"}}>
                <button onClick={()=>setStep(2)} disabled={submitting} style={{background:"rgba(255,255,255,0.08)",color:"white",padding:"12px 24px",borderRadius:"10px",border:"none",fontWeight:600,cursor:submitting?"not-allowed":"pointer"}}>Retour</button>
                <button onClick={handleDelegate} disabled={submitting} style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"white",padding:"12px 30px",borderRadius:"10px",border:"none",fontWeight:700,cursor:submitting?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:"10px",boxShadow:"0 8px 20px rgba(16,185,129,0.3)"}}>
                  {submitting ? <Loader2 size={18} className="spin-del"/> : <CheckCircle2 size={18}/>}
                  {submitting ? "En cours..." : "Confirmer la delegation"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
