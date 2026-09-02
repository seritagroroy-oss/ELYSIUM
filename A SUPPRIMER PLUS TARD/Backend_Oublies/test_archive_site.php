<?php
$host = '127.0.0.1';
$port = '3306';
$dbname = 'elysium';
$user = 'root';
$pass = '';
$dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
try {
    $db = new PDO($dsn, $user, $pass);
    
    // Fetch July archive
    $stmt = $db->query("SELECT id, data FROM archives_pointage WHERE period = '2026-07' ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch();
    
    if ($row) {
        $data = json_decode($row['data'], true);
        echo "ARCHIVE ID: " . $row['id'] . "\n";
        
        $sites = $data['sites'] ?? [];
        $extra_site = null;
        foreach ($sites as $site) {
            if ($site['id'] === 'site_extras_sur_site' || strpos($site['name'], 'EXTRA SUR SITE') !== false) {
                $extra_site = $site;
                break;
            }
        }
        
        if ($extra_site) {
            echo "EXTRA SUR SITE SITE INFO:\n";
            // Print site without subsites to save space
            $s = $extra_site;
            unset($s['subsites']);
            print_r($s);
        } else {
            echo "EXTRA SUR SITE NOT FOUND IN ARCHIVE SITES LIST!\n";
        }
    } else {
        echo "NO ARCHIVE FOR JULY!\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
