import React from 'react';
import { ChevronLeft, Plus, UserPlus, TrendingUp, RotateCcw, Briefcase, Lock, Unlock } from 'lucide-react';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';

export default function TopBar({
  onBack,
  backToSites,
  onSwitchToCurrent,
  archivePeriod,
  searchTerm,
  setSearchTerm,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filterShiftType,
  setFilterShiftType,
  filterFunction,
  setFilterFunction,
  functions,
  filterShowOnlyAbsences,
  setFilterShowOnlyAbsences,
  activeSiteId,
  isVerificationMode,
  isArchiveMode,
  sites,
  setShowAddSubsite,
  openAddAgentModal,
  openDeployExtraModal,
  openDeployReleveModal,
  datesList,
  period,
  siteData,
  showKPICards,
  setShowKPICards,
  handleResetYear,
  stats,
  openManageFunctionsModal,
  siteTableModes,
  setAndSaveSiteTableMode,
  agentSpacingMode,
  setAndSaveAgentSpacingMode,
  agentTableMode,
  agentSortOrder,
  setAndSaveAgentSortOrder,
  zoneSortOrder,
  setAndSaveZoneSortOrder,
  paintModeActive,
  setPaintModeActive,
  paintStatus,
  setPaintStatus,
  lockedZones = [],
  toggleAllZonesLock,
  isReturnToPayroll,
  returnSource,
  onReturnToPayroll,
  currentSiteAgents = []
}) {
  return (
    <div className="top-bar glass-panel" style={{ 
      position: 'sticky', 
      top: '-24px',
      margin: '-24px -24px 24px -24px', 
      zIndex: 100, 
      padding: '12px 24px 16px 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      background: 'var(--bg)', 
      backdropFilter: 'none',
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <style>
        {`
          .white-placeholder::placeholder {
            color: #555555 !important;
            opacity: 1 !important;
            font-weight: 500;
            text-align: center;
          }
          .hover-scale {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease-in-out !important;
          }
          .hover-scale:hover {
            transform: scale(1.05) !important;
            z-index: 10;
          }
          .btn-return-paie {
            transition: all 0.2s ease !important;
          }
          .btn-return-paie:hover {
            background-color: rgba(239, 68, 68, 0.4) !important;
            color: white !important;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3) !important;
            transform: translateY(-2px) !important;
          }
        `}
      </style>
      
      {/* LIGNE 1 : Mes Sites (Gauche), Recherche (Centre), Filtres & Actions (Droite) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        
        {/* GAUCHE : Mes Sites / Retour Paie & Recherche */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, flex: 1, gap: '16px' }}>
          {isReturnToPayroll ? (
            <button className="btn btn-secondary btn-return-paie" onClick={onReturnToPayroll} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <ChevronLeft size={16} /> {returnSource === 'salaries' ? 'Retour au Journal' : "Retour à l'État de Paie"}
            </button>
          ) : isArchiveMode ? (
            <>
              <button className="btn btn-secondary" onClick={() => activeSiteId ? backToSites() : (onBack ? onBack() : backToSites())} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronLeft size={16} /> Mes Sites
              </button>
              {onSwitchToCurrent && (
                <button className="btn btn-primary" onClick={onSwitchToCurrent} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                  Aller au pointage en cours
                </button>
              )}
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => activeSiteId ? backToSites() : (onBack ? onBack() : backToSites())} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={16} /> Mes Sites
            </button>
          )}
          
          <input
            type="text"
            className="form-input search-input-premium white-placeholder"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: isVerificationMode ? '650px' : '400px', background: '#ffffff', transition: 'all 0.3s', color: '#000000', textAlign: 'left', paddingLeft: '16px', border: '2px solid rgba(255,255,255,0.3)', margin: 0, marginLeft: '24px' }}
          />

          {activeSiteId && !isVerificationMode && !isArchiveMode && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '6px', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
              
              {openManageFunctionsModal && (
                <button 
                  className="btn hover-scale" 
                  onClick={openManageFunctionsModal}
                  style={{ 
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    border: 'none',
                    padding: '8px 14px', borderRadius: '8px',
                    color: 'white', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                  title="Gérer les Postes"
                >
                  <Briefcase size={16} />
                  Gérer les Postes
                </button>
              )}

              {(() => {
                let canAddZone = true;
                const activeSiteObj = sites?.find(s => s.id === activeSiteId);
                // Le site Administration affiche toujours le bouton DÉPARTEMENT
                if (activeSiteId === 'site_administration') {
                    canAddZone = true;
                } else if (activeSiteId === 'site_extras' || activeSiteId === 'site_extras_sur_site') {
                    canAddZone = true;
                } else if (activeSiteId === 'site_releves') {
                    canAddZone = true;
                } else if (activeSiteObj?.is_special) {
                    canAddZone = true;
                }
                return canAddZone && (
                  <button className="btn hover-scale" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }} onClick={() => setShowAddSubsite && setShowAddSubsite(true)}>
                    <Plus size={16} /> {activeSiteId === 'site_administration' ? 'DÉPARTEMENT' : 'Zone'}
                  </button>
                );
              })()}
              
              {/* Agent Button - Pure Green */}
              <button className="btn hover-scale" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }} onClick={openAddAgentModal}>
                <UserPlus size={16} /> Agent
              </button>
              
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
              
              <button className="btn hover-scale" style={{ background: '#f59e0b', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }} onClick={openDeployExtraModal}>
                ➕ EXTRAS
              </button>
              <button className="btn hover-scale" style={{ background: '#3b82f6', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }} onClick={openDeployReleveModal}>
                ➕ RELÈVES
              </button>

              <div style={{ position: 'relative' }}>
                <button 
                  className="btn hover-scale" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  style={{ 
                    background: showAdvancedFilters ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 14px',
                    color: showAdvancedFilters ? '#fff' : 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  title="Filtres avancés"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  Filtres
                  {(filterShiftType !== 'ALL' || filterFunction !== 'ALL' || filterShowOnlyAbsences) && (
                    <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', marginLeft: '4px' }} />
                  )}
                </button>
                
                {/* Panneau de filtres avancés */}
                {showAdvancedFilters && (
                  <div style={{
                    position: 'absolute', top: '100%', right: '0', marginTop: '10px',
                    background: '#0f172a', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '12px',
                    padding: '20px', zIndex: 9999, width: '350px', boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
                    display: 'flex', flexDirection: 'column', gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtres avancés</span>
                      <button onClick={() => { setFilterShiftType('ALL'); setFilterFunction('ALL'); setFilterShowOnlyAbsences(false); }} style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '0.8rem', cursor: 'pointer' }}>
                        Réinitialiser
                      </button>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>Vacation</label>
                      <select 
                        value={filterShiftType} 
                        onChange={e => setFilterShiftType(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="ALL" style={{ background: '#1e293b', color: 'white' }}>Toutes les vacations</option>
                        <option value="Jour" style={{ background: '#1e293b', color: 'white' }}>Jour (J)</option>
                        <option value="Nuit" style={{ background: '#1e293b', color: 'white' }}>Nuit (N)</option>
                        <option value="24h" style={{ background: '#1e293b', color: 'white' }}>24h</option>
                        <option value="48h" style={{ background: '#1e293b', color: 'white' }}>48h</option>
                        <option value="72h" style={{ background: '#1e293b', color: 'white' }}>72h</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>Fonction</label>
                      <select 
                        value={filterFunction} 
                        onChange={e => setFilterFunction(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        <option value="ALL" style={{ background: '#1e293b', color: 'white' }}>Toutes les fonctions</option>
                        {functions.map(f => (
                          <option key={f.id} value={f.id} style={{ background: '#1e293b', color: 'white' }}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        id="filterAbsences" 
                        checked={filterShowOnlyAbsences} 
                        onChange={e => setFilterShowOnlyAbsences(e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                      />
                      <label htmlFor="filterAbsences" style={{ fontSize: '0.85rem', cursor: 'pointer', color: filterShowOnlyAbsences ? '#ef4444' : 'white' }}>
                        N'afficher que les agents avec des absences
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {siteData && siteData.length > 0 && (() => {
                const currentZoneIds = siteData.map(sub => sub.id);
                const allAreLocked = currentZoneIds.length > 0 && currentZoneIds.every(id => lockedZones.includes(id));
                return (
                  <button
                    className="btn hover-scale"
                    onClick={toggleAllZonesLock}
                    style={{
                      background: allAreLocked ? '#ef4444' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '6px 10px',
                      color: allAreLocked ? '#fff' : 'rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '0.8rem',
                      height: '34px'
                    }}
                    title={allAreLocked ? "Déverrouiller toutes les zones" : "Verrouiller toutes les zones"}
                  >
                    {allAreLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    {allAreLocked ? "Zones verrouillées" : "Verrouiller les zones"}
                  </button>
                );
              })()}

            </div>
          )}
        </div>

        {/* DROITE : Filtres et Tris */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
          
          {activeSiteId && setAndSaveZoneSortOrder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} title="Trier les zones">
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Trier Zones :</span>
              <select 
                value={zoneSortOrder || 'none'} 
                onChange={(e) => setAndSaveZoneSortOrder(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <option value="none" style={{background:'#0f172a'}}>Aucun</option>
                <option value="alpha_asc" style={{background:'#0f172a'}}>A-Z</option>
                <option value="alpha_desc" style={{background:'#0f172a'}}>Z-A</option>
                <option value="created_asc" style={{background:'#0f172a'}}>Anciens en premier</option>
                <option value="created_desc" style={{background:'#0f172a'}}>Récents en premier</option>
              </select>
            </div>
          )}

          {activeSiteId && setAndSaveAgentSortOrder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} title="Trier les agents">
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Trier Agents :</span>
              <select 
                value={agentSortOrder || 'none'} 
                onChange={(e) => setAndSaveAgentSortOrder(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <option value="none" style={{background:'#0f172a'}}>Aucun</option>
                <option value="alpha_asc" style={{background:'#0f172a'}}>A-Z</option>
                <option value="alpha_desc" style={{background:'#0f172a'}}>Z-A</option>
                <option value="created_asc" style={{background:'#0f172a'}}>Anciens en premier</option>
                <option value="created_desc" style={{background:'#0f172a'}}>Récents en premier</option>
              </select>
            </div>
          )}

          {activeSiteId && siteTableModes && !isVerificationMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} title="Mode d'affichage pour ce site">
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Affichage :</span>
              <select 
                value={siteTableModes[activeSiteId] || (activeSiteId === 'site_extras' || activeSiteId === 'site_releves' ? 'individual' : agentTableMode || 'grouped')} 
                onChange={(e) => setAndSaveSiteTableMode(activeSiteId, e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <option value="grouped" style={{background:'#0f172a'}}>📊 Groupé</option>
                <option value="individual" style={{background:'#0f172a'}}>🃏 Individuel</option>
              </select>
            </div>
          )}

          {activeSiteId && setAndSaveAgentSpacingMode && !isVerificationMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} title="Mode d'espacement des agents">
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Espacement :</span>
              <select 
                value={agentSpacingMode || 'compact'} 
                onChange={(e) => setAndSaveAgentSpacingMode(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <option value="compact" style={{background:'#0f172a'}}>Compact (Aucun)</option>
                <option value="zebra" style={{background:'#0f172a'}}>Bandeau zébré</option>
                <option value="border" style={{background:'#0f172a'}}>Trait blanc</option>
                <option value="dashed" style={{background:'#0f172a'}}>Pointillés</option>
                <option value="colored_border" style={{background:'#0f172a'}}>Trait coloré</option>
                <option value="spacer" style={{background:'#0f172a'}}>Espacement normal</option>
                <option value="large_spacer" style={{background:'#0f172a'}}>Grand espacement</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* LIGNE 2 : Statistiques et Outils d'Exportation */}
      {activeSiteId && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          
          {/* GAUCHE : STATISTIQUES */}
          {stats && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(34, 197, 94, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Secteurs / Zones:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalZones}</span>
               </div>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(167, 139, 250, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Effectif Total:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalAgents}</span>
               </div>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(56, 189, 248, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Supplémentaires:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalSup}</span>
               </div>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(239, 68, 68, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Absences:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalAbsences ?? 0}</span>
               </div>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(245, 158, 11, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }} title={stats.agentsWithPermissions?.length > 0 ? "Agents : " + stats.agentsWithPermissions.join(', ') : "Aucune permission"}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Permissions:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalPermissions ?? 0}</span>
               </div>
               <div className="hover-scale" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(13, 148, 136, 0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Congés:</span>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{stats.totalConges ?? 0}</span>
               </div>
             </div>
          )}

          {/* DROITE : Export, KPI, Vérification */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
            {/* GROUPE VERIFICATION */}
            {isVerificationMode && false && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '6px', gap: '6px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
                <button className="btn" style={{ background: 'transparent', color: '#38bdf8', padding: '8px 14px', fontSize: '0.95rem' }} onClick={() => window.print()} title="Imprimer le pointage">
                  🖨️ Imprimer
                </button>
                <button className="btn" style={{ background: '#10b981', color: 'white', padding: '8px 14px', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} onClick={() => alert("Pointage validé avec succès pour le traitement de la paie.")} title="Valider le pointage">
                  ✅ Valider
                </button>
              </div>
            )}

            {/* GROUPE EXPORT */}
            {!isVerificationMode && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '6px', gap: '6px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center' }}>
                <button className="btn hover-scale" style={{ background: '#16a34a', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => exportToExcel({ sites, activeSiteId, datesList, period, siteData })} title="Exporter au format Excel">
                  📊 Excel
                </button>
              </div>
            )}

            {/* GROUPE AFFICHAGE */}
            {activeSiteId !== 'site_administration' && (
              <button 
                className="btn hover-scale" 
                style={{ background: showKPICards ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: `1px solid ${showKPICards ? 'rgba(249, 115, 22, 0.5)' : 'rgba(249, 115, 22, 0.3)'}`, borderRadius: '10px', padding: '8px 14px', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} 
                onClick={() => setShowKPICards(!showKPICards)} 
              >
                <TrendingUp size={16} /> 
                <span>{showKPICards ? 'Masquer KPI' : 'Voir KPI'}</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
