<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $db = new PDO($dsn, "root", "");
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Trouver le company_id pour pcsecuritex@gmail.com ou KOFFI
    $stmt = $db->query("SELECT company_id FROM users WHERE name LIKE '%KOFFI%' LIMIT 1");
    $company_id = $stmt->fetchColumn();
    
    echo "company_id: $company_id\n";
    
    $stmt = $db->prepare("SELECT data_key, data_value FROM service_data WHERE service_id = ? AND data_key IN ('published_periods', 'latest_publication')");
    $stmt->execute([$company_id]);
    
    $results = [];
    foreach($stmt->fetchAll() as $row) {
        $results[$row['data_key']] = json_decode($row['data_value'], true);
    }
    
    echo "published_periods:\n";
    print_r($results['published_periods'] ?? []);
    
    echo "\nlatest_publication:\n";
    print_r($results['latest_publication'] ?? null);

} catch (Exception $e) {
    echo $e->getMessage();
}
