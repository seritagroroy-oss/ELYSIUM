<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_USER_AGENT'] = 'test';
require 'backend/database.php';
require 'utils.php';

// Redefine check_auth_json to bypass it
if (!function_exists('check_auth_json')) {
    function check_auth_json() { return true; }
}

require 'backend/core/functions.php';

$_SESSION = [
    'user_id' => 458, // comptara@gmail.com
    'company_id' => 'comp_bb90668e',
    'service' => 'Comptabilité',
    'csrf_token' => 'dummy',
    'permissions' => getUserPermissionsByEmail('comptara@gmail.com')
];

$_GET['action'] = 'get_dashboard_init';
$_GET['period'] = '2058-07';

ob_start();
require 'backend/modules/pointage.php';
$output = ob_get_clean();

file_put_contents('test_analysis.log', $output);
echo "Analysis output written to test_analysis.log";
