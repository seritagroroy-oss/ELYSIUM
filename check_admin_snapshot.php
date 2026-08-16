<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();
if ($row) {
    $snapshot = json_decode($row['snapshot'], true);
    foreach ($snapshot as $ag) {
        foreach ($ag as $key => $val) {
            if (is_string($val) && stripos($val, 'admin') !== false) {
                echo "Agent: {$ag['name']} - Key: $key - Val: $val\n";
            }
        }
    }
}
echo "Done checking snapshot.\n";
