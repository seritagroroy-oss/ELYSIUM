<?php
header('Content-Type: text/plain');
$lines = file('frontend/src/components/Dashboard.jsx');
foreach($lines as $i => $line) {
    if (stripos($line, 'EXTRAS') !== false || stripos($line, 'zone') !== false || stripos($line, 'Gérer les Postes') !== false) {
        echo ($i+1) . ": " . trim($line) . "\n";
    }
}
?>
