<?php
require_once 'database.php';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$_SESSION['company_id'] = 'comp_cf66d02f';

// Capture output
ob_start();
require 'modules/pointage.php';
$output = ob_get_clean();

$data = json_decode($output, true);
$sites = $data['sites'] ?? [];
$extras = array_filter($sites, fn($s) => $s['id'] === 'site_extras_sur_site');
$extras = reset($extras);

print_r($extras);
