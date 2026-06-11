<?php
require 'backend/database.php';
$sqlite = getDb();

$service_id  = 'svc_1780068297_395';
$company_id  = 'comp_480ef24c';
$period      = '2026-06';

// ── Supprimer les données test existantes ────────────────────────────
$sqlite->exec("DELETE FROM attendance WHERE service_id = '$service_id' AND period = '$period'");
$sqlite->exec("DELETE FROM agents WHERE service_id = '$service_id' AND id LIKE 'test_%'");
$sqlite->exec("DELETE FROM subsites WHERE id LIKE 'test_sub_%'");
$sqlite->exec("DELETE FROM sites WHERE service_id = '$service_id' AND id LIKE 'test_site_%'");

// ── SITE 1 : ADDOHA ────────────────────────────────────────────────
$sqlite->exec("INSERT OR IGNORE INTO sites (id, name, service_id, company_id) VALUES ('test_site_1', 'ADDOHA', '$service_id', '$company_id')");
$sqlite->exec("INSERT OR IGNORE INTO subsites (id, name, site_id) VALUES ('test_sub_1', 'Zone A', 'test_site_1')");
$sqlite->exec("INSERT OR IGNORE INTO subsites (id, name, site_id) VALUES ('test_sub_2', 'Zone B', 'test_site_1')");

// ── SITE 2 : LDF ──────────────────────────────────────────────────
$sqlite->exec("INSERT OR IGNORE INTO sites (id, name, service_id, company_id) VALUES ('test_site_2', 'LDF', '$service_id', '$company_id')");
$sqlite->exec("INSERT OR IGNORE INTO subsites (id, name, site_id) VALUES ('test_sub_3', 'Entrée principale', 'test_site_2')");

// ── AGENTS ────────────────────────────────────────────────────────
$agents = [
    ['test_ag_1', 'KONAN ANGE',      'test_sub_1', 'AS',  'Jour'],
    ['test_ag_2', 'BAMBA MOUSSA',    'test_sub_1', 'CP',  'Nuit'],
    ['test_ag_3', 'KOFFI AMENAN',    'test_sub_2', 'GA',  '24h'],
    ['test_ag_4', 'COULIBALY DRISSA','test_sub_3', 'AS',  'Jour'],
    ['test_ag_5', 'DIALLO FATOUMATA','test_sub_3', 'MC',  'Nuit'],
];
foreach ($agents as [$id, $name, $sub, $func, $shift]) {
    $sqlite->exec("INSERT OR IGNORE INTO agents (id, name, function, shift_type, subsite_id, service_id, company_id) VALUES ('$id', '$name', '$func', '$shift', '$sub', '$service_id', '$company_id')");
}

// ── ATTENDANCE pour la période 2026-06 (cycle 21 mai → 20 juin) ───
// Dates du cycle
$dates = [];
$start = new DateTime('2026-05-21');
$end   = new DateTime('2026-06-20');
for ($d = clone $start; $d <= $end; $d->modify('+1 day')) {
    $dates[] = $d->format('Y-m-d');
}

$nb_dates = count($dates); // 31 jours

// Remplir les pointages (présences + quelques absences)
foreach ($agents as $idx => [$ag_id, , , , $shift]) {
    foreach ($dates as $i => $date) {
        // Créer 2-3 absences par agent
        $status = 'A';
        if (!in_array($i, [$idx * 3, $idx * 3 + 7])) {
            $status = '1'; // présent
        }

        $shifts_to_fill = match($shift) {
            '24h'  => ['J', 'N'],
            'Nuit' => ['N'],
            default => ['J'],
        };

        foreach ($shifts_to_fill as $sc) {
            $sqlite->exec("INSERT OR IGNORE INTO attendance (agent_id, date, shift_code, status, service_id, company_id, period)
                VALUES ('$ag_id', '$date', '$sc', '$status', '$service_id', '$company_id', '$period')");
        }
    }
}

echo "✅ Données de test injectées avec succès !\n";
echo "   - 2 sites : ADDOHA, LDF\n";
echo "   - 3 zones : Zone A, Zone B, Entrée principale\n";
echo "   - 5 agents avec pointage sur la période $period\n";
echo "\nVous pouvez maintenant tester le flux Publier → Paie → Archives.\n";
