import React, { useState, useRef } from 'react';
import { apiCall } from '../../api';
import { X, Plus, Trash2, CheckCircle2, Save, Briefcase, Loader2, AlertCircle, Edit2 } from 'lucide-react';

export default function ManageFunctionsModal({ onClose, functions, setFunctions }) {
  const [newFuncId, setNewFuncId] = useState('');
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncType, setNewFuncType] = useState('agent');
  const [newFuncIcon, setNewFuncIcon] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiList = ['👤', '🛡️', '🔫', '🐕', '⭐', '⏱️', '👟', '🚘', '👔', '👨‍✈️', '👷', '⚕️', '🚁', '👮', '🔧', '📝', '🔑', '🏢', '🚗', '🎧', '🚨', '💼'];
  
  const [loading, setLoading] = useState(false);
  const [editingFuncId, setEditingFuncId] = useState(null);
  
  const formRef = useRef(null);

  const handleEditClick = (f) => {
    setEditingFuncId(f.id);
    setNewFuncId(f.id);
    setNewFuncName(f.name);
    setNewFuncType(f.type || 'agent');
    setNewFuncIcon(f.icon || '');
    setError('');
    setSuccessMsg('');
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cancelEdit = () => {
    setEditingFuncId(null);
    setNewFuncId('');
    setNewFuncName('');
    setNewFuncType('agent');
    setNewFuncIcon('');
    setError('');
  };
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async () => {
    if (!newFuncId.trim() || !newFuncName.trim()) {
      setError("Veuillez remplir le code et le nom du poste.");
      return;
    }
    
    // Vérifier si le code existe déjà (en ajout, ou en modif si le code a changé)
    const normalizeId = (id) => id.toUpperCase().trim().replace(/\s+/g, ' ');
    const existing = functions.find(f => normalizeId(f.id) === normalizeId(newFuncId) && f.id !== editingFuncId);
    if (existing) {
      setError(`Ce code de poste existe déjà → "${existing.name}" (${existing.id}). Faites défiler la liste pour le trouver.`);
      return;
    }

    setLoading(true);
    setError('');
    
    const newFunc = { 
      id: newFuncId.toUpperCase().trim(), 
      name: newFuncName.trim(), 
      type: newFuncType,
      icon: newFuncIcon.trim() || ''
    };
    
    let updatedFunctions;
    if (editingFuncId) {
      updatedFunctions = functions.map(f => f.id === editingFuncId ? newFunc : f);
    } else {
      updatedFunctions = [...functions, newFunc];
    }
    
    try {
      // Strip frontend-only fields (fullName) before saving
      const cleanFunctions = updatedFunctions.map(({ fullName, ...rest }) => rest);
      const res1 = await apiCall('save_functions', { functions: cleanFunctions });
      
      if (!editingFuncId || editingFuncId !== newFunc.id) {
        const resConfig = await apiCall('get_salary_config', {}, 'GET');
        let salaryConfig = resConfig.success ? (resConfig.config || {}) : {};
        if (salaryConfig[newFunc.id] === undefined) {
          salaryConfig[newFunc.id] = 0;
        }
        await apiCall('save_salary_grid', { grid: salaryConfig });
      }

      if (res1.success) {
        setFunctions(updatedFunctions);
        cancelEdit();
        
        setSuccessMsg(editingFuncId ? "Le poste a été modifié avec succès." : "Le poste a été créé avec succès.");
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res1.message || "Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      console.error(e);
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFunction = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette fonction ?\\n\\nATTENTION : Cette action supprimera la fonction de tous les agents actuellement affectés à ce poste dans le planning en cours.")) return;
    
    setLoading(true);
    const updated = functions.filter(f => f.id !== id);
    
    try {
      const res = await apiCall('save_functions', { functions: updated });
      if (res.success) {
        setFunctions(updated);
        setSuccessMsg("Poste supprimé.");
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError("Erreur de suppression.");
      }
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#0d1526', borderRadius: '20px', padding: '30px',
        maxWidth: '900px', width: '100%', position: 'relative',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <Briefcase size={24} color="#a855f7" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>Gestion des Postes / Fonctions</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>Ajoutez ou supprimez des fonctions pour les agents.</p>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '16px' }}>
            <input 
              type="text" 
              placeholder="Rechercher une fonction..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '12px 18px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.4)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', width: '350px', fontSize: '1rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', padding: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '12px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {/* Formulaire d'ajout */}
          <div ref={formRef} style={{
            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px', padding: '20px', marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingFuncId ? <Edit2 size={18} color="#a855f7" /> : <Plus size={18} color="#a855f7" />} 
              {editingFuncId ? "Modifier le poste" : "Créer un nouveau poste"}
            </h3>
            
            {editingFuncId && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '12px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Attention :</strong> Si vous modifiez le <strong>Code</strong>, les agents qui étaient affectés à l'ancien code ne seront pas automatiquement mis à jour. Cela peut causer des incohérences dans les affectations et le calcul de la paie.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Code (ex: CP)</label>
                <input 
                  type="text" placeholder="CP" maxLength={10}
                  value={newFuncId} onChange={(e) => setNewFuncId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                />
              </div>
              <div style={{ flex: '0 0 60px', position: 'relative' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Icône</label>
                <input 
                  type="text" placeholder="Vide" maxLength={5}
                  value={newFuncIcon} onChange={(e) => setNewFuncIcon(e.target.value)}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', textAlign: 'center', cursor: 'pointer' }}
                  readOnly
                />
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '220px' }}>
                    {emojiList.map(emoji => (
                      <button key={emoji} type="button" onClick={() => { setNewFuncIcon(emoji); setShowEmojiPicker(false); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', fontSize: '1.2rem', padding: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                        {emoji}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setNewFuncIcon(''); setShowEmojiPicker(false); }} style={{ gridColumn: '1 / -1', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.85rem', padding: '6px', cursor: 'pointer', marginTop: '4px' }}>Aucune icône (Vide)</button>
                  </div>
                )}
              </div>
              <div style={{ flex: '2 1 200px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Nom complet</label>
                <input 
                  type="text" placeholder="Chef de Poste"
                  value={newFuncName} onChange={(e) => setNewFuncName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>Catégorie</label>
                <select 
                  value={newFuncType} onChange={(e) => setNewFuncType(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                >
                  <option value="agent">Agents</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto' }}>
                {editingFuncId && (
                  <button 
                    onClick={cancelEdit}
                    disabled={loading}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', 
                      borderRadius: '10px', padding: '0 16px', height: '42px', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}
                  >
                    Annuler
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  style={{ 
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', 
                    borderRadius: '10px', padding: '0 20px', height: '42px', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (editingFuncId ? "Modifier" : "Ajouter")}
                </button>
              </div>
            </div>
            <div style={{ marginTop: '16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '10px 14px', borderRadius: '8px', color: '#bae6fd', fontSize: '0.85rem' }}>
              💡 Le poste sera visible pour les agents. Le salaire de base devra être configuré par la comptabilité dans la "Configuration d'Entreprise".
            </div>
          </div>

          {/* Liste des postes */}
          <div>
            <h3 style={{ color: '#cbd5e1', fontSize: '1.05rem', marginBottom: '16px' }}>Postes configurés ({functions.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {functions.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                <div key={f.id} style={{
                  background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {f.icon && <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>}
                      <span style={{ background: '#3b82f6', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px' }}>{f.id}</span>
                      <span style={{ color: 'white', fontWeight: 600 }}>{f.name}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{f.type === 'admin' ? 'Administration' : 'Agents'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEditClick(f)}
                      disabled={loading}
                      style={{ background: 'rgba(56, 189, 248, 0.1)', border: 'none', color: '#38bdf8', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                      title="Modifier ce poste"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteFunction(f.id)}
                      disabled={loading}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      title="Supprimer ce poste"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {functions.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic' }}>
                  Aucun poste configuré pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
