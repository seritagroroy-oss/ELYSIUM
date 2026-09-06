<?php
$file_sites = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content_sites = file_get_contents($file_sites);

// --- Patch delete_subsite ---
$search_subsite = <<<EOT
        \$site_name_to_log = \$subsite_id;
        if (\$subsite_id) {
            // Récupère à la fois le nom de la zone et le nom du site parent
            \$stmt = getDb()->prepare("SELECT sub.name as subsite_name, s.name as site_name FROM subsites sub LEFT JOIN sites s ON sub.site_id = s.id WHERE sub.id = ?");
            \$stmt->execute([\$subsite_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$parent_name = !empty(\$res['site_name']) ? \$res['site_name'] : '';
                \$zone_name = !empty(\$res['subsite_name']) ? \$res['subsite_name'] : '';
                
                if (\$parent_name && \$zone_name) {
                    \$site_name_to_log = \$parent_name . ' / ' . \$zone_name;
                } elseif (\$zone_name) {
                    \$site_name_to_log = \$zone_name;
                }
            }
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', "Site: " . \$site_name_to_log);
EOT;

$replace_subsite = <<<EOT
        \$site_name_to_log = \$subsite_id;
        \$snapshot_data = null;
        if (\$subsite_id) {
            // Récupère à la fois le nom de la zone et le nom du site parent
            \$stmt = getDb()->prepare("SELECT sub.*, s.name as site_name FROM subsites sub LEFT JOIN sites s ON sub.site_id = s.id WHERE sub.id = ?");
            \$stmt->execute([\$subsite_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
                \$parent_name = !empty(\$res['site_name']) ? \$res['site_name'] : '';
                \$zone_name = !empty(\$res['name']) ? \$res['name'] : '';
                
                if (\$parent_name && \$zone_name) {
                    \$site_name_to_log = \$parent_name . ' / ' . \$zone_name;
                } elseif (\$zone_name) {
                    \$site_name_to_log = \$zone_name;
                }
            }
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_SUBSITE', "Site: " . \$site_name_to_log, \$snapshot_data);
EOT;
$content_sites = str_replace(str_replace("\r\n", "\n", $search_subsite), $replace_subsite, str_replace("\r\n", "\n", $content_sites));

// --- Patch delete_agent ---
$search_agent = <<<EOT
    case 'delete_agent':
        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$data['agent_id'] ?? 'Inconnu');
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT', "Agent: " . \$agent_name_to_log);
        \$agent_id = \$data['agent_id'] ?? '';
EOT;

$replace_agent = <<<EOT
    case 'delete_agent':
        \$agent_id = \$data['agent_id'] ?? '';
        \$agent_name_to_log = !empty(\$data['name']) ? \$data['name'] : (\$agent_id ?: 'Inconnu');
        \$snapshot_data = null;
        if (\$agent_id) {
            \$stmt = getDb()->prepare("SELECT * FROM agents WHERE id = ?");
            \$stmt->execute([\$agent_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
                if (empty(\$data['name']) && !empty(\$res['name'])) \$agent_name_to_log = \$res['name'];
            }
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT', "Agent: " . \$agent_name_to_log, \$snapshot_data);
EOT;
$content_sites = str_replace(str_replace("\r\n", "\n", $search_agent), $replace_agent, $content_sites);

file_put_contents($file_sites, $content_sites);

$file_att = 'c:/laragon/www/pontage/backend/modules/attendance.php';
$content_att = file_get_contents($file_att);

// --- Patch delete_agent_sortant ---
$search_sortant = <<<EOT
        \$agent_id = \$data['agent_id'] ?? '';
        \$agent_name_to_log = \$agent_id;
        if (\$agent_id) {
            \$stmt = getDb()->prepare("SELECT name FROM agents WHERE id = ?");
            \$stmt->execute([\$agent_id]);
            \$res = \$stmt->fetch();
            if (\$res && !empty(\$res['name'])) \$agent_name_to_log = \$res['name'];
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_SORTANT', "Agent: " . \$agent_name_to_log);
EOT;

$replace_sortant = <<<EOT
        \$agent_id = \$data['agent_id'] ?? '';
        \$agent_name_to_log = \$agent_id;
        \$snapshot_data = null;
        if (\$agent_id) {
            \$stmt = getDb()->prepare("SELECT * FROM agents WHERE id = ?");
            \$stmt->execute([\$agent_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
                if (!empty(\$res['name'])) \$agent_name_to_log = \$res['name'];
            }
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_SORTANT', "Agent: " . \$agent_name_to_log, \$snapshot_data);
EOT;
$content_att = str_replace(str_replace("\r\n", "\n", $search_sortant), $replace_sortant, str_replace("\r\n", "\n", $content_att));

// --- Patch delete_agent_entrant ---
$search_entrant = <<<EOT
        \$agent_id = \$data['agent_id'] ?? '';
        \$agent_name_to_log = \$agent_id;
        if (\$agent_id) {
            \$stmt = getDb()->prepare("SELECT name FROM agents WHERE id = ?");
            \$stmt->execute([\$agent_id]);
            \$res = \$stmt->fetch();
            if (\$res && !empty(\$res['name'])) \$agent_name_to_log = \$res['name'];
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_ENTRANT', "Agent: " . \$agent_name_to_log);
EOT;

$replace_entrant = <<<EOT
        \$agent_id = \$data['agent_id'] ?? '';
        \$agent_name_to_log = \$agent_id;
        \$snapshot_data = null;
        if (\$agent_id) {
            \$stmt = getDb()->prepare("SELECT * FROM agents WHERE id = ?");
            \$stmt->execute([\$agent_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
                if (!empty(\$res['name'])) \$agent_name_to_log = \$res['name'];
            }
        }
        if(function_exists('logBlackBox')) logBlackBox(getDb(), \$_SESSION['company_id']??'comp_default_1', \$_SESSION['service_id']??null, \$data['period']??date('Y-m'), 'DELETE_AGENT_ENTRANT', "Agent: " . \$agent_name_to_log, \$snapshot_data);
EOT;
$content_att = str_replace(str_replace("\r\n", "\n", $search_entrant), $replace_entrant, $content_att);

file_put_contents($file_att, $content_att);

echo "Snapshots injected\n";
