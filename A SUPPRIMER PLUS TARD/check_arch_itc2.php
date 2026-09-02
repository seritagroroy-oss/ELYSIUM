<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'arch_1785518435'");
$data_raw = $arch[0]['data'] ?? null;

$json = json_decode($data_raw, true);
if (!$json) die("Cannot parse JSON\n");

echo "Archive period: {$json['period']}\n";
echo "Sites count: {$json['sites_count']}\n\n";

foreach ($json['sites'] as $site) {
    if (strpos($site['id'] ?? '', 'itc') !== false || strpos(strtolower($site['name'] ?? ''), 'itc') !== false || strpos(strtolower($site['name'] ?? ''), 'ifm') !== false) {
        echo "=== ITC/IFM site FOUND ===\n";
        echo "Site ID: {$site['id']}, Name: {$site['name']}\n";
        if (!empty($site['subsites'])) {
            foreach ($site['subsites'] as $sub) {
                $agent_names = array_column($sub['agents'] ?? [], 'name');
                echo "  Subsite: {$sub['name']} (" . count($sub['agents'] ?? []) . " agents)\n";
                foreach ($agent_names as $n) echo "    - $n\n";
            }
        }
    }
}

echo "\nAll site IDs:\n";
foreach ($json['sites'] as $site) {
    echo "  - {$site['id']} | {$site['name']} | " . count($site['subsites'] ?? []) . " subsites\n";
}
