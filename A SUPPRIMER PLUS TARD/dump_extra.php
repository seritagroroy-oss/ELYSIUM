<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT DISTINCT a.agent_id, ag.name, a.status 
    FROM attendance a 
    JOIN agents ag ON a.agent_id = ag.id 
    WHERE a.period = '2026-07' 
    AND a.status LIKE '%EXTRA SUR SITE%'
");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($rows);
