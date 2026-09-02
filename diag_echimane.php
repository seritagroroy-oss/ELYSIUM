<?php
session_start();
$_SESSION['user_id'] = 1;
require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

$stmt = $sqlite->prepare("SELECT id, name FROM agents WHERE company_id = ? AND name LIKE '%ECHIMANE%'");
$stmt->execute([$companyKey]);
$agent = $stmt->fetch();
echo "Agent: " . $agent['name'] . " (ID: " . $agent['id'] . ")<br/>\n";

$agentId = $agent['id'];
$dates = getPeriodDates($period, 21, 20);
echo "Cycle: " . reset($dates) . " → " . end($dates) . " (" . count($dates) . " jours)<br/>\n";

// Charger les présences depuis la vraie table
$stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
$stmtAtt->execute([$agentId, $period]);
$atts = $stmtAtt->fetchAll();

$att_map = [];
foreach ($atts as $a) {
    $att_map[$a['shift_code']][$a['date']] = $a['status'];
}

$present_ui1 = 0;  // compteur ✓ UI1
$assigned_pay = 0; // compteur jours paie
$entrant_days = 0;
$absent_days = 0;
$empty_days = 0;
$other_days = [];

echo "<br/><table border='1' cellpadding='3' style='font-size:12px'>";
echo "<tr><th>Date</th><th>J</th><th>N</th><th>UI1(✓)</th><th>Paie</th><th>Note</th></tr>\n";

foreach ($dates as $date) {
    $sJ = $att_map['J'][$date] ?? '';
    $sN = $att_map['N'][$date] ?? '';

    $is_entrant = in_array($sJ, ['ENTRANT', 'REINTEGRATION']) || in_array($sN, ['ENTRANT', 'REINTEGRATION']);
    $is_worked = ($sJ === '1' || $sJ === 'COST' || strpos($sJ ?? '', 'F_') === 0 || $sN === '1' || $sN === 'COST' || strpos($sN ?? '', 'F_') === 0);
    $is_absent = ($sJ === 'A' || $sN === 'A');
    $is_empty = ($sJ === '' && $sN === '');

    $ui1 = '-';
    $paie_col = '-';
    $note = '';

    if ($is_entrant) {
        $entrant_days++;
        $note = 'ENTRANT - exclus partout';
    } elseif ($is_worked) {
        $present_ui1++;
        $assigned_pay++;
        $ui1 = '✓';
        $paie_col = '✓';
        $note = 'PRÉSENT';
    } elseif ($is_absent) {
        $assigned_pay++;
        $absent_days++;
        $paie_col = '✓';
        $note = '⚠️ ABSENT - compté en paie SEULEMENT';
    } elseif ($is_empty) {
        $assigned_pay++;
        $empty_days++;
        $paie_col = '✓';
        $note = '⚠️ VIDE - compté en paie SEULEMENT';
    } else {
        $assigned_pay++;
        $other_days[] = $date . ':' . $sJ . '/' . $sN;
        $paie_col = '✓';
        $note = 'Autre: J=' . $sJ . ' N=' . $sN;
    }

    $bg = $is_entrant ? '#333' : ($is_worked ? '#1a3' : ($is_absent ? '#a33' : '#553'));
    echo "<tr style='background:$bg'><td>$date</td><td>" . htmlspecialchars($sJ) . "</td><td>" . htmlspecialchars($sN) . "</td><td>$ui1</td><td>$paie_col</td><td>$note</td></tr>\n";
}

echo "</table>\n";
echo "<br/><strong>RÉSUMÉ:</strong><br/>\n";
echo "Interface 1 (présents réels ✓): <b>$present_ui1</b><br/>\n";
echo "Interface 2 (jours assignés en paie): <b>$assigned_pay</b><br/>\n";
echo "Jours ENTRANT (exclus): $entrant_days<br/>\n";
echo "Jours ABSENTS (A): $absent_days<br/>\n";
echo "Jours VIDES (aucun statut): $empty_days<br/>\n";
echo "Autres statuts: " . implode(', ', $other_days) . "<br/>\n";
?>
