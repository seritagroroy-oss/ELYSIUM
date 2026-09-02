<?php
$file = 'C:\laragon\www\pontage\frontend\src\components\Dashboard.jsx';
$content = file_get_contents($file);

// Replace 1: Add import
$search1 = "import AddAgentModal from './modals/AddAgentModal';";
$replace1 = "import DeleteSiteModal from './modals/DeleteSiteModal';\nimport AddAgentModal from './modals/AddAgentModal';";
if (strpos($content, "import DeleteSiteModal") === false) {
    $content = str_replace($search1, $replace1, $content);
}

// Replace 2: Replace inline modal
$pattern = '/\{showDeleteSiteModal\s*&&\s*\(\s*<div.*?Suppression de site.*?\}\)/s';
$replace2 = "{showDeleteSiteModal && (
        <DeleteSiteModal
          siteName={siteContextMenu.siteName}
          onClose={() => setShowDeleteSiteModal(false)}
          onConfirm={handleDeleteSite}
        />
      )}";
      
$content = preg_replace($pattern, $replace2, $content);
file_put_contents($file, $content);
echo "Regex modifications appliquees.";
