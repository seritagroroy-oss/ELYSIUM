<?php
$file = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content = file_get_contents($file);

// Find first archive_pointage
$pos1 = strpos($content, "case 'archive_pointage':");
$pos2 = strpos($content, "case 'archive_pointage':", $pos1 + 10);

if ($pos2 !== false) {
    // We have duplicate archive_pointage
    echo "Found duplicate archive_pointage\n";
    // The first one is at $pos1. Where does the garbage block end?
    $endGarbage = strpos($content, "if (strpos(\$subId, 'site_extras') !== false)", $pos1);
    if ($endGarbage !== false && $endGarbage < $pos2) {
        $garbage = substr($content, $pos1, $endGarbage - $pos1);
        echo "Garbage size: " . strlen($garbage) . "\n";
        
        $goodReplacement = "    // 2. Agents par site (pour le camembert)\n        \$agentsBySiteCounts = [];\n        foreach (\$allAgents as \$agent) {\n            \$siteId = \$agent['site_id'] ?? null;\n            if (!\$siteId) {\n                \$subId = \$agent['subsite_id'] ?? '';\n\n                ";
        
        $content = substr_replace($content, $goodReplacement, $pos1, $endGarbage - $pos1);
        echo "Fixed top part.\n";
    }
    
    // Now fix the bottom part where I messed up the real archive_pointage
    // It currently starts with:
    //        // 2. Agents par site (pour le camembert)
    //        $agentsBySiteCounts = [];
    //        foreach ($allAgents as $agent) {
    //            $siteId = $agent['site_id'] ?? null;
    //            if (!$siteId) {
    //                $subId = $agent['subsite_id'] ?? '';
    //
    //            if ($existing) {
    
    $badBottom = "        // 2. Agents par site (pour le camembert)\n        \$agentsBySiteCounts = [];\n        foreach (\$allAgents as \$agent) {\n            \$siteId = \$agent['site_id'] ?? null;\n            if (!\$siteId) {\n                \$subId = \$agent['subsite_id'] ?? '';\n\n            if (\$existing) {";
    $badBottom2 = "        // 2. Agents par site (pour le camembert)\r\n        \$agentsBySiteCounts = [];\r\n        foreach (\$allAgents as \$agent) {\r\n            \$siteId = \$agent['site_id'] ?? null;\r\n            if (!\$siteId) {\r\n                \$subId = \$agent['subsite_id'] ?? '';\r\n\r\n            if (\$existing) {";
    
    $goodBottom = "    case 'archive_pointage':\n        \$sqlite = getDb();\n        \$company_id = resolveCurrentCompanyIdSql();\n        \$period = \$_POST['period'] ?? '';\n        \$data = \$_POST['data'] ?? '';\n        \$user_id = \$_SESSION['user']['id'] ?? '';\n        \n        \$archived_by = 'Auto-Archivage (PC)';\n        if (\$user_id) {\n            \$stmtU = \$sqlite->prepare(\"SELECT first_name, last_name FROM users WHERE id = ?\");\n            \$stmtU->execute([\$user_id]);\n            \$u = \$stmtU->fetch();\n            if (\$u) {\n                \$archived_by = trim((\$u['first_name'] ?? '') . ' ' . (\$u['last_name'] ?? ''));\n            }\n        }\n\n        if (!\$period || !\$data) {\n            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);\n            break;\n        }\n        \n        \$now = date('Y-m-d H:i:s');\n\n        try {\n            \$stmtCheck = \$sqlite->prepare(\"SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?\");\n            \$stmtCheck->execute([\$company_id, \$period]);\n            \$existing = \$stmtCheck->fetch();\n\n            if (\$existing) {";
    
    if (strpos($content, $badBottom) !== false) {
        $content = str_replace($badBottom, $goodBottom, $content);
        echo "Fixed bottom part.\n";
    } elseif (strpos($content, $badBottom2) !== false) {
        $content = str_replace($badBottom2, $goodBottom, $content);
        echo "Fixed bottom part.\n";
    } else {
        echo "Could not find badBottom to fix.\n";
    }
    
} else {
    echo "No duplicate found.\n";
}

file_put_contents($file, $content);
