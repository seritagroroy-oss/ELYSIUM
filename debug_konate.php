<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTPS'] = 'off';
$_SERVER['HTTP_X_FORWARDED_PROTO'] = 'http';
session_start();
$_SESSION['user_id'] = '1';
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['user_role'] = 'admin';

require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

try {
    $sqlite = getDb();
    $companyKey = 'comp_cf66d02f';
    $serviceKey = null;
    $period = '2026-08';
    
    $salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
    
    $konate = [];
    foreach ($salaries as $sal) {
        if (trim(strtolower($sal['name'])) === 'konate moustapha') {
            $konate[] = $sal;
        }
    }
    
    file_put_contents('debug_konate.json', json_encode($konate, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo 'Debug file written, found ' . count($konate) . ' entries';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
