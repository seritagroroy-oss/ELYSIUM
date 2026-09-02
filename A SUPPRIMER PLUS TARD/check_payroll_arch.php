<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// This archive has keys: salaries, archived_at, archived_by, status
// Let's decode it and look for ITC agents
$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'payroll_2026-07'");
$raw = $arch[0]['data'] ?? '';

$json = json_decode($raw, true);
if (!$json) die("Cannot parse\n");

echo "Keys: " . implode(', ', array_keys($json)) . "\n";
echo "Status: " . ($json['status'] ?? 'N/A') . "\n";
echo "Archived by: " . ($json['archived_by'] ?? 'N/A') . "\n";
echo "Archived at: " . ($json['archived_at'] ?? 'N/A') . "\n\n";

$salaries = $json['salaries'] ?? [];
echo "Total salary entries: " . count($salaries) . "\n\n";

// Search for ITC in salaries
$itc_agents = [];
foreach ($salaries as $sal) {
    $site_id = $sal['site_id'] ?? '';
    $subsite_id = $sal['subsite_id'] ?? '';
    if ($site_id === 'site_itc' || strpos($site_id, 'itc') !== false || strpos($subsite_id, 'itc') !== false) {
        $itc_agents[] = $sal;
    }
}

echo "=== ITC AGENTS in payroll_2026-07 archive ===\n";
echo "Total: " . count($itc_agents) . "\n\n";

foreach ($itc_agents as $ag) {
    echo "Agent: " . ($ag['agent_name'] ?? $ag['name'] ?? 'N/A') . "\n";
    echo "  Site: " . ($ag['site_id'] ?? 'N/A') . "\n";
    echo "  Subsite/Zone: " . ($ag['subsite_id'] ?? $ag['zone_name'] ?? 'N/A') . "\n";
    echo "  Function: " . ($ag['function'] ?? 'N/A') . "\n";
    echo "  Keys: " . implode(', ', array_keys($ag)) . "\n\n";
}

// If none found, show the first entry structure
if (empty($itc_agents) && !empty($salaries)) {
    echo "First entry keys: " . implode(', ', array_keys($salaries[0])) . "\n";
    echo "First entry sample:\n";
    foreach (array_slice($salaries[0], 0, 10, true) as $k => $v) {
        echo "  $k: " . (is_string($v) ? $v : json_encode($v)) . "\n";
    }
    
    // Show all unique site_ids
    $sites = array_unique(array_column($salaries, 'site_id'));
    echo "\nAll site_ids in payroll_2026-07:\n";
    foreach ($sites as $s) echo "  - $s\n";
}
