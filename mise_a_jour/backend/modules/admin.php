<?php
/**
 * Module Administration — admin.php
 * Extrait de api_new.php
 */

switch ($action) {
    case 'admin_create_account':
        $creator_role = $_SESSION['user_role'] ?? '';
        if ($creator_role !== 'super_admin' && $creator_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $creator_company_id = $_SESSION['company_id'] ?? '';

        $email = trim(strtolower($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $name = trim($data['name'] ?? '');
        $service_name = trim($data['service_name'] ?? '');
        $role = trim($data['role'] ?? 'user');

        if (!$email || !$password || !$name || !$service_name) {
            echo json_encode(['success' => false, 'message' => 'Tous les champs sont requis']);
            break;
        }

        $sqlite = getDb();

        $target_company_id = $creator_role === 'admin' ? $creator_company_id : ($data['company_id'] ?? 'comp_default_1');

        $stmtComp = $sqlite->prepare("SELECT name FROM entreprises WHERE id = ?");
        $stmtComp->execute([$target_company_id]);
        $compData = $stmtComp->fetch();
        $comp_name = $compData ? strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $compData['name'])) : 'pro';
        if (strlen($comp_name) > 10) {
            $comp_name = substr($comp_name, 0, 10);
        }

        // Check if email already exists
        $stmtCheck = $sqlite->prepare("SELECT 1 FROM users WHERE email = ?");
        $stmtCheck->execute([$email]);
        if ($stmtCheck->fetch()) {
            $suggestions = [];
            $base_parts = explode('@', $email);
            if (count($base_parts) === 2) {
                $base = $base_parts[0];
                $domain = $base_parts[1];

                // Add an identifier to make it unique without leaking info
                $candidates = [
                    $base . '.' . $comp_name . '@' . $domain,
                    $base . '_' . $comp_name . '@' . $domain,
                    $base . rand(10, 99) . '@' . $domain,
                    $base . date('Y') . '@' . $domain,
                    $base . '.' . $comp_name . rand(1, 9) . '@' . $domain
                ];

                foreach ($candidates as $cand) {
                    if (count($suggestions) >= 3)
                        break;
                    $stmtSugg = $sqlite->prepare("SELECT 1 FROM users WHERE email = ?");
                    $stmtSugg->execute([$cand]);
                    if (!$stmtSugg->fetch()) {
                        $suggestions[] = $cand;
                    }
                }
            }

            echo json_encode([
                'success' => false,
                'message' => "Erreur lors de la validation de l'adresse email. Merci d'en utiliser une différente.",
                'suggestions' => $suggestions
            ]);
            break;
        }

        // Check if service already exists in this company
        $stmtSvc = $sqlite->prepare("SELECT id FROM services WHERE LOWER(name) = ? AND company_id = ?");
        $stmtSvc->execute([strtolower(trim($service_name)), $target_company_id]);
        $existingSvc = $stmtSvc->fetch();

        if ($existingSvc) {
            $service_id = $existingSvc['id'];
        } else {
            $service_id = 'svc_' . substr(md5($service_name . microtime(true)), 0, 8);
            $stmtAddSvc = $sqlite->prepare("INSERT INTO services (id, name, company_id, permissions) VALUES (?, ?, ?, ?)");
            $stmtAddSvc->execute([$service_id, $service_name, $target_company_id, json_encode(getDefaultServicePermissions())]);
        }

        $role_display_name = 'Agent';
        if ($role === 'super_admin')
            $role_display_name = 'Directeur Général';
        elseif ($role === 'admin')
            $role_display_name = 'Propriétaire';

        $permissions = $data['permissions'] ?? [];
        if (!is_array($permissions)) {
            $permissions = [];
        }
        $permObj = $permissions;

        $workspace_type = $data['workspace_type'] ?? 'AUTRE';
        $profile_photo = $data['profile_photo'] ?? null;

        $cfg = getSubscriptionConfig();
        $trialStart = time();
        $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);

        $stmtIns = $sqlite->prepare("
            INSERT INTO users (
                email, password, name, role, role_display_name, service, service_id, 
                company_id, permissions, profile_photo, created_at, workspace_type,
                trial_started_at, trial_ends_at, subscription_plan, subscription_price, subscription_currency
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtIns->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $name,
            $role,
            $role_display_name,
            $service_name,
            $service_id,
            $target_company_id,
            json_encode($permObj),
            $profile_photo,
            date('Y-m-d H:i:s'),
            $workspace_type,
            date('Y-m-d H:i:s', $trialStart),
            date('Y-m-d H:i:s', $trialEnd),
            (string) ($cfg['plan_code'] ?? 'premium_monthly'),
            (int) ($cfg['monthly_price'] ?? 20000),
            (string) ($cfg['currency'] ?? 'XOF')
        ]);

        echo json_encode(['success' => true, 'message' => 'Compte créé avec succès']);
        break;

    case 'admin_reset_password':
        // Seuls les admins peuvent réinitialiser le mot de passe d'un autre compte
        $req_role = $_SESSION['user_role'] ?? '';
        if ($req_role !== 'super_admin' && $req_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }

        $target_email  = strtolower(trim($data['email'] ?? ''));
        $new_password  = $data['new_password'] ?? '';
        $admin_email   = $_SESSION['user_id'] ?? '';
        $admin_name    = $_SESSION['user_name'] ?? 'Admin';
        $admin_company = $_SESSION['company_id'] ?? '';

        // Validations de base
        if (empty($target_email) || empty($new_password)) {
            echo json_encode(['success' => false, 'message' => 'Email et nouveau mot de passe requis']);
            break;
        }
        if (strlen($new_password) < 8) {
            echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 8 caractères']);
            break;
        }
        // Empêcher un admin de réinitialiser son propre mot de passe via ce flux
        if ($target_email === $admin_email) {
            echo json_encode(['success' => false, 'message' => 'Utilisez les paramètres de profil pour modifier votre propre mot de passe']);
            break;
        }

        $sqlite = getDb();
        try {
            $sqlite->exec("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT 0");
        } catch (Exception $e) {
            // Ignorer
        }

        // Vérifier si l'utilisateur a fait la demande (sécurité stricte)
        $stmtCheck = $sqlite->prepare("SELECT id, name, company_id, password_reset_requested_at FROM users WHERE LOWER(TRIM(email)) = ?");
        $stmtCheck->execute([$target_email]);
        $targetUser = $stmtCheck->fetch();

        error_log("[DEBUG] admin_reset_password target_email: $target_email, found: " . ($targetUser ? 'yes' : 'no') . ", flag: " . ($targetUser ? $targetUser['password_reset_requested_at'] : 'null'));

        if (!$targetUser) {
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
            break;
        }
        if ($req_role === 'admin' && $targetUser['company_id'] !== $admin_company) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé : cet utilisateur n\'appartient pas à votre entreprise']);
            break;
        }
        if (empty($targetUser['password_reset_requested_at'])) {
            echo json_encode(['success' => false, 'message' => 'Action refusée : Cet utilisateur n\'a pas demandé de réinitialisation de mot de passe.']);
            break;
        }

        // Hasher le nouveau mot de passe avec bcrypt
        $hashed = password_hash($new_password, PASSWORD_DEFAULT);

        // Mettre à jour en base et effacer le flag de demande (SQLite)
        $stmtUpdate = $sqlite->prepare("UPDATE users SET password = ?, password_reset_requested_at = NULL, force_password_change = 1 WHERE LOWER(TRIM(email)) = ?");
        $stmtUpdate->execute([$hashed, $target_email]);

        // IMPORTANT : Synchroniser dans le fichier JSON pour la connexion !
        $dbData = getData();
        if (isset($dbData['users'][$target_email])) {
            $dbData['users'][$target_email]['password'] = $hashed;
            saveData($dbData);
        }

        // Journaliser l'action dans les logs PHP pour traçabilité
        error_log("[ELYSIUM ADMIN] Réinitialisation mot de passe : admin={$admin_name} ({$admin_email}) => cible={$targetUser['name']} ({$target_email}) | " . date('Y-m-d H:i:s'));
        echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès']);
        break;

    case 'get_services_management':
        if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $role = $_SESSION['user_role'] ?? '';

        $sqlSvc = "SELECT * FROM services";
        $paramsSvc = [];
        if ($role !== 'super_admin') {
            $sqlSvc .= " WHERE company_id = ?";
            $paramsSvc[] = $company_id;
        }
        $stmtSvc = $sqlite->prepare($sqlSvc);
        $stmtSvc->execute($paramsSvc);
        $services = $stmtSvc->fetchAll();

        $sqlUsers = "SELECT email, name, role, service_id FROM users WHERE role != 'admin' AND role != 'super_admin'";
        $paramsUsers = [];
        if ($role !== 'super_admin') {
            $sqlUsers .= " AND company_id = ?";
            $paramsUsers[] = $company_id;
        }
        $stmtUsers = $sqlite->prepare($sqlUsers);
        $stmtUsers->execute($paramsUsers);
        $users = $stmtUsers->fetchAll();

        $usersByService = [];
        foreach ($services as $svc) {
            $usersByService[$svc['id']] = [];
        }

        foreach ($users as $u) {
            $sid = $u['service_id'] ?? '';
            if ($sid !== '' && isset($usersByService[$sid])) {
                $usersByService[$sid][] = [
                    'email' => $u['email'],
                    'name' => $u['name'] ?? '',
                    'role' => $u['role'] ?? 'user'
                ];
            }
        }

        $result = [];
        foreach ($services as $svc) {
            $result[] = [
                'id' => $svc['id'],
                'name' => $svc['name'],
                'company_id' => $svc['company_id'] ?? '',
                'permissions' => array_merge(getDefaultServicePermissions(), json_decode($svc['permissions'] ?? '{}', true) ?: []),
                'users' => $usersByService[$svc['id']] ?? []
            ];
        }

        echo json_encode(['success' => true, 'services' => $result]);
        break;

    case 'create_service_account':
        if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }

        $service_name = trim((string) ($data['service_name'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $name = trim((string) ($data['name'] ?? ''));
        $role_display_name = trim((string) ($data['role_display_name'] ?? ''));
        $role = trim((string) ($data['role'] ?? 'user'));
        if (($role === 'admin' || $role === 'super_admin') && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
            $role = 'user';
        }
        $permissions = $data['permissions'] ?? [];

        if ($service_name === '' || $email === '' || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
            break;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Email invalide']);
            break;
        }

        $sqlite = getDb();

        // Check if user already exists
        $stmtCheck = $sqlite->prepare("SELECT 1 FROM users WHERE email = ?");
        $stmtCheck->execute([$email]);
        if ($stmtCheck->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Ce Gmail existe déjà']);
            break;
        }

        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        // Find if service exists, otherwise create it
        $stmtSvc = $sqlite->prepare("SELECT id FROM services WHERE LOWER(name) = ? AND company_id = ?");
        $stmtSvc->execute([strtolower($service_name), $company_id]);
        $svcRow = $stmtSvc->fetch();

        if ($svcRow) {
            $service_id = $svcRow['id'];
        } else {
            $service_id = 'svc_' . time() . '_' . rand(100, 999);
            $stmtAddSvc = $sqlite->prepare("INSERT INTO services (id, name, company_id, permissions) VALUES (?, ?, ?, ?)");
            $stmtAddSvc->execute([$service_id, $service_name, $company_id, json_encode(array_merge(getDefaultServicePermissions(), is_array($permissions) ? $permissions : []))]);
        }

        $password = generateTemporaryPassword(10);
        $cfg = getSubscriptionConfig();
        $trialStart = time();
        $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);

        if ($role_display_name === '') {
            $role_display_name = $role === 'user' ? 'Administrateur' : ucfirst($role);
        }

        $stmtUser = $sqlite->prepare('
            INSERT INTO users (
                email, password, name, role, role_display_name, service, service_id,
                company_id, permissions, trial_started_at, trial_ends_at,
                subscription_until, subscription_plan, subscription_price, subscription_currency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $stmtUser->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $name,
            $role,
            $role_display_name,
            $service_name,
            $service_id,
            $company_id,
            json_encode(getDefaultServicePermissions()),
            date('Y-m-d H:i:s', $trialStart),
            date('Y-m-d H:i:s', $trialEnd),
            null,
            (string) ($cfg['plan_code'] ?? 'premium_monthly'),
            (int) ($cfg['monthly_price'] ?? 20000),
            (string) ($cfg['currency'] ?? 'XOF')
        ]);

        echo json_encode(['success' => true, 'temp_password' => $password]);
        break;

    case 'update_service_permissions':
        if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }

        $service_id = (string) ($data['service_id'] ?? '');
        $permissions = $data['permissions'] ?? [];
        if ($service_id === '' || !is_array($permissions)) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $role = $_SESSION['user_role'] ?? '';

        // Verify the service belongs to the company if admin
        $sqlCheck = "SELECT 1 FROM services WHERE id = ?";
        $paramsCheck = [$service_id];
        if ($role !== 'super_admin') {
            $sqlCheck .= " AND company_id = ?";
            $paramsCheck[] = $company_id;
        }
        $stmtCheck = $sqlite->prepare($sqlCheck);
        $stmtCheck->execute($paramsCheck);
        if (!$stmtCheck->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Service introuvable']);
            break;
        }

        $mergedPerms = array_merge(getDefaultServicePermissions(), $permissions);

        $stmtUp = $sqlite->prepare("UPDATE services SET permissions = ? WHERE id = ?");
        $stmtUp->execute([json_encode($mergedPerms), $service_id]);

        refreshSessionPermissions();
        echo json_encode(['success' => true]);
        break;

    case 'delete_service_account':
       if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }

       $email = strtolower(trim((string) ($data['email'] ?? '')));
       if ($email === '' || $email === 'admin@gmail.com') {
           echo json_encode(['success' => false, 'message' => 'Compte non supprimable']);
            break;
        }

       $sqlite = getDb();
       $stmtCheck = $sqlite->prepare("SELECT 1 FROM users WHERE email = ?");
       $stmtCheck->execute([$email]);
       if (!$stmtCheck->fetch()) {
           echo json_encode(['success' => false, 'message' => 'Compte introuvable']);
            break;
        }

        $stmtDel = $sqlite->prepare("DELETE FROM users WHERE email = ?");
        $stmtDel->execute([$email]);
        echo json_encode(['success' => true]);
        break;

    case 'update_user_permissions':
        $updater_role = $_SESSION['user_role'] ?? '';
        if ($updater_role !== 'super_admin' && $updater_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $updater_company_id = $_SESSION['company_id'] ?? '';
        $targetEmail = strtolower(trim($data['email'] ?? ''));
        $newPermissions = $data['permissions'] ?? [];
        if (!$targetEmail) {
            echo json_encode(['success' => false, 'message' => 'Email manquant']);
            break;
        }
        $sqlite = getDb();
        $stmtUser = $sqlite->prepare("SELECT * FROM users WHERE email = ?");
        $stmtUser->execute([$targetEmail]);
        $targetUser = $stmtUser->fetch();
        if (!$targetUser) {
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
            break;
        }

        if ($updater_role === 'admin' && ($targetUser['company_id'] ?? '') !== $updater_company_id) {
            echo json_encode(['success' => false, 'message' => 'Vous ne pouvez modifier que les utilisateurs de votre entreprise']);
            break;
        }

        $permObj = is_array($newPermissions) ? $newPermissions : [];

        $stmtUp = $sqlite->prepare("UPDATE users SET permissions = ? WHERE email = ?");
        $stmtUp->execute([json_encode($permObj), $targetEmail]);

        echo json_encode(['success' => true, 'message' => 'Permissions mises à jour']);
        break;

    case 'get_company_users':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $stmt = $sqlite->prepare("SELECT id, name, email, profile_photo, service FROM users WHERE company_id = ? AND status = 'active'");
        $stmt->execute([$company_id]);
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'users' => $users]);
        break;

}
