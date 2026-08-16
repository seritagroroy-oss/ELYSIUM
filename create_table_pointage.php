<?php
require 'backend/database.php';
// Determine the path to the DB. database.php defines SQLITE_FILE
$db = new ElysiumDb(SQLITE_FILE);

$sql = "
CREATE TABLE IF NOT EXISTS archives_pointage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    period TEXT,
    archived_date DATETIME,
    archived_by TEXT,
    data TEXT
);
";

try {
    $db->exec($sql);
    echo "Table archives_pointage created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
