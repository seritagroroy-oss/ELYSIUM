<?php
$db = new SQLite3('backend/elysium.db');
$db->busyTimeout(5000);
$stmt = $db->prepare("SELECT * FROM users WHERE email = 'comptabilite-securitex@gmail.com'");
$res = $stmt->execute();
$user = $res->fetchArray(SQLITE3_ASSOC);

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
$apiCode = str_replace('session_start();', '/* bypassed session_start */', $apiCode);

ob_start();
eval('?>' . $apiCode);
$out = ob_get_clean();

echo "OUTPUT START:\n";
echo substr($out, 0, 1000);
echo "\nOUTPUT END\n";
