<?php
require_once 'database.php';
$_GET['action'] = 'get_site_data';
$_GET['site_id'] = 'default_site_1'; // Just find any site
$_GET['period'] = '2029-02';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'serv_default_1';

ob_start();
require 'api.php';
$json = ob_get_clean();
echo substr($json, 0, 1000); // Check what it returns
