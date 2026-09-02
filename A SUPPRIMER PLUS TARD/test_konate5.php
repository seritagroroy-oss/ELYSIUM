<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id = 'ag_1786393167_ag_1783965360_3806' AND date = '2026-07-22'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "ag_1786393167_ag_1783965360_3806 on 2026-07-22:\n";
print_r($rows);

$stmt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id = 'ag_1783965360_3806' AND date = '2026-07-22'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "ag_1783965360_3806 on 2026-07-22:\n";
print_r($rows);

$stmt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id = 'ag_1786404430_ag_1786393167_ag_1783965360_3806' AND date = '2026-07-22'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "ag_1786404430... on 2026-07-22:\n";
print_r($rows);
