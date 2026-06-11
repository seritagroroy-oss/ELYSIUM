<?php
require 'backend/database.php';

function getPeriodDates($period, $start_day, $end_day)
{
    $dates = [];
    $parts = explode('-', $period);
    if (count($parts) !== 2) return $dates;

    $year = (int)$parts[0];
    $month = (int)$parts[1];

    $start_month = $month - 1;
    $start_year = $year;
    if ($start_month < 1) {
        $start_month = 12;
        $start_year--;
    }

    $end_month = $month;
    $end_year = $year;

    $start_date = sprintf('%04d-%02d-%02d', $start_year, $start_month, $start_day);
    $end_date = sprintf('%04d-%02d-%02d', $end_year, $end_month, $end_day);

    $current = new DateTime($start_date);
    $end = new DateTime($end_date);
    while ($current <= $end) {
        $dates[] = $current->format('Y-m-d');
        $current->modify('+1 day');
    }
    return $dates;
}

$sqlite = getDb();
$serviceKey = 'svc_1780068297_395'; // pcsecuritex1
$period = '2026-06';

function getServiceDataSqlLocal($serviceKey, $key, $default = null) {
    global $sqlite;
    $stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = ?");
    $stmt->execute([$serviceKey, $key]);
    $row = $stmt->fetch();
    $res = $row ? ($row['data_value'] ?? null) : null;
    return $res ? json_decode($res, true) : $default;
}

$settings_raw = getServiceDataSqlLocal($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
$start_day = (int)($settings_raw['cycle_start'] ?? 21);
$end_day   = (int)($settings_raw['cycle_end']   ?? 20);
$dates = getPeriodDates($period, $start_day, $end_day);

$salary_config_raw = getServiceDataSqlLocal($serviceKey, 'salary_config', []);
$functions_raw     = getServiceDataSqlLocal($serviceKey, 'functions', []);

// Charger sites + subsites + agents depuis SQLite
$stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE service_id = ?");
$stmtSites->execute([$serviceKey]);
$sites_rows = $stmtSites->fetchAll();

// Inject virtual sites
$has_extras = false; $has_releves = false; $has_admin = false;
foreach ($sites_rows as $s) {
    if ($s['id'] === 'site_extras') $has_extras = true;
    if ($s['id'] === 'site_releves') $has_releves = true;
    if ($s['id'] === 'site_administration') $has_admin = true;
}
if (!$has_extras)   $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
if (!$has_releves)  $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
if (!$has_admin)    $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];

$salaries = [];
foreach ($sites_rows as $site) {
    $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
    $stmtSub2->execute([$site['id']]);
    $subsites_rows = $stmtSub2->fetchAll();

    // Inject default subsites for virtual sites if they are not in DB
    if (in_array($site['id'], ['site_extras', 'site_releves', 'site_administration']) && empty($subsites_rows)) {
        if ($site['id'] === 'site_extras') $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
        if ($site['id'] === 'site_releves') $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
        if ($site['id'] === 'site_administration') $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
    }

    foreach ($subsites_rows as $sub) {
        $stmtAg2 = $sqlite->prepare(
            "SELECT * FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name"
        );
        $stmtAg2->execute([$sub['id'], $serviceKey, $period]);
        $agents_rows = $stmtAg2->fetchAll();

        foreach ($agents_rows as $agent) {
            $agent_id = $agent['id'];
            $func_id  = $agent['function'] ?? 'AS';

            $base = isset($agent['base_salary']) && (int)$agent['base_salary'] > 0
                ? (int)$agent['base_salary']
                : (isset($salary_config_raw[$func_id]) ? (int)$salary_config_raw[$func_id] : 75000);

            $function_label = $func_id;
            foreach ($functions_raw as $f) {
                if (($f['id'] ?? '') === $func_id) {
                    $function_label = $f['name'] ?? $func_id;
                    break;
                }
            }

            $stmtAtt2 = $sqlite->prepare(
                "SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?"
            );
            $stmtAtt2->execute([$agent_id, $period]);
            $att_rows = $stmtAtt2->fetchAll();

            $att_map = [];
            foreach ($att_rows as $att) {
                $att_map[$att['shift_code']][$att['date']] = $att['status'];
            }

            $absences = 0;
            $absence_details = [];
            foreach ($dates as $date) {
                if (($att_map['J'][$date] ?? '') === 'A') {
                    $absences++;
                    $absence_details[] = ['date' => $date, 'shift' => 'Jour'];
                }
                if (($att_map['N'][$date] ?? '') === 'A') {
                    $absences++;
                    $absence_details[] = ['date' => $date, 'shift' => 'Nuit'];
                }
            }

            $sp_count = 0;
            $sp_details = [];
            foreach (['S', 'SJ', 'SN'] as $sp_key) {
                foreach ($dates as $date) {
                    $sp_status = $att_map[$sp_key][$date] ?? '';
                    if ($sp_status !== '' && $sp_status !== 'A' && $sp_status !== 'R') {
                        $sp_count++;
                        $shift_label = 'Supplémentaire';
                        if ($sp_key === 'SJ') $shift_label = 'Supplémentaire Jour';
                        elseif ($sp_key === 'SN') $shift_label = 'Supplémentaire Nuit';
                        $sp_details[] = ['date' => $date, 'shift' => $shift_label];
                    }
                }
            }

            $deductions = (int)round($absences * ($base / 30));
            $gains      = (int)round($sp_count * ($base / 30));
            $total      = $base - $deductions + $gains;

            $salaries[] = [
                'id'              => $agent_id,
                'name'            => $agent['name'],
                'site'            => $site['name'],
                'subsite'         => $sub['name'],
                'function'        => $func_id,
                'function_label'  => $function_label,
                'shift_type'      => $agent['shift_type'] ?? 'Jour',
                'base'            => $base,
                'absences'        => $absences,
                'absence_details' => $absence_details,
                'sp_count'        => $sp_count,
                'sp_details'      => $sp_details,
                'deductions'      => $deductions,
                'gains'           => $gains,
                'total'           => $total
            ];
        }
    }
}
echo json_encode($salaries, JSON_PRETTY_PRINT);
