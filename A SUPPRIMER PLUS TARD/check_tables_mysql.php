<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SHOW TABLES");
$tables = method_exists($stmt, 'fetchAll') ? $stmt->fetchAll(PDO::FETCH_NUM) : (is_array($stmt) ? $stmt : []);
foreach ($tables as $table) {
    if (is_array($table)) {
        echo $table[0] . "\n";
    } else {
        echo print_r($table, true) . "\n";
    }
}
