<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
}
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors_custom.log');
// Configuration des cookies de session (avant session_start)
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', '0');
ini_set('session.use_strict_mode', '1');
session_start();
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/utils.php';

// Fonctions d'aide pour les réclamations (stockées dans pointage_db.json)
if (!function_exists('getReclamationsJSONData')) {
    function getReclamationsJSONData() {
        $file = __DIR__ . '/pointage_db.json';
        if (!file_exists($file)) return ['reclamations' => []];
        $json = @file_get_contents($file);
        $data = json_decode($json, true);
        return is_array($data) ? $data : ['reclamations' => []];
    }
    function saveReclamationsJSONData($data) {
        $file = __DIR__ . '/pointage_db.json';
        file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    function getReclamations() {
        $data = getReclamationsJSONData();
        return $data['reclamations'] ?? [];
    }
    function addReclamation($record) {
        $data = getReclamationsJSONData();
        if (!isset($data['reclamations']) || !is_array($data['reclamations'])) {
            $data['reclamations'] = [];
        }
        $record['id'] = 'rec_' . time() . '_' . rand(1000, 9999);
        $record['created_at'] = date('Y-m-d H:i:s');
        $data['reclamations'][] = $record;
        saveReclamationsJSONData($data);
        return $record;
    }
    function updateReclamationStatus($id, $updates) {
        $data = getReclamationsJSONData();
        if (!isset($data['reclamations']) || !is_array($data['reclamations'])) return false;
        $changed = false;
        foreach ($data['reclamations'] as &$rec) {
            if ($rec['id'] === $id) {
                foreach ($updates as $k => $v) {
                    $rec[$k] = $v;
                }
                $rec['updated_at'] = date('Y-m-d H:i:s');
                $changed = true;
                break;
            }
        }
        if ($changed) saveReclamationsJSONData($data);
        return $changed;
    }
}

// CORS - Autoriser le frontend React (Vite dev server)
$allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8000', 'http://127.0.0.1:8000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-TOKEN');
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
    if (($_SESSION['user_role'] ?? '') === 'admin') {
        return true;
    }
    if (!isset($_SESSION['permissions']) || !is_array($_SESSION['permissions'])) {
        refreshSessionPermissions();
    }
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
        'update_salary_config',
        'get_functions',
        'save_functions',
        'publish_period',
        'get_published_periods'
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
    $stmt = $sqlite->prepare("SELECT * FROM sites WHERE service_id = ?");
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
            $stmtAg = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name");
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

$publicActions = ['login', 'logout', 'set_lang', 'register', 'cinetpay_notify', 'get_payment_providers', 'get_user_info', 'register_agent_portal', 'login_agent_portal', 'get_leave_types', 'submit_leave_request', 'get_my_leave_balances', 'get_my_leave_requests'];
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
$mutatingActions = ['add_site', 'add_special_site', 'update_site_icon', 'add_subsite', 'rename_site', 'rename_subsite', 'delete_subsite', 'add_agent', 'delete_agent', 'apply_mutation', 'update_attendance', 'bulk_update_attendance', 'init_site_period', 'apply_batch_rotation', 'update_agent_info', 'clear_site_mutations', 'archive_all_sites', 'reset_year_attendance', 'delete_archive', 'update_agent_salary', 'update_salary_config', 'save_functions', 'publish_period', 'send_message', 'resolve_ticket', 'create_ticket', 'delete_message', 'pin_message', 'rate_ticket', 'assign_ticket', 'add_reclamation', 'update_reclamation_status', 'send_private_message', 'update_user_status', 'toggle_user_maintenance'];
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
    'add_subsite' => 'dashboard',
    'rename_subsite' => 'dashboard',
    'delete_subsite' => 'dashboard',
    'add_agent' => 'dashboard',
    'delete_agent' => 'dashboard',
    'apply_mutation' => 'dashboard',
    'update_attendance' => 'dashboard',
    'bulk_update_attendance' => 'dashboard',
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
        $stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ?");
        $stmtSites->execute([$target_val]);
        $sites_rows = $stmtSites->fetchAll();

        // Inject virtual sites
        $has_extras = false;
        $has_releves = false;
        $has_admin = false;
        foreach ($sites_rows as $s) {
            if ($s['id'] === 'site_extras')
                $has_extras = true;
            if ($s['id'] === 'site_releves')
                $has_releves = true;
            if ($s['id'] === 'site_administration')
                $has_admin = true;
        }
        if (!$has_extras)
            $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
        if (!$has_releves)
            $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
        if (!$has_admin)
            $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];

        $salaries = [];
        foreach ($sites_rows as $site) {
            $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
            $stmtSub2->execute([$site['id']]);
            $subsites_rows = $stmtSub2->fetchAll();

            // Inject default subsites for virtual sites if they are not in DB
            if (in_array($site['id'], ['site_extras', 'site_releves', 'site_administration']) && empty($subsites_rows)) {
                if ($site['id'] === 'site_extras')
                    $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_releves')
                    $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration')
                    $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
            }

            foreach ($subsites_rows as $sub) {
                $stmtAg2 = $sqlite->prepare(
                    "SELECT * FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name"
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
                    $absence_details = [];
                    $map_count = 0;
                    $map_details = [];
                    foreach ($dates as $date) {
                        if (($att_map['J'][$date] ?? '') === 'A') {
                            $absences++;
                            $absence_details[] = ['date' => $date, 'shift' => 'Jour'];
                        }
                        if (($att_map['N'][$date] ?? '') === 'A') {
                            $absences++;
                            $absence_details[] = ['date' => $date, 'shift' => 'Nuit'];
                        }
                        if (($att_map['J'][$date] ?? '') === 'MAP') {
                            $map_count++;
                            $map_details[] = ['date' => $date, 'shift' => 'Jour'];
                        }
                        if (($att_map['N'][$date] ?? '') === 'MAP') {
                            $map_count++;
                            $map_details[] = ['date' => $date, 'shift' => 'Nuit'];
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
                                if ($sp_key === 'SJ')
                                    $shift_label = 'Supplémentaire Jour';
                                elseif ($sp_key === 'SN')
                                    $shift_label = 'Supplémentaire Nuit';
                                $sp_details[] = ['date' => $date, 'shift' => $shift_label];
                            }
                        }
                    }

                    $deductions = (int) round(($absences + $map_count) * ($base / 30));
                    $gains = (int) round($sp_count * ($base / 30));

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

                    $total = $base - $deductions + $gains + $prime_site - $remboursement_pret;

                    $salaries[] = [
                        'id' => $agent_id,
                        'name' => $agent['name'],
                        'site' => $site['name'],
                        'subsite' => $sub['name'],
                        'function' => $func_id,
                        'function_label' => $function_label,
                        'shift_type' => $agent['shift_type'] ?? 'Jour',
                        'base' => $base,
                        'absences' => $absences,
                        'absence_details' => $absence_details,
                        'map_count' => $map_count,
                        'map_details' => $map_details,
                        'sp_count' => $sp_count,
                        'sp_details' => $sp_details,
                        'deductions' => $deductions,
                        'gains' => $gains,
                        'prime_site' => $prime_site,
                        'remboursement_pret' => $remboursement_pret,
                        'total' => $total,
                        'profile_data' => json_decode($agent['profile_data'] ?? '{}', true)
                    ];
                }
            }
        }
        return $salaries;
}

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
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'get_user_info':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Non connecté']);
            break;
        }
        $email = $_SESSION['user_id'];
        $subscription = getUserSubscriptionState($email);
        $fresh_permissions = getUserPermissionsByEmail($email);
        $_SESSION['permissions'] = $fresh_permissions;
        $db = getData();

        $sqlite = getDb();
        $stmt_user = $sqlite->prepare("SELECT profile_photo, has_seen_onboarding, phone, workspace_type, settings, status, maintenance_mode FROM users WHERE email = ?");
        $stmt_user->execute([$email]);
        $uRow = $stmt_user->fetch();

        $profile_photo = $uRow['profile_photo'] ?? ($db['users'][$email]['photo'] ?? null);
        $has_seen_onboarding = !empty($uRow['has_seen_onboarding']) ? true : ($db['users'][$email]['has_seen_onboarding'] ?? false);
        $phone = $uRow['phone'] ?? '';
        $workspace_type = $uRow['workspace_type'] ?? 'AUTRE';
        $settings = json_decode($uRow['settings'] ?? '{}', true);
        $status = $uRow['status'] ?? 'active';
        $maintenance_mode = !empty($uRow['maintenance_mode']) ? true : false;

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
            'profile_photo' => $profile_photo,
            'phone' => $phone,
            'workspace_type' => $workspace_type,
            'settings' => $settings,
            'status' => $status,
            'maintenance_mode' => $maintenance_mode,
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
            $stmt = $sqlite->prepare("UPDATE users SET name = ?, email = ?, phone = ?, workspace_type = ?, password = ? WHERE email = ?");
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
        $req_company_id = $_SESSION['company_id'] ?? '';
        $sqlite = getDb();
        $users_list = [];

        $sql = "SELECT * FROM users";
        $params = [];
        if ($req_role === 'admin') {
            $sql .= " WHERE company_id = ?";
            $params[] = $req_company_id;
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
                'permissions' => json_decode($u['permissions'] ?? '{}', true) ?: []
            ];
        }
        echo json_encode(['success' => true, 'users' => $users_list]);
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
            $stmtAgents = $sqlite->prepare("SELECT COUNT(*) as cnt FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period > ?)");
            $stmtAgents->execute([$service_id, $period]);
            $totalAgents = (int)($stmtAgents->fetch()['cnt'] ?? 0);

            // Total sites
            $stmtSites = $sqlite->prepare("SELECT id, name FROM sites WHERE service_id = ?");
            $stmtSites->execute([$service_id]);
            $sitesRows = $stmtSites->fetchAll() ?: [];
            $totalSites = count($sitesRows);
            $siteNamesList = array_map(function($s) { return $s['name']; }, $sitesRows);

            // Attendance stats pour le mois en cours
            $stmtPresent = $sqlite->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE period = ? AND status = '1' AND agent_id IN (SELECT id FROM agents WHERE service_id = ?)");
            $stmtPresent->execute([$period, $service_id]);
            $totalPresences = (int)($stmtPresent->fetch()['cnt'] ?? 0);

            $stmtAbsent = $sqlite->prepare("SELECT COUNT(*) as cnt FROM attendance WHERE period = ? AND status = 'A' AND agent_id IN (SELECT id FROM agents WHERE service_id = ?)");
            $stmtAbsent->execute([$period, $service_id]);
            $totalAbsences = (int)($stmtAbsent->fetch()['cnt'] ?? 0);

            $totalPointages = $totalPresences + $totalAbsences;
            $tauxPresence = $totalPointages > 0 ? round(($totalPresences / $totalPointages) * 100, 1) : 0;

            // Top 5 agents les plus absents ce mois
            $stmtTopAbs = $sqlite->prepare("SELECT a.name, COUNT(att.id) as abs_count FROM attendance att JOIN agents a ON att.agent_id = a.id WHERE att.period = ? AND att.status = 'A' AND a.service_id = ? GROUP BY a.id ORDER BY abs_count DESC LIMIT 5");
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
                $stmtFuncs = $sqlite->prepare("SELECT * FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period > ?)");
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

        $stmtIns = $sqlite->prepare("
            INSERT INTO users (email, password, name, role, role_display_name, service, service_id, company_id, permissions, profile_photo, created_at, workspace_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            $workspace_type
        ]);

        echo json_encode(['success' => true, 'message' => 'Compte créé avec succès']);
        break;

    case 'get_inter_service_messages':
        $sqlite = getDb();
        $my_service = resolveCurrentServiceKeySql();
        $email = $_SESSION['user_id'] ?? '';

        // Clean typing states older than 6 seconds
        $now = time();
        $sqlite->prepare("DELETE FROM typing_states WHERE ? - timestamp > 6")->execute([$now]);

        // Fetch typing states for my_service or all
        $stmtTyping = $sqlite->prepare("
            SELECT t.from_service, t.to_service, u.name as user_name
            FROM typing_states t
            JOIN users u ON t.user_email = u.email
            WHERE t.to_service = ? OR t.to_service = 'all'
        ");
        $stmtTyping->execute([$my_service]);
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
            WHERE to_service = ? OR from_service = ? OR to_service = 'all'
            ORDER BY created_at ASC
        ");
        $stmtMsgs->execute([$my_service, $my_service]);
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
            INSERT INTO inter_service_messages (id, from_service, to_service, sender, content, attachment, attachment_name, reply_to, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            date('Y-m-d H:i:s')
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

    case 'get_dashboard_init':
        $site_id = $_GET['site_id'] ?? null;
        $period = $_GET['period'] ?? date('Y-m');

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey) {
            echo json_encode(['success' => false, 'message' => 'No service selected']);
            break;
        }

        // 1. Get sites — chargement par company_id pour que tous les services partagent les mêmes sites
        $stmt = $sqlite->prepare("SELECT * FROM sites WHERE company_id = ?");
        $stmt->execute([$company_id]);
        $sites = $stmt->fetchAll();

        // Inject default sites
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
            $sites[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
        }
        if (!$has_releves) {
            $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
        }
        if (!$has_admin) {
            $sites[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];
        }



        // Fetch subsites for all sites
        foreach ($sites as &$site_ref) {
            if (in_array($site_ref['id'], ['site_extras', 'site_releves', 'site_administration'])) {
                if ($site_ref['id'] === 'site_extras')
                    $site_ref['subsites'] = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site_ref['id'] === 'site_releves')
                    $site_ref['subsites'] = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site_ref['id'] === 'site_administration')
                    $site_ref['subsites'] = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                continue;
            }
            $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
            $stmtSub->execute([$site_ref['id']]);
            $site_ref['subsites'] = $stmtSub->fetchAll() ?: [];
        }

        // 2. Get published periods (from archives) — par company pour que le PC voie aussi les archives
        $stmt = $sqlite->prepare("SELECT DISTINCT period FROM archives WHERE company_id = ? AND id NOT LIKE 'payroll_%'");
        $stmt->execute([$company_id]);

        $pubRows = $stmt->fetchAll();
        $published_periods = [];
        foreach ($pubRows as $r) {
            if (isset($r['period']))
                $published_periods[] = $r['period'];
        }


        $site_data = [];

        if ($site_id !== null && $site_id !== '') {
            $site = null;
            foreach ($sites as $s) {
                if ($s['id'] == $site_id) {
                    $site = $s;
                    break;
                }
            }

            if ($site) {
                $site_name = $site['name'];

                // Fetch subsites
                $stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
                $stmt->execute([$site_id]);
                $subsites_rows = $stmt->fetchAll();

                // Inject default subsites for special sites if empty
                if (empty($subsites_rows)) {
                    if ($site_id === 'site_extras') {
                        $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                    } elseif ($site_id === 'site_releves') {
                        $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                    } elseif ($site_id === 'site_administration') {
                        $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                    }
                }

                $subsites = [];
                foreach ($subsites_rows as $sub) {
                    // Fetch agents for this subsite
                    $stmt_ag = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name");
                    $stmt_ag->execute([$sub['id'], $serviceKey, $period]);
                    $agents_rows = $stmt_ag->fetchAll();

                    $agents = [];
                    foreach ($agents_rows as $agent) {
                        $agent['has_sp'] = (bool) $agent['has_sp'];
                        if (isset($agent['shift_history']) && is_string($agent['shift_history'])) {
                            $agent['shift_history'] = json_decode($agent['shift_history'], true) ?: [];
                        } else {
                            $agent['shift_history'] = [];
                        }
                        // Fetch attendance
                        $stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                        $stmt_att->execute([$agent['id'], $period]);
                        $agent['attendance'] = $stmt_att->fetchAll() ?: [];
                        $agents[] = $agent;
                    }
                    $sub['agents'] = $agents;
                    $subsites[] = $sub;
                }

                // 3. Mutated Agents (M|...) and Extras/Releves (EXT|..., REL|...)
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
                    // Fetch original site to determine if they are from extras or releves
                    $stmt_orig = $sqlite->prepare("SELECT s.name, s.id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = ?");
                    $stmt_orig->execute([$agent['subsite_id']]);
                    $orig_site = $stmt_orig->fetch();

                    if ($orig_site && $orig_site['id'] !== $site_id) {
                        // Fetch full attendance for this mutated agent
                        $stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND date LIKE ?");
                        $stmt_att->execute([$agent['id'], $period . '-%']);

                        $mutated_agent = $agent;
                        $mutated_agent['has_sp'] = (bool) $mutated_agent['has_sp'];
                        if (isset($mutated_agent['shift_history']) && is_string($mutated_agent['shift_history'])) {
                            $mutated_agent['shift_history'] = json_decode($mutated_agent['shift_history'], true) ?: [];
                        } else {
                            $mutated_agent['shift_history'] = [];
                        }

                        $raw_att = $stmt_att->fetchAll() ?: [];
                        $processed_att = [];
                        foreach ($raw_att as $att) {
                            if (
                                strpos($att['status'], 'M|' . $site_name) === 0 ||
                                strpos($att['status'], 'EXT|' . $site_name) === 0 ||
                                strpos($att['status'], 'REL|' . $site_name) === 0 ||
                                strpos($att['status'], 'EXT_A|' . $site_name) === 0 ||
                                strpos($att['status'], 'REL_A|' . $site_name) === 0 ||
                                strpos($att['status'], 'EXT_R|' . $site_name) === 0 ||
                                strpos($att['status'], 'REL_R|' . $site_name) === 0
                            ) {
                                $att['status'] = '';
                                $processed_att[] = $att;
                            } else {
                                $att['shift_code'] = '';
                                $att['status'] = '';
                                $processed_att[] = $att;
                            }
                        }
                        $mutated_agent['attendance'] = $processed_att;

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

                $site_data = $subsites;
            }
        }

        echo json_encode([
            'success' => true,
            'sites' => $sites,
            'site_data' => $site_data,
            'published_periods' => $published_periods,
            'permissions' => [] // Loaded on client or via session
        ]);
        break;

    case 'get_analytics':
        $sqlite = getDb();
        $service_id = $_SESSION['service_id'] ?? null;
        if (!$service_id) {
            echo json_encode(['success' => false, 'message' => 'No service selected']);
            break;
        }

        $period = $_GET['period'] ?? date('Y-m');

        // Settings du cycle
        $settings_raw = getServiceDataSql($service_id, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        if (!is_array($settings_raw)) $settings_raw = ['cycle_start' => 21, 'cycle_end' => 20];
        $start_day = (int)($settings_raw['cycle_start'] ?? 21);
        $end_day = (int)($settings_raw['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);

        // Salary config
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $stmtGrid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ?");
        $stmtGrid->execute([$companyId]);
        $salary_config_raw = [];
        while($row = $stmtGrid->fetch()) {
            $salary_config_raw[$row['poste']] = (int)$row['taux_horaire'];
        }

        // 1. Agents par site (réel) - Mapping PHP pour gérer les sites virtuels
        $stmtSubsites = $sqlite->prepare("SELECT id, site_id FROM subsites WHERE service_id = ?");
        $stmtSubsites->execute([$service_id]);
        $subsitesMap = [];
        foreach ($stmtSubsites->fetchAll() ?: [] as $sub) {
            $subsitesMap[$sub['id']] = $sub['site_id'];
        }
        
        $stmtAllAgents = $sqlite->prepare("SELECT * FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period > ?)");
        $stmtAllAgents->execute([$service_id, $period]);
        $allAgents = $stmtAllAgents->fetchAll() ?: [];

        $agentsBySiteCounts = [];
        $totalAgents = count($allAgents);

        foreach ($allAgents as $agent) {
            $subId = $agent['subsite_id'] ?? '';
            $siteId = $subsitesMap[$subId] ?? null;
            if (!$siteId) {
                if (strpos($subId, 'site_extras') !== false) $siteId = 'site_extras';
                elseif (strpos($subId, 'site_releves') !== false) $siteId = 'site_releves';
                elseif (strpos($subId, 'site_admin') !== false) $siteId = 'site_administration';
                else $siteId = 'Inconnu';
            }
            if (!isset($agentsBySiteCounts[$siteId])) $agentsBySiteCounts[$siteId] = 0;
            $agentsBySiteCounts[$siteId]++;
        }

        // Noms des sites
        $stmtSites = $sqlite->prepare("SELECT id, name FROM sites WHERE service_id = ?");
        $stmtSites->execute([$service_id]);
        $sitesData = $stmtSites->fetchAll() ?: [];
        $siteNames = [];
        foreach ($sitesData as $s) {
            $siteNames[$s['id']] = $s['name'];
        }

        $agentsBySiteFormatted = [];
        foreach ($agentsBySiteCounts as $siteId => $total) {
            $name = $siteNames[$siteId] ?? $siteId;
            if ($siteId === 'site_extras') $name = 'Vivier Extras';
            if ($siteId === 'site_releves') $name = 'Vivier Relèves';
            if ($siteId === 'site_administration') $name = 'Administration';
            $agentsBySiteFormatted[] = ['name' => $name, 'value' => $total];
        }

        $totalPresences = 0;
        $totalAbsences = 0;
        $totalMasseSalariale = 0;

        // Calcul par semaine pour le graphique barres
        $weekData = [];
        $weekSize = max(1, intval(count($dates) / 4));
        for ($w = 0; $w < 4; $w++) {
            $weekData[$w] = ['Présents' => 0, 'Absents' => 0];
        }

        foreach ($allAgents as $agent) {
            $agent_id = $agent['id'];
            $func_id = $agent['function'] ?? 'AS';
            $base = isset($agent['salary']) && (int)$agent['salary'] > 0
                ? (int)$agent['salary']
                : (isset($salary_config_raw[$func_id]) ? (int)$salary_config_raw[$func_id] : 75000);

            $stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
            $stmtAtt->execute([$agent_id, $period]);
            $att_rows = $stmtAtt->fetchAll() ?: [];

            $att_map = [];
            foreach ($att_rows as $att) {
                $att_map[$att['shift_code']][$att['date']] = $att['status'];
            }

            $agent_absences = 0;
            $agent_sp = 0;
            foreach ($dates as $idx => $date) {
                $weekIdx = min(3, intval($idx / $weekSize));
                $dayPresent = false;
                $dayAbsent = false;

                // Vérifier Jour
                $statusJ = $att_map['J'][$date] ?? '';
                if ($statusJ === 'A') { $agent_absences++; $dayAbsent = true; }
                elseif ($statusJ === '1' || $statusJ === 'P') { $dayPresent = true; }

                // Vérifier Nuit
                $statusN = $att_map['N'][$date] ?? '';
                if ($statusN === 'A') { $agent_absences++; $dayAbsent = true; }
                elseif ($statusN === '1' || $statusN === 'P') { $dayPresent = true; }

                // Supplémentaires
                foreach (['S', 'SJ', 'SN'] as $sp_key) {
                    $sp_status = $att_map[$sp_key][$date] ?? '';
                    if ($sp_status !== '' && $sp_status !== 'A' && $sp_status !== 'R') {
                        $agent_sp++;
                    }
                }

                if ($dayPresent) $weekData[$weekIdx]['Présents']++;
                if ($dayAbsent) $weekData[$weekIdx]['Absents']++;
            }

            $totalAbsences += $agent_absences;
            $deductions = (int)round($agent_absences * ($base / 30));
            $gains = (int)round($agent_sp * ($base / 30));
            $totalMasseSalariale += ($base - $deductions + $gains);
        }

        // Nombre total de jours potentiels travaillés
        $totalPossibleDays = $totalAgents * count($dates);
        $presenceRate = $totalPossibleDays > 0 ? round((1 - ($totalAbsences / $totalPossibleDays)) * 100, 1) : 0;
        $totalPresences = $totalPossibleDays - $totalAbsences;

        $monthlyAttendance = [];
        for ($w = 0; $w < 4; $w++) {
            $monthlyAttendance[] = [
                'name' => 'Semaine ' . ($w + 1),
                'Présents' => $weekData[$w]['Présents'],
                'Absents' => $weekData[$w]['Absents']
            ];
        }

        // 3. Évolution masse salariale (6 derniers mois — estimation rapide par nombre d'agents)
        $salaryFluctuation = [];
        $monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        for ($i = 5; $i >= 0; $i--) {
            $pastDate = date('Y-m', strtotime("-$i months"));
            $pastYear = date('Y', strtotime("-$i months"));
            $pastMonth = (int)date('m', strtotime("-$i months")) - 1;
            $label = $monthNames[$pastMonth] . ' ' . substr($pastYear, 2);

            // Compter les agents actifs pour ce mois
            $stmtPast = $sqlite->prepare("SELECT COUNT(*) as cnt FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period > ?)");
            $stmtPast->execute([$service_id, $pastDate]);
            $pastRow = $stmtPast->fetch();
            $pastCount = (int)($pastRow['cnt'] ?? 0);

            // Estimation : nombre d'agents * salaire moyen (75000 par défaut)
            $avgSalary = 75000;
            if (!empty($salary_config_raw)) {
                $vals = array_values($salary_config_raw);
                $numericVals = array_filter($vals, 'is_numeric');
                if (!empty($numericVals)) {
                    $avgSalary = (int)(array_sum($numericVals) / count($numericVals));
                }
            }
            $salaryFluctuation[] = ['month' => $label, 'MasseSalariale' => $pastCount * $avgSalary];
        }

        // Formater la masse salariale
        $masseSalarialeLabel = $totalMasseSalariale;
        if ($totalMasseSalariale >= 1000000) {
            $masseSalarialeLabel = round($totalMasseSalariale / 1000000, 1) . 'M';
        } elseif ($totalMasseSalariale >= 1000) {
            $masseSalarialeLabel = round($totalMasseSalariale / 1000, 0) . 'K';
        }

        echo json_encode([
            'success' => true,
            'period' => $period,
            'totalAgents' => $totalAgents,
            'presenceRate' => $presenceRate,
            'totalAbsences' => $totalAbsences,
            'masseSalariale' => $totalMasseSalariale,
            'masseSalarialeLabel' => $masseSalarialeLabel,
            'agentsBySite' => $agentsBySiteFormatted,
            'monthlyAttendance' => $monthlyAttendance,
            'salaryFluctuation' => $salaryFluctuation
        ]);
        break;

    case 'get_sites':
        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? null;
        $scope = $_GET['scope'] ?? 'service';
        // Charger sites par company_id par défaut pour partager entre tous les services
        $target_col = ($scope === 'service') ? 'service_id' : 'company_id';
        $target_val = ($scope === 'service') ? $serviceKey : $companyKey;

        // Charger sites
        $stmt = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ?");
        $stmt->execute([$target_val]);
        $sites_rows = $stmt->fetchAll();

        // Inject virtual sites
        $has_extras = false;
        $has_releves = false;
        $has_admin = false;
        foreach ($sites_rows as $s) {
            if ($s['id'] === 'site_extras')
                $has_extras = true;
            if ($s['id'] === 'site_releves')
                $has_releves = true;
            if ($s['id'] === 'site_administration')
                $has_admin = true;
        }
        if (!$has_extras)
            $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
        if (!$has_releves)
            $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
        if (!$has_admin)
            $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration'];

        $sites = $sites_rows;
        foreach ($sites as &$site) {
            if (in_array($site['id'], ['site_extras', 'site_releves', 'site_administration'])) {
                if ($site['id'] === 'site_extras')
                    $site['subsites'] = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_releves')
                    $site['subsites'] = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration')
                    $site['subsites'] = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                continue;
            }
            $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
            $stmtSub->execute([$site['id']]);
            $site['subsites'] = $stmtSub->fetchAll() ?: [];
        }

        echo json_encode($sites);
        break;

    case 'add_site':
        requirePermission('dashboard');
        $serviceKey = $_SESSION['service_id'] ?? null;
        $name = $data['name'] ?? '';
        $sqlite = getDb();
        $stmt = $sqlite->prepare('SELECT COUNT(*) as c FROM sites WHERE name = ? AND service_id = ?');
        $stmt->execute([$name, $serviceKey]);
        $row = $stmt->fetch();
        if ($row && $row['c'] > 0) {
            echo json_encode(['success' => false, 'message' => 'Ce site existe déjà']);
            break;
        }

        $id = time() . '_' . rand(100, 999);
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        $stmtInsert = $sqlite->prepare('INSERT INTO sites (id, name, service_id, company_id) VALUES (?, ?, ?, ?)');
        $stmtInsert->execute([$id, $name, $serviceKey, $company_id]);

        $stmtSubsite = $sqlite->prepare('INSERT INTO subsites (id, name, site_id, service_id) VALUES (?, ?, ?, ?)');
        $stmtSubsite->execute([$id . '_1', 'Zone Principale', $id, $serviceKey]);

        // Keep legacy sync for now until get_dashboard_init is rewritten
        $db = getScopedData($serviceKey);
        $db['sites'][] = [
            'id' => $id,
            'name' => $name,
            'subsites' => [
                ['id' => $id . '_1', 'name' => 'Zone Principale', 'agents' => []]
            ]
        ];
        saveScopedData($db, $serviceKey);

        echo json_encode(['success' => true]);
        break;

    case 'add_special_site':
        requirePermission('dashboard');
        $name = trim($data['name'] ?? '');
        $icon = trim($data['icon'] ?? '📋');
        $type = trim($data['type'] ?? 'custom'); // custom | extras | releves | admin
        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Nom requis']);
            break;
        }
        $db = getScopedData($serviceKey);
        // Build a fixed, readable ID based on slugified name
        $slug = 'site_custom_' . preg_replace('/[^a-z0-9_]/', '_', strtolower($name));
        // Check uniqueness
        foreach ($db['sites'] as $s) {
            if ($s['id'] === $slug || strtolower($s['name']) === strtolower($name)) {
                echo json_encode(['success' => false, 'message' => 'Un site avec ce nom existe déjà']);
                break 2;
            }
        }
        $db['sites'][] = [
            'id' => $slug,
            'name' => $icon . ' ' . $name,
            'icon' => $icon,
            'is_special' => true,
            'special_type' => $type,
            'subsites' => [
                ['id' => $slug . '_1', 'name' => 'Agents Disponibles', 'agents' => []]
            ]
        ];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true, 'site_id' => $slug]);
        break;

    case 'update_site_icon':
        $site_id = $data['site_id'] ?? '';
        $icon = $data['icon'] ?? '🏢';
        $db = getScopedData($serviceKey);
        foreach ($db['sites'] as &$site) {
            if ((string) $site['id'] === (string) $site_id) {
                $site['icon'] = $icon;
                break;
            }
        }
        unset($site);
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'add_subsite':
        $site_id = $data['site_id'] ?? 0;
        $name = $data['name'] ?? '';

        $sqlite = getDb();
        $id = time() . '_' . rand(100, 999);
        $stmtSubsite = $sqlite->prepare('INSERT INTO subsites (id, name, site_id, service_id) VALUES (?, ?, ?, ?)');
        $stmtSubsite->execute([$id, $name, $site_id, $serviceKey]);

        $db = getScopedData($serviceKey);
        foreach ($db['sites'] as &$site) {
            if ($site['id'] == $site_id) {
                if (!isset($site['subsites']))
                    $site['subsites'] = [];
                $site['subsites'][] = [
                    'id' => $id,
                    'name' => $name,
                    'agents' => []
                ];
                break;
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'rename_site':
        requirePermission('dashboard');
        $site_id = $data['site_id'] ?? '';
        $new_name = $data['name'] ?? '';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE sites SET name = ? WHERE id = ?");
        $stmt->execute([$new_name, $site_id]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_site':
        requirePermission('dashboard');
        $site_id = $data['site_id'] ?? '';
        if (!$site_id) {
            echo json_encode(['success' => false, 'message' => 'Site manquant']);
            break;
        }
        $sqlite = getDb();
        
        // Ensure subsites and agents are cleaned up too
        $stmtSubsites = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
        $stmtSubsites->execute([$site_id]);
        $subsites = $stmtSubsites->fetchAll();
        
        foreach ($subsites as $sub) {
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE subsite_id = ?)")->execute([$sub['id']]);
            $sqlite->prepare("DELETE FROM agents WHERE subsite_id = ?")->execute([$sub['id']]);
        }
        $sqlite->prepare("DELETE FROM subsites WHERE site_id = ?")->execute([$site_id]);
        $sqlite->prepare("DELETE FROM sites WHERE id = ?")->execute([$site_id]);
        
        echo json_encode(['success' => true]);
        break;

    case 'rename_subsite':
        $subsite_id = $data['subsite_id'] ?? '';
        $new_name = $data['name'] ?? '';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE subsites SET name = ? WHERE id = ?");
        $stmt->execute([$new_name, $subsite_id]);
        
        $db = getScopedData($serviceKey);
        foreach ($db['sites'] as &$site) {
            if (!isset($site['subsites'])) continue;
            foreach ($site['subsites'] as &$sub) {
                if (($sub['id'] ?? '') === $subsite_id) {
                    $sub['name'] = $new_name;
                    break 2;
                }
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'delete_subsite':
        $subsite_id = $data['subsite_id'] ?? '';
        if (!$subsite_id) {
            echo json_encode(['success' => false, 'message' => 'Sous-site manquant']);
            break;
        }
        if (strpos((string) $subsite_id, 'mutated_') === 0) {
            echo json_encode(['success' => false, 'message' => 'Sous-site temporaire non supprimable']);
            break;
        }

        $sqlite = getDb();

        // Fetch agents to delete their attendance
        $stmtAgents = $sqlite->prepare("SELECT id FROM agents WHERE subsite_id = ? AND service_id = ?");
        $stmtAgents->execute([$subsite_id, $serviceKey]);
        $agents = $stmtAgents->fetchAll();

        if (!empty($agents)) {
            $placeholders = str_repeat('?,', count($agents) - 1) . '?';
            $agent_ids = array_map(function ($a) {
                return $a['id']; }, $agents);

            // Delete attendance
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id IN ($placeholders)")->execute($agent_ids);

            // Delete agents
            $sqlite->prepare("DELETE FROM agents WHERE subsite_id = ? AND service_id = ?")->execute([$subsite_id, $serviceKey]);
        }

        // Delete subsite
        $sqlite->prepare("DELETE FROM subsites WHERE id = ?")->execute([$subsite_id]);

        $db = getScopedData($serviceKey);
        $found = false;
        $removed_agent_ids = [];

        foreach ($db['sites'] as &$site) {
            if (!isset($site['subsites']) || !is_array($site['subsites'])) {
                continue;
            }
            foreach ($site['subsites'] as $idx => $sub) {
                if ((string) ($sub['id'] ?? '') === (string) $subsite_id) {
                    if (isset($sub['agents']) && is_array($sub['agents'])) {
                        foreach ($sub['agents'] as $ag) {
                            if (!empty($ag['id'])) {
                                $removed_agent_ids[] = $ag['id'];
                            }
                        }
                    }
                    array_splice($site['subsites'], $idx, 1);
                    $found = true;
                    break 2;
                }
            }
        }

        if (!$found) {
            echo json_encode(['success' => false, 'message' => 'Sous-site introuvable']);
            break;
        }

        if (!empty($removed_agent_ids) && isset($db['attendance']) && is_array($db['attendance'])) {
            foreach ($db['attendance'] as &$periodData) {
                if (!is_array($periodData)) {
                    continue;
                }
                foreach ($removed_agent_ids as $aid) {
                    unset($periodData[$aid]);
                }
            }
            unset($periodData);
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'get_site_data':
        $site_id = $_GET['site_id'] ?? 0;
        $period = $_GET['period'] ?? date('Y-m');

        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        $company_id = $_SESSION['company_id'] ?? null;
        $site_data = [];

        if ($site_id !== null && $site_id !== '' && $serviceKey) {
            $is_hardcoded = in_array($site_id, ['site_extras', 'site_releves', 'site_administration']);

            if ($is_hardcoded) {
                $site = ['id' => $site_id, 'name' => ''];
                if ($site_id === 'site_extras')
                    $site['name'] = '🌟 Vivier des Extras';
                if ($site_id === 'site_releves')
                    $site['name'] = '🔄 Vivier des relèves';
                if ($site_id === 'site_administration')
                    $site['name'] = '🏢 Administration';

                // Fetch custom subsites created by this specific service in the hardcoded global sites
                $stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND service_id = ?");
                $stmt->execute([$site_id, $serviceKey]);
                $custom_subsites = $stmt->fetchAll();

                $subsites_rows = [];
                if ($site_id === 'site_extras')
                    $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site_id === 'site_releves')
                    $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site_id === 'site_administration')
                    $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];

                $subsites_rows = array_merge($subsites_rows, $custom_subsites);
            } else {
                // Charger par company_id pour que le PC puisse accéder aux sites créés par l'admin
                $stmt = $sqlite->prepare("SELECT * FROM sites WHERE id = ? AND (service_id = ? OR company_id = ?)");
                $stmt->execute([$site_id, $serviceKey, $company_id]);
                $site = $stmt->fetch();

                if ($site) {
                    $stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR service_id IS NULL)");
                    $stmt->execute([$site_id, $serviceKey]);
                    $subsites_rows = $stmt->fetchAll();
                }
            }

            if ($site) {
                $site_name = $site['name'];

                $subsites = [];
                foreach ($subsites_rows as $sub) {
                    // Charger agents par company_id pour que le PC voie les agents de tous les services
                    $stmt_ag = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND company_id = ?");
                    $stmt_ag->execute([$sub['id'], $company_id]);
                    $agents_rows = $stmt_ag->fetchAll();

                    $agents = [];
                    foreach ($agents_rows as $agent) {
                        $agent['has_sp'] = (bool) $agent['has_sp'];
                        if (isset($agent['shift_history']) && is_string($agent['shift_history'])) {
                            $agent['shift_history'] = json_decode($agent['shift_history'], true) ?: [];
                        } else {
                            $agent['shift_history'] = [];
                        }
                        $stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                        $stmt_att->execute([$agent['id'], $period]);
                        $agent['attendance'] = $stmt_att->fetchAll() ?: [];
                        $agents[] = $agent;
                    }
                    $sub['agents'] = $agents;
                    $subsites[] = $sub;
                }

                $mutated_agents = [];
                $deployed_extras = [];

                $stmt_mut = $sqlite->prepare("
                   SELECT DISTINCT a.agent_id, ag.*
                   FROM attendance a
                   JOIN agents ag ON a.agent_id = ag.id
                   WHERE ag.company_id = ?
                   AND a.period = ?
                   AND (a.status LIKE ? OR a.status LIKE ? OR a.status LIKE ?)
               ");

                $like_m = 'M|' . $site_name;
                $like_ext = 'EXT%|' . $site_name;
                $like_rel = 'REL%|' . $site_name;

                $stmt_mut->execute([$company_id, $period, $like_m, $like_ext, $like_rel]);
                $mutated_rows = $stmt_mut->fetchAll();

                foreach ($mutated_rows as $agent) {
                    $stmt_orig = $sqlite->prepare("SELECT s.name, s.id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = ?");
                    $stmt_orig->execute([$agent['subsite_id']]);
                    $orig_site = $stmt_orig->fetch();

                    if ($orig_site && $orig_site['id'] !== $site_id) {
                        $stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                        $stmt_att->execute([$agent['id'], $period]);

                        $mutated_agent = $agent;
                        $mutated_agent['has_sp'] = (bool) $mutated_agent['has_sp'];
                        if (isset($mutated_agent['shift_history']) && is_string($mutated_agent['shift_history'])) {
                            $mutated_agent['shift_history'] = json_decode($mutated_agent['shift_history'], true) ?: [];
                        } else {
                            $mutated_agent['shift_history'] = [];
                        }
                        $mutated_agent['attendance'] = $stmt_att->fetchAll() ?: [];
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

                $site_data = $subsites;
            }
        }

        echo json_encode($site_data);
        break;

    case 'delete_user':
        requirePermission('services');
        $targetId = $data['id'] ?? null;
        if (!$targetId) {
            echo json_encode(['success' => false, 'error' => 'ID manquant']);
            break;
        }

        try {
            $sqlite = getDb();
            // Optionnel: on récupère l'email pour nettoyer les autres tables
            $stmt = $sqlite->prepare("SELECT email FROM users WHERE id = ?");
            $stmt->execute([$targetId]);
            $u = $stmt->fetch();

            if ($u) {
                $email = $u['email'];
                $sqlite->exec("BEGIN TRANSACTION");
                
                // Supprimer les tentatives de connexion
                $stmt1 = $sqlite->prepare("DELETE FROM login_attempts WHERE email = ?");
                $stmt1->execute([$email]);
                
                // Supprimer les messages
                $stmt2 = $sqlite->prepare("DELETE FROM messages WHERE sender = ?");
                $stmt2->execute([$email]);
                
                // Retirer l'assignation des tickets
                $stmt3 = $sqlite->prepare("UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?");
                $stmt3->execute([$email]);
                
                // Finalement, supprimer l'utilisateur
                $stmt4 = $sqlite->prepare("DELETE FROM users WHERE id = ?");
                $stmt4->execute([$targetId]);
                
                $sqlite->exec("COMMIT");
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if (isset($sqlite)) $sqlite->exec("ROLLBACK");
            echo json_encode(['success' => false, 'error' => 'Erreur: ' . $e->getMessage()]);
        }
        break;

    case 'add_agent':
        $site_id = (string) ($data['site_id'] ?? '');
        $subsite_id = (string) ($data['subsite_id'] ?? '');
        $name = $data['name'] ?? '';
        $function = $data['function'] ?? 'AS';
        $shift_type = $data['shift_type'] ?? 'Jour';
        $period = $data['period'] ?? '';

        $sqlite = getDb();
        $serviceKey = resolveCurrentServiceKeySql();
        $new_agent_id = uniqid();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        // Hériter de la configuration spéciale du comptable (fonction et salaire)
        $stmtSpecial = $sqlite->prepare("SELECT function, salary FROM agents WHERE name LIKE ? AND company_id = ? AND salary IS NOT NULL AND salary > 0 LIMIT 1");
        $stmtSpecial->execute([$name, $company_id]);
        $specialConfig = $stmtSpecial->fetch(PDO::FETCH_ASSOC);
        
        $salary = null;
        if ($specialConfig) {
            $function = $specialConfig['function'];
            $salary = $specialConfig['salary'];
        }

        $stmtAgent = $sqlite->prepare('INSERT INTO agents (id, name, function, shift_type, has_sp, hire_date, recruitment_cost, subsite_id, service_id, company_id, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmtAgent->execute([$new_agent_id, $name, $function, $shift_type, 0, date('Y-m-d'), 45000, $subsite_id, $serviceKey, $company_id, $salary]);

        $db = getScopedData($serviceKey);
        if ($period !== '') {
            applyShiftDefaultsForPeriod($db, $new_agent_id, $period, 'Jour');

            if (isset($db['attendance'][$period][$new_agent_id])) {
                $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
                foreach ($db['attendance'][$period][$new_agent_id] as $shift_code => $days) {
                    foreach ($days as $date => $status) {
                        $stmtAtt->execute([$new_agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
                    }
                }
            }
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'delete_agent':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent invalide']);
            break;
        }
        $sqlite = getDb();
        $sqlite->prepare("DELETE FROM agents WHERE id = ?")->execute([$agent_id]);
        $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ?")->execute([$agent_id]);

        $serviceKey = resolveCurrentServiceKeySql();
        $db = getScopedData($serviceKey);
        if (isset($db['attendance']) && is_array($db['attendance'])) {
            foreach ($db['attendance'] as $period_key => $agents_data) {
                if (isset($db['attendance'][$period_key][$agent_id])) {
                    unset($db['attendance'][$period_key][$agent_id]);
                }
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'delete_agent':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent invalide']);
            break;
        }
        $sqlite = getDb();
        $sqlite->prepare("DELETE FROM agents WHERE id = ?")->execute([$agent_id]);
        $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ?")->execute([$agent_id]);

        $serviceKey = resolveCurrentServiceKeySql();
        $db = getScopedData($serviceKey);
        if (isset($db['attendance']) && is_array($db['attendance'])) {
            foreach ($db['attendance'] as $period_key => $agents_data) {
                if (isset($db['attendance'][$period_key][$agent_id])) {
                    unset($db['attendance'][$period_key][$agent_id]);
                }
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'update_attendance':
        $agent_id = $data['agent_id'] ?? '';
        $date = $data['date'] ?? '';
        $shift_code = $data['shift_code'] ?? '';
        $status = $data['status'] ?? '';
        $period = $data['period'] ?? '';

        if (!$agent_id || !$date || !$shift_code || !$period) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        if ($status === '') {
            $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                ->execute([$agent_id, $date, $shift_code, $period]);
        } else {
            // On utilise un REPLACE en supposant que l'agent a une seule présence par agent/date/shift
            // Mais SQLite requiert que la contrainte d'unicité soit configurée.
            // Au cas où, on delete et on insère pour être robuste.
            $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?')
                ->execute([$agent_id, $date, $shift_code, $period]);
            $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
        }

        $db = getScopedData($serviceKey);
        if (!isset($db['attendance'][$period])) {
            $db['attendance'][$period] = [];
        }
        if (!isset($db['attendance'][$period][$agent_id])) {
            $db['attendance'][$period][$agent_id] = [];
        }
        if (!isset($db['attendance'][$period][$agent_id][$shift_code])) {
            $db['attendance'][$period][$agent_id][$shift_code] = [];
        }

        if ($status === '') {
            unset($db['attendance'][$period][$agent_id][$shift_code][$date]);
        } else {
            $db['attendance'][$period][$agent_id][$shift_code][$date] = $status;
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'bulk_update_attendance':
        $updates = $data['updates'] ?? [];
        if (!is_array($updates) || empty($updates)) {
            echo json_encode(['success' => false, 'message' => 'Aucune mise à jour fournie']);
            break;
        }

        $sqlite = getDb();
        $sqlite->exec('BEGIN TRANSACTION');
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;

        $stmtDel = $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?');
        $stmtIns = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        $db = getScopedData($serviceKey);

        foreach ($updates as $update) {
            $agent_id = $update['agent_id'] ?? '';
            $date = $update['date'] ?? '';
            $shift_code = $update['shift_code'] ?? '';
            $status = $update['status'] ?? '';
            $period = $update['period'] ?? '';

            if (!$agent_id || !$date || !$shift_code || !$period) {
                continue;
            }

            if ($status === '') {
                $stmtDel->execute([$agent_id, $date, $shift_code, $period]);
            } else {
                $stmtDel->execute([$agent_id, $date, $shift_code, $period]);
                $stmtIns->execute([$agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
            }

            if (!isset($db['attendance'][$period])) {
                $db['attendance'][$period] = [];
            }
            if (!isset($db['attendance'][$period][$agent_id])) {
                $db['attendance'][$period][$agent_id] = [];
            }
            if (!isset($db['attendance'][$period][$agent_id][$shift_code])) {
                $db['attendance'][$period][$agent_id][$shift_code] = [];
            }

            if ($status === '') {
                unset($db['attendance'][$period][$agent_id][$shift_code][$date]);
            } else {
                $db['attendance'][$period][$agent_id][$shift_code][$date] = $status;
            }
        }

        $sqlite->exec('COMMIT');

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;
    case 'apply_mutation':
        $agent_id = $data['agent_id'] ?? '';
        $start_date = $data['start_date'] ?? '';
        $destination_subsite_id = $data['destination_subsite_id'] ?? '';
        $destination_name = $data['destination_name'] ?? '';
        $new_shift_type = $data['new_shift_type'] ?? 'CONSERVER';
        $merge_mode = $data['merge_mode'] ?? 'smart';
        $period = $data['period'] ?? '';

        if (!$agent_id || !$start_date || !$destination_subsite_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $db = getScopedData($serviceKey);
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
        $start_day = (int) ($settings['cycle_start'] ?? 21);
        $end_day = (int) ($settings['cycle_end'] ?? 20);
        $datesList = getPeriodDates($period, $start_day, $end_day);

        if (empty($datesList)) {
            echo json_encode(['success' => false, 'message' => 'Période invalide']);
            break;
        }
        $end_date_str = end($datesList);
        $end_time = strtotime($end_date_str);
        $start_time = strtotime($start_date);

        if ($start_time > $end_time) {
            echo json_encode(['success' => false, 'message' => 'Date de début invalide']);
            break;
        }

        // Fetch original agent
        $stmtOrig = $sqlite->prepare("SELECT * FROM agents WHERE id = ? AND service_id = ?");
        $stmtOrig->execute([$agent_id, $serviceKey]);
        $orig_agent = $stmtOrig->fetch();
        if (!$orig_agent) {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
            break;
        }
        $actual_orig_stype = $orig_agent['shift_type'] ?: 'Jour';

        // Update shift type if requested
        if ($new_shift_type && $new_shift_type !== 'CONSERVER') {
            $orig_agent['shift_type'] = $new_shift_type;

            $current_history = [];
            if (!empty($orig_agent['shift_history'])) {
                $current_history = json_decode($orig_agent['shift_history'], true) ?: [];
            }

            if (empty($current_history)) {
                $current_history[] = ['type' => $actual_orig_stype, 'from' => '1970-01-01'];
            }

            $current_history[] = ['type' => $new_shift_type, 'from' => $start_date];

            $orig_agent['shift_history'] = json_encode($current_history);
        }

        // Duplicate agent
        $new_agent_id = 'ag_' . time() . '_' . rand(1000, 9999);
        $stmtDup = $sqlite->prepare("INSERT INTO agents (id, name, subsite_id, function, shift_type, company_id, service_id, shift_history, has_sp, hire_date, recruitment_cost, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtDup->execute([
            $new_agent_id,
            $orig_agent['name'],
            $destination_subsite_id,
            $orig_agent['function'],
            $orig_agent['shift_type'],
            $orig_agent['company_id'],
            $orig_agent['service_id'],
            $orig_agent['shift_history'],
            $orig_agent['has_sp'],
            $orig_agent['hire_date'] ?? null,
            $orig_agent['recruitment_cost'] ?? 0,
            $orig_agent['salary'] ?? 0
        ]);

        // Fetch origin site name (site + zone of the original agent)
        $orig_subsite_id = $orig_agent['subsite_id'] ?? '';
        $origin_label = '';
        if ($orig_subsite_id) {
            // Check special sites first
            $special_map = [
                'site_extras_1' => ['site' => '🌟 Vivier des Extras', 'zone' => 'Agents Disponibles'],
                'site_releves_1' => ['site' => '🔄 Vivier des relèves', 'zone' => 'Agents Disponibles'],
                'site_admin_1' => ['site' => '🏢 Administration', 'zone' => 'Bureau'],
            ];
            if (isset($special_map[$orig_subsite_id])) {
                $origin_label = $special_map[$orig_subsite_id]['site'] . ' - ' . $special_map[$orig_subsite_id]['zone'];
            } else {
                $stmtSubName = $sqlite->prepare("SELECT s.name as site_name, sub.name as zone_name FROM subsites sub JOIN sites s ON sub.site_id = s.id WHERE sub.id = ?");
                $stmtSubName->execute([$orig_subsite_id]);
                $origNames = $stmtSubName->fetch();
                if ($origNames) {
                    $origin_label = $origNames['site_name'] . ' - ' . $origNames['zone_name'];
                } else {
                    $origin_label = $orig_subsite_id;
                }
            }
        }

        if (!isset($db['attendance'][$period]))
            $db['attendance'][$period] = [];
        if (!isset($db['attendance'][$period][$agent_id]))
            $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];
        if (!isset($db['attendance'][$period][$new_agent_id]))
            $db['attendance'][$period][$new_agent_id] = ['J' => [], 'N' => []];

        $stmtInsert = $sqlite->prepare("INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtDelete = $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND date = ? AND shift_code = ?");

        $cursor = strtotime($datesList[0]);
        $stype = $orig_agent['shift_type'] ?: 'Jour';
        $cycle_counter = 0;

        while ($cursor <= $end_time) {
            $date_str = date('Y-m-d', $cursor);
            if ($cursor < $start_time) {
                // Avant mutation pour le nouvel agent — marquer avec le site d'origine
                $status_new = 'PM|' . $origin_label;

                if ($merge_mode === 'classic' || in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Jour') {
                    $db['attendance'][$period][$new_agent_id]['J'][$date_str] = $status_new;
                    $stmtDelete->execute([$new_agent_id, $date_str, 'J']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'J', $status_new, $company_id, $serviceKey, $period]);
                }

                if ($merge_mode === 'classic' || in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Nuit') {
                    $db['attendance'][$period][$new_agent_id]['N'][$date_str] = $status_new;
                    $stmtDelete->execute([$new_agent_id, $date_str, 'N']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'N', $status_new, $company_id, $serviceKey, $period]);
                }
            } else {
                // Après mutation
                $status_old = 'M|' . $destination_name;

                if (in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Jour') {
                    $db['attendance'][$period][$agent_id]['J'][$date_str] = $status_old;
                    $stmtDelete->execute([$agent_id, $date_str, 'J']);
                    $stmtInsert->execute([$agent_id, $date_str, 'J', $status_old, $company_id, $serviceKey, $period]);
                }
                if (in_array(strtolower($actual_orig_stype), ['24h', '48h', '72h']) || $actual_orig_stype === 'Nuit') {
                    $db['attendance'][$period][$agent_id]['N'][$date_str] = $status_old;
                    $stmtDelete->execute([$agent_id, $date_str, 'N']);
                    $stmtInsert->execute([$agent_id, $date_str, 'N', $status_old, $company_id, $serviceKey, $period]);
                }
                if ($stype === 'Nuit') {
                    $db['attendance'][$period][$new_agent_id]['N'][$date_str] = '1';
                    $stmtDelete->execute([$new_agent_id, $date_str, 'N']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'N', '1', $company_id, $serviceKey, $period]);
                } elseif ($stype === 'Jour') {
                    $db['attendance'][$period][$new_agent_id]['J'][$date_str] = '1';
                    $stmtDelete->execute([$new_agent_id, $date_str, 'J']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'J', '1', $company_id, $serviceKey, $period]);
                } else {
                    $cycle = 1;
                    $work = 1;
                    $stype_lower = strtolower($stype);
                    if ($stype_lower === '24h') {
                        $cycle = 2;
                        $work = 1;
                    } elseif ($stype_lower === '48h') {
                        $cycle = 4;
                        $work = 2;
                    } elseif ($stype_lower === '72h') {
                        $cycle = 6;
                        $work = 3;
                    }

                    $pos = $cycle_counter % $cycle;
                    $val = ($pos < $work) ? '1' : 'R';

                    $db['attendance'][$period][$new_agent_id]['J'][$date_str] = $val;
                    $db['attendance'][$period][$new_agent_id]['N'][$date_str] = $val;

                    $stmtDelete->execute([$new_agent_id, $date_str, 'J']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'J', $val, $company_id, $serviceKey, $period]);

                    $stmtDelete->execute([$new_agent_id, $date_str, 'N']);
                    $stmtInsert->execute([$new_agent_id, $date_str, 'N', $val, $company_id, $serviceKey, $period]);

                    $cycle_counter++;
                }
            }
            $cursor = strtotime('+1 day', $cursor);
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'apply_batch_rotation':
        $agent_id = $data['agent_id'] ?? '';
        $site_id = (string) ($data['site_id'] ?? '');
        $period = $data['period'] ?? '';
        $cycle = (int) ($data['cycle'] ?? 0);
        $work = (int) ($data['work'] ?? 0);
        $offset = (int) ($data['offset'] ?? 0);
        $serviceKey = $_SESSION['service_id'] ?? null;
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        if (!$agent_id || !$period || $cycle <= 0) {
            echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

        $sqlite = getDb();
        $db = getScopedData($serviceKey);
        $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
        $start_day = (int) ($settings['cycle_start'] ?? 21);
        $end_day = (int) ($settings['cycle_end'] ?? 20);

        $stype = $data['shift_type'] ?? '';

        if (!$stype) {
            $stmt = $sqlite->prepare("SELECT shift_type FROM agents WHERE id = ?");
            $stmt->execute([$agent_id]);
            $res = $stmt->fetch();
            $stype = $res['shift_type'] ?? 'Jour';
        } else {
            $stmt = $sqlite->prepare("UPDATE agents SET shift_type = ? WHERE id = ?");
            $stmt->execute([$stype, $agent_id]);
        }

        // Avant de supprimer, on sauvegarde les MAP/CP/AT existants pour cet agent sur cette période
        $stmtFuture = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ? AND status IN ('MAP', 'CP', 'AT', 'M')");
        $stmtFuture->execute([$agent_id, $period]);
        $future_rows = $stmtFuture->fetchAll();
        $future_att = [];
        foreach ($future_rows as $row) {
            $future_att[$row['shift_code']][$row['date']] = $row['status'];
        }

        if (!isset($db['attendance'][$period]))
            $db['attendance'][$period] = [];
        $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];

        $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND period = ?')->execute([$agent_id, $period]);
        $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');

        $datesList = getPeriodDates($period, $start_day, $end_day);

        foreach ($datesList as $i => $t_str) {
            $pos = ($i - $offset) % $cycle;
            if ($pos < 0)
                $pos += $cycle;

            $genJ = null;
            $genN = null;

            if ($pos < $work) {
                if ($stype === 'Nuit') {
                    $genN = '1';
                } elseif ($stype === 'Jour') {
                    $genJ = '1';
                } else {
                    $genJ = '1';
                    $genN = '1';
                }
            } else {
                if ($stype !== 'Jour' && $stype !== 'Nuit') {
                    $genJ = 'R';
                    $genN = 'R';
                } else {
                    if ($stype === 'Nuit')
                        $genN = 'R';
                    else
                        $genJ = 'R';
                }
            }

            // Restaurer MAP si besoin
            if ($genJ !== null) {
                if (isset($future_att['J'][$t_str]))
                    $genJ = $future_att['J'][$t_str];
                $db['attendance'][$period][$agent_id]['J'][$t_str] = $genJ;
                $stmtAtt->execute([$agent_id, $t_str, 'J', $genJ, $company_id, $serviceKey, $period]);
            }
            if ($genN !== null) {
                if (isset($future_att['N'][$t_str]))
                    $genN = $future_att['N'][$t_str];
                $db['attendance'][$period][$agent_id]['N'][$t_str] = $genN;
                $stmtAtt->execute([$agent_id, $t_str, 'N', $genN, $company_id, $serviceKey, $period]);
            }
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'update_agent_profile':
        $agent_id = $data['agent_id'] ?? '';
        $profile_data = $data['profile_data'] ?? [];
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE agents SET profile_data = ? WHERE id = ?");
        $stmt->execute([json_encode($profile_data), $agent_id]);

        if (isset($data['name'])) {
            $sqlite->prepare("UPDATE agents SET name = ? WHERE id = ?")->execute([$data['name'], $agent_id]);
        }
        if (isset($data['salary'])) {
            $sqlite->prepare("UPDATE agents SET salary = ? WHERE id = ?")->execute([$data['salary'], $agent_id]);
        }

        echo json_encode(['success' => true]);
        break;

    case 'update_agent_info':
        $agent_id = $data['agent_id'] ?? 0;
        $field = $data['field'] ?? '';
        $value = $data['value'] ?? '';
        $period = $data['period'] ?? '';
        $serviceKey = $_SESSION['service_id'] ?? null;
        $sqlite = getDb();
        if (in_array($field, ['function', 'shift_type', 'has_sp'])) {
            $val = $value;
            if ($field === 'has_sp') {
                $val = ($value === 'true' || $value === true || $value === 1 || $value === '1') ? 1 : 0;
            }
            $stmt = $sqlite->prepare("UPDATE agents SET {$field} = ? WHERE id = ?");
            $stmt->execute([$val, $agent_id]);

            if ($field === 'shift_type' && $period) {
                $db = getScopedData($serviceKey);
                applyShiftDefaultsForPeriod($db, $agent_id, $period, $value);

                // Reset shift_history to match this new permanent shift
                $new_history = [
                    ['from' => '2000-01-01', 'type' => $value]
                ];
                $sqlite->prepare("UPDATE agents SET shift_history = ? WHERE id = ?")
                    ->execute([json_encode($new_history), $agent_id]);

                // Also apply to SQLite directly using the new array state
                if (isset($db['attendance'][$period][$agent_id])) {
                    $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND period = ?')->execute([$agent_id, $period]);
                    $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
                    foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                        foreach ($days as $date => $status) {
                            $stmtAtt->execute([$agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
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

        case 'get_fluctuation_analytics':
        $period = $_GET['period'] ?? date('Y-m');
        $serviceKey = resolveCurrentServiceKeySql();
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $start_day = (int)($settingsRow['cycle_start'] ?? 21);
        $end_day   = (int)($settingsRow['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);
        
        $gridRaw = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id=?");
        $gridRaw->execute([$companyId]);
        $salary_config = [];
        foreach ($gridRaw->fetchAll() as $r) $salary_config[$r['poste']] = (int)$r['taux_horaire'];

        $contractsRaw = $sqlite->prepare("SELECT site_name, budget_mensuel, charges_percent, frais_fixes FROM site_contracts WHERE company_id=?");
        $contractsRaw->execute([$companyId]);
        $site_contracts = [];
        foreach ($contractsRaw->fetchAll() as $r) $site_contracts[$r['site_name']] = $r;

        $varsRaw = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $varsRaw->execute([$companyId, $period]);
        $monthly_vars = $varsRaw->fetch(PDO::FETCH_ASSOC) ?: ['primes_globales' => 0, 'charges_globales_percent' => 0];

        $stmtAg = $sqlite->prepare("SELECT a.*, s.name as site_name FROM agents a LEFT JOIN subsites sub ON a.subsite_id = sub.id LEFT JOIN sites s ON sub.site_id = s.id WHERE a.service_id = ? ORDER BY a.name");
        $stmtAg->execute([$serviceKey]);
        $allAgents = $stmtAg->fetchAll();

        $base_masse = $discipline_impact = $activite_impact = $recrutement_impact = $depart_impact = $primes_impact = $advances_impact = 0;
        $recruits_list = $departs_list = $sites_rentability = [];

        foreach ($allAgents as $agent) {
            $agent_id  = $agent['id'];
            $func_id   = $agent['function'] ?? 'AS';
            $site_name = $agent['site_name'] ?? 'Non affecté';
            $base = isset($salary_config[$func_id]) && $salary_config[$func_id] > 0 ? $salary_config[$func_id] : 75000;

            if (!isset($sites_rentability[$site_name])) {
                $sites_rentability[$site_name] = [
                    'name' => $site_name, 'agent_count' => 0, 'salary_expense' => 0,
                    'contract_revenue' => (int)($site_contracts[$site_name]['budget_mensuel'] ?? 0),
                    'charges_percent' => (float)($site_contracts[$site_name]['charges_percent'] ?? $monthly_vars['charges_globales_percent']),
                    'frais_fixes' => (int)($site_contracts[$site_name]['frais_fixes'] ?? 0)
                ];
            }
            if (!empty($agent['hire_date']) && strpos($agent['hire_date'], $period) === 0) {
                $cost = $base + (int)($agent['recruitment_cost'] ?? 0);
                $recrutement_impact += $cost;
                $recruits_list[] = ['name' => $agent['name'], 'site' => $site_name, 'cost' => $cost];
            }
            if (!empty($agent['exit_date']) && strpos($agent['exit_date'], $period) === 0) {
                $depart_impact += $base;
                $departs_list[] = ['name' => $agent['name'], 'site' => $site_name, 'savings' => $base];
                continue;
            }
            $base_masse += $base;
            $stmtAtt = $sqlite->prepare("SELECT shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
            $stmtAtt->execute([$agent_id, $period]);
            $attRows = $stmtAtt->fetchAll();
            $absences = $sp_count = 0;
            foreach ($attRows as $row) {
                if ($row['status'] === 'A') $absences++;
                if (in_array($row['shift_code'], ['S', 'SJ', 'SN']) && !in_array($row['status'], ['', 'A', 'R'])) $sp_count++;
            }
            $deductions = (int)round($absences * ($base / 30));
            $gains      = (int)round($sp_count * ($base / 30));
            $discipline_impact += $deductions;
            $activite_impact   += $gains;
            $sites_rentability[$site_name]['agent_count']++;
            $sites_rentability[$site_name]['salary_expense'] += ($base - $deductions + $gains);
        }

        $stmtAdj = $sqlite->prepare("SELECT aa.*, a.name as agent_name FROM agent_adjustments aa LEFT JOIN agents a ON aa.agent_id = a.id WHERE aa.company_id = ? AND aa.period = ?");
        $stmtAdj->execute([$companyId, $period]);
        $adjRows = $stmtAdj->fetchAll();
        $period_adjustments = [];
        foreach ($adjRows as $adj) {
            $val = (int)($adj['amount'] ?? 0);
            if (in_array($adj['type'] ?? '', ['AVANCE', 'RETENUE'])) { $advances_impact += $val; } else { $primes_impact += $val; }
            $period_adjustments[] = ['id' => $adj['id'], 'agent_id' => $adj['agent_id'], 'agent_name' => $adj['agent_name'] ?? 'Inconnu', 'type' => $adj['type'], 'value' => $val, 'comment' => $adj['comment'] ?? '', 'date_application' => $adj['date_application'] ?? ''];
        }

        $primes_impact += (int)$monthly_vars['primes_globales'];

        foreach ($sites_rentability as &$siteData) {
            $siteData['charges_patronales'] = (int)($siteData['salary_expense'] * ($siteData['charges_percent'] / 100));
            $siteData['total_cost'] = $siteData['salary_expense'] + $siteData['charges_patronales'] + $siteData['frais_fixes'];
            $siteData['net_margin'] = $siteData['contract_revenue'] - $siteData['total_cost'];
            $siteData['margin_percent'] = $siteData['contract_revenue'] > 0 ? round(($siteData['net_margin'] / $siteData['contract_revenue']) * 100, 1) : 0;
            $siteData['is_alert'] = $siteData['total_cost'] > ($siteData['contract_revenue'] * 0.8);
        }

        $total_real = $base_masse + $recrutement_impact - $depart_impact + $activite_impact - $discipline_impact + $primes_impact - $advances_impact;
        
        $total_charges = array_sum(array_column($sites_rentability, 'charges_patronales'));
        $total_frais = array_sum(array_column($sites_rentability, 'frais_fixes'));
        $total_revenues = array_sum(array_column($sites_rentability, 'contract_revenue'));
        
        $company_total_cost = $total_real + $total_charges + $total_frais;
        $company_net_margin = $total_revenues - $company_total_cost;

        echo json_encode([
            'period' => $period, 
            'base_masse_salariale' => $base_masse,
            'recrutement_impact' => $recrutement_impact, 'recruits_list' => $recruits_list,
            'depart_impact' => $depart_impact, 'departs_list' => $departs_list,
            'activite_impact' => $activite_impact, 'discipline_impact' => $discipline_impact,
            'primes_impact' => $primes_impact, 'advances_impact' => $advances_impact,
            'total_real_masse_salariale' => $total_real,
            'sites_rentability' => array_values($sites_rentability),
            'manual_adjustments' => $period_adjustments,
            'company_metrics' => [
                'total_cost' => $company_total_cost,
                'net_margin' => $company_net_margin,
                'total_revenues' => $total_revenues
            ],
            'agents' => array_map(fn($a) => ['id' => $a['id'], 'name' => $a['name'], 'site' => $a['site_name'] ?? ''], $allAgents)
        ]);
        break;

case 'get_settings':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $settings = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        echo json_encode($settings);
        break;

    case 'get_functions':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        // Clé partagee entre toute l'entreprise
        $company_key = 'company::' . $company_id;
        $functions = getServiceDataSql($company_key, 'functions', []);
        // Fallback: ancienne clé directe company_id si aucune donnée trouvée
        if (empty($functions)) {
            $functions = getServiceDataSql($company_id, 'functions', []);
        }
        echo json_encode(['success' => true, 'functions' => $functions]);
        break;

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
        $stmtGrid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ?");
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
        $stmt = $sqlite->prepare("INSERT INTO salary_grid (company_id, poste, taux_horaire) VALUES (?, ?, ?) ON CONFLICT(company_id, poste) DO UPDATE SET taux_horaire=excluded.taux_horaire");
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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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

                $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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

    case 'get_messages':
        $db = getScopedData($serviceKey);
        echo json_encode(array_slice($db['messages'] ?? [], 0, 20));
        break;

    case 'init_next_period':
        $current_period = $data['current_period'] ?? '';
        $next_period = $data['next_period'] ?? '';

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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

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

        // Récupérer tous les agents actifs de ce service (non archivés)
        $stmtAgents = $sqlite->prepare("SELECT id FROM agents WHERE service_id = ? AND archived_period IS NULL");
        $stmtAgents->execute([$serviceKey]);
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
        $stmtFuture = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE period = ? AND service_id = ? AND status IN ('MAP', 'CP', 'AT', 'M')");
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

        // Récupérer les shift_type de tous les agents en une requête
        $stmtShifts = $sqlite->prepare("SELECT id, shift_type FROM agents WHERE service_id = ? AND archived_period IS NULL");
        $stmtShifts->execute([$serviceKey]);
        $shift_rows = $stmtShifts->fetchAll();
        $agent_shift_types = [];
        foreach ($shift_rows as $sr) {
            $agent_shift_types[$sr['id']] = $sr['shift_type'] ?? 'Jour';
        }

        $nb_old = count($old_dates);

        foreach ($all_agents as $agent_id) {
            $shifts = $old_att[$agent_id] ?? [];
            $shift_type = $agent_shift_types[$agent_id] ?? 'Jour';

            // Vérifier si l'agent est muté sortant (dernier jour = M|...)
            $isMutatedOut = false;
            foreach (['J', 'N'] as $sc) {
                $last_val = $shifts[$sc][$last_old_d] ?? '';
                if (strpos($last_val, 'M|') === 0) {
                    $isMutatedOut = true;
                    break;
                }
            }

            if ($isMutatedOut) {
                $agentsToArchive[] = $agent_id;
                continue;
            }

            // Vérifier si c'est un agent fraîchement muté entrant (PM|... dans le mois courant)
            $isNewMutatedAgent = false;
            foreach (['J', 'N'] as $sc) {
                foreach (($shifts[$sc] ?? []) as $v) {
                    if (strpos($v, 'PM|') === 0) {
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
                    $hasActivity = true;
                    break;
                }
            }
            if (!$hasActivity && !$isNewMutatedAgent)
                continue;

            // Déterminer les shift_codes à traiter
            $shift_codes_to_fill = [];
            if ($shift_type_lower === 'jour')
                $shift_codes_to_fill = ['J'];
            elseif ($shift_type_lower === 'nuit')
                $shift_codes_to_fill = ['N'];
            else
                $shift_codes_to_fill = ['J', 'N']; // rotatif J et N

            foreach ($shift_codes_to_fill as $shift_code) {
                $last_val = $shifts[$shift_code][$last_old_d] ?? '';
                $isActiveAtEnd = ($last_val === '1' || $last_val === 'A' || $last_val === 'CP'
                    || $last_val === 'AT' || $last_val === 'R' || strpos($last_val, 'PM|') === 0);

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
                                if (strpos($prev_val, 'M|') === 0 || strpos($prev_val, 'PM|') === 0)
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
                        // --- Logique Jour / Nuit : présence sauf jour de repos hebdo ---
                        $day_of_week = (int) (new DateTime($new_d))->format('w');
                        if ($repos_day_of_week >= 0 && $day_of_week === $repos_day_of_week) {
                            $status = 'R';
                        } else {
                            $status = '1';
                        }
                    } else {
                        // Fallback : présence par défaut
                        $status = '1';
                    }

                    if ($status !== null) {
                        // Restaurer les données futures pré-enregistrées (comme une MAP anticipée)
                        if (isset($future_att[$agent_id][$shift_code][$new_d])) {
                            $status = $future_att[$agent_id][$shift_code][$new_d];
                        }
                        $stmtIns->execute([$agent_id, $new_d, $shift_code, $status, $company_id, $serviceKey, $next_period]);
                    }
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
        // Pour les sites spéciaux (site_extras, site_releves, site_administration), on doit inclure les sous-sites générés par défaut
        if ($site_id === 'site_extras') {
            $subsite_ids = ['site_extras_1'];
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
            if (!in_array($site_id, ['site_extras', 'site_releves', 'site_administration'])) {
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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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
            $db = getScopedData($serviceKey);
            $leaves = $db['leaves'] ?? [];
            $db['leaves'] = array_filter($leaves, function($l) use ($leave_id) { return $l['id'] !== $leave_id; });
            saveScopedData($db, $serviceKey);
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

        // 4. Save to agent_users.json
        $file = __DIR__ . '/agent_users.json';
        if (!file_exists($file)) file_put_contents($file, json_encode([]));
        $users = json_decode(file_get_contents($file), true);
        if (!is_array($users)) $users = [];

        // Check if already registered
        foreach ($users as $u) {
            if ($u['agent_id'] === $agent_id) {
                echo json_encode(['success' => false, 'message' => 'Un compte existe déjà ou est en attente pour cet agent.']);
                exit;
            }
        }

        $users[] = [
            'id' => 'u_' . time(),
            'service_id' => $agent_service_id,
            'agent_id' => $agent_id,
            'name' => $foundAgent['name'],
            'matricule' => $foundAgent['matricule'] ?? $agent_id,
            'phone' => $phone,
            'dob' => $dob,
            'pin' => password_hash($pin, PASSWORD_DEFAULT),
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s')
        ];
        file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));

        echo json_encode(['success' => true, 'message' => 'Inscription réussie ! Votre compte est en attente de validation par le service Planning.']);
        break;

    case 'login_agent_portal':
        $matricule = $data['matricule'] ?? '';
        $pin = $data['pin'] ?? '';

        $file = __DIR__ . '/agent_users.json';
        if (!file_exists($file)) {
            echo json_encode(['success' => false, 'message' => 'Aucun compte enregistré. Veuillez vous inscrire d\'abord.']);
            break;
        }
        $users = json_decode(file_get_contents($file), true);
        if (!is_array($users)) $users = [];
        
        $foundUser = null;
        foreach ($users as $u) {
            if ($u['matricule'] === $matricule || $u['phone'] === $matricule || $u['agent_id'] === $matricule || strtolower($u['name']) === strtolower($matricule)) {
                $foundUser = $u;
                break;
            }
        }

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
        $file = __DIR__ . '/agent_users.json';
        $users = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        if (!is_array($users)) $users = [];
        // Show all registrations for the admin's service (or ALL if super_admin)
        $role = $_SESSION['user_role'] ?? '';
        if ($role === 'super_admin') {
            $serviceUsers = $users;
        } else {
            $serviceUsers = array_filter($users, function($u) use ($adminServiceKey) { return ($u['service_id'] ?? '') === $adminServiceKey; });
        }
        echo json_encode(['success' => true, 'registrations' => array_values($serviceUsers)]);
        break;

    case 'update_portal_registration':
        $user_id = $data['user_id'] ?? '';
        $status = $data['status'] ?? '';
        $adminServiceKey = $_SESSION['service_id'] ?? '';

        $file = __DIR__ . '/agent_users.json';
        if (!file_exists($file)) {
            echo json_encode(['success' => false, 'message' => 'Aucun compte enregistré']);
            break;
        }
        $users = json_decode(file_get_contents($file), true);
        if (!is_array($users)) $users = [];
        $changed = false;
        foreach ($users as &$u) {
            if ($u['id'] === $user_id) {
                $u['status'] = $status;
                $changed = true;
                break;
            }
        }
        unset($u);

        if ($changed) {
            file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Compte introuvable']);
        }
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





    case 'get_salaries':
        $period = $_GET['period'] ?? date('Y-m');
        $sqlite = getDb();
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

        $salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);
        echo json_encode($salaries);
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
        $db = getScopedData($serviceKey);
        $settings = $db['payroll_settings'] ?? [
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
        if (($_SESSION['user_role'] ?? '') != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $db = getScopedData($serviceKey);
        $db['payroll_settings'] = $data['settings'] ?? [];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
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
        $db = getScopedData($serviceKey);
        $leaves = $db['leaves'] ?? [];
        echo json_encode(['success' => true, 'leaves' => $leaves]);
        break;

    case 'save_leave':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $db = getScopedData($serviceKey);
        $leaves = $db['leaves'] ?? [];
        $leave = $data['leave'] ?? null;
        if (!$leave || !$leave['id']) {
            echo json_encode(['success' => false, 'message' => 'Données de congé manquantes']);
            break;
        }
        $found = false;
        foreach ($leaves as &$l) {
            if ($l['id'] === $leave['id']) {
                $l = $leave;
                $found = true;
                break;
            }
        }
        unset($l);
        if (!$found) $leaves[] = $leave;
        $db['leaves'] = $leaves;
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'delete_leave':
        if (($_SESSION['user_role'] ?? '') != 'admin' && strpos(strtolower($_SESSION['user_service'] ?? ''), 'rh') === false) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $db = getScopedData($serviceKey);
        $leaves = $db['leaves'] ?? [];
        $leave_id = $data['leave_id'] ?? '';
        $leaves = array_values(array_filter($leaves, function($l) use ($leave_id) { return $l['id'] !== $leave_id; }));
        $db['leaves'] = $leaves;
        saveScopedData($db, $serviceKey);
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

    case 'get_functions':
        $companyKey = $_SESSION['company_id'] ?? 'comp_default_1';
        $company_key = 'company::' . $companyKey;
        $funcs = getServiceDataSql($company_key, 'functions', []);
        // Fallback: ancienne clé directe company_id si aucune donnée trouvée
        if (empty($funcs)) {
            $funcs = getServiceDataSql($companyKey, 'functions', []);
        }
        echo json_encode(['success' => true, 'functions' => $funcs]);
        break;

    case 'save_functions':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? 'comp_default_1';
        $company_key = 'company::' . $companyKey;
        $funcs2 = $data['functions'] ?? [];
        // Sauvegarde sous la clé company:: (partagée entre tous les services)
        setServiceDataSql($company_key, 'functions', $funcs2);
        // Mise à jour aussi de l'ancienne clé pour compatibilité
        setServiceDataSql($companyKey, 'functions', $funcs2);
        echo json_encode(['success' => true]);
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
                $has_releves = false;
                $has_admin = false;
                foreach ($sites as $s) {
                    if ($s['id'] === 'site_extras') $has_extras = true;
                    if ($s['id'] === 'site_releves') $has_releves = true;
                    if ($s['id'] === 'site_administration') $has_admin = true;
                }
                if (!$has_extras) $sites[] = ['id' => 'site_extras', 'name' => '🌟 Vivier des Extras'];
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
                $stmtIns = $sqlite->prepare("INSERT INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data");
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

        echo json_encode(['success' => true]);
        break;

    case 'unpublish_period':
        $period = $data['period'] ?? '';
        if (!$period) {
            echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $published = getServiceDataSql($companyKey, 'published_periods', []);
        $published = array_values(array_filter($published, fn($p) => $p !== $period));
        setServiceDataSql($companyKey, 'published_periods', $published);
        
        // Remove latest_publication ONLY if we are unpublishing the latest one
        $pubData = getServiceDataSql($companyKey, 'latest_publication', null);
        if ($pubData && ($pubData['period'] ?? '') === $period) {
            setServiceDataSql($companyKey, 'latest_publication', null);
            setServiceDataSql($companyKey, 'latest_feedback', null);
        }

        // Supprimer aussi l'archive liée pour le test
        $sqlite = getDb();
        $sqlite->exec("DELETE FROM archives");

        echo json_encode(['success' => true]);
        break;

    case 'get_published_periods':
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? null;
        $scope = $_GET['scope'] ?? 'service';
        $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        $target_col = ($scope === 'company') ? 'company_id' : 'service_id';

        // get published periods from the company level if scope is company
        $published = getServiceDataSql($target_val, 'published_periods', []);
        // Also check if they had any saved locally for backward compatibility
        if ($scope === 'company' && empty($published)) {
            $published = getServiceDataSql($serviceKey, 'published_periods', []);
        }

        // Fetch archived payrolls from SQLite
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id FROM archives WHERE $target_col = ? AND id LIKE 'payroll_%'");
        $stmt->execute([$target_val]);
        $archived_rows = $stmt->fetchAll();
        $archived = array_map(function ($r) {
            return substr($r['id'], 8);
        }, $archived_rows);

        $latestPub = getServiceDataSql($companyKey, 'latest_publication', null);

        echo json_encode([
            'success' => true, 
            'published_periods' => $published, 
            'archived_periods' => $archived,
            'latest_publication' => $latestPub
        ]);
        break;

    case 'get_latest_publication':
        $companyKey = $_SESSION['company_id'] ?? null;
        if (!$companyKey) {
            echo json_encode(['success' => false, 'publication' => null]);
            break;
        }
        $pubData = getServiceDataSql($companyKey, 'latest_publication', null);
        echo json_encode(['success' => true, 'publication' => $pubData]);
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

    case 'get_fluctuation_analytics':
        $period = $_GET['period'] ?? date('Y-m');
        $serviceKey = resolveCurrentServiceKeySql();
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        
        // Données temporaires pour débloquer l'interface pendant que la logique SQL est finalisée
        $dataAnalytics = [
            'base_masse_salariale' => 15000000,
            'recrutement_impact' => 500000,
            'depart_impact' => 200000,
            'activite_impact' => 1200000,
            'discipline_impact' => 150000,
            'primes_impact' => 450000,
            'total_real_masse_salariale' => 16800000,
            'advances_impact' => 0,
            'recruits_list' => ['Agent A', 'Agent B'],
            'departs_list' => ['Agent C'],
            'sites_rentability' => [
                [
                    'name' => 'Siège Principal',
                    'contract_revenue' => 5000000,
                    'salary_expense' => 2500000
                ],
                [
                    'name' => 'Entrepôt Nord',
                    'contract_revenue' => 2000000,
                    'salary_expense' => 1800000
                ],
                [
                    'name' => 'Site Temporaire',
                    'contract_revenue' => 0,
                    'salary_expense' => 900000
                ]
            ]
        ];
        echo json_encode($dataAnalytics);
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
        
        $vars = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $vars->execute([$companyId, $period]);
        
        echo json_encode([
            'success' => true,
            'grid' => $grid->fetchAll(PDO::FETCH_ASSOC),
            'contracts' => $contracts->fetchAll(PDO::FETCH_ASSOC),
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
        $recs = getReclamations();
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
            $res = addReclamation($record);
        }
        echo json_encode(['success' => true, 'reclamation' => $res]);
        break;

    case 'get_reclamations':
        $recs = getReclamations();
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

            if ($hasAbandon) {
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

    default:
        echo json_encode(['error' => 'Action inconnue']);
}