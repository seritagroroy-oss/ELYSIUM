<?php
$file = __DIR__ . '/../frontend/src/components/Dashboard.jsx';
$lines = file($file);
foreach ($lines as $i => $line) {
    if (stripos($line, 'Suppl_Dest') !== false || stripos($line, 'Suppl|') !== false) {
        echo ($i + 1) . ': ' . trim($line) . "\n";
    }
}
