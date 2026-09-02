<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);

$functions_code = file_get_contents('core/functions.php');
$functions_code = preg_replace('/function checkLogin\(\) \{.*?\}/s', 'function checkLogin() { return true; }', $functions_code);
$functions_code = preg_replace('/function checkCompanySubscription\(\$company_id\) \{.*?\}/s', 'function checkCompanySubscription($company_id) { return ["status" => "active"]; }', $functions_code);
$functions_code = preg_replace('/function getUserSubscriptionState\(\) \{.*?\}/s', 'function getUserSubscriptionState() { return "active"; }', $functions_code);
if (strpos($functions_code, 'function getUserSubscriptionState') === false) {
    $functions_code .= "\nfunction getUserSubscriptionState() { return 'active'; }\n";
}
file_put_contents('core/functions_mock.php', $functions_code);

$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_1783032514'; // FFF's company id

require 'database.php';
require 'core/functions_mock.php';

$_GET = ['action' => 'get_site_data', 'site_id' => '1783054813_799'];
ob_start();
include 'modules/sites.php';
$json = ob_get_clean();

$data = json_decode($json, true);
if (isset($data['site_data'])) {
    foreach ($data['site_data'] as $sub) {
        echo "SUBSITE: " . $sub['name'] . "\n";
        echo "AGENTS: " . count($sub['agents'] ?? []) . "\n";
        foreach ($sub['agents'] ?? [] as $ag) {
            if (strpos($ag['name'], 'FFF') !== false) {
                echo "  - " . $ag['name'] . " (target_subs: " . implode(',', $ag['target_subsites'] ?? []) . ")\n";
            }
        }
    }
} else {
    echo "NO DATA: " . $json;
}
unlink('core/functions_mock.php');
