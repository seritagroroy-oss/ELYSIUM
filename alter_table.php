<?php
require 'backend/database.php';
$db = getDb();
try {
    $db->query('ALTER TABLE entreprises ADD COLUMN owner_email TEXT');
    echo "Column added successfully.\n";
} catch (Exception $e) {
    echo "Error adding column: " . $e->getMessage() . "\n";
}
