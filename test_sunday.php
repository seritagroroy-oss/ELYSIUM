<?php
require 'backend/database.php';
$sqlite = getDb();

// Get the latest period (should be the newly initialized one)
$stmt = $sqlite->prepare("SELECT DISTINCT period FROM attendance ORDER BY period DESC LIMIT 1");
$stmt->execute([]);
$latest_period = $stmt->fetch()['period'];

// Get an agent who has a 24h shift
$stmt = $sqlite->prepare("SELECT id, name FROM agents WHERE shift_type = '24h' AND archived_period IS NULL LIMIT 1");
$stmt->execute([]);
$agent = $stmt->fetch();
$agent_id = $agent['id'];
$agent_name = $agent['name'];

echo "Period: $latest_period, Agent: $agent_name ($agent_id)\n";

// Get their attendance for this period
$stmt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE period = ? AND agent_id = ? ORDER BY date");
$stmt->execute([$latest_period, $agent_id]);
$attendance = $stmt->fetchAll();

foreach ($attendance as $row) {
    $date = $row['date'];
    $day_of_week = (new DateTime($date))->format('w');
    $day_name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$day_of_week];
    echo "Date: $date ($day_name), Shift: " . $row['shift_code'] . ", Status: " . $row['status'] . "\n";
}
