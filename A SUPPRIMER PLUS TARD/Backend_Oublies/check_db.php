<?php
$sqlite = new PDO('sqlite:E:\Pontage - VRAI 02 06 2026\backend\data\database.sqlite');
$stmt = $sqlite->query("SELECT * FROM agent_schedules");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt2 = $sqlite->query("SELECT id, name FROM agents");
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
