<?php
$file_sites = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content_sites = file_get_contents($file_sites);

$search_sites = "    case 'delete_subsite':\n        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {\n            echo json_encode(['success' => false, 'message' => 'Accès refusé']);\n            break;\n        }\n        \$site_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['subsite_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', \"Site: \" . \$site_name_to_log);\n        \$serviceKey = \$_SESSION['service_id'] ?? null;\n        \$subsite_id = \$data['subsite_id'] ?? '';";

$replace_sites = "    case 'delete_subsite':\n        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {\n            echo json_encode(['success' => false, 'message' => 'Accès refusé']);\n            break;\n        }\n        \$subsite_id = \$data['subsite_id'] ?? '';\n        \$site_name_to_log = \$subsite_id;\n        if (\$subsite_id) {\n            \$stmt = getDb()->prepare(\"SELECT name FROM subsites WHERE id = ?\");\n            \$stmt->execute([\$subsite_id]);\n            \$res = \$stmt->fetch();\n            if (\$res && !empty(\$res['name'])) \$site_name_to_log = \$res['name'];\n        }\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', \"Site: \" . \$site_name_to_log);\n        \$serviceKey = \$_SESSION['service_id'] ?? null;";

$content_sites = str_replace($search_sites, $replace_sites, $content_sites);
file_put_contents($file_sites, $content_sites);

$file_att = 'c:/laragon/www/pontage/backend/modules/attendance.php';
$content_att = file_get_contents($file_att);

$search_sortant = "    case 'delete_agent_sortant':\n        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_SORTANT', \"Agent: \" . \$agent_name_to_log);\n        \$agent_id = \$data['agent_id'] ?? '';";
$replace_sortant = "    case 'delete_agent_sortant':\n        \$agent_id = \$data['agent_id'] ?? '';\n        \$agent_name_to_log = \$agent_id;\n        if (\$agent_id) {\n            \$stmt = getDb()->prepare(\"SELECT name FROM agents WHERE id = ?\");\n            \$stmt->execute([\$agent_id]);\n            \$res = \$stmt->fetch();\n            if (\$res && !empty(\$res['name'])) \$agent_name_to_log = \$res['name'];\n        }\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_SORTANT', \"Agent: \" . \$agent_name_to_log);";
$content_att = str_replace($search_sortant, $replace_sortant, $content_att);

$search_entrant = "    case 'delete_agent_entrant':\n        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_ENTRANT', \"Agent: \" . \$agent_name_to_log);\n        \$agent_id = \$data['agent_id'] ?? '';";
$replace_entrant = "    case 'delete_agent_entrant':\n        \$agent_id = \$data['agent_id'] ?? '';\n        \$agent_name_to_log = \$agent_id;\n        if (\$agent_id) {\n            \$stmt = getDb()->prepare(\"SELECT name FROM agents WHERE id = ?\");\n            \$stmt->execute([\$agent_id]);\n            \$res = \$stmt->fetch();\n            if (\$res && !empty(\$res['name'])) \$agent_name_to_log = \$res['name'];\n        }\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_ENTRANT', \"Agent: \" . \$agent_name_to_log);";
$content_att = str_replace($search_entrant, $replace_entrant, $content_att);

file_put_contents($file_att, $content_att);
echo "Resolved names patched\n";
