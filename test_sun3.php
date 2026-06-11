<?php
require 'backend/database.php';
$sqlite = getDb();

$rows = $sqlite->query("SELECT agent_id, shift_code, status FROM attendance WHERE period = '2026-06' AND date IN ('2026-06-07', '2026-06-14')");

$status_counts = [];
foreach ($rows as $r) {
    $s = $r['status'];
    $status_counts[$s] = ($status_counts[$s] ?? 0) + 1;
}
print_r($status_counts);
