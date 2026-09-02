<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT id, name, company_id, subsite_id 
    FROM agents
    WHERE name LIKE '%GOLI YVES MARTIAL%' OR name LIKE '%KOUASSI FAMIEN JESUS%' OR name LIKE '%KONATE MOUSTAPHA%'
");
$stmt->execute([]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
