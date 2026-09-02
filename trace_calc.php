<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['role'] = 'admin';

require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

// Charger les dates
$settings = getServiceDataSql($companyKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
$start_day = $settings['cycle_start'] ?? 21;
$end_day = $settings['cycle_end'] ?? 20;
$dates = getPeriodDates($period, $start_day, $end_day);

echo "Cycle: " . reset($dates) . " → " . end($dates) . " (" . count($dates) . " jours)<br/>\n";

// Récupérer agent
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE company_id = ? AND name LIKE '%ECHIMANE%'");
$stmt->execute([$companyKey]);
$agent = $stmt->fetch();
$agentId = $agent['id'];
echo "Agent: " . $agent['name'] . "<br/>\n";

// Charger les présences
$stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
$stmtAtt->execute([$agentId, $period]);
$atts = $stmtAtt->fetchAll();
$att_map = ['J' => [], 'N' => []];
foreach ($atts as $a) {
    $att_map[$a['shift_code']][$a['date']] = $a['status'];
}

// Settings paie
$payroll_settings = getServiceDataSql('company::' . $companyKey, 'payroll_settings', []);
$include_m = $payroll_settings['count_hours_maladie'] ?? false;

// Simuler la logique de generateSalariesData pour cet agent
$assigned_days = 0;
$real_active = 0;
$entrant_count = 0;
$absences = 0;
$mutated_away_days = 0;
$full_month_assigned_days = count($dates);

foreach ($dates as $date) {
    $sJ = $att_map['J'][$date] ?? '';
    $sN = $att_map['N'][$date] ?? '';

    $is_entrant_j = in_array($sJ, ['ENTRANT', 'REINTEGRATION']);
    $is_entrant_n = in_array($sN, ['ENTRANT', 'REINTEGRATION']);
    $is_entrant = $is_entrant_j || $is_entrant_n;
    $is_np = ($sJ === 'NON_PRESENT' || $sN === 'NON_PRESENT');

    if (!$is_entrant && !$is_np) {
        $assigned_days++;
        
        $is_mutated_j = (strpos($sJ ?? '', 'M|') === 0 || strpos($sJ ?? '', 'PM|') === 0);
        $is_mutated_n = (strpos($sN ?? '', 'M|') === 0 || strpos($sN ?? '', 'PM|') === 0);
        if ($is_mutated_j || $is_mutated_n) {
            $mutated_away_days++;
        }
    }

    if ($is_entrant_j) $entrant_count++;
    if ($is_entrant_n) $entrant_count++;

    if ($sJ === 'A' || ($sJ === 'M' && !$include_m)) $absences++;
    if ($sN === 'A' || ($sN === 'M' && !$include_m)) $absences++;
}

$real_active = $assigned_days - $mutated_away_days;
$divisor = 30;

echo "<br/><strong>Compteurs calculés:</strong><br/>\n";
echo "full_month_assigned_days: $full_month_assigned_days<br/>\n";
echo "assigned_days: $assigned_days<br/>\n";
echo "mutated_away_days: $mutated_away_days<br/>\n";
echo "real_active: $real_active<br/>\n";
echo "entrant_count: $entrant_count<br/>\n";
echo "absences: $absences<br/>\n";

$active_days = $assigned_days === 0 ? 0 : (int) round($real_active * $divisor / $full_month_assigned_days);
echo "<br/><strong>active_days (formule else): round($real_active * $divisor / $full_month_assigned_days) = $active_days</strong><br/>\n";

$base = 200000;
$prorata_base = (int) round($base * ($active_days / $divisor));
echo "prorata_base: $prorata_base CFA<br/>\n";
echo "Attendu: 200000 * 4/30 = " . round(200000 * 4/30) . " CFA<br/>\n";
?>
