<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'payroll_2026-07'");
$raw = $arch[0]['data'] ?? '';
$json = json_decode($raw, true);
$salaries = $json['salaries'] ?? [];

// Get unique sites
$sites = array_unique(array_column($salaries, 'site'));
sort($sites);
echo "Unique 'site' values (" . count($sites) . "):\n";
foreach ($sites as $s) echo "  - $s\n";

echo "\n\nSearching for ITC in any field...\n";
$found = 0;
foreach ($salaries as $sal) {
    $encoded = json_encode($sal);
    if (stripos($encoded, 'itc') !== false || stripos($encoded, 'ifm') !== false) {
        echo "FOUND: " . ($sal['name'] ?? 'N/A') . " - site: " . ($sal['site'] ?? 'N/A') . " - subsite: " . ($sal['subsite'] ?? 'N/A') . "\n";
        $found++;
    }
}
if ($found === 0) echo "ITC/IFM NOT found in any salary entry.\n";
