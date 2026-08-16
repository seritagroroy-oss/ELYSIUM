<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT * FROM sites WHERE company_id = ?");
$stmt->execute([$company_id]);
$sites = $stmt->fetchAll();
foreach ($sites as $site) {
    if (stripos($site['name'], 'admin') !== false) {
        echo "Found site: " . $site['name'] . "\n";
    }
}
echo "Done.\n";
