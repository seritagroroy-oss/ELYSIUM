<?php
$file = 'C:\laragon\www\pontage\frontend\src\components\Dashboard.jsx';
$content = file_get_contents($file);

// Replace 1: Add import
$search1 = "import AddAgentModal from './modals/AddAgentModal';";
$replace1 = "import DeleteSiteModal from './modals/DeleteSiteModal';\nimport AddAgentModal from './modals/AddAgentModal';";
$content = str_replace($search1, $replace1, $content);

// Replace 2: Replace inline modal
$search2 = "      {showDeleteSiteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className=\"glass-panel\" style={{ width: '90%', maxWidth: '400px', border: '1px solid rgba(239,68,68,0.4)' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} /> Suppression de site
            </h3>
            <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.8)' }}>
              Êtes-vous sûr de vouloir supprimer définitivement le site <strong>{siteContextMenu.siteName}</strong> ?<br/><br/>
              Cette action supprimera également <strong>tous les agents et sous-sites</strong> rattachés à ce site. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className=\"btn\" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowDeleteSiteModal(false)}>Annuler</button>
              <button className=\"btn\" style={{ flex: 1, background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleDeleteSite}>
                <Trash size={16} /> Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}";
$replace2 = "      {showDeleteSiteModal && (
        <DeleteSiteModal
          siteName={siteContextMenu.siteName}
          onClose={() => setShowDeleteSiteModal(false)}
          onConfirm={handleDeleteSite}
        />
      )}";
      
$content = str_replace($search2, $replace2, $content);
file_put_contents($file, $content);
echo "Modifications strictes appliquees.";
