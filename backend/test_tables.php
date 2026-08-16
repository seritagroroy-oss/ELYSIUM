<?php
require_once __DIR__ . '/database.php';
$db = getDb();
if ($db instanceof ElysiumPdoDb) {
    // MySQL
    $stmt = $db->prepare("SHOW TABLES");
    $stmt->execute();
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
} else {
    // SQLite
    $stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table'");
    $stmt->execute();
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
}
echo json_encode($tables, JSON_PRETTY_PRINT);
