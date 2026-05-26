import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { 
  MessageSquare, Ticket, Send, Plus, CheckCircle, XCircle, Loader2, 
  Paperclip, Smile, Reply, Search, X, Clock, User, Filter, AlertTriangle, 
  Check, ChevronRight, HelpCircle, UserPlus, Image, FileText, CornerUpLeft, 
  Pin, Star, ThumbsUp, Sparkles, Hash, ArrowRight, ShieldAlert, Award
} from 'lucide-react';

export default function Communication() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'tickets'
  const [services, setServices] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [selectedService, setSelectedService] = useState('all'); // service_id or 'all'
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typers, setTypers] = useState([]); // list of typing users
  
  // Advanced Chat features
  const [replyingTo, setReplyingTo] = useState(null); // message object
  const [attachment, setAttachment] = useState(null); // { name, type, data }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  
  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  // New ticket form
  const [tkTitle, setTkTitle] = useState('');
  const [tkContent, setTkContent] = useState('');
  const [tkDest, setTkDest] = useState('');
  const [tkPriority, setTkPriority] = useState('medium');
  const [tkTags, setTkTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tickets filters
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketServiceFilter, setTicketServiceFilter] = useState('all');

  // Ticket comment form
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Ticket satisfaction rating
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // SLA current time tracking for countdown ticks
  const [nowTime, setNowTime] = useState(Date.now());

  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // Synthesize soft message chime
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('AudioContext sound failed', e);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, replyingTo, typers]);

  // Keep SLA timer ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  // Initial loads
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const sRes = await apiCall('get_services_list', {}, 'GET');
        if (sRes.success && sRes.services) {
          setServices(sRes.services);
        }
        
        const uRes = await apiCall('get_all_users', {}, 'GET');
        if (uRes.success && uRes.users) {
          setUsersList(Object.entries(uRes.users).map(([email, u]) => ({
            email,
            name: u.name,
            service: u.service,
            service_id: u.service_id
          })));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitialData();
  }, []);

  // Message polling
  const loadMessages = async (isFirstLoad = false) => {
    try {
      const res = await apiCall('get_inter_service_messages', {}, 'GET');
      if (res.success && res.messages) {
        setMessages(res.messages);
        if (res.typers) {
          setTypers(res.typers);
        }
        
        if (!isFirstLoad && res.messages.length > prevMessagesLength.current) {
          const lastMsg = res.messages[res.messages.length - 1];
          if (lastMsg.from_user_email !== user?.email && lastMsg.from_service !== user?.service) {
            playNotificationSound();
          }
        }
        prevMessagesLength.current = res.messages.length;
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ticket polling
  const loadTickets = async () => {
    try {
      const res = await apiCall('get_tickets', {}, 'GET');
      if (res.success && res.tickets) {
        setTickets(res.tickets);
        if (selectedTicket) {
          const updated = res.tickets.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      loadMessages(true);
      const interval = setInterval(() => loadMessages(false), 3000);
      return () => clearInterval(interval);
    } else {
      loadTickets();
      const interval = setInterval(loadTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Handle typing state broadcast
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

  // Chat message sending
  const sendChatMessage = async () => {
    if (!chatInput.trim() && !attachment) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    apiCall('set_typing_status', { to_service: selectedService, is_typing: false });
    
    try {
      const payload = {
        content: chatInput,
        to_service: selectedService,
        reply_to: replyingTo ? replyingTo.id : '',
        attachment: attachment ? attachment.data : '',
        attachment_name: attachment ? attachment.name : ''
      };
      
      const res = await apiCall('send_inter_service_message', payload);
      if (res.success) {
        setChatInput('');
        setReplyingTo(null);
        setAttachment(null);
        loadMessages();
      } else {
        alert(res.message || "Erreur lors de l'envoi");
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  // Reactions
  const reactToMessage = async (messageId, emoji) => {
    try {
      const res = await apiCall('react_to_message', { message_id: messageId, emoji });
      if (res.success) {
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Star / Pin Message
  const togglePinMessage = async (messageId) => {
    try {
      const res = await apiCall('toggle_pin_message', { message_id: messageId });
      if (res.success) {
        loadMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Tickets handlers
  const createTicket = async () => {
    if (!tkTitle.trim() || !tkContent.trim() || !tkDest.trim()) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiCall('create_ticket', {
        title: tkTitle,
        content: tkContent,
        to_service: tkDest,
        priority: tkPriority,
        tags: tkTags
      });
      if (res.success) {
        setShowTicketModal(false);
        setTkTitle('');
        setTkContent('');
        setTkDest('');
        setTkPriority('medium');
        setTkTags([]);
        loadTickets();
      } else {
        alert(res.message || "Erreur");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const res = await apiCall('update_ticket_status', { ticket_id: ticketId, status });
      if (res.success) {
        loadTickets();
      } else {
        alert("Erreur de mise à jour");
      }
    } catch (e) {
      alert("Erreur réseau");
    }
  };

  const assignTicket = async (ticketId, userEmail) => {
    const assignedUser = usersList.find(u => u.email === userEmail);
    const assignedName = assignedUser ? assignedUser.name : userEmail;
    try {
      const res = await apiCall('assign_ticket', {
        ticket_id: ticketId,
        assigned_to: userEmail,
        assigned_name: assignedName
      });
      if (res.success) {
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    setSubmittingComment(true);
    try {
      const res = await apiCall('add_ticket_comment', {
        ticket_id: selectedTicket.id,
        content: newComment
      });
      if (res.success) {
        setNewComment('');
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const submitRating = async () => {
    if (!selectedTicket) return;
    setSubmittingRating(true);
    try {
      const res = await apiCall('rate_ticket', {
        ticket_id: selectedTicket.id,
        rating: ratingStars,
        comment: ratingComment
      });
      if (res.success) {
        setRatingComment('');
        setRatingStars(5);
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    if (ticketId) {
      await updateTicketStatus(ticketId, targetStatus);
    }
  };

  // Add tag helper
  const handleAddTag = () => {
    const cleanTag = newTagInput.trim().replace(/^#/, '');
    if (cleanTag && !tkTags.includes(cleanTag)) {
      setTkTags([...tkTags, cleanTag]);
      setNewTagInput('');
    }
  };

  // File upload reader
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 5 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        name: file.name,
        type: file.type,
        data: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Formatting rich text function safely
  const renderFormattedText = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Starred terms highlighted if query matched
    if (searchQuery.trim() !== '') {
      const regex = new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      formatted = formatted.replace(regex, '<mark style="background:#fcd34d;color:#0f0f18;border-radius:2px;padding:0 2px">$1</mark>');
    }

    // Bold formatting: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic formatting: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Filtering messages
  const filteredMessages = messages.filter(m => {
    const matchesService = selectedService === 'all' 
      ? true 
      : (m.from_service === selectedService || m.to_service === selectedService);
      
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.from_user.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPinned = showPinnedOnly ? m.is_pinned : true;
        
    return matchesService && matchesSearch && matchesPinned;
  });

  const getSidebarServicesData = () => {
    return services.map(svc => {
      const serviceMsgs = messages.filter(m => 
        (m.from_service === svc.id && m.to_service === user?.service_id) ||
        (m.from_service === user?.service_id && m.to_service === svc.id) ||
        (m.to_service === 'all')
      );
      
      const lastMsg = serviceMsgs.length > 0 ? serviceMsgs[serviceMsgs.length - 1] : null;
      return {
        ...svc,
        lastMessage: lastMsg ? lastMsg.content : 'Pas encore de message',
        lastMsgTime: lastMsg ? formatTimeShort(lastMsg.timestamp) : ''
      };
    });
  };

  const formatTimeShort = (tsString) => {
    if (!tsString) return '';
    try {
      const d = new Date(tsString.replace(/-/g, '/'));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDateLabel = (tsString) => {
    if (!tsString) return '';
    try {
      const d = new Date(tsString.replace(/-/g, '/'));
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (d.toDateString() === today.toDateString()) {
        return "Aujourd'hui";
      } else if (d.toDateString() === yesterday.toDateString()) {
        return "Hier";
      } else {
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 40%)`;
  };

  const getTicketsByStatus = (status) => {
    return tickets.filter(t => {
      if (t.status !== status) return false;
      if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false;
      if (ticketServiceFilter !== 'all') {
        if (t.from_service !== ticketServiceFilter && t.to_service !== ticketServiceFilter) return false;
      }
      return true;
    });
  };

  // SLA Computations
  const getSLAInfo = (ticket) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return { text: "SLA respecté", isOver: false, color: '#10b981' };
    }
    
    let hoursAllowed = 24;
    if (ticket.priority === 'urgent') hoursAllowed = 2;
    else if (ticket.priority === 'high') hoursAllowed = 8;
    else if (ticket.priority === 'low') hoursAllowed = 48;
    
    const createdTime = new Date(ticket.timestamp.replace(/-/g, '/')).getTime();
    const limitTime = createdTime + hoursAllowed * 60 * 60 * 1000;
    const diff = limitTime - nowTime;
    
    if (diff > 0) {
      const remainingHours = Math.floor(diff / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { 
        text: `Reste ${remainingHours}h ${remainingMinutes}m`, 
        isOver: false, 
        color: diff < 2 * 60 * 60 * 1000 ? '#f97316' : '#3b82f6' // warning color if under 2 hours
      };
    } else {
      const overTime = Math.abs(diff);
      const overHours = Math.floor(overTime / (1000 * 60 * 60));
      const overMinutes = Math.floor((overTime % (1000 * 60 * 60)) / (1000 * 60));
      return { 
        text: `Dépassé de ${overHours}h ${overMinutes}m`, 
        isOver: true, 
        color: '#ef4444' 
      };
    }
  };

  const emojis = ['👍', '❤️', '😂', '😮', '👎', '🔥', '🚀', '✔️'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', padding: '10px 20px', gap: '15px' }}>
      
      <style>{`
        /* Custom Modern Premium Theme Styles */
        .tab-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.06);
          color: white;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, var(--primary, #6366f1) 0%, #4f46e5 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
        }
        .chat-sidebar-item {
          padding: 14px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.01);
          border: 1px solid transparent;
        }
        .chat-sidebar-item:hover {
          background: rgba(255,255,255,0.04);
        }
        .chat-sidebar-item.selected {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .message-bubble {
          position: relative;
          padding: 10px 14px;
          border-radius: 16px;
          max-width: 70%;
          line-height: 1.45;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s ease;
        }
        .message-bubble:hover {
          transform: translateY(-1px);
        }
        .reactions-bar {
          position: absolute;
          top: -32px;
          right: 10px;
          background: #1e1e2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex;
          gap: 4px;
          padding: 3px 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          z-index: 10;
        }
        .reaction-emoji {
          padding: 2px 5px;
          cursor: pointer;
          border-radius: 50%;
          font-size: 14px;
          transition: transform 0.1s ease;
        }
        .reaction-emoji:hover {
          transform: scale(1.3);
        }
        .kanban-col {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          backdrop-filter: blur(8px);
        }
        .kanban-header {
          padding: 14px 18px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kanban-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 15px;
          cursor: grab;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 12px;
        }
        .kanban-card:active {
          cursor: grabbing;
          opacity: 0.6;
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          background: rgba(255,255,255,0.05);
        }
        .emoji-popover {
          position: absolute;
          bottom: 75px;
          right: 20px;
          background: #1f1f2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          z-index: 50;
        }
        .tag-badge {
          font-size: 10px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
        }
      `}</style>

      {/* Top Header / Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={18} />
            Messagerie Inter-Services
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={18} />
            Centre de Tickets & Support
          </button>
        </div>
        
        {activeTab === 'tickets' && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowTicketModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
          >
            <Plus size={18} /> Nouveau Ticket
          </button>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0, border: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* --- CHAT MODULE --- */}
        {activeTab === 'chat' && (
          <>
            {/* Sidebar */}
            <div style={{ width: '320px', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
              
              {/* Search contacts bar */}
              <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: 'rgba(255,255,255,0.4)' }} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', padding: '9px 12px 9px 38px', borderRadius: '10px', 
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', 
                      color: 'white', fontSize: '14px', outline: 'none' 
                    }}
                  />
                </div>

                {/* Pin Filter toggle */}
                <button 
                  className={`tab-btn`} 
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  style={{ 
                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', 
                    background: showPinnedOnly ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    borderColor: showPinnedOnly ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    justifyContent: 'center'
                  }}
                >
                  <Pin size={13} style={{ transform: 'rotate(45deg)' }} />
                  {showPinnedOnly ? 'Messages épinglés uniquement' : 'Afficher les épinglés'}
                </button>
              </div>

              {/* Sidebar list items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {/* Global Chat contact */}
                <div 
                  className={`chat-sidebar-item ${selectedService === 'all' ? 'selected' : ''}`}
                  onClick={() => setSelectedService('all')}
                >
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '10px', 
                    background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '18px'
                  }}>
                    G
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>Chat Global (Tous)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Canal ouvert à tous les services
                    </p>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />

                {/* Individual services */}
                {getSidebarServicesData().map((svc) => {
                  if (svc.id === user?.service_id) return null;
                  return (
                    <div 
                      key={svc.id}
                      className={`chat-sidebar-item ${selectedService === svc.id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(svc.id)}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: '42px', height: '42px', borderRadius: '10px', 
                          background: getAvatarColor(svc.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: '15px'
                        }}>
                          {svc.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          border: '2px solid #0f0f18',
                          background: svc.is_online ? '#10b981' : '#6b7280'
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 500, color: 'white', fontSize: '14px' }}>{svc.name}</span>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{svc.lastMsgTime}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {svc.lastMessage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation Window */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.05)' }}>
              
              {/* Header */}
              <div style={{ 
                padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.15)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: selectedService === 'all' ? 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)' : getAvatarColor(services.find(s => s.id === selectedService)?.name || 'SV'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold'
                  }}>
                    {selectedService === 'all' ? 'G' : (services.find(s => s.id === selectedService)?.name.substring(0, 2).toUpperCase() || 'SV')}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'white', fontWeight: 600 }}>
                      {selectedService === 'all' ? 'Canal Global' : (services.find(s => s.id === selectedService)?.name || 'Service')}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      {selectedService === 'all' ? (
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ouvert à tous</span>
                      ) : (
                        <>
                          <span style={{ 
                            width: '6px', height: '6px', borderRadius: '50%', 
                            background: services.find(s => s.id === selectedService)?.is_online ? '#10b981' : '#6b7280' 
                          }} />
                          {services.find(s => s.id === selectedService)?.is_online ? 'En ligne' : 'Hors-ligne'}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Votre service : <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{user?.service}</span>
                </div>
              </div>

              {/* Messages List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Pinned Messages Header widget */}
                {messages.some(m => m.is_pinned && (selectedService === 'all' ? m.to_service === 'all' : (m.from_service === selectedService || m.to_service === selectedService))) && (
                  <div style={{ 
                    padding: '12px 16px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '12px',
                    border: '1px solid rgba(234, 179, 8, 0.2)', marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      <Pin size={14} style={{ transform: 'rotate(45deg)' }} /> Messages épinglés sur ce canal :
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {messages.filter(m => m.is_pinned && (selectedService === 'all' ? m.to_service === 'all' : (m.from_service === selectedService || m.to_service === selectedService))).map(pm => (
                        <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                            <b>{pm.from_user}</b>: {pm.content}
                          </span>
                          <button 
                            onClick={() => togglePinMessage(pm.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}
                          >
                            Détacher
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredMessages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.6 }}>
                    <MessageSquare size={36} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '10px' }} />
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Aucun message dans cette conversation.</div>
                  </div>
                ) : (
                  filteredMessages.map((m, idx) => {
                    const isMine = m.from_user_email === user?.email || m.from_service === user?.service_id;
                    const showDateLabel = idx === 0 || formatDateLabel(messages[idx-1]?.timestamp) !== formatDateLabel(m.timestamp);
                    const citedMsg = m.reply_to ? messages.find(msg => msg.id === m.reply_to) : null;

                    return (
                      <React.Fragment key={m.id}>
                        {showDateLabel && (
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                            <span style={{ 
                              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', 
                              padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 
                            }}>
                              {formatDateLabel(m.timestamp)}
                            </span>
                          </div>
                        )}

                        <div 
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMine ? 'flex-end' : 'flex-start',
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            gap: '4px'
                          }}
                          onMouseEnter={() => setHoveredMessageId(m.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {!isMine && (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', paddingLeft: '5px' }}>
                              <b>{m.from_user}</b> • {m.from_service}
                            </span>
                          )}

                          <div 
                            className="message-bubble"
                            style={{
                              background: isMine 
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)' 
                                : 'rgba(255,255,255,0.05)',
                              border: m.is_pinned 
                                ? '1px solid #f59e0b' 
                                : (isMine ? 'none' : '1px solid rgba(255,255,255,0.06)'),
                              borderBottomRightRadius: isMine ? '2px' : '16px',
                              borderBottomLeftRadius: !isMine ? '2px' : '16px',
                              color: 'white'
                            }}
                          >
                            {/* Hover Reactions & Pin controls */}
                            {hoveredMessageId === m.id && (
                              <div className="reactions-bar">
                                {emojis.map((emoji) => (
                                  <span 
                                    key={emoji} 
                                    className="reaction-emoji" 
                                    onClick={() => reactToMessage(m.id, emoji)}
                                  >
                                    {emoji}
                                  </span>
                                ))}
                                <span style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', margin: '0 4px' }} />
                                <span 
                                  className="reaction-emoji"
                                  onClick={() => setReplyingTo(m)}
                                  title="Répondre"
                                >
                                  <CornerUpLeft size={13} style={{ color: 'white', marginTop: '3px' }} />
                                </span>
                                <span 
                                  className="reaction-emoji"
                                  onClick={() => togglePinMessage(m.id)}
                                  title="Épingler"
                                >
                                  <Pin size={13} style={{ color: m.is_pinned ? '#f59e0b' : 'white', marginTop: '3px', transform: 'rotate(45deg)' }} />
                                </span>
                              </div>
                            )}

                            {/* Pinned Indicator badge inside bubble */}
                            {m.is_pinned && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#f59e0b', marginBottom: '5px', fontWeight: 600 }}>
                                <Pin size={10} style={{ transform: 'rotate(45deg)' }} /> Épinglé
                              </div>
                            )}

                            {citedMsg && (
                              <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                borderLeft: '3px solid var(--primary)',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                marginBottom: '8px',
                                fontSize: '12px',
                                opacity: 0.8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}>
                                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                  {citedMsg.from_user}
                                </span>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {citedMsg.content}
                                </span>
                              </div>
                            )}

                            {m.attachment && (
                              <div style={{ marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', maxWidth: '280px' }}>
                                {m.attachment.startsWith('data:image/') ? (
                                  <img 
                                    src={m.attachment} 
                                    alt={m.attachment_name || "image"}
                                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', cursor: 'zoom-in', borderRadius: '8px' }}
                                    onClick={() => window.open(m.attachment, '_blank')}
                                  />
                                ) : (
                                  <a 
                                    href={m.attachment} 
                                    download={m.attachment_name || "piece_jointe"}
                                    style={{ 
                                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', 
                                      background: 'rgba(0,0,0,0.15)', borderRadius: '8px', color: 'white', 
                                      textDecoration: 'none', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                  >
                                    <FileText size={18} style={{ color: '#818cf8' }} />
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.attachment_name || "Fichier joint"}
                                      </div>
                                      <span style={{ fontSize: '10px', opacity: 0.6 }}>Télécharger</span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Render Formatted Text content */}
                            <div style={{ wordBreak: 'break-word', fontSize: '14px' }}>
                              {renderFormattedText(m.content)}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                              <span style={{ fontSize: '10px', opacity: 0.6 }}>
                                {formatTimeShort(m.timestamp)}
                              </span>
                              {isMine && <Check size={12} style={{ color: '#818cf8' }} />}
                            </div>
                          </div>

                          {/* reactions */}
                          {m.reactions && m.reactions.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px', paddingLeft: '5px' }}>
                              {Object.entries(
                                m.reactions.reduce((acc, curr) => {
                                  acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map(([emoji, count]) => (
                                <span 
                                  key={emoji}
                                  onClick={() => reactToMessage(m.id, emoji)}
                                  style={{
                                    fontSize: '11px', background: 'rgba(255,255,255,0.06)', 
                                    padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                    color: 'rgba(255,255,255,0.8)'
                                  }}
                                  title={m.reactions.filter(r => r.emoji === emoji).map(r => r.userName).join(', ')}
                                >
                                  {emoji} <b style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{count}</b>
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
                {typers.filter(t => t.from_service === selectedService || (selectedService === 'all' && t.to_service === 'all')).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <span className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animationDelay: '0.1s' }} />
                      <span className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animationDelay: '0.2s' }} />
                      <span className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animationDelay: '0.3s' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                      {typers.filter(t => t.from_service === selectedService || (selectedService === 'all' && t.to_service === 'all')).map(t => t.user_name).join(', ')} écrit...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <div style={{ 
                padding: '15px 20px', background: 'rgba(0,0,0,0.15)', 
                borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' 
              }}>
                
                {replyingTo && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px',
                    borderLeft: '4px solid var(--primary)', fontSize: '13px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Reply size={14} style={{ color: 'var(--primary)' }} />
                      <span>Réponse à <b>{replyingTo.from_user}</b>:</span>
                      <span style={{ opacity: 0.7, fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                        "{replyingTo.content}"
                      </span>
                    </div>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {attachment && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px',
                    fontSize: '13px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {attachment.type.startsWith('image/') ? <Image size={16} style={{ color: '#10b981' }} /> : <FileText size={16} style={{ color: '#818cf8' }} />}
                      <span style={{ fontWeight: 500 }}>{attachment.name}</span>
                    </div>
                    <button 
                      onClick={() => setAttachment(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                  
                  <label style={{ 
                    padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }} className="tab-btn">
                    <Paperclip size={18} />
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <input 
                    type="text" 
                    placeholder="Tapez votre message ici... (gras: **texte**, italique: *texte*)" 
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                    style={{ 
                      flex: 1, padding: '13px 18px', borderRadius: '12px', 
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', 
                      color: 'white', outline: 'none', fontSize: '14px' 
                    }}
                  />

                  <button 
                    className="tab-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ padding: '12px', borderRadius: '12px' }}
                  >
                    <Smile size={18} />
                  </button>

                  {showEmojiPicker && (
                    <div className="emoji-popover">
                      {emojis.map((emoji) => (
                        <span 
                          key={emoji}
                          style={{ fontSize: '20px', padding: '6px', cursor: 'pointer', textAlign: 'center' }}
                          onClick={() => {
                            setChatInput(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  <button 
                    className="btn btn-primary" 
                    onClick={sendChatMessage} 
                    style={{ padding: '12px 20px', borderRadius: '12px', height: '100%', display: 'flex', alignItems: 'center' }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- TICKETS MODULE --- */}
        {activeTab === 'tickets' && !selectedTicket && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* Filters */}
            <div style={{ 
              padding: '12px 20px', background: 'rgba(0,0,0,0.15)', 
              borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', 
              gap: '15px', alignItems: 'center', flexWrap: 'wrap' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                <Filter size={15} /> Filtrer par :
              </div>

              <select 
                value={ticketPriorityFilter}
                onChange={e => setTicketPriorityFilter(e.target.value)}
                style={{ 
                  padding: '6px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '13px' 
                }}
              >
                <option value="all">Toutes les priorités</option>
                <option value="urgent">Urgente</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>

              <select 
                value={ticketServiceFilter}
                onChange={e => setTicketServiceFilter(e.target.value)}
                style={{ 
                  padding: '6px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '13px' 
                }}
              >
                <option value="all">Tous les services</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div style={{ flex: 1 }} />
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} style={{ color: '#818cf8' }} /> Auto-assignation & SLA active
              </div>
            </div>

            {/* Kanban columns with HTML5 Drag/Drop */}
            <div style={{ flex: 1, display: 'flex', gap: '15px', padding: '20px', overflowY: 'auto' }}>
              
              {/* Column 1: OUVERTS */}
              <div 
                className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'open')}
              >
                <div className="kanban-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    OUVERTS
                  </span>
                  <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {getTicketsByStatus('open').length}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                  {getTicketsByStatus('open').map(t => (
                    <TicketCard 
                      key={t.id} 
                      ticket={t} 
                      onClick={() => setSelectedTicket(t)} 
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      sla={getSLAInfo(t)}
                    />
                  ))}
                </div>
              </div>

              {/* Column 2: EN COURS */}
              <div 
                className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'in_progress')}
              >
                <div className="kanban-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    EN COURS
                  </span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {getTicketsByStatus('in_progress').length}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                  {getTicketsByStatus('in_progress').map(t => (
                    <TicketCard 
                      key={t.id} 
                      ticket={t} 
                      onClick={() => setSelectedTicket(t)} 
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      sla={getSLAInfo(t)}
                    />
                  ))}
                </div>
              </div>

              {/* Column 3: RESOLUS */}
              <div 
                className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'resolved')}
              >
                <div className="kanban-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    RESOLUS & FERMES
                  </span>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {getTicketsByStatus('resolved').length + getTicketsByStatus('closed').length}
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                  {[...getTicketsByStatus('resolved'), ...getTicketsByStatus('closed')].map(t => (
                    <TicketCard 
                      key={t.id} 
                      ticket={t} 
                      onClick={() => setSelectedTicket(t)} 
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      sla={getSLAInfo(t)}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TICKET DETAIL PANELS --- */}
        {activeTab === 'tickets' && selectedTicket && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Left detail area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.05)' }}>
              
              {/* Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                  className="tab-btn" 
                  onClick={() => setSelectedTicket(null)}
                  style={{ padding: '8px 14px' }}
                >
                  &larr; Retour
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', 
                      background: getPriorityBgColor(selectedTicket.priority), 
                      color: getPriorityTextColor(selectedTicket.priority), 
                      padding: '3px 8px', borderRadius: '5px' 
                    }}>
                      {selectedTicket.priority}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      #{selectedTicket.id}
                    </span>

                    {/* Displays SLA Timer in detail header */}
                    <span style={{ 
                      fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: `${getSLAInfo(selectedTicket).color}15`, color: getSLAInfo(selectedTicket).color,
                      padding: '3px 8px', borderRadius: '5px'
                    }}>
                      <Clock size={11} />
                      {getSLAInfo(selectedTicket).text}
                    </span>

                    {/* Show tags */}
                    {selectedTicket.tags && selectedTicket.tags.map(tag => (
                      <span key={tag} className="tag-badge">
                        <Hash size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>{selectedTicket.title}</h2>
                </div>
              </div>

              {/* Ticket description & comments */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Main Issue Description Card */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    <span>
                      Créé par <b>{selectedTicket.from_user}</b> ({services.find(s => s.id === selectedTicket.from_service)?.name || selectedTicket.from_service})
                    </span>
                    <span>
                      {selectedTicket.timestamp}
                    </span>
                  </div>
                  <div style={{ color: 'white', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '14px' }}>
                    {selectedTicket.content}
                  </div>
                </div>

                {/* Rating display if ticket has already been evaluated */}
                {selectedTicket.rating && (
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                      <Award size={16} /> Évaluation de satisfaction de l'initiateur :
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={16} 
                          fill={s <= selectedTicket.rating ? '#eab308' : 'none'} 
                          color={s <= selectedTicket.rating ? '#eab308' : 'rgba(255,255,255,0.2)'} 
                        />
                      ))}
                    </div>
                    {selectedTicket.rating_comment && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                        "{selectedTicket.rating_comment}"
                      </p>
                    )}
                  </div>
                )}

                {/* Satisfaction Rating Form: Visible only to ticket creator when resolved and not rated yet */}
                {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && 
                 selectedTicket.from_user_email === user?.email && !selectedTicket.rating && (
                  <div style={{ 
                    background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 600, fontSize: '14px' }}>
                      <Star size={16} /> Évaluer la résolution de ce ticket
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Veuillez attribuer une note à l'assistance apportée pour résoudre votre problème.
                    </p>
                    
                    {/* Stars selectors */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={24} 
                          style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                          fill={s <= ratingStars ? '#eab308' : 'none'} 
                          color={s <= ratingStars ? '#eab308' : 'rgba(255,255,255,0.3)'} 
                          onClick={() => setRatingStars(s)}
                        />
                      ))}
                    </div>

                    <input 
                      type="text" 
                      placeholder="Commentaire de retour d'expérience (facultatif)..."
                      value={ratingComment}
                      onChange={e => setRatingComment(e.target.value)}
                      style={{ 
                        padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none'
                      }}
                    />

                    <button 
                      className="btn btn-primary" 
                      onClick={submitRating}
                      disabled={submittingRating}
                      style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', fontSize: '12px' }}
                    >
                      {submittingRating ? <Loader2 size={14} className="animate-spin" /> : "Soumettre l'évaluation"}
                    </button>
                  </div>
                )}

                <h4 style={{ margin: '10px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  Fil de discussion ({selectedTicket.comments?.length || 0} commentaires)
                </h4>

                {/* Comments fil */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                      Pas encore de réponse. Ajoutez un commentaire ci-dessous.
                    </div>
                  ) : (
                    selectedTicket.comments.map((comm) => (
                      <div key={comm.id} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          background: getAvatarColor(comm.user),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 'bold', fontSize: '13px', flexShrink: 0
                        }}>
                          {comm.user.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{comm.user}</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{comm.timestamp}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                            {comm.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <textarea 
                    placeholder="Écrire une réponse..." 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    style={{ 
                      flex: 1, padding: '10px 14px', borderRadius: '10px', 
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', 
                      color: 'white', outline: 'none', height: '42px', minHeight: '42px', maxHeight: '100px',
                      fontFamily: 'inherit', fontSize: '13px', resize: 'vertical'
                    }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={submitComment}
                    disabled={submittingComment || !newComment.trim()}
                    style={{ padding: '0 20px', borderRadius: '10px' }}
                  >
                    {submittingComment ? <Loader2 size={16} className="animate-spin" /> : 'Répondre'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right sidebar info metadata */}
            <div style={{ width: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.15)' }}>
              
              {/* Status card */}
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Statut Actuel
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span style={{ 
                    background: getStatusBgColor(selectedTicket.status), 
                    color: getStatusColor(selectedTicket.status), 
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {selectedTicket.status === 'open' ? 'Ouvert' : selectedTicket.status === 'in_progress' ? 'En cours' : selectedTicket.status === 'closed' ? 'Fermé' : 'Résolu'}
                  </span>
                </div>
              </div>

              {/* Assignment controls */}
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Assigné à
                </span>
                <div style={{ marginTop: '8px' }}>
                  {(user?.role === 'admin' || user?.role === 'super_admin') ? (
                    <select
                      value={selectedTicket.assigned_to || ''}
                      onChange={e => assignTicket(selectedTicket.id, e.target.value)}
                      style={{ 
                        width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none'
                      }}
                    >
                      <option value="">Non assigné</option>
                      {usersList.map(u => (
                        <option key={u.email} value={u.email}>{u.name} ({u.service})</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      {selectedTicket.assigned_name || 'Non assigné'}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Actions de support
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {selectedTicket.status === 'open' && (
                    <button 
                      className="tab-btn" 
                      onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                      style={{ padding: '8px', fontSize: '12px', justifyContent: 'center', color: '#3b82f6' }}
                    >
                      Prendre en charge (En cours)
                    </button>
                  )}
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <button 
                      className="btn" 
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                      style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                    >
                      Marquer comme Résolu
                    </button>
                  )}
                  {selectedTicket.status !== 'closed' && (
                    <button 
                      className="btn" 
                      onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                    >
                      Fermer le ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Activitiestimeline logs */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Historique d'activité
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', marginTop: '6px' }}>
                  {selectedTicket.activities?.map((act, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Clock size={11} style={{ marginTop: '2px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {act.type === 'creation' && <span>Créé par <b>{act.user}</b></span>}
                        {act.type === 'status_change' && <span>Statut changé en <b>{act.to === 'in_progress' ? 'En cours' : act.to === 'resolved' ? 'Résolu' : 'Fermé'}</b> par {act.user}</span>}
                        {act.type === 'assignment' && <span>Assigné à <b>{act.assigned_to}</b> par {act.user}</span>}
                        {act.type === 'rating' && <span>Évalué avec <b>{act.rating}/5 étoiles</b> par {act.user}</span>}
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{act.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Modal: Create Ticket */}
      {showTicketModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Ticket size={20} style={{ color: 'var(--primary)' }} />
              Ouvrir un Nouveau Ticket de Support
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Sujet / Titre du problème *</label>
                <input 
                  type="text" 
                  placeholder="ex: Panne de scanner ou Problème de pointage" 
                  value={tkTitle}
                  onChange={e => setTkTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Destinataire (Service cible) *</label>
                  <select 
                    value={tkDest}
                    onChange={e => setTkDest(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Niveau de Priorité</label>
                  <select 
                    value={tkPriority}
                    onChange={e => setTkPriority(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '14px' }}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Étiquettes (Tags)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {tkTags.map(tag => (
                    <span key={tag} className="tag-badge">
                      #{tag}
                      <X size={10} style={{ cursor: 'pointer' }} onClick={() => setTkTags(tkTags.filter(t => t !== tag))} />
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Ajouter un tag (ex: compta, matériel)" 
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none' }}
                  />
                  <button className="tab-btn" onClick={handleAddTag} style={{ padding: '10px 15px', fontSize: '13px' }}>
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Description détaillée du problème *</label>
                <textarea 
                  placeholder="Décrivez ici votre situation ou problème de façon détaillée..." 
                  value={tkContent}
                  onChange={e => setTkContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button className="tab-btn" onClick={() => setShowTicketModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={createTicket} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Soumettre le Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponent: Ticket Card for Kanban board view
function TicketCard({ ticket, onClick, onDragStart, sla }) {
  return (
    <div 
      className="kanban-card" 
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {ticket.title}
        </h4>
        <span style={{ 
          fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', 
          background: getPriorityBgColor(ticket.priority), 
          color: getPriorityTextColor(ticket.priority), 
          padding: '2px 6px', borderRadius: '4px', flexShrink: 0
        }}>
          {ticket.priority}
        </span>
      </div>
      
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {ticket.content}
      </p>

      {/* Ticket tags */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {ticket.tags.map(tag => (
            <span key={tag} className="tag-badge">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* SLA Widget & Meta Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
        {/* SLA timer alert */}
        <span style={{ color: sla.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Clock size={11} />
          {sla.text}
        </span>
        
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.3)' }}>
          <MessageSquare size={10} /> {ticket.comments?.length || 0}
        </span>
      </div>
    </div>
  );
}

// Helpers
const getPriorityBgColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'rgba(239, 68, 68, 0.15)';
    case 'high': return 'rgba(249, 115, 22, 0.15)';
    case 'medium': return 'rgba(234, 179, 8, 0.15)';
    default: return 'rgba(255, 255, 255, 0.08)';
  }
};

const getPriorityTextColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    default: return 'rgba(255,255,255,0.6)';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'open': return '#f59e0b';
    case 'in_progress': return '#3b82f6';
    case 'resolved': return '#10b981';
    default: return '#ef4444'; // closed
  }
};

const getStatusBgColor = (status) => {
  switch (status) {
    case 'open': return 'rgba(245, 158, 11, 0.15)';
    case 'in_progress': return 'rgba(59, 130, 246, 0.15)';
    case 'resolved': return 'rgba(16, 185, 129, 0.15)';
    default: return 'rgba(239, 68, 68, 0.15)'; // closed
  }
};
