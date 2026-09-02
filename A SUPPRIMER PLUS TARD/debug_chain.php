<?php
require 'c:\laragon\www\pontage\backend\database.php';
$pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');

$period = '2043-02';
$current_clone_id = 'ag_1786407615_ag_1786407573_6a7a6a4eef230'; // The MICAO clone

// 1. Find root agent ID
$parts = explode('_', $current_clone_id);
$root_agent_id = end($parts);

// 2. Fetch all agents in the chain
$stmtChain = $pdo->prepare("SELECT id FROM agents WHERE id = ? OR id LIKE ?");
$stmtChain->execute([$root_agent_id, '%_' . $root_agent_id]);
$chain_ids = $stmtChain->fetchAll(PDO::FETCH_COLUMN);

// 3. Fetch all attendance for the chain
$inQuery = implode(',', array_fill(0, count($chain_ids), '?'));
$params = $chain_ids;
$params[] = $period;
$stmtAtt = $pdo->prepare("SELECT agent_id, date, status FROM attendance WHERE agent_id IN ($inQuery) AND period = ?");
$stmtAtt->execute($params);
$all_att = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

// 4. Find the PM dates for the current clone
$pm_dates = [];
foreach ($all_att as $att) {
    if ($att['agent_id'] === $current_clone_id && strpos($att['status'], 'PM|') === 0) {
        $pm_dates[] = $att['date'];
    }
}

// 5. Merge history for PM dates only
$merged_history = [];
foreach ($pm_dates as $date) {
    $strongest_status = '';
    $highest_priority = 99;
    
    foreach ($all_att as $att) {
        if ($att['date'] === $date) {
            $st = $att['status'];
            $priority = 99;
            if (in_array($st, ['A', 'MAP', 'P']) || in_array($st, ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || strpos($st, 'SORTANT_') === 0) {
                $priority = 1;
            } elseif ($st === '1' || $st === 'R' || $st === 'ENTRANT' || $st === 'NON_PRESENT') {
                $priority = 2;
            } elseif (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0 || strpos($st, 'M_1|') === 0 || strpos($st, 'EXT_1|') === 0 || strpos($st, 'REL_1|') === 0) {
                $priority = 3;
            }
            
            if ($priority < $highest_priority) {
                $highest_priority = $priority;
                $strongest_status = $st;
            }
        }
    }
    $merged_history[$date] = $strongest_status;
}

// 6. Calculate origin stats
$origin_total_A = 0;
$origin_mutation_days = 0;
$origin_total_Exit = 0;
$origin_total_Entrant = 0;
$origin_total_MAP = 0;
$origin_total_P = 0;

foreach ($merged_history as $dt => $st) {
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

$cycleDays = 31; // hardcoded for test
$adj_mutation = $origin_mutation_days;
if ($cycleDays > 30 && $adj_mutation > 0) {
    $surplus = $cycleDays - 30;
    $adj_mutation = max(0, $adj_mutation - min($adj_mutation, $surplus));
}
$origin_base = max(0, count($pm_dates) - $origin_total_A - $origin_total_MAP - $adj_mutation - $origin_total_P);

echo "origin_absences: " . ($origin_total_A + $origin_total_Exit) . "\n";
echo "origin_base: $origin_base\n";
echo "Merged History:\n";
print_r($merged_history);
?>
