<?php
require_once 'database.php';

// Mock session and get environment for get_pointage_for_archive
$_SESSION['company_id'] = 'comp_cf66d02f';
$company_id = 'comp_cf66d02f';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$action = 'get_pointage_for_archive';

// Function defined in api.php that pointage.php needs
if (!function_exists('resolveCurrentCompanyIdSql')) {
    function resolveCurrentCompanyIdSql() { return "company_id = 'comp_cf66d02f'"; }
    function resolveCurrentServiceKeySql() { return ""; }
}

ob_start();
require 'modules/pointage.php';
$output = ob_get_clean();

$data = json_decode($output, true);

if ($data && isset($data['success']) && $data['success']) {
    // The data is good. Now update the archive table
    $sqlite = getDb();
    
    // Check if archive exists
    $stmt = $sqlite->prepare("SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?");
    $stmt->execute([$company_id, '2026-07']);
    $row = $stmt->fetch();
    
    if ($row) {
        $archive_id = $row['id'];
        $json_data = json_encode($data, JSON_UNESCAPED_UNICODE);
        
        $stmt_update = $sqlite->prepare("UPDATE archives_pointage SET data = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt_update->execute([$json_data, $archive_id]);
        
        echo "SUCCESS: Archive ID $archive_id patched successfully with new data.\n";
    } else {
        echo "ERROR: Archive not found for July 2026.\n";
    }
} else {
    echo "ERROR: Failed to generate archive data.\n";
    echo substr($output, 0, 500);
}
