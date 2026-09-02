<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_cf66d02f';
require 'backend/database.php';
require 'backend/core/functions.php';

$companyKey = 'comp_cf66d02f';
$serviceKey = null; // Comme dans l'API réelle (scope=company, sans scope_id)

// Ce que fait generateSalariesData ligne 1226
$settings_raw = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
$start_day = (int) ($settings_raw['cycle_start'] ?? 21);
$end_day = (int) ($settings_raw['cycle_end'] ?? 20);

echo "serviceKey: " . var_export($serviceKey, true) . "<br/>\n";
echo "Cycle obtenu: start_day=$start_day, end_day=$end_day<br/>\n";

$period = '2026-08';
$dates = getPeriodDates($period, $start_day, $end_day);
echo "Dates cycle: " . reset($dates) . " → " . end($dates) . " (" . count($dates) . " jours)<br/>\n";

// Calculer les jours pour Echimane avec ce cycle
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id FROM agents WHERE company_id = ? AND name LIKE '%ECHIMANE%'");
$stmt->execute([$companyKey]);
$agent = $stmt->fetch();
$agentId = $agent['id'];

$stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
$stmtAtt->execute([$agentId, $period]);
$atts = $stmtAtt->fetchAll();
$att_map = [];
foreach ($atts as $a) $att_map[$a['shift_code']][$a['date']] = $a['status'];

$assigned = 0;
$entrant = 0;
foreach ($dates as $date) {
    $sJ = $att_map['J'][$date] ?? '';
    $sN = $att_map['N'][$date] ?? '';
    $is_entrant = in_array($sJ, ['ENTRANT','REINTEGRATION']) || in_array($sN, ['ENTRANT','REINTEGRATION']);
    if (!$is_entrant) $assigned++;
    else $entrant++;
}
$real_active = $assigned;
$active_days = $assigned === 0 ? 0 : (int) round($real_active * 30 / count($dates));

echo "assigned_days: $assigned<br/>\n";
echo "entrant_days: $entrant<br/>\n";
echo "active_days: $active_days<br/>\n";
echo "prorata_base: " . round(200000 * $active_days / 30) . " CFA<br/>\n";
?>
