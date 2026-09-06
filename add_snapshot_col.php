<?php
require 'backend/database.php';
$db = getDb();
try {
    $db->exec("ALTER TABLE reclamations ADD COLUMN fti_data TEXT");
    echo "OK";
} catch(Exception $e) {
    if (strpos($e->getMessage(), 'duplicate column name') !== false) {
        echo "OK (already exists)";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
