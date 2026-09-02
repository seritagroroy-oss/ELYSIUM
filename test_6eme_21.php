<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT a.date, a.status, a.agent_id, ag.name 
    FROM attendance a 
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.service_id = 'sub_1782741757_3121' AND a.date = '2026-07-21' AND a.status = 'A'
");
$stmt->execute([]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
