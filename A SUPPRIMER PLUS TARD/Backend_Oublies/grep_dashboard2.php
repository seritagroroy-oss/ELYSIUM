<?php
$file = __DIR__ . '/../frontend/src/components/Dashboard.jsx';
$lines = file($file);
foreach ($lines as $i => $line) {
    if (stripos($line, 'site_destination_id') !== false) {
        echo ($i + 1) . ': ' . trim($line) . "\n";
    }
}
