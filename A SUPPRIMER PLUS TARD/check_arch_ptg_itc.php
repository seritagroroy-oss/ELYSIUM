<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Check archives_pointage for July 2026 - this is the pointage archive
$ap = $sqlite->query("SELECT data FROM archives_pointage WHERE id = 106");
$raw = $ap[0]['data'] ?? '';

echo "Data length: " . strlen($raw) . "\n\n";

// Try to decode
$json = null;
$decoded = base64_decode($raw, true);
if ($decoded) {
    $unc = @gzuncompress($decoded);
    if ($unc) {
        $json = json_decode($unc, true);
        echo "Decoded via base64+gzuncompress\n";
    } else {
        $unc2 = @gzdecode($decoded);
        if ($unc2) { $json = json_decode($unc2, true); echo "Decoded via base64+gzdecode\n"; }
        else { $json = json_decode($decoded, true); if ($json) echo "Decoded via base64 plain JSON\n"; }
    }
} else {
    $unc = @gzuncompress($raw);
    if ($unc) { $json = json_decode($unc, true); echo "Decoded via gzuncompress\n"; }
    else { $json = json_decode($raw, true); if ($json) echo "Plain JSON\n"; }
}

if (!$json) { echo "CANNOT DECODE DATA\n"; exit; }

echo "Top keys: " . implode(', ', array_keys($json)) . "\n\n";

// Look for ITC
$raw_decoded = is_string($unc ?? null) ? $unc : json_encode($json);
if (strpos($raw_decoded ?? $raw, 'itc') !== false || strpos($raw_decoded ?? $raw, 'ITC') !== false) {
    echo "ITC FOUND in archives_pointage data!\n";
} else {
    echo "ITC NOT found in archives_pointage data\n";
}

// Check structure
if (isset($json['sites'])) {
    echo "Sites count: " . count($json['sites']) . "\n";
    foreach ($json['sites'] as $site) {
        if (strpos($site['id'] ?? '', 'itc') !== false || strpos(strtolower($site['name'] ?? ''), 'itc') !== false) {
            echo "FOUND ITC site: {$site['id']} - {$site['name']}\n";
            foreach ($site['subsites'] ?? [] as $sub) {
                echo "  Subsite: {$sub['name']} (" . count($sub['agents'] ?? []) . " agents)\n";
                foreach ($sub['agents'] ?? [] as $ag) {
                    echo "    - {$ag['name']}\n";
                }
            }
        }
    }
}
