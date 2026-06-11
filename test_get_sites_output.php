<?php
require 'backend/database.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'get_sites';
$_GET['scope'] = 'company';
$_SESSION['company_id'] = 'comp_default_1';
ob_start();
require 'api.php';
$output = ob_get_clean();
echo substr($output, 0, 500);
