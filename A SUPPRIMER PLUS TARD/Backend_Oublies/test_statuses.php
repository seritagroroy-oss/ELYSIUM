<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    // Check distinct statuses for July
    $stmt = $db->query("SELECT DISTINCT status FROM attendance WHERE period = '2026-07' AND status IS NOT NULL AND status != '' AND status != '1' AND status != 'Repos'");
    $statuses = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "DISTINCT STATUSES IN JULY 2026:\n";
    print_r($statuses);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
