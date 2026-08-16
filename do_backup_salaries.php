<?php
$source = __DIR__ . '/frontend/src/components/Salaries.jsx';
$dest = __DIR__ . '/sauvegard/Salaries.jsx.' . time() . '.bak';
if (file_exists($source)) {
    if (!is_dir(__DIR__ . '/sauvegard')) {
        mkdir(__DIR__ . '/sauvegard', 0777, true);
    }
    copy($source, $dest);
    echo "Sauvegarde effectuée : " . basename($dest);
} else {
    echo "Fichier source introuvable";
}
