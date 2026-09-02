<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$agent_id = 'ag_5a17';
// find agent with id 
$stmt = $sqlite->prepare("SELECT id, name, profile_data FROM agents LIMIT 1");
$stmt->execute();
$agent = $stmt->fetch();
echo "Table: " . $agent['id'] . "\n";
echo "Profile type: " . gettype($agent['profile_data']) . "\n";
echo "Profile value: " . $agent['profile_data'] . "\n";

$company_id = 'comp_cf66d02f';
$period = '2026-07';
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();
$snapshot = json_decode($row['snapshot'], true);
echo "\nSnapshot agent profile type: " . gettype($snapshot[0]['profile_data']) . "\n";
echo "Snapshot agent profile value: " . (is_array($snapshot[0]['profile_data']) ? json_encode($snapshot[0]['profile_data']) : $snapshot[0]['profile_data']) . "\n";
