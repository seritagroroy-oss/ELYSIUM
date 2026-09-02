<?php
// Mock session
session_start();
$_SESSION['user_id'] = 'admin@example.com';
$_SESSION['user_role'] = 'super_admin';
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['service_id'] = 'SECURITEX SA';

// POST Data
$_POST['current_period'] = '2026-08';
$_POST['next_period'] = '2026-09';
$_POST['sites_to_keep_hs'] = [];

require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

// We want to include salaries.php and execute init_next_period
// But salaries.php expects $action = 'init_next_period'
$_GET['action'] = 'init_next_period';
$action = 'init_next_period';
$data = $_POST;
$isJsonRequest = false;

ob_start();
try {
    require_once __DIR__ . '/backend/modules/salaries.php';
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}
$output = ob_get_clean();

echo "OUTPUT:\n";
echo $output;
