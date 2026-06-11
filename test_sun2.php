<?php
require 'backend/database.php';
$sqlite = getDb();

// Find an agent that has data in 2026-06
$stmt = $sqlite->query("SELECT agent_id, count(*) as c FROM attendance WHERE period = '2026-06' GROUP BY agent_id ORDER BY c DESC LIMIT 1");
$agent_id = $stmt[0]['agent_id'];

echo "Agent ID: $agent_id\n";

$stmt2 = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE period = '2026-06' AND agent_id = ? ORDER BY date");
$stmt2->execute([$agent_id]);
$rows = $stmt2->fetchAll();

foreach ($rows as $row) {
    $dw = (new DateTime($row['date']))->format('w');
    if ($dw == 0) {
        echo "SUNDAY: " . $row['date'] . " [" . $row['shift_code'] . "] = '" . $row['status'] . "'\n";
    }
}
