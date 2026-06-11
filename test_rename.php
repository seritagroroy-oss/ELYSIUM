<?php
require 'backend/database.php';

function getScopedData($serviceKey)
{
    $file = __DIR__ . "/data/sites_{$serviceKey}.json";
    if (file_exists($file)) {
        return json_decode(file_get_contents($file), true);
    }
    return ['sites' => [['id' => 'site1', 'name' => 'Old']]];
}

function saveScopedData($data, $serviceKey)
{
    $file = __DIR__ . "/data/sites_{$serviceKey}.json";
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

$serviceKey = 'some_service';
$site_id = 'site1';
$new_name = 'Test';

$sqlite = getDb();
$stmt = $sqlite->prepare('UPDATE sites SET name = ? WHERE id = ? AND service_id = ?');
$stmt->execute([$new_name, $site_id, $serviceKey]);

$db = getScopedData($serviceKey);
foreach ($db['sites'] as &$s) {
    if ($s['id'] === $site_id) {
        $s['name'] = $new_name;
        break;
    }
}
saveScopedData($db, $serviceKey);
echo "ALL GOOD";
