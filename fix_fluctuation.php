<?php
$content = file_get_contents('api.php');

// Trouver le premier case 'get_settings' orphelin (qui vient après notre nouveau code)
// Le marqueur de fin de notre nouvelle route
$marker_end_new = "        ]);\n        break;\n\n    case 'get_settings':\n        \$serviceKey = \$_SESSION['service_id'] ?? null;";
$marker_orphan_start = "    case 'get_settings':\n        \$serviceKey = \$_SESSION['service_id'] ?? null;\n\n        foreach (\$db";

$pos_first = strpos($content, $marker_orphan_start);
if ($pos_first === false) {
    echo "Premier pattern non trouvé\n";
    
    // Essayons différemment: trouver les deux occurrences de "case 'get_settings':"
    $positions = [];
    $offset = 0;
    while (($pos = strpos($content, "case 'get_settings':", $offset)) !== false) {
        $positions[] = $pos;
        $offset = $pos + 1;
    }
    echo "Occurrences de case 'get_settings': " . count($positions) . "\n";
    foreach ($positions as $i => $p) {
        echo "  Position $i: $p\n";
        echo "  Contexte: " . substr($content, $p, 100) . "\n\n";
    }
    exit;
}

// Trouver la deuxième occurrence (le vrai get_settings)
$pos_second = strpos($content, "case 'get_settings':", $pos_first + 100);
if ($pos_second === false) {
    echo "Deuxième occurrence non trouvée\n";
    exit;
}

echo "Suppression du bloc orphelin de $pos_first à $pos_second (" . ($pos_second - $pos_first) . " caractères)\n";

// Supprimer le bloc entre les deux occurrences
$new_content = substr($content, 0, $pos_first) . substr($content, $pos_second);
file_put_contents('api.php', $new_content);
echo "Fait!\n";
