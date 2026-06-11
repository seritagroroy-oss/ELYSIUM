import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { Send, Paperclip, Loader2, UserCircle2, ArrowLeft, Download, Search, CheckCircle2, X } from 'lucide-react';

const BoiteReceptionAdmin = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await apiCall('get_private_messages', {});
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactEmail) => {
    setMsgLoading(true);
    try {
      const res = await apiCall('get_private_messages', { with_email: contactEmail });
      if (res.success) {
        setMessages(res.messages || []);
        // Refresh conversations to update unread counts
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedContact) {
        fetchMessages(selectedContact);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
    }
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    setSending(true);
    const formData = new FormData();
    formData.append('receiver_email', selectedContact);
    formData.append('message', newMessage);
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api.php?action=send_private_message', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || ''
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        setFile(null);
        fetchMessages(selectedContact);
      } else {
        alert(data.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.message && c.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="glass-panel" style={{ padding: 0, display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      
      {/* LEFT PANEL : Conversations */}
      <div style={{ 
        width: selectedContact ? '0' : '100%', 
        maxWidth: selectedContact ? '0' : 'none', 
        borderRight: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex', flexDirection: 'column', transition: '0.3s',
        '@media (min-width: 768px)': { width: '350px', maxWidth: '350px' }
      }} className={`inbox-sidebar ${selectedContact ? 'hide-mobile' : ''}`}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: 'white' }}>Boîte de réception</h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--muted)" style={{ position: 'absolute', top: '10px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" color="var(--muted)" /></div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Aucune conversation</div>
          ) : (
            filteredConversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => setSelectedContact(conv.contact_email)}
                style={{ 
                  padding: '15px 20px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer',
                  background: selectedContact === conv.contact_email ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  transition: 'background 0.2s',
                  display: 'flex', gap: '15px', alignItems: 'center'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <UserCircle2 size={24} color="#cbd5e1" />
                  {conv.unread_count > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 5px', borderRadius: '10px' }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.contact_email}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0 }}>
                      {new Date(conv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: conv.unread_count > 0 ? 'white' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                    {conv.sender_email === user.email ? 'Vous: ' : ''}
                    {conv.message || (conv.file_name ? `📎 ${conv.file_name}` : '')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL : Chat */}
      <div style={{ 
        flex: 1, 
        display: selectedContact ? 'flex' : 'none', 
        flexDirection: 'column', background: 'rgba(0,0,0,0.15)',
        '@media (min-width: 768px)': { display: 'flex' }
      }} className={!selectedContact ? 'hide-mobile' : ''}>
        
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={() => setSelectedContact(null)} 
                className="btn-icon mobile-only" 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <UserCircle2 size={24} />
              </div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{selectedContact}</h3>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {msgLoading && messages.length === 0 ? (
                <div style={{ margin: 'auto' }}><Loader2 className="animate-spin" color="var(--muted)" size={30} /></div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--muted)', textAlign: 'center' }}>
                  Commencez la discussion avec {selectedContact}
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_email === user.email;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        background: isMe ? '#38bdf8' : 'rgba(255,255,255,0.1)', 
                        color: isMe ? '#0f172a' : 'white',
                        padding: '12px 18px', 
                        borderRadius: '18px', 
                        borderBottomRightRadius: isMe ? '4px' : '18px',
                        borderBottomLeftRadius: isMe ? '18px' : '4px',
                        maxWidth: '75%',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        {msg.message && <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{msg.message}</div>}
                        
                        {msg.file_url && (
                          <div style={{ marginTop: msg.message ? '10px' : '0', padding: '10px', background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>
                              <Paperclip size={18} />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.file_name}</div>
                            </div>
                            <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }} title="Télécharger">
                              <Download size={18} />
                            </a>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && msg.is_read ? <CheckCircle2 size={12} color="#38bdf8" /> : ''}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
              {file && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(56,189,248,0.1)', padding: '8px 15px', borderRadius: '8px', marginBottom: '10px', width: 'fit-content', border: '1px solid rgba(56,189,248,0.3)' }}>
                  <Paperclip size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{file.name}</span>
                  <button onClick={() => setFile(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '10px', padding: 0 }}><X size={14} /></button>
                </div>
              )}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <label style={{ cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--muted)', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}>
                  <Paperclip size={20} />
                  <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                </label>
                
                <textarea 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Écrire un message..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 15px', color: 'white', resize: 'none', height: '48px', minHeight: '48px', maxHeight: '120px', fontFamily: 'inherit' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                
                <button 
                  type="submit" 
                  disabled={sending || (!newMessage.trim() && !file)}
                  style={{ padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', cursor: (sending || (!newMessage.trim() && !file)) ? 'not-allowed' : 'pointer', opacity: (sending || (!newMessage.trim() && !file)) ? 0.5 : 1 }}
                >
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)' }}>
            <UserCircle2 size={64} style={{ margin: '0 auto 20px auto', opacity: 0.2 }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Boîte de réception</h3>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default BoiteReceptionAdmin;
