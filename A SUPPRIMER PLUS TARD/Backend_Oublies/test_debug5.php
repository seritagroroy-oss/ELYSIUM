<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // Check salary_grid
    $stmt = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid");
    $stmt->execute();
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['grid' => $res]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
