<?php
/**
 * Module Authentification & Sessions — auth.php
 * Extrait de api_new.php
 *
 * Inclus depuis api_new.php — a accès à toutes les fonctions globales
 */

switch ($action) {
    case 'login':
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $email = trim(strtolower($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!checkRateLimit($ip, $email, 5, 15)) {
            echo json_encode(['success' => false, 'message' => 'Trop de tentatives échouées. Veuillez réessayer dans 15 minutes.']);
            break;
        }

        $user = getUserByEmail($email);
        error_log("Login attempt: email=$email, password=$password, user_found=" . ($user ? 'yes' : 'no') . ", hash=" . ($user ? $user['password'] : ''));

        if ($user && password_verify($password, $user['password'])) {
            $sqlite = getDb();
            $stmt_check = $sqlite->prepare("SELECT status, maintenance_mode FROM users WHERE email = ?");
            $stmt_check->execute([$email]);
            $uCheck = $stmt_check->fetch();
            $user_status = $uCheck['status'] ?? 'active';
            if ($user_status === 'suspended') {
                echo json_encode(['success' => false, 'message' => 'Ce compte a été suspendu par l\'administrateur.']);
                break;
            }
            if ($user_status === 'deactivated') {
                echo json_encode(['success' => false, 'message' => 'Ce compte a été désactivé.']);
                break;
            }

            recordLoginAttempt($ip, $email, true);
            if ($email === 'admin@gmail.com') {
                $user['role'] = 'super_admin';
                $user['role_display_name'] = 'Directeur Général';
            }
            $_SESSION['user_id'] = $email;
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['role_display_name'] = $user['role_display_name'] ?? '';
            $_SESSION['user_service'] = $user['service'];
            $_SESSION['service_id'] = $user['service_id'] ?? '';
            $_SESSION['company_id'] = $user['company_id'] ?? '';
            $_SESSION['permissions'] = getUserPermissionsByEmail($email);
            $subscription = getUserSubscriptionState($email);
            $_SESSION['subscription_state'] = $subscription;

            // ── Remember Me : cookie 30 jours ──────────────────────────────
            $rememberMe = !empty($data['rememberMe']);
            if ($rememberMe) {
                $token = bin2hex(random_bytes(32)); // 64 chars hex
                $sqlite2 = getDb();
                $sqlite2->prepare("UPDATE users SET remember_token = ? WHERE email = ?")->execute([$token, $email]);
                $cookieValue = base64_encode(json_encode(['email' => $email, 'token' => $token]));
                $expires = time() + (30 * 24 * 60 * 60); // 30 jours
                setcookie('pontage_remember_me', $cookieValue, [
                    'expires'  => $expires,
                    'path'     => '/',
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            }
            // ───────────────────────────────────────────────────────────────

            // Libérer le verrou de session maintenant que toutes les données sont écrites
            session_write_close();

            echo json_encode([
                'success' => true,
                'subscription_required' => !empty($subscription['access_allowed']) ? false : true,
                'subscription' => $subscription,
                'csrf_token' => $_SESSION['csrf_token']
            ]);
        } else {
            recordLoginAttempt($ip, $email, false);
            $rem = getRemainingAttempts($ip, 5, 15);
            echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect. Il vous reste ' . $rem . ' tentative(s).']);
        }
        break;

    case 'logout':
        // Révoquer le remember_token en base de données
        if (!empty($_SESSION['user_id'])) {
            try {
                getDb()->prepare("UPDATE users SET remember_token = NULL WHERE email = ?")->execute([$_SESSION['user_id']]);
            } catch (Exception $e) { /* silencieux */ }
        }
        // Supprimer le cookie du navigateur
        setcookie('pontage_remember_me', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'set_nav_state':
        $_SESSION['nav_state'] = [
            'period'    => $data['period']    ?? '',
            'agentId'   => $data['agentId']   ?? '',
            'agentName' => $data['agentName'] ?? '',
            'siteName'  => $data['siteName']  ?? '',
            'source'    => $data['source']    ?? '',
            'agentData' => $data['agentData'] ?? null,
        ];
        echo json_encode(['success' => true]);
        break;

    case 'get_nav_state':
        $state = $_SESSION['nav_state'] ?? null;
        // Ne pas unset() ici pour éviter les bugs avec React StrictMode
        echo json_encode(['success' => true, 'nav_state' => $state]);
        break;
        
    case 'clear_nav_state':
        unset($_SESSION['nav_state']);
        echo json_encode(['success' => true]);
        break;

    case 'get_user_info':
        // ── Auto-login via cookie Remember Me ──────────────────────────────
        if (!isset($_SESSION['user_id']) && !empty($_COOKIE['pontage_remember_me'])) {
            $cookieRaw = $_COOKIE['pontage_remember_me'];
            $cookieData = json_decode(base64_decode($cookieRaw), true);
            if (!empty($cookieData['email']) && !empty($cookieData['token'])) {
                $remEmail = trim(strtolower($cookieData['email']));
                $remToken = $cookieData['token'];
                $dbR = getDb();
                $stmtR = $dbR->prepare("SELECT * FROM users WHERE email = ? AND remember_token = ?");
                $stmtR->execute([$remEmail, $remToken]);
                $foundUser = $stmtR->fetch();
                if ($foundUser) {
                    // Re-créer la session silencieusement
                    if ($remEmail === 'admin@gmail.com') {
                        $foundUser['role'] = 'super_admin';
                        $foundUser['role_display_name'] = 'Directeur Général';
                    }
                    $_SESSION['user_id']          = $remEmail;
                    $_SESSION['user_name']         = $foundUser['name'];
                    $_SESSION['user_role']         = $foundUser['role'];
                    $_SESSION['role_display_name'] = $foundUser['role_display_name'] ?? '';
                    $_SESSION['user_service']      = $foundUser['service'];
                    $_SESSION['service_id']        = $foundUser['service_id'] ?? '';
                    $_SESSION['company_id']        = $foundUser['company_id'] ?? '';
                    $_SESSION['permissions']       = getUserPermissionsByEmail($remEmail);
                    $subR = getUserSubscriptionState($remEmail);
                    $_SESSION['subscription_state'] = $subR;
                    // Renouveler le cookie pour 30 jours supplémentaires
                    setcookie('pontage_remember_me', $cookieRaw, [
                        'expires'  => time() + (30 * 24 * 60 * 60),
                        'path'     => '/',
                        'httponly' => true,
                        'samesite' => 'Lax'
                    ]);
                } else {
                    // Token invalide — supprimer le cookie corrompu
                    setcookie('pontage_remember_me', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $subscription = getUserSubscriptionState($email);
        $fresh_permissions = getUserPermissionsByEmail($email);
        $_SESSION['permissions'] = $fresh_permissions;
        // Libérer le verrou de session : toutes les écritures sont terminées
        session_write_close();
        $db = getData();

        $sqlite = getDb();
        $stmt_user = $sqlite->prepare("SELECT profile_photo, has_seen_onboarding, has_seen_tour, phone, workspace_type, settings, status, maintenance_mode, force_password_change FROM users WHERE email = ?");
        $stmt_user->execute([$email]);
        $uRow = $stmt_user->fetch();

        $profile_photo = $uRow['profile_photo'] ?? ($db['users'][$email]['photo'] ?? null);
        $has_seen_onboarding = !empty($uRow['has_seen_onboarding']) ? true : ($db['users'][$email]['has_seen_onboarding'] ?? false);
        $has_seen_tour = !empty($uRow['has_seen_tour']) ? true : false;
        $phone = $uRow['phone'] ?? '';
        $workspace_type = $uRow['workspace_type'] ?? 'AUTRE';
        $settings = json_decode($uRow['settings'] ?? '{}', true);
        $status = $uRow['status'] ?? 'active';
        $maintenance_mode = !empty($uRow['maintenance_mode']) ? true : false;
        $force_password_change = !empty($uRow['force_password_change']) ? true : false;

        $user_data = [
            'email' => $email,
            'name' => $_SESSION['user_name'] ?? 'Utilisateur',
            'service' => $_SESSION['user_service'] ?? 'Service',
            'service_id' => $_SESSION['service_id'] ?? '',
            'role' => $_SESSION['user_role'] ?? 'user',
            'role_display_name' => $_SESSION['role_display_name'] ?? '',
            'company_id' => $_SESSION['company_id'] ?? '',
            'permissions' => $fresh_permissions,
            'has_seen_onboarding' => $has_seen_onboarding,
            'has_seen_tour' => $has_seen_tour,
            'profile_photo' => $profile_photo,
            'phone' => $phone,
            'workspace_type' => $workspace_type,
            'settings' => $settings,
            'status' => $status,
            'maintenance_mode' => $maintenance_mode,
            'force_password_change' => $force_password_change,
            'is_impersonated' => isset($_SESSION['impersonator_id'])
        ];

        $sqlite = getDb();
        if (($_SESSION['user_role'] ?? '') === 'super_admin') {
            $stmt = $sqlite->query("SELECT * FROM services");
            $services = [];
            while ($row = $stmt->fetch()) {
                $services[] = $row;
            }
            $user_data['all_services'] = $services;
            $user_data['switched_service_id'] = $_SESSION['switched_service_id'] ?? '';
        } elseif (($_SESSION['user_role'] ?? '') === 'admin') {
            $my_company_id = $_SESSION['company_id'] ?? '';
            $stmt = $sqlite->prepare("SELECT * FROM services WHERE company_id = ?");
            $stmt->execute([$my_company_id]);
            $services = [];
            while ($row = $stmt->fetch()) {
                $services[] = $row;
            }
            $user_data['all_services'] = $services;
            $user_data['switched_service_id'] = $_SESSION['switched_service_id'] ?? '';
        }

        // En mode impersonation, l'admin doit toujours avoir accès même si l'utilisateur cible n'a pas d'abonnement
        if (isset($_SESSION['impersonator_id'])) {
            $subscription['access_allowed'] = true;
        }

        echo json_encode([
            'success' => true,
            'user' => $user_data,
            'subscription' => $subscription,
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ]);
        break;


    case 'save_user_settings':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $settings = $data['settings'] ?? [];
        if (!is_array($settings)) {
            echo json_encode(['success' => false, 'message' => 'Format invalide']);
            break;
        }
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET settings = ? WHERE email = ?");
        $stmt->execute([json_encode($settings), $email]);
        echo json_encode(['success' => true]);
        break;

    case 'save_calendar_progress':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $period = $data['period'] ?? '';
        $progress = $data['progress'] ?? [];
        $db = getDb();
        $stmt = $db->prepare("REPLACE INTO calendar_progress (email, period, data) VALUES (?, ?, ?)");
        $stmt->execute([$email, $period, json_encode($progress)]);
        echo json_encode(['success' => true]);
        break;

    case 'get_calendar_progress':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $period = $data['period'] ?? '';
        $db = getDb();
        $stmt = $db->prepare("SELECT data FROM calendar_progress WHERE email = ? AND period = ?");
        $stmt->execute([$email, $period]);
        $row = $stmt->fetch();
        echo json_encode(['success' => true, 'progress' => $row ? json_decode($row['data'], true) : []]);
        break;

    case 'complete_onboarding':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];

        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET has_seen_onboarding = 1 WHERE email = ?");
        $stmt->execute([$email]);

        $db = getData();
        if (!isset($db['users'])) {
            $db['users'] = [];
        }
        if (!isset($db['users'][$email])) {
            $db['users'][$email] = [];
        }
        $db['users'][$email]['has_seen_onboarding'] = true;
        saveData($db);

        echo json_encode(['success' => true]);
        break;

    case 'complete_tour':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $sqlite = getDb();
        // Add column if it doesn't exist
        try {
            $sqlite->exec("ALTER TABLE users ADD COLUMN has_seen_tour TINYINT(1) DEFAULT 0");
        } catch(Throwable $e) {}
        
        try {
            $stmt = $sqlite->prepare("UPDATE users SET has_seen_tour = 1 WHERE email = ?");
            $stmt->execute([$email]);
        } catch(Throwable $e) {
            error_log("Error in complete_tour update: " . $e->getMessage());
        }
        echo json_encode(['success' => true]);
        break;


    case 'get_schema':
        $sqlite = getDb();
        $stmt = $sqlite->query("PRAGMA table_info(agents)");
        $cols = $stmt->fetchAll();
        echo json_encode(['success' => true, 'columns' => $cols]);
        break;

    case 'upload_profile_photo':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $postData = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($postData['photo'])) {
            echo json_encode(['success' => false, 'message' => 'Photo manquante']);
            break;
        }

        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET profile_photo = ? WHERE email = ?");
        $stmt->execute([$postData['photo'], $email]);

        $db = getData();
        if (!isset($db['users'])) {
            $db['users'] = [];
        }
        if (!isset($db['users'][$email])) {
            $db['users'][$email] = [];
        }
        $db['users'][$email]['photo'] = $postData['photo'];
        saveData($db);

        echo json_encode(['success' => true]);
        break;

    case 'send_private_message':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $sender = $_SESSION['user_id'];
        
        $receiver = trim($_POST['receiver_email'] ?? '');
        $messageText = trim($_POST['message'] ?? '');
        
        if (empty($receiver)) {
            echo json_encode(['success' => false, 'message' => 'Destinataire requis']);
            break;
        }
        if (empty($messageText) && empty($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Message ou fichier requis']);
            break;
        }

        $file_url = '';
        $file_name = '';

        if (!empty($_FILES['file']['name'])) {
            $uploadDir = __DIR__ . '/uploads/private/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $file_name = basename($_FILES['file']['name']);
            $ext = pathinfo($file_name, PATHINFO_EXTENSION);
            $uniqueName = uniqid('priv_') . '.' . $ext;
            $targetPath = $uploadDir . $uniqueName;

            if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                $file_url = 'uploads/private/' . $uniqueName;
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors du téléchargement du fichier']);
                break;
            }
        }

        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO private_messages (sender_email, receiver_email, message, file_url, file_name) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$sender, $receiver, $messageText, $file_url, $file_name]);
        
        echo json_encode(['success' => true]);
        break;

    case 'get_private_messages':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $user_email = $_SESSION['user_id'];
        $with_email = trim($data['with_email'] ?? '');

        $sqlite = getDb();
        
        if ($with_email) {
            $stmt = $sqlite->prepare("SELECT * FROM private_messages WHERE (sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?) ORDER BY created_at ASC");
            $stmt->execute([$user_email, $with_email, $with_email, $user_email]);
            $messages = $stmt->fetchAll();
            
            $stmtUpdate = $sqlite->prepare("UPDATE private_messages SET is_read = 1 WHERE receiver_email = ? AND sender_email = ?");
            $stmtUpdate->execute([$user_email, $with_email]);
            
            echo json_encode(['success' => true, 'messages' => $messages]);
        } else {
            $stmt = $sqlite->prepare("
                SELECT pm.*, 
                CASE WHEN sender_email = ? THEN receiver_email ELSE sender_email END as contact_email
                FROM private_messages pm
                INNER JOIN (
                    SELECT MAX(id) as max_id
                    FROM private_messages
                    WHERE sender_email = ? OR receiver_email = ?
                    GROUP BY CASE WHEN sender_email = ? THEN receiver_email ELSE sender_email END
                ) latest ON pm.id = latest.max_id
                ORDER BY pm.created_at DESC
            ");
            $stmt->execute([$user_email, $user_email, $user_email, $user_email]);
            $conversations = $stmt->fetchAll();
            
            $stmtUnread = $sqlite->prepare("SELECT sender_email, COUNT(*) as unread_count FROM private_messages WHERE receiver_email = ? AND is_read = 0 GROUP BY sender_email");
            $stmtUnread->execute([$user_email]);
            $unread = $stmtUnread->fetchAll();
            $unreadMap = [];
            foreach ($unread as $u) {
                $unreadMap[$u['sender_email']] = $u['unread_count'];
            }
            
            foreach ($conversations as &$c) {
                $c['unread_count'] = $unreadMap[$c['contact_email']] ?? 0;
            }
            
            echo json_encode(['success' => true, 'conversations' => $conversations]);
        }
        break;

    case 'update_user_status':
        if (($_SESSION['user_role'] ?? '') !== 'super_admin' && ($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $target_email = trim($data['email'] ?? '');
        $new_status = trim($data['status'] ?? '');
        if (!in_array($new_status, ['active', 'suspended', 'deactivated'])) {
            echo json_encode(['success' => false, 'message' => 'Statut invalide']);
            break;
        }
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET status = ? WHERE email = ?");
        $stmt->execute([$new_status, $target_email]);
        echo json_encode(['success' => true]);
        break;

    case 'toggle_user_maintenance':
        if (($_SESSION['user_role'] ?? '') !== 'super_admin' && ($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $target_email = trim($data['email'] ?? '');
        $maintenance_mode = !empty($data['maintenance_mode']) ? 1 : 0;
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET maintenance_mode = ? WHERE email = ?");
        $stmt->execute([$maintenance_mode, $target_email]);
        echo json_encode(['success' => true]);
        break;

    case 'impersonate_user':
        if (($_SESSION['user_role'] ?? '') !== 'super_admin' && ($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $target_email = trim($data['email'] ?? '');
        if (empty($target_email)) {
            echo json_encode(['success' => false, 'message' => 'Email cible requis']);
            break;
        }
        
        $user = getUserByEmail($target_email);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
            break;
        }

        // Bloquer l'utilisateur
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET maintenance_mode = 1 WHERE email = ?");
        $stmt->execute([$target_email]);

        // Sauvegarder la session de l'admin
        $_SESSION['impersonator_id'] = $_SESSION['user_id'];
        $_SESSION['impersonator_name'] = $_SESSION['user_name'];
        $_SESSION['impersonator_role'] = $_SESSION['user_role'];
        $_SESSION['impersonator_role_display_name'] = $_SESSION['role_display_name'] ?? '';
        $_SESSION['impersonator_service'] = $_SESSION['user_service'];
        $_SESSION['impersonator_service_id'] = $_SESSION['service_id'] ?? '';
        $_SESSION['impersonator_company_id'] = $_SESSION['company_id'] ?? '';
        $_SESSION['impersonator_permissions'] = $_SESSION['permissions'];

        // Établir la session du compte cible
        $_SESSION['user_id'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['role_display_name'] = $user['role_display_name'] ?? '';
        $_SESSION['user_service'] = $user['service'];
        $_SESSION['service_id'] = $user['service_id'] ?? '';
        $_SESSION['company_id'] = $user['company_id'] ?? '';
        $_SESSION['permissions'] = getUserPermissionsByEmail($target_email);

        echo json_encode(['success' => true]);
        break;

    case 'stop_impersonation':
        if (!isset($_SESSION['impersonator_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non en mode impersonation']);
            break;
        }
        
        // Optionnel : débloquer le compte
        $target_email = $_SESSION['user_id'];
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE users SET maintenance_mode = 0 WHERE email = ?");
        $stmt->execute([$target_email]);

        // Restaurer la session
        $_SESSION['user_id'] = $_SESSION['impersonator_id'];
        $_SESSION['user_name'] = $_SESSION['impersonator_name'];
        $_SESSION['user_role'] = $_SESSION['impersonator_role'];
        $_SESSION['role_display_name'] = $_SESSION['impersonator_role_display_name'];
        $_SESSION['user_service'] = $_SESSION['impersonator_service'];
        $_SESSION['service_id'] = $_SESSION['impersonator_service_id'];
        $_SESSION['company_id'] = $_SESSION['impersonator_company_id'];
        $_SESSION['permissions'] = $_SESSION['impersonator_permissions'];

        unset($_SESSION['impersonator_id'], $_SESSION['impersonator_name'], $_SESSION['impersonator_role'], $_SESSION['impersonator_role_display_name'], $_SESSION['impersonator_service'], $_SESSION['impersonator_service_id'], $_SESSION['impersonator_company_id'], $_SESSION['impersonator_permissions']);

        echo json_encode(['success' => true]);
        break;

    case 'update_profile':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $current_email = strtolower(trim($_SESSION['user_id']));
        $postData = json_decode(file_get_contents('php://input'), true) ?? [];

        $new_name = trim($postData['name'] ?? '');
        $new_email = strtolower(trim($postData['email'] ?? ''));
        $new_phone = trim($postData['phone'] ?? '');
        $new_password = trim($postData['password'] ?? '');
        $new_workspace = trim($postData['workspace_type'] ?? '');

        if (empty($new_name) || empty($new_email)) {
            echo json_encode(['success' => false, 'message' => 'Le nom et l\'email sont requis.']);
            break;
        }

        $sqlite = getDb();

        // Check if email changed and is already taken
        if ($new_email !== $current_email) {
            $stmt_check = $sqlite->prepare("SELECT id FROM users WHERE email = ?");
            $stmt_check->execute([$new_email]);
            if ($stmt_check->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Cette adresse email est déjà utilisée.']);
                break;
            }
        }

        // Update SQLite
        if (!empty($new_password)) {
            $hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $sqlite->prepare("UPDATE users SET name = ?, email = ?, phone = ?, workspace_type = ?, password = ?, force_password_change = 0 WHERE email = ?");
            $stmt->execute([$new_name, $new_email, $new_phone, $new_workspace, $hash, $current_email]);
        } else {
            $stmt = $sqlite->prepare("UPDATE users SET name = ?, email = ?, phone = ?, workspace_type = ? WHERE email = ?");
            $stmt->execute([$new_name, $new_email, $new_phone, $new_workspace, $current_email]);
        }

        // Update JSON file to reflect email/name changes if needed
        $db = getData();
        if (isset($db['users'][$current_email])) {
            $userData = $db['users'][$current_email];
            $userData['name'] = $new_name;
            if ($new_email !== $current_email) {
                $db['users'][$new_email] = $userData;
                unset($db['users'][$current_email]);
            } else {
                $db['users'][$current_email] = $userData;
            }
            saveData($db);
        }

        // Update Session
        $_SESSION['user_name'] = $new_name;
        if ($new_email !== $current_email) {
            $_SESSION['user_id'] = $new_email;
        }

        echo json_encode(['success' => true]);
        break;

    case 'switch_service':
        $role = $_SESSION['user_role'] ?? '';
        if ($role !== 'super_admin' && $role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $target_service_id = trim($data['service_id'] ?? '');

        // If admin, verify the target service belongs to their company
        if ($role === 'admin' && $target_service_id !== '') {
            $sqlite = getDb();
            $my_company_id = $_SESSION['company_id'] ?? '';
            $stmt = $sqlite->prepare("SELECT 1 FROM services WHERE id = ? AND company_id = ?");
            $stmt->execute([$target_service_id, $my_company_id]);
            if (!$stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Service invalide pour cette entreprise']);
                break;
            }
        }

        $_SESSION['switched_service_id'] = $target_service_id;
        echo json_encode(['success' => true]);
        break;

    case 'get_all_companies':
        if (($_SESSION['user_role'] ?? '') !== 'super_admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $sqlite = getDb();
        $companies = $sqlite->query("SELECT * FROM entreprises");
        echo json_encode(['success' => true, 'companies' => $companies]);
        break;

    case 'get_all_users':
        $req_role = $_SESSION['user_role'] ?? '';
        if ($req_role !== 'super_admin' && $req_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $sqlite = getDb();
        
        // --- FIX DE SESSION STALE ---
        $current_user_email = $_SESSION['user_id'] ?? '';
        if ($current_user_email) {
            $stmt_chk = $sqlite->prepare("SELECT company_id FROM users WHERE email = ?");
            $stmt_chk->execute([$current_user_email]);
            $chk = $stmt_chk->fetch();
            if ($chk && !empty($chk['company_id'])) {
                $_SESSION['company_id'] = $chk['company_id'];
            }
        }
        
        $req_company_id = $_SESSION['company_id'] ?? '';
        $users_list = [];

        $sql = "SELECT * FROM users";
        $params = [];
        if ($req_role === 'admin') {
            if (empty($req_company_id)) {
                $sql .= " WHERE (company_id = '' OR company_id IS NULL)";
            } else {
                $sql .= " WHERE company_id = ?";
                $params[] = $req_company_id;
            }
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        foreach ($users as $u) {
            $users_list[] = [
                'id' => $u['id'],
                'email' => $u['email'],
                'name' => $u['name'] ?? '',
                'role' => $u['role'] ?? '',
                'role_display_name' => $u['role_display_name'] ?? '',
                'service' => $u['service'] ?? '',
                'company_id' => $u['company_id'] ?? '',
                'workspace_type' => $u['workspace_type'] ?? 'AUTRE',
                'profile_photo' => $u['profile_photo'] ?? null,
                'status' => $u['status'] ?? 'active',
                'maintenance_mode' => !empty($u['maintenance_mode']),
                'password_reset_requested_at' => $u['password_reset_requested_at'] ?? null,
                'permissions' => json_decode($u['permissions'] ?? '{}', true) ?: [],
                'force_password_change' => !empty($u['force_password_change'])
            ];
        }
        error_log("get_all_users: role=$req_role, comp=$req_company_id, count=" . count($users_list));
        echo json_encode([
            'success' => true, 
            'users' => $users_list, 
            'debug' => [
                'req_role' => $req_role, 
                'req_company_id' => $req_company_id, 
                'sql' => $sql, 
                'count' => count($users)
            ]
        ]);
        break;

    case 'jarvisse_chat':
        $user_msg = $data['message'] ?? '';
        $user_email = $data['user_id'] ?? 'Utilisateur inconnu';
        $frontend_api_key = $data['api_key'] ?? '';
        $frontend_model = $data['model'] ?? 'llama-3.3-70b-versatile';
        $service_id = $_SESSION['service_id'] ?? '';
        $period = date('Y-m');

        // Récupérer des données opérationnelles complètes pour donner du contexte à l'IA
        $stats_context = "";
        if ($service_id) {
            $sqlite = getDb();

            // Total agents actifs
            $stmtAgents = $sqlite->prepare("SELECT COUNT(*) as cnt FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period = '' OR archived_period >= ?)");
            $stmtAgents->execute([$service_id, $period]);
            $totalAgents = (int)($stmtAgents->fetch()['cnt'] ?? 0);

            // Total sites
            $stmtSites = $sqlite->prepare("SELECT id, name FROM sites WHERE service_id = ? AND source_module != 'FACTURATION'");
            $stmtSites->execute([$service_id]);
            $sitesRows = $stmtSites->fetchAll() ?: [];
            $totalSites = count($sitesRows);
            $siteNamesList = array_map(function($s) { return $s['name']; }, $sitesRows);

            // Attendance stats pour le mois en cours
            $stmtPresent = $sqlite->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE period = ? AND status = '1' AND agent_id IN (SELECT id FROM agents WHERE service_id = ?)");
            $stmtPresent->execute([$period, $service_id]);
            $totalPresences = (int)($stmtPresent->fetch()['cnt'] ?? 0);

            $stmtAbsent = $sqlite->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE period = ? AND status IN ('A', 'ABANDON', 'DEMISSION') AND agent_id IN (SELECT id FROM agents WHERE service_id = ?)");
            $stmtAbsent->execute([$period, $service_id]);
            $totalAbsences = (int)($stmtAbsent->fetch()['cnt'] ?? 0);

            $totalPointages = $totalPresences + $totalAbsences;
            $tauxPresence = $totalPointages > 0 ? round(($totalPresences / $totalPointages) * 100, 1) : 0;

            // Top 5 agents les plus absents ce mois
            $stmtTopAbs = $sqlite->prepare("SELECT a.name, COUNT(att.id) as abs_count FROM attendance att JOIN agents a ON att.agent_id = a.id WHERE att.period = ? AND att.status IN ('A', 'ABANDON', 'DEMISSION') AND a.service_id = ? GROUP BY a.id ORDER BY abs_count DESC LIMIT 5");
            $stmtTopAbs->execute([$period, $service_id]);
            $topAbsents = $stmtTopAbs->fetchAll() ?: [];
            $topAbsStr = "";
            foreach ($topAbsents as $ta) {
                $topAbsStr .= $ta['name'] . " (" . $ta['abs_count'] . " absences), ";
            }
            $topAbsStr = rtrim($topAbsStr, ", ");

            // Masse salariale estimée
            $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
            $stmtGrid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ?");
            $stmtGrid->execute([$companyId]);
            $salary_config = [];
            while($row = $stmtGrid->fetch()) {
                $salary_config[$row['poste']] = (int)$row['taux_horaire'];
            }
            $masseSalariale = 0;
            if (!empty($salary_config)) {
                $stmtFuncs = $sqlite->prepare("SELECT * FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period = '' OR archived_period >= ?)");
                $stmtFuncs->execute([$service_id, $period]);
                $agentRows = $stmtFuncs->fetchAll() ?: [];
                foreach ($agentRows as $ag) {
                    $funcId = $ag['function_id'] ?? $ag['function'] ?? '';
                    $baseSalary = isset($salary_config[$funcId]) && $salary_config[$funcId] > 0 ? $salary_config[$funcId] : 75000;
                    $masseSalariale += $baseSalary;
                }
            }
            $masseStr = $masseSalariale > 0 ? number_format($masseSalariale, 0, ',', '.') . ' FCFA' : 'Non configurée';

            $stats_context = "DONNÉES OPÉRATIONNELLES EN TEMPS RÉEL (Période: $period) :\n";
            $stats_context .= "- Agents actifs : $totalAgents\n";
            $stats_context .= "- Nombre de sites : $totalSites (" . implode(', ', array_slice($siteNamesList, 0, 8)) . ")\n";
            $stats_context .= "- Pointages enregistrés ce mois : $totalPointages (Présences: $totalPresences, Absences: $totalAbsences)\n";
            $stats_context .= "- Taux de présence : {$tauxPresence}%\n";
            if ($topAbsStr) $stats_context .= "- Top agents les plus absents : $topAbsStr\n";
            $stats_context .= "- Masse salariale estimée : $masseStr\n";
        }

        $context = "Tu es Jarvisse, l'assistant IA intelligent de la plateforme ELYSIUM (gestion de pointage, paie et RH). Tu es serviable, professionnel, concis et tu réponds en français. Tu as accès aux données suivantes pour répondre aux questions de l'utilisateur :\n\n$stats_context\nL'utilisateur qui te parle utilise l'adresse: $user_email. Si l'utilisateur demande des informations que tu n'as pas, dis-le poliment et suggère où trouver l'information dans la plateforme.";

        $groq_api_key = !empty($frontend_api_key) ? $frontend_api_key : "VOTRE_CLE_API_ICI";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.groq.com/openai/v1/chat/completions");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);

        $headers = [
            "Authorization: Bearer " . $groq_api_key,
            "Content-Type: application/json"
        ];

        $payload = [
            "model" => $frontend_model,
            "messages" => [
                ["role" => "system", "content" => $context],
                ["role" => "user", "content" => $user_msg]
            ]
        ];

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            echo json_encode(['success' => false, 'message' => 'Erreur curl: ' . curl_error($ch)]);
            curl_close($ch);
            exit;
        }
        curl_close($ch);

        $response_data = json_decode($result, true);
        if (isset($response_data['choices'][0]['message']['content'])) {
            $reply = $response_data['choices'][0]['message']['content'];
            echo json_encode(['success' => true, 'reply' => $reply]);
        } else {
            // Afficher l'erreur réelle de Groq
            $error_msg = isset($response_data['error']['message']) ? $response_data['error']['message'] : "Erreur inconnue API";
            echo json_encode(['success' => true, 'reply' => "Désolé, il y a un problème de configuration API : " . $error_msg]);
        }
        break;

    case 'set_lang':
        $new_lang = $data['lang'] ?? 'fr';
        $_SESSION['lang'] = $new_lang;
        echo json_encode(['success' => true]);
        break;

    case 'request_password_reset':
        $sqlite = getDb();
        try {
            $sqlite->exec("ALTER TABLE users ADD COLUMN password_reset_requested_at DATETIME");
        } catch (Exception $e) {
            // Ignorer si la colonne existe déjà
        }

        $email = strtolower(trim($data['email'] ?? ''));
        if (empty($email)) {
            echo json_encode(['success' => false, 'message' => 'Email requis']);
            break;
        }

        $stmt = $sqlite->prepare("SELECT id, name, company_id, service_id FROM users WHERE LOWER(TRIM(email)) = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            $stmtUpdate = $sqlite->prepare("UPDATE users SET password_reset_requested_at = CURRENT_TIMESTAMP WHERE LOWER(TRIM(email)) = ?");
            $stmtUpdate->execute([$email]);

            $target_service = !empty($user['service_id']) ? $user['service_id'] : 'system';
            $ticket_id = 'tk_' . time() . '_' . rand(100, 999);
            $msg = "L'utilisateur " . $user['name'] . " (" . $email . ") a demandé une réinitialisation de son mot de passe. Vous pouvez générer un mot de passe temporaire depuis Gestion des Services.";
            $stmtIns = $sqlite->prepare("INSERT INTO tickets (id, from_service, to_service, from_user, from_user_email, title, content, status, priority, created_at) VALUES (?, 'system', ?, 'Système Sécurité', 'system@elysium', 'Demande de réinitialisation de mot de passe', ?, 'open', 'high', CURRENT_TIMESTAMP)");
            $stmtIns->execute([$ticket_id, $target_service, $msg]);
        }

        echo json_encode(['success' => true]);
        break;

    case 'register':
        $service_name = trim((string) ($data['service_name'] ?? 'Service'));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $name = trim((string) ($data['name'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($service_name === '' || $email === '' || $name === '' || $password === '') {
            echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
            break;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Email invalide']);
            break;
        }
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'Mot de passe trop court (min 6 caracteres)']);
            break;
        }

        $dbUser = getUserByEmail($email);
        if ($dbUser) {
            echo json_encode(['success' => false, 'message' => 'Ce compte existe deja']);
            break;
        }

        $dummyDb = [];
        $company_id = createCompany($dummyDb, $service_name, $email);
        $service_id = 'svc_' . time() . '_' . rand(100, 999);

        $sqlite = getDb();
        $sqlite->prepare('INSERT INTO services (id, name, company_id) VALUES (?, ?, ?)')->execute([$service_id, $service_name, $company_id]);

        $assigned_role = 'admin';
        $cfg = getSubscriptionConfig();
        $trialStart = time();
        $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);

        $sqlite->prepare('
           INSERT INTO users (
               email, password, name, role, role_display_name, service, service_id,
               company_id, permissions, trial_started_at, trial_ends_at,
               subscription_until, subscription_plan, subscription_price, subscription_currency
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ')->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $name,
            $assigned_role,
            'Propriétaire',
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

        $_SESSION['user_id'] = $email;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_role'] = $assigned_role;
        $_SESSION['role_display_name'] = 'Propriétaire';
        $_SESSION['user_service'] = $service_name;
        $_SESSION['service_id'] = $service_id;
        $_SESSION['company_id'] = $company_id;
        $_SESSION['permissions'] = getUserPermissionsByEmail($email);
        $subscription = getUserSubscriptionState($email);
        $_SESSION['subscription_state'] = $subscription;

        echo json_encode([
            'success' => true,
            'message' => 'Compte cree avec succes',
            'subscription_required' => !empty($subscription['access_allowed']) ? false : true,
            'subscription' => $subscription
        ]);
        break;

    case 'get_payment_providers':
        $paymentCfg = getPaymentConfig();
        $hasCinetpay = !empty($paymentCfg['cinetpay_api_key']) && !empty($paymentCfg['cinetpay_site_id']);
        echo json_encode([
            'success' => true,
            'providers' => [
                ['id' => 'stripe', 'name' => 'Stripe', 'enabled' => !empty($paymentCfg['stripe_secret_key'])],
                ['id' => 'orange_money', 'name' => 'Orange Money', 'enabled' => $hasCinetpay && !empty($paymentCfg['enable_orange_money'])],
                ['id' => 'wave', 'name' => 'Wave', 'enabled' => $hasCinetpay && !empty($paymentCfg['enable_wave'])]
            ]
        ]);
        break;

    case 'get_subscription_status':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expirée']);
            break;
        }
        echo json_encode(['success' => true, 'subscription' => getUserSubscriptionState($email)]);
        break;

} // end switch auth
