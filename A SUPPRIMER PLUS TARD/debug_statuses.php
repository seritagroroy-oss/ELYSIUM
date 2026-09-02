<?php
session_start();
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

header('Content-Type: application/json');

$companyId = resolveCurrentCompanyIdSql();
$period = '2035-11'; // Hardcodé pour le test

$db = getDb();
$res = [];
$res['session'] = $_SESSION;
$res['companyId'] = $companyId;

try {
    $stmt = $db->prepare("SELECT * FROM payroll_statuses WHERE company_id = ? AND period = ?");
    $stmt->execute([$companyId, $period]);
    $rows = $stmt->fetchAll();
    $res['rows_from_db'] = $rows;
    
    $statusMap = [];
    foreach ($rows as $row) {
        $key = $row['period'] . '_' . $row['site_id'] . '_' . $row['zone_name'] . '_' . $row['agent_name'];
        $statusMap[$key] = $row['status'];
    }
    
    // Simulate empty array behavior
    $emptyMap = [];
    $res['encoded_empty'] = json_encode(['statuses' => $emptyMap]);
    $res['encoded_filled'] = json_encode(['statuses' => $statusMap]);

} catch (Exception $e) {
    $res['error'] = $e->getMessage();
}

echo json_encode($res, JSON_PRETTY_PRINT);
