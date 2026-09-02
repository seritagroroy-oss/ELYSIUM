<?php
require_once 'database.php';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$_SESSION['company_id'] = 'comp_cf66d02f';

ob_start();
require 'modules/pointage.php';
$output = ob_get_clean();

echo "RAW OUTPUT:\n";
echo substr($output, 0, 1000);
