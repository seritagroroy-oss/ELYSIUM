<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/database.sqlite');
$stmt = $sqlite->query("SELECT * FROM service_data WHERE key = 'max_initialized_period'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$sqlite2 = new PDO('sqlite:' . __DIR__ . '/backend/elysium.db');
$stmt2 = $sqlite2->query("SELECT * FROM service_data WHERE key = 'max_initialized_period'");
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
