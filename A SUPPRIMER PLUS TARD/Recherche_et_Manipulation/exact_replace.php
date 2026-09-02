<?php
$file = 'C:\laragon\www\pontage\frontend\src\components\Dashboard.jsx';
$content = file_get_contents($file);

// Add import if not present
if (strpos($content, "import DeleteSiteModal from './modals/DeleteSiteModal';") === false) {
    $content = str_replace("import AddAgentModal from './modals/AddAgentModal';", "import DeleteSiteModal from './modals/DeleteSiteModal';\nimport AddAgentModal from './modals/AddAgentModal';", $content);
}

// Replace the specific inline block
$oldBlock = "      {showDeleteSiteModal && (
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

$newBlock = "      {showDeleteSiteModal && (
        <DeleteSiteModal
          siteName={siteContextMenu.siteName}
          onClose={() => setShowDeleteSiteModal(false)}
          onConfirm={handleDeleteSite}
        />
      )}";

if (strpos($content, "Suppression de site") !== false) {
    $content = str_replace($oldBlock, $newBlock, $content);
    file_put_contents($file, $content);
    echo "Block replaced!";
} else {
    echo "Block not found.";
}
