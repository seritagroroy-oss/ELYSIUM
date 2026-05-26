<?php
session_start();
include 'db.php';
require_once __DIR__ . '/backend/database.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'");

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
           if ($valid) return $switched;
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

function getScopedData(&$serviceKey)
{
   $db = getData();
   $serviceKey = resolveCurrentServiceKey($db);
   hydrateScopedData($db, $serviceKey);
   return $db;
}

function saveScopedData($db, $serviceKey)
{
   persistScopedData($db, $serviceKey);
   return saveData($db);
}

$publicActions = ['login', 'logout', 'set_lang', 'register', 'cinetpay_notify', 'get_payment_providers', 'get_user_info'];
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

// Validation CSRF sur les requêtes non-publiques et mutantes (en dehors de GET)
$mutatingActions = ['add_site', 'add_special_site', 'update_site_icon', 'add_subsite', 'rename_site', 'rename_subsite', 'delete_subsite', 'add_agent', 'delete_agent', 'apply_mutation', 'update_attendance', 'bulk_update_attendance', 'init_site_period', 'apply_batch_rotation', 'update_agent_info', 'clear_site_mutations', 'archive_all_sites', 'delete_archive', 'update_agent_salary', 'update_salary_config', 'save_functions', 'publish_period', 'send_message', 'resolve_ticket', 'create_ticket', 'delete_message', 'pin_message', 'rate_ticket', 'assign_ticket'];
if (in_array($action, $mutatingActions, true)) {
    $providedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $data['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $providedToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Erreur CSRF: Token invalide']);
        exit;
    }
}

