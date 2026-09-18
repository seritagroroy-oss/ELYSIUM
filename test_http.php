<?php
$ch = curl_init('http://127.0.0.1:8000/api_new.php?action=login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'comptara@gmail.com', 'password' => 'password', 'rememberMe' => false]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookie.txt');
$response = curl_exec($ch);
curl_close($ch);
echo "LOGIN: " . $response . "\n";

$ch = curl_init('http://127.0.0.1:8000/api_new.php?action=get_dashboard_init&period=2058-07');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookie.txt');
$response = curl_exec($ch);
curl_close($ch);
echo "DASHBOARD INIT: " . substr($response, 0, 500) . "\n";
