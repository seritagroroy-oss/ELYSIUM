<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();
$snapshot = json_decode($row['snapshot'], true);
print_r(array_slice($snapshot, 0, 1));
