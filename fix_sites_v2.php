<?php
$file = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content = file_get_contents($file);

$replace1 = <<<EOT
    case 'get_blackbox_logs':
        \$period = \$data['period'] ?? date('Y-m');
        \$company_id = \$_SESSION['company_id'] ?? 'comp_default_1';
        \$sqlite = getDb();
        \$stmt = \$sqlite->prepare("SELECT * FROM activity_logs WHERE company_id = ? AND period = ? ORDER BY action_date DESC");
        \$stmt->execute([\$company_id, \$period]);
        echo json_encode(['success' => true, 'logs' => \$stmt->fetchAll()]);
        break;

    case 'get_archived_agents':
EOT;
$content = str_replace("case 'get_archived_agents':", $replace1, $content);

$search2 = "case 'delete_agent':\n        \$agent_id = \$data['agent_id'] ?? '';";
$replace2 = <<<EOT
    case 'delete_agent':
        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT', "Agent: " . \$agent_name_to_log);
        \$agent_id = \$data['agent_id'] ?? '';
EOT;
$content = str_replace($search2, $replace2, $content);

$search3 = "case 'delete_subsite':\n        \$subsite_id = \$data['subsite_id'] ?? '';";
$replace3 = <<<EOT
    case 'delete_subsite':
        \$site_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['subsite_id'] ?? 'Inconnu');
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', "Site: " . \$site_name_to_log);
        \$subsite_id = \$data['subsite_id'] ?? '';
EOT;
$content = str_replace($search3, $replace3, $content);

file_put_contents($file, $content);
echo "Injected!\n";
