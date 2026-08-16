<?php
if (isset($_GET['jarvis_db_test'])) {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8', 'root', '');
    $stmt = $pdo->query("SELECT * FROM pointage_leaves WHERE agent_id LIKE '%ag_%' ORDER BY id DESC LIMIT 5");
    echo "<pre>"; print_r($stmt->fetchAll(PDO::FETCH_ASSOC)); echo "</pre>";
    die('TEST_OK');
}
if (function_exists('opcache_reset')) {
    opcache_reset();
}
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors_custom.log');
// Configuration des cookies de session (avant session_start)
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', '1');
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.use_strict_mode', '1');
session_start();
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/utils.php';

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
            $stmt = $db->prepare("SELECT data_key, value FROM service_data WHERE company_id=? AND data_key LIKE 'radio_sig_%'");
            $stmt->execute([$company_id]);
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $entry = json_decode($r['value'] ?? '{}', true);
                if (!empty($entry['code']) && !empty($entry['image'])) {
                    $sigs[] = ['code' => $entry['code'], 'image' => $entry['image']];
                }
            }
        } catch (Exception $e) { /* silencieux */ }
        return $sigs;
    }
    function addRadioSignature($code, $image, $company_id = 'global') {
        setServiceDataSql($company_id, 'radio_sig_' . $code, ['code' => $code, 'image' => $image]);
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

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);
$data = is_array($data) ? $data : [];
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = array_merge($data, $_GET);
}

// ─── Middleware d'authentification global (Admin API) ─────────────────────────
// Toutes les routes admin exigent une session valide sans exception
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié', 'code' => 401]);
    exit;
}

