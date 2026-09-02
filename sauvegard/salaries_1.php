<?php
/**
 * Module Paie, RH & Absences â€” salaries.php
 * Extrait de api_new.php
 */

switch ($action) {
    case 'get_salary_config':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $company_key = 'company::' . $companyId;
        $sqlite = getDb();
        
        $functions = getServiceDataSql($company_key, 'functions', []);

        $nameToId = [];
        foreach ($functions as $f) {
            $nameToId[$f['name']] = $f['id'];
        }

        $config = getServiceDataSql($serviceKey, 'salary_config', []);
        
        // Sync with actual salary_grid
        $stmtGrid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ? ORDER BY id ASC");
        $stmtGrid->execute([$companyId]);
        while($row = $stmtGrid->fetch()) {
            $poste = $row['poste'];
            // If salary_grid stored the full name instead of ID, map it back to ID
            $key = isset($nameToId[$poste]) ? $nameToId[$poste] : $poste;
            $config[$key] = (int)$row['taux_horaire'];
        }

        // Ensure all current functions have a default entry if missing
        foreach ($functions as $f) {
            if (!isset($config[$f['id']])) {
                $config[$f['id']] = 75000;
            }
        }
        echo json_encode(['success' => true, 'config' => $config]);
        break;

    case 'update_salary_config':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $cfg = $data['config'] ?? [];
        setServiceDataSql($serviceKey, 'salary_config', $cfg);
        
        // Save to salary_grid as well
        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO salary_grid (company_id, poste, taux_horaire) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE taux_horaire=VALUES(taux_horaire)");
        foreach ($cfg as $poste => $taux) {
            $stmt->execute([$companyId, $poste, (int)$taux]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'save_functions':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $company_id = resolveCurrentCompanyIdSql();
        // Stocker avec la clÃ© commune Ã  toute l'entreprise
        $company_key = 'company::' . $company_id;
        $funcs = $data['functions'] ?? [];
        // Sauvegarder sous les deux clÃ©s pour compatibilitÃ© (company:: et company_id direct)
        setServiceDataSql($company_key, 'functions', $funcs);
        setServiceDataSql($company_id, 'functions', $funcs);
        echo json_encode(['success' => true]);
        break;

    case 'save_settings':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $settings = [
            'cycle_start' => (int) ($data['cycle_start'] ?? 21),
            'cycle_end' => (int) ($data['cycle_end'] ?? 20)
        ];
        setServiceDataSql($serviceKey, 'settings', $settings);
        echo json_encode(['success' => true]);
        break;

    case 'save_manual_adjustment':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $type = $data['type'] ?? 'PRIME';
        $category = $data['category'] ?? 'GAIN';
        $value = (int) ($data['value'] ?? 0);
        $comment = $data['comment'] ?? '';
        $date_app = $data['date_application'] ?? date('Y-m-d');
        $period = substr($date_app, 0, 7);

        if ($agent_id === '' || $value <= 0) {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es invalides']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        $adjustments = getServiceDataSql($serviceKey, 'manual_adjustments', []);

        if (!isset($adjustments[$period])) {
            $adjustments[$period] = [];
        }
        if (!isset($adjustments[$period][$agent_id])) {
            $adjustments[$period][$agent_id] = [];
        }

        $adjustments[$period][$agent_id][] = [
            'id' => 'adj_' . time() . '_' . rand(1000, 9999),
            'type' => $type,
            'category' => $category,
            'value' => $value,
            'date_application' => $date_app,
            'comment' => $comment
        ];

        setServiceDataSql($serviceKey, 'manual_adjustments', $adjustments);
        echo json_encode(['success' => true]);
        break;

    case 'delete_manual_adjustment':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $period = $data['period'] ?? '';
        $adj_id = $data['adjustment_id'] ?? '';

        if ($agent_id === '' || $period === '' || $adj_id === '') {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es manquantes']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        $adjustments = getServiceDataSql($serviceKey, 'manual_adjustments', []);
        $found = false;

        if (isset($adjustments[$period][$agent_id])) {
            $adjs = &$adjustments[$period][$agent_id];
            foreach ($adjs as $idx => $adj) {
                if ($adj['id'] === $adj_id) {
                    array_splice($adjs, $idx, 1);
                    $found = true;
                    break;
                }
            }
        }

        if ($found) {
            setServiceDataSql($serviceKey, 'manual_adjustments', $adjustments);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ajustement introuvable']);
        }
        break;

    case 'save_payroll_status':
        // Persiste le statut de paie d'un agent (brouillon â†’ valide â†’ paye)
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $companyId  = resolveCurrentCompanyIdSql();
        $period     = $data['period']     ?? '';
        $siteId     = $data['site_id']    ?? '';
        $zoneName   = $data['zone_name']  ?? '';
        $agentName  = $data['agent_name'] ?? '';
        $status     = $data['status']     ?? 'brouillon';

        if (!$period || !$agentName) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tres manquants (period, agent_name)']);
            break;
        }

        // Valider le statut
        if (!in_array($status, ['brouillon', 'valide', 'paye'])) {
            echo json_encode(['success' => false, 'message' => 'Statut invalide']);
            break;
        }

        $db = getDb();
        try {
            $stmt = $db->prepare(
                "INSERT INTO payroll_statuses (company_id, period, site_id, zone_name, agent_name, status)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP"
            );
            $stmt->execute([$companyId, $period, $siteId, $zoneName, $agentName, $status]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur DB: ' . $e->getMessage()]);
        }
        break;

    case 'bulk_save_payroll_status':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $companyId = resolveCurrentCompanyIdSql();
        $period    = $data['period'] ?? '';
        $updates   = $data['updates'] ?? []; // [{site_id, zone_name, agent_name, status}]

        if (!$period || !is_array($updates) || empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tres manquants (period, updates)']);
            break;
        }

        $db = getDb();
        try {
            $db->beginTransaction();
            $stmt = $db->prepare(
                "INSERT INTO payroll_statuses (company_id, period, site_id, zone_name, agent_name, status)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP"
            );
            foreach ($updates as $u) {
                $status = $u['status'] ?? 'brouillon';
                if (!in_array($status, ['brouillon', 'valide', 'paye'])) continue;
                $stmt->execute([
                    $companyId,
                    $period,
                    $u['site_id'] ?? '',
                    $u['zone_name'] ?? '',
                    $u['agent_name'] ?? '',
                    $status
                ]);
            }
            $db->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erreur DB: ' . $e->getMessage()]);
        }
        break;
    case 'get_payroll_statuses':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $companyId = resolveCurrentCompanyIdSql();
        $period    = $_GET['period'] ?? ($data['period'] ?? '');

        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tre period manquant']);
            break;
        }

        $db = getDb();
        try {
            $stmt = $db->prepare("SELECT period, site_id, zone_name, agent_name, status FROM payroll_statuses WHERE company_id = ? AND period = ?");
            $stmt->execute([$companyId, $period]);
            $rows = $stmt->fetchAll();

            $statusMap = [];
            foreach ($rows as $row) {
                $key = $row['period'] . '_' . $row['site_id'] . '_' . $row['zone_name'] . '_' . $row['agent_name'];
                $statusMap[$key] = $row['status'];
            }
            // Ensure statusMap is always an object in JSON even if empty
            if (empty($statusMap)) {
                $statusMap = new stdClass();
            }
            echo json_encode(['success' => true, 'statuses' => $statusMap]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur DB: ' . $e->getMessage()]);
        }
        break;

    case 'save_payroll_archive':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        // ... implementation ...
        break;

    case 'delete_payroll_archive':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        // ... implementation ...
        break;

    case 'save_site_revenue':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $site_name = $data['site_name'] ?? '';
        $revenue = (int) ($data['contract_revenue'] ?? 0);

        if ($site_name === '') {
            echo json_encode(['success' => false, 'message' => 'Site invalide']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        $revenues = getServiceDataSql($serviceKey, 'site_revenues', []);
        $revenues[$site_name] = [
            'contract_revenue' => $revenue,
            'currency' => 'XOF'
        ];

        setServiceDataSql($serviceKey, 'site_revenues', $revenues);
        echo json_encode(['success' => true]);
        break;

    case 'change_agent_shift':
        $agent_id = $data['agent_id'] ?? 0;
        $site_id = (string) ($data['site_id'] ?? '');
        $date = $data['date'] ?? ''; // e.g. "2026-05-15"
        $new_shift = $data['new_shift'] ?? '';
        $period = $data['period'] ?? '';
        $serviceKey = $_SESSION['service_id'] ?? null;

        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT shift_type, shift_history FROM agents WHERE id = ?");
        $stmt->execute([$agent_id]);
        $agent_data = $stmt->fetch();

        if (!$agent_data) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
            break;
        }

        $old_shift = $agent_data['shift_type'] ?? 'Jour';
        $shift_history_str = $agent_data['shift_history'];
        $shift_history = $shift_history_str ? json_decode($shift_history_str, true) : null;

        if (!is_array($shift_history) || empty($shift_history)) {
            $shift_history = [
                ['from' => '2000-01-01', 'type' => $old_shift]
            ];
        }

        $updated = false;
        foreach ($shift_history as &$sh) {
            if ($sh['from'] === $date) {
                $sh['type'] = $new_shift;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            $shift_history[] = [
                'from' => $date,
                'type' => $new_shift
            ];
        }

        usort($shift_history, function ($a, $b) {
            return strcmp($a['from'], $b['from']);
        });

        $latest_shift = end($shift_history)['type'];

        $stmt = $sqlite->prepare("UPDATE agents SET shift_type = ?, shift_history = ? WHERE id = ?");
        $stmt->execute([$latest_shift, json_encode($shift_history), $agent_id]);

        $found = true;

        if ($found) {
            // Targeted pre-fill from the change date
            if ($period && $date) {
                $db = getScopedData($serviceKey);
                $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
                $start_day = (int) ($settings['cycle_start'] ?? 21);
                $end_day = (int) ($settings['cycle_end'] ?? 20);
                $dates = getPeriodDates($period, $start_day, $end_day);

                $change_ts = strtotime($date);

                $cycleLen = 1;
                $workDays = 1;
                $isRotative = false;

                if ($new_shift === '24h') {
                    $cycleLen = 2;
                    $workDays = 1;
                    $isRotative = true;
                } elseif ($new_shift === '48h') {
                    $cycleLen = 4;
                    $workDays = 2;
                    $isRotative = true;
                } elseif ($new_shift === '72h') {
                    $cycleLen = 6;
                    $workDays = 3;
                    $isRotative = true;
                }

                $day_index = 0;
                $random_rest_day = rand(0, 6);

                $company_id = resolveCurrentCompanyIdSql();
                $stmtInsert = $sqlite->prepare("INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmtDelete = $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ?");

                if (!isset($db['attendance'][$period])) {
                    $db['attendance'][$period] = [];
                }
                if (!isset($db['attendance'][$period][$agent_id])) {
                    $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];
                }

                foreach ($dates as $ds) {
                    if (strtotime($ds) >= $change_ts) {
                        // Nettoyage des anciennes valeurs dans SQLite et le JSON
                        $stmtDelete->execute([$agent_id, $ds, 'J']);
                        $stmtDelete->execute([$agent_id, $ds, 'N']);
                        unset($db['attendance'][$period][$agent_id]['J'][$ds]);
                        unset($db['attendance'][$period][$agent_id]['N'][$ds]);

                        if ($isRotative) {
                            $pos = $day_index % $cycleLen;
                            $val = ($pos < $workDays) ? '1' : 'R';

                            $stmtInsert->execute([$agent_id, $ds, 'J', $val, $company_id, $serviceKey, $period]);
                            $stmtInsert->execute([$agent_id, $ds, 'N', $val, $company_id, $serviceKey, $period]);
                            $db['attendance'][$period][$agent_id]['J'][$ds] = $val;
                            $db['attendance'][$period][$agent_id]['N'][$ds] = $val;

                            $day_index++;
                        } else {
                            $shift_key = ($new_shift === 'Nuit') ? 'N' : 'J';
                            $date_obj = new DateTime($ds);
                            if ((int) $date_obj->format('w') === $random_rest_day) {
                                $stmtInsert->execute([$agent_id, $ds, $shift_key, 'R', $company_id, $serviceKey, $period]);
                                $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
                            } else {
                                $stmtInsert->execute([$agent_id, $ds, $shift_key, '1', $company_id, $serviceKey, $period]);
                                $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
                            }
                        }
                    }
                }
                saveScopedData($db, $serviceKey);
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;

    case 'delete_shift_change':
        $agent_id   = $data['agent_id'] ?? 0;
        $date       = $data['date'] ?? '';
        $period     = $data['period'] ?? '';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (!$agent_id || !$date) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tres manquants']);
            break;
        }

        $sqlite = getDb();
        $stmt  = $sqlite->prepare("SELECT shift_type, shift_history FROM agents WHERE id = ? AND company_id = ?");
        $stmt->execute([$agent_id, resolveCurrentCompanyIdSql()]);
        $agent_data = $stmt->fetch();

        if (!$agent_data) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
            break;
        }

        $shift_history = $agent_data['shift_history'] ? json_decode($agent_data['shift_history'], true) : [];

        // Remove the entry with the matching from date
        $shift_history = array_values(array_filter($shift_history, fn($sh) => $sh['from'] !== $date));

        // Re-sort
        usort($shift_history, fn($a, $b) => strcmp($a['from'], $b['from']));

        // Find what shift type was active just BEFORE the deleted date
        $prev_shift = 'Jour';
        foreach ($shift_history as $sh) {
            if ($sh['from'] <= $date) {
                $prev_shift = $sh['type'];
            }
        }

        // Update the latest shift_type
        $latest_shift = !empty($shift_history) ? end($shift_history)['type'] : $prev_shift;

        $stmt = $sqlite->prepare("UPDATE agents SET shift_type = ?, shift_history = ? WHERE id = ?");
        $stmt->execute([$latest_shift, json_encode($shift_history), $agent_id]);

        // === Re-apply attendance from $date onwards (same logic as change_agent_shift) ===
        if ($period && $date) {
            $db = getScopedData($serviceKey);
            $settings  = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
            $start_day = (int) ($settings['cycle_start'] ?? 21);
            $end_day   = (int) ($settings['cycle_end'] ?? 20);
            $dates     = getPeriodDates($period, $start_day, $end_day);

            $change_ts = strtotime($date);

            $cycleLen    = 1;
            $workDays    = 1;
            $isRotative  = false;

            if ($prev_shift === '24h') {
                $cycleLen   = 2; $workDays = 1; $isRotative = true;
            } elseif ($prev_shift === '48h') {
                $cycleLen   = 4; $workDays = 2; $isRotative = true;
            } elseif ($prev_shift === '72h') {
                $cycleLen   = 6; $workDays = 3; $isRotative = true;
            }

            $day_index      = 0;
            $random_rest_day = rand(0, 6);
            $company_id     = resolveCurrentCompanyIdSql();

            $stmtInsert = $sqlite->prepare("INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmtDelete = $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ?");

            if (!isset($db['attendance'][$period])) $db['attendance'][$period] = [];
            if (!isset($db['attendance'][$period][$agent_id])) $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];

            foreach ($dates as $ds) {
                if (strtotime($ds) >= $change_ts) {
                    // Clear J and N for this date
                    $stmtDelete->execute([$agent_id, $ds, 'J']);
                    $stmtDelete->execute([$agent_id, $ds, 'N']);
                    unset($db['attendance'][$period][$agent_id]['J'][$ds]);
                    unset($db['attendance'][$period][$agent_id]['N'][$ds]);

                    if ($isRotative) {
                        $pos = $day_index % $cycleLen;
                        $val = ($pos < $workDays) ? '1' : 'R';
                        $stmtInsert->execute([$agent_id, $ds, 'J', $val, $company_id, $serviceKey, $period]);
                        $stmtInsert->execute([$agent_id, $ds, 'N', $val, $company_id, $serviceKey, $period]);
                        $db['attendance'][$period][$agent_id]['J'][$ds] = $val;
                        $db['attendance'][$period][$agent_id]['N'][$ds] = $val;
                        $day_index++;
                    } else {
                        $shift_key = ($prev_shift === 'Nuit') ? 'N' : 'J';
                        $date_obj  = new DateTime($ds);
                        $val       = ((int) $date_obj->format('w') === $random_rest_day) ? 'R' : '1';
                        $stmtInsert->execute([$agent_id, $ds, $shift_key, $val, $company_id, $serviceKey, $period]);
                        $db['attendance'][$period][$agent_id][$shift_key][$ds] = $val;
                    }
                }
            }
            saveScopedData($db, $serviceKey);
        }

        echo json_encode(['success' => true, 'shift_history' => $shift_history, 'shift_type' => $latest_shift]);
        break;

    case 'get_messages':
        $db = getScopedData($serviceKey);
        echo json_encode(array_slice($db['messages'] ?? [], 0, 20));
        break;

    case 'init_next_period':
        $current_period = $data['current_period'] ?? '';
        $next_period = $data['next_period'] ?? '';
        $sites_to_keep_hs = $data['sites_to_keep_hs'] ?? [];

        if (!$current_period || !$next_period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riodes manquantes']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey) {
            echo json_encode(['success' => false, 'message' => 'Service non identifiÃ©']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();

        // RÃ©cupÃ©rer le cycle_start depuis service_data
        $settings = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $start_day = (int) ($settings['cycle_start'] ?? 21);

        $end_day = (int) ($settings['cycle_end'] ?? 20);

        // Calculer les dates du cycle courant (current_period) et du cycle suivant (next_period)
        $old_dates = getPeriodDates($current_period, $start_day, $end_day);
        $new_dates = getPeriodDates($next_period, $start_day, $end_day);

        if (empty($old_dates) || empty($new_dates)) {
            echo json_encode(['success' => false, 'message' => 'Impossible de calculer les dates des cycles']);
            break;
        }

        // RÃ©cupÃ©rer uniquement les agents liÃ©s Ã  ce PC (crÃ©Ã©s par lui) OU ayant pointÃ© dans le mois prÃ©cÃ©dent pour ce PC
        $stmtAgents = $sqlite->prepare("
            SELECT DISTINCT a.id 
            FROM agents a
            LEFT JOIN attendance att ON a.id = att.agent_id AND att.period = ? AND att.service_id = ?
            WHERE a.company_id = ? 
            AND a.archived_period IS NULL
            AND (a.service_id = ? OR att.agent_id IS NOT NULL)
        ");
        $stmtAgents->execute([$current_period, $serviceKey, $company_id, $serviceKey]);
        $agents_rows = $stmtAgents->fetchAll();
        $all_agents = array_column($agents_rows, 'id');

        if (empty($all_agents)) {
            // Sauvegarder le dernier mois initialisÃ© dans la base (utilisÃ© pour le verrou des mois futurs) mÃªme s'il n'y a pas d'agents
            setServiceDataSql($company_id, 'max_initialized_period', $next_period);
            echo json_encode(['success' => true]);
            break;
        }

        // RÃ©cupÃ©rer l'attendance du mois courant pour tous ces agents
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

        // Indexer par agent_id > shift_code > date
        $old_att = [];
        foreach ($old_att_rows as $row) {
            $old_att[$row['agent_id']][$row['shift_code']][$row['date']] = $row['status'];
        }

        $agentsToArchive = [];

        // Avant de supprimer, sauvegarder les statuts spÃ©cifiques prÃ©-enregistrÃ©s (MAP, absences futures) pour le next_period
        $stmtFuture  = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE period = ? AND service_id = ? AND status IN ('MAP', 'CP', 'AT', 'M', 'P') AND company_id = ?");
        $stmtFuture->execute([$next_period, $serviceKey, $company_id]);
        $future_rows = $stmtFuture->fetchAll();
        $future_att = [];
        foreach ($future_rows as $row) {
            $future_att[$row['agent_id']][$row['shift_code']][$row['date']] = $row['status'];
        }

        // Supprimer les donnÃ©es dÃ©jÃ  existantes du next_period pour repartir propre
        $stmtDel = $sqlite->prepare("DELETE FROM attendance WHERE period = ? AND service_id = ?");
        $stmtDel->execute([$next_period, $serviceKey]);

        // PrÃ©parer le INSERT
        $stmtIns = $sqlite->prepare("
           INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period)
           VALUES (?, ?, ?, ?, ?, ?, ?)
       ");

        $last_old_d = $old_dates[count($old_dates) - 1];

        // RÃ©cupÃ©rer les shift_type, hire_date, site_id et profile_data de tous les agents en une requÃªte
        $placeholders_shifts = implode(',', array_fill(0, count($all_agents), '?'));
        $stmtShifts = $sqlite->prepare("
            SELECT a.id, a.shift_type, a.hire_date, sub.site_id, a.profile_data, a.subsite_id
            FROM agents a
            LEFT JOIN subsites sub ON a.subsite_id = sub.id
            WHERE a.id IN ($placeholders_shifts)
        ");
        $stmtShifts->execute($all_agents);
        $shift_rows = $stmtShifts->fetchAll();
        $agent_shift_types = [];
        $agent_hire_dates = [];
        $agent_sites = [];
        $agent_subsites = [];
        $agent_profiles = [];
        foreach ($shift_rows as $sr) {
            $agent_shift_types[$sr['id']] = $sr['shift_type'] ?? 'Jour';
            $agent_hire_dates[$sr['id']] = $sr['hire_date'] ?? '2000-01-01';
            $agent_sites[$sr['id']] = $sr['site_id'];
            $agent_subsites[$sr['id']] = $sr['subsite_id'];
            $agent_profiles[$sr['id']] = json_decode($sr['profile_data'] ?? '{}', true);
        }

        $nb_old = count($old_dates);

        foreach ($all_agents as $agent_id) {
            $shifts = $old_att[$agent_id] ?? [];
            $shift_type = $agent_shift_types[$agent_id] ?? 'Jour';

            // VÃ©rifier si l'agent est mutÃ© sortant (dernier jour = M|...)
            $isMutatedOut = false;
            foreach (['J', 'N'] as $sc) {
                $last_val = $shifts[$sc][$last_old_d] ?? '';
                if (strpos((string)$last_val, 'M|') === 0) {
                    $isMutatedOut = true;
                    break;
                }
            }

            if ($isMutatedOut) {
                $agentsToArchive[] = $agent_id;
                continue;
            }

            // VÃ©rifier si c'est un agent fraÃ®chement mutÃ© entrant (PM|... dans le mois courant) ou ENTRANT
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

            // DÃ©terminer les paramÃ¨tres du cycle selon le shift_type
            $cycle = 0;
            $work = 0;
            if ($shift_type_lower === '24h') {
                $cycle = 2;
                $work = 1;
            } elseif ($shift_type_lower === '48h') {
                $cycle = 4;
                $work = 2;
            } elseif ($shift_type_lower === '72h') {
                $cycle = 6;
                $work = 3;
            }

            // Trouver le jour de repos hebdo pour Jour/Nuit (depuis l'ancien mois)
            $repos_day_of_week = -1;
            if ($shift_type_lower === 'jour' || $shift_type_lower === 'nuit') {
                $sc_check = ($shift_type_lower === 'nuit') ? 'N' : 'J';
                foreach ($old_dates as $od) {
                    $val = $shifts[$sc_check][$od] ?? '';
                    if ($val === 'R') {
                        $repos_day_of_week = (int) (new DateTime($od))->format('w');
                        break;
                    }
                }
                // Fallback : repos stocke dans la table agents, sinon dimanche (0)
                if ($repos_day_of_week === -1) {
                    $stmtRdow  = $sqlite->prepare("SELECT repos_day_of_week FROM agents WHERE id = ? AND company_id = ?");
        $stmtRdow->execute([$agent_id, resolveCurrentCompanyIdSql()]);
                    $rdowRow = $stmtRdow->fetch();
                    $stored_rdow = isset($rdowRow['repos_day_of_week']) ? (int) $rdowRow['repos_day_of_week'] : -1;
                    $repos_day_of_week = ($stored_rdow >= 0) ? $stored_rdow : 0;
                }
            }

            // VÃ©rifier si l'agent est actif (avait des donnÃ©es le mois prÃ©cÃ©dent)
            $hasActivity = false;
            foreach (['J', 'N'] as $sc) {
                if (!empty($shifts[$sc])) {
                    foreach ($shifts[$sc] as $v) {
                        if ($v !== '') {
                            $hasActivity = true;
                            break 2;
                        }
                    }
                }
            }
            // Est-ce un agent d'un site virtuel ?
            $site_id = $agent_sites[$agent_id] ?? '';
            $subsite_id = $agent_subsites[$agent_id] ?? '';
            $is_virtual_site = false;
            
            if (in_array($site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc'])) {
                $is_virtual_site = true;
            } elseif (strpos($subsite_id, 'itc_') === 0 || strpos($subsite_id, 'site_itc') === 0 || strpos($subsite_id, 'site_extras') === 0 || strpos($subsite_id, 'site_releves') === 0 || strpos($subsite_id, 'site_admin') === 0) {
                $is_virtual_site = true;
            }

            if (!$hasActivity && !$isNewMutatedAgent && !$is_virtual_site) {
                $hire_date = $agent_hire_dates[$agent_id] ?? '2000-01-01';
                // Ne pas archiver les agents rÃ©cemment embauchÃ©s (pendant ou aprÃ¨s le mois prÃ©cÃ©dent)
                if ($hire_date < $old_dates[0]) {
                    $agentsToArchive[] = $agent_id;
                    continue;
                }
            }


            $agent_inserted = false;

            // DÃ©terminer les shift_codes Ã  traiter
            $shift_codes_to_fill = [];
            if ($shift_type_lower === 'jour')
                $shift_codes_to_fill = ['J'];
            elseif ($shift_type_lower === 'nuit')
                $shift_codes_to_fill = ['N'];
            else
                $shift_codes_to_fill = ['J', 'N']; // rotatif J et N

            foreach ($shift_codes_to_fill as $shift_code) {
                $isActiveAtEnd = true; // Par dÃ©faut actif
                for ($d_idx = $nb_old - 1; $d_idx >= 0; $d_idx--) {
                    $d = $old_dates[$d_idx];
                    $val = $shifts[$shift_code][$d] ?? '';
                    if ($val !== '') {
                        // ConsidÃ©rer inactif SEULEMENT si explicitement marquÃ© sortant/abandon/demission/mutation out
                        if (in_array($val, ['SORTANT', 'ABANDON', 'DEMISSION']) || strpos((string)$val, 'M|') === 0) {
                            $isActiveAtEnd = false;
                        }
                        break;
                    }
                }

                if (!$isActiveAtEnd && !$isNewMutatedAgent)
                    continue;

                $start_phase = 0;
                if ($cycle > 0) {
                    $anchor_phase = -1;
                    $anchor_idx = -1;
                    for ($idx = $nb_old - 1; $idx >= 0; $idx--) {
                        $od = $old_dates[$idx];
                        $val = $shifts[$shift_code][$od] ?? '';
                        $is_rest = ($val === 'R' || $val === '');
                        $is_work = in_array($val, ['1', 'A', 'M', 'CP', 'AT', 'MAP', 'CSS', 'RET']);

                        if ($is_rest || $is_work) {
                            $current_type = $is_work ? 'W' : 'R';
                            $consecutive = 1;
                            for ($j = $idx - 1; $j >= 0; $j--) {
                                $prev_od = $old_dates[$j];
                                $prev_val = $shifts[$shift_code][$prev_od] ?? '';
                                if (strpos((string)$prev_val, 'M|') === 0 || strpos((string)$prev_val, 'PM|') === 0)
                                    break;

                                $prev_is_work = in_array($prev_val, ['1', 'A', 'M', 'CP', 'AT', 'MAP', 'CSS', 'RET']);
                                $prev_is_rest = ($prev_val === 'R' || $prev_val === '');
                                $prev_type = $prev_is_work ? 'W' : ($prev_is_rest ? 'R' : '?');

                                if ($prev_type === $current_type) {
                                    $consecutive++;
                                } else {
                                    break;
                                }
                            }

                            if ($current_type === 'W') {
                                $anchor_phase = min($consecutive - 1, $work - 1);
                                $anchor_idx = $idx;
                                break;
                            } else {
                                $anchor_phase = min($work + $consecutive - 1, $cycle - 1);
                                $anchor_idx = $idx;
                                break;
                            }
                        }
                    }
                    if ($anchor_idx !== -1) {
                        $diff = $nb_old - $anchor_idx;
                        $start_phase = ($anchor_phase + $diff) % $cycle;
                    }
                }

                for ($i = 0; $i < count($new_dates); $i++) {
                    $new_d = $new_dates[$i];
                    $status = null;

                    if ($cycle > 0) {
                        // --- Logique rotative : 24h / 48h / 72h ---
                        // Utilise le $start_phase calculÃ©
                        $pos = ($start_phase + $i) % $cycle;
                        $status = ($pos < $work) ? '1' : 'R';

                    } elseif ($shift_type_lower === 'jour' || $shift_type_lower === 'nuit') {
                        // --- Logique Jour / Nuit : prÃ©sence sauf jour de repos hebdo ou spÃ©cial ---
                        $day_of_week_N = (int) (new DateTime($new_d))->format('N'); // 1-7
                        $day_of_week_w = (int) (new DateTime($new_d))->format('w'); // 0-6
                        
                        $prof = $agent_profiles[$agent_id] ?? [];
                        $is_special = !empty($prof['special_service']);
                        $special_days = $prof['special_service_days'] ?? [];
                        $is_admin = !empty($prof['admin_schedule']);
                        $admin_days = $prof['admin_schedule_days'] ?? [6, 7];
                        // Transformer 0 en 7
                        $admin_days = array_map(function($d) { return $d == 0 ? 7 : $d; }, $admin_days);

                        if ($is_special) {
                            if (in_array($day_of_week_N, $special_days) || in_array((string)$day_of_week_N, $special_days)) {
                                $status = '1';
                            } else {
                                $status = 'R';
                            }
                        } elseif ($is_admin) {
                            if (in_array($day_of_week_N, $admin_days) || in_array((string)$day_of_week_N, $admin_days)) {
                                $status = 'R';
                            } else {
                                $status = '1';
                            }
                        } else {
                            if ($repos_day_of_week >= 0 && $day_of_week_w === $repos_day_of_week) {
                                $status = 'R';
                            } else {
                                $status = '1';
                            }
                        }
                    } else {
                        // Fallback : prÃ©sence par dÃ©faut
                        $status = '1';
                    }

                    if ($status !== null) {
                        // Si le jour est avant la date d'embauche, on remplace ENTRANT par 1 selon la demande
                        $hire_date = $agent_hire_dates[$agent_id] ?? '2000-01-01';
                        if ($new_d < $hire_date) {
                            $status = '1';
                        }

                        // Restaurer les donnÃ©es futures prÃ©-enregistrÃ©es (comme une MAP anticipÃ©e)
                        if (isset($future_att[$agent_id][$shift_code][$new_d])) {
                            $status = $future_att[$agent_id][$shift_code][$new_d];
                        }
                        $stmtIns->execute([$agent_id, $new_d, $shift_code, $status, $company_id, $serviceKey, $next_period]);
                        $agent_inserted = true;
                    }
                }
            }
            
            // --- Appliquer les supplÃ©mentaires permanentes ---
            $prof = $agent_profiles[$agent_id] ?? [];
            $permanent_supps = $prof['permanent_supps'] ?? [];
            if (!empty($permanent_supps)) {
                foreach ($new_dates as $new_d) {
                    $day_of_week_N_supp = (int) (new DateTime($new_d))->format('N');
                    $daySupps = [];
                    if (isset($permanent_supps[0])) {
                        // Ancien format (tableau de jours)
                        if (in_array($day_of_week_N_supp, $permanent_supps) || in_array((string)$day_of_week_N_supp, $permanent_supps)) {
                            $daySupps['S'] = '1';
                        }
                    } else {
                        // Nouveau format
                        $val = $permanent_supps[$day_of_week_N_supp] ?? $permanent_supps[(string)$day_of_week_N_supp] ?? null;
                        if ($val !== null) {
                            if (is_array($val)) {
                                $daySupps = $val;
                            } else {
                                $daySupps['S'] = $val;
                            }
                        }
                    }
                    
                    foreach ($daySupps as $shiftKey => $codeToInsert) {
                        $stmtIns->execute([$agent_id, $new_d, $shiftKey, $codeToInsert, $company_id, $serviceKey, $next_period]);
                        $agent_inserted = true;
                        
                        if (strpos($codeToInsert, 'Suppl|') === 0) {
                            $parts = explode('|', $codeToInsert);
                            if (isset($parts[1])) {
                                $dest_id = $parts[1];
                                $site_id = $agent_sites[$agent_id] ?? 'unknown';
                                
                                // Fetch previous details
                                $stmt_prev  = $sqlite->prepare("SELECT date_supp, vacation, agent_remplace FROM supplementaires_externes WHERE agent_id = ? AND site_destination_id = ? AND company_id = ? ORDER BY date_supp DESC LIMIT 10");
        $stmt_prev->execute([$agent_id, $dest_id, resolveCurrentCompanyIdSql()]);
                                $prev_supps = $stmt_prev->fetchAll();
                                
                                $day_of_week_w = (int) (new DateTime($new_d))->format('w');
                                $prev_supp = null;
                                foreach ($prev_supps as $ps) {
                                    if (isset($ps['date_supp']) && (int) (new DateTime($ps['date_supp']))->format('w') === $day_of_week_w) {
                                        $prev_supp = $ps;
                                        break;
                                    }
                                }
                                
                                if (!$prev_supp && !empty($prev_supps)) {
                                    // Fallback to most recent
                                    $prev_supp = $prev_supps[0];
                                }
                                
                                $vacation = $shiftKey === 'SJ' ? 'Jour' : ($shiftKey === 'SN' ? 'Nuit' : ($prev_supp['vacation'] ?? 'Jour'));
                                $agent_remplace = $prev_supp['agent_remplace'] ?? '';
                                
                                // Clean up any existing duplicate to be safe
                                $sqlite->prepare('DELETE FROM supplementaires_externes WHERE agent_id = ? AND date_supp = ? AND site_destination_id = ? AND periode = ? AND vacation = ?')
                                       ->execute([$agent_id, $new_d, $dest_id, $next_period, $vacation]);
                                       
                                $sqlite->prepare('INSERT INTO supplementaires_externes (company_id, agent_id, site_origine_id, site_destination_id, date_supp, vacation, periode, agent_remplace) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                                       ->execute([$company_id, $agent_id, $site_id, $dest_id, $new_d, $vacation, $next_period, $agent_remplace]);
                            }
                        }
                    }
                }
            }

            // --- Copier les heures supplÃ©mentaires (S, SJ, SN) si le site est dans sites_to_keep_hs ---
            $site_id = $agent_sites[$agent_id] ?? null;
            if ($site_id && in_array($site_id, $sites_to_keep_hs)) {
                $hs_codes = ['S', 'SJ', 'SN'];
                foreach ($hs_codes as $hs_c) {
                    if (!empty($shifts[$hs_c])) {
                        if ($cycle > 0) {
                            // Rotative: Map by cycle phase
                            $hs_by_phase = [];
                            $old_start_phase = (($start_phase - $nb_old) % $cycle + $cycle) % $cycle;
                            for ($i = 0; $i < $nb_old; $i++) {
                                $old_d = $old_dates[$i];
                                if (isset($shifts[$hs_c][$old_d]) && $shifts[$hs_c][$old_d] !== '') {
                                    $phase = ($old_start_phase + $i) % $cycle;
                                    $hs_by_phase[$phase] = $shifts[$hs_c][$old_d];
                                }
                            }
                            
                            for ($i = 0; $i < count($new_dates); $i++) {
                                $new_d = $new_dates[$i];
                                $phase = ($start_phase + $i) % $cycle;
                                if (isset($hs_by_phase[$phase])) {
                                    $stmtIns->execute([$agent_id, $new_d, $hs_c, $hs_by_phase[$phase], $company_id, $serviceKey, $next_period, resolveCurrentCompanyIdSql()]);
                                    $agent_inserted = true;
                                }
                            }
                        } else {
                            // Jour/Nuit: Map by Day of Week
                            $hs_by_dow = [];
                            foreach ($old_dates as $old_d) {
                                if (isset($shifts[$hs_c][$old_d]) && $shifts[$hs_c][$old_d] !== '') {
                                    $dow = (int)(new DateTime($old_d))->format('w');
                                    $hs_by_dow[$dow] = $shifts[$hs_c][$old_d];
                                }
                            }
                            
                            for ($i = 0; $i < count($new_dates); $i++) {
                                $new_d = $new_dates[$i];
                                $dow = (int)(new DateTime($new_d))->format('w');
                                if (isset($hs_by_dow[$dow])) {
                                    $stmtIns->execute([$agent_id, $new_d, $hs_c, $hs_by_dow[$dow], $company_id, $serviceKey, $next_period, resolveCurrentCompanyIdSql()]);
                                    $agent_inserted = true;
                                }
                            }
                        }
                    }
                }
            }
            
            if (!$agent_inserted) {
                if (!in_array($agent_id, $agentsToArchive)) {
                    $agentsToArchive[] = $agent_id;
                }
            }
        }

        // Archiver les agents mutÃ©s sortants
        if (!empty($agentsToArchive)) {
            $inQuery = implode(',', array_fill(0, count($agentsToArchive), '?'));
            $stmtArch = $sqlite->prepare("UPDATE agents SET archived_period = ? WHERE id IN ($inQuery)");
            $params = array_merge([$next_period], $agentsToArchive);
            $stmtArch->execute($params);
        }

        // Appliquer les changements de statut en cours et nettoyer pour le mois suivant
        $stmtStatus  = $sqlite->prepare("SELECT id, status_change FROM agents WHERE service_id = ? AND archived_period IS NULL AND status_change IS NOT NULL AND status_change != '' AND company_id = ?");
        $stmtStatus->execute([$serviceKey, resolveCurrentCompanyIdSql()]);
        $status_rows = $stmtStatus->fetchAll();
        foreach ($status_rows as $row) {
            $scObj = json_decode($row['status_change'], true);
            if ($scObj && isset($scObj['new_function'])) {
                // On met Ã  jour la fonction avec la nouvelle, et on efface status_change
                $stmtUpdateSc = $sqlite->prepare("UPDATE agents SET `function` = ?, status_change = NULL WHERE id = ?");
                $stmtUpdateSc->execute([$scObj['new_function'], $row['id']]);
            }
        }

        // Nettoyer la balise de mutation (mutated_from_function) dans profile_data pour le mois suivant
        $stmtMut  = $sqlite->prepare("SELECT id, profile_data FROM agents WHERE service_id = ? AND archived_period IS NULL AND profile_data LIKE '%mutated_from_function%' AND company_id = ?");
        $stmtMut->execute([$serviceKey, resolveCurrentCompanyIdSql()]);
        $mut_rows = $stmtMut->fetchAll();
        foreach ($mut_rows as $row) {
            $profile = json_decode($row['profile_data'], true);
            if ($profile && isset($profile['mutated_from_function'])) {
                unset($profile['mutated_from_function']);
                $stmtUpdateMut = $sqlite->prepare("UPDATE agents SET profile_data = ? WHERE id = ?");
                $stmtUpdateMut->execute([json_encode($profile), $row['id']]);
            }
        }

        // â”€â”€ Sauvegarder le dernier mois initialisÃ© dans la base (utilisÃ© pour le verrou des mois futurs) â”€â”€
        setServiceDataSql($company_id, 'max_initialized_period', $next_period);

        echo json_encode(['success' => true]);
        break;

    case 'reset_year_attendance':
        $site_id = $data['site_id'] ?? null;
        $serviceKey = $_SESSION['service_id'] ?? null;
        $year = $data['year'] ?? '';

        if (!$site_id || !$serviceKey || !$year) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tres manquants']);
            break;
        }

        $sqlite = getDb();
        $likePattern = $year . '-%';

        // Trouver tous les sous-sites de ce site
        // Pour les sites spÃ©ciaux (site_extras, site_extras_sur_site, site_releves, site_administration), on doit inclure les sous-sites gÃ©nÃ©rÃ©s par dÃ©faut
        if ($site_id === 'site_extras') {
            $subsite_ids = ['site_extras_1'];
        } elseif ($site_id === 'site_extras_sur_site') {
            $stmtSub  = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ? AND company_id = ?");
        $stmtSub->execute([$site_id, resolveCurrentCompanyIdSql()]);
            $sub_rows = $stmtSub->fetchAll();
            $subsite_ids = array_map(fn($r) => array_values($r)[0], $sub_rows) ?: [];
        } elseif ($site_id === 'site_releves') {
            $subsite_ids = ['site_releves_1'];
        } elseif ($site_id === 'site_administration') {
            $subsite_ids = ['site_admin_1'];
        } else {
            $stmtSub  = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ? AND company_id = ?");
        $stmtSub->execute([$site_id, resolveCurrentCompanyIdSql()]);
            $sub_rows = $stmtSub->fetchAll();
            $subsite_ids = array_map(fn($r) => array_values($r)[0], $sub_rows) ?: [];
        }

        if (!empty($subsite_ids)) {
            $inQuery = implode(',', array_fill(0, count($subsite_ids), '?'));
            $params = array_merge([$serviceKey, $likePattern], $subsite_ids);

            // Supprimer tous les pointages de cette annÃ©e pour les agents de ces sous-sites
            $stmt = $sqlite->prepare("
                DELETE FROM attendance 
                WHERE service_id = ? 
                AND period LIKE ? 
                AND agent_id IN (SELECT id FROM agents WHERE subsite_id IN ($inQuery))
            ");
            $stmt->execute($params);

            // Supprimer les agents de ces sous-sites
            $stmtAgents = $sqlite->prepare("DELETE FROM agents WHERE subsite_id IN ($inQuery)");
            $stmtAgents->execute($subsite_ids);

            // Supprimer les sous-sites (zones) si ce n'est pas un site spÃ©cial
            if (!in_array($site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration'])) {
                $stmtSubsites = $sqlite->prepare("DELETE FROM subsites WHERE site_id = ?");
                $stmtSubsites->execute([$site_id]);
            }
        }

        // Supprimer toutes les archives de cette annÃ©e (historique)
        $stmtDelArch = $sqlite->prepare("DELETE FROM archives WHERE service_id = ? AND period LIKE ?");
        $stmtDelArch->execute([$serviceKey, $likePattern]);

        // Nettoyer Ã©galement l'historique dans la structure JSON hÃ©ritÃ©e
        $db = getScopedData($serviceKey);
        if (isset($db['archives'])) {
            $archives_updated = false;
            foreach ($db['archives'] as $arch_id => $arch_data) {
                if (strpos($arch_data['period'] ?? '', $year) === 0) {
                    unset($db['archives'][$arch_id]);
                    $archives_updated = true;
                }
            }
            if ($archives_updated) {
                saveScopedData($db, $serviceKey);
            }
        }

        echo json_encode(['success' => true]);
        break;

    case 'archive_all_sites':
        $period = $data['period'] ?? '';
        if (!$period || !preg_match('/^\d{4}-\d{2}$/', $period)) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode invalide: ' . $period]);
            break;
        }

        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        $company_id = resolveCurrentCompanyIdSql();
        $siteOrder = $data['siteOrder'] ?? [];

        $snapshot_sites = buildSiteDataSnapshot($sqlite, $serviceKey, $period, $siteOrder);

        // Supprimer l'ancienne archive pour cette pÃ©riode+service (Ã©viter les doublons et remplacer les archives vides)
        $stmtDel = $sqlite->prepare("DELETE FROM archives WHERE service_id = ? AND period = ? AND id NOT LIKE 'payroll_%'");
        $stmtDel->execute([$serviceKey, $period]);

        $archive_id = 'arch_' . time();
        $archive_data = [
            'id' => $archive_id,
            'period' => $period,
            'sites' => $snapshot_sites,
            'archived_at' => date('d/m/Y H:i'),
            'archived_by' => $_SESSION['user_name'],
            'sites_count' => count($snapshot_sites)
        ];

        $stmtArch = $sqlite->prepare('INSERT INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?)');
        $stmtArch->execute([$archive_id, $serviceKey, $company_id, $period, json_encode($archive_data)]);

        // Keep legacy sync for now until get_dashboard_init is rewritten
        $db = getScopedData($serviceKey);
        $db['archives'][$archive_id] = $archive_data;
        $db['published_periods'] = array_values(array_unique(array_merge($db['published_periods'] ?? [], [$period])));
        saveScopedData($db, $serviceKey);

        echo json_encode(['success' => true, 'sites_count' => count($snapshot_sites)]);
        break;


    case 'get_archives':
        $sqlite = getDb();
        $company_id = resolveCurrentCompanyIdSql();
        $stmt = $sqlite->prepare("SELECT id, service_id, period, data FROM archives WHERE company_id = ? AND id NOT LIKE 'payroll_%'");
        $stmt->execute([$company_id]);
        $results = $stmt->fetchAll();

        $archives = [];
        foreach ($results as $row) {
            $data = json_decode($row['data'], true) ?? [];
            $archives[] = [
                'id' => $row['id'],
                'period' => $row['period'],
                'service_id' => $row['service_id'],
                'archived_at' => $data['archived_at'] ?? '',
                'archived_by' => $data['archived_by'] ?? '',
                'sites_count' => count($data['sites'] ?? [])
            ];
        }
        // Sort by date (newest first)
        usort($archives, function ($a, $b) {
            return strcmp($b['id'], $a['id']);
        });
        echo json_encode($archives);
        break;

    case 'delete_leave':
        $leave_id = $data['leave_id'] ?? '';
        if ($leave_id) {
            // Delete from JSON scoped data (legacy)
            $db = getScopedData($serviceKey);
            $leaves = $db['leaves'] ?? [];
            $db['leaves'] = array_filter($leaves, function($l) use ($leave_id) { return $l['id'] !== $leave_id; });
            saveScopedData($db, $serviceKey);
            // Also delete from SQLite pointage_leaves (where save_leave actually stores)
            $sqlite = getDb();
            $sqlite->exec('CREATE TABLE IF NOT EXISTS pointage_leaves (id TEXT PRIMARY KEY, agent_id TEXT, start_date TEXT, end_date TEXT, type TEXT, status TEXT, company_id TEXT, service_id TEXT)');
            $stmt = $sqlite->prepare('DELETE FROM pointage_leaves WHERE id = ?');
            $stmt->execute([$leave_id]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'ID manquant']);
        }
        break;

    case 'get_sanctions':
        $db = getScopedData($serviceKey);
        $sanctions = $db['sanctions'] ?? [];
        echo json_encode(['success' => true, 'sanctions' => $sanctions]);
        break;

    case 'save_sanction':
        $sanction = $data['sanction'] ?? null;
        if ($sanction && isset($sanction['id'])) {
            $db = getScopedData($serviceKey);
            if (!isset($db['sanctions'])) $db['sanctions'] = [];
            // Remove existing if any
            $db['sanctions'] = array_filter($db['sanctions'], function($s) use ($sanction) { return $s['id'] !== $sanction['id']; });
            $db['sanctions'][] = $sanction;
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es invalides']);
        }
        break;

    case 'delete_sanction':
        $sanction_id = $data['sanction_id'] ?? '';
        if ($sanction_id) {
            $db = getScopedData($serviceKey);
            $sanctions = $db['sanctions'] ?? [];
            $db['sanctions'] = array_filter($sanctions, function($s) use ($sanction_id) { return $s['id'] !== $sanction_id; });
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es invalides']);
        }
        break;

    // --- AGENT PORTAL ENDPOINTS (No session required for register/login) ---
    case 'register_agent_portal':
        $matricule = $data['matricule'] ?? '';
        $nom = $data['nom'] ?? '';
        $phone = $data['phone'] ?? '';
        $pin = $data['pin'] ?? '';
        $dob = $data['dob'] ?? '';

        if (empty($pin)) {
            echo json_encode(['success' => false, 'message' => 'Le code PIN est obligatoire']);
            break;
        }

        $sqlite = getDb();

        // 1. Find agent in `agents` table â€” search GLOBALLY (no service filter)
        $foundAgent = null;
        if (!empty($matricule)) {
            $stmt = $sqlite->prepare("SELECT * FROM agents WHERE (id = ? OR matricule = ?) LIMIT 1");
            $stmt->execute([$matricule, $matricule]);
            $foundAgent = $stmt->fetch();
        } else if (!empty($nom)) {
            $stmt  = $sqlite->prepare("SELECT * FROM agents WHERE LOWER(name) LIKE LOWER(?) AND company_id = ? LIMIT 1");
        $stmt->execute(['%' . $nom . '%', resolveCurrentCompanyIdSql()]);
            $foundAgent = $stmt->fetch();
        }

        if (!$foundAgent) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable dans la base. VÃ©rifiez vos informations (nom exact tel qu\'il figure sur le planning).']);
            break;
        }

        $agent_id = $foundAgent['id'];
        $agent_service_id = $foundAgent['service_id'] ?? '';

        // 2. Verify Attendance in the last 3 months passed
        $months = [];
        for ($i = 1; $i <= 3; $i++) {
            $months[] = date('Y-m', strtotime("-$i months"));
        }
        $stmtPast  = $sqlite->prepare("SELECT COUNT(*) as count FROM attendance WHERE agent_id = ? AND period IN (?, ?, ?) AND company_id = ?");
        $stmtPast->execute([$agent_id, $months[0], $months[1], $months[2], resolveCurrentCompanyIdSql()]);
        $pastCount = $stmtPast->fetch();
        $hasPastAttendance = ($pastCount && $pastCount['count'] > 0);

        if (!$hasPastAttendance) {
            echo json_encode(['success' => false, 'message' => 'RefusÃ© : Aucun pointage trouvÃ© pour les 3 derniers mois passÃ©s.']);
            break;
        }

        // 3. Verify Attendance in the CURRENT month (OBLIGATOIRE)
        $currentPeriod = date('Y-m');
        $stmtAtt = $sqlite->prepare("SELECT COUNT(*) as count FROM attendance WHERE agent_id = ? AND period = ?");
        $stmtAtt->execute([$agent_id, $currentPeriod]);
        $attCount = $stmtAtt->fetch();
        $hasCurrentAttendance = ($attCount && $attCount['count'] > 0);

        if (!$hasCurrentAttendance) {
            echo json_encode(['success' => false, 'message' => 'RefusÃ© : Aucun pointage trouvÃ© pour le mois en cours (' . $currentPeriod . '). Veuillez contacter votre chef de site.']);
            break;
        }

        // 4. Save to agent_portal_users (SQLite)
        $sqlite = getDb();

        // Check if already registered
        $stmtChk = $sqlite->prepare('SELECT id FROM agent_portal_users WHERE agent_id = ?');
        $stmtChk->execute([$agent_id]);
        if ($stmtChk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Un compte existe dÃ©jÃ  ou est en attente pour cet agent.']);
            break;
        }

        $sqlite->prepare('
            INSERT INTO agent_portal_users (id, service_id, agent_id, name, matricule, phone, dob, pin, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ')->execute([
            'u_' . time() . '_' . rand(100,999),
            $agent_service_id,
            $agent_id,
            $foundAgent['name'],
            $foundAgent['matricule'] ?? $agent_id,
            $phone,
            $dob,
            password_hash($pin, PASSWORD_DEFAULT),
            'pending',
            date('Y-m-d H:i:s')
        ]);

        echo json_encode(['success' => true, 'message' => 'Inscription rÃ©ussie ! Votre compte est en attente de validation par le service Planning.']);
        break;

    case 'login_agent_portal':
        $matricule = $data['matricule'] ?? '';
        $pin = $data['pin'] ?? '';

        $sqlite = getDb();
        $stmtFind = $sqlite->prepare(
            'SELECT * FROM agent_portal_users WHERE matricule = ? OR phone = ? OR agent_id = ? OR LOWER(name) = LOWER(?)'
        );
        $stmtFind->execute([$matricule, $matricule, $matricule, $matricule]);
        $foundUser = $stmtFind->fetch();

        if (!$foundUser) {
            echo json_encode(['success' => false, 'message' => 'Identifiants introuvables. VÃ©rifiez votre matricule ou numÃ©ro de tÃ©lÃ©phone.']);
            break;
        }

        if (!password_verify($pin, $foundUser['pin'])) {
            echo json_encode(['success' => false, 'message' => 'Code PIN incorrect']);
            break;
        }

        if ($foundUser['status'] === 'pending') {
            echo json_encode(['success' => false, 'message' => 'Votre compte est en attente de validation par le service Planning. Veuillez patienter.']);
            break;
        } else if ($foundUser['status'] === 'rejected') {
            echo json_encode(['success' => false, 'message' => "Votre demande d'accÃ¨s a Ã©tÃ© refusÃ©e par l'administration. Contactez votre chef de site."]);
            break;
        }

        echo json_encode(['success' => true, 'agent_id' => $foundUser['agent_id'], 'name' => $foundUser['name']]);
        break;

    case 'get_portal_registrations':
        // This is called by ADMINS (who have a session), so use session service_id
        $adminServiceKey = $_SESSION['service_id'] ?? '';
        $role = $_SESSION['user_role'] ?? '';
        $sqlite = getDb();
        if ($role === 'super_admin') {
            $stmtReg = $sqlite->prepare('SELECT * FROM agent_portal_users ORDER BY created_at DESC');
            $stmtReg->execute([]);
        } else {
            $stmtReg = $sqlite->prepare('SELECT * FROM agent_portal_users WHERE service_id = ? ORDER BY created_at DESC');
            $stmtReg->execute([$adminServiceKey]);
        }
        $registrations = $stmtReg->fetchAll();
        echo json_encode(['success' => true, 'registrations' => $registrations]);
        break;

    case 'update_portal_registration':
        $user_id = $data['user_id'] ?? '';
        $status  = $data['status'] ?? '';
        $sqlite  = getDb();
        $stmtChk = $sqlite->prepare('SELECT id FROM agent_portal_users WHERE id = ?');
        $stmtChk->execute([$user_id]);
        if (!$stmtChk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Compte introuvable']);
            break;
        }
        $sqlite->prepare('UPDATE agent_portal_users SET status = ? WHERE id = ?')->execute([$status, $user_id]);
        echo json_encode(['success' => true]);
        break;

    // -----------------------------

    case 'get_archive_detail':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID manquant']);
            break;
        }

        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();

        if ($result && isset($result['data'])) {
            echo $result['data'];
        } else {
            // Fallback to JSON if not found in SQLite (for older archives not yet migrated fully)
            $db = getScopedData($serviceKey);
            if (isset($db['archives'][$id])) {
                echo json_encode($db['archives'][$id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
            }
        }
        break;

    case 'get_payroll_archives':
        $sqlite = getDb();
        $scope = $_GET['scope'] ?? 'service';
        $companyKey = $_SESSION['company_id'] ?? null;
        $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
        $target_val = ($scope === 'company') ? $companyKey : $serviceKey;

        $stmt = $sqlite->prepare("SELECT id, period, data FROM archives WHERE $target_col = ? AND id LIKE 'payroll_%'");
        $stmt->execute([$target_val]);
        $results = $stmt->fetchAll();

        $archives = [];
        foreach ($results as $row) {
            $data = json_decode($row['data'], true) ?? [];
            $archives[] = [
                'period' => $row['period'],
                'archived_at' => $data['archived_at'] ?? '',
                'archived_by' => $data['archived_by'] ?? ''
            ];
        }
        // Trier par pÃ©riode (plus rÃ©cent d'abord)
        usort($archives, function ($a, $b) {
            return strcmp($b['period'], $a['period']);
        });
        echo json_encode(['success' => true, 'archives' => $archives]);
        break;

    case 'get_payroll_archive_detail':
        $period = $_GET['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode manquante']);
            break;
        }

        $sqlite = getDb();
        $archive_id = 'payroll_' . $period;
        $scope = $_GET['scope'] ?? 'service';
        $companyKey = $_SESSION['company_id'] ?? null;
        $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
        $target_val = ($scope === 'company') ? $companyKey : $serviceKey;

        $stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = ? AND $target_col = ?");
        $stmt->execute([$archive_id, $target_val]);
        $result = $stmt->fetch();

        if ($result && isset($result['data'])) {
            $archiveData = json_decode($result['data'], true);
            
            // --- DEBUT FALLBACK ---
            $stmtProfiles = $sqlite->prepare("SELECT id, name, profile_data FROM agents WHERE company_id = ?");
            $stmtProfiles->execute([$companyKey]);
            $liveProfiles = [];
            $liveProfilesByName = [];
            while ($row = $stmtProfiles->fetch()) {
                $pd = $row['profile_data'] ? json_decode($row['profile_data'], true) : [];
                $liveProfiles[$row['id']] = $pd;
                if (!empty($pd['payment_method'])) {
                    $liveProfilesByName[strtolower(trim($row['name']))] = $pd;
                }
            }

            if (isset($archiveData['salaries']) && is_array($archiveData['salaries'])) {
                foreach ($archiveData['salaries'] as &$agentData) {
                    $hasPayment = !empty($agentData['profile_data']['payment_method']);
                    if (!$hasPayment) {
                        $nameKey = strtolower(trim($agentData['name'] ?? ''));
                        $fallback = null;
                        if (isset($liveProfiles[$agentData['id']]) && !empty($liveProfiles[$agentData['id']]['payment_method'])) {
                            $fallback = $liveProfiles[$agentData['id']];
                        } elseif (isset($liveProfilesByName[$nameKey])) {
                            $fallback = $liveProfilesByName[$nameKey];
                        }
                        
                        if ($fallback) {
                            if (!isset($agentData['profile_data']) || !is_array($agentData['profile_data'])) {
                                $agentData['profile_data'] = [];
                            }
                            $agentData['profile_data']['payment_method'] = $fallback['payment_method'];
                            $agentData['profile_data']['payment_operator'] = $fallback['payment_operator'] ?? null;
                            $agentData['profile_data']['payment_number'] = $fallback['payment_number'] ?? null;
                            $agentData['profile_data']['payment_rib'] = $fallback['payment_rib'] ?? null;
                            $agentData['profile_data']['payment_bank_name'] = $fallback['payment_bank_name'] ?? null;
                            $agentData['profile_data']['payment_phone'] = $fallback['payment_phone'] ?? null;
                            $agentData['profile_data']['payment_phone_prefix'] = $fallback['payment_phone_prefix'] ?? null;
                        }
                    }
                }
            }
            // --- FIN FALLBACK ---

            echo json_encode(['success' => true, 'archive' => $archiveData]);
        } else {
            // Fallback
            $db = getScopedData($serviceKey);
            if (isset($db['payroll_archives'][$period])) {
                echo json_encode(['success' => true, 'archive' => $db['payroll_archives'][$period]]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
            }
        }
        break;

    case 'delete_archive':
        requirePermission('dashboard');
        $id = $data['id'] ?? '';
        $db = getScopedData($serviceKey);
        if (isset($db['archives'][$id])) {
            unset($db['archives'][$id]);
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
        }
        break;

    case 'get_settings':
        $db = getScopedData($serviceKey);
        echo json_encode($db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20]);
        break;

    case 'save_settings':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $db = getScopedData($serviceKey);
        $db['settings'] = [
            'cycle_start' => (int) ($data['cycle_start'] ?? 21),
            'cycle_end' => (int) ($data['cycle_end'] ?? 20)
        ];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'clear_site_mutations':
        $site_id = (string) ($data['site_id'] ?? '');
        $period = $data['period'] ?? '';

        if (!$site_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es incomplÃ¨tes']);
            break;
        }

        $db = getScopedData($serviceKey);
        $target_site = null;
        foreach ($db['sites'] as $s) {
            if ((string) $s['id'] === $site_id) {
                $target_site = $s;
                break;
            }
        }

        if (!$target_site) {
            echo json_encode(['success' => false, 'message' => 'Site introuvable']);
            break;
        }

        // Collect all agent IDs for this site
        $agent_ids = [];
        if (isset($target_site['subsites'])) {
            foreach ($target_site['subsites'] as $sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as $agent) {
                        $agent_ids[] = $agent['id'];
                    }
                }
            }
        }

        if (isset($db['attendance'][$period])) {
            foreach ($agent_ids as $aid) {
                if (isset($db['attendance'][$period][$aid])) {
                    foreach (['J', 'N', 'S'] as $sc) {
                        if (isset($db['attendance'][$period][$aid][$sc])) {
                            foreach ($db['attendance'][$period][$aid][$sc] as $date => $status) {
                                if (is_string($status) && strpos($status, 'M|') === 0) {
                                    unset($db['attendance'][$period][$aid][$sc][$date]);
                                }
                            }
                        }
                    }
                }
            }
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;





    case 'update_payment_status':
        $companyKey = $_SESSION['company_id'] ?? null;
        $period = $data['period'] ?? '';
        $agent_id = $data['agent_id'] ?? '';
        $status = $data['status'] ?? 'pending';
        
        if (!$companyKey || !$period || !$agent_id) {
            echo json_encode(['success' => false, 'error' => 'Missing data']);
            break;
        }
        
        $sqlite = getDb();
        $sqlite->exec("CREATE TABLE IF NOT EXISTS salaries_payment_status (company_id VARCHAR(255), period VARCHAR(255), agent_id VARCHAR(255), status VARCHAR(255), PRIMARY KEY(company_id, period, agent_id))");
        
        $check = $sqlite->prepare("SELECT status FROM salaries_payment_status WHERE company_id = ? AND period = ? AND agent_id = ?");
        $check->execute([$companyKey, $period, $agent_id]);
        if ($check->fetch()) {
            $stmt = $sqlite->prepare("UPDATE salaries_payment_status SET status = ? WHERE company_id = ? AND period = ? AND agent_id = ?");
            $stmt->execute([$status, $companyKey, $period, $agent_id]);
        } else {
            $stmt = $sqlite->prepare("INSERT INTO salaries_payment_status (company_id, period, agent_id, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$companyKey, $period, $agent_id, $status]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'get_salaries':
        $period = $_GET['period'] ?? date('Y-m');
        $sqlite = getDb();
        
        // S'assurer que la table existe
        try {
            $sqlite->exec("CREATE TABLE IF NOT EXISTS salaries_payment_status (company_id VARCHAR(255), period VARCHAR(255), agent_id VARCHAR(255), status VARCHAR(255), PRIMARY KEY(company_id, period, agent_id))");
        } catch (Exception $e) {}
        
        $user_role = $_SESSION['user_role'] ?? '';
        $sqlite = getDb();
        $companyKey = $_SESSION['company_id'] ?? null;
        $period = $_GET['period'] ?? date('Y-m');
        $target_col = 'company_id';
        $target_val = $companyKey;
        $serviceKey = null;

        if (isset($_GET['scope']) && isset($_GET['scope_id'])) {
            $scope = $_GET['scope'];
            if ($scope === 'service') {
                $serviceKey = $_GET['scope_id'];
            }
            $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
            $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        }

        // Fetch live profiles for payment fallback
        $stmtProfiles = $sqlite->prepare("SELECT id, name, profile_data FROM agents WHERE company_id = ?");
        $stmtProfiles->execute([$companyKey]);
        $liveProfiles = [];
        $liveProfilesByName = [];
        while ($row = $stmtProfiles->fetch()) {
            $pd = $row['profile_data'] ? json_decode($row['profile_data'], true) : [];
            $liveProfiles[$row['id']] = $pd;
            if (!empty($pd['payment_method'])) {
                $liveProfilesByName[strtolower(trim($row['name']))] = $pd;
            }
        }

        $statuses = [];
        try {
            $stmtStatus = $sqlite->prepare("SELECT agent_id, status FROM salaries_payment_status WHERE company_id = ? AND period = ?");
            $stmtStatus->execute([$companyKey, $period]);
            while ($r = $stmtStatus->fetch()) $statuses[$r['agent_id']] = $r['status'];
        } catch (Exception $e) {}

        $applyFallback = function(&$salariesData, $isArchive = false) use ($liveProfiles, $liveProfilesByName, $statuses) {
            foreach ($salariesData as &$agentData) {
                // Pour les archives, on ne veut PAS appliquer le fallback des moyens de paiement
                // afin de conserver la stricte version historique.
                if (!$isArchive) {
                    $hasPayment = !empty($agentData['profile_data']['payment_method']);
                    if (!$hasPayment) {
                        $nameKey = strtolower(trim($agentData['name'] ?? ''));
                        $fallback = null;
                        if (isset($liveProfiles[$agentData['id']]) && !empty($liveProfiles[$agentData['id']]['payment_method'])) {
                            $fallback = $liveProfiles[$agentData['id']];
                        } elseif (isset($liveProfilesByName[$nameKey])) {
                            $fallback = $liveProfilesByName[$nameKey];
                        }
                        
                        if ($fallback) {
                            if (!isset($agentData['profile_data']) || !is_array($agentData['profile_data'])) {
                                $agentData['profile_data'] = [];
                            }
                            $agentData['profile_data']['payment_method'] = $fallback['payment_method'];
                            $agentData['profile_data']['payment_operator'] = $fallback['payment_operator'] ?? null;
                            $agentData['profile_data']['payment_number'] = $fallback['payment_number'] ?? null;
                            $agentData['profile_data']['payment_rib'] = $fallback['payment_rib'] ?? null;
                            $agentData['profile_data']['payment_bank_name'] = $fallback['payment_bank_name'] ?? null;
                            $agentData['profile_data']['payment_phone'] = $fallback['payment_phone'] ?? null;
                            $agentData['profile_data']['payment_phone_prefix'] = $fallback['payment_phone_prefix'] ?? null;
                        }
                    }
                }
                // Le statut de paiement (payÃ©, en attente, etc.) est par contre spÃ©cifique Ã  la pÃ©riode
                $agentData['payment_status'] = $statuses[$agentData['id']] ?? 'pending';
            }
            unset($agentData);
        };

        // â”€â”€â”€ FREEZE : Si la pÃ©riode est CLÃ”TURÃ‰E (archivÃ©e), servir le snapshot gelÃ© â”€â”€â”€â”€â”€â”€â”€
        if (isPayrollArchived($sqlite, $companyKey, $period)) {
            $snapshot = getPayrollSnapshot($sqlite, $companyKey, $period);
            if ($snapshot !== null) {
                $applyFallback($snapshot, true); // true = isArchive
                echo json_encode($snapshot);
                break;
            }
            
            $salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);
            savePayrollSnapshot($sqlite, $companyKey, $period, $salaries, $serviceKey);
            $applyFallback($salaries, true); // true = isArchive car on vient de la gÃ©nÃ©rer pour une pÃ©riode clÃ´turÃ©e
            echo json_encode($salaries);
            break;
        }

        // â”€â”€â”€ PÃ©riode non publiÃ©e : calcul dynamique normal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);
        $applyFallback($salaries);
        echo json_encode($salaries);
        break;

    case 'get_payroll_init':
        $sqlite = getDb();
        $user_role = $_SESSION['user_role'] ?? '';
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $period = $_GET['period'] ?? date('Y-m');

        if (strpos($user_role, 'admin') !== false || strpos($user_service, 'compta') !== false || strpos($user_service, 'rh') !== false) {
            $target_col = 'company_id';
            $target_val = $companyKey;
        } else {
            $scope = $_GET['scope'] ?? 'service';
            $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
            $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        }

        // Fetch sites
        $stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ? AND source_module != 'FACTURATION'");
        $stmtSites->execute([$target_val]);
        $sites_rows = $stmtSites->fetchAll();

        $has_extras = false;
        $has_releves = false;
        $has_admin = false;
        $has_itc = false;
        foreach ($sites_rows as $s) {
            if ($s['id'] === 'site_extras') $has_extras = true;
            if ($s['id'] === 'site_releves') $has_releves = true;
            if ($s['id'] === 'site_administration') $has_admin = true;
            if ($s['id'] === 'site_itc') $has_itc = true;
        }
        
        if (!$has_extras) $sites_rows[] = ['id' => 'site_extras', 'name' => 'ðŸŒŸ EXTRA BUREAU'];
        if (!$has_releves) $sites_rows[] = ['id' => 'site_releves', 'name' => 'ðŸ”„ Vivier des relÃ¨ves'];
        if (!array_filter($sites_rows, fn($s) => $s['id'] === 'site_extras_sur_site')) {
            $sites_rows[] = ['id' => 'site_extras_sur_site', 'name' => 'ðŸŒŸ EXTRA SUR SITE'];
        }
        if (!$has_admin) $sites_rows[] = ['id' => 'site_administration', 'name' => 'ðŸ¢ Administration'];
        if (!$has_itc) $sites_rows[] = ['id' => 'site_itc', 'name' => 'ITC / IFM'];

        $lightweightSalaries = [];

        foreach ($sites_rows as $site) {
            $stmtSub2  = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND company_id = ?");
        $stmtSub2->execute([$site['id'], resolveCurrentCompanyIdSql()]);
            $subsites_rows = $stmtSub2->fetchAll();

            if (in_array($site['id'], ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc']) && empty($subsites_rows)) {
                if ($site['id'] === 'site_extras') $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_extras_sur_site') $subsites_rows = [['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale']];
                if ($site['id'] === 'site_releves') $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration') $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                if ($site['id'] === 'site_itc') {
                    $comp_suffix = substr(preg_replace('/[^a-z0-9]/', '', strtolower($companyKey ?? '')), 0, 12);
                    $subsites_rows = [
                        ['id' => 'itc_tenue_' . $comp_suffix, 'name' => 'Tenue RÃ©guliÃ¨re'],
                        ['id' => 'itc_costume_' . $comp_suffix, 'name' => 'Costume'],
                        ['id' => 'itc_ots_' . $comp_suffix, 'name' => 'OTS'],
                        ['id' => 'itc_special_' . $comp_suffix, 'name' => 'Agent SpÃ©cial']
                    ];
                }
            }
            
            if ($site['id'] === 'site_extras_sur_site') {
                $has_default = false;
                foreach ($subsites_rows as $sr) {
                    if ($sr['id'] === 'default_site_extras_sur_site') { $has_default = true; break; }
                }
                if (!$has_default) $subsites_rows[] = ['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale'];
            }

            foreach ($subsites_rows as $sub) {
                $stmtAg2 = $sqlite->prepare(
                    "SELECT id, name FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period = '' OR archived_period >= ?) ORDER BY name"
                );
                $stmtAg2->execute([$sub['id'], $target_val, $period]);
                $agents_rows = $stmtAg2->fetchAll();

                foreach ($agents_rows as $a) {
                    $lightweightSalaries[] = [
                        'id' => $a['id'],
                        'name' => $a['name'],
                        'site' => $site['name'],
                        'subsite' => $sub['name'],
                        'is_lightweight' => true
                    ];
                }
            }
        }
        
        echo json_encode(['success' => true, 'salaries' => $lightweightSalaries]);
        break;


    case 'get_dashboard_history':
        $period = $_GET['period'] ?? date('Y-m');
        $sqlite = getDb();
        $user_role = $_SESSION['user_role'] ?? '';
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? null;

        if (strpos($user_role, 'admin') !== false || strpos($user_service, 'compta') !== false || strpos($user_service, 'rh') !== false) {
            $target_col = 'company_id';
            $target_val = $companyKey;
        } else {
            $scope = $_GET['scope'] ?? 'service';
            $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
            $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        }

        $months = [];
        $baseDate = DateTime::createFromFormat('Y-m-d', $period . '-01');
        if ($baseDate) {
            for ($i = 5; $i >= 0; $i--) {
                $d = clone $baseDate;
                $d->modify("-$i month");
                $months[] = $d->format('Y-m');
            }
        }

        $published = getServiceDataSql($companyKey, 'published_periods', []);
        if (!is_array($published)) {
            $published = [];
        }
        
        $results = [];
        foreach ($months as $m) {
            $totalMasse = 0;
            $found_in_db = false;
            
            // 1. Check Archives
            $archive_id = 'payroll_' . $m;
            $stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = ? AND $target_col = ?");
            $stmt->execute([$archive_id, $target_val]);
            $row = $stmt->fetch();
            if ($row && isset($row['data'])) {
                $archive = json_decode($row['data'], true);
                if (isset($archive['salaries']) && is_array($archive['salaries'])) {
                    foreach ($archive['salaries'] as $s) {
                        $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                    }
                    $found_in_db = true;
                }
            }
            
            // 2. Check Snapshots (if published but not archived)
            if (!$found_in_db && in_array($m, $published)) {
                $snapData = getPayrollSnapshot($sqlite, $companyKey, $m);
                if (is_array($snapData)) {
                    foreach ($snapData as $s) {
                        $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                    }
                    $found_in_db = true;
                }
            }
            
            // 3. Fallback to Live Data
            if (!$found_in_db) {
                // Si on analyse le mois actuellement sÃ©lectionnÃ© sur l'interface, on simule la paie en direct.
                // Sinon (mois passÃ©s), on ne simule pas de fausses donnÃ©es : la masse salariale est 0.
                if ($m === $period) {
                    $salaries = generateSalariesData($sqlite, $m, $companyKey, $target_col, $target_val, $serviceKey);
                    foreach ($salaries as $s) {
                        $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                    }
                } else {
                    $totalMasse = 0;
                }
            }
            
            $results[] = ['period' => $m, 'total' => $totalMasse];
        }
        echo json_encode(['success' => true, 'history' => $results]);
        break;

    case 'save_reclamation':
        $sqlite = getDb();
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }
        
        $id = $data['id'] ?? null;
        $agent_id = $data['agent_id'] ?? '';
        $motif = $data['motif'] ?? '';
        $jours = (float)($data['jours'] ?? 0);
        $dates = $data['dates'] ?? '';
        $montant = (float)($data['montant'] ?? 0);
        $agent_name = $data['agent_name'] ?? '';
        $period = $data['period'] ?? '';
        $type_erreur_autre = $data['type_erreur_autre'] ?? '';
        
        try {
            $desc = json_encode([
                'agent_id' => $agent_id,
                'period' => $period,
                'dates' => $dates,
                'jours' => $jours,
                'montant' => $montant
            ]);
            
            if ($id) {
                // UPDATE
                $stmt = $sqlite->prepare("
                    UPDATE reclamations SET
                        agent_nom = ?, agent_matricule = ?,
                        reclamation_categorie = ?, jours_concernes = ?, montant_estime = ?,
                        description = ?, type_erreur_autre = ?
                    WHERE id = ? AND company_id = ?
                ");
                $stmt->execute([
                    $agent_name, $agent_id,
                    $motif, $jours, $montant,
                    $desc, $type_erreur_autre,
                    $id, $companyKey
                ]);
            } else {
                // INSERT
                $id = 'rec_' . time() . '_' . rand(100, 999);
                $stmt = $sqlite->prepare("
                    INSERT INTO reclamations (
                        id, company_id, agent_nom, agent_matricule, 
                        reclamation_categorie, type_erreur, jours_concernes, montant_estime, 
                        mois_concerne, statut, description, type_erreur_autre
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $id, $companyKey, $agent_name, $agent_id, 
                    $motif, $motif, $jours, $montant, 
                    $period, 'ClÃ´turÃ©', $desc, $type_erreur_autre
                ]);
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur base de donnÃ©es: ' . $e->getMessage()]);
        }
        break;

    case 'update_agent_salary':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $salary = (int) ($data['salary'] ?? 0);

        $sqlite = getDb();
        $company_id_sal = $_SESSION['company_id'] ?? 'comp_default_1';

        // On cherche le nom de l'agent dans le registre
        $stmtAgName = $sqlite->prepare("SELECT name FROM agents WHERE id = ? AND company_id = ? LIMIT 1");
        $stmtAgName->execute([$agent_id, $company_id_sal]);
        $agRow = $stmtAgName->fetch(PDO::FETCH_ASSOC);

        if ($agRow) {
            // Mise à jour dans la table dédiée special_agents (plus dans agents!)
            $stmtSpCheck = $sqlite->prepare("SELECT id FROM special_agents WHERE name LIKE ? AND company_id = ? LIMIT 1");
            $stmtSpCheck->execute([$agRow['name'], $company_id_sal]);
            $spExists = $stmtSpCheck->fetch();
            if ($spExists) {
                $sqlite->prepare("UPDATE special_agents SET salary = ? WHERE name LIKE ? AND company_id = ?")
                       ->execute([$salary, $agRow['name'], $company_id_sal]);
            } else {
                $sqlite->prepare("INSERT INTO special_agents (id, company_id, name, salary) VALUES (?, ?, ?, ?)")
                       ->execute([uniqid('agt_sp_'), $company_id_sal, $agRow['name'], $salary]);
            }
        }

        $db = getScopedData($serviceKey);
        $found = false;
        foreach ($db['sites'] as &$site) {
            if (!isset($site['subsites']))
                continue;
            foreach ($site['subsites'] as &$sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as &$agent) {
                        if ($agent['id'] == $agent_id) {
                            $agent['salary'] = $salary;
                            $found = true;
                            break 3;
                        }
                    }
                }
            }
        }
        if ($found) {
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;


    case 'get_payroll_settings':
        $companyKey = $_SESSION['company_id'] ?? null;
        $targetKey = 'company::' . $companyKey;
        $settings = getServiceDataSql($targetKey, 'payroll_settings', null);
        // Fallback for older configs
        if (empty($settings)) {
            $settings = getServiceDataSql($companyKey, 'payroll_settings', []);
        }
        $settings = $settings ?: [
            'cnps_salarial' => 0, // %
            'cnps_patronal' => 0, // % (retraite)
            'its' => 0, // % (approximatif pour la part fixe)
            'fdfp' => 0 // %
        ];
        echo json_encode(['success' => true, 'settings' => $settings]);
        break;

    case 'save_payroll_settings':
        $user_role = $_SESSION['user_role'] ?? '';
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        if ($user_role !== 'admin' && strpos($user_service, 'compta') === false && strpos($user_service, 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©. Seuls les RH, Comptables et Admins peuvent modifier ces paramÃ¨tres.']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $targetKey = 'company::' . $companyKey;
        
        setServiceDataSql($targetKey, 'payroll_settings', $data['settings'] ?? []);
        
        echo json_encode(['success' => true]);
        break;

    case 'upload_company_logo':
        if (($_SESSION['user_role'] ?? '') != 'admin') {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $targetKey = 'company::' . $companyKey;
        
        $settings = getServiceDataSql($targetKey, 'payroll_settings', []);
        $settings['company_logo'] = $data['logo_base64'] ?? '';
        setServiceDataSql($targetKey, 'payroll_settings', $settings);
        
        echo json_encode(['success' => true]);
        break;

    case 'get_annual_cumuls':
        $agent_id = $_GET['agent_id'] ?? '';
        $year = $_GET['year'] ?? date('Y');
        $sqlite = getDb();
        $company_id = resolveCurrentCompanyIdSql();
        
        $stmt = $sqlite->prepare("SELECT data FROM payslips WHERE agent_id = ? AND period LIKE ? AND company_id = ?");
        $stmt->execute([$agent_id, "$year-%", $company_id]);
        $slips = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $cumuls = [
            'base_salary' => 0,
            'brut' => 0,
            'cnps' => 0,
            'its' => 0,
            'net' => 0,
            'prime_panier' => 0,
            'prime_transport' => 0
        ];
        foreach ($slips as $slipJson) {
            $slip = json_decode($slipJson, true);
            if ($slip) {
                $cumuls['base_salary'] += $slip['base_salary'] ?? 0;
                $cumuls['brut'] += $slip['brut_total'] ?? 0;
                $cumuls['cnps'] += $slip['retenue_cnps'] ?? 0;
                $cumuls['its'] += $slip['retenue_its'] ?? 0;
                $cumuls['net'] += $slip['net_payer'] ?? 0;
                $cumuls['prime_panier'] += $slip['prime_panier'] ?? 0;
                $cumuls['prime_transport'] += $slip['prime_transport'] ?? 0;
            }
        }
        echo json_encode(['success' => true, 'cumuls' => $cumuls]);
        break;

    case 'get_payroll_variables':
        $period = $_GET['period'] ?? date('Y-m');
        $db = getScopedData($serviceKey);
        $variables = $db['payroll_variables_' . $period] ?? [];
        echo json_encode(['success' => true, 'variables' => $variables]);
        break;

    case 'save_payroll_variables':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'compta') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode manquante']);
            break;
        }
        $db = getScopedData($serviceKey);
        $db['payroll_variables_' . $period] = $data['variables'] ?? [];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'get_payroll_loans':
        $period = $_GET['period'] ?? date('Y-m');
        $company_id = resolveCurrentCompanyIdSql();
        $sqlite = getDb();
        
        $stmt = $sqlite->prepare("SELECT * FROM agent_loans WHERE company_id = ? ORDER BY created_at DESC");
        $stmt->execute([$company_id]);
        $loans = $stmt->fetchAll();
        
        // Check PC pointage and exit status
        foreach ($loans as &$loan) {
            $stmtAtt = $sqlite->prepare("SELECT att.id FROM attendance att JOIN agents ag ON att.agent_id = ag.id WHERE ag.name LIKE ? AND att.period = ? AND att.company_id = ? LIMIT 1");
            $stmtAtt->execute([$loan['agent_name'], $period, $company_id]);
            $loan['is_pointed'] = $stmtAtt->fetch() ? true : false;
            
            $stmtExit = $sqlite->prepare("SELECT exit_date FROM agents WHERE name LIKE ? AND company_id = ? AND exit_date IS NOT NULL LIMIT 1");
            $stmtExit->execute([$loan['agent_name'], $company_id]);
            $exitCheck = $stmtExit->fetch();
            $loan['has_exited'] = $exitCheck ? true : false;
            $loan['exit_date'] = $exitCheck ? $exitCheck['exit_date'] : null;
        }
        
        echo json_encode(['success' => true, 'loans' => $loans]);
        break;

    case 'add_payroll_loan':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'compta') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $company_id = resolveCurrentCompanyIdSql();
        $sqlite = getDb();
        
        $id = 'loan_' . time() . rand(1000, 9999);
        $agent_name = $data['agent_name'] ?? '';
        $agent_id = $data['agent_id'] ?? '';
        $agent_function = $data['agent_function'] ?? '';
        $amount = intval($data['amount'] ?? 0);
        $motif = $data['motif'] ?? '';
        $date_granted = $data['date_granted'] ?? date('Y-m-d');
        $monthly_deduction = intval($data['monthly_deduction'] ?? 0);
        $start_period = $data['start_period'] ?? date('Y-m');
        
        $already_paid = intval($data['already_paid'] ?? 0);
        
        $stmt = $sqlite->prepare("INSERT INTO agent_loans (id, company_id, agent_name, agent_id, agent_function, total_amount, motif, date_granted, monthly_deduction, start_period, already_paid, remaining_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $remaining = max(0, $amount - $already_paid);
        $stmt->execute([$id, $company_id, $agent_name, $agent_id, $agent_function, $amount, $motif, $date_granted, $monthly_deduction, $start_period, $already_paid, $remaining]);
        
        echo json_encode(['success' => true, 'loan_id' => $id]);
        break;
        
    case 'delete_payroll_loan':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'compta') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $sqlite = getDb();
        $loan_id = $data['loan_id'] ?? '';
        $stmt = $sqlite->prepare("DELETE FROM agent_loans WHERE id = ?");
        $stmt->execute([$loan_id]);
        echo json_encode(['success' => true]);
        break;

    case 'update_agent_contract':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $contract_data = $data['contract_data'] ?? [];
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent non spÃ©cifiÃ©']);
            break;
        }
        $sqlite = getDb();
        $stmt  = $sqlite->prepare("SELECT profile_data FROM agents WHERE id = ? AND company_id = ?");
        $stmt->execute([$agent_id, resolveCurrentCompanyIdSql()]);
        $agent = $stmt->fetch();
        if ($agent) {
            $prof = json_decode($agent['profile_data'], true) ?: [];
            foreach ($contract_data as $k => $v) {
                $prof[$k] = $v;
            }
            $upd = $sqlite->prepare("UPDATE agents SET profile_data = ? WHERE id = ?");
            $upd->execute([json_encode($prof), $agent_id]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;

    case 'get_leaves':
        $sqlite = getDb();
        $company_id_local = $_SESSION['company_id'] ?? '';
        $sqlite->exec('CREATE TABLE IF NOT EXISTS pointage_leaves (id TEXT PRIMARY KEY, agent_id TEXT, start_date TEXT, end_date TEXT, type TEXT, status TEXT, company_id TEXT, service_id TEXT)');
        $sqlite->exec("DELETE FROM pointage_leaves WHERE start_date = end_date AND start_date LIKE '%-01'"); // Auto-cleanup des congÃ©s buggÃ©s
        $stmt = $sqlite->prepare("SELECT * FROM pointage_leaves WHERE company_id = ?");
        $stmt->execute([$company_id_local]);
        $leaves = $stmt->fetchAll() ?: [];
        echo json_encode(['success' => true, 'leaves' => $leaves]);
        break;
        
    case 'dump_leaves':
        $sqlite = getDb();
        $stmt = $sqlite->query("SELECT * FROM pointage_leaves");
        echo json_encode(['success' => true, 'leaves' => $stmt->fetchAll()]);
        break;

    case 'save_leave':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'pc') === false && !hasPermission('dashboard')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $leave = $data['leave'] ?? null;
        if (!$leave || empty($leave['id'])) {
            echo json_encode(['success' => false, 'message' => 'DonnÃ©es de congÃ© manquantes']);
            break;
        }
        $sqlite = getDb();
        $serviceKey = resolveCurrentServiceKeySql();
        $sqlite->exec('CREATE TABLE IF NOT EXISTS pointage_leaves (id VARCHAR(255) PRIMARY KEY, agent_id VARCHAR(255), start_date VARCHAR(255), end_date VARCHAR(255), type VARCHAR(255), status VARCHAR(255), company_id VARCHAR(255), service_id VARCHAR(255))');
        try { $sqlite->exec("ALTER TABLE pointage_leaves ADD COLUMN created_at VARCHAR(255)"); } catch (Exception $e) {}
        
        $created_at = $leave['created_at'] ?? date('Y-m-d H:i:s');
        $stmt = $sqlite->prepare("INSERT INTO pointage_leaves (id, agent_id, start_date, end_date, type, status, company_id, service_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE start_date=VALUES(start_date), end_date=VALUES(end_date), type=VALUES(type), status=VALUES(status), company_id=VALUES(company_id)");
        $company_id_local = $_SESSION['company_id'] ?? '';
        $stmt->execute([
            $leave['id'],
            $leave['agent_id'],
            $leave['start_date'],
            $leave['end_date'],
            $leave['type'] ?? 'CP',
            $leave['status'] ?? 'approved',
            $company_id_local,
            $serviceKey,
            $created_at
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_leave':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'pc') === false && !hasPermission('dashboard')) {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $leave_id = $data['leave_id'] ?? '';
        $sqlite = getDb();
        $serviceKey = resolveCurrentServiceKeySql();
        $sqlite->exec('CREATE TABLE IF NOT EXISTS pointage_leaves (id TEXT PRIMARY KEY, agent_id TEXT, start_date TEXT, end_date TEXT, type TEXT, status TEXT, company_id TEXT, service_id TEXT)');
        $stmt = $sqlite->prepare("DELETE FROM pointage_leaves WHERE id = ? AND service_id = ?");
        $stmt->execute([$leave_id, $serviceKey]);
        echo json_encode(['success' => true]);
        break;

    case 'get_salary_config':
        $db = getScopedData($serviceKey);
        $functions = $db['functions'] ?? [
            ['id' => 'AS', 'name' => 'Agent Simple'],
            ['id' => 'GA', 'name' => 'Garde ArmÃ©'],
            ['id' => 'MC', 'name' => 'MaÃ®tre-Chien'],
            ['id' => 'CP', 'name' => 'Chef de Poste'],
            ['id' => 'Costume', 'name' => 'Agent en Costume']
        ];

        $config = $db['salary_config'] ?? [];
        // Ensure all current functions have a default entry if missing
        foreach ($functions as $f) {
            if (!isset($config[$f['id']])) {
                $config[$f['id']] = 75000;
            }
        }
        echo json_encode($config);
        break;

    case 'update_salary_config':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'AccÃ¨s refusÃ©']);
            break;
        }
        $db = getScopedData($serviceKey);
        $db['salary_config'] = $data['config'] ?? [];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;


    case 'dev_unpublish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode manquante']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }

        $published = getServiceDataSql($companyKey, 'published_periods', []);
        $new_published = array_values(array_filter($published, function($p) use ($period) {
            return $p !== $period;
        }));

        setServiceDataSql($companyKey, 'published_periods', $new_published);

        // Si le service est aussi enregistrÃ©, le dÃ©publier localement (optionnel mais recommandÃ©)
        $serviceKey = $_SESSION['service_id'] ?? null;
        if ($serviceKey) {
            $publishedSvc = getServiceDataSql($serviceKey, 'published_periods', []);
            $new_publishedSvc = array_values(array_filter($publishedSvc, function($p) use ($period) {
                return $p !== $period;
            }));
            setServiceDataSql($serviceKey, 'published_periods', $new_publishedSvc);
        }

        echo json_encode(['success' => true, 'message' => 'PÃ©riode dÃ©publiÃ©e']);
        break;
    case 'publish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode manquante']);
            break;
        }
        $companyKey = resolveCurrentCompanyIdSql();
        $serviceName = $_SESSION['user_service'] ?? 'Un service';
        $serviceKey = $_SESSION['service_id'] ?? null;

        $published = getServiceDataSql($companyKey, 'published_periods', []);
        
        // --- AUTO-ARCHIVING LOGIC (PAYROLL) ---
        $sqlite = getDb();
        $stmtArch = $sqlite->prepare("SELECT id FROM archives WHERE company_id = ? AND id LIKE 'payroll_%'");
        $stmtArch->execute([$companyKey]);
        $archived_rows = $stmtArch->fetchAll();
        $archived_periods = array_map(function ($r) { return substr($r['id'], 8); }, $archived_rows);
        
        foreach ($published as $pub_period) {
            if (strcmp($pub_period, $period) < 0 && !in_array($pub_period, $archived_periods)) {
                $salaries = generateSalariesData($sqlite, $pub_period, $companyKey, 'company_id', $companyKey, $serviceKey);
                $stmtSites = $sqlite->prepare("SELECT id, name FROM sites WHERE company_id = ?");
                $stmtSites->execute([$companyKey]);
                $sites = $stmtSites->fetchAll(PDO::FETCH_ASSOC);
                
                $has_extras = false;
                $has_extras_sur_site = false;
                $has_releves = false;
                $has_admin = false;
                foreach ($sites as $s) {
                    if ($s['id'] === 'site_extras') $has_extras = true;
                    if ($s['id'] === 'site_extras_sur_site') $has_extras_sur_site = true;
                    if ($s['id'] === 'site_releves') $has_releves = true;
                    if ($s['id'] === 'site_administration') $has_admin = true;
                }
                if (!$has_extras) $sites[] = ['id' => 'site_extras', 'name' => 'ðŸŒŸ EXTRA BUREAU'];
                if (!$has_extras_sur_site) $sites[] = ['id' => 'site_extras_sur_site', 'name' => 'ðŸŒŸ EXTRA SUR SITE'];
                if (!$has_releves) $sites[] = ['id' => 'site_releves', 'name' => 'ðŸ”„ Vivier des relÃ¨ves'];
                if (!$has_admin) $sites[] = ['id' => 'site_administration', 'name' => 'ðŸ¢ Administration'];
                
                $archive = [
                    'period' => $pub_period,
                    'archived_at' => date('Y-m-d H:i:s'),
                    'archived_by' => 'Auto-Archivage (PC)',
                    'salaries' => $salaries,
                    'statuses' => [],
                    'sites' => $sites
                ];
                $archive_id = 'payroll_' . $pub_period;
                $stmtIns = $sqlite->prepare("REPLACE INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?)");
                $stmtIns->execute([$archive_id, $serviceKey, $companyKey, $pub_period, json_encode($archive)]);
            }
        }
        // --- END AUTO-ARCHIVING LOGIC (PAYROLL) ---

        // --- FLUCTUATION AUTO-ARCHIVING & WORKFLOW ---
        try {
            $prevDate = new DateTime($period . '-01');
            $prevDate->modify('-1 month');
            $prevPeriod = $prevDate->format('Y-m');
            closeFluctuationForPeriod($companyKey, $prevPeriod, 'Auto-Archivage (PC)');
        } catch (Exception $e) {}

        // Assigner le statut de fluctuation de la pÃ©riode actuelle Ã  pending_compta
        setServiceDataSql($companyKey, 'fluctuation_status_' . $period, 'pending_compta');
        // --- END FLUCTUATION WORKFLOW ---

        if (!in_array($period, $published)) {
            $published[] = $period;
            setServiceDataSql($companyKey, 'published_periods', $published);
        }

        $pubData = [
            'period' => $period,
            'service_name' => $serviceName,
            'service_id' => $serviceKey,
            'timestamp' => time()
        ];
        setServiceDataSql($companyKey, 'latest_publication', $pubData);

        // Ajouter l'Ã©vÃ©nement de publication Ã  l'historique
        $pubHistoryData = [
            'period' => $period,
            'service_name' => $serviceName,
            'type' => 'publish',
            'publisher_service_id' => $serviceKey,
            'timestamp' => time()
        ];
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        array_unshift($history, $pubHistoryData); // Ajouter au dÃ©but
        if (count($history) > 50)
            $history = array_slice($history, 0, 50);
        setServiceDataSql($companyKey, 'feedback_history', $history);

        // Toute modification ultÃ©rieure du pointage n'affectera pas ces donnÃ©es.
        $snapshotSalaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
        savePayrollSnapshot($sqlite, $companyKey, $period, $snapshotSalaries, $serviceKey);
        // â”€â”€â”€ FIN FREEZE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        // ARCHIVE POINTAGE : SQL direct, aucun HTTP interne, aucun deadlock
        try {
            if (!function_exists('internal_build_pointage_archive_direct')) {
                require_once __DIR__ . '/../core/archive_helper.php';
            }
            $archData = internal_build_pointage_archive_direct($sqlite, $companyKey, $period);
            $compressedArch = base64_encode(gzcompress(json_encode($archData), 9));
            $nowArch = date('Y-m-d H:i:s');
            $archivedByArch = $_SESSION['user_id'] ?? 'Auto-Publication';
            $stmtArchExist = $sqlite->prepare('SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?');
            $stmtArchExist->execute([$companyKey, $period]);
            $archExistId = $stmtArchExist->fetchColumn();
            if ($archExistId) {
                $stmtArchUp = $sqlite->prepare('UPDATE archives_pointage SET data = ?, archived_date = ?, archived_by = ?, created_at = ? WHERE id = ?');
                $stmtArchUp->execute([$compressedArch, $nowArch, $archivedByArch, $nowArch, $archExistId]);
            } else {
                $stmtArchIns = $sqlite->prepare('INSERT INTO archives_pointage (company_id, period, archived_date, archived_by, data, created_at) VALUES (?, ?, ?, ?, ?, ?)');
                $stmtArchIns->execute([$companyKey, $period, $nowArch, $archivedByArch, $compressedArch, $nowArch]);
            }
        } catch (Exception $eArch) {
            error_log('[archive_pointage_publish] Non-blocking: ' . $eArch->getMessage());
        }

        echo json_encode(['success' => true, 'snapshot_saved' => true, 'archive_created' => true]);
        break;

    case 'unpublish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'PÃ©riode manquante']);
            break;
        }
        $companyKey = resolveCurrentCompanyIdSql();
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        
        try {
            $sqlite = getDb();
            $sqlite->beginTransaction();

            $published = getServiceDataSql($companyKey, 'published_periods', []);
            $published = array_values(array_filter($published, fn($p) => $p !== $period));
            setServiceDataSql($companyKey, 'published_periods', $published);
            // RÃ©initialiser max_initialized_period au mois courant lors d'un reset
            setServiceDataSql($companyKey, 'max_initialized_period', null);

            // Also clean up service level in case it's lingering there from old backward compatibility logic
            $publishedSvc = getServiceDataSql($serviceKey, 'published_periods', []);
            if (!empty($publishedSvc)) {
                $publishedSvc = array_values(array_filter($publishedSvc, fn($p) => $p !== $period));
                setServiceDataSql($serviceKey, 'published_periods', $publishedSvc);
            }
            // Remove latest_publication ONLY if we are unpublishing the latest one
            $pubData = getServiceDataSql($companyKey, 'latest_publication', null);
            if ($pubData && ($pubData['period'] ?? '') === $period) {
                setServiceDataSql($companyKey, 'latest_publication', null);
                setServiceDataSql($companyKey, 'latest_feedback', null);
            }

            // â”€â”€â”€ DÃ‰GEL : Supprimer le snapshot gelÃ© pour permettre la modification â”€â”€
            deletePayrollSnapshot($sqlite, $companyKey, $period);
            // â”€â”€â”€ Supprimer toutes les archives de cette pÃ©riode (payroll et arch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            $sqlite->prepare("DELETE FROM archives WHERE period = ? AND company_id = ?")
                   ->execute([$period, $companyKey]);


            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (\Exception $e) {
            if (isset($sqlite) && $sqlite->inTransaction()) {
                $sqlite->rollBack();
            }
            echo json_encode(['success' => false, 'message' => "Erreur interne: " . $e->getMessage()]);
        }
        break;

    case 'apply_last_minute_correction':
        // Autoriser tout utilisateur connectÃ© pour la flexibilitÃ© des corrections locales

        $period = $data['period'] ?? '';
        $agent_id = $data['agent_id'] ?? '';
        $dates = $data['dates'] ?? [];
        $destination_subsite_id = $data['destination_subsite_id'] ?? '';
        $destination_name = $data['destination_name'] ?? '';
        $action_type = $data['action_type'] ?? '';

        if (!$period || !$agent_id || empty($dates) || !$action_type) {
            echo json_encode(['success' => false, 'message' => 'ParamÃ¨tres invalides']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();
        $serviceKey = $_SESSION['service_id'] ?? null;

        try {
            $sqlite->beginTransaction();

            if ($action_type === 'change_mutation_destination') {
                if (!$destination_subsite_id) {
                    throw new Exception("Le site de destination est obligatoire pour cette action.");
                }
                // 1. Charger l'agent d'origine
                $stmt = $sqlite->prepare("SELECT * FROM agents WHERE id = ? AND company_id = ?");
                $stmt->execute([$agent_id, $company_id]);
                $orig_agent = $stmt->fetch();
                if (!$orig_agent) {
                    throw new Exception("Agent d'origine introuvable.");
                }

                // 2. Mettre Ã  jour l'attendance de l'agent d'origine
                $placeholders = implode(',', array_fill(0, count($dates), '?'));
                $stmtUpdate = $sqlite->prepare("UPDATE attendance SET status = ? WHERE agent_id = ? AND date IN ($placeholders) AND period = ?");
                $params = array_merge(['M|' . $destination_name], [$agent_id], $dates, [$period]);
                $stmtUpdate->execute(array_values($params));

                // 3. Chercher si un doublon existait dÃ©jÃ  pour cet agent (mÃªme nom) sur un autre subsite et le supprimer
                $stmtFindDup = $sqlite->prepare("SELECT id FROM agents WHERE name = ? AND id != ? AND company_id = ? AND subsite_id != ?");
                $stmtFindDup->execute([$orig_agent['name'], $agent_id, $company_id, $orig_agent['subsite_id']]);
                $dups = $stmtFindDup->fetchAll();
                foreach ($dups as $dup) {
                    $dup_id = $dup['id'];
                    $sqlite->prepare("DELETE FROM agents WHERE id = ?")->execute([$dup_id]);
                    $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND period = ?")->execute([$dup_id, $period]);
                }

                // 4. CrÃ©er le nouvel agent dupliquÃ© sur le bon subsite
                $new_agent_id = 'ag_' . time() . '_' . rand(1000, 9999);
                $stmtInsertAgent = $sqlite->prepare("
                    INSERT INTO agents (id, name, subsite_id, `function`, shift_type, company_id, service_id, shift_history, has_sp, hire_date, recruitment_cost, salary, profile_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmtInsertAgent->execute([
                    $new_agent_id, $orig_agent['name'], $destination_subsite_id,
                    $orig_agent['function'], $orig_agent['shift_type'],
                    $company_id, $orig_agent['service_id'], $orig_agent['shift_history'],
                    $orig_agent['has_sp'], $orig_agent['hire_date'] ?? null,
                    $orig_agent['recruitment_cost'] ?? 0, $orig_agent['salary'] ?? 0,
                    $orig_agent['profile_data']
                ]);

                // 5. GÃ©nÃ©rer son historique d'attendance
                $settingsRow = getServiceDataSql($orig_agent['service_id'], 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
                $datesList = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

                $stmtInsertAtt = $sqlite->prepare("
                    INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                sort($dates);
                $first_mut_date = $dates[0];

                $cycle_counter = 0;
                $stype = $orig_agent['shift_type'] ?: 'Jour';
                $stype_lower = strtolower($stype);

                foreach ($datesList as $date_str) {
                    if ($date_str < $first_mut_date) {
                        $stmtSubName  = $sqlite->prepare("SELECT s.name as site_name, sub.name as zone_name FROM subsites sub LEFT JOIN sites s ON sub.site_id = s.id WHERE sub.id = ? AND company_id = ?");
        $stmtSubName->execute([$orig_agent['subsite_id'], resolveCurrentCompanyIdSql()]);
                        $origNames = $stmtSubName->fetch();
                        $origin_label = $origNames ? ($origNames['site_name'] . ' - ' . $origNames['zone_name']) : $orig_agent['subsite_id'];
                        $status_new = 'PM|' . $origin_label;
                        
                        $stmtInsertAtt->execute([$new_agent_id, $date_str, 'J', $status_new, $company_id, $orig_agent['service_id'], $period]);
                        $stmtInsertAtt->execute([$new_agent_id, $date_str, 'N', $status_new, $company_id, $orig_agent['service_id'], $period]);
                    } else {
                        if (in_array($date_str, $dates)) {
                            if ($stype === 'Nuit') {
                                $stmtInsertAtt->execute([$new_agent_id, $date_str, 'N', '1', $company_id, $orig_agent['service_id'], $period]);
                            } elseif ($stype === 'Jour') {
                                $stmtInsertAtt->execute([$new_agent_id, $date_str, 'J', '1', $company_id, $orig_agent['service_id'], $period]);
                            } else {
                                $cycle = 1; $work = 1;
                                if ($stype_lower === '24h') { $cycle = 2; $work = 1; }
                                elseif ($stype_lower === '48h') { $cycle = 4; $work = 2; }
                                elseif ($stype_lower === '72h') { $cycle = 6; $work = 3; }
                                $val = (($cycle_counter % $cycle) < $work) ? '1' : 'R';
                                $stmtInsertAtt->execute([$new_agent_id, $date_str, 'J', $val, $company_id, $orig_agent['service_id'], $period]);
                                $stmtInsertAtt->execute([$new_agent_id, $date_str, 'N', $val, $company_id, $orig_agent['service_id'], $period]);
                                $cycle_counter++;
                            }
                        } else {
                            $stmtInsertAtt->execute([$new_agent_id, $date_str, 'J', 'R', $company_id, $orig_agent['service_id'], $period]);
                            $stmtInsertAtt->execute([$new_agent_id, $date_str, 'N', 'R', $company_id, $orig_agent['service_id'], $period]);
                        }
                    }
                }
            }

            if ($action_type === 'change_attendance_status') {
                $new_status = $data['new_status'] ?? 'R';
                $placeholders = implode(',', array_fill(0, count($dates), '?'));
                $stmtUpdate = $sqlite->prepare("UPDATE attendance SET status = ? WHERE agent_id = ? AND date IN ($placeholders) AND period = ?");
                $params = array_merge([$new_status], [$agent_id], $dates, [$period]);
                $stmtUpdate->execute(array_values($params));
            }

            // 6. RÃ©gÃ©nÃ©rer le snapshot de paie
            $salaries = generateSalariesData($sqlite, $period, $company_id, 'company_id', $company_id, $serviceKey);
            savePayrollSnapshot($sqlite, $company_id, $period, $salaries, $serviceKey);

            $sqlite->commit();
            echo json_encode(['success' => true, 'message' => 'Correction appliquÃ©e et Ã‰tat de paie actualisÃ© !']);
        } catch (\Exception $e) {
            if (isset($sqlite) && $sqlite->inTransaction()) {
                $sqlite->rollBack();
            }
            echo json_encode(['success' => false, 'message' => "Erreur : " . $e->getMessage()]);
        }
        break;

    case 'get_published_periods':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = resolveCurrentCompanyIdSql();
        $scope = $_GET['scope'] ?? 'service';
        
        // La publication est toujours sauvegardée au niveau de l'entreprise (companyKey) par publish_period
        // On lit donc toujours depuis companyKey en priorité
        $target_val = $companyKey;
        $target_col = ($scope === 'company') ? 'company_id' : 'service_id';

        // get published periods from the company level
        $published = getServiceDataSql($target_val, 'published_periods', []);
        // Also check if they had any saved locally for backward compatibility
        if (empty($published)) {
            $published = getServiceDataSql($serviceKey, 'published_periods', []);
        }

        // Fetch archived payrolls from SQLite (with archived_by to distinguish auto vs cloture)
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, data FROM archives WHERE $target_col = ? AND id LIKE 'payroll_%'");
        $stmt->execute([($scope === 'company') ? $companyKey : $serviceKey]);
        $archived_rows = $stmt->fetchAll();
        $archived = [];
        $cloture_periods = []; // Periodes officiellement cloturees par le comptable
        foreach ($archived_rows as $row) {
            $period_key = substr($row['id'], 8); // Enleve 'payroll_'
            // Ignorer les entrées corrompues (ne correspondant pas au format YYYY-MM)
            if (!preg_match('/^\d{4}-\d{2}$/', $period_key)) continue;
            $archived[] = $period_key;
            $archData = json_decode($row['data'] ?? '{}', true);
            $archivedBy = $archData['archived_by'] ?? '';
            // Si ce n'est pas un auto-archivage PC, c'est une cloture officielle
            if ($archivedBy !== 'Auto-Archivage (PC)' && !empty($archivedBy)) {
                $cloture_periods[] = $period_key;
            }
        }

        $latestPub = getServiceDataSql($companyKey, 'latest_publication', null);
        $latestPubRecs = getServiceDataSql($companyKey, 'latest_publication_reclamations', null);
        $maxInitPeriod = getServiceDataSql($companyKey, 'max_initialized_period', null);

        $response = [
            'success' => true,
            'published_periods' => $published,
            'archived_periods' => $archived,
            'cloture_periods' => $cloture_periods,
            'latest_publication' => $latestPub,
            'latest_publication_reclamations' => $latestPubRecs,
            'max_initialized_period' => $maxInitPeriod
        ];
        file_put_contents('c:/laragon/www/pontage/api_log.txt', print_r($response, true) . "\n", FILE_APPEND);
        echo json_encode($response);
        break;

    case 'get_latest_publication':
        $companyKey = resolveCurrentCompanyIdSql();
        if (!$companyKey) {
            echo json_encode(['success' => false, 'publication' => null]);
            break;
        }
        $pubData = getServiceDataSql($companyKey, 'latest_publication', null);
        echo json_encode(['success' => true, 'publication' => $pubData]);
        break;

    case 'set_first_visit_period':
        $companyKey = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();
        $target_period = $data['period'] ?? null;
        if ($target_period) {
            setServiceDataSql($companyKey, 'max_initialized_period', $target_period);
        }
        echo json_encode(['success' => true]);
        break;

    case 'get_agent_period_details':
        $sqlite = getDb();
        $agent_id = $data['agent_id'] ?? $_GET['agent_id'] ?? '';
        $period = $data['period'] ?? $_GET['period'] ?? '';
        if (!$agent_id || !$period) {
            echo json_encode(['success' => false]);
            break;
        }

        $details = [
            'absences' => [],
            'map' => [],
            'hs' => [],
            'loans' => []
        ];

        try {
            $stmt  = $sqlite->prepare("SELECT date, status FROM attendance WHERE agent_id = ? AND period = ? AND (status = 'A' OR status LIKE '%MAP%') AND company_id = ?");
        $stmt->execute([$agent_id, $period, resolveCurrentCompanyIdSql()]);
            while ($r = $stmt->fetch()) {
                if ($r['status'] === 'A') $details['absences'][] = $r['date'];
                else $details['map'][] = $r['date'];
            }
        } catch(Exception $e) {}

        try {
            $stmt2  = $sqlite->prepare("SELECT date_supp, heures FROM supplementaires_externes WHERE agent_id = ? AND periode = ? AND company_id = ?");
        $stmt2->execute([$agent_id, $period, resolveCurrentCompanyIdSql()]);
            while ($r = $stmt2->fetch()) {
                $details['hs'][] = $r['date_supp'] . ' (' . $r['heures'] . 'h)';
            }
        } catch(Exception $e) {}

        try {
            $stmt3 = $sqlite->prepare("SELECT amount, date_granted, modality, motif FROM loans WHERE agent_id = ?");
            $stmt3->execute([$agent_id]);
            while ($r = $stmt3->fetch()) {
                $details['loans'][] = [
                    'date' => $r['date_granted'],
                    'modality' => $r['modality'],
                    'motif' => $r['motif'],
                    'amount' => $r['amount']
                ];
            }
        } catch(Exception $e) {}

        echo json_encode(['success' => true, 'details' => $details]);
        break;

} // end switch salaries

