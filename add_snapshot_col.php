<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
try {
    $db->exec("ALTER TABLE activity_logs ADD COLUMN snapshot_data TEXT");
    echo "Column added.\n";
} catch (Exception $e) {
    echo "Column already exists or error: " . $e->getMessage() . "\n";
}
