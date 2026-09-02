<?php
require 'database.php';
$db = new ElysiumDb(__DIR__ . '/elysium.db');
$stmt = $db->prepare("SELECT * FROM attendance WHERE status LIKE 'Suppl%' ORDER BY id DESC LIMIT 20");
$stmt->execute([]);
$res = $stmt->fetchAll();
file_put_contents('att_log.txt', print_r($res, true));
$stmt2 = $db->prepare("SELECT * FROM agents WHERE has_sp = 2");
$stmt2->execute([]);
file_put_contents('att_log.txt', "\n--- AGENTS ---\n" . print_r($stmt2->fetchAll(), true), FILE_APPEND);
echo "Done";
