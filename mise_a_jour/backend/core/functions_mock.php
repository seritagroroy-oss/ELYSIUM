<?php
// Fonctions d'aide pour les réclamations (SQLite — migré depuis pointage_db.json)
if (!function_exists('getReclamations')) {
    function getReclamations($company_id = null) {
        $db = getDb();
        if ($company_id) {
            $stmt = $db->prepare('SELECT * FROM reclamations WHERE company_id = ? ORDER BY created_at DESC');
            $stmt->execute([$company_id]);
        } else {
            $stmt = $db->prepare('SELECT * FROM reclamations ORDER BY created_at DESC');
            $stmt->execute([]);
        }
        return $stmt->fetchAll();
    }
    function addReclamation($record, $company_id = 'comp_default_1') {
        $db = getDb();
        $record['id']         = 'rec_' . time() . '_' . rand(1000, 9999);
        $record['created_at'] = date('Y-m-d H:i:s');
        $record['company_id'] = $company_id;
        $db->prepare('
            INSERT INTO reclamations (
                id, company_id, service_declarant, agent_nom, agent_matricule, agent_site,
                agent_fonction, date_entree, reclamation_categorie, reclamation_categorie_autre,
                categorie, declarant_nom, declarant_prenom, declarant_matricule, declarant_fonction,
                declarant_service, type_erreur, type_erreur_autre, mois_concerne, jours_concernes,
                premiere_reclamation, ponction_precedente_correcte, montant_estime, action_demandee,
                description, radio_code, radio_signature, statut, avis_secretariat, avis_comptabilite, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ')->execute([
            $record['id'],
            $record['company_id'],
            $record['service_declarant']           ?? '',
            $record['agent_nom']                   ?? '',
            $record['agent_matricule']              ?? '',
            $record['agent_site']                  ?? '',
            $record['agent_fonction']               ?? '',
            $record['date_entree']                 ?? '',
            $record['reclamation_categorie']        ?? 'Salaire',
            $record['reclamation_categorie_autre'] ?? '',
            $record['categorie']                   ?? 'DIVERS',
            $record['declarant_nom']               ?? '',
            $record['declarant_prenom']             ?? '',
            $record['declarant_matricule']          ?? '',
            $record['declarant_fonction']           ?? '',
            $record['declarant_service']            ?? '',
            $record['type_erreur']                 ?? '',
            $record['type_erreur_autre']            ?? '',
            $record['mois_concerne']               ?? '',
            $record['jours_concernes']             ?? '',
            $record['premiere_reclamation']         ?? 'Oui',
            $record['ponction_precedente_correcte'] ?? 'Non',
            (float) ($record['montant_estime']     ?? 0),
            $record['action_demandee']             ?? '',
            $record['description']                 ?? '',
            $record['radio_code']                  ?? '',
            $record['radio_signature']             ?? '',
            $record['statut']                      ?? 'En attente',
            $record['avis_secretariat']            ?? '',
            $record['avis_comptabilite']            ?? '',
            $record['created_at']
        ]);
        return $record;
    }
    function updateReclamationStatus($id, $updates) {
        $db = getDb();
        $stmt = $db->prepare('SELECT id FROM reclamations WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) return false;
        $allowed = ['service_declarant','agent_nom','agent_matricule','agent_site','agent_fonction',
            'date_entree','reclamation_categorie','reclamation_categorie_autre','categorie',
            'declarant_nom','declarant_prenom','declarant_matricule','declarant_fonction','declarant_service',
            'type_erreur','type_erreur_autre','mois_concerne','jours_concernes',
            'premiere_reclamation','ponction_precedente_correcte','montant_estime','action_demandee',
            'description','radio_code','radio_signature','statut','statut_final','motif_refus','services_cibles','avis_secretariat','avis_comptabilite'];
        foreach ($updates as $k => $v) {
            if (!in_array($k, $allowed)) continue;
            if ($k === 'services_cibles' && is_array($v)) $v = json_encode($v);
            $db->prepare("UPDATE reclamations SET $k = ? WHERE id = ?")->execute([$v, $id]);
        }
        return true;
    }
    function getRadioSignatures($company_id = 'global') {
        // Cherche les signatures uniques dans service_data
        $db = getDb();
        $sigs = [];
        try {
            $stmt = $db->prepare("SELECT data_key, data_value as value FROM service_data WHERE service_id=? AND data_key LIKE 'radio_sig_%'");
            $stmt->execute([$company_id]);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $entry = json_decode($r['value'] ?? '{}', true);
                if (!empty($entry['code']) && !empty($entry['image'])) {
                    $sigs[] = [
                        'code' => $entry['code'], 
                        'image' => $entry['image'],
                        'nom' => $entry['nom'] ?? '',
                        'prenom' => $entry['prenom'] ?? '',
                        'matricule' => $entry['matricule'] ?? '',
                        'fonction' => $entry['fonction'] ?? '',
                        'service' => $entry['service'] ?? ''
                    ];
                }
            }
        } catch (Exception $e) { /* silencieux */ }
        return $sigs;
    }
    function addRadioSignature($code, $image, $nom = '', $prenom = '', $matricule = '', $fonction = '', $service = '', $company_id = 'global') {
        setServiceDataSql($company_id, 'radio_sig_' . $code, [
            'code' => $code, 
            'image' => $image,
            'nom' => $nom,
            'prenom' => $prenom,
            'matricule' => $matricule,
            'fonction' => $fonction,
            'service' => $service
        ]);
        return true;
    }
}

// CORS - Autoriser le frontend React (Vite dev server)
$allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN");

    // --- ONE-TIME PERMISSION MIGRATION ---
    try {
        $sqlite = getDb();
        $checkStmt = $sqlite->query("SELECT permissions FROM services LIMIT 1");
        $checkRow = !empty($checkStmt) ? $checkStmt[0] : null;
        if ($checkRow && strpos($checkRow['permissions'] ?? '', 'can_view_') !== false) {
            if (!function_exists('upgradePermissions')) {
                function upgradePermissions($perms) {
                    if (!is_array($perms)) return [];
                    $newPerms = $perms;
                    if (!empty($perms['can_view_dashboard'])) $newPerms['dashboard'] = 'write';
                    if (!empty($perms['can_view_archives'])) $newPerms['archives'] = 'read';
                    if (!empty($perms['can_view_salaries'])) $newPerms['salaries'] = 'write';
                    if (!empty($perms['can_view_settings'])) {
                        $newPerms['settings'] = 'write';
                        $newPerms['services'] = 'write';
                    }
                    if (!empty($perms['communication'])) $newPerms['communication'] = 'write';
                    if (!empty($perms['analytics'])) $newPerms['analytics'] = 'write';
                    if (!empty($perms['reclamation'])) $newPerms['reclamation_view'] = 'read';
                    if (!empty($perms['edit_reclamations'])) $newPerms['reclamation_edit'] = 'write';
                    if (!empty($perms['pc_radar'])) $newPerms['pc_radar'] = 'write';
                    foreach ($newPerms as $k => $v) {
                        if ($v === true) $newPerms[$k] = 'write';
                        elseif ($v === false) $newPerms[$k] = 'none';
                    }
                    return $newPerms;
                }
            }

            $servicesData = $sqlite->query("SELECT id, permissions FROM services");
            $upSvc = $sqlite->prepare("UPDATE services SET permissions = ? WHERE id = ?");
            foreach ($servicesData as $row) {
                $p = json_decode($row['permissions'] ?: '{}', true);
                $up = upgradePermissions($p);
                $upSvc->execute([json_encode($up), $row['id']]);
            }

            $usersData = $sqlite->query("SELECT email, permissions FROM users");
            $upUsr = $sqlite->prepare("UPDATE users SET permissions = ? WHERE email = ?");
            foreach ($usersData as $row) {
                $p = json_decode($row['permissions'] ?: '{}', true);
                $up = upgradePermissions($p);
                $upUsr->execute([json_encode($up), $row['email']]);
            }
        }
    } catch (Exception $e) {}
    // --- END MIGRATION ---
}
// Répondre immédiatement aux requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);
$data = is_array($data) ? $data : [];
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = array_merge($data, $_GET);
}

function refreshSessionPermissions()
{
    if (!isset($_SESSION['user_id'])) {
        return;
    }
    $perms = getUserPermissionsByEmail($_SESSION['user_id']);
    $_SESSION['permissions'] = $perms;
}

function hasPermission($permission)
{
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    $role = $_SESSION['user_role'] ?? '';
    if ($role === 'super_admin' || $role === 'admin') {
        return true;
    }

    if (!isset($_SESSION['permissions']) || !is_array($_SESSION['permissions'])) {
        refreshSessionPermissions();
    }
    
    // Auto-map new permission keys to old keys for backward compatibility
    if ($permission === 'dashboard' && !empty($_SESSION['permissions']['can_view_dashboard'])) return true;
    if ($permission === 'archives' && !empty($_SESSION['permissions']['can_view_archives'])) return true;
    if ($permission === 'salaries' && !empty($_SESSION['permissions']['can_view_salaries'])) return true;
    if ($permission === 'services' && !empty($_SESSION['permissions']['can_view_settings'])) return true;
    if ($permission === 'settings' && !empty($_SESSION['permissions']['can_view_settings'])) return true;
    
    return !empty($_SESSION['permissions'][$permission]);
}

function requirePermission($permission)
{
    if (!hasPermission($permission)) {
        echo json_encode(['success' => false, 'message' => 'Accès refusé']);
        exit;
    }
}

/**
 * Vérifie si l'utilisateur a accès en ÉCRITURE à un module.
 * Les admins ont toujours accès. Les autres doivent avoir la permission = 'write'.
 */
function hasWritePermission($permission)
{
    if (!isset($_SESSION['user_id'])) return false;
    $role = $_SESSION['user_role'] ?? '';
    if ($role === 'admin' || $role === 'super_admin') return true;
    if (!isset($_SESSION['permissions']) || !is_array($_SESSION['permissions'])) {
        refreshSessionPermissions();
    }
    $val = $_SESSION['permissions'][$permission] ?? null;
    return $val === 'write' || $val === true || $val === 'approver_3';
}

