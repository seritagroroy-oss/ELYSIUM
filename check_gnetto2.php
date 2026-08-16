<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

echo "=== Enquête sur GNETTO et progression d'Août ===\n";

// 1. Chercher GNETTO dans agents (même archivés)
$agents = $sqlite->query("SELECT * FROM agents WHERE name LIKE '%GNETTO%'");
echo "1. Table 'agents': " . count($agents) . " résultat(s)\n";
foreach ($agents as $a) {
    echo "   - ID: {$a['id']} | Nom: {$a['name']} | Subsite: {$a['subsite_id']} | Archived: {$a['archived_period']} | Exit: {$a['exit_date']}\n";
}

// 2. Chercher dans archives_pointage (les archives du module de pointage)
echo "\n2. Table 'archives_pointage' pour comp_cf66d02f (récentes):\n";
$arch_ptg = $sqlite->query("SELECT id, period, archived_date, archived_by, LENGTH(data) as dlen FROM archives_pointage WHERE company_id = 'comp_cf66d02f' ORDER BY archived_date DESC LIMIT 5");
foreach ($arch_ptg as $ap) {
    echo "   - ID: {$ap['id']} | Période: {$ap['period']} | Date: {$ap['archived_date']} | Par: {$ap['archived_by']} | Size: {$ap['dlen']} bytes\n";
    $apData = $sqlite->query("SELECT data FROM archives_pointage WHERE id = {$ap['id']}");
    $raw = $apData[0]['data'];
    $json = null;
    $decoded = base64_decode($raw, true);
    if ($decoded) {
        $unc = @gzuncompress($decoded) ?: @gzdecode($decoded);
        $json = json_decode($unc ?: $decoded, true);
    } else {
        $unc = @gzuncompress($raw);
        $json = json_decode($unc ?: $raw, true);
    }
    
    if ($json) {
        $found = false;
        if (isset($json['sites'])) {
            foreach ($json['sites'] as $site) {
                foreach ($site['subsites'] ?? [] as $sub) {
                    foreach ($sub['agents'] ?? [] as $ag) {
                        if (stripos($ag['name'] ?? '', 'GNETTO') !== false) {
                            echo "     -> TROUVÉ dans l'archive {$ap['id']}: {$ag['name']} | Site: {$site['name']} | Subsite: {$sub['name']}\n";
                            $found = true;
                        }
                    }
                }
            }
        }
        if (!$found) echo "     (GNETTO non trouvé dans cette archive)\n";
    }
}

// 3. Chercher dans sys_logs (s'il existe)
echo "\n3. Table 'sys_logs' pour GNETTO:\n";
try {
    $logs = $sqlite->query("SELECT created_at, action, details FROM sys_logs WHERE details LIKE '%GNETTO%' ORDER BY created_at DESC LIMIT 5");
    if (empty($logs)) echo "   Aucun log trouvé pour GNETTO.\n";
    foreach ($logs as $l) {
        echo "   - [{$l['created_at']}] {$l['action']} : {$l['details']}\n";
    }
} catch (Exception $e) {
    echo "   Table sys_logs non disponible.\n";
}

// 4. Checking the progression tracker data.
// Is there a table tracking the calendar progress?
echo "\n4. Recherche de données de progression:\n";
try {
    $prog = $sqlite->query("SELECT * FROM service_data WHERE company_id = 'comp_cf66d02f' AND (data_key LIKE '%progress%' OR data_key LIKE '%suivi%')");
    echo "   Trouvé " . count($prog) . " entrée(s) de progression dans service_data.\n";
    foreach ($prog as $p) {
        echo "   - Clé: {$p['data_key']} | MàJ: {$p['updated_at']}\n";
    }
} catch (Exception $e) {}

// Let's also check localStorage via script? We can't access user's localStorage from PHP.
// But we can check if there's any API endpoint that saves it.
