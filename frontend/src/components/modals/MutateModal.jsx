import React from 'react';
import { Users, X, ChevronDown } from 'lucide-react';

export default function MutateModal({
  currentMutationPalette,
  mutateAgentName,
  errorMsg,
  searchMutationText,
  setSearchMutationText,
  setMutateDestSubsiteId,
  mutateDestSubsiteId,
  showMutationDropdown,
  setShowMutationDropdown,
  sites,
  datesList,
  formatDateKey,
  mutateStart,
  setMutateStart,
  mutateNewShiftType,
  setMutateNewShiftType,
  mutateNewFunction,
  setMutateNewFunction,
  activeSiteId,
  functions,
  onClose,
  onSubmit,
  isMutating
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(12px)', padding: '20px' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', maxHeight: '92vh', overflowY: 'auto', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', border: `1px solid ${currentMutationPalette.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)', animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: currentMutationPalette.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${currentMutationPalette.iconBg.replace('0.2)', '0.1)')}` }}>
            <Users size={20} style={{ color: currentMutationPalette.iconColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-0.02em' }}>Mutation Temporaire</h3>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Agent: <span style={{ color: currentMutationPalette.agentName, fontWeight: '700', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px' }}>{mutateAgentName}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          
          {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '20px', borderRadius: '10px', fontSize: '0.9rem' }}>{errorMsg}</div>}

          {/* Sélection de la zone de destination */}
          <div style={{ marginBottom: '15px', position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
              Zone de Destination
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                placeholder="Chercher ou choisir une zone..."
                value={searchMutationText}
                onChange={(e) => {
                  setSearchMutationText(e.target.value);
                  setMutateDestSubsiteId(''); // Reset id if user is typing
                  setShowMutationDropdown(true);
                }}
                onFocus={() => setShowMutationDropdown(true)}
                onBlur={() => setTimeout(() => setShowMutationDropdown(false), 200)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', padding: '12px 34px 12px 14px', color: '#f8fafc', outline: 'none', fontSize: '0.95rem', transition: 'all 0.2s', fontWeight: mutateDestSubsiteId ? '600' : '400' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = currentMutationPalette.selectedBorder}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = currentMutationPalette.dropdownBorder}
              />
              <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: currentMutationPalette.iconColor, transition: 'transform 0.3s', pointerEvents: 'none', transform: showMutationDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0)' }} />
            </div>
            
            {showMutationDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#1e293b', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', maxHeight: '250px', overflowY: 'auto', zIndex: 50, boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
                {sites.flatMap(s => {
                  const zoneCount = (s.subsites || []).length;
                  return (s.subsites || []).map(sub => ({ ...sub, siteName: s.name, zoneCount }));
                })
                  .filter(sub => {
                    const searchStr = sub.zoneCount > 2 ? sub.name : `${sub.siteName} - ${sub.name}`;
                    return searchStr.toLowerCase().includes(searchMutationText.toLowerCase());
                  })
                  .map(sub => {
                    const displayTitle = sub.zoneCount > 2 ? sub.name : `${sub.siteName} - ${sub.name}`;
                    return (
                      <div 
                        key={sub.id}
                        style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = currentMutationPalette.hoverBg}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setMutateDestSubsiteId(sub.id);
                          setSearchMutationText(displayTitle);
                          setShowMutationDropdown(false);
                        }}
                      >
                        <div style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>{displayTitle}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Sélection de la date — chips cliquables */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
              Date de Mutation (Début)
            </label>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.containerBorder}`, borderRadius: '12px', padding: '12px', paddingBottom: '8px', overflowX: 'auto', overflowY: 'hidden', display: 'flex', flexWrap: 'nowrap', gap: '8px' }}>
              {datesList.map(date => {
                const dk = formatDateKey(date);
                const isSelected = mutateStart === dk;
                const dayNum = date.getDate();
                const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
                return (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => setMutateStart(dk)}
                    style={{
                      flexShrink: 0,
                      minWidth: '55px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${currentMutationPalette.selectedBorder}` : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? currentMutationPalette.selectedBg : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? `0 0 12px ${currentMutationPalette.selectedBg.replace('0.35)', '0.5)')}` : 'none',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: isSelected ? currentMutationPalette.selectedText : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{dayName}</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)', margin: '2px 0' }}>{dayNum}</span>
                    <span style={{ fontSize: '0.7rem', color: isSelected ? currentMutationPalette.selectedText : 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{monthName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vacation à appliquer */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
              Vacation de Remplacement
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={mutateNewShiftType}
                onChange={(e) => setMutateNewShiftType(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}
              >
                <option value="CONSERVER" style={{ background: '#1e293b' }}>-- Conserver les vacations actuelles --</option>
                <option value="Jour" style={{ background: '#1e293b' }}>Jour</option>
                <option value="Nuit" style={{ background: '#1e293b' }}>Nuit</option>
                <option value="24H" style={{ background: '#1e293b' }}>24H</option>
                <option value="48H" style={{ background: '#1e293b' }}>48H</option>
                <option value="72H" style={{ background: '#1e293b' }}>72H</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: currentMutationPalette.iconColor, pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Nouvelle Fonction */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentMutationPalette.iconColor }} />
              Nouvelle Fonction
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={mutateNewFunction}
                onChange={(e) => setMutateNewFunction(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${currentMutationPalette.dropdownBorder}`, borderRadius: '10px', padding: '12px 14px', color: '#f8fafc', outline: 'none', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}
              >
                <option value="CONSERVER" style={{ background: '#1e293b' }}>-- Conserver la fonction actuelle --</option>
                {functions.map(f => (
                  <option key={f.id} value={f.id} style={{ background: '#1e293b' }}>{f.fullName || f.id}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: currentMutationPalette.iconColor, pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              disabled={isMutating}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: isMutating ? 'not-allowed' : 'pointer', opacity: isMutating ? 0.5 : 1, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if(!isMutating) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
              onMouseLeave={(e) => { if(!isMutating) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
            >
              Annuler
            </button>
            <button 
              onClick={onSubmit}
              disabled={isMutating}
              style={{ flex: 2, padding: '12px', background: currentMutationPalette.btnBg, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontWeight: '800', cursor: isMutating ? 'not-allowed' : 'pointer', boxShadow: isMutating ? 'none' : `0 6px 15px ${currentMutationPalette.btnShadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isMutating ? 0.7 : 1, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if(!isMutating) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 20px ${currentMutationPalette.btnShadow}`; } }}
              onMouseLeave={(e) => { if(!isMutating) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 15px ${currentMutationPalette.btnShadow}`; } }}
              onMouseDown={(e) => { if(!isMutating) { e.currentTarget.style.transform = 'scale(0.97)'; } }}
              onMouseUp={(e) => { if(!isMutating) { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            >
              {isMutating ? (
                <>
                  <svg className="lucide-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  Patientez...
                </>
              ) : (
                "Valider la Mutation"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
