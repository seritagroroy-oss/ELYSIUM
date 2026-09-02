<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
try {
    if ($sqlite instanceof PDO) {
        $stmt = $sqlite->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='archives_pointage'");
        $row = $stmt->fetch();
        echo "SQLite table archives_pointage: " . ($row ? "EXISTS" : "NOT FOUND") . "\n";
    } else {
        $stmt = $sqlite->query("SHOW TABLES LIKE 'archives_pointage'");
        echo "MySQL table archives_pointage: " . (!empty($stmt) ? "EXISTS" : "NOT FOUND") . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
