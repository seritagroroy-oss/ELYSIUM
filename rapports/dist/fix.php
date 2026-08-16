<?php
require '../../utils.php';
session_start();

$serviceKey = $_SESSION['service_id'] ?? null;
if (!$serviceKey) {
    die("Session non trouvée. Veuillez vous connecter.");
}

$current_period = '2026-06';
$next_period = '2026-07';

$sqlite = getDb();
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $settings = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
    $start_day = (int) ($settings['cycle_start'] ?? 21);
    $end_day = (int) ($settings['cycle_end'] ?? 20);

    function myGetPeriodDates($period, $start_day, $end_day)
    {
        $base = DateTime::createFromFormat('Y-m-d', $period . '-01');
        if (!$base) return [];

        $start = clone $base;
        $start->modify('-1 month');
        $start->setDate((int) $start->format('Y'), (int) $start->format('m'), (int) $start_day);

        $end = clone $base;
        $end->setDate((int) $end->format('Y'), (int) $end->format('m'), (int) $end_day);
        if ($end < $start) {
            $end->modify('+1 month');
        }

        $dates = [];
        $cursor = clone $start;
        while ($cursor <= $end) {
            $dates[] = $cursor->format('Y-m-d');
            $cursor->modify('+1 day');
        }
        return $dates;
    }

    $old_dates = myGetPeriodDates($current_period, $start_day, $end_day);
    $new_dates = myGetPeriodDates($next_period, $start_day, $end_day);

    $stmtAgents = $sqlite->prepare("SELECT id FROM agents WHERE service_id = ? AND archived_period IS NULL");
    $stmtAgents->execute([$serviceKey]);
    $all_agents = array_column($stmtAgents->fetchAll(), 'id');

    echo "Found " . count($all_agents) . " agents.<br>";

    $placeholders = implode(',', array_fill(0, count($all_agents), '?'));
    $stmtOldAtt = $sqlite->prepare("
       SELECT agent_id, date, shift_code, status
       FROM attendance
       WHERE period = ? AND service_id = ?
       AND agent_id IN ($placeholders)
   ");
    $params = array_merge([$current_period, $serviceKey], $all_agents);
    $stmtOldAtt->execute($params);
    $old_att_rows = $stmtOldAtt->fetchAll();
    
    $old_att = [];
    foreach ($old_att_rows as $row) {
        $old_att[$row['agent_id']][$row['shift_code']][$row['date']] = $row['status'];
    }

    $last_old_d = $old_dates[count($old_dates) - 1];

    $stmtShifts = $sqlite->prepare("SELECT id, shift_type, hire_date FROM agents WHERE service_id = ? AND archived_period IS NULL");
    $stmtShifts->execute([$serviceKey]);
    $shift_rows = $stmtShifts->fetchAll();
    $agent_shift_types = [];
    $agent_hire_dates = [];
    foreach ($shift_rows as $sr) {
        $agent_shift_types[$sr['id']] = $sr['shift_type'] ?? 'Jour';
        $agent_hire_dates[$sr['id']] = $sr['hire_date'] ?? '2000-01-01';
    }

    $stmtDel = $sqlite->prepare("DELETE FROM attendance WHERE period = ? AND service_id = ?");
    $stmtDel->execute([$next_period, $serviceKey]);

    $stmtIns = $sqlite->prepare("
        INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $processed = 0;
    foreach ($all_agents as $agent_id) {
        $shifts = $old_att[$agent_id] ?? [];
        $shift_type = $agent_shift_types[$agent_id] ?? 'Jour';

        $isMutatedOut = false;
        foreach (['J', 'N'] as $sc) {
            $last_val = $shifts[$sc][$last_old_d] ?? '';
            if (strpos((string)$last_val, 'M|') === 0) {
                $isMutatedOut = true;
                break;
            }
        }
        if ($isMutatedOut) continue;

        $isNewMutatedAgent = false;
        foreach (['J', 'N'] as $sc) {
            foreach (($shifts[$sc] ?? []) as $v) {
                if (strpos((string)$v, 'PM|') === 0 || $v === 'ENTRANT') {
                    $isNewMutatedAgent = true;
                    break 2;
                }
            }
        }

        $shift_type_lower = strtolower($shift_type);
        $shift_codes_to_fill = [];
        if ($shift_type_lower === 'jour') $shift_codes_to_fill = ['J'];
        elseif ($shift_type_lower === 'nuit') $shift_codes_to_fill = ['N'];
        else $shift_codes_to_fill = ['J', 'N'];

        foreach ($shift_codes_to_fill as $shift_code) {
            $last_val = $shifts[$shift_code][$last_old_d] ?? '';
            $isActiveAtEnd = ($last_val === '1' || $last_val === 'A' || $last_val === 'CP'
                || $last_val === 'AT' || $last_val === 'R' || strpos((string)$last_val, 'PM|') === 0);

            if (!$isActiveAtEnd && !$isNewMutatedAgent) {
                echo "Skipped agent $agent_id (not active). last_val: '$last_val'<br>";
                continue;
            }

            foreach ($new_dates as $new_idx => $new_d) {
                $status = '1';
                $hire_date = $agent_hire_dates[$agent_id] ?? '2000-01-01';
                if ($new_d < $hire_date) {
                    $status = 'ENTRANT';
                }
                $stmtIns->execute([$agent_id, $new_d, $shift_code, $status, $_SESSION['company_id'], $serviceKey, $next_period]);
            }
            $processed++;
        }
    }
    echo "Successfully inserted $processed shift lines into $next_period!<br>";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
