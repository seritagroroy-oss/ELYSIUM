<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . "/../backend/database.php";
$pdo = getDb();
$results = $pdo->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");
echo json_encode($results, JSON_PRETTY_PRINT);

