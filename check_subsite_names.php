<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$subsite_ids = [
    'sub_1782484702_9628',
    'sub_1782744129_4613',
    'sub_1782752164_9235',
    'sub_1782753605_4240',
    'sub_1783012824_6989',
    'sub_pfo_adjin_6a671947c8e3a'
];

$inQuery = implode(',', array_fill(0, count($subsite_ids), '?'));
$stmt = $sqlite->prepare("SELECT id, name, site_id FROM subsites WHERE id IN ($inQuery)");
$stmt->execute($subsite_ids);
$subs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Subsites info:\n";
foreach ($subs as $s) {
    echo "Subsite ID: {$s['id']}, Name: {$s['name']}, Site ID: {$s['site_id']}\n";
}

$site_ids = array_unique(array_column($subs, 'site_id'));
if (!empty($site_ids)) {
    $inQuery2 = implode(',', array_fill(0, count($site_ids), '?'));
    $stmt2 = $sqlite->prepare("SELECT id, name FROM sites WHERE id IN ($inQuery2)");
    $stmt2->execute($site_ids);
    $sites = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo "\nSites info:\n";
    foreach ($sites as $s) {
        echo "Site ID: {$s['id']}, Name: {$s['name']}\n";
    }
}
