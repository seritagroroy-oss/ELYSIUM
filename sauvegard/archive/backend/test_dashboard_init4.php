<?php
require_once 'database.php';
$_GET['action'] = 'get_dashboard_init';
$_GET['period'] = '2026-07';
$_GET['site_id'] = 'site_extras_sur_site';
$_SESSION['company_id'] = 'comp_cf66d02f';

// Capture output
ob_start();
require 'modules/pointage.php';
$output = ob_get_clean();

echo substr($output, 0, 1500);