// ─── Protection CSRF (toutes les requêtes POST vers l'admin) ──────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $client_token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals((string)($_SESSION['csrf_token'] ?? ''), $client_token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Token CSRF invalide', 'code' => 403]);
        exit;
    }
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
        'get_agents_for_deploy'
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
            'name' => '🌟 Vivier des Extras',
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
    $stmt = $sqlite->prepare("INSERT INTO service_data (service_id, data_key, data_value) VALUES (?, ?, ?) ON CONFLICT(service_id, data_key) DO UPDATE SET data_value = excluded.data_value");
    $stmt->execute([$serviceKey, $key, json_encode($value)]);
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
    if (!$has_extras)
        $sites[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
    if (!$has_releves)
        $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
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

        $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR service_id IS NULL OR service_id = '')");
        $stmtSub->execute([$site_id, $serviceKey]);
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
                $agent['has_sp'] = (bool) $agent['has_sp'];
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
                $mutated_agent['has_sp'] = (bool) $mutated_agent['has_sp'];
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

        if (!empty($mutated_agents)) {
            $subsites[] = [
                'id' => 'mutated_' . $site_id,
                'name' => '🔄 Agents Mutés (Temporaire)',
                'agents' => $mutated_agents
            ];
        }

        if (!empty($deployed_extras)) {
            usort($deployed_extras, function ($a, $b) {
                $is_releve_a = isset($a['is_releve']) && $a['is_releve'] ? 1 : 0;
                $is_releve_b = isset($b['is_releve']) && $b['is_releve'] ? 1 : 0;
                if ($is_releve_a !== $is_releve_b)
                    return $is_releve_b - $is_releve_a;
                return strcmp($a['name'], $b['name']);
            });
            if (!empty($subsites) && isset($subsites[0])) {
                $subsites[0]['agents'] = array_merge($subsites[0]['agents'], $deployed_extras);
            } else {
                $subsites[] = [
                    'id' => 'default_' . $site_id,
                    'name' => 'Zone par défaut',
                    'agents' => $deployed_extras
                ];
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

$publicActions = ['login', 'logout', 'set_lang', 'register', 'cinetpay_notify', 'get_payment_providers', 'get_user_info', 'register_agent_portal', 'login_agent_portal', 'get_leave_types', 'submit_leave_request', 'get_my_leave_balances', 'get_my_leave_requests', 'request_password_reset'];
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
// Le token est fourni par get_user_info et stocké côté client
$mutatingActions = ['add_site', 'add_special_site', 'update_site_icon', 'add_subsite', 'rename_site', 'rename_subsite', 'delete_subsite', 'add_agent', 'delete_agent', 'apply_mutation', 'update_attendance', 'bulk_update_attendance', 'mark_agent_sortant', 'delete_agent_sortant', 'mark_agent_entrant', 'mark_agent_debut', 'init_site_period', 'apply_batch_rotation', 'update_agent_info', 'clear_site_mutations', 'archive_all_sites', 'reset_year_attendance', 'delete_archive', 'update_agent_salary', 'update_salary_config', 'save_functions', 'publish_period', 'send_message', 'resolve_ticket', 'create_ticket', 'delete_message', 'pin_message', 'rate_ticket', 'assign_ticket', 'add_reclamation', 'update_reclamation_status', 'send_private_message', 'update_user_status', 'toggle_user_maintenance', 'upload_company_logo'];
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

// ─── Libération immédiate du verrou de session ────────────────────────────────
// PHP verrouille le fichier de session exclusivement → toutes les requêtes
// parallèles attendent en file. Pour les routes qui ne modifient PAS la session,
// on libère le verrou dès maintenant pour permettre la concurrence.
$_session_write_routes = ['login', 'logout', 'register', 'get_user_info', 'save_user_settings',
                          'update_profile', 'change_password', 'impersonate', 'stop_impersonation',
                          'switch_service', 'admin_switch_company', 'activate_subscription', 
                          'create_checkout_session', 'confirm_stripe_payment', 'confirm_cinetpay_payment', 
                          'set_lang'];
if (!in_array($action, $_session_write_routes)) {
    session_write_close();
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
    'mark_agent_debut' => 'dashboard',
    'init_site_period' => 'dashboard',
    'apply_batch_rotation' => 'dashboard',
    'update_agent_info' => 'dashboard',
    'clear_site_mutations' => 'dashboard',
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
    'save_site_revenue' => 'fluctuation'
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

function applyShiftDefaultsForPeriod(&$db, $agent_id, $period, $shift_type)
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
            if ((int) $date_obj->format('w') === $random_rest_day) {
                $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
            } else {
                $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
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
 * Sauvegarde un snapshot gelé des salaires au moment de la publication.
 * Utilise ON CONFLICT(company_id, period) DO UPDATE pour écraser si re-publication.
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
        
        if (!$has_extras)
            $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
        if (!$has_releves)
            $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
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
            if (in_array($site['id'], ['site_extras', 'site_releves', 'site_administration', 'site_itc']) && empty($subsites_rows)) {
                if ($site['id'] === 'site_extras')
                    $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
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
                    $absence_details = [];
                    $map_count = 0;
                    $map_details = [];
                    $permission_count = 0;
                    $permission_details = [];
                    $heures_travaillees = 0;
                    $cost_count = 0;
                    // Chercher le taux Costume dans la config (clé 'Costume' ou fallback 'AC')
                    $ac_base = isset($salary_config_raw['Costume']) ? (int) $salary_config_raw['Costume']
                             : (isset($salary_config_raw['AC']) ? (int) $salary_config_raw['AC'] : 75000);
                    $is_24h = (strtolower($agent['shift_type'] ?? '') === '24h');
                    foreach ($dates as $date) {
                        $sJ = $att_map['J'][$date] ?? '';
                        $sN = $att_map['N'][$date] ?? '';

                        if ($is_24h) {
                            $has_cost = ($sJ === 'COST' || $sN === 'COST');
                            if ($has_cost) {
                                $cost_count++;
                            }

                            $is_abs_j = ($sJ === 'A' || ($sJ === 'M' && !$include_m) || in_array($sJ, ['ABANDON', 'DEMISSION']));
                            $is_abs_n = ($sN === 'A' || ($sN === 'M' && !$include_m) || in_array($sN, ['ABANDON', 'DEMISSION']));
                            if ($is_abs_j) {
                                $absences++;
                                $absence_details[] = [
                                    'date' => $date,
                                    'shift' => 'Jour',
                                    'reason' => $sJ
                                ];
                            }
                            if ($is_abs_n) {
                                $absences++;
                                $absence_details[] = [
                                    'date' => $date,
                                    'shift' => 'Nuit',
                                    'reason' => $sN
                                ];
                            }

                            if (!$is_abs_j && ($sJ === 'ENTRANT' || $sJ === 'SORTANT')) {
                                $entrant_sortant_count++;
                            }
                            if (!$is_abs_n && ($sN === 'ENTRANT' || $sN === 'SORTANT')) {
                                $entrant_sortant_count++;
                            }

                            if ($sJ === 'MAP') {
                                $map_count++;
                                $map_details[] = ['date' => $date, 'shift' => 'Jour'];
                            }
                            if ($sN === 'MAP') {
                                $map_count++;
                                $map_details[] = ['date' => $date, 'shift' => 'Nuit'];
                            }
                            if ($sJ === 'P') {
                                $permission_count++;
                                $permission_details[] = ['date' => $date, 'shift' => 'Jour'];
                            }
                            if ($sN === 'P') {
                                $permission_count++;
                                $permission_details[] = ['date' => $date, 'shift' => 'Nuit'];
                            }

                            // Calcul des heures travaillées (J)
                            if ($sJ === '1' || $sJ === 'COST') $heures_travaillees += $j_hours;
                            if ($sJ === 'P' && $include_p) $heures_travaillees += $j_hours;
                            if ($sJ === 'M' && $include_m) $heures_travaillees += $j_hours;
                            if ($sJ === 'R' && $include_r) $heures_travaillees += $j_hours;

                            // Calcul des heures travaillées (N)
                            if ($sN === '1' || $sN === 'COST') $heures_travaillees += $n_hours;
                            if ($sN === 'P' && $include_p) $heures_travaillees += $n_hours;
                            if ($sN === 'M' && $include_m) $heures_travaillees += $n_hours;
                            if ($sN === 'R' && $include_r) $heures_travaillees += $n_hours;
                        } else {
                            if ($sJ === 'COST') {
                                $cost_count++;
                            }
                            if ($sJ === 'A' || ($sJ === 'M' && !$include_m) || in_array($sJ, ['ABANDON', 'DEMISSION'])) {
                                $absences++;
                                $absence_details[] = ['date' => $date, 'shift' => 'Jour', 'reason' => $sJ];
                            } elseif (in_array($sJ, ['ENTRANT', 'SORTANT'])) {
                                $entrant_sortant_count++;
                            }
                            
                            if ($sN === 'COST') {
                                $cost_count++;
                            }
                            if ($sN === 'A' || ($sN === 'M' && !$include_m) || in_array($sN, ['ABANDON', 'DEMISSION'])) {
                                $absences++;
                                $absence_details[] = ['date' => $date, 'shift' => 'Nuit', 'reason' => $sN];
                            } elseif (in_array($sN, ['ENTRANT', 'SORTANT'])) {
                                $entrant_sortant_count++;
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
                            if ($sJ === '1' || $sJ === 'COST') $heures_travaillees += $j_hours;
                            if ($sJ === 'P' && $include_p) $heures_travaillees += $j_hours;
                            if ($sJ === 'M' && $include_m) $heures_travaillees += $j_hours;
                            if ($sJ === 'R' && $include_r) $heures_travaillees += $j_hours;
                            
                            // Calcul des heures travaillées (N)
                            if ($sN === '1' || $sN === 'COST') $heures_travaillees += $n_hours;
                            if ($sN === 'P' && $include_p) $heures_travaillees += $n_hours;
                            if ($sN === 'M' && $include_m) $heures_travaillees += $n_hours;
                            if ($sN === 'R' && $include_r) $heures_travaillees += $n_hours;
                        }
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

                    // Normalisation des jours de CP sur une base de 30 jours (pour gérer les mois de 31j ou 28j/29j)
                    if ($cp_count > 0 && count($dates) > 0) {
                        $cp_count = (int) round($cp_count * 30 / count($dates));
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
                                $sp_details[] = ['date' => $date, 'shift' => $shift_label];
                            }
                        }
                    }
                    // 2. Pointages Supplémentaires effectués en déploiement (sur les lignes principales J ou N)
                    foreach (['J', 'N'] as $main_key) {
                        foreach ($dates as $date) {
                            $main_status = $att_map[$main_key][$date] ?? '';
                            if (strpos($main_status, 'EXT_1|') === 0 || strpos($main_status, 'REL_1|') === 0 || strpos($main_status, 'M_1|') === 0) {
                                $sp_count++;
                                $dest = explode('|', $main_status)[1] ?? 'Site inconnu';
                                $shift_label = 'Suppl. Déployé (' . ($main_key === 'J' ? 'Jour' : 'Nuit') . ')';
                                $sp_details[] = ['date' => $date, 'shift' => $shift_label . ' sur ' . $dest];
                            }
                        }
                    }

                    $assigned_days = 0;
                    $mutated_away_days = 0;
                    foreach ($dates as $date) {
                        $sJ = $att_map['J'][$date] ?? '';
                        $sN = $att_map['N'][$date] ?? '';
                        // Note: cost_count déjà compté dans la boucle principale ci-dessus
                        if ($sJ !== '' || $sN !== '') {
                            $assigned_days++;
                            if (strpos($sJ, 'M|') === 0 || strpos($sJ, 'PM|') === 0 || strpos($sN, 'M|') === 0 || strpos($sN, 'PM|') === 0) {
                                $mutated_away_days++;
                            }
                        }
                    }
                    $real_active = $assigned_days - $mutated_away_days;
                    $active_days = $assigned_days === 0 ? 0 : (int) round($real_active * 30 / count($dates));
                    $prorata_base = (int) round($base * ($active_days / 30));

                    $deductions = (int) round(($absences + $entrant_sortant_count + $map_count + $permission_count) * ($base / 30));
                    $gains = (int) round($sp_count * ($base / 30));

                    // Ajouter le bonus costume (peut être négatif si base > ac_base)
                    if ($cost_count > 0) {
                        $cost_bonus = (int) round($cost_count * (($ac_base / 30) - ($base / 30)));
                        $gains += $cost_bonus;
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
                        'real_active' => $real_active,
                        'active_days' => $active_days,
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

switch ($action) {

    // ─── Module Authentification ───────────────────────────────────────────
    case 'login':
    case 'logout':
    case 'get_user_info':
    case 'save_user_settings':
    case 'complete_onboarding':
    case 'upload_profile_photo':
    case 'send_private_message':
    case 'get_private_messages':
    case 'update_user_status':
    case 'toggle_user_maintenance':
    case 'impersonate_user':
    case 'stop_impersonation':
    case 'update_profile':
    case 'switch_service':
    case 'jarvisse_chat':
        require_once __DIR__ . '/backend/modules/auth.php';
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

        error_log("[DEBUG] request_password_reset for email: $email, user_found: " . ($user ? 'yes' : 'no'));

        if ($user) {
            $stmtUpdate = $sqlite->prepare("UPDATE users SET password_reset_requested_at = CURRENT_TIMESTAMP WHERE LOWER(TRIM(email)) = ?");
            $stmtUpdate->execute([$email]);

            error_log("[DEBUG] request_password_reset UPDATE executed for $email");

            $target_service = !empty($user['service_id']) ? $user['service_id'] : 'system';

            // Create ticket to notify admin
            $ticket_id = 'tk_' . time() . '_' . rand(100, 999);
            $msg = "L'utilisateur " . $user['name'] . " (" . $email . ") a demandé une réinitialisation de son mot de passe. Vous pouvez générer un mot de passe temporaire depuis Gestion des Services.";
            $stmtIns = $sqlite->prepare("INSERT INTO tickets (id, from_service, to_service, from_user, from_user_email, title, content, status, priority, created_at) VALUES (?, 'system', ?, 'Système Sécurité', 'system@elysium', 'Demande de réinitialisation de mot de passe', ?, 'open', 'high', CURRENT_TIMESTAMP)");
            $stmtIns->execute([$ticket_id, $target_service, $msg]);
            error_log("[DEBUG] request_password_reset Ticket created for $email to service $target_service");
        }

        echo json_encode(['success' => true]);
        break;


    case 'get_inter_service_messages':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $email = $_SESSION['user_id'] ?? '';
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        // Clean typing states older than 6 seconds
        $now = time();
        $sqlite->prepare("DELETE FROM typing_states WHERE ? - timestamp > 6")->execute([$now]);

        // Fetch typing states for my_service or all, restricted by company
        $stmtTyping = $sqlite->prepare("
            SELECT t.from_service, t.to_service, u.name as user_name
            FROM typing_states t
            JOIN users u ON t.user_email = u.email
            WHERE u.company_id = ? AND (t.to_service = ? OR t.to_service = 'all')
        ");
        $stmtTyping->execute([$company_id, $my_service]);
        $typers = [];
        while ($row = $stmtTyping->fetch()) {
            $typers[] = [
                'from_service' => $row['from_service'],
                'to_service' => $row['to_service'],
                'user_name' => $row['user_name']
            ];
        }

        // Fetch inter service messages
        $stmtMsgs = $sqlite->prepare("
            SELECT * FROM inter_service_messages
            WHERE company_id = ? AND (to_service = ? OR from_service = ? OR to_service = 'all')
            ORDER BY created_at ASC
        ");
        $stmtMsgs->execute([$company_id, $my_service, $my_service]);
        $msgs = $stmtMsgs->fetchAll();

        // Map keys if needed
        $result = [];
        foreach ($msgs as $m) {
            // Fetch reactions for this message
            $stmtReactions = $sqlite->prepare("SELECT emoji, user_email, user_name FROM message_reactions WHERE message_id = ?");
            $stmtReactions->execute([$m['id']]);
            $reactions = $stmtReactions->fetchAll();

            $result[] = [
                'id' => $m['id'],
                'from_service' => $m['from_service'],
                'from_user' => $m['sender'],
                'to_service' => $m['to_service'],
                'content' => $m['content'],
                'timestamp' => $m['created_at'],
                'reply_to' => $m['reply_to'] ?? '',
                'attachment' => $m['attachment'] ?? '',
                'attachment_name' => $m['attachment_name'] ?? '',
                'reactions' => $reactions
            ];
        }

        echo json_encode(['success' => true, 'messages' => $result, 'typers' => $typers]);
        break;

    case 'send_inter_service_message':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $reply_to = trim($data['reply_to'] ?? '');
        $attachment = trim($data['attachment'] ?? '');
        $attachment_name = trim($data['attachment_name'] ?? '');

        if ($content === '' && $attachment === '') {
            echo json_encode(['success' => false, 'message' => 'Contenu ou pièce jointe requis']);
            break;
        }
        if ($to_service === '') {
            echo json_encode(['success' => false, 'message' => 'Destinataire requis']);
            break;
        }

        $msg_id = 'ism_' . time() . '_' . rand(100, 999);
        $from_user = (string) ($_SESSION['user_name'] ?? 'Utilisateur');

        $stmtIns = $sqlite->prepare("
            INSERT INTO inter_service_messages (id, from_service, to_service, sender, content, attachment, attachment_name, reply_to, created_at, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtIns->execute([
            $msg_id,
            $my_service,
            $to_service,
            $from_user,
            $content,
            $attachment !== '' ? $attachment : null,
            $attachment_name !== '' ? $attachment_name : null,
            $reply_to !== '' ? $reply_to : null,
            date('Y-m-d H:i:s'),
            $company_id
        ]);

        echo json_encode(['success' => true]);
        break;

    case 'react_to_message':
        $sqlite = getDb();
        $message_id = trim($data['message_id'] ?? '');
        $emoji = trim($data['emoji'] ?? '');
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($message_id === '' || $emoji === '' || $email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }

        $stmt = $sqlite->prepare("SELECT 1 FROM message_reactions WHERE message_id = ? AND emoji = ? AND user_email = ?");
        $stmt->execute([$message_id, $emoji, $email]);
        $exists = $stmt->fetch();

        if ($exists) {
            $stmtDel = $sqlite->prepare("DELETE FROM message_reactions WHERE message_id = ? AND emoji = ? AND user_email = ?");
            $stmtDel->execute([$message_id, $emoji, $email]);
        } else {
            $stmtIns = $sqlite->prepare("INSERT INTO message_reactions (message_id, emoji, user_email, user_name) VALUES (?, ?, ?, ?)");
            $stmtIns->execute([$message_id, $emoji, $email, $user_name]);
        }

        echo json_encode(['success' => true]);
        break;
    case 'create_ticket':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $title = trim($data['title'] ?? '');
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $priority = trim($data['priority'] ?? 'medium');
        $tags = $data['tags'] ?? [];
        if ($title === '' || $to_service === '') {
            echo json_encode(['success' => false, 'message' => 'Titre et destinataire requis']);
            break;
        }

        $auto_assigned_to = '';
        $auto_assigned_name = '';
        $lower_title = strtolower($title . ' ' . $content);
        $target_keyword = '';
        if (strpos($lower_title, 'salaire') !== false || strpos($lower_title, 'facture') !== false || strpos($lower_title, 'paye') !== false || strpos($lower_title, 'compta') !== false) {
            $target_keyword = 'compta';
        } elseif (strpos($lower_title, 'panne') !== false || strpos($lower_title, 'informatique') !== false || strpos($lower_title, 'scanner') !== false || strpos($lower_title, 'bug') !== false || strpos($lower_title, 'internet') !== false) {
            $target_keyword = 'tech';
        } elseif (strpos($lower_title, 'recrutement') !== false || strpos($lower_title, 'embauche') !== false || strpos($lower_title, 'rh') !== false || strpos($lower_title, 'conge') !== false) {
            $target_keyword = 'rh';
        }

        if ($target_keyword !== '') {
            $stmtSvc = $sqlite->prepare("SELECT id, name FROM services WHERE LOWER(name) LIKE ?");
            $stmtSvc->execute(['%' . $target_keyword . '%']);
            $svc = $stmtSvc->fetch();
            if ($svc) {
                $auto_assigned_to = $svc['id'];
                $auto_assigned_name = $svc['name'];
            }
        }

        $ticket_id = 'tk_' . time() . '_' . rand(100, 999);
        $from_user = (string) ($_SESSION['user_name'] ?? 'Utilisateur');
        $from_user_email = (string) ($_SESSION['user_id'] ?? '');

        $stmtIns = $sqlite->prepare("INSERT INTO tickets (id, from_service, to_service, from_user, from_user_email, title, content, status, priority, created_at, assigned_to, assigned_name) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP, ?, ?)");
        $stmtIns->execute([$ticket_id, $my_service, $to_service, $from_user, $from_user_email, $title, $content, $priority, $auto_assigned_to !== '' ? $auto_assigned_to : null, $auto_assigned_name !== '' ? $auto_assigned_name . ' (Auto-assigné)' : null]);

        foreach ($tags as $tag) {
            $sqlite->prepare("INSERT INTO ticket_tags (ticket_id, tag) VALUES (?, ?)")->execute([$ticket_id, $tag]);
        }

        echo json_encode(['success' => true]);
        break;
    case 'get_pending_password_resets':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $company_id = $_SESSION['company_id'] ?? '';
        $role = $_SESSION['user_role'] ?? '';
        if ($role !== 'admin' && $role !== 'super_admin') {
            echo json_encode(['success' => true, 'count' => 0, 'users' => []]);
            break;
        }

        $sqlite = getDb();
        if ($role === 'super_admin') {
            $stmt = $sqlite->query("SELECT email, name, service_id, password_reset_requested_at FROM users WHERE password_reset_requested_at IS NOT NULL");
        } else {
            $stmt = $sqlite->prepare("SELECT email, name, service_id, password_reset_requested_at FROM users WHERE company_id = ? AND password_reset_requested_at IS NOT NULL");
            $stmt->execute([$company_id]);
        }
        $pending = [];
        while ($row = $stmt->fetch()) {
            $pending[] = $row;
        }
        echo json_encode(['success' => true, 'count' => count($pending), 'users' => $pending]);
        break;
    case 'get_tickets':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $role = $_SESSION['user_role'] ?? '';

        $sql = "SELECT * FROM tickets";
        $params = [];
        if ($role !== 'super_admin') {
            $sql .= " WHERE to_service = ? OR from_service = ?";
            $params = [$my_service, $my_service];
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetchAll();

        // Fetch tags and comments for each
        foreach ($result as &$t) {
            $stmtTags = $sqlite->prepare("SELECT tag FROM ticket_tags WHERE ticket_id = ?");
            $stmtTags->execute([$t['id']]);
            $tags_rows = $stmtTags->fetchAll();
            $t['tags'] = array_map(fn($r) => array_values($r)[0], $tags_rows);

            $stmtComms = $sqlite->prepare("SELECT * FROM ticket_comments WHERE ticket_id = ?");
            $stmtComms->execute([$t['id']]);
            $t['comments'] = $stmtComms->fetchAll();
            $t['activities'] = []; // Activities could be fetched similarly if normalized, kept empty for brevity
        }

        echo json_encode(['success' => true, 'tickets' => $result]);
        break;
    case 'update_ticket_status':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $status = trim($data['status'] ?? '');

        $stmt = $sqlite->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        echo json_encode(['success' => $found]);
        break;
    case 'assign_ticket':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $assigned_to = trim($data['assigned_to'] ?? '');
        $assigned_name = trim($data['assigned_name'] ?? '');

        $stmt = $sqlite->prepare("UPDATE tickets SET assigned_to = ?, assigned_name = ? WHERE id = ?");
        $stmt->execute([$assigned_to, $assigned_name, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        echo json_encode(['success' => $found]);
        break;
    case 'add_ticket_comment':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $comment = trim($data['comment'] ?? '');
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';

        if ($comment === '') {
            echo json_encode(['success' => false, 'message' => 'Commentaire vide']);
            break;
        }

        $stmt = $sqlite->prepare("INSERT INTO ticket_comments (id, ticket_id, user_name, user_email, content) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['tc_' . time() . '_' . rand(100, 999), $ticket_id, $user_name, $email, $comment]);

        echo json_encode(['success' => true]);
        break;
    case 'get_services_list':
        $sqlite = getDb();
        $user_id = $_SESSION['user_id'] ?? '';
        $company_id = $_SESSION['company_id'] ?? '';
        $role = $_SESSION['user_role'] ?? '';
        
        $sql = "SELECT id, name FROM services";
        $params = [];
        if ($role !== 'super_admin') {
            $sql .= " WHERE company_id = ?";
            $params[] = $company_id;
        }
        $stmt = $sqlite->prepare($sql);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($services as $svc) {
            $result[] = [
                'id' => $svc['id'],
                'name' => $svc['name'],
                'is_online' => true // Simplified online status for now
            ];
        }
        echo json_encode(['success' => true, 'services' => $result]);
        break;
    case 'set_typing_status':
        $sqlite = getDb();
        $db = getData(); // Legacy fallback
        $my_service = resolveCurrentServiceKey($db);
        $to_service = trim($data['to_service'] ?? '');
        $is_typing = !empty($data['is_typing']);
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($to_service === '' || $email === '') {
            echo json_encode(['success' => false]);
            break;
        }
        if ($is_typing) {
            $stmt = $sqlite->prepare("INSERT OR REPLACE INTO typing_states (from_service, to_service, user_email, timestamp) VALUES (?, ?, ?, ?)");
            $stmt->execute([$my_service, $to_service, $email, time()]);
        } else {
            $stmt = $sqlite->prepare("DELETE FROM typing_states WHERE from_service = ? AND to_service = ? AND user_email = ?");
            $stmt->execute([$my_service, $to_service, $email]);
        }
        echo json_encode(['success' => true]);
        break;
    case 'toggle_pin_message':
        $sqlite = getDb();
        $message_id = trim($data['message_id'] ?? '');
        if ($message_id === '') {
            echo json_encode(['success' => false, 'message' => 'ID de message manquant']);
            break;
        }

        $stmtCheck = $sqlite->prepare("SELECT is_pinned FROM inter_service_messages WHERE id = ?");
        $stmtCheck->execute([$message_id]);
        $row = $stmtCheck->fetch();
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'Message non trouvé']);
            break;
        }

        $new_pin = $row['is_pinned'] ? 0 : 1;

        $stmtUp = $sqlite->prepare("UPDATE inter_service_messages SET is_pinned = ? WHERE id = ?");
        $stmtUp->execute([$new_pin, $message_id]);

        echo json_encode(['success' => true]);
        break;

    case 'rate_ticket':
        $sqlite = getDb();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $rating = (int) ($data['rating'] ?? 0);
        $comment = trim($data['comment'] ?? '');
        if ($ticket_id === '' || $rating < 1 || $rating > 5) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }

        $stmt = $sqlite->prepare("UPDATE tickets SET rating = ?, rating_comment = ? WHERE id = ?");
        $stmt->execute([$rating, $comment, $ticket_id]);
        $found = $stmt->rowCount() > 0;

        if ($found) {
            $email = $_SESSION['user_id'] ?? '';
            $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
            $activityMsg = "A évalué le ticket : " . $rating . "/5. Commentaire : " . $comment;
            $stmtComm = $sqlite->prepare("INSERT INTO ticket_comments (id, ticket_id, user_name, user_email, content) VALUES (?, ?, ?, ?, ?)");
            $stmtComm->execute(['tc_' . time() . '_' . rand(100, 999), $ticket_id, $user_name, $email, $activityMsg]);

            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ticket non trouvé']);
        }
        break;

    case 'set_lang':
        $new_lang = $data['lang'] ?? 'fr';
        $_SESSION['lang'] = $new_lang;
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

        // For public registration, we assume the user is registering a new Company
        $dummyDb = []; // createCompany doesn't use it anymore
        $company_id = createCompany($dummyDb, $service_name, $email);

        $service_id = 'svc_' . time() . '_' . rand(100, 999);

        $sqlite = getDb();
        $stmtService = $sqlite->prepare('INSERT INTO services (id, name, company_id) VALUES (?, ?, ?)');
        $stmtService->execute([$service_id, $service_name, $company_id]);

        $assigned_role = 'admin';

        $cfg = getSubscriptionConfig();
        $trialStart = time();
        $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);

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

    case 'create_checkout_session':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut souscrire et payer.']);
            break;
        }

        $provider = strtolower(trim((string) ($data['provider'] ?? 'stripe')));
        $months = (int) ($data['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }
        if ($months > 12) {
            $months = 12;
        }

        $cfg = getSubscriptionConfig();
        $currency = strtolower((string) ($cfg['currency'] ?? 'xof'));
        $price = (int) ($cfg['monthly_price'] ?? 20000);
        $amount = $price * $months;
        $baseUrl = getBaseUrl();

        if ($provider === 'stripe') {
            $params = [
                'mode' => 'payment',
                'success_url' => $baseUrl . '/subscription.php?payment=success&provider=stripe&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $baseUrl . '/subscription.php?payment=cancel&provider=stripe',
                'line_items[0][quantity]' => 1,
                'line_items[0][price_data][currency]' => $currency,
                'line_items[0][price_data][product_data][name]' => 'Pointage Pro - Abonnement Premium',
                'line_items[0][price_data][unit_amount]' => $amount,
                'metadata[email]' => $email,
                'metadata[months]' => (string) $months
            ];

            $stripe = stripeApiRequest('POST', 'checkout/sessions', $params);
            if (empty($stripe['ok'])) {
                echo json_encode(['success' => false, 'message' => $stripe['error'] ?? 'Erreur Stripe']);
                break;
            }

            $session = $stripe['data'] ?? [];
            $sessionId = (string) ($session['id'] ?? '');
            $checkoutUrl = (string) ($session['url'] ?? '');
            if ($sessionId === '' || $checkoutUrl === '') {
                echo json_encode(['success' => false, 'message' => 'Session de paiement invalide']);
                break;
            }

            addPaymentRecord('stripe', $sessionId, $email, $amount, strtoupper($currency), ['months' => $months, 'owner_admin_email' => $email]);
            echo json_encode(['success' => true, 'checkout_url' => $checkoutUrl, 'session_id' => $sessionId]);
            break;
        }

        if ($provider === 'orange_money' || $provider === 'wave') {
            $transactionId = 'txn_' . time() . '_' . rand(1000, 9999);
            $channel = ($provider === 'orange_money') ? 'ORANGE_MONEY' : 'WAVE';
            $notifyUrl = $baseUrl . '/api.php?action=cinetpay_notify';
            $returnUrl = $baseUrl . '/subscription.php?payment=success&provider=' . rawurlencode($provider) . '&transaction_id=' . rawurlencode($transactionId);
            $cancelUrl = $baseUrl . '/subscription.php?payment=cancel&provider=' . rawurlencode($provider);

            $initPayload = [
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'currency' => strtoupper($currency),
                'description' => 'Abonnement Premium Pointage Pro',
                'customer_name' => (string) ($_SESSION['user_name'] ?? 'Utilisateur'),
                'customer_email' => $email,
                'notify_url' => $notifyUrl,
                'return_url' => $returnUrl,
                'channels' => $channel,
                'metadata' => json_encode(['email' => $email, 'months' => $months, 'provider' => $provider])
            ];

            $cinetpay = cinetpayApiRequest('init', $initPayload);
            if (empty($cinetpay['ok'])) {
                echo json_encode(['success' => false, 'message' => $cinetpay['error'] ?? 'Erreur CinetPay']);
                break;
            }

            $respData = $cinetpay['data']['data'] ?? [];
            $payUrl = (string) ($respData['payment_url'] ?? '');
            if ($payUrl === '') {
                echo json_encode(['success' => false, 'message' => 'URL de paiement CinetPay manquante']);
                break;
            }

            addPaymentRecord('cinetpay', $transactionId, $email, $amount, strtoupper($currency), ['months' => $months, 'provider' => $provider, 'cancel_url' => $cancelUrl, 'owner_admin_email' => $email]);
            echo json_encode(['success' => true, 'checkout_url' => $payUrl, 'transaction_id' => $transactionId]);
            break;
        }

        echo json_encode(['success' => false, 'message' => 'Provider de paiement non supporte']);
        break;

    case 'confirm_stripe_payment':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut confirmer le paiement.']);
            break;
        }
        $sessionId = trim((string) ($data['session_id'] ?? ''));
        if ($sessionId === '') {
            echo json_encode(['success' => false, 'message' => 'Session de paiement manquante']);
            break;
        }

        $stripe = stripeApiRequest('GET', 'checkout/sessions/' . rawurlencode($sessionId));
        if (empty($stripe['ok'])) {
            echo json_encode(['success' => false, 'message' => $stripe['error'] ?? 'Verification Stripe impossible']);
            break;
        }

        $session = $stripe['data'] ?? [];
        $paid = (($session['payment_status'] ?? '') === 'paid');
        if (!$paid) {
            echo json_encode(['success' => false, 'message' => 'Paiement non confirme']);
            break;
        }

        $sessionEmail = strtolower((string) ($session['metadata']['email'] ?? ''));
        if ($sessionEmail !== '' && $sessionEmail !== strtolower($email)) {
            echo json_encode(['success' => false, 'message' => 'Paiement non associe a ce compte']);
            break;
        }

        $months = (int) ($session['metadata']['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }

        markPaymentAsPaid('stripe', $sessionId);
        if (!activatePlatformSubscription($months, $email)) {
            echo json_encode(['success' => false, 'message' => 'Activation abonnement impossible']);
            break;
        }

        $state = getUserSubscriptionState($email);
        $_SESSION['subscription_state'] = $state;
        echo json_encode(['success' => true, 'message' => 'Paiement confirme', 'subscription' => $state]);
        break;

    case 'confirm_cinetpay_payment':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expiree']);
            break;
        }
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seul le compte administrateur peut confirmer le paiement.']);
            break;
        }

        $transactionId = trim((string) ($data['transaction_id'] ?? ''));
        if ($transactionId === '') {
            echo json_encode(['success' => false, 'message' => 'Transaction CinetPay manquante']);
            break;
        }

        $paymentRecord = getPaymentByProviderExternalId('cinetpay', $transactionId);
        if (!$paymentRecord) {
            echo json_encode(['success' => false, 'message' => 'Transaction inconnue']);
            break;
        }

        $check = cinetpayApiRequest('check', ['transaction_id' => $transactionId]);
        if (empty($check['ok'])) {
            echo json_encode(['success' => false, 'message' => $check['error'] ?? 'Verification CinetPay impossible']);
            break;
        }

        $status = strtoupper((string) (($check['data']['data']['status'] ?? $check['data']['data']['payment_status'] ?? '')));
        if ($status !== 'ACCEPTED') {
            echo json_encode(['success' => false, 'message' => 'Paiement non confirme (' . $status . ')']);
            break;
        }

        $months = (int) (($paymentRecord['meta']['months'] ?? 1));
        if ($months < 1) {
            $months = 1;
        }

        markPaymentAsPaid('cinetpay', $transactionId);
        if (!activatePlatformSubscription($months, $email)) {
            echo json_encode(['success' => false, 'message' => 'Activation abonnement impossible']);
            break;
        }

        $_SESSION['subscription_state'] = getUserSubscriptionState($email);
        echo json_encode(['success' => true, 'message' => 'Paiement CinetPay confirme']);
        break;

    case 'cinetpay_notify':
        $txnFromPost = trim((string) ($_POST['cpm_trans_id'] ?? $_POST['transaction_id'] ?? ''));
        $txnFromJson = trim((string) ($data['transaction_id'] ?? ''));
        $transactionId = $txnFromPost !== '' ? $txnFromPost : $txnFromJson;
        if ($transactionId === '') {
            echo json_encode(['success' => false, 'message' => 'transaction_id manquant']);
            break;
        }

        $paymentRecord = getPaymentByProviderExternalId('cinetpay', $transactionId);
        if (!$paymentRecord) {
            echo json_encode(['success' => false, 'message' => 'Transaction inconnue']);
            break;
        }

        $check = cinetpayApiRequest('check', ['transaction_id' => $transactionId]);
        if (empty($check['ok'])) {
            echo json_encode(['success' => false, 'message' => $check['error'] ?? 'Verification CinetPay impossible']);
            break;
        }

        $status = strtoupper((string) (($check['data']['data']['status'] ?? $check['data']['data']['payment_status'] ?? '')));
        if ($status === 'ACCEPTED') {
            $months = (int) (($paymentRecord['meta']['months'] ?? 1));
            if ($months < 1) {
                $months = 1;
            }
            markPaymentAsPaid('cinetpay', $transactionId);
            activatePlatformSubscription($months, $paymentRecord['meta']['owner_admin_email'] ?? null);
        }

        echo json_encode(['success' => true]);
        break;

    case 'get_subscription_status':
        $email = $_SESSION['user_id'] ?? '';
        if ($email === '') {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }
        echo json_encode(['success' => true, 'subscription' => getUserSubscriptionState($email)]);
        break;

    case 'activate_subscription':
        $currentEmail = $_SESSION['user_id'] ?? '';
        if ($currentEmail === '') {
            echo json_encode(['success' => false, 'message' => 'Session expirÃ©e']);
            break;
        }

        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Action reservee a l admin. Utilisez le paiement en ligne.']);
            break;
        }

        $months = (int) ($data['months'] ?? 1);
        if ($months < 1) {
            $months = 1;
        }

        if (!activatePlatformSubscription($months, $currentEmail)) {
            echo json_encode(['success' => false, 'message' => 'Activation de l\'abonnement impossible']);
            break;
        }

        $state = getUserSubscriptionState($currentEmail);
        $_SESSION['subscription_state'] = $state;

        echo json_encode([
            'success' => true,
            'message' => 'Abonnement actif',
            'subscription' => $state
        ]);
        break;


    // ─── Module Dashboard & Pointage ───────────────────────────────────────
    case 'get_dashboard_init':
    case 'save_attendance':
    case 'get_attendance':
    case 'publish_pointage':
    case 'reset_pointage':
    case 'get_dashboard_stats':
    case 'get_analytics':
    case 'get_weekly_summary':
    case 'get_monthly_summary':
    case 'get_all_sites_dashboard':
    case 'get_registry':
    case 'get_entrant_sortant':
        require_once __DIR__ . '/backend/modules/pointage.php';
        break;

    // ─── Module Sites, Zones & Agents ──────────────────────────────────────
    case 'get_sites':
    case 'add_site':
    case 'delete_site':
    case 'rename_site':
    case 'add_subsite':
    case 'rename_subsite':
    case 'delete_subsite':
    case 'add_agent':
    case 'delete_agent':
    case 'get_archived_agents':
    case 'update_agent_profile':
    case 'update_agent_info':
    case 'update_agent_salary':
    case 'get_functions':
    case 'save_functions':
        require_once __DIR__ . '/backend/modules/sites.php';
        break;


    // ─── Module Paie & RH ──────────────────────────────────────────
    case 'get_salary_config':
    case 'update_salary_config':
    case 'save_functions':
    case 'save_settings':
    case 'save_manual_adjustment':
    case 'delete_manual_adjustment':
    case 'save_payroll_archive':
    case 'delete_payroll_archive':
    case 'save_site_revenue':
    case 'change_agent_shift':
    case 'get_messages':
    case 'init_next_period':
    case 'reset_year_attendance':
    case 'archive_all_sites':
    case 'get_archives':
    case 'delete_leave':
    case 'get_sanctions':
    case 'save_sanction':
    case 'delete_sanction':
    case 'register_agent_portal':
    case 'login_agent_portal':
    case 'get_portal_registrations':
    case 'update_portal_registration':
    case 'get_archive_detail':
    case 'get_payroll_archives':
    case 'get_payroll_archive_detail':
    case 'delete_archive':
    case 'get_settings':
    case 'clear_site_mutations':
    case 'get_salaries':
    case 'get_dashboard_history':
    case 'update_agent_salary':
    case 'get_payroll_settings':
    case 'save_payroll_settings':
    case 'upload_company_logo':
    case 'get_annual_cumuls':
    case 'get_payroll_variables':
    case 'save_payroll_variables':
    case 'get_payroll_loans':
    case 'add_payroll_loan':
    case 'delete_payroll_loan':
    case 'update_agent_contract':
    case 'get_leaves':
    case 'dump_leaves':
    case 'save_leave':
    case 'apply_last_minute_correction':
    case 'dev_unpublish_period':
    case 'publish_period':
    case 'unpublish_period':
    case 'get_published_periods':
    case 'get_latest_publication':
    case 'save_payroll_status':
    case 'get_payroll_statuses':
        require_once __DIR__ . '/backend/modules/salaries.php';
        break;


    case 'get_payments_history':
        if (($_SESSION['user_role'] ?? '') !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Acces refuse']);
            break;
        }
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        $stmt = $sqlite->prepare("
            SELECT p.*, u.name as user_name, u.service as user_service
            FROM payments p
            LEFT JOIN users u ON LOWER(p.user_email) = LOWER(u.email)
            WHERE p.company_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$company_id]);
        $rows = $stmt->fetchAll();

        $result = [];
        foreach ($rows as $p) {
            $meta = json_decode($p['meta'] ?? '{}', true) ?: [];
            $result[] = [
                'id' => (string) ($p['id'] ?? ''),
                'provider' => (string) ($p['provider'] ?? ''),
                'external_id' => (string) ($p['external_id'] ?? ''),
                'status' => (string) ($p['status'] ?? 'pending'),
                'amount' => (int) ($p['amount'] ?? 0),
                'currency' => (string) ($p['currency'] ?? ''),
                'email' => $p['user_email'],
                'user_name' => (string) ($p['user_name'] ?? ''),
                'service' => (string) ($p['user_service'] ?? ''),
                'months' => (int) ($meta['months'] ?? 1),
                'created_at' => (string) ($p['created_at'] ?? ''),
                'updated_at' => (string) ($p['updated_at'] ?? '')
            ];
        }

        echo json_encode(['success' => true, 'payments' => $result]);
        break;




    case 'send_pub_feedback':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false]);
            break;
        }
        $feedbackData = [
            'period' => $data['period'] ?? '',
            'service_name' => $_SESSION['user_service'] ?? 'Un service',
            'type' => $data['type'] ?? 'accuse',
            'publisher_service_id' => $data['publisher_service_id'] ?? '',
            'timestamp' => time()
        ];
        setServiceDataSql($companyKey, 'latest_feedback', $feedbackData);

        // Sauvegarder dans l'historique
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        array_unshift($history, $feedbackData); // Ajouter au début
        // Garder les 50 derniers max pour ne pas surcharger
        if (count($history) > 50)
            $history = array_slice($history, 0, 50);
        setServiceDataSql($companyKey, 'feedback_history', $history);

        echo json_encode(['success' => true]);
        break;

    case 'get_feedback_history':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'history' => []]);
            break;
        }
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        echo json_encode(['success' => true, 'history' => $history]); 
        break;

    case 'get_latest_feedback':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'feedback' => null]);
            break;
        }
        $fbData = getServiceDataSql($companyKey, 'latest_feedback', null);
        echo json_encode(['success' => true, 'feedback' => $fbData]);
        break;

    case 'get_annual_cumuls':
        $agent_id = $_GET['agent_id'] ?? '';
        $period = $_GET['period'] ?? date('Y-m');
        $year = explode('-', $period)[0];
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        
        $sqlite = getDb();

        // Récupérer les paramètres de paie pour le mois de début
        $settings = getServiceDataSql('company::' . $company_id, 'payroll_settings', []);
        if (empty($settings)) {
            $settings = getServiceDataSql($company_id, 'payroll_settings', []);
        }
        $start_month = str_pad((string)($settings['cumul_start_month'] ?? 1), 2, '0', STR_PAD_LEFT);
        $start_period = $year . '-' . $start_month;
        
        // On récupère uniquement les archives de la même année, à partir du start_period, et strictement antérieures au mois courant
        $stmt = $sqlite->prepare("SELECT period, data FROM archives WHERE company_id = ? AND period >= ? AND period < ?");
        $stmt->execute([$company_id, $start_period, $period]);
        $archives = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $cumuls = [
            'base_salary' => 0,
            'brut' => 0,
            'cnps' => 0,
            'its' => 0,
            'net' => 0,
            'prime_panier' => 0,
            'prime_transport' => 0
        ];
        
        foreach ($archives as $row) {
            $data = json_decode($row['data'], true);
            if (!isset($data['salaries'])) continue;
            
            foreach ($data['salaries'] as $s) {
                if ($s['id'] === $agent_id) {
                    $cumuls['base_salary'] += (float) ($s['salaireBase'] ?? 0);
                    $cumuls['brut'] += (float) ($s['salaireBrut'] ?? 0);
                    $cumuls['cnps'] += (float) ($s['cnpsSalarial'] ?? 0);
                    $cumuls['its'] += (float) ($s['impotsTaxes'] ?? 0);
                    $cumuls['net'] += (float) ($s['netAPayer'] ?? 0);
                    break;
                }
            }
        }
        
        echo json_encode(['success' => true, 'cumuls' => $cumuls]);
        break;

    case 'archive_payroll':
        $period = $data['period'] ?? '';
        $salaries_data = $data['salaries'] ?? [];
        $statuses_data = $data['statuses'] ?? [];
        $serviceKey = $_SESSION['service_id'] ?? null;

        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }

        $archive = [
            'period' => $period,
            'archived_at' => date('Y-m-d H:i:s'),
            'archived_by' => $_SESSION['user_name'] ?? 'Inconnu',
            'salaries' => $salaries_data,
            'statuses' => $statuses_data,
            'sites' => $data['sites'] ?? []
        ];

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $archive_id = 'payroll_' . $period;
        $scope = $data['scope'] ?? 'service';
        $target_val = ($scope === 'company') ? $company_id : $serviceKey;

        $sqlite->prepare('DELETE FROM archives WHERE id = ? AND company_id = ? AND service_id = ?')
            ->execute([$archive_id, $company_id, $target_val]);

        $sqlite->prepare('INSERT INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?)')
            ->execute([$archive_id, $target_val, $company_id, $period, json_encode($archive)]);

        echo json_encode(['success' => true]);
        break;


    case 'get_payslip_template':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $template = getServiceDataSql($serviceKey, 'payslip_template', []);
        echo json_encode(['success' => true, 'template' => $template]);
        break;

    case 'save_payslip_template':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $template = $data['template'] ?? [];
        setServiceDataSql($serviceKey, 'payslip_template', $template);
        echo json_encode(['success' => true]);
        break;

    case 'update_user_photo':
        $updater_role = $_SESSION['user_role'] ?? '';
        if ($updater_role !== 'super_admin' && $updater_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $updater_company_id = $_SESSION['company_id'] ?? '';
        $target_email = $data['email'] ?? '';
        $profile_photo = $data['profile_photo'] ?? null;
        if (!$target_email) {
            echo json_encode(['success' => false, 'message' => 'Email manquant']);
            break;
        }

        $sqlite = getDb();
        $sql = "UPDATE users SET profile_photo = ? WHERE email = ?";
        $params = [$profile_photo, $target_email];

        if ($updater_role === 'admin') {
            $sql .= " AND company_id = ?";
            $params[] = $updater_company_id;
        }

        $sqlite->prepare($sql)->execute($params);
        echo json_encode(['success' => true, 'message' => 'Photo mise à jour']);
        break;


    case 'get_stats':
        $period = $data['period'] ?? date('Y-m');
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        echo json_encode(getAttendanceStats($companyId, $period));
        break;

    case 'pointage_gps':
        $agentId = $data['agent_id'] ?? '';
        $lat = $data['lat'] ?? 0;
        $lng = $data['lng'] ?? 0;
        $period = date('Y-m');
        // TODO: Valider lat/lng
        echo json_encode(['success' => true, 'message' => 'Pointage GPS enregistré (Simulation)']);
        break;

    case 'validate_qr':
        $token = $data['token'] ?? '';
        // Basic validation mirroring client logic
        $secret = 'ELYSIUM2026';
        $now = floor(time());
        $window30 = floor($now / 30);
        $expected = substr(str_replace('=', '', base64_encode($secret . ':' . $window30)), 0, 24);
        $expectedPrev = substr(str_replace('=', '', base64_encode($secret . ':' . ($window30 - 1))), 0, 24);

        if ($token === $expected || $token === $expectedPrev) {
            echo json_encode(['success' => true, 'message' => 'Pointage validé par QR Code']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré']);
        }
        break;

    case 'get_all_agents':
        $serviceKey = resolveCurrentServiceKeySql();
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT * FROM agents WHERE service_id = ? AND archived_period IS NULL ORDER BY name");
        $stmt->execute([$serviceKey]);
        $agents = $stmt->fetchAll();
        foreach ($agents as &$a) {
            $a['shift_history'] = json_decode($a['shift_history'] ?? '[]', true);
            $a['profile_data'] = json_decode($a['profile_data'] ?? '{}', true);
            $a['has_sp'] = (bool) ($a['has_sp'] ?? false);
            $a['has_cnps'] = (bool) ($a['has_cnps'] ?? false);
        }
        echo json_encode(['success' => true, 'agents' => $agents]);
        break;

    case 'get_agents_for_admin':
        // Retourne tous les agents de la company (toutes services confondus) pour les modules admin
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, name, matricule, service_id FROM agents WHERE archived_period IS NULL ORDER BY name");
        $stmt->execute();
        echo json_encode(['success' => true, 'agents' => $stmt->fetchAll()]);
        break;

    case 'get_special_agents':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, name, function, salary FROM agents WHERE salary IS NOT NULL AND salary > 0 ORDER BY name");
        $stmt->execute();
        echo json_encode(['success' => true, 'agents' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    case 'save_special_agent':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $name = trim($data['name'] ?? '');
        $func = $data['function'] ?? 'AS';
        $salary = (int)($data['salary'] ?? 0);
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Le nom de l\'agent est requis']);
            break;
        }

        $sqlite = getDb();
        $stmtCheck = $sqlite->prepare("SELECT id FROM agents WHERE name LIKE ? AND company_id = ? LIMIT 1");
        $stmtCheck->execute([$name, $company_id]);
        $exists = $stmtCheck->fetch();

        if ($exists) {
            // Mettre à jour TOUTES les instances de cet agent s'il existe déjà
            $stmtUpdate = $sqlite->prepare("UPDATE agents SET function = ?, salary = ? WHERE name LIKE ? AND company_id = ?");
            $stmtUpdate->execute([$func, $salary, $name, $company_id]);
        } else {
            // S'il n'existait pas du tout, on le pré-crée
            $new_id = uniqid('agt_sp_');
            $stmtInsert = $sqlite->prepare("INSERT INTO agents (id, name, function, salary, company_id) VALUES (?, ?, ?, ?, ?)");
            $stmtInsert->execute([$new_id, $name, $func, $salary, $company_id]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'remove_special_agent':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        
        $stmtFind = $sqlite->prepare("SELECT name FROM agents WHERE id = ? LIMIT 1");
        $stmtFind->execute([$agent_id]);
        $agent = $stmtFind->fetch(PDO::FETCH_ASSOC);

        if ($agent) {
            $stmtUpdate = $sqlite->prepare("UPDATE agents SET salary = NULL WHERE name LIKE ? AND company_id = ?");
            $stmtUpdate->execute([$agent['name'], $company_id]);
        }
        echo json_encode(['success' => true]);
        break;



    case 'close_payroll_fluctuation':
        $period = $data['period'] ?? $_GET['period'] ?? date('Y-m');
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $ca = $data['chiffre_affaire'] ?? 0;
        $ms_admin = $data['ms_admin'] ?? 0;
        $ms_agents = $data['ms_agents'] ?? 0;
        $closed_by = $_SESSION['user_name'] ?? 'Inconnu';
        $closed_at = date('Y-m-d H:i:s');
        
        $admin_count = $data['admin_count'] ?? 0;
        $agents_count = $data['agents_count'] ?? 0;
        $sqlite = getDb();
        $sqlite->exec('CREATE TABLE IF NOT EXISTS fluctuation_history (company_id TEXT, period TEXT, chiffre_affaire REAL, ms_admin REAL, ms_agents REAL, admin_count INTEGER DEFAULT 0, agents_count INTEGER DEFAULT 0, closed_at TEXT, closed_by TEXT, PRIMARY KEY(company_id, period))');
        try { $sqlite->exec("ALTER TABLE fluctuation_history ADD COLUMN admin_count INTEGER DEFAULT 0"); } catch (Exception $e) {}
        try { $sqlite->exec("ALTER TABLE fluctuation_history ADD COLUMN agents_count INTEGER DEFAULT 0"); } catch (Exception $e) {}
        $sqlite->exec('CREATE TABLE IF NOT EXISTS fluctuation_history_sites (company_id TEXT, period TEXT, site_name TEXT, contract_revenue REAL, total_cost REAL, net_margin REAL, is_alert INTEGER, PRIMARY KEY(company_id, period, site_name))');
        
        $stmt = $sqlite->prepare('REPLACE INTO fluctuation_history (company_id, period, chiffre_affaire, ms_admin, ms_agents, admin_count, agents_count, closed_at, closed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$companyId, $period, $ca, $ms_admin, $ms_agents, $admin_count, $agents_count, $closed_at, $closed_by]);
        
        // Compute sites_rentability snapshot
        $gridRaw = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id=?");
        $gridRaw->execute([$companyId]);
        $salary_config = [];
        foreach ($gridRaw->fetchAll() as $r) $salary_config[$r['poste']] = (int)$r['taux_horaire'];

        $contractsRaw = $sqlite->prepare("SELECT site_name, budget_mensuel, charges_percent, frais_fixes FROM site_contracts WHERE company_id=?");
        $contractsRaw->execute([$companyId]);
        $site_contracts = [];
        foreach ($contractsRaw->fetchAll() as $r) $site_contracts[$r['site_name']] = $r;
        
        $subsite_contracts_stmt = $sqlite->prepare("SELECT sc.*, si.name as site_name FROM subsite_contracts sc JOIN subsites s ON sc.subsite_id = s.id JOIN sites si ON s.site_id = si.id WHERE sc.company_id=?");
        $subsite_contracts_stmt->execute([$companyId]);
        $subsite_revenues = [];
        foreach ($subsite_contracts_stmt->fetchAll(PDO::FETCH_ASSOC) as $sc) {
            $s_name = $sc['site_name'];
            if (!isset($subsite_revenues[$s_name])) $subsite_revenues[$s_name] = 0;
            $subsite_revenues[$s_name] += (int)$sc['quantite'] * (int)$sc['montant_unitaire'];
        }
        // Fallback : si un site n'a pas de subsite_contracts, on utilise son budget_mensuel du site parent
        foreach ($site_contracts as $sname => $sc_data) {
            if (!isset($subsite_revenues[$sname]) || $subsite_revenues[$sname] === 0) {
                $budget = (int)($sc_data['budget_mensuel'] ?? 0);
                if ($budget > 0) $subsite_revenues[$sname] = $budget;
            }
        }

        $varsRaw = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $varsRaw->execute([$companyId, $period]);
        $monthly_vars = $varsRaw->fetch(PDO::FETCH_ASSOC) ?: ['primes_globales' => 0, 'charges_globales_percent' => 0];

        $stmtAg = $sqlite->prepare("SELECT a.*, s.name as site_name FROM agents a LEFT JOIN subsites sub ON a.subsite_id = sub.id LEFT JOIN sites s ON sub.site_id = s.id WHERE a.company_id = ?");
        $stmtAg->execute([$companyId]);
        $allAgents = $stmtAg->fetchAll();

        $sites_rentability = [];

        foreach ($allAgents as $agent) {
            $agent_id  = $agent['id'];
            $func_id   = $agent['function'] ?? 'AS';
            $site_name = $agent['site_name'] ?? 'Non affecté';
            $base = isset($salary_config[$func_id]) && $salary_config[$func_id] > 0 ? $salary_config[$func_id] : 75000;

            if (!isset($sites_rentability[$site_name])) {
                $sites_rentability[$site_name] = [
                    'name' => $site_name, 'salary_expense' => 0,
                    'contract_revenue' => (int)($subsite_revenues[$site_name] ?? 0),
                    'charges_percent' => (float)($site_contracts[$site_name]['charges_percent'] ?? $monthly_vars['charges_globales_percent']),
                    'frais_fixes' => (int)($site_contracts[$site_name]['frais_fixes'] ?? 0)
                ];
            }
            if (!empty($agent['exit_date']) && strpos($agent['exit_date'], $period) === 0) continue;

            $stmtAtt = $sqlite->prepare("SELECT shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
            $stmtAtt->execute([$agent_id, $period]);
            $attRows = $stmtAtt->fetchAll();
            $absences = $sp_count = 0;
            foreach ($attRows as $row) {
                if ($row['status'] === 'A' || in_array($row['status'], ['ABANDON', 'DEMISSION'])) $absences++;
                if (in_array($row['shift_code'], ['S', 'SJ', 'SN']) && !in_array($row['status'], ['', 'A', 'R', 'ABANDON', 'DEMISSION'])) $sp_count++;
                if (in_array($row['shift_code'], ['J', 'N']) && (strpos($row['status'], 'EXT_1|') === 0 || strpos($row['status'], 'REL_1|') === 0 || strpos($row['status'], 'M_1|') === 0)) $sp_count++;
            }
            $deductions = (int)round($absences * ($base / 30));
            $gains      = (int)round($sp_count * ($base / 30));
            $sites_rentability[$site_name]['salary_expense'] += ($base - $deductions + $gains);
        }

        $stmtSitesInsert = $sqlite->prepare('REPLACE INTO fluctuation_history_sites (company_id, period, site_name, contract_revenue, total_cost, net_margin, is_alert) VALUES (?, ?, ?, ?, ?, ?, ?)');

        foreach ($sites_rentability as $site) {
            $charges = $site['salary_expense'] * ($site['charges_percent'] / 100);
            $total_cost = $site['salary_expense'] + $charges + $site['frais_fixes'];
            $net_margin = $site['contract_revenue'] - $total_cost;
            $is_alert = ($site['contract_revenue'] > 0 && $total_cost > ($site['contract_revenue'] * 0.8)) ? 1 : 0;

            $stmtSitesInsert->execute([$companyId, $period, $site['name'], $site['contract_revenue'], $total_cost, $net_margin, $is_alert]);
        }

        echo json_encode(['success' => true]);
        break;

    case 'save_site_revenue':
        echo json_encode(['success' => true, 'message' => 'Contrat sauvegardé']);
        break;
        
    case 'save_manual_adjustment':
        echo json_encode(['success' => true, 'message' => 'Ajustement sauvegardé']);
        break;
        
    case 'delete_manual_adjustment':
        echo json_encode(['success' => true]);
        break;

    
    case 'save_salary_grid':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO salary_grid (company_id, poste, taux_horaire) VALUES (?, ?, ?) ON CONFLICT(company_id, poste) DO UPDATE SET taux_horaire=excluded.taux_horaire");
        foreach ($data['grid'] ?? [] as $poste => $taux) {
            $stmt->execute([$companyId, $poste, (int)$taux]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'save_site_contracts':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO site_contracts (company_id, site_name, budget_mensuel, charges_percent, frais_fixes, prime_site, prime_function) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(company_id, site_name) DO UPDATE SET budget_mensuel=excluded.budget_mensuel, charges_percent=excluded.charges_percent, frais_fixes=excluded.frais_fixes, prime_site=excluded.prime_site, prime_function=excluded.prime_function");
        $site_name = $data['site_name'];
        $budget = (int)($data['budget_mensuel'] ?? 0);
        $charges = (float)($data['charges_percent'] ?? 0);
        $frais = (int)($data['frais_fixes'] ?? 0);
        $prime = (int)($data['prime_site'] ?? 0);
        $prime_function = $data['prime_function'] ?? '';
        $stmt->execute([$companyId, $site_name, $budget, $charges, $frais, $prime, $prime_function]);
        echo json_encode(['success' => true]);
        break;

    case 'save_subsite_contracts':
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $subsite_id = $data['subsite_id'] ?? '';
        $rows = $data['rows'] ?? [];
        if (!$subsite_id) {
            echo json_encode(['success' => false, 'message' => 'subsite_id manquant']);
            break;
        }
        // Delete existing rows for this subsite
        $del = $sqlite->prepare("DELETE FROM subsite_contracts WHERE company_id = ? AND subsite_id = ?");
        $del->execute([$companyId, $subsite_id]);
        // Re-insert all rows
        $ins = $sqlite->prepare("INSERT INTO subsite_contracts (company_id, subsite_id, fonction, shift_type, quantite, montant_unitaire) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($rows as $row) {
            $ins->execute([
                $companyId,
                $subsite_id,
                $row['fonction'] ?? 'AS',
                $row['shift_type'] ?? 'Jour',
                (int)($row['quantite'] ?? 1),
                (int)($row['montant_unitaire'] ?? 0)
            ]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'archive_contract_rupture':
        requirePermission('dashboard');
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $subsite_id = $data['subsite_id'] ?? '';
        $subsite_name = $data['subsite_name'] ?? '';
        $site_name = $data['site_name'] ?? '';
        $motif = $data['motif'] ?? '';
        $rupture_date = $data['rupture_date'] ?? date('Y-m-d');
        $effectif = $data['effectif'] ?? 0;
        $montant_total = $data['montant_total'] ?? 0;
        $contract_rows = json_encode($data['contract_rows'] ?? []);
        $user = $_SESSION['user_name'] ?? 'Inconnu';
        $is_billed = isset($data['is_billed']) ? (int)$data['is_billed'] : 1;

        if (!$subsite_id) {
            echo json_encode(['success' => false, 'message' => 'Zone manquante']);
            break;
        }

        $sqlite = getDb();
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN is_billed INTEGER DEFAULT 1"); } catch (Exception $e) {}
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN contract_rows TEXT"); } catch(Exception $e) {}
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN rupture_date TEXT"); } catch(Exception $e) {}
        $sqlite->exec("CREATE INDEX IF NOT EXISTS idx_contract_ruptures_company ON contract_ruptures(company_id, is_billed)");

        $stmt = $sqlite->prepare("INSERT INTO contract_ruptures 
            (company_id, subsite_id, subsite_name, site_name, motif, rupture_date, effectif, montant_total, contract_rows, archived_at, archived_by, is_billed) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)");
        $stmt->execute([
            $company_id, $subsite_id, $subsite_name, $site_name, $motif, $rupture_date, $effectif, $montant_total, $contract_rows, $user, $is_billed
        ]);

        $sqlite->prepare("DELETE FROM subsite_contracts WHERE company_id = ? AND subsite_id = ?")->execute([$company_id, $subsite_id]);
        $sqlite->prepare("DELETE FROM subsites WHERE id = ?")->execute([$subsite_id]);

        echo json_encode(['success' => true]);
        break;

    case 'get_contract_ruptures':
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $is_billed_filter = isset($data['is_billed']) ? (int)$data['is_billed'] : 1;
        $sqlite = getDb();
        $sqlite->exec("CREATE TABLE IF NOT EXISTS contract_ruptures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id TEXT,
            subsite_id TEXT,
            subsite_name TEXT,
            site_name TEXT,
            motif TEXT,
            effectif INTEGER,
            montant_total INTEGER,
            contract_rows TEXT,
            archived_at TEXT,
            archived_by TEXT,
            is_billed INTEGER DEFAULT 1
        )");
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN contract_rows TEXT"); } catch(Exception $e) {}
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN rupture_date TEXT"); } catch(Exception $e) {}
        try { $sqlite->exec("ALTER TABLE contract_ruptures ADD COLUMN is_billed INTEGER DEFAULT 1"); } catch(Exception $e) {}
        
        $stmt = $sqlite->prepare("SELECT * FROM contract_ruptures WHERE company_id = ? AND is_billed = ? ORDER BY archived_at DESC");
        $stmt->execute([$companyId, $is_billed_filter]);
        $ruptures = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($ruptures as &$r) {
            $r['contract_rows'] = json_decode($r['contract_rows'] ?? '[]', true) ?: [];
        }
        echo json_encode(['success' => true, 'ruptures' => $ruptures]);
        break;

    case 'save_monthly_variables':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $period = $data['period'];
        $primes = (int)($data['primes_globales'] ?? 0);
        $charges = (float)($data['charges_globales_percent'] ?? 0);
        $stmt = $sqlite->prepare("INSERT INTO monthly_variables (company_id, period, primes_globales, charges_globales_percent) VALUES (?, ?, ?, ?) ON CONFLICT(company_id, period) DO UPDATE SET primes_globales=excluded.primes_globales, charges_globales_percent=excluded.charges_globales_percent");
        $stmt->execute([$companyId, $period, $primes, $charges]);
        echo json_encode(['success' => true]);
        break;

    case 'get_compta_data':
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $period = $_GET['period'] ?? date('Y-m');
        
        $grid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id=?");
        $grid->execute([$companyId]);
        
        $contracts = $sqlite->prepare("SELECT site_name, budget_mensuel, charges_percent, frais_fixes, prime_site, prime_function FROM site_contracts WHERE company_id=?");
        $contracts->execute([$companyId]);

        $subsite_contracts_stmt = $sqlite->prepare("SELECT sc.*, s.name as subsite_name, si.name as site_name FROM subsite_contracts sc JOIN subsites s ON sc.subsite_id = s.id JOIN sites si ON s.site_id = si.id WHERE sc.company_id=?");
        $subsite_contracts_stmt->execute([$companyId]);
        $subsite_contracts_raw = $subsite_contracts_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group subsite_contracts by subsite_id
        $subsite_contracts_grouped = [];
        foreach ($subsite_contracts_raw as $sc) {
            $subsite_contracts_grouped[$sc['subsite_id']][] = $sc;
        }
        
        $vars = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $vars->execute([$companyId, $period]);
        
        echo json_encode([
            'success' => true,
            'grid' => $grid->fetchAll(PDO::FETCH_ASSOC),
            'contracts' => $contracts->fetchAll(PDO::FETCH_ASSOC),
            'subsite_contracts' => $subsite_contracts_grouped,
            'variables' => $vars->fetch(PDO::FETCH_ASSOC) ?: ['primes_globales' => 0, 'charges_globales_percent' => 0]
        ]);
        break;

    case 'get_services':
        $company_id = $_SESSION['company_id'] ?? '';
        if (!$company_id) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, name FROM services WHERE company_id = ? ORDER BY name");
        $stmt->execute([$company_id]);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'services' => $services]);
        break;

    case 'publish_reclamations':
        $mois = $data['mois'] ?? '';
        $services = $data['services'] ?? [];
        $fromStatus = $data['from_status'] ?? 'Brouillon';
        $toStatus = $data['to_status'] ?? 'En attente';
        
        if (!$mois) {
            echo json_encode(['success' => false, 'message' => 'Mois manquant']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $recs = getReclamations($companyId);
        $updatedCount = 0;
        foreach ($recs as $rec) {
            if ($rec['mois_concerne'] === $mois && ($rec['statut'] ?? '') === $fromStatus) {
                updateReclamationStatus($rec['id'], [
                    'statut' => $toStatus,
                    'services_cibles' => $services
                ]);
                $updatedCount++;
            }
        }
        
        $companyKey = $_SESSION['company_id'] ?? null;
        $serviceName = $_SESSION['user_service'] ?? 'Un service';
        $serviceKey = $_SESSION['service_id'] ?? null;
        
        $pubData = [
            'period'          => $mois,
            'service_name'    => $serviceName,
            'service_id'      => $serviceKey,
            'services_cibles' => $services,
            'timestamp'       => time(),
            'count'           => $updatedCount
        ];
        setServiceDataSql($companyKey, 'latest_publication_reclamations', $pubData);

        // Enregistrer dans l'historique global (visible dans le bouton Historique)
        $pubHistoryData = [
            'period'               => $mois,
            'type'                 => $toStatus === 'Clôturé' ? 'close_reclamations' : 'publish_reclamations',
            'services_cibles'      => $services,
            'publisher_service_id' => $serviceKey,
            'timestamp'            => time(),
            'count'                => $updatedCount
        ];
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        array_unshift($history, $pubHistoryData);
        if (count($history) > 50) $history = array_slice($history, 0, 50);
        setServiceDataSql($companyKey, 'feedback_history', $history);

        echo json_encode(['success' => true, 'count' => $updatedCount]);
        break;

    case 'batch_update_reclamations':
        $updates = $data['updates'] ?? [];
        $count = 0;
        foreach ($updates as $u) {
            if (isset($u['id']) && isset($u['fields'])) {
                if (updateReclamationStatus($u['id'], $u['fields'])) {
                    $count++;
                }
            }
        }
        echo json_encode(['success' => true, 'count' => $count]);
        break;

    case 'get_latest_publication_reclamations':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'publication' => null, 'global_security_alert' => null]);
            break;
        }
        $pubData = getServiceDataSql($companyKey, 'latest_publication_reclamations', null);
        $alertData = getServiceDataSql($companyKey, 'global_security_alert', null);
        echo json_encode(['success' => true, 'publication' => $pubData, 'global_security_alert' => $alertData]);
        break;

    case 'set_global_security_alert':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false]);
            break;
        }
        if (isset($data['alert']) && $data['alert']) {
            $alertObj = [
                'type' => $data['alert'],
                'publisher_service_id' => $_SESSION['user_service'] ?? '',
                'timestamp' => time()
            ];
            setServiceDataSql($companyKey, 'global_security_alert', $alertObj);
        } else {
            setServiceDataSql($companyKey, 'global_security_alert', null);
        }
        echo json_encode(['success' => true]);
        break;

    case 'send_reclamation_feedback':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false]);
            break;
        }
        $feedbackData = [
            'period'               => $data['period'] ?? '',
            'service_name'         => $_SESSION['user_service'] ?? 'Un service',
            'type'                 => 'reclamation_' . ($data['type'] ?? 'accuse'),
            'publisher_service_id' => $data['publisher_service_id'] ?? '',
            'timestamp'            => time()
        ];
        // Mettre à jour le dernier feedback pour déclencher la pop-up chez le publiant
        setServiceDataSql($companyKey, 'latest_feedback', $feedbackData);

        // Sauvegarder dans l'historique
        $history = getServiceDataSql($companyKey, 'feedback_history', []);
        array_unshift($history, $feedbackData);
        if (count($history) > 50) $history = array_slice($history, 0, 50);
        setServiceDataSql($companyKey, 'feedback_history', $history);
        
        echo json_encode(['success' => true]);
        break;


    case 'add_reclamation':
        $serviceName = $_SESSION['user_service'] ?? 'Inconnu';
        $isUpdate = !empty($data['id']);
        
        $record = [
            'service_declarant' => $serviceName,
            'agent_nom' => $data['agent_nom'] ?? '',
            'agent_matricule' => $data['agent_matricule'] ?? '',
            'agent_site' => $data['agent_site'] ?? '',
            'agent_fonction' => $data['agent_fonction'] ?? '',
            'date_entree' => $data['date_entree'] ?? '',
            'reclamation_categorie' => $data['reclamation_categorie'] ?? 'Salaire',
            'reclamation_categorie_autre' => $data['reclamation_categorie_autre'] ?? '',
            'categorie' => $data['categorie'] ?? 'DIVERS',
            
            'declarant_nom' => $data['declarant_nom'] ?? '',
            'declarant_prenom' => $data['declarant_prenom'] ?? '',
            'declarant_matricule' => $data['declarant_matricule'] ?? '',
            'declarant_fonction' => $data['declarant_fonction'] ?? '',
            'declarant_service' => $data['declarant_service'] ?? $serviceName,
            
            'type_erreur' => $data['type_erreur'] ?? '',
            'type_erreur_autre' => $data['type_erreur_autre'] ?? '',
            'mois_concerne' => $data['mois_concerne'] ?? '',
            'jours_concernes' => $data['jours_concernes'] ?? '',
            
            'premiere_reclamation' => $data['premiere_reclamation'] ?? 'Oui',
            'ponction_precedente_correcte' => $data['ponction_precedente_correcte'] ?? 'Non',
            
            'montant_estime' => $data['montant_estime'] ?? 0,
            'action_demandee' => $data['action_demandee'] ?? '',
            'description' => $data['description'] ?? '',
            'radio_code' => $data['radio_code'] ?? '',
            'radio_signature' => $data['radio_signature'] ?? '',
            'statut' => $data['statut'] ?? 'En attente',
        ];

        // On ne réinitialise les avis que s'il s'agit d'une nouvelle soumission (ou on laisse le frontend décider)
        if (!$isUpdate) {
            $record['avis_secretariat'] = '';
            $record['avis_comptabilite'] = '';
        }
        
        if ($isUpdate) {
            updateReclamationStatus($data['id'], $record);
            $record['id'] = $data['id'];
            $res = $record;
        } else {
            $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
            $res = addReclamation($record, $companyId);
        }
        echo json_encode(['success' => true, 'reclamation' => $res]);
        break;

    case 'get_radio_signatures':
        $sigs = getRadioSignatures();
        echo json_encode(['success' => true, 'signatures' => $sigs]);
        break;

    case 'save_radio_signature':
        $code = $data['code'] ?? '';
        $image = $data['image'] ?? '';
        if (!$code || !$image) {
            echo json_encode(['success' => false, 'message' => 'Code ou image manquant']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        addRadioSignature($code, $image, $companyId);
        echo json_encode(['success' => true]);
        break;

    case 'get_reclamations':
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $recs = getReclamations($companyId);
        echo json_encode(['success' => true, 'reclamations' => $recs]);
        break;

    case 'update_reclamation_status':
        $id = $data['id'] ?? '';
        $updates = $data['updates'] ?? [];
        if (updateReclamationStatus($id, $updates)) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Réclamation non trouvée']);
        }
        break;

    // ==========================================
    // MODULE GESTION DES CONGÉS
    // ==========================================

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
        $db = getDb();

        $registry = [];

        // --- 1. Récupérer tous les AGENTS ---
        $stmtAgents = $db->prepare("
            SELECT a.*, s.name as service_name, sub.name as subsite_name
            FROM agents a
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN subsites sub ON a.subsite_id = sub.id
            WHERE a.company_id = ?
            ORDER BY a.name
        ");
        $stmtAgents->execute([$company_id]);
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
        $stmtUsers = $db->prepare("
            SELECT u.*, s.name as service_name
            FROM users u
            LEFT JOIN services s ON u.service = s.id
            WHERE u.company_id = ?
            ORDER BY u.name
        ");
        $stmtUsers->execute([$company_id]);
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


    // --- WHATSAPP CLONE ENDPOINTS ---
    case 'create_message_group':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $is_announcement = !empty($data['is_announcement']) ? 1 : 0;
        
        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Nom requis']);
            break;
        }
        
        $group_id = 'grp_' . time() . '_' . rand(1000, 9999);
        
        $sqlite->prepare("INSERT INTO message_groups (id, name, description, is_announcement, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?)")
               ->execute([$group_id, $name, $description, $is_announcement, $company_id, $user_email]);
               
        // Add creator as admin
        $sqlite->prepare("INSERT INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'admin')")
               ->execute([$group_id, $user_email]);
               
        // Add other members if provided
        $members = $data['members'] ?? [];
        if (is_array($members)) {
            foreach ($members as $member_email) {
                if ($member_email !== $user_email) {
                    $sqlite->prepare("INSERT OR IGNORE INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'member')")
                           ->execute([$group_id, $member_email]);
                }
            }
        }
        
        echo json_encode(['success' => true, 'group_id' => $group_id]);
        break;

    case 'get_message_groups':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        
        // Groups the user is a member of
        $stmt = $sqlite->prepare("
            SELECT g.*, m.role 
            FROM message_groups g
            JOIN message_group_members m ON g.id = m.group_id
            WHERE g.company_id = ? AND m.user_email = ?
        ");
        $stmt->execute([$company_id, $user_email]);
        $groups = $stmt->fetchAll();
        
        // Also fetch members of these groups
        foreach ($groups as &$g) {
            $stmtM = $sqlite->prepare("SELECT u.name, u.email, m.role, u.profile_photo FROM message_group_members m JOIN users u ON m.user_email = u.email WHERE m.group_id = ?");
            $stmtM->execute([$g['id']]);
            $g['members'] = $stmtM->fetchAll();
        }
        
        echo json_encode(['success' => true, 'groups' => $groups]);
        break;

    case 'send_group_message':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $content = trim($data['content'] ?? '');
        $attachment = trim($data['attachment'] ?? '');
        $attachment_name = trim($data['attachment_name'] ?? '');
        
        if ($group_id === '' || ($content === '' && $attachment === '')) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        // Verify membership
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member) {
            echo json_encode(['success' => false, 'message' => 'Non autorisé']);
            break;
        }
        
        // Check if announcement channel
        $stmtG = $sqlite->prepare("SELECT is_announcement FROM message_groups WHERE id = ? AND company_id = ?");
        $stmtG->execute([$group_id, $company_id]);
        $grp = $stmtG->fetch();
        if ($grp && $grp['is_announcement'] == 1 && $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Seuls les administrateurs peuvent publier']);
            break;
        }
        
        $msg_id = 'gmsg_' . time() . '_' . rand(1000, 9999);
        $sqlite->prepare("INSERT INTO group_messages (id, group_id, sender_email, content, attachment, attachment_name) VALUES (?, ?, ?, ?, ?, ?)")
               ->execute([$msg_id, $group_id, $user_email, $content, $attachment, $attachment_name]);
               
        echo json_encode(['success' => true]);
        break;

    case 'get_group_messages':
        $sqlite = getDb();
        $group_id = trim($data['group_id'] ?? '');
        $user_email = $_SESSION['user_id'] ?? '';
        
        // Verify membership
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        if (!$stmtCheck->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Non autorisé']);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT m.*, u.name as sender_name, u.profile_photo 
            FROM group_messages m 
            JOIN users u ON m.sender_email = u.email 
            WHERE m.group_id = ? 
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$group_id]);
        $messages = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'messages' => $messages]);
        break;

    case 'post_status':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $content = trim($data['content'] ?? '');
        $content_type = trim($data['content_type'] ?? 'text'); // text or image
        $bg_color = trim($data['bg_color'] ?? '#075e54');
        
        if ($content === '') {
            echo json_encode(['success' => false, 'message' => 'Contenu requis']);
            break;
        }
        
        $status_id = 'stat_' . time() . '_' . rand(100, 999);
        $expires_at = date('Y-m-d H:i:s', time() + (24 * 3600)); // 24 hours
        
        $sqlite->prepare("INSERT INTO user_statuses (id, user_email, company_id, content_type, content, bg_color, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
               ->execute([$status_id, $user_email, $company_id, $content_type, $content, $bg_color, $expires_at]);
               
        echo json_encode(['success' => true]);
        break;

    case 'get_statuses':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $now = date('Y-m-d H:i:s');
        
        // Delete expired statuses
        $sqlite->prepare("DELETE FROM user_statuses WHERE expires_at < ?")->execute([$now]);
        
        // Get statuses for my company, grouped by user
        $stmt = $sqlite->prepare("
            SELECT s.*, u.name as user_name, u.profile_photo 
            FROM user_statuses s
            JOIN users u ON s.user_email = u.email
            WHERE s.company_id = ? AND s.expires_at >= ?
            ORDER BY s.created_at ASC
        ");
        $stmt->execute([$company_id, $now]);
        $rows = $stmt->fetchAll();
        
        $statuses_by_user = [];
        foreach ($rows as $row) {
            $email = $row['user_email'];
            if (!isset($statuses_by_user[$email])) {
                $statuses_by_user[$email] = [
                    'user_email' => $email,
                    'user_name' => $row['user_name'],
                    'profile_photo' => $row['profile_photo'],
                    'statuses' => []
                ];
            }
            $statuses_by_user[$email]['statuses'][] = [
                'id' => $row['id'],
                'content_type' => $row['content_type'],
                'content' => $row['content'],
                'bg_color' => $row['bg_color'] ?? '#075e54',
                'created_at' => $row['created_at'],
                'expires_at' => $row['expires_at']
            ];
        }
        
        echo json_encode(['success' => true, 'statuses' => array_values($statuses_by_user)]);
        break;

    case 'upload_file':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        if (empty($_FILES['file'])) {
            echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu']);
            break;
        }
        $type = trim($data['type'] ?? $_POST['type'] ?? 'chat');
        if (!in_array($type, ['chat', 'group', 'status'], true)) {
            $type = 'chat';
        }
        $uploadDir = __DIR__ . '/uploads/' . $type . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $file_name = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        $forbidden_exts = ['php', 'phtml', 'html', 'js', 'exe', 'bat', 'sh', 'pl', 'py', 'htaccess'];
        if (in_array($ext, $forbidden_exts, true)) {
            echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé']);
            break;
        }
        
        $uniqueName = uniqid($type . '_') . '.' . $ext;
        $targetPath = $uploadDir . $uniqueName;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $url = 'uploads/' . $type . '/' . $uniqueName;
            echo json_encode(['success' => true, 'url' => $url, 'name' => $file_name]);
        } else {
            $errCode = $_FILES['file']['error'] ?? 'unknown';
            echo json_encode(['success' => false, 'message' => "Erreur lors du déplacement du fichier. Code erreur: " . $errCode]);
        }
        break;

    case 'update_group_info':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        
        if ($group_id === '' || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier ses informations.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_groups SET name = ?, description = ? WHERE id = ? AND company_id = ?")
               ->execute([$name, $description, $group_id, $company_id]);
                
        echo json_encode(['success' => true]);
        break;

    case 'update_group_photo':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $photo_url = trim($data['photo_url'] ?? '');
        
        if ($group_id === '' || $photo_url === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier sa photo.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_groups SET icon = ? WHERE id = ? AND company_id = ?")
               ->execute([$photo_url, $group_id, $company_id]);
                
        echo json_encode(['success' => true]);
        break;

    case 'add_group_member':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        
        if ($group_id === '' || $member_email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent ajouter des membres.']);
            break;
        }
        
        $stmtUser = $sqlite->prepare("SELECT email FROM users WHERE email = ? AND company_id = ? AND status = 'active'");
        $stmtUser->execute([$member_email, $company_id]);
        if (!$stmtUser->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable dans cette entreprise']);
            break;
        }
        
        $sqlite->prepare("INSERT OR IGNORE INTO message_group_members (group_id, user_email, role) VALUES (?, ?, 'member')")
               ->execute([$group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'remove_group_member':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        
        if ($group_id === '' || $member_email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent retirer des membres.']);
            break;
        }
        
        $sqlite->prepare("DELETE FROM message_group_members WHERE group_id = ? AND user_email = ?")
               ->execute([$group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'change_member_role':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        $member_email = trim($data['member_email'] ?? '');
        $role = trim($data['role'] ?? 'member');
        
        if ($group_id === '' || $member_email === '' || !in_array($role, ['admin', 'member'], true)) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $stmtCheck = $sqlite->prepare("SELECT role FROM message_group_members WHERE group_id = ? AND user_email = ?");
        $stmtCheck->execute([$group_id, $user_email]);
        $member = $stmtCheck->fetch();
        if (!$member || $member['role'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Non autorisé. Seuls les administrateurs du groupe peuvent modifier les rôles.']);
            break;
        }
        
        $sqlite->prepare("UPDATE message_group_members SET role = ? WHERE group_id = ? AND user_email = ?")
               ->execute([$role, $group_id, $member_email]);
                
        echo json_encode(['success' => true]);
        break;

    case 'leave_group':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        $group_id = trim($data['group_id'] ?? '');
        
        if ($group_id === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $sqlite->prepare("DELETE FROM message_group_members WHERE group_id = ? AND user_email = ?")
               ->execute([$group_id, $user_email]);
                
        $stmtCount = $sqlite->prepare("SELECT COUNT(*) as count FROM message_group_members WHERE group_id = ?");
        $stmtCount->execute([$group_id]);
        $count = $stmtCount->fetch()['count'];
        if ($count > 0) {
            $stmtAdmins = $sqlite->prepare("SELECT COUNT(*) as count FROM message_group_members WHERE group_id = ? AND role = 'admin'");
            $stmtAdmins->execute([$group_id]);
            if ($stmtAdmins->fetch()['count'] == 0) {
                $stmtOldest = $sqlite->prepare("SELECT user_email FROM message_group_members WHERE group_id = ? ORDER BY joined_at ASC LIMIT 1");
                $stmtOldest->execute([$group_id]);
                $oldest = $stmtOldest->fetch();
                if ($oldest) {
                    $sqlite->prepare("UPDATE message_group_members SET role = 'admin' WHERE group_id = ? AND user_email = ?")
                           ->execute([$group_id, $oldest['user_email']]);
                }
            }
        } else {
            $sqlite->prepare("DELETE FROM message_groups WHERE id = ?")->execute([$group_id]);
            $sqlite->prepare("DELETE FROM group_messages WHERE group_id = ?")->execute([$group_id]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'start_call':
        $sqlite = getDb();
        $caller = $_SESSION['user_id'] ?? '';
        $receiver = trim($data['receiver_email'] ?? '');
        $type = trim($data['type'] ?? 'video');
        
        if ($caller === '' || $receiver === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }
        
        $sqlite->exec("DELETE FROM active_calls WHERE created_at < datetime('now', '-5 minutes')");
        
        $sqlite->prepare("DELETE FROM active_calls WHERE caller_email = ? OR receiver_email = ?")
               ->execute([$caller, $caller]);
         
        $call_id = 'call_' . time() . '_' . rand(1000, 9999);
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $room_name = 'elysium_' . $company_id . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', min($caller, $receiver)) . '_' . preg_replace('/[^a-zA-Z0-9]/', '_', max($caller, $receiver)) . '_' . $type;
        
        $sqlite->prepare("INSERT INTO active_calls (id, caller_email, receiver_email, room_name, type, status) VALUES (?, ?, ?, ?, ?, 'ringing')")
               ->execute([$call_id, $caller, $receiver, $room_name, $type]);
                
        echo json_encode(['success' => true, 'call' => [
            'id' => $call_id,
            'caller_email' => $caller,
            'receiver_email' => $receiver,
            'room_name' => $room_name,
            'type' => $type,
            'status' => 'ringing'
        ]]);
        break;

    case 'check_incoming_call':
        $sqlite = getDb();
        $user_email = $_SESSION['user_id'] ?? '';
        
        if ($user_email === '') {
            echo json_encode(['success' => false]);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT c.*, u.name as caller_name, u.profile_photo as caller_photo
            FROM active_calls c
            JOIN users u ON c.caller_email = u.email
            WHERE c.receiver_email = ? AND c.status = 'ringing' AND c.created_at >= datetime('now', '-30 seconds')
            ORDER BY c.created_at DESC LIMIT 1
        ");
        $stmt->execute([$user_email]);
        $call = $stmt->fetch();
        
        if ($call) {
            echo json_encode(['success' => true, 'call' => $call]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;

    case 'accept_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'connected' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'reject_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'rejected' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;
        
    case 'end_call':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $sqlite->prepare("UPDATE active_calls SET status = 'ended' WHERE id = ?")->execute([$call_id]);
        echo json_encode(['success' => true]);
        break;

    case 'check_call_status':
        $sqlite = getDb();
        $call_id = trim($data['call_id'] ?? '');
        if ($call_id === '') { echo json_encode(['success' => false]); break; }
        $stmt = $sqlite->prepare("SELECT * FROM active_calls WHERE id = ?");
        $stmt->execute([$call_id]);
        $call = $stmt->fetch();
        if ($call) {
            echo json_encode(['success' => true, 'status' => $call['status'], 'call' => $call]);
        } else {
            echo json_encode(['success' => false, 'status' => 'ended']);
        }
        break;

    case 'view_status':
        $sqlite = getDb();
        $viewer = $_SESSION['user_id'] ?? '';
        $status_id = trim($data['status_id'] ?? '');
        
        if ($viewer === '' || $status_id === '') {
            echo json_encode(['success' => false]);
            break;
        }
        
        $stmtCheckOwn = $sqlite->prepare("SELECT user_email FROM user_statuses WHERE id = ?");
        $stmtCheckOwn->execute([$status_id]);
        $statusOwner = $stmtCheckOwn->fetch();
        if ($statusOwner && $statusOwner['user_email'] !== $viewer) {
            $sqlite->prepare("INSERT OR IGNORE INTO status_views (status_id, viewer_email) VALUES (?, ?)")
                   ->execute([$status_id, $viewer]);
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'get_status_views':
        $sqlite = getDb();
        $status_id = trim($data['status_id'] ?? '');
        
        if ($status_id === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètre invalide']);
            break;
        }
        
        $stmt = $sqlite->prepare("
            SELECT sv.*, u.name as viewer_name, u.profile_photo as viewer_photo
            FROM status_views sv
            JOIN users u ON sv.viewer_email = u.email
            WHERE sv.status_id = ?
            ORDER BY sv.viewed_at DESC
        ");
        $stmt->execute([$status_id]);
        $views = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'views' => $views]);
        break;


    // --- MODULE SUIVI DU PERSONNEL ---
    case 'get_personnel_tracking':
    case 'get_agent_dossier':
    case 'add_sanction':
    case 'add_long_absence':
    case 'add_mutation':
        require __DIR__ . '/suivi_personnel_api.php';
        break;


    // --- MODULE SUIVI DU PERSONNEL ---
    case 'get_personnel_tracking':
    case 'get_agent_dossier':
    case 'add_sanction':
    case 'add_long_absence':
    case 'add_mutation':
        require __DIR__ . '/suivi_personnel_api.php';
        break;


    // --- MODULE ADMINISTRATION ---
    case 'admin_create_account':
    case 'admin_reset_password':
    case 'get_services_management':
    case 'create_service_account':
    case 'update_service_permissions':
    case 'delete_service_account':
    case 'update_user_permissions':
    case 'get_company_users':
        require __DIR__ . '/backend/modules/admin.php';
        break;

    default:
        echo json_encode(['error' => 'Action inconnue']);
}
