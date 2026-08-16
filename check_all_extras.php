<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data FROM archives_pointage WHERE id = 106");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $data = json_decode($row['data'], true);
    $sites = $data['sites'] ?? [];
    $extras = array_filter($sites, fn($s) => strpos($s['id'], 'site_extras_sur_site') !== false);
    
    echo "FOUND " . count($extras) . " EXTRA SUR SITE ENTRIES!\n";
    foreach ($extras as $index => $ext) {
        echo "ENTRY INDEX $index:\n";
        foreach ($ext['subsites'] as $sub) {
            echo "  SUBSITE: " . $sub['name'] . " - AGENTS: " . count($sub['agents']) . "\n";
            foreach ($sub['agents'] as $ag) {
                echo "    - " . $ag['name'] . "\n";
            }
        }
    }
}
