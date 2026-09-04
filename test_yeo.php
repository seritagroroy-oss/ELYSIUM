<?php
require_once __DIR__ . '/backend/config/database.php';

$period = '2026-08';

$stmt = $pdo->prepare("
    SELECT agent_id, date, shift_code, status
    FROM attendance
    WHERE period = :period
    AND agent_id IN (
        SELECT id FROM agents WHERE name LIKE '%YEO YANOUC%'
    )
    AND status = 'A'
");
$stmt->execute(['period' => $period]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Absences in August:\n";
print_r($res);

$stmt = $pdo->prepare("
    SELECT agent_id, date, shift_code, status
    FROM attendance
    WHERE period = '2026-07'
    AND agent_id IN (
        SELECT id FROM agents WHERE name LIKE '%YEO YANOUC%'
    )
    AND status = 'A'
");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Absences in July:\n";
print_r($res);
