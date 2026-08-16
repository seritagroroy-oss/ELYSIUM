<?php
try {
    $dbPath = __DIR__ . '/backend/elysium.db';
    if (!file_exists($dbPath)) {
        echo "NOT FOUND: " . $dbPath . "\n";
    } else {
        echo "FOUND: " . $dbPath . " (" . filesize($dbPath) . " bytes)\n";
    }
    
    // Also check for other possible db locations
    $paths = [
        __DIR__ . '/elysium.db',
        __DIR__ . '/backend/database/elysium.db',
        __DIR__ . '/database/elysium.db',
        __DIR__ . '/pontage.db',
    ];
    foreach ($paths as $p) {
        echo (file_exists($p) ? "EXISTS" : "MISSING") . ": $p\n";
    }
    
    // List backend folder
    echo "\n--- Files in /backend ---\n";
    $dir = __DIR__ . '/backend';
    if (is_dir($dir)) {
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            echo $f . "\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
