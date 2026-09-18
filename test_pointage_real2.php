<?php
require 'backend/database.php';
require 'utils.php';

// Redefine check_auth_json to bypass it
if (!function_exists('check_auth_json')) {
    function check_auth_json() { return true; }
}
if (!function_exists('resolveCurrentCompanyIdSql')) {
    function resolveCurrentCompanyIdSql() { return 'comp_bb90668e'; }
}
if (!function_exists('resolveCurrentServiceKeySql')) {
    function resolveCurrentServiceKeySql() { return 'svc_45a046d6'; }
}

$action = 'get_dashboard_init';
$_GET['period'] = '2058-07';
$_SESSION = [
    'user_id' => 458, // comptara@gmail.com
    'company_id' => 'comp_bb90668e',
    'service' => 'Comptabilité'
];
ob_start();
require 'backend/modules/pointage.php';
$output = ob_get_clean();
echo "OUTPUT: " . $output;
