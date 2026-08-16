<?php
$file = 'C:\laragon\www\pontage\frontend\src\components\Dashboard.jsx';
$content = file_get_contents($file);

// Replace the specific inline block
$pattern = '/\{showDeleteSiteModal\s*&&\s*\(\s*<div[^>]*>\s*<div className="glass-panel"[^>]*>.*?Suppression de site.*?\}\)/s';

$newBlock = "{showDeleteSiteModal && (
        <DeleteSiteModal
          siteName={siteContextMenu.siteName}
          onClose={() => setShowDeleteSiteModal(false)}
          onConfirm={handleDeleteSite}
        />
      )}";

if (preg_match($pattern, $content)) {
    $content = preg_replace($pattern, $newBlock, $content);
    file_put_contents($file, $content);
    echo "Block replaced via regex!";
} else {
    echo "Regex pattern not found.";
}
