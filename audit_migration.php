<?php
// Audit complet de la migration JSON -> SQLite

require 'backend/database.php';
$sqlite = getDb();

echo "============================================================\n";
echo "AUDIT DE MIGRATION JSON -> SQLite\n";
echo "============================================================\n\n";

// 1. Trouver le fichier JSON source
$json_files = ['pointage_db.json', 'data.json', 'db.json', 'backup.json', 'pointage_db_backup.json'];
$json = null;
$json_file = null;
foreach ($json_files as $f) {
    if (file_exists($f)) {
        $content = file_get_contents($f);
        $decoded = json_decode($content, true);
        if ($decoded) {
            $json = $decoded;
            $json_file = $f;
            break;
        }
    }
}

if (!$json) {
    echo "❌ Aucun fichier JSON source trouvé.\n";
    echo "Vérification SQLite seulement...\n\n";
} else {
    echo "✅ Fichier JSON trouvé: $json_file\n";
    echo "Clés racine: " . implode(', ', array_keys($json)) . "\n\n";
}

// 2. Audit des tables SQLite
echo "=== TABLES SQLITE ===\n";
$tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
foreach ($tables as $t) {
    $count = $sqlite->query("SELECT COUNT(*) as c FROM {$t['name']}");
    echo "  {$t['name']}: " . ($count[0]['c'] ?? 0) . " lignes\n";
}

// 3. Vérification isolation (service_id manquants)
echo "\n=== CHAMPS service_id MANQUANTS ===\n";

$checks = [
    'sites'     => "SELECT COUNT(*) as c FROM sites WHERE service_id IS NULL OR service_id = ''",
    'agents'    => "SELECT COUNT(*) as c FROM agents WHERE service_id IS NULL OR service_id = ''",
    'attendance'=> "SELECT COUNT(*) as c FROM attendance WHERE service_id IS NULL OR service_id = ''",
    'subsites'  => null, // pas de service_id direct
];

foreach ($checks as $table => $sql) {
    if (!$sql) { echo "  $table: pas de service_id (normal)\n"; continue; }
    $r = $sqlite->query($sql);
    $count = $r[0]['c'] ?? 0;
    $icon = $count > 0 ? '❌' : '✅';
    echo "  $icon $table: $count enregistrements sans service_id\n";
}

// 4. Vérification isolation company_id
echo "\n=== CHAMPS company_id MANQUANTS ===\n";
$checks2 = ['sites', 'agents', 'attendance', 'services', 'users'];
foreach ($checks2 as $table) {
    $cols = $sqlite->query("PRAGMA table_info($table)");
    $has_company = false;
    foreach ($cols as $c) {
        if ($c['name'] === 'company_id') { $has_company = true; break; }
    }
    if (!$has_company) { echo "  $table: pas de company_id (vérifier)\n"; continue; }
    $r = $sqlite->query("SELECT COUNT(*) as c FROM $table WHERE company_id IS NULL OR company_id = ''");
    $count = $r[0]['c'] ?? 0;
    $icon = $count > 0 ? '⚠️' : '✅';
    echo "  $icon $table: $count enregistrements sans company_id\n";
}

// 5. Vérification des agents orphelins (subsite_id invalide)
echo "\n=== AGENTS ORPHELINS (subsite_id invalide) ===\n";
$orphans = $sqlite->query("
    SELECT COUNT(*) as c FROM agents 
    WHERE subsite_id NOT IN (SELECT id FROM subsites)
    AND subsite_id IS NOT NULL 
    AND subsite_id != ''
");
echo "  Agents avec subsite_id inexistant: " . ($orphans[0]['c'] ?? 0) . "\n";

// 6. Vérification sites sans subsites
echo "\n=== SITES SANS SUBSITES ===\n";
$no_subsites = $sqlite->query("
    SELECT s.id, s.name, s.service_id FROM sites s 
    LEFT JOIN subsites sub ON sub.site_id = s.id 
    WHERE sub.id IS NULL
    AND s.id NOT IN ('site_extras', 'site_releves', 'site_administration')
");
foreach ($no_subsites as $s) {
    echo "  ❌ Site '{$s['name']}' ({$s['id']}) service={$s['service_id']} -> aucun subsite\n";
}
if (empty($no_subsites)) echo "  ✅ Tous les sites ont au moins un subsite\n";

// 7. Vérification pointages sans agent valide
echo "\n=== POINTAGES ORPHELINS (agent inexistant) ===\n";
$att_orphans = $sqlite->query("
    SELECT COUNT(*) as c FROM attendance 
    WHERE agent_id NOT IN (SELECT id FROM agents)
");
echo "  Pointages sans agent valide: " . ($att_orphans[0]['c'] ?? 0) . "\n";

// 8. Vérification des subsites sans agents
echo "\n=== SUBSITES SANS AGENTS ===\n";
$empty_subs = $sqlite->query("
    SELECT sub.id, sub.name, sub.site_id FROM subsites sub
    LEFT JOIN agents a ON a.subsite_id = sub.id
    WHERE a.id IS NULL
    AND sub.id NOT IN ('site_extras_1', 'site_releves_1', 'site_admin_1')
");
echo "  " . count($empty_subs) . " subsites sans agents (vides)\n";

// 9. Résumé des services et leur contenu
echo "\n=== RÉSUMÉ PAR SERVICE ===\n";
$services = $sqlite->query("SELECT id, name, company_id FROM services ORDER BY company_id, name");
foreach ($services as $svc) {
    $sites_count = $sqlite->query("SELECT COUNT(*) as c FROM sites WHERE service_id = '{$svc['id']}'");
    $agents_count = $sqlite->query("SELECT COUNT(*) as c FROM agents WHERE service_id = '{$svc['id']}'");
    $att_count = $sqlite->query("SELECT COUNT(*) as c FROM attendance WHERE service_id = '{$svc['id']}'");
    echo "  [{$svc['company_id']}] {$svc['name']} ({$svc['id']})\n";
    echo "    Sites: " . ($sites_count[0]['c'] ?? 0) . 
         " | Agents: " . ($agents_count[0]['c'] ?? 0) . 
         " | Pointages: " . ($att_count[0]['c'] ?? 0) . "\n";
}

echo "\n============================================================\n";
echo "FIN DE L'AUDIT\n";
echo "============================================================\n";
