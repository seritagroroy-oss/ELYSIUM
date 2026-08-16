<?php
$_GET['action'] = 'login_agent_portal';
$action = 'login_agent_portal';
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'admin';
$_SESSION['company_id'] = 'comp_bb90668e';
$_SESSION['subscription_valid'] = true;

if (!function_exists('getUserSubscriptionState')) {
    function getUserSubscriptionState($user_id) {
        return ['access_allowed' => true, 'plan' => 'premium', 'is_expired' => false];
    }
}

require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$period = '2028-01';
$target_col = 'company_id';
$target_val = 'comp_bb90668e';
$serviceKey = 'svc_45a046d6';

try {
    $salaries = generateSalariesData($sqlite, $period, $target_val, $target_col, $target_val, $serviceKey);
    file_put_contents('salaries_out.json', json_encode($salaries, JSON_PRETTY_PRINT));
    echo count($salaries) . " agents generated";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine();
}
?>
