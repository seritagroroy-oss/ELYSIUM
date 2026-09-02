<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Check the full July archive to see what's inside site_itc specifically
$arch = $sqlite->query("SELECT data, created_at FROM archives WHERE id = 'arch_1785518435'");
$raw = $arch[0]['data'] ?? '';
$created = $arch[0]['created_at'] ?? '';

echo "Archive created_at: $created\n\n";

$json = json_decode($raw, true);
$archived_at = $json['archived_at'] ?? 'inconnu';
echo "Archived at: $archived_at\n\n";

// Count agents total in archive
$total_agents = 0;
foreach ($json['sites'] as $site) {
    foreach ($site['subsites'] ?? [] as $sub) {
        $total_agents += count($sub['agents'] ?? []);
    }
}
echo "Total agents in July archive: $total_agents\n\n";

// Check if site_itc appears anywhere in the raw JSON
if (strpos($raw, 'site_itc') !== false) {
    echo "site_itc IS present somewhere in the archive raw JSON\n";
} else {
    echo "site_itc NOT found anywhere in the archive\n";
}

// Check if ITC agent names appear
$names_to_check = ['KEKELY', 'DJAHOUE', 'NIAMIEN', 'NGUESSAN', 'ITC', 'KOFFI KONAN JEAN-JACQUES'];
foreach ($names_to_check as $n) {
    if (strpos($raw, $n) !== false) {
        echo "FOUND '$n' in archive\n";
    } else {
        echo "NOT FOUND '$n' in archive\n";
    }
}

// Also check archives_pointage for July
echo "\n\n=== archives_pointage for comp_cf66d02f ===\n";
$ap = $sqlite->query("SELECT id, period, archived_date, archived_by, LENGTH(data) as dlen FROM archives_pointage WHERE company_id = 'comp_cf66d02f'");
foreach ($ap as $a) {
    echo "ID: {$a['id']}, Period: {$a['period']}, Date: {$a['archived_date']}, By: {$a['archived_by']}, Data: {$a['dlen']} chars\n";
}
