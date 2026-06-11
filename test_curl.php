<?php
$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query([
            'data' => json_encode(['action' => 'rename_site', 'site_id' => 'site1', 'name' => 'New Name'])
        ])
    ]
];
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api.php', false, $context);
echo "REPONSE:\n" . $result;
