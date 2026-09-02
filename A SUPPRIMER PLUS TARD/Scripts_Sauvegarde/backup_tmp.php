<?php
// backup.php - Script de sauvegarde
$root = 'c:\\laragon\\www\\pontage';
$sauvegardDir = $root . '\\sauvegard';

if (!is_dir($sauvegardDir)) {
    mkdir($sauvegardDir, 0755, true);
}

$files = [
    $root . '\\backend\\modules\\auth.php' => $sauvegardDir . '\\auth.php.bak',
    $root . '\\frontend\\src\\AuthContext.jsx' => $sauvegardDir . '\\AuthContext.jsx.bak',
];

foreach ($files as $src => $dest) {
    if (file_exists($src)) {
        copy($src, $dest);
        echo "Sauvegarde: " . basename($src) . " -> OK\n";
    } else {
        echo "Fichier introuvable: $src\n";
    }
}
echo "Terminé!";
?>
