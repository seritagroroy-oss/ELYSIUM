<?php
require 'c:\laragon\www\pontage\backend\database.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

// Fetch OSLO
$stmt = $pdo->prepare("SELECT * FROM agents WHERE name LIKE '%OSLO%'");
$stmt->execute();
$oslo = $stmt->fetch(PDO::FETCH_ASSOC);

$period = '2043-02';

$stmtOrigDays = $pdo->prepare("SELECT date, status FROM attendance WHERE agent_id = ? AND period = ?");
$stmtOrigDays->execute([$oslo['id'], $period]);
$origAttRows = $stmtOrigDays->fetchAll(PDO::FETCH_ASSOC);

$origin_total_A = 0;
$origin_total_MAP = 0;
$origin_total_P = 0;
$origin_total_Entrant = 0;
$origin_total_Exit = 0;
$origin_mutation_days = 0;

$strongest_status_by_date = [];
foreach ($origAttRows as $orig_att) {
    $st = $orig_att['status'] ?? '';
    $dt = $orig_att['date'] ?? '';
    $isMut = (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0 || strpos($st, 'M_1|') === 0);
    
    if (!isset($strongest_status_by_date[$dt])) {
        $strongest_status_by_date[$dt] = $st;
    } else {
        $currSt = $strongest_status_by_date[$dt];
        $currIsMut = (strpos($currSt, 'M|') === 0 || strpos($currSt, 'PM|') === 0 || strpos($currSt, 'M_1|') === 0);
        if ($currIsMut && !$isMut && $st !== '') {
            $strongest_status_by_date[$dt] = $st;
        }
    }
}

foreach ($strongest_status_by_date as $dt => $st) {
    if (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0 || strpos($st, 'M_1|') === 0) {
        $origin_mutation_days++;
    } elseif (in_array($st, ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || strpos($st, 'SORTANT_') === 0) {
        $origin_total_Exit++;
    } elseif ($st === 'ENTRANT' || $st === 'NON_PRESENT') {
        $origin_total_Entrant++;
    } elseif ($st === 'A' || $st === 'M') {
        $origin_total_A++;
    } elseif ($st === 'MAP') {
        $origin_total_MAP++;
    } elseif ($st === 'P') {
        $origin_total_P++;
    }
}

$cycleDays = count($strongest_status_by_date);
$adj_mutation = $origin_mutation_days;
if ($cycleDays > 30 && $adj_mutation > 0) {
    $surplus = $cycleDays - 30;
    $adj_mutation = max(0, $adj_mutation - min($adj_mutation, $surplus));
}
$origin_base = max(0, 30 - $origin_total_A - $origin_total_MAP - $adj_mutation - $origin_total_P);

echo "A: $origin_total_A\n";
echo "M: $origin_mutation_days\n";
echo "origin_base: $origin_base\n";
echo "origin_absences: " . ($origin_total_A + $origin_total_Exit) . "\n";
?>
