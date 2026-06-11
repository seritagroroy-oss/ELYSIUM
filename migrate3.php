<?php
require_once "backend/database.php";
$db = getDb();
try {
    $db->exec("ALTER TABLE users ADD COLUMN phone TEXT;");
    echo "OK";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
