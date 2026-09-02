<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT a.*, ag.name as agent_name 
    FROM attendance a 
    JOIN agents ag ON a.agent_id = ag.id
    WHERE ag.name LIKE '%GOLI YVES MARTIAL%' OR ag.name LIKE '%KOUASSI FAMIEN JESUS%'
");
$stmt->execute([]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count: " . count($res) . "\n";
if (count($res) > 0) {
    echo "First few: \n";
    print_r(array_slice($res, 0, 5));
}
