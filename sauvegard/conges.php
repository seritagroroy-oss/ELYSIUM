<?php
/**
 * Module Conges, Permissions & Contrats RH
 * Extrait de api_new.php
 */

switch ($action) {
    case 'get_leave_types':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $db = getDb();
        $stmt = $db->prepare('SELECT * FROM leave_types WHERE company_id = ?');
        $stmt->execute([$company_id]);
        $types = $stmt->fetchAll();
        echo json_encode(['success' => true, 'leave_types' => $types]);
        break;

    case 'get_my_leave_balances':
        $agent_id = $_GET['agent_id'] ?? $data['agent_id'] ?? '';
        $company_id = 'comp_default_1'; // Assuming default for now
        $year = date('Y');
        $db = getDb();

        $stmt = $db->prepare('SELECT * FROM leave_balances WHERE agent_id = ? AND company_id = ? AND year = ?');
        $stmt->execute([$agent_id, $company_id, $year]);
        $balance = $stmt->fetch();

        if (!$balance) {
            // Créer le solde par défaut s'il n'existe pas encore
            $db->prepare('INSERT INTO leave_balances (company_id, agent_id, year, acquired, taken, pending) VALUES (?, ?, ?, 0, 0, 0)')->execute([$company_id, $agent_id, $year]);
            $stmt->execute([$agent_id, $company_id, $year]);
            $balance = $stmt->fetch();
        }

        echo json_encode(['success' => true, 'balance' => $balance]);
        break;

    case 'get_my_leave_requests':
        $agent_id = $_GET['agent_id'] ?? $data['agent_id'] ?? '';
        $db = getDb();
        $stmt = $db->prepare('
            SELECT r.*, t.name as type_name, t.is_paid 
            FROM leave_requests r 
            LEFT JOIN leave_types t ON r.leave_type_id = t.id 
            WHERE r.agent_id = ? 
            ORDER BY r.created_at DESC
        ');
        $stmt->execute([$agent_id]);
        echo json_encode(['success' => true, 'requests' => $stmt->fetchAll()]);
        break;

    case 'submit_leave_request':
        $agent_id = $data['agent_id'] ?? '';
        $leave_type_id = $data['leave_type_id'] ?? 0;
        $start_date = $data['start_date'] ?? '';
        $end_date = $data['end_date'] ?? '';
        $total_days = $data['total_days'] ?? 0;
        $reason = $data['reason'] ?? '';
        $attachment_url = $data['attachment_url'] ?? '';
        $company_id = 'comp_default_1';
        $year = date('Y', strtotime($start_date));

        if (!$agent_id || !$leave_type_id || !$start_date || !$end_date || $total_days <= 0) {
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
            break;
        }

        $id = 'lr_' . time() . '_' . rand(1000, 9999);
        $db = getDb();
        $stmt = $db->prepare('
            INSERT INTO leave_requests (id, company_id, agent_id, leave_type_id, start_date, end_date, total_days, reason, attachment_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")
        ');
        $stmt->execute([$id, $company_id, $agent_id, $leave_type_id, $start_date, $end_date, $total_days, $reason, $attachment_url]);

        // Add to pending balance
        $stmt = $db->prepare('UPDATE leave_balances SET pending = pending + ? WHERE agent_id = ? AND company_id = ? AND year = ?');
        $stmt->execute([$total_days, $agent_id, $company_id, $year]);

        echo json_encode(['success' => true, 'message' => 'Demande soumise avec succès']);
        break;

    case 'get_leave_requests':
        // Côté Manager
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $db = getDb();
        $stmt = $db->prepare('
            SELECT r.*, t.name as type_name, a.name as agent_name 
            FROM leave_requests r 
            LEFT JOIN leave_types t ON r.leave_type_id = t.id 
            LEFT JOIN agents a ON r.agent_id = a.id
            WHERE r.company_id = ?
            ORDER BY r.created_at DESC
        ');
        $stmt->execute([$company_id]);
        echo json_encode(['success' => true, 'requests' => $stmt->fetchAll()]);
        break;

    case 'process_leave_request':
        // Côté Manager
        $request_id = $data['request_id'] ?? '';
        $status = $data['status'] ?? ''; // approved or rejected
        $comment = $data['comment'] ?? '';
        $reviewer = $_SESSION['user_id'] ?? 'Admin';
        
        $db = getDb();
        
        // Fetch request info
        $stmt = $db->prepare('SELECT * FROM leave_requests WHERE id = ?');
        $stmt->execute([$request_id]);
        $req = $stmt->fetch();

        if (!$req || $req['status'] !== 'pending') {
            echo json_encode(['success' => false, 'message' => 'Demande introuvable ou déjà traitée']);
            break;
        }

        $year = date('Y', strtotime($req['start_date']));

        if ($status === 'approved') {
            $db->prepare('UPDATE leave_requests SET status = "approved", reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_comment = ? WHERE id = ?')
               ->execute([$reviewer, $comment, $request_id]);
            
            // Move from pending to taken
            $db->prepare('UPDATE leave_balances SET pending = pending - ?, taken = taken + ? WHERE agent_id = ? AND year = ?')
               ->execute([$req['total_days'], $req['total_days'], $req['agent_id'], $year]);

        } else if ($status === 'rejected') {
            $db->prepare('UPDATE leave_requests SET status = "rejected", reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_comment = ? WHERE id = ?')
               ->execute([$reviewer, $comment, $request_id]);
            
            // Remove from pending
            $db->prepare('UPDATE leave_balances SET pending = pending - ? WHERE agent_id = ? AND year = ?')
               ->execute([$req['total_days'], $req['agent_id'], $year]);
        }

        echo json_encode(['success' => true, 'message' => 'Demande traitée']);
        break;

    case 'get_all_leave_balances':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $year = date('Y');
        $db = getDb();
        $stmt = $db->prepare('
            SELECT b.*, a.name as agent_name 
            FROM leave_balances b 
            LEFT JOIN agents a ON b.agent_id = a.id 
            WHERE b.company_id = ? AND b.year = ?
        ');
        $stmt->execute([$company_id, $year]);
        echo json_encode(['success' => true, 'balances' => $stmt->fetchAll()]);
        break;

    case 'get_leave_settings':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $db = getDb();
        $stmt = $db->prepare('SELECT * FROM leave_settings WHERE company_id = ?');
        $stmt->execute([$company_id]);
        $settings = $stmt->fetch();
        if (!$settings) {
            $db->prepare('INSERT INTO leave_settings (company_id) VALUES (?)')->execute([$company_id]);
            $settings = ['company_id' => $company_id, 'auto_increment' => 0, 'increment_rate' => 2.0];
        }
        echo json_encode(['success' => true, 'settings' => $settings]);
        break;

    case 'update_leave_settings':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $auto_increment = $data['auto_increment'] ?? 0;
        $increment_rate = $data['increment_rate'] ?? 2.0;
        $db = getDb();
        $stmt = $db->prepare('UPDATE leave_settings SET auto_increment = ?, increment_rate = ? WHERE company_id = ?');
        $stmt->execute([$auto_increment, $increment_rate, $company_id]);
        echo json_encode(['success' => true]);
        break;

    case 'upload_leave_attachment':
        // Handle file upload for leave requests
        if (!isset($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
            break;
        }
        $file = $_FILES['file'];
        $uploadDir = __DIR__ . '/uploads/leaves/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['pdf', 'png', 'jpg', 'jpeg'])) {
            echo json_encode(['success' => false, 'message' => 'Format non autorisé. Seulement PDF ou Image.']);
            break;
        }

        $filename = 'leave_' . time() . '_' . rand(100, 999) . '.' . $ext;
        $destPath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $url = '/uploads/leaves/' . $filename;
            echo json_encode(['success' => true, 'url' => $url]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'upload']);
        }
        break;

    case 'admin_add_leave_request':
        // Côté Manager : Ajout manuel d'un congé sans passer par le portail agent
        $agent_id = $data['agent_id'] ?? '';
        $leave_type_id = $data['leave_type_id'] ?? 0;
        $start_date = $data['start_date'] ?? '';
        $end_date = $data['end_date'] ?? '';
        $reason = $data['reason'] ?? 'Ajout manuel par l\'administration';
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $reviewer = $_SESSION['user_id'] ?? 'Admin';
        
        $startD = new DateTime($start_date);
        $endD = new DateTime($end_date);
        $diff = $startD->diff($endD);
        $total_days = $diff->days + 1;

        if (!$agent_id || !$leave_type_id || !$start_date || !$end_date || $total_days <= 0) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }

        $year = $startD->format('Y');
        $id = 'lr_' . time() . '_' . rand(1000, 9999);
        $db = getDb();
        
        $stmt = $db->prepare('
            INSERT INTO leave_requests (id, company_id, agent_id, leave_type_id, start_date, end_date, total_days, reason, status, reviewed_by, reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "approved", ?, CURRENT_TIMESTAMP)
        ');
        $stmt->execute([$id, $company_id, $agent_id, $leave_type_id, $start_date, $end_date, $total_days, $reason, $reviewer]);

        $stmt = $db->prepare('SELECT * FROM leave_balances WHERE agent_id = ? AND year = ?');
        $stmt->execute([$agent_id, $year]);
        $balance = $stmt->fetch();
        if (!$balance) {
            $db->prepare('INSERT INTO leave_balances (company_id, agent_id, year, acquired, taken, pending) VALUES (?, ?, ?, 0, 0, 0)')
               ->execute([$company_id, $agent_id, $year]);
        }

        $db->prepare('UPDATE leave_balances SET taken = taken + ? WHERE agent_id = ? AND year = ?')
           ->execute([$total_days, $agent_id, $year]);

        echo json_encode(['success' => true, 'message' => 'Congé ajouté et validé manuellement']);
        break;

    // ==========================================
    // MODULE GESTION DES PERMISSIONS D'ABSENCE
    // ==========================================

    case 'get_permissions':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $db = getDb();
        $month = $_GET['month'] ?? date('Y-m');
        $stmt = $db->prepare("
            SELECT p.*, a.name as agent_name, a.matricule
            FROM absences_permissions p
            LEFT JOIN agents a ON p.agent_id = a.id
            WHERE p.company_id = ?
            AND strftime('%Y-%m', p.start_datetime) = ?
            ORDER BY p.start_datetime DESC
        ");
        $stmt->execute([$company_id, $month]);
        echo json_encode(['success' => true, 'permissions' => $stmt->fetchAll()]);
        break;

    case 'add_permission':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $agent_id = $data['agent_id'] ?? '';
        $reason = $data['reason'] ?? '';
        $start_datetime = $data['start_datetime'] ?? '';
        $end_datetime = $data['end_datetime'] ?? '';
        $recorded_by = $_SESSION['user_id'] ?? 'Admin';

        if (!$agent_id || !$reason || !$start_datetime || !$end_datetime) {
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
            break;
        }

        // Calcul de la durée en heures
        $start = new DateTime($start_datetime);
        $end   = new DateTime($end_datetime);
        $interval = $start->diff($end);
        $duration_hours = ($interval->days * 24) + $interval->h + ($interval->i / 60);

        $id = 'perm_' . time() . '_' . rand(1000, 9999);
        $db = getDb();
        $stmt = $db->prepare("
            INSERT INTO absences_permissions (id, company_id, agent_id, reason, start_datetime, end_datetime, duration_hours, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$id, $company_id, $agent_id, $reason, $start_datetime, $end_datetime, round($duration_hours, 2), $recorded_by]);
        echo json_encode(['success' => true, 'message' => 'Permission enregistrée avec succès']);
        break;

    case 'delete_permission':
        $id = $data['id'] ?? '';
        if (!$id) { echo json_encode(['success' => false, 'message' => 'ID manquant']); break; }
        $db = getDb();
        $db->prepare("DELETE FROM absences_permissions WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Permission supprimée']);
        break;

    // ==========================================
    // MODULE GESTION DES CONTRATS
    // ==========================================

    case 'get_contracts':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $status_filter = $_GET['status'] ?? 'all';
        $db = getDb();
        $where = $status_filter !== 'all' ? "AND c.status = '$status_filter'" : '';
        $stmt = $db->prepare("
            SELECT c.*, a.name as agent_name, a.matricule, a.service_id
            FROM contracts c
            LEFT JOIN agents a ON c.agent_id = a.id
            WHERE c.company_id = ? $where
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$company_id]);
        echo json_encode(['success' => true, 'contracts' => $stmt->fetchAll()]);
        break;

    case 'add_contract':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $agent_id       = $data['agent_id'] ?? '';
        $contract_type  = $data['contract_type'] ?? 'CDI';
        $start_date     = $data['start_date'] ?? '';
        $end_date       = $data['end_date'] ?? null;
        $trial_end_date = $data['trial_end_date'] ?? null;
        $salary         = $data['salary'] ?? 0;
        $position       = $data['position'] ?? '';
        $department     = $data['department'] ?? '';
        $notes          = $data['notes'] ?? '';
        $created_by     = $_SESSION['user_id'] ?? 'Admin';

        if (!$agent_id || !$start_date) {
            echo json_encode(['success' => false, 'message' => 'Agent et date de début requis']);
            break;
        }

        $id = 'ctr_' . time() . '_' . rand(1000, 9999);
        $db = getDb();
        $stmt = $db->prepare("
            INSERT INTO contracts (id, company_id, agent_id, contract_type, start_date, end_date, trial_end_date, salary, position, department, notes, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        ");
        $stmt->execute([$id, $company_id, $agent_id, $contract_type, $start_date, $end_date ?: null, $trial_end_date ?: null, $salary, $position, $department, $notes, $created_by]);
        echo json_encode(['success' => true, 'message' => 'Contrat créé avec succès']);
        break;

    case 'update_contract_status':
        $id     = $data['id'] ?? '';
        $status = $data['status'] ?? '';
        if (!$id || !$status) { echo json_encode(['success' => false, 'message' => 'Données manquantes']); break; }
        $db = getDb();
        $db->prepare("UPDATE contracts SET status = ? WHERE id = ?")->execute([$status, $id]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_contract':
        $id = $data['id'] ?? '';
        if (!$id) { echo json_encode(['success' => false, 'message' => 'ID manquant']); break; }
        $db = getDb();
        $db->prepare("DELETE FROM contracts WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Contrat supprimé']);
        break;

    // ==========================================
    // MODULE REGISTRE GÉNÉRAL DU PERSONNEL
    // ==========================================

    case 'get_personnel_registry':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $role = $_SESSION['user_role'] ?? '';
        $service_id = $_SESSION['service_id'] ?? '';
        $email = $_SESSION['user_id'] ?? '';
        $db = getDb();

        $registry = [];

        $stmtW = $db->prepare("SELECT workspace_type FROM users WHERE email = ?");
        $stmtW->execute([$email]);
        $uW = $stmtW->fetch();
        $workspace_type = $uW ? strtoupper(trim($uW['workspace_type'])) : 'AUTRE';

        $global_workspaces = ['PC', 'COMPTABLE', 'RH', 'RESSOURCES HUMAINES', 'DG', 'PDG', 'SECRETARIAT'];
        $can_see_all = in_array($workspace_type, $global_workspaces) || $role === 'super_admin' || $role === 'admin';

        $agentCondition = "a.company_id = ?";
        $paramsAgents = [$company_id];

        if (!$can_see_all) {
            $agentCondition .= " AND a.service_id = ?";
            $paramsAgents[] = $service_id;
        }

        // --- 1. Récupérer tous les AGENTS ---
        $stmtAgents = $db->prepare("
            SELECT a.*, s.name as service_name, sub.name as subsite_name
            FROM agents a
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN subsites sub ON a.subsite_id = sub.id
            WHERE $agentCondition
            ORDER BY a.name
        ");
        $stmtAgents->execute($paramsAgents);
        $agents_raw = $stmtAgents->fetchAll();

        $threeMonthsAgo = date('Y-m', strtotime('-3 months'));

        foreach ($agents_raw as $ag) {
            // Vérifier abandon dans attendance
            $stmtAbandon = $db->prepare("
                SELECT COUNT(*) as cnt FROM attendance
                WHERE agent_id = ? AND status = 'X'
            ");
            $stmtAbandon->execute([$ag['id']]);
            $hasAbandon = (int)($stmtAbandon->fetch()['cnt'] ?? 0) > 0;

            // Vérifier présence dans les 3 derniers mois
            $stmtRecent = $db->prepare("
                SELECT MAX(period) as last_period FROM attendance
                WHERE agent_id = ?
            ");
            $stmtRecent->execute([$ag['id']]);
            $lastPeriod = $stmtRecent->fetch()['last_period'] ?? null;

            // Déterminer statut
            $status = 'active';
            $exit_reason = null;

            if (!empty($ag['exit_reason'])) {
                $status = (stripos($ag['exit_reason'], 'Abandon') !== false || stripos($ag['exit_reason'], 'Démission') !== false) ? 'abandoned' : 'archived';
                $exit_reason = $ag['exit_reason'];
                // exit_date est déjà dans $ag['exit_date']
            } elseif ($hasAbandon) {
                $status = 'abandoned';
                $exit_reason = 'Abandon de poste';
                // Récupérer la date du dernier enregistrement abandon
                if (!$ag['exit_date']) {
                    $stmtAbandonDate = $db->prepare("
                        SELECT period FROM attendance WHERE agent_id = ? AND status = 'X' ORDER BY period DESC LIMIT 1
                    ");
                    $stmtAbandonDate->execute([$ag['id']]);
                    $abandonPeriod = $stmtAbandonDate->fetch()['period'] ?? null;
                    $ag['exit_date'] = $abandonPeriod ? $abandonPeriod . '-01' : null;
                }
            } elseif (!empty($ag['archived_period'])) {
                $status = 'archived';
                $exit_reason = 'Archivé';
                if (!$ag['exit_date']) {
                    $ag['exit_date'] = $ag['archived_period'] . '-01';
                }
            } elseif (!$lastPeriod || $lastPeriod < $threeMonthsAgo) {
                $status = 'unknown';
                $exit_reason = 'Absent du pointage';
            }

            $service_display = '';
            if (!empty($ag['service_name'])) $service_display .= $ag['service_name'];
            if (!empty($ag['subsite_name'])) $service_display .= ' — ' . $ag['subsite_name'];
            if (empty($service_display)) $service_display = $ag['service_id'] ?? '';

            $registry[] = [
                'id'           => $ag['id'],
                'source'       => 'agent',
                'name'         => $ag['name'],
                'matricule'    => $ag['matricule'] ?? '',
                'function'     => $ag['function'] ?? '',
                'service'      => $service_display,
                'hire_date'    => $ag['hire_date'] ?? null,
                'exit_date'    => $ag['exit_date'] ?? null,
                'status'       => $status,
                'exit_reason'  => $exit_reason,
                'last_period'  => $lastPeriod,
            ];
        }

        // --- 2. Récupérer tous les UTILISATEURS (admins, contrôleurs) ---
        $userCondition = "u.company_id = ?";
        $paramsUsers = [$company_id];

        if (!$can_see_all) {
            $userCondition .= " AND (u.service = ? OR u.service_id = ?)";
            $paramsUsers[] = $service_id;
            $paramsUsers[] = $service_id;
        }

        $stmtUsers = $db->prepare("
            SELECT u.*, s.name as service_name
            FROM users u
            LEFT JOIN services s ON u.service = s.id
            WHERE $userCondition
            ORDER BY u.name
        ");
        $stmtUsers->execute($paramsUsers);
        $users_raw = $stmtUsers->fetchAll();

        foreach ($users_raw as $u) {
            $status = 'active'; // Les users admins sont toujours actifs sauf désactivation manuelle
            $registry[] = [
                'id'          => 'usr_' . $u['id'],
                'source'      => 'user',
                'name'        => $u['name'] ?? $u['email'],
                'matricule'   => $u['email'],
                'function'    => $u['role'] ?? 'Utilisateur',
                'service'     => $u['service_name'] ?? $u['service'] ?? '',
                'hire_date'   => $u['created_at'] ?? null,
                'exit_date'   => null,
                'status'      => 'active',
                'exit_reason' => null,
                'last_period' => $u['last_activity'] ?? null,
            ];
        }

        // Tri : inactifs en bas
        usort($registry, function($a, $b) {
            $order = ['active' => 0, 'unknown' => 1, 'archived' => 2, 'abandoned' => 3];
            return ($order[$a['status']] ?? 99) <=> ($order[$b['status']] ?? 99);
        });

        echo json_encode(['success' => true, 'registry' => $registry, 'total' => count($registry)]);
        break;

    case 'set_exit_date':
        $agent_id  = $data['agent_id'] ?? '';
        $exit_date = $data['exit_date'] ?? null;
        if (!$agent_id) { echo json_encode(['success' => false, 'message' => 'ID manquant']); break; }
        $db = getDb();
        $db->prepare("UPDATE agents SET exit_date = ? WHERE id = ?")->execute([$exit_date, $agent_id]);
        echo json_encode(['success' => true]);
        break;

    case 'get_company_users':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $stmt = $sqlite->prepare("SELECT id, name, email, profile_photo, service FROM users WHERE company_id = ? AND status = 'active'");
        $stmt->execute([$company_id]);
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'users' => $users]);
        break;

    // --- WHATSAPP CLONE ENDPOINTS ---

} // end switch conges
