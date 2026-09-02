<?php
$url = 'http://localhost/pontage/api_new.php'; // or api_new_admin.php?
$data = ['action' => 'login', 'email' => 'pcsecuritex@gmail.com', 'password' => 'pentagone0172494913'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
$response = curl_exec($ch);
curl_close($ch);

echo "Response from api_new.php:\n";
echo $response . "\n\n";

$url2 = 'http://localhost/pontage/api_new_admin.php';
$ch2 = curl_init($url2);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch2, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
$response2 = curl_exec($ch2);
curl_close($ch2);

echo "Response from api_new_admin.php:\n";
echo $response2 . "\n";
