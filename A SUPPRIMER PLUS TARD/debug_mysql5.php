<?php
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
try {
    $stmt = $sqlite->prepare("SELECT * FROM agents WHERE company_id = 'comp_a8b50b7e'");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "agents for comp_a8b50b7e:\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
