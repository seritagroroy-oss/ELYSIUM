<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$rows = $sqlite->query("SELECT agent_name, zone_name, status FROM payroll_statuses WHERE company_id = 'comp_cf66d02f' AND period = '2026-07' AND site_id = 'site_itc' ORDER BY zone_name, agent_name");

echo "=== TOUS LES AGENTS ITC - ETAT DE PAIE JUILLET 2026 ===\n";
echo "Total: " . count($rows) . "\n\n";
foreach ($rows as $r) {
    echo "Agent: {$r['agent_name']}\n  Zone: {$r['zone_name']}\n  Statut: {$r['status']}\n\n";
}
