<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "=== CONNECTED TO MySQL:elysium ===\n\n";
    
    echo "--- TABLES ---\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) echo "  $t\n";
    
    echo "\n--- service_data: PUBLISHED PERIODS & RELATED ---\n";
    $stmt = $pdo->query("SELECT * FROM service_data WHERE data_key LIKE '%published%' OR data_key LIKE '%period%' OR data_key LIKE '%max_init%' OR data_key LIKE '%latest_pub%'");
    while ($row = $stmt->fetch()) {
        $val = $row['data_value'];
        $decoded = json_decode($val, true);
        if (json_last_error() === JSON_ERROR_NONE) $val = json_encode($decoded);
        echo "  ServiceID: {$row['service_id']} | Key: {$row['data_key']} | Value: {$val}\n";
    }
    
    echo "\n--- archives: PAYROLL ENTRIES ---\n";
    $stmt2 = $pdo->query("SELECT id, service_id, company_id, period FROM archives WHERE id LIKE 'payroll_%'");
    while ($row = $stmt2->fetch()) {
        echo "  ID: {$row['id']} | Service: {$row['service_id']} | Company: {$row['company_id']} | Period: {$row['period']}\n";
    }
    
    echo "\n--- ALL service_data KEYS (distinct) ---\n";
    $stmt3 = $pdo->query("SELECT DISTINCT data_key FROM service_data ORDER BY data_key");
    while ($row = $stmt3->fetch()) {
        echo "  " . $row['data_key'] . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
