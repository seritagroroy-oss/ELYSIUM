<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SESSION = [
    'user_id' => '6a1e2edbec8b0', // doesn't matter
    'company_id' => 'comp_480ef24c',
    'service_id' => 'svc_1780068297_395',
    'user_role' => 'admin'
];
$_GET['action'] = 'get_salaries';
$_GET['period'] = '2026-06';

ob_start();
require 'api_test.php';
$out = ob_get_clean();
echo substr($out, 0, 1000);
