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

$data = json_decode($output, true);
$sites = $data['sites'] ?? [];
$extras = array_filter($sites, fn($s) => $s['id'] === 'site_extras_sur_site');
$extras = reset($extras);

echo "EXTRA SUR SITE LIVE AGENTS COUNT: \n";
$count = 0;
if ($extras && isset($extras['subsites'])) {
    foreach ($extras['subsites'] as $sub) {
        $count += count($sub['agents']);
    }
}
echo "TOTAL: " . $count . "\n";

