<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM payroll_statuses WHERE agent_name LIKE '%KEKELY%' OR agent_name LIKE '%DJAHOUE%'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($rows as $r) {
    echo "Found in payroll_statuses: {$r['agent_name']} - {$r['company_id']} - {$r['period']} - {$r['site_id']} - {$r['zone_name']}\n";
}
