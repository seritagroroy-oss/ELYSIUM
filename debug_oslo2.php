<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

// Fetch OSLO
$stmt = $pdo->prepare("SELECT * FROM agents WHERE name LIKE '%OSLO%'");
$stmt->execute();
$oslo = $stmt->fetch(PDO::FETCH_ASSOC);

$stmtOrigDays = $pdo->prepare("SELECT period, date, status FROM attendance WHERE agent_id = ?");
$stmtOrigDays->execute([$oslo['id']]);
$origAttRows = $stmtOrigDays->fetchAll(PDO::FETCH_ASSOC);

print_r($origAttRows);
?>
