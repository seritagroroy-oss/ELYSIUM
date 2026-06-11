<?php
$data = ['email' => 'comptabilite-securitex@gmail.com', 'password' => 'passer'];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api.php?action=login', false, $context);

$cookies = [];
foreach ($http_response_header as $hdr) {
    if (preg_match('/^Set-Cookie:\s*([^;]+)/', $hdr, $matches)) {
        parse_str($matches[1], $cookie);
        $cookies = array_merge($cookies, $cookie);
    }
}
$cookie_str = '';
foreach ($cookies as $k => $v) { $cookie_str .= "$k=$v; "; }

$options2 = [
    'http' => [
        'header'  => "Cookie: $cookie_str\r\n",
        'method'  => 'GET'
    ],
];
$context2 = stream_context_create($options2);
$body = file_get_contents('http://localhost:8000/api.php?action=get_salaries&scope=company&period=2026-07', false, $context2);

$decoded = json_decode($body, true);
if (is_array($decoded)) {
    echo "Found " . count($decoded) . " salaries.\n";
    if (count($decoded) > 0) {
        print_r($decoded[0]);
    }
} else {
    echo "JSON Decode failed! Output:\n";
    echo substr($body, 0, 500);
}
