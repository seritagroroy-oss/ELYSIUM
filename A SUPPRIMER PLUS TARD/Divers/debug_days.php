<?php
require_once dirname(__DIR__) . '/backend/database.php';
require_once dirname(__DIR__) . '/backend/core/functions.php';

$sqlite = getDb();
$period = '2026-08';

$stmt = $sqlite->prepare("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%bhbh%' AND (archived_period IS NULL OR archived_period >= ?)");
$stmt->execute([$period]);
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($agents as &$agent) {
    if (preg_match('/^ag_\d+_(.+)$/', $agent['id'], $m)) {
        $agent['is_clone'] = true;
        $original_id = $m[1];
        $stmtOrigDays = $sqlite->prepare("SELECT date, status FROM attendance WHERE agent_id = ? AND period = ?");
        $stmtOrigDays->execute([$original_id, $period]);
        $origAttRows = $stmtOrigDays->fetchAll(PDO::FETCH_ASSOC);

        $origin_total_A = 0;
        $origin_total_MAP = 0;
        $origin_total_P = 0;
        $origin_total_Entrant = 0;
        $origin_total_Exit = 0;
        $origin_mutation_days = 0;
        
        $origin_dates_counted = [];
        foreach ($origAttRows as $orig_att) {
            $st = $orig_att['status'] ?? '';
            $dt = $orig_att['date'] ?? '';
            if (isset($origin_dates_counted[$dt])) continue;
            $origin_dates_counted[$dt] = true;
            
            if (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0) {
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
        
        $daysInMonth = (int)date('t', strtotime($period . '-01'));
        $workedDays = $daysInMonth - $origin_total_Entrant - $origin_total_Exit - $origin_mutation_days;
        $monthAdj = 30 - $daysInMonth;
        if ($monthAdj !== 0) {
            $monthAdj = $monthAdj * ($workedDays / max(1, $daysInMonth));
        }
        $origin_base = max(0, $daysInMonth - $origin_total_A - $origin_total_MAP - $origin_total_Entrant - $origin_total_P - $origin_mutation_days) + round($monthAdj);
        $agent['days_consumed_by_origin'] = $origin_base;
        $agent['workedDays'] = $workedDays;
        $agent['monthAdj'] = $monthAdj;
        $agent['origin_mutation_days'] = $origin_mutation_days;
        $agent['origin_total_A'] = $origin_total_A;
    }
}

print_r($agents);
