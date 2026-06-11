import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { 
  MessageSquare, Ticket, Send, Plus, CheckCircle, XCircle, Loader2, 
  Paperclip, Smile, Reply, Search, X, Clock, User, Filter, AlertTriangle, 
  Check, ChevronRight, HelpCircle, UserPlus, Image, FileText, CornerUpLeft, 
  Pin, Star, ThumbsUp, Sparkles, Hash, ArrowRight, ShieldAlert, Award,
  CheckCheck, MoreVertical, Phone, Video, ChevronLeft, Wrench, ArrowLeft,
  Share, Edit2, Trash2
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const getPriorityBgColor = (p) => {
  if (p === 'urgent') return 'rgba(239,68,68,0.15)';
  if (p === 'high')   return 'rgba(249,115,22,0.15)';
  if (p === 'medium') return 'rgba(234,179,8,0.15)';
  return 'var(--card-hover)';
};
const getPriorityTextColor = (p) => {
  if (p === 'urgent') return 'var(--danger)';
  if (p === 'high')   return 'var(--c)';
  if (p === 'medium') return 'var(--c)';
  return 'var(--muted)';
};
const getStatusColor = (s) => {
  if (s === 'open')        return 'var(--c)';
  if (s === 'in_progress') return 'var(--b)';
  if (s === 'resolved')    return 'var(--a)';
  return 'var(--danger)';
};
const getStatusBgColor = (s) => {
  if (s === 'open')        return 'rgba(245,158,11,0.15)';
  if (s === 'in_progress') return 'rgba(56,189,248,0.15)';
  if (s === 'resolved')    return 'rgba(34,197,94,0.15)';
  return 'rgba(239,68,68,0.15)';
};
const getStatusLabel = (s) => {
  if (s === 'open') return 'Ouvert';
  if (s === 'in_progress') return 'En cours';
  if (s === 'resolved') return 'Résolu';
  return 'Fermé';
};

export default function Communication({ onClose }) {
  const { user } = useAuth();

  /* ── tabs: 'chat' | 'tickets' */
  const [activeTab, setActiveTab] = useState('chat');

  /* ── shared data */
  const [services, setServices]   = useState([]);
  const [usersList, setUsersList] = useState([]);

  /* ── chat */
  const [messages, setMessages]           = useState([]);
  const [selectedService, setSelectedService] = useState('all');
  const [chatInput, setChatInput]         = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [typers, setTypers]               = useState([]);
  const [replyingTo, setReplyingTo]       = useState(null);
  const [attachment, setAttachment]       = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu]         = useState(null);
  const [showPinnedOnly, setShowPinnedOnly]   = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef      = useRef(false);

  /* ── tickets */
  const [tickets, setTickets]           = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tkTitle, setTkTitle]           = useState('');
  const [tkContent, setTkContent]       = useState('');
  const [tkDest, setTkDest]             = useState('');
  const [tkPriority, setTkPriority]     = useState('medium');
  const [tkTags, setTkTags]             = useState([]);
  const [newTagInput, setNewTagInput]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketServiceFilter, setTicketServiceFilter]   = useState('all');
  const [newComment, setNewComment]         = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [ratingStars, setRatingStars]       = useState(5);
  const [ratingComment, setRatingComment]   = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [nowTime, setNowTime] = useState(Date.now());

  const messagesEndRef       = useRef(null);
  const prevMessagesLength   = useRef(0);
  const chatScrollRef        = useRef(null);

  /* ── notification sound */
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

  const scrollToBottom = (b = 'smooth') => messagesEndRef.current?.scrollIntoView({ behavior: b });

  useEffect(() => { scrollToBottom('smooth'); }, [messages, replyingTo, typers]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTime(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── initial load */
  useEffect(() => {
    (async () => {
      try {
        const sRes = await apiCall('get_services_list', {}, 'GET');
        if (sRes.success && sRes.services) setServices(sRes.services);
        const uRes = await apiCall('get_all_users', {}, 'GET');
        if (uRes.success && uRes.users) {
          setUsersList(Object.entries(uRes.users).map(([email, u]) => ({
            email, name: u.name, service: u.service, service_id: u.service_id
          })));
        }
      } catch (_) {}
    })();
  }, []);

  /* ── polling */
  const loadMessages = async (isFirstLoad = false) => {
    try {
      const res = await apiCall('get_inter_service_messages', {}, 'GET');
      if (res.success && res.messages) {
        setMessages(res.messages);
        if (res.typers) setTypers(res.typers);
        if (!isFirstLoad && res.messages.length > prevMessagesLength.current) {
          const last = res.messages[res.messages.length - 1];
          if (last.from_user_email !== user?.email && last.from_service !== user?.service_id)
            playNotificationSound();
        }
        prevMessagesLength.current = res.messages.length;
      }
    } catch (_) {}
  };

  const loadTickets = async () => {
    try {
      const res = await apiCall('get_tickets', {}, 'GET');
      if (res.success && res.tickets) {
        setTickets(res.tickets);
        if (selectedTicket) {
          const upd = res.tickets.find(t => t.id === selectedTicket.id);
          if (upd) setSelectedTicket(upd);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      loadMessages(true);
      const i = setInterval(() => loadMessages(false), 3000);
      return () => clearInterval(i);
    } else {
      loadTickets();
      const i = setInterval(loadTickets, 5000);
      return () => clearInterval(i);
    }
  }, [activeTab]);

  /* ── typing */
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      apiCall('set_typing_status', { to_service: selectedService, is_typing: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      apiCall('set_typing_status', { to_service: selectedService, is_typing: false });
    }, 2500);
  };

  /* ── send message */
  const sendChatMessage = async () => {
    if (!chatInput.trim() && !attachment) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    apiCall('set_typing_status', { to_service: selectedService, is_typing: false });
    try {
      const res = await apiCall('send_inter_service_message', {
        content: chatInput, to_service: selectedService,
        reply_to: replyingTo ? replyingTo.id : '',
        attachment: attachment ? attachment.data : '',
        attachment_name: attachment ? attachment.name : ''
      });
      if (res.success) {
        setChatInput(''); setReplyingTo(null); setAttachment(null);
        loadMessages();
      } else alert(res.message || "Erreur lors de l'envoi");
    } catch (_) { alert('Erreur réseau'); }
  };

  const reactToMessage    = async (id, emoji) => { try { const r = await apiCall('react_to_message', { message_id: id, emoji }); if (r.success) loadMessages(); } catch (_) {} };
  const togglePinMessage  = async (id)        => { try { const r = await apiCall('toggle_pin_message', { message_id: id }); if (r.success) loadMessages(); } catch (_) {} };

  const createTicket = async () => {
    if (!tkTitle.trim() || !tkContent.trim() || !tkDest.trim()) { alert('Veuillez remplir tous les champs obligatoires'); return; }
    setSubmitting(true);
    try {
      const res = await apiCall('create_ticket', { title: tkTitle, content: tkContent, to_service: tkDest, priority: tkPriority, tags: tkTags });
      if (res.success) { setShowTicketModal(false); setTkTitle(''); setTkContent(''); setTkDest(''); setTkPriority('medium'); setTkTags([]); loadTickets(); }
      else alert(res.message || 'Erreur');
    } catch (_) { alert('Erreur réseau'); } finally { setSubmitting(false); }
  };

  const updateTicketStatus = async (id, status) => {
    try { const r = await apiCall('update_ticket_status', { ticket_id: id, status }); if (r.success) loadTickets(); else alert('Erreur'); } catch (_) { alert('Erreur réseau'); }
  };

  const assignTicket = async (id, email) => {
    const u = usersList.find(u => u.email === email);
    try { const r = await apiCall('assign_ticket', { ticket_id: id, assigned_to: email, assigned_name: u ? u.name : email }); if (r.success) loadTickets(); } catch (_) {}
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    setSubmittingComment(true);
    try { const r = await apiCall('add_ticket_comment', { ticket_id: selectedTicket.id, content: newComment }); if (r.success) { setNewComment(''); loadTickets(); } } catch (_) {} finally { setSubmittingComment(false); }
  };

  const submitRating = async () => {
    if (!selectedTicket) return;
    setSubmittingRating(true);
    try { const r = await apiCall('rate_ticket', { ticket_id: selectedTicket.id, rating: ratingStars, comment: ratingComment }); if (r.success) { setRatingComment(''); setRatingStars(5); loadTickets(); } } catch (_) {} finally { setSubmittingRating(false); }
  };

  const handleAddTag = () => { const t = newTagInput.trim().replace(/^#/, ''); if (t && !tkTags.includes(t)) { setTkTags([...tkTags, t]); setNewTagInput(''); } };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Fichier trop volumineux (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAttachment({ name: file.name, type: file.type, data: ev.target.result });
    reader.readAsDataURL(file);
  };

  const renderFormattedText = (text) => {
    if (!text) return '';
    let f = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (searchQuery.trim()) {
      const rx = new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')})`, 'gi');
      f = f.replace(rx, '<mark style="background:var(--c);color:var(--bg);border-radius:2px;padding:0 2px">$1</mark>');
    }
    f = f.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/_(.*?)_/g,'<em>$1</em>');
    // Simply return the text with standard pre-wrap. Padding at the bottom of the bubble will reserve space for the time.
    return <span dangerouslySetInnerHTML={{ __html: f }} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />;
  };

  const filteredMessages = messages.filter(m => {
    const svc  = selectedService === 'all' ? true : (m.from_service === selectedService || m.to_service === selectedService);
    const srch = searchQuery.trim() === '' ? true : m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.from_user.toLowerCase().includes(searchQuery.toLowerCase());
    const pin  = showPinnedOnly ? m.is_pinned : true;
    return svc && srch && pin;
  });

  const getSidebarServicesData = () => services.map(svc => {
    const msgs = messages.filter(m =>
      (m.from_service === svc.id && m.to_service === user?.service_id) ||
      (m.from_service === user?.service_id && m.to_service === svc.id) ||
      m.to_service === 'all'
    );
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    return { ...svc, lastMessage: last ? last.content : 'Pas encore de message', lastMsgTime: last ? formatTimeShort(last.timestamp) : '' };
  });

  const formatTimeShort = (ts) => { try { return new Date(ts?.replace(/-/g,'/')).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); } catch { return ''; } };
  const formatDateLabel = (ts) => {
    try {
      const d = new Date(ts?.replace(/-/g,'/')), today = new Date(), yest = new Date(today);
      yest.setDate(yest.getDate()-1);
      if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
      if (d.toDateString() === yest.toDateString()) return 'Hier';
      return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
    } catch { return ''; }
  };

  const getAvatarColor = (name) => {
    let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i) + ((h<<5)-h);
    return `hsl(${Math.abs(h % 360)}, 60%, 45%)`;
  };

  const getSLAInfo = (t) => {
    if (t.status === 'resolved' || t.status === 'closed') return { text: 'SLA respecté', isOver: false, color: 'var(--a)' };
    let h = 24;
    if (t.priority === 'urgent') h = 2; else if (t.priority === 'high') h = 8; else if (t.priority === 'low') h = 48;
    const limit = new Date(t.timestamp?.replace(/-/g,'/')).getTime() + h * 3600000;
    const diff  = limit - nowTime;
    if (diff > 0) {
      const rh = Math.floor(diff / 3600000), rm = Math.floor((diff % 3600000) / 60000);
      return { text: `Reste ${rh}h ${rm}m`, isOver: false, color: diff < 7200000 ? 'var(--c)' : 'var(--b)' };
    }
    const oh = Math.floor(Math.abs(diff) / 3600000), om = Math.floor((Math.abs(diff) % 3600000) / 60000);
    return { text: `Dépassé ${oh}h ${om}m`, isOver: true, color: 'var(--danger)' };
  };

  const emojis = ['👍','❤️','😂','😮','👎','🔥','🚀','✔️'];

  /* ── selected service info */
  const selectedSvc = selectedService === 'all' ? null : services.find(s => s.id === selectedService);
  const convTitle   = selectedService === 'all' ? 'Canal Global' : (selectedSvc?.name || 'Service');

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg)', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <style>{`
        /* Dynamic Theme scoped styles */
        .wa-sidebar-item { display:flex; align-items:center; gap:14px; padding:12px 18px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid var(--border); background: transparent; }
        .wa-sidebar-item:hover { background:var(--card-hover); }
        .wa-sidebar-item.active { background:var(--card); }
        .wa-avatar { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:white; flex-shrink:0; }
        
        /* Bubble aesthetics */
        .wa-bubble { 
          position:relative; 
          padding: 6px 9px 22px 9px; 
          border-radius: 8px; 
          max-width: 85%; 
          font-size: 14.5px; 
          line-height: 1.4; 
          color: var(--text); 
          box-shadow: 0 1px 0.5px rgba(0,0,0,0.13); 
        }
        /* Grouping: Remove border radius on adjacent side */
        .wa-bubble.me { background:var(--b); color: #fff; }
        .wa-bubble.me.first { border-top-right-radius: 0; }
        .wa-bubble.other { background:var(--card); border: 1px solid #ffffff; }
        .wa-bubble.other.first { border-top-left-radius: 0; }
        
        .wa-time { position:absolute; bottom:4px; right:7px; font-size:10px; color:var(--text); opacity: 0.8; }
        .wa-ctx-item { width:100%; text-align:left; background:transparent; border:none; padding:10px 16px; font-size:14px; color:#1e293b; cursor:pointer; display:flex; align-items:center; gap:10px; transition:background 0.1s; font-weight:500; font-family:inherit; }
        .wa-ctx-item:hover { background:#f1f5f9; }
        .hover-scale:hover { transform: scale(1.2); }
        .wa-input-bar { display:flex; align-items:center; gap:10px; padding:10px 16px; background:var(--card); border-top:1px solid var(--border); }
        .wa-input { flex:1; padding:12px 16px; border-radius:8px; background:#ffffff; border:1px solid var(--border); color:#1e293b; font-size:15px; outline:none; transition: border-color 0.2s; }
        .wa-input:focus { border-color: var(--b); }
        .wa-input::placeholder { color:#94a3b8; }
        .wa-send-btn { width:44px; height:44px; border-radius:50%; border:none; background:var(--a); color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background 0.15s; }
        .wa-send-btn:hover { opacity: 0.9; transform: scale(1.05); }
        .wa-icon-btn { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:var(--muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
        .wa-icon-btn:hover { background:var(--card-hover); color:var(--text); }
        .wa-tab { padding:12px 20px; border:none; background:transparent; color:rgba(255,255,255,0.7); font-size:14px; font-weight:600; cursor:pointer; border-bottom:3px solid transparent; transition:all 0.2s; }
        .wa-tab.active { color:#ffffff; border-bottom-color:#ffffff; background: rgba(255,255,255,0.1); }
        .wa-tag { font-size:11px; background:rgba(56, 189, 248, 0.15); color:var(--b); padding:3px 8px; border-radius:6px; font-weight:600; }
        .wa-ticket-row { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.15s; background:transparent; }
        .wa-ticket-row:hover { background:var(--card-hover); }
        .wa-scrollbar::-webkit-scrollbar { width:6px; }
        .wa-scrollbar::-webkit-scrollbar-track { background:transparent; }
        .wa-scrollbar::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
        .wa-scrollbar::-webkit-scrollbar-thumb:hover { background:var(--muted); }
      `}</style>

      {/* ── Top Nav ── */}
      <div style={{ display:'flex', alignItems:'center', background:'transparent', borderBottom:'1px solid rgba(255,255,255,0.1)', flexShrink:0, paddingRight: '20px' }}>
        {onClose && (
           <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '15px 20px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <ArrowLeft size={20} /> Retour
           </button>
        )}
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)', margin: '0 10px' }} />
        <div style={{ display:'flex', alignItems:'center', gap:0, height: '100%' }}>
          <button className={`wa-tab ${activeTab==='chat'?'active':''}`} onClick={()=>setActiveTab('chat')}>
            <MessageSquare size={16} style={{marginRight:6,verticalAlign:'middle'}}/>Messagerie
          </button>
          <button className={`wa-tab ${activeTab==='tickets'?'active':''}`} onClick={()=>setActiveTab('tickets')}>
            <Ticket size={16} style={{marginRight:6,verticalAlign:'middle'}}/>Tickets & Support
          </button>
        </div>
        <div style={{flex:1}}/>
        {activeTab==='tickets' && (
          <button
            onClick={()=>setShowTicketModal(true)}
            style={{ padding:'8px 16px', borderRadius:'20px', border:'none', background:'var(--b)', color:'white', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Plus size={16}/> Nouveau Ticket
          </button>
        )}
      </div>

      {/* ═══════════════ CHAT ═══════════════ */}
      {activeTab === 'chat' && (
        <div style={{ flex:1, display:'flex', overflow:'hidden', background:'var(--bg)' }}>

          {/* ── LEFT sidebar ── */}
          <div style={{ width:360, background:'var(--bg)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
            
            {/* Search */}
            <div style={{ padding:'10px 14px', background:'#ffffff', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', background:'#f8fafc', border: '1px solid #e2e8f0', borderRadius:'8px', padding:'8px 12px', gap:8 }}>
                <Search size={16} style={{color:'#64748b',flexShrink:0}}/>
                <input
                  type="text" placeholder="Rechercher ou démarrer une discussion"
                  value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', color:'#1e293b', fontSize:14, outline:'none' }}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="wa-scrollbar" style={{ flex:1, overflowY:'auto', background:'transparent' }}>
              {/* Global */}
              <div className={`wa-sidebar-item ${selectedService==='all'?'active':''}`} onClick={()=>setSelectedService('all')}>
                <div className="wa-avatar" style={{width:48,height:48,background:'linear-gradient(135deg,#6366f1,#3b82f6)',fontSize:20}}>G</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontWeight:600,color:'var(--text)',fontSize:15}}>Canal Global</span>
                    <span style={{fontSize:12,color:'var(--muted)'}}>{messages.length>0?formatTimeShort(messages[messages.length-1]?.timestamp):''}</span>
                  </div>
                  <p style={{margin:0,fontSize:13,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    Canal ouvert à tous les services
                  </p>
                </div>
              </div>

              {/* Per service */}
              {getSidebarServicesData().map(svc => {
                if (svc.id === user?.service_id) return null;
                const isActive = selectedService === svc.id;
                return (
                  <div key={svc.id} className={`wa-sidebar-item ${isActive?'active':''}`} onClick={()=>setSelectedService(svc.id)}>
                    <div style={{position:'relative'}}>
                      <div className="wa-avatar" style={{width:48,height:48,background:getAvatarColor(svc.name),fontSize:16}}>
                        {svc.name.substring(0,2).toUpperCase()}
                      </div>
                      <div style={{position:'absolute',bottom:0,right:0,width:14,height:14,borderRadius:'50%',border:'2px solid var(--bg)',background:svc.is_online?'var(--a)':'var(--muted)'}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                        <span style={{fontWeight:600,color:'var(--text)',fontSize:15}}>{svc.name}</span>
                        <span style={{fontSize:12,color:'var(--muted)'}}>{svc.lastMsgTime}</span>
                      </div>
                      <p style={{margin:0,fontSize:13,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {svc.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT conversation panel ── */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative' }}>
            
            {/* Chat header */}
            <div style={{ padding:'6px 16px', background:'var(--card)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div className="wa-avatar" style={{
                width:34, height:34,
                background: selectedService==='all' ? 'linear-gradient(135deg,#6366f1,#3b82f6)' : getAvatarColor(selectedSvc?.name||'SV'),
                fontSize:14
              }}>
                {selectedService==='all' ? 'G' : (selectedSvc?.name.substring(0,2).toUpperCase()||'SV')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:'var(--text)',fontSize:14}}>{convTitle}</div>
                <div style={{fontSize:12,color:selectedService!=='all'&&selectedSvc?.is_online?'var(--a)':'var(--muted)',marginTop:1}}>
                  {selectedService==='all' ? 'Ouvert à tous les services' : (selectedSvc?.is_online?'En ligne':'Hors-ligne')}
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="wa-icon-btn" style={{width:32,height:32}}><Search size={16}/></button>
                <button className="wa-icon-btn" style={{width:32,height:32}}><MoreVertical size={16}/></button>
              </div>
            </div>

            {/* Messages area */}
            <div className="wa-scrollbar" style={{ flex:1, overflowY:'auto', padding:'24px 8%', display:'flex', flexDirection:'column', gap:0,
              backgroundImage:"url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>

              {/* Pinned banner */}
              {messages.some(m=>m.is_pinned&&(selectedService==='all'?m.to_service==='all':(m.from_service===selectedService||m.to_service===selectedService))) && (
                <div style={{padding:'10px 16px',background:'var(--card)',borderRadius:8,border:'1px solid #ffffff',marginBottom:12,display:'flex',alignItems:'center',gap:10,fontSize:13,boxShadow:'0 1px 2px rgba(0,0,0,0.05)',backdropFilter:'blur(4px)'}}>
                  <Pin size={14} style={{transform:'rotate(45deg)',color:'var(--c)'}}/>
                  <span style={{color:'var(--text)',fontWeight:600}}>Messages épinglés</span>
                  <span style={{color:'var(--muted)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {messages.filter(m=>m.is_pinned).map(m=>m.content).join(' · ')}
                  </span>
                </div>
              )}

              {filteredMessages.length === 0 ? (
                <div style={{margin:'auto',textAlign:'center',paddingTop:60}}>
                  <div style={{background:'var(--card)',padding:'16px 24px',borderRadius:'16px',border:'1px solid #ffffff',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                    <MessageSquare size={40} style={{color:'var(--b)',marginBottom:12,opacity:0.8}}/>
                    <p style={{color:'var(--muted)',fontSize:15,margin:0}}>Aucun message dans cette conversation.</p>
                  </div>
                </div>
              ) : (
                filteredMessages.map((m, idx) => {
                  const isMine = m.from_user_email === user?.email || m.from_service === user?.service_id;
                  
                  // Logic for grouping adjacent messages
                  const prevM = filteredMessages[idx - 1];
                  const nextM = filteredMessages[idx + 1];
                  
                  const isFirstInGroup = !prevM || prevM.from_service !== m.from_service || prevM.from_user_email !== m.from_user_email || (new Date(m.timestamp).getTime() - new Date(prevM.timestamp).getTime() > 300000);
                  const isLastInGroup  = !nextM || nextM.from_service !== m.from_service || nextM.from_user_email !== m.from_user_email || (new Date(nextM.timestamp).getTime() - new Date(m.timestamp).getTime() > 300000);

                  const showDate = idx === 0 || formatDateLabel(messages[idx-1]?.timestamp) !== formatDateLabel(m.timestamp);
                  const citedMsg = m.reply_to ? messages.find(msg=>msg.id===m.reply_to) : null;
                  
                  const marginB = isLastInGroup ? 10 : 2; // WhatsApp spacing

                  return (
                    <React.Fragment key={m.id}>
                      {showDate && (
                        <div style={{display:'flex',justifyContent:'center',margin:'16px 0'}}>
                          <span style={{background:'var(--card)',color:'var(--muted)',padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,border:'1px solid var(--border)',boxShadow:'0 1px 1px rgba(0,0,0,0.05)'}}>
                            {formatDateLabel(m.timestamp)}
                          </span>
                        </div>
                      )}

                      <div
                        style={{ display:'flex', flexDirection:'column', alignItems:isMine?'flex-end':'flex-start', marginBottom:marginB }}
                      >
                        {(!isMine && isFirstInGroup) && (
                          <div style={{fontSize:12,color:getAvatarColor(m.from_user),fontWeight:600,paddingLeft:4,marginBottom:2,marginTop:4}}>
                            {m.from_user} · <span style={{color:'var(--muted)',fontWeight:400}}>{m.from_service}</span>
                          </div>
                        )}

                        <div style={{position:'relative'}} onContextMenu={(e)=>{
                          e.preventDefault();
                          // Ensure menu stays within window bounds if clicked near right or bottom edges
                          let x = e.clientX;
                          let y = e.clientY;
                          if (window.innerWidth - x < 250) x = window.innerWidth - 250;
                          if (window.innerHeight - y < 350) y = window.innerHeight - 350;
                          setContextMenu({ x, y, message: m, isMine });
                        }}>
                          <div className={`wa-bubble ${isMine?'me':'other'} ${isFirstInGroup?'first':''}`} style={{border:m.is_pinned?'1px solid var(--c)':undefined}}>
                            {/* Pinned indicator */}
                            {m.is_pinned && (
                              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--c)',marginBottom:6,fontWeight:600}}>
                                <Pin size={10} style={{transform:'rotate(45deg)'}}/>Épinglé
                              </div>
                            )}

                            {/* Reply preview */}
                            {citedMsg && (
                              <div style={{background:'var(--card-hover)',borderLeft:'4px solid var(--b)',borderRadius:'6px',padding:'8px 10px',marginBottom:8,fontSize:13}}>
                                <div style={{fontWeight:600,color:'var(--b)',marginBottom:3}}>{citedMsg.from_user}</div>
                                <div style={{color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{citedMsg.content}</div>
                              </div>
                            )}

                            {/* Attachment */}
                            {m.attachment && (
                              <div style={{marginBottom:4,borderRadius:6,overflow:'hidden',maxWidth:260}}>
                                {m.attachment.startsWith('data:image/') ? (
                                  <img src={m.attachment} alt={m.attachment_name||'image'} style={{width:'100%',maxHeight:200,objectFit:'cover',cursor:'zoom-in',display:'block'}} onClick={()=>window.open(m.attachment,'_blank')}/>
                                ) : (
                                  <a href={m.attachment} download={m.attachment_name||'fichier'} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(0,0,0,0.2)',borderRadius:6,color:'#fff',textDecoration:'none',fontSize:14,fontWeight:500}}>
                                    <FileText size={18} style={{color:'var(--b)',flexShrink:0}}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.attachment_name||'Fichier'}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Message text */}
                            <div style={{marginTop: m.attachment ? 4 : 0}}>
                              {renderFormattedText(m.content)}
                            </div>

                            {/* Timestamp */}
                            <span className="wa-time">
                              {formatTimeShort(m.timestamp)}
                              {isMine&&<CheckCheck size={12} style={{marginLeft:4,color:'#fff',verticalAlign:'middle'}}/>}
                            </span>
                          </div>
                        </div>

                        {/* Reaction counts */}
                        {m.reactions && m.reactions.length > 0 && (
                          <div style={{display:'flex',flexWrap:'wrap',gap:4,paddingLeft:4,marginTop:1,marginBottom:4}}>
                            {Object.entries(m.reactions.reduce((a,c)=>{a[c.emoji]=(a[c.emoji]||0)+1;return a},{})).map(([e,cnt])=>(
                              <span key={e} onClick={()=>reactToMessage(m.id,e)} style={{fontSize:12,background:'var(--card)',padding:'2px 8px',borderRadius:12,border:'1px solid var(--border)',cursor:'pointer',color:'var(--text)',boxShadow:'0 1px 1px rgba(0,0,0,0.05)'}}>
                                {e} <b style={{fontSize:11,color:'var(--muted)'}}>{cnt}</b>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing indicators */}
              {typers.filter(t=>t.from_service===selectedService||(selectedService==='all'&&t.to_service==='all')).length>0 && (
                <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:4,marginTop:4,marginBottom:8}}>
                  <div style={{display:'flex',gap:4,background:'var(--card)',border:'1px solid var(--border)',padding:'8px 12px',borderRadius:'16px',boxShadow:'0 1px 1px rgba(0,0,0,0.05)'}}>
                    {[0.1,0.2,0.3].map(d=>(
                      <span key={d} className="animate-bounce" style={{width:6,height:6,borderRadius:'50%',background:'var(--muted)',animationDelay:`${d}s`,display:'inline-block'}}/>
                    ))}
                  </div>
                  <span style={{fontSize:12,color:'var(--muted)',fontStyle:'italic'}}>
                    {typers.filter(t=>t.from_service===selectedService||(selectedService==='all'&&t.to_service==='all')).map(t=>t.user_name).join(', ')} écrit...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef}/>
            </div>

            {/* ── Reply banner */}
            {replyingTo && (
              <div style={{padding:'10px 20px',background:'var(--card)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,fontSize:14}}>
                <div style={{flex:1,borderLeft:'4px solid var(--b)',paddingLeft:12}}>
                  <div style={{color:'var(--b)',fontWeight:600,marginBottom:2}}>{replyingTo.from_user}</div>
                  <div style={{color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70ch'}}>{replyingTo.content}</div>
                </div>
                <button onClick={()=>setReplyingTo(null)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer'}}><X size={18}/></button>
              </div>
            )}

            {/* ── Attachment preview */}
            {attachment && (
              <div style={{padding:'10px 20px',background:'var(--card)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,fontSize:14}}>
                {attachment.type.startsWith('image/')?<Image size={18} style={{color:'var(--a)'}}/>:<FileText size={18} style={{color:'var(--b)'}}/>}
                <span style={{flex:1,fontWeight:500,color:'var(--text)'}}>{attachment.name}</span>
                <button onClick={()=>setAttachment(null)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer'}}><X size={18}/></button>
              </div>
            )}

            {/* ── Input bar */}
            <div className="wa-input-bar">
              {/* Emoji */}
              <div style={{position:'relative'}}>
                <button className="wa-icon-btn" onClick={()=>setShowEmojiPicker(!showEmojiPicker)}><Smile size={24}/></button>
                {showEmojiPicker && (
                  <div style={{position:'absolute',bottom:54,left:0,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:12,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,boxShadow:'0 8px 30px rgba(0,0,0,0.5)',zIndex:50,backdropFilter:'blur(10px)'}}>
                    {emojis.map(e=>(
                      <span key={e} style={{fontSize:24,cursor:'pointer',textAlign:'center',padding:4}} onClick={()=>{setChatInput(p=>p+e);setShowEmojiPicker(false)}}>{e}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* File */}
              <label className="wa-icon-btn" style={{cursor:'pointer'}}>
                <Paperclip size={24}/>
                <input type="file" onChange={handleFileChange} style={{display:'none'}}/>
              </label>

              {/* Text */}
              <input
                className="wa-input"
                type="text"
                placeholder="Tapez un message"
                value={chatInput}
                onChange={handleChatInputChange}
                onKeyPress={e=>e.key==='Enter'&&sendChatMessage()}
              />

              {/* Send */}
              <button className="wa-send-btn" onClick={sendChatMessage}>
                <Send size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TICKETS ═══════════════ */}
      {activeTab === 'tickets' && !selectedTicket && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background: 'var(--bg)' }}>

          {/* Filters bar */}
          <div style={{ padding:'12px 24px', background:'var(--card)', borderBottom:'1px solid var(--border)', display:'flex', gap:14, alignItems:'center', flexShrink:0 }}>
            <Filter size={16} style={{color:'var(--muted)'}}/>
            <select value={ticketPriorityFilter} onChange={e=>setTicketPriorityFilter(e.target.value)}
              style={{padding:'8px 12px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,outline:'none',fontWeight:500}}>
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgente</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <select value={ticketServiceFilter} onChange={e=>setTicketServiceFilter(e.target.value)}
              style={{padding:'8px 12px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,outline:'none',fontWeight:500}}>
              <option value="all">Tous les services</option>
              {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{flex:1}}/>
            <span style={{fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
              <Sparkles size={14} style={{color:'var(--b)'}}/>Auto-SLA actif
            </span>
          </div>

          {/* Ticket list */}
          <div className="wa-scrollbar" style={{ flex:1, overflowY:'auto' }}>
            {tickets.filter(t=>{
              if (ticketPriorityFilter!=='all'&&t.priority!==ticketPriorityFilter) return false;
              if (ticketServiceFilter!=='all'&&t.from_service!==ticketServiceFilter&&t.to_service!==ticketServiceFilter) return false;
              return true;
            }).map(t=>{
              const sla = getSLAInfo(t);
              return (
                <div key={t.id} className="wa-ticket-row" onClick={()=>setSelectedTicket(t)}>
                  {/* Priority stripe */}
                  <div style={{width:4,height:44,borderRadius:4,background:getPriorityTextColor(t.priority),flexShrink:0}}/>

                  {/* Avatar */}
                  <div className="wa-avatar" style={{width:44,height:44,background:getAvatarColor(t.from_user||'?'),fontSize:16,flexShrink:0}}>
                    {(t.from_user||'?').substring(0,2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontWeight:600,color:'var(--text)',fontSize:15,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'55%'}}>{t.title}</span>
                      <span style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap'}}>{formatDateLabel(t.timestamp)} {formatTimeShort(t.timestamp)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'var(--muted)'}}>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'50%'}}>{t.from_service} → {t.to_service}</span>
                      {t.tags&&t.tags.slice(0,2).map(tag=><span key={tag} className="wa-tag">#{tag}</span>)}
                    </div>
                  </div>

                  {/* Status & SLA */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                    <span style={{padding:'4px 12px',borderRadius:16,fontSize:12,fontWeight:600,background:getStatusBgColor(t.status),color:getStatusColor(t.status)}}>
                      {getStatusLabel(t.status)}
                    </span>
                    <span style={{fontSize:12,fontWeight:600,color:sla.color}}>{sla.text}</span>
                  </div>
                </div>
              );
            })}

            {tickets.length===0 && (
              <div style={{textAlign:'center',padding:'80px 20px',color:'var(--muted)'}}>
                <div style={{background:'var(--card)',display:'inline-block',padding:'40px 60px',borderRadius:'16px',border:'1px solid #ffffff',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <Ticket size={56} style={{opacity:0.5,marginBottom:16,color:'var(--muted)'}}/>
                  <p style={{margin:0,fontSize:16,fontWeight:500,color:'var(--text)'}}>Aucun ticket trouvé</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TICKET DETAIL ═══════════════ */}
      {activeTab==='tickets' && selectedTicket && (
        <div style={{ flex:1, display:'flex', overflow:'hidden', background:'var(--bg)' }}>

          {/* Left: conversation thread */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)', background:'transparent' }}>
            
            {/* Header */}
            <div style={{ padding:'16px 24px', background:'var(--card)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
              <button onClick={()=>setSelectedTicket(null)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:14,fontWeight:600}}>
                <ChevronLeft size={20}/>Retour
              </button>
              <div style={{flex:1,minWidth:0,borderLeft:'1px solid var(--border)',paddingLeft:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,background:getPriorityBgColor(selectedTicket.priority),color:getPriorityTextColor(selectedTicket.priority),padding:'3px 10px',borderRadius:6,textTransform:'uppercase'}}>
                    {selectedTicket.priority}
                  </span>
                  <span style={{fontSize:13,color:'var(--muted)',fontWeight:500}}>#{selectedTicket.id}</span>
                  <span style={{fontSize:12,fontWeight:600,color:getSLAInfo(selectedTicket).color,display:'flex',alignItems:'center',gap:4}}>
                    <Clock size={12}/>{getSLAInfo(selectedTicket).text}
                  </span>
                  {selectedTicket.tags&&selectedTicket.tags.map(tag=><span key={tag} className="wa-tag">#{tag}</span>)}
                </div>
                <h3 style={{margin:0,fontSize:18,color:'var(--text)',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedTicket.title}</h3>
              </div>
            </div>

            {/* Thread */}
            <div className="wa-scrollbar" style={{ flex:1, overflowY:'auto', padding:'24px' }}>
              {/* Original message */}
              <div style={{background:'var(--card)',border:'1px solid #ffffff',borderRadius:12,padding:'16px 20px',marginBottom:24}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,fontSize:13,color:'var(--muted)'}}>
                  <span>De <b style={{color:'var(--text)'}}>{selectedTicket.from_user}</b> ({services.find(s=>s.id===selectedTicket.from_service)?.name||selectedTicket.from_service})</span>
                  <span>{selectedTicket.timestamp}</span>
                </div>
                <p style={{margin:0,color:'var(--text)',whiteSpace:'pre-wrap',lineHeight:1.6,fontSize:15}}>{selectedTicket.content}</p>
              </div>

              {/* Rating display */}
              {selectedTicket.rating && (
                <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:16,marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--a)',fontWeight:700,fontSize:14,marginBottom:8}}><Award size={16}/>Évaluation de satisfaction</div>
                  <div style={{display:'flex',gap:4,marginBottom:6}}>{[1,2,3,4,5].map(s=><Star key={s} size={18} fill={s<=selectedTicket.rating?'var(--c)':'none'} color={s<=selectedTicket.rating?'var(--c)':'var(--border)'}/>)}</div>
                  {selectedTicket.rating_comment&&<p style={{margin:0,fontSize:14,color:'var(--muted)',fontStyle:'italic'}}>"{selectedTicket.rating_comment}"</p>}
                </div>
              )}

              {/* Rating form */}
              {(selectedTicket.status==='resolved'||selectedTicket.status==='closed')&&selectedTicket.from_user_email===user?.email&&!selectedTicket.rating&&(
                <div style={{background:'rgba(56,189,248,0.1)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:12,padding:20,marginBottom:20,display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--b)',fontWeight:700,fontSize:14}}><Star size={16}/>Évaluer la résolution</div>
                  <div style={{display:'flex',gap:10}}>{[1,2,3,4,5].map(s=><Star key={s} size={26} style={{cursor:'pointer',transition:'all 0.1s'}} fill={s<=ratingStars?'var(--c)':'none'} color={s<=ratingStars?'var(--c)':'var(--border)'} onClick={()=>setRatingStars(s)}/>)}</div>
                  <input type="text" placeholder="Commentaire (facultatif)..." value={ratingComment} onChange={e=>setRatingComment(e.target.value)} style={{padding:'10px 14px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text)',fontSize:14,outline:'none'}}/>
                  <button onClick={submitRating} disabled={submittingRating} style={{alignSelf:'flex-start',padding:'8px 20px',borderRadius:8,border:'none',background:'var(--b)',color:'white',fontWeight:600,fontSize:14,cursor:'pointer'}}>
                    {submittingRating?<Loader2 size={16} className="animate-spin"/>:"Soumettre"}
                  </button>
                </div>
              )}

              {/* Comments */}
              <div style={{color:'var(--muted)',fontSize:13,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:10,fontWeight:600}}>
                Fil de discussion — {selectedTicket.comments?.length||0} commentaire(s)
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {!selectedTicket.comments||selectedTicket.comments.length===0?(
                  <p style={{textAlign:'center',color:'var(--muted)',fontSize:14,padding:'20px 0'}}>Pas encore de réponse.</p>
                ):(
                  selectedTicket.comments.map(c=>(
                    <div key={c.id} style={{display:'flex',gap:14}}>
                      <div className="wa-avatar" style={{width:38,height:38,background:getAvatarColor(c.user),fontSize:14,flexShrink:0}}>{c.user.substring(0,2).toUpperCase()}</div>
                      <div style={{flex:1,background:'var(--card)',border:'1px solid #ffffff',borderRadius:12,padding:'12px 16px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
                          <span style={{fontWeight:700,color:'var(--text)'}}>{c.user}</span>
                          <span style={{color:'var(--muted)'}}>{c.timestamp}</span>
                        </div>
                        <div style={{color:'var(--text)',fontSize:14,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{c.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment input */}
            <div style={{ padding:'16px 24px', background:'var(--card)', borderTop:'1px solid var(--border)', display:'flex', gap:12, flexShrink:0 }}>
              <textarea
                placeholder="Écrire une réponse..."
                value={newComment} onChange={e=>setNewComment(e.target.value)}
                style={{ flex:1, padding:'12px 16px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)', outline:'none', height:48, minHeight:48, maxHeight:120, fontFamily:'inherit', fontSize:14, resize:'vertical', boxShadow:'0 1px 2px rgba(0,0,0,0.02)' }}
              />
              <button onClick={submitComment} disabled={submittingComment||!newComment.trim()}
                style={{ padding:'0 24px', borderRadius:12, border:'none', background:'var(--b)', color:'white', fontWeight:600, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>
                {submittingComment?<Loader2 size={18} className="animate-spin"/>:<><Send size={18}/> Répondre</>}
              </button>
            </div>
          </div>

          {/* Right: ticket metadata */}
          <div style={{ width:300, background:'var(--bg)', padding:24, display:'flex', flexDirection:'column', gap:24, overflowY:'auto' }} className="wa-scrollbar">
            
            {/* Status */}
            <div>
              <p style={{fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 8px',fontWeight:600}}>Statut</p>
              <span style={{padding:'6px 16px',borderRadius:20,fontSize:13,fontWeight:700,background:getStatusBgColor(selectedTicket.status),color:getStatusColor(selectedTicket.status),display:'inline-block'}}>
                {getStatusLabel(selectedTicket.status)}
              </span>
            </div>

            {/* Assignment */}
            <div>
              <p style={{fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 8px',fontWeight:600}}>Assigné à</p>
              {user?.role==='admin'||user?.role==='super_admin'?(
                <select value={selectedTicket.assigned_to||''} onChange={e=>assignTicket(selectedTicket.id,e.target.value)}
                  style={{width:'100%',padding:'10px 12px',borderRadius:8,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,outline:'none',fontWeight:500}}>
                  <option value="">Non assigné</option>
                  {usersList.map(u=><option key={u.email} value={u.email}>{u.name} ({u.service})</option>)}
                </select>
              ):(
                <div style={{fontSize:14,color:'var(--text)',display:'flex',alignItems:'center',gap:8,fontWeight:500,padding:'8px 12px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8}}><User size={16} style={{color:'var(--muted)'}}/>{selectedTicket.assigned_name||'Non assigné'}</div>
              )}
            </div>

            {/* Actions */}
            <div>
              <p style={{fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 10px',fontWeight:600}}>Actions</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {selectedTicket.status==='open'&&(
                  <button onClick={()=>updateTicketStatus(selectedTicket.id,'in_progress')} style={{padding:'10px',borderRadius:8,border:'1px solid rgba(56,189,248,0.3)',background:'rgba(56,189,248,0.1)',color:'var(--b)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'background 0.2s'}}>
                    Prendre en charge
                  </button>
                )}
                {selectedTicket.status!=='resolved'&&selectedTicket.status!=='closed'&&(
                  <button onClick={()=>updateTicketStatus(selectedTicket.id,'resolved')} style={{padding:'10px',borderRadius:8,border:'1px solid rgba(34,197,94,0.3)',background:'rgba(34,197,94,0.1)',color:'var(--a)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'background 0.2s'}}>
                    Marquer comme Résolu
                  </button>
                )}
                {selectedTicket.status!=='closed'&&(
                  <button onClick={()=>updateTicketStatus(selectedTicket.id,'closed')} style={{padding:'10px',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.1)',color:'var(--danger)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'background 0.2s'}}>
                    Fermer le ticket
                  </button>
                )}
              </div>
            </div>

            {/* Activity timeline */}
            <div style={{flex:1}}>
              <p style={{fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 12px',fontWeight:600}}>Activité</p>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {selectedTicket.activities?.map((act,i)=>(
                  <div key={i} style={{display:'flex',gap:10,fontSize:12}}>
                    <Clock size={12} style={{marginTop:3,color:'var(--muted)',flexShrink:0}}/>
                    <div style={{color:'var(--muted)',lineHeight:1.4}}>
                      {act.type==='creation'&&<span>Créé par <b style={{color:'var(--text)'}}>{act.user}</b></span>}
                      {act.type==='status_change'&&<span>Statut → <b style={{color:'var(--text)'}}>{getStatusLabel(act.to)}</b> par {act.user}</span>}
                      {act.type==='assignment'&&<span>Assigné à <b style={{color:'var(--text)'}}>{act.assigned_to}</b> par {act.user}</span>}
                      {act.type==='rating'&&<span>Évalué <b style={{color:'var(--c)'}}>{act.rating}/5 ★</b> par {act.user}</span>}
                      <div style={{fontSize:11,color:'var(--muted)',opacity:0.7,marginTop:4}}>{act.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: New Ticket ═══════════════ */}
      {showTicketModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,backdropFilter:'blur(4px)' }}>
          <div style={{ background:'var(--bg)',borderRadius:16,padding:32,width:'100%',maxWidth:560,border:'1px solid var(--border)', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY:'auto' }} className="wa-scrollbar">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h3 style={{margin:0,fontSize:20,color:'var(--text)',display:'flex',alignItems:'center',gap:10,fontWeight:700}}><Ticket size={24} style={{color:'var(--b)'}}/>Nouveau Ticket de Support</h3>
              <button onClick={()=>setShowTicketModal(false)} style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',cursor:'pointer',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}><X size={18}/></button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              <div>
                <label style={{display:'block',fontSize:13,color:'var(--muted)',marginBottom:6,fontWeight:600}}>Sujet *</label>
                <input type="text" placeholder="ex: Problème de pointage" value={tkTitle} onChange={e=>setTkTitle(e.target.value)}
                  style={{width:'100%',padding:'12px 16px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',outline:'none',fontSize:15,boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'flex',gap:16}}>
                <div style={{flex:1}}>
                  <label style={{display:'block',fontSize:13,color:'var(--muted)',marginBottom:6,fontWeight:600}}>Service destinataire *</label>
                  <select value={tkDest} onChange={e=>setTkDest(e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',color:tkDest?'var(--text)':'var(--muted)',outline:'none',fontSize:15,boxSizing:'border-box'}}>
                    <option value="">Sélectionner...</option>
                    {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block',fontSize:13,color:'var(--muted)',marginBottom:6,fontWeight:600}}>Priorité</label>
                  <select value={tkPriority} onChange={e=>setTkPriority(e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',outline:'none',fontSize:15,boxSizing:'border-box'}}>
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:13,color:'var(--muted)',marginBottom:6,fontWeight:600}}>Étiquettes</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
                  {tkTags.map(tag=><span key={tag} className="wa-tag" style={{cursor:'pointer',fontSize:12,padding:'4px 10px'}} onClick={()=>setTkTags(tkTags.filter(t=>t!==tag))}>#{tag} <X size={10} style={{marginLeft:4}}/></span>)}
                </div>
                <div style={{display:'flex',gap:10}}>
                  <input type="text" placeholder="Ajouter un tag..." value={newTagInput} onChange={e=>setNewTagInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleAddTag()}
                    style={{flex:1,padding:'10px 14px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',outline:'none',fontSize:14}}/>
                  <button onClick={handleAddTag} style={{padding:'10px 18px',borderRadius:10,border:'none',background:'rgba(56,189,248,0.2)',color:'var(--b)',fontSize:14,fontWeight:700,cursor:'pointer'}}>Ajouter</button>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:13,color:'var(--muted)',marginBottom:6,fontWeight:600}}>Description *</label>
                <textarea placeholder="Décrivez votre problème..." value={tkContent} onChange={e=>setTkContent(e.target.value)}
                  style={{width:'100%',padding:'14px 16px',borderRadius:10,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',outline:'none',minHeight:120,resize:'vertical',fontFamily:'inherit',fontSize:15,boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
                <button onClick={()=>setShowTicketModal(false)} style={{padding:'10px 20px',borderRadius:10,border:'1px solid var(--border)',background:'transparent',color:'var(--text)',cursor:'pointer',fontSize:14,fontWeight:600}}>Annuler</button>
                <button onClick={createTicket} disabled={submitting} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'var(--b)',color:'white',fontWeight:700,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',gap:8}}>
                  {submitting?<Loader2 size={16} className="animate-spin"/>:<><Send size={16}/>Soumettre</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════ CONTEXT MENU ═══════════════ */}
      {contextMenu && (
        <div style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 100000,
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: '180px', overflow: 'hidden'
        }} onClick={(e)=>e.stopPropagation()}>
          <div style={{padding:'10px 12px', display:'flex', gap:'12px', borderBottom:'1px solid #e2e8f0', justifyContent:'center', background:'#f8fafc'}}>
             {['👍','❤️','😂','😮','😢','🙏'].map(e=>(
               <span key={e} style={{cursor:'pointer', fontSize:'20px', transition:'transform 0.1s', display:'inline-block'}} className="hover-scale" onClick={()=>{reactToMessage(contextMenu.message.id, e); setContextMenu(null);}}>{e}</span>
             ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',padding:'4px 0'}}>
            <button className="wa-ctx-item" onClick={() => { setReplyingTo(contextMenu.message); setContextMenu(null); }}><CornerUpLeft size={16}/> Répondre</button>
            <button className="wa-ctx-item" onClick={() => { navigator.clipboard.writeText(contextMenu.message.content); setContextMenu(null); }}><FileText size={16}/> Copier le texte</button>
            <button className="wa-ctx-item" onClick={() => { togglePinMessage(contextMenu.message.id); setContextMenu(null); }}><Pin size={16}/> {contextMenu.message.is_pinned ? 'Désépingler' : 'Épingler'}</button>
            <button className="wa-ctx-item" onClick={() => { setContextMenu(null); }}><Share size={16}/> Partager</button>
            {contextMenu.isMine && <button className="wa-ctx-item" onClick={() => { setContextMenu(null); }}><Edit2 size={16}/> Modifier</button>}
            <button className="wa-ctx-item" style={{color:'var(--danger)'}} onClick={() => { setContextMenu(null); }}><Trash2 size={16}/> Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}
