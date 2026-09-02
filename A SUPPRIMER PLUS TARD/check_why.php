<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$archive_id = 106;
$archData = $sqlite->query("SELECT data FROM archives_pointage WHERE id = $archive_id");
$raw = $archData[0]['data'];
$json = null;
$decoded = base64_decode($raw, true);
if ($decoded) {
    $unc = @gzuncompress($decoded) ?: @gzdecode($decoded);
    $json = json_decode($unc ?: $decoded, true);
} else {
    $unc = @gzuncompress($raw);
    $json = json_decode($unc ?: $raw, true);
}

foreach ($json['sites'] ?? [] as $site) {
    foreach ($site['subsites'] ?? [] as $sub) {
        foreach ($sub['agents'] ?? [] as $ag) {
            if (stripos($ag['name'] ?? '', 'GNETTO') !== false) {
                echo "Trouvé: {$ag['name']} - ID: {$ag['id']}\n";
                $curr = $sqlite->query("SELECT * FROM agents WHERE id = '{$ag['id']}'");
                if (empty($curr)) {
                    echo "-> MISSING in DB\n";
                    echo "Subsite: {$sub['id']}, Service: svc_52f7a282\n";
                } else {
                    echo "-> EXISTS in DB: archived_period = {$curr[0]['archived_period']}\n";
                }
            }
        }
    }
}
