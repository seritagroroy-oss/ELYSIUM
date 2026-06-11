<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT id FROM users WHERE email='pcsecuritex1@gmail.com'");
$user_id = $res[0]['id'];
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SESSION = [
    'user_id' => $user_id,
    'company_id' => 'comp_480ef24c',
    'service_id' => 'svc_1780068297_395',
    'user_role' => 'admin'
];
$_GET['action'] = 'get_salaries';
$_GET['period'] = '2026-06';
ob_start();
require 'api.php';
$out = ob_get_clean();
echo substr($out, 0, 1000);
