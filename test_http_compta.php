<?php
$data = ['email' => 'comptabilite-securitex@gmail.com', 'password' => 'passer'];
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];
$context = stream_context_create($opts);
$response = file_get_contents('http://localhost:8000/api.php?action=login', false, $context);
$cookieStr = '';
if (isset($http_response_header)) {
    foreach ($http_response_header as $hdr) {
        if (preg_match('/^Set-Cookie:\s*([^;]+)/i', $hdr, $matches)) {
            $cookieStr .= $matches[1] . '; ';
        }
    }
}

$opts2 = [
    'http' => [
        'method' => 'GET',
        'header' => "Cookie: $cookieStr\r\n",
        'ignore_errors' => true
    ]
];
$context2 = stream_context_create($opts2);
$response2 = file_get_contents('http://localhost:8000/api.php?action=get_salaries&scope=company&period=2026-07', false, $context2);
$decoded = json_decode($response2, true);

echo "LOGIN: " . substr($response, 0, 100) . "\n";
echo "SALARIES:\n";
if (is_array($decoded)) {
    if (isset($decoded['success']) && $decoded['success'] === false) {
        echo "ERROR: " . $decoded['message'] . "\n";
    } else {
        echo "Found " . count($decoded) . " agents.\n";
        if (count($decoded) > 0) print_r($decoded[0]);
    }
} else {
    echo "Raw Output:\n" . substr($response2, 0, 1000) . "\n";
}
