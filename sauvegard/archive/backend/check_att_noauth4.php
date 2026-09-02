<?php
require 'database.php';
$db = new ElysiumDb(__DIR__ . '/elysium.db');
$stmt = $db->prepare("SELECT * FROM supplementaires_externes ORDER BY id DESC LIMIT 20");
$stmt->execute([]);
$res = $stmt->fetchAll();
file_put_contents('ext_log.txt', print_r($res, true));
echo "Done";
