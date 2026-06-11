<?php
require 'backend/database.php';
$sqlite = getDb();
$sqlite->busyTimeout(5000);
$stmt = $sqlite->prepare("SELECT * FROM users WHERE email = 'comptabilite-securitex@gmail.com'");
$stmt->execute([]);
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
// Replace session_start() ONLY if it is at the beginning
$apiCode = preg_replace('/session_start\(\);/', '/* bypassed session_start */', $apiCode, 1);

ob_start();
eval('?>' . $apiCode);
$out = ob_get_clean();

echo "JSON PARSE:\n";
$decoded = json_decode($out, true);
if (is_array($decoded)) {
    echo "Success: " . ($decoded['success'] ? 'true' : 'false') . "\n";
    if (isset($decoded['salaries'])) {
        echo "Salaries count: " . count($decoded['salaries']) . "\n";
    }
    if (isset($decoded['message'])) {
        echo "Message: " . $decoded['message'] . "\n";
    }
} else {
    echo "FAILED TO PARSE JSON:\n";
    echo substr($out, 0, 1000);
}
