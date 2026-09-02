<?php
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
try {
    $stmt = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE company_id = 'comp_a8b50b7e'");
    $stmt->execute();
    $count = $stmt->fetchColumn();
    echo "agents count for comp_a8b50b7e: $count\n";

    $stmt = $sqlite->prepare("SELECT COUNT(*) FROM agents");
    $stmt->execute();
    $countAll = $stmt->fetchColumn();
    echo "total agents in db: $countAll\n";

    $stmt = $sqlite->prepare("SELECT * FROM agents LIMIT 5");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "agents sample:\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
