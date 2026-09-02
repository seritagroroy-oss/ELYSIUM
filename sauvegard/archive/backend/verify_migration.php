<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/core/functions.php';

// Force session vars for testing
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['role'] = 'admin';
$_SESSION['user_id'] = 'test';

// Simulate the logic from get_functions in sites.php
$company_id = 'comp_cf66d02f';
$company_key = 'company::' . $company_id;
$functions = getServiceDataSql($company_key, 'functions', []);

// Simulation de la MIGRATION
$needsSave = false;
foreach ($functions as &$func) {
    if (empty($func['name']) || $func['name'] === $func['id']) {
        $id = $func['id'];
        if (!empty($func['fullName']) && strpos($func['fullName'], ' - ') !== false) {
            $parts = explode(' - ', $func['fullName'], 2);
            if (!empty($parts[1]) && trim($parts[1]) !== $id) {
                $func['name'] = trim($parts[1]);
                $needsSave = true;
            }
        }
        if (isset($func['fullName'])) {
            unset($func['fullName']);
            $needsSave = true;
        }
    }
}
unset($func);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'functions' => $functions,
    'was_modified' => $needsSave
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
