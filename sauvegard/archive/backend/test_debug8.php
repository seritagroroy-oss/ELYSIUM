<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // Test the exact query
    $stmt = $sqlite->prepare("SELECT * FROM salary_grid WHERE poste = 'RAF'");
    $stmt->execute();
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['res' => $res]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
