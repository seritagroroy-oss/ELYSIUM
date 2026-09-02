<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Look for all payroll_statuses for comp_cf66d02f for July 2026 - ITC site
// The comptable may have saved payroll data for ALL zones
$rows = $sqlite->query("
    SELECT agent_name, zone_name, status, period 
    FROM payroll_statuses 
    WHERE company_id = 'comp_cf66d02f' 
    AND site_id = 'site_itc' 
    ORDER BY period DESC, zone_name, agent_name
");

echo "=== Tous les agents ITC dans payroll_statuses (état de paie sauvegardé) ===\n";
foreach ($rows as $r) {
    echo "Période: {$r['period']} | Zone: {$r['zone_name']} | Agent: {$r['agent_name']} | Statut: {$r['status']}\n";
}

// Also check if there's a published salaries archive (archives table with ITC data)
// Look in the service_data or any other table
echo "\n\n=== Recherche dans toutes les tables liées aux salaires ===\n";

// Check salary_config
$sc = $sqlite->query("SELECT * FROM salary_config WHERE company_id = 'comp_cf66d02f' LIMIT 5");
echo "salary_config count: " . count($sc) . "\n";

// Look for any JSON data storing ITC agents
// Check if there's anything in the archives table for period=blank (the second archive)
$arch2 = $sqlite->query("SELECT id, period, LENGTH(data) as dlen, created_at FROM archives WHERE company_id = 'comp_cf66d02f'");
echo "\nAll archives for comp_cf66d02f:\n";
foreach ($arch2 as $a) {
    echo "ID: {$a['id']}, Period: '{$a['period']}', Data len: {$a['dlen']}, Created: {$a['created_at']}\n";
}

// Check the archive with empty period
$arch_blank = $sqlite->query("SELECT data FROM archives WHERE company_id = 'comp_cf66d02f' AND (period = '' OR period IS NULL)");
if (!empty($arch_blank)) {
    $raw = $arch_blank[0]['data'];
    $decoded = base64_decode($raw, true);
    if ($decoded) {
        $unc = @gzuncompress($decoded);
        if ($unc) {
            $json2 = json_decode($unc, true);
            echo "\nBlank-period archive keys: " . implode(', ', array_keys($json2 ?? [])) . "\n";
            if (isset($json2['sites'])) {
                foreach ($json2['sites'] as $site) {
                    if (strpos($site['id'] ?? '', 'itc') !== false) {
                        echo "FOUND ITC in blank-period archive! Site: {$site['name']}\n";
                        foreach ($site['subsites'] ?? [] as $sub) {
                            echo "  Zone: {$sub['name']} (" . count($sub['agents'] ?? []) . " agents)\n";
                            foreach ($sub['agents'] ?? [] as $ag) echo "    - {$ag['name']}\n";
                        }
                    }
                }
            }
        } else {
            $json2 = json_decode($decoded, true);
            if ($json2) {
                echo "\nBlank-period archive (b64+json) keys: " . implode(', ', array_keys($json2)) . "\n";
                if (isset($json2['sites'])) {
                    foreach ($json2['sites'] as $site) {
                        if (strpos($site['id'] ?? '', 'itc') !== false) {
                            echo "FOUND ITC in blank-period archive!\n";
                        }
                    }
                }
            }
        }
    } else {
        $json2 = json_decode($raw, true);
        if ($json2) {
            echo "\nBlank-period archive (plain JSON) keys: " . implode(', ', array_keys($json2)) . "\n";
            if (isset($json2['sites'])) {
                foreach ($json2['sites'] as $site) {
                    if (strpos($site['id'] ?? '', 'itc') !== false) {
                        echo "FOUND ITC in blank-period archive!\n";
                        foreach ($site['subsites'] ?? [] as $sub) {
                            echo "  Zone: {$sub['name']} (" . count($sub['agents'] ?? []) . " agents)\n";
                            foreach ($sub['agents'] ?? [] as $ag) echo "    - {$ag['name']}\n";
                        }
                    }
                }
            }
        }
    }
}
