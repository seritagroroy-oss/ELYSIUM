<?php
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
try {
    $stmt = $sqlite->prepare("SELECT * FROM service_data WHERE service_id = 'comp_a8b50b7e' AND data_key = 'published_periods'");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "service_data for comp_a8b50b7e published_periods:\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
