<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
session_start();
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'get_dashboard_init';
$_SESSION['user_id'] = 'pc55@gmail.com';
$_SESSION['service_id'] = 'svc_1779873050_955';
$_SESSION['user_role'] = 'admin';
$_SESSION['company_id'] = 'comp_default_1';
ob_start();
require 'api.php';
$output = ob_get_clean();
file_put_contents('new_init_output.json', $output);
echo "Done";
