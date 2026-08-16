<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);

$functions_code = file_get_contents('core/functions.php');
$functions_code = preg_replace('/function checkLogin\(\) \{.*?\}/s', 'function checkLogin() { return true; }', $functions_code);
$functions_code = preg_replace('/function checkCompanySubscription\(\$company_id\) \{.*?\}/s', 'function checkCompanySubscription($company_id) { return ["status" => "active"]; }', $functions_code);
$functions_code .= "\nfunction getUserSubscriptionState() { return ['access_allowed' => true]; }\n";
file_put_contents('core/functions_mock.php', $functions_code);

$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = '1781297597_797';
$_SESSION['user_role'] = 'admin';

require 'database.php';
require 'core/functions_mock.php';

$_GET = ['action' => 'get_salaries', 'period' => '2028-01', 'scope' => 'company'];
$action = 'get_salaries';
ob_start();
include 'modules/salaries.php';
$json = ob_get_clean();

$data = json_decode($json, true);
if ($data === null) {
    echo "ERROR PARSING JSON: \n" . substr($json, 0, 500);
} else {
    echo "SUCCESS: " . count($data['salaries']) . " salaries found.\n";
    foreach ($data['salaries'] as $s) {
        if (strtolower($s['name']) === 'alice') {
            echo "ALICE: days_worked = " . $s['days_worked'] . ", base = " . $s['base'] . "\n";
            echo "is_lightweight = " . ($s['is_lightweight'] ?? 'false') . "\n";
        }
    }
}
unlink('core/functions_mock.php');
