<?php
$source = __DIR__ . '/frontend/src/components/PayrollView.jsx';
$dest = __DIR__ . '/sauvegard/PayrollView.jsx.' . time() . '.bak';
if (copy($source, $dest)) {
    echo "Sauvegarde réussie de PayrollView.jsx : $dest<br>";
} else {
    echo "Échec de la sauvegarde.<br>";
}
unlink(__FILE__);
echo "Script temporaire d'auto-destruction terminé.";
