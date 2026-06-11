<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db = new SQLite3('backend/elysium.db');
$db->busyTimeout(5000);
$stmt = $db->prepare("SELECT * FROM users WHERE email = 'comptabilite-securitex@gmail.com'");
$res = $stmt->execute();
$user = $res->fetchArray(SQLITE3_ASSOC);

// MOCK session manually to avoid headers already sent errors
$_SESSION = [
    'user_id' => $user['email'],
    'user_role' => $user['role'],
    'service_id' => $user['service_id'],
    'company_id' => $user['company_id'],
];

$_GET['action'] = 'get_salaries';
$_GET['scope'] = 'company';
$_GET['period'] = '2026-07';

ob_start();
// simulate missing data POST
$data = [];
$sqlite = $db; // reuse connection if needed
require 'api.php';
$out = ob_get_clean();

echo "OUTPUT:\n" . substr($out, 0, 1000) . "\n...";
