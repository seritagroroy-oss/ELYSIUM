<?php
require 'backend/database.php';

$sqlite = getDb();
$rows = $sqlite->query("SELECT * FROM service_data WHERE data_key = 'published_periods'");

$migrated = 0;
foreach ($rows as $row) {
    if (str_starts_with($row['service_id'], 'comp_')) continue; // Already a company_id

    // Find the company for this service
    $stmtSvc = $sqlite->prepare("SELECT company_id FROM services WHERE id = ?");
    $stmtSvc->execute([$row['service_id']]);
    $svc = $stmtSvc->fetch();

    if ($svc && $svc['company_id']) {
        $compId = $svc['company_id'];
        
        // Copy to company level
        $stmtCheck = $sqlite->prepare("SELECT 1 FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
        $stmtCheck->execute([$compId]);
        if (!$stmtCheck->fetch()) {
            $stmtInsert = $sqlite->prepare("INSERT INTO service_data (service_id, data_key, data_value) VALUES (?, ?, ?)");
            $stmtInsert->execute([$compId, 'published_periods', $row['data_value']]);
            $migrated++;
        }
    }
}
echo "Migration terminée. $migrated pointage(s) copié(s) au niveau de l'entreprise.\n";
