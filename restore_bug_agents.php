<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

echo "=== Restauration des agents disparus aujourd'hui (Bug Salaries) ===\n";

$archive_id = 106;
$period = '2026-08';

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

if (!$json) {
    die("Impossible de lire l'archive 106.\n");
}

$company_id = 'comp_cf66d02f';
// Get default service for company
$serv = $sqlite->query("SELECT id FROM services WHERE company_id = '$company_id' LIMIT 1");
$service_id = $serv[0]['id'] ?? 'svc_52f7a282';
$created_at = date('Y-m-d H:i:s');

$restored = 0;
$stmtCheckAgent = $sqlite->prepare("SELECT id FROM agents WHERE id = ?");
$stmtInsertAgent = $sqlite->prepare("
    INSERT INTO agents (id, name, `function`, shift_type, subsite_id, service_id, company_id, archived_period, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
");
$stmtReactivate = $sqlite->prepare("UPDATE agents SET archived_period = NULL, subsite_id = ? WHERE id = ?");

// Parcourir les sites et agents de l'archive
$sites = $json['sites'] ?? [];
foreach ($sites as $site) {
    foreach ($site['subsites'] ?? [] as $sub) {
        $subsite_id = $sub['id'];
        foreach ($sub['agents'] ?? [] as $ag) {
            $agent_id = $ag['id'];
            $agent_name = $ag['name'];
            
            // Only restore if they are missing or archived in current DB
            $curr = $sqlite->query("SELECT archived_period, subsite_id FROM agents WHERE id = '$agent_id'");
            if (empty($curr)) {
                // Completely missing -> Insert
                $stmtInsertAgent->execute([
                    $agent_id, $agent_name, $ag['function'], $ag['shift_type'], 
                    $subsite_id, $service_id, $company_id, $created_at
                ]);
                echo "✅ Recréé : $agent_name ({$site['name']} > {$sub['name']})\n";
                $restored++;
            } else if (!empty($curr[0]['archived_period'])) {
                // Archived -> Reactivate
                $stmtReactivate->execute([$subsite_id, $agent_id]);
                echo "✅ Réactivé : $agent_name ({$site['name']} > {$sub['name']})\n";
                $restored++;
            }
        }
    }
}

echo "\nTotal restauré : $restored agent(s)\n";
