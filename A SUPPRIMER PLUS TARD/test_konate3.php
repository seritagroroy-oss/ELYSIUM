<?php
require __DIR__ . '/backend/database.php';

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE name LIKE '%KONATE MOUSTAPHA%' AND (archived_period IS NULL OR archived_period = '')");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

$agentIds = array_column($agents, 'id');
$placeholders = str_repeat('?,', count($agentIds) - 1) . '?';

$stmtAtt = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id IN ($placeholders) AND period = '2026-08' ORDER BY date, shift_code");
$stmtAtt->execute($agentIds);
$att = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- ATTENDANCE ---\n";
foreach ($att as $t) {
    if (in_array($t['status'], ['A', 'M|', 'PM|']) || strpos($t['status'], 'M|') !== false || strpos($t['status'], 'PM|') !== false) {
        echo "Agent: {$t['agent_id']}, Date: {$t['date']}, Shift: {$t['shift_code']}, Status: {$t['status']}\n";
    }
}
