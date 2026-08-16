<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$agent_id = '6a3e8cebae419'; // SERY DALI JOSUE
$stmt = $sqlite->query("SELECT * FROM agents WHERE id = '$agent_id'");
$agent = $stmt->fetchAll()[0] ?? null;

echo "Agent:\n";
print_r($agent);

// test comparison
$period = '2026-06';
$stmt2 = $sqlite->query("SELECT * FROM agents WHERE id = '$agent_id' AND (archived_period IS NULL OR archived_period >= '$period')");
$res2 = $stmt2->fetchAll();
echo "Visible in 2026-06? " . count($res2) . "\n";

$period = '2026-07';
$stmt3 = $sqlite->query("SELECT * FROM agents WHERE id = '$agent_id' AND (archived_period IS NULL OR archived_period >= '$period')");
$res3 = $stmt3->fetchAll();
echo "Visible in 2026-07? " . count($res3) . "\n";

// test attendance
$stmt4 = $sqlite->query("SELECT period, COUNT(*) as cnt FROM attendance WHERE agent_id = '$agent_id' GROUP BY period");
$att = $stmt4->fetchAll();
echo "Attendance:\n";
print_r($att);