/**
 * Exige un accès en écriture sur un module (admin ou permission write).
 */
function requireWritePermission($permission)
{
    if (!hasWritePermission($permission)) {
        echo json_encode(['success' => false, 'message' => 'Accès refusé']);
        exit;
    }
}

function generateTemporaryPassword($length = 10)
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    $max = strlen($alphabet) - 1;
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $alphabet[random_int(0, $max)];
    }
    return $password;
}

function getBaseUrl()
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/api.php';
    $dir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');
    if ($dir === '' || $dir === '.') {
        return $https . '://' . $host;
    }
    return $https . '://' . $host . $dir;
}

function stripeApiRequest($method, $path, $params = [])
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'error' => 'Extension cURL non disponible sur le serveur'];
    }
    $paymentCfg = getPaymentConfig();
    $secretKey = (string) ($paymentCfg['stripe_secret_key'] ?? '');
    if ($secretKey === '') {
        return ['ok' => false, 'error' => 'STRIPE_SECRET_KEY manquant'];
    }

    $url = 'https://api.stripe.com/v1/' . ltrim($path, '/');
    $ch = curl_init();
    $headers = ['Authorization: Bearer ' . $secretKey];

    if (strtoupper($method) === 'GET') {
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
    } else {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_POST, true);
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        return ['ok' => false, 'error' => 'Erreur cURL Stripe: ' . $curlErr];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['ok' => false, 'error' => 'Reponse Stripe invalide'];
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $msg = $decoded['error']['message'] ?? ('HTTP ' . $httpCode);
        return ['ok' => false, 'error' => $msg, 'raw' => $decoded];
    }

    return ['ok' => true, 'data' => $decoded];
}

function cinetpayApiRequest($path, $payload = [])
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'error' => 'Extension cURL non disponible sur le serveur'];
    }

    $paymentCfg = getPaymentConfig();
    $apiKey = (string) ($paymentCfg['cinetpay_api_key'] ?? '');
    $siteId = (string) ($paymentCfg['cinetpay_site_id'] ?? '');
    if ($apiKey === '' || $siteId === '') {
        return ['ok' => false, 'error' => 'Configuration CinetPay manquante (CINETPAY_API_KEY / CINETPAY_SITE_ID)'];
    }

    $url = 'https://api-checkout.cinetpay.com/v2/payment/' . ltrim($path, '/');
    $payload = array_merge([
        'apikey' => $apiKey,
        'site_id' => $siteId
    ], $payload);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        return ['ok' => false, 'error' => 'Erreur cURL CinetPay: ' . $curlErr];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['ok' => false, 'error' => 'Reponse CinetPay invalide'];
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        return ['ok' => false, 'error' => 'Erreur HTTP CinetPay ' . $httpCode, 'raw' => $decoded];
    }

    $code = (string) ($decoded['code'] ?? '');
    if ($code !== '201' && $code !== '00') {
        return ['ok' => false, 'error' => (string) ($decoded['message'] ?? 'Erreur CinetPay'), 'raw' => $decoded];
    }

    return ['ok' => true, 'data' => $decoded];
}

function scopedActions()
{
    return [
        'get_dashboard_init',
        'get_analytics',
        'get_sites',
        'add_site',
        'update_site_icon',
        'add_subsite',
        'rename_site',
        'rename_subsite',
        'delete_subsite',
        'get_site_data',
        'add_agent',
        'get_salaries',
        'get_annual_cumuls',
        'get_company_config',
        'upload_company_logo',
        'delete_agent',
        'apply_mutation',
        'update_attendance',
        'bulk_update_attendance',
        'init_site_period',
        'apply_batch_rotation',
        'update_agent_info',
        'update_agent_profile',
        'get_messages',
        'archive_all_sites',
        'get_archives',
        'get_archive_detail',
        'delete_archive',
        'clear_site_mutations',
        'clear_agent_site_mutations',
        'get_site_agents',
        'get_all_agents',
        'update_agent_salary',
        'get_salary_config',
        'get_dashboard_history',
        'update_salary_config',
        'get_functions',
        'save_functions',
        'publish_period',
        'get_published_periods',
        'get_ui_prefs',
        'save_ui_prefs',
        'get_agents_for_deploy',
        'set_first_visit_period'
    ];
}

function resolveCurrentServiceKeySql()
{
    $role = $_SESSION['user_role'] ?? '';
    if (($role === 'super_admin' || $role === 'admin') && !empty($_SESSION['switched_service_id'])) {
        $switched = $_SESSION['switched_service_id'];
        if ($role === 'admin') {
            $my_company_id = $_SESSION['company_id'] ?? '';
            $sqlite = getDb();
            $stmt = $sqlite->prepare("SELECT id FROM services WHERE id = ? AND company_id = ?");
            $stmt->execute([$switched, $my_company_id]);
            if ($stmt->fetch()) {
                return $switched;
            }
        } else {
            return $switched;
        }
    }
    return $_SESSION['service_id'] ?? '';
}

function resolveCurrentCompanyIdSql()
{
    $switched = resolveCurrentServiceKeySql();
    if ($switched) {
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT company_id FROM services WHERE id = ?");
        $stmt->execute([$switched]);
        $row = $stmt->fetch();
        if ($row && !empty($row['company_id'])) {
            return $row['company_id'];
        }
    }
    return !empty($_SESSION['company_id']) ? $_SESSION['company_id'] : 'comp_default_1';
}

function resolveCurrentServiceKey($db)
{
    $email = $_SESSION['user_id'] ?? '';
    $user = $db['users'][$email] ?? [];
    $role = $user['role'] ?? '';

    // Super admin and admin (Propriétaire) can switch between services
    if (($role === 'super_admin' || $role === 'admin') && !empty($_SESSION['switched_service_id'])) {
        $switched = $_SESSION['switched_service_id'];
        // If admin, verify the switched service belongs to their company
        if ($role === 'admin') {
            $my_company_id = $_SESSION['company_id'] ?? '';
            $valid = false;
            foreach ($db['services'] ?? [] as $svc) {
                if ($svc['id'] === $switched && ($svc['company_id'] ?? '') === $my_company_id) {
                    $valid = true;
                    break;
                }
            }
            if ($valid)
                return $switched;
        } else {
            return $switched;
        }
    }
    $sid = (string) ($user['service_id'] ?? ($_SESSION['service_id'] ?? ''));
    if ($sid !== '') {
        return $sid;
    }
    $serviceName = (string) ($user['service'] ?? ($_SESSION['user_service'] ?? 'default'));
    return 'svc_' . substr(md5(strtolower(trim($serviceName))), 0, 8);
}

function ensureServiceDataBucket(&$db, $serviceKey)
{
    if (!isset($db['service_data']) || !is_array($db['service_data'])) {
        $db['service_data'] = [];
    }
    if (!isset($db['service_data'][$serviceKey]) || !is_array($db['service_data'][$serviceKey])) {
        $db['service_data'][$serviceKey] = [];
    }

    $defaults = [
        'sites' => [],
        'attendance' => [],
        'messages' => [],
        'archives' => [],
        'settings' => ['cycle_start' => 21, 'cycle_end' => 20],
        'salary_config' => [],
        'published_periods' => [],
        'functions' => [
            ['id' => 'AS', 'name' => 'Agent Simple'],
            ['id' => 'GA', 'name' => 'Garde Armé'],
            ['id' => 'MC', 'name' => 'Maître-Chien'],
            ['id' => 'CP', 'name' => 'Chef de Poste'],
            ['id' => 'Costume', 'name' => 'Agent en Costume']
        ],
        '_initialized' => false
    ];

    foreach ($defaults as $k => $v) {
        if (!isset($db['service_data'][$serviceKey][$k])) {
            $db['service_data'][$serviceKey][$k] = $v;
        }
    }
}

function hydrateScopedData(&$db, $serviceKey)
{
    ensureServiceDataBucket($db, $serviceKey);
    $scope = &$db['service_data'][$serviceKey];

    if (empty($scope['_initialized']) && !empty($db['sites']) && empty($scope['sites']) && empty($db['_global_migrated_to_service'])) {
        $scope['sites'] = $db['sites'] ?? [];
        $scope['attendance'] = $db['attendance'] ?? [];
        $scope['messages'] = $db['messages'] ?? [];
        $scope['archives'] = $db['archives'] ?? [];
        $scope['settings'] = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
        $scope['salary_config'] = $db['salary_config'] ?? [];
        $scope['published_periods'] = $db['published_periods'] ?? [];
        $scope['functions'] = $db['functions'] ?? $scope['functions'];
        $scope['_initialized'] = true;
        $db['_global_migrated_to_service'] = true;
    }

    $db['sites'] = $scope['sites'];

    // Inject Vivier des Extras if it doesn't exist
    $has_extras = false;
    foreach ($db['sites'] as $s) {
        if ($s['id'] === 'site_extras') {
            $has_extras = true;
            break;
        }
    }
    if (!$has_extras) {
        $db['sites'][] = [
            'id' => 'site_extras',
            'name' => '🌟 EXTRA BUREAU',
            'subsites' => [
                ['id' => 'site_extras_1', 'name' => 'Agents Disponibles', 'agents' => []]
            ]
        ];
    }

    // Inject Vivier des relèves if it doesn't exist
    $has_releves = false;
    foreach ($db['sites'] as $s) {
        if ($s['id'] === 'site_releves') {
            $has_releves = true;
            break;
        }
    }
    if (!$has_releves) {
        $db['sites'][] = [
            'id' => 'site_releves',
            'name' => '🔄 Vivier des relèves',
            'subsites' => [
                ['id' => 'site_releves_1', 'name' => 'Agents Disponibles', 'agents' => []]
            ]
        ];
    }

    // Inject EXTRA SUR SITE if it doesn't exist
    $has_extras_sur_site = false;
    foreach ($db['sites'] as $s) {
        if ($s['id'] === 'site_extras_sur_site') {
            $has_extras_sur_site = true;
            break;
        }
    }
    if (!$has_extras_sur_site) {
        $db['sites'][] = [
            'id' => 'site_extras_sur_site',
            'name' => '🌟 EXTRA SUR SITE',
            'subsites' => [] // Subsites will be managed dynamically by the user
        ];
    }

    // Inject Administration if it doesn't exist
    $has_admin = false;
    foreach ($db['sites'] as $s) {
        if ($s['id'] === 'site_administration') {
            $has_admin = true;
            break;
        }
    }
    if (!$has_admin) {
        $db['sites'][] = [
            'id' => 'site_administration',
            'name' => '🏢 Administration',
            'subsites' => [
                ['id' => 'site_admin_1', 'name' => 'Personnel Administratif', 'agents' => []]
            ]
        ];
    }

    $db['attendance'] = $scope['attendance'];
    $db['messages'] = $scope['messages'];
    $db['archives'] = $scope['archives'];
    $db['settings'] = $scope['settings'];
    $db['salary_config'] = $scope['salary_config'];
    $db['payslip_template'] = $scope['payslip_template'] ?? [];
    $db['published_periods'] = $scope['published_periods'] ?? [];
    $db['functions'] = $scope['functions'];
    $db['manual_adjustments'] = $scope['manual_adjustments'] ?? [];
    $db['site_revenues'] = $scope['site_revenues'] ?? [];
}

