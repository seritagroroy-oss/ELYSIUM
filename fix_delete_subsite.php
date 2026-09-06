<?php
$file = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content = file_get_contents($file);

$search = "    case 'delete_subsite':\r\n        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {\r\n            echo json_encode(['success' => false, 'message' => 'Accès refusé']);\r\n            break;\r\n        }\r\n        \$serviceKey = \$_SESSION['service_id'] ?? null;\r\n        \$subsite_id = \$data['subsite_id'] ?? '';";

$searchLF = "    case 'delete_subsite':\n        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {\n            echo json_encode(['success' => false, 'message' => 'Accès refusé']);\n            break;\n        }\n        \$serviceKey = \$_SESSION['service_id'] ?? null;\n        \$subsite_id = \$data['subsite_id'] ?? '';";

$replace = "    case 'delete_subsite':\n        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {\n            echo json_encode(['success' => false, 'message' => 'Accès refusé']);\n            break;\n        }\n        \$site_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['subsite_id'] ?? 'Inconnu');\n        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', \"Site: \" . \$site_name_to_log);\n        \$serviceKey = \$_SESSION['service_id'] ?? null;\n        \$subsite_id = \$data['subsite_id'] ?? '';";

$content2 = str_replace($search, $replace, $content);
if ($content === $content2) {
    $content2 = str_replace($searchLF, $replace, $content);
}

if ($content !== $content2) {
    file_put_contents($file, $content2);
    echo "Injected delete_subsite\n";
} else {
    echo "Failed to inject delete_subsite\n";
}
