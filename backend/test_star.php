<?php
$output = shell_exec('git log -p backend/modules/pointage.php');
if (strpos($output, '🌟') !== false) {
    echo "STAR FOUND IN GIT LOG\n";
    // extract surrounding lines
    $lines = explode("\n", $output);
    foreach ($lines as $i => $line) {
        if (strpos($line, '🌟') !== false) {
            echo "Line: " . $line . "\n";
        }
    }
} else {
    echo "NO STAR FOUND IN GIT LOG\n";
}