$permissionByAction = [
   'get_dashboard_init' => 'can_view_dashboard',
   'get_sites' => 'can_view_dashboard',
   'get_site_data' => 'can_view_dashboard',
   'add_subsite' => 'can_edit_dashboard',
   'rename_subsite' => 'can_edit_dashboard',
   'delete_subsite' => 'can_edit_dashboard',
   'add_agent' => 'can_edit_dashboard',
   'delete_agent' => 'can_edit_dashboard',
   'apply_mutation' => 'can_edit_dashboard',
   'update_attendance' => 'can_edit_dashboard',
   'bulk_update_attendance' => 'can_edit_dashboard',
   'init_site_period' => 'can_edit_dashboard',
   'apply_batch_rotation' => 'can_edit_dashboard',
   'update_agent_info' => 'can_edit_dashboard',
   'clear_site_mutations' => 'can_edit_dashboard',
   'update_site_icon' => 'can_edit_dashboard',
   'archive_all_sites' => 'can_edit_dashboard',
   'get_archives' => 'can_view_archives',
   'get_archive_detail' => 'can_view_archives',
   'get_messages' => 'can_view_archives',
   'get_salaries' => 'can_view_salaries',
   'get_all_agents' => 'can_view_salaries',
   'get_fluctuation_analytics' => 'can_view_salaries',
   'save_manual_adjustment' => 'can_view_salaries',
   'delete_manual_adjustment' => 'can_view_salaries',
   'save_site_revenue' => 'can_view_salaries'
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
           if ((int)$date_obj->format('w') === $random_rest_day) {
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

function updateUserActivity(&$db, $email) {
    if (!$email || !isset($db['users'][$email])) return false;
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

       if ($user && password_verify($password, $user['password'])) {
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
        $db = getData();
        $fresh_permissions = getUserPermissionsByEmail($email);
        $_SESSION['permissions'] = $fresh_permissions;
        
        $user_data = [
            'email' => $email,
            'name' => $_SESSION['user_name'] ?? 'Utilisateur',
            'service' => $_SESSION['user_service'] ?? 'Service',
            'role' => $_SESSION['user_role'] ?? 'user',
            'role_display_name' => $_SESSION['role_display_name'] ?? '',
            'company_id' => $_SESSION['company_id'] ?? '',
            'permissions' => $fresh_permissions
        ];
        if (($_SESSION['user_role'] ?? '') === 'super_admin') {
            $user_data['all_services'] = $db['services'] ?? [];
            $user_data['switched_service_id'] = $_SESSION['switched_service_id'] ?? '';
        } elseif (($_SESSION['user_role'] ?? '') === 'admin') {
            $my_company_id = $_SESSION['company_id'] ?? '';
            $user_data['all_services'] = array_filter($db['services'] ?? [], function($s) use ($my_company_id) {
                return ($s['company_id'] ?? '') === $my_company_id;
            });
            $user_data['all_services'] = array_values($user_data['all_services']);
            $user_data['switched_service_id'] = $_SESSION['switched_service_id'] ?? '';
        }
        echo json_encode([
            'success' => true,
            'user' => $user_data,
            'subscription' => $subscription
        ]);
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
            $db = getData();
            $my_company_id = $_SESSION['company_id'] ?? '';
            $valid = false;
            foreach ($db['services'] ?? [] as $svc) {
                if ($svc['id'] === $target_service_id && ($svc['company_id'] ?? '') === $my_company_id) {
                    $valid = true;
                    break;
                }
            }
            if (!$valid) {
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
        $db = getData();
        echo json_encode(['success' => true, 'companies' => $db['companies'] ?? []]);
        break;

    case 'get_all_users':
        $req_role = $_SESSION['user_role'] ?? '';
        if ($req_role !== 'super_admin' && $req_role !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $req_company_id = $_SESSION['company_id'] ?? '';
        $db = getData();
        $users_list = [];
        foreach ($db['users'] as $email => $u) {
            // If admin, only show users of the same company
            if ($req_role === 'admin' && ($u['company_id'] ?? '') !== $req_company_id) {
                continue;
            }
            $users_list[] = [
                'email' => $email,
                'name' => $u['name'] ?? '',
                'role' => $u['role'] ?? '',
                'role_display_name' => $u['role_display_name'] ?? '',
                'service' => $u['service'] ?? '',
                'company_id' => $u['company_id'] ?? '',
                'permissions' => getUserPermissionsByEmail($email)
            ];
        }
        echo json_encode(['success' => true, 'users' => $users_list]);
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

        $db = getData();
        if (isset($db['users'][$email])) {
            echo json_encode(['success' => false, 'message' => 'Cet email existe déjà']);
            break;
        }
        
        // If super_admin creates a user, we might need a company_id from input, but for now fallback
        $target_company_id = $creator_role === 'admin' ? $creator_company_id : ($data['company_id'] ?? 'comp_default_1');

        // Generate service ID based on name if not exists
        $service_id = 'svc_' . substr(md5($service_name . microtime(true)), 0, 8);
        $found_service_id = false;
        if (isset($db['services'])) {
            foreach ($db['services'] as $svc) {
                if (strtolower(trim($svc['name'])) === strtolower($service_name) && ($svc['company_id'] ?? '') === $target_company_id) {
                    $service_id = $svc['id'];
                    $found_service_id = true;
                    break;
                }
            }
        }
        
        if (!$found_service_id) {
            $db['services'][] = [
                'id' => $service_id,
                'name' => $service_name,
                'company_id' => $target_company_id,
                'permissions' => getDefaultServicePermissions()
            ];
        }

        $role_display_name = 'Agent';
        if ($role === 'super_admin') $role_display_name = 'Directeur Général';
        elseif ($role === 'admin') $role_display_name = 'Propriétaire';

        $permissions = $data['permissions'] ?? [];
        if (!is_array($permissions)) {
            $permissions = [];
        }

        $db['users'][$email] = [
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'name' => $name,
            'role' => $role,
            'role_display_name' => $role_display_name,
            'service' => $service_name,
            'service_id' => $service_id,
            'company_id' => $target_company_id,
            'permissions' => $permissions,
            'created_at' => date('Y-m-d H:i:s')
        ];

        saveData($db);
        echo json_encode(['success' => true, 'message' => 'Compte créé avec succès']);
        break;

    case 'get_inter_service_messages':
        $db = getData();
        $my_service = resolveCurrentServiceKey($db);
        $email = $_SESSION['user_id'] ?? '';
        $needs_save = updateUserActivity($db, $email);
        
        $now = time();
        $typing_changed = false;
        if (isset($db['typing_states'])) {
            foreach ($db['typing_states'] as $from_svc => $to_svcs) {
                foreach ($to_svcs as $to_svc => $users) {
                    foreach ($users as $user_email => $info) {
                        if ($now - $info['timestamp'] > 6) {
                            unset($db['typing_states'][$from_svc][$to_svc][$user_email]);
                            $typing_changed = true;
                        }
                    }
                    if (empty($db['typing_states'][$from_svc][$to_svc])) {
                        unset($db['typing_states'][$from_svc][$to_svc]);
                        $typing_changed = true;
                    }
                }
                if (empty($db['typing_states'][$from_svc])) {
                    unset($db['typing_states'][$from_svc]);
                    $typing_changed = true;
                }
            }
        }
        
        if ($needs_save || $typing_changed) {
            saveData($db);
        }
        
        $typers = [];
        if (isset($db['typing_states'])) {
            foreach ($db['typing_states'] as $from_svc => $to_svcs) {
                if (isset($to_svcs[$my_service])) {
                    foreach ($to_svcs[$my_service] as $user_email => $info) {
                        if ($user_email !== $email) {
                            $typers[] = [
                                'from_service' => $from_svc,
                                'to_service' => $my_service,
                                'user_name' => $info['name']
                            ];
                        }
                    }
                }
                if (isset($to_svcs['all'])) {
                    foreach ($to_svcs['all'] as $user_email => $info) {
                        if ($user_email !== $email) {
                            $typers[] = [
                                'from_service' => $from_svc,
                                'to_service' => 'all',
                                'user_name' => $info['name']
                            ];
                        }
                    }
                }
            }
        }

        $msgs = $db['inter_service_messages'] ?? [];
        $result = [];
        foreach ($msgs as $m) {
            if ($m['to_service'] === $my_service || $m['from_service'] === $my_service || $m['to_service'] === 'all') {
                $result[] = $m;
            }
        }
        echo json_encode(['success' => true, 'messages' => $result, 'typers' => $typers]);
        break;

    case 'send_inter_service_message':
        $db = getData();
        $my_service = resolveCurrentServiceKey($db);
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $reply_to = trim($data['reply_to'] ?? '');
        $attachment = trim($data['attachment'] ?? '');
        $attachment_name = trim($data['attachment_name'] ?? '');
        if ($content === '' && $attachment === '') {
             echo json_encode(['success' => false, 'message' => 'Contenu ou pièce jointe requis']); break;
        }
        if ($to_service === '') {
             echo json_encode(['success' => false, 'message' => 'Destinataire requis']); break;
        }
        if (!isset($db['inter_service_messages'])) $db['inter_service_messages'] = [];
        $new_msg = [
            'id' => 'ism_'.time().'_'.rand(100,999),
            'from_service' => $my_service,
            'from_user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
            'from_user_email' => (string)($_SESSION['user_id'] ?? ''),
            'to_service' => $to_service,
            'content' => $content,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        if ($reply_to !== '') {
            $new_msg['reply_to'] = $reply_to;
        }
        if ($attachment !== '') {
            $new_msg['attachment'] = $attachment;
            $new_msg['attachment_name'] = $attachment_name;
        }
        $db['inter_service_messages'][] = $new_msg;
        updateUserActivity($db, $_SESSION['user_id'] ?? '');
        saveData($db);
        echo json_encode(['success' => true]);
        break;

    case 'react_to_message':
        $db = getData();
        $message_id = trim($data['message_id'] ?? '');
        $emoji = trim($data['emoji'] ?? '');
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($message_id === '' || $emoji === '' || $email === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }
        $found = false;
        if (isset($db['inter_service_messages'])) {
            foreach ($db['inter_service_messages'] as &$m) {
                if ($m['id'] === $message_id) {
                    if (!isset($m['reactions'])) {
                        $m['reactions'] = [];
                    }
                    $exists = false;
                    foreach ($m['reactions'] as $key => $r) {
                        if ($r['emoji'] === $emoji && $r['user'] === $email) {
                            unset($m['reactions'][$key]);
                            $exists = true;
                            break;
                        }
                    }
                    if ($exists) {
                        $m['reactions'] = array_values($m['reactions']);
                    } else {
                        $m['reactions'][] = [
                            'emoji' => $emoji,
                            'user' => $email,
                            'userName' => $user_name
                        ];
                    }
                    $found = true;
                    break;
                }
            }
        }
        if ($found) {
            saveData($db);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Message non trouvé']);
        }
        break;

    case 'create_ticket':
        $db = getData();
        $my_service = resolveCurrentServiceKey($db);
        $title = trim($data['title'] ?? '');
        $content = trim($data['content'] ?? '');
        $to_service = trim($data['to_service'] ?? '');
        $priority = trim($data['priority'] ?? 'medium');
        $tags = $data['tags'] ?? [];
        if ($title === '' || $to_service === '') {
             echo json_encode(['success' => false, 'message' => 'Titre et destinataire requis']); break;
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
            $user_id = $_SESSION['user_id'] ?? '';
            $user = $db['users'][$user_id] ?? [];
            $company_id = $user['company_id'] ?? '';
            foreach ($db['services'] ?? [] as $svc) {
                if (($company_id === '' || ($svc['company_id'] ?? '') === $company_id) && strpos(strtolower($svc['name']), $target_keyword) !== false) {
                    $auto_assigned_to = $svc['id'];
                    $auto_assigned_name = $svc['name'];
                    break;
                }
            }
        }

        if (!isset($db['tickets'])) $db['tickets'] = [];
        $new_ticket = [
            'id' => 'tk_'.time().'_'.rand(100,999),
            'from_service' => $my_service,
            'from_user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
            'from_user_email' => (string)($_SESSION['user_id'] ?? ''),
            'to_service' => $to_service,
            'title' => $title,
            'content' => $content,
            'status' => 'open',
            'priority' => $priority,
            'tags' => $tags,
            'timestamp' => date('Y-m-d H:i:s'),
            'comments' => [],
            'activities' => [
                [
                    'type' => 'creation',
                    'user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ]
        ];

        if ($auto_assigned_to !== '') {
            $new_ticket['assigned_to'] = $auto_assigned_to;
            $new_ticket['assigned_name'] = $auto_assigned_name . ' (Auto-assigné)';
            $new_ticket['activities'][] = [
                'type' => 'assignment',
                'assigned_to' => $auto_assigned_name . ' (Auto-assigné)',
                'user' => 'Système',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }

        $db['tickets'][] = $new_ticket;
        saveData($db);
        echo json_encode(['success' => true]);
        break;

    case 'get_tickets':
        $db = getData();
        $my_service = resolveCurrentServiceKey($db);
        $tickets = $db['tickets'] ?? [];
        $result = [];
        foreach ($tickets as $t) {
            if ($t['to_service'] === $my_service || $t['from_service'] === $my_service || ($_SESSION['user_role'] ?? '') === 'super_admin') {
                $result[] = $t;
            }
        }
        echo json_encode(['success' => true, 'tickets' => $result]);
        break;

    case 'update_ticket_status':
        $db = getData();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $status = trim($data['status'] ?? '');
        $found = false;
        if (isset($db['tickets'])) {
            foreach ($db['tickets'] as &$t) {
                if ($t['id'] === $ticket_id) {
                    $old_status = $t['status'] ?? 'open';
                    if ($old_status !== $status) {
                        $t['status'] = $status;
                        if (!isset($t['activities'])) {
                            $t['activities'] = [];
                        }
                        $t['activities'][] = [
                            'type' => 'status_change',
                            'from' => $old_status,
                            'to' => $status,
                            'user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
                            'timestamp' => date('Y-m-d H:i:s')
                        ];
                    }
                    $found = true;
                    break;
                }
            }
        }
        if ($found) saveData($db);
        echo json_encode(['success' => $found]);
        break;

    case 'assign_ticket':
        $db = getData();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $assigned_to = trim($data['assigned_to'] ?? '');
        $assigned_name = trim($data['assigned_name'] ?? '');
        $found = false;
        if (isset($db['tickets'])) {
            foreach ($db['tickets'] as &$t) {
                if ($t['id'] === $ticket_id) {
                    $t['assigned_to'] = $assigned_to;
                    $t['assigned_name'] = $assigned_name;
                    if (!isset($t['activities'])) {
                        $t['activities'] = [];
                    }
                    $t['activities'][] = [
                        'type' => 'assignment',
                        'assigned_to' => $assigned_name ? $assigned_name : $assigned_to,
                        'user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                    $found = true;
                    break;
                }
            }
        }
        if ($found) saveData($db);
        echo json_encode(['success' => $found]);
        break;

    case 'add_ticket_comment':
        $db = getData();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $content = trim($data['content'] ?? '');
        $found = false;
        if ($ticket_id === '' || $content === '') {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }
        if (isset($db['tickets'])) {
            foreach ($db['tickets'] as &$t) {
                if ($t['id'] === $ticket_id) {
                    if (!isset($t['comments'])) {
                        $t['comments'] = [];
                    }
                    $t['comments'][] = [
                        'id' => 'tc_'.time().'_'.rand(100,999),
                        'user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
                        'email' => (string)($_SESSION['user_id'] ?? ''),
                        'content' => $content,
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                    $found = true;
                    break;
                }
            }
        }
        if ($found) saveData($db);
        echo json_encode(['success' => $found]);
        break;

    case 'get_services_list':
        $db = getData();
        $user_id = $_SESSION['user_id'] ?? '';
        $user = $db['users'][$user_id] ?? [];
        $company_id = $user['company_id'] ?? '';
        $role = $user['role'] ?? '';
        $services = $db['services'] ?? [];
        $users = $db['users'] ?? [];
        $service_activity = [];
        $now = time();
        foreach ($users as $u) {
            $sid = $u['service_id'] ?? '';
            if ($sid !== '') {
                $last_act = $u['last_activity'] ?? '';
                if ($last_act) {
                    $ts = strtotime($last_act);
                    if ($now - $ts < 120) {
                        $service_activity[$sid] = true;
                    }
                }
            }
        }
        $result = [];
        foreach ($services as $svc) {
            if ($role === 'super_admin' || ($company_id !== '' && ($svc['company_id'] ?? '') === $company_id)) {
                $result[] = [
                    'id' => $svc['id'],
                    'name' => $svc['name'],
                    'is_online' => !empty($service_activity[$svc['id']])
                ];
            }
        }
        echo json_encode(['success' => true, 'services' => $result]);
        break;

    case 'set_typing_status':
        $db = getData();
        $my_service = resolveCurrentServiceKey($db);
        $to_service = trim($data['to_service'] ?? '');
        $is_typing = !empty($data['is_typing']);
        $email = $_SESSION['user_id'] ?? '';
        $user_name = $_SESSION['user_name'] ?? 'Utilisateur';
        if ($to_service === '' || $email === '') {
            echo json_encode(['success' => false]);
            break;
        }
        if (!isset($db['typing_states'])) {
            $db['typing_states'] = [];
        }
        if ($is_typing) {
            $db['typing_states'][$my_service][$to_service][$email] = [
                'name' => $user_name,
                'timestamp' => time()
            ];
        } else {
            unset($db['typing_states'][$my_service][$to_service][$email]);
        }
        saveData($db);
        echo json_encode(['success' => true]);
        break;

    case 'toggle_pin_message':
        $db = getData();
        $message_id = trim($data['message_id'] ?? '');
        $found = false;
        if (isset($db['inter_service_messages'])) {
            foreach ($db['inter_service_messages'] as &$m) {
                if ($m['id'] === $message_id) {
                    $m['is_pinned'] = empty($m['is_pinned']) ? true : false;
                    $found = true;
                    break;
                }
            }
        }
        if ($found) {
            saveData($db);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Message non trouvé']);
        }
        break;

    case 'rate_ticket':
        $db = getData();
        $ticket_id = trim($data['ticket_id'] ?? '');
        $rating = (int)($data['rating'] ?? 0);
        $comment = trim($data['comment'] ?? '');
        $found = false;
        if ($ticket_id === '' || $rating < 1 || $rating > 5) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }
        if (isset($db['tickets'])) {
            foreach ($db['tickets'] as &$t) {
                if ($t['id'] === $ticket_id) {
                    $t['rating'] = $rating;
                    $t['rating_comment'] = $comment;
                    if (!isset($t['activities'])) {
                        $t['activities'] = [];
                    }
                    $t['activities'][] = [
                        'type' => 'rating',
                        'rating' => $rating,
                        'comment' => $comment,
                        'user' => (string)($_SESSION['user_name'] ?? 'Utilisateur'),
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                    $found = true;
                    break;
                }
            }
        }
        if ($found) {
            saveData($db);
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

       $db = getData();
       if (isset($db['users'][$email])) {
           echo json_encode(['success' => false, 'message' => 'Ce compte existe deja']);
            break;
        }

       // For public registration, we assume the user is registering a new Company
       $company_id = createCompany($db, $service_name, $email);

       $services = $db['services'] ?? [];
       $service_id = 'svc_' . time() . '_' . rand(100, 999);
       $services[] = [
           'id' => $service_id,
           'name' => $service_name,
           'company_id' => $company_id,
           'permissions' => getDefaultServicePermissions()
        ];
       $db['services'] = $services;

       $assigned_role = 'admin';

       $cfg = getSubscriptionConfig();
       $trialStart = time();
       $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);
       $db['users'][$email] = [
           'password' => password_hash($password, PASSWORD_DEFAULT),
           'name' => $name,
           'role' => $assigned_role,
           'role_display_name' => 'Propriétaire',
           'service' => $service_name,
           'service_id' => $service_id,
           'company_id' => $company_id,
           'trial_started_at' => date('Y-m-d H:i:s', $trialStart),
           'trial_ends_at' => date('Y-m-d H:i:s', $trialEnd),
           'subscription_until' => null,
           'subscription_plan' => (string) ($cfg['plan_code'] ?? 'premium_monthly'),
           'subscription_price' => (int) ($cfg['monthly_price'] ?? 20000),
           'subscription_currency' => (string) ($cfg['currency'] ?? 'XOF')
        ];

       if (!saveData($db)) {
           echo json_encode(['success' => false, 'message' => 'Creation de compte impossible']);
            break;
        }

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

        $db = getScopedData($serviceKey);
        
        $sites = $db['sites'] ?? [];
        $published_periods = $db['published_periods'] ?? [];
        $site_data = [];

        if ($site_id !== null && $site_id !== '') {
            $site = null;
            foreach ($db['sites'] as $s) {
                if ($s['id'] == $site_id) {
                    $site = $s;
                    break;
                }
            }

            if ($site) {
                // Build attendance data for all agents without keeping PHP references
                $subsites = [];
                foreach (($site['subsites'] ?? []) as $sourceSub) {
                    $sub = $sourceSub;
                    $sub['agents'] = [];

                    foreach (($sourceSub['agents'] ?? []) as $sourceAgent) {
                        $agent = $sourceAgent;
                        $agent_id = $agent['id'] ?? '';
                        $agent['attendance'] = [];

                        if ($agent_id !== '' && isset($db['attendance'][$period][$agent_id])) {
                            foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                                foreach ($days as $date => $status) {
                                    $agent['attendance'][] = [
                                        'date' => $date,
                                        'shift_code' => $shift_code,
                                        'status' => $status
                                    ];
                                }
                            }
                        }

                        $sub['agents'][] = $agent;
                    }

                    $subsites[] = $sub;
                }

                // Now check for mutated agents FROM other sites TO this site
                $mutated_agents = [];
                $deployed_extras = [];
                foreach ($db['sites'] as $other_site) {
                    if ($other_site['id'] == $site_id)
                        continue; // Skip current site
                    if (!isset($other_site['subsites']))
                        continue; // Skip if no subsites

                    $is_extras_site = ($other_site['id'] === 'site_extras');

                    foreach ($other_site['subsites'] as $other_sub) {
                        if (!isset($other_sub['agents']))
                            continue; // Skip if no agents
                        foreach ($other_sub['agents'] as $agent) {
                            $agent_id = $agent['id'];

                            // Check if this agent has mutations pointing to current site
                            if (isset($db['attendance'][$period][$agent_id])) {
                                $has_mutation_to_here = false;
                                $mutation_attendance = [];

                                foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                                    foreach ($days as $date => $status) {
                                        if (is_string($status)) {
                                            if (strpos($status, 'M|') === 0) {
                                                $dest = substr($status, 2);
                                                if ($dest === $site['name']) {
                                                    $has_mutation_to_here = true;
                                                    $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                                }
                                            } elseif (strpos($status, 'EXT|') === 0 || strpos($status, 'EXT_A|') === 0 || strpos($status, 'EXT_R|') === 0) {
                                                $dest = substr($status, strpos($status, '|') + 1);
                                                if ($dest === $site['name']) {
                                                    $has_mutation_to_here = true;
                                                    $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                                }
                                            } elseif (strpos($status, 'REL|') === 0 || strpos($status, 'REL_A|') === 0 || strpos($status, 'REL_R|') === 0) {
                                                $dest = substr($status, strpos($status, '|') + 1);
                                                if ($dest === $site['name']) {
                                                    $has_mutation_to_here = true;
                                                    $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                                }
                                            }
                                        }
                                    }
                                }

                                if ($has_mutation_to_here) {
                                    $mutated_agent = $agent;
                                    $mutated_agent['attendance'] = $mutation_attendance;
                                    $mutated_agent['is_mutated'] = true;
                                    $mutated_agent['original_site'] = $other_site['name'];
                                    
                                    $is_releves_site = ($other_site['id'] === 'site_releves');
                                    
                                    if ($is_extras_site || $is_releves_site) {
                                        if ($is_extras_site) $mutated_agent['is_extra'] = true;
                                        if ($is_releves_site) $mutated_agent['is_releve'] = true;
                                        $deployed_extras[] = $mutated_agent;
                                    } else {
                                        $mutated_agents[] = $mutated_agent;
                                    }
                                }
                            }
                        }
                    }
                }

                // Add mutated agents to a special "Agents Mutés" subsite
                if (!empty($mutated_agents)) {
                    $subsites[] = [
                        'id' => 'mutated_' . $site_id,
                        'name' => '🔄 Agents Mutés (Temporaire)',
                        'agents' => $mutated_agents
                    ];
                }

                // Add deployed extras to the first subsite
                if (!empty($deployed_extras)) {
                    usort($deployed_extras, function($a, $b) {
                        $is_releve_a = isset($a['is_releve']) && $a['is_releve'] ? 1 : 0;
                        $is_releve_b = isset($b['is_releve']) && $b['is_releve'] ? 1 : 0;
                        if ($is_releve_a !== $is_releve_b) {
                            return $is_releve_b - $is_releve_a;
                        }
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
            'published_periods' => $published_periods,
            'site_data' => $site_data
        ]);
        break;

     case 'get_sites':
        $db = getScopedData($serviceKey);
        echo json_encode($db['sites'] ?? []);
        break;

    case 'add_site':
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $name = $data['name'] ?? '';
       $db = getScopedData($serviceKey);
       foreach ($db['sites'] as $site) {
           if (($site['name'] ?? '') === $name) {
               echo json_encode(['success' => false, 'message' => 'Ce site existe déjà']);
                break 2;
            }
        }
       $id = time() . '_' . rand(100, 999);
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
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $name   = trim($data['name'] ?? '');
       $icon   = trim($data['icon'] ?? '📋');
       $type   = trim($data['type'] ?? 'custom'); // custom | extras | releves | admin
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
           'id'         => $slug,
           'name'       => $icon . ' ' . $name,
           'icon'       => $icon,
           'is_special' => true,
           'special_type' => $type,
           'subsites'   => [
               ['id' => $slug . '_1', 'name' => 'Agents Disponibles', 'agents' => []]
            ]
        ];
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true, 'site_id' => $slug]);
        break;

    case 'update_site_icon':
       $site_id = $data['site_id'] ?? '';
       $icon    = $data['icon']    ?? '🏢';
       $db = getScopedData($serviceKey);
       foreach ($db['sites'] as &$site) {
           if ((string)$site['id'] === (string)$site_id) {
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
       $db = getScopedData($serviceKey);
       foreach ($db['sites'] as &$site) {
           if ($site['id'] == $site_id) {
               if (!isset($site['subsites']))
                   $site['subsites'] = [];
               $site['subsites'][] = [
                   'id' => time() . '_' . rand(100, 999),
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
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $site_id = $data['site_id'] ?? '';
       $new_name = $data['name'] ?? '';
       $db = getScopedData($serviceKey);
       foreach ($db['sites'] as &$site) {
           if ($site['id'] == $site_id) {
               $site['name'] = $new_name;
                break;
            }
        }
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
        break;

    case 'rename_subsite':
       $subsite_id = $data['subsite_id'] ?? '';
       $new_name = $data['name'] ?? '';
       $db = getScopedData($serviceKey);
       foreach ($db['sites'] as &$site) {
           foreach ($site['subsites'] as &$sub) {
               if ($sub['id'] == $subsite_id) {
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
                   if (isset($periodData[$aid])) {
                       unset($periodData[$aid]);
                    }
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

       $db = getScopedData($serviceKey);
       $site = null;
       foreach ($db['sites'] as $s) {
           if ($s['id'] == $site_id) {
               $site = $s;
                break;
            }
        }

       if (!$site) {
            echo json_encode([]);
            break;
        }

        // Build attendance data for all agents without keeping PHP references
       $subsites = [];
       foreach (($site['subsites'] ?? []) as $sourceSub) {
           $sub = $sourceSub;
           $sub['agents'] = [];

           foreach (($sourceSub['agents'] ?? []) as $sourceAgent) {
               $agent = $sourceAgent;
               $agent_id = $agent['id'] ?? '';
               $agent['attendance'] = [];

               if ($agent_id !== '' && isset($db['attendance'][$period][$agent_id])) {
                   foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                       foreach ($days as $date => $status) {
                           $agent['attendance'][] = [
                               'date' => $date,
                               'shift_code' => $shift_code,
                               'status' => $status
                            ];
                        }
                    }
                }

               $sub['agents'][] = $agent;
            }

           $subsites[] = $sub;
        }

        // Now check for mutated agents FROM other sites TO this site
       $mutated_agents = [];
       $deployed_extras = [];
       foreach ($db['sites'] as $other_site) {
           if ($other_site['id'] == $site_id)
                continue; // Skip current site
           if (!isset($other_site['subsites']))
                continue; // Skip if no subsites

           $is_extras_site = ($other_site['id'] === 'site_extras');

           foreach ($other_site['subsites'] as $other_sub) {
               if (!isset($other_sub['agents']))
                    continue; // Skip if no agents
               foreach ($other_sub['agents'] as $agent) {
                   $agent_id = $agent['id'];

                    // Check if this agent has mutations pointing to current site
                   if (isset($db['attendance'][$period][$agent_id])) {
                       $has_mutation_to_here = false;
                       $mutation_attendance = [];

                       foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                           foreach ($days as $date => $status) {
                               if (is_string($status)) {
                                   if (strpos($status, 'M|') === 0) {
                                       $dest = substr($status, 2);
                                       if ($dest === $site['name']) {
                                           $has_mutation_to_here = true;
                                           $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                       }
                                   } elseif (strpos($status, 'EXT|') === 0 || strpos($status, 'EXT_A|') === 0 || strpos($status, 'EXT_R|') === 0) {
                                       $dest = substr($status, strpos($status, '|') + 1);
                                       if ($dest === $site['name']) {
                                           $has_mutation_to_here = true;
                                           $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                       }
                                   } elseif (strpos($status, 'REL|') === 0 || strpos($status, 'REL_A|') === 0 || strpos($status, 'REL_R|') === 0) {
                                       $dest = substr($status, strpos($status, '|') + 1);
                                       if ($dest === $site['name']) {
                                           $has_mutation_to_here = true;
                                           $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                       }
                                   }
                               }
                           }
                       }

                       if ($has_mutation_to_here) {
                           $mutated_agent = $agent;
                           $mutated_agent['attendance'] = $mutation_attendance;
                           $mutated_agent['is_mutated'] = true;
                           $mutated_agent['original_site'] = $other_site['name'];
                           $is_releves_site = ($other_site['id'] === 'site_releves');
                           if ($is_extras_site || $is_releves_site) {
                               if ($is_extras_site) $mutated_agent['is_extra'] = true;
                               if ($is_releves_site) $mutated_agent['is_releve'] = true;
                               $deployed_extras[] = $mutated_agent;
                           } else {
                               $mutated_agents[] = $mutated_agent;
                           }
                        }
                    }
                }
            }
        }

        // Add mutated agents to a special "Agents Mutés" subsite
       if (!empty($mutated_agents)) {
           $subsites[] = [
               'id' => 'mutated_' . $site_id,
               'name' => '🔄 Agents Mutés (Temporaire)',
               'agents' => $mutated_agents
            ];
        }

        // Add deployed extras to the first subsite
        if (!empty($deployed_extras)) {
            usort($deployed_extras, function($a, $b) {
                $is_releve_a = isset($a['is_releve']) && $a['is_releve'] ? 1 : 0;
                $is_releve_b = isset($b['is_releve']) && $b['is_releve'] ? 1 : 0;
                if ($is_releve_a !== $is_releve_b) {
                    return $is_releve_b - $is_releve_a;
                }
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

       echo json_encode($subsites);
        break;

    case 'add_agent':
       $site_id = (string) ($data['site_id'] ?? '');
       $subsite_id = (string) ($data['subsite_id'] ?? '');
       $name = $data['name'] ?? '';
       $period = $data['period'] ?? '';

       $db = getScopedData($serviceKey);
       $found = false;
       $new_agent_id = null;
        foreach ($db['sites'] as &$site) {
           if ($site_id !== '' && (string) ($site['id'] ?? '') !== $site_id) {
               continue;
            }
           foreach ($site['subsites'] as &$sub) {
               if ((string) $sub['id'] === $subsite_id) {
                   $new_agent_id = uniqid();
                   $sub['agents'][] = [
                       'id' => $new_agent_id,
                       'name' => $name,
                       'shift_type' => 'Jour',
                       'function' => 'AS',
                       'has_sp' => false,
                       'hire_date' => date('Y-m-d'),
                       'recruitment_cost' => 45000
                   ];
                   $found = true;
                   break 2;
               }
           }
        }
        unset($site, $sub);
        
        if ($found && $period !== '') {
            applyShiftDefaultsForPeriod($db, $new_agent_id, $period, 'Jour');
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

       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
        break;

    case 'apply_mutation':
       $agent_id = $data['agent_id'] ?? '';
       $start_date = $data['start_date'] ?? '';
       $end_date = $data['end_date'] ?? '';
       $destination = $data['destination'] ?? '';
       $period = $data['period'] ?? '';

       if (!$agent_id || !$start_date || !$end_date || !$destination || !$period) {
           echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

       $db = getScopedData($serviceKey);
       if (!isset($db['attendance'][$period])) {
           $db['attendance'][$period] = [];
        }
       if (!isset($db['attendance'][$period][$agent_id])) {
           $db['attendance'][$period][$agent_id] = [];
        }

       $start_time = strtotime($start_date);
       $end_time = strtotime($end_date);
       if ($start_time > $end_time) {
           echo json_encode(['success' => false, 'message' => 'Date de fin invalide']);
            break;
        }

       $cursor = $start_time;
       while ($cursor <= $end_time) {
           $date_str = date('Y-m-d', $cursor);
           $db['attendance'][$period][$agent_id]['J'][$date_str] = 'M|' . $destination;
           $db['attendance'][$period][$agent_id]['N'][$date_str] = 'M|' . $destination;
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

       if (!$agent_id || !$period || $cycle <= 0) {
           echo json_encode(['success' => false, 'message' => 'Paramètres invalides']);
            break;
        }

       $db = getScopedData($serviceKey);
       if ($site_id !== '') {
           $agentInSite = false;
           foreach ($db['sites'] as $s) {
               if ((string) ($s['id'] ?? '') !== $site_id) {
                   continue;
                }
               foreach (($s['subsites'] ?? []) as $sub) {
                   foreach (($sub['agents'] ?? []) as $agent) {
                       if (($agent['id'] ?? '') == $agent_id) {
                           $agentInSite = true;
                           break 3;
                        }
                    }
                }
           }
           if (!$agentInSite) {
               echo json_encode(['success' => false, 'message' => 'Agent introuvable sur ce site']);
                break;
            }
        }
       $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
       $start_day = (int) $settings['cycle_start'];

        // Period "2026-02" starts on 21 Jan
       $dateObj = new DateTime($period . "-01");
       $dateObj->modify("-1 month");
       $curr_start = new DateTime($dateObj->format("Y-m") . "-" . $start_day);

        // Reset current period for this agent
       if (isset($db['attendance'][$period])) {
           if (isset($db['attendance'][$period][$agent_id])) {
               $db['attendance'][$period][$agent_id]['J'] = [];
               $db['attendance'][$period][$agent_id]['N'] = [];
            } else {
               $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];
            }
        } else {
           $db['attendance'][$period] = [];
           $db['attendance'][$period][$agent_id] = ['J' => [], 'N' => []];
        }

        // Use shift_type from request if provided (useful during vacation change)
       $stype = $data['shift_type'] ?? '';

       if (!$stype) {
            // Fallback: lookup in current state
           foreach ($db['sites'] as $s) {
               foreach ($s['subsites'] as $sub) {
                   foreach ($sub['agents'] as $agent) {
                       if ($agent['id'] == $agent_id) {
                           $stype = $agent['shift_type'] ?? 'Jour';
                            break 3;
                        }
                    }
                }
            }
        }

       for ($i = 0; $i < 32; $i++) {
           $target = clone $curr_start;
           $target->modify("+$i days");

           $t_str = $target->format('Y-m-d');
           $t_day = (int) $target->format('d');

            // Determine bucket for this date
           $target_p = ($t_day >= $start_day) ? date('Y-m', strtotime("+1 month", $target->getTimestamp())) : $target->format('Y-m');

            // We only apply to the bucket matching the user's current view
           if ($target_p !== $period)
                continue;

           $pos = ($i - $offset) % $cycle;
           if ($pos < 0)
               $pos += $cycle;

           if ($pos < $work) {
               if ($stype === 'Nuit') {
                   $db['attendance'][$period][$agent_id]['N'][$t_str] = '1';
               } elseif ($stype === 'Jour') {
                   $db['attendance'][$period][$agent_id]['J'][$t_str] = '1';
               } else {
                   // Rotative : jour de travail → remplir J et N
                   $db['attendance'][$period][$agent_id]['J'][$t_str] = '1';
                   $db['attendance'][$period][$agent_id]['N'][$t_str] = '1';
               }
           } else {
               // Jour de repos pour agent rotatif → enregistrer 'R' sur J et N
               if ($stype !== 'Jour' && $stype !== 'Nuit') {
                   $db['attendance'][$period][$agent_id]['J'][$t_str] = 'R';
                   $db['attendance'][$period][$agent_id]['N'][$t_str] = 'R';
               }
           }
        }

       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
        break;

    case 'update_agent_info':
       $agent_id = $data['agent_id'] ?? 0;
       $site_id = (string) ($data['site_id'] ?? '');
       $field = $data['field'] ?? ''; // 'function' or 'shift_type'
       $value = $data['value'] ?? '';
       $period = $data['period'] ?? '';

       $db = getScopedData($serviceKey);
       $found = false;
       foreach ($db['sites'] as &$site) {
           if ($site_id !== '' && (string) ($site['id'] ?? '') !== $site_id) {
               continue;
            }
           foreach ($site['subsites'] as &$sub) {
               foreach ($sub['agents'] as &$agent) {
                   if ($agent['id'] == $agent_id) {
                       if (in_array($field, ['function', 'shift_type', 'has_sp'])) {
                           if ($field === 'has_sp') {
                               $agent[$field] = ($value === 'true' || $value === true);
                            } else {
                               $agent[$field] = $value;
                            }
                           $found = true;
                            break 3;
                        }
                    }
                }
            }
        }
        if ($found) {
            if ($field === 'shift_type' && $period) {
                // Pour la rétrocompatibilité ou les corrections d'erreur, on garde le comportement global
                applyShiftDefaultsForPeriod($db, $agent_id, $period, $value);
            }
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;

    case 'get_fluctuation_analytics':
        $period = $_GET['period'] ?? date('Y-m');
        $db = getScopedData($serviceKey);
        
        $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
        $start_day = (int)($settings['cycle_start'] ?? 21);
        $end_day = (int)($settings['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);
        
        $salary_config = $db['salary_config'] ?? [];
        $functions = $db['functions'] ?? [];
        
        $agents = [];
        $sites_rentability = [];
        
        foreach ($db['sites'] as $site) {
            $site_name = $site['name'];
            $sites_rentability[$site_name] = [
                'name' => $site_name,
                'agent_count' => 0,
                'salary_expense' => 0,
                'contract_revenue' => (int)($db['site_revenues'][$site_name]['contract_revenue'] ?? 0)
            ];
            if (isset($site['subsites'])) {
                foreach ($site['subsites'] as $sub) {
                    if (isset($sub['agents'])) {
                        foreach ($sub['agents'] as $agent) {
                            $agent_id = $agent['id'];
                            
                            $func_id = $agent['function'] ?? 'AS';
                            $base = isset($agent['base_salary']) && (int)$agent['base_salary'] > 0 
                                ? (int)$agent['base_salary'] 
                                : (isset($salary_config[$func_id]) ? (int)$salary_config[$func_id] : 75000);
                            
                            $agents[$agent_id] = [
                                'id' => $agent_id,
                                'name' => $agent['name'],
                                'site' => $site_name,
                                'subsite' => $sub['name'],
                                'function' => $func_id,
                                'base_salary' => $base,
                                'hire_date' => $agent['hire_date'] ?? null,
                                'exit_date' => $agent['exit_date'] ?? null,
                                'recruitment_cost' => (int)($agent['recruitment_cost'] ?? 0),
                                'promotion_cost' => (int)($agent['promotion_cost'] ?? 0)
                            ];
                        }
                    }
                }
            }
        }
        
        $base_masse = 0;
        $discipline_impact = 0;
        $activite_impact = 0;
        $recrutement_impact = 0;
        $depart_impact = 0;
        
        $recruits_list = [];
        $departs_list = [];
        
        foreach ($agents as $agent_id => $agent) {
            $base = $agent['base_salary'];
            
            $h_date = $agent['hire_date'];
            if ($h_date && strpos($h_date, $period) === 0) {
                $recrutement_impact += $base + $agent['recruitment_cost'];
                $recruits_list[] = [
                    'name' => $agent['name'],
                    'site' => $agent['site'],
                    'base_salary' => $base,
                    'cost' => $base + $agent['recruitment_cost']
                ];
            }
            
            $e_date = $agent['exit_date'];
            if ($e_date && strpos($e_date, $period) === 0) {
                $depart_impact += $base;
                $departs_list[] = [
                    'name' => $agent['name'],
                    'site' => $agent['site'],
                    'savings' => $base
                ];
                continue;
            }
            
            $base_masse += $base;
            
            $absences = 0;
            if (isset($db['attendance'][$period][$agent_id])) {
                $agent_att = $db['attendance'][$period][$agent_id];
                foreach ($dates as $date) {
                    if (isset($agent_att['J'][$date]) && $agent_att['J'][$date] === 'A') $absences++;
                    if (isset($agent_att['N'][$date]) && $agent_att['N'][$date] === 'A') $absences++;
                }
            }
            $deductions = (int)round($absences * ($base / 30));
            $discipline_impact += $deductions;
            
            $sp_count = 0;
            if (isset($db['attendance'][$period][$agent_id])) {
                $agent_att = $db['attendance'][$period][$agent_id];
                foreach (['S', 'SJ', 'SN'] as $sp_key) {
                    if (isset($agent_att[$sp_key])) {
                        foreach ($dates as $date) {
                            if (isset($agent_att[$sp_key][$date])) {
                                $status = $agent_att[$sp_key][$date];
                                if ($status !== '' && $status !== 'A' && $status !== 'R') {
                                    $sp_count++;
                                }
                            }
                        }
                    }
                }
            }
            $gains = (int)round($sp_count * ($base / 30));
            $activite_impact += $gains;
            
            $site_name = $agent['site'];
            if (isset($sites_rentability[$site_name])) {
                $sites_rentability[$site_name]['agent_count']++;
                $sites_rentability[$site_name]['salary_expense'] += ($base - $deductions + $gains);
            }
        }
        
        $primes_impact = 0;
        $advances_impact = 0;
        $period_adjustments = [];
        
        if (isset($db['manual_adjustments'][$period])) {
            foreach ($db['manual_adjustments'][$period] as $ag_id => $adjs) {
                if (is_array($adjs)) {
                    foreach ($adjs as $adj) {
                        $val = (int)$adj['value'];
                        $agent_name = $agents[$ag_id]['name'] ?? 'Agent Inconnu';
                        $site_name = $agents[$ag_id]['site'] ?? 'N/A';
                        
                        if (($adj['category'] ?? 'GAIN') === 'GAIN') {
                            $primes_impact += $val;
                            if (isset($sites_rentability[$site_name])) {
                                $sites_rentability[$site_name]['salary_expense'] += $val;
                            }
                        } else {
                            $advances_impact += $val;
                            if (isset($sites_rentability[$site_name])) {
                                $sites_rentability[$site_name]['salary_expense'] -= $val;
                            }
                        }
                        
                        $period_adjustments[] = [
                            'id' => $adj['id'],
                            'agent_id' => $ag_id,
                            'agent_name' => $agent_name,
                            'site' => $site_name,
                            'type' => $adj['type'],
                            'category' => $adj['category'] ?? 'GAIN',
                            'value' => $val,
                            'date_application' => $adj['date_application'] ?? '',
                            'comment' => $adj['comment'] ?? ''
                        ];
                    }
                }
            }
        }
        
        $total_real = $base_masse + $recrutement_impact - $depart_impact + $activite_impact - $discipline_impact + $primes_impact - $advances_impact;
        
        echo json_encode([
            'period' => $period,
            'base_masse_salariale' => $base_masse,
            'recrutement_impact' => $recrutement_impact,
            'recruits_list' => $recruits_list,
            'depart_impact' => $depart_impact,
            'departs_list' => $departs_list,
            'activite_impact' => $activite_impact,
            'discipline_impact' => $discipline_impact,
            'primes_impact' => $primes_impact,
            'advances_impact' => $advances_impact,
            'total_real_masse_salariale' => $total_real,
            'sites_rentability' => array_values($sites_rentability),
            'manual_adjustments' => $period_adjustments,
            'agents' => array_values($agents)
        ]);
        break;

    case 'save_manual_adjustment':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $type = $data['type'] ?? 'PRIME';
        $category = $data['category'] ?? 'GAIN';
        $value = (int)($data['value'] ?? 0);
        $comment = $data['comment'] ?? '';
        $date_app = $data['date_application'] ?? date('Y-m-d');
        $period = substr($date_app, 0, 7);
        
        if ($agent_id === '' || $value <= 0) {
            echo json_encode(['success' => false, 'message' => 'Données invalides']);
            break;
        }
        
        $db = getScopedData($serviceKey);
        if (!isset($db['manual_adjustments'][$period])) {
            $db['manual_adjustments'][$period] = [];
        }
        if (!isset($db['manual_adjustments'][$period][$agent_id])) {
            $db['manual_adjustments'][$period][$agent_id] = [];
        }
        
        $db['manual_adjustments'][$period][$agent_id][] = [
            'id' => 'adj_' . time() . '_' . rand(1000, 9999),
            'type' => $type,
            'category' => $category,
            'value' => $value,
            'date_application' => $date_app,
            'comment' => $comment
        ];
        
        saveScopedData($db, $serviceKey);
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
        
        $db = getScopedData($serviceKey);
        $found = false;
        if (isset($db['manual_adjustments'][$period][$agent_id])) {
            $adjs = &$db['manual_adjustments'][$period][$agent_id];
            foreach ($adjs as $idx => $adj) {
                if ($adj['id'] === $adj_id) {
                    array_splice($adjs, $idx, 1);
                    $found = true;
                    break;
                }
            }
        }
        
        if ($found) {
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ajustement introuvable']);
        }
        break;

    case 'save_site_revenue':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $site_name = $data['site_name'] ?? '';
        $revenue = (int)($data['contract_revenue'] ?? 0);
        
        if ($site_name === '') {
            echo json_encode(['success' => false, 'message' => 'Site invalide']);
            break;
        }
        
        $db = getScopedData($serviceKey);
        if (!isset($db['site_revenues'])) {
            $db['site_revenues'] = [];
        }
        $db['site_revenues'][$site_name] = [
            'contract_revenue' => $revenue,
            'currency' => 'XOF'
        ];
        
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;

    case 'change_agent_shift':
        $agent_id = $data['agent_id'] ?? 0;
        $site_id = (string) ($data['site_id'] ?? '');
        $date = $data['date'] ?? ''; // e.g. "2026-05-15"
        $new_shift = $data['new_shift'] ?? '';
        $period = $data['period'] ?? '';

        $db = getScopedData($serviceKey);
        $found = false;
        foreach ($db['sites'] as &$site) {
            if ($site_id !== '' && (string) ($site['id'] ?? '') !== $site_id) {
                continue;
            }
            foreach ($site['subsites'] as &$sub) {
                foreach ($sub['agents'] as &$agent) {
                    if ($agent['id'] == $agent_id) {
                        $old_shift = $agent['shift_type'] ?? 'Jour';
                        
                        if (!isset($agent['shift_history']) || !is_array($agent['shift_history'])) {
                            $agent['shift_history'] = [
                                ['from' => '2000-01-01', 'type' => $old_shift]
                            ];
                        }
                        
                        $updated = false;
                        foreach ($agent['shift_history'] as &$sh) {
                            if ($sh['from'] === $date) {
                                $sh['type'] = $new_shift;
                                $updated = true;
                                break;
                            }
                        }
                        
                        if (!$updated) {
                            $agent['shift_history'][] = [
                                'from' => $date,
                                'type' => $new_shift
                            ];
                        }
                        
                        usort($agent['shift_history'], function($a, $b) {
                            return strcmp($a['from'], $b['from']);
                        });
                        
                        $latest_shift = end($agent['shift_history'])['type'];
                        $agent['shift_type'] = $latest_shift;
                        
                        $found = true;
                        break 3;
                    }
                }
            }
        }

        if ($found) {
            // Targeted pre-fill from the change date
            if ($period && $date) {
                $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
                $start_day = (int) ($settings['cycle_start'] ?? 21);
                $end_day = (int) ($settings['cycle_end'] ?? 20);
                $dates = getPeriodDates($period, $start_day, $end_day);
                
                if (!isset($db['attendance'][$period])) $db['attendance'][$period] = [];
                if (!isset($db['attendance'][$period][$agent_id])) $db['attendance'][$period][$agent_id] = [];
                
                if (!isset($db['attendance'][$period][$agent_id]['J'])) $db['attendance'][$period][$agent_id]['J'] = [];
                if (!isset($db['attendance'][$period][$agent_id]['N'])) $db['attendance'][$period][$agent_id]['N'] = [];

                $change_ts = strtotime($date);
                
                $cycleLen = 1;
                $workDays = 1;
                $isRotative = false;
                
                if ($new_shift === '24h') { $cycleLen = 2; $workDays = 1; $isRotative = true; }
                elseif ($new_shift === '48h') { $cycleLen = 4; $workDays = 2; $isRotative = true; }
                elseif ($new_shift === '72h') { $cycleLen = 6; $workDays = 3; $isRotative = true; }

                $day_index = 0;
                $random_rest_day = rand(0, 6);

                foreach ($dates as $ds) {
                    if (strtotime($ds) >= $change_ts) {
                        // Nettoyage des anciennes valeurs
                        unset($db['attendance'][$period][$agent_id]['J'][$ds]);
                        unset($db['attendance'][$period][$agent_id]['N'][$ds]);

                        if ($isRotative) {
                            $pos = $day_index % $cycleLen;
                            $val = ($pos < $workDays) ? '1' : 'R';
                            
                            $db['attendance'][$period][$agent_id]['J'][$ds] = $val;
                            $db['attendance'][$period][$agent_id]['N'][$ds] = $val;
                            
                            $day_index++;
                        } else {
                            $shift_key = ($new_shift === 'Nuit') ? 'N' : 'J';
                            $date_obj = new DateTime($ds);
                            if ((int)$date_obj->format('w') === $random_rest_day) {
                                $db['attendance'][$period][$agent_id][$shift_key][$ds] = 'R';
                            } else {
                                $db['attendance'][$period][$agent_id][$shift_key][$ds] = '1';
                            }
                        }
                    }
                }
            }
            saveScopedData($db, $serviceKey);
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

       $db = getScopedData($serviceKey);
       $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
       $start_day = (int) $settings['cycle_start'];

       // Get old dates
       $oldDateObj = new DateTime($current_period . "-01");
       $oldDateObj->modify("-1 month");
       $old_start = clone $oldDateObj;
       $old_start->setDate((int)$oldDateObj->format('Y'), (int)$oldDateObj->format('m'), $start_day);
       
       $old_dates = [];
       for ($i = 0; $i < 32; $i++) {
           $t = clone $old_start;
           $t->modify("+$i days");
           $p = ((int)$t->format('d') >= $start_day) ? date('Y-m', strtotime("+1 month", $t->getTimestamp())) : $t->format('Y-m');
           if ($p === $current_period) $old_dates[] = $t->format('Y-m-d');
       }

       // Get new dates
       $newDateObj = new DateTime($next_period . "-01");
       $newDateObj->modify("-1 month");
       $new_start = clone $newDateObj;
       $new_start->setDate((int)$newDateObj->format('Y'), (int)$newDateObj->format('m'), $start_day);
       
       $new_dates = [];
       for ($i = 0; $i < 32; $i++) {
           $t = clone $new_start;
           $t->modify("+$i days");
           $p = ((int)$t->format('d') >= $start_day) ? date('Y-m', strtotime("+1 month", $t->getTimestamp())) : $t->format('Y-m');
           if ($p === $next_period) $new_dates[] = $t->format('Y-m-d');
       }

       if (!isset($db['attendance'][$next_period])) {
           $db['attendance'][$next_period] = [];
       }

       $old_att = $db['attendance'][$current_period] ?? [];

       foreach ($old_att as $agent_id => $shifts) {
           $db['attendance'][$next_period][$agent_id] = ['J' => [], 'N' => []];
           foreach (['J', 'N'] as $shift_code) {
               if (!isset($shifts[$shift_code])) continue;
               
               $isActiveAtEnd = false;
                if (count($old_dates) > 0) {
                    $last_old_d = $old_dates[count($old_dates) - 1];
                    $last_val = $shifts[$shift_code][$last_old_d] ?? '';
                    if ($last_val === '1' || $last_val === 'A' || $last_val === 'CP' || $last_val === 'AT' || strpos($last_val, 'M|') === 0 || $last_val === 'R') {
                        $isActiveAtEnd = true;
                    }
                }

                for ($i = 0; $i < count($new_dates); $i++) {
                    $new_d = $new_dates[$i];
                    if ($i < count($old_dates)) {
                        $old_d = $old_dates[$i];
                        $val = $shifts[$shift_code][$old_d] ?? '';
                        if ($val === 'R') {
                            $db['attendance'][$next_period][$agent_id][$shift_code][$new_d] = 'R';
                        } elseif ($val === '1' || $val === 'A' || $val === 'CP' || $val === 'AT' || strpos($val, 'M|') === 0) {
                            $db['attendance'][$next_period][$agent_id][$shift_code][$new_d] = '1';
                        }
                    } else {
                        if ($isActiveAtEnd) {
                            $db['attendance'][$next_period][$agent_id][$shift_code][$new_d] = '1';
                        }
                    }
                }
           }
       }

       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
       break;

    case 'archive_all_sites':
       $period = $data['period'] ?? '';
       if (!$period) {
           echo json_encode(['success' => false, 'message' => 'Période manquante']);
           break;
       }

       $db = getScopedData($serviceKey);
       if (!isset($db['archives']))
           $db['archives'] = [];

       // Construire un snapshot complet identique à ce qu'affiche get_site_data pour chaque site
       $snapshot_sites = [];

       foreach ($db['sites'] as $site) {
           $site_id = $site['id'];

           // Construire les subsites avec attendance complète pour chaque agent
           $subsites = [];
           foreach (($site['subsites'] ?? []) as $sourceSub) {
               $sub = $sourceSub;
               $sub['agents'] = [];

               foreach (($sourceSub['agents'] ?? []) as $sourceAgent) {
                   $agent = $sourceAgent;
                   $agent_id = $agent['id'] ?? '';
                   $agent['attendance'] = [];

                   if ($agent_id !== '' && isset($db['attendance'][$period][$agent_id])) {
                       foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                           foreach ($days as $date => $status) {
                               $agent['attendance'][] = [
                                   'date'       => $date,
                                   'shift_code' => $shift_code,
                                   'status'     => $status
                               ];
                           }
                       }
                   }

                   $sub['agents'][] = $agent;
               }

               $subsites[] = $sub;
           }

           // Calculer les agents mutés VERS ce site depuis les autres sites
           $mutated_agents = [];
           foreach ($db['sites'] as $other_site) {
               if ($other_site['id'] == $site_id) continue;
               foreach (($other_site['subsites'] ?? []) as $other_sub) {
                   foreach (($other_sub['agents'] ?? []) as $agent) {
                       $agent_id = $agent['id'];
                       if (!isset($db['attendance'][$period][$agent_id])) continue;

                       $has_mutation_to_here = false;
                       $mutation_attendance = [];

                       foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                           foreach ($days as $date => $status) {
                               if (is_string($status)) {
                                   if (strpos($status, 'M|') === 0) {
                                       $dest = substr($status, 2);
                                       if ($dest === $site['name']) {
                                           $has_mutation_to_here = true;
                                           $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                       }
                                   } elseif (strpos($status, 'EXT|') === 0 || strpos($status, 'EXT_A|') === 0 || strpos($status, 'EXT_R|') === 0 || strpos($status, 'REL|') === 0 || strpos($status, 'REL_A|') === 0 || strpos($status, 'REL_R|') === 0) {
                                       $dest = substr($status, strpos($status, '|') + 1);
                                       if ($dest === $site['name']) {
                                           $has_mutation_to_here = true;
                                           $mutation_attendance[] = ['date' => $date, 'shift_code' => $shift_code, 'status' => $status];
                                       }
                                   }
                               }
                           }
                       }

                       if ($has_mutation_to_here) {
                           $mutated_agent = $agent;
                           $mutated_agent['attendance'] = $mutation_attendance;
                           $mutated_agent['is_mutated'] = true;
                           $mutated_agent['original_site'] = $other_site['name'];
                           $mutated_agents[] = $mutated_agent;
                       }
                   }
               }
           }

           if (!empty($mutated_agents)) {
               $subsites[] = [
                   'id'     => 'mutated_' . $site_id,
                   'name'   => '🔄 Agents Mutés (Temporaire)',
                   'agents' => $mutated_agents
               ];
           }

           $snapshot_sites[] = [
               'id'       => $site['id'],
               'name'     => $site['name'],
               'icon'     => $site['icon'] ?? '',
               'subsites' => $subsites
           ];
       }

       $archive_id = 'arch_' . time();
       $db['archives'][$archive_id] = [
           'id'          => $archive_id,
           'period'      => $period,
           'sites'       => $snapshot_sites,  // Snapshot complet avec attendance intégrée
           'archived_at' => date('d/m/Y H:i'),
           'archived_by' => $_SESSION['user_name'],
           'sites_count' => count($snapshot_sites)
       ];

       // Also track it as a published period
       $db['published_periods'] = array_values(array_unique(array_merge($db['published_periods'] ?? [], [$period])));

       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
       break;

    case 'get_archives':
       $db = getScopedData($serviceKey);
       $archives = [];
       if (isset($db['archives'])) {
           foreach ($db['archives'] as $id => $a) {
                // Return only metadata (no heavy data)
               $archives[] = [
                   'id' => $id,
                   'period' => $a['period'],
                   'archived_at' => $a['archived_at'],
                   'archived_by' => $a['archived_by'],
                   'sites_count' => count($a['sites'] ?? [])
                ];
            }
        }
        // Sort by date (newest first)
       usort($archives, function ($a, $b) {
           return strcmp($b['id'], $a['id']);
        });
       echo json_encode($archives);
        break;

    case 'get_archive_detail':
       $id = $_GET['id'] ?? '';
       if (!$id) {
           echo json_encode(['success' => false, 'message' => 'ID manquant']);
            break;
        }
       $db = getScopedData($serviceKey);
       if (isset($db['archives'][$id])) {
           echo json_encode($db['archives'][$id]);
        } else {
           echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
        }
        break;

    case 'delete_archive':
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
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
       if ($_SESSION['user_role'] != 'admin') {
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

    case 'get_all_agents':
       $db = getScopedData($serviceKey);
       $agents = [];
       foreach ($db['sites'] as $site) {
           if (!isset($site['subsites']))
                continue;
           foreach ($site['subsites'] as $sub) {
               if (isset($sub['agents'])) {
                   foreach ($sub['agents'] as $agent) {
                       $agents[] = [
                           'id' => $agent['id'],
                           'name' => $agent['name'],
                           'site' => $site['name'],
                           'subsite' => $sub['name'],
                           'function' => $agent['function'] ?? 'AS',
                           'base_salary' => $agent['base_salary'] ?? null
                        ];
                    }
                }
            }
        }
       echo json_encode($agents);
        break;

    case 'get_salaries':
        $period = $_GET['period'] ?? date('Y-m');
        $db = getScopedData($serviceKey);
        
        $settings = $db['settings'] ?? ['cycle_start' => 21, 'cycle_end' => 20];
        $start_day = (int)($settings['cycle_start'] ?? 21);
        $end_day = (int)($settings['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);
        
        $salary_config = $db['salary_config'] ?? [];
        $functions = $db['functions'] ?? [];
        
        $salaries = [];
        foreach ($db['sites'] as $site) {
            if (!isset($site['subsites'])) {
                continue;
            }
            foreach ($site['subsites'] as $sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as $agent) {
                        $agent_id = $agent['id'];
                        
                        // Résolution du salaire de base
                        $func_id = $agent['function'] ?? 'AS';
                        $base = isset($agent['base_salary']) && (int)$agent['base_salary'] > 0 
                            ? (int)$agent['base_salary'] 
                            : (isset($salary_config[$func_id]) ? (int)$salary_config[$func_id] : 75000);
                        
                        // Libellé de la fonction pour l'affichage/impression
                        $function_label = $func_id;
                        foreach ($functions as $f) {
                            if (($f['id'] ?? '') === $func_id) {
                                $function_label = $f['name'] ?? $func_id;
                                break;
                            }
                        }
                        
                        // Calcul des absences
                        $absences = 0;
                        $absence_details = [];
                        if (isset($db['attendance'][$period][$agent_id])) {
                            $agent_att = $db['attendance'][$period][$agent_id];
                            foreach ($dates as $date) {
                                if (isset($agent_att['J'][$date]) && $agent_att['J'][$date] === 'A') {
                                    $absences++;
                                    $absence_details[] = [
                                        'date' => $date,
                                        'shift' => 'Jour'
                                    ];
                                }
                                if (isset($agent_att['N'][$date]) && $agent_att['N'][$date] === 'A') {
                                    $absences++;
                                    $absence_details[] = [
                                        'date' => $date,
                                        'shift' => 'Nuit'
                                    ];
                                }
                            }
                        }
                        
                        // Calcul des vacations supplémentaires (SP)
                        $sp_count = 0;
                        $sp_details = [];
                        if (isset($db['attendance'][$period][$agent_id])) {
                            $agent_att = $db['attendance'][$period][$agent_id];
                            foreach (['S', 'SJ', 'SN'] as $sp_key) {
                                if (isset($agent_att[$sp_key])) {
                                    foreach ($dates as $date) {
                                        if (isset($agent_att[$sp_key][$date])) {
                                            $status = $agent_att[$sp_key][$date];
                                            if ($status !== '' && $status !== 'A' && $status !== 'R') {
                                                $sp_count++;
                                                $shift_label = 'Supplémentaire';
                                                if ($sp_key === 'SJ') $shift_label = 'Supplémentaire Jour';
                                                elseif ($sp_key === 'SN') $shift_label = 'Supplémentaire Nuit';
                                                
                                                $sp_details[] = [
                                                    'date' => $date,
                                                    'shift' => $shift_label
                                                ];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Calcul financier final
                        $deductions = (int)round($absences * ($base / 30));
                        $gains = (int)round($sp_count * ($base / 30)); // 1 suppl. = 1 salaire journalier (base/30), Jour ou Nuit
                        $total = $base - $deductions + $gains;
                        
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
                            'sp_count' => $sp_count,
                            'sp_details' => $sp_details,
                            'deductions' => $deductions,
                            'gains' => $gains,
                            'total' => $total
                        ];
                    }
                }
            }
        }
        echo json_encode($salaries);
        break;

    case 'update_agent_salary':
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $agent_id = $data['agent_id'] ?? '';
       $salary = (int) ($data['salary'] ?? 0);

       $db = getScopedData($serviceKey);
       $found = false;
       foreach ($db['sites'] as &$site) {
           if (!isset($site['subsites']))
                continue;
           foreach ($site['subsites'] as &$sub) {
               if (isset($sub['agents'])) {
                   foreach ($sub['agents'] as &$agent) {
                       if ($agent['id'] == $agent_id) {
                           $agent['base_salary'] = $salary;
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
       $db = getScopedData($serviceKey);
       echo json_encode($db['functions'] ?? [
           ['id' => 'AS', 'name' => 'Agent Simple'],
           ['id' => 'GA', 'name' => 'Garde Armé'],
           ['id' => 'MC', 'name' => 'Maître-Chien'],
           ['id' => 'CP', 'name' => 'Chef de Poste'],
           ['id' => 'Costume', 'name' => 'Agent en Costume']
        ]);
        break;

    case 'save_functions':
       if ($_SESSION['user_role'] != 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $db = getScopedData($serviceKey);
       $db['functions'] = $data['functions'] ?? [];
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
        break;

    case 'get_services_management':
       if (($_SESSION['user_role'] ?? '') !== 'admin' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
       $db = getData();
       $services = $db['services'] ?? [];
       $users = $db['users'] ?? [];

       $usersByService = [];
       foreach ($services as $svc) {
           $usersByService[$svc['id']] = [];
        }

       foreach ($users as $email => $user) {
           if (($user['role'] ?? '') === 'admin') {
                continue;
            }
           $sid = $user['service_id'] ?? '';
           if ($sid === '') {
               foreach ($services as $svc) {
                   if (strtolower((string) ($svc['name'] ?? '')) === strtolower((string) ($user['service'] ?? ''))) {
                       $sid = $svc['id'];
                        break;
                    }
                }
            }
           if ($sid !== '' && isset($usersByService[$sid])) {
               $usersByService[$sid][] = [
                   'email' => $email,
                   'name' => $user['name'] ?? '',
                   'role' => $user['role'] ?? 'user'
                ];
            }
        }

       foreach ($services as &$svc) {
           $svc['permissions'] = array_merge(getDefaultServicePermissions(), $svc['permissions'] ?? []);
           $svc['users'] = $usersByService[$svc['id']] ?? [];
        }
       unset($svc);

       echo json_encode(['success' => true, 'services' => $services]);
        break;

    case 'get_payments_history':
       if (($_SESSION['user_role'] ?? '') !== 'admin') {
           echo json_encode(['success' => false, 'message' => 'Acces refuse']);
            break;
        }

       $db = getData();
       $payments = $db['payments'] ?? [];
       $users = $db['users'] ?? [];
       $result = [];

       foreach ($payments as $p) {
           $email = strtolower((string) ($p['email'] ?? ''));
           $user = $users[$email] ?? [];
           $result[] = [
               'id' => (string) ($p['id'] ?? ''),
               'provider' => (string) ($p['provider'] ?? ''),
               'external_id' => (string) ($p['external_id'] ?? ''),
               'status' => (string) ($p['status'] ?? 'pending'),
               'amount' => (int) ($p['amount'] ?? 0),
               'currency' => (string) ($p['currency'] ?? ''),
               'email' => $email,
               'user_name' => (string) ($user['name'] ?? ''),
               'service' => (string) ($user['service'] ?? ''),
               'months' => (int) (($p['meta']['months'] ?? 1)),
               'created_at' => (string) ($p['created_at'] ?? ''),
               'updated_at' => (string) ($p['updated_at'] ?? '')
            ];
        }

       usort($result, function ($a, $b) {
           return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
        });

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
       $password = generateTemporaryPassword(10);

       $db = getData();
       if (isset($db['users'][$email])) {
           echo json_encode(['success' => false, 'message' => 'Ce Gmail existe déjà']);
            break;
        }

       $services = $db['services'] ?? [];
       $service_id = '';
       foreach ($services as $svc) {
           if (strtolower((string) ($svc['name'] ?? '')) === strtolower($service_name)) {
               $service_id = (string) ($svc['id'] ?? '');
                break;
            }
        }

       if ($service_id === '') {
           $service_id = 'svc_' . time() . '_' . rand(100, 999);
           $services[] = [
               'id' => $service_id,
               'name' => $service_name,
                'permissions' => array_merge(getDefaultServicePermissions(), is_array($permissions) ? $permissions : [])
            ];
        }

       $db['services'] = $services;
       $cfg = getSubscriptionConfig();
       $trialStart = time();
       $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);
       $db['users'][$email] = [
           'password' => password_hash($password, PASSWORD_DEFAULT),
           'name' => $name,
           'role' => $role,
           'role_display_name' => $role_display_name !== '' ? $role_display_name : ($role === 'user' ? 'Administrateur' : ucfirst($role)),
           'service' => $service_name,
           'service_id' => $service_id,
           'trial_started_at' => date('Y-m-d H:i:s', $trialStart),
           'trial_ends_at' => date('Y-m-d H:i:s', $trialEnd),
           'subscription_until' => null,
           'subscription_plan' => (string) ($cfg['plan_code'] ?? 'premium_monthly'),
           'subscription_price' => (int) ($cfg['monthly_price'] ?? 20000),
           'subscription_currency' => (string) ($cfg['currency'] ?? 'XOF')
        ];

       saveData($db);
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

       $db = getData();
       $found = false;
       if (!isset($db['services']) || !is_array($db['services'])) {
           $db['services'] = [];
        }

       foreach ($db['services'] as &$svc) {
           if ((string) ($svc['id'] ?? '') === $service_id) {
               $svc['permissions'] = array_merge(getDefaultServicePermissions(), $permissions);
               $found = true;
                break;
            }
        }
       unset($svc);

       if (!$found) {
           echo json_encode(['success' => false, 'message' => 'Service introuvable']);
            break;
        }

       saveData($db);
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

       $db = getData();
       if (!isset($db['users'][$email])) {
           echo json_encode(['success' => false, 'message' => 'Compte introuvable']);
            break;
        }

       unset($db['users'][$email]);
       saveData($db);
       echo json_encode(['success' => true]);
        break;

    case 'publish_period':
       $period = $data['period'] ?? '';
       if (!$period) {
           echo json_encode(['success' => false, 'message' => 'Période manquante']);
            break;
        }
       $db = getScopedData($serviceKey);
       
       // Le principe est d'écraser l'ancien pointage : on ne conserve que le nouveau
       $db['published_periods'] = [$period];
       
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
        break;

    case 'get_published_periods':
       $db = getScopedData($serviceKey);
       $published = $db['published_periods'] ?? [];
       $archived = isset($db['payroll_archives']) ? array_keys($db['payroll_archives']) : [];
       echo json_encode(['success' => true, 'published_periods' => $published, 'archived_periods' => $archived]);
       break;

    case 'archive_payroll':
       $period = $data['period'] ?? '';
       $salaries_data = $data['salaries'] ?? [];
       $statuses_data = $data['statuses'] ?? [];
       
       if (!$period) {
           echo json_encode(['success' => false, 'message' => 'Période manquante']);
           break;
       }
       
       $db = getScopedData($serviceKey);
       if (!isset($db['payroll_archives'])) {
           $db['payroll_archives'] = [];
       }
       
       $archive = [
           'period' => $period,
           'archived_at' => date('Y-m-d H:i:s'),
           'archived_by' => $_SESSION['user_name'] ?? 'Inconnu',
           'salaries' => $salaries_data,
           'statuses' => $statuses_data
       ];
       
       // Option A : écraser l'archive existante pour ce mois
       $db['payroll_archives'][$period] = $archive;
       
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
       break;

    case 'get_payroll_archives':
       $db = getScopedData($serviceKey);
       $archives = [];
       if (isset($db['payroll_archives'])) {
           foreach ($db['payroll_archives'] as $period => $a) {
               $archives[] = [
                   'period' => $period,
                   'archived_at' => $a['archived_at'],
                   'archived_by' => $a['archived_by']
               ];
           }
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
       $db = getScopedData($serviceKey);
       if (isset($db['payroll_archives'][$period])) {
           echo json_encode(['success' => true, 'archive' => $db['payroll_archives'][$period]]);
       } else {
           echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
       }
       break;

    case 'get_payslip_template':
       $db = getScopedData($serviceKey);
       $template = $db['payslip_template'] ?? [];
       echo json_encode(['success' => true, 'template' => $template]);
       break;

    case 'save_payslip_template':
       $db = getScopedData($serviceKey);
       $db['payslip_template'] = $data['template'] ?? [];
       saveScopedData($db, $serviceKey);
       echo json_encode(['success' => true]);
       break;

    case 'get_inter_service_messages':
       $db = getData();
       if (!isset($db['inter_service_messages'])) $db['inter_service_messages'] = [];
       $my_service = resolveCurrentServiceKey($db);
       $messages = [];
       foreach ($db['inter_service_messages'] as $m) {
           if ($m['to_service'] === 'all' || $m['to_service'] === $my_service || $m['from_service'] === $my_service || (($_SESSION['user_role']??'') === 'super_admin')) {
               $messages[] = $m;
           }
       }
       echo json_encode(['success' => true, 'messages' => $messages]);
       break;

    case 'send_inter_service_message':
       $db = getData();
       if (!isset($db['inter_service_messages'])) $db['inter_service_messages'] = [];
       $my_service = resolveCurrentServiceKey($db);
       $content = trim($data['content'] ?? '');
       $to_service = trim($data['to_service'] ?? '');
       if (!$content || !$to_service) {
           echo json_encode(['success' => false, 'message' => 'Données manquantes']);
           break;
       }
       $db['inter_service_messages'][] = [
           'id' => uniqid('msg_'),
           'from_service' => $my_service,
           'from_user' => $_SESSION['user_name'] ?? 'Utilisateur',
           'to_service' => $to_service,
           'content' => $content,
           'timestamp' => date('Y-m-d H:i:s')
       ];
       saveData($db);
       echo json_encode(['success' => true]);
       break;

    case 'get_tickets':
       $db = getData();
       if (!isset($db['tickets'])) $db['tickets'] = [];
       $my_service = resolveCurrentServiceKey($db);
       $is_super_admin = (($_SESSION['user_role'] ?? '') === 'super_admin');
       $tickets = [];
       foreach ($db['tickets'] as $t) {
           if ($is_super_admin || $t['from_service'] === $my_service || $t['to_service'] === $my_service) {
               $tickets[] = $t;
           }
       }
       echo json_encode(['success' => true, 'tickets' => $tickets]);
       break;

    case 'create_ticket':
       $db = getData();
       if (!isset($db['tickets'])) $db['tickets'] = [];
       $my_service = resolveCurrentServiceKey($db);
       $title = trim($data['title'] ?? '');
       $content = trim($data['content'] ?? '');
       $to_service = trim($data['to_service'] ?? '');
       if (!$title || !$content || !$to_service) {
           echo json_encode(['success' => false, 'message' => 'Données manquantes']);
           break;
       }
       $db['tickets'][] = [
           'id' => uniqid('tk_'),
           'title' => $title,
           'content' => $content,
           'from_service' => $my_service,
           'from_user' => $_SESSION['user_name'] ?? 'Utilisateur',
           'to_service' => $to_service,
           'status' => 'open',
           'timestamp' => date('Y-m-d H:i:s')
       ];
       saveData($db);
       echo json_encode(['success' => true]);
       break;

    case 'update_ticket_status':
       $db = getData();
       if (!isset($db['tickets'])) $db['tickets'] = [];
       $ticket_id = $data['ticket_id'] ?? '';
       $status = $data['status'] ?? '';
       $found = false;
       foreach ($db['tickets'] as &$t) {
           if ($t['id'] === $ticket_id) {
               $t['status'] = $status;
               $found = true;
               break;
           }
       }
       if ($found) saveData($db);
       echo json_encode(['success' => $found]);
       break;

    case 'update_user_permissions':
       $updater_role = $_SESSION['user_role'] ?? '';
       if ($updater_role !== 'super_admin' && $updater_role !== 'admin') {
           echo json_encode(['success' => false, 'message' => 'Accès refusé']);
           break;
       }
       $updater_company_id = $_SESSION['company_id'] ?? '';
       $targetEmail = $data['email'] ?? '';
       $newPermissions = $data['permissions'] ?? [];
       if (!$targetEmail) {
           echo json_encode(['success' => false, 'message' => 'Email manquant']);
           break;
       }
       $db = getData();
       if (!isset($db['users'][$targetEmail])) {
           echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
           break;
       }
       
       $targetUser = $db['users'][$targetEmail];
       if ($updater_role === 'admin' && ($targetUser['company_id'] ?? '') !== $updater_company_id) {
           echo json_encode(['success' => false, 'message' => 'Vous ne pouvez modifier que les utilisateurs de votre entreprise']);
           break;
       }
       
       $permObj = [];
       $allModules = ['dashboard','verification','payroll','kiosk','salaries','fluctuation','archives','communication','services'];
       foreach ($allModules as $mod) {
           $permObj[$mod] = is_array($newPermissions) && in_array($mod, $newPermissions);
       }
       $db['users'][$targetEmail]['permissions'] = $permObj;
       
       saveData($db);
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

    default:
       echo json_encode(['error' => 'Action inconnue']);
}
