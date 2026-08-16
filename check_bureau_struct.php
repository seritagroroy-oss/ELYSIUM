<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE company_id = ? AND site_id = '1782478544_525' LIMIT 2");
$stmt->execute([$company_id]);
$agents = $stmt->fetchAll();
foreach ($agents as $ag) {
    echo "Name: " . $ag['name'] . "\n";
    echo "Subsite: " . $ag['subsite_id'] . "\n";
    echo "Function: " . $ag['function_id'] . "\n";
}
