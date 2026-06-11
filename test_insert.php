<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'db.php';
require_once 'backend/database.php';

try {
    $id = 'comp_' . substr(md5('Test' . microtime(true)), 0, 8);
    echo "ID: " . $id . "\n";
    $sqlite = getDb();
    $stmt = $sqlite->prepare('INSERT INTO entreprises (id, name) VALUES (?, ?)');
    $stmt->execute([$id, 'Test']);
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
