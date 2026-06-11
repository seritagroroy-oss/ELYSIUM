<?php
require 'backend/database.php';
$sqlite = getDb();

echo "=== TABLES ===\n";
$tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table'");
foreach ($tables as $t) echo " - " . $t['name'] . "\n";

echo "\n=== service_data (published_periods) ===\n";
$rows = $sqlite->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");
foreach ($rows as $r) {
    echo " service_id: {$r['service_id']}, value: {$r['data_value']}\n";
}

echo "\n=== archives ===\n";
$rows = $sqlite->query("SELECT id, service_id, period, length(data) as data_len FROM archives");
foreach ($rows as $r) {
    echo " id: {$r['id']}, service_id: {$r['service_id']}, period: {$r['period']}, data_size: {$r['data_len']} bytes\n";
}

echo "\n=== sites ===\n";
$rows = $sqlite->query("SELECT id, name, service_id FROM sites LIMIT 10");
foreach ($rows as $r) echo " id: {$r['id']}, name: {$r['name']}, service_id: {$r['service_id']}\n";

echo "\n=== agents (first 5) ===\n";
$rows = $sqlite->query("SELECT id, name, service_id, subsite_id FROM agents LIMIT 5");
foreach ($rows as $r) echo " id: {$r['id']}, name: {$r['name']}, service_id: {$r['service_id']}, subsite_id: {$r['subsite_id']}\n";

echo "\n=== attendance (first 5) ===\n";
$rows = $sqlite->query("SELECT agent_id, date, shift_code, status, period, service_id FROM attendance LIMIT 5");
foreach ($rows as $r) echo " agent: {$r['agent_id']}, date: {$r['date']}, shift: {$r['shift_code']}, status: {$r['status']}, period: {$r['period']}, service: {$r['service_id']}\n";
