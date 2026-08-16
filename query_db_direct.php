<?php
try {
    $dbPath = __DIR__ . '/backend/elysium.db';
    if (!file_exists($dbPath)) {
        die("SQLite file not found at: " . $dbPath);
    }
    
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "--- SERVICE_DATA ROWS ---\n";
    $stmt = $pdo->query("SELECT * FROM service_data");
    while ($row = $stmt->fetch()) {
        $val = $row['data_value'];
        $decoded = json_decode($val, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $val = print_r($decoded, true);
        }
        echo "Service ID: {$row['service_id']} | Key: {$row['data_key']} | Value: {$val}\n";
    }
    
    echo "\n--- ARCHIVES ROWS ---\n";
    $stmt2 = $pdo->query("SELECT id, service_id, company_id, period FROM archives");
    while ($row = $stmt2->fetch()) {
        echo "ID: {$row['id']} | Service: {$row['service_id']} | Company: {$row['company_id']} | Period: {$row['period']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
