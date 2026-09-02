<?php
$dbPath = __DIR__ . '/database/pontage.sqlite';
$sqlite = new PDO("sqlite:$dbPath");

$stmt = $sqlite->prepare("SELECT * FROM agents WHERE name = 'UUU'");
$stmt->execute();
$uuu = $stmt->fetch();
if (!$uuu) die("UUU not found\n");

echo "UUU id: " . $uuu['id'] . "\n";

$stmt2 = $sqlite->prepare("SELECT * FROM agent_schedules WHERE agent_id = ?");
$stmt2->execute([$uuu['id']]);
$scheds = $stmt2->fetchAll();
echo "Schedules:\n";
foreach ($scheds as $s) {
    echo "- " . $s['day_of_week'] . ": target_subsite=" . $s['target_subsite_id'] . "\n";
}

$stmt3 = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ? AND period = '07/2026'");
$stmt3->execute([$uuu['id']]);
$att = $stmt3->fetchAll();
echo "Attendance:\n";
foreach ($att as $a) {
    echo "- " . $a['date'] . ": " . $a['status'] . "\n";
}
