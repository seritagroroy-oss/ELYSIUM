import React from 'react';

export default function AddSubsiteModal({
  activeSiteId,
  errorMsg,
  newSubsiteName,
  setNewSubsiteName,
  onClose,
  onSubmit
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '16px' }}>
          {activeSiteId === 'site_administration' ? 'Ajouter un nouveau Département' : 'Ajouter une nouvelle Zone'}
        </h3>
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">
              {activeSiteId === 'site_administration' ? 'Nom du Département' : 'Nom de la Zone / Secteur'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={activeSiteId === 'site_administration' ? 'ex: Comptabilité' : 'ex: Zone Sud'}
              value={newSubsiteName}
              onChange={(e) => setNewSubsiteName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              {activeSiteId === 'site_administration' ? 'Créer le département' : 'Créer la zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
