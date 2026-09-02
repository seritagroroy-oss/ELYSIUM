<?php
$files_to_backup = [
    'frontend/src/components/modals/AddAgentModal.jsx',
    'frontend/src/components/Dashboard.jsx',
    'backend/core/functions.php',
    'backend/modules/sites_v2.php',
    'backend/modules/sites.php'
];

$backup_dir = __DIR__ . '/sauvegard/';
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0777, true);
}

foreach ($files_to_backup as $file) {
    $src = __DIR__ . '/' . $file;
    $dest = $backup_dir . basename($file);
    if (file_exists($src)) {
        copy($src, $dest);
        echo "Backed up: " . basename($file) . "\n";
    }
}
echo "Backup complete.\n";
?>
