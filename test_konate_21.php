<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT a.*, ag.name as agent_name 
    FROM attendance a 
    JOIN agents ag ON a.agent_id = ag.id
    WHERE ag.name LIKE '%KONATE MOUSTAPHA%' AND a.date = '2026-07-21'
");
$stmt->execute([]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
