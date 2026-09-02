<?php
try {
    $dbPath = __DIR__ . '/elysium.db';
    $conn = new PDO('sqlite:' . $dbPath);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->query("SELECT name FROM sqlite_master WHERE type='table';");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Tables in elysium.db:\n";
    foreach ($tables as $table) {
        echo "- " . $table['name'] . "\n";
        
        // Show schema of the table
        $stmt2 = $conn->query("PRAGMA table_info(" . $table['name'] . ")");
        $columns = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  - " . $col['name'] . " (" . $col['type'] . ")\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
