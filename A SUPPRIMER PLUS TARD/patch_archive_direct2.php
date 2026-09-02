<?php
require_once 'backend/database.php';

$_SESSION['company_id'] = 'comp_cf66d02f';
$company_id = 'comp_cf66d02f';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$action = 'get_pointage_for_archive';

if (!function_exists('resolveCurrentCompanyIdSql')) {
    function resolveCurrentCompanyIdSql() { return "company_id = 'comp_cf66d02f'"; }
}
if (!function_exists('resolveCurrentServiceKeySql')) {
    function resolveCurrentServiceKeySql() { return ""; }
}

ob_start();
require 'backend/modules/pointage.php';
$output = ob_get_clean();

$data = json_decode($output, true);

if ($data && isset($data['success']) && $data['success']) {
    $sqlite = getDb();
    
    // Hardcode ID 106 based on check_archives2.php output
    $archive_id = 106;
    $json_data = json_encode($data, JSON_UNESCAPED_UNICODE);
    
    $stmt_update = $sqlite->prepare("UPDATE archives_pointage SET data = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt_update->execute([$json_data, $archive_id]);
    
    echo "SUCCESS: Archive ID $archive_id patched successfully with new data.\n";
} else {
    echo "ERROR: Failed to generate archive data.\n";
}
