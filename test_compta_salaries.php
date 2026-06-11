<?php
require 'backend/database.php';
$sqlite = getDb();


$stmt = $sqlite->prepare("SELECT * FROM users WHERE email = 'comptabilite-securitex@gmail.com'");
$stmt->execute();
$user = $stmt->fetch();

$_SESSION = [
    'user_id' => $user['email'],
    'user_role' => $user['role'],
    'service_id' => $user['service_id'],
    'company_id' => $user['company_id']
];

$_GET = ['action' => 'get_salaries', 'scope' => 'company', 'period' => '2026-07'];
$_SERVER['REQUEST_METHOD'] = 'GET';
$data = [];

if (!function_exists('session_start_mock')) {
    function session_start_mock() { return true; }
}

$apiCode = file_get_contents('api.php');
$apiCode = preg_replace('/session_start\(\);/', '/* bypassed session_start */', $apiCode, 1);

ob_start();
eval('?>' . $apiCode);
$out = ob_get_clean();

$decoded = json_decode($out, true);
if (is_array($decoded)) {
    if (isset($decoded['success']) && $decoded['success'] === false) {
        echo "API returned ERROR: " . $decoded['message'] . "\n";
    } else if (isset($decoded[0]) || empty($decoded)) {
        echo "API returned ARRAY of " . count($decoded) . " agents.\n";
    } else {
        echo "API returned UNKNOWN OBJECT:\n";
        print_r($decoded);
    }
} else {
    echo "JSON Decode failed! Raw output:\n";
    echo substr($out, 0, 1000);
}
