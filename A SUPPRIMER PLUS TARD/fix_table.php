<?php
require 'backend/database.php';
$db = getDb();
try {
    $db->exec("ALTER TABLE archives_pointage MODIFY COLUMN company_id VARCHAR(100)");
    echo "Success altering table";
} catch (Exception $e) {
    echo "Error altering table: " . $e->getMessage();
}
