<?php
$dbFile = __DIR__ . '/backend/elysium.db';
$sqlite = new PDO('sqlite:' . $dbFile);
$stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = 'comp_bfccd504' AND data_key = 'published_periods'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
