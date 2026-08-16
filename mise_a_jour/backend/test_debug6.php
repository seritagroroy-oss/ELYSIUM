<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // Check agents
    $stmt2 = $sqlite->prepare("SELECT id, name, `function` FROM agents WHERE name IN ('alice', 'BEBE')");
    $stmt2->execute();
    $agents = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['agents' => $agents]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
