<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb(); // Using MySQL because $USE_MYSQL is true
try {
    $stmt = $sqlite->query("DESCRIBE archives_pointage");
    echo json_encode($stmt, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
