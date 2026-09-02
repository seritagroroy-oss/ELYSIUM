<?php
// Mock session
session_start();
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'admin';
$_SESSION['service_key'] = '';

$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';

ob_start();
require '../api_new.php';
$output = ob_get_clean();

$data = json_decode($output, true);

if ($data && isset($data['success']) && $data['success']) {
    require_once 'database.php';
    $sqlite = getDb();
    
    $company_id = 'comp_cf66d02f';
    $period = '2026-07';
    
    $stmt = $sqlite->prepare("SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?");
    $stmt->execute([$company_id, $period]);
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
