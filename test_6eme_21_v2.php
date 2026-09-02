<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT a.*, ag.name 
    FROM attendance a 
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.service_id = 'sub_1782741757_3121' AND a.date = '2026-07-21'
");
$stmt->execute([]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($res) . "\n";
echo json_encode($res, JSON_PRETTY_PRINT);
