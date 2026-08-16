import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiCall } from '../../api';
import { useAuth } from '../../AuthContext';
import {
  Search, MoreVertical, Paperclip, Smile, Send, CheckCheck,
  Phone, Video, MessageSquare, Users, CircleDashed,
  ArrowLeft, Mic, X, Plus, Camera, Image, Type, ChevronRight,
  UserCircle, Info, Bell, BellOff, Trash2, LogOut, Edit3,
  UserPlus, Lock
} from 'lucide-react';
import CallWindow from './CallWindow';
import StatusViewer from './StatusViewer';

// ── Helper ─────────────────────────────────────────────────────────────────
const getAvatar = (name = '?') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a3942&color=aebac1&bold=true`;

const formatTime = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts.replace(/-/g, '/')).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const formatDate = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts.replace(/-/g, '/'));
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return ''; }
};

const EMOJI_CATEGORIES = {
  smileys: { icon: '😀', list: ['😀', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '👏', '😎', '🤔', '😢', '😡', '🤣', '🥰', '😍', '😊', '😎', '😏', '😭', '👍', '👎', '🙌', '🤝', '💖', '😃', '😄', '😁', '😆', '😅', '😉', '😌', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '🥳', '🥸', '🤩', '🥱', '😴', '🤤', '😪', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '✍️', '👐', '🤲', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾'] },
  animals: { icon: '🐱', list: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦢', '🦉', '🦩', '🦅', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🕷', '🕸', 'Scorpion', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊', '🐇', '🐿', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌙', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪', '🌈', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄️', '💨', '🌊', '💧', '💦', '☔️'] },
  food: { icon: '🍎', list: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍯', '🍼', '🥛', '☕️', '🍵', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🥤', '🥢'] },
  activities: { icon: '⚽', list: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🗜', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '🧪', '🧬', '🔬', '🔭', '📡', '🧯', '🛒', '🛍', '🎁', '🎈', '🎉', '🎊', '🏮', '🎐', '✉️', '📩', '📨', '📤', '📥', '📦', '🏷', '💳', '💎'] },
  symbols: { icon: '❤️', list: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '🈳', '🈴', '🈵', '🈲', '🉑', '💮', '🉐', '㊙️', '㊗️', '📴', '📳', '📶', '🔁', '🔀', '▶️', '⏩', '⏮', '⏭', '⏸', '⏹', '⏺', '➕', '➖', '✖️', '➗', '❓', '❔', '❗️', '❕', '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️'] }
};

const renderMessageContent = (m) => {
  const fileUrl = m.file_url || m.attachment;
  const fileName = m.file_name || m.attachment_name;
  
  if (!fileUrl) {
    return <div style={{ fontSize: '14.5px', lineHeight: '19px', wordBreak: 'break-word' }}>{m.content || m.message}</div>;
  }
  
  const ext = fileUrl.split('.').pop().toLowerCase();
  const isAudio = ['wav', 'mp3', 'ogg', 'm4a', 'aac', 'webm'].includes(ext) || fileUrl.includes('chat_') && ext === 'wav';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {isImage && (
        <img src={`/${fileUrl}`} alt={fileName} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.open(`/${fileUrl}`)} />
      )}
      {isVideo && (
        <video src={`/${fileUrl}`} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} />
      )}
      {isAudio && (
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '240px', padding: '4px 0' }}>
          <audio src={`/${fileUrl}`} controls style={{ width: '100%', height: '40px' }} />
        </div>
      )}
      {!isImage && !isVideo && !isAudio && (
        <a href={`/${fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#53bdeb', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          <Paperclip size={16} />
          <span style={{ textDecoration: 'underline' }}>{fileName || 'Télécharger le fichier'}</span>
        </a>
      )}
      {(m.content || m.message) && (m.content !== 'Fichier audio') && (
        <div style={{ fontSize: '14.5px', lineHeight: '19px', wordBreak: 'break-word', marginTop: 4 }}>{m.content || m.message}</div>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

/** Modal for creating a group or announcement channel */
function CreateGroupModal({ usersList, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = usersList.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (email) => {
    setSelectedMembers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    setLoading(true);
    try {
      const res = await apiCall('create_message_group', {
        name: name.trim(),
        is_announcement: isAnnouncement ? 1 : 0,
        members: selectedMembers
      });
      if (res.success) { onCreated(); onClose(); }
      else setError(res.message || 'Erreur');
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111b21', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        {/* Header */}
        <div style={{ background: '#202c33', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: '#e9edef', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {isAnnouncement ? '📢 Nouveau Canal d\'annonces' : '👥 Nouveau Groupe'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setIsAnnouncement(false)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid', borderColor: !isAnnouncement ? '#00a884' : '#2a3942', background: !isAnnouncement ? 'rgba(0,168,132,0.12)' : 'transparent', color: !isAnnouncement ? '#00a884' : '#8696a0', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
              <Users size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Groupe classique
            </button>
            <button
              onClick={() => setIsAnnouncement(true)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid', borderColor: isAnnouncement ? '#00a884' : '#2a3942', background: isAnnouncement ? 'rgba(0,168,132,0.12)' : 'transparent', color: isAnnouncement ? '#00a884' : '#8696a0', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
              <Bell size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Canal d'annonces
            </button>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#8696a0', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nom du {isAnnouncement ? 'canal' : 'groupe'}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isAnnouncement ? 'Ex: Annonces RH' : 'Ex: Équipe Sécurité'}
              style={{ width: '100%', background: '#2a3942', border: '1px solid #3a4a52', borderRadius: '8px', padding: '10px 12px', color: '#e9edef', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Members */}
          <div>
            <label style={{ display: 'block', color: '#8696a0', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ajouter des membres ({selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''})
            </label>

            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {selectedMembers.map(em => {
                  const u = usersList.find(x => x.email === em);
                  return (
                    <div key={em} onClick={() => toggle(em)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2a3942', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', color: '#e9edef' }}>
                      <img src={u?.profile_photo || getAvatar(u?.name)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                      {u?.name?.split(' ')[0] || em}
                      <X size={12} color="#8696a0" />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background: '#202c33', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Search size={16} color="#8696a0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un collègue..."
                style={{ background: 'transparent', border: 'none', color: '#d1d7db', flex: 1, outline: 'none', fontSize: '14px' }}
              />
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filtered.map(u => (
                <div
                  key={u.email}
                  onClick={() => toggle(u.email)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 6px', borderRadius: '8px', cursor: 'pointer', background: selectedMembers.includes(u.email) ? 'rgba(0,168,132,0.1)' : 'transparent', transition: 'background 0.15s' }}>
                  <img src={u.profile_photo || getAvatar(u.name)} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: 500 }}>{u.name}</div>
                    <div style={{ color: '#8696a0', fontSize: '12px' }}>{u.service || u.email}</div>
                  </div>
                  {selectedMembers.includes(u.email) && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCheck size={12} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{ width: '100%', marginTop: '16px', padding: '12px', background: loading || !name.trim() ? '#2a3942' : '#00a884', color: loading || !name.trim() ? '#8696a0' : '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: loading || !name.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? 'Création...' : `Créer le ${isAnnouncement ? 'canal' : 'groupe'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal to post a status */
function PostStatusModal({ user, onClose, onPosted }) {
  const [type, setType] = useState('text'); // text, image, video
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState('#075e54');
  const [imageBase64, setImageBase64] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const bgColors = ['#075e54', '#25d366', '#00a884', '#1da1f2', '#e91e63', '#9c27b0', '#ff5722', '#f44336', '#3f51b5'];

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith('video/')) {
      setType('video');
    } else {
      setType('image');
    }
    setImageBase64(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (type === 'text' && !text.trim()) return;
    if ((type === 'image' || type === 'video') && !imageBase64) return;
    setLoading(true);
    try {
      let content = type === 'text' ? text.trim() : imageBase64;
      
      if ((type === 'video' || type === 'image') && mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        formData.append('type', 'status');
        const uploadRes = await fetch('/api.php?action=upload_file', {
          method: 'POST', body: formData, credentials: 'include',
          headers: { 'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || '' }
        }).then(r => r.json());
        
        if (uploadRes.success) {
          content = uploadRes.url;
        } else {
          alert('Erreur upload: ' + (uploadRes.message || 'Inconnue'));
          setLoading(false);
          return;
        }
      }

      const res = await apiCall('post_status', { content, content_type: type, bg_color: bgColor });
      if (res.success) { onPosted(); onClose(); }
      else { alert('Erreur publication: ' + (res.message || 'Réponse serveur invalide')); }
    } catch (err) {
      alert('Erreur inattendue: ' + err.message);
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#111b21', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
        {/* Preview */}
        <div style={{ height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (type === 'image' || type === 'video') && imageBase64 ? '#000' : bgColor, overflow: 'hidden', transition: 'background 0.3s' }}>
          {type === 'image' && imageBase64 ? (
            <img src={imageBase64} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : type === 'video' && imageBase64 ? (
            <video src={imageBase64} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: '#fff', fontSize: text ? '1.6rem' : '1rem', fontWeight: text ? 700 : 400, opacity: text ? 1 : 0.4 }}>{text || 'Votre statut...'}</div>
          )}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Toggle text / image */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {[{ v: 'text', icon: <Type size={16} />, label: 'Texte' }, { v: 'media', icon: <Image size={16} />, label: 'Photo / Vidéo' }].map(opt => {
              const isActive = opt.v === 'text' ? type === 'text' : (type === 'image' || type === 'video');
              return (
              <button key={opt.v} onClick={() => setType(opt.v === 'text' ? 'text' : 'image')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: '8px', border: '2px solid', borderColor: isActive ? '#00a884' : '#2a3942', background: isActive ? 'rgba(0,168,132,0.1)' : 'transparent', color: isActive ? '#00a884' : '#8696a0', cursor: 'pointer', fontWeight: 600 }}>
                {opt.icon}{opt.label}
              </button>
            )})}
          </div>

          {type === 'text' ? (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Entrez votre statut..."
                maxLength={700}
                style={{ width: '100%', background: '#202c33', border: 'none', borderRadius: '10px', padding: '12px', color: '#e9edef', resize: 'none', outline: 'none', fontSize: '15px', minHeight: '80px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {bgColors.map(c => (
                  <div key={c} onClick={() => setBgColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: bgColor === c ? '3px solid #fff' : '2px solid transparent', transition: 'border 0.15s' }} />
                ))}
              </div>
            </>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#202c33', borderRadius: '10px', padding: '20px', cursor: 'pointer', border: '2px dashed #2a3942', gap: '8px' }}>
              <Camera size={28} color="#00a884" />
              <span style={{ color: '#8696a0', fontSize: '14px' }}>Cliquez pour choisir une photo ou vidéo</span>
              <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          )}

          <button
            onClick={handlePost}
            disabled={loading || (type === 'text' ? !text.trim() : !imageBase64)}
            style={{ width: '100%', marginTop: '14px', padding: '13px', background: '#00a884', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {loading ? 'Publication...' : '📤 Publier le statut (24h)'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Group Info side-panel */
function GroupInfoPanel({ group, currentUser, onClose, onUpdated, usersList }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group.name || '');
  const [description, setDescription] = useState(group.description || '');
  const [uploading, setUploading] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const fileInputRef = useRef(null);

  const isAdmin = group.members?.find(m => m.email === currentUser.email)?.role === 'admin';

  const handleGroupPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'group');

      const res = await fetch('/api.php?action=upload_file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || ''
        }
      });
      const uploadRes = await res.json();
      if (uploadRes.success) {
        const resPhoto = await apiCall('update_group_photo', {
          group_id: group.id,
          photo_url: uploadRes.url
        });
        if (resPhoto.success) {
          onUpdated();
        } else {
          alert(resPhoto.message || 'Erreur lors de la mise à jour de la photo');
        }
      } else {
        alert(uploadRes.message || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!name.trim()) return;
    try {
      const res = await apiCall('update_group_info', {
        group_id: group.id,
        name: name.trim(),
        description: description.trim()
      });
      if (res.success) {
        setIsEditing(false);
        onUpdated();
      } else {
        alert(res.message);
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleAddMember = async (email) => {
    try {
      const res = await apiCall('add_group_member', {
        group_id: group.id,
        member_email: email
      });
      if (res.success) {
        onUpdated();
        setSearchMember('');
      } else {
        alert(res.message);
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleRemoveMember = async (email) => {
    if (!confirm(`Retirer ${email} du groupe ?`)) return;
    try {
      const res = await apiCall('remove_group_member', {
        group_id: group.id,
        member_email: email
      });
      if (res.success) {
        onUpdated();
      } else {
        alert(res.message);
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleChangeRole = async (email, newRole) => {
    try {
      const res = await apiCall('change_member_role', {
        group_id: group.id,
        member_email: email,
        role: newRole
      });
      if (res.success) {
        onUpdated();
      } else {
        alert(res.message);
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Voulez-vous vraiment quitter ce groupe ?')) return;
    try {
      const res = await apiCall('leave_group', { group_id: group.id });
      if (res.success) {
        onClose();
        onUpdated();
      } else {
        alert(res.message);
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const existingEmails = group.members?.map(m => m.email) || [];
  const candidateUsers = usersList.filter(u => !existingEmails.includes(u.email));
  const filteredCandidates = candidateUsers.filter(u => 
    u.name?.toLowerCase().includes(searchMember.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div style={{ width: '340px', background: '#111b21', borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ background: '#202c33', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #222d34' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: 4 }}><X size={22} /></button>
        <span style={{ color: '#e9edef', fontWeight: 700, fontSize: '1rem' }}>Infos du {group.is_announcement ? 'Canal' : 'Groupe'}</span>
      </div>

      <div style={{ position: 'relative', background: '#202c33', padding: '30px 0 20px', display: 'flex', justifyContent: 'center', borderBottom: '6px solid #111b21' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={group.icon || getAvatar(group.name)} alt={group.name} style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '4px solid #00a884', boxShadow: '0 8px 30px rgba(0,168,132,0.25)', opacity: uploading ? 0.6 : 1 }} />
          {isAdmin && (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 4, right: 4, background: '#00a884', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', cursor: 'pointer' }}>
                <Camera size={16} color="#fff" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleGroupPhotoUpload} 
                style={{ display: 'none' }} 
              />
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }} className="whatsapp-scrollbar">
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #222d34' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Nom du groupe"
                style={{ background: '#2a3942', border: '1px solid #3a4a52', borderRadius: '8px', padding: '8px 12px', color: '#e9edef', outline: 'none', fontSize: '14px' }}
              />
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Description"
                style={{ background: '#2a3942', border: '1px solid #3a4a52', borderRadius: '8px', padding: '8px 12px', color: '#e9edef', outline: 'none', fontSize: '14px', resize: 'none', height: '60px' }}
              />
              <button onClick={handleSaveInfo} style={{ background: '#00a884', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontWeight: 600 }}>Enregistrer</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#8696a0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nom</span>
                {isAdmin && <Edit3 size={16} color="#aebac1" style={{ cursor: 'pointer' }} onClick={() => setIsEditing(true)} />}
              </div>
              <div style={{ color: '#e9edef', fontSize: '1.05rem', fontWeight: 600 }}>{group.name}</div>
              <div style={{ color: '#8696a0', fontSize: '13px', marginTop: 8 }}>{group.description || 'Aucune description'}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 24px' }}>
          <div style={{ color: '#00a884', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Membres ({group.members?.length || 0})
          </div>

          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: '#202c33', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={14} color="#8696a0" />
                <input
                  value={searchMember}
                  onChange={e => setSearchMember(e.target.value)}
                  placeholder="Ajouter un collègue..."
                  style={{ background: 'transparent', border: 'none', color: '#d1d7db', flex: 1, outline: 'none', fontSize: '13px' }}
                />
              </div>
              {searchMember && (
                <div style={{ background: '#202c33', borderRadius: '8px', marginTop: 4, maxHeight: '120px', overflowY: 'auto', border: '1px solid #2a3942' }} className="whatsapp-scrollbar">
                  {filteredCandidates.map(u => (
                    <div key={u.email} onClick={() => handleAddMember(u.email)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#2a3942'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <img src={u.profile_photo || getAvatar(u.name)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: '13px', color: '#e9edef', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <Plus size={14} color="#00a884" />
                    </div>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <div style={{ padding: '8px', fontSize: '12px', color: '#8696a0', textAlign: 'center' }}>Aucun résultat</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.members?.map(m => {
              const isMemAdmin = m.role === 'admin';
              const isSelf = m.email === currentUser.email;
              return (
                <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={m.profile_photo || getAvatar(m.name)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#e9edef', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isSelf ? 'Vous' : m.name}
                      </span>
                      {isMemAdmin && (
                        <span style={{ border: '1px solid rgba(0,168,132,0.3)', color: '#00a884', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Admin</span>
                      )}
                    </div>
                    <div style={{ color: '#8696a0', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                  </div>

                  {isAdmin && !isSelf && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isMemAdmin ? (
                        <button onClick={() => handleChangeRole(m.email, 'member')} title="Rétrograder en membre" style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}><Lock size={14} /></button>
                      ) : (
                        <button onClick={() => handleChangeRole(m.email, 'admin')} title="Promouvoir admin" style={{ background: 'none', border: 'none', color: '#00a884', cursor: 'pointer', padding: 4 }}><UserPlus size={14} /></button>
                      )}
                      <button onClick={() => handleRemoveMember(m.email)} title="Retirer du groupe" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleLeaveGroup}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            <LogOut size={16} /> Quitter le groupe
          </button>
        </div>
      </div>
    </div>
  );
}

/** Profile side-panel */
function ProfilePanel({ target, currentUser, onClose }) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // target: { name, email, photo, service, type } or null for own profile
  const isOwn = !target || target.email === currentUser.email;
  const name = target?.name || currentUser.name;
  const email = target?.email || currentUser.email;
  const photo = target?.photo || currentUser.profile_photo;
  const service = target?.service || currentUser.service;

  const handleCameraClick = () => {
    if (isOwn && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
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
          setUploading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ width: '340px', background: '#111b21', borderLeft: '1px solid #222d34', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#202c33', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #222d34' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: 4 }}><X size={22} /></button>
        <span style={{ color: '#e9edef', fontWeight: 700, fontSize: '1rem' }}>{isOwn ? 'Mon Profil' : 'Profil'}</span>
      </div>

      {/* Avatar */}
      <div style={{ position: 'relative', background: '#202c33', padding: '30px 0 20px', display: 'flex', justifyContent: 'center', borderBottom: '6px solid #111b21' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={photo || getAvatar(name)} alt={name} style={{ width: 200, height: 200, borderRadius: '50%', objectFit: 'cover', border: '4px solid #00a884', boxShadow: '0 8px 30px rgba(0,168,132,0.25)', opacity: uploading ? 0.6 : 1 }} />
          {isOwn && (
            <>
              <div 
                onClick={handleCameraClick}
                style={{ position: 'absolute', bottom: 8, right: 8, background: '#00a884', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', cursor: 'pointer' }}>
                <Camera size={18} color="#fff" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                style={{ display: 'none' }} 
              />
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {/* Name */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #222d34' }}>
          <div style={{ color: '#8696a0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Nom</div>
          <div style={{ color: '#e9edef', fontSize: '1.05rem', fontWeight: 600 }}>{name}</div>
        </div>

        {/* Email */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #222d34' }}>
          <div style={{ color: '#8696a0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Email</div>
          <div style={{ color: '#e9edef', fontSize: '0.95rem' }}>{email}</div>
        </div>

        {/* Service */}
        {service && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #222d34' }}>
            <div style={{ color: '#8696a0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Service</div>
            <div style={{ color: '#e9edef', fontSize: '0.95rem' }}>{service}</div>
          </div>
        )}

        {/* Encryption notice */}
        <div style={{ margin: '16px', background: 'rgba(0,168,132,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Lock size={16} color="#00a884" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ color: '#8696a0', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
            Les messages sont chiffrés de bout en bout. Personne en dehors de votre entreprise ne peut les lire.
          </p>
        </div>
      </div>
    </div>
  );
}

  // ── Main Component ──────────────────────────────────────────────────────────
export default function WhatsAppChat() {
  const { user, refreshUser } = useAuth();

  // Tabs
  const [waTab, setWaTab] = useState('chats');

  // Data
  const [usersList, setUsersList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Selection
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [callData, setCallData] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { room_name, caller_name, caller_email, call_type }
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showStatusViewer2, setShowStatusViewer2] = useState({ visible: false, statuses: [], startIndex: 0 });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showPostStatus, setShowPostStatus] = useState(false);
  const [showProfile, setShowProfile] = useState(null); // null | { name, email, photo, service } | 'me'
  const [showGroupInfo, setShowGroupInfo] = useState(null); // null | groupObject
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileChat, setIsMobileChat] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await sendMessage(blob, 'audio/wav');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
      console.error(err);
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current) return;
    clearInterval(recordingTimerRef.current);
    if (!shouldSend) {
      audioChunksRef.current = [];
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // ── Load base data ─────────────────────────────────────────────────────
  const loadBaseData = useCallback(async () => {
    try {
      const [resU, resG, resS] = await Promise.all([
        apiCall('get_company_users', {}, 'GET'),
        apiCall('get_message_groups', {}, 'GET'),
        apiCall('get_statuses', {}, 'GET'),
      ]);
      if (resU?.success) setUsersList(resU.users || []);
      if (resG?.success) setGroups(resG.groups || []);
      if (resS?.success) setStatuses(resS.statuses || []);
    } catch { }
  }, []);

  useEffect(() => { loadBaseData(); }, [loadBaseData]);

  // ── Load messages for selected chat ───────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      let res;
      if (selectedChat.type === 'user') {
        res = await apiCall('get_private_messages', { with_email: selectedChat.id }, 'GET');
      } else {
        res = await apiCall('get_group_messages', { group_id: selectedChat.id }, 'GET');
      }
      if (res?.success) {
        setMessages(res.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } catch { }
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;
    loadMessages();
    const interval = setInterval(loadMessages, 6000); // 6s
    return () => clearInterval(interval);
  }, [selectedChat, loadMessages]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = async (fileBlob = null, fileType = '') => {
    if ((!chatInput.trim() && !fileBlob) || !selectedChat || sendingMsg) return;
    setSendingMsg(true);
    const txt = chatInput.trim();
    setChatInput('');
    try {
      if (selectedChat.type === 'user') {
        const formData = new FormData();
        formData.append('receiver_email', selectedChat.id);
        if (fileBlob) {
          const extension = fileType.includes('audio') ? 'wav' : 'bin';
          const fileName = `attachment_${Date.now()}.${extension}`;
          formData.append('file', fileBlob, fileName);
          formData.append('message', txt || 'Fichier audio');
        } else {
          formData.append('message', txt);
        }
        await fetch('/api.php?action=send_private_message', { 
          method: 'POST', 
          body: formData, 
          credentials: 'include',
          headers: {
            'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || ''
          }
        });
      } else {
        if (fileBlob) {
          // Group: first upload file
          const formData = new FormData();
          const extension = fileType.includes('audio') ? 'wav' : 'bin';
          const fileName = `attachment_${Date.now()}.${extension}`;
          formData.append('file', fileBlob, fileName);
          formData.append('type', 'chat');
          
          const resUpload = await fetch('/api.php?action=upload_file', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || ''
            }
          });
          const uploadRes = await resUpload.json();
          if (uploadRes.success) {
            await apiCall('send_group_message', { 
              group_id: selectedChat.id, 
              content: txt || 'Fichier audio', 
              attachment: uploadRes.url,
              attachment_name: fileName
            });
          }
        } else {
          await apiCall('send_group_message', { group_id: selectedChat.id, content: txt });
        }
      }
      await loadMessages();
    } catch (e) {
      console.error("Error sending message", e);
    }
    finally { setSendingMsg(false); setTimeout(() => chatInputRef.current?.focus(), 50); }
  };

  // ── Incoming call polling ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const checkIncoming = async () => {
      try {
        const res = await apiCall('check_incoming_call', {}, 'GET');
        if (res?.success && res.call) {
          setIncomingCall(res.call);
        } else {
          setIncomingCall(null);
        }
      } catch { }
    };
    checkIncoming();
    const interval = setInterval(checkIncoming, 8000); // 8s
    return () => clearInterval(interval);
  }, [user?.email]);

  // ── Call ────────────────────────────────────────────────────────────────
  const startCall = async (type) => {
    if (!selectedChat) return;
    const room = `elysium_${user.company_id}_${[user.email, selectedChat.id].sort().join('_')}_${type}`;
    const roomName = room.replace(/[^a-zA-Z0-9_]/g, '_');
    // Signal the outgoing call
    try {
      await apiCall('start_call', {
        callee_email: selectedChat.id,
        room_name: roomName,
        call_type: type
      });
    } catch { }
    setCallData({ type, roomName });
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    setCallData({ type: incomingCall.call_type || 'video', roomName: incomingCall.room_name });
    setIncomingCall(null);
  };

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    try { await apiCall('end_call', { room_name: incomingCall.room_name }); } catch { }
    setIncomingCall(null);
  };

  // ── Select chat ────────────────────────────────────────────────────────
  const selectChat = (item, type) => {
    const name = item.email === user?.email ? "Note personnelle (Vous)" : (item.name || item.email || item.id);
    const photo = item.profile_photo || item.photo || null;
    const service = item.service || '';
    setSelectedChat({ type, id: item.email || item.id, name, photo, service, isAdmin: item.role === 'admin', is_announcement: item.is_announcement });
    setMessages([]);
    setShowProfile(null);
    if (window.innerWidth < 768) setIsMobileChat(true);
  };

  // ── Sidebar item renderer ──────────────────────────────────────────────
  const renderItem = (item, type) => {
    const isSelected = selectedChat?.id === (item.email || item.id);
    const name = item.email === user?.email ? "Note personnelle (Vous)" : (item.name || item.email || item.id);
    const photo = item.profile_photo || item.photo || null;
    return (
      <div
        key={item.email || item.id}
        onClick={() => selectChat(item, type)}
        style={{ display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', background: isSelected ? '#2a3942' : 'transparent', borderBottom: '1px solid #222d34', transition: 'background 0.15s' }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#202c33'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
        <div style={{ position: 'relative', marginRight: '13px', flexShrink: 0 }}>
          <img src={photo || getAvatar(name)} alt={name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
          {type === 'group' && !item.is_announcement && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#00a884', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111b21' }}>
              <Users size={10} color="#fff" />
            </div>
          )}
          {type === 'community' && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#25d366', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111b21' }}>
              <Bell size={10} color="#fff" />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
            <span style={{ color: '#e9edef', fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
          <div style={{ color: '#8696a0', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {type === 'user' ? (item.service || item.email) : (item.is_announcement ? '📢 Canal d\'annonces' : `👥 ${(item.members || []).length} membre(s)`)}
          </div>
        </div>
      </div>
    );
  };

  // ── Filtered lists ─────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase();
  const filteredUsers = usersList.filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  const filteredGroups = groups.filter(g => !g.is_announcement && (!q || g.name?.toLowerCase().includes(q)));
  const filteredCommunities = groups.filter(g => g.is_announcement && (!q || g.name?.toLowerCase().includes(q)));

  // ── Group messages by date ─────────────────────────────────────────────
  const groupedMessages = messages.reduce((acc, m) => {
    const date = formatDate(m.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  const myPhoto = user?.profile_photo;

  // ── Chat panel ─────────────────────────────────────────────────────────
  const renderChatPanel = () => {
    if (!selectedChat) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222d34', borderBottom: '6px solid #00a884' }}>
          <div style={{ width: 120, height: 120, background: 'rgba(0,168,132,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <MessageSquare size={52} color="#00a884" />
          </div>
          <h2 style={{ color: '#e9edef', fontWeight: 300, fontSize: '1.8rem', margin: '0 0 10px' }}>ELYSIUM Messages</h2>
          <p style={{ color: '#8696a0', fontSize: '14px', maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>
            Sélectionnez une conversation dans la liste ou créez un nouveau groupe pour commencer.
          </p>
          <button onClick={() => setShowCreateGroup(true)} style={{ marginTop: 20, background: '#00a884', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Nouveau groupe
          </button>
        </div>
      );
    }

    const canSend = selectedChat.type !== 'community' || selectedChat.isAdmin;

    return (
      <>
        {/* Chat Header */}
        <div style={{ padding: '8px 14px', background: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '1px solid #222d34', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
            onClick={() => {
              if (selectedChat.type === 'user') {
                setShowProfile({ name: selectedChat.name, email: selectedChat.id, photo: selectedChat.photo, service: selectedChat.service });
              } else {
                const g = groups.find(x => x.id === selectedChat.id);
                if (g) setShowGroupInfo(g);
              }
            }}>
            {isMobileChat && (
              <button onClick={(e) => { e.stopPropagation(); setSelectedChat(null); setIsMobileChat(false); }} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: 4 }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <img src={selectedChat.photo || getAvatar(selectedChat.name)} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '15px' }}>{selectedChat.name}</div>
              <div style={{ color: '#8696a0', fontSize: '12px' }}>
                {selectedChat.type === 'user' ? 'Cliquez pour voir le profil' : selectedChat.is_announcement ? '📢 Canal d\'annonces' : '👥 Groupe'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '18px', color: '#aebac1', alignItems: 'center' }}>
            {selectedChat.type === 'user' && <>
              <Video size={22} style={{ cursor: 'pointer' }} onClick={() => startCall('video')} />
              <Phone size={22} style={{ cursor: 'pointer' }} onClick={() => startCall('audio')} />
            </>}
            <Search size={20} style={{ cursor: 'pointer' }} />
            <MoreVertical size={20} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Messages body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 5% 8px', display: 'flex', flexDirection: 'column', backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAB3RJTUUH4gIeECsQHCn6AAAAB3RJTUFJRTsAAAAPSURBVDjLY2AYBUMOAAABkAABMvKxvwAAAABJRU5ErkJggg==')", backgroundRepeat: 'repeat', opacity: 0.97 }}>
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ background: '#182229', color: '#8696a0', fontSize: '12px', padding: '4px 12px', borderRadius: '8px' }}>{date}</span>
              </div>
              {msgs.map(m => {
                const isMine = (m.sender_email || m.from_user_email) === user.email;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '4px', alignItems: 'flex-end', gap: 6 }}>
                    {!isMine && selectedChat.type !== 'user' && (
                      <img src={m.profile_photo || getAvatar(m.sender_name)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', marginBottom: 2 }} />
                    )}
                    <div style={{ background: isMine ? '#005c4b' : '#202c33', color: '#e9edef', padding: '6px 9px 20px', borderRadius: isMine ? '7.5px 7.5px 0 7.5px' : '0 7.5px 7.5px 7.5px', maxWidth: '62%', position: 'relative', boxShadow: '0 1px 0.5px rgba(11,20,26,.2)' }}>
                      {!isMine && selectedChat.type !== 'user' && (
                        <div style={{ color: '#53bdeb', fontSize: '12px', fontWeight: 600, marginBottom: 2 }}>{m.sender_name || m.sender_email}</div>
                      )}
                      {renderMessageContent(m)}
                      <div style={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', alignItems: 'center', gap: 3, fontSize: '10px', color: 'rgba(255,255,255,0.55)' }}>
                        {formatTime(m.created_at)}
                        {isMine && <CheckCheck size={13} color="#53bdeb" />}
                      </div>
                    </div>
                    {isMine && (
                      <img src={myPhoto || getAvatar(user?.name)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', marginBottom: 2 }} />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#8696a0' }}>
                <MessageSquare size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
                <p style={{ fontSize: '14px' }}>Aucun message. Soyez le premier à écrire !</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canSend ? (
          <div style={{ padding: '8px 14px', background: '#202c33', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, position: 'relative' }}>
            {isRecording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '4px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', animation: 'pulse 1.5s infinite' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  Enregistrement...
                </span>
                <span style={{ color: '#e9edef', fontFamily: 'monospace', fontSize: '15px' }}>
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
                
                <div style={{ flex: 1 }} />
                
                <button onClick={() => stopRecording(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={22} style={{ color: '#ef4444' }} /> Annuler
                </button>
                
                <button onClick={() => stopRecording(true)} style={{ background: '#00a884', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Send size={20} color="#fff" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowEmojiPicker(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: '4px' }}>
                  <Smile size={26} />
                </button>

                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '60px', left: '14px', background: '#202c33', borderRadius: '12px', padding: '12px', width: '320px', height: '320px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', border: '1px solid #2a3942', zIndex: 10 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #2a3942', paddingBottom: '6px', marginBottom: '8px', justifyContent: 'space-around' }}>
                      {Object.keys(EMOJI_CATEGORIES).map(cat => (
                        <button key={cat} onClick={() => setActiveEmojiTab(cat)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderBottom: activeEmojiTab === cat ? '2px solid #00a884' : 'none' }}>
                          {EMOJI_CATEGORIES[cat].icon}
                        </button>
                      ))}
                    </div>
                    {/* Grid */}
                    <div className="whatsapp-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', paddingRight: '4px' }}>
                      {EMOJI_CATEGORIES[activeEmojiTab].list.map(e => (
                        <span key={e} style={{ fontSize: '22px', cursor: 'pointer', textAlign: 'center', userSelect: 'none' }}
                          onClick={() => { setChatInput(p => p + e); }}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Taper un message..."
                  style={{ flex: 1, background: '#2a3942', border: 'none', borderRadius: '10px', padding: '10px 14px', color: '#d1d7db', fontSize: '15px', outline: 'none' }}
                />

                {chatInput.trim() ? (
                  <button onClick={() => sendMessage()} disabled={sendingMsg} style={{ background: '#00a884', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Send size={20} color="#fff" />
                  </button>
                ) : (
                  <button onClick={startRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', padding: '4px' }}>
                    <Mic size={26} />
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ padding: '14px', background: '#202c33', textAlign: 'center', color: '#8696a0', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Lock size={14} />
            Seuls les administrateurs peuvent envoyer des messages dans ce canal d'annonces.
          </div>
        )}
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="wa-container" style={{ display: 'flex', width: '100%', height: '100%', background: '#0b141a', color: '#e9edef', fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", overflow: 'hidden' }}>
      <style>{`
        .wa-container *::-webkit-scrollbar { width: 6px; height: 6px; display: block !important; }
        .wa-container *::-webkit-scrollbar-track { background: transparent; }
        .wa-container *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .wa-container *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: '360px', minWidth: '280px', maxWidth: '400px', borderRight: '1px solid #222d34', display: 'flex', flexDirection: 'column', background: '#111b21', flexShrink: 0, ...(isMobileChat ? { display: 'none' } : {}) }}>

        {/* Header */}
        <div style={{ padding: '10px 16px', background: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <img
            src={myPhoto || getAvatar(user?.name)}
            alt="me"
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #00a884' }}
            onClick={() => setShowProfile('me')}
            title="Voir mon profil"
          />
          <div style={{ display: 'flex', gap: '18px', color: '#aebac1', alignItems: 'center' }}>
            <button title="Communautés" onClick={() => setWaTab('communities')} style={{ background: 'none', border: 'none', color: waTab === 'communities' ? '#00a884' : '#aebac1', cursor: 'pointer', padding: 2 }}><Users size={22} /></button>
            <button title="Statuts" onClick={() => setWaTab('status')} style={{ background: 'none', border: 'none', color: waTab === 'status' ? '#00a884' : '#aebac1', cursor: 'pointer', padding: 2 }}><CircleDashed size={22} /></button>
            <button title="Discussions" onClick={() => setWaTab('chats')} style={{ background: 'none', border: 'none', color: waTab === 'chats' ? '#00a884' : '#aebac1', cursor: 'pointer', padding: 2 }}><MessageSquare size={22} /></button>
            <button title="Nouveau groupe" onClick={() => setShowCreateGroup(true)} style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: 2 }}><Plus size={22} /></button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', background: '#111b21', borderBottom: '1px solid #222d34', flexShrink: 0 }}>
          <div style={{ background: '#202c33', borderRadius: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={17} color="#8696a0" />
            <input
              type="text"
              placeholder="Rechercher ou démarrer une discussion"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#d1d7db', width: '100%', outline: 'none', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* CHATS TAB */}
          {waTab === 'chats' && (
            <>
              {filteredGroups.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px 4px', color: '#00a884', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1418' }}>Groupes</div>
                  {filteredGroups.map(g => renderItem(g, 'group'))}
                </>
              )}
              <div style={{ padding: '8px 16px 4px', color: '#00a884', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1418', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Collègues</span>
                <span style={{ color: '#8696a0', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>{filteredUsers.length}</span>
              </div>
              {filteredUsers.map(u => renderItem(u, 'user'))}
              {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: '#8696a0', fontSize: '14px' }}>Aucun résultat</div>
              )}
            </>
          )}

          {/* COMMUNITIES TAB */}
          {waTab === 'communities' && (
            <>
              <div style={{ padding: '12px 14px' }}>
                <button onClick={() => setShowCreateGroup(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,168,132,0.1)', border: '1px dashed rgba(0,168,132,0.4)', borderRadius: '10px', padding: '12px 14px', cursor: 'pointer', color: '#00a884', fontWeight: 600, fontSize: '14px' }}>
                  <Plus size={18} /> Nouveau canal d'annonces
                </button>
              </div>
              {filteredCommunities.length > 0 && (
                <>
                  <div style={{ padding: '4px 16px 4px', color: '#00a884', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1418' }}>Canaux</div>
                  {filteredCommunities.map(g => renderItem(g, 'community'))}
                </>
              )}
              {filteredCommunities.length === 0 && (
                <div style={{ padding: '20px 20px', textAlign: 'center', color: '#8696a0', fontSize: '13px', lineHeight: 1.6 }}>
                  Aucun canal d'annonces pour l'instant.<br />Créez-en un pour diffuser des informations officielles.
                </div>
              )}
            </>
          )}

          {/* STATUS TAB */}
          {waTab === 'status' && (
            <div>
              {/* My status */}
              <div
                onClick={() => setShowPostStatus(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #222d34', background: 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#202c33'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ position: 'relative' }}>
                  <img src={myPhoto || getAvatar(user?.name)} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2a3942' }} alt="me" />
                  <div style={{ position: 'absolute', bottom: -1, right: -1, background: '#00a884', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111b21' }}>
                    <Plus size={12} color="#fff" />
                  </div>
                </div>
                <div>
                  <div style={{ color: '#e9edef', fontSize: '15px', fontWeight: 500 }}>Mon statut</div>
                  <div style={{ color: '#8696a0', fontSize: '13px' }}>Appuyez pour ajouter un statut</div>
                </div>
              </div>

              {/* Others statuses */}
              {statuses.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px 4px', color: '#8696a0', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1418' }}>Mises à jour récentes</div>
                  {statuses.map((s, idx) => (
                    <div
                      key={s.user_email}
                      onClick={() => setShowStatusViewer2({ visible: true, statuses, startIndex: idx })}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #222d34', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#202c33'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ padding: '2px', borderRadius: '50%', background: 'conic-gradient(#00a884, #25d366, #00a884)' }}>
                        <img src={s.profile_photo || getAvatar(s.user_name)} style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #111b21', objectFit: 'cover' }} alt="" />
                      </div>
                      <div>
                        <div style={{ color: '#e9edef', fontSize: '15px', fontWeight: 500 }}>{s.user_name}</div>
                        <div style={{ color: '#8696a0', fontSize: '13px' }}>{s.statuses?.length || 1} statut(s) • {s.statuses?.[s.statuses.length - 1]?.created_at ? formatDate(s.statuses[s.statuses.length - 1].created_at) : "Aujourd'hui"}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {statuses.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: '#8696a0', fontSize: '14px' }}>
                  Aucun statut récent de vos collègues.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', ...((isMobileChat || !selectedChat) ? {} : {}) }}>
        {renderChatPanel()}
      </div>

      {/* ── PROFILE PANEL ── */}
      {showProfile && (
        <ProfilePanel
          target={showProfile === 'me' ? null : showProfile}
          currentUser={{ ...user, profile_photo: myPhoto }}
          onClose={() => setShowProfile(null)}
        />
      )}

      {/* ── GROUP INFO PANEL ── */}
      {showGroupInfo && (
        <GroupInfoPanel
          group={showGroupInfo}
          currentUser={user}
          onClose={() => setShowGroupInfo(null)}
          onUpdated={() => { loadBaseData(); setShowGroupInfo(null); }}
          usersList={usersList}
        />
      )}

      {/* ── MODALS ── */}
      {callData && (
        <CallWindow
          roomName={callData.roomName}
          userDisplayName={user.name}
          userEmail={user.email}
          onClose={() => setCallData(null)}
        />
      )}

      {showStatusViewer2.visible && statuses.length > 0 && (
        <StatusViewer
          statuses={statuses}
          startIndex={showStatusViewer2.startIndex}
          currentUserEmail={user.email}
          onClose={() => setShowStatusViewer2({ visible: false, statuses: [], startIndex: 0 })}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          usersList={usersList}
          onClose={() => setShowCreateGroup(false)}
          onCreated={loadBaseData}
        />
      )}

      {showPostStatus && (
        <PostStatusModal
          user={user}
          onClose={() => setShowPostStatus(false)}
          onPosted={() => { loadBaseData(); setWaTab('status'); }}
        />
      )}

      {/* ── INCOMING CALL NOTIFICATION ── */}
      {incomingCall && !callData && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10000,
          background: '#202c33', borderRadius: 12, padding: 16,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)', display: 'flex',
          flexDirection: 'column', gap: 12, minWidth: 280, border: '1px solid #2a3942'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {incomingCall.call_type === 'audio' ? <Phone size={20} color="#fff" /> : <Video size={20} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e9edef', fontSize: 16, fontWeight: 600 }}>{incomingCall.caller_name || incomingCall.caller_email}</div>
              <div style={{ color: '#00a884', fontSize: 13 }}>Appel entrant...</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={declineIncomingCall} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#f15c6d', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Refuser
            </button>
            <button onClick={acceptIncomingCall} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#00a884', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Accepter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
