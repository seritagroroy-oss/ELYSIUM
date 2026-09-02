<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

$stmt = $pdo->prepare("SELECT name FROM subsites WHERE id = ?");
$stmt->execute(['sub_1784661329_5082']);
echo "Subsite name: " . $stmt->fetchColumn() . "\n";
?>
