<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
}
// Désactiver l'affichage direct des erreurs (pour ne pas corrompre le JSON)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors_custom.log');

// Configuration des cookies de session (avant session_start)
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', '1');
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');
ini_set('session.use_strict_mode', '1');
// Durée de vie de la session étendue à 30 jours (en secondes)
$sessionLifetime = 30 * 24 * 60 * 60; // 30 jours
ini_set('session.gc_maxlifetime', $sessionLifetime);
ini_set('session.cookie_lifetime', $sessionLifetime);
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

if (isset($_GET['action']) && $_GET['action'] === 'my_mysql_check') {
    require_once __DIR__ . '/backend/database.php';
    $db = getDb();
    try {
        $res = $db->query("SHOW CREATE TABLE service_data");
        echo json_encode($res);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

session_start();
file_put_contents('debug_session.txt', print_r($_SESSION, true));
$action = $_GET['action'] ?? ($_POST['action'] ?? '');


if ($action === 'debug_dddd') {
    require_once __DIR__ . '/backend/database.php';
    $sqlite = getDb();
    $agents = $sqlite->query("SELECT id, name, created_at FROM agents WHERE name LIKE '%dddd%'");
    
    $stmt2 = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ?");
    $stmt2->execute([$agents[0]['id'] ?? 0]);
    
    echo json_encode(['agents' => $agents, 'att' => $stmt2->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}


require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/utils.php';
$action = $_GET['action'] ?? '';
require_once __DIR__ . '/backend/core/functions.php';

if (isset($_GET['action']) && $_GET['action'] === 'SECRET_FIX') {
    $db = getDb();
    $stmt = $db->query("SELECT id, name, subsite_id FROM agents WHERE subsite_id IN (SELECT id FROM subsites WHERE site_id = 'site_extras_sur_site')");
    $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents(__DIR__ . '/agents_dump_v4.txt', print_r($agents, true));
    echo json_encode(["status" => "SUCCESS_SECRET_FIX_V4"]);
    exit;
}

if (isset($_GET['action']) && $_GET['action'] === 'test_dates') {
    if (file_exists(__DIR__ . '/backend/modules/debug_schedule.txt')) {
        echo file_get_contents(__DIR__ . '/backend/modules/debug_schedule.txt');
    } else {
        echo "File not found";
    }
    exit;
}

// ─── Génération du token CSRF ─────────────────────────────────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// ─── Libération immédiate du verrou de session ────────────────────────────────
// PHP verrouille le fichier de session exclusivement → toutes les requêtes
// parallèles attendent en file. Pour les routes qui ne modifient PAS la session,
// on libère le verrou dès maintenant pour permettre la concurrence.
$_session_write_routes = ['login', 'logout', 'register', 'get_user_info', 'save_user_settings',
                          'update_profile', 'change_password', 'impersonate', 'stop_impersonation',
                          'set_nav_state', 'get_nav_state', 'clear_nav_state'];
if (!in_array($action, $_session_write_routes)) {
    session_write_close();
}

// ─── En-têtes de sécurité ────────────────────────────────────────────────────
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Répondre immédiatement aux requêtes preflight OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (isset($_GET['action']) && $_GET['action'] === 'whereami') {
    echo json_encode(['dir' => __DIR__]);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if ($action === 'debug_dddd') {
    $sqlite = getDb();
    $stmt = $sqlite->prepare("SELECT id, name, created_at FROM agents WHERE name LIKE '%dddd%'");
    $stmt->execute();
    $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt2 = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ?");
    $stmt2->execute([$agents[0]['id'] ?? 0]);
    
    echo json_encode(['agents' => $agents, 'att' => $stmt2->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$data   = is_array($data) ? $data : [];
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = array_merge($data, $_GET);
}

// ─── Middleware d'authentification global ────────────────────────────────────
// Routes accessibles sans session (connexion, inscription, réinitialisation mot de passe)
$public_actions = ['login', 'logout', 'register', 'request_password_reset', 'login_agent_portal', 'register_agent_portal', 'cinetpay_notify', 'get_user_info', 'debug_dddd'];
if (!in_array($action, $public_actions) && !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié', 'code' => 401]);
    exit;
}

// ─── Protection CSRF (toutes les requêtes POST sauf login/register) ───────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !in_array($action, $public_actions)) {
    $client_token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals((string)($_SESSION['csrf_token'] ?? ''), $client_token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Token CSRF invalide', 'code' => 403]);
        exit;
    }
}

// ─── Routeur principal ────────────────────────────────────────────────────────
// Utilise if/elseif pour éviter les switch imbriqués (incompatibles avec require_once
// dans un switch quand le module inclus a lui-même un switch)

// Note: $action et $data sont déjà définis dans le middleware ci-dessus
if (in_array($action, [
    'get_sites','add_site','add_special_site','update_site_icon','delete_site',
    'rename_site','add_subsite','rename_subsite','delete_subsite','get_site_data',
    'add_agent','delete_agent','get_archived_agents','update_agent_profile','update_agent_special_service','update_agent_admin_schedule',
    'update_agent_info','update_agent_salary','get_functions','save_functions',
    'archive_all_sites','get_archives','get_archive_detail','delete_archive',
    'clear_site_mutations','clear_agent_site_mutations','delete_agent_mutations','get_agent_schedules','update_agent_schedules','update_subsite_config',
    'get_lost_sites', 'toggle_blacklist', 'get_closure_alerts', 'ack_closure_alert', 'get_site_agents', 'move_agent_zone', 'toggle_permanent_supplement'
])) {
    require_once __DIR__ . '/backend/modules/sites_v2.php';

} elseif (in_array($action, [
    'update_attendance','bulk_update_attendance',
    'mark_agent_sortant','delete_agent_sortant','mark_agent_entrant','delete_agent_entrant','mark_agent_debut',
    'apply_mutation','apply_batch_rotation','init_site_period',
    'add_external_supp','get_external_supp_details','delete_external_supp',
    'get_treated_agents','toggle_treated_agent'
])) {
    require_once __DIR__ . '/backend/modules/attendance.php';


} elseif (in_array($action, [
    'login','logout','get_user_info','save_user_settings','complete_onboarding',
    'save_calendar_progress', 'get_calendar_progress',
    'upload_profile_photo','send_private_message','get_private_messages',
    'update_user_status','toggle_user_maintenance','impersonate_user',
    'stop_impersonation','update_profile','switch_service','get_all_companies',
    'get_all_users','get_schema','jarvisse_chat','register','request_password_reset',
    'set_lang','get_payment_providers','get_subscription_status','set_nav_state','get_nav_state','clear_nav_state'
])) {
    require_once __DIR__ . '/backend/modules/auth.php';

} elseif (in_array($action, [
    'get_dashboard_init','get_analytics','get_pointage_agents_for_reclamation',
    'archive_pointage','get_archives_pointage_list','get_archive_pointage_detail',
    'get_pointage_for_archive'
])) {
    require_once __DIR__ . '/backend/modules/pointage.php';

} elseif (in_array($action, [
    'get_salary_config','update_salary_config','save_settings','save_manual_adjustment',
    'delete_manual_adjustment','save_payroll_archive','delete_payroll_archive',
    'save_site_revenue','change_agent_shift','delete_shift_change','init_next_period','reset_year_attendance',
    'get_sanctions','save_sanction','delete_sanction','register_agent_portal',
    'login_agent_portal','get_portal_registrations','update_portal_registration',
    'get_payroll_archives','get_payroll_archive_detail','get_settings','get_salaries',
    'get_payroll_init','get_dashboard_history','get_payroll_settings','save_payroll_settings',
    'upload_company_logo','get_annual_cumuls','get_payroll_variables',
    'save_payroll_variables','get_payroll_loans','add_payroll_loan','delete_payroll_loan',
    'update_agent_contract','get_leaves','dump_leaves','save_leave','delete_leave',
    'dev_unpublish_period','publish_period','unpublish_period','get_published_periods',
    'get_latest_publication','get_messages','set_first_visit_period','save_reclamation',
    'update_payment_status','save_payroll_status','get_payroll_statuses','bulk_save_payroll_status'
])) {
    require_once __DIR__ . '/backend/modules/salaries.php';

} elseif (in_array($action, [
    'admin_create_account','admin_reset_password','get_services_management',
    'create_service_account','update_service_permissions','delete_service_account',
    'update_user_permissions','get_company_users'
])) {
    require_once __DIR__ . '/backend/modules/admin.php';

} elseif (in_array($action, [
    'get_inter_service_messages','send_inter_service_message','react_to_message',
    'create_ticket','get_pending_password_resets','get_tickets','update_ticket_status',
    'assign_ticket','add_ticket_comment','get_services_list','set_typing_status',
    'toggle_pin_message','rate_ticket'
])) {
    require_once __DIR__ . '/backend/modules/messaging.php';

} elseif (in_array($action, [
    'create_checkout_session','confirm_stripe_payment','confirm_cinetpay_payment',
    'cinetpay_notify','activate_subscription','get_payments_history'
])) {
    require_once __DIR__ . '/backend/modules/payments.php';

} elseif (in_array($action, [
    'archive_payroll','get_payslip_template','save_payslip_template','update_user_photo',
    'get_stats','pointage_gps','validate_qr','get_all_agents','get_agents_for_admin',
    'get_special_agents','save_special_agent','remove_special_agent',
    'close_payroll_fluctuation','save_salary_grid','save_site_contracts',
    'save_subsite_contracts','archive_contract_rupture','get_contract_ruptures',
    'save_monthly_variables','get_compta_data','get_services','publish_reclamations',
    'batch_update_reclamations','get_latest_publication_reclamations',
    'set_global_security_alert','send_reclamation_feedback','add_reclamation',
    'get_radio_signatures','save_radio_signature','get_reclamations',
    'update_reclamation_status','send_pub_feedback','get_feedback_history',
    'get_latest_feedback','get_fluctuation_archives','get_fluctuation_analytics','get_fluctuation_trends'
])) {
    require_once __DIR__ . '/backend/modules/facturation.php';

} elseif (in_array($action, [
    'get_leave_types','get_my_leave_balances','get_my_leave_requests',
    'submit_leave_request','get_leave_requests','process_leave_request',
    'get_all_leave_balances','get_leave_settings','update_leave_settings',
    'upload_leave_attachment','admin_add_leave_request','get_permissions',
    'add_permission','delete_permission','get_contracts','add_contract',
    'update_contract_status','delete_contract','get_personnel_registry','set_exit_date'
])) {
    require_once __DIR__ . '/backend/modules/conges.php';

} elseif (in_array($action, [
    'create_message_group','get_message_groups','send_group_message','get_group_messages',
    'post_status','get_statuses','upload_file','update_group_info','update_group_photo',
    'add_group_member','remove_group_member','change_member_role','leave_group',
    'start_call','check_incoming_call','accept_call','reject_call','end_call',
    'check_call_status','view_status','get_status_views'
])) {
    require_once __DIR__ . '/backend/modules/chat_groups.php';

} elseif (in_array($action, [
    'get_personnel_tracking','get_agent_dossier','add_sanction','add_long_absence',
    'add_mutation','get_agent_full_history'
])) {
    require __DIR__ . '/suivi_personnel_api.php';

} else {
    echo json_encode(['error' => 'Action inconnue: ' . htmlspecialchars($action)]);
}
