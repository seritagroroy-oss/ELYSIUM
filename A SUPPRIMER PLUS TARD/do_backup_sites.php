<?php
$source = __DIR__ . '/backend/modules/sites.php';
$destDir = __DIR__ . '/sauvegard';
if (!is_dir($destDir)) {
    mkdir($destDir, 0777, true);
}
copy($source, $destDir . '/sites.php');
echo "Backup done.";
?>
