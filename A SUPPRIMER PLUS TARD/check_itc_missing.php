<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// 1. Check agents currently in ITC subsites for comp_cf66d02f
$itc_subsites = ['itc_as_compcf66d02f', 'itc_costume_compcf66d02f', 'itc_ots_compcf66d02f', 'itc_tenue_compcf66d02f'];
$inQ = implode(',', array_fill(0, count($itc_subsites), '?'));

$stmt = $sqlite->prepare("SELECT id, name, subsite_id, archived_period FROM agents WHERE subsite_id IN ($inQ)");
$stmt->execute($itc_subsites);
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== Agents actuellement dans les subsites ITC de comp_cf66d02f ===\n";
echo "Total: " . count($agents) . "\n\n";
foreach ($agents as $a) {
    echo "Nom: {$a['name']}, Subsite: {$a['subsite_id']}, Archivé période: " . ($a['archived_period'] ?? 'ACTIF') . "\n";
}

// 2. Check if there are agents with OLD itc subsite format
echo "\n\n=== Agents avec anciens identifiants ITC (site_itc_*) ===\n";
$stmt2 = $sqlite->prepare("SELECT id, name, subsite_id, archived_period, company_id FROM agents WHERE subsite_id LIKE 'site_itc%'");
$stmt2->execute([]);
$old = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "Total: " . count($old) . "\n";
foreach ($old as $a) {
    echo "Nom: {$a['name']}, Subsite: {$a['subsite_id']}, Company: {$a['company_id']}, Archivé: " . ($a['archived_period'] ?? 'ACTIF') . "\n";
}

// 3. Check archived agents in period 2026-08 for ITC subsites
echo "\n\n=== Agents archivés en 2026-08 pour comp_cf66d02f ===\n";
$stmt3 = $sqlite->prepare("SELECT id, name, subsite_id, archived_period FROM agents WHERE company_id = 'comp_cf66d02f' AND archived_period = '2026-08'");
$stmt3->execute([]);
$archived = $stmt3->fetchAll(PDO::FETCH_ASSOC);
echo "Total archivés en août: " . count($archived) . "\n";
foreach ($archived as $a) {
    echo "Nom: {$a['name']}, Subsite: {$a['subsite_id']}\n";
}
