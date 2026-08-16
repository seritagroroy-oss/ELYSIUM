<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Get the service_id used by most agents in comp_cf66d02f
$rows = $sqlite->query("SELECT service_id, COUNT(*) as cnt FROM agents WHERE company_id = 'comp_cf66d02f' AND archived_period IS NULL AND service_id IS NOT NULL AND service_id != '' GROUP BY service_id ORDER BY cnt DESC LIMIT 5");
echo "=== Service IDs used by comp_cf66d02f agents ===\n";
foreach ($rows as $r) {
    echo "service_id: {$r['service_id']}, count: {$r['cnt']}\n";
}

// Get all ITC agents from the payroll archive with full details
$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'payroll_2026-07'");
$raw = $arch[0]['data'] ?? '';
$json = json_decode($raw, true);
$salaries = $json['salaries'] ?? [];

$itc_agents = [];
foreach ($salaries as $sal) {
    $site = $sal['site'] ?? '';
    if ($site === 'ITC / IFM') {
        $itc_agents[] = $sal;
    }
}

echo "\n\n=== ALL ITC/IFM AGENTS FROM PAYROLL ARCHIVE ===\n";
echo "Total: " . count($itc_agents) . "\n\n";
foreach ($itc_agents as $ag) {
    echo "Name: " . trim($ag['name']) . "\n";
    echo "  Subsite (zone): " . ($ag['subsite'] ?? 'N/A') . "\n";
    echo "  Function: " . ($ag['function'] ?? 'N/A') . " (" . ($ag['function_label'] ?? '') . ")\n";
    echo "  Shift Type: " . ($ag['shift_type'] ?? 'N/A') . "\n";
    echo "  ID: " . ($ag['id'] ?? 'N/A') . "\n";
    echo "\n";
}
