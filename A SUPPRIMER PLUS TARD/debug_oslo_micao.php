<?php
require 'c:\laragon\www\pontage\backend\database.php';
$sqlite = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');
$stmt = $sqlite->query("SELECT id, name FROM sites");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
