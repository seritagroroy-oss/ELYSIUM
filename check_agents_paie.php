<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Get all payroll_statuses for comp_cf66d02f and period 2026-07, ALL sites
$rows = $sqlite->query("SELECT agent_name, site_id, zone_name FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' AND (agent_name LIKE '%KOUADIO%' OR agent_name LIKE '%KEKELY%' OR agent_name LIKE '%NGUESSAN%' OR agent_name LIKE '%N\'GUESSAN%' OR agent_name LIKE '%NIAMIEN%' OR agent_name LIKE '%BEHI%' OR agent_name LIKE '%DJAHOUE%' OR agent_name LIKE '%GUY%')");

echo "Search results for the 4 agents in ALL payroll_statuses 2026-07:\n";
echo "Count: " . count($rows) . "\n\n";
foreach ($rows as $r) {
    echo "Agent: {$r['agent_name']}, Site: {$r['site_id']}, Zone: {$r['zone_name']}\n";
}

// Also check different period
echo "\n\n=== Checking across ALL periods for these agents ===\n";
$rows2 = $sqlite->query("SELECT agent_name, site_id, zone_name, period FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND (agent_name LIKE '%KEKELY%' OR agent_name LIKE '%DJAHOUE%' OR agent_name LIKE '%NIAMIEN%')");
echo "Count: " . count($rows2) . "\n";
foreach ($rows2 as $r) {
    echo "Agent: {$r['agent_name']}, Site: {$r['site_id']}, Zone: {$r['zone_name']}, Period: {$r['period']}\n";
}
