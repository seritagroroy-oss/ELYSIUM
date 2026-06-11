<?php
// Test login endpoint
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_CONTENT_TYPE'] = 'application/json';

$payload = ['email' => 'admin@gmail.com', 'password' => 'admin123'];

$ch = curl_init('http://localhost:8000/api.php?action=login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIE, '');
$res = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

echo "=== LOGIN TEST ===\n";
if ($err) echo "cURL error: $err\n";
else echo $res . "\n";

// Now test register
$reg_payload = [
    'service_name' => 'Test Service Debug',
    'name'         => 'Test User Debug',
    'email'        => 'testdebug' . time() . '@example.com',
    'password'     => 'test123456'
];

$ch2 = curl_init('http://localhost:8000/api.php?action=register');
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($reg_payload));
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
$res2 = curl_exec($ch2);
$err2 = curl_error($ch2);
curl_close($ch2);

echo "\n=== REGISTER TEST ===\n";
if ($err2) echo "cURL error: $err2\n";
else echo $res2 . "\n";
