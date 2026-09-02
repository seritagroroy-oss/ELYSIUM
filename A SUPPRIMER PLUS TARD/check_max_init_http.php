<?php
require_once __DIR__ . '/backend/core/functions.php';
try {
    $mysql = new PDO('mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8', 'root', '');
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $mysql->query("SELECT * FROM service_data WHERE `key` = 'max_initialized_period'");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
