<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, `function`, salary, archived_period, subsite_id FROM agents WHERE name LIKE '%KOFFI KONAN JEAN-JACQUES%'");
$stmt->execute();
$rows = $stmt->fetchAll();
echo json_encode($rows, JSON_PRETTY_PRINT);
