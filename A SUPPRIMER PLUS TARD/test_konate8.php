<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id = 'KONATE MOUSTAPHA'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Attendance for KONATE MOUSTAPHA:\n";
print_r($rows);
