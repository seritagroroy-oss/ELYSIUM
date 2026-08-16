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
        $sites = $data['sites'] ?? [];
        echo "TOTAL SITES IN ARCHIVE: " . count($sites) . "\n";
        echo "INDEX OF EXTRA SUR SITE: ";
        $idx = -1;
        foreach ($sites as $i => $site) {
            if ($site['id'] === 'site_extras_sur_site') {
                $idx = $i;
                break;
            }
        }
        echo $idx . "\n";
        
        // Let's sort them alphabetically as the UI does
        usort($sites, function($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });
        
        echo "INDEX AFTER ALPHA SORT: ";
        $idx2 = -1;
        foreach ($sites as $i => $site) {
            if ($site['id'] === 'site_extras_sur_site') {
                $idx2 = $i;
                break;
            }
        }
        echo $idx2 . " (out of " . count($sites) . ")\n";

    } else {
        echo "NO ARCHIVE FOR JULY!\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
