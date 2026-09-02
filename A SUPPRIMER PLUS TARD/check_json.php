<?php
$serviceKey = 'comp_cf66d02f'; // or whatever the serviceKey is. Wait, the file is usually svc_something or comp_something.
$files = glob("C:/laragon/www/pontage/backend/database/*.json");
foreach ($files as $f) {
    if (strpos($f, 'schema') !== false) continue;
    $content = file_get_contents($f);
    if (strpos($content, 'KEKELY') !== false || strpos($content, 'DJAHOUE') !== false) {
        echo "Found in file: " . basename($f) . "\n";
    }
}
