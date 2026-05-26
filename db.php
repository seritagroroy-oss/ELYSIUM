<?php
// data.php - Simple JSON-based data store to avoid SQLite dependency issues
define('DATA_FILE', __DIR__ . '/pointage_db.json');

function loadEnvFile($path = null)
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    if ($path === null) {
        $path = __DIR__ . '/.env';
    }
    if (!is_file($path)) {
        return;
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim((string) $line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $key = trim($parts[0]);
        $value = trim($parts[1]);
        if ($key === '') {
            continue;
        }

        if (
            (strlen($value) >= 2) &&
            (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

loadEnvFile();

function getDefaultServicePermissions()
{
    return [
        'can_view_dashboard' => true,
        'can_edit_dashboard' => true,
        'can_view_archives' => true,
        'can_view_salaries' => true,
        'can_view_settings' => false,
        'communication' => true
    ];
}

function getAdminPermissions()
{
    return [
        'dashboard' => true,
        'verification' => true,
        'payroll' => true,
        'kiosk' => true,
        'salaries' => true,
        'fluctuation' => true,
        'archives' => true,
        'settings' => true,
        'services' => true,
        'communication' => true
    ];
}

function getSuperAdminPermissions()
{
    $perms = getAdminPermissions();
    $perms['can_manage_workspaces'] = true;
    return $perms;
}

function getSubscriptionConfig()
{
    return [
        'trial_days' => 15,
        'monthly_price' => 20000,
        'currency' => 'XOF',
        'plan_code' => 'premium_monthly',
        'plan_name' => 'Premium Mensuel'
    ];
}

function getPaymentConfig()
{
    $cinetpayApiKey = getenv('CINETPAY_API_KEY') ?: '';
    $cinetpaySiteId = getenv('CINETPAY_SITE_ID') ?: '';
    $cinetpayEnabled = ($cinetpayApiKey !== '' && $cinetpaySiteId !== '');
    return [
        'stripe_secret_key' => getenv('STRIPE_SECRET_KEY') ?: '',
        'stripe_publishable_key' => getenv('STRIPE_PUBLISHABLE_KEY') ?: '',
        'enable_orange_money' => $cinetpayEnabled || (getenv('ENABLE_ORANGE_MONEY') ?: '0') === '1',
        'enable_wave' => $cinetpayEnabled || (getenv('ENABLE_WAVE') ?: '0') === '1',
        'cinetpay_api_key' => $cinetpayApiKey,
        'cinetpay_site_id' => $cinetpaySiteId
    ];
}

function ensureUserSubscriptionData(&$user)
{
    $cfg = getSubscriptionConfig();
    $trialDays = (int) ($cfg['trial_days'] ?? 15);
    $changed = false;

    if (empty($user['trial_started_at'])) {
        $user['trial_started_at'] = date('Y-m-d H:i:s');
        $changed = true;
    }
    if (empty($user['trial_ends_at'])) {
        $startTs = strtotime((string) $user['trial_started_at']);
        if ($startTs === false) {
            $startTs = time();
            $user['trial_started_at'] = date('Y-m-d H:i:s', $startTs);
        }
        $user['trial_ends_at'] = date('Y-m-d H:i:s', strtotime('+' . $trialDays . ' days', $startTs));
        $changed = true;
    }
    if (!array_key_exists('subscription_until', $user)) {
        $user['subscription_until'] = null;
        $changed = true;
    }
    if (empty($user['subscription_plan'])) {
        $user['subscription_plan'] = $cfg['plan_code'];
        $changed = true;
    }
    if (!isset($user['subscription_price'])) {
        $user['subscription_price'] = (int) ($cfg['monthly_price'] ?? 20000);
        $changed = true;
    }
    if (empty($user['subscription_currency'])) {
        $user['subscription_currency'] = (string) ($cfg['currency'] ?? 'XOF');
        $changed = true;
    }
    return $changed;
}

function getOwnerAdminEmail($db = null, $serviceId = '')
{
    if (!is_array($db)) {
        $db = getData();
    }
    $users = $db['users'] ?? [];
    
    // Si un service_id est fourni, chercher d'abord l'admin de ce service
    if ($serviceId !== '') {
        foreach ($users as $email => $user) {
            if (($user['role'] ?? '') === 'admin' && ($user['service_id'] ?? '') === $serviceId) {
                return strtolower((string) $email);
            }
        }
    }

    // Fallback: chercher le premier admin disponible
    foreach ($users as $email => $user) {
        if (($user['role'] ?? '') === 'admin') {
            return strtolower((string) $email);
        }
    }
    return 'admin@gmail.com';
}

function buildSubscriptionStateFromUser($user, $cfg, $messagePrefix = '')
{
    ensureUserSubscriptionData($user);
    $now = time();
    $trialEndTs = strtotime((string) ($user['trial_ends_at'] ?? ''));
    $subUntilTs = strtotime((string) ($user['subscription_until'] ?? ''));

    if ($subUntilTs !== false && $subUntilTs >= $now) {
        $subDays = (int) ceil(($subUntilTs - $now) / 86400);
        if ($subDays < 0) {
            $subDays = 0;
        }
        return [
            'access_allowed' => true,
            'status' => 'active',
            'message' => trim($messagePrefix . ' Abonnement actif'),
            'trial_days_left' => 0,
            'subscription_days_left' => $subDays,
            'trial_ends_at' => $user['trial_ends_at'] ?? null,
            'subscription_until' => $user['subscription_until'] ?? null,
            'monthly_price' => (int) ($cfg['monthly_price'] ?? 20000),
            'currency' => (string) ($cfg['currency'] ?? 'XOF'),
            'plan_code' => (string) ($cfg['plan_code'] ?? 'premium_monthly')
        ];
    }

    if ($trialEndTs !== false && $trialEndTs >= $now) {
        $trialStartTs = strtotime((string) ($user['trial_started_at'] ?? ''));
        if ($trialStartTs === false) {
            $trialStartTs = $now;
        }

        // Calcul basé sur la différence de date (jours calendaires)
        $startDate = new DateTime();
        $startDate->setTimestamp($trialStartTs);
        $startDate->setTime(0, 0, 0);

        $today = new DateTime();
        $today->setTimestamp($now);
        $today->setTime(0, 0, 0);

        $diff = $startDate->diff($today);
        $daysPassed = (int) $diff->days;

        $totalTrialDays = (int) ($cfg['trial_days'] ?? 15);
        $trialDays = $totalTrialDays - $daysPassed;

        // Sécurité : si le calcul donne 0 mais que le timestamp n'est pas encore dépassé, on affiche 1
        if ($trialDays <= 0 && $trialEndTs > $now) {
            $trialDays = 1;
        }

        if ($trialDays < 0) {
            $trialDays = 0;
        }

        return [
            'access_allowed' => true,
            'status' => 'trial',
            'message' => trim($messagePrefix . ' Essai gratuit en cours'),
            'trial_days_left' => $trialDays,
            'subscription_days_left' => 0,
            'trial_ends_at' => $user['trial_ends_at'] ?? null,
            'subscription_until' => $user['subscription_until'] ?? null,
            'monthly_price' => (int) ($cfg['monthly_price'] ?? 20000),
            'currency' => (string) ($cfg['currency'] ?? 'XOF'),
            'plan_code' => (string) ($cfg['plan_code'] ?? 'premium_monthly')
        ];
    }

    return [
        'access_allowed' => false,
        'status' => 'expired',
        'message' => trim($messagePrefix . ' Abonnement admin requis'),
        'trial_days_left' => 0,
        'subscription_days_left' => 0,
        'trial_ends_at' => $user['trial_ends_at'] ?? null,
        'subscription_until' => $user['subscription_until'] ?? null,
        'monthly_price' => (int) ($cfg['monthly_price'] ?? 20000),
        'currency' => (string) ($cfg['currency'] ?? 'XOF'),
        'plan_code' => (string) ($cfg['plan_code'] ?? 'premium_monthly')
    ];
}

function getUserSubscriptionState($email, $db = null)
{
    $cfg = getSubscriptionConfig();
    if (!is_array($db)) {
        $db = getData();
    }
    $email = strtolower((string) $email);
    $user = $db['users'][$email] ?? null;
    if (!$user) {
        return [
            'access_allowed' => false,
            'status' => 'unknown',
            'message' => 'Compte introuvable',
            'trial_days_left' => 0,
            'subscription_days_left' => 0,
            'trial_ends_at' => null,
            'subscription_until' => null,
            'monthly_price' => (int) ($cfg['monthly_price'] ?? 20000),
            'currency' => (string) ($cfg['currency'] ?? 'XOF'),
            'plan_code' => (string) ($cfg['plan_code'] ?? 'premium_monthly')
        ];
    }

    // 1. Vérifier si l'utilisateur LUI-MEME a un essai valide ou un abonnement actif (s'il est admin)
    $userSelfState = buildSubscriptionStateFromUser($user, $cfg, 'Votre compte.');
    if ($userSelfState['access_allowed']) {
        $userSelfState['owner_admin_email'] = $email;
        return $userSelfState;
    }

    // 2. S'il n'a pas/plus d'accès, on vérifie l'admin de son service
    $serviceId = $user['service_id'] ?? '';
    $ownerEmail = getOwnerAdminEmail($db, $serviceId);
    
    // Si l'utilisateur est LUI-MEME l'admin de son service, et que son accès est expiré (vérifié plus haut)
    // On retourne son propre état (qui sera un état expiré)
    if ($email === $ownerEmail) {
        $userSelfState['owner_admin_email'] = $email;
        return $userSelfState;
    }

    $ownerUser = $db['users'][$ownerEmail] ?? null;
    if (!$ownerUser) {
        return [
            'access_allowed' => false,
            'status' => 'unknown',
            'message' => 'Compte administrateur introuvable pour ce service',
            'trial_days_left' => 0,
            'subscription_days_left' => 0,
            'trial_ends_at' => null,
            'subscription_until' => null,
            'monthly_price' => (int) ($cfg['monthly_price'] ?? 20000),
            'currency' => (string) ($cfg['currency'] ?? 'XOF'),
            'plan_code' => (string) ($cfg['plan_code'] ?? 'premium_monthly'),
            'owner_admin_email' => $ownerEmail
        ];
    }

    $prefix = 'Dépend du compte admin.';
    $state = buildSubscriptionStateFromUser($ownerUser, $cfg, $prefix);
    $state['owner_admin_email'] = $ownerEmail;
    return $state;
}

function activatePlatformSubscription($months = 1, $email = null)
{
    $db = getData();
    $ownerEmail = $email ? $email : getOwnerAdminEmail($db);
    return activateSubscriptionForUser($ownerEmail, $months);
}

function activateSubscriptionForUser($email, $months = 1)
{
    $db = getData();
    if (!isset($db['users'][$email])) {
        return false;
    }

    $months = (int) $months;
    if ($months < 1) {
        $months = 1;
    }
    if ($months > 12) {
        $months = 12;
    }

    $cfg = getSubscriptionConfig();
    $user = &$db['users'][$email];
    ensureUserSubscriptionData($user);

    $now = time();
    $baseTs = $now;
    $existingTs = strtotime((string) ($user['subscription_until'] ?? ''));
    if ($existingTs !== false && $existingTs > $now) {
        $baseTs = $existingTs;
    }

    $until = (new DateTime())->setTimestamp($baseTs);
    $until->modify('+' . $months . ' month');

    $user['subscription_until'] = $until->format('Y-m-d H:i:s');
    $user['subscription_plan'] = (string) ($cfg['plan_code'] ?? 'premium_monthly');
    $user['subscription_price'] = (int) ($cfg['monthly_price'] ?? 20000);
    $user['subscription_currency'] = (string) ($cfg['currency'] ?? 'XOF');

    return saveData($db);
}

function ensureDataShape($data)
{
    $changed = false;
    if (!isset($data['users']) || !is_array($data['users'])) {
        $data['users'] = [];
        $changed = true;
    }
    if (!isset($data['sites']) || !is_array($data['sites'])) {
        $data['sites'] = [];
        $changed = true;
    }
    if (!isset($data['attendance']) || !is_array($data['attendance'])) {
        $data['attendance'] = [];
        $changed = true;
    }
    if (!isset($data['messages']) || !is_array($data['messages'])) {
        $data['messages'] = [];
        $changed = true;
    }
    if (!isset($data['settings']) || !is_array($data['settings'])) {
        $data['settings'] = ['cycle_start' => 21, 'cycle_end' => 20];
        $changed = true;
    }
    if (!isset($data['services']) || !is_array($data['services'])) {
        $data['services'] = [];
        $changed = true;
    }
    if (!isset($data['payments']) || !is_array($data['payments'])) {
        $data['payments'] = [];
        $changed = true;
    }
    if (!isset($data['manual_adjustments']) || !is_array($data['manual_adjustments'])) {
        $data['manual_adjustments'] = [];
        $changed = true;
    }
    if (!isset($data['site_revenues']) || !is_array($data['site_revenues'])) {
        $data['site_revenues'] = [];
        $changed = true;
    }
    if (!isset($data['inter_service_messages']) || !is_array($data['inter_service_messages'])) {
        $data['inter_service_messages'] = [];
        $changed = true;
    }
    if (!isset($data['tickets']) || !is_array($data['tickets'])) {
        $data['tickets'] = [];
        $changed = true;
    }

    $existingByName = [];
    foreach ($data['services'] as &$service) {
        if (!isset($service['id']) || $service['id'] === '') {
            $service['id'] = 'svc_' . substr(md5((string) ($service['name'] ?? '') . microtime(true)), 0, 8);
            $changed = true;
        }
        if (!isset($service['name']) || $service['name'] === '') {
            $service['name'] = 'Service';
            $changed = true;
        }
        $originalPerms = $service['permissions'] ?? [];
        $service['permissions'] = array_merge(getDefaultServicePermissions(), $originalPerms);
        if ($service['permissions'] !== $originalPerms) {
            $changed = true;
        }
        $existingByName[strtolower(trim($service['name']))] = true;
    }
    unset($service);

    $serviceIdByName = [];
    foreach ($data['services'] as $svc) {
        $serviceIdByName[strtolower(trim((string) ($svc['name'] ?? '')))] = $svc['id'] ?? '';
    }

    foreach ($data['users'] as $email => &$user) {
        if ($email === 'admin@gmail.com' && (!isset($user['role']) || $user['role'] !== 'super_admin')) {
            $user['role'] = 'super_admin';
            $changed = true;
        } elseif (!isset($user['role'])) {
            $user['role'] = 'user';
            $changed = true;
        }
        if (!isset($user['role_display_name'])) {
            if ($user['role'] === 'super_admin') $user['role_display_name'] = 'Directeur Général';
            elseif ($user['role'] === 'admin') $user['role_display_name'] = 'Chef de Service';
            else $user['role_display_name'] = 'Agent';
            $changed = true;
        }
        if (!isset($user['service'])) {
            $user['service'] = 'Direction Générale';
            $changed = true;
        }
        if ($user['role'] === 'admin' && !isset($user['permissions'])) {
            $user['permissions'] = getAdminPermissions();
            $changed = true;
        }
        if ($user['role'] === 'super_admin' && !isset($user['permissions'])) {
            $user['permissions'] = getSuperAdminPermissions();
            $changed = true;
        }
        if (ensureUserSubscriptionData($user)) {
            $changed = true;
        }

        $svcKey = strtolower(trim((string) $user['service']));
        if ($svcKey === '') {
            continue;
        }
        if (empty($user['service_id']) && isset($serviceIdByName[$svcKey]) && $serviceIdByName[$svcKey] !== '') {
            $user['service_id'] = $serviceIdByName[$svcKey];
            $changed = true;
        }
        if (!isset($existingByName[$svcKey])) {
            $serviceId = 'svc_' . substr(md5($svcKey), 0, 8);
            $data['services'][] = [
                'id' => $serviceId,
                'name' => $user['service'],
                'permissions' => getDefaultServicePermissions()
            ];
            $existingByName[$svcKey] = true;
            $serviceIdByName[$svcKey] = $serviceId;
            if (empty($user['service_id'])) {
                $user['service_id'] = $serviceId;
            }
            $changed = true;
        }
    }
    unset($user);

    return [$data, $changed];
}

function getServicePermissions($db, $serviceId, $serviceName)
{
    $defaults = getDefaultServicePermissions();
    if (!isset($db['services']) || !is_array($db['services'])) {
        return $defaults;
    }

    foreach ($db['services'] as $service) {
        if (!empty($serviceId) && (string) ($service['id'] ?? '') === (string) $serviceId) {
            return array_merge($defaults, $service['permissions'] ?? []);
        }
        if (!empty($serviceName) && strtolower((string) ($service['name'] ?? '')) === strtolower((string) $serviceName)) {
            return array_merge($defaults, $service['permissions'] ?? []);
        }
    }

    return $defaults;
}

function getUserPermissionsByEmail($email)
{
    $db = getData();
    $user = $db['users'][$email] ?? null;
    if (!$user) {
        return getDefaultServicePermissions();
    }
    if (($user['role'] ?? '') === 'super_admin') {
        return getSuperAdminPermissions();
    }
    
    $basePerms = ($user['role'] ?? '') === 'admin' ? getAdminPermissions() : getDefaultServicePermissions();

    if (isset($user['permissions']) && is_array($user['permissions'])) {
        return array_merge($basePerms, $user['permissions']);
    }

    return $basePerms;

    return getServicePermissions($db, $user['service_id'] ?? '', $user['service'] ?? '');
}

function getData()
{
    $empty_db = [
        'users' => [
            'admin@gmail.com' => [
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'name' => 'Administrateur',
                'role' => 'super_admin',
                'role_display_name' => 'Directeur Général',
                'service' => 'Direction Générale'
            ]
        ],
        'sites' => [],
        'attendance' => [],
        'messages' => [],
        'inter_service_messages' => [],
        'tickets' => [],
        'settings' => ['cycle_start' => 21, 'cycle_end' => 20],
        'payments' => []
    ];

    if (!file_exists(DATA_FILE)) {
        saveData($empty_db);
        return $empty_db;
    }

    $fp = fopen(DATA_FILE, 'r');
    if (!$fp) {
        return $empty_db;
    }

    if (!flock($fp, LOCK_SH)) {
        fclose($fp);
        return $empty_db;
    }

    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if ($content === false) {
        return $empty_db;
    }

    $data = json_decode($content, true);
    if (!is_array($data))
        return $empty_db;

    list($data, $changed) = ensureDataShape($data);
    if ($changed) {
        saveData($data);
    }

    return $data;
}

function saveData($data)
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    $fp = fopen(DATA_FILE, 'c+');
    if (!$fp) {
        return false;
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }

    ftruncate($fp, 0);
    rewind($fp);
    $written = fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $written !== false;
}

// Helper to get user by email
function getUserByEmail($email)
{
    $data = getData();
    return $data['users'][$email] ?? null;
}

// Helper for sites
function getSites()
{
    $data = getData();
    return $data['sites'] ?? [];
}

function addSite($name)
{
    $data = getData();
    foreach ($data['sites'] as $site) {
        if ($site['name'] === $name)
            return false;
    }
    $id = time();
    $data['sites'][] = [
        'id' => $id,
        'name' => $name,
        'subsites' => [
            ['id' => $id . '_1', 'name' => 'Zone Principale', 'agents' => []]
        ]
    ];
    saveData($data);
    return true;
}

// ─── ENTREPRISES (COMPANIES) ────────────────────────────────────────────────
function getCompanyById($db, $company_id)
{
    if (!isset($db['companies']) || !is_array($db['companies'])) {
        return null;
    }
    foreach ($db['companies'] as $comp) {
        if ($comp['id'] === $company_id) {
            return $comp;
        }
    }
    return null;
}

function createCompany(&$db, $name, $owner_email)
{
    if (!isset($db['companies'])) {
        $db['companies'] = [];
    }
    $company_id = 'comp_' . substr(md5($name . microtime(true)), 0, 8);
    $db['companies'][] = [
        'id' => $company_id,
        'name' => trim($name),
        'created_at' => date('c'),
        'owner_email' => $owner_email
    ];
    return $company_id;
}

function addPaymentRecord($provider, $externalId, $email, $amount, $currency, $meta = [])
{
    $db = getData();
    if (!isset($db['payments']) || !is_array($db['payments'])) {
        $db['payments'] = [];
    }

    $db['payments'][] = [
        'id' => 'pay_' . time() . '_' . rand(1000, 9999),
        'provider' => (string) $provider,
        'external_id' => (string) $externalId,
        'email' => strtolower((string) $email),
        'amount' => (int) $amount,
        'currency' => (string) $currency,
        'status' => 'pending',
        'meta' => is_array($meta) ? $meta : [],
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];

    return saveData($db);
}

function markPaymentAsPaid($provider, $externalId)
{
    $db = getData();
    if (!isset($db['payments']) || !is_array($db['payments'])) {
        return false;
    }

    $changed = false;
    foreach ($db['payments'] as &$payment) {
        if (($payment['provider'] ?? '') === $provider && ($payment['external_id'] ?? '') === $externalId) {
            $payment['status'] = 'paid';
            $payment['updated_at'] = date('Y-m-d H:i:s');
            $changed = true;
            break;
        }
    }
    unset($payment);

    if (!$changed) {
        return false;
    }
    return saveData($db);
}

function getPaymentByProviderExternalId($provider, $externalId)
{
    $db = getData();
    $payments = $db['payments'] ?? [];
    foreach ($payments as $payment) {
        if (($payment['provider'] ?? '') === $provider && ($payment['external_id'] ?? '') === $externalId) {
            return $payment;
        }
    }
    return null;
}
