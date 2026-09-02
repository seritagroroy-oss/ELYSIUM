<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Read the archive for comp_cf66d02f period 2026-07
$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'arch_1785518435'");
$data_raw = $arch[0]['data'] ?? null;

if (!$data_raw) {
    die("Archive not found or empty.\n");
}

// Try base64 decode + gzuncompress
$decoded = base64_decode($data_raw, true);
if ($decoded) {
    $uncompressed = @gzuncompress($decoded);
    if ($uncompressed) {
        $json = json_decode($uncompressed, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            // Look for site_itc in sites
            $found_itc = false;
            if (isset($json['sites'])) {
                foreach ($json['sites'] as $site) {
                    if (($site['id'] ?? '') === 'site_itc' || strpos($site['id'] ?? '', 'itc') !== false) {
                        $found_itc = true;
                        echo "Found site_itc in archive! Site ID: {$site['id']}, Name: {$site['name']}\n";
                        // List subsites and agents
                        if (isset($site['subsites'])) {
                            foreach ($site['subsites'] as $sub) {
                                echo "  Subsite: {$sub['id']} - {$sub['name']}\n";
                                if (isset($sub['agents'])) {
                                    foreach ($sub['agents'] as $agent) {
                                        echo "    Agent: {$agent['name']}\n";
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!$found_itc) {
                echo "site_itc NOT found in archive sites. Keys at top level: " . implode(', ', array_keys($json)) . "\n";
                // Try top-level site list
                if (isset($json['sites'])) {
                    echo "All site ids:\n";
                    foreach ($json['sites'] as $site) {
                        echo "  - {$site['id']} ({$site['name']})\n";
                    }
                }
            }
        } else {
            // Try as plain JSON
            $json = json_decode($data_raw, true);
            if ($json) {
                echo "Data was plain JSON, keys: " . implode(', ', array_keys($json)) . "\n";
            } else {
                echo "Cannot decode JSON. First 500 chars: " . substr($uncompressed, 0, 500) . "\n";
            }
        }
    } else {
        // Try plain gzip
        $uncompressed = @gzdecode($decoded);
        if ($uncompressed) {
            echo "gzdecode worked! First 200 chars: " . substr($uncompressed, 0, 200) . "\n";
        } else {
            // Try as raw JSON
            $json = json_decode($data_raw, true);
            if ($json) {
                echo "Data is plain JSON, keys: " . implode(', ', array_keys($json)) . "\n";
            } else {
                echo "Cannot decompress or parse. First 100 chars raw: " . substr($data_raw, 0, 100) . "\n";
            }
        }
    }
} else {
    // No base64, try raw
    $json = json_decode($data_raw, true);
    if ($json) {
        echo "Data is plain JSON, keys: " . implode(', ', array_keys($json)) . "\n";
    } else {
        $uncompressed = @gzuncompress($data_raw);
        if ($uncompressed) {
            $json = json_decode($uncompressed, true);
            echo "Data was gzcompressed raw, first keys: " . implode(', ', array_keys($json ?? [])) . "\n";
        } else {
            echo "Cannot parse data. First 100 chars: " . substr($data_raw, 0, 100) . "\n";
        }
    }
}
