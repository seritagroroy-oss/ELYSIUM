<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

$stmt = $pdo->prepare("SELECT DISTINCT period FROM attendance WHERE agent_id = '6a7a6a4eef230'");
$stmt->execute();
$periods = $stmt->fetchAll(PDO::FETCH_COLUMN);

print_r($periods);
?>
