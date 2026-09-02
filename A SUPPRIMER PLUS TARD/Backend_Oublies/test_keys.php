<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT DISTINCT data_key FROM service_data");
$stmt->execute();
$keys = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo json_encode($keys, JSON_PRETTY_PRINT);
