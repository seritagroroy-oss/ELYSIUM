<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT name FROM sites WHERE company_id = ?");
$stmt->execute([$company_id]);
$sites = $stmt->fetchAll();
foreach ($sites as $site) {
    echo $site['name'] . "\n";
}
