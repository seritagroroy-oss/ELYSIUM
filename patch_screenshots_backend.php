<?php
$file_db = 'c:/laragon/www/pontage/backend/database.php';
$content_db = file_get_contents($file_db);

$search_helper = "function logBlackBox(\$db, \$company_id, \$service_id, \$period, \$action_type, \$details, \$snapshot_data = null) {";
$replace_helper = <<<EOT
function saveScreenshot(\$base64) {
    if (empty(\$base64)) return null;
    if (preg_match('/^data:image\/(\w+);base64,/', \$base64, \$type)) {
        \$base64 = substr(\$base64, strpos(\$base64, ',') + 1);
        \$type = strtolower(\$type[1]);
        if (!in_array(\$type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) return null;
        \$base64 = str_replace(' ', '+', \$base64);
        \$data = base64_decode(\$base64);
        if (\$data === false) return null;
        \$filename = uniqid('snap_') . '.' . \$type;
        \$dir = dirname(__DIR__) . '/uploads/snapshots';
        if (!is_dir(\$dir)) mkdir(\$dir, 0777, true);
        file_put_contents(\$dir . '/' . \$filename, \$data);
        return 'uploads/snapshots/' . \$filename;
    }
    return null;
}

function logBlackBox(\$db, \$company_id, \$service_id, \$period, \$action_type, \$details, \$snapshot_data = null) {
EOT;

if (strpos($content_db, 'function saveScreenshot') === false) {
    $content_db = str_replace($search_helper, $replace_helper, $content_db);
    file_put_contents($file_db, $content_db);
}

// Update sites_v2.php
$file_sites = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content_sites = file_get_contents($file_sites);

// For subsite
$search_subsite = <<<EOT
        \$snapshot_data = null;
        if (\$subsite_id) {
EOT;
$replace_subsite = <<<EOT
        \$snapshot_data = !empty(\$data['screenshot']) ? saveScreenshot(\$data['screenshot']) : null;
        if (\$subsite_id) {
EOT;
$content_sites = str_replace(str_replace("\r\n", "\n", $search_subsite), $replace_subsite, str_replace("\r\n", "\n", $content_sites));

// For agent
$search_agent = <<<EOT
        \$snapshot_data = null;
        if (\$agent_id) {
EOT;
$replace_agent = <<<EOT
        \$snapshot_data = !empty(\$data['screenshot']) ? saveScreenshot(\$data['screenshot']) : null;
        if (\$agent_id) {
EOT;
$content_sites = str_replace(str_replace("\r\n", "\n", $search_agent), $replace_agent, $content_sites);
file_put_contents($file_sites, $content_sites);

// Update attendance.php
$file_att = 'c:/laragon/www/pontage/backend/modules/attendance.php';
$content_att = file_get_contents($file_att);

$content_att = str_replace(str_replace("\r\n", "\n", $search_agent), $replace_agent, str_replace("\r\n", "\n", $content_att));
file_put_contents($file_att, $content_att);

echo "Backend ready for screenshots\n";
