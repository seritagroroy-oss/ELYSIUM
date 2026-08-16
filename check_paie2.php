<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Check payroll_statuses for comp_cf66d02f on ITC site, period 2026-07
$rows = $sqlite->query("SELECT * FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' AND (site_id LIKE '%itc%' OR zone_name LIKE '%itc%' OR zone_name LIKE '%ITC%' OR site_id LIKE '%ITC%') LIMIT 50");

echo "ITC payroll_statuses for comp_cf66d02f 2026-07:\n";
if (empty($rows)) {
    echo "NONE found.\n";
} else {
    foreach ($rows as $r) {
        echo "Agent: {$r['agent_name']}, Site: {$r['site_id']}, Zone: {$r['zone_name']}, Status: {$r['status']}\n";
    }
}

// Also check all distinct site_ids for comp_cf66d02f period 2026-07
$rows2 = $sqlite->query("SELECT DISTINCT site_id, zone_name FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' ORDER BY site_id");
echo "\nAll distinct site_id/zone_name for comp_cf66d02f 2026-07:\n";
foreach ($rows2 as $r) {
    echo "Site: {$r['site_id']}, Zone: {$r['zone_name']}\n";
}
