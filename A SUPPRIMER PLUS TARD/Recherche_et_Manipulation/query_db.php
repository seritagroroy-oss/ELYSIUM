<?php
$db = new PDO('sqlite:c:/laragon/www/pontage/elysium.db');

// Get Agent
$stmt = $db->query("SELECT id, name FROM agents WHERE name LIKE '%ANICEL%'");
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($agents)) die("Agent not found");
$agent_id = $agents[0]['id'];

// Get Leaves
$stmt = $db->prepare("SELECT * FROM pointage_leaves WHERE agent_id = ?");
$stmt->execute([$agent_id]);
$leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get Attendance
$stmt = $db->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = '2051-11' ORDER BY date");
$stmt->execute([$agent_id]);
$attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- LEAVES ---\n";
print_r($leaves);
echo "\n--- ATTENDANCE ---\n";
print_r($attendance);
