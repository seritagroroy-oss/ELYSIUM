<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT name FROM subsites WHERE company_id = ?");
$stmt->execute([$company_id]);
$subsites = $stmt->fetchAll();
foreach ($subsites as $s) {
    if (stripos($s['name'], 'admin') !== false) {
        echo "Found subsite: " . $s['name'] . "\n";
    }
}
echo "Done checking subsites.\n";
