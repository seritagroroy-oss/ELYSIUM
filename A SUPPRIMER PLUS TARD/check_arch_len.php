<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, LENGTH(data) as dlen FROM archives WHERE company_id = ?");
$stmt->execute([$company_id]);
$arch = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Archives for comp_cf66d02f:\n";
foreach ($arch as $a) {
    echo "Period: {$a['period']}, Data length: {$a['dlen']}\n";
}
