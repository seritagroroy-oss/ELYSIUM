<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

$stmt = $pdo->prepare("DESCRIBE attendance");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
