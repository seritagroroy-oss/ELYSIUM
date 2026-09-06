<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
try {
    $q = $db->query('SELECT * FROM activity_logs');
    print_r($q);
} catch (Exception $e) {
    echo "MySQL Error: " . $e->getMessage();
}
