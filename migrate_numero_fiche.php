<?php
require 'backend/database.php';
$db = getDb();
try {
    $db->exec("ALTER TABLE reclamations ADD COLUMN numero_fiche TEXT");
    echo "Column added successfully.";
} catch (Exception $e) {
    echo "Error or column already exists: " . $e->getMessage();
}
