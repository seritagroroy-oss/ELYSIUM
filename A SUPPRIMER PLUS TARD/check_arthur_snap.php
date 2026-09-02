<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' LIMIT 1");
$stmt->execute();
$snapshot = json_decode($stmt->fetchColumn(), true);
$arthur = null;
foreach ($snapshot as $s) {
    if ($s['id'] === '6a42ac5e2b98f') {
        $arthur = $s;
        break;
    }
}
print_r($arthur);
