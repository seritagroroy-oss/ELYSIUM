<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'service_name' => 'New Service X',
            'email' => 'newadmin' . time() . '@gmail.com',
            'name' => 'New Admin',
            'password' => 'admin123'
        ]),
        'ignore_errors' => true
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api.php?action=register', false, $context);
echo $result;
