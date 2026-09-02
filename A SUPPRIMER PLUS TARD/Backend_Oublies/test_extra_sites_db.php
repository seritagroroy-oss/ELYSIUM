<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    // Check sites that were archived or deleted recently
    $stmt = $db->query("SELECT * FROM sites WHERE name LIKE '%EXTRA%' OR id LIKE '%extra%'");
    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "SITES LIKE EXTRA:\n";
    print_r($sites);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
