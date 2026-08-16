import React from 'react';

const AddSiteModal = ({
  showAddSite,
  setShowAddSite,
  newSiteName,
  setNewSiteName,
  newSiteLocation,
  setNewSiteLocation,
  isSpecialSite,
  setIsSpecialSite,
  specialSiteType,
  setSpecialSiteType,
  customBehavior,
  setCustomBehavior,
  handleCreateSite,
  errorMsg
}) => {
  if (!showAddSite) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '420px' }}>
        <h3 style={{ marginBottom: '16px' }}>Nouveau Site</h3>
        {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
        <input className="form-input" style={{ width: '100%', marginBottom: '16px' }} placeholder="Nom du site..." value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />

        <div style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="siteLocation" value="abidjan" checked={newSiteLocation === 'abidjan'} onChange={e => setNewSiteLocation(e.target.value)} />
            Abidjan
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="siteLocation" value="interieur" checked={newSiteLocation === 'interieur'} onChange={e => setNewSiteLocation(e.target.value)} />
            Intérieur
          </label>
        </div>

        <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: isSpecialSite ? '8px' : '0' }}>
            <input type="checkbox" checked={isSpecialSite} onChange={e => setIsSpecialSite(e.target.checked)} />
            <span style={{ fontWeight: 'bold' }}>Ceci est un Vivier Spécial</span>
          </label>
          {isSpecialSite && (
            <>
              <select
                className="form-input"
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', marginBottom: specialSiteType === 'definir' ? '12px' : '0' }}
                value={specialSiteType}
                onChange={e => setSpecialSiteType(e.target.value)}
              >
                <option value="extras">Comportement : Extras (Réserve)</option>
                <option value="releves">Comportement : Relèves (Remplaçants)</option>
                <option value="admin">Comportement : Administration</option>
                <option value="custom">Autre / Libre</option>
                <option value="definir">Définir le comportement</option>
              </select>

              {specialSiteType === 'definir' && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Choisissez l'affichage :</label>
                  <select
                    className="form-input"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderColor: 'var(--b)', color: 'white' }}
                    value={customBehavior}
                    onChange={e => setCustomBehavior(e.target.value)}
                  >
                    <option value="grouped">Classique (Tableau unique)</option>
                    <option value="manual_zones">Option A : Création de Zones</option>
                    <option value="auto_individual">Option B : 1 Tableau par Agent</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddSite(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleCreateSite}>Créer</button>
        </div>
      </div>
    </div>
  );
};

export default AddSiteModal;
