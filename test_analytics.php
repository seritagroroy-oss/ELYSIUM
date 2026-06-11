<?php
session_start();
$_SESSION['user_id'] = 'admin@elysium.com';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'service_default_1';
$_SESSION['role'] = 'admin';
$_SESSION['subscription_state'] = ['access_allowed' => true];

$_GET['action'] = 'get_analytics';
$_GET['period'] = '2026-06';
$_SERVER['REQUEST_METHOD'] = 'GET';

ob_start();
require 'api.php';
$output = ob_get_clean();
echo "OUTPUT:\n";
echo $output;
