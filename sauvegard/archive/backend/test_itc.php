<?php
require_once __DIR__ . '/backend/core/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name, subsite_id, service_id, archived_period FROM agents WHERE subsite_id LIKE 'itc_%' OR subsite_id LIKE 'site_itc_%'");
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total agents: " . count($agents) . "\n";
foreach($agents as $a) {
    echo "ID: {$a['id']}, Name: {$a['name']}, Subsite: {$a['subsite_id']}, Service: {$a['service_id']}, Archived: {$a['archived_period']}\n";
}