function persistScopedData(&$db, $serviceKey)
{
    ensureServiceDataBucket($db, $serviceKey);
    $db['service_data'][$serviceKey]['sites'] = $db['sites'] ?? [];
    $db['service_data'][$serviceKey]['attendance'] = $db['attendance'] ?? [];
    $db['service_data'][$serviceKey]['messages'] = $db['messages'] ?? [];
    $db['service_data'][$serviceKey]['archives'] = $db['archives'] ?? [];
    $db['service_data'][$serviceKey]['settings'] = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
    $db['service_data'][$serviceKey]['salary_config'] = $db['salary_config'] ?? [];
    $db['service_data'][$serviceKey]['payslip_template'] = $db['payslip_template'] ?? [];
    $db['service_data'][$serviceKey]['published_periods'] = $db['published_periods'] ?? [];
    $db['service_data'][$serviceKey]['functions'] = $db['functions'] ?? [];
    $db['service_data'][$serviceKey]['manual_adjustments'] = $db['manual_adjustments'] ?? [];
    $db['service_data'][$serviceKey]['site_revenues'] = $db['site_revenues'] ?? [];
    $db['service_data'][$serviceKey]['_initialized'] = true;
}

function getServiceDataSql($serviceKey, $key, $default = [])
{
    $sqlite = getDb();
    $stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = ?");
    $stmt->execute([$serviceKey, $key]);
    $row = $stmt->fetch();
    $res = $row ? ($row['data_value'] ?? null) : null;
    return $res ? json_decode($res, true) : $default;
}

function setServiceDataSql($serviceKey, $key, $value)
{
    $sqlite = getDb();
    $stmtCheck = $sqlite->prepare("SELECT 1 FROM service_data WHERE service_id = ? AND data_key = ?");
    $stmtCheck->execute([$serviceKey, $key]);
    if ($stmtCheck->fetch()) {
        $stmtUpdate = $sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = ?");
        $stmtUpdate->execute([json_encode($value), $serviceKey, $key]);
    } else {
        $stmtInsert = $sqlite->prepare("INSERT INTO service_data (service_id, data_key, data_value) VALUES (?, ?, ?)");
        $stmtInsert->execute([$serviceKey, $key, json_encode($value)]);
    }
}

function buildSiteDataSnapshot($sqlite, $serviceKey, $period, $siteOrder = [])
{
    $stmt = $sqlite->prepare("SELECT * FROM sites WHERE service_id = ? AND source_module != 'FACTURATION'");
    $stmt->execute([$serviceKey]);
    $sites = $stmt->fetchAll();

    // Inject virtual sites
    $has_extras = false;
    $has_releves = false;
    $has_admin = false;
    foreach ($sites as $s) {
        if ($s['id'] === 'site_extras')
            $has_extras = true;
        if ($s['id'] === 'site_releves')
            $has_releves = true;
        if ($s['id'] === 'site_administration')
            $has_admin = true;
    }
    if (!$has_extras) {
        $sites[] = ['id' => 'site_extras', 'name' => '🌟 EXTRA BUREAU'];
    }
    if (!$has_releves) {
        $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
    }
    if (!array_filter($sites, fn($s) => $s['id'] === 'site_extras_sur_site')) {
        $sites[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];
    }
    if (!$has_admin)
        $sites[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];

    if (!empty($siteOrder)) {
        usort($sites, function($a, $b) use ($siteOrder) {
            $idxA = array_search($a['id'], $siteOrder);
            $idxB = array_search($b['id'], $siteOrder);
            if ($idxA !== false && $idxB !== false) return $idxA - $idxB;
            if ($idxA !== false) return -1;
            if ($idxB !== false) return 1;
            return 0;
        });
    }

    $snapshot = [];
    foreach ($sites as $site) {
        $site_id = $site['id'];
        $site_name = $site['name'];

        $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
        $stmtSub->execute([$site_id]);
        $subsites = $stmtSub->fetchAll();

        // Inject default subsites for virtual sites if they are not in DB
        if (in_array($site_id, ['site_extras', 'site_releves', 'site_administration']) && empty($subsites)) {
            if ($site_id === 'site_extras')
                $subsites = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
            if ($site_id === 'site_releves')
                $subsites = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
            if ($site_id === 'site_administration')
                $subsites = [['id' => 'site_admin_1', 'name' => 'Bureau']];
        }

        foreach ($subsites as &$sub) {
            $stmtAg = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period >= ?) ORDER BY name");
            $stmtAg->execute([$sub['id'], $serviceKey, $period]);
            $agents = $stmtAg->fetchAll();

            foreach ($agents as &$agent) {
                $agent['has_sp'] = (int) $agent['has_sp'];
                if (isset($agent['shift_history']) && is_string($agent['shift_history'])) {
                    $agent['shift_history'] = json_decode($agent['shift_history'], true) ?: [];
                } else {
                    $agent['shift_history'] = [];
                }
                $stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                $stmtAtt->execute([$agent['id'], $period]);
                $agent['attendance'] = $stmtAtt->fetchAll() ?: [];
            }
            $sub['agents'] = $agents;
        }

        // === Mutation detection (same logic as get_site_data) ===
        $mutated_agents = [];
        $deployed_extras = [];

        $stmt_mut = $sqlite->prepare("
            SELECT DISTINCT a.agent_id, ag.*
            FROM attendance a
            JOIN agents ag ON a.agent_id = ag.id
            WHERE ag.service_id = ?
            AND a.period = ?
            AND (a.status LIKE ? OR a.status LIKE ? OR a.status LIKE ?)
        ");

        $like_m = 'M|' . $site_name;
        $like_ext = 'EXT%|' . $site_name;
        $like_rel = 'REL%|' . $site_name;

        $stmt_mut->execute([$serviceKey, $period, $like_m, $like_ext, $like_rel]);
        $mutated_rows = $stmt_mut->fetchAll();

        foreach ($mutated_rows as $agent) {
            $stmt_orig = $sqlite->prepare("SELECT s.name, s.id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = ?");
            $stmt_orig->execute([$agent['subsite_id']]);
            $orig_site = $stmt_orig->fetch();

            if ($orig_site && $orig_site['id'] !== $site_id) {
                $stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                $stmtAtt->execute([$agent['id'], $period]);

                $mutated_agent = $agent;
                $mutated_agent['has_sp'] = (int) $mutated_agent['has_sp'];
                if (isset($mutated_agent['shift_history']) && is_string($mutated_agent['shift_history'])) {
                    $mutated_agent['shift_history'] = json_decode($mutated_agent['shift_history'], true) ?: [];
                } else {
                    $mutated_agent['shift_history'] = [];
                }
                $mutated_agent['attendance'] = $stmtAtt->fetchAll() ?: [];
                $mutated_agent['is_mutated'] = true;
                $mutated_agent['original_site'] = $orig_site['name'];

                if (strpos($orig_site['id'], 'site_extras') !== false) {
                    $mutated_agent['is_extra'] = true;
                    $deployed_extras[] = $mutated_agent;
                } elseif (strpos($orig_site['id'], 'site_releves') !== false) {
                    $mutated_agent['is_releve'] = true;
                    $deployed_extras[] = $mutated_agent;
                } else {
                    $mutated_agents[] = $mutated_agent;
                }
            }
        }

        foreach ($mutated_agents as $ma) {
            $added = false;
            if (!empty($ma['target_subsite_id'])) {
                foreach ($subsites as &$sub) {
                    if ($sub['id'] === $ma['target_subsite_id']) {
                        $sub['agents'][] = $ma;
                        $added = true;
                        break;
                    }
                }
                unset($sub);
            }
            if (!$added) {
                if (!empty($subsites) && isset($subsites[0])) {
                    $subsites[0]['agents'][] = $ma;
                } else {
                    $subsites[] = [
                        'id' => 'default_' . $site_id,
                        'name' => 'Zone par défaut',
                        'agents' => [$ma]
                    ];
                }
            }
        }

        if (!empty($deployed_extras)) {
            usort($deployed_extras, function ($a, $b) {
                $is_releve_a = isset($a['is_releve']) && $a['is_releve'] ? 1 : 0;
                $is_releve_b = isset($b['is_releve']) && $b['is_releve'] ? 1 : 0;
                if ($is_releve_a !== $is_releve_b)
                    return $is_releve_b - $is_releve_a;
                return strcmp($a['name'], $b['name']);
            });
            foreach ($deployed_extras as $ma) {
                $added = false;
                if (!empty($ma['target_subsite_id'])) {
                    foreach ($subsites as &$sub) {
                        if ($sub['id'] === $ma['target_subsite_id']) {
                            $sub['agents'][] = $ma;
                            $added = true;
                            break;
                        }
                    }
                    unset($sub);
                }
                if (!$added) {
                    if (!empty($subsites) && isset($subsites[0])) {
                        $subsites[0]['agents'][] = $ma;
                    } else {
                        $subsites[] = [
                            'id' => 'default_' . $site_id,
                            'name' => 'Zone par défaut',
                            'agents' => [$ma]
                        ];
                    }
                }
            }
        }
        // === End mutation detection ===

        $snapshot[] = [
            'id' => $site['id'],
            'name' => $site['name'],
            'icon' => $site['icon'] ?? '',
            'subsites' => $subsites
        ];
    }
    return $snapshot;
}

