<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // Check rows for RAF
    $stmt2 = $sqlite->query("SELECT * FROM salary_grid WHERE poste = 'RAF'");
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['rows' => $rows]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
