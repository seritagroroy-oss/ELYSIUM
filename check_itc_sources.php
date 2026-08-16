<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// 1. Tous les agents ITC dans payroll_statuses, toutes périodes confondues
$rows = $sqlite->query("SELECT DISTINCT agent_name, zone_name, period, status FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND site_id = 'site_itc' ORDER BY period DESC, zone_name, agent_name");
echo "=== AGENTS ITC dans payroll_statuses (TOUTES PERIODES) ===\n";
echo "Total entrées: " . count($rows) . "\n\n";
foreach ($rows as $r) {
    echo "Période: {$r['period']} | Zone: {$r['zone_name']} | Agent: {$r['agent_name']} | Statut: {$r['status']}\n";
}

// 2. Chercher "ITC" dans l'archive salaires juillet
$arch = $sqlite->query("SELECT data FROM archives WHERE id = 'arch_1785518435'");
$raw = $arch[0]['data'] ?? '';
$json = json_decode($raw, true);
// Search for ITC string in zone names
echo "\n\n=== Recherche 'ITC' dans archive salaires juillet (zones) ===\n";
foreach ($json['sites'] as $site) {
    foreach ($site['subsites'] ?? [] as $sub) {
        if (strpos($sub['name'], 'ITC') !== false || strpos($sub['id'], 'itc') !== false) {
            echo "Site: {$site['name']}, Subsite: {$sub['name']} ({$sub['id']})\n";
            foreach ($sub['agents'] ?? [] as $ag) {
                echo "  - {$ag['name']}\n";
            }
        }
        // Also check agent names for ITC reference
        foreach ($sub['agents'] ?? [] as $ag) {
            if (isset($ag['zones']) && strpos(json_encode($ag['zones']), 'ITC') !== false) {
                echo "Agent with ITC zone ref: {$ag['name']} in {$sub['name']}\n";
            }
        }
    }
}

// 3. Chercher les agents dans l'archive dont la zone ou le site contient ITC
echo "\n\n=== Structure d'un agent dans l'archive (exemple) ===\n";
$first = $json['sites'][0]['subsites'][0]['agents'][0] ?? null;
if ($first) echo "Clés d'un agent: " . implode(', ', array_keys($first)) . "\n";
