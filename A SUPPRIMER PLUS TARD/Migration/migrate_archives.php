<?php
$dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
$db = new PDO($dsn, 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $db->exec("ALTER TABLE archives_pointage MODIFY COLUMN company_id VARCHAR(100)");
} catch (Exception $e) {
    echo "Alter error: " . $e->getMessage() . "\n";
}

$stmt = $db->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$inserted = 0;
foreach ($rows as $row) {
    $company_id = $row['service_id'];
    $periods = json_decode($row['data_value'], true);
    if (!is_array($periods)) continue;
    
    foreach ($periods as $period) {
        $stmtCheck = $db->prepare("SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?");
        $stmtCheck->execute([$company_id, $period]);
        if (!$stmtCheck->fetch()) {
            $stmtInsert = $db->prepare("INSERT INTO archives_pointage (company_id, period, archived_date, archived_by, data) VALUES (?, ?, ?, ?, ?)");
            $now = date('Y-m-d H:i:s');
            $stmtInsert->execute([$company_id, $period, $now, 'Migration (Legacy)', '{}']);
            $inserted++;
        }
    }
}
echo "Migrated $inserted periods to archives_pointage.\n";
