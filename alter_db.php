<?php
require_once 'backend/database.php';
$db = getDb();
try {
    $db->exec("ALTER TABLE agents ADD COLUMN profile_data TEXT DEFAULT '{}'");
    echo "Column added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
