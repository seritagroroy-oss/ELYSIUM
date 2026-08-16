<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Look at the archive for period 2026-07 - find ITC agents in the payroll_statuses
// and check what their agent IDs look like
$rows = $sqlite->query("SELECT * FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' AND site_id = 'site_itc'");
echo "=== payroll_statuses ITC juillet 2026 ===\n";
echo "Total: " . count($rows) . "\n";
foreach ($rows as $r) {
    echo "Agent: {$r['agent_name']}, Zone: {$r['zone_name']}, Statut: {$r['status']}\n";
}

// Now check all payroll_statuses for August 2026 ITC
$rows2 = $sqlite->query("SELECT * FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-08' AND site_id = 'site_itc'");
echo "\n=== payroll_statuses ITC août 2026 ===\n";
echo "Total: " . count($rows2) . "\n";
foreach ($rows2 as $r) {
    echo "Agent: {$r['agent_name']}, Zone: {$r['zone_name']}, Statut: {$r['status']}\n";
}

// Check if there is a service_data or similar table with ITC info
echo "\n=== Recherche dans service_data ===\n";
$rows3 = $sqlite->query("SELECT * FROM service_data WHERE (data_key LIKE '%itc%' OR value LIKE '%KEKELY%') AND company_id = 'comp_cf66d02f' LIMIT 20");
echo "Total: " . count($rows3) . "\n";
foreach ($rows3 as $r) {
    echo "Key: {$r['data_key']}, Value preview: " . substr($r['value'], 0, 100) . "\n";
}
