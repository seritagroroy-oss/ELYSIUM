<?php
header('Content-Type: application/json');
try {
    $pdo = new PDO('sqlite:database.sqlite');
    $stmt = $pdo->query("SELECT * FROM service_data WHERE data_key IN ('salary_config', 'functions')");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt2 = $pdo->query("SELECT * FROM salary_grid");
    $res2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['service_data' => $res, 'salary_grid' => $res2]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
