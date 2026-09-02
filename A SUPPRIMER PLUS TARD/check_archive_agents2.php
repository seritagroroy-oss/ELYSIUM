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
    $extras = reset($extras);
    
    echo "ARCHIVE EXTRA SUR SITE AGENTS FULL DUMP:\n";
    print_r($extras);
}
