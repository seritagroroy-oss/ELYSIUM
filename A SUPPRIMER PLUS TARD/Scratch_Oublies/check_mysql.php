<?php
require_once __DIR__ . '/../backend/database.php';
$db = getDb();
try {
    $res = $db->query("SHOW CREATE TABLE service_data");
    echo json_encode($res, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
