<?php
require_once 'database.php';
$_GET['action'] = 'get_pointage_for_archive';
$_GET['period'] = '2026-07';
$_SESSION['company_id'] = 'comp_cf66d02f';

ob_start();
// simulate api.php environment
$action = 'get_pointage_for_archive';
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$sqlite = getDb();

// simulate what api.php does for this action
require 'modules/pointage.php';
$output = ob_get_clean();

$data = json_decode($output, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo "JSON DECODE ERROR: " . json_last_error_msg() . "\n";
    echo substr($output, 0, 1000);
} else {
    $sites = $data['sites'] ?? [];
    $extras = array_filter($sites, fn($s) => $s['id'] === 'site_extras_sur_site');
    $extras = reset($extras);

    echo "EXTRA SUR SITE ARCHIVE AGENTS COUNT: \n";
    $count = 0;
    if ($extras && isset($extras['subsites'])) {
        foreach ($extras['subsites'] as $sub) {
            $count += count($sub['agents']);
        }
    }
    echo "TOTAL: " . $count . "\n";
}
