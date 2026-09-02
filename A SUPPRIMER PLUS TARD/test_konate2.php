<?php
require __DIR__ . '/backend/database.php';

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE name LIKE '%KONATE MOUSTAPHA%'");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- AGENTS ---\n";
foreach ($agents as $a) {
    echo "ID: {$a['id']}, Name: {$a['name']}, Subsite: {$a['subsite_id']}, ArchivedPeriod: {$a['archived_period']}\n";
}

$agentIds = array_column($agents, 'id');
$placeholders = str_repeat('?,', count($agentIds) - 1) . '?';

$stmtAtt = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id IN ($placeholders) AND period = '2026-08' ORDER BY date");
$stmtAtt->execute($agentIds);
$att = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- ATTENDANCE ---\n";
foreach ($att as $t) {
    echo "Agent: {$t['agent_id']}, Date: {$t['date']}, Shift: {$t['shift_code']}, Status: {$t['status']}, Source: {$t['source_site_id']}\n";
}
