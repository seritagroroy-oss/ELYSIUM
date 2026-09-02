<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    $stmt = $db->query("SELECT * FROM subsites WHERE site_id = 'site_extras_sur_site'");
    $subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "SUBSITES FOR EXTRA SUR SITE IN DB:\n";
    print_r($subsites);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
