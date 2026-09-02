<?php
$_GET['action'] = 'get_salaries';
$_GET['period'] = '2026-08';
$_GET['scope'] = 'company';
$_SESSION = ['user_role' => 'admin', 'company_id' => 'comp_default_1', 'service_id' => 'serv_123'];

ob_start();
require_once 'c:\laragon\www\pontage\api_new.php';
$out = ob_get_clean();

$data = json_decode($out, true);
if (is_array($data) && count($data) > 0) {
    print_r(array_keys($data[0]));
} else {
    echo "No array returned.";
}
