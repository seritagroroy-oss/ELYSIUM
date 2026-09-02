<?php
require_once __DIR__ . '/backend/core/database.php';

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE name LIKE '%.d%' OR name = 'd' OR name = '.d'");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "AGENTS FOUND:\n";
print_r($agents);

echo "\nLEAVES FOUND:\n";
foreach ($agents as $a) {
    $stmtL = $sqlite->prepare("SELECT * FROM pointage_leaves WHERE agent_id = ?");
    $stmtL->execute([$a['id']]);
    $leaves = $stmtL->fetchAll(PDO::FETCH_ASSOC);
    if ($leaves) {
        echo "Leaves for {$a['name']} ({$a['id']}):\n";
        print_r($leaves);
    }
}
