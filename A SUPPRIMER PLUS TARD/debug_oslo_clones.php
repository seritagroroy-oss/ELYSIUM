<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

// Fetch OSLO clones
$stmt = $pdo->prepare("SELECT id, name FROM agents WHERE name LIKE '%OSLO%'");
$stmt->execute();
$oslos = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($oslos);

foreach ($oslos as $o) {
    echo "\nAttendance for " . $o['id'] . "\n";
    $stmtAtt = $pdo->prepare("SELECT date, status FROM attendance WHERE agent_id = ?");
    $stmtAtt->execute([$o['id']]);
    print_r($stmtAtt->fetchAll(PDO::FETCH_ASSOC));
}
?>
