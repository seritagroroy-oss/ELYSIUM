<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
try {
    $rows = $sqlite->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");
    echo json_encode($rows, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
