<?php
$file = 'c:/laragon/www/pontage/backend/modules/attendance.php';
$content = file_get_contents($file);

$search1 = "    case 'delete_agent_sortant':\n        \$agent_id = \$data['agent_id'] ?? '';";
if (strpos($content, $search1) === false) {
    $search1 = "    case 'delete_agent_sortant':\r\n        \$agent_id = \$data['agent_id'] ?? '';";
}
$replace1 = <<<EOT
    case 'delete_agent_sortant':
        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_SORTANT', "Agent: " . \$agent_name_to_log);
        \$agent_id = \$data['agent_id'] ?? '';
EOT;
$content = str_replace($search1, $replace1, $content);

$search2 = "    case 'delete_agent_entrant':\n        \$agent_id = \$data['agent_id'] ?? '';";
if (strpos($content, $search2) === false) {
    $search2 = "    case 'delete_agent_entrant':\r\n        \$agent_id = \$data['agent_id'] ?? '';";
}
$replace2 = <<<EOT
    case 'delete_agent_entrant':
        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_ENTRANT', "Agent: " . \$agent_name_to_log);
        \$agent_id = \$data['agent_id'] ?? '';
EOT;
$content = str_replace($search2, $replace2, $content);

file_put_contents($file, $content);
echo "Injected in attendance.php\n";
