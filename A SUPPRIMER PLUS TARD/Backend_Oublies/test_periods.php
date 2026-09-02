<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    // Check July 2026
    $stmt7 = $db->query("SELECT COUNT(*) FROM attendance WHERE period = '2026-07' AND (status LIKE '%site_extras_sur_site%' OR status LIKE '%EXTRA SUR SITE%')");
    $july = $stmt7->fetchColumn();

    // Check August 2026
    $stmt8 = $db->query("SELECT COUNT(*) FROM attendance WHERE period = '2026-08' AND (status LIKE '%site_extras_sur_site%' OR status LIKE '%EXTRA SUR SITE%')");
    $aug = $stmt8->fetchColumn();
    
    echo "JULY COUNT: $july\n";
    echo "AUGUST COUNT: $aug\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
