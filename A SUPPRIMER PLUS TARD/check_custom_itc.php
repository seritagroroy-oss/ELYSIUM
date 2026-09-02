<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT * FROM sites WHERE company_id = 'comp_cf66d02f' AND name LIKE '%ITC%'");
$stmt->execute();
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Sites containing ITC for comp_cf66d02f:\n";
foreach ($sites as $s) {
    echo "ID: {$s['id']}, Name: {$s['name']}\n";
}

$stmt2 = $sqlite->prepare("SELECT * FROM subsites WHERE company_id = 'comp_cf66d02f' AND name LIKE '%ITC%'");
$stmt2->execute();
$subsites = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo "\nSubsites containing ITC for comp_cf66d02f:\n";
foreach ($subsites as $s) {
    echo "ID: {$s['id']}, Name: {$s['name']}, Site ID: {$s['site_id']}\n";
}
