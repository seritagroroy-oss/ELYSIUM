<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Get ALL payroll_statuses for site_itc, comp_cf66d02f, 2026-07
$rows = $sqlite->query("SELECT * FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' AND site_id = 'site_itc'");

echo "ALL ITC agents in payroll_statuses for comp_cf66d02f 2026-07:\n";
echo "Total: " . count($rows) . "\n\n";
foreach ($rows as $r) {
    echo "Agent: {$r['agent_name']}, Zone: {$r['zone_name']}, Status: {$r['status']}\n";
}

// Now also check archives table for period=2026-07 company=comp_cf66d02f
echo "\n\nChecking archives table...\n";
$arch = $sqlite->query("SELECT id, period, data FROM archives WHERE company_id = 'comp_cf66d02f' AND period = '2026-07'");
echo "Archives count: " . count($arch) . "\n";
foreach ($arch as $a) {
    echo "Archive ID: {$a['id']}, Period: {$a['period']}, Data length: " . strlen($a['data']) . "\n";
}
