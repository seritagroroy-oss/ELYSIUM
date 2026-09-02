<?php
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
try {
    $stmt = $sqlite->prepare("SELECT * FROM service_data WHERE data_key = 'published_periods'");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "service_data published_periods rows:\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error querying service_data: " . $e->getMessage() . "\n";
}

try {
    $stmt = $sqlite->prepare("SELECT COUNT(*) FROM archives_pointage");
    $stmt->execute();
    $count = $stmt->fetchColumn();
    echo "archives_pointage rows: $count\n";
} catch (Exception $e) {
    echo "Error querying archives_pointage: " . $e->getMessage() . "\n";
}

try {
    $stmt = $sqlite->prepare("SELECT * FROM payroll_snapshots");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "payroll_snapshots:\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error querying payroll_snapshots: " . $e->getMessage() . "\n";
}
