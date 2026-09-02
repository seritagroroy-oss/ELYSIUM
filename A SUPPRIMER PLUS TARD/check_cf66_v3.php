<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT subsite_id, COUNT(*) as c FROM agents WHERE company_id = 'comp_cf66d02f' GROUP BY subsite_id");
$stmt->execute();
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Subsites for comp_cf66d02f:\n";
foreach ($subsites as $s) {
    echo "Subsite: {$s['subsite_id']}, Count: {$s['c']}\n";
}
