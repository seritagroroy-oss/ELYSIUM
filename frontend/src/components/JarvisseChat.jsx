import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Cpu, Sparkles, Loader2, Settings, Save, ChevronLeft } from 'lucide-react';
import { apiCall } from '../api';

export default function JarvisseChat({ user, isOpen, setIsOpen, hideFloatingButton }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'jarvisse', text: `Bonjour ${user?.name || ''}. Je suis Jarvisse, votre assistant IA ELYSIUM. Comment puis-je vous aider aujourd'hui ?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Configuration
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('jarvisse_api_key') || '');
  const [model, setModel] = useState(localStorage.getItem('jarvisse_model') || 'llama-3.3-70b-versatile');

  // Dragging logic
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: position.x,
      lastY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.lastX + dx,
        y: dragRef.current.lastY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isConfigOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isConfigOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await apiCall('jarvisse_chat', { 
        message: query, 
        user_id: user?.email,
        api_key: apiKey,
        model: model
      }, 'POST');
      
      if (res.success) {
        const aiMsg = { id: Date.now() + 1, sender: 'jarvisse', text: res.reply };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(res.message || "Erreur de réponse");
      }
    } catch (error) {
      const errorMsg = { id: Date.now() + 1, sender: 'jarvisse', text: "Désolé, mes serveurs cognitifs sont actuellement inaccessibles." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveConfig = () => {
    localStorage.setItem('jarvisse_api_key', apiKey);
    localStorage.setItem('jarvisse_model', model);
    setIsConfigOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!hideFloatingButton && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
            border: 'none',
            color: 'white',
            boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4), 0 0 0 4px rgba(15, 23, 42, 0.5)',
            cursor: 'pointer',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isOpen ? 'scale(0) rotate(-180deg)' : 'scale(1) rotate(0deg)',
            opacity: isOpen ? 0 : 1
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = isOpen ? 'scale(0)' : 'scale(1)'; }}
        >
          <Bot size={30} strokeWidth={1.5} />
        </button>
      )}

      {/* Chat Panel */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '380px',
        height: '600px',
        minWidth: '300px',
        minHeight: '400px',
        maxHeight: '90vh',
        maxWidth: '90vw',
        background: '#0f172a',
        borderRadius: '24px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
        zIndex: 100001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isOpen ? `translate(${position.x}px, ${position.y}px) scale(1)` : `translate(${position.x}px, ${position.y + 50}px) scale(0.9)`,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        resize: 'both' // Permet de redimensionner le panneau
      }}>
        {/* Header (Draggable) */}
        <div 
          onMouseDown={handleMouseDown}
          style={{
            background: 'linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(56, 189, 248, 0.1))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '15px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isConfigOpen ? (
              <button 
                onClick={() => setIsConfigOpen(false)}
                style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
              }}>
                <Cpu size={22} color="white" />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isConfigOpen ? 'Configuration' : 'Jarvisse'} {!isConfigOpen && <Sparkles size={14} color="#38bdf8" />}
              </h3>
              {!isConfigOpen && (
                <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                  En ligne
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isConfigOpen && (
              <button 
                onClick={() => setIsConfigOpen(true)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                title="Configuration de l'IA"
              >
                <Settings size={20} />
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Configuration View */}
        {isConfigOpen ? (
          <div style={{ flex: 1, padding: '20px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Clé API Groq</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="gsk_..."
                style={{
                  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px', display: 'block' }}>Votre clé sera stockée localement dans votre navigateur.</span>
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Modèle d'Intelligence</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{
                  width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                }}
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommandé, Très performant)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Rapide)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (Alternatif)</option>
                <option value="gemma2-9b-it">Gemma 2 9B (Léger)</option>
              </select>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button 
                onClick={saveConfig}
                style={{
                  width: '100%', padding: '14px', background: '#38bdf8', color: '#0f172a', border: 'none',
                  borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Save size={18} />
                Sauvegarder les paramètres
              </button>
            </div>
          </div>
        ) : (
          /* Messages Area */
          <>
            <div className="custom-scrollbar" style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(0,0,0,0.2)'
            }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.sender === 'jarvisse' ? '4px' : '16px',
                    background: msg.sender === 'user' ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                    color: msg.sender === 'user' ? '#0f172a' : '#cbd5e1',
                    border: msg.sender === 'jarvisse' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    fontWeight: msg.sender === 'user' ? 600 : 400
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Loader2 size={16} className="animate-spin" color="#a855f7" />
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Jarvisse analyse...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: '15px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '5px'
              }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="Demandez quelque chose..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    padding: '10px 15px',
                    outline: 'none',
                    fontSize: '0.95rem'
                  }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    background: input.trim() ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                    color: input.trim() ? '#0f172a' : '#64748b',
                    border: 'none',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { if (input.trim()) e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Send size={18} />
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Propulsé par Stark-OS AI</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
