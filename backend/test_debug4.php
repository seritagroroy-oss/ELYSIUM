<?php
require __DIR__ . '/database.php';
try {
    $sqlite = getDb();
    
    // Check salary_grid
    $company_id = 'comp_default_1';
    $stmt = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check agents
    $stmt2 = $sqlite->prepare("SELECT id, name, `function` FROM agents WHERE name IN ('alice', 'BEBE')");
    $stmt2->execute();
    $agents = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    // Check service_data functions
    $company_key = 'company::' . $company_id;
    $stmt3 = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = 'functions'");
    $stmt3->execute([$company_key]);
    $funcs = $stmt3->fetchColumn();
    
    echo json_encode(['grid' => $res, 'agents' => $agents, 'funcs' => substr((string)$funcs, 0, 500)]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
