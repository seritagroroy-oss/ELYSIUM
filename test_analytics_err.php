<?php
session_start();
$_SESSION['user_id'] = 'admin@elysium.com';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'service_default_1';
$_SESSION['role'] = 'admin';

$api = file_get_contents('api.php');
$api = str_replace('exit;', '//exit;', $api);
$api = str_replace('session_start();', '//session_start();', $api);
file_put_contents('api_test.php', $api);

$_GET['action'] = 'get_analytics';
$_GET['period'] = '2026-06';
$_SERVER['REQUEST_METHOD'] = 'GET';

ob_start();
require 'api_test.php';
$output = ob_get_clean();
echo "OUTPUT:\n";
echo $output;
unlink('api_test.php');
