<?php
$file = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content = file_get_contents($file);

// Find first archive_pointage
$pos1 = strpos($content, "case 'archive_pointage':");
if ($pos1 !== false) {
    // Check if there is a second one
    $pos2 = strpos($content, "case 'archive_pointage':", $pos1 + 100);
    if ($pos2 !== false) {
        // Find the end of the garbage
        $endMarker = "if (strpos(\$subId, 'site_extras') !== false) \$siteId = 'site_extras';";
        $endPos = strpos($content, $endMarker, $pos1);
        
        if ($endPos !== false && $endPos < $pos2) {
            $goodTop = "        // 2. Agents par site (pour le camembert)\n        \$agentsBySiteCounts = [];\n        foreach (\$allAgents as \$agent) {\n            \$siteId = \$agent['site_id'] ?? null;\n            if (!\$siteId) {\n                \$subId = \$agent['subsite_id'] ?? '';\n\n                ";
            $content = substr_replace($content, $goodTop, $pos1, $endPos - $pos1);
            echo "Top fixed!\n";
        }
    }
}

// Now fix the bottom:
// Find "// 2. Agents par site (pour le camembert)" that is immediately followed by "if ($existing) {"
$posBottomStart = strpos($content, "        // 2. Agents par site (pour le camembert)", strpos($content, "break;", strpos($content, "salaryFluctuation")));
if ($posBottomStart !== false) {
    $posBottomEnd = strpos($content, "            if (\$existing) {", $posBottomStart);
    if ($posBottomEnd !== false) {
        $goodBottom = "    case 'archive_pointage':\n        \$sqlite = getDb();\n        \$company_id = resolveCurrentCompanyIdSql();\n        \$period = \$_POST['period'] ?? '';\n        \$data = \$_POST['data'] ?? '';\n        \$user_id = \$_SESSION['user']['id'] ?? '';\n        \n        \$archived_by = 'Auto-Archivage (PC)';\n        if (\$user_id) {\n            \$stmtU = \$sqlite->prepare(\"SELECT first_name, last_name FROM users WHERE id = ?\");\n            \$stmtU->execute([\$user_id]);\n            \$u = \$stmtU->fetch();\n            if (\$u) {\n                \$archived_by = trim((\$u['first_name'] ?? '') . ' ' . (\$u['last_name'] ?? ''));\n            }\n        }\n\n        if (!\$period || !\$data) {\n            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);\n            break;\n        }\n        \n        \$now = date('Y-m-d H:i:s');\n\n        try {\n            \$stmtCheck = \$sqlite->prepare(\"SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?\");\n            \$stmtCheck->execute([\$company_id, \$period]);\n            \$existing = \$stmtCheck->fetch();\n\n";
        $content = substr_replace($content, $goodBottom, $posBottomStart, $posBottomEnd - $posBottomStart);
        echo "Bottom fixed!\n";
    }
}

file_put_contents($file, $content);
