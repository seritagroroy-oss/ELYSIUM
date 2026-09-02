<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $db = new PDO($dsn, "root", "");
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    echo "<pre>";
    $stmt = $db->query("SELECT company_id FROM users WHERE name LIKE '%KOFFI%' LIMIT 1");
    $company_id = $stmt->fetchColumn();
    
    echo "Company ID: $company_id\n\n";

    $stmt = $db->prepare("SELECT data_key, data_value FROM service_data WHERE service_id = ? AND data_key IN ('published_periods', 'latest_publication')");
    $stmt->execute([$company_id]);
    print_r($stmt->fetchAll());
    
    echo "</pre>";
} catch (Exception $e) {
    echo $e->getMessage();
}
