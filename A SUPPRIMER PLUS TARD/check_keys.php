<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();
$snapshot = json_decode($row['snapshot'], true);
if (count($snapshot) > 0) {
    print_r(array_keys($snapshot[0]));
    echo "\n";
    echo "function_label: " . ($snapshot[0]['function_label'] ?? 'missing') . "\n";
    echo "function: " . ($snapshot[0]['function'] ?? 'missing') . "\n";
}
