import React, { useState } from 'react';
import { MessageSquare, Send, Shield, Users, Radio, User, CornerDownRight } from 'lucide-react';

export default function CtrlMessagerie() {
  const [threads, setThreads] = useState([
    { id: 'pc', name: 'Poste de Commandement (PC)', role: 'Opérations H24', unread: 2, icon: Radio, messages: [
      { id: 1, sender: 'pc', text: 'Contrôleur 01, avez-vous inspecté le site Entrepôt Vridi ?', time: '10:15' },
      { id: 2, sender: 'me', text: 'En cours de route, arrivée prévue dans 15 min.', time: '10:20' },
      { id: 3, sender: 'pc', text: 'Reçu. Un agent est déclaré manquant à la relève là-bas.', time: '10:22' }
    ]},
    { id: 'dg', name: 'Direction Générale (DG)', role: 'Direction', unread: 0, icon: Shield, messages: [
      { id: 1, sender: 'dg', text: 'Bonjour. Veuillez soumettre les rapports d\'audit avant 17h00.', time: 'Hier' },
      { id: 2, sender: 'me', text: 'Bonjour Monsieur. Entendu, les 4 rapports seront transmis à temps.', time: 'Hier' }
    ]},
    { id: 'equipe', name: 'Broadcast Agents Cocody', role: 'Canal Équipe', unread: 0, icon: Users, messages: [
      { id: 1, sender: 'me', text: 'Rappel : port des rangers et badge obligatoire pour tous ce matin.', time: '07:30' },
      { id: 2, sender: 'agent', name: 'Koffi Marc', text: 'Bien reçu chef, poste équipé et conforme.', time: '07:35' }
    ]}
  ]);

  const [activeThreadId, setActiveThreadId] = useState('pc');
  const [newMessage, setNewMessage] = useState('');

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: Date.now(),
      sender: 'me',
      text: newMessage,
      time: timeNow
    };

    setThreads(threads.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, msg]
        };
      }
      return t;
    }));
    setNewMessage('');
  };

  const handleQuickBroadcast = () => {
    setActiveThreadId('equipe');
    setNewMessage('[ALERTE DIFFUSION] Tous les agents en poste, veuillez confirmer votre présence immédiate par SMS ou via le module GPS.');
  };

  const handleQuickPC = () => {
    setActiveThreadId('pc');
    setNewMessage('Rapport de patrouille : RAS sur le site ');
  };

  const handleQuickDG = () => {
    setActiveThreadId('dg');
    setNewMessage('Monsieur le DG, le contrôle de zone a été complété. Rapport en cours de rédaction.');
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
          <MessageSquare size={28} /> Messagerie Interne
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Canaux de communication prioritaires pour l'assistance terrain et la coordination opérationnelle.
        </p>
      </div>

      {/* Quick Action Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={handleQuickPC}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Radio size={16} /> Contacter le PC
        </button>
        <button
          onClick={handleQuickDG}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            color: '#a855f7',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Shield size={16} /> Alerter la Direction (DG)
        </button>
        <button
          onClick={handleQuickBroadcast}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> Broadcast Équipe
        </button>
      </div>

      {/* Main chat window layout */}
      <div style={{ display: 'flex', gap: '20px', height: '60vh', flexWrap: 'wrap' }}>
        
        {/* Left Side: Threads List */}
        <div style={{ flex: '1 1 250px', backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1f2937', fontWeight: '700', color: 'white', fontSize: '1rem' }}>
            Canaux Actifs
          </div>
          {threads.map((thread) => {
            const Icon = thread.icon;
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  thread.unread = 0;
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: '1px solid #1f2937',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  backgroundColor: isActive ? '#6366f1' : '#1f2937', 
                  color: isActive ? 'white' : '#94a3b8',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {thread.name}
                    </h4>
                    {thread.unread > 0 && (
                      <span style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        fontSize: '0.7rem', 
                        fontWeight: '700', 
                        borderRadius: '10px', 
                        padding: '2px 6px' 
                      }}>{thread.unread}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{thread.role}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Message Area */}
        <div style={{ flex: '3 1 450px', backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Active channel header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifySelf: 'flex-start', gap: '10px' }}>
            <span style={{ color: '#818cf8', fontWeight: '700' }}>{activeThread.name}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>• {activeThread.role}</span>
          </div>

          {/* Messages display */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeThread.messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div key={msg.id} style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  {!isMe && msg.name && (
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '2px', fontWeight: '600' }}>
                      {msg.name}
                    </span>
                  )}
                  <div style={{
                    backgroundColor: isMe ? '#6366f1' : '#1f2937',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Message form */}
          <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid #1f2937', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Saisissez votre message prioritaire..."
              style={{
                flex: 1,
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
