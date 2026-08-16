<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, `function`, salary, archived_period, subsite_id FROM agents WHERE name LIKE '%KOFFI%'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
