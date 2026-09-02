<?php
$toDelete = [
    'c:/laragon/www/pontage/backup_script.php',
];
foreach ($toDelete as $f) {
    if (file_exists($f)) { unlink($f); echo "🗑️ " . basename($f) . "\n"; }
}
echo "Nettoyé.\n";
