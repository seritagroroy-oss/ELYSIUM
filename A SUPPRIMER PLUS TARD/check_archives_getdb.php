<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb(); // Gets the default DB (SQLite or MySQL)
if ($sqlite instanceof PDO) {
    $stmt = $sqlite->query("SELECT period, company_id, archived_date FROM archives_pointage ORDER BY archived_date DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
    // Custom DB class
    $rows = $sqlite->query("SELECT period, company_id, archived_date FROM archives_pointage ORDER BY archived_date DESC LIMIT 10");
}
echo json_encode($rows, JSON_PRETTY_PRINT);
