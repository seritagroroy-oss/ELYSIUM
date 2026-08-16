<?php
require 'database.php';
$db = new ElysiumDb(__DIR__ . '/elysium.db');
$stmt = $db->prepare("SELECT * FROM attendance WHERE status LIKE 'Suppl%' AND period LIKE '2026-%' ORDER BY id DESC LIMIT 20");
$stmt->execute([]);
$res = $stmt->fetchAll();
file_put_contents('att_log3.txt', print_r($res, true));
echo "Done";
