<?php
$file = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content = file_get_contents($file);

$c1 = preg_replace(
    "/case 'delete_agent':\r?\n\s+\\$agent_id = \\$data\\[\\'agent_id\\'\\] \\?\\? \\'\\';/",
    "case 'delete_agent':\n        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT', \"Agent: \" . \$agent_name_to_log);\n        \$agent_id = \$data['agent_id'] ?? '';",
    $content
);

$c2 = preg_replace(
    "/case 'delete_subsite':\r?\n\s+\\$subsite_id = \\$data\\[\\'subsite_id\\'\\] \\?\\? \\'\\';/",
    "case 'delete_subsite':\n        \$site_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['subsite_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', \"Site: \" . \$site_name_to_log);\n        \$subsite_id = \$data['subsite_id'] ?? '';",
    $c1
);

$c3 = preg_replace(
    "/case 'get_archived_agents':/",
    "case 'get_blackbox_logs':\n        \$period = \$data['period'] ?? date('Y-m');\n        \$company_id = \$_SESSION['company_id'] ?? 'comp_default_1';\n        \$sqlite = getDb();\n        \$stmt = \$sqlite->prepare(\"SELECT * FROM activity_logs WHERE company_id = ? AND period = ? ORDER BY action_date DESC\");\n        \$stmt->execute([\$company_id, \$period]);\n        echo json_encode(['success' => true, 'logs' => \$stmt->fetchAll()]);\n        break;\n\n    case 'get_archived_agents':",
    $c2
);

file_put_contents($file, $c3);
if ($c1 !== $content) echo "delete_agent patched\n";
if ($c2 !== $c1) echo "delete_subsite patched\n";
if ($c3 !== $c2) echo "get_blackbox_logs patched\n";
