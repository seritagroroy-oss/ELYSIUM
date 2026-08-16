<?php
/**
 * Module Pointage & Mouvements d'agents — attendance.php
 * Gère: update_attendance, bulk_update_attendance, mark_agent_sortant,
 *       mark_agent_entrant, apply_mutation, apply_batch_rotation, init_site_period
 *
 * Inclus depuis api_new.php — a accès à toutes les fonctions globales
 */

switch ($action) {

    // ─────────────────────────────────────────────────────────────────────────
    case 'update_attendance':
        $agent_id   = $data['agent_id'] ?? '';
        $date       = $data['date'] ?? '';
        $shift_code = $data['shift_code'] ?? '';
        $status     = $data['status'] ?? '';
        $period     = $data['period'] ?? '';

        if (!$agent_id || !$date || !$shift_code || !$period) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK : Bloquer si la période est publiée ──────────────────────
        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode([
                'success'       => false,
                'period_locked' => true,
                'message'       => "La période $period est verrouillée (pointage publié). Aucune modification n'est autorisée. Dépubliez d'abord la période si une correction est nécessaire."
            ]);
            break;
        }
        // ─── FIN LOCK ──────────────────────────────────────────────────────

        $stmtAg = $sqlite->prepare("SELECT hire_date, exit_date FROM agents WHERE id = ?");
        $stmtAg->execute([$agent_id]);
        $agentInfo = $stmtAg->fetch();
        $entry_date = $agentInfo ? ($agentInfo['hire_date'] ?? null) : null;
        $exit_date = $agentInfo ? ($agentInfo['exit_date'] ?? null) : null;

        if ($exit_date && $date >= $exit_date) {
            echo json_encode(['success' => false, 'message' => "Impossible de modifier le pointage : l'agent est sorti à partir du $exit_date"]);
            break;
        }
        // Restriction entry_date supprimée pour permettre la rétroactivité

        // Récupérer le statut actuel pour protéger les mutations contre l'écrasement par des statuts normaux
        $stmtCheck = $sqlite->prepare("SELECT status FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?");
        $stmtCheck->execute([$agent_id, $date, $shift_code, $period]);
        $currentStatus = $stmtCheck->fetchColumn();
        if ($currentStatus && (strpos($currentStatus, 'M|') === 0 || strpos($currentStatus, 'PM|') === 0)) {
            if (strpos($status, 'M|') !== 0 && strpos($status, 'PM|') !== 0) {
                echo json_encode(['success' => true, 'ignored' => true, 'message' => 'Ligne de mutation protégée']);
                break;
            }
        }

        if ($status === '') {
            $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                   ->execute([$agent_id, $date, $shift_code, $period]);
        } else {
            $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                   ->execute([$agent_id, $date, $shift_code, $period]);
            $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)')
                   ->execute([$agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
        }

        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'bulk_update_attendance':
        $updates = $data['updates'] ?? [];
        if (!is_array($updates) || empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'Aucune mise à jour fournie']);
            break;
        }

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK ─────────────────────────────────────────────────────────
        $first_period = $updates[0]['period'] ?? '';
        if ($first_period && isPayrollPeriodLocked($sqlite, $company_id, $first_period)) {
            echo json_encode([
                'success'       => false,
                'period_locked' => true,
                'message'       => "La période $first_period est verrouillée (pointage publié). Aucune modification n'est autorisée. Dépubliez d'abord la période si une correction est nécessaire."
            ]);
            break;
        }
        // ─── FIN LOCK ─────────────────────────────────────────────────────

        $sqlite->beginTransaction();
        
        $grouped = [];
        foreach ($updates as $update) {
            $agent_id   = $update['agent_id'] ?? '';
            $date       = $update['date'] ?? '';
            $shift_code = $update['shift_code'] ?? '';
            $status     = $update['status'] ?? '';
            $period     = $update['period'] ?? '';

            if (!$agent_id || !$date || !$shift_code || !$period) continue;
            
            $grouped[$agent_id][$period][] = $update;
        }

        $stmtIns = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        foreach ($grouped as $agent_id => $periods) {
            $stmtAg = $sqlite->prepare("SELECT hire_date, exit_date FROM agents WHERE id = ?");
            $stmtAg->execute([$agent_id]);
            $agentInfo = $stmtAg->fetch();
            $entry_date = $agentInfo ? ($agentInfo['hire_date'] ?? null) : null;
            $exit_date = $agentInfo ? ($agentInfo['exit_date'] ?? null) : null;

            foreach ($periods as $period => $items) {
                // Charger les lignes de mutation existantes à protéger
                $stmtMuts = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ? AND (status LIKE 'M|%' OR status LIKE 'PM|%')");
                $stmtMuts->execute([$agent_id, $period]);
                $mutRows = $stmtMuts->fetchAll(PDO::FETCH_ASSOC);
                $protected = [];
                foreach ($mutRows as $mr) {
                    $protected[$mr['date']][$mr['shift_code']] = $mr['status'];
                }

                // Filtrer les jours en dehors de la période de validité de l'agent ou les lignes de mutation protégées
                $validItems = [];
                foreach ($items as $item) {
                    $d = preg_replace('/[^0-9\-]/', '', $item['date']);
                    if ($exit_date && $d >= $exit_date) continue; // On ne modifie pas les jours après l'abandon
                    
                    // Protéger les lignes de mutation contre l'écrasement par des statuts normaux
                    $sc = preg_replace('/[^A-Z0-9]/', '', $item['shift_code']);
                    if (isset($protected[$d][$sc])) {
                        if (strpos($item['status'], 'M|') !== 0 && strpos($item['status'], 'PM|') !== 0) {
                            continue; // Ignorer cet item pour préserver la mutation
                        }
                    }
                    // Restriction entry_date supprimée pour permettre la rétroactivité
                    $validItems[] = $item;
                }

                if (empty($validItems)) continue;

                // Construire une clause WHERE groupée pour éviter N+1 scans complets
                $conditions = [];
                foreach ($validItems as $item) {
                    $d = preg_replace('/[^0-9\-]/', '', $item['date']);
                    $sc = preg_replace('/[^A-Z0-9]/', '', $item['shift_code']);
                    $conditions[] = "(date = '$d' AND shift_code = '$sc')";
                }
                
                $where = "agent_id = ? AND period = ? AND (" . implode(" OR ", $conditions) . ")";
                
                $stmtDelBulk = $sqlite->prepare("DELETE FROM attendance WHERE $where");
                $stmtDelBulk->execute([$agent_id, $period]);
                
                foreach ($validItems as $item) {
                    if ($item['status'] !== '') {
                        $stmtIns->execute([$agent_id, $item['date'], $item['shift_code'], $item['status'], $company_id, $serviceKey, $period]);
                    }
                }
            }
        }

        $sqlite->commit();
        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'mark_agent_sortant':
        $agent_id       = $data['agent_id'] ?? '';
        $departure_date = $data['departure_date'] ?? '';
        $type           = $data['type'] ?? '';
        $period         = $data['period'] ?? date('Y-m');

        if (!$agent_id || !$departure_date || (!in_array($type, ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) && strpos($type, 'SORTANT_') !== 0)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        // Normaliser la date
        $dateObj = DateTime::createFromFormat('Y-m-d', $departure_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d/m/Y', $departure_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d-m-Y', $departure_date);
        $departure_date = $dateObj ? $dateObj->format('Y-m-d') : date('Y-m-d', strtotime(str_replace('/', '-', $departure_date)));

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK ─────────────────────────────────────────────────────────
        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "Période $period verrouillée (publiée). Dépubliez d'abord."]);
            break;
        }

        $exit_reason = $type;
        if ($type === 'ABANDON')        $exit_reason = 'Abandon de poste';
        elseif ($type === 'DEMISSION')  $exit_reason = 'Démission';
        elseif ($type === 'RETIRE')     $exit_reason = "Retiré de l'effectif";
        elseif ($type === 'LICENCIE')   $exit_reason = 'Licencié';
        elseif ($type === 'LICENCIE_ADMIN') $exit_reason = "Licencié par l'Administrateur";
        elseif ($type === 'FIN_CONTRAT')    $exit_reason = 'Fin de stage/contrat';
        elseif (strpos($type, 'SORTANT_') === 0) $exit_reason = substr($type, 8);

        // L'agent est archivé à partir de la période courante, il ne sera plus visible dans les suivantes
        $sqlite->prepare("UPDATE agents SET exit_date = ?, exit_reason = ?, archived_period = ? WHERE id = ?")
               ->execute([$departure_date, $exit_reason, $period, $agent_id]);

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $dates = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

        $stmtShift = $sqlite->prepare("SELECT shift_type FROM agents WHERE id = ?");
        $stmtShift->execute([$agent_id]);
        $agentRow    = $stmtShift->fetch();
        $shiftType   = $agentRow['shift_type'] ?? '';
        $targetShift = ($shiftType === 'Nuit' || $shiftType === 'N') ? 'N' : 'J';

        $sqlite->beginTransaction();
        $stmtDel = $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND period = ?');
        $stmtIns = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        $filling = false;
        foreach ($dates as $d) {
            if ($d >= $departure_date) $filling = true;
            if ($filling) {
                $stmtDel->execute([$agent_id, $d, $period]);
                $stmtIns->execute([$agent_id, $d, $targetShift, $type, $company_id, $serviceKey, $period]);
            }
        }
        $sqlite->commit();
        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'delete_agent_sortant':
        $agent_id = $data['agent_id'] ?? '';
        $period   = $data['period'] ?? date('Y-m');

        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'message' => "Période verrouillée."]);
            break;
        }

        $sqlite->beginTransaction();
        try {
            // 1. Récupérer la date de sortie (exit_date)
            $stmtAg = $sqlite->prepare("SELECT exit_date FROM agents WHERE id = ?");
            $stmtAg->execute([$agent_id]);
            $agentRow = $stmtAg->fetch();
            $exit_date = $agentRow['exit_date'] ?? null;

            // 2. Supprimer les statuts d'abandon de la table attendance
            if ($exit_date) {
                $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND period = ? AND date >= ? AND (status IN ('ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT') OR status LIKE 'SORTANT_%')")
                       ->execute([$agent_id, $period, $exit_date]);
            } else {
                // Si pas de exit_date trouvé, on nettoie tous les statuts abandon de la période
                $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND period = ? AND (status IN ('ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT') OR status LIKE 'SORTANT_%')")
                       ->execute([$agent_id, $period]);
            }

            // 3. Réinitialiser les champs de sortie de l'agent
            $sqlite->prepare("UPDATE agents SET exit_date = NULL, exit_reason = NULL, archived_period = NULL WHERE id = ?")
                   ->execute([$agent_id]);

            // 4. Restaurer les pointages manquants
            $stmtAgRest = $sqlite->prepare("SELECT id, shift_type, profile_data, company_id FROM agents WHERE id = ?");
            $stmtAgRest->execute([$agent_id]);
            $agentToRestore = $stmtAgRest->fetch();
            if ($agentToRestore) {
                $serviceKey = $_SESSION['service_id'] ?? null;
                $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
                $start_day   = (int)($settingsRow['cycle_start'] ?? 21);
                $end_day     = (int)($settingsRow['cycle_end'] ?? 20);
                $datesList   = getPeriodDates($period, $start_day, $end_day);
                
                $stype     = $agentToRestore['shift_type'] ?? 'Jour';
                $cycle     = 1; $work = 1;
                $profile = json_decode($agentToRestore['profile_data'] ?? '{}', true) ?: [];
                $isSpecial = !empty($profile['special_service']);
                $specialDays = $profile['special_service_days'] ?? [];
                $isAdminSchedule = !empty($profile['admin_schedule']);
                
                $stmtAtt = $sqlite->prepare('INSERT IGNORE INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
                
                if ($stype === 'Nuit' || $stype === 'Jour') {
                    $shift_key = ($stype === 'Nuit') ? 'N' : 'J';
                    foreach ($datesList as $ds) {
                        $ts = strtotime($ds);
                        $jsDay = (int)date('N', $ts); // 1 to 7

                        $skip = false;
                        if ($isSpecial) {
                            if (!in_array($jsDay, $specialDays) && !in_array((string)$jsDay, $specialDays)) $skip = true;
                        } else if ($isAdminSchedule) {
                            if ($jsDay === 6 || $jsDay === 7) $skip = true;
                        }

                        if (!$skip) {
                            $stmtAtt->execute([$agentToRestore['id'], $ds, $shift_key, '1', $agentToRestore['company_id'], $serviceKey, $period]);
                        } else {
                            $stmtAtt->execute([$agentToRestore['id'], $ds, $shift_key, 'R', $agentToRestore['company_id'], $serviceKey, $period]);
                        }
                    }
                } else {
                    $stype_lower = strtolower($stype);
                    if ($stype_lower === '24h') { $cycle = 2; $work = 1; }
                    elseif ($stype_lower === '48h') { $cycle = 3; $work = 1; }
                    elseif ($stype_lower === '72h') { $cycle = 4; $work = 1; }
                    
                    if ($cycle > 1) {
                        $dayIndex = 0;
                        foreach ($datesList as $ds) {
                            $rem = $dayIndex % $cycle;
                            if ($rem < $work) {
                                $stmtAtt->execute([$agentToRestore['id'], $ds, 'J', '1', $agentToRestore['company_id'], $serviceKey, $period]);
                            } else {
                                $stmtAtt->execute([$agentToRestore['id'], $ds, 'J', 'R', $agentToRestore['company_id'], $serviceKey, $period]);
                            }
                            $dayIndex++;
                        }
                    }
                }
            }

            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression de l\'abandon.']);
        }
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'mark_agent_entrant':
        $agent_id   = $data['agent_id'] ?? '';
        $start_date = $data['start_date'] ?? '';
        $function   = $data['function'] ?? '';
        $period     = $data['period'] ?? date('Y-m');

        if (!$agent_id || !$start_date) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        // Normaliser la date
        $dateObj = DateTime::createFromFormat('Y-m-d', $start_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d/m/Y', $start_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d-m-Y', $start_date);
        $start_date = $dateObj ? $dateObj->format('Y-m-d') : date('Y-m-d', strtotime(str_replace('/', '-', $start_date)));

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK ─────────────────────────────────────────────────────────
        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "Période $period verrouillée (publiée). Dépubliez d'abord."]);
            break;
        }

        if ($function) {
            $sqlite->prepare("UPDATE agents SET `function` = ?, hire_date = ? WHERE id = ?")
                   ->execute([$function, $start_date, $agent_id]);
        } else {
            $sqlite->prepare("UPDATE agents SET hire_date = ? WHERE id = ?")
                   ->execute([$start_date, $agent_id]);
        }

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $dates = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

        $stmtShift = $sqlite->prepare("SELECT shift_type FROM agents WHERE id = ?");
        $stmtShift->execute([$agent_id]);
        $agentRow    = $stmtShift->fetch();
        $shiftType   = $agentRow['shift_type'] ?? '';
        $targetShift = ($shiftType === 'Nuit' || $shiftType === 'N') ? 'N' : 'J';

        $sqlite->beginTransaction();
        $stmtDel = $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND period = ?');
        $stmtIns = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        foreach ($dates as $d) {
            if ($d < $start_date) {
                $stmtDel->execute([$agent_id, $d, $period]);
                $stmtIns->execute([$agent_id, $d, $targetShift, 'ENTRANT', $company_id, $serviceKey, $period]);
            }
        }
        $sqlite->commit();
        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'delete_agent_entrant':
        $agent_id = $data['agent_id'] ?? '';
        $period   = $data['period'] ?? date('Y-m');

        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent ID manquant']);
            break;
        }

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "Période $period verrouillée."]);
            break;
        }

        try {
            $sqlite->beginTransaction();

            $stmtAg = $sqlite->prepare("UPDATE agents SET hire_date = NULL WHERE id = ?");
            $stmtAg->execute([$agent_id]);

            $stmtAgInfo = $sqlite->prepare("SELECT * FROM agents WHERE id = ?");
            $stmtAgInfo->execute([$agent_id]);
            $agentToRestore = $stmtAgInfo->fetch();

            if ($agentToRestore) {
                $stmtDel = $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND status = 'ENTRANT' AND period = ?");
                $stmtDel->execute([$agent_id, $period]);

                $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
                $datesList = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

                $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

                $shift_key = ($agentToRestore['shift_type'] === 'Nuit' || $agentToRestore['shift_type'] === 'N') ? 'N' : 'J';
                $stype = $agentToRestore['shift_type'] ?? '';

                if (in_array(strtolower($stype), ['jour', 'j', 'nuit', 'n', ''])) {
                    $specialDaysStr = $agentToRestore['scheduled_days'] ?? '';
                    $specialDays = $specialDaysStr !== '' ? explode(',', $specialDaysStr) : [];
                    $profileDataStr = $agentToRestore['profile_data'] ?? '{}';
                    $profileData = json_decode($profileDataStr, true);
                    $isAdminSchedule = !empty($profileData['admin_schedule']);

                    foreach ($datesList as $ds) {
                        $checkAtt = $sqlite->prepare("SELECT 1 FROM attendance WHERE agent_id = ? AND date = ?");
                        $checkAtt->execute([$agentToRestore['id'], $ds]);
                        if ($checkAtt->fetch()) continue;

                        $dObj = DateTime::createFromFormat('Y-m-d', $ds);
                        $jsDay = $dObj ? (int)$dObj->format('w') : 0;
                        if ($jsDay === 0) $jsDay = 7;

                        $skip = false;
                        if (count($specialDays) > 0) {
                            if (!in_array($jsDay, $specialDays) && !in_array((string)$jsDay, $specialDays)) $skip = true;
                        } else if ($isAdminSchedule) {
                            if ($jsDay === 6 || $jsDay === 7) $skip = true;
                        }

                        if (!$skip) {
                            $stmtAtt->execute([$agentToRestore['id'], $ds, $shift_key, '1', $agentToRestore['company_id'], $serviceKey, $period]);
                        } else {
                            $stmtAtt->execute([$agentToRestore['id'], $ds, $shift_key, 'R', $agentToRestore['company_id'], $serviceKey, $period]);
                        }
                    }
                } else {
                    $stype_lower = strtolower($stype);
                    if ($stype_lower === '24h') { $cycle = 2; $work = 1; }
                    elseif ($stype_lower === '48h') { $cycle = 3; $work = 1; }
                    elseif ($stype_lower === '72h') { $cycle = 4; $work = 1; }
                    
                    if (isset($cycle) && $cycle > 1) {
                        $dayIndex = 0;
                        foreach ($datesList as $ds) {
                            $checkAtt = $sqlite->prepare("SELECT 1 FROM attendance WHERE agent_id = ? AND date = ?");
                            $checkAtt->execute([$agentToRestore['id'], $ds]);
                            if (!$checkAtt->fetch()) {
                                $rem = $dayIndex % $cycle;
                                if ($rem < $work) {
                                    $stmtAtt->execute([$agentToRestore['id'], $ds, 'J', '1', $agentToRestore['company_id'], $serviceKey, $period]);
                                } else {
                                    $stmtAtt->execute([$agentToRestore['id'], $ds, 'J', 'R', $agentToRestore['company_id'], $serviceKey, $period]);
                                }
                            }
                            $dayIndex++;
                        }
                    }
                }
            }

            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()]);
        }
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'mark_agent_debut':
        try {
            $agent_id    = $data['agent_id'] ?? '';
            $start_date  = $data['start_date'] ?? '';
        $ancien_site = $data['ancien_site'] ?? '';
        $period      = $data['period'] ?? date('Y-m');

        if (!$agent_id || !$start_date || !$ancien_site) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        // Normaliser la date
        $dateObj = DateTime::createFromFormat('Y-m-d', $start_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d/m/Y', $start_date);
        if (!$dateObj) $dateObj = DateTime::createFromFormat('d-m-Y', $start_date);
        $start_date = $dateObj ? $dateObj->format('Y-m-d') : date('Y-m-d', strtotime(str_replace('/', '-', $start_date)));

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK ─────────────────────────────────────────────────────────
        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "Période $period verrouillée (publiée). Dépubliez d'abord."]);
            break;
        }

        // Mettre à jour la date d'embauche sur le nouveau site
        $sqlite->prepare("UPDATE agents SET hire_date = ? WHERE id = ?")
               ->execute([$start_date, $agent_id]);

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $dates = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

        $stmtShift = $sqlite->prepare("SELECT shift_type FROM agents WHERE id = ?");
        $stmtShift->execute([$agent_id]);
        $agentRow    = $stmtShift->fetch();
        $shiftType   = $agentRow['shift_type'] ?? '';
        $targetShift = ($shiftType === 'Nuit' || $shiftType === 'N') ? 'N' : 'J';

        $statusToInsert = "PM|" . $ancien_site;

        $sqlite->beginTransaction();
        $stmtDel = $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND period = ?');
        $stmtIns = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        foreach ($dates as $d) {
            if ($d < $start_date) {
                $stmtDel->execute([$agent_id, $d, $period]);
                $stmtIns->execute([$agent_id, $d, $targetShift, $statusToInsert, $company_id, $serviceKey, $period]);
            }
        }
        $sqlite->commit();
        echo json_encode(['success' => true]);
        } catch (\Throwable $e) {
            if (isset($sqlite)) {
                @$sqlite->rollBack();
            }
            echo json_encode(['success' => false, 'message' => "Erreur backend: " . $e->getMessage() . " (" . $e->getFile() . ":" . $e->getLine() . ")"]);
        }
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'apply_mutation':
        $agent_id               = $data['agent_id'] ?? '';
        $start_date             = $data['start_date'] ?? '';
        $destination_subsite_id = $data['destination_subsite_id'] ?? '';
        $destination_name       = $data['destination_name'] ?? '';
        $new_shift_type         = $data['new_shift_type'] ?? 'CONSERVER';
        $new_function           = $data['new_function'] ?? 'CONSERVER';
        $merge_mode             = $data['merge_mode'] ?? 'smart';
        $period                 = $data['period'] ?? '';

        if (!$agent_id || !$start_date || !$destination_subsite_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        // Timeout explicite : évite le blocage indéfini sur MySQL
        set_time_limit(60);

        $sqlite     = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        // ─── LOCK ─────────────────────────────────────────────────────────
        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "Période $period verrouillée (publiée). Dépubliez d'abord."]);
            break;
        }

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $datesList   = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

        if (empty($datesList)) {
            echo json_encode(['success' => false, 'message' => 'Période invalide']);
            break;
        }

        $end_date_str = end($datesList);
        $end_time     = strtotime($end_date_str);
        $start_time   = strtotime($start_date);

        if ($start_time > $end_time) {
            echo json_encode(['success' => false, 'message' => 'Date de début invalide']);
            break;
        }

        // Charger l'agent original
        $stmtOrig = $sqlite->prepare("SELECT * FROM agents WHERE id = ? AND company_id = ?");
        $stmtOrig->execute([$agent_id, $company_id]);
        $orig_agent = $stmtOrig->fetch();
        if (!$orig_agent) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
            break;
        }

        $actual_orig_stype = $orig_agent['shift_type'] ?: 'Jour';

        // Mettre à jour le type de shift si demandé
        $current_history = [];
        if ($new_shift_type && $new_shift_type !== 'CONSERVER') {
            if (!empty($orig_agent['shift_history'])) {
                $current_history = json_decode($orig_agent['shift_history'], true) ?: [];
            }
            if (empty($current_history)) {
                $current_history[] = ['type' => $actual_orig_stype, 'from' => '1970-01-01'];
            }
            $current_history[] = ['type' => $new_shift_type, 'from' => $start_date];
            $orig_agent['shift_history'] = json_encode($current_history);
            $orig_agent['shift_type']    = $new_shift_type;
        }

        $final_function  = ($new_function && $new_function !== 'CONSERVER') ? $new_function : $orig_agent['function'];
        $profile_data    = json_decode($orig_agent['profile_data'] ?? '{}', true) ?: [];
        if ($new_function && $new_function !== 'CONSERVER' && $new_function !== $orig_agent['function']) {
            $profile_data['mutated_from_function'] = $orig_agent['function'];
        }
        $profile_data_json = json_encode($profile_data);

        // Dupliquer l'agent vers le site de destination
        $new_agent_id = 'ag_' . time() . '_' . $orig_agent['id'];
        $sqlite->prepare("INSERT INTO agents (id, name, subsite_id, `function`, shift_type, company_id, service_id, shift_history, has_sp, hire_date, recruitment_cost, salary, profile_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
               ->execute([
                   $new_agent_id, $orig_agent['name'], $destination_subsite_id,
                   $final_function, $orig_agent['shift_type'],
                   $orig_agent['company_id'], $orig_agent['service_id'],
                   $orig_agent['shift_history'], $orig_agent['has_sp'],
                   $orig_agent['hire_date'] ?? null,
                   $orig_agent['recruitment_cost'] ?? 0,
                   $orig_agent['salary'] ?? 0,
                   $profile_data_json
               ]);

        // Libellé d'origine
        $orig_subsite_id = $orig_agent['subsite_id'] ?? '';
        $origin_label    = '';
        if ($orig_subsite_id) {
            $special_map = [
                'site_extras_1'  => ['site' => '🌟 EXTRA BUREAU',   'zone' => 'Agents Disponibles'],
                'site_releves_1' => ['site' => '🔄 Vivier des relèves',  'zone' => 'Agents Disponibles'],
                'site_admin_1'   => ['site' => '🏢 Administration',       'zone' => 'Bureau'],
            ];
            if (isset($special_map[$orig_subsite_id])) {
                $origin_label = $special_map[$orig_subsite_id]['site'] . ' - ' . $special_map[$orig_subsite_id]['zone'];
            } else {
                $stmtSubName = $sqlite->prepare("SELECT s.name as site_name, sub.name as zone_name, sub.site_id FROM subsites sub LEFT JOIN sites s ON sub.site_id = s.id WHERE sub.id = ?");
                $stmtSubName->execute([$orig_subsite_id]);
                $origNames    = $stmtSubName->fetch();
                if ($origNames) {
                    if ($origNames['site_id'] === 'site_itc') {
                        $origin_label = 'ITC/IFM - ' . $origNames['zone_name'];
                    } else {
                        $sname = !empty($origNames['site_name']) ? $origNames['site_name'] : $origNames['site_id'];
                        $origin_label = $sname . ' - ' . $origNames['zone_name'];
                    }
                } else {
                    $origin_label = $orig_subsite_id;
                }
            }
        }

        // ─── BATCH INSERT : accumulation des lignes puis insertion unique ────
        $batchRows     = [];
        $cursor        = strtotime($datesList[0]);
        $stype         = $orig_agent['shift_type'] ?: 'Jour';
        $cycle_counter = 0;

        // ++ SAUVEGARDE DES ACTIONS FUTURES EXISTANTES ++
        $stmtFuture = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ? AND status NOT IN ('1', 'R')");
        $stmtFuture->execute([$agent_id, $period]);
        $future_rows = $stmtFuture->fetchAll();
        $future_att  = [];
        foreach ($future_rows as $row) {
            $future_att[$row['shift_code']][$row['date']] = $row['status'];
        }
        // +++++++++++++++++++++++++++++++++++++++++++++++

        while ($cursor <= $end_time) {
            $date_str = date('Y-m-d', $cursor);
            if ($cursor < $start_time) {
                // Avant mutation : marquer le nouvel agent comme provenant du site d'origine
                $status_new = 'PM|' . $origin_label;
                if ($merge_mode === 'classic' || in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Jour') {
                    $batchRows[] = [$new_agent_id, $date_str, 'J', $status_new, $company_id, $serviceKey, $period];
                }
                if ($merge_mode === 'classic' || in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Nuit') {
                    $batchRows[] = [$new_agent_id, $date_str, 'N', $status_new, $company_id, $serviceKey, $period];
                }
            } else {
                // Après mutation : marquer l'agent original comme muté
                $status_old = 'M|' . $destination_name;
                if (in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Jour') {
                    $batchRows[] = [$agent_id, $date_str, 'J', $status_old, $company_id, $serviceKey, $period];
                }
                if (in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Nuit') {
                    $batchRows[] = [$agent_id, $date_str, 'N', $status_old, $company_id, $serviceKey, $period];
                }
                
                // +++ REINJECTION DES ACTIONS SAUVEGARDEES +++
                $saved_J = $future_att['J'][$date_str] ?? null;
                $saved_N = $future_att['N'][$date_str] ?? null;
                $saved_any = $saved_J ?? $saved_N;
                
                // Nouvel agent : générer son planning
                if ($stype === 'Nuit') {
                    $batchRows[] = [$new_agent_id, $date_str, 'N', $saved_any ?? '1', $company_id, $serviceKey, $period];
                } elseif ($stype === 'Jour') {
                    $batchRows[] = [$new_agent_id, $date_str, 'J', $saved_any ?? '1', $company_id, $serviceKey, $period];
                } else {
                    $cycle = 1; $work = 1;
                    $stype_lower = strtolower($stype);
                    if ($stype_lower === '24h') { $cycle = 2; $work = 1; }
                    elseif ($stype_lower === '48h') { $cycle = 4; $work = 2; }
                    elseif ($stype_lower === '72h') { $cycle = 6; $work = 3; }
                    $val = (($cycle_counter % $cycle) < $work) ? '1' : 'R';
                    
                    $final_action = $val;
                    if ($val === '1' && $saved_any !== null) {
                        $final_action = $saved_any;
                    }
                    
                    $batchRows[] = [$new_agent_id, $date_str, 'J', $final_action, $company_id, $serviceKey, $period];
                    $batchRows[] = [$new_agent_id, $date_str, 'N', $final_action, $company_id, $serviceKey, $period];
                    $cycle_counter++;
                }
            }
            $cursor = strtotime('+1 day', $cursor);
        }

        $sqlite->beginTransaction();
        try {
            // Suppression des anciennes lignes
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND period = ?")->execute([$new_agent_id, $period]);
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND date >= ? AND date <= ? AND period = ?")->execute([$agent_id, $start_date, $end_date_str, $period]);

            // INSERT en batch : un seul appel SQL au lieu de N appels individuels
            if (!empty($batchRows)) {
                $placeholders = implode(',', array_fill(0, count($batchRows), '(?,?,?,?,?,?,?)'));
                $flatValues   = array_merge(...$batchRows);
                $sqlite->prepare("INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES $placeholders")
                       ->execute($flatValues);
            }

            // Archive the old agent so they don't show up in future periods
            $sqlite->prepare("UPDATE agents SET archived_period = ? WHERE id = ?")->execute([$period, $agent_id]);

            $sqlite->commit();
        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la mutation : ' . $e->getMessage()]);
            break;
        }

        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'apply_batch_rotation':
        $agent_id   = $data['agent_id'] ?? '';
        $period     = $data['period'] ?? '';
        $cycle      = (int)($data['cycle'] ?? 0);
        $work       = (int)($data['work'] ?? 0);
        $offset     = (int)($data['offset'] ?? 0);
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (!$agent_id || !$period || $cycle <= 0) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite     = getDb();
        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);

        $stype = $data['shift_type'] ?? '';
        if (!$stype) {
            $stmt  = $sqlite->prepare("SELECT shift_type FROM agents WHERE id = ?");
            $stmt->execute([$agent_id]);
            $res   = $stmt->fetch();
            $stype = $res['shift_type'] ?? 'Jour';
        } else {
            $sqlite->prepare("UPDATE agents SET shift_type = ? WHERE id = ?")->execute([$stype, $agent_id]);
        }

        // Sauvegarder les MAP/CP/AT/P existants
        $stmtFuture = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ? AND status IN ('MAP', 'CP', 'AT', 'M', 'P')");
        $stmtFuture->execute([$agent_id, $period]);
        $future_rows = $stmtFuture->fetchAll();
        $future_att  = [];
        foreach ($future_rows as $row) {
            $future_att[$row['shift_code']][$row['date']] = $row['status'];
        }

        // Charger les congés globaux de l'agent
        $stmtLeaves = $sqlite->prepare("SELECT start_date, end_date, type FROM pointage_leaves WHERE agent_id = ? AND status = 'approved'");
        $stmtLeaves->execute([$agent_id]);
        $global_leaves = $stmtLeaves->fetchAll();

        $sqlite->beginTransaction();
        try {
            $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND period = ?')->execute([$agent_id, $period]);
            $stmtAtt   = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $datesList = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

            foreach ($datesList as $i => $t_str) {
                $pos = ($i - $offset) % $cycle;
                if ($pos < 0) $pos += $cycle;

                $genJ = null;
                $genN = null;

                if ($pos < $work) {
                    if ($stype === 'Nuit')      $genN = '1';
                    elseif ($stype === 'Jour') $genJ = '1';
                    else                       { $genJ = '1'; $genN = '1'; }
                } else {
                    if ($stype !== 'Jour' && $stype !== 'Nuit') { $genJ = 'R'; $genN = 'R'; }
                    elseif ($stype === 'Nuit')  $genN = 'R';
                    else                        $genJ = 'R';
                }

                if ($genJ !== null) {
                    if (isset($future_att['J'][$t_str])) {
                        $genJ = $future_att['J'][$t_str];
                    } else if ($genJ === '1') {
                        foreach ($global_leaves as $l) {
                            if ($t_str >= $l['start_date'] && $t_str <= $l['end_date']) {
                                $genJ = $l['type'];
                                break;
                            }
                        }
                    }
                    $stmtAtt->execute([$agent_id, $t_str, 'J', $genJ, $company_id, $serviceKey, $period]);
                }
                if ($genN !== null) {
                    if (isset($future_att['N'][$t_str])) {
                        $genN = $future_att['N'][$t_str];
                    } else if ($genN === '1') {
                        foreach ($global_leaves as $l) {
                            if ($t_str >= $l['start_date'] && $t_str <= $l['end_date']) {
                                $genN = $l['type'];
                                break;
                            }
                        }
                    }
                    $stmtAtt->execute([$agent_id, $t_str, 'N', $genN, $company_id, $serviceKey, $period]);
                }
            }
            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la génération.']);
        }
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'init_site_period':
        $site_id    = $data['site_id'] ?? '';
        $period     = $data['period'] ?? '';
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (!$site_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite      = getDb();
        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $start_day   = (int)($settingsRow['cycle_start'] ?? 21);
        $end_day     = (int)($settingsRow['cycle_end'] ?? 20);
        $datesList   = getPeriodDates($period, $start_day, $end_day);

        // Charger tous les agents du site (via toutes les sous-zones)
        $stmtSubs = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
        $stmtSubs->execute([$site_id]);
        $subs = $stmtSubs->fetchAll();

        // Sites spéciaux
        if (empty($subs)) {
            if ($site_id === 'site_extras')         $subs = [['id' => 'site_extras_1']];
            elseif ($site_id === 'site_extras_sur_site') $subs = []; // user generated
            elseif ($site_id === 'site_releves')    $subs = [['id' => 'site_releves_1']];
            elseif ($site_id === 'site_administration') $subs = [['id' => 'site_admin_1']];
            elseif ($site_id === 'site_itc')        $subs = [['id' => 'site_itc_tenue'], ['id' => 'site_itc_costume'], ['id' => 'site_itc_as']];
        }

        $stmtAtt    = $sqlite->prepare('INSERT IGNORE INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $initialized = 0;

        foreach ($subs as $sub) {
            $stmtAg = $sqlite->prepare("SELECT id, shift_type, profile_data FROM agents WHERE subsite_id = ? AND company_id = ? AND (archived_period IS NULL OR archived_period >= ?)");
            $stmtAg->execute([$sub['id'], $company_id, $period]);
            $agents = $stmtAg->fetchAll();

            foreach ($agents as $agent) {
                // Vérifier si l'agent a déjà des données pour cette période
                $stmtCheck = $sqlite->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE agent_id = ? AND period = ?");
                $stmtCheck->execute([$agent['id'], $period]);
                $existing = (int)($stmtCheck->fetch()['cnt'] ?? 0);
                if ($existing > 0) continue; // Ne pas écraser

                $stype     = $agent['shift_type'] ?? 'Jour';
                $cycle     = 1; $work = 1;

                $profile = json_decode($agent['profile_data'] ?? '{}', true) ?: [];
                $isSpecial = !empty($profile['special_service']);
                $specialDays = $profile['special_service_days'] ?? [];
                $isAdminSchedule = !empty($profile['admin_schedule']);

                // Charger les congés globaux de l'agent
                $stmtLeaves = $sqlite->prepare("SELECT start_date, end_date, type FROM pointage_leaves WHERE agent_id = ? AND status = 'approved'");
                $stmtLeaves->execute([$agent['id']]);
                $global_leaves = $stmtLeaves->fetchAll();

                if ($stype === 'Nuit' || $stype === 'Jour') {
                    $shift_key = ($stype === 'Nuit') ? 'N' : 'J';
                    foreach ($datesList as $ds) {
                        $ts = strtotime($ds);
                        $jsDay = (int)date('N', $ts); // 1 to 7

                        $skip = false;
                        if ($isSpecial) {
                            if (!in_array($jsDay, $specialDays) && !in_array((string)$jsDay, $specialDays)) {
                                $skip = true;
                            }
                        } else if ($isAdminSchedule) {
                            if ($jsDay === 6 || $jsDay === 7) {
                                $skip = true;
                            }
                        }

                        if (!$skip) {
                            $genJ = '1';
                            foreach ($global_leaves as $l) {
                                if ($ds >= $l['start_date'] && $ds <= $l['end_date']) {
                                    $genJ = $l['type'];
                                    break;
                                }
                            }
                            $stmtAtt->execute([$agent['id'], $ds, $shift_key, $genJ, $company_id, $serviceKey, $period]);
                        } else {
                            $stmtAtt->execute([$agent['id'], $ds, $shift_key, 'R', $company_id, $serviceKey, $period]);
                        }
                    }
                } else {
                    $stype_lower = strtolower($stype);
                    if ($stype_lower === '24h') { $cycle = 2; $work = 1; }
                    elseif ($stype_lower === '48h') { $cycle = 4; $work = 2; }
                    elseif ($stype_lower === '72h') { $cycle = 6; $work = 3; }

                    foreach ($datesList as $idx => $ds) {
                        $ts = strtotime($ds);
                        $jsDay = (int)date('N', $ts); // 1 to 7

                        $skip = false;
                        if ($isSpecial) {
                            if (!in_array($jsDay, $specialDays) && !in_array((string)$jsDay, $specialDays)) {
                                $skip = true;
                            }
                        } else if ($isAdminSchedule) {
                            if ($jsDay === 6 || $jsDay === 7) {
                                $skip = true;
                            }
                        }

                        if (!$skip) {
                            $pos = $idx % $cycle;
                            $val = ($pos < $work) ? '1' : 'R';
                            
                            $genJ = $val;
                            $genN = $val;
                            if ($val === '1') {
                                foreach ($global_leaves as $l) {
                                    if ($ds >= $l['start_date'] && $ds <= $l['end_date']) {
                                        $genJ = $l['type'];
                                        $genN = $l['type'];
                                        break;
                                    }
                                }
                            }
                            
                            $stmtAtt->execute([$agent['id'], $ds, 'J', $genJ, $company_id, $serviceKey, $period]);
                            $stmtAtt->execute([$agent['id'], $ds, 'N', $genN, $company_id, $serviceKey, $period]);
                        } else {
                            $stmtAtt->execute([$agent['id'], $ds, 'J', 'R', $company_id, $serviceKey, $period]);
                            $stmtAtt->execute([$agent['id'], $ds, 'N', 'R', $company_id, $serviceKey, $period]);
                        }
                    }
                }
                $initialized++;
            }
        }

        echo json_encode(['success' => true, 'initialized' => $initialized]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'add_external_supp':
        $agent_id = $data['agent_id'] ?? '';
        $site_origine_id = $data['site_origine_id'] ?? '';
        $site_destination_id = $data['site_destination_id'] ?? '';
        $date_supp = $data['date_supp'] ?? '';
        $vacation = $data['vacation'] ?? ''; // e.g., '12H J', '12H N', '24H'
        $period = $data['period'] ?? date('Y-m');
        $agent_remplace = $data['agent_remplace'] ?? '';
        $motif = $data['motif'] ?? '';

        if (!$agent_id || !$site_origine_id || !$site_destination_id || !$date_supp || !$vacation) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "La période $period est verrouillée."]);
            break;
        }

        // 1. Déterminer le shift_code et le nombre de jours
        $shift_code = 'S';
        if (strpos($vacation, ' J') !== false || $vacation === 'Jour') {
            $shift_code = 'SJ';
        } elseif (strpos($vacation, ' N') !== false || $vacation === 'Nuit') {
            $shift_code = 'SN';
        }

        $shifts_to_insert = [];
        $days = 1;
        if (in_array(strtoupper($vacation), ['24H', '48H', '72H'])) {
            $shifts_to_insert = ['SJ', 'SN'];
            if (strtoupper($vacation) === '48H') $days = 2;
            if (strtoupper($vacation) === '72H') $days = 3;
        } else {
            $shifts_to_insert = [$shift_code];
        }

        // 2. Mettre à jour l'agent sur le site d'origine (activer la ligne SP)
        $sp_level = count($shifts_to_insert) > 1 ? 2 : 1;
        $sqlite->prepare("UPDATE agents SET has_sp = 2 WHERE id = ?")->execute([$agent_id]);

        $sqlite->beginTransaction();

        // 4. Enregistrer dans supplementaires_externes (Une seule fois pour la période couverte)
        $sqlite->prepare('INSERT INTO supplementaires_externes (company_id, agent_id, site_origine_id, site_destination_id, date_supp, vacation, periode, agent_remplace) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
               ->execute([$company_id, $agent_id, $site_origine_id, $site_destination_id, $date_supp, $vacation, $period, $agent_remplace]);

        $baseTime = strtotime($date_supp);
        for ($i = 0; $i < $days; $i++) {
            $current_date = date('Y-m-d', strtotime("+$i days", $baseTime));

            // 3. Insérer le pointage 'Suppl' sur le site d'origine
            foreach ($shifts_to_insert as $sc) {
                $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                       ->execute([$agent_id, $current_date, $sc, $period]);

                $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)')
                       ->execute([$agent_id, $current_date, $sc, "Suppl|$site_destination_id", $company_id, $serviceKey, $period]);
            }

            // 5. Appliquer le motif à l'agent remplacé si fourni
            if ($agent_remplace && $motif) {
                $target_shift_code = 'J';
                if ($shift_code === 'SJ') $target_shift_code = 'J';
                elseif ($shift_code === 'SN') $target_shift_code = 'N';
                
                $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                       ->execute([$agent_remplace, $current_date, $target_shift_code, $period]);
                       
                $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)')
                       ->execute([$agent_remplace, $current_date, $target_shift_code, $motif, $company_id, $serviceKey, $period]);
            }
        }

        $sqlite->commit();

        echo json_encode(['success' => true]);
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'get_external_supp_details':
        $agent_id = $data['agent_id'] ?? '';
        $date = $data['date'] ?? '';
        $shift_code = $data['shift_code'] ?? '';
        
        if (!$agent_id || !$date) {
            echo json_encode(['success' => false]);
            break;
        }

        $shift_condition = "";
        if ($shift_code === 'SJ') {
            $shift_condition = "AND (s.vacation LIKE '%J%' OR s.vacation = 'Jour' OR s.vacation IN ('24H', '48H', '72H'))";
        } elseif ($shift_code === 'SN') {
            $shift_condition = "AND (s.vacation LIKE '%N%' OR s.vacation = 'Nuit' OR s.vacation IN ('24H', '48H', '72H'))";
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        $stmt = $sqlite->prepare("
            SELECT s.*, COALESCE(sub.name, st.name) as destination_name, r.name as replaced_agent_name,
                   a.`function` as agent_poste, a.profile_data, r.`function` as replaced_agent_poste
            FROM supplementaires_externes s 
            LEFT JOIN subsites sub ON s.site_destination_id = sub.id 
            LEFT JOIN sites st ON s.site_destination_id = st.id
            LEFT JOIN agents r ON (s.agent_remplace = r.id OR s.agent_remplace = r.name)
            LEFT JOIN agents a ON s.agent_id = a.id
            WHERE s.agent_id = ? $shift_condition
            AND (
                s.date_supp = ?
                OR (s.vacation = '48H' AND ? = DATE_ADD(s.date_supp, INTERVAL 1 DAY))
                OR (s.vacation = '72H' AND ? IN (DATE_ADD(s.date_supp, INTERVAL 1 DAY), DATE_ADD(s.date_supp, INTERVAL 2 DAY)))
            )
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $stmt->execute([$agent_id, $date, $date, $date]);
        $res = $stmt->fetch();
        
        if ($res) {
            // Résoudre le nom du site virtuel si le JOIN n'a rien trouvé
            if (empty($res['destination_name'])) {
                $dest_id = $res['site_destination_id'] ?? '';
                if ($dest_id === 'default_site_extras_sur_site') {
                    $res['destination_name'] = 'Zone Principale';
                } elseif ($dest_id === 'site_extras' || $dest_id === 'site_extras_sur_site') {
                    $res['destination_name'] = 'Site Extra';
                } else {
                    $res['destination_name'] = '—';
                }
            }
            // Compute montant_a_percevoir
            // 1. Taux journalier habituel de l'agent
            $agent_poste = $res['agent_poste'];
            $stmtAgent = $sqlite->prepare("SELECT taux_horaire FROM salary_grid WHERE company_id = ? AND poste = ? ORDER BY id DESC LIMIT 1");
            $stmtAgent->execute([$company_id, $agent_poste]);
            $agent_base = $stmtAgent->fetchColumn();
            if (!$agent_base) $agent_base = 75000;
            $agentBaseJournaliere = $agent_base / 30;
            
            // 2. Taux journalier du poste remplacé (le cas échéant)
            $replacedBaseJournaliere = 0;
            $has_replacement = !empty($res['replaced_agent_poste']);
            if ($has_replacement) {
                $replaced_poste = $res['replaced_agent_poste'];
                $stmtRep = $sqlite->prepare("SELECT taux_horaire FROM salary_grid WHERE company_id = ? AND poste = ? ORDER BY id DESC LIMIT 1");
                $stmtRep->execute([$company_id, $replaced_poste]);
                $rep_base = $stmtRep->fetchColumn();
                if ($rep_base) {
                    $replacedBaseJournaliere = $rep_base / 30;
                }
            }
            
            // 3. Montant final selon les 3 scénarios originaux (différence)
            if ($has_replacement) {
                if ($replacedBaseJournaliere > $agentBaseJournaliere) {
                    // Scénario A : Remplace un poste supérieur -> Perçoit le bonus (différence)
                    $baseJournaliereFinale = $replacedBaseJournaliere - $agentBaseJournaliere;
                } else {
                    // Scénario B : Remplace un poste inférieur -> S'adapte au taux remplacé
                    $baseJournaliereFinale = $replacedBaseJournaliere;
                }
            } else {
                // Scénario C : Aucun remplacement -> Perçoit son propre taux
                $baseJournaliereFinale = $agentBaseJournaliere;
            }
            
            $amountPerShift = round($baseJournaliereFinale);
            
            $vacation = strtoupper($res['vacation']);
            $shifts = 1;
            if ($vacation === '24H') $shifts = 2;
            if ($vacation === '48H') $shifts = 4;
            if ($vacation === '72H') $shifts = 6;
            
            $res['montant_a_percevoir'] = $amountPerShift * $shifts;

            echo json_encode(['success' => true, 'data' => $res]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;

    // ─────────────────────────────────────────────────────────────────────────
    case 'delete_external_supp':
        $agent_id = $data['agent_id'] ?? '';
        $date = $data['date'] ?? '';
        $shift_code = $data['shift_code'] ?? '';
        $period = $data['period'] ?? date('Y-m');

        if (!$agent_id || !$date) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        if (isPayrollPeriodLocked($sqlite, $company_id, $period)) {
            echo json_encode(['success' => false, 'period_locked' => true, 'message' => "La période $period est verrouillée."]);
            break;
        }

        $shift_condition = "";
        if ($shift_code === 'SJ') {
            $shift_condition = "AND (vacation LIKE '%J%' OR vacation = 'Jour' OR vacation IN ('24H', '48H', '72H'))";
        } elseif ($shift_code === 'SN') {
            $shift_condition = "AND (vacation LIKE '%N%' OR vacation = 'Nuit' OR vacation IN ('24H', '48H', '72H'))";
        }

        $sqlite->beginTransaction();

        $stmt_find = $sqlite->prepare("
            SELECT * FROM supplementaires_externes 
            WHERE agent_id = ? $shift_condition
            AND (
                date_supp = ?
                OR (vacation = '48H' AND ? = DATE_ADD(date_supp, INTERVAL 1 DAY))
                OR (vacation = '72H' AND ? IN (DATE_ADD(date_supp, INTERVAL 1 DAY), DATE_ADD(date_supp, INTERVAL 2 DAY)))
            ) LIMIT 1
        ");
        $stmt_find->execute([$agent_id, $date, $date, $date]);
        $supp = $stmt_find->fetch();

        if ($supp) {
            $start_date = $supp['date_supp'];
            $vacation = strtoupper($supp['vacation']);
            $rep_agent = $supp['agent_remplace'];
            
            $days = 1;
            if ($vacation === '48H') $days = 2;
            if ($vacation === '72H') $days = 3;

            $shifts_to_delete = [];
            if (in_array($vacation, ['24H', '48H', '72H'])) {
                $shifts_to_delete = ['SJ', 'SN'];
            } elseif (strpos($vacation, ' J') !== false || $vacation === 'JOUR') {
                $shifts_to_delete = ['SJ'];
            } elseif (strpos($vacation, ' N') !== false || $vacation === 'NUIT') {
                $shifts_to_delete = ['SN'];
            } else {
                $shifts_to_delete = [$shift_code];
            }

            for ($i = 0; $i < $days; $i++) {
                $cur_date = date('Y-m-d', strtotime("+$i days", strtotime($start_date)));
                
                // Restore replaced agent for this day
                if ($rep_agent) {
                    $sqlite->prepare("UPDATE attendance SET status = '1' WHERE agent_id = ? AND date = ? AND period = ? AND status IN ('A', 'M', 'P', 'MAP')")
                           ->execute([$rep_agent, $cur_date, $period]);
                }
                
                // Delete the Suppl| records from the origin site's attendance for this day
                foreach ($shifts_to_delete as $sc) {
                    if ($sc) {
                        $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND status LIKE 'Suppl|%'")
                               ->execute([$agent_id, $cur_date, $sc]);
                    }
                }
            }
            
            // Delete from supplementaires_externes
            $sqlite->prepare("DELETE FROM supplementaires_externes WHERE id = ?")
                   ->execute([$supp['id']]);
        }

        $sqlite->commit();
        echo json_encode(['success' => true]);
        break;

    case 'get_treated_agents':
        $site_id = $_GET['site_id'] ?? ($_POST['site_id'] ?? '');
        $period  = $_GET['period']  ?? ($_POST['period']  ?? '');
        if (!$site_id || !$period) {
            echo json_encode(['success' => false, 'treated_agents' => (object)[]]);
            break;
        }

        $sqlite = getDb();
        $sqlite->exec("CREATE TABLE IF NOT EXISTS treated_agents (
            company_id VARCHAR(100),
            service_id VARCHAR(100),
            site_id VARCHAR(100),
            period VARCHAR(30),
            agent_id VARCHAR(100),
            PRIMARY KEY (company_id, service_id, site_id, period, agent_id)
        )");

        $stmt = $sqlite->prepare("SELECT agent_id FROM treated_agents WHERE site_id = ? AND period = ?");
        $stmt->execute([$site_id, $period]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $result = [];
        foreach ($rows as $agId) {
            $result[(string)$agId] = true;
        }
        echo json_encode(['success' => true, 'treated_agents' => (object)$result]);
        break;

    case 'toggle_treated_agent':
        $site_id  = $data['site_id']  ?? ($_POST['site_id']  ?? '');
        $period   = $data['period']   ?? ($_POST['period']   ?? '');
        $agent_id = $data['agent_id']  ?? ($_POST['agent_id']  ?? '');
        $treated  = isset($data['treated']) ? (bool)$data['treated'] : (isset($_POST['treated']) ? (bool)$_POST['treated'] : false);

        if (!$site_id || !$period || !$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $sqlite     = getDb();
        $company_id = (string)(resolveCurrentCompanyIdSql() ?? '');
        $serviceKey = (string)($_SESSION['service_id'] ?? resolveCurrentServiceKeySql() ?? '');

        $sqlite->exec("CREATE TABLE IF NOT EXISTS treated_agents (
            company_id VARCHAR(100),
            service_id VARCHAR(100),
            site_id VARCHAR(100),
            period VARCHAR(30),
            agent_id VARCHAR(100),
            PRIMARY KEY (company_id, service_id, site_id, period, agent_id)
        )");

        if ($treated) {
            $stmt = $sqlite->prepare("REPLACE INTO treated_agents (company_id, service_id, site_id, period, agent_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$company_id, $serviceKey, $site_id, $period, $agent_id]);
        } else {
            $stmt = $sqlite->prepare("DELETE FROM treated_agents WHERE site_id = ? AND period = ? AND agent_id = ?");
            $stmt->execute([$site_id, $period, $agent_id]);
        }

        echo json_encode(['success' => true, 'treated' => $treated]);
        break;

} // end switch attendance
