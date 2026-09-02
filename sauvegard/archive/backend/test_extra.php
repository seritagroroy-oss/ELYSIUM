<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $stmt = $db->query("SELECT id, name, site_id, company_id, service_id FROM subsites WHERE site_id = 'site_extras_sur_site'");
    echo "CURRENT SUBSITES FOR EXTRA SUR SITE:\n";
    print_r($stmt->fetchAll());
    
    $stmt2 = $db->query("SELECT id, name, site_id, company_id, service_id FROM subsites WHERE site_id LIKE '%extra%' OR name LIKE '%EXTRA%'");
    echo "ALL EXTRA SUBSITES:\n";
    print_r($stmt2->fetchAll());

    $stmt3 = $db->query("SELECT id, agent_id, period, status FROM attendance WHERE status LIKE '%site_extras_sur_site%' LIMIT 10");
    echo "ATTENDANCE STATUS for site_extras_sur_site:\n";
    print_r($stmt3->fetchAll());
    
    $stmt4 = $db->query("SELECT id, agent_id, period, status FROM attendance WHERE status LIKE '%EXTRA%' LIMIT 10");
    echo "ATTENDANCE STATUS for EXTRA:\n";
    print_r($stmt4->fetchAll());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
