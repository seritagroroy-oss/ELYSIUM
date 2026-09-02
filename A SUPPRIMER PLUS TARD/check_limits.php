<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
try {
    $stmt = $sqlite->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    echo json_encode($stmt);
    echo "\npost_max_size: " . ini_get('post_max_size');
    echo "\nupload_max_filesize: " . ini_get('upload_max_filesize');
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
