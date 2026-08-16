<?php
// suivi_personnel_api.php
// Handled variables: $action, $sqlite, $data, $_SESSION

$req_role = $_SESSION['user_role'] ?? '';
$req_company_id = $_SESSION['company_id'] ?? 'comp_default_1';
$req_service_id = $_SESSION['service_id'] ?? '';
$req_user_email = $_SESSION['user_id'] ?? '';

// Only Admins and RH can perform POST actions
$is_rh_or_admin = ($req_role === 'admin' || $req_role === 'super_admin' || $req_role === 'rh');

switch ($action) {
    case 'get_personnel_tracking':
        // Retrieve alerts (ongoing long absences, recent sanctions, recent mutations)
        $where_clause = "company_id = ?";
        $params = [$req_company_id];
        
        // Admins see all, others see their service
        if ($req_role !== 'admin' && $req_role !== 'super_admin' && $req_role !== 'rh') {
            // Depending on architecture, maybe restrict to service
            $where_clause .= " AND service_id = ?";
            $params[] = $req_service_id;
        }

        $now = date('Y-m-d');

        // Absences en cours ou à venir
        $stmt_abs = $sqlite->prepare("SELECT * FROM agent_long_absences WHERE $where_clause AND (date_reprise IS NULL OR date_reprise >= ?) ORDER BY date_debut DESC");
        $params_abs = $params;
        $params_abs[] = $now;
        $stmt_abs->execute($params_abs);
        $absences = $stmt_abs->fetchAll(PDO::FETCH_ASSOC);

        // Sanctions récentes (ex: 3 derniers mois)
        $three_months_ago = date('Y-m-d', strtotime('-3 months'));
        $stmt_sanc = $sqlite->prepare("SELECT * FROM agent_sanctions WHERE $where_clause AND date_sanction >= ? ORDER BY date_sanction DESC");
        $params_sanc = $params;
        $params_sanc[] = $three_months_ago;
        $stmt_sanc->execute($params_sanc);
        $sanctions = $stmt_sanc->fetchAll(PDO::FETCH_ASSOC);
        
        // Agents list
        $stmt_agents = $sqlite->prepare("SELECT id, nom_prenom, matricule, cni_sejour, num_cnss, emploi_occupe, site_id, service_id, date_embauche FROM agents WHERE company_id = ? ORDER BY nom_prenom ASC");
        $stmt_agents->execute([$req_company_id]);
        $agents = $stmt_agents->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'absences' => $absences, 'sanctions' => $sanctions, 'agents' => $agents]);
        break;

    case 'get_agent_dossier':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent ID manquant']);
            return;
        }

        $stmt_s = $sqlite->prepare("SELECT * FROM agent_sanctions WHERE agent_id = ? ORDER BY date_sanction DESC");
        $stmt_s->execute([$agent_id]);
        $sanctions = $stmt_s->fetchAll(PDO::FETCH_ASSOC);

        $stmt_a = $sqlite->prepare("SELECT * FROM agent_long_absences WHERE agent_id = ? ORDER BY date_debut DESC");
        $stmt_a->execute([$agent_id]);
        $absences = $stmt_a->fetchAll(PDO::FETCH_ASSOC);

        $stmt_m = $sqlite->prepare("SELECT * FROM agent_mutations WHERE agent_id = ? ORDER BY date_mutation DESC");
        $stmt_m->execute([$agent_id]);
        $mutations = $stmt_m->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'sanctions' => $sanctions, 'absences' => $absences, 'mutations' => $mutations]);
        break;

    case 'get_agent_full_history':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent ID manquant']);
            return;
        }

        // Get agent base info
        $stmt_agent = $sqlite->prepare("SELECT a.*, s.name as service_name, sub.name as subsite_name FROM agents a LEFT JOIN services s ON a.service_id = s.id LEFT JOIN subsites sub ON a.subsite_id = sub.id WHERE a.id = ?");
        $stmt_agent->execute([$agent_id]);
        $agent = $stmt_agent->fetch(PDO::FETCH_ASSOC);

        // Fetch published periods for the company
        $stmt_pub = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
        $stmt_pub->execute([$req_company_id]);
        $pub_data = $stmt_pub->fetch();
        $published_periods = $pub_data ? json_decode($pub_data['data_value'], true) : [];
        if (!is_array($published_periods)) $published_periods = [];
        
        // Sort periods chronologically
        sort($published_periods);

        $history = [];

        foreach ($published_periods as $period) {
            // Check if archive exists for salary details
            $stmtArch = $sqlite->prepare("SELECT data FROM archives WHERE company_id = ? AND period = ?");
            $stmtArch->execute([$req_company_id, $period]);
            $arch = $stmtArch->fetch();
            $salary_data = null;
            if ($arch) {
                $parsed = json_decode($arch['data'], true);
                if (isset($parsed['salaries'])) {
                    foreach ($parsed['salaries'] as $s) {
                        if ($s['agent_id'] === $agent_id) {
                            $salary_data = $s;
                            break;
                        }
                    }
                }
            }

            // Attendance counts directly from attendance table
            $stmtAtt = $sqlite->prepare("SELECT status FROM attendance WHERE agent_id = ? AND period = ?");
            $stmtAtt->execute([$agent_id, $period]);
            $attendances = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            $jours_travailles = 0;
            $absences = 0;
            $permissions = 0;
            $maladies = 0;
            $conges = 0;
            $abandons = 0;
            $repos = 0;

            foreach ($attendances as $att) {
                $status = $att['status'];
                if (strpos($status, 'P') !== false && strpos($status, 'Perm') === false) {
                    $jours_travailles++;
                } elseif (strpos($status, 'A') !== false) {
                    $absences++;
                } elseif (strpos($status, 'Perm') !== false) {
                    $permissions++;
                } elseif (strpos($status, 'M') !== false) {
                    $maladies++;
                } elseif (strpos($status, 'C') !== false) {
                    $conges++;
                } elseif (strpos($status, 'X') !== false) {
                    $abandons++;
                } elseif (strpos($status, 'R') !== false) {
                    $repos++;
                }
            }

            // Mutations in this period
            $stmtMut = $sqlite->prepare("SELECT * FROM agent_mutations WHERE agent_id = ? AND date_mutation LIKE ?");
            $stmtMut->execute([$agent_id, $period . '%']);
            $mutations = $stmtMut->fetchAll(PDO::FETCH_ASSOC);

            // Sanctions in this period
            $stmtSanc = $sqlite->prepare("SELECT * FROM agent_sanctions WHERE agent_id = ? AND date_sanction LIKE ?");
            $stmtSanc->execute([$agent_id, $period . '%']);
            $sanctions = $stmtSanc->fetchAll(PDO::FETCH_ASSOC);
            
            // Absences de longue durée
            $stmtLAbs = $sqlite->prepare("SELECT * FROM agent_long_absences WHERE agent_id = ? AND date_debut LIKE ?");
            $stmtLAbs->execute([$agent_id, $period . '%']);
            $long_absences = $stmtLAbs->fetchAll(PDO::FETCH_ASSOC);

            // Adjustments (Primes/Retenues)
            $stmtAdj = $sqlite->prepare("SELECT * FROM agent_adjustments WHERE agent_id = ? AND period = ?");
            $stmtAdj->execute([$agent_id, $period]);
            $adjustments = $stmtAdj->fetchAll(PDO::FETCH_ASSOC);

            $history[] = [
                'period' => $period,
                'stats' => [
                    'jours_travailles' => $jours_travailles,
                    'absences' => $absences,
                    'permissions' => $permissions,
                    'maladies' => $maladies,
                    'conges' => $conges,
                    'abandons' => $abandons,
                    'repos' => $repos
                ],
                'mutations' => $mutations,
                'sanctions' => $sanctions,
                'long_absences' => $long_absences,
                'adjustments' => $adjustments,
                'salary_data' => $salary_data
            ];
        }

        echo json_encode(['success' => true, 'agent' => $agent, 'history' => $history]);
        break;

    case 'add_sanction':
        if (!$is_rh_or_admin) {
            echo json_encode(['success' => false, 'message' => 'Permission refusée']);
            return;
        }
        $agent_id = $data['agent_id'] ?? '';
        $type_sanction = $data['type_sanction'] ?? '';
        $motif = $data['motif'] ?? '';
        $date_sanction = $data['date_sanction'] ?? date('Y-m-d');
        $date_fin_mise_a_pied = $data['date_fin_mise_a_pied'] ?? null;

        if (!$agent_id || !$type_sanction || !$motif) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            return;
        }

        $id = uniqid('sanc_');
        $stmt = $sqlite->prepare("INSERT INTO agent_sanctions (id, agent_id, type_sanction, motif, date_sanction, date_fin_mise_a_pied, created_by, company_id, service_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $agent_id, $type_sanction, $motif, $date_sanction, $date_fin_mise_a_pied, $req_user_email, $req_company_id, $req_service_id]);
        
        echo json_encode(['success' => true, 'id' => $id]);
        break;

    case 'add_long_absence':
        if (!$is_rh_or_admin) {
            echo json_encode(['success' => false, 'message' => 'Permission refusée']);
            return;
        }
        $agent_id = $_POST['agent_id'] ?? $data['agent_id'] ?? '';
        $type_absence = $_POST['type_absence'] ?? $data['type_absence'] ?? '';
        $date_debut = $_POST['date_debut'] ?? $data['date_debut'] ?? '';
        $date_fin_prevue = $_POST['date_fin_prevue'] ?? $data['date_fin_prevue'] ?? null;
        $statut_justificatif = $_POST['statut_justificatif'] ?? $data['statut_justificatif'] ?? 'En attente';

        if (!$agent_id || !$type_absence || !$date_debut) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            return;
        }

        $file_path = null;
        if (isset($_FILES['justificatif']) && $_FILES['justificatif']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/justificatifs/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $ext = strtolower(pathinfo($_FILES['justificatif']['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['pdf', 'jpg', 'jpeg', 'png'])) {
                echo json_encode(['success' => false, 'message' => 'Format de justificatif non autorisé.']);
                return;
            }
            $uniqueName = uniqid('justif_') . '.' . $ext;
            if (move_uploaded_file($_FILES['justificatif']['tmp_name'], $uploadDir . $uniqueName)) {
                $file_path = 'uploads/justificatifs/' . $uniqueName;
            }
        }

        $id = uniqid('abs_');
        $stmt = $sqlite->prepare("INSERT INTO agent_long_absences (id, agent_id, type_absence, date_debut, date_fin_prevue, statut_justificatif, file_path, created_by, company_id, service_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $agent_id, $type_absence, $date_debut, $date_fin_prevue, $statut_justificatif, $file_path, $req_user_email, $req_company_id, $req_service_id]);
        
        echo json_encode(['success' => true, 'id' => $id, 'file_path' => $file_path]);
        break;

    case 'add_mutation':
        if (!$is_rh_or_admin) {
            echo json_encode(['success' => false, 'message' => 'Permission refusée']);
            return;
        }
        $agent_id = $data['agent_id'] ?? '';
        $nouveau_site_id = $data['nouveau_site_id'] ?? '';
        $date_mutation = $data['date_mutation'] ?? date('Y-m-d');
        $motif = $data['motif'] ?? '';

        if (!$agent_id || !$nouveau_site_id) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            return;
        }

        // Get current site
        $stmt = $sqlite->prepare("SELECT site_id FROM agents WHERE id = ?");
        $stmt->execute([$agent_id]);
        $agent = $stmt->fetch();
        $ancien_site_id = $agent ? $agent['site_id'] : null;

        $id = uniqid('mut_');
        $stmt = $sqlite->prepare("INSERT INTO agent_mutations (id, agent_id, ancien_site_id, nouveau_site_id, date_mutation, motif, created_by, company_id, service_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $agent_id, $ancien_site_id, $nouveau_site_id, $date_mutation, $motif, $req_user_email, $req_company_id, $req_service_id]);
        
        // Appliquer immédiatement la mutation
        $stmt_up = $sqlite->prepare("UPDATE agents SET site_id = ? WHERE id = ?");
        $stmt_up->execute([$nouveau_site_id, $agent_id]);

        echo json_encode(['success' => true, 'id' => $id]);
        break;
}
