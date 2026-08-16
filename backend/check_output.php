<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);

// Mock session completely
$_SESSION['user_id'] = 1;

// Override functions.php checkLogin so it returns true
$functions_code = file_get_contents('core/functions.php');
$functions_code = preg_replace('/function checkLogin\(\) \{.*?\}/s', 'function checkLogin() { return true; }', $functions_code);
file_put_contents('core/functions_mock.php', $functions_code);

require 'database.php';
require 'core/functions_mock.php';

$action = 'get_site_data';
$site_id = '1783054813_799';

$_GET = ['action' => 'get_site_data', 'site_id' => $site_id];
ob_start();
include 'modules/sites.php';
$json = ob_get_clean();

$data = json_decode($json, true);
if (isset($data['site']['subsites'])) {
    foreach ($data['site']['subsites'] as $sub) {
        echo "SUBSITE: " . $sub['name'] . "\n";
        echo "AGENTS: " . count($sub['agents'] ?? []) . "\n";
        foreach ($sub['agents'] ?? [] as $ag) {
            echo "  - " . $ag['name'] . "\n";
        }
    }
} else {
    echo "NO DATA: " . $json;
}
unlink('core/functions_mock.php');
