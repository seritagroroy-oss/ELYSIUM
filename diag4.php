<?php
require 'backend/database.php';
$sqlite = getDb();
$service = 'svc_1780068297_395';

echo "=== Agent du service $service ===\n";
$rows = $sqlite->query("SELECT * FROM agents WHERE service_id = '$service'");
foreach ($rows as $r) {
    echo " id: {$r['id']}, name: {$r['name']}, subsite_id: {$r['subsite_id']}\n";
}

echo "\n=== Subsite de cet agent ===\n";
$rows = $sqlite->query("SELECT * FROM subsites WHERE id IN (SELECT subsite_id FROM agents WHERE service_id = '$service')");
foreach ($rows as $r) {
    echo " subsite id: {$r['id']}, name: {$r['name']}, site_id: {$r['site_id']}\n";
}

echo "\n=== Site parent du subsite ===\n";
$rows = $sqlite->query("SELECT s.* FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id IN (SELECT subsite_id FROM agents WHERE service_id = '$service')");
foreach ($rows as $r) {
    echo " site id: {$r['id']}, name: {$r['name']}, service_id: {$r['service_id']}\n";
}

echo "\n=== Archive detail ===\n";
$rows = $sqlite->query("SELECT id, data FROM archives WHERE service_id = '$service'");
foreach ($rows as $r) {
    echo " Archive id: {$r['id']}\n";
    $d = json_decode($r['data'], true);
    echo " sites_count: " . count($d['sites'] ?? []) . "\n";
    echo " Data preview: " . substr($r['data'], 0, 200) . "\n";
}
