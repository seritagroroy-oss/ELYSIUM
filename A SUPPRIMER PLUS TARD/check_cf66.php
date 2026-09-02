<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT id, name, subsite_id, archived_period FROM agents WHERE company_id = 'comp_cf66d02f' AND subsite_id LIKE '%itc%'");
$stmt->execute();
$agents = $stmt->fetchAll();

echo "Agents for comp_cf66d02f in ITC:\n";
foreach ($agents as $a) {
    echo "ID: {$a['id']}, Name: {$a['name']}, Subsite: {$a['subsite_id']}, Archived: {$a['archived_period']}\n";
}

$stmt2 = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE company_id = 'comp_cf66d02f'");
$stmt2->execute();
echo "Total agents for comp_cf66d02f: " . $stmt2->fetchColumn() . "\n";