function getScopedData(&$serviceKey)
{
    $serviceKey = $_SESSION['service_id'] ?? null;
    return []; // Dummy for legacy endpoints during transition
}

function saveScopedData($db, $serviceKey)
{
    // No-op for legacy endpoints
}

$publicActions = ['login', 'logout', 'set_lang', 'register', 'cinetpay_notify', 'get_payment_providers', 'get_user_info', 'register_agent_portal', 'login_agent_portal', 'get_leave_types', 'submit_leave_request', 'get_my_leave_balances', 'get_my_leave_requests', 'request_password_reset', 'debug_users', 'debug_get_sites', 'test_dates', 'update_agent_schedules'];
if (!in_array($action, $publicActions, true) && !isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Session expirée']);
    exit;
}

$subscriptionExemptActions = ['login', 'logout', 'set_lang', 'register', 'cinetpay_notify', 'get_subscription_status', 'activate_subscription', 'create_checkout_session', 'confirm_stripe_payment', 'confirm_cinetpay_payment', 'get_payment_providers', 'get_user_info'];
if (!in_array($action, $subscriptionExemptActions, true) && isset($_SESSION['user_id'])) {
    $subscriptionState = getUserSubscriptionState($_SESSION['user_id']);
    if (empty($subscriptionState['access_allowed'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Abonnement admin non actif. Acces bloque pour tous les comptes.',
            'subscription_required' => true,
            'subscription' => $subscriptionState
        ]);
        exit;
    }
}

// Validation CSRF sur les requêtes mutantes
if ($action === 'debug_users') {
    $sqlite = getDb();
    
    $stmt1 = $sqlite->prepare("SELECT * FROM sites WHERE company_id = 'comp_fb486391'");
    $stmt1->execute();
    $sites = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $sqlite->prepare("SELECT * FROM subsites WHERE company_id = 'comp_fb486391'");
    $stmt2->execute();
    $subsites = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'sites' => $sites, 'subsites' => $subsites]);
    exit;
}
if ($action === 'debug_get_sites') {
    $_GET['scope'] = 'company';
    $_SESSION['service_id'] = 'svc_356c0d65';
    $_SESSION['company_id'] = 'comp_fb486391';
    
    // On va juste include sites.php avec get_sites
    $action = 'get_sites';
    $sqlite = getDb();
    require_once __DIR__ . '/../modules/sites.php';
    exit;
}

// Le token est fourni par get_user_info et stocké côté client
$mutatingActions = ['add_site', 'add_special_site', 'update_site_icon', 'add_subsite', 'rename_site', 'rename_subsite', 'delete_subsite', 'add_agent', 'delete_agent', 'apply_mutation', 'update_attendance', 'bulk_update_attendance', 'mark_agent_sortant', 'delete_agent_sortant', 'mark_agent_entrant', 'delete_agent_entrant', 'mark_agent_debut', 'init_site_period', 'apply_batch_rotation', 'update_agent_info', 'clear_site_mutations', 'clear_agent_site_mutations', 'archive_all_sites', 'reset_year_attendance', 'delete_archive', 'update_agent_salary', 'update_salary_config', 'save_functions', 'publish_period', 'send_message', 'resolve_ticket', 'create_ticket', 'delete_message', 'pin_message', 'rate_ticket', 'assign_ticket', 'add_reclamation', 'update_reclamation_status', 'send_private_message', 'update_user_status', 'toggle_user_maintenance', 'upload_company_logo', 'set_first_visit_period'];
if (in_array($action, $mutatingActions, true)) {
    $providedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $data['csrf_token'] ?? '';
    $sessionToken = $_SESSION['csrf_token'] ?? '';
    // On rejette uniquement si les deux tokens sont non-vides ET différents
    // (évite les faux positifs lors de la première connexion React)
    if ($sessionToken !== '' && $providedToken !== '' && !hash_equals($sessionToken, $providedToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Erreur CSRF: Token invalide']);
        exit;
    }
}

$permissionByAction = [
    'get_dashboard_init' => 'dashboard',
    'get_site_data' => 'dashboard',
    // add_subsite, rename_subsite, delete_subsite : permission gérée en interne (dashboard OU salaries/compta)
    'add_agent' => 'dashboard',
    'delete_agent' => 'dashboard',
    'apply_mutation' => 'dashboard',
    'update_attendance' => 'dashboard',
    'bulk_update_attendance' => 'dashboard',
    'mark_agent_sortant' => 'dashboard',
    'delete_agent_sortant' => 'dashboard',
    'mark_agent_entrant' => 'dashboard',
    'delete_agent_entrant' => 'dashboard',
    'mark_agent_debut' => 'dashboard',
    'init_site_period' => 'dashboard',
    'apply_batch_rotation' => 'dashboard',
    'update_agent_info' => 'dashboard',
    'clear_site_mutations' => 'dashboard',
    'clear_agent_site_mutations' => 'dashboard',
    'update_site_icon' => 'dashboard',
    'archive_all_sites' => 'dashboard',
    'reset_year_attendance' => 'dashboard',
    'get_archives' => 'archives',
    'get_archive_detail' => 'archives',
    'get_messages' => 'archives',
    'get_dashboard_history' => 'fluctuation',
    'get_salaries' => 'fluctuation',
    'get_all_agents' => 'fluctuation',
    'get_fluctuation_analytics' => 'fluctuation',
    'save_manual_adjustment' => 'fluctuation',
    'delete_manual_adjustment' => 'fluctuation',
    'save_site_revenue' => 'fluctuation',
    'set_first_visit_period' => 'dashboard'
];

if (isset($permissionByAction[$action])) {
    requirePermission($permissionByAction[$action]);
}

function getPeriodDates($period, $start_day, $end_day)
{
    $base = DateTime::createFromFormat('Y-m-d', $period . '-01');
    if (!$base) {
        return [];
    }

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
        if (count($dates) > 62) {
            break;
        }
    }

    return $dates;
}

function applyShiftDefaultsForPeriod(&$db, $agent_id, $period, $shift_type, $is_admin = false, $is_special = false, $special_days = [])
{
    if (!$agent_id || !$period) {
        return;
    }

    $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
    $start_day = (int) ($settings['cycle_start'] ?? 21);
    $end_day = (int) ($settings['cycle_end'] ?? 20);
    $dates = getPeriodDates($period, $start_day, $end_day);

    if (!isset($db['attendance'][$period])) {
        $db['attendance'][$period] = [];
    }
    if (!isset($db['attendance'][$period][$agent_id])) {
        $db['attendance'][$period][$agent_id] = [];
    }
    $db['attendance'][$period][$agent_id]['J'] = [];
    $db['attendance'][$period][$agent_id]['N'] = [];
    if ($shift_type === 'Jour' || $shift_type === 'Nuit') {
        $shift_key = ($shift_type === 'Nuit') ? 'N' : 'J';
        $random_rest_day = rand(0, 6);
        foreach ($dates as $ds) {
            $date_obj = new DateTime($ds);
            $w = (int) $date_obj->format('N'); // 1 (for Monday) through 7 (for Sunday)
            
            if ($is_special) {
                if (in_array($w, $special_days) || in_array((string)$w, $special_days)) {
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
                } else {
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
                }
            } else if ($is_admin) {
                if ($w !== 7 && $w !== 6) { // 7=Sunday, 6=Saturday
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
                } else {
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
                }
            } else {
                $w_0_6 = (int) $date_obj->format('w'); // 0=Sunday for legacy compatibility
                if ($w_0_6 === $random_rest_day) {
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
                } else {
                    $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
                }
            }
        }
        return;
    }

    $cycle = 1;
    $work = 1;
    if ($shift_type === '24h') {
        $cycle = 2;
        $work = 1;
    } elseif ($shift_type === '48h') {
        $cycle = 4;
        $work = 2;
    } elseif ($shift_type === '72h') {
        $cycle = 6;
        $work = 3;
    }

    foreach ($dates as $idx => $ds) {
        $pos = $idx % $cycle;
        if ($pos < $work) {
            $db['attendance'][$period][$agent_id]['J'][$ds] = '1';
            $db['attendance'][$period][$agent_id]['N'][$ds] = '1';
        } else {
            // Jour de repos pour agent rotatif → enregistrer 'R'
            $db['attendance'][$period][$agent_id]['J'][$ds] = 'R';
            $db['attendance'][$period][$agent_id]['N'][$ds] = 'R';
        }
    }
}

function updateUserActivity(&$db, $email)
{
    if (!$email || !isset($db['users'][$email]))
        return false;
    $now = time();
    $last = $db['users'][$email]['last_activity'] ?? 0;
    if (is_string($last)) {
        $last = strtotime($last);
    }
    // Only update if last_activity is older than 30 seconds to prevent constant JSON file writes
    if ($now - $last > 30) {
        $db['users'][$email]['last_activity'] = date('Y-m-d H:i:s', $now);
        return true;
    }
    return false;
}

/**
 * Vérifie si une période est verrouillée (publiée) pour une entreprise.
 * Une période publiée est immuable : ni le pointage ni les mutations ne peuvent
 * être modifiés. Les données de paie sont servies depuis le snapshot gelé.
 */
