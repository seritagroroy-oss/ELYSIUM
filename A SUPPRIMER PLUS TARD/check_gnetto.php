<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

echo "=== Recherche de l'agent GNETTO ===\n";
echo "1. Recherche dans les archives de comp_cf66d02f:\n";
$archs = $sqlite->query("SELECT id, period, created_at, LENGTH(data) as dlen FROM archives WHERE company_id = 'comp_cf66d02f' ORDER BY period DESC");
foreach ($archs as $a) {
    echo "   - Archive {$a['id']} ({$a['period']}) - {$a['dlen']} bytes\n";
    $archData = $sqlite->query("SELECT data FROM archives WHERE id = '{$a['id']}'");
    $raw = $archData[0]['data'];
    $json = json_decode($raw, true);
    
    if (!$json) {
        $decoded = base64_decode($raw, true);
        if ($decoded) {
            $unc = @gzuncompress($decoded);
            if ($unc) $json = json_decode($unc, true);
            else $json = json_decode($decoded, true);
        }
    }
    
    if ($json) {
        // Search in salaries
        $salaries = $json['salaries'] ?? [];
        foreach ($salaries as $sal) {
            if (stripos($sal['name'] ?? '', 'GNETTO') !== false || stripos($sal['agent_name'] ?? '', 'GNETTO') !== false) {
                echo "     -> TROUVÉ dans salaries: " . ($sal['name'] ?? $sal['agent_name']) . " | Site: {$sal['site_id']} | Zone: {$sal['subsite_id']} | Période: {$a['period']}\n";
            }
        }
        // Search in sites/subsites/agents
        $sites = $json['sites'] ?? [];
        foreach ($sites as $site) {
            foreach ($site['subsites'] ?? [] as $sub) {
                foreach ($sub['agents'] ?? [] as $ag) {
                    if (stripos($ag['name'] ?? '', 'GNETTO') !== false) {
                        echo "     -> TROUVÉ dans agents: {$ag['name']} | Site: " . ($site['name'] ?? '') . " | Subsite: " . ($sub['name'] ?? '') . "\n";
                    }
                }
            }
        }
    }
}
