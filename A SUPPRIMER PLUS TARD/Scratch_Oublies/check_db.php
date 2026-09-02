<?php
require_once __DIR__ . "/../backend/database.php";
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($data, JSON_PRETTY_PRINT);
