<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    $stmt = $db->query("SELECT id, period, created_at, company_id FROM archives_pointage WHERE period = '2026-07' ORDER BY id DESC");
    echo "ALL ARCHIVES FOR 2026-07:\n";
    $rows = $stmt->fetchAll();
    foreach($rows as $row) {
        echo "ID: " . $row['id'] . " | created_at: " . $row['created_at'] . " | company: " . $row['company_id'] . "\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
