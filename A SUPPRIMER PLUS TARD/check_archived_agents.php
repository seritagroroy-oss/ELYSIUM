<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT id, name, subsite_id, archived_period FROM agents WHERE company_id = 'comp_cf66d02f' AND archived_period IS NOT NULL");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Archived agents for comp_cf66d02f: " . count($agents) . "\n";
foreach ($agents as $a) {
    if (strpos($a['subsite_id'], 'itc') !== false) {
        echo "Found one with ITC: {$a['name']}, subsite: {$a['subsite_id']}\n";
    }
}