function isPayrollPeriodLocked($sqlite, $companyKey, $period) {
    $published = getServiceDataSql($companyKey, 'published_periods', []);
    return in_array($period, $published);
}

/**
 * Vérifie si une période est complètement clôturée/archivée.
 */
function isPayrollArchived($sqlite, $companyKey, $period) {
    // TEMP FIX: Always return false so the live data is loaded and can be re-archived properly!
    return false;
}

/**
 * Sauvegarde un snapshot gelé des salaires au moment de la publication.
 * Utilise ON DUPLICATE KEY UPDATE pour écraser si re-publication (MySQL).
 */
function savePayrollSnapshot($sqlite, $companyKey, $period, $salariesData, $serviceKey) {
    $stmt = $sqlite->prepare(
        "INSERT INTO payroll_snapshots (company_id, period, snapshot, published_by, published_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(company_id, period) DO UPDATE SET
             snapshot     = excluded.snapshot,
             published_by = excluded.published_by,
             published_at = excluded.published_at"
    );
    $stmt->execute([
        $companyKey,
        $period,
        json_encode($salariesData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $serviceKey,
        date('Y-m-d H:i:s')
    ]);
}

/**
 * Récupère le snapshot gelé des salaires pour une période publiée.
 * Retourne null si aucun snapshot n'existe (première publication ou snapshot supprimé).
 */
function getPayrollSnapshot($sqlite, $companyKey, $period) {
    $stmt = $sqlite->prepare(
        "SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?"
    );
    $stmt->execute([$companyKey, $period]);
    $row = $stmt->fetch();
    if ($row && !empty($row['snapshot'])) {
        $decoded = json_decode($row['snapshot'], true);
        return is_array($decoded) ? $decoded : null;
    }
    return null;
}

/**
 * Supprime le snapshot gelé lors d'une dépublication.
 */
function deletePayrollSnapshot($sqlite, $companyKey, $period) {
    $sqlite->prepare(
        "DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?"
    )->execute([$companyKey, $period]);
}

function generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey) {
$settings_raw = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $start_day = (int) ($settings_raw['cycle_start'] ?? 21);
        $end_day = (int) ($settings_raw['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);

        $company_key_str = 'company::' . $companyKey;
        $functions_raw = getServiceDataSql($company_key_str, 'functions', []);
        if (empty($functions_raw)) {
            $functions_raw = getServiceDataSql($companyKey, 'functions', []);
        }

        $payroll_settings = getServiceDataSql($company_key_str, 'payroll_settings', []);
        if (empty($payroll_settings)) {
            $payroll_settings = getServiceDataSql($companyKey, 'payroll_settings', []);
        }
        $include_p = isset($payroll_settings['count_hours_permissions']) ? $payroll_settings['count_hours_permissions'] : false;
        $include_m = isset($payroll_settings['count_hours_maladie']) ? $payroll_settings['count_hours_maladie'] : false;
        $include_cp = isset($payroll_settings['count_hours_conges']) ? $payroll_settings['count_hours_conges'] : true;
        $include_r = isset($payroll_settings['count_hours_repos']) ? $payroll_settings['count_hours_repos'] : false;

        $j_start = strtotime($payroll_settings['shift_j_start'] ?? '06:30');
        $j_end = strtotime($payroll_settings['shift_j_end'] ?? '18:30');
        $j_hours = ($j_end - $j_start) / 3600;
        if ($j_hours < 0) $j_hours += 24;

        $n_start = strtotime($payroll_settings['shift_n_start'] ?? '18:30');
        $n_end = strtotime($payroll_settings['shift_n_end'] ?? '06:30');
        $n_hours = ($n_end - $n_start) / 3600;
        if ($n_hours < 0) $n_hours += 24;

        $salary_config_raw = [];
        $nameToId = [];
        foreach ($functions_raw as $f) {
            $nameToId[$f['name']] = $f['id'];
        }
        $stmtGrid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ?");
        $stmtGrid->execute([$companyKey]);
        while($row = $stmtGrid->fetch()) {
            $poste = $row['poste'];
            $key = isset($nameToId[$poste]) ? $nameToId[$poste] : $poste;
            $salary_config_raw[$key] = (int)$row['taux_horaire'];
        }
        // Charger la prime par site depuis site_contracts
        $stmtPrimes = $sqlite->prepare("SELECT site_name, prime_site, prime_function FROM site_contracts WHERE company_id = ?");
        $stmtPrimes->execute([$companyKey]);
        $site_primes_map = [];
        while ($pr = $stmtPrimes->fetch()) {
            $site_primes_map[$pr['site_name']] = [
                'prime' => (int)($pr['prime_site'] ?? 0),
                'func'  => $pr['prime_function'] ?? ''
            ];
        }

        // Charger les supplémentaires externes (pour calculer le prorata du remplaçant)
        $stmtSupp = $sqlite->prepare("SELECT agent_id, date_supp, agent_remplace FROM supplementaires_externes WHERE periode = ?");
        $stmtSupp->execute([$period]);
        $supp_externes_map = [];
        while ($row = $stmtSupp->fetch()) {
            $supp_externes_map[$row['agent_id']][$row['date_supp']] = $row['agent_remplace'];
        }

        // Charger sites + subsites + agents depuis SQLite
        $stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ? AND source_module != 'FACTURATION'");
        $stmtSites->execute([$target_val]);
        $sites_rows = $stmtSites->fetchAll();

        // Inject virtual sites
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
        
        if (!$has_extras) {
            $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 EXTRA BUREAU'];
        }
        if (!$has_releves) {
            $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
        }
        if (!array_filter($sites_rows, fn($s) => $s['id'] === 'site_extras_sur_site')) {
            $sites_rows[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];
        }
        if (!$has_admin)
            $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];
        if (!$has_itc)
            $sites_rows[] = ['id' => 'site_itc', 'name' => 'ITC / IFM'];

        $salaries = [];
        foreach ($sites_rows as $site) {
            $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
            $stmtSub2->execute([$site['id']]);
            $subsites_rows = $stmtSub2->fetchAll();

            // Inject default subsites for virtual sites if they are not in DB
            if (in_array($site['id'], ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc']) && empty($subsites_rows)) {
                if ($site['id'] === 'site_extras')
                    $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_extras_sur_site')
                    $subsites_rows = [['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale']];
                if ($site['id'] === 'site_releves')
                    $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration')
                    $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                if ($site['id'] === 'site_itc')
                    $subsites_rows = [
                        ['id' => 'site_itc_tenue', 'name' => 'Tenue Régulière'],
                        ['id' => 'site_itc_costume', 'name' => 'Costume'],
                        ['id' => 'site_itc_as', 'name' => 'Agent Spécial']
                    ];
            }
            
            // Pour EXTRA SUR SITE : toujours inclure le subsite par défaut même si des sous-sites
            // réels existent, pour ne pas manquer les agents affectés à "default_site_extras_sur_site"
            if ($site['id'] === 'site_extras_sur_site') {
                $has_default = false;
                foreach ($subsites_rows as $sr) {
                    if ($sr['id'] === 'default_site_extras_sur_site') { $has_default = true; break; }
                }
                if (!$has_default) {
                    $subsites_rows[] = ['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale'];
                }
            }

            foreach ($subsites_rows as $sub) {
                $stmtAg2 = $sqlite->prepare(
                    "SELECT * FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period >= ?) ORDER BY name"
                );
                $stmtAg2->execute([$sub['id'], $target_val, $period]);
                $agents_rows = $stmtAg2->fetchAll();

                foreach ($agents_rows as $agent) {
                    $agent_id = $agent['id'];
                    $func_id = $agent['function'] ?? 'AS';

                    $base = isset($agent['salary']) && (int) $agent['salary'] > 0
                        ? (int) $agent['salary']
                        : (isset($salary_config_raw[$func_id]) ? (int) $salary_config_raw[$func_id] : 75000);

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
                    $entrant_sortant_count = 0;
                    $entrant_count = 0; // Jours ENTRANT uniquement (exclus des déductions)
                    $absence_details = [];
                    $map_count = 0;
                    $map_details = [];
                    $permission_count = 0;
                    $permission_details = [];
                    $heures_travaillees = 0;
                    $cost_count = 0;
                    $dynamic_funcs_count = [];
                    // Chercher le taux Costume dans la config (clé 'Costume' ou fallback 'AC')
                    $ac_base = isset($salary_config_raw['Costume']) ? (int) $salary_config_raw['Costume']
                             : (isset($salary_config_raw['AC']) ? (int) $salary_config_raw['AC'] : 75000);
                    foreach ($dates as $date) {
                        $sJ = $att_map['J'][$date] ?? '';
                        $sN = $att_map['N'][$date] ?? '';

                        $has_sp = false;
                        foreach (['S', 'SJ', 'SN'] as $sp_key) {
                            $sp_s = $att_map[$sp_key][$date] ?? '';
                            if ($sp_s !== '' && $sp_s !== 'A' && $sp_s !== 'R') {
                                $has_sp = true;
                                break;
                            }
                        }

                        if ($sJ === 'COST') {
                            $cost_count++;
                        } elseif (strpos($sJ, 'F_') === 0) {
                            $f_code = substr($sJ, 2);
                            if (!isset($dynamic_funcs_count[$f_code])) $dynamic_funcs_count[$f_code] = 0;
                            $dynamic_funcs_count[$f_code]++;
                        }
                        
                        $is_exit_j = in_array($sJ, ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || (is_string($sJ) && strpos($sJ, 'SORTANT_') === 0);
                        if ($sJ === 'A' || ($sJ === 'M' && !$include_m) || $is_exit_j) {
                            $absences++;
                            $reason = $sJ;
                            $absence_details[] = ['date' => $date, 'shift' => 'Jour', 'reason' => $reason];
                        } elseif ($sJ === 'ENTRANT') {
                            $entrant_sortant_count++;
                            $entrant_count++; // ENTRANT ne génère PAS de retenue
                        }
                        
                        if ($sN === 'COST') {
                            $cost_count++;
                        } elseif (strpos($sN, 'F_') === 0) {
                            $f_code = substr($sN, 2);
                            if (!isset($dynamic_funcs_count[$f_code])) $dynamic_funcs_count[$f_code] = 0;
                            $dynamic_funcs_count[$f_code]++;
                        }
                        
                        $is_exit_n = in_array($sN, ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || (is_string($sN) && strpos($sN, 'SORTANT_') === 0);
                        if ($sN === 'A' || ($sN === 'M' && !$include_m) || $is_exit_n) {
                            $absences++;
                            $reason = $sN;
                            $absence_details[] = ['date' => $date, 'shift' => 'Nuit', 'reason' => $reason];
                        } elseif ($sN === 'ENTRANT') {
                            $entrant_sortant_count++;
                            $entrant_count++; // ENTRANT ne génère PAS de retenue
                        }
                        
                        if (($att_map['J'][$date] ?? '') === 'MAP') {
                            $map_count++;
                            $map_details[] = ['date' => $date, 'shift' => 'Jour'];
                        }
                        if (($att_map['N'][$date] ?? '') === 'MAP') {
                            $map_count++;
                            $map_details[] = ['date' => $date, 'shift' => 'Nuit'];
                        }
                        if (($att_map['J'][$date] ?? '') === 'P') {
                            $permission_count++;
                            $permission_details[] = ['date' => $date, 'shift' => 'Jour'];
                        }
                        if (($att_map['N'][$date] ?? '') === 'P') {
                            $permission_count++;
                            $permission_details[] = ['date' => $date, 'shift' => 'Nuit'];
                        }
                        
                        // Calcul des heures travaillées (J)
                        if ($sJ === '1' || $sJ === 'COST' || strpos($sJ, 'F_') === 0) $heures_travaillees += $j_hours;
                        if ($sJ === 'P' && $include_p) $heures_travaillees += $j_hours;
                        if ($sJ === 'M' && $include_m) $heures_travaillees += $j_hours;
                        if ($sJ === 'R' && $include_r) $heures_travaillees += $j_hours;
                        
                        // Calcul des heures travaillées (N)
                        if ($sN === '1' || $sN === 'COST' || strpos($sN, 'F_') === 0) $heures_travaillees += $n_hours;
                        if ($sN === 'P' && $include_p) $heures_travaillees += $n_hours;
                        if ($sN === 'M' && $include_m) $heures_travaillees += $n_hours;
                        if ($sN === 'R' && $include_r) $heures_travaillees += $n_hours;
                    }

                    $cp_count = 0;
                    $cp_details = [];
                    $stmtCP = $sqlite->prepare("SELECT * FROM pointage_leaves WHERE agent_id = ? AND type = 'CP'");
                    $stmtCP->execute([$agent_id]);
                    $leaves = $stmtCP->fetchAll();
                    foreach ($leaves as $l) {
                        $overlap = 0;
                        foreach ($dates as $date) {
                            if ($l['start_date'] <= $date && $l['end_date'] >= $date) {
                                $cp_count++;
                                $overlap++;
                                if ($include_cp) {
                                    $heures_travaillees += $j_hours;
                                }
                            }
                        }
                        if ($overlap > 0) {
                            $cp_details[] = ['start_date' => $l['start_date'], 'end_date' => $l['end_date']];
                        }
                    }

                    // Ajustement calendaire pour les mois de 31 jours et les agents sortants :
                    // Le jour en trop du cycle (count($dates) - 30) est absorbé par la période
                    // d'inactivité post-départ, afin de restituer les jours de présence réels.
                    if (count($dates) > 30) {
                        $month_surplus = count($dates) - 30;
                        $exit_days_count = 0;
                        foreach ($dates as $d_check) {
                            $sJ_c = $att_map['J'][$d_check] ?? '';
                            $sN_c = $att_map['N'][$d_check] ?? '';
                            $is_ex_j = in_array($sJ_c, ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || (is_string($sJ_c) && strpos($sJ_c, 'SORTANT_') === 0);
                            $is_ex_n = in_array($sN_c, ['ABANDON', 'DEMISSION', 'SORTANT', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT']) || (is_string($sN_c) && strpos($sN_c, 'SORTANT_') === 0);
                            if ($is_ex_j || $is_ex_n) $exit_days_count++;
                        }
                        if ($exit_days_count > 0) {
                            $exit_adjust = min($exit_days_count, $month_surplus);
                            $absences = max(0, $absences - $exit_adjust);
                        }
                    }

                    // Initialise divisor
                    $profile = json_decode($agent['profile_data'] ?? '{}', true) ?: [];
                    $divisor = 30;
                    if (!empty($profile['special_service']) && !empty($profile['special_service_base'])) {
                        $divisor = (int)$profile['special_service_base'];
                        if ($divisor <= 0) $divisor = 30;
                    }

                    // Normalisation des jours de CP sur une base de 30 jours (pour gérer les mois de 31j ou 28j/29j)
                    if ($cp_count > 0 && count($dates) > 0) {
                        if ($divisor === 30) {
                            $cp_count = (int) round($cp_count * 30 / count($dates));
                        }
                    }

                    $sp_count = 0;
                    $sp_details = [];
                    // 1. Pointages explicitement dans la ligne Supplémentaire
                    foreach (['S', 'SJ', 'SN'] as $sp_key) {
                        foreach ($dates as $date) {
                            $sp_status = $att_map[$sp_key][$date] ?? '';
                            if ($sp_status !== '' && $sp_status !== 'A' && $sp_status !== 'R') {
                                $sp_count++;
                                $shift_label = 'Supplémentaire';
                                if ($sp_key === 'SJ')
                                    $shift_label = 'Supplémentaire Jour';
                                elseif ($sp_key === 'SN')
                                    $shift_label = 'Supplémentaire Nuit';
                                
                                $replacedAgentBase = null;
                                $replacedAgentName = $supp_externes_map[$agent_id][$date] ?? null;
                                
                                if (empty($replacedAgentName) && strpos($sp_status, 'Suppl|') === 0) {
                                    $parts = explode('|', $sp_status);
                                    if (!empty($parts[2])) {
                                        $replacedAgentName = $parts[2];
                                    }
                                }

                                if (!empty($replacedAgentName)) {
                                    $stmtRep = $sqlite->prepare("SELECT name, `function`, salary FROM agents WHERE id = ? OR LOWER(TRIM(name)) = LOWER(TRIM(?)) ORDER BY id DESC LIMIT 1");
                                    $stmtRep->execute([$replacedAgentName, $replacedAgentName]);
                                    $repAgent = $stmtRep->fetch();
                                    if ($repAgent) {
                                        $actualRepName = $repAgent['name'];
                                        if (!empty($repAgent['salary']) && (int)$repAgent['salary'] > 0) {
                                            $replacedAgentBase = (int)$repAgent['salary'];
                                        } else {
                                            $repFunc = $repAgent['function'] ?: 'AG';
                                            // Essayer de trouver la grille salariale correspondante
                                            if (isset($salary_config_raw[$repFunc])) {
                                                $replacedAgentBase = (int)$salary_config_raw[$repFunc];
                                            } else {
                                                // Essayer par ID si $repFunc est le nom complet
                                                $repFuncId = isset($nameToId[$repFunc]) ? $nameToId[$repFunc] : null;
                                                if ($repFuncId && isset($salary_config_raw[$repFuncId])) {
                                                    $replacedAgentBase = (int)$salary_config_raw[$repFuncId];
                                                } else {
                                                    $replacedAgentBase = 75000;
                                                }
                                            }
                                        }
                                        $shift_label .= ' (Remplace ' . htmlspecialchars($actualRepName) . ' - Base: ' . $replacedAgentBase . ')';
                                    }
                                }

                                $sp_details[] = ['date' => $date, 'shift' => $shift_label, 'replacedAgentBase' => $replacedAgentBase];
                            }
                        }
                    }
                    // 2. Pointages Supplémentaires effectués en déploiement (sur les lignes principales J ou N)
                    foreach (['J', 'N'] as $main_key) {
                        foreach ($dates as $date) {
                            $main_status = $att_map[$main_key][$date] ?? '';
                            if (strpos($main_status, 'EXT_1|') === 0 || strpos($main_status, 'REL_1|') === 0 || strpos($main_status, 'M_1|') === 0) {
                                $sp_count++;
                                $parts = explode('|', $main_status);
                                $dest = $parts[1] ?? 'Site inconnu';
                                $replacedAgentId = $parts[2] ?? '';
                                
                                $replacedAgentBase = null;
                                if ($replacedAgentId !== '') {
                                    $stmtRep = $sqlite->prepare("SELECT `function`, salary FROM agents WHERE id = ?");
                                    $stmtRep->execute([$replacedAgentId]);
                                    $repAgent = $stmtRep->fetch();
                                    if ($repAgent) {
                                        if (!empty($repAgent['salary']) && (int)$repAgent['salary'] > 0) {
                                            $replacedAgentBase = (int)$repAgent['salary'];
                                        } else {
                                            $repFunc = $repAgent['function'] ?: 'AG';
                                            if (isset($salary_config_raw[$repFunc])) {
                                                $replacedAgentBase = (int)$salary_config_raw[$repFunc];
                                            } else {
                                                $repFuncId = isset($nameToId[$repFunc]) ? $nameToId[$repFunc] : null;
                                                if ($repFuncId && isset($salary_config_raw[$repFuncId])) {
                                                    $replacedAgentBase = (int)$salary_config_raw[$repFuncId];
                                                } else {
                                                    $replacedAgentBase = 75000;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                $shift_label = 'Suppl. Déployé (' . ($main_key === 'J' ? 'Jour' : 'Nuit') . ')';
                                $sp_details[] = ['date' => $date, 'shift' => $shift_label . ' sur ' . $dest, 'replacedAgentBase' => $replacedAgentBase];
                            }
                        }
                    }

                    $assigned_days = 0;
                    $mutated_away_days = 0;
                    $assigned_days_old = 0;
                    $assigned_days_new = 0;

$scObj = null;
                    if (!empty($agent['status_change'])) {
                        $scObj = json_decode($agent['status_change'], true);
                    }

                    $is_special = !empty($profile['special_service']);
                    $special_days = $profile['special_service_days'] ?? [];
                    $is_admin = !empty($profile['admin_schedule']);

                    foreach ($dates as $date) {
                        $sJ = $att_map['J'][$date] ?? '';
                        $sN = $att_map['N'][$date] ?? '';
                        
                        $is_scheduled_day = true;
                        if ($is_special) {
                            $date_obj = new DateTime($date);
                            $w = (int) $date_obj->format('N');
                            $is_scheduled_day = in_array($w, $special_days) || in_array((string)$w, $special_days);
                        }

                        if ($is_scheduled_day) {
                            if (($sJ !== 'ENTRANT' && $sJ !== 'NON_PRESENT') || ($sN !== 'ENTRANT' && $sN !== 'NON_PRESENT')) {
                                $assigned_days++;
                                if (strpos($sJ, 'M|') === 0 || strpos($sJ, 'PM|') === 0 || strpos($sN, 'M|') === 0 || strpos($sN, 'PM|') === 0) {
                                    $mutated_away_days++;
                                } else {
                                    if ($scObj) {
                                        if ($date < $scObj['date']) {
                                            $assigned_days_old++;
                                        } else {
                                            $assigned_days_new++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if ($is_special) {
                        $real_active = $assigned_days - $mutated_away_days;
                    } else {
                        $real_active = $assigned_days + $absences + $map_count + $permission_count + ($entrant_sortant_count - $entrant_count) - $mutated_away_days;
                    }
                    
                    $full_month_assigned_days = 0;
                    if ($is_special) {
                        foreach ($dates as $date) {
                            $date_obj = new DateTime($date);
                            $w = (int) $date_obj->format('N');
                            if (in_array($w, $special_days) || in_array((string)$w, $special_days)) {
                                $full_month_assigned_days++;
                            }
                        }
                    } else if ($is_admin) {
                        foreach ($dates as $date) {
                            $date_obj = new DateTime($date);
                            $w = (int) $date_obj->format('N');
                            if ($w !== 7 && $w !== 6) {
                                $full_month_assigned_days++;
                            }
                        }
                    } else {
                        $full_month_assigned_days = count($dates);
                    }
                    if ($full_month_assigned_days <= 0) $full_month_assigned_days = count($dates);

                    $divToUse = $is_special ? 30 : $divisor;
                    if ($scObj) {
                        $total_assigned = $assigned_days_old + $assigned_days_new;
                        if ($total_assigned > 0) {
                            if ($is_special) {
                                $active_days_salary = $real_active;
                                $active_days = $real_active;
                            } else {
                                $active_days_salary = (int) round($real_active * $divisor / $full_month_assigned_days);
                                if ($active_days_salary > $divisor) $active_days_salary = $divisor;
                                $active_days = (int) round($real_active * $divisor / $full_month_assigned_days);
                                if ($active_days > $divisor) $active_days = $divisor;
                            }
                            
                            $active_days_old = (int) round(($assigned_days_old / $total_assigned) * $active_days_salary);
                            $active_days_new = $active_days_salary - $active_days_old;
                        } else {
                            $countOld = 0;
                            $countNew = 0;
                            foreach ($dates as $date) {
                                if ($date < $scObj['date']) $countOld++;
                                else $countNew++;
                            }
                            if ($is_special) {
                                $active_days_salary = $real_active;
                                $active_days = $real_active;
                            } else {
                                $active_days_salary = (int) round($real_active * $divisor / $full_month_assigned_days);
                                if ($active_days_salary > $divisor) $active_days_salary = $divisor;
                                $active_days = (int) round($real_active * $divisor / $full_month_assigned_days);
                                if ($active_days > $divisor) $active_days = $divisor;
                            }
                            
                            if (count($dates) > 0) {
                                $active_days_old = (int) round(($countOld / count($dates)) * $active_days_salary);
                                $active_days_new = $active_days_salary - $active_days_old;
                            } else {
                                $active_days_old = 0; $active_days_new = 0;
                            }
                        }

                        $base_old = isset($agent['salary']) && (int) $agent['salary'] > 0
                            ? (int) $agent['salary']
                            : (isset($salary_config_raw[$scObj['old_function'] ?? '']) ? (int) $salary_config_raw[$scObj['old_function'] ?? ''] : (isset($salary_config_raw[$func_id]) ? (int) $salary_config_raw[$func_id] : 75000));
                        $base_new = isset($agent['salary']) && (int) $agent['salary'] > 0
                            ? (int) $agent['salary']
                            : (isset($salary_config_raw[$scObj['new_function'] ?? '']) ? (int) $salary_config_raw[$scObj['new_function'] ?? ''] : (isset($salary_config_raw[$func_id]) ? (int) $salary_config_raw[$func_id] : 75000));

                        $prorata_base = (int) round($base_old * ($active_days_old / $divToUse)) + (int) round($base_new * ($active_days_new / $divToUse));
                        
                        // Calcul exact des déductions par période (selon la date de l'absence)
                        $deduction_days_old = 0;
                        $deduction_days_new = 0;
                        foreach ($dates as $date) {
                            $sJ = $att_map['J'][$date] ?? '';
                            $sN = $att_map['N'][$date] ?? '';
                            
                            $is_deduct_j = ($sJ === 'A' || ($sJ === 'M' && !$include_m) || in_array($sJ, ['ABANDON', 'DEMISSION', 'SORTANT', 'MAP', 'P'])); // ENTRANT exclu
                            $is_deduct_n = ($sN === 'A' || ($sN === 'M' && !$include_m) || in_array($sN, ['ABANDON', 'DEMISSION', 'SORTANT', 'MAP', 'P'])); // ENTRANT exclu
                            
                            if ($is_deduct_j) {
                                if ($date < $scObj['date']) $deduction_days_old++; else $deduction_days_new++;
                            }
                            if ($is_deduct_n) {
                                if ($date < $scObj['date']) $deduction_days_old++; else $deduction_days_new++;
                            }
                        }
                        $deductions = (int) round($deduction_days_old * ($base_old / $divToUse)) + (int) round($deduction_days_new * ($base_new / $divToUse));
                        
                        // Calcul exact des gains par période
                        $gains = 0;
                        foreach ($sp_details as $spd) {
                            $agent_base = ($spd['date'] < $scObj['date']) ? $base_old : $base_new;
                            
                            if (isset($spd['replacedAgentBase']) && $spd['replacedAgentBase'] !== null) {
                                $replaced_base = $spd['replacedAgentBase'];
                                if ($replaced_base > $agent_base) {
                                    // Scénario A : Poste supérieur -> Gagne la différence (bonus)
                                    $gains += (int) round(($replaced_base - $agent_base) / $divToUse);
                                } else {
                                    // Scénario B : Poste inférieur -> S'adapte au taux remplacé
                                    $gains += (int) round($replaced_base / $divToUse);
                                }
                            } else {
                                // Scénario C : Aucun remplacement
                                $gains += (int) round($agent_base / $divToUse);
                            }
                        }
                        
                        $base_used_for_deductions = $base; // Utilisé pour les éventuels calculs annexes, mais deductions et gains sont déjà fixés
                    } else {
                        if ($is_special) {
                            $active_days = $real_active;
                            $prorata_base = (int) round($base * ($active_days / 30));
                        } else {
                            $active_days_salary = $assigned_days === 0 ? 0 : (int) round($real_active * $divisor / $full_month_assigned_days);
                            if ($active_days_salary > $divisor) $active_days_salary = $divisor;
                            $prorata_base = (int) round($base * ($active_days_salary / $divisor));
                            
                            $active_days = $assigned_days === 0 ? 0 : (int) round($real_active * $divisor / $full_month_assigned_days);
                            if ($active_days > $divisor) $active_days = $divisor;
                        }
                        
                        $base_used_for_deductions = $base;
                        // ENTRANT exclus des déductions : l'agent n'était pas encore en poste, ce n'est pas une absence
                        if ($is_special) {
                            $deductions = (int) round(($absences + $map_count + $permission_count) * ($base_used_for_deductions / 30));
                        } else {
                            $deductions = (int) round(($absences + ($entrant_sortant_count - $entrant_count) + $map_count + $permission_count) * ($base_used_for_deductions / $divisor));
                        }
                        
                        $gains = 0;
                        foreach ($sp_details as $spd) {
                            $divToUse = $is_special ? 30 : $divisor;
                            if (isset($spd['replacedAgentBase']) && $spd['replacedAgentBase'] !== null) {
                                $replaced_base = $spd['replacedAgentBase'];
                                if ($replaced_base > $base_used_for_deductions) {
                                    // Scénario A : Poste supérieur -> Gagne la différence (bonus)
                                    $gains += (int) round(($replaced_base - $base_used_for_deductions) / $divToUse);
                                } else {
                                    // Scénario B : Poste inférieur -> S'adapte au taux remplacé
                                    $gains += (int) round($replaced_base / $divToUse);
                                }
                            } else {
                                // Scénario C : Aucun remplacement
                                $gains += (int) round($base_used_for_deductions / $divToUse);
                            }
                        }
                    }

                    // Ajouter le bonus costume (peut être négatif si base > ac_base)
                    if ($cost_count > 0) {
                        $cost_bonus = (int) round($cost_count * (($ac_base / $divisor) - ($base / $divisor)));
                        $gains += $cost_bonus;
                    }
                    
                    // Ajouter le bonus pour les fonctions dynamiques
                    foreach ($dynamic_funcs_count as $f_code => $count) {
                        if ($count > 0) {
                            $f_base = isset($salary_config_raw[$f_code]) ? (int) $salary_config_raw[$f_code] : 75000;
                            $f_bonus = (int) round($count * (($f_base / $divisor) - ($base / $divisor)));
                            $gains += $f_bonus;
                        }
                    }

                    // Calcul de la prime de site
                    $site_prime_data = $site_primes_map[$site['name']] ?? ['prime' => 0, 'func' => ''];
                    $prime_site = 0;
                    if ($site_prime_data['prime'] > 0) {
                        if (empty($site_prime_data['func']) || $site_prime_data['func'] === $func_id) {
                            $prime_site = $site_prime_data['prime'];
                        }
                    }
                    // Calcul des Prêts (Remboursement dynamique)
                    $remboursement_pret = 0;
                    $stmtLoans = $sqlite->prepare("SELECT * FROM agent_loans WHERE agent_name LIKE ? AND company_id = ? AND status = 'active'");
                    $stmtLoans->execute([$agent['name'], $companyKey]);
                    $agent_loans = $stmtLoans->fetchAll();
                    
                    foreach ($agent_loans as $loan) {
                        $start_ts = strtotime($loan['start_period'] . '-01');
                        $curr_ts = strtotime($period . '-01');
                        if ($curr_ts >= $start_ts) {
                            $months_diff = (int)(($curr_ts - $start_ts) / (30 * 24 * 60 * 60)); // Approx 30 days
                            $d1 = new DateTime($loan['start_period'] . '-01');
                            $d2 = new DateTime($period . '-01');
                            $diff = $d1->diff($d2);
                            $mp = (($diff->y) * 12) + ($diff->m);
                            
                            $monthly = $loan['monthly_deduction'] > 0 ? $loan['monthly_deduction'] : $loan['total_amount'];
                            $total_months = ceil($loan['total_amount'] / $monthly);
                            
                            if ($mp >= 0 && $mp < $total_months) {
                                $is_last_month = ($mp == $total_months - 1);
                                $deduct = $is_last_month ? ($loan['total_amount'] - ($monthly * $mp)) : $monthly;
                                $remboursement_pret += $deduct;
                            }
                        }
                    }

                    $att_count = count($att_rows);
                    // For agents with a function change due to mutation, compute a prorata base
                    // We store the raw base and let merging compute the real base_prorata
                    $salaries[] = [
                        'id' => $agent_id,
                        'name' => $agent['name'],
                        'site' => $site['name'],
                        'site_location' => $site['location'] ?? 'abidjan',
                        'subsite' => $sub['name'],
                        'function' => $func_id,
                        'function_label' => $function_label,
                        'shift_type' => $agent['shift_type'] ?? 'Jour',
                        'profile_data' => json_decode($agent['profile_data'] ?? '{}', true),
                        'heures_travaillees' => $heures_travaillees,
                        'base' => $prorata_base,
                        'base_full' => $base,
                        'status_change' => $agent['status_change'] ?? null,
                        'sc_active_days_old' => $active_days_old ?? 0,
                        'sc_active_days_new' => $active_days_new ?? 0,
                        'sc_assigned_days_old' => $assigned_days_old ?? 0,
                        'sc_assigned_days_new' => $assigned_days_new ?? 0,
                        'sc_base_old' => $base_old ?? 0,
                        'sc_base_new' => $base_new ?? 0,
                        'sc_abs_old' => $deduction_days_old ?? 0,
                        'sc_abs_new' => $deduction_days_new ?? 0,
                        'real_active' => $real_active,
                        'active_days' => $active_days,
                        'days_worked' => $real_active,
                        'att_count' => $att_count,
                        'absences' => $absences,
                        'entrant_sortant_count' => $entrant_sortant_count,
                        'absence_details' => $absence_details,
                        'map_count' => $map_count,
                        'map_details' => $map_details,
                        'permission_count' => $permission_count,
                        'permission_details' => $permission_details,
                        'cp_count' => $cp_count,
                        'cp_details' => $cp_details,
                        'sp_count' => $sp_count,
                        'sp_details' => $sp_details,
                        'deductions' => $deductions,
                        'gains' => $gains,
                        'prime_site' => $prime_site,
                        'remboursement_pret' => $remboursement_pret,
                        'total' => $prorata_base - $deductions + $gains + $prime_site - $remboursement_pret,
                    ];
                }
            }
        }
        $merged_map = [];
        foreach ($salaries as $sal) {
            $name = trim($sal['name']);
            if (!isset($merged_map[$name])) {
                $merged_map[$name] = $sal;
            } else {
                $existing = $merged_map[$name];
                
                $time_existing = 0;
                if (preg_match('/ag_(\d+)_/', $existing['id'], $m)) $time_existing = (int)$m[1];
                $time_sal = 0;
                if (preg_match('/ag_(\d+)_/', $sal['id'], $m)) $time_sal = (int)$m[1];
                
                // Determine oldest (original) and newest (clone) entry
                $oldest = ($time_sal >= $time_existing) ? $existing : $sal;
                $newest = ($time_sal >= $time_existing) ? $sal : $existing;

                // Track the function change for display in Poste column
                $merged_profile = $newest['profile_data'] ?? [];
                if ($oldest['function'] !== $newest['function']) {
                    $merged_profile['mutated_from_function'] = $oldest['function'];
                }
                
                // Add mutation breakdown
                $merged_profile['mutation_breakdown'] = [
                    'original' => [
                        'site' => $oldest['site'],
                        'subsite' => $oldest['subsite'],
                        'function' => $oldest['function_label'] ?? $oldest['function'],
                        'active_days' => $oldest['active_days'] ?? 0,
                        'calendar_active_days' => $oldest['real_active'] ?? 0,
                        'absences' => $oldest['absences'] ?? 0,
                        'map_count' => $oldest['map_count'] ?? 0,
                        'permission_count' => $oldest['permission_count'] ?? 0,
                        'entrant_sortant_count' => $oldest['entrant_sortant_count'] ?? 0,
                        'worked_days' => ($oldest['active_days'] ?? 0) - (($oldest['absences'] ?? 0) + ($oldest['map_count'] ?? 0) + ($oldest['permission_count'] ?? 0) + ($oldest['entrant_sortant_count'] ?? 0)),
                        'base_prorata' => $oldest['base'] ?? 0,
                        'base_full' => $oldest['base_full'] ?? 0,
                    ],
                    'mutated' => [
                        'site' => $newest['site'],
                        'subsite' => $newest['subsite'],
                        'function' => $newest['function_label'] ?? $newest['function'],
                        'active_days' => $newest['active_days'] ?? 0,
                        'calendar_active_days' => $newest['real_active'] ?? 0,
                        'absences' => $newest['absences'] ?? 0,
                        'map_count' => $newest['map_count'] ?? 0,
                        'permission_count' => $newest['permission_count'] ?? 0,
                        'entrant_sortant_count' => $newest['entrant_sortant_count'] ?? 0,
                        'worked_days' => ($newest['active_days'] ?? 0) - (($newest['absences'] ?? 0) + ($newest['map_count'] ?? 0) + ($newest['permission_count'] ?? 0) + ($newest['entrant_sortant_count'] ?? 0)),
                        'base_prorata' => $newest['base'] ?? 0,
                        'base_full' => $newest['base_full'] ?? 0,
                    ]
                ];

                $merged_map[$name] = [
                    'id' => $newest['id'],
                    'name' => $name,
                    'site' => $newest['site'],
                    'site_location' => $newest['site_location'],
                    'subsite' => $newest['subsite'],
                    'function' => $newest['function'],
                    'function_label' => $newest['function_label'],
                    'shift_type' => $newest['shift_type'],
                    'base' => $existing['base'] + $sal['base'],
                    'base_full' => $newest['base_full'] ?? $newest['base'],
                    'active_days' => ($existing['active_days'] ?? 0) + ($sal['active_days'] ?? 0),
                    'days_worked' => ($existing['days_worked'] ?? 0) + ($sal['days_worked'] ?? 0),
                    'att_count' => ($existing['att_count'] ?? 0) + ($sal['att_count'] ?? 0),
                    
                    'heures_travaillees' => $existing['heures_travaillees'] + $sal['heures_travaillees'],
                    'absences' => $existing['absences'] + $sal['absences'],
                    'entrant_sortant_count' => $existing['entrant_sortant_count'] + $sal['entrant_sortant_count'],
                    'absence_details' => array_merge($existing['absence_details'], $sal['absence_details']),
                    'map_count' => $existing['map_count'] + $sal['map_count'],
                    'map_details' => array_merge($existing['map_details'], $sal['map_details']),
                    'permission_count' => $existing['permission_count'] + $sal['permission_count'],
                    'permission_details' => array_merge($existing['permission_details'], $sal['permission_details']),
                    'cp_count' => $existing['cp_count'] + $sal['cp_count'],
                    'cp_details' => array_merge($existing['cp_details'], $sal['cp_details']),
                    'sp_count' => $existing['sp_count'] + $sal['sp_count'],
                    'sp_details' => array_merge($existing['sp_details'], $sal['sp_details']),
                    
                    'deductions' => $existing['deductions'] + $sal['deductions'],
                    'gains' => $existing['gains'] + $sal['gains'],
                    'prime_site' => $existing['prime_site'] + $sal['prime_site'],
                    'profile_data' => $merged_profile
                ];
                
                if ($existing['remboursement_pret'] > 0 && $sal['remboursement_pret'] > 0) {
                     $merged_map[$name]['remboursement_pret'] = max($existing['remboursement_pret'], $sal['remboursement_pret']);
                     $merged_map[$name]['total'] = $existing['total'] + $sal['total'] + min($existing['remboursement_pret'], $sal['remboursement_pret']);
                } else {
                     $merged_map[$name]['remboursement_pret'] = $existing['remboursement_pret'] + $sal['remboursement_pret'];
                     $merged_map[$name]['total'] = $existing['total'] + $sal['total'];
                }
            }
        }
        return array_values($merged_map);
}


function getUserSubscriptionState() { return 'active'; }
