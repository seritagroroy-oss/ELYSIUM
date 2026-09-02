<?php
require __DIR__ . '/backend/database.php';
require __DIR__ . '/backend/core/functions.php';

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data FROM archives WHERE id NOT LIKE 'payroll_%' ORDER BY rowid DESC LIMIT 1");
$stmt->execute();
$res = $stmt->fetch();
if (!$res) {
    echo "No archive found";
    exit;
}

$data = json_decode($res['data'], true);

$site = $data['sites'][0];
$sub = $site['subsites'] ? $site['subsites'][0] : null;
$agent = $sub && $sub['agents'] ? $sub['agents'][0] : null;

echo "Agent profile_data type: " . gettype($agent['profile_data'] ?? null) . "\n";
if (is_array($agent['profile_data'] ?? null)) {
    var_dump($agent['profile_data']);
} else {
    echo $agent['profile_data'] ?? 'NOT FOUND';
}

// Let's specifically look for KOFFI SOLANGE
$koffiFound = false;
foreach ($data['sites'] as $s) {
    if (!empty($s['subsites'])) {
        foreach ($s['subsites'] as $su) {
            if (!empty($su['agents'])) {
                foreach ($su['agents'] as $ag) {
                    if (strpos(strtoupper($ag['name']), 'KOFFI SOLANGE') !== false) {
                        echo "\n--- KOFFI SOLANGE profile_data ---\n";
                        echo "Type: " . gettype($ag['profile_data'] ?? null) . "\n";
                        var_dump($ag['profile_data'] ?? 'NOT FOUND');
                        $koffiFound = true;
                    }
                }
            }
        }
    }
}
if (!$koffiFound) {
    echo "\nKOFFI SOLANGE NOT FOUND in the latest archive.\n";
}
