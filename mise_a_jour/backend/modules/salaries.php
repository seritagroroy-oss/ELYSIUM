<?php
/**
 * Module Paie, RH & Absences — salaries.php
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $company_id = resolveCurrentCompanyIdSql();
        // Stocker avec la clé commune à toute l'entreprise
        $company_key = 'company::' . $company_id;
        $funcs = $data['functions'] ?? [];
        // Sauvegarder sous les deux clés pour compatibilité (company:: et company_id direct)
        setServiceDataSql($company_key, 'functions', $funcs);
        setServiceDataSql($company_id, 'functions', $funcs);
        echo json_encode(['success' => true]);
        break;

    case 'save_settings':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $period = $data['period'] ?? '';
        $adj_id = $data['adjustment_id'] ?? '';

        if ($agent_id === '' || $period === '' || $adj_id === '') {
            echo json_encode(['success' => false, 'message' => 'Données manquantes']);
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

    case 'save_payroll_archive':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        // ... implementation ...
        break;

    case 'delete_payroll_archive':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        // ... implementation ...
        break;

    case 'save_site_revenue':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT shift_type, shift_history FROM agents WHERE id = ?");
        $stmt->execute([$agent_id]);
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
            echo json_encode(['success' => false, 'message' => 'Périodes manquantes']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey) {
            echo json_encode(['success' => false, 'message' => 'Service non identifié']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();

        // Récupérer le cycle_start depuis service_data
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

        // Récupérer uniquement les agents liés à ce PC (créés par lui) OU ayant pointé dans le mois précédent pour ce PC
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
            echo json_encode(['success' => true]);
            break;
        }

        // Récupérer l'attendance du mois courant pour tous ces agents
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

        // Avant de supprimer, sauvegarder les statuts spécifiques pré-enregistrés (MAP, absences futures) pour le next_period
        $stmtFuture = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE period = ? AND service_id = ? AND status IN ('MAP', 'CP', 'AT', 'M', 'P')");
        $stmtFuture->execute([$next_period, $serviceKey]);
        $future_rows = $stmtFuture->fetchAll();
        $future_att = [];
        foreach ($future_rows as $row) {
            $future_att[$row['agent_id']][$row['shift_code']][$row['date']] = $row['status'];
        }

        // Supprimer les données déjà existantes du next_period pour repartir propre
        $stmtDel = $sqlite->prepare("DELETE FROM attendance WHERE period = ? AND service_id = ?");
        $stmtDel->execute([$next_period, $serviceKey]);

        // Préparer le INSERT
        $stmtIns = $sqlite->prepare("
           INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period)
           VALUES (?, ?, ?, ?, ?, ?, ?)
       ");

        $last_old_d = $old_dates[count($old_dates) - 1];

        // Récupérer les shift_type, hire_date, site_id et profile_data de tous les agents en une requête
        $placeholders_shifts = implode(',', array_fill(0, count($all_agents), '?'));
        $stmtShifts = $sqlite->prepare("
            SELECT a.id, a.shift_type, a.hire_date, sub.site_id, a.profile_data
            FROM agents a
            LEFT JOIN subsites sub ON a.subsite_id = sub.id
            WHERE a.id IN ($placeholders_shifts)
        ");
        $stmtShifts->execute($all_agents);
        $shift_rows = $stmtShifts->fetchAll();
        $agent_shift_types = [];
        $agent_hire_dates = [];
        $agent_sites = [];
        $agent_profiles = [];
        foreach ($shift_rows as $sr) {
            $agent_shift_types[$sr['id']] = $sr['shift_type'] ?? 'Jour';
            $agent_hire_dates[$sr['id']] = $sr['hire_date'] ?? '2000-01-01';
            $agent_sites[$sr['id']] = $sr['site_id'];
            $agent_profiles[$sr['id']] = json_decode($sr['profile_data'] ?? '{}', true);
        }

        $nb_old = count($old_dates);

        foreach ($all_agents as $agent_id) {
            $shifts = $old_att[$agent_id] ?? [];
            $shift_type = $agent_shift_types[$agent_id] ?? 'Jour';

            // Vérifier si l'agent est muté sortant (dernier jour = M|...)
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

            // Vérifier si c'est un agent fraîchement muté entrant (PM|... dans le mois courant) ou ENTRANT
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

            // Déterminer les paramètres du cycle selon le shift_type
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
                    $stmtRdow = $sqlite->prepare("SELECT repos_day_of_week FROM agents WHERE id = ?");
                    $stmtRdow->execute([$agent_id]);
                    $rdowRow = $stmtRdow->fetch();
                    $stored_rdow = isset($rdowRow['repos_day_of_week']) ? (int) $rdowRow['repos_day_of_week'] : -1;
                    $repos_day_of_week = ($stored_rdow >= 0) ? $stored_rdow : 0;
                }
            }

            // Vérifier si l'agent est actif (avait des données le mois précédent)
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
            if (!$hasActivity && !$isNewMutatedAgent) {
                $hire_date = $agent_hire_dates[$agent_id] ?? '2000-01-01';
                // Ne pas archiver les agents récemment embauchés (pendant ou après le mois précédent)
                if ($hire_date < $old_dates[0]) {
                    $agentsToArchive[] = $agent_id;
                    continue;
                }
            }

            $agent_inserted = false;

            // Déterminer les shift_codes à traiter
            $shift_codes_to_fill = [];
            if ($shift_type_lower === 'jour')
                $shift_codes_to_fill = ['J'];
            elseif ($shift_type_lower === 'nuit')
                $shift_codes_to_fill = ['N'];
            else
                $shift_codes_to_fill = ['J', 'N']; // rotatif J et N

            foreach ($shift_codes_to_fill as $shift_code) {
                $isActiveAtEnd = true; // Par défaut actif
                for ($d_idx = $nb_old - 1; $d_idx >= 0; $d_idx--) {
                    $d = $old_dates[$d_idx];
                    $val = $shifts[$shift_code][$d] ?? '';
                    if ($val !== '') {
                        // Considérer inactif SEULEMENT si explicitement marqué sortant/abandon/demission/mutation out
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
                        // Utilise le $start_phase calculé
                        $pos = ($start_phase + $i) % $cycle;
                        $status = ($pos < $work) ? '1' : 'R';

                    } elseif ($shift_type_lower === 'jour' || $shift_type_lower === 'nuit') {
                        // --- Logique Jour / Nuit : présence sauf jour de repos hebdo ou spécial ---
                        $day_of_week_N = (int) (new DateTime($new_d))->format('N'); // 1-7
                        $day_of_week_w = (int) (new DateTime($new_d))->format('w'); // 0-6
                        
                        $prof = $agent_profiles[$agent_id] ?? [];
                        $is_special = !empty($prof['special_service']);
                        $special_days = $prof['special_service_days'] ?? [];
                        $is_admin = !empty($prof['admin_schedule']);

                        if ($is_special) {
                            if (in_array($day_of_week_N, $special_days) || in_array((string)$day_of_week_N, $special_days)) {
                                $status = '1';
                            } else {
                                $status = 'R';
                            }
                        } elseif ($is_admin) {
                            if ($day_of_week_N === 6 || $day_of_week_N === 7) {
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
                        // Fallback : présence par défaut
                        $status = '1';
                    }

                    if ($status !== null) {
                        // Si le jour est avant la date d'embauche, on remplace ENTRANT par 1 selon la demande
                        $hire_date = $agent_hire_dates[$agent_id] ?? '2000-01-01';
                        if ($new_d < $hire_date) {
                            $status = '1';
                        }

                        // Restaurer les données futures pré-enregistrées (comme une MAP anticipée)
                        if (isset($future_att[$agent_id][$shift_code][$new_d])) {
                            $status = $future_att[$agent_id][$shift_code][$new_d];
                        }
                        $stmtIns->execute([$agent_id, $new_d, $shift_code, $status, $company_id, $serviceKey, $next_period]);
                        $agent_inserted = true;
                    }
                }
            }

            // --- Copier les heures supplémentaires (S, SJ, SN) si le site est dans sites_to_keep_hs ---
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
                                    $stmtIns->execute([$agent_id, $new_d, $hs_c, $hs_by_phase[$phase], $company_id, $serviceKey, $next_period]);
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
                                    $stmtIns->execute([$agent_id, $new_d, $hs_c, $hs_by_dow[$dow], $company_id, $serviceKey, $next_period]);
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

        // Archiver les agents mutés sortants
        if (!empty($agentsToArchive)) {
            $inQuery = implode(',', array_fill(0, count($agentsToArchive), '?'));
            $stmtArch = $sqlite->prepare("UPDATE agents SET archived_period = ? WHERE id IN ($inQuery)");
            $params = array_merge([$next_period], $agentsToArchive);
            $stmtArch->execute($params);
        }

        // Appliquer les changements de statut en cours et nettoyer pour le mois suivant
        $stmtStatus = $sqlite->prepare("SELECT id, status_change FROM agents WHERE service_id = ? AND archived_period IS NULL AND status_change IS NOT NULL AND status_change != ''");
        $stmtStatus->execute([$serviceKey]);
        $status_rows = $stmtStatus->fetchAll();
        foreach ($status_rows as $row) {
            $scObj = json_decode($row['status_change'], true);
            if ($scObj && isset($scObj['new_function'])) {
                // On met à jour la fonction avec la nouvelle, et on efface status_change
                $stmtUpdateSc = $sqlite->prepare("UPDATE agents SET `function` = ?, status_change = NULL WHERE id = ?");
                $stmtUpdateSc->execute([$scObj['new_function'], $row['id']]);
            }
        }

        // ── Sauvegarder le dernier mois initialisé dans la base (utilisé pour le verrou des mois futurs) ──
        setServiceDataSql($company_id, 'max_initialized_period', $next_period);

        echo json_encode(['success' => true]);
        break;

    case 'reset_year_attendance':
        $site_id = $data['site_id'] ?? null;
        $serviceKey = $_SESSION['service_id'] ?? null;
        $year = $data['year'] ?? '';

        if (!$site_id || !$serviceKey || !$year) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $sqlite = getDb();
        $likePattern = $year . '-%';

        // Trouver tous les sous-sites de ce site
        // Pour les sites spéciaux (site_extras, site_extras_sur_site, site_releves, site_administration), on doit inclure les sous-sites générés par défaut
        if ($site_id === 'site_extras') {
            $subsite_ids = ['site_extras_1'];
        } elseif ($site_id === 'site_extras_sur_site') {
            $stmtSub = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
            $stmtSub->execute([$site_id]);
            $sub_rows = $stmtSub->fetchAll();
            $subsite_ids = array_map(fn($r) => array_values($r)[0], $sub_rows) ?: [];
        } elseif ($site_id === 'site_releves') {
            $subsite_ids = ['site_releves_1'];
        } elseif ($site_id === 'site_administration') {
            $subsite_ids = ['site_admin_1'];
        } else {
            $stmtSub = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
            $stmtSub->execute([$site_id]);
            $sub_rows = $stmtSub->fetchAll();
            $subsite_ids = array_map(fn($r) => array_values($r)[0], $sub_rows) ?: [];
        }

        if (!empty($subsite_ids)) {
            $inQuery = implode(',', array_fill(0, count($subsite_ids), '?'));
            $params = array_merge([$serviceKey, $likePattern], $subsite_ids);

            // Supprimer tous les pointages de cette année pour les agents de ces sous-sites
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

            // Supprimer les sous-sites (zones) si ce n'est pas un site spécial
            if (!in_array($site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration'])) {
                $stmtSubsites = $sqlite->prepare("DELETE FROM subsites WHERE site_id = ?");
                $stmtSubsites->execute([$site_id]);
            }
        }

        // Supprimer toutes les archives de cette année (historique)
        $stmtDelArch = $sqlite->prepare("DELETE FROM archives WHERE service_id = ? AND period LIKE ?");
        $stmtDelArch->execute([$serviceKey, $likePattern]);

        // Nettoyer également l'historique dans la structure JSON héritée
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
            echo json_encode(['success' => false, 'message' => 'Période invalide: ' . $period]);
            break;
        }

        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        $company_id = resolveCurrentCompanyIdSql();
        $siteOrder = $data['siteOrder'] ?? [];

        $snapshot_sites = buildSiteDataSnapshot($sqlite, $serviceKey, $period, $siteOrder);

        // Supprimer l'ancienne archive pour cette période+service (éviter les doublons et remplacer les archives vides)
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
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
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
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
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

        // 1. Find agent in `agents` table — search GLOBALLY (no service filter)
        $foundAgent = null;
        if (!empty($matricule)) {
            $stmt = $sqlite->prepare("SELECT * FROM agents WHERE (id = ? OR matricule = ?) LIMIT 1");
            $stmt->execute([$matricule, $matricule]);
            $foundAgent = $stmt->fetch();
        } else if (!empty($nom)) {
            $stmt = $sqlite->prepare("SELECT * FROM agents WHERE LOWER(name) LIKE LOWER(?) LIMIT 1");
            $stmt->execute(['%' . $nom . '%']);
            $foundAgent = $stmt->fetch();
        }

        if (!$foundAgent) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable dans la base. Vérifiez vos informations (nom exact tel qu\'il figure sur le planning).']);
            break;
        }

        $agent_id = $foundAgent['id'];
        $agent_service_id = $foundAgent['service_id'] ?? '';

        // 2. Verify Attendance in the last 3 months passed
        $months = [];
        for ($i = 1; $i <= 3; $i++) {
            $months[] = date('Y-m', strtotime("-$i months"));
        }
        $stmtPast = $sqlite->prepare("SELECT COUNT(*) as count FROM attendance WHERE agent_id = ? AND period IN (?, ?, ?)");
        $stmtPast->execute([$agent_id, $months[0], $months[1], $months[2]]);
        $pastCount = $stmtPast->fetch();
        $hasPastAttendance = ($pastCount && $pastCount['count'] > 0);

        if (!$hasPastAttendance) {
            echo json_encode(['success' => false, 'message' => 'Refusé : Aucun pointage trouvé pour les 3 derniers mois passés.']);
            break;
        }

        // 3. Verify Attendance in the CURRENT month (OBLIGATOIRE)
        $currentPeriod = date('Y-m');
        $stmtAtt = $sqlite->prepare("SELECT COUNT(*) as count FROM attendance WHERE agent_id = ? AND period = ?");
        $stmtAtt->execute([$agent_id, $currentPeriod]);
        $attCount = $stmtAtt->fetch();
        $hasCurrentAttendance = ($attCount && $attCount['count'] > 0);

        if (!$hasCurrentAttendance) {
            echo json_encode(['success' => false, 'message' => 'Refusé : Aucun pointage trouvé pour le mois en cours (' . $currentPeriod . '). Veuillez contacter votre chef de site.']);
            break;
        }

        // 4. Save to agent_portal_users (SQLite)
        $sqlite = getDb();

        // Check if already registered
        $stmtChk = $sqlite->prepare('SELECT id FROM agent_portal_users WHERE agent_id = ?');
        $stmtChk->execute([$agent_id]);
        if ($stmtChk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Un compte existe déjà ou est en attente pour cet agent.']);
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

        echo json_encode(['success' => true, 'message' => 'Inscription réussie ! Votre compte est en attente de validation par le service Planning.']);
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
            echo json_encode(['success' => false, 'message' => 'Identifiants introuvables. Vérifiez votre matricule ou numéro de téléphone.']);
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
            echo json_encode(['success' => false, 'message' => "Votre demande d'accès a été refusée par l'administration. Contactez votre chef de site."]);
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
        // Trier par période (plus récent d'abord)
        usort($archives, function ($a, $b) {
            return strcmp($b['period'], $a['period']);
        });
        echo json_encode(['success' => true, 'archives' => $archives]);
        break;

    case 'get_payroll_archive_detail':
        $period = $_GET['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
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
            echo json_encode(['success' => true, 'archive' => json_decode($result['data'], true)]);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
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
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? null;
        
        // Les admins, RH et comptables voient toute l'entreprise par défaut
        if (strpos($user_role, 'admin') !== false || strpos($user_service, 'compta') !== false || strpos($user_service, 'rh') !== false) {
            $target_col = 'company_id';
            $target_val = $companyKey;
        } else {
            $scope = $_GET['scope'] ?? 'service';
            $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
            $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        }

        // ─── FREEZE : Si la période est CLÔTURÉE (archivée), servir le snapshot gelé ───────
        if (isPayrollArchived($sqlite, $companyKey, $period)) {
            $snapshot = getPayrollSnapshot($sqlite, $companyKey, $period);
            if ($snapshot !== null) {
                // INJECTER LES DONNÉES DE PAIEMENT À JOUR (profile_data) DANS LE SNAPSHOT
                $stmtProfiles = $sqlite->prepare("SELECT id, profile_data FROM agents WHERE company_id = ?");
                $stmtProfiles->execute([$companyKey]);
                $liveProfiles = [];
                while ($row = $stmtProfiles->fetch()) {
                    $liveProfiles[$row['id']] = $row['profile_data'] ? json_decode($row['profile_data'], true) : [];
                }
                
                $statuses = [];
                try {
                    $stmtStatus = $sqlite->prepare("SELECT agent_id, status FROM salaries_payment_status WHERE company_id = ? AND period = ?");
                    $stmtStatus->execute([$companyKey, $period]);
                    while ($r = $stmtStatus->fetch()) $statuses[$r['agent_id']] = $r['status'];
                } catch (Exception $e) {}
                
                foreach ($snapshot as &$agentData) {
                    if (isset($liveProfiles[$agentData['id']])) {
                        $agentData['profile_data'] = $liveProfiles[$agentData['id']];
                    }
                    $agentData['payment_status'] = $statuses[$agentData['id']] ?? 'pending';
                }
                unset($agentData);
                // Retourner les données gelées au moment de la publication
                echo json_encode($snapshot);
                break;
            }
            // Pas de snapshot (période publiée avant l'introduction du gel) → fallback live
            // On sauvegarde quand même un snapshot maintenant pour la cohérence future
            $salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);
            savePayrollSnapshot($sqlite, $companyKey, $period, $salaries, $serviceKey);
            
            $statuses = [];
            try {
                $stmtStatus = $sqlite->prepare("SELECT agent_id, status FROM salaries_payment_status WHERE company_id = ? AND period = ?");
                $stmtStatus->execute([$companyKey, $period]);
                while ($r = $stmtStatus->fetch()) $statuses[$r['agent_id']] = $r['status'];
            } catch (Exception $e) {}
            foreach ($salaries as &$agentData) $agentData['payment_status'] = $statuses[$agentData['id']] ?? 'pending';
            unset($agentData);
            
            echo json_encode($salaries);
            break;
        }
        // ─── Période non publiée : calcul dynamique normal ───────────────────
        $salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);
        
        $statuses = [];
        try {
            $stmtStatus = $sqlite->prepare("SELECT agent_id, status FROM salaries_payment_status WHERE company_id = ? AND period = ?");
            $stmtStatus->execute([$companyKey, $period]);
            while ($r = $stmtStatus->fetch()) $statuses[$r['agent_id']] = $r['status'];
        } catch (Exception $e) {}
        foreach ($salaries as &$agentData) $agentData['payment_status'] = $statuses[$agentData['id']] ?? 'pending';
        unset($agentData);
        
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
        
        if (!$has_extras) $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 EXTRA BUREAU'];
        if (!$has_releves) $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
        if (!array_filter($sites_rows, fn($s) => $s['id'] === 'site_extras_sur_site')) {
            $sites_rows[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];
        }
        if (!$has_admin) $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];
        if (!$has_itc) $sites_rows[] = ['id' => 'site_itc', 'name' => 'ITC / IFM'];

        $lightweightSalaries = [];

        foreach ($sites_rows as $site) {
            $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
            $stmtSub2->execute([$site['id']]);
            $subsites_rows = $stmtSub2->fetchAll();

            if (in_array($site['id'], ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc']) && empty($subsites_rows)) {
                if ($site['id'] === 'site_extras') $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_extras_sur_site') $subsites_rows = [['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale']];
                if ($site['id'] === 'site_releves') $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration') $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                if ($site['id'] === 'site_itc') $subsites_rows = [
                    ['id' => 'site_itc_tenue', 'name' => 'Tenue Régulière'],
                    ['id' => 'site_itc_costume', 'name' => 'Costume'],
                    ['id' => 'site_itc_as', 'name' => 'Agent Spécial']
                ];
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
                    "SELECT id, name FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period >= ?) ORDER BY name"
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
                $salaries = generateSalariesData($sqlite, $m, $companyKey, $target_col, $target_val, $serviceKey);
                foreach ($salaries as $s) {
                    $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                }
            }
            
            $results[] = ['period' => $m, 'total' => $totalMasse];
        }
        echo json_encode(['success' => true, 'history' => $results]);
        break;

    case 'save_reclamation':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'message' => 'Session expirée']);
            break;
        }
        
        $agent_id = $data['agent_id'] ?? '';
        $motif = $data['motif'] ?? '';
        $jours = (float)($data['jours'] ?? 0);
        $dates = $data['dates'] ?? '';
        $montant = (float)($data['montant'] ?? 0);
        $agent_name = $data['agent_name'] ?? '';
        $period = $data['period'] ?? '';
        
        try {
            $id = 'rec_' . time() . '_' . rand(100, 999);
            $stmt = $sqlite->prepare("
                INSERT INTO reclamations (
                    id, company_id, agent_nom, agent_matricule, 
                    reclamation_categorie, jours_concernes, montant_estime, 
                    mois_concerne, statut, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $desc = json_encode([
                'agent_id' => $agent_id,
                'period' => $period,
                'dates' => $dates,
                'jours' => $jours,
                'montant' => $montant
            ]);
            
            $stmt->execute([
                $id, $companyKey, $agent_name, $agent_id, 
                $motif, $jours, $montant, 
                $period, 'Clôturé', $desc
            ]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur base de données: ' . $e->getMessage()]);
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
        $sqlite->prepare("UPDATE agents SET salary = ? WHERE id = ?")->execute([$salary, $agent_id]);

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
            'cnps_salarial' => 6.3, // %
            'cnps_patronal' => 7.7, // % (retraite)
            'its' => 1.2, // % (approximatif pour la part fixe)
            'fdfp' => 1.2, // %
            'taux_hs_jour' => 15, // %
            'taux_hs_nuit' => 50, // %
            'taux_hs_dimanche' => 75, // %
            'taux_hs_ferie' => 100 // %
        ];
        echo json_encode(['success' => true, 'settings' => $settings]);
        break;

    case 'save_payroll_settings':
        $user_role = $_SESSION['user_role'] ?? '';
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        if ($user_role !== 'admin' && strpos($user_service, 'compta') === false && strpos($user_service, 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé. Seuls les RH, Comptables et Admins peuvent modifier ces paramètres.']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $targetKey = 'company::' . $companyKey;
        
        setServiceDataSql($targetKey, 'payroll_settings', $data['settings'] ?? []);
        
        echo json_encode(['success' => true]);
        break;

    case 'upload_company_logo':
        if (($_SESSION['user_role'] ?? '') != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $company_id = resolveCurrentCompanyIdSql();
        $sqlite = getDb();
        
        $id = 'loan_' . time() . rand(1000, 9999);
        $agent_name = $data['agent_name'] ?? '';
        $agent_function = $data['agent_function'] ?? '';
        $amount = intval($data['amount'] ?? 0);
        $motif = $data['motif'] ?? '';
        $date_granted = $data['date_granted'] ?? date('Y-m-d');
        $monthly_deduction = intval($data['monthly_deduction'] ?? 0);
        $start_period = $data['start_period'] ?? date('Y-m');
        
        $stmt = $sqlite->prepare("INSERT INTO agent_loans (id, company_id, agent_name, agent_function, total_amount, motif, date_granted, monthly_deduction, start_period, remaining_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$id, $company_id, $agent_name, $agent_function, $amount, $motif, $date_granted, $monthly_deduction, $start_period, $amount]);
        
        echo json_encode(['success' => true, 'loan_id' => $id]);
        break;
        
    case 'delete_payroll_loan':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'compta') === false && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $contract_data = $data['contract_data'] ?? [];
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent non spécifié']);
            break;
        }
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT profile_data FROM agents WHERE id = ?");
        $stmt->execute([$agent_id]);
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
        $sqlite->exec("DELETE FROM pointage_leaves WHERE start_date = end_date AND start_date LIKE '%-01'"); // Auto-cleanup des congés buggés
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $leave = $data['leave'] ?? null;
        if (!$leave || empty($leave['id'])) {
            echo json_encode(['success' => false, 'message' => 'Données de congé manquantes']);
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            ['id' => 'GA', 'name' => 'Garde Armé'],
            ['id' => 'MC', 'name' => 'Maître-Chien'],
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
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
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
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'message' => 'Session expirée']);
            break;
        }

        $published = getServiceDataSql($companyKey, 'published_periods', []);
        $new_published = array_values(array_filter($published, function($p) use ($period) {
            return $p !== $period;
        }));

        setServiceDataSql($companyKey, 'published_periods', $new_published);

        // Si le service est aussi enregistré, le dépublier localement (optionnel mais recommandé)
        $serviceKey = $_SESSION['service_id'] ?? null;
        if ($serviceKey) {
            $publishedSvc = getServiceDataSql($serviceKey, 'published_periods', []);
            $new_publishedSvc = array_values(array_filter($publishedSvc, function($p) use ($period) {
                return $p !== $period;
            }));
            setServiceDataSql($serviceKey, 'published_periods', $new_publishedSvc);
        }

        echo json_encode(['success' => true, 'message' => 'Période dépubliée']);
        break;
    case 'publish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $serviceName = $_SESSION['user_service'] ?? 'Un service';
        $serviceKey = $_SESSION['service_id'] ?? null;

        $published = getServiceDataSql($companyKey, 'published_periods', []);
        
        // --- AUTO-ARCHIVING LOGIC ---
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
                if (!$has_extras) $sites[] = ['id' => 'site_extras', 'name' => '🌟 EXTRA BUREAU'];
                if (!$has_extras_sur_site) $sites[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];
                if (!$has_releves) $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
                if (!$has_admin) $sites[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];
                
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
        // --- END AUTO-ARCHIVING LOGIC ---

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

        // Ajouter l'événement de publication à l'historique
        $pubHistoryData = [
            'period' => $period,
            'service_name' => $serviceName,
            'type' => 'publish',
            'publisher_service_id' => $serviceKey,
            'timestamp' => time()
        ];
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        array_unshift($history, $pubHistoryData); // Ajouter au début
        if (count($history) > 50)
            $history = array_slice($history, 0, 50);
        setServiceDataSql($companyKey, 'feedback_history', $history);

        // ─── FREEZE : Générer et sauvegarder le snapshot gelé des salaires ─────
        // Le snapshot est calculé UNE SEULE FOIS au moment de la publication.
        // Toute modification ultérieure du pointage n'affectera pas ces données.
        $snapshotSalaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
        savePayrollSnapshot($sqlite, $companyKey, $period, $snapshotSalaries, $serviceKey);
        // ─── FIN FREEZE ─────────────────────────────────────────────────────────

        echo json_encode(['success' => true, 'snapshot_saved' => true]);
        break;

    case 'unpublish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $serviceKey = $_SESSION['service_id'] ?? null;
        
        try {
            $sqlite = getDb();
            $sqlite->beginTransaction();

            $published = getServiceDataSql($companyKey, 'published_periods', []);
            $published = array_values(array_filter($published, fn($p) => $p !== $period));
            setServiceDataSql($companyKey, 'published_periods', $published);
            // Réinitialiser max_initialized_period au mois courant lors d'un reset
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

            // ─── DÉGEL : Supprimer le snapshot gelé pour permettre la modification ──
            deletePayrollSnapshot($sqlite, $companyKey, $period);
            // ─── Supprimer toutes les archives de cette période (payroll et arch) ──────────
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

    case 'get_published_periods':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();
        $scope = $_GET['scope'] ?? 'service';
        $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        $target_col = ($scope === 'company') ? 'company_id' : 'service_id';

        // get published periods from the company level if scope is company
        $published = getServiceDataSql($target_val, 'published_periods', []);
        // Also check if they had any saved locally for backward compatibility
        if ($scope === 'company' && empty($published)) {
            $published = getServiceDataSql($serviceKey, 'published_periods', []);
        }

        // Fetch archived payrolls from SQLite (with archived_by to distinguish auto vs cloture)
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, data FROM archives WHERE $target_col = ? AND id LIKE 'payroll_%'");
        $stmt->execute([$target_val]);
        $archived_rows = $stmt->fetchAll();
        $archived = [];
        $cloture_periods = []; // Periodes officiellement cloturees par le comptable
        foreach ($archived_rows as $row) {
            $period_key = substr($row['id'], 8); // Enleve 'payroll_'
            $archived[] = $period_key;
            $archData = json_decode($row['data'] ?? '{}', true);
            $archivedBy = $archData['archived_by'] ?? '';
            // Si ce n'est pas un auto-archivage PC, c'est une cloture officielle
            if ($archivedBy !== 'Auto-Archivage (PC)' && !empty($archivedBy)) {
                $cloture_periods[] = $period_key;
            }
        }

        $latestPub = getServiceDataSql($companyKey, 'latest_publication', null);
        $maxInitPeriod = getServiceDataSql($companyKey, 'max_initialized_period', null);

        echo json_encode([
            'success' => true,
            'published_periods' => $published,
            'archived_periods' => $archived,
            'cloture_periods' => $cloture_periods,
            'latest_publication' => $latestPub,
            'max_initialized_period' => $maxInitPeriod
        ]);
        break;

    case 'get_latest_publication':
        $companyKey = $_SESSION['company_id'] ?? resolveCurrentServiceKeySql();
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

} // end switch salaries
